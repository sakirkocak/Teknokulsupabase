/**
 * TeknoÖğretmen Kredi API
 * GET /api/tekno-teacher/credits
 * 
 * Kullanıcının kredi durumunu döndürür
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCreditStatus } from '@/lib/tekno-teacher'

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
    
    const status = await getCreditStatus(user.id)
    
    return NextResponse.json({
      success: true,
      credits: status
    })
    
  } catch (error: any) {
    console.error('Credits error:', error)
    return NextResponse.json(
      { error: error.message || 'Bir hata oluştu' },
      { status: 500 }
    )
  }
}
