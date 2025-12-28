import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Service role client (RLS bypass)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * POST /api/lobby/leave
 * Lobiden çıkma
 */
export async function POST(req: NextRequest) {
  try {
    const { studentId } = await req.json()

    if (!studentId) {
      return NextResponse.json({ error: 'studentId gerekli' }, { status: 400 })
    }

    // Lobiden sil
    const { error } = await supabase
      .from('duel_lobby')
      .delete()
      .eq('student_id', studentId)

    if (error) {
      console.error('Lobby leave error:', error)
      return NextResponse.json({ error: 'Lobiden çıkılamadı' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Lobiden çıkıldı'
    })

  } catch (error) {
    console.error('Lobby leave error:', error)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}
