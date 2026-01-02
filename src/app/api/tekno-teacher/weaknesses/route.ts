/**
 * TeknoÖğretmen Zayıf Konular API
 * GET /api/tekno-teacher/weaknesses
 * 
 * Öğrencinin en zayıf konularını döndürür
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getTopWeaknesses, getStudentStats } from '@/lib/tekno-teacher'

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
    
    // Limit parametresi
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '5')
    
    // Zayıf konuları getir
    const weaknesses = await getTopWeaknesses(user.id, limit)
    
    // İstatistikleri getir
    const stats = await getStudentStats(user.id)
    
    return NextResponse.json({
      success: true,
      weaknesses,
      stats: {
        total_questions: stats.total_questions,
        average_score: stats.average_score,
        strongest_subject: stats.strongest_subject,
        weakest_subject: stats.weakest_subject
      }
    })
    
  } catch (error: any) {
    console.error('Weaknesses error:', error)
    return NextResponse.json(
      { error: error.message || 'Bir hata oluştu' },
      { status: 500 }
    )
  }
}
