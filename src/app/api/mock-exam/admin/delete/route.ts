import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { typesenseClient, isTypesenseAvailable, COLLECTIONS } from '@/lib/typesense/client'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function DELETE(req: NextRequest) {
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

    const { searchParams } = new URL(req.url)
    const examId = searchParams.get('examId')

    if (!examId) {
      return NextResponse.json({ error: 'examId gerekli' }, { status: 400 })
    }

    // Sinavi sil (CASCADE ile sorular ve sonuclar da silinir)
    const { error } = await supabaseAdmin
      .from('mock_exams')
      .delete()
      .eq('id', examId)

    if (error) {
      console.error('Exam delete error:', error)
      return NextResponse.json({ error: 'Sinav silinemedi' }, { status: 500 })
    }

    // Typesense'den sil
    if (isTypesenseAvailable()) {
      try {
        await typesenseClient
          .collections(COLLECTIONS.MOCK_EXAMS)
          .documents(examId)
          .delete()
      } catch (e) {
        console.error('Typesense delete error:', e)
      }

      // Ilgili sonuclari da sil
      try {
        await typesenseClient
          .collections(COLLECTIONS.MOCK_EXAM_RESULTS)
          .documents()
          .delete({ filter_by: `exam_id:=${examId}` } as any)
      } catch (e) {
        console.error('Typesense results delete error:', e)
      }
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Admin delete exam error:', error)
    return NextResponse.json({ error: 'Sinav silinemedi' }, { status: 500 })
  }
}
