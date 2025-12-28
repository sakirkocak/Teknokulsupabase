import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Service role client (RLS bypass)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * POST /api/lobby/respond
 * Düello isteğine cevap verme
 */
export async function POST(req: NextRequest) {
  try {
    const { challengerId, opponentId, accepted, subject } = await req.json()

    if (!challengerId || !opponentId || accepted === undefined) {
      return NextResponse.json({ error: 'Eksik parametreler' }, { status: 400 })
    }

    if (!accepted) {
      // Reddedildi - her iki tarafı available yap
      await supabase
        .from('duel_lobby')
        .update({ status: 'available' })
        .in('student_id', [challengerId, opponentId])

      return NextResponse.json({
        success: true,
        accepted: false,
        message: 'İstek reddedildi'
      })
    }

    // Kabul edildi - Düello oluştur (RPC fonksiyonu ile atomik)
    const { data: duelId, error: rpcError } = await supabase.rpc('create_duel_from_lobby', {
      p_challenger_id: challengerId,
      p_opponent_id: opponentId,
      p_subject: subject || null
    })

    if (rpcError) {
      console.error('RPC error:', rpcError)
      
      // Fallback: Manuel düello oluştur
      const { data: newDuel, error: insertError } = await supabase
        .from('duels')
        .insert({
          challenger_id: challengerId,
          opponent_id: opponentId,
          subject: subject || null,
          question_count: 5,
          status: 'pending',
          is_realtime: true
        })
        .select('id')
        .single()

      if (insertError) {
        console.error('Duel creation error:', insertError)
        
        // Her iki tarafı available yap
        await supabase
          .from('duel_lobby')
          .update({ status: 'available' })
          .in('student_id', [challengerId, opponentId])
        
        return NextResponse.json({ 
          error: 'Düello oluşturulamadı', 
          details: insertError.message 
        }, { status: 500 })
      }

      // Lobiden çıkar
      await supabase
        .from('duel_lobby')
        .delete()
        .in('student_id', [challengerId, opponentId])

      return NextResponse.json({
        success: true,
        accepted: true,
        duelId: newDuel.id,
        message: 'Düello oluşturuldu!'
      })
    }

    return NextResponse.json({
      success: true,
      accepted: true,
      duelId: duelId,
      message: 'Düello oluşturuldu!'
    })

  } catch (error) {
    console.error('Lobby respond error:', error)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}
