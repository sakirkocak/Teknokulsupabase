import { NextRequest, NextResponse } from 'next/server'
import { generateQuestions, QuestionType, Difficulty } from '@/lib/gemini'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { subject, topic, questionTypes, difficulty, count } = body

    if (!subject || !topic || !questionTypes || questionTypes.length === 0) {
      return NextResponse.json(
        { error: 'Ders, konu ve soru tipi gerekli' },
        { status: 400 }
      )
    }

    const questions = await generateQuestions(
      subject,
      topic,
      questionTypes as QuestionType[],
      difficulty as Difficulty,
      count || 5
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


