import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateAnalysisSummary } from '@/lib/ai-coach/gemini'
import { StudentContext, getMotivationalMessages, getSubjectName } from '@/lib/ai-coach/prompts'
import { getCurrentNotification } from '@/lib/ai-coach/notifications'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Auth kontrolü
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Öğrenci profili al
    const { data: studentProfile, error: profileError } = await supabase
      .from('student_profiles')
      .select('id, grade, target_exam')
      .eq('user_id', user.id)
      .single()

    if (profileError || !studentProfile) {
      return NextResponse.json({ error: 'Öğrenci profili bulunamadı' }, { status: 404 })
    }

    // Kullanıcı bilgileri
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single()

    // Öğrenci istatistiklerini point_history'den çek (daha güncel)
    const { data: pointHistoryStats } = await supabase
      .from('point_history')
      .select('points, is_correct, subject_code, created_at')
      .eq('student_id', studentProfile.id)
      .eq('source', 'question')

    // Student points tablosundan streak ve XP bilgisi
    const { data: studentPointsData } = await supabase
      .from('student_points')
      .select('current_streak, max_streak, total_points')
      .eq('student_id', studentProfile.id)
      .single()

    // İstatistikleri hesapla
    const allQuestions = pointHistoryStats || []
    const totalQuestions = allQuestions.length
    const totalCorrect = allQuestions.filter(q => q.is_correct === true).length
    const totalWrong = totalQuestions - totalCorrect
    const accuracy = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0
    const totalPoints = allQuestions.reduce((sum, q) => sum + (q.points || 0), 0)

    // Ders bazlı istatistikler
    const subjectStatsRaw: Record<string, { correct: number; wrong: number }> = {}
    allQuestions.forEach(q => {
      const subj = q.subject_code || 'diger'
      if (!subjectStatsRaw[subj]) {
        subjectStatsRaw[subj] = { correct: 0, wrong: 0 }
      }
      if (q.is_correct) {
        subjectStatsRaw[subj].correct++
      } else {
        subjectStatsRaw[subj].wrong++
      }
    })

    const studentStats = {
      total_questions: totalQuestions,
      total_correct: totalCorrect,
      total_wrong: totalWrong,
      accuracy: accuracy,
      current_streak: studentPointsData?.current_streak || 0,
      max_streak: studentPointsData?.max_streak || 0,
      total_points: totalPoints || studentPointsData?.total_points || 0,
      subjects: subjectStatsRaw
    }

    // Haftalık aktivite (son 7 gün)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    
    const weeklyQuestions = allQuestions.filter(q => 
      new Date(q.created_at) >= sevenDaysAgo
    )
    
    const weeklyActivity = {
      total_questions: weeklyQuestions.length,
      correct_count: weeklyQuestions.filter(q => q.is_correct === true).length,
      wrong_count: weeklyQuestions.filter(q => q.is_correct !== true).length,
      by_day: [] as any[]
    }

    // Günlük dağılım
    const dayMap: Record<string, { questions: number; correct: number }> = {}
    weeklyQuestions.forEach(q => {
      const day = new Date(q.created_at).toISOString().split('T')[0]
      if (!dayMap[day]) {
        dayMap[day] = { questions: 0, correct: 0 }
      }
      dayMap[day].questions++
      if (q.is_correct) dayMap[day].correct++
    })
    weeklyActivity.by_day = Object.entries(dayMap).map(([day, data]) => ({
      day,
      questions: data.questions,
      correct: data.correct
    }))

    // AI Coach stats
    const { data: aiStats } = await supabase
      .from('ai_coach_stats')
      .select('*')
      .eq('student_id', studentProfile.id)
      .single()

    // Deneme sonuçlarını çek (exam_results)
    const { data: examResults } = await supabase
      .from('exam_results')
      .select('*')
      .eq('student_id', studentProfile.id)
      .order('exam_date', { ascending: false })
      .limit(10)

    // Deneme istatistiklerini hesapla
    let examStats = {
      totalExams: 0,
      avgNet: 0,
      lastExamDate: null as string | null,
      weakTopicsFromExams: [] as string[],
      strongTopicsFromExams: [] as string[],
      netTrend: 'stable' as 'up' | 'down' | 'stable',
      lastExamAnalysis: null as string | null
    }

    if (examResults && examResults.length > 0) {
      examStats.totalExams = examResults.length
      examStats.avgNet = examResults.reduce((acc, e) => acc + (e.net_score || 0), 0) / examResults.length
      examStats.lastExamDate = examResults[0].exam_date

      // Tüm zayıf ve güçlü konuları topla
      const allWeakTopics = new Set<string>()
      const allStrongTopics = new Set<string>()
      
      examResults.forEach(exam => {
        if (exam.weak_topics) {
          exam.weak_topics.forEach((t: string) => allWeakTopics.add(t))
        }
        if (exam.strong_topics) {
          exam.strong_topics.forEach((t: string) => allStrongTopics.add(t))
        }
      })

      examStats.weakTopicsFromExams = Array.from(allWeakTopics).slice(0, 5)
      examStats.strongTopicsFromExams = Array.from(allStrongTopics).slice(0, 5)

      // Net trendi hesapla (son 2 deneme karşılaştırması)
      if (examResults.length >= 2) {
        const lastNet = examResults[0].net_score || 0
        const prevNet = examResults[1].net_score || 0
        const diff = lastNet - prevNet
        
        if (diff > 2) examStats.netTrend = 'up'
        else if (diff < -2) examStats.netTrend = 'down'
        else examStats.netTrend = 'stable'
      }

      // Son denemenin AI analizi varsa al
      if (examResults[0].ai_analysis?.analysis?.recommendations) {
        const aiRecs = examResults[0].ai_analysis.analysis.recommendations
        if (Array.isArray(aiRecs) && aiRecs.length > 0) {
          examStats.lastExamAnalysis = aiRecs[0]
        }
      }
    }

    // Context oluştur
    const subjects = studentStats.subjects || {}
    const subjectStats: Record<string, { correct: number; wrong: number; accuracy: number; name: string }> = {}
    const weakSubjects: string[] = []
    const strongSubjects: string[] = []

    Object.keys(subjects).forEach(key => {
      const s = subjects[key]
      const total = s.correct + s.wrong
      const subjectAccuracy = total > 0 ? Math.round((s.correct / total) * 100) : 0
      subjectStats[key] = { ...s, accuracy: subjectAccuracy, name: getSubjectName(key) }
      
      if (total >= 5) {
        if (subjectAccuracy < 50) weakSubjects.push(getSubjectName(key))
        else if (subjectAccuracy >= 70) strongSubjects.push(getSubjectName(key))
      }
    })

    // Deneme ve soru bankasından gelen zayıf konuları birleştir
    const combinedWeakSubjects = [...new Set([...weakSubjects, ...examStats.weakTopicsFromExams])]
    const combinedStrongSubjects = [...new Set([...strongSubjects, ...examStats.strongTopicsFromExams])]

    const context: StudentContext = {
      name: profile?.full_name || 'Öğrenci',
      grade: studentProfile.grade || 8,
      targetExam: studentProfile.target_exam || 'LGS',
      totalQuestions: studentStats.total_questions,
      totalCorrect: studentStats.total_correct,
      accuracy: studentStats.accuracy,
      currentStreak: studentStats.current_streak,
      maxStreak: studentStats.max_streak,
      totalPoints: studentStats.total_points,
      weeklyActivity: {
        totalQuestions: weeklyActivity.total_questions,
        correctCount: weeklyActivity.correct_count,
        wrongCount: weeklyActivity.wrong_count
      },
      subjects: subjectStats,
      weakSubjects: combinedWeakSubjects,
      strongSubjects: combinedStrongSubjects,
      // Deneme verileri eklendi
      examStats: {
        totalExams: examStats.totalExams,
        avgNet: examStats.avgNet,
        netTrend: examStats.netTrend
      }
    }

    // AI analiz özeti oluştur
    const analysisSummary = await generateAnalysisSummary({
      ...context,
      weeklyByDay: weeklyActivity?.by_day || []
    })

    // Motivasyon mesajları
    const motivationalMessages = getMotivationalMessages(context)

    // Güncel bildirim
    const notification = getCurrentNotification(context)

    // Günlük aktiviteyi hesapla
    const byDay = weeklyActivity?.by_day || []
    const dailyStats = byDay.map((day: any) => ({
      date: day.day,
      questions: day.questions,
      correct: day.correct,
      accuracy: day.questions > 0 ? Math.round((day.correct / day.questions) * 100) : 0
    }))

    return NextResponse.json({
      student: {
        name: context.name,
        grade: context.grade,
        targetExam: context.targetExam
      },
      stats: {
        totalQuestions: context.totalQuestions,
        totalCorrect: context.totalCorrect,
        accuracy: context.accuracy,
        currentStreak: context.currentStreak,
        maxStreak: context.maxStreak,
        totalPoints: context.totalPoints
      },
      weekly: {
        totalQuestions: context.weeklyActivity.totalQuestions,
        correctCount: context.weeklyActivity.correctCount,
        wrongCount: context.weeklyActivity.wrongCount,
        accuracy: context.weeklyActivity.totalQuestions > 0 
          ? Math.round((context.weeklyActivity.correctCount / context.weeklyActivity.totalQuestions) * 100)
          : 0,
        dailyStats
      },
      subjects: subjectStats,
      analysis: {
        weakSubjects: combinedWeakSubjects, // Birleşik zayıf konular (soru bankası + deneme)
        strongSubjects: combinedStrongSubjects, // Birleşik güçlü konular
        weakSubjectsFromQuestions: weakSubjects, // Sadece soru bankasından
        weakSubjectsFromExams: examStats.weakTopicsFromExams, // Sadece denemelerden
        summary: analysisSummary,
        motivationalMessages
      },
      // Deneme istatistikleri (yeni eklendi)
      examStats: {
        totalExams: examStats.totalExams,
        avgNet: Math.round(examStats.avgNet * 10) / 10,
        lastExamDate: examStats.lastExamDate,
        netTrend: examStats.netTrend,
        lastExamAnalysis: examStats.lastExamAnalysis
      },
      aiCoach: {
        totalChats: aiStats?.total_chats || 0,
        tasksCompleted: aiStats?.tasks_completed || 0,
        lastInteraction: aiStats?.last_interaction
      },
      notification
    })

  } catch (error) {
    console.error('AI Coach analyze error:', error)
    return NextResponse.json(
      { error: 'Bir hata oluştu' },
      { status: 500 }
    )
  }
}

