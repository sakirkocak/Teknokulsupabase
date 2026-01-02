/**
 * TeknoÖğretmen - Gemini AI Entegrasyonu
 * Kişiselleştirilmiş eğitim asistanı
 * 
 * Modeller:
 * - gemini-2.0-flash-exp: Metin üretimi
 * - gemini-2.5-flash-preview-tts: Native TTS (Ses üretimi)
 */

import { GoogleGenerativeAI } from '@google/generative-ai'

// Gemini client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

// Model sabitleri
export const MODELS = {
  CHAT: 'gemini-2.0-flash-exp',
  TTS: 'gemini-2.5-flash-preview-tts',  // Native TTS
  LIVE_AUDIO: 'gemini-2.5-flash-native-audio-preview-12-2025' // Live API için
}

// =====================================================
// TİPLER
// =====================================================

export interface TeacherContext {
  student_name: string
  grade: number
  weaknesses: {
    subject: string
    topic: string
    sub_topic: string | null
    wrong_count: number
  }[]
  recent_performance: {
    average_score: number
    total_questions: number
    strongest_subject: string | null
    weakest_subject: string | null
  }
  recent_sessions: {
    subject: string
    topic: string
    score: number
    wrong_count: number
  }[]
}

export interface QuestionContext {
  question_text: string
  correct_answer: string
  student_answer: string
  subject: string
  topic: string
  difficulty: string
}

export type TeacherPersonality = 'friendly' | 'strict' | 'motivating'

// =====================================================
// SİSTEM TALİMATLARI
// =====================================================

// =====================================================
// SOKRATİK ÖĞRETMEN SİSTEM TALİMATLARI
// Kısa yanıtlar + Geri soru sorma + Doğal akış + İSİMLE HİTAP
// =====================================================

/**
 * Dinamik system prompt oluştur - Öğrenci ismi ile
 */
export function buildSystemPrompt(personality: TeacherPersonality, studentName: string): string {
  const name = studentName || 'Öğrenci'
  
  const prompts: Record<TeacherPersonality, string> = {
    friendly: `Sen TeknoÖğretmen'sin - ${name}'in özel ders öğretmeni. Samimi, sabırlı ve SOKRATİK bir yapay zeka öğretmenisin.

⚠️ KRİTİK: Öğrencinin adı "${name}". HER yanıtına "${name}" diye hitap ederek başla!

🎯 ANA KURAL: ASLA uzun anlatma! Max 2-3 cümle + MUTLAKA soru sor.

Sokratik Kuralların:
1. ✨ HER yanıta "${name}" diye başla (Örn: "${name}, şimdi bak...")
2. Yanıtların 2-3 cümleyi ASLA geçmesin
3. Her yanıtın sonunda MUTLAKA bir soru sor
4. Doğrudan cevabı ASLA verme - ipucu ver, düşündür
5. "${name} bilmiyorum" derse, hayattan örnek ver
6. Konuşma dili kullan: "Hmm", "Şimdi düşün ${name}", "Bak"

✅ DOĞRU FORMAT:
"${name}, güzel soru! 🍕 Şimdi düşün: Bir pizza 8 dilime bölündü. 3 dilim yedin. Sence ne kadar pizza yemiş oldun?"

❌ YANLIŞ (isim yok, çok uzun):
"Kesirler matematikte önemli bir konudur. Bir kesir pay ve paydadan oluşur..."`,

    strict: `Sen TeknoÖğretmen'sin - ${name}'in disiplinli öğretmeni. SOKRATİK ama kararlısın.

⚠️ KRİTİK: Öğrencinin adı "${name}". HER yanıtına "${name}" ile başla!

🎯 ANA KURAL: Kısa ve net! Max 2-3 cümle + test sorusu.

Kuralların:
1. ✨ HER yanıta "${name}!" diye başla
2. Yanıtlar max 2-3 cümle
3. Her yanıtta sınav sorusu sor
4. "Bilmiyorum" kabul etme - "${name}, tahmin et!" de
5. Net ve kararlı ol

✅ DOĞRU: "${name}, dikkat! Burada çarpma lazım. Hadi: 7 x 8 kaç?"`,

    motivating: `Sen TeknoÖğretmen'sin - ${name}'i motive eden özel öğretmen. Enerjik ve SOKRATİKsin.

⚠️ KRİTİK: Öğrencinin adı "${name}". HER yanıtına "${name}" ile coşkuyla başla!

🎯 ANA KURAL: Heyecan ver, kısa tut, SORU SOR!

Kuralların:
1. ✨ HER yanıta "${name}!" diye coşkuyla başla
2. Yanıtlar max 2-3 cümle
3. Her yanıtta merak uyandıran soru sor
4. Her denemesini kutla: "Harika ${name}!"
5. Enerjik ol, emoji kullan

✅ DOĞRU: "${name}, vay canına! 🌟 Tam doğru yoldasın! Şimdi söyle bakalım: Bu formülü NEDEN kullanıyoruz?"`
  }
  
  return prompts[personality]
}

