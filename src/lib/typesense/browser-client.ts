import Typesense from 'typesense'
import { Client } from 'typesense'

/**
 * Typesense Browser Client (Client-Side)
 * 
 * ⚡ ŞIMŞEK HIZ! Tarayıcıdan doğrudan Typesense'e istek atar.
 * Search-only API Key kullanır - güvenli!
 * 
 * Kullanıcı (TR) → Typesense (Frankfurt) → Kullanıcı (TR)
 * Beklenen latency: ~30ms
 */

// Environment variables (NEXT_PUBLIC_ prefix ile client'ta erişilebilir)
const TYPESENSE_HOST = process.env.NEXT_PUBLIC_TYPESENSE_HOST || 'kc8bx4n1ldm30q6fp-1.a1.typesense.net'
const TYPESENSE_SEARCH_KEY = process.env.NEXT_PUBLIC_TYPESENSE_SEARCH_KEY || ''

// Client-side Typesense instance (singleton)
let browserClient: Client | null = null

export function getTypesenseBrowserClient(): Client {
  if (browserClient) return browserClient

  browserClient = new Typesense.Client({
    nodes: [{
      host: TYPESENSE_HOST,
      port: 443,
      protocol: 'https'
    }],
    apiKey: TYPESENSE_SEARCH_KEY,
    connectionTimeoutSeconds: 3,
    retryIntervalSeconds: 0.1,
    numRetries: 2
  })

  return browserClient
}

// Collection isimleri
export const COLLECTIONS = {
  LEADERBOARD: 'leaderboard',
  QUESTIONS: 'questions',
  LOCATIONS: 'locations',
  SCHOOLS: 'schools'
} as const

// Typesense aktif mi? (client-side)
export function isTypesenseEnabled(): boolean {
  return !!TYPESENSE_HOST && !!TYPESENSE_SEARCH_KEY
}

// =====================================================
// ⚡ ŞIMŞEK HIZ SORGULARI - Doğrudan tarayıcıdan!
// =====================================================

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
  grade: number
  city_name: string | null
  district_name: string | null
  school_name: string | null
  rank: number
}

export interface LeaderboardFilters {
  scope?: 'turkey' | 'city' | 'district' | 'school'
  cityId?: string | null
  districtId?: string | null
  schoolId?: string | null
  grade?: number | null
  subject?: string | null
  limit?: number
}

/**
 * ⚡ Liderlik tablosu - Doğrudan Typesense'den (~30ms)
 */
export async function getLeaderboardFast(filters: LeaderboardFilters = {}): Promise<{
  data: LeaderboardEntry[]
  total: number
  duration: number
}> {
  const startTime = performance.now()
  const client = getTypesenseBrowserClient()
  
  const {
    scope = 'turkey',
    cityId,
    districtId,
    schoolId,
    grade,
    subject,
    limit = 100
  } = filters

  // Filter oluştur
  const filterParts: string[] = []
  
  if (scope === 'city' && cityId) {
    filterParts.push(`city_id:=${cityId}`)
  }
  if (scope === 'district' && districtId) {
    filterParts.push(`district_id:=${districtId}`)
  }
  if (scope === 'school' && schoolId) {
    filterParts.push(`school_id:=${schoolId}`)
  }
  if (grade) {
    filterParts.push(`grade:=${grade}`)
  }

  // Sort field
  let sortBy = 'total_points:desc'
  if (subject && subject !== 'general') {
    const subjectField = `${subject}_points`
    sortBy = `${subjectField}:desc`
  }

  try {
    const result = await client
      .collections(COLLECTIONS.LEADERBOARD)
      .documents()
      .search({
        q: '*',
        query_by: 'full_name',
        filter_by: filterParts.length > 0 ? filterParts.join(' && ') : undefined,
        sort_by: sortBy,
        per_page: limit,
        include_fields: 'student_id,full_name,avatar_url,total_points,total_questions,total_correct,total_wrong,max_streak,current_streak,grade,city_name,district_name,school_name'
      })

    const data: LeaderboardEntry[] = (result.hits || []).map((hit, index) => {
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
        grade: doc.grade || 0,
        city_name: doc.city_name || null,
        district_name: doc.district_name || null,
        school_name: doc.school_name || null,
        rank: index + 1
      }
    })

    const duration = Math.round(performance.now() - startTime)
    console.log(`⚡ Leaderboard (browser): ${duration}ms, ${data.length} entries`)

    return { data, total: result.found || 0, duration }
  } catch (error) {
    console.error('Typesense browser error:', error)
    throw error
  }
}

