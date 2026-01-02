/**
 * 🎓 TeknoÖğretmen - Akıllı Chat API
 * 
 * Gemini 3 Flash ile akıllı sohbet + Görsel İçerik
 * Structured JSON yanıt desteği
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
  withVisuals?: boolean  // Görsel içerik isteniyor mu?
}

// Görsel içerik tipi
interface VisualContent {
  type: 'formula' | 'steps' | 'chart' | 'question' | 'tip' | 'summary'
  title?: string
  content: string
  data?: any
}

interface StructuredResponse {
  text: string
  visuals?: VisualContent[]
  topic?: string
}

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    const body: ChatRequest = await request.json()
    const { 
      message, 
      conversationHistory = [],
      studentName = 'Öğrenci',
      grade = 8,
      withVisuals = true  // Varsayılan olarak görsel içerik üret
    } = body
    
    if (!message?.trim()) {
      return NextResponse.json({ error: 'Mesaj gerekli' }, { status: 400 })
    }
    
    // Görsel içerik talimatı
    const visualInstructions = withVisuals ? `

GÖRSEL İÇERİK KURALLARI:
Yanıtında matematik formülü, çözüm adımı veya önemli bilgi varsa, bunları <visual> tagları içinde JSON olarak ver:

<visual type="formula" title="Formül Adı">
LaTeX formatında formül (örn: $2^3 = 8$)
</visual>

<visual type="steps" title="Çözüm Adımları">
Adım adım işlem (örn: $2 \\times 2 = 4$, sonra $4 \\times 2 = 8$)
</visual>

<visual type="tip" title="İpucu">
Öğrenciye yardımcı olacak kısa ipucu
</visual>

<visual type="summary" title="Konu Özeti">
Önemli noktaların özeti
</visual>

ÖNEMLİ: Her matematik ifadesini $ işaretleri arasına al. Görsel tagları yanıt metninin SONUNA ekle.` : ''

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
7. Matematiksel ifadeleri LaTeX formatında yaz: $formül$

ÖĞRENCİ:
- İsim: ${studentName}
- Sınıf: ${grade}. sınıf
- Platform: Teknokul - AI destekli eğitim platformu${visualInstructions}`

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
    
    // Görsel içerikleri parse et
    const visuals: VisualContent[] = []
    let cleanText = responseText
    
    if (withVisuals) {
      // <visual> taglarını bul ve parse et
      const visualRegex = /<visual\s+type="([^"]+)"(?:\s+title="([^"]*)")?>([\s\S]*?)<\/visual>/g
      let match
      
      while ((match = visualRegex.exec(responseText)) !== null) {
        const [fullMatch, type, title, content] = match
        visuals.push({
          type: type as VisualContent['type'],
          title: title || undefined,
          content: content.trim()
        })
        // Tag'ı metinden kaldır
        cleanText = cleanText.replace(fullMatch, '')
      }
      
      // Temizle
      cleanText = cleanText.trim()
    }
    
    // Konu tespiti (basit)
    let topic = undefined
    const topicKeywords = {
      'üslü': 'Üslü Sayılar',
      'üs': 'Üslü Sayılar',
      'kök': 'Köklü Sayılar',
      'denklem': 'Denklemler',
      'fonksiyon': 'Fonksiyonlar',
      'geometri': 'Geometri',
      'üçgen': 'Üçgenler',
      'çember': 'Çember',
      'oran': 'Oran Orantı',
      'yüzde': 'Yüzde Problemleri',
      'olasılık': 'Olasılık',
      'istatistik': 'İstatistik'
    }
    
    const lowerMessage = message.toLowerCase()
    for (const [keyword, topicName] of Object.entries(topicKeywords)) {
      if (lowerMessage.includes(keyword)) {
        topic = topicName
        break
      }
    }
    
    // Fallback
    if (!cleanText) {
      cleanText = `${studentName}, şu an bir teknik sorun yaşıyoruz ama yine de sana yardımcı olabilirim!`
    }
    
    const duration = Date.now() - startTime
    
    return NextResponse.json({
      success: true,
      text: cleanText,
      visuals: visuals.length > 0 ? visuals : undefined,
      topic,
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
