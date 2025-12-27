import { NextRequest, NextResponse } from 'next/server'
import Typesense from 'typesense'
import { createClient } from '@supabase/supabase-js'

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
    console.error('Typesense sync error:', error)
    return NextResponse.json(
      { error: 'Sync failed', details: (error as Error).message }, 
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
    // Öğrenci bilgilerini çek
    const { data: studentData } = await supabase
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
      .eq('id', record.student_id)
      .single()
    
    if (studentData) {
      const fullName = (studentData.profile as any)?.full_name || 'Anonim'
      const totalQuestions = record.total_questions || 0
      const totalCorrect = record.total_correct || 0
      const totalWrong = record.total_wrong || 0
      
      // Leaderboard document
      const leaderboardDoc = {
        id: record.student_id,
        student_id: record.student_id,
        user_id: studentData.user_id || '',
        full_name: fullName,
        avatar_url: (studentData.profile as any)?.avatar_url || '',
        total_points: record.total_points || 0,
        total_questions: totalQuestions,
        total_correct: totalCorrect,
        total_wrong: totalWrong,
        max_streak: record.max_streak || 0,
        current_streak: record.current_streak || 0,
        grade: studentData.grade || 0,
        city_id: studentData.city_id || '',
        city_name: (studentData.city as any)?.name || '',
        district_id: studentData.district_id || '',
        district_name: (studentData.district as any)?.name || '',
        school_id: studentData.school_id || '',
        school_name: (studentData.school as any)?.name || '',
        matematik_points: record.matematik_points || 0,
        turkce_points: record.turkce_points || 0,
        fen_points: record.fen_points || 0,
        inkilap_points: record.inkilap_points || 0,
        din_points: record.din_points || 0,
        ingilizce_points: record.ingilizce_points || 0,
        last_activity_at: record.last_activity_at 
          ? new Date(record.last_activity_at).getTime() 
          : Date.now()
      }
      
      await typesense.collections('leaderboard').documents().upsert(leaderboardDoc)
      console.log(`Leaderboard upserted: ${record.student_id}`)
      
      // Student Stats document
      const studentStatsDoc = {
        id: record.student_id,
        student_id: record.student_id,
        student_name: fullName,
        grade: studentData.grade || 0,
        total_questions: totalQuestions,
        total_correct: totalCorrect,
        total_wrong: totalWrong,
        overall_success_rate: totalQuestions > 0 
          ? (totalCorrect / totalQuestions) * 100 
          : 0,
        total_points: record.total_points || 0,
        current_streak: record.current_streak || 0,
        max_streak: record.max_streak || 0,
        weak_topics: [], // TODO: calculate from student_topic_stats
        strong_topics: [], // TODO: calculate from student_topic_stats
        last_activity_at: record.last_activity_at 
          ? new Date(record.last_activity_at).getTime() 
          : Date.now()
      }
      
      await typesense.collections('student_stats').documents().upsert(studentStatsDoc)
      console.log(`Student stats upserted: ${record.student_id}`)
    }
  }
  
  if (type === 'DELETE') {
    try {
      const studentId = old_record?.student_id || record.student_id
      await typesense.collections('leaderboard').documents(studentId).delete()
      await typesense.collections('student_stats').documents(studentId).delete()
      console.log(`Leaderboard + Student stats deleted: ${studentId}`)
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
    // Aktif değilse silme işlemi yap
    if (!record.is_active) {
      try {
        await typesense.collections('questions').documents(record.id).delete()
        console.log(`Question deleted (inactive): ${record.id}`)
      } catch (e) {
        // Document bulunamadı - sorun yok
      }
      return
    }
    
    // Topic bilgilerini çek
    const { data: topicData } = await supabase
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
    
    if (topicData) {
      const document = {
        id: record.id,
        question_id: record.id,
        question_text: record.question_text || '',
        explanation: record.explanation || '',
        difficulty: record.difficulty || 'medium',
        subject_id: (topicData.subject as any)?.id || '',
        subject_code: (topicData.subject as any)?.code || '',
        subject_name: (topicData.subject as any)?.name || '',
        topic_id: topicData.id,
        main_topic: topicData.main_topic || '',
        sub_topic: topicData.sub_topic || '',
        grade: topicData.grade || 0,
        has_image: !!record.image_url,
        times_answered: record.times_answered || 0,
        times_correct: record.times_correct || 0,
        success_rate: record.times_answered > 0 
          ? (record.times_correct / record.times_answered) * 100 
          : 0,
        created_at: record.created_at 
          ? new Date(record.created_at).getTime() 
          : Date.now()
      }
      
      await typesense.collections('questions').documents().upsert(document)
      console.log(`Question upserted: ${record.id}`)
    }
  }
  
  if (type === 'DELETE') {
    try {
      const questionId = old_record?.id || record.id
      await typesense.collections('questions').documents(questionId).delete()
      console.log(`Question deleted: ${questionId}`)
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
    // Topic bilgilerini çek
    const { data: topicData } = await supabase
      .from('topics')
      .select(`
        id,
        main_topic,
        grade,
        subject:subjects!inner(code, name)
      `)
      .eq('id', record.topic_id)
      .single()
    
    if (topicData) {
      const totalAttempted = record.total_attempted || 0
      const totalCorrect = record.total_correct || 0
      
      const document = {
        id: `${record.student_id}_${record.topic_id}`,
        progress_id: `${record.student_id}_${record.topic_id}`,
        student_id: record.student_id,
        topic_id: record.topic_id,
        subject_code: (topicData.subject as any)?.code || '',
        subject_name: (topicData.subject as any)?.name || '',
        main_topic: topicData.main_topic || '',
        grade: topicData.grade || 0,
        total_attempted: totalAttempted,
        total_correct: totalCorrect,
        success_rate: totalAttempted > 0 
          ? (totalCorrect / totalAttempted) * 100 
          : 0,
        mastery_level: record.mastery_level || 'beginner',
        current_difficulty: record.current_difficulty || 'medium',
        consecutive_correct: record.consecutive_correct || 0,
        last_practiced_at: record.last_attempted_at 
          ? new Date(record.last_attempted_at).getTime() 
          : Date.now()
      }
      
      await typesense.collections('student_topic_progress').documents().upsert(document)
      console.log(`Student topic progress upserted: ${record.student_id}_${record.topic_id}`)
    }
  }
  
  if (type === 'DELETE') {
    try {
      const studentId = old_record?.student_id || record.student_id
      const topicId = old_record?.topic_id || record.topic_id
      await typesense.collections('student_topic_progress').documents(`${studentId}_${topicId}`).delete()
      console.log(`Student topic progress deleted: ${studentId}_${topicId}`)
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
    if (!record.is_active) {
      try {
        await typesense.collections('schools').documents(record.id).delete()
        console.log(`School deleted (inactive): ${record.id}`)
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
    
    if (districtData) {
      const document = {
        id: record.id,
        school_id: record.id,
        name: record.name || '',
        city_id: (districtData.city as any)?.id || '',
        city_name: (districtData.city as any)?.name || '',
        district_id: districtData.id,
        district_name: districtData.name || '',
        school_type: record.school_type || '',
        ownership_type: record.ownership_type || ''
      }
      
      await typesense.collections('schools').documents().upsert(document)
      console.log(`School upserted: ${record.id}`)
    }
  }
  
  if (type === 'DELETE') {
    try {
      const schoolId = old_record?.id || record.id
      await typesense.collections('schools').documents(schoolId).delete()
      console.log(`School deleted: ${schoolId}`)
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
    const document = {
      id: `city_${record.id}`,
      location_id: record.id,
      name: record.name || '',
      type: 'city',
      plate_code: record.plate_code || 0
    }
    
    await typesense.collections('locations').documents().upsert(document)
    console.log(`City upserted: ${record.id}`)
  }
  
  if (type === 'DELETE') {
    try {
      const cityId = old_record?.id || record.id
      await typesense.collections('locations').documents(`city_${cityId}`).delete()
      console.log(`City deleted: ${cityId}`)
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
    // City bilgisini çek
    const { data: cityData } = await supabase
      .from('turkey_cities')
      .select('id, name')
      .eq('id', record.city_id)
      .single()
    
    const document = {
      id: `district_${record.id}`,
      location_id: record.id,
      name: record.name || '',
      type: 'district',
      parent_id: record.city_id || '',
      parent_name: cityData?.name || ''
    }
    
    await typesense.collections('locations').documents().upsert(document)
    console.log(`District upserted: ${record.id}`)
  }
  
  if (type === 'DELETE') {
    try {
      const districtId = old_record?.id || record.id
      await typesense.collections('locations').documents(`district_${districtId}`).delete()
      console.log(`District deleted: ${districtId}`)
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
