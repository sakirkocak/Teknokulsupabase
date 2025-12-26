import { typesenseSearch, COLLECTIONS } from '@/lib/typesense/client'
import { LeaderboardParams, LeaderboardEntry, getSubjectPointsField } from './index'

/**
 * Typesense'den liderlik tablosunu çek
 */
export async function getLeaderboardFromTypesense(
  params: LeaderboardParams
): Promise<LeaderboardEntry[]> {
  const { scope, cityId, districtId, schoolId, grade, subject, limit = 100 } = params
  
  // Filtre oluştur
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
    // turkey scope için filtre yok
  }
  
  // Sıralama alanı
  let sortBy = 'total_points:desc'
  if (subject && subject !== 'general') {
    const pointsField = getSubjectPointsField(subject)
    sortBy = `${pointsField}:desc`
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
      'inkilap_points', 'din_points', 'ingilizce_points'
    ].join(',')
  }
  
  if (filters.length > 0) {
    searchParams.filter_by = filters.join(' && ')
  }
  
  const results = await typesenseSearch
    .collections(COLLECTIONS.LEADERBOARD)
    .documents()
    .search(searchParams)
  
  return results.hits?.map((hit, index) => {
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
  }) || []
}

/**
 * Typesense'den kullanıcının etrafındaki sıralamayı çek
 */
export async function getLeaderboardAroundMeTypesense(
  studentId: string,
  params: LeaderboardParams,
  range: number
): Promise<LeaderboardEntry[]> {
  const { scope, cityId, districtId, schoolId, grade, subject } = params
  
  // Önce kullanıcının puanını öğren
  let studentDoc: any
  try {
    studentDoc = await typesenseSearch
      .collections(COLLECTIONS.LEADERBOARD)
      .documents(studentId)
      .retrieve()
  } catch (e) {
    // Kullanıcı bulunamadı
    return []
  }
  
  // Puan alanını belirle
  const pointsField = subject && subject !== 'general' 
    ? getSubjectPointsField(subject) 
    : 'total_points'
  
  const myPoints = studentDoc[pointsField] || 0
  
  // Filtreler
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
  
  // Puanı yakın olanları bul (±500 puan bandı)
  const minPoints = Math.max(0, myPoints - 500)
  const maxPoints = myPoints + 500
  filters.push(`${pointsField}:>=${minPoints}`)
  filters.push(`${pointsField}:<=${maxPoints}`)
  
  const searchParams: any = {
    q: '*',
    query_by: 'full_name',
    sort_by: `${pointsField}:desc`,
    per_page: 50, // Yeterli sayıda al
    include_fields: [
      'student_id', 'full_name', 'avatar_url', 
      'total_points', 'total_questions', 'total_correct', 'total_wrong',
      'max_streak', 'current_streak', 'grade',
      'city_name', 'district_name', 'school_name'
    ].join(',')
  }
  
  if (filters.length > 0) {
    searchParams.filter_by = filters.join(' && ')
  }
  
  const results = await typesenseSearch
    .collections(COLLECTIONS.LEADERBOARD)
    .documents()
    .search(searchParams)
  
  // Tüm sonuçları dönüştür
  const allEntries = results.hits?.map((hit, index) => {
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
      rank: index + 1,
      is_me: doc.student_id === studentId
    }
  }) || []
  
  // Kullanıcının pozisyonunu bul
  const myIndex = allEntries.findIndex(e => e.is_me)
  
  if (myIndex === -1) {
    return allEntries.slice(0, range * 2 + 1)
  }
  
  // Etrafındaki kişileri seç
  const start = Math.max(0, myIndex - range)
  const end = Math.min(allEntries.length, myIndex + range + 1)
  
  // Rank'leri yeniden hesapla (görünen aralık için)
  return allEntries.slice(start, end).map((entry, idx) => ({
    ...entry,
    rank: start + idx + 1
  }))
}

