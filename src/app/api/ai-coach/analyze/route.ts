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

    // Öğrenci istatistikleri
    const { data: studentStats } = await supabase.rpc('get_student_analysis', {
      p_student_id: studentProfile.id
    })

    // Haftalık aktivite
    const { data: weeklyActivity } = await supabase.rpc('get_weekly_activity', {
      p_student_id: studentProfile.id
    })

    // AI Coach stats
    const { data: aiStats } = await supabase
      .from('ai_coach_stats')
      .select('*')
      .eq('student_id', studentProfile.id)
      .single()

    // Context oluştur
    const subjects = studentStats?.subjects || {}
    const subjectStats: Record<string, { correct: number; wrong: number; accuracy: number; name: string }> = {}
    const weakSubjects: string[] = []
    const strongSubjects: string[] = []

    Object.keys(subjects).forEach(key => {
      const s = subjects[key]
      const total = s.correct + s.wrong
      const accuracy = total > 0 ? Math.round((s.correct / total) * 100) : 0
      subjectStats[key] = { ...s, accuracy, name: getSubjectName(key) }
      
      if (total >= 10) {
        if (accuracy < 50) weakSubjects.push(getSubjectName(key))
        else if (accuracy >= 70) strongSubjects.push(getSubjectName(key))
      }
    })

    const context: StudentContext = {
      name: profile?.full_name || 'Öğrenci',
      grade: studentProfile.grade || 8,
      targetExam: studentProfile.target_exam || 'LGS',
      totalQuestions: studentStats?.total_questions || 0,
      totalCorrect: studentStats?.total_correct || 0,
      accuracy: studentStats?.accuracy || 0,
      currentStreak: studentStats?.current_streak || 0,
      maxStreak: studentStats?.max_streak || 0,
      totalPoints: studentStats?.total_points || 0,
      weeklyActivity: {
        totalQuestions: weeklyActivity?.total_questions || 0,
        correctCount: weeklyActivity?.correct_count || 0,
        wrongCount: weeklyActivity?.wrong_count || 0
      },
      subjects: subjectStats,
      weakSubjects,
      strongSubjects
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
        weakSubjects,
        strongSubjects,
        summary: analysisSummary,
        motivationalMessages
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

