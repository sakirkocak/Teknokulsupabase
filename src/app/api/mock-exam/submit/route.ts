import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { typesenseClient, isTypesenseAvailable, COLLECTIONS } from '@/lib/typesense/client'
import { calculateScore, calculateRankAndPercentile } from '@/lib/mock-exam/scoring'
import type { AnswerOption } from '@/lib/mock-exam/types'

// Service role client
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Rate limit: 1 submit per exam per user (in-memory)
const submitLocks = new Map<string, number>()

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { examId, answers, timeTaken, tabSwitchCount, studentName } = body

    if (!examId || !answers) {
      return NextResponse.json({ error: 'examId ve answers gerekli' }, { status: 400 })
    }

    // Kullanici kimligini al
    let userId: string | null = null
    let userName = studentName || 'Misafir'
    let userGrade: number | null = null

    try {
      const serverClient = await createServerClient()
      const { data: { user } } = await serverClient.auth.getUser()
      if (user) {
        userId = user.id

        // Profil bilgisini al
        const { data: profile } = await supabaseAdmin
          .from('profiles')
          .select('full_name')
          .eq('id', user.id)
          .single()
        if (profile) userName = profile.full_name

        // Grade bilgisini al
        const { data: studentProfile } = await supabaseAdmin
          .from('student_profiles')
          .select('grade')
          .eq('user_id', user.id)
          .single()
        if (studentProfile) userGrade = studentProfile.grade
      }
    } catch {
      // Giris yapilmamis
    }

    // Rate limit kontrolu
    const lockKey = `${examId}_${userId || 'guest'}`
    const lastSubmit = submitLocks.get(lockKey)
    if (lastSubmit && Date.now() - lastSubmit < 60000) { // 1 dakika
      return NextResponse.json({ error: 'Lutfen biraz bekleyin' }, { status: 429 })
    }
    submitLocks.set(lockKey, Date.now())

    // Sinav bilgisini al
    const { data: exam, error: examError } = await supabaseAdmin
      .from('mock_exams')
      .select('*')
      .eq('id', examId)
      .single()

    if (examError || !exam) {
      return NextResponse.json({ error: 'Sinav bulunamadi' }, { status: 404 })
    }

    // Sure kontrolu (sure + 30sn buffer)
    const maxTime = (exam.duration * 60) + 30
    if (timeTaken > maxTime) {
      return NextResponse.json({ error: 'Sure asimi tespit edildi' }, { status: 400 })
    }

    // Sinav sorularini cevap anahtarlariyla al
    const { data: examQuestions } = await supabaseAdmin
      .from('mock_exam_questions')
      .select(`
        id, exam_id, question_id, subject, question_order, topic_name
      `)
      .eq('exam_id', examId)
      .order('question_order', { ascending: true })

    if (!examQuestions || examQuestions.length === 0) {
      return NextResponse.json({ error: 'Sinav sorulari bulunamadi' }, { status: 404 })
    }

    // Dogru cevaplari al (server-side only!)
    const questionIds = examQuestions.map(eq => eq.question_id)
    const { data: questionsWithAnswers } = await supabaseAdmin
      .from('questions')
      .select('id, correct_answer')
      .in('id', questionIds)

    const answerMap = new Map(questionsWithAnswers?.map(q => [q.id, q.correct_answer]) || [])

    // Puanlama icin sorulari hazirla
    const questionsForScoring = examQuestions.map(eq => ({
      question_order: eq.question_order,
      subject: eq.subject,
      correct_answer: answerMap.get(eq.question_id) as AnswerOption,
    }))

    // Puanlama kuralini al
    const { data: scoringRule } = await supabaseAdmin
      .from('exam_scoring_rules')
      .select('*')
      .eq('exam_type', exam.exam_type)
      .eq('year', new Date().getFullYear())
      .single()

    // Puanlama yap
    const scoringResult = calculateScore({
      questions: questionsForScoring,
      answers,
      examType: exam.exam_type,
      scoringRule,
    })

    // Mevcut sonuclari al (siralama icin)
    const { data: existingResults } = await supabaseAdmin
      .from('mock_exam_results')
      .select('score')
      .eq('exam_id', examId)
      .order('score', { ascending: false })

    const existingScores = (existingResults || []).map(r => Number(r.score))
    const { rank, percentile } = calculateRankAndPercentile(scoringResult.score, existingScores)

    // Sonucu kaydet
    const guestId = !userId ? `guest_${Date.now()}_${Math.random().toString(36).slice(2)}` : null

    const { data: result, error: resultError } = await supabaseAdmin
      .from('mock_exam_results')
      .insert({
        exam_id: examId,
        user_id: userId,
        guest_id: guestId,
        student_name: userName,
        score: scoringResult.score,
        total_net: scoringResult.totalNet,
        time_taken: timeTaken,
        answers,
        net_breakdown: scoringResult.netBreakdown,
        rank,
        percentile,
      })
      .select('id')
      .single()

    if (resultError) {
      console.error('Result save error:', resultError)
      return NextResponse.json({ error: 'Sonuc kaydedilemedi' }, { status: 500 })
    }

    // Sinav istatistiklerini guncelle
    const totalAttempts = (exam.total_attempts || 0) + 1
    const currentAvg = Number(exam.average_score) || 0
    const newAverage = ((currentAvg * (totalAttempts - 1)) + scoringResult.score) / totalAttempts

    await supabaseAdmin
      .from('mock_exams')
      .update({
        total_attempts: totalAttempts,
        average_score: Math.round(newAverage * 100) / 100,
      })
      .eq('id', examId)

    // Typesense sync (sonuc)
    if (isTypesenseAvailable() && userId) {
      try {
        const breakdown = scoringResult.netBreakdown
        await typesenseClient
          .collections(COLLECTIONS.MOCK_EXAM_RESULTS)
          .documents()
          .upsert({
            id: result.id,
            result_id: result.id,
            exam_id: examId,
            exam_title: exam.title,
            user_id: userId,
            student_name: userName,
            score: scoringResult.score,
            total_net: scoringResult.totalNet,
            time_taken: timeTaken,
            grade: userGrade || exam.grade,
            exam_type: exam.exam_type,
            rank,
            percentile,
            turkce_net: breakdown['turkce']?.net || 0,
            matematik_net: breakdown['matematik']?.net || 0,
            fen_net: breakdown['fen_bilimleri']?.net || 0,
            sosyal_net: breakdown['sosyal_bilgiler']?.net || 0,
            completed_at: Math.floor(Date.now() / 1000),
          })
      } catch (e) {
        console.error('Typesense result sync error:', e)
      }

      // Typesense sinav istatistik sync
      try {
        await typesenseClient
          .collections(COLLECTIONS.MOCK_EXAMS)
          .documents(examId)
          .update({
            total_attempts: totalAttempts,
            average_score: Math.round(newAverage * 100) / 100,
          } as any)
      } catch (e) {
        console.error('Typesense exam sync error:', e)
      }
    }

    // XP odul (kayitli kullanicilar icin)
    let xpEarned = 0
    if (userId) {
      xpEarned = 50 // Sinav tamamlama

      // %80 uzeri bonus
      const maxScore = 500
      if (scoringResult.score >= maxScore * 0.8) {
        xpEarned += 25
      }

      // Tam net bir ders bonusu
      for (const detail of Object.values(scoringResult.netBreakdown)) {
        if (detail.yanlis === 0 && detail.bos === 0 && detail.dogru > 0) {
          xpEarned += 20
          break // Sadece 1 kez
        }
      }

      // XP ekle (student_points tablosuna)
      try {
        await supabaseAdmin.rpc('increment_points', {
          p_student_id: userId,
          p_points: xpEarned,
        })
      } catch {
        // RPC yoksa manuel ekle
        const { data: points } = await supabaseAdmin
          .from('student_points')
          .select('total_points')
          .eq('student_id', userId)
          .single()

        if (points) {
          await supabaseAdmin
            .from('student_points')
            .update({ total_points: (points.total_points || 0) + xpEarned })
            .eq('student_id', userId)
        }
      }
    }

    return NextResponse.json({
      resultId: result.id,
      score: scoringResult.score,
      totalNet: scoringResult.totalNet,
      netBreakdown: scoringResult.netBreakdown,
      rank,
      percentile,
      totalAttempts,
      xpEarned,
    })
  } catch (error: any) {
    console.error('Mock exam submit error:', error)
    return NextResponse.json({ error: 'Sinav gonderilemedi' }, { status: 500 })
  }
}
