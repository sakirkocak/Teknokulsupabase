/**
 * 🎓 TeknoÖğretmen - Akıllı Chat API
 * 
 * Gemini 3 Flash ile akıllı sohbet + Görsel İçerik
 * ✅ Auth kontrolü
 * ✅ Kredi/Limit sistemi
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { geminiModel } from '@/lib/gemini'
import { checkAndUseCredit, getCreditStatus } from '@/lib/tekno-teacher'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 30

interface ChatRequest {
  message: string
  conversationHistory?: { role: 'user' | 'assistant', content: string }[]
  studentName?: string
  grade?: number
  withVisuals?: boolean
}

// Görsel içerik tipi
interface VisualContent {
  type: 'formula' | 'steps' | 'chart' | 'question' | 'tip' | 'summary'
  title?: string
  content: string
  data?: any
}

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    // =====================================================
    // 🔒 AUTH KONTROLÜ
    // =====================================================
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ 
        error: 'Giriş yapmanız gerekiyor',
        requireAuth: true
      }, { status: 401 })
    }
    
    // =====================================================
    // 💳 KREDİ KONTROLÜ
    // =====================================================
    const creditStatus = await checkAndUseCredit(user.id)
    
    if (!creditStatus.allowed) {
      return NextResponse.json({ 
        error: 'Günlük krediniz bitti',
        upgrade_required: true,
        credits: {
          remaining: creditStatus.remaining,
          is_premium: creditStatus.is_premium
        }
      }, { status: 403 })
    }
    
    // =====================================================
    // 📝 İSTEK İŞLEME
    // =====================================================
    const body: ChatRequest = await request.json()
    const { 
      message, 
      conversationHistory = [],
      studentName: providedName,
      grade: providedGrade,
      withVisuals = true
    } = body
    
    if (!message?.trim()) {
      return NextResponse.json({ error: 'Mesaj gerekli' }, { status: 400 })
    }
    
    // Kullanıcı profilini al
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, grade')
      .eq('id', user.id)
      .single()
    
    const studentName = providedName || profile?.full_name || 'Öğrenci'
    const grade = providedGrade || profile?.grade || 8
    
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
      const visualRegex = /<visual\s+type="([^"]+)"(?:\s+title="([^"]*)")?>([\s\S]*?)<\/visual>/g
      let match
      
      while ((match = visualRegex.exec(responseText)) !== null) {
        const [fullMatch, type, title, content] = match
        visuals.push({
          type: type as VisualContent['type'],
          title: title || undefined,
          content: content.trim()
        })
        cleanText = cleanText.replace(fullMatch, '')
      }
      
      cleanText = cleanText.trim()
    }
    
    // Konu tespiti
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
    
    // Güncel kredi durumunu al
    const updatedCredits = await getCreditStatus(user.id)
    
    return NextResponse.json({
      success: true,
      text: cleanText,
      visuals: visuals.length > 0 ? visuals : undefined,
      topic,
      student_name: studentName,
      credits: {
        remaining: updatedCredits.remaining,
        is_premium: updatedCredits.is_premium
      },
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
