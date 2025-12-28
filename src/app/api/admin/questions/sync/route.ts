import { NextRequest, NextResponse } from 'next/server'
import Typesense from 'typesense'
import { createClient } from '@supabase/supabase-js'

// Typesense admin client
const typesense = new Typesense.Client({
  nodes: [{
    host: process.env.TYPESENSE_HOST || '',
    port: 443,
    protocol: 'https'
  }],
  apiKey: process.env.TYPESENSE_API_KEY || '',
  connectionTimeoutSeconds: 5
})

// Supabase service role client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * POST /api/admin/questions/sync
 * Yeni eklenen veya güncellenen soruyu Typesense'e senkronize eder
 * Body: { questionId: string, action: 'upsert' | 'delete' }
 */
export async function POST(req: NextRequest) {
  try {
    const { questionId, action = 'upsert' } = await req.json()
    
    if (!questionId) {
      return NextResponse.json({ error: 'questionId gerekli' }, { status: 400 })
    }
    
    // DELETE işlemi
    if (action === 'delete') {
      try {
        await typesense.collections('questions').documents(questionId).delete()
        console.log(`✅ Typesense: Soru silindi - ${questionId}`)
        return NextResponse.json({ success: true, action: 'deleted' })
      } catch (e) {
        // Document bulunamadı - sorun yok
        return NextResponse.json({ success: true, action: 'not_found' })
      }
    }
    
    // UPSERT işlemi - Soru bilgilerini Supabase'den çek
    const { data: question, error: questionError } = await supabase
      .from('questions')
      .select(`
        id,
        topic_id,
        difficulty,
        question_text,
        options,
        correct_answer,
        explanation,
        question_image_url,
        is_active,
        times_answered,
        times_correct,
        created_at
      `)
      .eq('id', questionId)
      .single()
    
    if (questionError || !question) {
      return NextResponse.json({ error: 'Soru bulunamadı' }, { status: 404 })
    }
    
    // Aktif değilse Typesense'den sil
    if (!question.is_active) {
      try {
        await typesense.collections('questions').documents(questionId).delete()
        console.log(`✅ Typesense: Pasif soru silindi - ${questionId}`)
        return NextResponse.json({ success: true, action: 'deleted_inactive' })
      } catch (e) {
        return NextResponse.json({ success: true, action: 'not_found' })
      }
    }
    
    // Topic bilgilerini çek
    const { data: topicData } = await supabase
      .from('topics')
      .select(`
        id,
        main_topic,
        sub_topic,
        grade,
        subject:subjects!inner(id, code, name)
      `)
      .eq('id', question.topic_id)
      .single()
    
    if (!topicData) {
      return NextResponse.json({ error: 'Topic bulunamadı' }, { status: 404 })
    }
    
    // Options JSONB'den şıkları çıkar
    const options = question.options || {}
    
    // Typesense document oluştur
    const document = {
      id: question.id,
      question_id: question.id,
      question_text: question.question_text || '',
      explanation: question.explanation || '',
      option_a: options.A || options.a || '',
      option_b: options.B || options.b || '',
      option_c: options.C || options.c || '',
      option_d: options.D || options.d || '',
      option_e: options.E || options.e || '',
      correct_answer: question.correct_answer || '',
      difficulty: question.difficulty || 'medium',
      subject_id: (topicData.subject as any)?.id || '',
      subject_code: (topicData.subject as any)?.code || '',
      subject_name: (topicData.subject as any)?.name || '',
      topic_id: topicData.id,
      main_topic: topicData.main_topic || '',
      sub_topic: topicData.sub_topic || '',
      grade: topicData.grade || 0,
      has_image: !!question.question_image_url,
      image_url: question.question_image_url || '',
      times_answered: question.times_answered || 0,
      times_correct: question.times_correct || 0,
      success_rate: question.times_answered > 0 
        ? (question.times_correct / question.times_answered) * 100 
        : 0,
      created_at: question.created_at 
        ? new Date(question.created_at).getTime() 
        : Date.now()
    }
    
    // Typesense'e upsert
    await typesense.collections('questions').documents().upsert(document)
    console.log(`✅ Typesense: Soru senkronize edildi - ${questionId}`)
    
    return NextResponse.json({ 
      success: true, 
      action: 'upserted',
      document: {
        id: document.id,
        subject: document.subject_name,
        grade: document.grade,
        topic: document.main_topic
      }
    })
    
  } catch (error) {
    console.error('❌ Typesense sync hatası:', error)
    return NextResponse.json(
      { error: 'Sync hatası', details: (error as Error).message }, 
      { status: 500 }
    )
  }
}

/**
 * Toplu senkronizasyon - Birden fazla soruyu senkronize et
 * Body: { questionIds: string[] }
 */
export async function PUT(req: NextRequest) {
  try {
    const { questionIds } = await req.json()
    
    if (!questionIds || !Array.isArray(questionIds)) {
      return NextResponse.json({ error: 'questionIds array gerekli' }, { status: 400 })
    }
    
    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[]
    }
    
    // Her soru için sync yap
    for (const questionId of questionIds) {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/admin/questions/sync`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ questionId, action: 'upsert' })
        })
        
        if (response.ok) {
          results.success++
        } else {
          results.failed++
          results.errors.push(questionId)
        }
      } catch (e) {
        results.failed++
        results.errors.push(questionId)
      }
    }
    
    return NextResponse.json(results)
    
  } catch (error) {
    console.error('❌ Toplu sync hatası:', error)
    return NextResponse.json(
      { error: 'Toplu sync hatası', details: (error as Error).message }, 
      { status: 500 }
    )
  }
}
