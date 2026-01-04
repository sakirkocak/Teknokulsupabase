/**
 * Honeypot Tuzak Endpoint
 * Bu endpoint gerçek kullanıcılar tarafından asla çağrılmamalı.
 * Sadece botlar bu gizli endpoint'e erişir.
 * 
 * Erişen IP'ler otomatik olarak şüpheli olarak işaretlenir.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function getClientIP(request: NextRequest): string {
  return request.headers.get('cf-connecting-ip') || 
         request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
         request.headers.get('x-real-ip') || 
         'unknown'
}

export async function GET(request: NextRequest) {
  const ip = getClientIP(request)
  const userAgent = request.headers.get('user-agent') || 'unknown'
  const path = request.nextUrl.pathname
  
  // Honeypot tetiklemesini kaydet
  try {
    await supabase.from('honeypot_triggers').insert({
      ip_address: ip,
      user_agent: userAgent,
      trap_type: 'hidden_api',
      trap_path: path
    })
    
    // 3+ tetikleme varsa IP'yi engelle
    const { data: triggerCount } = await supabase
      .rpc('check_honeypot_triggers', { p_ip_address: ip })
    
    if (triggerCount && triggerCount >= 3) {
      await supabase.rpc('block_ip', {
        p_ip_address: ip,
        p_reason: 'Honeypot tetikleme - Bot tespit edildi',
        p_duration_hours: 24 // 24 saat engel
      })
    }
    
    console.log(`🍯 Honeypot triggered by IP: ${ip}, UA: ${userAgent}`)
  } catch (error) {
    console.error('Honeypot log error:', error)
  }
  
  // Sahte cevap döndür (botu kandırmak için)
  return NextResponse.json({
    questions: [],
    total: 0,
    message: 'No results found'
  }, {
    status: 200,
    headers: {
      'X-Robots-Tag': 'noindex, nofollow'
    }
  })
}

export async function POST(request: NextRequest) {
  return GET(request)
}
