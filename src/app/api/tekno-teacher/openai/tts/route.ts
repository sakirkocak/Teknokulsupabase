/**
 * TeknoÖğretmen - OpenAI TTS API
 * POST /api/tekno-teacher/openai/tts
 * 
 * Model: tts-1-hd (yüksek kalite)
 * Ses: nova (kadın, samimi) veya onyx (erkek, derin)
 */

import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 30

// TTS Ayarları
const TTS_MODEL = 'tts-1-hd'  // Yüksek kaliteli
const DEFAULT_VOICE: 'nova' | 'onyx' | 'alloy' | 'echo' | 'fable' | 'shimmer' = 'nova'  // Samimi kadın sesi

interface TTSRequest {
  text: string
  voice?: 'nova' | 'onyx' | 'alloy' | 'echo' | 'fable' | 'shimmer'
  speed?: number  // 0.25 - 4.0
}

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  console.log('🔊 [TTS] === SES ÜRETİMİ ===')
  
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    console.error('❌ [TTS] API key yok!')
    return NextResponse.json({ error: 'API key bulunamadı' }, { status: 500 })
  }
  
  try {
    const body: TTSRequest = await request.json()
    const { 
      text, 
      voice = DEFAULT_VOICE,
      speed = 1.0
    } = body
    
    if (!text || text.trim().length === 0) {
      return NextResponse.json({ error: 'Metin gerekli' }, { status: 400 })
    }
    
    console.log(`📝 [TTS] Metin: "${text.substring(0, 50)}..."`)
    console.log(`🎤 [TTS] Ses: ${voice}, Hız: ${speed}`)
    
    const openai = new OpenAI({ apiKey })
    
    // TTS çağrısı
    const mp3Response = await openai.audio.speech.create({
      model: TTS_MODEL,
      voice: voice,
      input: text,
      speed: Math.max(0.25, Math.min(4.0, speed)),
      response_format: 'mp3'
    })
    
    // ArrayBuffer olarak al
    const arrayBuffer = await mp3Response.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    
    // Base64'e çevir
    const base64Audio = buffer.toString('base64')
    
    const duration = Date.now() - startTime
    console.log(`✅ [TTS] Ses üretildi: ${buffer.length} bytes`)
    console.log(`⏱️ [TTS] Süre: ${duration}ms`)
    
    return NextResponse.json({
      success: true,
      audio: base64Audio,
      mimeType: 'audio/mpeg',
      size: buffer.length,
      voice,
      duration
    })
    
  } catch (error: any) {
    console.error('❌ [TTS] Hata:', error.message)
    return NextResponse.json({ 
      error: error.message,
      fallback: true  // Client tarafında browser TTS kullan
    }, { status: 500 })
  }
}

// Ses karakterleri hakkında bilgi
export async function GET() {
  return NextResponse.json({
    model: TTS_MODEL,
    defaultVoice: DEFAULT_VOICE,
    voices: {
      nova: { description: 'Samimi kadın sesi - TeknoÖğretmen için ideal', gender: 'female' },
      onyx: { description: 'Derin erkek sesi - Güven veren', gender: 'male' },
      alloy: { description: 'Nötr ses', gender: 'neutral' },
      echo: { description: 'Yumuşak erkek sesi', gender: 'male' },
      fable: { description: 'Anlatıcı ses', gender: 'neutral' },
      shimmer: { description: 'Parlak kadın sesi', gender: 'female' }
    },
    speedRange: { min: 0.25, max: 4.0, default: 1.0 }
  })
}
