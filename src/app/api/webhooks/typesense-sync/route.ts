import { NextRequest, NextResponse } from 'next/server'
import Typesense from 'typesense'
import { createClient } from '@supabase/supabase-js'
// NOT: Embedding'ler Supabase pgvector'da tutulur, Typesense'e gönderilmez

// Typesense admin client
const typesense = new Typesense.Client({
  nodes: [{
    host: process.env.TYPESENSE_HOST || '',
    port: 443,
    protocol: 'https'
  }],
  apiKey: process.env.TYPESENSE_API_KEY || '',
  connectionTimeoutSeconds: 5
})

// Supabase service role client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface WebhookPayload {
  type: 'INSERT' | 'UPDATE' | 'DELETE'
  table: string
  record: Record<string, any>
  old_record?: Record<string, any>
  schema: string
}

// 🛡️ Typesense için güvenli değer dönüştürücü
function safeString(value: any, defaultValue: string = ''): string {
  if (value === null || value === undefined) return defaultValue
  return String(value).trim() || defaultValue
}

function safeNumber(value: any, defaultValue: number = 0): number {
  if (value === null || value === undefined) return defaultValue
  const num = Number(value)
  return isNaN(num) ? defaultValue : num
}

function safeTimestamp(value: any): number {
  if (!value) return Date.now()
  const timestamp = new Date(value).getTime()
  return isNaN(timestamp) ? Date.now() : timestamp
}

