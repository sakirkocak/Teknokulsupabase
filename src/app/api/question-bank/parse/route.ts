/**
 * Doğal Dil Parse API
 * POST /api/question-bank/parse
 * 
 * İstek metnini parse eder ve kriterleri döndürür
 */

import { NextRequest, NextResponse } from 'next/server'
import { parseQuestionBankRequest, generateTitle, generateMetaDescription } from '@/lib/question-bank/parser'

export async function POST(request: NextRequest) {
  try {
    const { input } = await request.json()
    
    if (!input || typeof input !== 'string') {
      return NextResponse.json(
        { error: 'Geçerli bir istek metni gerekli' },
        { status: 400 }
      )
    }
    
    if (input.length < 5) {
      return NextResponse.json(
        { error: 'İstek çok kısa. Örnek: "8. sınıf matematik 50 soru"' },
        { status: 400 }
      )
    }
    
    if (input.length > 500) {
      return NextResponse.json(
        { error: 'İstek çok uzun' },
        { status: 400 }
      )
    }
    
    // Parse et
    const parsed = parseQuestionBankRequest(input)
    
    // Otomatik başlık ve meta description oluştur
    const title = generateTitle(parsed)
    const metaDescription = generateMetaDescription(parsed)
    
    return NextResponse.json({
      success: true,
      parsed,
      title,
      metaDescription
    })
    
  } catch (error) {
    console.error('Parse error:', error)
    return NextResponse.json(
      { error: 'Parse hatası oluştu' },
      { status: 500 }
    )
  }
}
