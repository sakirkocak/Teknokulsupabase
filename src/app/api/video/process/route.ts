/**
 * Video İşleme API (Background Job)
 * Queue'dan video alıp işler
 * Cron job veya webhook ile tetiklenir
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 300 // 5 dakika

// Cron job secret kontrolü
const CRON_SECRET = process.env.CRON_SECRET || ''

interface QueueItem {
  queue_id: string
  question_id: string
  question_text: string
  options: Record<string, string>
  correct_answer: string
  explanation: string | null
  topic_name: string | null
  subject_name: string | null
}

/**
 * ElevenLabs TTS ile ses üret
 */
async function generateAudio(text: string, supabase: any): Promise<string | null> {
  try {
    // Internal API çağrısı
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/tekno-teacher/elevenlabs-tts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, voice: 'turkish' })
    })
    
    if (!response.ok) {
      console.error('ElevenLabs TTS hatası:', await response.text())
      return null
    }
    
    const data = await response.json()
    return data.audio // base64 audio
    
  } catch (error) {
    console.error('Audio üretim hatası:', error)
    return null
  }
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
 * POST - Video işle (Cron/Webhook)
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now()
  
  // Cron secret kontrolü
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${CRON_SECRET}` && CRON_SECRET) {
    // Admin kontrolü
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 })
    }
    
    // Admin mi?
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    
    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin yetkisi gerekli' }, { status: 403 })
    }
  }
  
  const supabase = await createClient()
  
  try {
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
    await addLog(supabase, item.queue_id, item.question_id, 'started', 'started')
    
    // 1. Gemini ile çözüm adımları üret
    await addLog(supabase, item.queue_id, item.question_id, 'gemini_solution', 'started')
    
    const solutionResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/video/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ questionId: item.question_id })
    })
    
    if (!solutionResponse.ok) {
      throw new Error('Çözüm üretilemedi')
    }
    
    const solutionData = await solutionResponse.json()
    await addLog(supabase, item.queue_id, item.question_id, 'gemini_solution', 'completed', solutionData)
    
    // 2. ElevenLabs TTS
    await addLog(supabase, item.queue_id, item.question_id, 'elevenlabs_tts', 'started')
    
    const narrationText = solutionData.solutionData?.narrationText || item.explanation || 'Çözüm videosu'
    const audioBase64 = await generateAudio(narrationText, supabase)
    
    if (audioBase64) {
      await addLog(supabase, item.queue_id, item.question_id, 'elevenlabs_tts', 'completed', {
        charCount: narrationText.length
      })
    } else {
      await addLog(supabase, item.queue_id, item.question_id, 'elevenlabs_tts', 'failed', null, 'TTS üretilemedi')
    }
    
    // 3. Manim render (Bu kısım server-side Python gerektirir)
    // Şimdilik placeholder - gerçek implementasyon için Python microservice gerekli
    await addLog(supabase, item.queue_id, item.question_id, 'manim_render', 'started')
    
    // TODO: Manim Python script çağrısı
    // Bu kısım için ayrı bir Python microservice veya serverless function gerekli
    // Şimdilik simüle ediyoruz
    
    const videoUrl = `https://youtube.com/watch?v=placeholder_${item.question_id}`
    const youtubeId = `placeholder_${item.question_id}`
    
    await addLog(supabase, item.queue_id, item.question_id, 'manim_render', 'completed')
    
    // 4. YouTube upload (placeholder)
    await addLog(supabase, item.queue_id, item.question_id, 'youtube_upload', 'started')
    
    // TODO: YouTube API ile upload
    // Şimdilik placeholder URL kullanıyoruz
    
    await addLog(supabase, item.queue_id, item.question_id, 'youtube_upload', 'completed', {
      youtubeUrl: videoUrl,
      youtubeId: youtubeId
    })
    
    // 5. Tamamla
    const { error: completeError } = await supabase
      .rpc('complete_video_generation', {
        p_queue_id: item.queue_id,
        p_youtube_url: videoUrl,
        p_youtube_id: youtubeId,
        p_elevenlabs_chars: narrationText.length,
        p_cost_usd: (narrationText.length / 1000) * 0.165 // ElevenLabs maliyet tahmini
      })
    
    if (completeError) {
      throw new Error(`Tamamlama hatası: ${completeError.message}`)
    }
    
    const duration = Date.now() - startTime
    console.log(`✅ [VIDEO PROCESS] Tamamlandı: ${item.question_id} (${duration}ms)`)
    
    return NextResponse.json({
      success: true,
      message: 'Video işlendi',
      questionId: item.question_id,
      videoUrl: videoUrl,
      duration: duration,
      processed: 1
    })
    
  } catch (error: any) {
    console.error('❌ [VIDEO PROCESS] Hata:', error.message)
    
    // Hata durumunda queue'yu güncelle
    // fail_video_generation RPC çağrısı yapılabilir
    
    return NextResponse.json(
      { error: error.message, processed: 0 },
      { status: 500 }
    )
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
  
  // Admin kontrolü
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  
  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Admin yetkisi gerekli' }, { status: 403 })
  }
  
  // İstatistikleri al
  const { data: stats, error } = await supabase.rpc('get_video_stats')
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  // Son işlenen videoları al
  const { data: recentVideos } = await supabase
    .from('video_generation_queue')
    .select(`
      id,
      question_id,
      status,
      created_at,
      completed_at,
      estimated_cost_usd,
      questions(question_text, video_solution_url, video_youtube_id, video_status)
    `)
    .order('created_at', { ascending: false })
    .limit(20)
  
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
    recentVideos: recentVideos || []
  })
}