export interface StatsResult {
  totalQuestions: number
  activeStudents: number
  bySubject: Array<{
    subject_code: string
    subject_name: string
    count: number
  }>
  byGrade: Array<{
    grade: number
    count: number
  }>
  duration: number
}

/**
 * ⚡ İstatistikler - Doğrudan Typesense'den (~30ms)
 */
export async function getStatsFast(): Promise<StatsResult> {
  const startTime = performance.now()
  const client = getTypesenseBrowserClient()

  try {
    // Paralel sorgular
    const [questionsResult, leaderboardResult] = await Promise.all([
      client
        .collections(COLLECTIONS.QUESTIONS)
        .documents()
        .search({
          q: '*',
          query_by: 'question_text',
          per_page: 0,
          facet_by: 'subject_code,subject_name,grade',
          max_facet_values: 50
        }),
      client
        .collections(COLLECTIONS.LEADERBOARD)
        .documents()
        .search({
          q: '*',
          query_by: 'full_name',
          per_page: 0
        })
    ])

    const facets = questionsResult.facet_counts || []
    const subjectFacet = facets.find((f: any) => f.field_name === 'subject_code')
    const subjectNameFacet = facets.find((f: any) => f.field_name === 'subject_name')
    const gradeFacet = facets.find((f: any) => f.field_name === 'grade')

    const bySubject = (subjectFacet?.counts || []).map((item: any, idx: number) => ({
      subject_code: item.value,
      subject_name: subjectNameFacet?.counts?.[idx]?.value || item.value,
      count: item.count
    }))

    const byGrade = (gradeFacet?.counts || [])
      .map((item: any) => ({
        grade: parseInt(item.value),
        count: item.count
      }))
      .sort((a: any, b: any) => a.grade - b.grade)

    const duration = Math.round(performance.now() - startTime)
    console.log(`⚡ Stats (browser): ${duration}ms`)

    return {
      totalQuestions: questionsResult.found || 0,
      activeStudents: leaderboardResult.found || 0,
      bySubject,
      byGrade,
      duration
    }
  } catch (error) {
    console.error('Typesense browser stats error:', error)
    throw error
  }
}

/**
 * ⚡ Soru arama - Doğrudan Typesense'den (~20ms)
 */
export async function searchQuestionsFast(
  query: string,
  filters: {
    grade?: number
    subjectCode?: string
    difficulty?: string
    limit?: number
  } = {}
): Promise<{
  results: Array<{
    question_id: string
    question_text: string
    highlight: string
    subject_name: string
    subject_code: string
    grade: number
    main_topic: string
    difficulty: string
  }>
  total: number
  duration: number
}> {
  const startTime = performance.now()
  
  if (!query || query.length < 2) {
    return { results: [], total: 0, duration: 0 }
  }

  const client = getTypesenseBrowserClient()
  const { grade, subjectCode, difficulty, limit = 10 } = filters

  const filterParts: string[] = []
  if (grade) filterParts.push(`grade:=${grade}`)
  if (subjectCode) filterParts.push(`subject_code:=${subjectCode}`)
  if (difficulty) filterParts.push(`difficulty:=${difficulty}`)

  try {
    const result = await client
      .collections(COLLECTIONS.QUESTIONS)
      .documents()
      .search({
        q: query,
        query_by: 'question_text,main_topic,sub_topic',
        filter_by: filterParts.length > 0 ? filterParts.join(' && ') : undefined,
        sort_by: 'times_answered:desc',
        per_page: limit,
        highlight_full_fields: 'question_text',
        num_typos: 2
      })

    const results = (result.hits || []).map(hit => {
      const doc = hit.document as any
      return {
        question_id: doc.question_id,
        question_text: doc.question_text,
        highlight: (hit.highlight as any)?.question_text?.snippet || doc.question_text,
        subject_name: doc.subject_name,
        subject_code: doc.subject_code,
        grade: doc.grade,
        main_topic: doc.main_topic,
        difficulty: doc.difficulty
      }
    })

    const duration = Math.round(performance.now() - startTime)
    console.log(`⚡ Search (browser): ${duration}ms, "${query}", ${results.length} results`)

    return { results, total: result.found || 0, duration }
  } catch (error) {
    console.error('Typesense browser search error:', error)
    throw error
  }
}

