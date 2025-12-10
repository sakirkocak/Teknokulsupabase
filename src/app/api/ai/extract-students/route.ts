import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { image, mimeType } = body

    if (!image) {
      return NextResponse.json(
        { error: 'Görsel gerekli' },
        { status: 400 }
      )
    }

    // Base64'ten veriyi ayır
    const base64Data = image.includes(',') ? image.split(',')[1] : image

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

    const prompt = `Bu görselde bir öğrenci listesi var. Lütfen listedeki tüm öğrenci isimlerini çıkar.

KURALLAR:
- Sadece öğrenci isimlerini çıkar
- Her ismi ayrı bir satırda yaz
- Numara varsa "numara|isim" formatında yaz (örn: "1|Ahmet Yılmaz")
- Numara yoksa sadece ismi yaz
- Türkçe karakterleri doğru kullan
- Okunamayan veya belirsiz isimleri atla

JSON formatında döndür:
{
  "students": [
    { "number": "1", "name": "Ahmet Yılmaz" },
    { "number": "2", "name": "Ayşe Demir" }
  ],
  "total": 2,
  "notes": "Varsa notlar"
}

Eğer liste okunamıyorsa veya öğrenci bulunamıyorsa:
{
  "students": [],
  "total": 0,
  "error": "Açıklama"
}`

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: base64Data,
          mimeType: mimeType || 'image/jpeg',
        },
      },
    ])

    const response = await result.response
    const text = response.text()

    // JSON'u parse et
    let jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return NextResponse.json(
        { error: 'Öğrenci listesi çıkarılamadı' },
        { status: 400 }
      )
    }

    const data = JSON.parse(jsonMatch[0])

    return NextResponse.json(data)
  } catch (error: any) {
    console.error('Öğrenci çıkarma hatası:', error)
    return NextResponse.json(
      { error: error.message || 'Öğrenci listesi çıkarılırken bir hata oluştu' },
      { status: 500 }
    )
  }
}

