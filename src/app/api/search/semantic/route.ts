import { NextRequest, NextResponse } from 'next/server'
import { getSearchEmbedding } from '@/lib/gemini-embedding'
import { typesenseClient, isTypesenseAvailable, COLLECTIONS } from '@/lib/typesense/client'

export const dynamic = 'force-dynamic'

/**
 * POST /api/search/semantic
 * 
 * Semantic search - Anlam tabanlı soru arama
 * 
 * Body:
 *   query: string (aranacak metin)
 *   grade?: number
 *   subjectCode?: string
 *   difficulty?: string
 *   limit?: number (default: 10)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { query, grade, subjectCode, difficulty, limit = 10 } = body

    if (!query || query.trim().length < 2) {
      return NextResponse.json({ 
        error: 'Query must be at least 2 characters' 
      }, { status: 400 })
    }

    // 1. Gemini ile embedding üret
    const startTime = Date.now()
    let embedding: number[]
    
    try {
      embedding = await getSearchEmbedding(query)
    } catch (embeddingError: any) {
      console.error('Embedding error:', embeddingError.message)
      return NextResponse.json({ 
        error: 'Failed to generate embedding',
        fallback: true 
      }, { status: 500 })
    }

    const embeddingTime = Date.now() - startTime

    // 2. Typesense'de vector search yap
    if (!isTypesenseAvailable()) {
      return NextResponse.json({ 
        error: 'Typesense not available' 
      }, { status: 503 })
    }

    // Filter oluştur
    const filterParts: string[] = []
    if (grade) filterParts.push(`grade:=${grade}`)
    if (subjectCode) filterParts.push(`subject_code:=${subjectCode}`)
    if (difficulty) filterParts.push(`difficulty:=${difficulty}`)
    // Sadece embedding'i olan sorularda ara
    filterParts.push('embedding:!=null')

    const searchStartTime = Date.now()
    
    const result = await typesenseClient
      .collections(COLLECTIONS.QUESTIONS)
      .documents()
      .search({
        q: '*',
        query_by: 'question_text',
        vector_query: `embedding:([${embedding.join(',')}], k:${limit})`,
        filter_by: filterParts.join(' && '),
        per_page: limit,
        include_fields: 'question_id,question_text,subject_name,subject_code,grade,main_topic,difficulty'
      })

    const searchTime = Date.now() - searchStartTime
    const totalTime = Date.now() - startTime

    // 3. Sonuçları formatla
    const results = (result.hits || []).map((hit: any) => {
      const doc = hit.document
      return {
        question_id: doc.question_id,
        question_text: doc.question_text,
        subject_name: doc.subject_name,
        subject_code: doc.subject_code,
        grade: doc.grade,
        main_topic: doc.main_topic,
        difficulty: doc.difficulty,
        similarity: hit.vector_distance ? (1 - hit.vector_distance).toFixed(3) : null
      }
    })

    console.log(`🧠 Semantic Search: embedding=${embeddingTime}ms, search=${searchTime}ms, total=${totalTime}ms, results=${results.length}`)

    return NextResponse.json({
      results,
      total: result.found || 0,
      timing: {
        embedding: embeddingTime,
        search: searchTime,
        total: totalTime
      }
    })

  } catch (error: any) {
    console.error('Semantic search error:', error)
    return NextResponse.json({ 
      error: error.message 
    }, { status: 500 })
  }
}

/**
 * GET /api/search/semantic?q=...
 * 
 * Basit GET endpoint (query param ile)
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q')
  const grade = searchParams.get('grade')
  const limit = searchParams.get('limit')

  if (!query) {
    return NextResponse.json({ error: 'q parameter required' }, { status: 400 })
  }

  // POST'a yönlendir
  const body = {
    query,
    grade: grade ? parseInt(grade) : undefined,
    limit: limit ? parseInt(limit) : 10
  }

  // POST handler'ı çağır
  const fakeRequest = new NextRequest(request.url, {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' }
  })

  return POST(fakeRequest)
}
