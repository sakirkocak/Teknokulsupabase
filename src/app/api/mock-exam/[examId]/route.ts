import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'

// Service role client - RLS bypass (soru cevap anahtarlarini cekmek icin)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ examId: string }> }
) {
  try {
    const { examId } = await params

    // Sinav bilgisini al
    const { data: exam, error: examError } = await supabaseAdmin
      .from('mock_exams')
      .select('*')
      .eq('id', examId)
      .single()

    if (examError || !exam) {
      return NextResponse.json({ error: 'Sinav bulunamadi' }, { status: 404 })
    }

    // Aktiflik kontrolu
    if (!exam.is_active) {
      return NextResponse.json({ error: 'Bu sinav henuz aktif degil' }, { status: 403 })
    }

    // Sinav sorularini al (question_order'a gore sirali)
    const { data: examQuestions, error: questionsError } = await supabaseAdmin
      .from('mock_exam_questions')
      .select('id, exam_id, question_id, subject, question_order, topic_name')
      .eq('exam_id', examId)
      .order('question_order', { ascending: true })

    if (questionsError) {
      console.error('Exam questions error:', questionsError)
      return NextResponse.json({ error: 'Sorular yuklenemedi' }, { status: 500 })
    }

    if (!examQuestions || examQuestions.length === 0) {
      return NextResponse.json({ error: 'Sinavda soru bulunamadi' }, { status: 404 })
    }

    // Asil soru detaylarini al (correct_answer HARIC!)
    const questionIds = examQuestions.map(eq => eq.question_id)
    const { data: questions, error: qError } = await supabaseAdmin
      .from('questions')
      .select('id, question_text, question_image_url, options, visual_type, visual_content')
      .in('id', questionIds)

    if (qError) {
      console.error('Questions detail error:', qError)
      return NextResponse.json({ error: 'Soru detaylari yuklenemedi' }, { status: 500 })
    }

    // Soru map'i olustur
    const questionMap = new Map(questions?.map(q => [q.id, q]) || [])

    // Client icin soru listesi (correct_answer YOK!)
    const clientQuestions = examQuestions.map(eq => {
      const q = questionMap.get(eq.question_id)
      return {
        id: eq.id,
        question_id: eq.question_id,
        question_order: eq.question_order,
        subject: eq.subject,
        topic_name: eq.topic_name,
        question_text: q?.question_text || '',
        question_image_url: q?.question_image_url || null,
        visual_type: q?.visual_type || null,
        visual_content: q?.visual_content || null,
        options: q?.options || { A: '', B: '', C: '', D: '' },
      }
    })

    // Ders bazli gruplama
    const subjectGroups: Record<string, typeof clientQuestions> = {}
    for (const q of clientQuestions) {
      if (!subjectGroups[q.subject]) {
        subjectGroups[q.subject] = []
      }
      subjectGroups[q.subject].push(q)
    }

    // Kullanicinin onceki sonucunu kontrol et
    let userPreviousResult = null
    try {
      const serverClient = await createServerClient()
      const { data: { user } } = await serverClient.auth.getUser()
      if (user) {
        const { data: prevResult } = await supabaseAdmin
          .from('mock_exam_results')
          .select('id, score, completed_at')
          .eq('exam_id', examId)
          .eq('user_id', user.id)
          .order('completed_at', { ascending: false })
          .limit(1)
          .single()

        if (prevResult) {
          userPreviousResult = {
            resultId: prevResult.id,
            score: prevResult.score,
            completedAt: prevResult.completed_at,
          }
        }
      }
    } catch {
      // Giris yapilmamis, onceki sonuc yok
    }

    return NextResponse.json({
      exam,
      questions: clientQuestions,
      subjectGroups,
      userPreviousResult,
    })
  } catch (error: any) {
    console.error('Mock exam detail error:', error)
    return NextResponse.json({ error: 'Sinav yuklenemedi' }, { status: 500 })
  }
}
