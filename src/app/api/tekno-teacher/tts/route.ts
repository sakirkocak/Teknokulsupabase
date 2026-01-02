/**
 * TeknoÖğretmen TTS API
 * POST /api/tekno-teacher/tts
 * 
 * Gemini 2.5 Flash Native TTS ile ses üretir
 * Model: gemini-2.5-flash-preview-tts
 */

import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { generateSpeech, getVoiceForPersonality, TTS_VOICES } from '@/lib/tekno-teacher-ai'

export const maxDuration = 30

// Gemini client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

interface TTSRequest {
  text: string
  voice?: string
  personality?: 'friendly' | 'strict' | 'motivating'
}

export async function POST(request: NextRequest) {
  try {
    const body: TTSRequest = await request.json()
    const { text, voice, personality = 'friendly' } = body
    
    if (!text || text.length === 0) {
      return NextResponse.json({ error: 'Metin gerekli' }, { status: 400 })
    }
    
    // Metin çok uzunsa kısalt (TTS limiti: ~500 karakter optimal)
    const maxLength = 500
    const truncatedText = text.length > maxLength 
      ? text.slice(0, maxLength) + '...' 
      : text
    
    // Ses karakterini belirle
    const selectedVoice = voice || getVoiceForPersonality(personality)
    
    console.log(`🎙️ TTS Request: ${truncatedText.slice(0, 50)}... | Voice: ${selectedVoice}`)
    
    // Yöntem 1: Gemini Native TTS dene
    try {
      const audioResult = await generateSpeech(truncatedText, selectedVoice)
      
      if (audioResult) {
        console.log('✅ Gemini Native TTS başarılı')
        return NextResponse.json({
          success: true,
          method: 'gemini-native',
          audioBase64: audioResult.audioBase64,
          mimeType: audioResult.mimeType,
          voice: selectedVoice
        })
      }
    } catch (geminiError: any) {
      console.log('⚠️ Gemini TTS failed:', geminiError.message)
    }
    
    // Yöntem 2: Fallback - Client-side Web Speech API
    console.log('📢 Fallback: Web Speech API kullanılacak')
    return NextResponse.json({
      success: true,
      method: 'webspeech',
      text: truncatedText,
      config: {
        lang: 'tr-TR',
        rate: 1.0,
        pitch: personality === 'strict' ? 0.9 : 1.05,
        voicePreference: 'Google Türkçe'
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
