import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  generatePublisherQuestion,
  verifyPublisherAnswer,
  generateEmbedding,
  buildEmbeddingText,
  type PublisherGenerationParams,
} from '@/lib/publisher-generation'
import { typesenseClient, COLLECTIONS, isTypesenseAvailable } from '@/lib/typesense/client'

export const maxDuration = 300

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

    const { data: profile } = await supabase
      .from('profiles').select('role').eq('id', user.id).single()
    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Sadece admin' }, { status: 403 })
    }

    const body = await request.json()
    const {
      subject, topic, imageType, difficulty, examMode,
      grade, imageDescription, learningOutcome,
      count = 1,
      generateImage = false,
      autoSave = false,    // true = direkt kaydet, false = önizleme döndür
      autoApprove = false, // true = status=available, false = pending_review
    } = body

    const results = []
    const errors: string[] = []

    for (let i = 0; i < Math.min(count, 10); i++) {
      try {
        // ADIM 1: Soru üret (ÖSYM kaliteli pipeline)
        let question = await generatePublisherQuestion({
          subject, topic, imageType, difficulty, examMode,
          grade, imageDescription, learningOutcome,
          generateImage,
        } as PublisherGenerationParams)

        // ADIM 2: Cevap doğrulama (max 3 deneme)
        let verified = false
        for (let attempt = 0; attempt < 3; attempt++) {
          verified = await verifyPublisherAnswer(question)
          if (verified) break
          if (attempt < 2) {
            // Yeniden üret
            question = await generatePublisherQuestion({
              subject, topic, imageType, difficulty, examMode,
              grade, imageDescription, learningOutcome, generateImage,
            } as PublisherGenerationParams)
          }
        }

        // ADIM 3: Embedding üret
        const embeddingText = buildEmbeddingText(question, subject, topic, examMode || undefined)
        const embedding = await generateEmbedding(embeddingText)

        const resultItem = {
          question,
          verified,
          embedding,
          embeddingText,
          subject,
          topic,
          examType: examMode,
          learningOutcome,
          imageDescription,
        }

        // ADIM 4: Otomatik kaydet (opsiyonel)
        if (autoSave) {
          const savedId = await saveToPublisherQuestions(
            supabase, user.id, resultItem, autoApprove, embedding
          )
          results.push({ ...resultItem, savedId, saved: true })
        } else {
          results.push({ ...resultItem, saved: false })
        }

      } catch (err) {
        errors.push(`Soru ${i + 1}: ${err instanceof Error ? err.message : 'Bilinmeyen hata'}`)
        results.push({ error: errors[errors.length - 1], saved: false })
      }
    }

    return NextResponse.json({ results, errors })
  } catch (error) {
    console.error('Publisher generate error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Üretim hatası' },
      { status: 500 }
    )
  }
}

// Yardımcı: publisher_questions'a kaydet + Typesense sync
async function saveToPublisherQuestions(
  supabase: any,
  userId: string,
  item: {
    question: {
      question_text: string
      options: Record<string, string>
      correct_answer: string
      explanation: string
      difficulty: string
      bloom_level: string
      image_prompt?: string
      image_base64?: string
      image_type?: string
      learning_outcome?: string
      image_description?: string
    }
    verified: boolean
    subject: string
    topic: string
    examType?: string | null
    learningOutcome?: string
    imageDescription?: string
    embeddingText?: string
  },
  autoApprove: boolean,
  embedding: number[] | null
): Promise<string> {
  const { question, subject, topic, examType, verified } = item

  // base64 görsel varsa Storage'a yükle
  let imageUrl: string | null = null
  if (question.image_base64) {
    const matches = question.image_base64.match(/^data:([A-Za-z-+/]+);base64,(.+)$/)
    if (matches) {
      const mimeType = matches[1]
      const base64Data = matches[2]
      const buffer = Buffer.from(base64Data, 'base64')
      const ext = mimeType.includes('svg') ? 'svg' : 'png'
      const fileName = `publisher-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('publisher-images')
        .upload(fileName, buffer, { contentType: mimeType, upsert: true })

      if (!uploadError) {
        const { data: { publicUrl } } = supabase.storage
          .from('publisher-images').getPublicUrl(fileName)
        imageUrl = publicUrl
      }
    }
  }

  const status = autoApprove ? 'available' : 'pending_review'

  const { data: saved, error } = await supabase
    .from('publisher_questions')
    .insert({
      question_text: question.question_text,
      options: question.options,
      correct_answer: question.correct_answer,
      explanation: question.explanation,
      difficulty: question.difficulty,
      bloom_level: question.bloom_level,
      image_url: imageUrl,
      image_prompt: question.image_prompt || null,
      image_type: question.image_type && question.image_type !== 'none'
        ? question.image_type : null,
      subject,
      topic,
      exam_type: examType || null,
      learning_outcome: item.learningOutcome || null,
      image_description: item.imageDescription || null,
      status,
      is_available: autoApprove,
      verified,
      price_credits: 1,
      created_by: userId,
      embedding_text: item.embeddingText || null,
    })
    .select('id')
    .single()

  if (error) throw error

  // Typesense sync
  if (isTypesenseAvailable() && status === 'available') {
    try {
      const doc: Record<string, unknown> = {
        id: saved.id,
        question_text: question.question_text,
        subject,
        topic,
        difficulty: question.difficulty,
        exam_type: examType || '',
        image_type: question.image_type || 'none',
        grade: 0,
        bloom_level: question.bloom_level || '',
        learning_outcome: item.learningOutcome || '',
        image_description: item.imageDescription || '',
        status,
        is_available: true,
        verified,
        price_credits: 1,
        created_at: Math.floor(Date.now() / 1000),
      }
      if (embedding) doc.embedding = embedding
      await typesenseClient
        .collections(COLLECTIONS.PUBLISHER_QUESTIONS)
        .documents()
        .upsert(doc)
    } catch (tsError) {
      console.error('Typesense sync (non-fatal):', tsError)
    }
  }

  return saved.id
}
