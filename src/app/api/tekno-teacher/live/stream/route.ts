/**
 * TeknoÖğretmen Live Stream API
 * POST /api/tekno-teacher/live/stream
 * 
 * HİBRİT MOD:
 * - Node.js runtime (stabil)
 * - SSE streaming
 * - Gemini Native Audio (server-side TTS)
 * - İsim gömülü prompt
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkAndUseCredit } from '@/lib/tekno-teacher'

// Node.js runtime
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

// Gemini API - Audio destekli model
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent'

interface LiveStreamRequest {
  action: 'setup' | 'text'
  studentName?: string
  grade?: number
  personality?: 'friendly' | 'strict' | 'motivating'
  voice?: string
  textMessage?: string
}

// Ses karakterleri
const VOICES: Record<string, string> = {
  'Kore': 'Kore',
  'Charon': 'Charon', 
  'Aoede': 'Aoede',
  'Puck': 'Puck',
  'Fenrir': 'Fenrir'
}

// System instruction - İSİM GÖMÜLÜ
function buildSystemInstruction(studentName: string, grade: number): string {
  return `Sen TeknoÖğretmen'sin.

🎯 ÖĞRENCİN: ${studentName} (${grade}. sınıf)

📋 KURALLARIN:
1. HER yanıta "${studentName}" diye başla
2. Kısa konuş (max 2 cümle)
3. Soru sor
4. Türkçe konuş

💬 İLK MESAJIN: "Selam ${studentName}! Ben senin özel öğretmeninim. Bugün ne çalışalım?"`
}

export async function POST(request: NextRequest) {
  console.log('🟢 [LIVE] Yeni istek')
  
  try {
    // Auth
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Giriş yapmanız gerekiyor' }, { status: 401 })
    }
    
    // Kredi
    const creditStatus = await checkAndUseCredit(user.id)
    if (!creditStatus.allowed) {
      return NextResponse.json({ error: 'Günlük krediniz bitti' }, { status: 429 })
    }
    
    const body: LiveStreamRequest = await request.json()
    const { action, studentName = 'Öğrenci', grade = 8, personality, voice = 'Kore', textMessage } = body
    
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'API key yok' }, { status: 500 })
    }
    
    console.log(`📝 [LIVE] ${action} - ${studentName} - ses: ${voice}`)
    
    // Setup: AI hemen selam verecek
    const isSetup = action === 'setup'
    const prompt = isSetup 
      ? `[SİSTEM KOMUTU: Öğrencin ${studentName} şu an karşında. HEMEN "Selam ${studentName}!" diyerek başla ve kendini tanıt. Türkçe konuş. Max 2 cümle.]`
      : textMessage || 'Devam et'
    
    console.log(`💬 [LIVE] Prompt: ${prompt.substring(0, 80)}...`)
    
    // Gemini API - Audio response
    const geminiResponse = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ 
          role: 'user', 
          parts: [{ text: prompt }] 
        }],
        systemInstruction: { 
          parts: [{ text: buildSystemInstruction(studentName, grade) }] 
        },
        generationConfig: {
          temperature: 0.9,
          maxOutputTokens: 300,
          responseModalities: ['AUDIO', 'TEXT'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName: VOICES[voice] || 'Kore'
              }
            }
          }
        }
      })
    })
    
    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text()
      console.error('❌ [LIVE] Gemini hatası:', geminiResponse.status, errorText.substring(0, 300))
      
      // Audio desteklenmiyorsa sadece text dene
      console.log('🔄 [LIVE] Text-only moduna geçiliyor...')
      
      const textResponse = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          systemInstruction: { parts: [{ text: buildSystemInstruction(studentName, grade) }] },
          generationConfig: { temperature: 0.9, maxOutputTokens: 300 }
        })
      })
      
      if (!textResponse.ok) {
        return NextResponse.json({ error: 'Gemini API hatası' }, { status: 502 })
      }
      
      const textData = await textResponse.json()
      const text = textData.candidates?.[0]?.content?.parts?.[0]?.text || ''
      
      console.log(`📝 [LIVE] Text yanıt: ${text.substring(0, 50)}...`)
      
      // Text-only SSE response
      const encoder = new TextEncoder()
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'connected', studentName })}\n\n`))
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'text', content: text })}\n\n`))
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'done', hasAudio: false })}\n\n`))
          controller.close()
        }
      })
      
      return new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive'
        }
      })
    }
    
    // Audio + Text response
    const data = await geminiResponse.json()
    console.log('✅ [LIVE] Gemini yanıtı alındı')
    
    // Parse response
    let textContent = ''
    let audioData = ''
    let audioMimeType = ''
    
    const parts = data.candidates?.[0]?.content?.parts || []
    for (const part of parts) {
      if (part.text) {
        textContent += part.text
      }
      if (part.inlineData?.mimeType?.startsWith('audio/')) {
        audioData = part.inlineData.data
        audioMimeType = part.inlineData.mimeType
      }
    }
    
    console.log(`📝 [LIVE] Text: ${textContent.substring(0, 50)}...`)
    console.log(`🔊 [LIVE] Audio: ${audioData ? `${audioData.length} bytes, ${audioMimeType}` : 'yok'}`)
    
    // SSE Stream
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      start(controller) {
        // Bağlantı onayı
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'connected', studentName })}\n\n`))
        
        // Text
        if (textContent) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'text', content: textContent })}\n\n`))
        }
        
        // Audio
        if (audioData) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
            type: 'audio', 
            mimeType: audioMimeType,
            data: audioData 
          })}\n\n`))
        }
        
        // Done
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
          type: 'done', 
          hasAudio: !!audioData,
          textLength: textContent.length 
        })}\n\n`))
        
        controller.close()
      }
    })
    
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no'
      }
    })
    
  } catch (error: any) {
    console.error('❌ [LIVE] Hata:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
