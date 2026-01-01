/**
 * Soru Bankası Silme API
 * DELETE /api/question-bank/delete
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { deleteBank } from '@/lib/typesense-banks'

export async function DELETE(request: NextRequest) {
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
    const { id, deleteAll } = body
    
    if (deleteAll) {
      // Tüm bankaları al (Typesense'den silmek için)
      const { data: allBanks } = await supabase
        .from('question_banks')
        .select('id, slug')
      
      // Supabase'den sil
      const { error } = await supabase
        .from('question_banks')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000')
      
      if (error) {
        console.error('Delete all error:', error)
        return NextResponse.json({ error: 'Silme hatası' }, { status: 500 })
      }
      
      // Typesense'den sil
      if (allBanks) {
        for (const bank of allBanks) {
          await deleteBank(bank.id).catch(console.error)
        }
      }
      
      // Storage'dan PDF'leri sil
      if (allBanks && allBanks.length > 0) {
        const filesToDelete = allBanks.map(b => `${b.slug}.pdf`)
        await supabase.storage
          .from('question-bank-pdfs')
          .remove(filesToDelete)
          .catch(console.error)
      }
      
      return NextResponse.json({
        success: true,
        deleted: allBanks?.length || 0
      })
    }
    
    if (!id) {
      return NextResponse.json({ error: 'ID gerekli' }, { status: 400 })
    }
    
    // Önce slug'ı al (Storage'dan silmek için)
    const { data: bank } = await supabase
      .from('question_banks')
      .select('slug')
      .eq('id', id)
      .single()
    
    // Supabase'den sil
    const { error } = await supabase
      .from('question_banks')
      .delete()
      .eq('id', id)
    
    if (error) {
      console.error('Delete error:', error)
      return NextResponse.json({ error: 'Silme hatası' }, { status: 500 })
    }
    
    // Typesense'den sil
    await deleteBank(id).catch(console.error)
    
    // Storage'dan PDF'i sil
    if (bank?.slug) {
      await supabase.storage
        .from('question-bank-pdfs')
        .remove([`${bank.slug}.pdf`])
        .catch(console.error)
    }
    
    return NextResponse.json({ success: true })
    
  } catch (error: any) {
    console.error('Delete error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
