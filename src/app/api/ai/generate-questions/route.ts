import { NextRequest, NextResponse } from 'next/server'
import { generateQuestions, QuestionType, Difficulty } from '@/lib/gemini'
import { withAIProtection } from '@/lib/ai-middleware'

export async function POST(request: NextRequest) {
  try {
    // Auth + Rate limit
    const protection = await withAIProtection(request, 'generate-questions')
    if (!protection.allowed) return protection.response!

    const body = await request.json()
    const { subject, topic, questionTypes, difficulty, count } = body

    if (!subject || !topic || !questionTypes || questionTypes.length === 0) {
      return NextResponse.json(
        { error: 'Ders, konu ve soru tipi gerekli' },
        { status: 400 }
      )
    }

    // Count siniri (max 20)
    const safeCount = Math.min(Math.max(1, count || 5), 20)

    const questions = await generateQuestions(
      subject,
      topic,
      questionTypes as QuestionType[],
      difficulty as Difficulty,
      safeCount
    )

    return NextResponse.json({ questions })
  } catch (error: any) {
    console.error('Generate questions error:', error)
    return NextResponse.json(
      { error: error.message || 'Soru üretme hatası' },
      { status: 500 }
    )
  }
}
