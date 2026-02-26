import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { withAIProtection, getCachedResponse, setCachedResponse, makeAICacheKey } from '@/lib/ai-middleware'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

export async function POST(request: NextRequest) {
  try {
    // Auth + Rate limit
    const protection = await withAIProtection(request, 'solve-question')
    if (!protection.allowed) return protection.response!

    const body = await request.json()
    const { image, mimeType } = body

    if (!image) {
      return NextResponse.json({ error: 'Görsel gerekli' }, { status: 400 })
    }

    // Base64'ten veriyi ayır
    const base64Data = image.includes(',') ? image.split(',')[1] : image

    // Cache kontrol (ilk 1000 karakter hash)
    const cacheKey = makeAICacheKey('solve-question', base64Data.substring(0, 1000))
    const cached = getCachedResponse(cacheKey)
    if (cached) return NextResponse.json(cached)

    const model = genAI.getGenerativeModel({ model: 'gemini-3.1-pro-preview' })

    const prompt = `Sen çok yönlü bir eğitim asistanısın. Bu görseldeki soruyu analiz et ve çöz.

Desteklediğin dersler:
- Matematik, Geometri, Sayısal dersler
- Fizik, Kimya, Biyoloji
- Türkçe, Edebiyat, Dil Bilgisi
- Tarih, Coğrafya, Felsefe
- İngilizce ve diğer yabancı diller
- Din Kültürü
- Ve diğer tüm dersler

MATEMATİK FORMATLAMA KURALLARI:
- Tüm matematiksel ifadeleri LaTeX formatında yaz
- Satır içi formüller için $...$ kullan (örnek: $x^2 + y^2 = r^2$)
- Büyük formüller için $$...$$ kullan
- Kesirler için \\frac{pay}{payda} kullan (örnek: $\\frac{m^7}{n^{12}}$)
- Üslü ifadeler için ^ kullan (örnek: $a^{n+m}$)
- Kök için \\sqrt{} kullan (örnek: $\\sqrt{x}$)
- Çarpma için \\cdot veya \\times kullan
- Bölme işlemi için \\div kullan

Lütfen aşağıdaki formatta yanıt ver:

## 📋 Soru Analizi
Sorunun hangi dersten/konudan olduğunu ve ne hakkında olduğunu kısaca açıkla.

## 🎯 Çözüm Adımları
Adım adım çözümü göster. Her adımı numaralandır ve açıkla.
- Formülleri LaTeX formatında yaz
- Ara işlemleri göster
- Her adımı açıkla

Örnek format:
1. **Üslerin çarpımı kuralı:** $a^m \\cdot a^n = a^{m+n}$
2. **Pay hesabı:** $(m^3)^5 \\cdot (n^4)^2 = m^{15} \\cdot n^8$

## ✅ Sonuç
Doğru cevabı LaTeX formatında belirt. Eğer çoktan seçmeli ise hangi şık olduğunu söyle.

Örnek: Cevap **A)** $\\frac{m^7}{n^{12}}$

## 💡 İpucu
Bu tür soruları çözerken dikkat edilmesi gerekenleri ve benzer sorular için stratejileri açıkla.

## 📚 Konu Özeti
Bu soruyla ilgili temel kavramları ve formülleri LaTeX formatında hatırlat.

Eğer görselde bir soru bulamıyorsan veya okunamıyorsa, bunu belirt.
Türkçe yanıt ver.`

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
    const solution = response.text()
    const responseData = { solution }

    // Cache'le (30 dk)
    setCachedResponse(cacheKey, responseData, 30 * 60 * 1000)

    return NextResponse.json(responseData)
  } catch (error: any) {
    console.error('Soru çözme hatası:', error)
    return NextResponse.json(
      { error: error.message || 'Soru çözülürken bir hata oluştu' },
      { status: 500 }
    )
  }
}
