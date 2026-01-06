/**
 * Video İşleme API (Background Job)
 * Cloud Run'ı çağırarak video üretir
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { RATE_LIMITS } from '@/lib/youtube-playlists'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 300

const CRON_SECRET = process.env.CRON_SECRET || ''
const VIDEO_GENERATOR_URL = process.env.VIDEO_GENERATOR_URL || ''
const VIDEO_API_SECRET = process.env.VIDEO_API_SECRET || ''

interface QueueItem {
  queue_id: string
  question_id: string
  question_text: string
  options: Record<string, string>
  correct_answer: string
  explanation: string | null
  topic_name: string | null
  subject_name: string | null
  grade: number | null
}

/**
 * Video log ekle
 */
async function addLog(
  supabase: any,
  queueId: string,
  questionId: string,
  stage: string,
  status: string,
  details?: any,
  error?: string
) {
  await supabase.from('video_generation_logs').insert({
    queue_id: queueId,
    question_id: questionId,
    stage,
    status,
    details: details || null,
    error_message: error || null
  })
}

/**
 * Cloud Run'a video üretim isteği gönder
 */
async function sendToCloudRun(item: QueueItem): Promise<{ success: boolean; videoUrl?: string; error?: string }> {
  if (!VIDEO_GENERATOR_URL) {
    return { success: false, error: 'VIDEO_GENERATOR_URL tanımlı değil' }
  }
  
  console.log(`🎬 [CLOUD RUN] İstek gönderiliyor: ${item.question_id}`)
  
  try {
    const response = await fetch(`${VIDEO_GENERATOR_URL}/generate-sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${VIDEO_API_SECRET}`
      },
      body: JSON.stringify({
        question_id: item.question_id,
        question_text: item.question_text,
        options: item.options,
        correct_answer: item.correct_answer,
        explanation: item.explanation,
        topic_name: item.topic_name,
        subject_name: item.subject_name,
        grade: item.grade || 8
      })
    })
    
    if (response.ok) {
      const data = await response.json()
      console.log(`✅ [CLOUD RUN] Başarılı: ${data.videoUrl}`)
      return { success: true, videoUrl: data.videoUrl }
    } else {
      const errorText = await response.text()
      console.error(`❌ [CLOUD RUN] Hata: ${response.status} - ${errorText}`)
      return { success: false, error: errorText }
    }
  } catch (error: any) {
    console.error(`❌ [CLOUD RUN] Exception: ${error.message}`)
    return { success: false, error: error.message }
  }
}

/**
 * POST - Video işle
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now()
  
  // Auth kontrolü
  const authHeader = request.headers.get('authorization')
  const isValidCron = CRON_SECRET && authHeader === `Bearer ${CRON_SECRET}`
  
  const supabase = await createClient()
  
  if (!isValidCron) {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 })
    }
    
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    
    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin yetkisi gerekli' }, { status: 403 })
    }
  }
  
  try {
    // Rate limiting kontrolü
    const { data: canUpload } = await supabase.rpc('can_upload_video')
    
    if (!canUpload) {
      return NextResponse.json({
        success: false,
        error: 'Günlük upload limiti aşıldı (max 50)',
        message: 'Yarın tekrar deneyin'
      }, { status: 429 })
    }
    
    // Sıradaki videoyu al
    const { data: nextItem, error: fetchError } = await supabase
      .rpc('get_next_video_to_process')
    
    if (fetchError) {
      console.error('Queue fetch hatası:', fetchError)
      return NextResponse.json({ error: 'Queue hatası' }, { status: 500 })
    }
    
    if (!nextItem || nextItem.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'İşlenecek video yok',
        processed: 0
      })
    }
    
    const item = nextItem[0] as QueueItem
    console.log(`🎬 [VIDEO PROCESS] Başlıyor: ${item.question_id}`)
    
    // Log: Başladı
    await addLog(supabase, item.queue_id, item.question_id, 'cloud_run', 'started')
    
    // Cloud Run'a gönder
    const result = await sendToCloudRun(item)
    
    if (result.success && result.videoUrl) {
      // Başarılı
      await addLog(supabase, item.queue_id, item.question_id, 'cloud_run', 'completed', {
        videoUrl: result.videoUrl
      })
      
      // Queue'yu tamamla
      await supabase
        .from('video_generation_queue')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', item.queue_id)
      
      // Questions tablosunu güncelle
      await supabase
        .from('questions')
        .update({
          video_status: 'completed',
          video_solution_url: result.videoUrl
        })
        .eq('id', item.question_id)
      
      const duration = Date.now() - startTime
      console.log(`✅ [VIDEO PROCESS] Tamamlandı: ${item.question_id} (${duration}ms)`)
      
      return NextResponse.json({
        success: true,
        message: 'Video işlendi',
        questionId: item.question_id,
        videoUrl: result.videoUrl,
        duration
      })
      
    } else {
      // Hata
      await addLog(supabase, item.queue_id, item.question_id, 'cloud_run', 'failed', null, result.error)
      
      // Retry sayısını kontrol et
      const { data: queueItem } = await supabase
        .from('video_generation_queue')
        .select('retry_count, max_retries')
        .eq('id', item.queue_id)
        .single()
      
      if (queueItem && queueItem.retry_count < queueItem.max_retries) {
        // Tekrar dene
        await supabase
          .from('video_generation_queue')
          .update({
            status: 'pending',
            retry_count: queueItem.retry_count + 1,
            error_message: result.error?.slice(0, 500)
          })
          .eq('id', item.queue_id)
      } else {
        // Max retry aşıldı
        await supabase
          .from('video_generation_queue')
          .update({
            status: 'failed',
            error_message: result.error?.slice(0, 500),
            completed_at: new Date().toISOString()
          })
          .eq('id', item.queue_id)
        
        await supabase
          .from('questions')
          .update({ video_status: 'failed' })
          .eq('id', item.question_id)
      }
      
      return NextResponse.json({
        success: false,
        error: 'Video işlenemedi',
        details: result.error?.slice(0, 500)
      }, { status: 500 })
    }
    
  } catch (error: any) {
    console.error('❌ [VIDEO PROCESS] Hata:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

/**
 * GET - Queue istatistikleri
 */
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ error: 'Giriş gerekli' }, { status: 401 })
  }
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  
  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Admin yetkisi gerekli' }, { status: 403 })
  }
  
  // Video queue stats
  const { data: stats } = await supabase.rpc('get_video_stats')
  
  // YouTube stats
  const { data: ytStats } = await supabase.rpc('get_youtube_stats')
  
  // Son işlenen videolar
  const { data: recentVideos } = await supabase
    .from('video_generation_queue')
    .select(`
      id,
      question_id,
      status,
      created_at,
      completed_at,
      estimated_cost_usd,
      error_message,
      questions(question_text, video_solution_url, video_youtube_id, video_status)
    `)
    .order('created_at', { ascending: false })
    .limit(20)
  
  // Cloud Run durumu
  const cloudRunStatus = VIDEO_GENERATOR_URL ? 'configured' : 'not_configured'
  
  return NextResponse.json({
    success: true,
    stats: stats?.[0] || {
      total_videos: 0,
      pending_count: 0,
      processing_count: 0,
      completed_count: 0,
      failed_count: 0,
      total_cost_usd: 0
    },
    youtube: ytStats || {
      today_uploads: 0,
      remaining_today: 50
    },
    recentVideos: recentVideos || [],
    limits: RATE_LIMITS,
    cloudRun: {
      status: cloudRunStatus,
      url: VIDEO_GENERATOR_URL ? '✓ Configured' : '✗ Not configured'
    }
  })
}
