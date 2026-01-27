import { NextRequest, NextResponse } from 'next/server'
import { typesenseClient, isTypesenseAvailable, COLLECTIONS } from '@/lib/typesense/client'
import { createClient } from '@supabase/supabase-js'

// Supabase service role client (server-side)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// In-memory cache (query bazlı)
const leaderboardCache = new Map<string, { data: any; timestamp: number }>()
const CACHE_TTL = 30 * 1000 // 30 saniye (leaderboard daha dinamik)

export interface LeaderboardEntry {
  student_id: string
  full_name: string
  avatar_url: string | null
  total_points: number
  total_questions: number
  total_correct: number
  total_wrong: number
  max_streak: number
  current_streak: number
  success_rate: number
  grade: number
  city_name: string | null
  district_name: string | null
  school_name: string | null
  rank: number
}

/**
 * GET /api/leaderboard
 * 
 * Query Parameters:
 * - scope: 'turkey' | 'city' | 'district' | 'school' (default: 'turkey')
 * - cityId: string (required for city/district/school scope)
 * - districtId: string (required for district/school scope)
 * - schoolId: string (required for school scope)
 * - grade: number (optional filter)
 * - subject: string (optional, for subject-specific leaderboard)
 * - limit: number (default: 100)
 */
export async function GET(req: NextRequest) {
  const startTime = Date.now()
  const { searchParams } = new URL(req.url)
  
  const scope = searchParams.get('scope') || 'turkey'
  const cityId = searchParams.get('cityId')
  const districtId = searchParams.get('districtId')
  const schoolId = searchParams.get('schoolId')
  const grade = searchParams.get('grade')
  const subject = searchParams.get('subject')
  const limit = parseInt(searchParams.get('limit') || '100')

  // ⚡ CACHE KEY - parametrelere göre unique key
  const cacheKey = `${scope}-${cityId}-${districtId}-${schoolId}-${grade}-${subject}-${limit}`
  const now = Date.now()
  const cached = leaderboardCache.get(cacheKey)
  
  if (cached && (now - cached.timestamp) < CACHE_TTL) {
    const duration = Date.now() - startTime
    console.log(`⚡ Leaderboard from CACHE: ${duration}ms (${Math.round((now - cached.timestamp) / 1000)}s old)`)
    
    return new NextResponse(JSON.stringify({
      ...cached.data,
      source: 'cache',
      duration,
      cacheAge: Math.round((now - cached.timestamp) / 1000)
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60'
      }
    })
  }

  try {
    // Typesense kullanilabilir mi kontrol et
    if (isTypesenseAvailable()) {
      const result = await getLeaderboardFromTypesense({
        scope, cityId, districtId, schoolId, grade, subject, limit
      })
      
      // Cache'e kaydet
      leaderboardCache.set(cacheKey, { 
        data: { data: result }, 
        timestamp: now 
      })
      
      const duration = Date.now() - startTime
      console.log(`⚡ Leaderboard from Typesense: ${duration}ms, ${result.length} entries`)
      
      return new NextResponse(JSON.stringify({
        data: result,
        source: 'typesense',
        duration
      }), {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60'
        }
      })
    }
    
    // Fallback to Supabase
    const result = await getLeaderboardFromSupabase({
      scope, cityId, districtId, schoolId, grade, limit
    })
    
    // Cache'e kaydet
    leaderboardCache.set(cacheKey, { 
      data: { data: result }, 
      timestamp: now 
    })
    
    const duration = Date.now() - startTime
    console.log(`📊 Leaderboard from Supabase: ${duration}ms, ${result.length} entries`)
    
    return new NextResponse(JSON.stringify({
      data: result,
      source: 'supabase',
      duration
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60'
      }
    })
    
  } catch (error) {
    console.error('Leaderboard error:', error)
    
    // Typesense hata verdiyse Supabase'e fallback
    try {
      const result = await getLeaderboardFromSupabase({
        scope, cityId, districtId, schoolId, grade, limit
      })
      
      const duration = Date.now() - startTime
      console.log(`📊 Leaderboard fallback to Supabase: ${duration}ms`)
      
      return NextResponse.json({
        data: result,
        source: 'supabase_fallback',
        duration
      })
    } catch (fallbackError) {
      return NextResponse.json(
        { error: 'Liderlik tablosu yuklenemedi', details: (fallbackError as Error).message },
        { status: 500 }
      )
    }
  }
}

