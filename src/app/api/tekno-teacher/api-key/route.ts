/**
 * TeknoÖğretmen API Key Endpoint
 * GET /api/tekno-teacher/api-key
 * 
 * Client-side WebSocket için API key döner
 * NOT: Production'da ephemeral token kullanılmalı
 */

import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY
  
  if (!apiKey) {
    return NextResponse.json(
      { error: 'API key bulunamadı' },
      { status: 500 }
    )
  }
  
  // TODO: Production'da:
  // 1. Kullanıcı auth kontrolü
  // 2. Rate limiting
  // 3. Ephemeral token oluşturma
  
  return NextResponse.json({ apiKey })
}
