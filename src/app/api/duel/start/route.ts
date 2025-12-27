import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { typesenseClient, COLLECTIONS, isTypesenseAvailable } from '@/lib/typesense/client'

// Supabase service role client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * POST /api/duel/start
 * 
 * Canlı düelloyu başlatır:
 * 1. Düello durumunu 'active' yapar
 * 2. Typesense'den soruları çeker
 * 3. Soruları düelloya kaydeder
 */
export async function POST(req: NextRequest) {
  const startTime = Date.now()
  
  try {
    const { duelId, studentId } = await req.json()

    if (!duelId || !studentId) {
      return NextResponse.json(
        { error: 'duelId ve studentId gerekli' },
        { status: 400 }
      )
    }

    // Düelloyu kontrol et
    const { data: duel, error: duelError } = await supabase
      .from('duels')
      .select('*')
      .eq('id', duelId)
      .single()

    if (duelError || !duel) {
      return NextResponse.json(
        { error: 'Düello bulunamadı' },
        { status: 404 }
      )
    }

    // Oyuncu yetkisi kontrol
    if (duel.challenger_id !== studentId && duel.opponent_id !== studentId) {
      return NextResponse.json(
        { error: 'Bu düelloya erişim yetkiniz yok' },
        { status: 403 }
      )
    }

    // Zaten aktif mi?
    if (duel.status === 'active' && duel.questions && duel.questions.length > 0) {
      return NextResponse.json({
        success: true,
        duel,
        questions: duel.questions,
        message: 'Düello zaten başlamış'
      })
    }

    // Öğrenci bilgisini al (sınıf için)
    const { data: studentProfile } = await supabase
      .from('student_profiles')
      .select('grade')
      .eq('id', studentId)
      .single()

    const grade = studentProfile?.grade || 8

    // Soruları çek (Typesense veya Supabase)
    let questions: any[] = []
    
    if (isTypesenseAvailable()) {
      questions = await getQuestionsFromTypesense(grade, duel.subject, duel.question_count || 10)
    } else {
      questions = await getQuestionsFromSupabase(grade, duel.subject, duel.question_count || 10)
    }

    if (questions.length === 0) {
      return NextResponse.json(
        { error: 'Yeterli soru bulunamadı' },
        { status: 400 }
      )
    }

    // Düelloyu güncelle
    const { data: updatedDuel, error: updateError } = await supabase
      .from('duels')
      .update({
        status: 'active',
        started_at: new Date().toISOString(),
        questions: questions,
        is_realtime: true,
        game_mode: 'realtime',
        current_question: 0,
        question_started_at: new Date().toISOString()
      })
      .eq('id', duelId)
      .select()
      .single()

    if (updateError) {
      console.error('Düello güncelleme hatası:', updateError)
      return NextResponse.json(
        { error: 'Düello başlatılamadı' },
        { status: 500 }
      )
    }

    const duration = Date.now() - startTime
    console.log(`⚡ Duel started: ${duelId} in ${duration}ms`)

    return NextResponse.json({
      success: true,
      duel: updatedDuel,
      questions: questions.map(q => ({
        id: q.id,
        question_text: q.question_text,
        option_a: q.option_a,
        option_b: q.option_b,
        option_c: q.option_c,
        option_d: q.option_d,
        image_url: q.image_url,
        subject_name: q.subject_name,
        difficulty: q.difficulty
        // correct_answer dahil değil - güvenlik için
      })),
      correctAnswers: questions.map(q => q.correct_answer), // Sadece doğrulama için kullanılacak
      duration
    })

  } catch (error) {
    console.error('Duel start error:', error)
    return NextResponse.json(
      { error: 'Sunucu hatası', details: (error as Error).message },
      { status: 500 }
    )
  }
}

/**
 * Typesense'den sorular çek (~130ms)
 */
async function getQuestionsFromTypesense(grade: number, subject: string | null, count: number) {
  const filters: string[] = [`grade:=${grade}`]
  
  if (subject && subject !== 'Karışık') {
    filters.push(`subject_name:=${subject}`)
  }

  const result = await typesenseClient
    .collections(COLLECTIONS.QUESTIONS)
    .documents()
    .search({
      q: '*',
      query_by: 'question_text',
      filter_by: filters.join(' && '),
      per_page: count * 3, // Fazladan çek
      include_fields: 'id,question_text,option_a,option_b,option_c,option_d,correct_answer,explanation,image_url,subject_name,subject_code,topic_name,grade,difficulty'
    })

  const questions = (result.hits || []).map((hit: any) => hit.document)
  
  // Karıştır ve istenen sayıda al
  const shuffled = shuffleArray(questions)
  return shuffled.slice(0, count)
}

/**
 * Supabase'den sorular çek (fallback)
 */
async function getQuestionsFromSupabase(grade: number, subject: string | null, count: number) {
  let query = supabase
    .from('questions')
    .select('id, question_text, option_a, option_b, option_c, option_d, correct_answer, explanation, image_url, subject_name, subject_code, topic_name, grade, difficulty')
    .eq('grade', grade)
    .eq('is_active', true)
    .limit(count * 3)

  if (subject && subject !== 'Karışık') {
    query = query.eq('subject_name', subject)
  }

  const { data, error } = await query

  if (error || !data) {
    console.error('Supabase soru çekme hatası:', error)
    return []
  }

  const shuffled = shuffleArray(data)
  return shuffled.slice(0, count)
}

/**
 * Fisher-Yates shuffle
 */
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

