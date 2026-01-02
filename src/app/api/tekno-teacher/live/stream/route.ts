/**
 * TeknoÖğretmen Live Stream API
 * POST /api/tekno-teacher/live/stream
 * 
 * Server-side Gemini Live API bağlantısı
 * WebSocket proxy - CORS sorununu çözer
 */

import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkAndUseCredit } from '@/lib/tekno-teacher'

export const runtime = 'edge' // Edge runtime for streaming
export const maxDuration = 60

// Gemini Live API endpoint
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-native-audio-exp:streamGenerateContent'

interface LiveStreamRequest {
  action: 'setup' | 'audio' | 'text' | 'interrupt'
  studentName?: string
  grade?: number
  personality?: 'friendly' | 'strict' | 'motivating'
  voice?: string
  audioData?: string // Base64 PCM audio
  textMessage?: string
  sessionId?: string
}

// System instruction builder
function buildSystemInstruction(studentName: string, grade: number, personality: string): string {
  const name = studentName || 'Öğrenci'
  
  const tones: Record<string, string> = {
    friendly: 'samimi, sıcak ve arkadaş canlısı',
    strict: 'disiplinli ama adil',
    motivating: 'enerjik ve motive edici'
  }
  
  return `Sen TeknoÖğretmen'sin - ${name}'in özel ders öğretmeni.

ÖĞRENCİ: ${name}, ${grade}. sınıf
KİŞİLİĞİN: ${tones[personality] || tones.friendly}

KONUŞMA KURALLARIN:
1. HER cümlene "${name}" diye başla
2. Kısa konuş (max 2-3 cümle)
3. Her yanıtta soru sor
4. Doğrudan cevap verme, düşündür
5. Türkçe konuş, samimi ol

Örnek: "${name}, harika soru! Şimdi düşün: Bir pizza 8 dilime bölündü, 3 dilim yedin. Ne kadar pizza yemiş oldun?"`
}

export async function POST(request: NextRequest) {
  const encoder = new TextEncoder()
  
  try {
    // Auth kontrolü
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Giriş yapmanız gerekiyor' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    }
    
    // Kredi kontrolü
    const creditStatus = await checkAndUseCredit(user.id)
    if (!creditStatus.allowed) {
      return new Response(
        JSON.stringify({ error: 'Günlük krediniz bitti', upgrade_required: true }),
        { status: 429, headers: { 'Content-Type': 'application/json' } }
      )
    }
    
    const body: LiveStreamRequest = await request.json()
    const { action, studentName, grade, personality, voice, audioData, textMessage } = body
    
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'API key yapılandırılmamış' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }
    
    // Streaming response oluştur
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Gemini API'ye istek gönder
          const geminiResponse = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              contents: [{
                role: 'user',
                parts: audioData 
                  ? [{ inlineData: { mimeType: 'audio/pcm;rate=16000', data: audioData } }]
                  : [{ text: textMessage || `Merhaba, ben ${studentName}. Bana yardım eder misin?` }]
              }],
              systemInstruction: {
                parts: [{ text: buildSystemInstruction(studentName || 'Öğrenci', grade || 8, personality || 'friendly') }]
              },
              generationConfig: {
                responseModalities: ['AUDIO', 'TEXT'],
                speechConfig: {
                  voiceConfig: {
                    prebuiltVoiceConfig: {
                      voiceName: voice || 'Kore'
                    }
                  }
                }
              }
            })
          })
          
          if (!geminiResponse.ok) {
            const errorText = await geminiResponse.text()
            console.error('Gemini API error:', errorText)
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'error', message: 'Gemini API hatası' })}\n\n`))
            controller.close()
            return
          }
          
          // Streaming response'u işle
          const reader = geminiResponse.body?.getReader()
          if (!reader) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'error', message: 'Stream okunamadı' })}\n\n`))
            controller.close()
            return
          }
          
          const decoder = new TextDecoder()
          let buffer = ''
          
          while (true) {
            const { done, value } = await reader.read()
            if (done) break
            
            buffer += decoder.decode(value, { stream: true })
            
            // JSON satırlarını parse et
            const lines = buffer.split('\n')
            buffer = lines.pop() || ''
            
            for (const line of lines) {
              if (line.trim()) {
                try {
                  const data = JSON.parse(line)
                  
                  // Candidates'tan içeriği çıkar
                  if (data.candidates?.[0]?.content?.parts) {
                    for (const part of data.candidates[0].content.parts) {
                      if (part.text) {
                        // Metin yanıtı
                        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
                          type: 'text', 
                          content: part.text 
                        })}\n\n`))
                      }
                      
                      if (part.inlineData?.mimeType?.startsWith('audio/')) {
                        // Audio yanıtı
                        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
                          type: 'audio', 
                          mimeType: part.inlineData.mimeType,
                          data: part.inlineData.data 
                        })}\n\n`))
                      }
                    }
                  }
                } catch (e) {
                  // JSON parse hatası - devam et
                }
              }
            }
          }
          
          // Stream tamamlandı
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'done' })}\n\n`))
          controller.close()
          
        } catch (error: any) {
          console.error('Stream error:', error)
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'error', message: error.message })}\n\n`))
          controller.close()
        }
      }
    })
    
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })
    
  } catch (error: any) {
    console.error('Live stream error:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'Stream hatası' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
