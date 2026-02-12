import { NextRequest, NextResponse } from 'next/server'
import Typesense from 'typesense'
import { createClient } from '@supabase/supabase-js'
import { getQuestionEmbedding } from '@/lib/gemini-embedding'

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
    const { questionId, action = 'upsert', embedding: providedEmbedding } = await req.json()
    
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
        created_at,
        visual_type,
        visual_content,
        video_status,
        interactive_solution_status,
        exam_types
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
    
    // 🧠 Semantic Search: Embedding üret veya kullan
    let embedding: number[] | null = null
    
    // Eğer dışarıdan embedding geldiyse onu kullan
    if (providedEmbedding && Array.isArray(providedEmbedding) && providedEmbedding.length === 768) {
      embedding = providedEmbedding
      console.log(`🧠 Embedding (provided): ${questionId}`)
    } else {
      // Yoksa yeni üret
      try {
        embedding = await getQuestionEmbedding({
          questionText: question.question_text || '',
          mainTopic: topicData.main_topic,
          subTopic: topicData.sub_topic,
          subjectName: (topicData.subject as any)?.name,
          options: {
            A: options.A || options.a || '',
            B: options.B || options.b || '',
            C: options.C || options.c || '',
            D: options.D || options.d || '',
            E: options.E || options.e || ''
          }
        })
        console.log(`🧠 Embedding (generated): ${questionId}`)
      } catch (embError) {
        console.warn(`⚠️ Embedding hatası: ${(embError as Error).message}`)
      }
    }

    // Typesense document oluştur
    const document: Record<string, any> = {
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
      // 🆕 Yeni Nesil Soru
      is_new_generation: !!(question as any).visual_content,
      visual_type: (question as any).visual_type || '',
      // 📋 Sınav türü etiketleme
      exam_types: Array.isArray((question as any).exam_types) ? (question as any).exam_types : [],
      // 🎬 Video ve İnteraktif Çözüm durumu
      has_video: (question as any).video_status === 'completed',
      has_interactive: (question as any).interactive_solution_status === 'completed',
      // İstatistikler
      times_answered: question.times_answered || 0,
      times_correct: question.times_correct || 0,
      success_rate: question.times_answered > 0 
        ? (question.times_correct / question.times_answered) * 100 
        : 0,
      created_at: question.created_at 
        ? new Date(question.created_at).getTime() 
        : Date.now()
    }
    
    // Embedding varsa ekle
    if (embedding && embedding.length === 768) {
      document.embedding = embedding
    }
    
    // Typesense'e upsert
    await typesense.collections('questions').documents().upsert(document)
    console.log(`✅ Typesense: Soru senkronize edildi - ${questionId} ${embedding ? '(with embedding)' : ''}`)
    
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
