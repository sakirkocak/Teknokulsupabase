/**
 * Video Çözüm Üretim API
 * Soru için video çözüm üretim isteği oluşturur
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

// Gemini client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

interface VideoGenerateRequest {
  questionId: string
  priority?: number
}

interface SolutionStep {
  order: number
  text: string
  math?: string
  duration: number // saniye
}

interface SolutionData {
  steps: SolutionStep[]
  totalDuration: number
  narrationText: string
}

/**
 * Gemini ile çözüm adımları üret
 */
async function generateSolutionSteps(question: {
  question_text: string
  options: Record<string, string>
  correct_answer: string
  explanation: string | null
}): Promise<SolutionData> {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' })

  const prompt = `Sen bir matematik öğretmenisin. Aşağıdaki soruyu adım adım çöz ve video için uygun formatta JSON döndür.

SORU: ${question.question_text}

ŞIKLAR:
${Object.entries(question.options).map(([k, v]) => `${k}) ${v}`).join('\n')}

DOĞRU CEVAP: ${question.correct_answer}
${question.explanation ? `AÇIKLAMA: ${question.explanation}` : ''}

Lütfen aşağıdaki JSON formatında yanıt ver (sadece JSON, başka bir şey yazma):
{
  "steps": [
    {
      "order": 1,
      "text": "Seslendirme metni (Türkçe, doğal konuşma dili)",
      "math": "LaTeX formatında matematiksel ifade (varsa)",
      "duration": 5
    }
  ],
  "totalDuration": 30,
  "narrationText": "Tüm adımların birleştirilmiş seslendirme metni"
}

KURALLAR:
- Adımlar kısa ve net olsun (her biri 3-8 saniye)
- Toplam süre 30-60 saniye arasında olsun
- Türkçe ve anlaşılır bir dil kullan
- Matematiksel ifadeler LaTeX formatında olsun
- Son adımda doğru cevabı vurgula`

  try {
    const result = await model.generateContent(prompt)
    const responseText = result.response.text()
    
    // JSON parse et
    const jsonMatch = responseText.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('JSON bulunamadı')
    }
    
    const solutionData = JSON.parse(jsonMatch[0]) as SolutionData
    return solutionData
    
  } catch (error) {
    console.error('Gemini çözüm üretme hatası:', error)
    
    // Fallback basit çözüm
    return {
      steps: [
        { order: 1, text: "Soruyu inceleyelim", duration: 3 },
        { order: 2, text: question.explanation || "Çözümü yapalım", duration: 5 },
        { order: 3, text: `Doğru cevap ${question.correct_answer} şıkkıdır`, duration: 3 },
      ],
      totalDuration: 11,
      narrationText: `Soruyu inceleyelim. ${question.explanation || 'Çözümü yapalım'}. Doğru cevap ${question.correct_answer} şıkkıdır.`
    }
  }
}

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  
  // Auth kontrolü
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ 
      error: 'Giriş yapmanız gerekiyor',
      requireAuth: true
    }, { status: 401 })
  }
  
  try {
    const { questionId, priority = 0 }: VideoGenerateRequest = await request.json()
    
    if (!questionId) {
      return NextResponse.json({ error: 'questionId gerekli' }, { status: 400 })
    }
    
    // Soruyu al
    const { data: question, error: questionError } = await supabase
      .from('questions')
      .select(`
        id,
        question_text,
        options,
        correct_answer,
        explanation,
        video_status,
        video_solution_url,
        topic:topics(main_topic, subject:subjects(name))
      `)
      .eq('id', questionId)
      .single()
    
    if (questionError || !question) {
      return NextResponse.json({ error: 'Soru bulunamadı' }, { status: 404 })
    }
    
    // Video zaten varsa
    if (question.video_status === 'completed' && question.video_solution_url) {
      return NextResponse.json({
        success: true,
        status: 'already_exists',
        videoUrl: question.video_solution_url,
        message: 'Video zaten mevcut'
      })
    }
    
    // Queue'da bekliyor mu?
    if (question.video_status === 'pending' || question.video_status === 'processing') {
      return NextResponse.json({
        success: true,
        status: question.video_status,
        message: 'Video üretimi zaten devam ediyor'
      })
    }
    
    // Gemini ile çözüm adımları üret
    console.log(`🎬 [VIDEO] Çözüm adımları üretiliyor: ${questionId}`)
    const solutionData = await generateSolutionSteps({
      question_text: question.question_text,
      options: question.options as Record<string, string>,
      correct_answer: question.correct_answer,
      explanation: question.explanation
    })
    
    // Queue'ya ekle
    const { data: queueItem, error: queueError } = await supabase
      .from('video_generation_queue')
      .upsert({
        question_id: questionId,
        requested_by: user.id,
        status: 'pending',
        priority: priority,
      }, {
        onConflict: 'question_id'
      })
      .select()
      .single()
    
    if (queueError) {
      console.error('Queue ekleme hatası:', queueError)
      return NextResponse.json({ error: 'Queue hatası' }, { status: 500 })
    }
    
    // Question durumunu güncelle
    await supabase
      .from('questions')
      .update({ video_status: 'pending' })
      .eq('id', questionId)
    
    const duration = Date.now() - startTime
    console.log(`✅ [VIDEO] Queue'ya eklendi: ${questionId} (${duration}ms)`)
    
    return NextResponse.json({
      success: true,
      status: 'queued',
      queueId: queueItem?.id,
      solutionData: solutionData,
      estimatedDuration: solutionData.totalDuration,
      message: 'Video üretim kuyruğuna eklendi'
    })
    
  } catch (error: any) {
    console.error('❌ [VIDEO] Hata:', error.message)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

/**
 * GET - Queue durumu
 */
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ error: 'Giriş gerekli' }, { status: 401 })
  }
  
  const { searchParams } = new URL(request.url)
  const questionId = searchParams.get('questionId')
  
  if (!questionId) {
    return NextResponse.json({ error: 'questionId gerekli' }, { status: 400 })
  }
  
  // Queue durumunu al
  const { data: queueItem } = await supabase
    .from('video_generation_queue')
    .select('*')
    .eq('question_id', questionId)
    .single()
  
  // Question durumunu al
  const { data: question } = await supabase
    .from('questions')
    .select('video_status, video_solution_url')
    .eq('id', questionId)
    .single()
  
  return NextResponse.json({
    success: true,
    status: question?.video_status || 'none',
    videoUrl: question?.video_solution_url,
    queueItem: queueItem
  })
}
