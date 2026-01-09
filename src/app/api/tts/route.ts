import { NextRequest, NextResponse } from 'next/server'

// Türkçe profesyonel sesler
const VOICES = {
  erdem: 'spa9IALJDrGWqKYWII2J',
  mehmet: 'RiIWpdXo71aR6kOsLsEw',
  gamze: 'Hvrobr8BhLPfiaSv2cHi',
}

// Cache için basit memory store (production'da Redis kullanılmalı)
const audioCache = new Map<string, ArrayBuffer>()

export async function POST(request: NextRequest) {
  try {
    const { text, voice = 'erdem' } = await request.json()

    if (!text || text.length === 0) {
      return NextResponse.json({ error: 'Text gerekli' }, { status: 400 })
    }

    // Cache kontrolü
    const cacheKey = `${voice}:${text.substring(0, 100)}`
    if (audioCache.has(cacheKey)) {
      const cached = audioCache.get(cacheKey)!
      return new NextResponse(cached, {
        headers: {
          'Content-Type': 'audio/mpeg',
          'X-Cache': 'HIT'
        }
      })
    }

    const voiceId = VOICES[voice as keyof typeof VOICES] || VOICES.erdem

    // ElevenLabs API çağrısı
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: 'POST',
        headers: {
          'xi-api-key': process.env.ELEVENLABS_API_KEY!,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: text,
          model_id: 'eleven_turbo_v2_5',
          voice_settings: {
            stability: 0.70,
            similarity_boost: 0.80,
            style: 0.35,
            use_speaker_boost: true
          }
        }),
      }
    )

    if (!response.ok) {
      console.error('ElevenLabs error:', response.status, await response.text())
      return NextResponse.json(
        { error: 'TTS oluşturulamadı' },
        { status: 500 }
      )
    }

    const audioBuffer = await response.arrayBuffer()
    
    // Cache'e kaydet (max 100 entry)
    if (audioCache.size > 100) {
      const firstKey = audioCache.keys().next().value
      if (firstKey) audioCache.delete(firstKey)
    }
    audioCache.set(cacheKey, audioBuffer)

    return new NextResponse(audioBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'X-Cache': 'MISS'
      }
    })
  } catch (error) {
    console.error('TTS error:', error)
    return NextResponse.json(
      { error: 'TTS hatası' },
      { status: 500 }
    )
  }
}
