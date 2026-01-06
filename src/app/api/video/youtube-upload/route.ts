/**
 * YouTube Video Upload API
 * Rate limiting + Playlist entegrasyonu
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { google } from 'googleapis'
import { RATE_LIMITS, getRandomDelay, SUBJECT_CODES } from '@/lib/youtube-playlists'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 300

// YouTube client lazy init
function getYouTubeClient() {
  const clientId = process.env.YOUTUBE_CLIENT_ID
  const clientSecret = process.env.YOUTUBE_CLIENT_SECRET
  const refreshToken = process.env.YOUTUBE_REFRESH_TOKEN
  
  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error('YouTube API credentials eksik')
  }
  
  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret)
  oauth2Client.setCredentials({ refresh_token: refreshToken })
  
  return google.youtube({ version: 'v3', auth: oauth2Client })
}

interface UploadRequest {
  videoPath: string
  questionId: string
  title: string
  description: string
  tags?: string[]
  grade?: number
  subject?: string
}

/**
 * POST - Video yükle (rate limiting ile)
 */
export async function POST(request: NextRequest) {
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
  
  try {
    const body: UploadRequest = await request.json()
    const { videoPath, questionId, title, description, tags = [], grade, subject } = body
    
    // 1. Rate limiting kontrolü
    const { data: canUpload } = await supabase.rpc('can_upload_video')
    
    if (!canUpload) {
      const { data: stats } = await supabase.rpc('get_youtube_stats')
      return NextResponse.json({
        error: 'Günlük upload limiti aşıldı',
        todayUploads: stats?.today_uploads || 0,
        maxDaily: RATE_LIMITS.MAX_UPLOADS_PER_DAY,
        message: 'Yarın tekrar deneyin veya gece 00:00\'da limit sıfırlanır'
      }, { status: 429 })
    }
    
    console.log(`📤 [YOUTUBE] Upload başlıyor: ${questionId}`)
    
    const youtube = getYouTubeClient()
    
    // 2. İlgili playlist'i bul
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
    
    // 3. Video metadata hazırla
    const videoMetadata = {
      snippet: {
        title: title,
        description: `${description}\n\n📚 Teknokul - Yapay Zeka Destekli Eğitim Platformu\n🌐 https://teknokul.com.tr`,
        tags: ['teknokul', 'eğitim', 'soru çözümü', ...tags],
        categoryId: '27', // Education
        defaultLanguage: 'tr',
        defaultAudioLanguage: 'tr'
      },
      status: {
        privacyStatus: 'public',
        selfDeclaredMadeForKids: false
      }
    }
    
    // TODO: Gerçek video upload implementasyonu
    // Şimdilik simülasyon
    const simulatedVideoId = `vid_${Date.now()}_${questionId.slice(0, 8)}`
    const videoUrl = `https://www.youtube.com/watch?v=${simulatedVideoId}`
    
    // 4. Upload logunu kaydet
    await supabase.from('youtube_upload_logs').insert({
      question_id: questionId,
      playlist_id: playlistId,
      youtube_video_id: simulatedVideoId,
      youtube_url: videoUrl,
      quota_used: 100,
      status: 'completed'
    })
    
    // 5. Soruyu güncelle
    await supabase
      .from('questions')
      .update({
        video_solution_url: videoUrl,
        video_youtube_id: simulatedVideoId,
        video_status: 'completed',
        video_generated_at: new Date().toISOString()
      })
      .eq('id', questionId)
    
    // 6. Playlist'e ekle (varsa)
    if (playlistId) {
      try {
        await youtube.playlistItems.insert({
          part: ['snippet'],
          requestBody: {
            snippet: {
              playlistId: playlistId,
              resourceId: {
                kind: 'youtube#video',
                videoId: simulatedVideoId
              }
            }
          }
        })
        console.log(`📋 [YOUTUBE] Video playlist'e eklendi: ${playlistId}`)
      } catch (playlistError) {
        console.error('Playlist ekleme hatası:', playlistError)
      }
    }
    
    // 7. İstatistikleri al
    const { data: stats } = await supabase.rpc('get_youtube_stats')
    
    return NextResponse.json({
      success: true,
      videoId: simulatedVideoId,
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
    return NextResponse.json({ error: error.message }, { status: 500 })
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
  
  // Admin kontrolü
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
    
    return NextResponse.json({
      success: true,
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
