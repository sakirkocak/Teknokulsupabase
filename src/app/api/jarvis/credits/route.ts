/**
 * 💳 JARVIS - Kredi Yönetimi API
 * 
 * Kullanıcı kredi durumu ve premium kontrolü
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCreditStatus, JARVIS_IDENTITY } from '@/lib/jarvis'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // =====================================================
    // 🔒 AUTH KONTROLÜ
    // =====================================================
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ 
        error: 'Giriş yapmanız gerekiyor',
        requireAuth: true
      }, { status: 401 })
    }
    
    // Kredi durumunu al
    const credits = await getCreditStatus(user.id)
    
    return NextResponse.json({
      success: true,
      credits: {
        daily_credits: credits.daily_credits,
        used_today: credits.used_today,
        remaining: credits.remaining,
        is_premium: credits.is_premium,
        premium_until: credits.premium_until
      },
      assistant: JARVIS_IDENTITY.name
    })
    
  } catch (error: any) {
    console.error('❌ [JARVIS] Credits hatası:', error.message)
    return NextResponse.json({ 
      error: error.message 
    }, { status: 500 })
  }
}