// Typesense'den liderlik tablosu
async function getLeaderboardFromTypesense(params: {
  scope: string
  cityId: string | null
  districtId: string | null
  schoolId: string | null
  grade: string | null
  subject: string | null
  limit: number
}): Promise<LeaderboardEntry[]> {
  const { scope, cityId, districtId, schoolId, grade, subject, limit } = params
  
  // Filtre olustur
  const filters: string[] = []
  
  if (grade) {
    filters.push(`grade:=${grade}`)
  }
  
  switch (scope) {
    case 'city':
      if (cityId) filters.push(`city_id:=${cityId}`)
      break
    case 'district':
      if (districtId) filters.push(`district_id:=${districtId}`)
      break
    case 'school':
      if (schoolId) filters.push(`school_id:=${schoolId}`)
      break
  }
  
  // Siralama alani
  let sortBy = 'total_points:desc'
  if (subject && subject !== 'genel') {
    const subjectMap: Record<string, string> = {
      'matematik': 'matematik_points',
      'turkce': 'turkce_points',
      'fen_bilimleri': 'fen_points',
      'inkilap_tarihi': 'inkilap_points',
      'din_kulturu': 'din_points',
      'ingilizce': 'ingilizce_points',
      'sosyal_bilgiler': 'sosyal_points',
      'hayat_bilgisi': 'hayat_points',
      'edebiyat': 'edebiyat_points',
      'fizik': 'fizik_points',
      'kimya': 'kimya_points',
      'biyoloji': 'biyoloji_points',
      'tarih': 'tarih_points',
      'cografya': 'cografya_points',
      'felsefe': 'felsefe_points',
      'gorsel_sanatlar': 'gorsel_points',
      'muzik': 'muzik_points',
      'beden_egitimi': 'beden_points',
      'bilisim': 'bilisim_points',
      'teknoloji_tasarim': 'teknoloji_points'
    }
    const pointsField = subjectMap[subject]
    if (pointsField) {
      sortBy = `${pointsField}:desc`
    }
  }
  
  const searchParams: any = {
    q: '*',
    query_by: 'full_name',
    sort_by: sortBy,
    per_page: limit,
    include_fields: [
      'student_id', 'full_name', 'avatar_url',
      'total_points', 'total_questions', 'total_correct', 'total_wrong',
      'max_streak', 'current_streak', 'grade',
      'city_name', 'district_name', 'school_name',
      'matematik_points', 'turkce_points', 'fen_points',
      'inkilap_points', 'din_points', 'ingilizce_points',
      'sosyal_points', 'hayat_points', 'edebiyat_points',
      'fizik_points', 'kimya_points', 'biyoloji_points',
      'tarih_points', 'cografya_points', 'felsefe_points',
      'gorsel_points', 'muzik_points', 'beden_points',
      'bilisim_points', 'teknoloji_points'
    ].join(',')
  }
  
  if (filters.length > 0) {
    searchParams.filter_by = filters.join(' && ')
  }
  
  const results = await typesenseClient
    .collections(COLLECTIONS.LEADERBOARD)
    .documents()
    .search(searchParams)
  
  return (results.hits || []).map((hit, index) => {
    const doc = hit.document as any
    return {
      student_id: doc.student_id,
      full_name: doc.full_name || 'Anonim',
      avatar_url: doc.avatar_url || null,
      total_points: doc.total_points || 0,
      total_questions: doc.total_questions || 0,
      total_correct: doc.total_correct || 0,
      total_wrong: doc.total_wrong || 0,
      max_streak: doc.max_streak || 0,
      current_streak: doc.current_streak || 0,
      success_rate: doc.total_questions > 0
        ? Math.round((doc.total_correct / doc.total_questions) * 100)
        : 0,
      grade: doc.grade || 0,
      city_name: doc.city_name || null,
      district_name: doc.district_name || null,
      school_name: doc.school_name || null,
      rank: index + 1
    }
  })
}

// Supabase'den liderlik tablosu (fallback)
async function getLeaderboardFromSupabase(params: {
  scope: string
  cityId: string | null
  districtId: string | null
  schoolId: string | null
  grade: string | null
  limit: number
}): Promise<LeaderboardEntry[]> {
  const { scope, cityId, districtId, schoolId, grade, limit } = params
  
  const { data } = await supabase
    .from('student_points')
    .select(`
      student_id,
      total_points,
      total_questions,
      total_correct,
      total_wrong,
      max_streak,
      current_streak,
      student:student_profiles!student_points_student_id_fkey(
        user_id,
        grade,
        city_id,
        district_id,
        school_id,
        profile:profiles!student_profiles_user_id_fkey(full_name, avatar_url),
        city:turkey_cities!student_profiles_city_id_fkey(name),
        district:turkey_districts!student_profiles_district_id_fkey(name),
        school:schools!student_profiles_school_id_fkey(name)
      )
    `)
    .gt('total_questions', 0)
    .order('total_points', { ascending: false })
    .limit(limit)

  if (!data) return []

  let filteredData = data

  // Scope'a gore filtrele
  if (scope === 'city' && cityId) {
    filteredData = filteredData.filter((item: any) => item.student?.city_id === cityId)
  } else if (scope === 'district' && districtId) {
    filteredData = filteredData.filter((item: any) => item.student?.district_id === districtId)
  } else if (scope === 'school' && schoolId) {
    filteredData = filteredData.filter((item: any) => item.student?.school_id === schoolId)
  }

  // Sinif filtrelemesi
  if (grade) {
    const gradeNum = parseInt(grade)
    filteredData = filteredData.filter((item: any) => item.student?.grade === gradeNum)
  }

  return filteredData.map((item: any, index: number) => ({
    student_id: item.student_id,
    full_name: item.student?.profile?.full_name || 'Anonim',
    avatar_url: item.student?.profile?.avatar_url || null,
    grade: item.student?.grade || 0,
    city_name: item.student?.city?.name || null,
    district_name: item.student?.district?.name || null,
    school_name: item.student?.school?.name || null,
    total_points: item.total_points,
    total_questions: item.total_questions,
    total_correct: item.total_correct,
    total_wrong: item.total_wrong,
    max_streak: item.max_streak || 0,
    current_streak: item.current_streak || 0,
    success_rate: item.total_questions > 0
      ? Math.round((item.total_correct / item.total_questions) * 100)
      : 0,
    rank: index + 1,
  }))
}

