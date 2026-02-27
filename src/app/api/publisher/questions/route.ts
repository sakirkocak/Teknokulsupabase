import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET: Müsait soruları listele/filtrele (sadece is_available: true)
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || !['yayinevi', 'admin'].includes(profile.role)) {
      return NextResponse.json({ error: 'Yetkisiz' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const subject = searchParams.get('subject')
    const difficulty = searchParams.get('difficulty')
    const examType = searchParams.get('exam_type')
    const imageType = searchParams.get('image_type')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = (page - 1) * limit

    let query = supabase
      .from('publisher_questions')
      .select('id, question_text, subject, topic, difficulty, exam_type, image_type, grade, bloom_level, price_credits, created_at', { count: 'exact' })
      .eq('is_available', true)
      .eq('status', 'available')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (subject) query = query.eq('subject', subject)
    if (difficulty) query = query.eq('difficulty', difficulty)
    if (examType) query = query.eq('exam_type', examType)
    if (imageType) query = query.eq('image_type', imageType)

    const { data, count, error } = await query
    if (error) throw error

    return NextResponse.json({ questions: data, total: count, page, limit })
  } catch (error) {
    console.error('Publisher questions list error:', error)
    return NextResponse.json({ error: 'Sorgulama hatası' }, { status: 500 })
  }
}
