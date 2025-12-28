import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Service role client (RLS bypass)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * POST /api/lobby/request
 * Düello isteği gönderme
 * 
 * Not: Bu endpoint düello isteğinin DB'ye kaydını tutar.
 * Realtime broadcast client tarafında yapılır.
 */
export async function POST(req: NextRequest) {
  try {
    const { challengerId, opponentId, subject } = await req.json()

    if (!challengerId || !opponentId) {
      return NextResponse.json({ error: 'Eksik parametreler' }, { status: 400 })
    }

    // Her iki oyuncunun da lobide olduğunu kontrol et
    const { data: challenger } = await supabase
      .from('duel_lobby')
      .select('id, status')
      .eq('student_id', challengerId)
      .single()

    if (!challenger) {
      return NextResponse.json({ error: 'Lobide değilsiniz' }, { status: 400 })
    }

    const { data: opponent } = await supabase
      .from('duel_lobby')
      .select('id, status')
      .eq('student_id', opponentId)
      .single()

    if (!opponent) {
      return NextResponse.json({ error: 'Rakip lobiden çıkmış' }, { status: 400 })
    }

    if (opponent.status !== 'available') {
      return NextResponse.json({ error: 'Rakip şu an müsait değil' }, { status: 400 })
    }

    // Her iki tarafın durumunu "busy" yap
    await supabase
      .from('duel_lobby')
      .update({ status: 'busy' })
      .eq('student_id', challengerId)

    await supabase
      .from('duel_lobby')
      .update({ status: 'busy' })
      .eq('student_id', opponentId)

    return NextResponse.json({
      success: true,
      message: 'İstek gönderildi'
    })

  } catch (error) {
    console.error('Lobby request error:', error)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}

/**
 * DELETE /api/lobby/request
 * Düello isteğini iptal et (timeout veya cancel)
 */
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const challengerId = searchParams.get('challengerId')
    const opponentId = searchParams.get('opponentId')

    if (!challengerId || !opponentId) {
      return NextResponse.json({ error: 'Eksik parametreler' }, { status: 400 })
    }

    // Her iki tarafın durumunu "available" yap
    await supabase
      .from('duel_lobby')
      .update({ status: 'available' })
      .in('student_id', [challengerId, opponentId])

    return NextResponse.json({
      success: true,
      message: 'İstek iptal edildi'
    })

  } catch (error) {
    console.error('Lobby request cancel error:', error)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}
