/**
 * YouTube Video Upload API
 * Gerçek YouTube upload + Rate limiting + Playlist entegrasyonu
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { google } from 'googleapis'
import { Readable } from 'stream'
import { 
  RATE_LIMITS, 
  SUBJECT_CODES,
  generateVideoTitle,
  generateVideoDescription,
  generateVideoTags
} from '@/lib/youtube-playlists'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 300

// YouTube client lazy init
function getYouTubeClient() {
  const clientId = process.env.YOUTUBE_CLIENT_ID
  const clientSecret = process.env.YOUTUBE_CLIENT_SECRET
  const refreshToken = process.env.YOUTUBE_REFRESH_TOKEN
  
  if (!clientId || !clientSecret || !refreshToken) {
    console.error('YouTube credentials eksik:', { 
      hasClientId: !!clientId, 
      hasClientSecret: !!clientSecret, 
      hasRefreshToken: !!refreshToken 
    })
    throw new Error('YouTube API credentials eksik')
  }
  
  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret)
  oauth2Client.setCredentials({ refresh_token: refreshToken })
  
  return google.youtube({ version: 'v3', auth: oauth2Client })
}

interface UploadRequest {
  questionId: string
  title?: string
  description?: string
  tags?: string[]
  grade?: number
  subject?: string
  topicName?: string
  questionText?: string
  // Video data - base64 veya path
  videoBase64?: string
  videoPath?: string
}

/**
 * Base64'ü Readable stream'e çevir
 */
function base64ToStream(base64: string): Readable {
  const buffer = Buffer.from(base64, 'base64')
  return Readable.from(buffer)
}

