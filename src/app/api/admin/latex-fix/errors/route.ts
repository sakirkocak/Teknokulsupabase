import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const type = searchParams.get('type')
    
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
    
    let query = supabase
      .from('latex_errors')
      .select('*, question:questions(id, question_text, explanation)', { count: 'exact' })
      .is('fixed_at', null)
      .order('detected_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1)
      
    if (type) {
      query = query.eq('error_type', type)
    }
    
    const { data, count, error } = await query
    
    if (error) {
      console.error('Fetch errors error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    return NextResponse.json({
      success: true,
      data,
      meta: {
        total: count,
        page,
        limit,
        pages: Math.ceil((count || 0) / limit)
      }
    })
    
  } catch (error: any) {
    console.error('Errors API error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
