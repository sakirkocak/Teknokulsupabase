import {
  generateImageQuestion,
  generateCompleteImageQuestion,
  type Difficulty,
} from '@/lib/gemini'

// =====================================================
// PUBLISHER GENERATION PIPELINE
// Mevcut ÖSYM kaliteli Gemini pipeline'ını kullanır
// =====================================================

export interface PublisherGenerationParams {
  subject: string
  topic: string
  imageType: string
  difficulty: Difficulty
  examMode: string | null
  grade?: number
  imageDescription?: string  // Özel şekil/görsel tanımı
  learningOutcome?: string    // Kazanım metni
  generateImage?: boolean
}

export interface PublisherGeneratedQuestion {
  question_text: string
  options: { A: string; B: string; C: string; D: string; E?: string }
  correct_answer: string
  explanation: string
  difficulty: string
  bloom_level: string
  image_prompt?: string
  image_base64?: string
  image_type?: string
  learning_outcome?: string
  image_description?: string
  verified?: boolean
}

// =====================================================
// ADIM 1: Soru üret (mevcut ÖSYM kaliteli pipeline)
// =====================================================
export async function generatePublisherQuestion(
  params: PublisherGenerationParams
): Promise<PublisherGeneratedQuestion> {
  const {
    subject, topic, imageType, difficulty, examMode,
    grade, imageDescription, learningOutcome, generateImage = false,
  } = params

  const effectiveGrade = examMode ? 11 : (grade || 8)

  let question: PublisherGeneratedQuestion

  if (generateImage) {
    // Görsel dahil tam üretim
    const result = await generateCompleteImageQuestion(
      effectiveGrade,
      subject,
      topic,
      imageType,
      difficulty,
      imageDescription,
      examMode
    )
    question = result as PublisherGeneratedQuestion
  } else {
    // Sadece soru metni (görsel ayrıca üretilecek)
    const result = await generateImageQuestion(
      effectiveGrade,
      subject,
      topic,
      imageType,
      imageDescription,
      difficulty,
      examMode
    )
    question = result as PublisherGeneratedQuestion
  }

  return {
    ...question,
    learning_outcome: learningOutcome,
    image_description: imageDescription,
  }
}

// =====================================================
// ADIM 2: Gemini 2.5 Flash ile bağımsız cevap doğrulama
// =====================================================
export async function verifyPublisherAnswer(
  question: PublisherGeneratedQuestion
): Promise<boolean> {
  const optionsText = Object.entries(question.options)
    .map(([k, v]) => `${k}) ${v}`)
    .join('\n')

  const prompt = `Bu soruyu çöz. SADECE doğru şık harfini döndür (A, B, C, D veya E), başka hiçbir şey yazma.

Soru: ${question.question_text}

Şıklar:
${optionsText}

Cevap:`

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.05, maxOutputTokens: 5 },
        }),
      }
    )
    if (!response.ok) return false
    const data = await response.json()
    const answer = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim().toUpperCase() || ''
    const extracted = answer.match(/[A-E]/)?.[0] || ''
    return extracted === question.correct_answer.toUpperCase()
  } catch {
    return false
  }
}

// =====================================================
// ADIM 3: Gemini Embedding üretimi (text-embedding-004, 768 dim)
// =====================================================
export async function generateEmbedding(text: string): Promise<number[] | null> {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'models/text-embedding-004',
          content: { parts: [{ text }] },
          taskType: 'RETRIEVAL_DOCUMENT',
        }),
      }
    )
    if (!response.ok) return null
    const data = await response.json()
    return data.embedding?.values || null
  } catch {
    return null
  }
}

// Arama sorgusu için embedding (RETRIEVAL_QUERY task)
export async function generateQueryEmbedding(query: string): Promise<number[] | null> {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'models/text-embedding-004',
          content: { parts: [{ text: query }] },
          taskType: 'RETRIEVAL_QUERY',
        }),
      }
    )
    if (!response.ok) return null
    const data = await response.json()
    return data.embedding?.values || null
  } catch {
    return null
  }
}

// Embedding için birleştirme metni
export function buildEmbeddingText(question: PublisherGeneratedQuestion, subject: string, topic: string, examType?: string): string {
  return [
    question.question_text,
    Object.entries(question.options).map(([k, v]) => `${k}) ${v}`).join(' | '),
    question.explanation,
    subject,
    topic,
    examType || '',
    question.bloom_level || '',
    question.learning_outcome || '',
  ].filter(Boolean).join('\n')
}
