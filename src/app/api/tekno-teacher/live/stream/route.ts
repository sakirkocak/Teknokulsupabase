/**
 * TeknoÖğretmen Live Stream API
 * POST /api/tekno-teacher/live/stream
 * 
 * ✅ Node.js runtime (stabil)
 * ✅ Profil bağımsız (varsayılan: Şakir)
 * ✅ Graceful fallback
 * ✅ Basit Gemini request
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Node.js runtime
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

// Gemini API - Basit endpoint
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent'

interface LiveStreamRequest {
  action: 'setup' | 'text'
  studentName?: string
  grade?: number
  voice?: string
  textMessage?: string
}

export async function POST(request: NextRequest) {
  console.log('🟢 [LIVE] Yeni istek')
  
  try {
    // Auth kontrolü - OPSIYONEL
    let userId = 'anonymous'
    try {
      const supabase = await createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) userId = user.id
    } catch (e) {
      console.warn('⚠️ [LIVE] Auth atlandı:', e)
    }
    
    // Request body
    const body: LiveStreamRequest = await request.json()
    
    // VARSAYILAN DEĞERLER - Profil bağımsız!
    const studentName = body.studentName || 'Şakir'
    const grade = body.grade || 8
    const voice = body.voice || 'Kore'
    const action = body.action || 'setup'
    const textMessage = body.textMessage
    
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'API key yok' }, { status: 500 })
    }
    
    console.log(`📝 [LIVE] ${action} - ${studentName} (${grade}. sınıf)`)
    
    // Prompt - İSİM GÖMÜLÜ
    const isSetup = action === 'setup'
    const prompt = isSetup 
      ? `Karşında ${studentName} var. HEMEN Türkçe olarak "Selam ${studentName}, teknik sorunları hallettim, hadi derse başlayalım!" diyerek söze gir. Sonra ne çalışmak istediğini sor. Max 2 cümle.`
      : textMessage || `${studentName}'a devam et`
    
    console.log(`💬 [LIVE] Prompt: ${prompt.substring(0, 60)}...`)
    
    // Gemini API - BASİT REQUEST
    const systemInstruction = `Sen TeknoÖğretmen'sin - ${studentName}'in ${grade}. sınıf özel ders öğretmeni.

KURALLARIN:
1. HER yanıta "${studentName}" diye başla
2. Kısa konuş (2-3 cümle)
3. Soru sor
4. Türkçe ve samimi ol`

    let geminiResponse: Response | null = null
    let responseText = ''
    
    // İlk deneme - Normal request
    try {
      console.log('📤 [LIVE] Gemini API çağrılıyor...')
      
      geminiResponse = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          systemInstruction: { parts: [{ text: systemInstruction }] },
          generationConfig: {
            temperature: 0.9,
            maxOutputTokens: 200
          }
        })
      })
      
      if (geminiResponse.ok) {
        const data = await geminiResponse.json()
        responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || ''
        console.log(`✅ [LIVE] Yanıt: ${responseText.substring(0, 50)}...`)
      } else {
        const errorText = await geminiResponse.text()
        console.error('❌ [LIVE] Gemini hatası:', geminiResponse.status, errorText.substring(0, 200))
        throw new Error(`Gemini ${geminiResponse.status}`)
      }
      
    } catch (apiError: any) {
      console.error('❌ [LIVE] API hatası:', apiError.message)
      
      // FALLBACK - Statik yanıt
      responseText = isSetup 
        ? `Selam ${studentName}! Ben senin özel öğretmeninim. Bugün hangi konuda çalışmak istersin?`
        : `${studentName}, anlıyorum. Devam edelim mi?`
      
      console.log('🔄 [LIVE] Fallback yanıt kullanılıyor')
    }
    
    // SSE Response
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      start(controller) {
        const send = (data: object) => {
          try {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
          } catch (e) {}
        }
        
        // Bağlantı onayı
        send({ type: 'connected', studentName, grade })
        
        // Text yanıtı
        if (responseText) {
          send({ type: 'text', content: responseText })
        }
        
        // Tamamlandı - client TTS kullanacak
        send({ type: 'done', textLength: responseText.length })
        
        controller.close()
      }
    })
    
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive'
      }
    })
    
  } catch (error: any) {
    console.error('❌ [LIVE] Genel hata:', error)
    
    // ASLA bağlantıyı koparmadan hata dön
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'connected', studentName: 'Şakir' })}\n\n`))
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'text', content: 'Selam Şakir! Bir sorun oluştu ama devam edebiliriz. Ne çalışmak istersin?' })}\n\n`))
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'done' })}\n\n`))
        controller.close()
      }
    })
    
    return new Response(stream, {
      headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' }
    })
  }
}