// =====================================================
// 🗺️ LOKASYON SORGULARI - İl/İlçe/Okul
// =====================================================

export interface LocationEntry {
  location_id: string
  name: string
  type: 'city' | 'district'
  parent_id?: string
  plate_code?: number
}

export interface SchoolEntry {
  school_id: string
  name: string
  city_id: string
  city_name: string
  district_id: string
  district_name: string
  school_type?: string
}

/**
 * ⚡ Tüm illeri getir - Typesense'den (~20ms)
 */
export async function getCitiesFast(): Promise<{
  data: LocationEntry[]
  duration: number
}> {
  const startTime = performance.now()
  const client = getTypesenseBrowserClient()

  try {
    const result = await client
      .collections(COLLECTIONS.LOCATIONS)
      .documents()
      .search({
        q: '*',
        query_by: 'name',
        filter_by: 'type:=city',
        sort_by: 'name:asc',
        per_page: 100
      })

    const data: LocationEntry[] = (result.hits || []).map(hit => {
      const doc = hit.document as any
      return {
        location_id: doc.location_id || doc.id,
        name: doc.name,
        type: 'city' as const,
        plate_code: doc.plate_code
      }
    })

    const duration = Math.round(performance.now() - startTime)
    console.log(`⚡ Cities (browser): ${duration}ms, ${data.length} cities`)

    return { data, duration }
  } catch (error) {
    console.error('Typesense cities error:', error)
    throw error
  }
}

/**
 * ⚡ Bir ilin ilçelerini getir - Typesense'den (~15ms)
 */
export async function getDistrictsFast(cityId: string): Promise<{
  data: LocationEntry[]
  duration: number
}> {
  const startTime = performance.now()
  const client = getTypesenseBrowserClient()

  try {
    const result = await client
      .collections(COLLECTIONS.LOCATIONS)
      .documents()
      .search({
        q: '*',
        query_by: 'name',
        filter_by: `type:=district && parent_id:=${cityId}`,
        sort_by: 'name:asc',
        per_page: 100
      })

    const data: LocationEntry[] = (result.hits || []).map(hit => {
      const doc = hit.document as any
      return {
        location_id: doc.location_id || doc.id,
        name: doc.name,
        type: 'district' as const,
        parent_id: doc.parent_id
      }
    })

    const duration = Math.round(performance.now() - startTime)
    console.log(`⚡ Districts (browser): ${duration}ms, ${data.length} districts for city ${cityId}`)

    return { data, duration }
  } catch (error) {
    console.error('Typesense districts error:', error)
    throw error
  }
}

/**
 * ⚡ Bir ilçenin okullarını getir - Typesense'den (~20ms)
 */
export async function getSchoolsFast(districtId: string): Promise<{
  data: SchoolEntry[]
  duration: number
}> {
  const startTime = performance.now()
  const client = getTypesenseBrowserClient()

  try {
    const result = await client
      .collections(COLLECTIONS.SCHOOLS)
      .documents()
      .search({
        q: '*',
        query_by: 'name',
        filter_by: `district_id:=${districtId}`,
        sort_by: 'name:asc',
        per_page: 250
      })

    const data: SchoolEntry[] = (result.hits || []).map(hit => {
      const doc = hit.document as any
      return {
        school_id: doc.school_id || doc.id,
        name: doc.name,
        city_id: doc.city_id,
        city_name: doc.city_name,
        district_id: doc.district_id,
        district_name: doc.district_name,
        school_type: doc.school_type
      }
    })

    const duration = Math.round(performance.now() - startTime)
    console.log(`⚡ Schools (browser): ${duration}ms, ${data.length} schools for district ${districtId}`)

    return { data, duration }
  } catch (error) {
    console.error('Typesense schools error:', error)
    throw error
  }
}

/**
 * ⚡ Okul arama (autocomplete) - Typesense'den (~15ms)
 */
