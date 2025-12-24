import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateAIResponse } from '@/lib/ai-coach/gemini'
import { buildSystemPrompt, buildChatPrompt, StudentContext } from '@/lib/ai-coach/prompts'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Auth kontrolü
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Request body
    const { message } = await request.json()
    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Mesaj gerekli' }, { status: 400 })
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

    // Son konuşmalar
    const { data: conversationHistory } = await supabase
      .from('ai_coach_conversations')
      .select('role, content')
      .eq('student_id', studentProfile.id)
      .order('created_at', { ascending: false })
      .limit(10)

    // Context oluştur
    const subjects = studentStats?.subjects || {}
    const subjectStats: Record<string, { correct: number; wrong: number; accuracy: number }> = {}
    const weakSubjects: string[] = []
    const strongSubjects: string[] = []

    Object.keys(subjects).forEach(key => {
      const s = subjects[key]
      const total = s.correct + s.wrong
      const accuracy = total > 0 ? Math.round((s.correct / total) * 100) : 0
      subjectStats[key] = { ...s, accuracy }
      
      if (total >= 10) {
        if (accuracy < 50) weakSubjects.push(key)
        else if (accuracy >= 70) strongSubjects.push(key)
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

    // Prompt oluştur
    const systemPrompt = buildSystemPrompt(context)
    const fullPrompt = buildChatPrompt(
      systemPrompt, 
      message, 
      conversationHistory?.reverse() || []
    )

    // AI yanıtı al
    const aiResponse = await generateAIResponse(message, systemPrompt)

    // Konuşmayı kaydet (kullanıcı mesajı)
    await supabase.from('ai_coach_conversations').insert({
      student_id: studentProfile.id,
      role: 'user',
      content: message
    })

    // Konuşmayı kaydet (AI yanıtı)
    await supabase.from('ai_coach_conversations').insert({
      student_id: studentProfile.id,
      role: 'assistant',
      content: aiResponse
    })

    // Stats güncelle
    await supabase
      .from('ai_coach_stats')
      .upsert({
        student_id: studentProfile.id,
        total_chats: 1,
        last_interaction: new Date().toISOString()
      }, {
        onConflict: 'student_id',
        ignoreDuplicates: false
      })

    // İlk sohbet rozeti kontrolü
    const { data: existingBadge } = await supabase
      .from('user_badges')
      .select('id')
      .eq('student_id', studentProfile.id)
      .eq('badge_id', 'ai_student')
      .single()

    if (!existingBadge) {
      // İlk AI Koç sohbeti rozeti ver
      await supabase.from('user_badges').insert({
        student_id: studentProfile.id,
        badge_id: 'ai_student'
      })
    }

    return NextResponse.json({ 
      response: aiResponse,
      context: {
        name: context.name,
        streak: context.currentStreak,
        accuracy: context.accuracy
      }
    })

  } catch (error) {
    console.error('AI Coach chat error:', error)
    return NextResponse.json(
      { error: 'Bir hata oluştu' },
      { status: 500 }
    )
  }
}

// Sohbet geçmişini al
export async function GET(request: NextRequest) {
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

    const { data: conversations, error } = await supabase
      .from('ai_coach_conversations')
      .select('id, role, content, created_at')
      .eq('student_id', studentProfile.id)
      .order('created_at', { ascending: true })
      .limit(50)

    if (error) {
      throw error
    }

    return NextResponse.json({ conversations })

  } catch (error) {
    console.error('AI Coach history error:', error)
    return NextResponse.json(
      { error: 'Bir hata oluştu' },
      { status: 500 }
    )
  }
}

