/**
 * Soru Bankası Güncelleme API
 * PUT /api/question-bank/update
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { upsertBank } from '@/lib/typesense-banks'
import { generateSlug } from '@/lib/question-bank/parser'

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    // Admin kontrolü
    if (!user) {
      return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 })
    }
    
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    
    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin yetkisi gerekli' }, { status: 403 })
    }
    
    const body = await request.json()
    const { id, title } = body
    
    if (!id || !title) {
      return NextResponse.json({ error: 'ID ve başlık gerekli' }, { status: 400 })
    }
    
    // Mevcut bankayı al
    const { data: existingBank } = await supabase
      .from('question_banks')
      .select('*')
      .eq('id', id)
      .single()
    
    if (!existingBank) {
      return NextResponse.json({ error: 'Soru bankası bulunamadı' }, { status: 404 })
    }
    
    // Yeni slug oluştur
    const newSlug = generateSlug(title, existingBank.question_count)
    
    // Güncelle
    const { data: updatedBank, error } = await supabase
      .from('question_banks')
      .update({ 
        title, 
        slug: newSlug,
        meta_title: title.slice(0, 70)
      })
      .eq('id', id)
      .select()
      .single()
    
    if (error) {
      console.error('Update error:', error)
      return NextResponse.json({ error: 'Güncelleme hatası' }, { status: 500 })
    }
    
    // Typesense'i güncelle
    await upsertBank({
      id: updatedBank.id,
      title: updatedBank.title,
      slug: updatedBank.slug,
      subject_name: updatedBank.subject_name || undefined,
      grade: updatedBank.grade || undefined,
      question_count: updatedBank.question_count,
      download_count: updatedBank.download_count || 0,
      created_at: new Date(updatedBank.created_at).getTime()
    })
    
    return NextResponse.json({
      success: true,
      bank: updatedBank
    })
    
  } catch (error: any) {
    console.error('Update error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
