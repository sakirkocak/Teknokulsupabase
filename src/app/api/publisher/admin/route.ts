import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET: Tüm yayınevlerini listele
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

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Sadece admin' }, { status: 403 })
    }

    const { data: publishers, error } = await supabase
      .from('profiles')
      .select(`
        id,
        full_name,
        email,
        created_at,
        publisher_credits (balance, updated_at)
      `)
      .eq('role', 'yayinevi')
      .order('created_at', { ascending: false })

    if (error) throw error

    // Her yayınevi için satın aldığı soru sayısı
    const publisherIds = publishers?.map(p => p.id) || []
    let purchaseCounts: Record<string, number> = {}

    if (publisherIds.length > 0) {
      const { data: purchases } = await supabase
        .from('publisher_questions')
        .select('purchased_by')
        .in('purchased_by', publisherIds)

      purchaseCounts = (purchases || []).reduce((acc: Record<string, number>, q) => {
        if (q.purchased_by) {
          acc[q.purchased_by] = (acc[q.purchased_by] || 0) + 1
        }
        return acc
      }, {})
    }

    const result = publishers?.map(p => ({
      ...p,
      balance: (p.publisher_credits as unknown as { balance: number }[])?.[0]?.balance || 0,
      purchased_count: purchaseCounts[p.id] || 0,
    }))

    return NextResponse.json({ publishers: result })
  } catch (error) {
    console.error('Admin list publishers error:', error)
    return NextResponse.json({ error: 'Sorgulama hatası' }, { status: 500 })
  }
}

// POST: Yeni yayınevi hesabı oluştur
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Sadece admin' }, { status: 403 })
    }

    const { full_name, email, password, initial_credits } = await request.json()

    if (!full_name || !email || !password) {
      return NextResponse.json({ error: 'İsim, e-posta ve şifre zorunlu' }, { status: 400 })
    }

    // Supabase Admin API ile kullanıcı oluştur
    const { createAdminClient } = await import('@/lib/supabase/server')
    const adminClient = createAdminClient()

    const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })

    if (createError) throw createError

    // Profile kaydet
    const { error: profileError } = await adminClient
      .from('profiles')
      .insert({
        id: newUser.user.id,
        email,
        full_name,
        role: 'yayinevi',
        is_active: true,
      })

    if (profileError) throw profileError

    // Kredi kaydı oluştur
    const { error: creditsError } = await adminClient
      .from('publisher_credits')
      .insert({
        publisher_id: newUser.user.id,
        balance: initial_credits || 0,
      })

    if (creditsError) throw creditsError

    // İlk kredi yüklemesi varsa geçmişe ekle
    if (initial_credits && initial_credits > 0) {
      await adminClient.from('publisher_credit_history').insert({
        publisher_id: newUser.user.id,
        amount: initial_credits,
        reason: 'Hesap açılış kredisi',
        created_by: user.id,
      })
    }

    return NextResponse.json({
      publisher: {
        id: newUser.user.id,
        full_name,
        email,
        balance: initial_credits || 0,
      }
    })
  } catch (error) {
    console.error('Admin create publisher error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Oluşturma hatası' },
      { status: 500 }
    )
  }
}
