/**
 * TeknoÖğretmen Chat API
 * POST /api/tekno-teacher/chat
 * 
 * Öğrenciyle sohbet, soru analizi, konu anlatımı
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { 
  checkAndUseCredit, 
  buildTeacherContext, 
  saveAIFeedback,
  updateWeakness 
} from '@/lib/tekno-teacher'
import { 
  analyzeError, 
  generateDailySummary, 
  explainTopic, 
  chat,
  generatePodcastScript,
  TeacherPersonality,
  QuestionContext
} from '@/lib/tekno-teacher-ai'

export const maxDuration = 30

type ChatAction = 'chat' | 'analyze_error' | 'daily_summary' | 'explain_topic' | 'generate_podcast'

interface ChatRequest {
  action: ChatAction
  message?: string
  personality?: TeacherPersonality
  question?: QuestionContext
  topic?: {
    subject: string
    topic: string
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Kullanıcı kontrolü
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json(
        { error: 'Giriş yapmanız gerekiyor' },
        { status: 401 }
      )
    }
    
    // Kredi kontrolü
    const creditStatus = await checkAndUseCredit(user.id)
    
    if (!creditStatus.allowed) {
      return NextResponse.json({
        error: 'Günlük krediniz bitti',
        remaining: 0,
        is_premium: false,
        upgrade_required: true
      }, { status: 429 })
    }
    
    // Request body
    const body: ChatRequest = await request.json()
    const { action, message, personality = 'friendly', question, topic } = body
    
    // Öğrenci bağlamını oluştur
    const context = await buildTeacherContext(user.id)
    
    let response: string
    let feedbackType: 'text' | 'audio' = 'text'
    
    switch (action) {
      case 'analyze_error':
        if (!question) {
          return NextResponse.json(
            { error: 'Soru bilgisi gerekli' },
            { status: 400 }
          )
        }
        
        // Zayıf konuyu güncelle
        await updateWeakness(user.id, question.subject, question.topic)
        
        response = await analyzeError(context, question, personality)
        break
        
      case 'daily_summary':
        response = await generateDailySummary(context, personality)
        break
        
      case 'explain_topic':
        if (!topic) {
          return NextResponse.json(
            { error: 'Konu bilgisi gerekli' },
            { status: 400 }
          )
        }
        response = await explainTopic(context, topic.subject, topic.topic, personality)
        break
        
      case 'generate_podcast':
        response = await generatePodcastScript(context, topic)
        feedbackType = 'text' // İleride 'audio' olacak
        break
        
      case 'chat':
      default:
        if (!message) {
          return NextResponse.json(
            { error: 'Mesaj gerekli' },
            { status: 400 }
          )
        }
        response = await chat(context, message, personality)
        break
    }
    
    // Geri bildirimi kaydet
    await saveAIFeedback({
      user_id: user.id,
      feedback_type: feedbackType,
      text_content: response,
      topic_context: {
        action,
        subject: topic?.subject || question?.subject,
        topic: topic?.topic || question?.topic,
        message: message?.slice(0, 200)
      },
      is_premium: creditStatus.is_premium,
      credits_used: 1
    })
    
    return NextResponse.json({
      success: true,
      response,
      credits: {
        remaining: creditStatus.remaining,
        is_premium: creditStatus.is_premium
      },
      student_name: context.student_name
    })
    
  } catch (error: any) {
    console.error('TeknoÖğretmen error:', error)
    return NextResponse.json(
      { error: error.message || 'Bir hata oluştu' },
      { status: 500 }
    )
  }
}
