/**
 * TeknoÖğretmen Live Stream API
 * POST /api/tekno-teacher/live/stream
 * 
 * 🚀 ZERO-DB MODE
 * - Supabase YOK
 * - Auth YOK
 * - Hardcoded identity
 * - Pure Node.js
 */

import { NextRequest } from 'next/server'

// Node.js runtime
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

// Gemini API
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent'

// HARDCODED - Veritabanı yok!
const DEFAULT_STUDENT = 'Şakir'
const DEFAULT_GRADE = 8

interface LiveRequest {
  action?: 'setup' | 'text'
  studentName?: string
  grade?: number
  textMessage?: string
}

export async function POST(request: NextRequest) {
  console.log('🟢 [LIVE] === YENİ İSTEK ===')
  
  // Request body
  let body: LiveRequest = {}
  try {
    body = await request.json()
  } catch (e) {
    console.log('⚠️ [LIVE] Body parse edilemedi, varsayılan kullanılıyor')
  }
  
  // HARDCODED VALUES
  const studentName = body.studentName || DEFAULT_STUDENT
  const grade = body.grade || DEFAULT_GRADE
  const action = body.action || 'setup'
  const textMessage = body.textMessage || ''
  
  console.log(`👤 [LIVE] Öğrenci: ${studentName}, Sınıf: ${grade}, Action: ${action}`)
  
  // API Key
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    console.error('❌ [LIVE] GEMINI_API_KEY yok!')
    return createErrorStream('API anahtarı bulunamadı')
  }
  
  // Prompt oluştur
  const isSetup = action === 'setup'
  const prompt = isSetup 
    ? `Karşında ${studentName} adlı ${grade}. sınıf öğrencisi var. HEMEN Türkçe olarak "Selam ${studentName}! Teknik sorunları hallettim, hadi derse başlayalım!" diyerek söze gir. Sonra ne çalışmak istediğini sor. Sadece 2 cümle.`
    : `${studentName} sana şunu söyledi: "${textMessage}". Kısa ve Türkçe yanıt ver. ${studentName} diye hitap et. Max 2 cümle.`
  
  const systemPrompt = `Sen TeknoÖğretmen'sin - ${studentName}'in özel ders öğretmeni.
KURALLAR:
1. Her yanıta "${studentName}" diye başla
2. Kısa konuş (2 cümle max)
3. Türkçe konuş
4. Soru sor`

  console.log(`💬 [LIVE] Prompt: ${prompt.substring(0, 80)}...`)
  
  // Gemini API çağrısı
  let responseText = ''
  
  try {
    console.log('📤 [LIVE] Gemini API çağrılıyor...')
    
    const geminiRes = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        systemInstruction: { parts: [{ text: systemPrompt }] },
        generationConfig: { temperature: 0.9, maxOutputTokens: 150 }
      })
    })
    
    console.log(`📡 [LIVE] Gemini status: ${geminiRes.status}`)
    
    if (geminiRes.ok) {
      const data = await geminiRes.json()
      responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || ''
      console.log(`✅ [LIVE] Gemini yanıtı: "${responseText.substring(0, 60)}..."`)
    } else {
      const errText = await geminiRes.text()
      console.error(`❌ [LIVE] Gemini hata: ${geminiRes.status} - ${errText.substring(0, 200)}`)
      // Fallback
      responseText = `Selam ${studentName}! Hazırım, ne çalışmak istersin?`
    }
    
  } catch (err: any) {
    console.error('❌ [LIVE] Fetch hatası:', err.message)
    responseText = `Selam ${studentName}! Bir sorun oluştu ama devam edebiliriz. Ne öğrenmek istersin?`
  }
  
  // SSE Stream oluştur
  console.log('📺 [LIVE] SSE stream oluşturuluyor...')
  
  const encoder = new TextEncoder()
  
  const stream = new ReadableStream({
    start(controller) {
      // Helper
      const send = (eventData: object) => {
        const line = `data: ${JSON.stringify(eventData)}\n\n`
        console.log(`📤 [SSE] Gönderiliyor: ${JSON.stringify(eventData).substring(0, 80)}`)
        controller.enqueue(encoder.encode(line))
      }
      
      // 1. Bağlantı onayı
      send({ type: 'connected', studentName, grade, timestamp: Date.now() })
      
      // 2. Text yanıtı
      send({ type: 'text', content: responseText })
      
      // 3. Tamamlandı
      send({ type: 'done', success: true })
      
      console.log('✅ [LIVE] Stream tamamlandı')
      controller.close()
    }
  })
  
  // Response - Manuel headers
  return new Response(stream, {
    status: 200,
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
      'Access-Control-Allow-Origin': '*'
    }
  })
}

// Hata durumunda bile stream dön
function createErrorStream(message: string): Response {
  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'connected', studentName: DEFAULT_STUDENT })}\n\n`))
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'text', content: `Selam ${DEFAULT_STUDENT}! ${message} Ama yine de konuşabiliriz.` })}\n\n`))
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'done' })}\n\n`))
      controller.close()
    }
  })
  
  return new Response(stream, {
    status: 200,
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    }
  })
}
