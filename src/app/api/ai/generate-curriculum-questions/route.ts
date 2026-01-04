import { NextRequest, NextResponse } from 'next/server'
import { generateCurriculumQuestions, Difficulty, VisualType } from '@/lib/gemini'
import { getQuestionEmbedding } from '@/lib/gemini-embedding'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { grade, subject, topic, learningOutcome, difficulty, count, lang, visualType } = body

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
    
    // Dil kontrolü (varsayılan: tr)
    const language = lang === 'en' ? 'en' : 'tr'
    
    // 🆕 Yeni Nesil Soru: Görsel türü kontrolü
    const validVisualTypes: VisualType[] = ['none', 'table', 'chart', 'flowchart', 'pie', 'diagram', 'mixed']
    const selectedVisualType: VisualType = validVisualTypes.includes(visualType) ? visualType : 'none'
    const isNewGeneration = selectedVisualType !== 'none'

    console.log(`AI Soru Üretimi: ${gradeNum}. Sınıf - ${subject} - ${topic} [${language.toUpperCase()}]${isNewGeneration ? ` 🆕 Yeni Nesil: ${selectedVisualType}` : ''}`)

    const questions = await generateCurriculumQuestions(
      gradeNum,
      subject,
      topic,
      learningOutcome,
      (difficulty as Difficulty) || 'medium',
      questionCount,
      language,  // 🌍 Questly Global için dil desteği
      selectedVisualType  // 🆕 Yeni Nesil Soru görsel türü
    )

    // 🧠 Semantic Search: Her soru için embedding üret
    const questionsWithEmbedding = await Promise.all(
      questions.map(async (q) => {
        try {
          const embedding = await getQuestionEmbedding({
            questionText: q.question_text,
            mainTopic: topic,
            subjectName: subject,
            options: q.options
          })
          console.log(`🧠 Embedding üretildi: ${q.question_text.substring(0, 50)}...`)
          return { ...q, embedding }
        } catch (embError) {
          console.warn(`⚠️ Embedding hatası: ${(embError as Error).message}`)
          return { ...q, embedding: null }
        }
      })
    )

    return NextResponse.json({ 
      success: true,
      questions: questionsWithEmbedding,
      meta: {
        grade: gradeNum,
        subject,
        topic,
        learningOutcome,
        difficulty: difficulty || 'medium',
        count: questionsWithEmbedding.length,
        optionCount: gradeNum >= 9 ? 5 : 4,
        lang: language,
        embeddingsGenerated: questionsWithEmbedding.filter(q => q.embedding).length,
        // 🆕 Yeni Nesil Soru meta bilgileri
        visualType: selectedVisualType,
        isNewGeneration,
        visualQuestionsCount: questionsWithEmbedding.filter(q => q.visual_content).length
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

