/**
 * 🎓 TeknoÖğretmen - Basit Chat API
 * 
 * Gemini 3 Flash ile akıllı sohbet
 * Basit ve hızlı!
 */

import { NextRequest, NextResponse } from 'next/server'
import { geminiModel } from '@/lib/gemini'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 30

interface ChatRequest {
  message: string
  conversationHistory?: { role: 'user' | 'assistant', content: string }[]
  studentName?: string
  grade?: number
}

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    const body: ChatRequest = await request.json()
    const { 
      message, 
      conversationHistory = [],
      studentName = 'Öğrenci',
      grade = 8
    } = body
    
    if (!message?.trim()) {
      return NextResponse.json({ error: 'Mesaj gerekli' }, { status: 400 })
    }
    
    // Sistem talimatı
    const systemPrompt = `Sen TeknoÖğretmen'sin - ${studentName}'in özel ders öğretmeni.

KİMLİK:
- Adı: TeknoÖğretmen
- Dil: Türkçe
- Üslup: Samimi, motive edici, pedagojik

KURALLAR:
1. Her yanıta "${studentName}" diye hitap ederek başla
2. Kısa ve öz konuş (maksimum 3-4 cümle)
3. Her zaman Türkçe konuş
4. Samimi ve motive edici ol
5. Matematik sorularında adım adım açıkla
6. Yanlış cevaplarda cesaretini kırma, ipucu ver

ÖĞRENCİ:
- İsim: ${studentName}
- Sınıf: ${grade}. sınıf
- Platform: Teknokul - AI destekli eğitim platformu`

    // Konuşma geçmişini hazırla
    const historyText = conversationHistory.slice(-4).map(msg => 
      `${msg.role === 'user' ? studentName : 'TeknoÖğretmen'}: ${msg.content}`
    ).join('\n')
    
    const fullPrompt = historyText 
      ? `${systemPrompt}\n\nÖNCEKİ KONUŞMA:\n${historyText}\n\n${studentName}: ${message}\n\nTeknoÖğretmen:`
      : `${systemPrompt}\n\n${studentName}: ${message}\n\nTeknoÖğretmen:`
    
    // Gemini 3 Flash çağrısı
    const result = await geminiModel.generateContent(fullPrompt)
    const response = await result.response
    let responseText = response.text()
    
    // "TeknoÖğretmen:" prefix'ini kaldır
    responseText = responseText.replace(/^TeknoÖğretmen:\s*/i, '').trim()
    
    // Fallback
    if (!responseText) {
      responseText = `${studentName}, şu an bir teknik sorun yaşıyoruz ama yine de sana yardımcı olabilirim!`
    }
    
    const duration = Date.now() - startTime
    
    return NextResponse.json({
      success: true,
      text: responseText,
      model: 'gemini-3-flash-preview',
      duration
    })
    
  } catch (error: any) {
    console.error('❌ [GEMINI] Hata:', error.message)
    return NextResponse.json({ 
      error: error.message,
      text: 'Bir sorun oluştu ama endişelenme!'
    }, { status: 500 })
  }
}
