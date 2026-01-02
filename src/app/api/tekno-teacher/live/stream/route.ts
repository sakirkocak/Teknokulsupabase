/**
 * TeknoÖğretmen Live Stream API
 * POST /api/tekno-teacher/live/stream
 * 
 * 🚀 ÇALIŞAN ÇÖZÜM: REST API + Browser TTS
 * 
 * WebSocket Vercel'de sorunlu, bu yüzden:
 * - Gemini REST API ile text response alıyoruz
 * - Browser TTS ile sesli çıktı sağlıyoruz
 * - SSE ile stream ediyoruz
 */

import { NextRequest } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

// =====================================================
// VERCEL PRO YAPILANDIRMASI
// =====================================================
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 300

// =====================================================
// GEMINI API YAPILANDIRMASI
// =====================================================
const GEMINI_MODEL = 'gemini-2.0-flash-exp'

// Öğrenci bilgileri
const DEFAULT_STUDENT = 'Şakir'
const DEFAULT_GRADE = 8

interface LiveRequest {
  action?: 'setup' | 'text'
  textMessage?: string
}

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  console.log('🟢 [LIVE] === YENİ İSTEK ===')
  
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    console.error('❌ [LIVE] GEMINI_API_KEY yok!')
    return createResponse(`Merhaba ${DEFAULT_STUDENT}! API anahtarı bulunamadı ama yine de konuşabiliriz.`, true)
  }
  
  let body: LiveRequest = { action: 'setup' }
  try {
    body = await request.json()
  } catch (e) {
    // Default setup
  }
  
  const action = body.action || 'setup'
  const textMessage = body.textMessage || ''
  
  console.log(`📤 [LIVE] Action: ${action}, Model: ${GEMINI_MODEL}`)
  
  // =====================================================
  // GEMINI SDK
  // =====================================================
  const genAI = new GoogleGenerativeAI(apiKey)
  const model = genAI.getGenerativeModel({ 
    model: GEMINI_MODEL,
    systemInstruction: `Sen TeknoÖğretmen'sin - ${DEFAULT_STUDENT}'in özel ders öğretmeni.

KİMLİK:
- Adı: TeknoÖğretmen
- Dil: Türkçe
- Üslup: Samimi, motive edici, pedagojik

KURALLAR:
1. Her yanıta "${DEFAULT_STUDENT}" diye hitap ederek başla
2. Kısa ve öz konuş (maksimum 2-3 cümle)
3. Her zaman Türkçe konuş
4. Samimi ve motive edici ol
5. Yanıtın sonunda bazen soru sor

ÖĞRENCİ: ${DEFAULT_STUDENT}, ${DEFAULT_GRADE}. sınıf`
  })
  
  // Prompt oluştur
  const prompt = action === 'setup'
    ? `[BAŞLANGIÇ] ${DEFAULT_STUDENT} adlı öğrenci karşında. Ona "Merhaba ${DEFAULT_STUDENT}, bugün harika bir ders işleyeceğiz! Ne çalışmak istersin?" diye selam ver. SADECE bu cümleyi söyle, başka bir şey ekleme.`
    : `${DEFAULT_STUDENT} sana şunu söyledi: "${textMessage}". Kısa ve samimi Türkçe yanıt ver. Mutlaka ismiyle hitap et.`
  
  console.log(`💬 [LIVE] Prompt: ${prompt.substring(0, 80)}...`)
  
  // =====================================================
  // GEMINI API ÇAĞRISI
  // =====================================================
  let responseText = ''
  
  try {
    console.log('📤 [LIVE] Gemini çağrılıyor...')
    
    const result = await model.generateContent(prompt)
    const response = await result.response
    responseText = response.text()
    
    // Prompt leak temizleme
    responseText = responseText
      .replace(/\[BAŞLANGIÇ\]/g, '')
      .replace(/SADECE bu cümleyi söyle.*$/g, '')
      .trim()
    
    console.log(`✅ [LIVE] Yanıt: "${responseText.substring(0, 80)}..."`)
    
  } catch (err: any) {
    console.error('❌ [LIVE] Gemini hatası:', err.message)
    responseText = action === 'setup'
      ? `Merhaba ${DEFAULT_STUDENT}, bugün harika bir ders işleyeceğiz! Ne çalışmak istersin?`
      : `${DEFAULT_STUDENT}, anlıyorum. Devam edelim mi?`
  }
  
  return createResponse(responseText, false, Date.now() - startTime)
}

// =====================================================
// SSE RESPONSE OLUŞTUR
// =====================================================
function createResponse(text: string, fallback: boolean, duration: number = 0): Response {
  const encoder = new TextEncoder()
  
  const stream = new ReadableStream({
    start(controller) {
      const send = (data: object) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
      }
      
      // 1. Bağlantı onayı
      send({
        type: 'connected',
        studentName: DEFAULT_STUDENT,
        grade: DEFAULT_GRADE,
        model: GEMINI_MODEL,
        pro: true,
        fallback,
        timestamp: Date.now()
      })
      
      // 2. Text yanıtı
      send({ type: 'text', content: text })
      
      // 3. Tamamlandı
      send({
        type: 'done',
        success: true,
        hasAudio: false,  // Browser TTS kullanılacak
        textLength: text.length,
        duration,
        fallback
      })
      
      controller.close()
    }
  })
  
  return new Response(stream, {
    status: 200,
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no'
    }
  })
}
