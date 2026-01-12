/**
 * 🔊 JARVIS - ElevenLabs TTS API
 * 
 * Rachel sesi ile yüksek kaliteli Türkçe ses üretimi
 * ✅ Auth kontrolü - sadece giriş yapmış kullanıcılar
 * ✅ Doğal, empatik ses
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js'
import { JARVIS_IDENTITY } from '@/lib/jarvis'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 30

// ElevenLabs Ses ID'leri
const VOICES = {
  rachel: '21m00Tcm4TlvDq8ikWAM',     // Rachel - doğal, empatik (JARVIS varsayılan)
  female: 'EXAVITQu4vr4xnSDxMaL',     // Rachel multilingual
  male: 'pNInz6obpgDQGcFmaJgB',       // Adam - erkek
  turkish: 'JBFqnCBsd6RMkjVDRZzb'     // Türkçe optimize
}

interface TTSRequest {
  text: string
  voice?: keyof typeof VOICES
  speed?: number // 0.5 - 2.0
}

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  
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
  
  const apiKey = process.env.ELEVENLABS_API_KEY
  if (!apiKey) {
    console.error('❌ ElevenLabs API key yok!')
    return NextResponse.json({ error: 'API key bulunamadı' }, { status: 500 })
  }
  
  try {
    const { text, voice = 'rachel', speed }: TTSRequest = await request.json()
    
    if (!text?.trim()) {
      return NextResponse.json({ error: 'Metin gerekli' }, { status: 400 })
    }
    
    // Metni temizle (max 5000 karakter)
    const cleanText = text.trim().slice(0, 5000)
    const voiceId = VOICES[voice] || VOICES.rachel
    
    console.log(`🔊 [JARVIS] User: ${user.id.slice(0, 8)}... Ses üretiliyor: ${cleanText.slice(0, 50)}...`)
    
    // ElevenLabs Client
    const elevenlabs = new ElevenLabsClient({
      apiKey: apiKey
    })
    
    // Text to Speech - FLASH v2.5 (en hızlı ~75ms!)
    const audioStream = await elevenlabs.textToSpeech.convert(
      voiceId,
      {
        text: cleanText,
        modelId: JARVIS_IDENTITY.voice.model,
        outputFormat: 'mp3_44100_128'
      }
    )
    
    // Stream'i buffer'a çevir
    const chunks: Buffer[] = []
    const reader = audioStream.getReader()
    
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      chunks.push(Buffer.from(value))
    }
    
    const audioBuffer = Buffer.concat(chunks)
    const base64Audio = audioBuffer.toString('base64')
    
    const duration = Date.now() - startTime
    console.log(`✅ [JARVIS] Ses üretildi: ${duration}ms, ${audioBuffer.byteLength} bytes`)
    
    return NextResponse.json({
      success: true,
      audio: base64Audio,
      mimeType: 'audio/mpeg',
      size: audioBuffer.byteLength,
      voice,
      voiceId,
      assistant: JARVIS_IDENTITY.name,
      duration
    })
    
  } catch (error: any) {
    console.error('❌ [JARVIS] TTS hatası:', error.message)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

/**
 * GET - Kullanılabilir sesler
 */
export async function GET() {
  return NextResponse.json({
    assistant: JARVIS_IDENTITY.name,
    default_voice: 'rachel',
    voices: [
      { id: 'rachel', name: 'Rachel (Jarvis)', voiceId: VOICES.rachel, description: 'Doğal, empatik - Jarvis varsayılan sesi' },
      { id: 'female', name: 'Kadın Sesi', voiceId: VOICES.female, description: 'Multilingual kadın' },
      { id: 'male', name: 'Erkek Sesi', voiceId: VOICES.male, description: 'Adam - erkek ses' },
      { id: 'turkish', name: 'Türkçe Ses', voiceId: VOICES.turkish, description: 'Türkçe optimize' }
    ],
    model: JARVIS_IDENTITY.voice.model
  })
}
