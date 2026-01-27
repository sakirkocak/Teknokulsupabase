import { NextRequest, NextResponse } from 'next/server'
import { typesenseClient, isTypesenseAvailable, COLLECTIONS } from '@/lib/typesense/client'

export const dynamic = 'force-dynamic'
export const maxDuration = 120

export async function GET(request: NextRequest) {
  try {
    // Vercel Cron secret kontrolu
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (process.env.NODE_ENV === 'production' && cronSecret) {
      if (authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }

    if (!isTypesenseAvailable()) {
      return NextResponse.json({ error: 'Typesense not available', success: false }, { status: 503 })
    }

    // Typesense leaderboard collection'indaki tum dokumanlari al
    let page = 1
    const perPage = 250
    let totalReset = 0

    while (true) {
      const results = await typesenseClient
        .collections(COLLECTIONS.LEADERBOARD)
        .documents()
        .search({
          q: '*',
          query_by: 'full_name',
          filter_by: 'total_points:>0',
          per_page: perPage,
          page,
          include_fields: 'id,student_id'
        })

      const hits = results.hits || []
      if (hits.length === 0) break

      // Her dokumani sifirla (puan alanlari 0'a cek)
      for (const hit of hits) {
        const doc = hit.document as any
        try {
          await typesenseClient
            .collections(COLLECTIONS.LEADERBOARD)
            .documents(doc.id)
            .update({
              total_points: 0,
              total_questions: 0,
              total_correct: 0,
              total_wrong: 0,
              current_streak: 0,
              max_streak: 0,
              success_rate: 0,
              today_questions: 0,
              today_correct: 0,
              today_date: '',
              // Ders puanlarini sifirla
              matematik_points: 0,
              turkce_points: 0,
              fen_points: 0,
              inkilap_points: 0,
              din_points: 0,
              ingilizce_points: 0,
              sosyal_points: 0,
              hayat_points: 0,
              edebiyat_points: 0,
              fizik_points: 0,
              kimya_points: 0,
              biyoloji_points: 0,
              tarih_points: 0,
              cografya_points: 0,
              felsefe_points: 0,
              gorsel_points: 0,
              muzik_points: 0,
              beden_points: 0,
              bilisim_points: 0,
              teknoloji_points: 0,
            })
          totalReset++
        } catch (e) {
          console.error(`Leaderboard reset error for ${doc.id}:`, e)
        }
      }

      if (hits.length < perPage) break
      page++
    }

    const executedAt = new Date().toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul' })
    console.log(`✅ Haftalik leaderboard sifirlandi: ${totalReset} ogrenci, ${executedAt}`)

    return NextResponse.json({
      success: true,
      totalReset,
      executed_at: executedAt
    })
  } catch (error: any) {
    console.error('Leaderboard reset cron error:', error)
    return NextResponse.json(
      { error: error.message, success: false },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  return GET(request)
}
