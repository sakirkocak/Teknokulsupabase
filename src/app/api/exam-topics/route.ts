import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/exam-topics?exam_type=TYT&subject_code=matematik
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const examType = searchParams.get('exam_type')
    const subjectCode = searchParams.get('subject_code')

    if (!examType) {
      return NextResponse.json(
        { error: 'exam_type parametresi zorunlu' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    let query = supabase
      .from('exam_topics')
      .select('*')
      .eq('exam_type', examType.toUpperCase())
      .eq('is_active', true)
      .order('subject_code')
      .order('topic_order')

    if (subjectCode) {
      query = query.eq('subject_code', subjectCode)
    }

    const { data, error } = await query

    if (error) {
      console.error('exam_topics sorgu hatası:', error)
      return NextResponse.json(
        { error: 'Konular yüklenemedi' },
        { status: 500 }
      )
    }

    // Derslere göre grupla
    const grouped: Record<string, {
      subject_code: string
      subject_name: string
      topics: typeof data
    }> = {}

    for (const topic of data || []) {
      if (!grouped[topic.subject_code]) {
        grouped[topic.subject_code] = {
          subject_code: topic.subject_code,
          subject_name: topic.subject_name,
          topics: []
        }
      }
      grouped[topic.subject_code].topics.push(topic)
    }

    return NextResponse.json({
      exam_type: examType.toUpperCase(),
      total_topics: data?.length || 0,
      subjects: Object.values(grouped),
      topics: data || []
    })
  } catch (error) {
    console.error('exam-topics API hatası:', error)
    return NextResponse.json(
      { error: 'Sunucu hatası' },
      { status: 500 }
    )
  }
}
