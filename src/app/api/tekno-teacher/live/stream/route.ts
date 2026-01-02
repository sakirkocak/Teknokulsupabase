/**
 * TeknoÖğretmen Live Stream API
 * POST /api/tekno-teacher/live/stream
 * 
 * Server-side Gemini Live API bağlantısı
 * WebSocket proxy - CORS sorununu çözer
 * 
 * ✅ Heartbeat ile bağlantı canlı tutulur
 * ✅ Detaylı hata logging
 */

import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkAndUseCredit } from '@/lib/tekno-teacher'

export const runtime = 'edge' // Edge runtime for streaming
export const maxDuration = 120 // 2 dakika

// Gemini Live API endpoint - Stable model
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:streamGenerateContent'

// Heartbeat interval (15 saniye)
const HEARTBEAT_INTERVAL = 15000

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
    
    // Log request details
    console.log(`🟢 [LIVE] Yeni istek: ${studentName}, ${grade}. sınıf, ses: ${voice}`)
    console.log(`📝 [LIVE] Mesaj: ${textMessage || '(hoşgeldin)'}`)
    
    // Streaming response oluştur
    const stream = new ReadableStream({
      async start(controller) {
        let heartbeatTimer: ReturnType<typeof setInterval> | null = null
        let isStreamClosed = false
        
        // Güvenli gönderme
        const safeSend = (data: string) => {
          if (!isStreamClosed) {
            try {
              controller.enqueue(encoder.encode(data))
            } catch (e) {
              console.error('❌ [LIVE] Gönderim hatası:', e)
            }
          }
        }
        
        // Heartbeat başlat
        heartbeatTimer = setInterval(() => {
          safeSend(`data: ${JSON.stringify({ type: 'heartbeat', timestamp: Date.now() })}\n\n`)
          console.log('💓 [LIVE] Heartbeat gönderildi')
        }, HEARTBEAT_INTERVAL)
        
        try {
          // İlk bağlantı onayı
          safeSend(`data: ${JSON.stringify({ type: 'connected', studentName })}\n\n`)
          
          // Gemini API request body
          const requestBody = {
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
              temperature: 0.9,
              topP: 0.95,
              maxOutputTokens: 1024
            }
          }
          
          console.log('📤 [LIVE] Gemini API isteği gönderiliyor...')
          
          // Gemini API'ye istek gönder
          const geminiResponse = await fetch(`${GEMINI_API_URL}?key=${apiKey}&alt=sse`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody)
          })
          
          if (!geminiResponse.ok) {
            const errorText = await geminiResponse.text()
            console.error('❌ [LIVE] Gemini API hatası:', {
              status: geminiResponse.status,
              statusText: geminiResponse.statusText,
              error: errorText.substring(0, 500) // İlk 500 karakter
            })
            safeSend(`data: ${JSON.stringify({ 
              type: 'error', 
              code: geminiResponse.status,
              message: `Gemini API hatası: ${geminiResponse.status} - ${errorText.substring(0, 100)}`
            })}\n\n`)
            if (heartbeatTimer) clearInterval(heartbeatTimer)
            isStreamClosed = true
            controller.close()
            return
          }
          
          console.log('✅ [LIVE] Gemini bağlantısı başarılı, streaming başlıyor...')
          
          // Streaming response'u işle
          const reader = geminiResponse.body?.getReader()
          if (!reader) {
            console.error('❌ [LIVE] Stream reader oluşturulamadı')
            safeSend(`data: ${JSON.stringify({ type: 'error', message: 'Stream okunamadı' })}\n\n`)
            if (heartbeatTimer) clearInterval(heartbeatTimer)
            isStreamClosed = true
            controller.close()
            return
          }
          
          const decoder = new TextDecoder()
          let buffer = ''
          let chunkCount = 0
          
          while (true) {
            const { done, value } = await reader.read()
            
            if (done) {
              console.log(`✅ [LIVE] Stream tamamlandı. Toplam ${chunkCount} chunk alındı.`)
              break
            }
            
            buffer += decoder.decode(value, { stream: true })
            
            // SSE formatını parse et
            const lines = buffer.split('\n')
            buffer = lines.pop() || ''
            
            for (const line of lines) {
              // SSE data satırını al
              if (line.startsWith('data: ')) {
                const jsonStr = line.slice(6).trim()
                if (jsonStr && jsonStr !== '[DONE]') {
                  try {
                    const data = JSON.parse(jsonStr)
                    chunkCount++
                    
                    // Candidates'tan içeriği çıkar
                    if (data.candidates?.[0]?.content?.parts) {
                      for (const part of data.candidates[0].content.parts) {
                        if (part.text) {
                          console.log(`📝 [LIVE] Chunk ${chunkCount}: "${part.text.substring(0, 50)}..."`)
                          safeSend(`data: ${JSON.stringify({ 
                            type: 'text', 
                            content: part.text,
                            chunk: chunkCount
                          })}\n\n`)
                        }
                        
                        if (part.inlineData?.mimeType?.startsWith('audio/')) {
                          console.log(`🔊 [LIVE] Audio chunk ${chunkCount}`)
                          safeSend(`data: ${JSON.stringify({ 
                            type: 'audio', 
                            mimeType: part.inlineData.mimeType,
                            data: part.inlineData.data 
                          })}\n\n`)
                        }
                      }
                    }
                    
                    // Hata kontrolü
                    if (data.error) {
                      console.error('❌ [LIVE] Gemini error in response:', data.error)
                      safeSend(`data: ${JSON.stringify({ 
                        type: 'error', 
                        code: data.error.code,
                        message: data.error.message
                      })}\n\n`)
                    }
                    
                  } catch (e) {
                    // JSON parse hatası - devam et
                    console.warn('⚠️ [LIVE] JSON parse hatası:', jsonStr.substring(0, 100))
                  }
                }
              } else if (line.trim()) {
                // SSE olmayan satır
                try {
                  const data = JSON.parse(line.trim())
                  if (data.candidates?.[0]?.content?.parts) {
                    for (const part of data.candidates[0].content.parts) {
                      if (part.text) {
                        safeSend(`data: ${JSON.stringify({ type: 'text', content: part.text })}\n\n`)
                      }
                    }
                  }
                } catch (e) {
                  // Ignore
                }
              }
            }
          }
          
          // Stream tamamlandı
          safeSend(`data: ${JSON.stringify({ type: 'done', totalChunks: chunkCount })}\n\n`)
          
        } catch (error: any) {
          console.error('❌ [LIVE] Stream error:', {
            name: error.name,
            message: error.message,
            stack: error.stack?.substring(0, 300)
          })
          safeSend(`data: ${JSON.stringify({ 
            type: 'error', 
            message: error.message,
            name: error.name
          })}\n\n`)
        } finally {
          if (heartbeatTimer) {
            clearInterval(heartbeatTimer)
            console.log('🛑 [LIVE] Heartbeat durduruldu')
          }
          isStreamClosed = true
          controller.close()
          console.log('🔌 [LIVE] Bağlantı kapatıldı')
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
