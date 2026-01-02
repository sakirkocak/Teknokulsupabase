/**
 * 🎓 TeknoÖğretmen - OpenAI Chat API (RAG + Kişiselleştirme)
 * POST /api/tekno-teacher/openai
 * 
 * Özellikler:
 * - RAG: Semantic search ile benzer sorular bulur
 * - Öğrenci analizi: Zayıf/güçlü konular, son aktivite
 * - Persona: Destekleyici veya Enerjik mod
 * - Cache: Tekrarlayan sorgularda hızlı yanıt
 */

import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createClient } from '@supabase/supabase-js'
import { getSearchEmbedding } from '@/lib/gemini-embedding'
import { checkRateLimit, getClientIP } from '@/lib/rateLimit'
import { profileCache, embeddingCache, createCacheKey, cachedFetch } from '@/lib/cache'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

// Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Sabitler
const MODEL = 'gpt-4o-mini'

// Persona tipleri
type PersonaType = 'supportive' | 'energetic'

interface Persona {
  name: string
  voice: 'shimmer' | 'nova' | 'alloy' | 'onyx'
  style: string
  traits: string[]
}

const PERSONAS: Record<PersonaType, Persona> = {
  supportive: {
    name: 'Destekleyici Hoca',
    voice: 'shimmer',
    style: 'Sakin, cesaretlendirici, sabırlı',
    traits: [
      'Öğrenciyi asla yargılama',
      'Hatalardan öğrenmeyi vurgula',
      'Küçük başarıları bile kutla',
      'Endişeyi azaltıcı ifadeler kullan: "Hiç sorun değil", "Birlikte çözeriz"'
    ]
  },
  energetic: {
    name: 'Enerjik Koç',
    voice: 'nova',
    style: 'Dinamik, motive edici, rekabetçi',
    traits: [
      'Coşkulu ve pozitif ol',
      'Başarıları yüksek sesle kutla: "Harika!", "Süpersin!"',
      'Rekabet motivasyonunu kullan',
      'Hız ve performansı övgüyle karşıla'
    ]
  }
}

interface ChatRequest {
  message: string
  conversationHistory?: { role: 'user' | 'assistant', content: string }[]
  studentName?: string
  studentId?: string
  grade?: number
  persona?: PersonaType
  // RAG ve analiz için
  includeRAG?: boolean
  studentAnalysis?: {
    weakTopics?: string[]
    strongTopics?: string[]
    recentActivity?: {
      questionsLast7Days: number
      successRate: number
    }
  }
}

/**
 * Semantic search ile ilgili soruları bul
 */
async function findRelatedQuestions(
  query: string,
  grade?: number,
  limit: number = 3
): Promise<Array<{ question_text: string, main_topic: string, explanation: string }>> {
  try {
    // Embedding oluştur (cache'li)
    const embeddingCacheKey = createCacheKey('embedding', query.toLowerCase().trim())
    
    const embedding = await cachedFetch(
      embeddingCache,
      embeddingCacheKey,
      () => getSearchEmbedding(query),
      30 * 60 * 1000
    )

    if (!embedding || embedding.length !== 768) {
      return []
    }

    // pgvector search
    const { data, error } = await supabase.rpc('search_questions_semantic', {
      query_embedding: `[${embedding.join(',')}]`,
      match_threshold: 0.65,
      match_count: limit,
      filter_grade: grade || null,
      filter_subject_code: null
    })

    if (error) {
      console.warn('RAG search error:', error.message)
      return []
    }

    // Detayları çek
    if (data && data.length > 0) {
      const questionIds = data.map((d: any) => d.id)
      const { data: details } = await supabase
        .from('questions')
        .select('id, question_text, explanation')
        .in('id', questionIds)

      const detailsMap = new Map((details || []).map((d: any) => [d.id, d]))

      return data.map((d: any) => ({
        question_text: detailsMap.get(d.id)?.question_text || d.question_text,
        main_topic: d.main_topic,
        explanation: detailsMap.get(d.id)?.explanation || ''
      }))
    }

    return []
  } catch (error) {
    console.error('RAG error:', error)
    return []
  }
}

/**
 * Persona seç (öğrenci durumuna göre)
 */
