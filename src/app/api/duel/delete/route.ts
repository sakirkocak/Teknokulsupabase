import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Service role client (RLS bypass)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function DELETE(request: Request) {
  try {
    const { duelId, studentId } = await request.json()
    
    if (!duelId) {
      return NextResponse.json({ error: 'Düello ID gerekli' }, { status: 400 })
    }

    console.log('🗑️ Düello siliniyor:', { duelId, studentId })

    // Düelloyu sil
    const { error } = await supabase
      .from('duels')
      .delete()
      .eq('id', duelId)

    if (error) {
      console.error('❌ Düello silme hatası:', error)
      return NextResponse.json({ error: 'Düello silinemedi', details: error.message }, { status: 500 })
    }

    console.log('✅ Düello silindi:', duelId)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete duel error:', error)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}

