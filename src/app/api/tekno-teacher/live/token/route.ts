/**
 * TeknoÖğretmen Live API Token
 * GET /api/tekno-teacher/live/token
 * 
 * Authenticated kullanıcılara Gemini API key verir
 * (Production'da ephemeral token kullanılmalı)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkAndUseCredit } from '@/lib/tekno-teacher'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Kullanıcı kontrolü
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json(
        { error: 'Giriş yapmanız gerekiyor' },
        { status: 401 }
      )
    }
    
    // Kredi kontrolü
    const creditStatus = await checkAndUseCredit(user.id)
    
    if (!creditStatus.allowed) {
      return NextResponse.json({
        error: 'Günlük krediniz bitti',
        upgrade_required: true
      }, { status: 429 })
    }
    
    // Profil bilgilerini al
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, grade')
      .eq('id', user.id)
      .single()
    
    // API key (production'da ephemeral token olmalı)
    const apiKey = process.env.GEMINI_API_KEY
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key yapılandırılmamış' },
        { status: 500 }
      )
    }
    
    console.log(`🎫 Live token verildi: ${user.email}`)
    
    return NextResponse.json({
      success: true,
      apiKey: apiKey, // ⚠️ Production'da ephemeral token kullan!
      user: {
        id: user.id,
        name: profile?.full_name || 'Öğrenci',
        grade: profile?.grade || 8
      },
      credits: {
        remaining: creditStatus.remaining,
        is_premium: creditStatus.is_premium
      }
    })
    
  } catch (error: any) {
    console.error('Live token error:', error)
    return NextResponse.json(
      { error: error.message || 'Token hatası' },
      { status: 500 }
    )
  }
}
