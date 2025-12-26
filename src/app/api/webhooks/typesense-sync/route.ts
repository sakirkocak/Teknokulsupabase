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
    
    // student_points tablosu için sync
    if (table === 'student_points') {
      await handleStudentPointsSync(type, record, old_record)
    }
    
    // questions tablosu için sync
    if (table === 'questions') {
      await handleQuestionsSync(type, record, old_record)
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
      const document = {
        id: record.student_id,
        student_id: record.student_id,
        user_id: studentData.user_id || '',
        full_name: (studentData.profile as any)?.full_name || 'Anonim',
        avatar_url: (studentData.profile as any)?.avatar_url || '',
        total_points: record.total_points || 0,
        total_questions: record.total_questions || 0,
        total_correct: record.total_correct || 0,
        total_wrong: record.total_wrong || 0,
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
      
      await typesense.collections('leaderboard').documents().upsert(document)
      console.log(`Leaderboard upserted: ${record.student_id}`)
    }
  }
  
  if (type === 'DELETE') {
    try {
      const studentId = old_record?.student_id || record.student_id
      await typesense.collections('leaderboard').documents(studentId).delete()
      console.log(`Leaderboard deleted: ${studentId}`)
    } catch (e) {
      // Document bulunamadı - sorun yok
    }
  }
}

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

// Health check endpoint
export async function GET() {
  try {
    const health = await typesense.health.retrieve()
    return NextResponse.json({ 
      status: 'ok', 
      typesense: health.ok ? 'healthy' : 'unhealthy' 
    })
  } catch (error) {
    return NextResponse.json({ 
      status: 'error', 
      message: (error as Error).message 
    }, { status: 500 })
  }
}

