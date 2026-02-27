import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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

    if (profile?.role !== 'yayinevi') {
      return NextResponse.json({ error: 'Yetkisiz' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const subject = searchParams.get('subject')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = (page - 1) * limit

    let query = supabase
      .from('publisher_questions')
      .select('*', { count: 'exact' })
      .eq('purchased_by', user.id)
      .order('updated_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (subject) query = query.eq('subject', subject)

    const { data, count, error } = await query
    if (error) throw error

    return NextResponse.json({ questions: data, total: count, page, limit })
  } catch (error) {
    console.error('Purchases list error:', error)
    return NextResponse.json({ error: 'Sorgulama hatası' }, { status: 500 })
  }
}
