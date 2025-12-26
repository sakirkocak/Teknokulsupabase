import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Typesense from 'typesense'

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

/**
 * POST /api/typesense/sync-student
 * Öğrenci puanlarını Typesense'e senkronize eder
 */
export async function POST(req: NextRequest) {
  const startTime = Date.now()
  
  try {
    const { studentId } = await req.json()
    
    if (!studentId) {
      return NextResponse.json({ error: 'studentId gerekli' }, { status: 400 })
    }

    // Öğrenci bilgilerini ve puanlarını çek
    const { data: pointsData, error: pointsError } = await supabase
      .from('student_points')
      .select('*')
      .eq('student_id', studentId)
      .single()

    if (pointsError || !pointsData) {
      console.log('Student points bulunamadı:', studentId)
      return NextResponse.json({ error: 'Öğrenci puanı bulunamadı' }, { status: 404 })
    }

    // Öğrenci profil bilgilerini çek
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
      .eq('id', studentId)
      .single()

    if (!studentData) {
      return NextResponse.json({ error: 'Öğrenci profili bulunamadı' }, { status: 404 })
    }

    // Typesense dokümanı oluştur
    const document = {
      id: studentId,
      student_id: studentId,
      user_id: studentData.user_id || '',
      full_name: (studentData.profile as any)?.full_name || 'Anonim',
      avatar_url: (studentData.profile as any)?.avatar_url || '',
      total_points: pointsData.total_points || 0,
      total_questions: pointsData.total_questions || 0,
      total_correct: pointsData.total_correct || 0,
      total_wrong: pointsData.total_wrong || 0,
      max_streak: pointsData.max_streak || 0,
      current_streak: pointsData.current_streak || 0,
      grade: studentData.grade || 0,
      city_id: studentData.city_id || '',
      city_name: (studentData.city as any)?.name || '',
      district_id: studentData.district_id || '',
      district_name: (studentData.district as any)?.name || '',
      school_id: studentData.school_id || '',
      school_name: (studentData.school as any)?.name || '',
      matematik_points: pointsData.matematik_points || 0,
      turkce_points: pointsData.turkce_points || 0,
      fen_points: pointsData.fen_points || 0,
      inkilap_points: pointsData.inkilap_points || 0,
      din_points: pointsData.din_points || 0,
      ingilizce_points: pointsData.ingilizce_points || 0,
      last_activity_at: pointsData.last_activity_at 
        ? new Date(pointsData.last_activity_at).getTime() 
        : Date.now()
    }

    // Typesense'e upsert
    await typesense.collections('leaderboard').documents().upsert(document)
    
    const duration = Date.now() - startTime
    console.log(`⚡ Typesense sync: ${studentId} - ${duration}ms`)

    return NextResponse.json({ 
      success: true, 
      duration,
      points: pointsData.total_points 
    })

  } catch (error) {
    console.error('Typesense sync hatası:', error)
    return NextResponse.json(
      { error: 'Sync başarısız', details: (error as Error).message }, 
      { status: 500 }
    )
  }
}

