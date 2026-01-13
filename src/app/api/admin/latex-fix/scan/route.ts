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
    
    // Admin kontrolü
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    
    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    
    const body = await request.json()
    const limit = body.limit || 5000

    // Hata tarama fonksiyonunu çağır
    const { data, error } = await supabase.rpc('scan_latex_errors', { limit_val: limit })
    
    if (error) {
      console.error('Scan errors RPC error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    return NextResponse.json({
      success: true,
      found_errors: data,
      message: `${data} adet yeni hata tespit edildi.`
    })
    
  } catch (error: any) {
    console.error('Scan API error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
