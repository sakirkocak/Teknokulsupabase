import { USE_TYPESENSE } from '@/lib/typesense/client'
import { getLeaderboardFromSupabase, getLeaderboardAroundMeSupabase } from './supabase'
import { getLeaderboardFromTypesense, getLeaderboardAroundMeTypesense } from './typesense'

export interface LeaderboardParams {
  scope: 'turkey' | 'city' | 'district' | 'school' | 'classroom'
  cityId?: string
  districtId?: string
  schoolId?: string
  classroomId?: string
  grade?: number
  subject?: string
  limit?: number
}

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
  is_me?: boolean
}

/**
 * Liderlik tablosunu getir
 * Feature flag'e göre Typesense veya Supabase'den veri çeker
 */
export async function getLeaderboard(params: LeaderboardParams): Promise<LeaderboardEntry[]> {
  try {
    if (USE_TYPESENSE) {
      return await getLeaderboardFromTypesense(params)
    }
    return await getLeaderboardFromSupabase(params)
  } catch (error) {
    console.error('Leaderboard error:', error)
    // Typesense başarısız olursa Supabase'e fallback
    if (USE_TYPESENSE) {
      console.log('Falling back to Supabase...')
      return await getLeaderboardFromSupabase(params)
    }
    throw error
  }
}

/**
 * Kullanıcının etrafındaki sıralamayı getir (yakınındakiler modu)
 */
export async function getLeaderboardAroundMe(
  studentId: string, 
  params: LeaderboardParams,
  range: number = 3
): Promise<LeaderboardEntry[]> {
  try {
    if (USE_TYPESENSE) {
      return await getLeaderboardAroundMeTypesense(studentId, params, range)
    }
    return await getLeaderboardAroundMeSupabase(studentId, params, range)
  } catch (error) {
    console.error('LeaderboardAroundMe error:', error)
    // Typesense başarısız olursa Supabase'e fallback
    if (USE_TYPESENSE) {
      console.log('Falling back to Supabase...')
      return await getLeaderboardAroundMeSupabase(studentId, params, range)
    }
    throw error
  }
}

/**
 * Ders bazlı puan alanı adını döndür
 */
export function getSubjectPointsField(subject: string): string {
  const subjectMap: Record<string, string> = {
    'matematik': 'matematik_points',
    'turkce': 'turkce_points',
    'fen': 'fen_points',
    'inkilap': 'inkilap_points',
    'din': 'din_points',
    'ingilizce': 'ingilizce_points'
  }
  return subjectMap[subject] || 'total_points'
}

