import { NextRequest, NextResponse } from 'next/server'
import { typesenseClient, isTypesenseAvailable, COLLECTIONS } from '@/lib/typesense/client'
import { createClient } from '@supabase/supabase-js'

// Supabase service role client (server-side)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export interface SubjectStats {
  code: string
  name: string
  questionCount: number
  topicCount: number
  grades: number[]
}

export interface QuestionsStatsResponse {
  totalQuestions: number
  totalTopics: number
  totalSubjects: number
  subjects: SubjectStats[]
  source: string
  duration: number
}

/**
 * GET /api/questions/stats
 * 
 * Soru bankası istatistiklerini döndürür
 * Typesense facet sorgusu ile ışık hızında!
 */
export async function GET(req: NextRequest) {
  const startTime = Date.now()

  try {
    if (isTypesenseAvailable()) {
      const result = await getStatsFromTypesense()
      const duration = Date.now() - startTime
      console.log(`⚡ Questions stats from Typesense: ${duration}ms`)
      
      return NextResponse.json({
        ...result,
        source: 'typesense',
        duration
      })
    }

    // Fallback to Supabase
    const result = await getStatsFromSupabase()
    const duration = Date.now() - startTime
    console.log(`📊 Questions stats from Supabase: ${duration}ms`)
    
    return NextResponse.json({
      ...result,
      source: 'supabase',
      duration
    })

  } catch (error) {
    console.error('Questions stats error:', error)
    
    // Typesense hata verdiyse Supabase'e fallback
    try {
      const result = await getStatsFromSupabase()
      const duration = Date.now() - startTime
      
      return NextResponse.json({
        ...result,
        source: 'supabase_fallback',
        duration
      })
    } catch (fallbackError) {
      return NextResponse.json(
        { error: 'İstatistikler yüklenemedi', details: (fallbackError as Error).message },
        { status: 500 }
      )
    }
  }
}

// Typesense'den istatistikler - TEK SORGU!
async function getStatsFromTypesense(): Promise<Omit<QuestionsStatsResponse, 'source' | 'duration'>> {
  // Tek facet sorgusu ile tüm veriler
  const result = await typesenseClient
    .collections(COLLECTIONS.QUESTIONS)
    .documents()
    .search({
      q: '*',
      query_by: 'question_text',
      per_page: 0,
      facet_by: 'subject_code,subject_name,grade,main_topic',
      max_facet_values: 100
    })

  const facets = result.facet_counts || []
  const totalQuestions = result.found || 0

  // Subject code ve name facet'lerini eşleştir
  const subjectCodeFacet = facets.find((f: any) => f.field_name === 'subject_code')
  const subjectNameFacet = facets.find((f: any) => f.field_name === 'subject_name')
  const gradeFacet = facets.find((f: any) => f.field_name === 'grade')
  const topicFacet = facets.find((f: any) => f.field_name === 'main_topic')

  // Subject stats oluştur
  const subjects: SubjectStats[] = []
  const subjectCodes = subjectCodeFacet?.counts || []
  const subjectNames = subjectNameFacet?.counts || []

  for (let i = 0; i < subjectCodes.length; i++) {
    const code = subjectCodes[i]
    // İsim bulmaya çalış
    const nameEntry = subjectNames.find((n: any) => {
      // subject_name ve subject_code eşleşmesi zor, count'a göre tahmin et
      return n.count === code.count
    })

    subjects.push({
      code: code.value,
      name: nameEntry?.value || formatSubjectName(code.value),
      questionCount: code.count,
      topicCount: 0, // Typesense'de topic bazlı facet yok, ama main_topic var
      grades: [] // Grade bazlı filtreleme için ayrı sorgu gerekir
    })
  }

  // Sırala (soru sayısına göre)
  subjects.sort((a, b) => b.questionCount - a.questionCount)

  return {
    totalQuestions,
    totalTopics: topicFacet?.counts?.length || 0,
    totalSubjects: subjects.length,
    subjects
  }
}

// Supabase'den istatistikler (fallback)
async function getStatsFromSupabase(): Promise<Omit<QuestionsStatsResponse, 'source' | 'duration'>> {
  // Paralel sorgular
  const [subjectsRes, questionsRes, topicsRes] = await Promise.all([
    supabase.from('subjects').select('id, name, code'),
    supabase.from('questions').select('topic_id', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('topics').select('id, subject_id', { count: 'exact' })
  ])

  const totalQuestions = questionsRes.count || 0
  const totalTopics = topicsRes.count || 0
  const allSubjects = subjectsRes.data || []

  // Her subject için soru sayısı (basitleştirilmiş)
  const subjects: SubjectStats[] = allSubjects.map(subject => ({
    code: subject.code,
    name: subject.name,
    questionCount: 0, // Detaylı count için çok fazla sorgu gerekir
    topicCount: 0,
    grades: []
  }))

  return {
    totalQuestions,
    totalTopics,
    totalSubjects: subjects.length,
    subjects
  }
}

// Subject code'u okunabilir isme çevir
function formatSubjectName(code: string): string {
  const names: Record<string, string> = {
    'matematik': 'Matematik',
    'turkce': 'Türkçe',
    'fen_bilimleri': 'Fen Bilimleri',
    'sosyal_bilgiler': 'Sosyal Bilgiler',
    'ingilizce': 'İngilizce',
    'fizik': 'Fizik',
    'kimya': 'Kimya',
    'biyoloji': 'Biyoloji',
    'inkilap_tarihi': 'İnkılap Tarihi',
    'din_kulturu': 'Din Kültürü',
    'tarih': 'Tarih',
    'cografya': 'Coğrafya',
    'edebiyat': 'Türk Dili ve Edebiyatı',
    'felsefe': 'Felsefe',
    'hayat_bilgisi': 'Hayat Bilgisi',
  }
  return names[code] || code.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
}

