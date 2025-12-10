import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { topic } = body

    if (!topic) {
      return NextResponse.json(
        { error: 'Konu gerekli' },
        { status: 400 }
      )
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

    const prompt = `Sen deneyimli bir öğretmensin. Bir lise öğrencisi sana şu soruyu/konuyu sordu: "${topic}"

Lütfen bu konuyu/soruyu aşağıdaki kurallara göre açıkla:

1. **Basit ve Anlaşılır Dil**: Karmaşık terimleri basit kelimelerle açıkla
2. **Örneklerle Destekle**: Gerçek hayattan örnekler ver
3. **Adım Adım Açıkla**: Konuyu mantıksal sırayla anlat
4. **Görselleştir**: Mümkünse formüller, tablolar veya şemalar kullan
5. **Özet Ver**: Sonunda kısa bir özet yap

Format:
## 📚 Konu Açıklaması
(Ana açıklama)

## 🎯 Önemli Noktalar
- Nokta 1
- Nokta 2

## 💡 Örnek
(Pratik örnek)

## 📝 Özet
(Kısa özet)

Türkçe yanıt ver ve öğrenci seviyesine uygun açıkla.`

    const result = await model.generateContent(prompt)
    const response = await result.response
    const explanation = response.text()

    return NextResponse.json({ explanation })
  } catch (error: any) {
    console.error('Konu anlatım hatası:', error)
    return NextResponse.json(
      { error: error.message || 'Konu açıklanırken bir hata oluştu' },
      { status: 500 }
    )
  }
}

