/**
 * 🧠 TeknoÖğretmen - Semantic Search API
 * 
 * pgvector ile anlam bazlı soru araması yapar
 * Gemini embedding (ücretsiz) + Supabase pgvector
 * 
 * Örnek: "Üslü sayılarda zorlanıyorum" → En benzer 5 soru + çözüm
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getSearchEmbedding } from '@/lib/gemini-embedding'
import { semanticSearchCache, embeddingCache, createCacheKey, cachedFetch } from '@/lib/cache'
import { checkRateLimit, getClientIP } from '@/lib/rateLimit'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 30

// Supabase client (service role for RPC calls)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface SemanticSearchResult {
  id: string
  question_text: string
  difficulty: string
  grade: number
  subject_code: string
  subject_name: string
  main_topic: string
  similarity: number
  // Detaylı bilgiler (opsiyonel)
  explanation?: string
  correct_answer?: string
}

/**
 * Semantic search yap
 */
async function performSemanticSearch(
  query: string,
  options: {
    grade?: number
    subjectCode?: string
    threshold?: number
    limit?: number
  } = {}
): Promise<SemanticSearchResult[]> {
  const {
    grade,
    subjectCode,
    threshold = 0.6,
    limit = 5
  } = options

  try {
    // 1. Query için embedding oluştur (cache'li)
    const embeddingCacheKey = createCacheKey('embedding', query.toLowerCase().trim())
    
    const embedding = await cachedFetch(
      embeddingCache,
      embeddingCacheKey,
      () => getSearchEmbedding(query),
      30 * 60 * 1000 // 30 dakika TTL
    )

    if (!embedding || embedding.length !== 768) {
      console.error('Invalid embedding:', embedding?.length)
      return []
    }

    // 2. pgvector ile semantic search
    const { data, error } = await supabase.rpc('search_questions_semantic', {
      query_embedding: `[${embedding.join(',')}]`,
      match_threshold: threshold,
      match_count: limit,
      filter_grade: grade || null,
      filter_subject_code: subjectCode || null
    })

    if (error) {
      console.error('Semantic search RPC error:', error)
      
      // Fallback: Direkt SQL query dene
      return await fallbackSearch(embedding, { grade, subjectCode, threshold, limit })
    }

    return (data || []).map((row: any) => ({
      id: row.id,
      question_text: row.question_text,
      difficulty: row.difficulty,
      grade: row.grade,
      subject_code: row.subject_code,
      subject_name: row.subject_name,
      main_topic: row.main_topic,
      similarity: row.similarity
    }))

  } catch (error) {
    console.error('Semantic search error:', error)
    return []
  }
}

/**
 * Fallback: RPC çalışmazsa direkt query
 */
async function fallbackSearch(
  embedding: number[],
  options: { grade?: number, subjectCode?: string, threshold: number, limit: number }
): Promise<SemanticSearchResult[]> {
  try {
    // Basit bir similarity query dene
    let query = supabase
      .from('questions')
      .select(`
        id,
        question_text,
        difficulty,
        explanation,
        correct_answer,
        topics!inner (
          grade,
          main_topic,
          subjects!inner (
            code,
            name
          )
        )
      `)
      .eq('is_active', true)
      .not('embedding', 'is', null)
      .limit(options.limit)

    if (options.grade) {
      query = query.eq('topics.grade', options.grade)
    }

    if (options.subjectCode) {
      query = query.eq('topics.subjects.code', options.subjectCode)
    }

    const { data, error } = await query

    if (error) {
      console.error('Fallback search error:', error)
      return []
    }

    // Not: Bu fallback similarity hesaplamıyor, sadece random sorular döndürüyor
    return (data || []).map((row: any) => ({
      id: row.id,
      question_text: row.question_text,
      difficulty: row.difficulty,
      grade: row.topics?.grade,
      subject_code: row.topics?.subjects?.code,
      subject_name: row.topics?.subjects?.name,
      main_topic: row.topics?.main_topic,
      similarity: 0.7, // Placeholder
      explanation: row.explanation,
      correct_answer: row.correct_answer
    }))

  } catch (error) {
    console.error('Fallback search failed:', error)
    return []
  }
}

