import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { typesenseClient, isTypesenseAvailable, COLLECTIONS } from '@/lib/typesense/client'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    // Admin yetki kontrolu
    const serverClient = await createServerClient()
    const { data: { user } } = await serverClient.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Giris yapmaniz gerekiyor' }, { status: 401 })
    }

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Yetkiniz yok' }, { status: 403 })
    }

    const body = await req.json()
    const {
      title, slug, description, grade, exam_type, duration,
      subjects, is_active, start_date, end_date, seo_title, seo_desc,
    } = body

    if (!title || !slug || !grade || !exam_type || !duration || !subjects) {
      return NextResponse.json({ error: 'Zorunlu alanlar eksik' }, { status: 400 })
    }

    // Slug benzersizlik kontrolu
    const { data: existing } = await supabaseAdmin
      .from('mock_exams')
      .select('id')
      .eq('slug', slug)
      .single()

    if (existing) {
      return NextResponse.json({ error: 'Bu slug zaten kullaniliyor' }, { status: 409 })
    }

    // Toplam soru sayisini hesapla
    const totalQuestions = subjects.reduce((sum: number, s: any) => sum + (s.questionIds?.length || 0), 0)

    // Sinavi olustur
    const { data: exam, error: examError } = await supabaseAdmin
      .from('mock_exams')
      .insert({
        title,
        slug,
        description,
        grade,
        exam_type,
        duration,
        question_count: totalQuestions,
        subjects: subjects.map((s: any) => s.subject),
        is_active: is_active || false,
        start_date,
        end_date,
        seo_title,
        seo_desc,
      })
      .select()
      .single()

    if (examError) {
      console.error('Exam create error:', examError)
      return NextResponse.json({ error: 'Sinav olusturulamadi' }, { status: 500 })
    }

    // Sorulari ekle
    let questionOrder = 1
    const questionsToInsert = []

    for (const subjectGroup of subjects) {
      for (const questionId of subjectGroup.questionIds) {
        questionsToInsert.push({
          exam_id: exam.id,
          question_id: questionId,
          subject: subjectGroup.subject,
          question_order: questionOrder++,
          topic_name: subjectGroup.topicName || null,
        })
      }
    }

    if (questionsToInsert.length > 0) {
      const { error: qError } = await supabaseAdmin
        .from('mock_exam_questions')
        .insert(questionsToInsert)

      if (qError) {
        console.error('Questions insert error:', qError)
        // Sinavi sil (rollback)
        await supabaseAdmin.from('mock_exams').delete().eq('id', exam.id)
        return NextResponse.json({ error: 'Sorular eklenemedi' }, { status: 500 })
      }
    }

    // Typesense sync
    if (isTypesenseAvailable()) {
      try {
        await typesenseClient
          .collections(COLLECTIONS.MOCK_EXAMS)
          .documents()
          .upsert({
            id: exam.id,
            exam_id: exam.id,
            title: exam.title,
            slug: exam.slug,
            description: exam.description || '',
            grade: exam.grade,
            exam_type: exam.exam_type,
            duration: exam.duration,
            question_count: totalQuestions,
            is_active: exam.is_active,
            total_attempts: 0,
            average_score: 0,
            subjects: subjects.map((s: any) => s.subject),
            start_date: start_date ? Math.floor(new Date(start_date).getTime() / 1000) : 0,
            end_date: end_date ? Math.floor(new Date(end_date).getTime() / 1000) : 0,
            created_at: Math.floor(Date.now() / 1000),
          })
      } catch (e) {
        console.error('Typesense sync error:', e)
      }
    }

    return NextResponse.json({ exam, questionCount: questionsToInsert.length })
  } catch (error: any) {
    console.error('Admin create exam error:', error)
    return NextResponse.json({ error: 'Sinav olusturulamadi' }, { status: 500 })
  }
}
