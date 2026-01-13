import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Auth kontrolü
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Sadece admin yapabilir
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    
    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Only admins can perform bulk fixes' }, { status: 403 })
    }
    
    // Database fonksiyonunu çağır
    const { data, error } = await supabase.rpc('bulk_fix_latex')
    
    if (error) {
      console.error('Bulk fix RPC error:', error)
      return NextResponse.json({ error: `Database error: ${error.message}` }, { status: 500 })
    }
    
    // Kalan hata sayısını al
    const { data: remaining } = await supabase.rpc('get_broken_latex_questions', {
      page_limit: 1000,
      page_offset: 0
    })
    
    const remainingCount = remaining?.length || 0
    
    return NextResponse.json({
      success: true,
      message: 'Toplu düzeltme tamamlandı',
      results: data,
      remainingErrors: remainingCount
    })
    
  } catch (error: any) {
    console.error('Bulk fix error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
