/**
 * 🐍 JARVIS Code Execution API
 * 
 * Gemini Code Execution ile matematiksel hesaplamaları doğrula
 * - Köklü ifadeler
 * - Denklem çözümleri
 * - Trigonometri
 * - İntegral/Türev
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

interface ExecuteRequest {
  expression: string
  type?: 'calculate' | 'solve' | 'simplify' | 'plot' | 'verify'
  context?: string
}

interface ExecutionResult {
  success: boolean
  expression: string
  result: string | number
  steps?: string[]
  pythonCode?: string
  explanation?: string
  verified: boolean
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
    
    const body: ExecuteRequest = await request.json()
    const { expression, type = 'calculate', context } = body
    
    if (!expression?.trim()) {
      return NextResponse.json({ error: 'İfade gerekli' }, { status: 400 })
    }
    
    console.log(`🐍 [JARVIS Execute] User: ${user.id.slice(0, 8)}... İfade: ${expression.slice(0, 50)}`)
    
    // Gemini modeli - Code Execution aktif
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.0-flash-exp',
      tools: [{ codeExecution: {} }],
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 2000
      }
    })
    
    // İşlem tipine göre prompt
    let prompt: string
    
    switch (type) {
      case 'solve':
        prompt = `Bu denklemi çöz ve Python ile doğrula:
${expression}

${context ? `Bağlam: ${context}` : ''}

Python kodu yaz ve çalıştır. Sonucu şu formatta ver:
1. Çözüm adımları
2. Python kodu
3. Sonuç
4. Doğrulama`
        break
        
      case 'simplify':
        prompt = `Bu ifadeyi sadeleştir:
${expression}

Python'da sympy kullanarak sadeleştir ve sonucu göster.`
        break
        
      case 'verify':
        prompt = `Bu matematiksel ifadenin doğruluğunu kontrol et:
${expression}

${context ? `Beklenen sonuç veya bağlam: ${context}` : ''}

Python ile hesapla ve doğruluğunu onayla.`
        break
        
      default: // calculate
        prompt = `Bu matematiksel ifadeyi hesapla:
${expression}

Python ile hesapla. Eğer köklü sayı, trigonometri veya özel fonksiyon varsa, math veya numpy kullan.
Sonucu hem tam değer hem de ondalık yaklaşım olarak ver.`
    }
    
    const result = await model.generateContent(prompt)
    const responseText = result.response.text()
    
    // Çıktıyı parse et
    let executionResult: ExecutionResult = {
      success: true,
      expression,
      result: '',
      verified: false
    }
    
    // Python kodu bul
    const codeMatch = responseText.match(/```python\n([\s\S]*?)```/)
    if (codeMatch) {
      executionResult.pythonCode = codeMatch[1].trim()
    }
    
    // Sonuç bul - çeşitli formatları dene
    const resultPatterns = [
      /(?:sonuç|result|output|çıktı)[:\s]*([^\n]+)/i,
      /=\s*([0-9.-]+)/,
      /≈\s*([0-9.-]+)/,
      /yaklaşık[:\s]*([0-9.-]+)/i
    ]
    
    for (const pattern of resultPatterns) {
      const match = responseText.match(pattern)
      if (match) {
        executionResult.result = match[1].trim()
        break
      }
    }
    
    // Adımları çıkar
    const stepsMatch = responseText.match(/(?:adım|step)[s]?[:\s]*([\s\S]*?)(?:python|sonuç|result|$)/i)
    if (stepsMatch) {
      executionResult.steps = stepsMatch[1]
        .split(/\n/)
        .filter(s => s.trim())
        .map(s => s.replace(/^\d+[.)]\s*/, '').trim())
    }
    
    // Doğrulama kontrolü
    if (responseText.toLowerCase().includes('doğru') || 
        responseText.toLowerCase().includes('correct') ||
        responseText.toLowerCase().includes('verified')) {
      executionResult.verified = true
    }
    
    executionResult.explanation = responseText.slice(0, 1000)
    
    const duration = Date.now() - startTime
    console.log(`✅ [JARVIS Execute] Tamamlandı: ${duration}ms, sonuç: ${executionResult.result}`)
    
    return NextResponse.json({
      success: true,
      ...executionResult,
      duration
    })
    
  } catch (error: any) {
    console.error('❌ [JARVIS Execute] Hata:', error.message)
    return NextResponse.json({ 
      error: error.message,
      success: false
    }, { status: 500 })
  }
}

/**
 * GET - Code Execution özellikleri
 */
export async function GET() {
  return NextResponse.json({
    success: true,
    features: {
      calculate: 'Matematiksel ifade hesaplama',
      solve: 'Denklem çözümü',
      simplify: 'İfade sadeleştirme',
      verify: 'Sonuç doğrulama'
    },
    examples: [
      { expression: 'sqrt(2) + sqrt(3)', type: 'calculate' },
      { expression: 'x^2 + 5x + 6 = 0', type: 'solve' },
      { expression: '(x^2 - 1)/(x - 1)', type: 'simplify' },
      { expression: 'sin(45°) = √2/2', type: 'verify' }
    ],
    capabilities: [
      'Python math/numpy hesaplamaları',
      'sympy sembolik matematik',
      'Köklü ifadeler',
      'Trigonometrik fonksiyonlar',
      'Denklem sistemleri'
    ]
  })
}
