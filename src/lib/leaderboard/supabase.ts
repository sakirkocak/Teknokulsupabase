import { createClient } from '@/lib/supabase/client'
import { LeaderboardParams, LeaderboardEntry, getSubjectPointsField } from './index'

/**
 * Supabase'den liderlik tablosunu çek
 */
export async function getLeaderboardFromSupabase(
  params: LeaderboardParams
): Promise<LeaderboardEntry[]> {
  const supabase = createClient()
  
  const { scope, cityId, districtId, schoolId, classroomId, grade, subject, limit = 100 } = params
  
  // Ders bazlı sıralama için uygun RPC fonksiyonunu seç
  let rpcFunction: string
  let rpcParams: Record<string, any> = {}
  
  switch (scope) {
    case 'school':
      rpcFunction = 'get_leaderboard_by_school'
      rpcParams = { p_school_id: schoolId }
      break
    case 'district':
      rpcFunction = 'get_leaderboard_by_district'
      rpcParams = { p_district_id: districtId }
      break
    case 'city':
      rpcFunction = 'get_leaderboard_by_city'
      rpcParams = { p_city_id: cityId }
      break
    case 'classroom':
      rpcFunction = 'get_leaderboard_by_classroom'
      rpcParams = { p_classroom_id: classroomId }
      break
    default:
      rpcFunction = 'get_leaderboard_turkey'
  }
  
  // Sınıf ve limit ekle
  if (grade) rpcParams.p_grade = grade
  rpcParams.p_limit = limit
  
  const { data, error } = await supabase.rpc(rpcFunction, rpcParams)
  
  if (error) {
    console.error('Supabase leaderboard error:', error)
    throw error
  }
  
  // Ders bazlı sıralama gerekiyorsa client-side sırala
  let results = data || []
  
  if (subject && subject !== 'general') {
    const pointsField = getSubjectPointsField(subject)
    results = results.sort((a: any, b: any) => 
      (b[pointsField] || 0) - (a[pointsField] || 0)
    )
  }
  
  return results.map((entry: any, index: number) => ({
    student_id: entry.student_id,
    full_name: entry.full_name || 'Anonim',
    avatar_url: entry.avatar_url,
    total_points: entry.total_points || 0,
    total_questions: entry.total_questions || 0,
    total_correct: entry.total_correct || 0,
    total_wrong: entry.total_wrong || 0,
    max_streak: entry.max_streak || 0,
    current_streak: entry.current_streak || 0,
    success_rate: entry.total_questions > 0 
      ? Math.round((entry.total_correct / entry.total_questions) * 100)
      : 0,
    grade: entry.grade || 0,
    city_name: entry.city_name,
    district_name: entry.district_name,
    school_name: entry.school_name,
    rank: index + 1
  }))
}

/**
 * Supabase'den kullanıcının etrafındaki sıralamayı çek
 */
export async function getLeaderboardAroundMeSupabase(
  studentId: string,
  params: LeaderboardParams,
  range: number
): Promise<LeaderboardEntry[]> {
  // Önce tüm listeyi al
  const allEntries = await getLeaderboardFromSupabase({
    ...params,
    limit: 1000 // Daha geniş bir liste al
  })
  
  // Kullanıcının pozisyonunu bul
  const myIndex = allEntries.findIndex(e => e.student_id === studentId)
  
  if (myIndex === -1) {
    // Kullanıcı listede yok - boş döndür
    return []
  }
  
  // Etrafındaki kişileri seç
  const start = Math.max(0, myIndex - range)
  const end = Math.min(allEntries.length, myIndex + range + 1)
  
  return allEntries.slice(start, end).map(entry => ({
    ...entry,
    is_me: entry.student_id === studentId
  }))
}

