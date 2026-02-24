/**
 * Admin: Exam Questions Typesense Backfill
 *
 * Supabase'de exam_topic_id ile kaydedilmiş (topic_id=null) TYT/AYT sorularını
 * Typesense'e sync eder. Webhook kaynaklı eksiklikleri tek seferde kapatır.
 *
 * POST /api/admin/sync-exam-questions
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { typesenseClient, isTypesenseAvailable, COLLECTIONS } from '@/lib/typesense/client'
import { createClient as createServerClient } from '@/lib/supabase/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  // Admin yetki kontrolü
  const serverClient = await createServerClient()
  const { data: { user } } = await serverClient.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Giriş yapmanız gerekiyor' }, { status: 401 })
  }
  const { data: profile } = await supabaseAdmin
    .from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Yetkiniz yok' }, { status: 403 })
  }

  if (!isTypesenseAvailable()) {
    return NextResponse.json({ error: 'Typesense bağlantısı yok' }, { status: 503 })
  }

  // Sync edilmemiş tüm soruları çek (exam_topic_id var, topic_id null)
  const { data: questions, error } = await supabaseAdmin
    .from('questions')
    .select(`
      id, question_text, difficulty, exam_types, visual_type,
      times_answered, times_correct, created_at, is_active, lang,
      exam_topic_id,
      exam_topic:exam_topics!questions_exam_topic_id_fkey(
        subject_code, subject_name, main_topic, sub_topic, grades
      )
    `)
    .is('topic_id', null)
    .not('exam_topic_id', 'is', null)
    .eq('is_active', true)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!questions || questions.length === 0) {
    return NextResponse.json({ ok: true, synced: 0, message: 'Sync edilecek soru yok' })
  }

  let synced = 0
  let failed = 0
  const errors: string[] = []

  // Batch upsert - Typesense 50'şer grupla
  const BATCH = 50
  for (let i = 0; i < questions.length; i += BATCH) {
    const batch = questions.slice(i, i + BATCH)
    const docs = batch.map((q: any) => {
      const et = q.exam_topic
      if (!et) return null

      const grades: number[] = et.grades || [12]
      const grade = grades[grades.length - 1]
      const timesAnswered = q.times_answered || 0
      const timesCorrect = q.times_correct || 0

      return {
        id: q.id,
        question_id: q.id,
        topic_id: q.exam_topic_id,       // exam_topic_id'yi topic_id olarak kullan
        question_text: q.question_text || '',
        difficulty: q.difficulty || 'medium',
        subject_code: et.subject_code || 'unknown',
        subject_name: et.subject_name || 'Bilinmeyen',
        main_topic: et.main_topic || '',
        sub_topic: et.sub_topic || '',
        grade,
        has_image: false,
        lang: q.lang || 'tr',
        is_new_generation: !!(q.visual_type && q.visual_type !== 'none'),
        visual_type: q.visual_type || '',
        exam_types: Array.isArray(q.exam_types) ? q.exam_types : [],
        times_answered: timesAnswered,
        times_correct: timesCorrect,
        success_rate: timesAnswered > 0
          ? Math.round((timesCorrect / timesAnswered) * 10000) / 100
          : 0,
        created_at: q.created_at ? new Date(q.created_at).getTime() : Date.now(),
      }
    }).filter(Boolean)

    try {
      await typesenseClient
        .collections(COLLECTIONS.QUESTIONS)
        .documents()
        .import(docs as any[], { action: 'upsert' })
      synced += docs.length
    } catch (err: any) {
      failed += docs.length
      errors.push(`Batch ${i}-${i + BATCH}: ${err.message}`)
    }
  }

  return NextResponse.json({
    ok: true,
    total: questions.length,
    synced,
    failed,
    ...(errors.length ? { errors } : {}),
  })
}
