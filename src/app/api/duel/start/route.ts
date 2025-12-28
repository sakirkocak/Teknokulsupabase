import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { typesenseClient, COLLECTIONS, isTypesenseAvailable } from '@/lib/typesense/client'
import { duelRateLimits, getRateLimitHeaders } from '@/lib/rate-limit'

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

    // Rate limit kontrolü
    const rateLimit = duelRateLimits.start(studentId)
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: 'Çok fazla istek gönderdiniz. Lütfen biraz bekleyin.' },
        { status: 429, headers: getRateLimitHeaders(rateLimit) }
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

    // Zaten aktif mi? (DB'deki sorulara bak)
    if (duel.status === 'active' && duel.questions && duel.questions.length > 0) {
      console.log('⚡ Düello zaten aktif, mevcut sorular döndürülüyor')
      return NextResponse.json({
        success: true,
        duel,
        questions: duel.questions,
        correctAnswers: duel.correct_answers || duel.questions.map((q: any) => q.correct_answer),
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
    
    console.log('🎮 Duel start params:', {
      grade,
      subject: duel.subject,
      questionCount: duel.question_count,
      typesenseAvailable: isTypesenseAvailable()
    })
    
    // Önce Typesense'den dene (hızlı ~130ms)
    if (isTypesenseAvailable()) {
      questions = await getQuestionsFromTypesense(grade, duel.subject, duel.question_count || 10)
      console.log(`⚡ Typesense questions found: ${questions.length}`)
    }
    
    // Typesense'de soru yoksa veya hata varsa Supabase fallback
    if (questions.length === 0) {
      console.log('⚠️ Typesense\'de soru yok, Supabase\'e geçiliyor...')
      questions = await getQuestionsFromSupabase(grade, duel.subject, duel.question_count || 10)
      console.log(`📚 Supabase questions found: ${questions.length}`)
    }

    // Hala soru yoksa, sınıf filtresi olmadan tekrar dene
    if (questions.length === 0) {
      console.log('⚠️ No questions for grade', grade, '- trying without grade filter')
      if (isTypesenseAvailable()) {
        questions = await getQuestionsFromTypesense(null, duel.subject, duel.question_count || 10)
      }
      if (questions.length === 0) {
        questions = await getQuestionsFromSupabase(null, duel.subject, duel.question_count || 10)
      }
      console.log(`📚 Without grade filter: ${questions.length} questions`)
    }

    if (questions.length === 0) {
      console.log('❌ No questions found for:', { grade, subject: duel.subject })
      return NextResponse.json(
        { error: `"${duel.subject || 'Karışık'}" dersi için yeterli soru bulunamadı. Başka bir ders deneyin.` },
        { status: 400 }
      )
    }

    // Soruları hazırla (4 veya 5 şık)
    const preparedQuestions = questions.map(q => ({
      id: q.id,
      question_text: q.question_text,
      option_a: q.option_a,
      option_b: q.option_b,
      option_c: q.option_c,
      option_d: q.option_d,
      option_e: q.option_e || null,  // Lise için 5. şık
      image_url: q.image_url,
      subject_name: q.subject_name,
      subject_code: q.subject_code,
      topic_name: q.topic_name,
      grade: q.grade,
      difficulty: q.difficulty,
      correct_answer: q.correct_answer
    }))
    
    const correctAnswersArray = preparedQuestions.map(q => q.correct_answer)

    // Düelloyu güncelle ve soruları DB'ye kaydet
    const { data: updatedDuel, error: updateError } = await supabase
      .from('duels')
      .update({
        status: 'active',
        started_at: new Date().toISOString(),
        current_question: 0,
        questions: preparedQuestions,
        correct_answers: correctAnswersArray
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
    
    console.log(`💾 Sorular DB'ye kaydedildi: ${duelId}`)

    const duration = Date.now() - startTime
    console.log(`⚡ Duel started: ${duelId} in ${duration}ms`)

    return NextResponse.json({
      success: true,
      duel: updatedDuel,
      questions: preparedQuestions.map(q => ({
        id: q.id,
        question_text: q.question_text,
        option_a: q.option_a,
        option_b: q.option_b,
        option_c: q.option_c,
        option_d: q.option_d,
        option_e: q.option_e,  // Lise için 5. şık
        image_url: q.image_url,
        subject_name: q.subject_name,
        difficulty: q.difficulty
        // correct_answer dahil değil - güvenlik için
      })),
      correctAnswers: preparedQuestions.map(q => q.correct_answer), // Sadece doğrulama için kullanılacak
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
async function getQuestionsFromTypesense(grade: number | null, subject: string | null, count: number) {
  const filters: string[] = []
  
  if (grade) {
    filters.push(`grade:=${grade}`)
  }
  
  if (subject && subject !== 'Karışık' && subject !== 'all') {
    // Boşluk içeren ders isimleri için backtick kullan
    filters.push(`subject_name:\`${subject}\``)
  }

  const searchParams: any = {
    q: '*',
    query_by: 'question_text',
    per_page: count * 3,
    include_fields: 'id,question_text,option_a,option_b,option_c,option_d,option_e,correct_answer,explanation,image_url,subject_name,subject_code,main_topic,grade,difficulty'
  }
  
  if (filters.length > 0) {
    searchParams.filter_by = filters.join(' && ')
  }

  const result = await typesenseClient
    .collections(COLLECTIONS.QUESTIONS)
    .documents()
    .search(searchParams)

  const questions = (result.hits || []).map((hit: any) => hit.document)
  
  // Karıştır ve istenen sayıda al
  const shuffled = shuffleArray(questions)
  return shuffled.slice(0, count)
}

/**
 * Supabase'den rastgele sorular çek (topics ile JOIN)
 * Rastgele offset kullanarak her seferinde farklı sorular getirir
 */
async function getQuestionsFromSupabase(grade: number | null, subject: string | null, count: number) {
  console.log('🔍 Supabase query params:', { grade, subject, count })
  
  // Önce toplam soru sayısını al (filtrelere göre)
  let countQuery = supabase
    .from('questions')
    .select('id, topic:topics!inner(grade, subject:subjects!inner(name))', { count: 'exact', head: true })
    .eq('is_active', true)
  
  if (grade) {
    countQuery = countQuery.eq('topic.grade', grade)
  }
  if (subject && subject !== 'Karışık' && subject !== 'all') {
    countQuery = countQuery.eq('topic.subject.name', subject)
  }
  
  const { count: totalCount } = await countQuery
  console.log(`📊 Toplam uygun soru sayısı: ${totalCount}`)
  
  // Rastgele offset hesapla (çok sayıda soru varsa rastgele bir yerden başla)
  const maxOffset = Math.max(0, (totalCount || 0) - (count * 10))
  const randomOffset = Math.floor(Math.random() * maxOffset)
  
  console.log(`🎲 Rastgele offset: ${randomOffset} / ${maxOffset}`)
  
  // questions -> topics -> subjects JOIN yapısı
  let query = supabase
    .from('questions')
    .select(`
      id, 
      question_text, 
      options, 
      correct_answer, 
      explanation, 
      question_image_url,
      difficulty,
      topic:topics!inner(
        id,
        main_topic,
        grade,
        subject:subjects!inner(
          name,
          code
        )
      )
    `)
    .eq('is_active', true)
    .range(randomOffset, randomOffset + (count * 10) - 1)  // Rastgele offset'ten başla

  // Sınıf filtresi (topics üzerinden)
  if (grade) {
    query = query.eq('topic.grade', grade)
  }

  // Ders filtresi (subjects üzerinden)
  if (subject && subject !== 'Karışık' && subject !== 'all') {
    query = query.eq('topic.subject.name', subject)
  }

  const { data, error } = await query

  if (error) {
    console.error('❌ Supabase soru çekme hatası:', error)
    return []
  }
  
  console.log(`✅ Supabase sorgu sonucu: ${data?.length || 0} soru (offset: ${randomOffset})`)
  
  // Flatten ve options'ı ayrıştır
  const questionsWithOptions = (data || []).map((q: any) => {
    const options = q.options || {}
    return {
      id: q.id,
      question_text: q.question_text,
      correct_answer: q.correct_answer,
      explanation: q.explanation,
      image_url: q.question_image_url,
      difficulty: q.difficulty,
      topic_name: q.topic?.main_topic,
      grade: q.topic?.grade,
      subject_name: q.topic?.subject?.name,
      subject_code: q.topic?.subject?.code,
      option_a: options.A || options.a || '',
      option_b: options.B || options.b || '',
      option_c: options.C || options.c || '',
      option_d: options.D || options.d || '',
      option_e: options.E || options.e || null  // Lise için 5. şık
    }
  })

  // Shuffle ve istenen sayıda al
  const shuffled = shuffleArray(questionsWithOptions)
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

