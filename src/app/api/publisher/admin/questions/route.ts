import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { typesenseClient, COLLECTIONS, isTypesenseAvailable } from '@/lib/typesense/client'
import { generateEmbedding, buildEmbeddingText } from '@/lib/publisher-generation'

// GET: Admin tüm publisher_questions listesi
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

    const { data: profile } = await supabase
      .from('profiles').select('role').eq('id', user.id).single()
    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Sadece admin' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = (page - 1) * limit

    let query = supabase
      .from('publisher_questions')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (status) query = query.eq('status', status)

    const { data, count, error } = await query
    if (error) throw error

    return NextResponse.json({ questions: data, total: count, page, limit })
  } catch (error) {
    return NextResponse.json({ error: 'Sorgulama hatası' }, { status: 500 })
  }
}

// POST: publisher_questions'a kaydet + embedding + Typesense
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
    const { question, action } = body

    const status = action === 'approve' ? 'available' : 'pending_review'

    // Embedding üret
    const embeddingText = buildEmbeddingText(
      question, question.subject, question.topic, question.exam_type
    )
    const embedding = await generateEmbedding(embeddingText)

    const insertData = {
      question_text: question.question_text,
      options: question.options,
      correct_answer: question.correct_answer,
      explanation: question.explanation,
      difficulty: question.difficulty,
      bloom_level: question.bloom_level,
      image_url: question.image_url || null,
      image_prompt: question.image_prompt || null,
      image_type: question.image_type !== 'none' ? question.image_type : null,
      subject: question.subject,
      topic: question.topic,
      exam_type: question.exam_type || null,
      learning_outcome: question.learning_outcome || null,
      image_description: question.image_description || null,
      status,
      is_available: action === 'approve',
      verified: question.verified || false,
      price_credits: question.price_credits || 1,
      created_by: user.id,
      embedding_text: embeddingText,
    }

    const { data: saved, error } = await supabase
      .from('publisher_questions')
      .insert(insertData)
      .select()
      .single()

    if (error) throw error

    // Typesense sync (approved olanlar)
    if (action === 'approve' && isTypesenseAvailable()) {
      try {
        const doc: Record<string, unknown> = {
          id: saved.id,
          question_text: saved.question_text,
          subject: saved.subject,
          topic: saved.topic,
          difficulty: saved.difficulty,
          exam_type: saved.exam_type || '',
          image_type: saved.image_type || 'none',
          grade: 0,
          bloom_level: saved.bloom_level || '',
          learning_outcome: saved.learning_outcome || '',
          image_description: saved.image_description || '',
          status: saved.status,
          is_available: saved.is_available,
          verified: saved.verified,
          price_credits: saved.price_credits,
          created_at: Math.floor(new Date(saved.created_at).getTime() / 1000),
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

    return NextResponse.json({ question: saved })
  } catch (error) {
    return NextResponse.json({ error: 'Kaydetme hatası' }, { status: 500 })
  }
}

// PATCH: Soru güncelle/onayla
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

    const { data: profile } = await supabase
      .from('profiles').select('role').eq('id', user.id).single()
    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Sadece admin' }, { status: 403 })
    }

    const { id, updates } = await request.json()

    const { data: updated, error } = await supabase
      .from('publisher_questions')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    // Typesense sync
    if (isTypesenseAvailable() && updated.status === 'available') {
      try {
        await typesenseClient
          .collections(COLLECTIONS.PUBLISHER_QUESTIONS)
          .documents()
          .update({ is_available: updated.is_available, status: updated.status },
            { filter_by: `id:=${id}` } as Record<string, string>)
      } catch { /* non-fatal */ }
    }

    return NextResponse.json({ question: updated })
  } catch (error) {
    return NextResponse.json({ error: 'Güncelleme hatası' }, { status: 500 })
  }
}