/**
 * POST - Video yükle (gerçek YouTube upload)
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  
  // Auth kontrolü - API secret veya user session
  const authHeader = request.headers.get('authorization')
  const apiSecret = process.env.VIDEO_API_SECRET
  const isApiCall = apiSecret && authHeader === `Bearer ${apiSecret}`
  
  if (!isApiCall) {
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
  }
  
  try {
    const body: UploadRequest = await request.json()
    const { 
      questionId, 
      videoBase64,
      grade, 
      subject,
      topicName,
      questionText
    } = body
    
    if (!questionId) {
      return NextResponse.json({ error: 'questionId gerekli' }, { status: 400 })
    }
    
    if (!videoBase64) {
      return NextResponse.json({ error: 'videoBase64 gerekli' }, { status: 400 })
    }
    
    // 1. Rate limiting kontrolü
    const { data: canUpload } = await supabase.rpc('can_upload_video')
    
    if (!canUpload) {
      const { data: stats } = await supabase.rpc('get_youtube_stats')
      return NextResponse.json({
        error: 'Günlük upload limiti aşıldı',
        todayUploads: stats?.today_uploads || 0,
        maxDaily: RATE_LIMITS.MAX_UPLOADS_PER_DAY,
        message: 'Yarın tekrar deneyin'
      }, { status: 429 })
    }
    
    console.log(`📤 [YOUTUBE] Upload başlıyor: ${questionId}`)
    
    // 2. YouTube client al
    let youtube
    try {
      youtube = getYouTubeClient()
    } catch (credError: any) {
      console.error('YouTube credentials hatası:', credError.message)
      return NextResponse.json({ 
        error: 'YouTube yapılandırması eksik',
        details: credError.message 
      }, { status: 500 })
    }
    
    // 3. Video metadata hazırla
    const videoTitle = body.title || generateVideoTitle({
      grade: grade || 8,
      subjectName: subject || 'Matematik',
      topicName: topicName || 'Soru Çözümü',
      questionId
    })
    
    const videoDescription = body.description || generateVideoDescription({
      questionText: questionText || '',
      grade: grade || 8,
      subjectName: subject || 'Matematik',
      topicName: topicName || 'Soru Çözümü',
      questionId
    })
    
    const videoTags = body.tags || generateVideoTags({
      grade: grade || 8,
      subjectName: subject || 'Matematik',
      topicName: topicName || ''
    })
    
    // 4. İlgili playlist'i bul
    let playlistId: string | null = null
    if (grade && subject) {
      const subjectCode = SUBJECT_CODES[subject] || subject.toLowerCase().replace(/\s+/g, '-')
      const { data: playlist } = await supabase
        .from('youtube_playlists')
        .select('playlist_id')
        .eq('grade', grade)
        .eq('subject_code', subjectCode)
        .single()
      
      playlistId = playlist?.playlist_id || null
    }
    
    // 5. Video stream hazırla
    const videoStream = base64ToStream(videoBase64)
    const videoSizeBytes = Buffer.from(videoBase64, 'base64').length
    
    console.log(`📦 [YOUTUBE] Video boyutu: ${(videoSizeBytes / 1024).toFixed(1)} KB`)
    
    // 6. GERÇEK YOUTUBE UPLOAD
    console.log(`🚀 [YOUTUBE] YouTube'a yükleniyor...`)
    
    const uploadResponse = await youtube.videos.insert({
      part: ['snippet', 'status'],
      requestBody: {
        snippet: {
          title: videoTitle.slice(0, 100), // Max 100 karakter
          description: videoDescription.slice(0, 5000), // Max 5000 karakter
          tags: videoTags.slice(0, 500), // Max 500 tag
          categoryId: '27', // Education
          defaultLanguage: 'tr',
          defaultAudioLanguage: 'tr'
        },
        status: {
          privacyStatus: 'public',
          selfDeclaredMadeForKids: false,
          embeddable: true,
          publicStatsViewable: true
        }
      },
      media: {
        mimeType: 'video/mp4',
        body: videoStream
      }
    })
    
    const youtubeVideoId = uploadResponse.data.id
    const videoUrl = `https://www.youtube.com/watch?v=${youtubeVideoId}`
    
    console.log(`✅ [YOUTUBE] Video yüklendi: ${videoUrl}`)
    
    // 7. Upload logunu kaydet
    await supabase.from('youtube_upload_logs').insert({
      question_id: questionId,
      playlist_id: playlistId,
      youtube_video_id: youtubeVideoId,
      youtube_url: videoUrl,
      quota_used: 1600, // videos.insert yaklaşık 1600 quota kullanır
      status: 'completed'
    })
    
    // 8. Soruyu güncelle
    await supabase
      .from('questions')
      .update({
        video_solution_url: videoUrl,
        video_youtube_id: youtubeVideoId,
        video_status: 'completed',
        video_generated_at: new Date().toISOString()
      })
      .eq('id', questionId)
    
    // 9. Queue'yu güncelle
    await supabase
      .from('video_generation_queue')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('question_id', questionId)
    
    // 10. Playlist'e ekle (varsa)
    if (playlistId && youtubeVideoId) {
      try {
        await youtube.playlistItems.insert({
          part: ['snippet'],
          requestBody: {
            snippet: {
              playlistId: playlistId,
              resourceId: {
                kind: 'youtube#video',
                videoId: youtubeVideoId
              }
            }
          }
        })
        console.log(`📋 [YOUTUBE] Video playlist'e eklendi: ${playlistId}`)
      } catch (playlistError: any) {
        console.error('Playlist ekleme hatası:', playlistError.message)
      }
    }
    
    // 11. İstatistikleri al
    const { data: stats } = await supabase.rpc('get_youtube_stats')
    
    return NextResponse.json({
      success: true,
      videoId: youtubeVideoId,
      videoUrl: videoUrl,
      playlistId: playlistId,
      stats: {
        todayUploads: stats?.today_uploads || 0,
        remainingToday: stats?.remaining_today || 0,
        quotaUsed: stats?.quota_used || 0
      }
    })
    
  } catch (error: any) {
    console.error('❌ [YOUTUBE] Upload hatası:', error.message)
    
    // Detaylı hata bilgisi
    if (error.response?.data) {
      console.error('YouTube API yanıtı:', JSON.stringify(error.response.data, null, 2))
    }
    
    return NextResponse.json({ 
      error: error.message,
      details: error.response?.data?.error?.message || null
    }, { status: 500 })
  }
}

/**
 * GET - Upload istatistikleri
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
  
  try {
    const { data: stats } = await supabase.rpc('get_youtube_stats')
    
    // YouTube credentials kontrolü
    const hasCredentials = !!(
      process.env.YOUTUBE_CLIENT_ID && 
      process.env.YOUTUBE_CLIENT_SECRET && 
      process.env.YOUTUBE_REFRESH_TOKEN
    )
    
    return NextResponse.json({
      success: true,
      configured: hasCredentials,
      stats: stats || {
        total_playlists: 0,
        total_videos_uploaded: 0,
        today_uploads: 0,
        remaining_today: 50,
        quota_used: 0,
        quota_remaining: 10000
      },
      limits: RATE_LIMITS
    })
    
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