/**
 * Soru detaylarını çek (explanation, correct_answer)
 */
async function getQuestionDetails(questionIds: string[]): Promise<Map<string, { explanation: string, correct_answer: string }>> {
  const details = new Map()

  if (questionIds.length === 0) return details

  try {
    const { data, error } = await supabase
      .from('questions')
      .select('id, explanation, correct_answer, options')
      .in('id', questionIds)

    if (error) {
      console.error('Question details error:', error)
      return details
    }

    (data || []).forEach((q: any) => {
      details.set(q.id, {
        explanation: q.explanation || '',
        correct_answer: q.correct_answer || '',
        options: q.options
      })
    })

  } catch (error) {
    console.error('Failed to fetch question details:', error)
  }

  return details
}

export async function POST(request: NextRequest) {
  const startTime = Date.now()

  // Rate limit kontrolü
  const ip = getClientIP(request)
  const rateLimit = checkRateLimit(`semantic-search:${ip}`, {
    windowMs: 60000,
    maxRequests: 20,  // Dakikada 20 arama
    blockDurationMs: 60000
  })

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'Rate limit exceeded', retryAfter: Math.ceil(rateLimit.resetIn / 1000) },
      { status: 429 }
    )
  }

  try {
    const { 
      query, 
      grade, 
      subjectCode, 
      threshold = 0.6, 
      limit = 5,
      includeDetails = true 
    } = await request.json()

    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: 'query parametresi gerekli' },
        { status: 400 }
      )
    }

    // Query'yi normalize et
    const normalizedQuery = query.trim().toLowerCase()
    
    if (normalizedQuery.length < 3) {
      return NextResponse.json(
        { error: 'Query en az 3 karakter olmalı' },
        { status: 400 }
      )
    }

    // Cache key oluştur
    const cacheKey = createCacheKey(
      'semantic-search',
      normalizedQuery,
      grade || 'all',
      subjectCode || 'all',
      threshold.toString()
    )

    // Cache'li search
    const cachedResult = semanticSearchCache.get(cacheKey)
    
    let results: SemanticSearchResult[]
    let fromCache = false

    if (cachedResult) {
      results = cachedResult.questions as SemanticSearchResult[]
      fromCache = true
    } else {
      results = await performSemanticSearch(normalizedQuery, {
        grade,
        subjectCode,
        threshold,
        limit
      })

      // Cache'le
      if (results.length > 0) {
        semanticSearchCache.set(cacheKey, { questions: results }, 10 * 60 * 1000)
      }
    }

    // Detayları çek (explanation, correct_answer)
    if (includeDetails && results.length > 0) {
      const details = await getQuestionDetails(results.map(r => r.id))
      
      results = results.map(r => ({
        ...r,
        explanation: details.get(r.id)?.explanation || '',
        correct_answer: details.get(r.id)?.correct_answer || ''
      }))
    }

    return NextResponse.json({
      success: true,
      query: normalizedQuery,
      results,
      count: results.length,
      cached: fromCache,
      duration: Date.now() - startTime
    })

  } catch (error) {
    console.error('Semantic search API error:', error)
    return NextResponse.json(
      { error: 'Arama sırasında hata oluştu' },
      { status: 500 }
    )
  }
}

/**
 * GET - Benzer sorular bul (soru ID'sine göre)
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now()

  const { searchParams } = new URL(request.url)
  const questionId = searchParams.get('questionId')
  const limit = parseInt(searchParams.get('limit') || '5')

  if (!questionId) {
    return NextResponse.json(
      { error: 'questionId parametresi gerekli' },
      { status: 400 }
    )
  }

  try {
    // pgvector RPC ile benzer soruları bul
    const { data, error } = await supabase.rpc('get_similar_questions', {
      question_id: questionId,
      match_count: limit
    })

    if (error) {
      console.error('Similar questions error:', error)
      return NextResponse.json(
        { error: 'Benzer sorular bulunamadı' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      questionId,
      similarQuestions: data || [],
      count: (data || []).length,
      duration: Date.now() - startTime
    })

  } catch (error) {
    console.error('Similar questions API error:', error)
    return NextResponse.json(
      { error: 'Hata oluştu' },
      { status: 500 }
    )
  }
}
