import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'

// Admin service client
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * GET /api/admin/seo/engagement-index
 * Engagement istatistiklerini getir
 */
export async function GET(request: NextRequest) {
  try {
    // Auth kontrolü
    const cookieStore = cookies()
    const supabase = createServerComponentClient({ cookies: () => cookieStore })
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Admin kontrolü
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    
    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin yetkisi gerekli' }, { status: 403 })
    }
    
    // Engagement istatistiklerini al
    const { data: stats, error } = await supabaseAdmin.rpc('get_engagement_stats')
    
    if (error) {
      console.error('Engagement stats error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    // Engagement leaderboard (top 20)
    const { data: leaderboard } = await supabaseAdmin
      .from('engagement_leaderboard')
      .select('*')
      .limit(20)
    
    // Cron job logları (son 10)
    const { data: cronLogs } = await supabaseAdmin
      .from('cron_job_logs')
      .select('*')
      .eq('job_name', 'weekly-engagement-index')
      .order('executed_at', { ascending: false })
      .limit(10)
    
    return NextResponse.json({
      success: true,
      stats,
      leaderboard: leaderboard || [],
      recentJobs: cronLogs || []
    })
    
  } catch (error: any) {
    console.error('Engagement index GET error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

/**
 * POST /api/admin/seo/engagement-index
 * Manuel engagement index güncelleme tetikle
 */
export async function POST(request: NextRequest) {
  try {
    // Auth kontrolü
    const cookieStore = cookies()
    const supabase = createServerComponentClient({ cookies: () => cookieStore })
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Admin kontrolü
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    
    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin yetkisi gerekli' }, { status: 403 })
    }
    
    const body = await request.json().catch(() => ({}))
    const limit = body.limit || 1000
    
    console.log(`🎯 Manuel engagement index güncelleme başlatılıyor (limit: ${limit})...`)
    
    // Engagement index güncelle
    const { data: result, error } = await supabaseAdmin.rpc('index_top_engagement_pages', {
      p_limit: limit
    })
    
    if (error) {
      console.error('Engagement index error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    // Loğa kaydet
    await supabaseAdmin.from('cron_job_logs').insert({
      job_name: 'manual-engagement-index',
      result: result,
      success: true
    })
    
    console.log('✅ Engagement index güncelleme tamamlandı:', result)
    
    return NextResponse.json({
      success: true,
      message: 'Engagement index güncellendi',
      result
    })
    
  } catch (error: any) {
    console.error('Engagement index POST error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

/**
 * PUT /api/admin/seo/engagement-index
 * Tam haftalık güncelleme çalıştır (index + deindex)
 */
export async function PUT(request: NextRequest) {
  try {
    // Auth kontrolü
    const cookieStore = cookies()
    const supabase = createServerComponentClient({ cookies: () => cookieStore })
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Admin kontrolü
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    
    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin yetkisi gerekli' }, { status: 403 })
    }
    
    console.log('🚀 Tam engagement index güncelleme başlatılıyor...')
    
    // Tam haftalık güncelleme (index + deindex)
    const { data: result, error } = await supabaseAdmin.rpc('weekly_engagement_index_update')
    
    if (error) {
      console.error('Weekly engagement update error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    console.log('✅ Tam engagement index güncelleme tamamlandı:', result)
    
    return NextResponse.json({
      success: true,
      message: 'Tam engagement index güncellendi (index + deindex)',
      result
    })
    
  } catch (error: any) {
    console.error('Engagement index PUT error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
