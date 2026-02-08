import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { typesenseClient, isTypesenseAvailable, COLLECTIONS } from '@/lib/typesense/client'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function PUT(req: NextRequest) {
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
    const { examId, ...updates } = body

    if (!examId) {
      return NextResponse.json({ error: 'examId gerekli' }, { status: 400 })
    }

    // Guncelle
    const updateData: any = {}
    if (updates.title !== undefined) updateData.title = updates.title
    if (updates.description !== undefined) updateData.description = updates.description
    if (updates.is_active !== undefined) updateData.is_active = updates.is_active
    if (updates.duration !== undefined) updateData.duration = updates.duration
    if (updates.start_date !== undefined) updateData.start_date = updates.start_date
    if (updates.end_date !== undefined) updateData.end_date = updates.end_date
    if (updates.seo_title !== undefined) updateData.seo_title = updates.seo_title
    if (updates.seo_desc !== undefined) updateData.seo_desc = updates.seo_desc
    updateData.updated_at = new Date().toISOString()

    const { data: exam, error } = await supabaseAdmin
      .from('mock_exams')
      .update(updateData)
      .eq('id', examId)
      .select()
      .single()

    if (error) {
      console.error('Exam update error:', error)
      return NextResponse.json({ error: 'Sinav guncellenemedi' }, { status: 500 })
    }

    // Typesense sync
    if (isTypesenseAvailable()) {
      try {
        const tsUpdate: any = {}
        if (updates.title) tsUpdate.title = updates.title
        if (updates.description !== undefined) tsUpdate.description = updates.description || ''
        if (updates.is_active !== undefined) tsUpdate.is_active = updates.is_active
        if (updates.duration) tsUpdate.duration = updates.duration

        await typesenseClient
          .collections(COLLECTIONS.MOCK_EXAMS)
          .documents()
          .update(examId, tsUpdate)
      } catch (e) {
        console.error('Typesense sync error:', e)
      }
    }

    return NextResponse.json({ exam })
  } catch (error: any) {
    console.error('Admin update exam error:', error)
    return NextResponse.json({ error: 'Sinav guncellenemedi' }, { status: 500 })
  }
}
