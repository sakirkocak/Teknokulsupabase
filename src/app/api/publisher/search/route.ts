import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { typesenseClient, COLLECTIONS, isTypesenseAvailable } from '@/lib/typesense/client'
import { generateQueryEmbedding } from '@/lib/publisher-generation'

export const maxDuration = 30

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

    const { data: profile } = await supabase
      .from('profiles').select('role').eq('id', user.id).single()
    if (!profile || !['yayinevi', 'admin'].includes(profile.role)) {
      return NextResponse.json({ error: 'Yetkisiz' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q') || '*'
    const semantic = searchParams.get('semantic') === 'true'
    const subject = searchParams.get('subject') || ''
    const difficulty = searchParams.get('difficulty') || ''
    const examType = searchParams.get('exam_type') || ''
    const imageType = searchParams.get('image_type') || ''
    const hasImage = searchParams.get('has_image') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const perPage = parseInt(searchParams.get('per_page') || '20')

    // Typesense filter oluştur
    const filterParts: string[] = ['is_available:=true', 'status:=available']
    if (subject) filterParts.push(`subject:=${subject}`)
    if (difficulty) filterParts.push(`difficulty:=${difficulty}`)
    if (examType) filterParts.push(`exam_type:=${examType}`)
    if (imageType === 'with_image') filterParts.push('image_type:!=[none]')
    else if (imageType === 'no_image') filterParts.push('image_type:=[none]')
    else if (imageType) filterParts.push(`image_type:=${imageType}`)
    if (hasImage === 'true') filterParts.push('image_type:!=[none]')

    const filterBy = filterParts.join(' && ')

    // Typesense yoksa Supabase fallback
    if (!isTypesenseAvailable()) {
      return supabaseFallback(supabase, { subject, difficulty, examType, imageType, page, perPage })
    }

    // Semantik arama (vektörel)
    if (semantic && q !== '*' && q.length > 3) {
      const embedding = await generateQueryEmbedding(q)
      if (embedding) {
        try {
          const vectorQuery = `embedding:([${embedding.join(',')}], k: ${perPage})`
          const results = await typesenseClient
            .collections(COLLECTIONS.PUBLISHER_QUESTIONS)
            .documents()
            .search({
              q: q,
              query_by: 'question_text,topic,subject',
              vector_query: vectorQuery,
              filter_by: filterBy,
              per_page: perPage,
              page,
              include_fields: 'id,question_text,subject,topic,difficulty,exam_type,image_type,bloom_level,learning_outcome,price_credits,verified,created_at',
            })

          return NextResponse.json({
            hits: results.hits?.map(h => ({ ...h.document, _score: (h as any).vector_distance })) || [],
            total: results.found || 0,
            page,
            search_type: 'semantic',
          })
        } catch (vecError) {
          console.error('Vektörel arama hatası, keyword aramasına geç:', vecError)
        }
      }
    }

    // Tam metin + facet arama (Typesense keyword)
    const searchParams2: Record<string, unknown> = {
      q: q === '' ? '*' : q,
      query_by: 'question_text,topic,subject,learning_outcome',
      filter_by: filterBy,
      facet_by: 'subject,difficulty,exam_type,image_type',
      per_page: perPage,
      page,
      sort_by: q === '*' || q === '' ? 'created_at:desc' : '_text_match:desc',
      include_fields: 'id,question_text,subject,topic,difficulty,exam_type,image_type,bloom_level,learning_outcome,price_credits,verified,created_at',
    }

    const results = await typesenseClient
      .collections(COLLECTIONS.PUBLISHER_QUESTIONS)
      .documents()
      .search(searchParams2 as any)

    return NextResponse.json({
      hits: results.hits?.map(h => h.document) || [],
      total: results.found || 0,
      page,
      facets: results.facet_counts || [],
      search_type: 'keyword',
    })
  } catch (error) {
    console.error('Publisher search error:', error)
    return NextResponse.json({ error: 'Arama hatası', hits: [], total: 0 }, { status: 500 })
  }
}

async function supabaseFallback(
  supabase: Awaited<ReturnType<typeof import('@/lib/supabase/server').createClient>>,
  params: { subject: string; difficulty: string; examType: string; imageType: string; page: number; perPage: number }
) {
  const { subject, difficulty, examType, imageType, page, perPage } = params
  const offset = (page - 1) * perPage

  let query = supabase
    .from('publisher_questions')
    .select('id,question_text,subject,topic,difficulty,exam_type,image_type,bloom_level,learning_outcome,price_credits,verified,created_at', { count: 'exact' })
    .eq('is_available', true)
    .eq('status', 'available')
    .order('created_at', { ascending: false })
    .range(offset, offset + perPage - 1)

  if (subject) query = query.eq('subject', subject)
  if (difficulty) query = query.eq('difficulty', difficulty)
  if (examType) query = query.eq('exam_type', examType)
  if (imageType === 'with_image') query = query.not('image_type', 'is', null)
  else if (imageType && imageType !== 'all') query = query.eq('image_type', imageType)

  const { data, count, error } = await query
  if (error) throw error

  return NextResponse.json({ hits: data || [], total: count || 0, page, search_type: 'supabase' })
}
