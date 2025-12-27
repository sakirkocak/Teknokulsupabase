import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Service role client (RLS bypass)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  try {
    const { duelId, studentId } = await request.json()
    
    if (!duelId || !studentId) {
      return NextResponse.json({ error: 'duelId ve studentId gerekli' }, { status: 400 })
    }

    console.log('✅ Düello kabul ediliyor:', { duelId, studentId })

    // Düelloyu güncelle (status: 'active' kullanıyoruz, DB constraint 'accepted' kabul etmiyor)
    const { data, error } = await supabase
      .from('duels')
      .update({
        status: 'active',
        started_at: new Date().toISOString()
      })
      .eq('id', duelId)
      .eq('opponent_id', studentId) // Sadece davet edilen kişi kabul edebilir
      .select()
      .single()

    if (error) {
      console.error('❌ Düello kabul hatası:', error)
      return NextResponse.json({ error: 'Düello kabul edilemedi', details: error.message }, { status: 500 })
    }

    console.log('✅ Düello kabul edildi:', duelId)
    return NextResponse.json({ success: true, duel: data })
  } catch (error) {
    console.error('Accept duel error:', error)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}

