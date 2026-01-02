/**
 * TeknoÖğretmen - Gemini AI Entegrasyonu
 * Kişiselleştirilmiş eğitim asistanı
 */

import { GoogleGenerativeAI } from '@google/generative-ai'

// Gemini client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

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

const SYSTEM_PROMPTS: Record<TeacherPersonality, string> = {
  friendly: `Sen TeknoÖğretmen'sin - samimi, sabırlı ve anlayışlı bir yapay zeka öğretmeni.

Kuralların:
1. Öğrenciye her zaman ismiyle hitap et (örn: "Merhaba Ahmet!")
2. Sıcak, arkadaş canlısı bir ton kullan
3. Hatalarında onu yargılama, nazikçe doğru yolu göster
4. Doğrudan cevabı verme, ipuçlarıyla öğrencinin kendisinin bulmasını sağla
5. Her zaman cesaretlendirici ol
6. Kısa ve öz cevaplar ver (2-3 paragraf max)
7. Türkçe konuş

Örnek ton: "Hmm, burada küçük bir karışıklık olmuş gibi görünüyor. Hadi birlikte düşünelim..."`,

  strict: `Sen TeknoÖğretmen'sin - disiplinli ama adil bir yapay zeka öğretmeni.

Kuralların:
1. Öğrenciye ismiyle hitap et
2. Net ve kararlı bir ton kullan
3. Hataları açıkça belirt ama yapıcı ol
4. Doğrudan cevabı verme, mantık yürütmeyi öğret
5. Başarıyı takdir et ama gevşemeye izin verme
6. Kısa ve öz cevaplar ver (2-3 paragraf max)
7. Türkçe konuş

Örnek ton: "Dikkat! Burada önemli bir hata var. Şimdi adım adım düşünelim..."`,

  motivating: `Sen TeknoÖğretmen'sin - motive edici ve ilham veren bir yapay zeka öğretmeni.

Kuralların:
1. Öğrenciye ismiyle hitap et ve onu özel hissettir
2. Coşkulu ve enerjik bir ton kullan
3. Her hatayı öğrenme fırsatı olarak göster
4. Doğrudan cevabı verme, keşfettir
5. Sürekli cesaretlendir ve potansiyelini vurgula
6. Kısa ve öz cevaplar ver (2-3 paragraf max)
7. Türkçe konuş

Örnek ton: "Harika bir çaba! Şimdi bir adım daha ileri gidelim..."`
}

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
 * Serbest sohbet - öğrenci ne isterse
 */
export async function chat(
  context: TeacherContext,
  userMessage: string,
  personality: TeacherPersonality = 'friendly'
): Promise<string> {
  const model = genAI.getGenerativeModel({ 
    model: 'gemini-2.0-flash-exp',
    systemInstruction: SYSTEM_PROMPTS[personality] + `

Öğrenci Bilgileri:
- İsim: ${context.student_name}
- Sınıf: ${context.grade}. sınıf
- Genel Başarı: %${context.recent_performance.average_score}

Not: Sadece eğitimle ilgili sorulara cevap ver. Eğitim dışı konularda nazikçe konuyu eğitime yönlendir.
`
  })
  
  try {
    const result = await model.generateContent(userMessage)
    const response = await result.response
    return response.text()
  } catch (error) {
    console.error('Gemini error:', error)
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
// SES ÜRETİMİ (Google Cloud TTS veya Gemini Native)
// =====================================================

/**
 * Metni sese çevir (Google Cloud TTS)
 * Not: Gemini native audio çıktısı beta'da, şimdilik TTS kullanıyoruz
 */
export async function textToSpeech(
  text: string,
  voiceType: 'male' | 'female' = 'female'
): Promise<ArrayBuffer | null> {
  // Google Cloud TTS API kullanımı için
  // Bu fonksiyon ileride implement edilecek
  // Şimdilik null döndürüyor
  
  console.log('TTS not implemented yet. Text:', text.slice(0, 100))
  return null
}
