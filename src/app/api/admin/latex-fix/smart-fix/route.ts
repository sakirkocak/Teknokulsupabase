import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET - Hata sayılarını getir
export async function GET(request: NextRequest) {
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
    
    // Hata sayılarını getir
    const { data, error } = await supabase.rpc('count_latex_errors')
    
    if (error) {
      console.error('Count errors RPC error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    return NextResponse.json({
      success: true,
      data
    })
    
  } catch (error: any) {
    console.error('Smart fix GET error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST - Akıllı düzeltmeyi çalıştır
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
      return NextResponse.json({ error: 'Only admins can run smart fix' }, { status: 403 })
    }
    
    // Düzeltme öncesi hata sayısı
    const { data: beforeCount } = await supabase.rpc('count_latex_errors')
    
    // Akıllı düzeltmeyi çalıştır
    const { data: fixResult, error: fixError } = await supabase.rpc('smart_fix_latex')
    
    if (fixError) {
      console.error('Smart fix RPC error:', fixError)
      return NextResponse.json({ error: fixError.message }, { status: 500 })
    }
    
    // Düzeltme sonrası hata sayısı
    const { data: afterCount } = await supabase.rpc('count_latex_errors')
    
    return NextResponse.json({
      success: true,
      message: 'Akıllı LaTeX düzeltme tamamlandı',
      before: beforeCount,
      after: afterCount,
      fixed: {
        times: (beforeCount?.times_errors || 0) - (afterCount?.times_errors || 0),
        sqrt: (beforeCount?.sqrt_errors || 0) - (afterCount?.sqrt_errors || 0),
        frac: (beforeCount?.frac_errors || 0) - (afterCount?.frac_errors || 0),
        total: (beforeCount?.total_errors || 0) - (afterCount?.total_errors || 0)
      },
      details: fixResult
    })
    
  } catch (error: any) {
    console.error('Smart fix POST error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
