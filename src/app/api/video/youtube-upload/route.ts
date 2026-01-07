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
  videoBase64?: string
  thumbnailBase64?: string
  thumbnailMimeType?: string
}

function base64ToStream(base64: string): Readable {
  const buffer = Buffer.from(base64, 'base64')
  return Readable.from(buffer)
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  
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
      grade = 8, 
      subject = 'Matematik',
      topicName = 'Soru Çözümü',
      questionText = '',
      thumbnailBase64,
      thumbnailMimeType
    } = body
    
    if (!questionId) {
      return NextResponse.json({ error: 'questionId gerekli' }, { status: 400 })
    }
    
    if (!videoBase64) {
      return NextResponse.json({ error: 'videoBase64 gerekli' }, { status: 400 })
    }
    
    // Rate limiting
    const { data: canUpload } = await supabase.rpc('can_upload_video')
    
    if (!canUpload) {
      const { data: stats } = await supabase.rpc('get_youtube_stats')
      return NextResponse.json({
        error: 'Günlük upload limiti aşıldı',
        todayUploads: stats?.today_uploads || 0,
        maxDaily: RATE_LIMITS.MAX_UPLOADS_PER_DAY
      }, { status: 429 })
    }
    
    console.log(`📤 [YOUTUBE] Upload başlıyor: ${questionId}`)
    
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
    
    // Video metadata - düzeltilmiş fonksiyon çağrıları
    const videoTitle = body.title || generateVideoTitle(
      grade,
      subject,
      topicName,
      questionText.slice(0, 50)
    )
    
    const videoDescription = body.description || generateVideoDescription({
      grade,
      subject,
      topic: topicName,
      questionText,
      questionId,
      difficulty: 'Orta'
    })
    
    const videoTags = body.tags || generateVideoTags({ grade, subject, topic: topicName })
    
    // Playlist bul
    let playlistId: string | null = null
    const subjectCode = SUBJECT_CODES[subject] || subject.toLowerCase().replace(/\s+/g, '-')
    const { data: playlist } = await supabase
      .from('youtube_playlists')
      .select('playlist_id')
      .eq('grade', grade)
      .eq('subject_code', subjectCode)
      .single()
    
    playlistId = playlist?.playlist_id || null
    
    // Playlist yoksa otomatik oluştur (kanalda playlistler görünmüyor sorununu çözer)
    if (!playlistId) {
      try {
        const title = `${grade}. Sınıf ${subject} Soru Çözümleri | Teknokul`
        const description = generateVideoDescription({
          grade,
          subject,
          topic: `${subject} Soru Çözümleri`,
          questionText: '',
          questionId,
          difficulty: 'Orta'
        })
        
        const created = await youtube.playlists.insert({
          part: ['snippet', 'status'],
          requestBody: {
            snippet: {
              title: title.slice(0, 150),
              description: description.slice(0, 5000),
              defaultLanguage: 'tr'
            },
            status: { privacyStatus: 'public' }
          }
        })
        
        playlistId = created.data.id || null
        if (playlistId) {
          const playlistUrl = `https://www.youtube.com/playlist?list=${playlistId}`
          await supabase.from('youtube_playlists').upsert({
            grade,
            subject,
            subject_code: subjectCode,
            playlist_id: playlistId,
            playlist_url: playlistUrl,
            video_count: 0
          }, { onConflict: 'grade,subject_code' })
          console.log(`📋 [YOUTUBE] Playlist oluşturuldu: ${playlistId}`)
        }
      } catch (e: any) {
        console.error('Playlist auto-create hatası:', e?.message || e)
      }
    }
    
    // Video stream
    const videoStream = base64ToStream(videoBase64)
    const videoSizeBytes = Buffer.from(videoBase64, 'base64').length
    
    console.log(`📦 [YOUTUBE] Video: ${(videoSizeBytes / 1024).toFixed(1)} KB`)
    console.log(`🚀 [YOUTUBE] Yükleniyor...`)
    
    // YOUTUBE UPLOAD
    const uploadResponse = await youtube.videos.insert({
      part: ['snippet', 'status'],
      requestBody: {
        snippet: {
          title: videoTitle.slice(0, 100),
          description: videoDescription.slice(0, 5000),
          tags: videoTags.slice(0, 30),
          categoryId: '27',
          defaultLanguage: 'tr',
          defaultAudioLanguage: 'tr'
        },
        status: {
          privacyStatus: 'public',
          selfDeclaredMadeForKids: false,
          embeddable: true
        }
      },
      media: {
        mimeType: 'video/mp4',
        body: videoStream
      }
    })
    
    const youtubeVideoId = uploadResponse.data.id
    const videoUrl = `https://www.youtube.com/watch?v=${youtubeVideoId}`
    
    console.log(`✅ [YOUTUBE] Yüklendi: ${videoUrl}`)
    
    // Thumbnail set et (varsa)
    if (youtubeVideoId && thumbnailBase64) {
      try {
        const thumbStream = base64ToStream(thumbnailBase64)
        await youtube.thumbnails.set({
          videoId: youtubeVideoId,
          media: {
            mimeType: thumbnailMimeType || 'image/png',
            body: thumbStream
          }
        })
        console.log(`🖼️ [YOUTUBE] Thumbnail yüklendi`)
      } catch (e: any) {
        console.error('Thumbnail upload hatası:', e.message)
      }
    }
    
    // Log kaydet
    await supabase.from('youtube_upload_logs').insert({
      question_id: questionId,
      playlist_id: playlistId,
      youtube_video_id: youtubeVideoId,
      youtube_url: videoUrl,
      quota_used: 1600,
      status: 'completed'
    })
    
    // Soruyu güncelle
    await supabase
      .from('questions')
      .update({
        video_solution_url: videoUrl,
        video_youtube_id: youtubeVideoId,
        video_status: 'completed',
        video_generated_at: new Date().toISOString()
      })
      .eq('id', questionId)
    
    // Queue güncelle
    await supabase
      .from('video_generation_queue')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('question_id', questionId)
    
    // Playlist'e ekle
    if (playlistId && youtubeVideoId) {
      try {
        await youtube.playlistItems.insert({
          part: ['snippet'],
          requestBody: {
            snippet: {
              playlistId,
              resourceId: {
                kind: 'youtube#video',
                videoId: youtubeVideoId
              }
            }
          }
        })
        console.log(`📋 [YOUTUBE] Playlist'e eklendi`)
      } catch (e: any) {
        console.error('Playlist hatası:', e.message)
      }
    }
    
    const { data: stats } = await supabase.rpc('get_youtube_stats')
    
    return NextResponse.json({
      success: true,
      videoId: youtubeVideoId,
      videoUrl,
      playlistId,
      stats: {
        todayUploads: stats?.today_uploads || 0,
        remainingToday: stats?.remaining_today || 0
      }
    })
    
  } catch (error: any) {
    console.error('❌ [YOUTUBE] Hata:', error.message)
    if (error.response?.data) {
      console.error('API yanıtı:', JSON.stringify(error.response.data, null, 2))
    }
    return NextResponse.json({ 
      error: error.message,
      details: error.response?.data?.error?.message || null
    }, { status: 500 })
  }
}

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
  
  const { data: stats } = await supabase.rpc('get_youtube_stats')
  
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
      remaining_today: 50
    },
    limits: RATE_LIMITS
  })
}
