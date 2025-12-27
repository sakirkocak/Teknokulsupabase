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

    // Bugünün tarihi (Türkiye saati)
    const todayTR = new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Istanbul' })
    // Format: "2025-12-27"
    
    // Bugün bu öğrencinin çözdüğü soru sayısını al
    const { count: todayQuestionsCount } = await supabase
      .from('point_history')
      .select('*', { count: 'exact', head: true })
      .eq('student_id', studentId)
      .eq('source', 'question')
      .gte('created_at', `${todayTR}T00:00:00+03:00`)
    
    const { count: todayCorrectCount } = await supabase
      .from('point_history')
      .select('*', { count: 'exact', head: true })
      .eq('student_id', studentId)
      .eq('source', 'question')
      .eq('is_correct', true)
      .gte('created_at', `${todayTR}T00:00:00+03:00`)

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
      // Günlük istatistikler
      today_questions: todayQuestionsCount || 0,
      today_correct: todayCorrectCount || 0,
      today_date: todayTR,
      grade: studentData.grade || 0,
      city_id: studentData.city_id || '',
      city_name: (studentData.city as any)?.name || '',
      district_id: studentData.district_id || '',
      district_name: (studentData.district as any)?.name || '',
      school_id: studentData.school_id || '',
      school_name: (studentData.school as any)?.name || '',
      // Ana dersler (LGS/Ortaokul)
      matematik_points: pointsData.matematik_points || 0,
      turkce_points: pointsData.turkce_points || 0,
      fen_points: pointsData.fen_points || 0,
      inkilap_points: pointsData.inkilap_points || 0,
      din_points: pointsData.din_points || 0,
      ingilizce_points: pointsData.ingilizce_points || 0,
      sosyal_points: pointsData.sosyal_points || 0,
      hayat_points: pointsData.hayat_points || 0,
      // Lise dersleri
      edebiyat_points: pointsData.edebiyat_points || 0,
      fizik_points: pointsData.fizik_points || 0,
      kimya_points: pointsData.kimya_points || 0,
      biyoloji_points: pointsData.biyoloji_points || 0,
      tarih_points: pointsData.tarih_points || 0,
      cografya_points: pointsData.cografya_points || 0,
      felsefe_points: pointsData.felsefe_points || 0,
      // Diğer dersler
      gorsel_points: pointsData.gorsel_points || 0,
      muzik_points: pointsData.muzik_points || 0,
      beden_points: pointsData.beden_points || 0,
      bilisim_points: pointsData.bilisim_points || 0,
      teknoloji_points: pointsData.teknoloji_points || 0,
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

