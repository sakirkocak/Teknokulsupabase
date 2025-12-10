import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { imageUrl, examType, studentName } = body

    if (!imageUrl) {
      return NextResponse.json(
        { error: 'Görsel URL gerekli' },
        { status: 400 }
      )
    }

    // Görseli fetch et ve base64'e çevir
    const imageResponse = await fetch(imageUrl)
    const imageBuffer = await imageResponse.arrayBuffer()
    const base64Image = Buffer.from(imageBuffer).toString('base64')
    const mimeType = imageResponse.headers.get('content-type') || 'image/jpeg'

    // Gemini Vision modeli
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

    const prompt = `Sen bir eğitim analiz uzmanısın. Bu deneme sınavı sonuç karnesini detaylı analiz et.

Sınav Türü: ${examType || 'Belirtilmemiş'}
Öğrenci: ${studentName || 'Öğrenci'}

Bu görsel bir deneme sınavı sonuç karnesidir. Görselde genellikle:
- Sol tarafta ders bazlı özet tablo (Türkçe, Matematik, Sosyal, Fen vs. ile Doğru, Yanlış, Net)
- Sağ tarafta KAZANIM/KONU BAZLI detaylı analiz (her konu için D, Y, B sütunları)

Lütfen aşağıdaki bilgileri JSON formatında çıkar:

1. Her DERS için özet:
   - Ders adı, Doğru, Yanlış, Boş, Net

2. Her dersin ALT KONULARI/KAZANIMLARI için detay:
   - Konu adı, Doğru sayısı, Yanlış sayısı, Boş sayısı
   - Görselin sağ tarafındaki "DERSLERE GÖRE BAŞARI ANALİZİ" bölümünden oku

3. Toplam sonuçlar

4. Analiz ve öneriler

JSON formatı:
{
  "subjects": [
    {
      "name": "Türkçe",
      "correct": 40,
      "wrong": 22,
      "empty": 16,
      "net": 18.0,
      "topics": [
        {"name": "Sözcükte Anlam", "correct": 2, "wrong": 1, "empty": 0, "status": "orta"},
        {"name": "Cümlede Anlam", "correct": 3, "wrong": 0, "empty": 1, "status": "iyi"},
        {"name": "Paragraf", "correct": 5, "wrong": 3, "empty": 2, "status": "orta"}
      ]
    }
  ],
  "total": {
    "correct": 120,
    "wrong": 48,
    "empty": 25,
    "net": 41.75
  },
  "analysis": {
    "strongSubjects": ["Türkçe", "Sosyal Bilimler"],
    "weakSubjects": ["Fen Bilimleri", "Matematik"],
    "strongTopics": ["Paragraf", "Tarih", "Coğrafya"],
    "weakTopics": ["Fonksiyonlar", "Fizik", "Kimya"],
    "topicsToStudy": [
      {"topic": "Fonksiyonlar", "subject": "Matematik", "priority": "yüksek"},
      {"topic": "Elektrik", "subject": "Fizik", "priority": "yüksek"}
    ],
    "recommendations": [
      "Matematik'te fonksiyon konusuna ağırlık ver",
      "Fen Bilimleri tamamen eksik, temel konulardan başla"
    ],
    "overallAssessment": "Genel değerlendirme metni - güçlü ve zayıf yönler"
  }
}

ÖNEMLİ:
- Görseldeki TÜM konu/kazanım bilgilerini oku (sağ taraftaki tablo)
- Her konunun D (Doğru), Y (Yanlış), B (Boş) değerlerini doğru aktar
- Konu isimlerini Türkçe yaz
- status alanı: "iyi" (çoğu doğru), "orta" (karışık), "zayıf" (çoğu yanlış/boş)
- SADECE JSON döndür, başka bir şey yazma.`

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          mimeType,
          data: base64Image
        }
      }
    ])

    const response = await result.response
    let text = response.text()

    // JSON'u parse et
    // Markdown code block'larını temizle
    text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    
    let analysisData
    try {
      analysisData = JSON.parse(text)
    } catch (parseError) {
      console.error('JSON parse error:', parseError, 'Text:', text)
      return NextResponse.json(
        { error: 'Analiz sonucu işlenemedi. Lütfen daha net bir görsel yükleyin.' },
        { status: 400 }
      )
    }

    return NextResponse.json({ 
      success: true,
      analysis: analysisData 
    })

  } catch (error: any) {
    console.error('Exam analysis error:', error)
    return NextResponse.json(
      { error: error.message || 'Analiz hatası' },
      { status: 500 }
    )
  }
}

