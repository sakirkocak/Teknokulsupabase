import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Vercel Cron Job - Her Pazartesi 03:00 UTC
// vercel.json'da cron config gerekli

export const runtime = 'edge'
export const maxDuration = 60

export async function GET(request: NextRequest) {
  try {
    // Cron secret kontrolü
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET
    
    // Vercel cron veya manuel tetikleme
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      // Vercel cron header kontrolü
      const vercelCron = request.headers.get('x-vercel-cron')
      if (!vercelCron) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    console.log('🚀 SEO Index Update başladı...')

    // RPC fonksiyonunu çağır
    const { data, error } = await supabase.rpc('update_seo_index_batch')

    if (error) {
      console.error('❌ SEO Index Update hatası:', error)
      return NextResponse.json({ 
        success: false, 
        error: error.message 
      }, { status: 500 })
    }

    // İstatistikleri al
    const { count: totalIndexed } = await supabase
      .from('questions')
      .select('*', { count: 'exact', head: true })
      .eq('is_indexed', true)

    const result = {
      success: true,
      timestamp: new Date().toISOString(),
      total_indexed: totalIndexed,
      update_result: data,
      message: 'SEO index güncellendi'
    }

    console.log('✅ SEO Index Update tamamlandı:', result)

    return NextResponse.json(result)

  } catch (error: any) {
    console.error('❌ SEO Index Update exception:', error)
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 })
  }
}
