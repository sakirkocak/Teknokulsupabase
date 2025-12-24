import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Günlük görevleri bugün çözülen sorularla senkronize et
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: studentProfile } = await supabase
      .from('student_profiles')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!studentProfile) {
      return NextResponse.json({ error: 'Öğrenci profili bulunamadı' }, { status: 404 })
    }

    // Bugünün başlangıcı (İstanbul saati)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Bugün çözülen tüm soruları al
    const { data: todayQuestions } = await supabase
      .from('point_history')
      .select('id, is_correct, subject_code, created_at')
      .eq('student_id', studentProfile.id)
      .eq('source', 'question')
      .gte('created_at', today.toISOString())

    const questions = todayQuestions || []
    const totalQuestions = questions.length
    const correctQuestions = questions.filter(q => q.is_correct === true).length
    const mathQuestions = questions.filter(q => 
      q.subject_code === 'matematik' || 
      (q.subject_code && q.subject_code.toLowerCase().includes('mat'))
    ).length
    
    // Farklı dersler
    const uniqueSubjects = Array.from(new Set(questions.map(q => q.subject_code).filter(Boolean)))
    const subjectCount = uniqueSubjects.length

    // Doğruluk oranı
    const accuracy = totalQuestions > 0 ? (correctQuestions / totalQuestions) * 100 : 0

    // Günlük görevleri güncelle
    const challenges = [
      {
        id: 'daily_practice',
        current: Math.min(totalQuestions, 10),
        target: 10,
        completed: totalQuestions >= 10
      },
      {
        id: 'daily_streak',
        current: Math.min(totalQuestions, 1),
        target: 1,
        completed: totalQuestions >= 1
      },
      {
        id: 'daily_math',
        current: Math.min(mathQuestions, 5),
        target: 5,
        completed: mathQuestions >= 5
      },
      {
        id: 'daily_accuracy',
        current: accuracy >= 80 && totalQuestions >= 5 ? 5 : 0,
        target: 5,
        completed: accuracy >= 80 && totalQuestions >= 5
      },
      {
        id: 'daily_explorer',
        current: Math.min(subjectCount, 3),
        target: 3,
        completed: subjectCount >= 3
      }
    ]

    let completedCount = 0
    let totalXp = 0
    const xpRewards: Record<string, number> = {
      'daily_practice': 20,
      'daily_streak': 15,
      'daily_math': 25,
      'daily_accuracy': 30,
      'daily_explorer': 20
    }

    // Her görevi güncelle
    for (const challenge of challenges) {
      const { error } = await supabase
        .from('challenge_progress')
        .upsert({
          user_id: user.id,
          challenge_id: challenge.id,
          current_progress: challenge.current,
          is_completed: challenge.completed,
          completed_at: challenge.completed ? new Date().toISOString() : null,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,challenge_id'
        })

      if (!error && challenge.completed) {
        completedCount++
        totalXp += xpRewards[challenge.id] || 0
      }
    }

    return NextResponse.json({
      message: 'Günlük görevler senkronize edildi',
      stats: {
        totalQuestions,
        correctQuestions,
        mathQuestions,
        subjectCount,
        accuracy: Math.round(accuracy)
      },
      challenges: challenges.map(c => ({
        id: c.id,
        progress: `${c.current}/${c.target}`,
        completed: c.completed
      })),
      completedCount,
      potentialXp: totalXp
    })

  } catch (error) {
    console.error('Challenge sync error:', error)
    return NextResponse.json(
      { error: 'Bir hata oluştu' },
      { status: 500 }
    )
  }
}

