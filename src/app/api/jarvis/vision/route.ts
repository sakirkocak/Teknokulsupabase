/**
 * 👁️ JARVIS Vision API
 * 
 * Gemini Vision ile soru görsellerini analiz et
 * - Sayı doğrusu koordinatları
 * - Tablo verileri
 * - Grafik analizi
 * - Geometrik şekiller
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

interface VisionRequest {
  imageUrl?: string
  imageBase64?: string
  mimeType?: string
  context?: string // Ek bağlam (soru metni vb.)
  analysisType?: 'auto' | 'number_line' | 'table' | 'graph' | 'geometry' | 'diagram'
}

interface VisionAnalysis {
  type: string
  description: string
  elements: any[]
  coordinates?: Array<{ label: string; value: string; position: number }>
  tableData?: Array<Record<string, string>>
  graphData?: { xAxis: string; yAxis: string; points: Array<{ x: number; y: number }> }
  geometryData?: { shapes: Array<{ type: string; properties: Record<string, any> }> }
  mathExpressions?: string[]
  confidence: number
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
    
    const body: VisionRequest = await request.json()
    const { imageUrl, imageBase64, mimeType = 'image/png', context, analysisType = 'auto' } = body
    
    if (!imageUrl && !imageBase64) {
      return NextResponse.json({ error: 'Görsel gerekli (imageUrl veya imageBase64)' }, { status: 400 })
    }
    
    console.log(`👁️ [JARVIS Vision] User: ${user.id.slice(0, 8)}... Analiz başlıyor...`)
    
    // Görsel verisi hazırla
    let imagePart: any
    
    if (imageBase64) {
      imagePart = {
        inlineData: {
          data: imageBase64.replace(/^data:image\/\w+;base64,/, ''),
          mimeType: mimeType
        }
      }
    } else if (imageUrl) {
      // URL'den görsel çek
      const imgResponse = await fetch(imageUrl)
      const imgBuffer = await imgResponse.arrayBuffer()
      const base64 = Buffer.from(imgBuffer).toString('base64')
      const detectedMime = imgResponse.headers.get('content-type') || 'image/png'
      
      imagePart = {
        inlineData: {
          data: base64,
          mimeType: detectedMime
        }
      }
    }
    
    // Gemini Vision modeli
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.0-flash-exp',
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 4000
      }
    })
    
    // Analiz prompt'u
    const analysisPrompt = `Sen bir görsel analiz uzmanısın. Bu eğitim materyali görselini analiz et.

${context ? `BAĞLAM: ${context}\n` : ''}

ANALİZ TİPİ: ${analysisType}

GÖREVLER:
1. Görseldeki tüm öğeleri tespit et
2. Matematiksel ifadeleri çıkar
3. Koordinat/değer bilgilerini belirle
4. Şekil ve grafikleri analiz et

JSON formatında yanıt ver:
{
  "type": "number_line|table|graph|geometry|diagram|mixed",
  "description": "Görselin genel açıklaması",
  "elements": [
    { "id": "A", "type": "point|label|shape", "value": "değer", "position": "konum açıklaması" }
  ],
  "coordinates": [
    { "label": "A", "value": "-√5", "position": -2.236 }
  ],
  "tableData": [
    { "column1": "değer1", "column2": "değer2" }
  ],
  "graphData": {
    "xAxis": "x ekseni adı",
    "yAxis": "y ekseni adı", 
    "points": [{ "x": 0, "y": 0 }],
    "functions": ["y = x^2"]
  },
  "geometryData": {
    "shapes": [
      { "type": "triangle", "properties": { "base": 5, "height": 3 } }
    ]
  },
  "mathExpressions": ["√2", "x^2 + y^2 = r^2"],
  "confidence": 0.95
}

ÖNEMLİ:
- Sadece görselde GÖRDÜĞÜN bilgileri çıkar
- Köklü sayıların yaklaşık değerlerini hesapla
- Koordinatları mümkün olduğunca kesin ver
- Güven skoru (confidence) 0-1 arası olsun`

    const result = await model.generateContent([analysisPrompt, imagePart])
    const responseText = result.response.text()
    
    // JSON parse
    let analysis: VisionAnalysis
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/)
      if (!jsonMatch) throw new Error('JSON bulunamadı')
      analysis = JSON.parse(jsonMatch[0])
    } catch (parseError) {
      console.error('JSON parse hatası:', parseError)
      analysis = {
        type: 'unknown',
        description: responseText.slice(0, 500),
        elements: [],
        confidence: 0.3
      }
    }
    
    const duration = Date.now() - startTime
    console.log(`✅ [JARVIS Vision] Analiz tamamlandı: ${duration}ms, tip: ${analysis.type}`)
    
    return NextResponse.json({
      success: true,
      analysis,
      rawResponse: responseText.slice(0, 1000),
      duration
    })
    
  } catch (error: any) {
    console.error('❌ [JARVIS Vision] Hata:', error.message)
    return NextResponse.json({ 
      error: error.message
    }, { status: 500 })
  }
}

/**
 * GET - Vision API durumu
 */
export async function GET() {
  return NextResponse.json({
    success: true,
    features: [
      'number_line - Sayı doğrusu analizi',
      'table - Tablo verisi çıkarma',
      'graph - Grafik analizi',
      'geometry - Geometrik şekil tespiti',
      'diagram - Diyagram analizi',
      'auto - Otomatik tip tespiti'
    ],
    supportedFormats: ['image/png', 'image/jpeg', 'image/webp', 'image/gif'],
    model: 'gemini-2.0-flash-exp'
  })
}