// Eski statik prompt'lar (geriye uyumluluk için)
const SYSTEM_PROMPTS: Record<TeacherPersonality, string> = {
  friendly: buildSystemPrompt('friendly', 'Öğrenci'),
  strict: buildSystemPrompt('strict', 'Öğrenci'),
  motivating: buildSystemPrompt('motivating', 'Öğrenci')
}

// Konuşma akışı için ek talimatlar
export const CONVERSATION_FLOW_INSTRUCTIONS = `
📣 KONUŞMA AKIŞI TALİMATLARI:

1. İLK MESAJ: Samimi selamla + Kısa bir soru sor
2. ÖĞRENCİ CEVAPLADI: Cevabı değerlendir (1 cümle) + Yeni soru sor
3. ÖĞRENCİ BİLMİYOR: Günlük hayattan örnek ver + Aynı soruyu basitleştir
4. ÖĞRENCİ DOĞRU: Kutla (kısa!) + Bir üst seviye soru sor
5. ÖĞRENCİ YANLIŞ: Nazikçe ipucu ver + Tekrar dene dedirt

MUTLAKA:
- Konuşmayı SEN bitirme, öğrenci konuşsun
- Her mesaj bir SORU ile bitsin
- Sessizlik olmasın, sohbet devam etsin
`

// =====================================================
// PROMPT OLUŞTURUCULAR
// =====================================================

/**
 * Hata analizi için prompt oluştur
 */
function buildErrorAnalysisPrompt(
  context: TeacherContext,
  question: QuestionContext
): string {
  return `
Öğrenci Bilgileri:
- İsim: ${context.student_name}
- Sınıf: ${context.grade}. sınıf
- Genel Başarı: %${context.recent_performance.average_score}
- En Zayıf Ders: ${context.recent_performance.weakest_subject || 'Belirlenmedi'}

Son Hatalı Konular:
${context.weaknesses.slice(0, 3).map(w => `- ${w.subject}: ${w.topic} (${w.wrong_count} hata)`).join('\n')}

Şu An Çözülen Soru:
- Ders: ${question.subject}
- Konu: ${question.topic}
- Zorluk: ${question.difficulty}
- Soru: ${question.question_text}
- Doğru Cevap: ${question.correct_answer}
- Öğrencinin Cevabı: ${question.student_answer}

Görev: ${context.student_name}'e bu soruyu neden yanlış yaptığını açıkla. Doğrudan cevabı söyleme, ipuçları ver ve düşünmesini sağla.
`
}

/**
 * Günlük özet için prompt oluştur
 */
function buildDailySummaryPrompt(context: TeacherContext): string {
  const weakTopics = context.weaknesses.slice(0, 3)
  
  return `
Öğrenci Bilgileri:
- İsim: ${context.student_name}
- Sınıf: ${context.grade}. sınıf
- Bugünkü Başarı: %${context.recent_performance.average_score}
- Toplam Çözülen: ${context.recent_performance.total_questions} soru

En Çok Zorlandığı Konular:
${weakTopics.map(w => `- ${w.subject}: ${w.topic} (${w.wrong_count} kez hata)`).join('\n')}

Görev: ${context.student_name} için kısa bir günlük değerlendirme yaz:
1. Bugünkü performansını değerlendir
2. En çok zorlandığı konuyu açıkla
3. Yarın için motivasyon ver
4. Bir sonraki çalışma önerisi sun

Samimi ve cesaretlendirici ol. 2-3 paragraf yeterli.
`
}

/**
 * Konu anlatımı için prompt oluştur
 */
function buildTopicExplanationPrompt(
  context: TeacherContext,
  subject: string,
  topic: string
): string {
  return `
Öğrenci Bilgileri:
- İsim: ${context.student_name}
- Sınıf: ${context.grade}. sınıf

İstenen Konu:
- Ders: ${subject}
- Konu: ${topic}

Görev: ${context.student_name}'e bu konuyu basit ve anlaşılır şekilde anlat:
1. Konunun özünü 1-2 cümlede açıkla
2. Günlük hayattan bir örnek ver
3. Dikkat edilmesi gereken püf noktalarını belirt
4. Basit bir örnek soru çöz (adım adım)

${context.grade}. sınıf seviyesine uygun, sade bir dil kullan.
`
}

