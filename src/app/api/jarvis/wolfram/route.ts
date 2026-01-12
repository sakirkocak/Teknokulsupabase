/**
 * 🔢 JARVIS - Wolfram Alpha API
 * 
 * Hatasız matematik hesaplamaları
 * Karmaşık matematiksel işlemler için Python'dan daha güvenilir
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 30

interface WolframRequest {
  query: string
  format?: 'short' | 'full' | 'steps'
}

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  
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
    
    const appId = process.env.WOLFRAM_APP_ID
    
    if (!appId) {
      console.error('❌ Wolfram Alpha App ID yok!')
      return NextResponse.json({ 
        error: 'Wolfram Alpha yapılandırması eksik' 
      }, { status: 500 })
    }
    
    const body: WolframRequest = await request.json()
    const { query, format = 'short' } = body
    
    if (!query?.trim()) {
      return NextResponse.json({ error: 'Sorgu gerekli' }, { status: 400 })
    }
    
    console.log(`🔢 [WOLFRAM] User: ${user.id.slice(0, 8)}... Sorgu: ${query.slice(0, 50)}`)
    
    let result: string
    let fullResult: any = null
    
    // Format'a göre API seç
    if (format === 'short') {
      // Short Answers API - En hızlı, sadece sonuç
      const response = await fetch(
        `https://api.wolframalpha.com/v1/result?appid=${appId}&i=${encodeURIComponent(query)}`,
        { method: 'GET' }
      )
      
      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Wolfram hatası: ${errorText}`)
      }
      
      result = await response.text()
      
    } else if (format === 'full') {
      // Full Results API - Detaylı sonuç
      const response = await fetch(
        `https://api.wolframalpha.com/v2/query?appid=${appId}&input=${encodeURIComponent(query)}&format=plaintext&output=json`,
        { method: 'GET' }
      )
      
      if (!response.ok) {
        throw new Error('Wolfram API hatası')
      }
      
      fullResult = await response.json()
      
      // Primary result'ı bul
      const pods = fullResult?.queryresult?.pods || []
      const resultPod = pods.find((p: any) => p.id === 'Result' || p.id === 'DecimalApproximation')
      const solutionPod = pods.find((p: any) => p.id === 'Solution' || p.id === 'RealSolution')
      
      if (resultPod?.subpods?.[0]?.plaintext) {
        result = resultPod.subpods[0].plaintext
      } else if (solutionPod?.subpods?.[0]?.plaintext) {
        result = solutionPod.subpods[0].plaintext
      } else {
        // İlk pod'u al
        result = pods[0]?.subpods?.[0]?.plaintext || 'Sonuç bulunamadı'
      }
      
    } else {
      // Steps API (Step-by-Step Solutions) - Premium gerektirebilir
      const response = await fetch(
        `https://api.wolframalpha.com/v2/query?appid=${appId}&input=${encodeURIComponent(query)}&podstate=Step-by-step%20solution&format=plaintext&output=json`,
        { method: 'GET' }
      )
      
      if (!response.ok) {
        throw new Error('Wolfram API hatası')
      }
      
      fullResult = await response.json()
      
      // Step-by-step bul
      const pods = fullResult?.queryresult?.pods || []
      const stepPod = pods.find((p: any) => 
        p.title?.toLowerCase().includes('step') || 
        p.id?.toLowerCase().includes('step')
      )
      
      if (stepPod?.subpods) {
        result = stepPod.subpods.map((s: any) => s.plaintext).join('\n')
      } else {
        result = pods[0]?.subpods?.[0]?.plaintext || 'Adımlar bulunamadı'
      }
    }
    
    const duration = Date.now() - startTime
    console.log(`✅ [WOLFRAM] Sonuç: ${result.slice(0, 50)}... (${duration}ms)`)
    
    return NextResponse.json({
      success: true,
      query,
      result,
      fullResult: format !== 'short' ? fullResult : undefined,
      format,
      duration
    })
    
  } catch (error: any) {
    console.error('❌ [WOLFRAM] Hata:', error.message)
    return NextResponse.json({ 
      error: error.message,
      fallbackResult: null
    }, { status: 500 })
  }
}

/**
 * GET - Örnek sorgular ve API durumu
 */
export async function GET() {
  const hasAppId = !!process.env.WOLFRAM_APP_ID
  
  return NextResponse.json({
    success: true,
    configured: hasAppId,
    examples: [
      { query: 'sqrt(2)', description: 'Karekök 2 değeri' },
      { query: 'solve x^2 + 5x + 6 = 0', description: 'İkinci derece denklem' },
      { query: 'integrate x^2 dx', description: 'İntegral' },
      { query: 'derivative of sin(x)', description: 'Türev' },
      { query: 'plot y = x^2', description: 'Grafik (görsel)' },
      { query: 'factor x^4 - 1', description: 'Çarpanlara ayırma' },
      { query: 'simplify (x^2 - 1)/(x - 1)', description: 'Sadeleştirme' },
      { query: 'sin(45 degrees)', description: 'Trigonometri' }
    ],
    formats: [
      { id: 'short', description: 'Sadece sonuç (en hızlı)' },
      { id: 'full', description: 'Detaylı sonuç' },
      { id: 'steps', description: 'Adım adım çözüm' }
    ]
  })
}
