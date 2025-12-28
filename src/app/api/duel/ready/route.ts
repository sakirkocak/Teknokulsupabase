import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Service role client (RLS bypass)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const { duelId, studentId, ready } = await req.json()

    if (!duelId || !studentId) {
      return NextResponse.json({ error: 'Eksik parametreler' }, { status: 400 })
    }

    // Düello bilgisini al
    const { data: duel, error: duelError } = await supabase
      .from('duels')
      .select('challenger_id, opponent_id, challenger_ready, opponent_ready, status')
      .eq('id', duelId)
      .single()

    if (duelError || !duel) {
      return NextResponse.json({ error: 'Düello bulunamadı' }, { status: 404 })
    }

    // Hangi oyuncu?
    const isChallenger = duel.challenger_id === studentId
    const isOpponent = duel.opponent_id === studentId

    if (!isChallenger && !isOpponent) {
      return NextResponse.json({ error: 'Bu düelloya erişim yetkiniz yok' }, { status: 403 })
    }

    // Ready durumunu güncelle
    const updateField = isChallenger ? 'challenger_ready' : 'opponent_ready'
    
    const { error: updateError } = await supabase
      .from('duels')
      .update({ [updateField]: ready })
      .eq('id', duelId)

    if (updateError) {
      console.error('Ready güncelleme hatası:', updateError)
      return NextResponse.json({ error: 'Güncelleme başarısız' }, { status: 500 })
    }

    // Güncel durumu döndür
    const { data: updatedDuel } = await supabase
      .from('duels')
      .select('challenger_ready, opponent_ready')
      .eq('id', duelId)
      .single()

    const bothReady = updatedDuel?.challenger_ready && updatedDuel?.opponent_ready

    console.log(`Ready güncellendi: ${studentId} -> ${ready}, bothReady: ${bothReady}`)

    return NextResponse.json({
      success: true,
      challengerReady: updatedDuel?.challenger_ready,
      opponentReady: updatedDuel?.opponent_ready,
      bothReady
    })

  } catch (error) {
    console.error('Ready API error:', error)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}

// Ready durumunu kontrol et
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const duelId = searchParams.get('duelId')

    if (!duelId) {
      return NextResponse.json({ error: 'duelId gerekli' }, { status: 400 })
    }

    const { data: duel, error } = await supabase
      .from('duels')
      .select('challenger_ready, opponent_ready, status')
      .eq('id', duelId)
      .single()

    if (error || !duel) {
      return NextResponse.json({ error: 'Düello bulunamadı' }, { status: 404 })
    }

    return NextResponse.json({
      challengerReady: duel.challenger_ready,
      opponentReady: duel.opponent_ready,
      bothReady: duel.challenger_ready && duel.opponent_ready,
      status: duel.status
    })

  } catch (error) {
    console.error('Ready check error:', error)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}

