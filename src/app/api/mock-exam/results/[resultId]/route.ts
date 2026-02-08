import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ resultId: string }> }
) {
  try {
    const { resultId } = await params

    // Sonuc bilgisini al
    const { data: result, error: resultError } = await supabaseAdmin
      .from('mock_exam_results')
      .select('*')
      .eq('id', resultId)
      .single()

    if (resultError || !result) {
      return NextResponse.json({ error: 'Sonuc bulunamadi' }, { status: 404 })
    }

    // Yetki kontrolu: sadece kendi sonucunu gorebilir
    try {
      const serverClient = await createServerClient()
      const { data: { user } } = await serverClient.auth.getUser()
      // Kayitli kullanici ise ve sonuc baskasina aitse engelle
      // (Guest sonuclari herkese acik)
      if (user && result.user_id && result.user_id !== user.id) {
        // Admin kontrolu
        const { data: profile } = await supabaseAdmin
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()
        if (profile?.role !== 'admin') {
          return NextResponse.json({ error: 'Bu sonucu goruntuleme yetkiniz yok' }, { status: 403 })
        }
      }
    } catch {
      // Giris yapilmamis, guest sonuclari gosterilir
      if (result.user_id) {
        return NextResponse.json({ error: 'Giris yapmaniz gerekiyor' }, { status: 401 })
      }
    }

    // Sinav bilgisini al
    const { data: exam } = await supabaseAdmin
      .from('mock_exams')
      .select('*')
      .eq('id', result.exam_id)
      .single()

    if (!exam) {
      return NextResponse.json({ error: 'Sinav bulunamadi' }, { status: 404 })
    }

    // Sinav sorularini cevap anahtarlariyla al
    const { data: examQuestions } = await supabaseAdmin
      .from('mock_exam_questions')
      .select('id, question_id, subject, question_order, topic_name')
      .eq('exam_id', result.exam_id)
      .order('question_order', { ascending: true })

    // Soru detaylarini al (simdi correct_answer dahil)
    const questionIds = (examQuestions || []).map(eq => eq.question_id)
    const { data: questions } = await supabaseAdmin
      .from('questions')
      .select('id, question_text, question_image_url, options, correct_answer, explanation')
      .in('id', questionIds)

    const questionMap = new Map(questions?.map(q => [q.id, q]) || [])
    const userAnswers = result.answers || {}

    // Soru listesi (cevap anahtari + kullanici cevabi dahil)
    const questionsWithAnswers = (examQuestions || []).map(eq => {
      const q = questionMap.get(eq.question_id)
      const userAnswer = userAnswers[String(eq.question_order)] || null
      const correctAnswer = q?.correct_answer || 'A'

      return {
        id: eq.id,
        question_id: eq.question_id,
        question_order: eq.question_order,
        subject: eq.subject,
        topic_name: eq.topic_name,
        question_text: q?.question_text || '',
        question_image_url: q?.question_image_url || null,
        options: q?.options || { A: '', B: '', C: '', D: '' },
        correct_answer: correctAnswer,
        user_answer: userAnswer,
        is_correct: userAnswer === correctAnswer,
        explanation: q?.explanation || null,
      }
    })

    // Guncel siralama
    const { data: allResults, count } = await supabaseAdmin
      .from('mock_exam_results')
      .select('score', { count: 'exact' })
      .eq('exam_id', result.exam_id)
      .gte('score', result.score)

    const totalAttempts = count || 0
    const { data: totalCount } = await supabaseAdmin
      .from('mock_exam_results')
      .select('id', { count: 'exact' })
      .eq('exam_id', result.exam_id)

    const total = (totalCount as any)?.length || totalAttempts
    const currentRank = allResults?.length || 1

    return NextResponse.json({
      result: {
        ...result,
        score: Number(result.score),
        total_net: Number(result.total_net),
      },
      exam,
      questions: questionsWithAnswers,
      ranking: {
        rank: currentRank,
        percentile: total > 0 ? Math.round(((total - currentRank) / total) * 100 * 100) / 100 : 100,
        totalAttempts: total,
      },
    })
  } catch (error: any) {
    console.error('Mock exam result detail error:', error)
    return NextResponse.json({ error: 'Sonuc yuklenemedi' }, { status: 500 })
  }
}
