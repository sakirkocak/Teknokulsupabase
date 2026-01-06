/**
 * YouTube Playlist API
 * Otomatik playlist oluşturma ve yönetim
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { google } from 'googleapis'
import { 
  TURKISH_CURRICULUM, 
  SUBJECT_CODES,
  generatePlaylistTitle, 
  generatePlaylistDescription,
  getAllPlaylistCombinations 
} from '@/lib/youtube-playlists'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 300

// YouTube client'ı lazy init
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

/**
 * GET - Mevcut playlistleri listele
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
    // Database'den mevcut playlistleri al
    const { data: playlists, error } = await supabase
      .from('youtube_playlists')
      .select('*')
      .order('grade', { ascending: true })
    
    if (error && error.code !== 'PGRST116') {
      throw error
    }
    
    // Tüm olası kombinasyonları al
    const allCombinations = getAllPlaylistCombinations()
    
    // Eksik playlistleri bul
    const existingKeys = new Set((playlists || []).map(p => `${p.grade}-${p.subject_code}`))
    const missingPlaylists = allCombinations.filter(
      c => !existingKeys.has(`${c.grade}-${c.subjectCode}`)
    )
    
    return NextResponse.json({
      success: true,
      playlists: playlists || [],
      totalPossible: allCombinations.length,
      created: playlists?.length || 0,
      missing: missingPlaylists.length,
      missingList: missingPlaylists.slice(0, 10), // İlk 10 eksik
      curriculum: TURKISH_CURRICULUM
    })
    
  } catch (error: any) {
    console.error('Playlist listesi hatası:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

/**
 * POST - Yeni playlist oluştur
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
    const body = await request.json()
    const { grade, subject, createAll } = body
    
    const youtube = getYouTubeClient()
    const results: any[] = []
    
    // Tek playlist mi yoksa tümü mü?
    const playlistsToCreate = createAll 
      ? getAllPlaylistCombinations()
      : [{ grade, subject, subjectCode: SUBJECT_CODES[subject] || subject.toLowerCase() }]
    
    for (const item of playlistsToCreate) {
      // Zaten var mı kontrol et
      const { data: existing } = await supabase
        .from('youtube_playlists')
        .select('id')
        .eq('grade', item.grade)
        .eq('subject_code', item.subjectCode)
        .single()
      
      if (existing) {
        results.push({ ...item, status: 'exists' })
        continue
      }
      
      // YouTube'da playlist oluştur
      const title = generatePlaylistTitle(item.grade, item.subject)
      const description = generatePlaylistDescription(item.grade, item.subject)
      
      try {
        const response = await youtube.playlists.insert({
          part: ['snippet', 'status'],
          requestBody: {
            snippet: {
              title,
              description,
              tags: [item.subject, `${item.grade}. Sınıf`, 'Teknokul', 'Soru Çözümü', 'Eğitim'],
              defaultLanguage: 'tr'
            },
            status: {
              privacyStatus: 'public'
            }
          }
        })
        
        const playlistId = response.data.id
        const playlistUrl = `https://www.youtube.com/playlist?list=${playlistId}`
        
        // Database'e kaydet
        await supabase.from('youtube_playlists').insert({
          grade: item.grade,
          subject: item.subject,
          subject_code: item.subjectCode,
          playlist_id: playlistId,
          playlist_url: playlistUrl,
          video_count: 0
        })
        
        results.push({ 
          ...item, 
          status: 'created', 
          playlistId, 
          playlistUrl 
        })
        
        // Rate limiting - 1 saniye bekle
        await new Promise(resolve => setTimeout(resolve, 1000))
        
      } catch (ytError: any) {
        console.error(`Playlist oluşturma hatası (${item.grade}-${item.subject}):`, ytError.message)
        results.push({ ...item, status: 'error', error: ytError.message })
      }
    }
    
    const created = results.filter(r => r.status === 'created').length
    const errors = results.filter(r => r.status === 'error').length
    
    return NextResponse.json({
      success: true,
      message: `${created} playlist oluşturuldu, ${errors} hata`,
      results
    })
    
  } catch (error: any) {
    console.error('Playlist oluşturma hatası:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
