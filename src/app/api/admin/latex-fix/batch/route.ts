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
    const limit = body.limit || 1000
    const offset = body.offset || 0

    // Batch düzeltme fonksiyonunu çağır
    const { data, error } = await supabase.rpc('smart_fix_latex_batch', { 
      limit_val: limit, 
      offset_val: offset 
    })
    
    if (error) {
      console.error('Batch fix RPC error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    return NextResponse.json({
      success: true,
      data
    })
    
  } catch (error: any) {
    console.error('Batch fix API error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
