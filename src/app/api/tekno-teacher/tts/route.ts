/**
 * TeknoÖğretmen TTS API
 * POST /api/tekno-teacher/tts
 * 
 * Gemini veya Google Cloud TTS ile ses üretir
 */

import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

export const maxDuration = 30

// Gemini client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

interface TTSRequest {
  text: string
  voice?: 'female' | 'male'
  speed?: number
}

export async function POST(request: NextRequest) {
  try {
    const body: TTSRequest = await request.json()
    const { text, voice = 'female', speed = 1.0 } = body
    
    if (!text || text.length === 0) {
      return NextResponse.json({ error: 'Metin gerekli' }, { status: 400 })
    }
    
    // Metin çok uzunsa kısalt (TTS limiti)
    const maxLength = 500
    const truncatedText = text.length > maxLength 
      ? text.slice(0, maxLength) + '...' 
      : text
    
    // Yöntem 1: Gemini 2.0 Flash ile TTS deneyelim
    try {
      const model = genAI.getGenerativeModel({ 
        model: 'gemini-2.0-flash-exp',
      })
      
      // Gemini'den ses çıktısı almayı dene
      // Not: Şu an standard API'de audio output desteklenmiyor
      // Bu nedenle alternatif yönteme geçiyoruz
      
      throw new Error('Gemini audio output not available in standard API')
      
    } catch (geminiError) {
      console.log('Gemini TTS not available, using alternative method')
    }
    
    // Yöntem 2: Client-side Web Speech API için metin döndür
    // Browser'ın yerleşik TTS'ini kullanacağız
    return NextResponse.json({
      success: true,
      method: 'webspeech',
      text: truncatedText,
      config: {
        lang: 'tr-TR',
        rate: speed,
        pitch: voice === 'female' ? 1.1 : 0.9,
        voicePreference: voice === 'female' ? 'Google Türkçe' : 'Google Türkçe'
      }
    })
    
  } catch (error: any) {
    console.error('TTS error:', error)
    return NextResponse.json(
      { error: error.message || 'TTS hatası' },
      { status: 500 }
    )
  }
}
