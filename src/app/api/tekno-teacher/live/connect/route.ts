/**
 * TeknoÖğretmen Live API - Bağlantı Başlatma
 * POST /api/tekno-teacher/live/connect
 * 
 * Gemini Live WebSocket bağlantısı için session oluşturur
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkAndUseCredit } from '@/lib/tekno-teacher'
import { v4 as uuidv4 } from 'uuid'

export const maxDuration = 60

interface LiveConnectRequest {
  studentName: string
  grade: number
  personality: 'friendly' | 'strict' | 'motivating'
  voice?: string
}

// Aktif session'ları tut (production'da Redis kullanılmalı)
const activeSessions = new Map<string, {
  userId: string
  config: LiveConnectRequest
  createdAt: Date
}>()

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
    
    // Kredi kontrolü
    const creditStatus = await checkAndUseCredit(user.id)
    
    if (!creditStatus.allowed) {
      return NextResponse.json({
        error: 'Günlük krediniz bitti',
        upgrade_required: true
      }, { status: 429 })
    }
    
    // Request body
    const body: LiveConnectRequest = await request.json()
    const { studentName, grade, personality = 'friendly', voice = 'Kore' } = body
    
    // Session ID oluştur
    const sessionId = uuidv4()
    
    // Session'ı kaydet
    activeSessions.set(sessionId, {
      userId: user.id,
      config: body,
      createdAt: new Date()
    })
    
    // 5 dakika sonra session'ı temizle
    setTimeout(() => {
      activeSessions.delete(sessionId)
    }, 5 * 60 * 1000)
    
    // Gemini Live WebSocket URL
    // Not: Gerçek implementasyonda bu Gemini'nin WebSocket endpoint'i olacak
    const wsUrl = `wss://${process.env.VERCEL_URL || 'localhost:3000'}/api/tekno-teacher/live/ws`
    
    // Ephemeral token oluştur (güvenlik için)
    const token = Buffer.from(JSON.stringify({
      sessionId,
      userId: user.id,
      exp: Date.now() + 5 * 60 * 1000 // 5 dakika
    })).toString('base64')
    
    console.log(`🔗 Live session oluşturuldu: ${sessionId}`)
    console.log(`   Öğrenci: ${studentName}, Sınıf: ${grade}`)
    
    return NextResponse.json({
      success: true,
      sessionId,
      token,
      wsUrl,
      config: {
        studentName,
        grade,
        personality,
        voice
      },
      credits: {
        remaining: creditStatus.remaining,
        is_premium: creditStatus.is_premium
      }
    })
    
  } catch (error: any) {
    console.error('Live connect error:', error)
    return NextResponse.json(
      { error: error.message || 'Bağlantı hatası' },
      { status: 500 }
    )
  }
}

// Session bilgisi al
export async function GET(request: NextRequest) {
  const sessionId = request.nextUrl.searchParams.get('sessionId')
  
  if (!sessionId) {
    return NextResponse.json({ error: 'Session ID gerekli' }, { status: 400 })
  }
  
  const session = activeSessions.get(sessionId)
  
  if (!session) {
    return NextResponse.json({ error: 'Session bulunamadı' }, { status: 404 })
  }
  
  return NextResponse.json({
    exists: true,
    createdAt: session.createdAt
  })
}
