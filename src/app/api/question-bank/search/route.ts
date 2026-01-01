/**
 * Soru Bankası Arama API
 * GET /api/question-bank/search?q=...&subject=...&grade=...
 */

import { NextRequest, NextResponse } from 'next/server'
import { searchBanks } from '@/lib/typesense-banks'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q') || '*'
  const subject = searchParams.get('subject') || undefined
  const grade = searchParams.get('grade')
  const limit = parseInt(searchParams.get('limit') || '50')

  try {
    const result = await searchBanks(q, {
      subject_name: subject,
      grade: grade ? parseInt(grade) : undefined,
      limit
    })

    return NextResponse.json({
      success: true,
      query: q,
      found: result.found,
      banks: result.hits
    })
  } catch (error: any) {
    console.error('Search error:', error)
    return NextResponse.json(
      { error: 'Arama hatası', message: error.message },
      { status: 500 }
    )
  }
}