// =====================================================
// ANA FONKSİYONLAR
// =====================================================

/**
 * Hata analizi yap
 */
export async function analyzeError(
  context: TeacherContext,
  question: QuestionContext,
  personality: TeacherPersonality = 'friendly'
): Promise<string> {
  const model = genAI.getGenerativeModel({ 
    model: 'gemini-2.0-flash-exp',
    systemInstruction: SYSTEM_PROMPTS[personality]
  })
  
  const prompt = buildErrorAnalysisPrompt(context, question)
  
  try {
    const result = await model.generateContent(prompt)
    const response = await result.response
    return response.text()
  } catch (error) {
    console.error('Gemini error:', error)
    throw new Error('AI yanıt üretemedi')
  }
}

/**
 * Günlük özet oluştur
 */
export async function generateDailySummary(
  context: TeacherContext,
  personality: TeacherPersonality = 'motivating'
): Promise<string> {
  const model = genAI.getGenerativeModel({ 
    model: 'gemini-2.0-flash-exp',
    systemInstruction: SYSTEM_PROMPTS[personality]
  })
  
  const prompt = buildDailySummaryPrompt(context)
  
  try {
    const result = await model.generateContent(prompt)
    const response = await result.response
    return response.text()
  } catch (error) {
    console.error('Gemini error:', error)
    throw new Error('AI yanıt üretemedi')
  }
}

/**
 * Konu anlatımı oluştur
 */
export async function explainTopic(
  context: TeacherContext,
  subject: string,
  topic: string,
  personality: TeacherPersonality = 'friendly'
): Promise<string> {
  const model = genAI.getGenerativeModel({ 
    model: 'gemini-2.0-flash-exp',
    systemInstruction: SYSTEM_PROMPTS[personality]
  })
  
  const prompt = buildTopicExplanationPrompt(context, subject, topic)
  
  try {
    const result = await model.generateContent(prompt)
    const response = await result.response
    return response.text()
  } catch (error) {
    console.error('Gemini error:', error)
    throw new Error('AI yanıt üretemedi')
  }
}

/**
 * Serbest sohbet - Sokratik öğretim ile + İsimle hitap
 */
export async function chat(
  context: TeacherContext,
  userMessage: string,
  personality: TeacherPersonality = 'friendly',
  conversationHistory: { role: 'user' | 'assistant', content: string }[] = []
): Promise<string> {
  // ✨ Dinamik system prompt - öğrenci ismiyle
  const studentName = context.student_name || 'Öğrenci'
  const dynamicPrompt = buildSystemPrompt(personality, studentName)
  
  const systemPrompt = dynamicPrompt + CONVERSATION_FLOW_INSTRUCTIONS + `

📋 ÖĞRENCİ BİLGİLERİ:
- 🏷️ İSİM: ${studentName} (HER yanıtta bu ismi kullan!)
- 📚 Sınıf: ${context.grade}. sınıf
- 📊 Genel Başarı: %${context.recent_performance.average_score}
${context.recent_performance.weakest_subject ? `- ⚠️ En Zayıf Ders: ${context.recent_performance.weakest_subject}` : ''}

⚠️ KRİTİK HATIRLATMA:
- HER yanıtına "${studentName}" diye başla!
- Sadece eğitimle ilgili konularda yardım et
- HER ZAMAN soru ile bitir
- Yanıtın 50 kelimeyi ASLA geçmesin
- Samimi ol: "${studentName}, hmm güzel soru!"
`

  const model = genAI.getGenerativeModel({ 
    model: MODELS.CHAT,
    systemInstruction: systemPrompt
  })
  
  try {
    // Konuşma geçmişini ekle
    const chat = model.startChat({
      history: conversationHistory.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }]
      }))
    })
    
    const result = await chat.sendMessage(userMessage)
    const response = await result.response
    return response.text()
  } catch (error) {
    console.error('Gemini chat error:', error)
    throw new Error('AI yanıt üretemedi')
  }
}

/**
 * Podcast scripti oluştur (sesli anlatım için)
 */
