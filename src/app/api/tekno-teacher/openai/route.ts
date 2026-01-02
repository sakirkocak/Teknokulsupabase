/**
 * TeknoÖğretmen - OpenAI Chat API
 * POST /api/tekno-teacher/openai
 * 
 * Model: gpt-4o-mini (maliyet optimize)
 * Öğrenci: Şakir, 8. sınıf
 */

import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

// Sabitler
const DEFAULT_STUDENT = 'Şakir'
const DEFAULT_GRADE = 8
const MODEL = 'gpt-4o-mini'  // Maliyet optimize

interface ChatRequest {
  message: string
  conversationHistory?: { role: 'user' | 'assistant', content: string }[]
  studentName?: string
  grade?: number
}

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  console.log('🟢 [OPENAI] === YENİ İSTEK ===')
  
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    console.error('❌ [OPENAI] API key yok!')
    return NextResponse.json({ error: 'API key bulunamadı' }, { status: 500 })
  }
  
  try {
    const body: ChatRequest = await request.json()
    const { 
      message, 
      conversationHistory = [],
      studentName = DEFAULT_STUDENT,
      grade = DEFAULT_GRADE
    } = body
    
    console.log(`📝 [OPENAI] Mesaj: "${message?.substring(0, 50)}..."`)
    console.log(`👤 [OPENAI] Öğrenci: ${studentName}, ${grade}. sınıf`)
    
    const openai = new OpenAI({ apiKey })
    
    // Sistem talimatı
    const systemPrompt = `Sen TeknoÖğretmen'sin - ${studentName}'in özel ders öğretmeni.

KİMLİK:
- Adı: TeknoÖğretmen
- Dil: Türkçe
- Üslup: Samimi, motive edici, pedagojik

KURALLAR:
1. Her yanıta "${studentName}" diye hitap ederek başla
2. Kısa ve öz konuş (maksimum 2-3 cümle)
3. Her zaman Türkçe konuş
4. Samimi ve motive edici ol
5. Yanıtın sonunda bazen soru sor
6. Matematik sorularında adım adım açıkla
7. Yanlış cevaplarda cesaretini kırma, ipucu ver

ÖĞRENCİ BİLGİLERİ:
- İsim: ${studentName}
- Sınıf: ${grade}. sınıf
- Platform: Teknokul - AI destekli eğitim platformu

BAĞLAM:
- Teknokul'da 60.000+ soru var
- Öğrenci LGS'ye hazırlanıyor
- Matematik, Fen, Türkçe, Sosyal dersler var`

    // Konuşma geçmişini hazırla
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory.map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content
      })),
      { role: 'user', content: message || `Merhaba, ben ${studentName}!` }
    ]
    
    // GPT-4o-mini çağrısı
    const completion = await openai.chat.completions.create({
      model: MODEL,
      messages,
      max_tokens: 300,
      temperature: 0.8
    })
    
    const responseText = completion.choices[0]?.message?.content || 
      `${studentName}, şu an bir teknik sorun yaşıyoruz ama yine de sana yardımcı olabilirim!`
    
    const duration = Date.now() - startTime
    console.log(`✅ [OPENAI] Yanıt: "${responseText.substring(0, 60)}..."`)
    console.log(`⏱️ [OPENAI] Süre: ${duration}ms`)
    console.log(`📊 [OPENAI] Token: ${completion.usage?.total_tokens || 'N/A'}`)
    
    return NextResponse.json({
      success: true,
      text: responseText,
      model: MODEL,
      tokens: completion.usage?.total_tokens,
      duration
    })
    
  } catch (error: any) {
    console.error('❌ [OPENAI] Hata:', error.message)
    return NextResponse.json({ 
      error: error.message,
      fallbackText: `${DEFAULT_STUDENT}, bir sorun oluştu ama endişelenme, hemen düzelteceğiz!`
    }, { status: 500 })
  }
}
