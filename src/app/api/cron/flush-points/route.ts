import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Vercel Cron veya harici cron servisleri için endpoint
// Cron config: vercel.json'a eklenecek
export const dynamic = 'force-dynamic'
export const maxDuration = 60 // 60 saniye timeout

// Service role client (RLS bypass)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    // Vercel Cron secret kontrolü
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    // Development'ta secret kontrolü atla
    if (process.env.NODE_ENV === 'production' && cronSecret) {
      if (authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        )
      }
    }

    // flush_pending_points RPC çağır
    const { data, error } = await supabaseAdmin.rpc('flush_pending_points')

    if (error) {
      console.error('flush_pending_points error:', error)
      return NextResponse.json(
        { error: error.message, success: false },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      affected_rows: data,
      executed_at: new Date().toISOString()
    })
  } catch (error: any) {
    console.error('Cron flush error:', error)
    return NextResponse.json(
      { error: error.message, success: false },
      { status: 500 }
    )
  }
}

// POST da destekle (bazı cron servisleri POST kullanır)
export async function POST(request: NextRequest) {
  return GET(request)
}