export async function generatePodcastScript(
  context: TeacherContext,
  focusTopic?: { subject: string, topic: string }
): Promise<string> {
  const model = genAI.getGenerativeModel({ 
    model: 'gemini-2.0-flash-exp',
    systemInstruction: `Sen TeknoÖğretmen'sin - bir podcast sunucusu gibi konuş.

Kuralların:
1. Öğrenciye ismiyle hitap et
2. Doğal, konuşma dili kullan (yazı dili değil)
3. Kısa cümleler kur (sesli okunacak)
4. "Hmm", "Şimdi bak", "Dikkat et" gibi doğal ifadeler kullan
5. 2 dakikalık konuşma uzunluğunda tut (~300 kelime)
6. Türkçe konuş
7. Parantez içinde sahne yönergeleri YAZMA, sadece konuşma metni yaz
`
  })
  
  const weakTopics = context.weaknesses.slice(0, 2)
  const targetTopic = focusTopic || (weakTopics.length > 0 ? {
    subject: weakTopics[0].subject,
    topic: weakTopics[0].topic
  } : null)
  
  const prompt = `
Öğrenci: ${context.student_name}, ${context.grade}. sınıf
Genel Başarı: %${context.recent_performance.average_score}

${targetTopic ? `
Odak Konu: ${targetTopic.subject} - ${targetTopic.topic}
Bu konuda ${weakTopics.find(w => w.topic === targetTopic.topic)?.wrong_count || 'birkaç'} kez hata yapmış.
` : `
En Zayıf Konular:
${weakTopics.map(w => `- ${w.subject}: ${w.topic}`).join('\n')}
`}

Görev: ${context.student_name} için 2 dakikalık kişisel bir podcast scripti yaz.
- Onu selamla
- Bugünkü performansını değerlendir
- Zorlandığı konuyu basitçe açıkla
- Bir püf noktası ver
- Motive et ve vedalaş

Doğal konuşma dili kullan, sesli okunacak.
`

  try {
    const result = await model.generateContent(prompt)
    const response = await result.response
    return response.text()
  } catch (error) {
    console.error('Gemini error:', error)
    throw new Error('Podcast scripti üretilemedi')
  }
}

// =====================================================
// SES ÜRETİMİ - Gemini Native TTS
// Model: gemini-2.5-flash-preview-tts
// =====================================================

// Desteklenen ses karakterleri
export const TTS_VOICES = {
  FEMALE_TEACHER: 'Aoede',      // Yumuşak, öğretmen tarzı kadın
  MALE_TEACHER: 'Charon',       // Derin, güven veren erkek
  FRIENDLY: 'Kore',             // Samimi, genç kadın
  ENERGETIC: 'Puck',            // Enerjik, motive edici
  CALM: 'Fenrir'                // Sakin, rahatlatıcı
}

/**
 * Gemini Native TTS ile ses üret
 * @param text Okunacak metin
 * @param voice Ses karakteri
 * @returns Base64 encoded audio data
 */
export async function generateSpeech(
  text: string,
  voice: string = TTS_VOICES.FEMALE_TEACHER
): Promise<{ audioBase64: string, mimeType: string } | null> {
  try {
    // Gemini TTS modeli
    const model = genAI.getGenerativeModel({ 
      model: MODELS.TTS,
      generationConfig: {
        // @ts-ignore - Gemini TTS için özel config
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {
              voiceName: voice
            }
          }
        }
      }
    })
    
    // Ses üretimi için prompt
    const prompt = `Bunu doğal bir Türk öğretmen gibi, samimi ve sıcak bir tonla oku. 
Vurgulara dikkat et, soruları merak uyandırıcı şekilde sor:

"${text}"`

    const result = await model.generateContent(prompt)
    const response = await result.response
    
    // Audio data'yı al
    // @ts-ignore - Gemini TTS response formatı
    const audioData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData
    
    if (audioData) {
      return {
        audioBase64: audioData.data,
        mimeType: audioData.mimeType || 'audio/mp3'
      }
    }
    
    console.log('TTS: No audio data in response')
    return null
    
  } catch (error: any) {
    console.error('Gemini TTS error:', error.message)
    // Fallback: Web Speech API kullanılacak (client-side)
    return null
  }
}

/**
 * Öğretmen karakterine uygun ses seç
 */
export function getVoiceForPersonality(personality: TeacherPersonality): string {
  switch (personality) {
    case 'friendly':
      return TTS_VOICES.FRIENDLY
    case 'strict':
      return TTS_VOICES.MALE_TEACHER
    case 'motivating':
      return TTS_VOICES.ENERGETIC
    default:
      return TTS_VOICES.FEMALE_TEACHER
  }
}
