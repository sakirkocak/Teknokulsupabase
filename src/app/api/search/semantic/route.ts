import { NextRequest, NextResponse } from 'next/server'
import { getSearchEmbedding } from '@/lib/gemini-embedding'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

// Supabase service client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * POST /api/search/semantic
 * 
 * 🧠 Semantic Search - Supabase pgvector ile
 * 
 * Body:
 *   query: string (aranacak metin)
 *   grade?: number
 *   subjectCode?: string
 *   limit?: number (default: 10)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { query, grade, subjectCode, limit = 10 } = body

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

    // 2. Supabase pgvector ile semantic search
    const searchStartTime = Date.now()
    
    // Embedding'i PostgreSQL vector formatına çevir
    const vectorString = `[${embedding.join(',')}]`
    
    const { data: results, error } = await supabase
      .rpc('search_questions_semantic', {
        query_embedding: vectorString,
        match_threshold: 0.5,
        match_count: limit,
        filter_grade: grade || null,
        filter_subject_code: subjectCode || null
      })

    if (error) {
      console.error('pgvector search error:', error)
      // Fallback: Normal text search
      return NextResponse.json({ 
        error: 'Semantic search not available',
        fallback: true,
        message: 'pgvector henüz kurulmamış olabilir. Migration çalıştırın.'
      }, { status: 503 })
    }

    const searchTime = Date.now() - searchStartTime
    const totalTime = Date.now() - startTime

    // 3. Sonuçları formatla
    const formattedResults = (results || []).map((r: any) => ({
      question_id: r.id,
      question_text: r.question_text,
      subject_name: r.subject_name,
      subject_code: r.subject_code,
      grade: r.grade,
      main_topic: r.main_topic,
      difficulty: r.difficulty,
      similarity: r.similarity?.toFixed(3)
    }))

    console.log(`🧠 Semantic Search (pgvector): embedding=${embeddingTime}ms, search=${searchTime}ms, total=${totalTime}ms, results=${formattedResults.length}`)

    return NextResponse.json({
      results: formattedResults,
      total: formattedResults.length,
      timing: {
        embedding: embeddingTime,
        search: searchTime,
        total: totalTime
      },
      engine: 'pgvector'
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
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q')
  const grade = searchParams.get('grade')
  const limit = searchParams.get('limit')

  if (!query) {
    return NextResponse.json({ error: 'q parameter required' }, { status: 400 })
  }

  const body = {
    query,
    grade: grade ? parseInt(grade) : undefined,
    limit: limit ? parseInt(limit) : 10
  }

  const fakeRequest = new NextRequest(request.url, {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' }
  })

  return POST(fakeRequest)
}
