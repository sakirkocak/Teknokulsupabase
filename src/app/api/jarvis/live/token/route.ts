/**
 * 🎙️ JARVIS LiveKit - Token API
 * 
 * LiveKit odası için access token oluşturur
 * Real-time sesli sohbet için kullanılır
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { AccessToken } from 'livekit-server-sdk'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface TokenRequest {
  roomName?: string
}

export async function POST(request: NextRequest) {
  try {
    // =====================================================
    // 🔒 AUTH KONTROLÜ
    // =====================================================
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ 
        error: 'Giriş yapmanız gerekiyor',
        requireAuth: true
      }, { status: 401 })
    }
    
    // LiveKit credentials
    const apiKey = process.env.LIVEKIT_API_KEY
    const apiSecret = process.env.LIVEKIT_API_SECRET
    const wsUrl = process.env.LIVEKIT_URL
    
    if (!apiKey || !apiSecret || !wsUrl) {
      console.error('❌ LiveKit credentials eksik!')
      return NextResponse.json({ 
        error: 'LiveKit yapılandırması eksik' 
      }, { status: 500 })
    }
    
    // İstek body
    const body: TokenRequest = await request.json().catch(() => ({}))
    
    // Oda adı: kullanıcıya özel veya belirtilen
    const roomName = body.roomName || `jarvis-${user.id.slice(0, 8)}`
    
    // Kullanıcı profili
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single()
    
    const participantName = profile?.full_name || 'Öğrenci'
    const participantIdentity = user.id
    
    // Access Token oluştur
    const token = new AccessToken(apiKey, apiSecret, {
      identity: participantIdentity,
      name: participantName,
      ttl: 3600 // 1 saat geçerli
    })
    
    // Oda izinleri
    token.addGrant({
      room: roomName,
      roomJoin: true,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
      canUpdateOwnMetadata: true
    })
    
    const jwt = await token.toJwt()
    
    console.log(`🎙️ [JARVIS] LiveKit token oluşturuldu: ${participantName} -> ${roomName}`)
    
    return NextResponse.json({
      success: true,
      token: jwt,
      roomName,
      wsUrl,
      participant: {
        identity: participantIdentity,
        name: participantName
      }
    })
    
  } catch (error: any) {
    console.error('❌ [JARVIS] LiveKit token hatası:', error.message)
    return NextResponse.json({ 
      error: error.message 
    }, { status: 500 })
  }
}

/**
 * GET - LiveKit bağlantı durumu
 */
export async function GET() {
  const wsUrl = process.env.LIVEKIT_URL
  const hasCredentials = !!(process.env.LIVEKIT_API_KEY && process.env.LIVEKIT_API_SECRET)
  
  return NextResponse.json({
    success: true,
    configured: hasCredentials,
    wsUrl: hasCredentials ? wsUrl : null,
    features: {
      vad: true, // Voice Activity Detection
      bargeIn: true, // Söz kesme desteği
      realtime: true // Real-time ses
    }
  })
}
