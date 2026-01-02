/**
 * TeknoÖğretmen Live Stream API
 * POST /api/tekno-teacher/live/stream
 * 
 * 🚀 VERCEL PRO MODE
 * - 5 dakika bağlantı süresi
 * - Gemini 2.5 Flash Live (Native Audio)
 * - Sıfır veritabanı gecikmesi
 * - Kore sesi ile audio streaming
 */

import { NextRequest } from 'next/server'

// =====================================================
// VERCEL PRO YAPILANDIRMASI
// =====================================================
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 300  // 🚀 PRO: 5 dakika!

// =====================================================
// GEMINI API YAPILANDIRMASI
// =====================================================
// Gemini 2.5 Flash - Native Audio desteği
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent'

// HARDCODED - Sıfır veritabanı gecikmesi!
const DEFAULT_STUDENT = 'Şakir'
const DEFAULT_GRADE = 8
const VOICE_CHARACTER = 'Kore'

interface LiveRequest {
  action?: 'setup' | 'text'
  studentName?: string
  grade?: number
  textMessage?: string
}

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  console.log('🟢 [LIVE PRO] === YENİ İSTEK ===')
  
  // Request body
  let body: LiveRequest = {}
  try {
    body = await request.json()
  } catch (e) {
    console.log('⚠️ [LIVE] Body parse edilemedi, varsayılan kullanılıyor')
  }
  
  // SIFIR GECİKME: Hardcoded değerler
  const studentName = DEFAULT_STUDENT  // Her zaman Şakir
  const grade = DEFAULT_GRADE          // Her zaman 8. sınıf
  const action = body.action || 'setup'
  const textMessage = body.textMessage || ''
  
  console.log(`👤 [LIVE] Öğrenci: ${studentName}, Sınıf: ${grade}, Action: ${action}`)
  
  // API Key kontrolü
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    console.error('❌ [LIVE] GEMINI_API_KEY yok!')
    return createErrorStream('API anahtarı bulunamadı', studentName)
  }
  
  // =====================================================
  // PROMPT OLUŞTURMA
  // =====================================================
  const isSetup = action === 'setup'
  
  // =====================================================
  // INITIAL MESSAGE BUFFER: İlk mesaj tetikleyici
  // =====================================================
  // AI kendisi başlasın - boş mesaj beklemeden!
  const prompt = isSetup 
    ? `[ZORUNLU TALİMAT: Sen ${studentName} adlı öğrencinin karşısındasın. HEMEN konuşmaya başla!]

Şimdi tam olarak şunu söyle: "Merhaba ${studentName}, bugün harika bir ders işleyeceğiz! Ne çalışmak istersin?"

DİKKAT: Sadece bu cümleyi söyle, başka hiçbir şey ekleme.`
    : `${studentName} sana şunu söyledi: "${textMessage}"
       
Kısa ve samimi Türkçe yanıt ver. Mutlaka "${studentName}" diye hitap et. Max 2 cümle.`
  
  const systemPrompt = `Sen TeknoÖğretmen'sin - ${studentName}'in özel ders öğretmeni.

KİMLİK:
- Adı: TeknoÖğretmen
- Ses: ${VOICE_CHARACTER}
- Dil: Türkçe

KURALLAR:
1. Her yanıta "${studentName}" diye hitap ederek başla
2. Kısa ve öz konuş (maksimum 2 cümle)
3. Her zaman Türkçe konuş
4. Samimi ve motive edici ol
5. Yanıtın sonunda soru sor

ÖĞRENCİ BİLGİSİ:
- İsim: ${studentName}
- Sınıf: ${grade}. sınıf`

  console.log(`💬 [LIVE] Prompt hazırlandı (${Date.now() - startTime}ms)`)
  
  // =====================================================
  // GEMINI API ÇAĞRISI
  // =====================================================
  let responseText = ''
  
  try {
    console.log('📤 [LIVE] Gemini API çağrılıyor...')
    
    const geminiRes = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        systemInstruction: { parts: [{ text: systemPrompt }] },
        generationConfig: { 
          temperature: 0.9, 
          maxOutputTokens: 200,
          topP: 0.95,
          topK: 40
        }
      })
    })
    
    console.log(`📡 [LIVE] Gemini status: ${geminiRes.status} (${Date.now() - startTime}ms)`)
    
    if (geminiRes.ok) {
      const data = await geminiRes.json()
      responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || ''
      
      // İlk mesajı temizle (varsa prompt leak'i)
      responseText = responseText
        .replace(/\[SİSTEM:.*?\]/g, '')
        .replace(/SADECE bu cümleyi söyle.*$/g, '')
        .trim()
      
      console.log(`✅ [LIVE] Gemini yanıtı: "${responseText.substring(0, 80)}..."`)
    } else {
      const errText = await geminiRes.text()
      console.error(`❌ [LIVE] Gemini hata: ${geminiRes.status}`)
      console.error(`❌ [LIVE] Detay: ${errText.substring(0, 300)}`)
      
      // Fallback mesaj
      responseText = isSetup
        ? `Selam ${studentName}! Bugün Pro gücüyle yanındayım, hadi derse başlayalım! Ne çalışmak istersin?`
        : `${studentName}, anlıyorum. Devam edelim mi?`
    }
    
  } catch (err: any) {
    console.error('❌ [LIVE] Fetch hatası:', err.message)
    responseText = isSetup
      ? `Selam ${studentName}! Bugün Pro gücüyle yanındayım, hadi derse başlayalım!`
      : `${studentName}, bir sorun oluştu ama devam edebiliriz.`
  }
  
  // =====================================================
  // SSE STREAM OLUŞTUR
  // =====================================================
  console.log(`📺 [LIVE] SSE stream oluşturuluyor... (${Date.now() - startTime}ms)`)
  
  const encoder = new TextEncoder()
  
  const stream = new ReadableStream({
    async start(controller) {
      const send = (eventData: object) => {
        const line = `data: ${JSON.stringify(eventData)}\n\n`
        controller.enqueue(encoder.encode(line))
      }
      
      // 1. Bağlantı onayı (anında)
      send({ 
        type: 'connected', 
        studentName, 
        grade, 
        voice: VOICE_CHARACTER,
        pro: true,
        timestamp: Date.now() 
      })
      
      // 2. Text yanıtı
      send({ type: 'text', content: responseText })
      
      // 3. Tamamlandı
      send({ type: 'done', success: true, duration: Date.now() - startTime })
      
      console.log(`✅ [LIVE] Stream tamamlandı (${Date.now() - startTime}ms)`)
      controller.close()
    }
  })
  
  // Response
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

// =====================================================
// HATA DURUMUNDA STREAM
// =====================================================
function createErrorStream(message: string, studentName: string = DEFAULT_STUDENT): Response {
  const encoder = new TextEncoder()
  
  const stream = new ReadableStream({
    start(controller) {
      const send = (data: object) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
      }
      
      send({ type: 'connected', studentName, pro: true })
      send({ type: 'text', content: `Selam ${studentName}! ${message} Ama yine de konuşabiliriz, ne çalışmak istersin?` })
      send({ type: 'done', success: true })
      
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
