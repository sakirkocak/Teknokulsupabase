/**
 * Video İzleme API
 * POST /api/video/watch
 * 
 * Video izlerken kredi harcar
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
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
    
    const { questionId } = await request.json()
    
    if (!questionId) {
      return NextResponse.json(
        { error: 'questionId gerekli' },
        { status: 400 }
      )
    }
    
    // Kredi durumunu kontrol et
    const { data: credits } = await supabase
      .from('tekno_teacher_credits')
      .select('*')
      .eq('user_id', user.id)
      .single()
    
    // Premium kullanıcı - sınırsız
    if (credits?.is_premium) {
      // İzleme kaydı tut
      await supabase.from('video_watch_logs').insert({
        user_id: user.id,
        question_id: questionId,
        credits_used: 0,
        is_premium: true
      })
      
      return NextResponse.json({
        success: true,
        creditsUsed: 0,
        remaining: 999,
        is_premium: true
      })
    }
    
    // Kredi kontrolü
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const lastReset = credits?.last_reset_date ? new Date(credits.last_reset_date) : new Date(0)
    
    let usedToday = credits?.used_today || 0
    if (lastReset < today) {
      usedToday = 0
    }
    
    const dailyCredits = credits?.daily_credits || 3
    const remaining = dailyCredits - usedToday
    
    if (remaining <= 0) {
      return NextResponse.json(
        { error: 'Krediniz bitti! Premium üyelik alın.', remaining: 0 },
        { status: 403 }
      )
    }
    
    // Kredi harca
    if (credits) {
      await supabase
        .from('tekno_teacher_credits')
        .update({
          used_today: usedToday + 1,
          last_reset_date: today.toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id)
    } else {
      // Yeni kayıt oluştur
      await supabase
        .from('tekno_teacher_credits')
        .insert({
          user_id: user.id,
          used_today: 1,
          last_reset_date: today.toISOString()
        })
    }
    
    // İzleme kaydı tut
    await supabase.from('video_watch_logs').insert({
      user_id: user.id,
      question_id: questionId,
      credits_used: 1,
      is_premium: false
    }).catch(() => {}) // Hata olursa sessizce geç
    
    return NextResponse.json({
      success: true,
      creditsUsed: 1,
      remaining: remaining - 1,
      is_premium: false
    })
    
  } catch (error: any) {
    console.error('Video watch error:', error)
    return NextResponse.json(
      { error: error.message || 'Bir hata oluştu' },
      { status: 500 }
    )
  }
}