function selectPersona(
  studentAnalysis?: ChatRequest['studentAnalysis'],
  messageContent?: string
): PersonaType {
  // Varsayılan: Enerjik
  let persona: PersonaType = 'energetic'

  // Zayıf konu varsa destekleyici ol
  if (studentAnalysis?.weakTopics && studentAnalysis.weakTopics.length > 0) {
    // Mesajda zayıf konu geçiyorsa
    const messageLC = (messageContent || '').toLowerCase()
    const mentionsWeakTopic = studentAnalysis.weakTopics.some(topic => 
      messageLC.includes(topic.toLowerCase())
    )
    if (mentionsWeakTopic) {
      persona = 'supportive'
    }
  }

  // Düşük başarı oranı varsa destekleyici ol
  if (studentAnalysis?.recentActivity?.successRate !== undefined) {
    if (studentAnalysis.recentActivity.successRate < 50) {
      persona = 'supportive'
    }
  }

  // Mesaj içeriğine göre
  const messageLC = (messageContent || '').toLowerCase()
  const needsSupport = [
    'zorlanıyorum', 'anlamıyorum', 'yapamıyorum', 'zor', 'karışık',
    'başaramıyorum', 'bilmiyorum', 'yardım', 'anlayamadım'
  ].some(word => messageLC.includes(word))

  if (needsSupport) {
    persona = 'supportive'
  }

  return persona
}

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  
  // Rate limit
  const ip = getClientIP(request)
  const rateLimit = checkRateLimit(`openai:${ip}`, {
    windowMs: 60000,
    maxRequests: 30,
    blockDurationMs: 60000
  })

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'Rate limit exceeded', retryAfter: Math.ceil(rateLimit.resetIn / 1000) },
      { status: 429 }
    )
  }

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'API key bulunamadı' }, { status: 500 })
  }
  
  try {
    const body: ChatRequest = await request.json()
    const { 
      message, 
      conversationHistory = [],
      studentName = 'Öğrenci',
      studentId,
      grade = 8,
      persona: requestedPersona,
      includeRAG = true,
      studentAnalysis
    } = body
    
    // Persona seç
    const selectedPersona = requestedPersona || selectPersona(studentAnalysis, message)
    const persona = PERSONAS[selectedPersona]
    
    // RAG: İlgili sorular bul (opsiyonel)
    let ragContext = ''
    let relatedQuestions: any[] = []
    
    if (includeRAG && message && message.length > 10) {
      relatedQuestions = await findRelatedQuestions(message, grade, 3)
      
      if (relatedQuestions.length > 0) {
        ragContext = `

📚 SORU BANKASI BİLGİSİ (RAG):
Öğrencinin sorduğu konuyla ilgili benzer sorular buldum:
${relatedQuestions.map((q, i) => `
${i + 1}. Konu: ${q.main_topic}
   Soru: ${q.question_text?.substring(0, 150)}...
   ${q.explanation ? `Çözüm İpucu: ${q.explanation.substring(0, 200)}...` : ''}
`).join('')}

Bu bilgileri kullanarak öğrenciye yardımcı ol. Direkt kopyalama, kendi cümlelerinle açıkla.`
      }
    }

    // Öğrenci analizi context'i
    let analysisContext = ''
    if (studentAnalysis) {
      const parts = []
      
      if (studentAnalysis.weakTopics?.length) {
        parts.push(`Zorlandığı konular: ${studentAnalysis.weakTopics.slice(0, 3).join(', ')}`)
      }
      if (studentAnalysis.strongTopics?.length) {
        parts.push(`Güçlü olduğu konular: ${studentAnalysis.strongTopics.slice(0, 3).join(', ')}`)
      }
      if (studentAnalysis.recentActivity) {
        parts.push(`Son 7 gün: ${studentAnalysis.recentActivity.questionsLast7Days} soru, %${Math.round(studentAnalysis.recentActivity.successRate)} başarı`)
      }
      
      if (parts.length > 0) {
        analysisContext = `

📊 ÖĞRENCİ ANALİZİ:
${parts.join('\n')}`
      }
    }
    
    const openai = new OpenAI({ apiKey })
    
    // Sistem talimatı (Persona + RAG + Analiz)
    const systemPrompt = `Sen TeknoÖğretmen'sin - ${studentName}'in özel ders öğretmeni.

👤 KİMLİK:
- Adı: TeknoÖğretmen (${persona.name})
- Karakter: ${persona.style}
- Dil: Türkçe

🎯 KARAKTER ÖZELLİKLERİ:
${persona.traits.map(t => `- ${t}`).join('\n')}

📋 KURALLAR:
1. Her yanıta "${studentName}" diye hitap ederek başla
2. Kısa ve öz konuş (maksimum 3-4 cümle)
3. Her zaman Türkçe konuş
4. ${selectedPersona === 'supportive' ? 'Nazik ve cesaretlendirici ol' : 'Enerjik ve motive edici ol'}
5. Matematik/Fen sorularında adım adım açıkla
6. Yanlış cevaplarda cesaretini kırma, ipucu ver
7. Emoji kullanabilirsin ama abartma (1-2 emoji yeterli)

📚 ÖĞRENCİ BİLGİLERİ:
- İsim: ${studentName}
- Sınıf: ${grade}. sınıf
- Platform: Teknokul - 60.000+ sorulu AI destekli eğitim platformu
${analysisContext}
${ragContext}`

    // Konuşma geçmişini hazırla
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory.slice(-6).map(msg => ({  // Son 6 mesaj
        role: msg.role as 'user' | 'assistant',
        content: msg.content
      })),
      { role: 'user', content: message || `Merhaba, ben ${studentName}!` }
    ]
    
    // GPT-4o-mini çağrısı
    const completion = await openai.chat.completions.create({
      model: MODEL,
      messages,
      max_tokens: 400,
      temperature: selectedPersona === 'supportive' ? 0.7 : 0.85
    })
    
    const responseText = completion.choices[0]?.message?.content || 
      `${studentName}, şu an bir teknik sorun yaşıyoruz ama yine de sana yardımcı olabilirim!`
    
    const duration = Date.now() - startTime
    
    return NextResponse.json({
      success: true,
      text: responseText,
      model: MODEL,
      tokens: completion.usage?.total_tokens,
      duration,
      persona: selectedPersona,
      voice: persona.voice,
      ragUsed: relatedQuestions.length > 0,
      ragCount: relatedQuestions.length
    })
    
  } catch (error: any) {
    console.error('❌ [OPENAI] Hata:', error.message)
    return NextResponse.json({ 
      error: error.message,
      fallbackText: `Bir sorun oluştu ama endişelenme, hemen düzelteceğiz!`
    }, { status: 500 })
  }
}

/**
 * GET - Persona bilgisi
 */
export async function GET() {
  return NextResponse.json({
    personas: Object.entries(PERSONAS).map(([key, value]) => ({
      id: key,
      name: value.name,
      voice: value.voice,
      style: value.style
    })),
    model: MODEL
  })
}
