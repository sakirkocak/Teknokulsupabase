import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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

    const { publisher_id, amount, reason } = await request.json()

    if (!publisher_id || !amount || amount <= 0) {
      return NextResponse.json({ error: 'Geçerli publisher_id ve amount gerekli' }, { status: 400 })
    }

    // Mevcut bakiyeyi al + güncelle
    const { data: credits } = await supabase
      .from('publisher_credits')
      .select('balance')
      .eq('publisher_id', publisher_id)
      .single()

    if (!credits) {
      // Yoksa oluştur
      const { error } = await supabase
        .from('publisher_credits')
        .insert({ publisher_id, balance: amount })

      if (error) throw error
    } else {
      const { error } = await supabase
        .from('publisher_credits')
        .update({
          balance: credits.balance + amount,
          updated_at: new Date().toISOString(),
        })
        .eq('publisher_id', publisher_id)

      if (error) throw error
    }

    // Geçmişe ekle
    const { error: historyError } = await supabase
      .from('publisher_credit_history')
      .insert({
        publisher_id,
        amount,
        reason: reason || `Admin kredi yüklemesi (${amount} kredi)`,
        created_by: user.id,
      })

    if (historyError) throw historyError

    const newBalance = (credits?.balance || 0) + amount

    return NextResponse.json({ success: true, new_balance: newBalance })
  } catch (error) {
    console.error('Add credits error:', error)
    return NextResponse.json({ error: 'Kredi yükleme hatası' }, { status: 500 })
  }
}
