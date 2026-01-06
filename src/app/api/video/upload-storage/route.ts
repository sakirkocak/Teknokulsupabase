/**
 * Video Storage Upload API
 * Cloud Run'dan gelen videoyu Supabase Storage'a yükler
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 120

const VIDEO_API_SECRET = process.env.VIDEO_API_SECRET || ''

// Service role client (storage için)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    // Auth kontrolü
    const authHeader = request.headers.get('authorization')
    if (VIDEO_API_SECRET && authHeader !== `Bearer ${VIDEO_API_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { questionId, videoBase64, fileName } = await request.json()
    
    if (!questionId || !videoBase64) {
      return NextResponse.json({ error: 'questionId ve videoBase64 gerekli' }, { status: 400 })
    }
    
    console.log(`📤 [STORAGE] Video yükleniyor: ${questionId}`)
    
    // Base64'ü buffer'a çevir
    const videoBuffer = Buffer.from(videoBase64, 'base64')
    const finalFileName = fileName || `solution_${questionId.slice(0, 8)}_${Date.now()}.mp4`
    const filePath = `video-solutions/${finalFileName}`
    
    // Supabase Storage'a yükle
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('videos')
      .upload(filePath, videoBuffer, {
        contentType: 'video/mp4',
        upsert: true
      })
    
    if (uploadError) {
      console.error('Storage upload hatası:', uploadError)
      
      // Bucket yoksa oluştur
      if (uploadError.message.includes('Bucket not found')) {
        await supabaseAdmin.storage.createBucket('videos', {
          public: true,
          fileSizeLimit: 100 * 1024 * 1024 // 100MB
        })
        
        // Tekrar dene
        const { data: retryData, error: retryError } = await supabaseAdmin.storage
          .from('videos')
          .upload(filePath, videoBuffer, {
            contentType: 'video/mp4',
            upsert: true
          })
        
        if (retryError) {
          throw new Error(`Storage retry hatası: ${retryError.message}`)
        }
      } else {
        throw new Error(`Storage hatası: ${uploadError.message}`)
      }
    }
    
    // Public URL al
    const { data: urlData } = supabaseAdmin.storage
      .from('videos')
      .getPublicUrl(filePath)
    
    const videoUrl = urlData.publicUrl
    
    // Questions tablosunu güncelle
    const { error: updateError } = await supabaseAdmin
      .from('questions')
      .update({
        video_status: 'completed',
        video_solution_url: videoUrl
      })
      .eq('id', questionId)
    
    if (updateError) {
      console.error('Questions update hatası:', updateError)
    }
    
    // Queue'yu tamamla
    await supabaseAdmin
      .from('video_generation_queue')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('question_id', questionId)
    
    console.log(`✅ [STORAGE] Video yüklendi: ${videoUrl}`)
    
    return NextResponse.json({
      success: true,
      videoUrl,
      filePath,
      size: videoBuffer.length
    })
    
  } catch (error: any) {
    console.error('❌ [STORAGE] Hata:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
