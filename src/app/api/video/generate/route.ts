/**
 * Video Çözüm Üretim API
 * Soru için video çözüm üretim isteği oluşturur ve işleme başlatır
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 300

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')
const VIDEO_GENERATOR_URL = process.env.VIDEO_GENERATOR_URL || ''
const VIDEO_API_SECRET = process.env.VIDEO_API_SECRET || ''

interface VideoGenerateRequest {
  questionId: string
  priority?: number
  processImmediately?: boolean
}

interface SolutionData {
  steps: { order: number; text: string; math?: string; duration: number }[]
  totalDuration: number
  narrationText: string
}

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

JSON formatında yanıt ver:
{
  "steps": [{"order": 1, "text": "Seslendirme metni", "duration": 5}],
  "totalDuration": 30,
  "narrationText": "Tüm seslendirme metni"
}`

  try {
    const result = await model.generateContent(prompt)
    const responseText = result.response.text()
    const jsonMatch = responseText.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('JSON bulunamadı')
    return JSON.parse(jsonMatch[0]) as SolutionData
  } catch (error) {
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

/**
 * Cloud Run'a video üretim isteği gönder
 */
async function sendToCloudRun(question: any, topic: any): Promise<{ success: boolean; videoUrl?: string; error?: string }> {
  if (!VIDEO_GENERATOR_URL) {
    return { success: false, error: 'VIDEO_GENERATOR_URL tanımlı değil' }
  }
  
  console.log(`🎬 [CLOUD RUN] İstek gönderiliyor: ${question.id}`)
  
  try {
    const response = await fetch(`${VIDEO_GENERATOR_URL}/generate-sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${VIDEO_API_SECRET}`
      },
      body: JSON.stringify({
        question_id: question.id,
        question_text: question.question_text,
        options: question.options,
        correct_answer: question.correct_answer,
        explanation: question.explanation,
        topic_name: topic?.main_topic || 'Soru Çözümü',
        subject_name: topic?.subject?.name || 'Matematik',
        grade: topic?.grade || 8
      })
    })
    
    if (response.ok) {
      const data = await response.json()
      console.log(`✅ [CLOUD RUN] Başarılı: ${data.videoUrl}`)
      return { success: true, videoUrl: data.videoUrl }
    } else {
      const errorText = await response.text()
      console.error(`❌ [CLOUD RUN] Hata: ${response.status} - ${errorText}`)
      return { success: false, error: errorText }
    }
  } catch (error: any) {
    console.error(`❌ [CLOUD RUN] Exception: ${error.message}`)
    return { success: false, error: error.message }
  }
}

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ error: 'Giriş yapmanız gerekiyor' }, { status: 401 })
  }
  
  try {
    const { questionId, priority = 0, processImmediately = true }: VideoGenerateRequest = await request.json()
    
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
        topic:topics(main_topic, grade, subject:subjects(name))
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
        videoUrl: question.video_solution_url
      })
    }
    
    // Zaten işleniyor mu?
    if (question.video_status === 'processing') {
      return NextResponse.json({
        success: true,
        status: 'processing',
        message: 'Video üretimi devam ediyor'
      })
    }
    
    // Queue'ya ekle
    const { data: queueItem } = await supabase
      .from('video_generation_queue')
      .upsert({
        question_id: questionId,
        requested_by: user.id,
        status: 'processing',
        priority: priority,
      }, { onConflict: 'question_id' })
      .select()
      .single()
    
    // Question durumunu güncelle
    await supabase
      .from('questions')
      .update({ video_status: 'processing' })
      .eq('id', questionId)
    
    console.log(`🎬 [VIDEO] İşlem başlıyor: ${questionId}`)
    
    // 🚀 Hemen Cloud Run'a gönder
    if (processImmediately && VIDEO_GENERATOR_URL) {
      const result = await sendToCloudRun(question, question.topic)
      
      if (result.success && result.videoUrl) {
        // Başarılı - güncelle
        await supabase
          .from('questions')
          .update({
            video_status: 'completed',
            video_solution_url: result.videoUrl
          })
          .eq('id', questionId)
        
        await supabase
          .from('video_generation_queue')
          .update({
            status: 'completed',
            completed_at: new Date().toISOString()
          })
          .eq('question_id', questionId)
        
        const duration = Date.now() - startTime
        console.log(`✅ [VIDEO] Tamamlandı: ${questionId} (${duration}ms)`)
        
        return NextResponse.json({
          success: true,
          status: 'completed',
          videoUrl: result.videoUrl,
          duration
        })
      } else {
        // Hata - pending'e al, tekrar denenebilir
        await supabase
          .from('questions')
          .update({ video_status: 'pending' })
          .eq('id', questionId)
        
        await supabase
          .from('video_generation_queue')
          .update({
            status: 'pending',
            error_message: result.error?.slice(0, 500)
          })
          .eq('question_id', questionId)
        
        return NextResponse.json({
          success: false,
          status: 'queued',
          error: result.error,
          message: 'Video kuyruğa eklendi, daha sonra işlenecek'
        })
      }
    }
    
    return NextResponse.json({
      success: true,
      status: 'queued',
      queueId: queueItem?.id,
      message: 'Video üretim kuyruğuna eklendi'
    })
    
  } catch (error: any) {
    console.error('❌ [VIDEO] Hata:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

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
  
  const { data: question } = await supabase
    .from('questions')
    .select('video_status, video_solution_url')
    .eq('id', questionId)
    .single()
  
  return NextResponse.json({
    success: true,
    status: question?.video_status || 'none',
    videoUrl: question?.video_solution_url
  })
}
