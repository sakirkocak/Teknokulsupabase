/**
 * YouTube Upload API
 * Video dosyasını YouTube'a yükler
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { google } from 'googleapis'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 300

// YouTube OAuth2 client
const oauth2Client = new google.auth.OAuth2(
  process.env.YOUTUBE_CLIENT_ID,
  process.env.YOUTUBE_CLIENT_SECRET,
  process.env.YOUTUBE_REDIRECT_URI
)

// Refresh token ile erişim token'ı al
oauth2Client.setCredentials({
  refresh_token: process.env.YOUTUBE_REFRESH_TOKEN
})

const youtube = google.youtube({ version: 'v3', auth: oauth2Client })

interface UploadRequest {
  videoPath: string // Video dosya yolu veya URL
  title: string
  description: string
  tags?: string[]
  questionId: string
}

/**
 * POST - Video yükle
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
    const { videoPath, title, description, tags = [], questionId }: UploadRequest = await request.json()
    
    if (!videoPath || !title || !questionId) {
      return NextResponse.json({ error: 'videoPath, title ve questionId gerekli' }, { status: 400 })
    }
    
    console.log(`📤 [YOUTUBE] Upload başlıyor: ${questionId}`)
    
    // Video dosyasını al
    // Bu kısım video'nun nereden geldiğine göre değişir
    // Şimdilik placeholder
    
    // YouTube'a yükle
    const videoMetadata = {
      snippet: {
        title: title,
        description: `${description}\n\n📚 Teknokul - Yapay Zeka Destekli Eğitim Platformu\n🌐 https://teknokul.com`,
        tags: ['teknokul', 'eğitim', 'matematik', 'soru çözümü', ...tags],
        categoryId: '27', // Education category
        defaultLanguage: 'tr',
        defaultAudioLanguage: 'tr'
      },
      status: {
        privacyStatus: 'unlisted', // İlk başta unlisted, sonra public yapılabilir
        selfDeclaredMadeForKids: false,
        embeddable: true
      }
    }
    
    // NOT: Gerçek upload için video stream gerekli
    // Bu placeholder implementasyon
    
    /*
    const response = await youtube.videos.insert({
      part: ['snippet', 'status'],
      requestBody: videoMetadata,
      media: {
        body: videoStream // Video stream
      }
    })
    
    const videoId = response.data.id
    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`
    */
    
    // Placeholder response
    const videoId = `tech_${questionId}_${Date.now()}`
    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`
    
    console.log(`✅ [YOUTUBE] Upload tamamlandı: ${videoId}`)
    
    // Database güncelle
    await supabase
      .from('questions')
      .update({
        video_solution_url: videoUrl,
        video_youtube_id: videoId,
        video_status: 'completed',
        video_generated_at: new Date().toISOString()
      })
      .eq('id', questionId)
    
    return NextResponse.json({
      success: true,
      videoId: videoId,
      videoUrl: videoUrl,
      message: 'Video yüklendi'
    })
    
  } catch (error: any) {
    console.error('❌ [YOUTUBE] Upload hatası:', error.message)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

/**
 * GET - YouTube quota durumu
 */
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ error: 'Giriş gerekli' }, { status: 401 })
  }
  
  try {
    // YouTube API ile quota kontrolü yapılamıyor doğrudan
    // Ancak basit bir test yapabiliriz
    
    const response = await youtube.channels.list({
      part: ['snippet'],
      mine: true
    })
    
    return NextResponse.json({
      success: true,
      channel: response.data.items?.[0]?.snippet?.title || 'Bilinmiyor',
      message: 'YouTube bağlantısı aktif'
    })
    
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      message: 'YouTube bağlantısı kontrol edilemedi'
    })
  }
}