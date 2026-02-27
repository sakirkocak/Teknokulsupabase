import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

    const { data: profile } = await supabase
      .from('profiles')
      .select('role, full_name')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'yayinevi') {
      return NextResponse.json({ error: 'Yetkisiz' }, { status: 403 })
    }

    const { question_ids } = await request.json()
    if (!question_ids || question_ids.length === 0) {
      return NextResponse.json({ error: 'En az bir soru seçin' }, { status: 400 })
    }

    // Sadece bu yayınevinin sahip olduğu sorular
    const { data: questions, error } = await supabase
      .from('publisher_questions')
      .select('*')
      .in('id', question_ids)
      .eq('purchased_by', user.id)
      .order('subject')

    if (error) throw error
    if (!questions || questions.length === 0) {
      return NextResponse.json({ error: 'Soru bulunamadı' }, { status: 404 })
    }

    // Basit HTML → PDF (client'a data döndür, client-side PDF üretir)
    // Gerçek kullanımda jsPDF server-side da çalışır
    return NextResponse.json({
      questions,
      publisher_name: profile.full_name,
      export_date: new Date().toLocaleDateString('tr-TR'),
    })
  } catch (error) {
    console.error('Export error:', error)
    return NextResponse.json({ error: 'Dışa aktarma hatası' }, { status: 500 })
  }
}
