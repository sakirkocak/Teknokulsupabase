import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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
    
    // İstatistikleri topla
    const [
      { count: totalErrors },
      { count: sqrtErrors },
      { count: fracErrors },
      { count: timesErrors }
    ] = await Promise.all([
      supabase.from('latex_errors').select('*', { count: 'exact', head: true }).is('fixed_at', null),
      supabase.from('latex_errors').select('*', { count: 'exact', head: true }).is('fixed_at', null).eq('error_type', 'sqrt_no_backslash'),
      supabase.from('latex_errors').select('*', { count: 'exact', head: true }).is('fixed_at', null).eq('error_type', 'frac_no_backslash'),
      supabase.from('latex_errors').select('*', { count: 'exact', head: true }).is('fixed_at', null).eq('error_type', 'times_no_backslash')
    ])
    
    // Toplam soru sayısı
    const { count: totalQuestions } = await supabase.from('questions').select('*', { count: 'exact', head: true })
    
    return NextResponse.json({
      success: true,
      stats: {
        total_questions: totalQuestions || 0,
        total_errors: totalErrors || 0,
        by_type: {
          sqrt: sqrtErrors || 0,
          frac: fracErrors || 0,
          times: timesErrors || 0
        }
      }
    })
    
  } catch (error: any) {
    console.error('Stats API error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
