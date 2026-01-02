/**
 * 🔊 TeknoÖğretmen - ElevenLabs TTS API
 * 
 * Yüksek kaliteli Türkçe ses üretimi
 * ElevenLabs SDK kullanır
 */

import { NextRequest, NextResponse } from 'next/server'
import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 30

// ElevenLabs Türkçe ses ID'leri
const VOICES = {
  female: 'EXAVITQu4vr4xnSDxMaL',   // Rachel - multilingual kadın
  male: 'pNInz6obpgDQGcFmaJgB',      // Adam - erkek
  natural: '21m00Tcm4TlvDq8ikWAM',   // Rachel doğal
  turkish: 'JBFqnCBsd6RMkjVDRZzb'    // Varsayılan
}

interface TTSRequest {
  text: string
  voice?: keyof typeof VOICES
}

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  
  const apiKey = process.env.ELEVENLABS_API_KEY
  if (!apiKey) {
    console.error('❌ ElevenLabs API key yok!')
    return NextResponse.json({ error: 'API key bulunamadı' }, { status: 500 })
  }
  
  try {
    const { text, voice = 'turkish' }: TTSRequest = await request.json()
    
    if (!text?.trim()) {
      return NextResponse.json({ error: 'Metin gerekli' }, { status: 400 })
    }
    
    // Metni temizle (max 5000 karakter)
    const cleanText = text.trim().slice(0, 5000)
    const voiceId = VOICES[voice] || VOICES.turkish
    
    console.log(`🔊 [ELEVENLABS] Ses üretiliyor: ${cleanText.slice(0, 50)}...`)
    
    // ElevenLabs Client
    const elevenlabs = new ElevenLabsClient({
      apiKey: apiKey
    })
    
    // Text to Speech - FLASH v2.5 (en hızlı ~75ms!)
    const audioStream = await elevenlabs.textToSpeech.convert(
      voiceId,
      {
        text: cleanText,
        modelId: 'eleven_flash_v2_5',  // En hızlı model - 75ms gecikme
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
    console.log(`✅ [ELEVENLABS] Ses üretildi: ${duration}ms, ${audioBuffer.byteLength} bytes`)
    
    return NextResponse.json({
      success: true,
      audio: base64Audio,
      mimeType: 'audio/mpeg',
      size: audioBuffer.byteLength,
      voice,
      duration
    })
    
  } catch (error: any) {
    console.error('❌ [ELEVENLABS] Hata:', error.message)
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
    voices: [
      { id: 'female', name: 'Kadın Sesi', voiceId: VOICES.female },
      { id: 'male', name: 'Erkek Sesi', voiceId: VOICES.male },
      { id: 'natural', name: 'Doğal Ses', voiceId: VOICES.natural },
      { id: 'turkish', name: 'Türkçe Ses', voiceId: VOICES.turkish }
    ],
    model: 'eleven_flash_v2_5'
  })
}
