import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'yayinevi') {
      return NextResponse.json({ error: 'Yetkisiz' }, { status: 403 })
    }

    const [creditsResult, historyResult] = await Promise.all([
      supabase
        .from('publisher_credits')
        .select('balance, updated_at')
        .eq('publisher_id', user.id)
        .single(),
      supabase
        .from('publisher_credit_history')
        .select('*')
        .eq('publisher_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20),
    ])

    return NextResponse.json({
      balance: creditsResult.data?.balance || 0,
      history: historyResult.data || [],
    })
  } catch (error) {
    console.error('Credits GET error:', error)
    return NextResponse.json({ error: 'Sorgulama hatası' }, { status: 500 })
  }
}
