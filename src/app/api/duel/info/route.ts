import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

// Service role client (RLS bypass)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const duelId = request.nextUrl.searchParams.get('duelId')
    const studentId = request.nextUrl.searchParams.get('studentId')
    
    if (!duelId) {
      return NextResponse.json({ error: 'duelId gerekli' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('duels')
      .select(`
        *,
        challenger:student_profiles!duels_challenger_id_fkey(
          id, user_id, grade,
          profile:profiles!student_profiles_user_id_fkey(full_name, avatar_url)
        ),
        opponent:student_profiles!duels_opponent_id_fkey(
          id, user_id, grade,
          profile:profiles!student_profiles_user_id_fkey(full_name, avatar_url)
        )
      `)
      .eq('id', duelId)
      .single()

    if (error) {
      console.error('Düello bilgi hatası:', error)
      return NextResponse.json({ error: 'Düello bulunamadı', details: error.message }, { status: 404 })
    }

    // Yetki kontrolü
    if (studentId && data.challenger_id !== studentId && data.opponent_id !== studentId) {
      return NextResponse.json({ error: 'Bu düelloya erişim yetkiniz yok' }, { status: 403 })
    }

    // Sorular DB'de var mı?
    const questions = data.questions || []
    const correctAnswers = data.correct_answers || questions.map((q: any) => q.correct_answer)

    // Güvenlik: correct_answer'ları sorulardan çıkar
    const safeQuestions = questions.map((q: any) => ({
      id: q.id,
      question_text: q.question_text,
      option_a: q.option_a,
      option_b: q.option_b,
      option_c: q.option_c,
      option_d: q.option_d,
      image_url: q.image_url,
      subject_name: q.subject_name,
      difficulty: q.difficulty
    }))

    return NextResponse.json({ 
      success: true,
      duel: data,
      questions: safeQuestions,
      correctAnswers
    })
  } catch (error) {
    console.error('Duel info error:', error)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}
