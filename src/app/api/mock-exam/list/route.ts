import { NextRequest, NextResponse } from 'next/server'
import { typesenseClient, isTypesenseAvailable, COLLECTIONS } from '@/lib/typesense/client'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const grade = searchParams.get('grade')
    const examType = searchParams.get('exam_type')
    const slug = searchParams.get('slug')
    const page = parseInt(searchParams.get('page') || '1')
    const perPage = Math.min(parseInt(searchParams.get('per_page') || '20'), 50)

    if (!isTypesenseAvailable()) {
      return NextResponse.json({ error: 'Arama servisi kullanılamıyor' }, { status: 503 })
    }

    // Filtre olustur
    const filterParts: string[] = ['is_active:true']
    if (grade) filterParts.push(`grade:=${grade}`)
    if (examType) filterParts.push(`exam_type:=${examType}`)
    if (slug) filterParts.push(`slug:=${slug}`)

    const result = await typesenseClient
      .collections(COLLECTIONS.MOCK_EXAMS)
      .documents()
      .search({
        q: '*',
        filter_by: filterParts.join(' && '),
        sort_by: 'created_at:desc',
        page,
        per_page: perPage,
      })

    const exams = (result.hits || []).map(hit => hit.document)

    return NextResponse.json({
      exams,
      total: result.found || 0,
      page,
      totalPages: Math.ceil((result.found || 0) / perPage),
    })
  } catch (error: any) {
    console.error('Mock exam list error:', error)
    return NextResponse.json({ error: 'Sinavlar yüklenemedi' }, { status: 500 })
  }
}
