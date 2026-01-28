/**
 * 🤖 JARVIS - Akıllı Chat API
 * 
 * Gemini 3 Flash ile akıllı sohbet + Görsel İçerik
 * ✅ Auth kontrolü
 * ✅ Kredi/Limit sistemi
 * ✅ Rachel sesi ile TTS hazır
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { geminiModel } from '@/lib/gemini'
import { checkAndUseCredit, getCreditStatus, getJarvisSystemPrompt, buildEnrichedJarvisContext, JARVIS_IDENTITY } from '@/lib/jarvis'
import { getRelevantMemories, summarizeConversation } from '@/lib/jarvis/memory'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 30

interface ChatRequest {
  message: string
  conversationHistory?: { role: 'user' | 'assistant', content: string }[]
  studentName?: string
  grade?: number
  withVisuals?: boolean
  mode?: 'chat' | 'teach' | 'hint' | 'summary'
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
    // 👑 ADMİN KONTROLÜ
    // =====================================================
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, grade, role')
      .eq('id', user.id)
      .single()
    
    const isAdmin = profile?.role === 'admin' || profile?.role === 'teacher'
    
    // =====================================================
    // 💳 KREDİ KONTROLÜ (Admin hariç)
    // =====================================================
    let creditStatus = { allowed: true, remaining: 999, is_premium: true }
    
    if (!isAdmin) {
      creditStatus = await checkAndUseCredit(user.id)
      
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
      withVisuals = true,
      mode = 'chat'
    } = body
    
    if (!message?.trim()) {
      return NextResponse.json({ error: 'Mesaj gerekli' }, { status: 400 })
    }
    
    const studentName = providedName || profile?.full_name || 'Öğrenci'
    const grade = providedGrade || profile?.grade || 8

    // Zenginleştirilmiş context al (hafıza, saat, zayıf konular dahil)
    let enrichedContext: any = null
    try {
      enrichedContext = await buildEnrichedJarvisContext(user.id)
    } catch (e) {
      // Context alınamazsa basit devam et
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

    // Sistem talimatı - Iron Man Jarvis kimliği ile zengin context
    const systemPrompt = getJarvisSystemPrompt(studentName, grade, enrichedContext ? {
      currentHour: enrichedContext.currentHour,
      weekday: enrichedContext.weekday,
      memories: enrichedContext.memories,
      weaknesses: enrichedContext.weaknesses,
      streak: 0, // TODO: streak verisi eklenecek
      todayQuestions: enrichedContext.todayQuestions,
      dailyGoalDone: enrichedContext.dailyGoalDone,
      averageScore: enrichedContext.recent_performance?.average_score,
      strongestSubject: enrichedContext.recent_performance?.strongest_subject,
      weakestSubject: enrichedContext.recent_performance?.weakest_subject
    } : undefined) + visualInstructions

    // Konuşma geçmişini hazırla (4'ten 10'a çıkarıldı)
    const historyText = conversationHistory.slice(-10).map(msg =>
      `${msg.role === 'user' ? studentName : 'Jarvis'}: ${msg.content}`
    ).join('\n')
    
    const fullPrompt = historyText 
      ? `${systemPrompt}\n\nÖNCEKİ KONUŞMA:\n${historyText}\n\n${studentName}: ${message}\n\nJarvis:`
      : `${systemPrompt}\n\n${studentName}: ${message}\n\nJarvis:`
    
    // Gemini 3 Flash çağrısı
    const result = await geminiModel.generateContent(fullPrompt)
    const response = await result.response
    let responseText = response.text()
    
    // "Jarvis:" prefix'ini kaldır
    responseText = responseText.replace(/^Jarvis:\s*/i, '').trim()
    
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
      'istatistik': 'İstatistik',
      'fotosentez': 'Fotosentez',
      'hücre': 'Hücre',
      'atom': 'Atom'
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
      cleanText = `Efendim, sistemlerde kısa bir kesinti yaşadık ama Jarvis hâlâ burada. Tekrar deneyelim mi?`
    }

    const duration = Date.now() - startTime

    // Her 5 mesajda bir konuşma özetini kaydet (arka planda)
    const allMessages = [...conversationHistory, { role: 'user' as const, content: message }, { role: 'assistant' as const, content: cleanText }]
    if (allMessages.length >= 5 && allMessages.length % 5 === 0) {
      summarizeConversation(user.id, allMessages, topic).catch(e =>
        console.error('❌ [JARVIS] Memory kayıt hatası:', e.message)
      )
    }

    // "Görüşürüz" gibi veda mesajlarında da özet kaydet
    const isGoodbye = /görüşürüz|hoşça kal|bye|güle güle|iyi geceler|kapanış/i.test(message)
    if (isGoodbye && allMessages.length >= 4) {
      summarizeConversation(user.id, allMessages, topic).catch(e =>
        console.error('❌ [JARVIS] Veda memory hatası:', e.message)
      )
    }

    // Güncel kredi durumunu al
    const updatedCredits = await getCreditStatus(user.id)
    
    return NextResponse.json({
      success: true,
      text: cleanText,
      response: cleanText, // Eski uyumluluk için
      visuals: visuals.length > 0 ? visuals : undefined,
      topic,
      student_name: studentName,
      credits: {
        remaining: updatedCredits.remaining,
        is_premium: updatedCredits.is_premium
      },
      assistant: JARVIS_IDENTITY.name,
      model: 'gemini-3-flash-preview',
      duration
    })
    
  } catch (error: any) {
    console.error('❌ [JARVIS] Chat hatası:', error.message)
    return NextResponse.json({ 
      error: error.message,
      text: 'Bir sorun oluştu ama endişelenme!'
    }, { status: 500 })
  }
}
