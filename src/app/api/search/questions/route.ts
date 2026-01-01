import { NextRequest, NextResponse } from 'next/server'
import { typesenseClient, isTypesenseAvailable, COLLECTIONS } from '@/lib/typesense/client'
import { createClient } from '@supabase/supabase-js'

// Supabase service role client (server-side)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export interface SearchResult {
  id: string
  question_text: string
  explanation: string | null
  difficulty: string
  subject_name: string
  subject_code: string
  main_topic: string
  sub_topic: string | null
  grade: number
  times_answered: number
  times_correct: number
  success_rate: number
  highlight?: string
}

export interface SearchResponse {
  results: SearchResult[]
  total: number
  page: number
  per_page: number
  source: string
  duration: number
}

/**
 * GET /api/search/questions
 * 
 * Query Parameters:
 * - q: string (arama sorgusu, required)
 * - grade: number (sinif filtresi)
 * - subject: string (ders filtresi - subject_code)
 * - difficulty: string (zorluk filtresi)
 * - page: number (sayfa, default: 1)
 * - per_page: number (sayfa basi sonuc, default: 20)
 */
export async function GET(req: NextRequest) {
  const startTime = Date.now()
  const { searchParams } = new URL(req.url)
  
  const query = searchParams.get('q') || ''
  const grade = searchParams.get('grade')
  const subject = searchParams.get('subject')
  const difficulty = searchParams.get('difficulty')
  const page = parseInt(searchParams.get('page') || '1')
  const perPage = parseInt(searchParams.get('per_page') || '20')

  if (!query || query.length < 2) {
    return NextResponse.json({
      results: [],
      total: 0,
      page,
      per_page: perPage,
      source: 'none',
      duration: 0,
      error: 'Arama sorgusu en az 2 karakter olmali'
    })
  }

  try {
    // Typesense kullanilabilir mi kontrol et
    if (isTypesenseAvailable()) {
      const result = await searchQuestionsFromTypesense({
        query, grade, subject, difficulty, page, perPage
      })
      
      const duration = Date.now() - startTime
      console.log(`⚡ Search from Typesense: "${query}" - ${duration}ms, ${result.total} results`)
      
      return NextResponse.json({
        ...result,
        source: 'typesense',
        duration
      })
    }
    
    // Fallback to Supabase
    const result = await searchQuestionsFromSupabase({
      query, grade, subject, difficulty, page, perPage
    })
    
    const duration = Date.now() - startTime
    console.log(`📊 Search from Supabase: "${query}" - ${duration}ms, ${result.total} results`)
    
    return NextResponse.json({
      ...result,
      source: 'supabase',
      duration
    })
    
  } catch (error) {
    console.error('Search error:', error)
    
    // Typesense hata verdiyse Supabase'e fallback
    try {
      const result = await searchQuestionsFromSupabase({
        query, grade, subject, difficulty, page, perPage
      })
      
      const duration = Date.now() - startTime
      console.log(`📊 Search fallback to Supabase: ${duration}ms`)
      
      return NextResponse.json({
        ...result,
        source: 'supabase_fallback',
        duration
      })
    } catch (fallbackError) {
      return NextResponse.json(
        { error: 'Arama yapilamadi', details: (fallbackError as Error).message },
        { status: 500 }
      )
    }
  }
}

// Typesense'den soru arama
async function searchQuestionsFromTypesense(params: {
  query: string
  grade: string | null
  subject: string | null
  difficulty: string | null
  page: number
  perPage: number
}): Promise<{ results: SearchResult[], total: number, page: number, per_page: number }> {
  const { query, grade, subject, difficulty, page, perPage } = params
  
  // Filtre olustur
  const filters: string[] = []
  
  if (grade) {
    filters.push(`grade:=${grade}`)
  }
  if (subject) {
    filters.push(`subject_code:=${subject}`)
  }
  if (difficulty) {
    filters.push(`difficulty:=${difficulty}`)
  }
  
  const searchParams: any = {
    q: query,
    query_by: 'question_text,main_topic,sub_topic,explanation',
    sort_by: '_text_match:desc,created_at:desc',
    page,
    per_page: perPage,
    highlight_full_fields: 'question_text',
    highlight_start_tag: '<mark>',
    highlight_end_tag: '</mark>'
  }
  
  if (filters.length > 0) {
    searchParams.filter_by = filters.join(' && ')
  }
  
  const results = await typesenseClient
    .collections(COLLECTIONS.QUESTIONS)
    .documents()
    .search(searchParams)
  
  const searchResults: SearchResult[] = (results.hits || []).map((hit: any) => {
    const doc = hit.document
    return {
      id: doc.question_id || doc.id,
      question_text: doc.question_text || '',
      explanation: doc.explanation || null,
      difficulty: doc.difficulty || 'medium',
      subject_name: doc.subject_name || '',
      subject_code: doc.subject_code || '',
      main_topic: doc.main_topic || '',
      sub_topic: doc.sub_topic || null,
      grade: doc.grade || 0,
      times_answered: doc.times_answered || 0,
      times_correct: doc.times_correct || 0,
      success_rate: doc.success_rate || 0,
      highlight: hit.highlight?.question_text?.snippet || undefined
    }
  })
  
  return {
    results: searchResults,
    total: results.found || 0,
    page,
    per_page: perPage
  }
}

// Supabase'den soru arama (fallback)
async function searchQuestionsFromSupabase(params: {
  query: string
  grade: string | null
  subject: string | null
  difficulty: string | null
  page: number
  perPage: number
}): Promise<{ results: SearchResult[], total: number, page: number, per_page: number }> {
  const { query, grade, subject, difficulty, page, perPage } = params
  
  let queryBuilder = supabase
    .from('questions')
    .select(`
      id,
      question_text,
      explanation,
      difficulty,
      times_answered,
      times_correct,
      topic:topics!inner(
        main_topic,
        sub_topic,
        grade,
        subject:subjects!inner(name, code)
      )
    `, { count: 'exact' })
    .eq('is_active', true)
    .ilike('question_text', `%${query}%`)
  
  if (grade) {
    queryBuilder = queryBuilder.eq('topics.grade', parseInt(grade))
  }
  if (subject) {
    queryBuilder = queryBuilder.eq('topics.subjects.code', subject)
  }
  if (difficulty) {
    queryBuilder = queryBuilder.eq('difficulty', difficulty)
  }
  
  const offset = (page - 1) * perPage
  queryBuilder = queryBuilder.range(offset, offset + perPage - 1)
  
  const { data, count } = await queryBuilder
  
  const searchResults: SearchResult[] = (data || []).map((item: any) => ({
    id: item.id,
    question_text: item.question_text || '',
    explanation: item.explanation || null,
    difficulty: item.difficulty || 'medium',
    subject_name: item.topic?.subject?.name || '',
    subject_code: item.topic?.subject?.code || '',
    main_topic: item.topic?.main_topic || '',
    sub_topic: item.topic?.sub_topic || null,
    grade: item.topic?.grade || 0,
    times_answered: item.times_answered || 0,
    times_correct: item.times_correct || 0,
    success_rate: item.times_answered > 0
      ? Math.round((item.times_correct / item.times_answered) * 100)
      : 0
  }))
  
  return {
    results: searchResults,
    total: count || 0,
    page,
    per_page: perPage
  }
}