export async function searchSchoolsFast(
  query: string,
  filters: { cityId?: string; districtId?: string } = {}
): Promise<{
  data: SchoolEntry[]
  duration: number
}> {
  const startTime = performance.now()
  const client = getTypesenseBrowserClient()

  const filterParts: string[] = []
  if (filters.cityId) filterParts.push(`city_id:=${filters.cityId}`)
  if (filters.districtId) filterParts.push(`district_id:=${filters.districtId}`)

  try {
    const result = await client
      .collections(COLLECTIONS.SCHOOLS)
      .documents()
      .search({
        q: query || '*',
        query_by: 'name',
        filter_by: filterParts.length > 0 ? filterParts.join(' && ') : undefined,
        sort_by: query ? '_text_match:desc' : 'name:asc',
        per_page: 20,
        num_typos: 2
      })

    const data: SchoolEntry[] = (result.hits || []).map(hit => {
      const doc = hit.document as any
      return {
        school_id: doc.school_id || doc.id,
        name: doc.name,
        city_id: doc.city_id,
        city_name: doc.city_name,
        district_id: doc.district_id,
        district_name: doc.district_name,
        school_type: doc.school_type
      }
    })

    const duration = Math.round(performance.now() - startTime)
    console.log(`⚡ School search (browser): ${duration}ms, "${query}", ${data.length} results`)

    return { data, duration }
  } catch (error) {
    console.error('Typesense school search error:', error)
    throw error
  }
}

// =====================================================
// 🏆 DERS BAZLI LİDERLİK
// =====================================================

export interface SubjectLeaderEntry extends LeaderboardEntry {
  subject_points: number
}

/**
 * ⚡ Ders bazlı liderlik tablosu - Typesense'den (~30ms)
 */
export async function getSubjectLeaderboardFast(
  subjectCode: string,
  filters: Omit<LeaderboardFilters, 'subject'> = {}
): Promise<{
  data: SubjectLeaderEntry[]
  total: number
  duration: number
}> {
  const startTime = performance.now()
  const client = getTypesenseBrowserClient()

  const {
    scope = 'turkey',
    cityId,
    districtId,
    schoolId,
    grade,
    limit = 100
  } = filters

  // Filter oluştur
  const filterParts: string[] = []
  
  if (scope === 'city' && cityId) {
    filterParts.push(`city_id:=${cityId}`)
  }
  if (scope === 'district' && districtId) {
    filterParts.push(`district_id:=${districtId}`)
  }
  if (scope === 'school' && schoolId) {
    filterParts.push(`school_id:=${schoolId}`)
  }
  if (grade) {
    filterParts.push(`grade:=${grade}`)
  }

  // Ders puanı alanı
  const subjectPointsField = `${subjectCode}_points`
  
  // Sadece bu derste puanı olanları getir
  filterParts.push(`${subjectPointsField}:>0`)

  try {
    const result = await client
      .collections(COLLECTIONS.LEADERBOARD)
      .documents()
      .search({
        q: '*',
        query_by: 'full_name',
        filter_by: filterParts.join(' && '),
        sort_by: `${subjectPointsField}:desc`,
        per_page: limit,
        include_fields: `student_id,full_name,avatar_url,total_points,total_questions,total_correct,total_wrong,max_streak,current_streak,grade,city_name,district_name,school_name,${subjectPointsField}`
      })

    const data: SubjectLeaderEntry[] = (result.hits || []).map((hit, index) => {
      const doc = hit.document as any
      return {
        student_id: doc.student_id,
        full_name: doc.full_name || 'Anonim',
        avatar_url: doc.avatar_url || null,
        total_points: doc[subjectPointsField] || 0, // Ders puanını total_points olarak göster
        subject_points: doc[subjectPointsField] || 0,
        total_questions: doc.total_questions || 0,
        total_correct: doc.total_correct || 0,
        total_wrong: doc.total_wrong || 0,
        max_streak: doc.max_streak || 0,
        current_streak: doc.current_streak || 0,
        grade: doc.grade || 0,
        city_name: doc.city_name || null,
        district_name: doc.district_name || null,
        school_name: doc.school_name || null,
        rank: index + 1
      }
    })

    const duration = Math.round(performance.now() - startTime)
    console.log(`⚡ Subject Leaderboard (browser): ${duration}ms, ${subjectCode}, ${data.length} entries`)

    return { data, total: result.found || 0, duration }
  } catch (error) {
    console.error('Typesense subject leaderboard error:', error)
    throw error
  }
}