export async function POST(req: NextRequest) {
  try {
    // Webhook secret kontrolü
    const webhookSecret = req.headers.get('x-webhook-secret')
    if (webhookSecret !== process.env.TYPESENSE_WEBHOOK_SECRET) {
      console.error('Webhook: Unauthorized request')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const payload: WebhookPayload = await req.json()
    const { type, table, record, old_record } = payload
    
    // 📊 Minimal loglama - sadece tablo adı
    console.log(`Webhook: ${type} on ${table}`)
    
    // student_points tablosu için sync (leaderboard + student_stats)
    if (table === 'student_points') {
      await handleStudentPointsSync(type, record, old_record)
    }
    
    // questions tablosu için sync
    if (table === 'questions') {
      await handleQuestionsSync(type, record, old_record)
    }
    
    // student_topic_stats tablosu için sync
    if (table === 'student_topic_stats') {
      await handleStudentTopicStatsSync(type, record, old_record)
    }
    
    // schools tablosu için sync
    if (table === 'schools') {
      await handleSchoolsSync(type, record, old_record)
    }
    
    // turkey_cities tablosu için sync
    if (table === 'turkey_cities') {
      await handleCitiesSync(type, record, old_record)
    }
    
    // turkey_districts tablosu için sync
    if (table === 'turkey_districts') {
      await handleDistrictsSync(type, record, old_record)
    }
    
    return NextResponse.json({ success: true })
    
  } catch (error) {
    // 🔍 Detaylı hata loglama
    const errorMessage = error instanceof Error ? error.message : String(error)
    const errorStack = error instanceof Error ? error.stack : undefined
    
    console.error('Typesense sync error:', {
      message: errorMessage,
      stack: errorStack?.split('\n').slice(0, 3).join('\n') // İlk 3 satır
    })
    
    return NextResponse.json(
      { error: 'Sync failed', details: errorMessage }, 
      { status: 500 }
    )
  }
}

// =========================================
// STUDENT POINTS -> LEADERBOARD + STUDENT_STATS
// =========================================
async function handleStudentPointsSync(
  type: string, 
  record: Record<string, any>, 
  old_record?: Record<string, any>
) {
  if (type === 'INSERT' || type === 'UPDATE') {
    // 🛡️ Student ID kontrolü
    const studentId = safeString(record.student_id)
    if (!studentId) {
      console.warn('Webhook: student_id boş, atlanıyor')
      return
    }
    
    // Öğrenci bilgilerini çek
    const { data: studentData, error: studentError } = await supabase
      .from('student_profiles')
      .select(`
        id,
        user_id,
        grade,
        city_id,
        district_id,
        school_id,
        profile:profiles!student_profiles_user_id_fkey(full_name, avatar_url),
        city:turkey_cities!student_profiles_city_id_fkey(name),
        district:turkey_districts!student_profiles_district_id_fkey(name),
        school:schools!student_profiles_school_id_fkey(name)
      `)
      .eq('id', studentId)
      .single()
    
    if (studentError || !studentData) {
      console.warn(`Webhook: student_profiles bulunamadı: ${studentId}`)
      return
    }
    
    const fullName = safeString((studentData.profile as any)?.full_name, 'Anonim')
    const totalQuestions = safeNumber(record.total_questions)
    const totalCorrect = safeNumber(record.total_correct)
    const totalWrong = safeNumber(record.total_wrong)
    
    // 🛡️ Leaderboard document - tüm değerler güvenli
    const leaderboardDoc = {
      id: studentId,
      student_id: studentId,
      user_id: safeString(studentData.user_id, 'unknown'),
      full_name: fullName,
      avatar_url: safeString((studentData.profile as any)?.avatar_url),
      total_points: safeNumber(record.total_points),
      total_questions: totalQuestions,
      total_correct: totalCorrect,
      total_wrong: totalWrong,
      max_streak: safeNumber(record.max_streak),
      current_streak: safeNumber(record.current_streak),
      grade: safeNumber(studentData.grade),
      city_id: safeString(studentData.city_id, 'unknown'),
      city_name: safeString((studentData.city as any)?.name, 'Belirtilmemiş'),
      district_id: safeString(studentData.district_id, 'unknown'),
      district_name: safeString((studentData.district as any)?.name, 'Belirtilmemiş'),
      school_id: safeString(studentData.school_id, 'unknown'),
      school_name: safeString((studentData.school as any)?.name, 'Belirtilmemiş'),
      matematik_points: safeNumber(record.matematik_points),
      turkce_points: safeNumber(record.turkce_points),
      fen_points: safeNumber(record.fen_points),
      inkilap_points: safeNumber(record.inkilap_points),
      din_points: safeNumber(record.din_points),
      ingilizce_points: safeNumber(record.ingilizce_points),
      last_activity_at: safeTimestamp(record.last_activity_at)
    }
    
    try {
      await typesense.collections('leaderboard').documents().upsert(leaderboardDoc)
    } catch (leaderboardError) {
      console.error(`Leaderboard upsert hatası (${studentId}):`, (leaderboardError as Error).message)
      throw leaderboardError
    }
    
    // 🛡️ Student Stats document
    const studentStatsDoc = {
      id: studentId,
      student_id: studentId,
      student_name: fullName,
      grade: safeNumber(studentData.grade),
      total_questions: totalQuestions,
      total_correct: totalCorrect,
      total_wrong: totalWrong,
      overall_success_rate: totalQuestions > 0 
        ? Math.round((totalCorrect / totalQuestions) * 100 * 100) / 100 
        : 0,
      total_points: safeNumber(record.total_points),
      current_streak: safeNumber(record.current_streak),
      max_streak: safeNumber(record.max_streak),
      weak_topics: [],
      strong_topics: [],
      last_activity_at: safeTimestamp(record.last_activity_at)
    }
    
    try {
      await typesense.collections('student_stats').documents().upsert(studentStatsDoc)
    } catch (statsError) {
      console.error(`Student stats upsert hatası (${studentId}):`, (statsError as Error).message)
      // Leaderboard başarılıysa stats hatasını yutabiliriz
    }
  }
  
  if (type === 'DELETE') {
    try {
      const studentId = safeString(old_record?.student_id || record.student_id)
      if (studentId) {
        await typesense.collections('leaderboard').documents(studentId).delete()
        await typesense.collections('student_stats').documents(studentId).delete()
      }
    } catch (e) {
      // Document bulunamadı - sorun yok
    }
  }
}

// =========================================
// QUESTIONS SYNC
// =========================================
async function handleQuestionsSync(
  type: string, 
  record: Record<string, any>, 
  old_record?: Record<string, any>
) {
  if (type === 'INSERT' || type === 'UPDATE') {
    const questionId = safeString(record.id)
    if (!questionId) {
      console.warn('Webhook: question id boş, atlanıyor')
      return
    }
    
    // Aktif değilse silme işlemi yap
    if (!record.is_active) {
      try {
        await typesense.collections('questions').documents(questionId).delete()
      } catch (e) {
        // Document bulunamadı - sorun yok
      }
      return
    }
    
    // Topic bilgilerini çek: önce topics, yoksa exam_topics dene (TYT/AYT)
    let subjectCode = 'unknown'
    let subjectName = 'Bilinmeyen'
    let mainTopic = ''
    let subTopic = ''
    let grade = 0
    let topicIdForDoc = ''

    if (record.topic_id) {
      // Normal soru: topics → subjects join
      const { data: topicData, error: topicError } = await supabase
        .from('topics')
        .select(`
          id,
          main_topic,
          sub_topic,
          grade,
          subject:subjects!inner(id, code, name)
        `)
        .eq('id', record.topic_id)
        .single()

      if (topicError || !topicData) {
        console.warn(`Webhook: topic bulunamadı: ${record.topic_id}`)
        return
      }

      grade = safeNumber(topicData.grade)
      subjectCode = safeString((topicData.subject as any)?.code, 'unknown')
      subjectName = safeString((topicData.subject as any)?.name, 'Bilinmeyen')
      mainTopic = safeString(topicData.main_topic)
      subTopic = safeString(topicData.sub_topic)
      topicIdForDoc = record.topic_id

    } else if (record.exam_topic_id) {
      // TYT/AYT sorusu: exam_topics tablosundan al
      const { data: examTopicData, error: examTopicError } = await supabase
        .from('exam_topics')
        .select('subject_code, subject_name, main_topic, sub_topic, grades')
        .eq('id', record.exam_topic_id)
        .single()

      if (examTopicError || !examTopicData) {
        console.warn(`Webhook: exam_topic bulunamadı: ${record.exam_topic_id}`)
        return
      }

      // TYT/AYT soruları sınıf tabanlı değil, sınav tabanlı
      // grade: 0 = "sınav sorusu" (sınıf sistemiyle karışmasın)
      grade = 0
      subjectCode = safeString(examTopicData.subject_code, 'unknown')
      subjectName = safeString(examTopicData.subject_name, 'Bilinmeyen')
      mainTopic = safeString(examTopicData.main_topic)
      subTopic = safeString(examTopicData.sub_topic)
      topicIdForDoc = record.exam_topic_id  // exam_topic_id'yi topic_id alanına yaz

    } else {
      console.warn(`Webhook: topic_id ve exam_topic_id ikisi de yok: ${questionId}`)
      return
    }

    // 📊 İstatistikler
    const timesAnswered = safeNumber(record.times_answered)
    const timesCorrect = safeNumber(record.times_correct)

    // 🚀 OPTİMİZE: Sadece arama/filtreleme için gereken alanlar
    // Detaylar (options, explanation, correct_answer, image_url) Supabase'den çekilir
    const document: Record<string, any> = {
      id: questionId,
      question_id: questionId,
      topic_id: topicIdForDoc,
      question_text: safeString(record.question_text),
      // Filtreleme alanları
      difficulty: safeString(record.difficulty, 'medium'),
      subject_code: subjectCode,
      subject_name: subjectName,
      main_topic: mainTopic,
      sub_topic: subTopic,
      grade,
      has_image: !!record.question_image_url,
      // Yeni Nesil Soru alanları
      is_new_generation: !!record.visual_type && record.visual_type !== 'none',
      visual_type: safeString(record.visual_type),
      // Sınav türü etiketleme (TYT/AYT)
      exam_types: Array.isArray(record.exam_types) ? record.exam_types : [],
      // İstatistikler
      times_answered: timesAnswered,
      times_correct: timesCorrect,
      success_rate: timesAnswered > 0
        ? Math.round((timesCorrect / timesAnswered) * 100 * 100) / 100
        : 0,
      // Sıralama
      created_at: safeTimestamp(record.created_at)
    }

    try {
      await typesense.collections('questions').documents().upsert(document)
    } catch (questionError) {
      console.error(`Question upsert hatası (${questionId}):`, (questionError as Error).message)
      throw questionError
    }
  }
  
  if (type === 'DELETE') {
    try {
      const questionId = safeString(old_record?.id || record.id)
      if (questionId) {
        await typesense.collections('questions').documents(questionId).delete()
      }
    } catch (e) {
      // Document bulunamadı - sorun yok
    }
  }
}

// =========================================
// STUDENT TOPIC STATS -> STUDENT_TOPIC_PROGRESS
// =========================================
async function handleStudentTopicStatsSync(
  type: string, 
  record: Record<string, any>, 
  old_record?: Record<string, any>
) {
  if (type === 'INSERT' || type === 'UPDATE') {
    const studentId = safeString(record.student_id)
    const topicId = safeString(record.topic_id)
    
    if (!studentId || !topicId) {
      console.warn('Webhook: student_id veya topic_id boş, atlanıyor')
      return
    }
    
    // Topic bilgilerini çek
    const { data: topicData, error: topicError } = await supabase
      .from('topics')
      .select(`
        id,
        main_topic,
        grade,
        subject:subjects!inner(code, name)
      `)
      .eq('id', topicId)
      .single()
    
    if (topicError || !topicData) {
      console.warn(`Webhook: topic bulunamadı: ${topicId}`)
      return
    }
    
    const totalAttempted = safeNumber(record.total_attempted)
    const totalCorrect = safeNumber(record.total_correct)
    const docId = `${studentId}_${topicId}`
    
    const document = {
      id: docId,
      progress_id: docId,
      student_id: studentId,
      topic_id: topicId,
      subject_code: safeString((topicData.subject as any)?.code, 'unknown'),
      subject_name: safeString((topicData.subject as any)?.name, 'Bilinmeyen'),
      main_topic: safeString(topicData.main_topic),
      grade: safeNumber(topicData.grade),
      total_attempted: totalAttempted,
      total_correct: totalCorrect,
      success_rate: totalAttempted > 0 
        ? Math.round((totalCorrect / totalAttempted) * 100 * 100) / 100 
        : 0,
      mastery_level: safeString(record.mastery_level, 'beginner'),
      current_difficulty: safeString(record.current_difficulty, 'medium'),
      consecutive_correct: safeNumber(record.consecutive_correct),
      last_practiced_at: safeTimestamp(record.last_attempted_at)
    }
    
    try {
      await typesense.collections('student_topic_progress').documents().upsert(document)
    } catch (progressError) {
      console.error(`Topic progress upsert hatası (${docId}):`, (progressError as Error).message)
      throw progressError
    }
  }
  
  if (type === 'DELETE') {
    try {
      const studentId = safeString(old_record?.student_id || record.student_id)
      const topicId = safeString(old_record?.topic_id || record.topic_id)
      if (studentId && topicId) {
        await typesense.collections('student_topic_progress').documents(`${studentId}_${topicId}`).delete()
      }
    } catch (e) {
      // Document bulunamadı - sorun yok
    }
  }
}

// =========================================
// SCHOOLS SYNC
// =========================================
async function handleSchoolsSync(
  type: string, 
  record: Record<string, any>, 
  old_record?: Record<string, any>
) {
  if (type === 'INSERT' || type === 'UPDATE') {
    const schoolId = safeString(record.id)
    if (!schoolId) {
      console.warn('Webhook: school id boş, atlanıyor')
      return
    }
    
    if (!record.is_active) {
      try {
        await typesense.collections('schools').documents(schoolId).delete()
      } catch (e) {
        // Document bulunamadı - sorun yok
      }
      return
    }
    
    // District ve City bilgilerini çek
    const { data: districtData } = await supabase
      .from('turkey_districts')
      .select(`
        id,
        name,
        city_id,
        city:turkey_cities!turkey_districts_city_id_fkey(id, name)
      `)
      .eq('id', record.district_id)
      .single()
    
    const document = {
      id: schoolId,
      school_id: schoolId,
      name: safeString(record.name, 'İsimsiz Okul'),
      city_id: safeString((districtData?.city as any)?.id, 'unknown'),
      city_name: safeString((districtData?.city as any)?.name, 'Belirtilmemiş'),
      district_id: safeString(districtData?.id, 'unknown'),
      district_name: safeString(districtData?.name, 'Belirtilmemiş'),
      school_type: safeString(record.school_type, 'other'),
      ownership_type: safeString(record.ownership_type, 'public')
    }
    
    try {
      await typesense.collections('schools').documents().upsert(document)
    } catch (schoolError) {
      console.error(`School upsert hatası (${schoolId}):`, (schoolError as Error).message)
      throw schoolError
    }
  }
  
  if (type === 'DELETE') {
    try {
      const schoolId = safeString(old_record?.id || record.id)
      if (schoolId) {
        await typesense.collections('schools').documents(schoolId).delete()
      }
    } catch (e) {
      // Document bulunamadı - sorun yok
    }
  }
}

// =========================================
// CITIES SYNC
// =========================================
async function handleCitiesSync(
  type: string, 
  record: Record<string, any>, 
  old_record?: Record<string, any>
) {
  if (type === 'INSERT' || type === 'UPDATE') {
    const cityId = safeString(record.id)
    if (!cityId) {
      console.warn('Webhook: city id boş, atlanıyor')
      return
    }
    
    const document = {
      id: `city_${cityId}`,
      location_id: cityId,
      name: safeString(record.name, 'İsimsiz Şehir'),
      type: 'city',
      plate_code: safeNumber(record.plate_code)
    }
    
    try {
      await typesense.collections('locations').documents().upsert(document)
    } catch (cityError) {
      console.error(`City upsert hatası (${cityId}):`, (cityError as Error).message)
      throw cityError
    }
  }
  
  if (type === 'DELETE') {
    try {
      const cityId = safeString(old_record?.id || record.id)
      if (cityId) {
        await typesense.collections('locations').documents(`city_${cityId}`).delete()
      }
    } catch (e) {
      // Document bulunamadı - sorun yok
    }
  }
}

// =========================================
// DISTRICTS SYNC
// =========================================
async function handleDistrictsSync(
  type: string, 
  record: Record<string, any>, 
  old_record?: Record<string, any>
) {
  if (type === 'INSERT' || type === 'UPDATE') {
    const districtId = safeString(record.id)
    if (!districtId) {
      console.warn('Webhook: district id boş, atlanıyor')
      return
    }
    
    // City bilgisini çek
    const { data: cityData } = await supabase
      .from('turkey_cities')
      .select('id, name')
      .eq('id', record.city_id)
      .single()
    
    const document = {
      id: `district_${districtId}`,
      location_id: districtId,
      name: safeString(record.name, 'İsimsiz İlçe'),
      type: 'district',
      parent_id: safeString(record.city_id, 'unknown'),
      parent_name: safeString(cityData?.name, 'Belirtilmemiş')
    }
    
    try {
      await typesense.collections('locations').documents().upsert(document)
    } catch (districtError) {
      console.error(`District upsert hatası (${districtId}):`, (districtError as Error).message)
      throw districtError
    }
  }
  
  if (type === 'DELETE') {
    try {
      const districtId = safeString(old_record?.id || record.id)
      if (districtId) {
        await typesense.collections('locations').documents(`district_${districtId}`).delete()
      }
    } catch (e) {
      // Document bulunamadı - sorun yok
    }
  }
}

// Health check endpoint
export async function GET() {
  try {
    const health = await typesense.health.retrieve()
    
    // Collection stats
    const collections = ['leaderboard', 'questions', 'locations', 'schools', 'student_stats', 'student_topic_progress']
    const stats: Record<string, number> = {}
    
    for (const name of collections) {
      try {
        const collection = await typesense.collections(name).retrieve()
        stats[name] = collection.num_documents
      } catch (e) {
        stats[name] = -1 // Collection not found
      }
    }
    
    return NextResponse.json({ 
      status: 'ok', 
      typesense: health.ok ? 'healthy' : 'unhealthy',
      collections: stats
    })
  } catch (error) {
    return NextResponse.json({ 
      status: 'error', 
      message: (error as Error).message 
    }, { status: 500 })
  }
}
