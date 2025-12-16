import { NextRequest, NextResponse } from 'next/server'
import { generateCurriculumQuestions, Difficulty } from '@/lib/gemini'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { grade, subject, topic, learningOutcome, difficulty, count } = body

    // Validasyon
    if (!grade || !subject || !topic || !learningOutcome) {
      return NextResponse.json(
        { error: 'Sınıf, ders, konu ve kazanım alanları zorunludur' },
        { status: 400 }
      )
    }

    // Sınıf kontrolü
    const gradeNum = parseInt(grade)
    if (isNaN(gradeNum) || gradeNum < 1 || gradeNum > 12) {
      return NextResponse.json(
        { error: 'Sınıf 1-12 arasında olmalıdır' },
        { status: 400 }
      )
    }

    // Zorluk kontrolü
    const validDifficulties: Difficulty[] = ['easy', 'medium', 'hard', 'legendary']
    if (difficulty && !validDifficulties.includes(difficulty)) {
      return NextResponse.json(
        { error: 'Geçersiz zorluk seviyesi' },
        { status: 400 }
      )
    }

    // Soru sayısı kontrolü
    const questionCount = count ? Math.min(Math.max(parseInt(count), 1), 20) : 5

    console.log(`AI Soru Üretimi: ${gradeNum}. Sınıf - ${subject} - ${topic}`)

    const questions = await generateCurriculumQuestions(
      gradeNum,
      subject,
      topic,
      learningOutcome,
      (difficulty as Difficulty) || 'medium',
      questionCount
    )

    return NextResponse.json({ 
      success: true,
      questions,
      meta: {
        grade: gradeNum,
        subject,
        topic,
        learningOutcome,
        difficulty: difficulty || 'medium',
        count: questions.length,
        optionCount: gradeNum >= 9 ? 5 : 4
      }
    })
  } catch (error: any) {
    console.error('Generate curriculum questions error:', error)
    return NextResponse.json(
      { error: error.message || 'Soru üretme hatası oluştu' },
      { status: 500 }
    )
  }
}

