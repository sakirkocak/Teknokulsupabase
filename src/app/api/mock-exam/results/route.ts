import { NextRequest, NextResponse } from 'next/server'
import { typesenseClient, isTypesenseAvailable, COLLECTIONS } from '@/lib/typesense/client'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const examId = searchParams.get('exam_id')
    const page = parseInt(searchParams.get('page') || '1')
    const perPage = Math.min(parseInt(searchParams.get('per_page') || '50'), 100)

    if (!examId) {
      return NextResponse.json({ error: 'exam_id gerekli' }, { status: 400 })
    }

    // Typesense'den siralama al
    if (isTypesenseAvailable()) {
      try {
        const result = await typesenseClient
          .collections(COLLECTIONS.MOCK_EXAM_RESULTS)
          .documents()
          .search({
            q: '*',
            filter_by: `exam_id:=${examId}`,
            sort_by: 'score:desc',
            page,
            per_page: perPage,
          })

        if ((result.found || 0) > 0) {
          const rankings = (result.hits || []).map((hit, idx) => ({
            ...hit.document,
            rank: (page - 1) * perPage + idx + 1,
          }))

          return NextResponse.json({
            rankings,
            total: result.found || 0,
            page,
            totalPages: Math.ceil((result.found || 0) / perPage),
          })
        }
        // 0 results in Typesense, fall through to Supabase
      } catch (e) {
        console.error('Typesense ranking error:', e)
        // Fallback to Supabase
      }
    }

    // Supabase fallback
    const { data: results, error, count } = await supabaseAdmin
      .from('mock_exam_results')
      .select('id, student_name, score, total_net, time_taken, completed_at', { count: 'exact' })
      .eq('exam_id', examId)
      .order('score', { ascending: false })
      .range((page - 1) * perPage, page * perPage - 1)

    if (error) {
      console.error('Results query error:', error)
      return NextResponse.json({ error: 'Siralama yuklenemedi' }, { status: 500 })
    }

    const rankings = (results || []).map((r, idx) => ({
      ...r,
      rank: (page - 1) * perPage + idx + 1,
    }))

    return NextResponse.json({
      rankings,
      total: count || 0,
      page,
      totalPages: Math.ceil((count || 0) / perPage),
    })
  } catch (error: any) {
    console.error('Mock exam results error:', error)
    return NextResponse.json({ error: 'Siralama yuklenemedi' }, { status: 500 })
  }
}
