import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { targetExam, targetDate, dailyHours, weakSubjects, strongSubjects, examStats, studentName } = body

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

    // Sınava kalan süreyi hesapla
    let daysLeft = 0
    if (targetDate) {
      const target = new Date(targetDate)
      const now = new Date()
      daysLeft = Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    }

    const prompt = `Sen bir eğitim danışmanısın. ${studentName || 'Öğrenci'} için kişiselleştirilmiş bir çalışma planı oluştur.

## Öğrenci Bilgileri:
- Hedef Sınav: ${targetExam}
- Sınava Kalan Gün: ${daysLeft > 0 ? daysLeft : 'Belirsiz'}
- Günlük Çalışma Süresi: ${dailyHours} saat
- Zayıf Dersler: ${weakSubjects?.length > 0 ? weakSubjects.join(', ') : 'Belirtilmemiş'}
- Güçlü Dersler: ${strongSubjects?.length > 0 ? strongSubjects.join(', ') : 'Belirtilmemiş'}
${examStats ? `- Deneme Sayısı: ${examStats.count}
- Ortalama Net: ${examStats.avgNet?.toFixed(1)}
- Zayıf Konular: ${examStats.weakTopics?.join(', ') || 'Yok'}` : ''}

Aşağıdaki JSON formatında bir çalışma planı oluştur. SADECE JSON döndür, başka metin ekleme.

{
  "weeklySchedule": {
    "Pazartesi": { "morning": "Matematik - Fonksiyonlar", "afternoon": "Türkçe - Paragraf", "evening": "Tekrar + Soru Çözümü" },
    "Salı": { "morning": "...", "afternoon": "...", "evening": "..." },
    "Çarşamba": { "morning": "...", "afternoon": "...", "evening": "..." },
    "Perşembe": { "morning": "...", "afternoon": "...", "evening": "..." },
    "Cuma": { "morning": "...", "afternoon": "...", "evening": "..." },
    "Cumartesi": { "morning": "...", "afternoon": "...", "evening": "..." },
    "Pazar": { "morning": "Deneme Sınavı", "afternoon": "Analiz + Eksik Konular", "evening": "Dinlenme" }
  },
  "dailyDetails": [
    {
      "day": "Pazartesi",
      "subjects": [
        { "name": "Matematik", "duration": "2 saat", "topics": ["Fonksiyonlar", "Türev"], "questions": 50 },
        { "name": "Türkçe", "duration": "1.5 saat", "topics": ["Paragraf", "Dil Bilgisi"], "questions": 30 }
      ],
      "breaks": ["10:30-10:45 Mola", "12:30-13:30 Öğle Arası", "15:00-15:15 Mola"]
    }
  ],
  "priorityTopics": ["Türev", "İntegral", "Paragraf", "Fizik - Elektrik"],
  "tips": [
    "Her gün aynı saatte çalışmaya başla",
    "Pomodoro tekniği kullan (25 dk çalış, 5 dk mola)",
    "Zayıf konulara günlük en az 1 saat ayır",
    "Her hafta en az 1 deneme çöz ve analiz et",
    "Uyku düzenine dikkat et, en az 7 saat uyu"
  ],
  "weeklyGoals": {
    "totalQuestions": 500,
    "topics": ["Fonksiyonlar", "Türev", "Paragraf", "Dil Bilgisi"],
    "miniExams": 2
  }
}

ÖNEMLİ:
- Günlük ${dailyHours} saate göre planla
- Zayıf derslere daha fazla zaman ayır: ${weakSubjects?.join(', ') || 'Yok'}
- Güçlü dersleri koruma amaçlı dahil et: ${strongSubjects?.join(', ') || 'Yok'}
- Mola ve dinlenme zamanlarını unutma
- Hafta sonu deneme + analiz olsun
- SADECE geçerli JSON döndür`

    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()

    // JSON parse et
    let planData
    try {
      // JSON'u temizle (markdown code block varsa)
      let cleanJson = text
      if (text.includes('```json')) {
        cleanJson = text.replace(/```json\n?/g, '').replace(/```\n?/g, '')
      } else if (text.includes('```')) {
        cleanJson = text.replace(/```\n?/g, '')
      }
      planData = JSON.parse(cleanJson.trim())
    } catch (parseError) {
      console.error('JSON parse error:', parseError)
      console.error('Raw text:', text)
      
      // Fallback plan
      planData = {
        weeklySchedule: {
          "Pazartesi": { morning: "Matematik", afternoon: "Türkçe", evening: "Tekrar" },
          "Salı": { morning: "Fizik", afternoon: "Kimya", evening: "Soru Çözümü" },
          "Çarşamba": { morning: "Matematik", afternoon: "Biyoloji", evening: "Tekrar" },
          "Perşembe": { morning: "Türkçe", afternoon: "Tarih", evening: "Soru Çözümü" },
          "Cuma": { morning: "Matematik", afternoon: "Coğrafya", evening: "Tekrar" },
          "Cumartesi": { morning: "Genel Tekrar", afternoon: "Zayıf Konular", evening: "Test" },
          "Pazar": { morning: "Deneme", afternoon: "Analiz", evening: "Dinlenme" }
        },
        dailyDetails: [],
        priorityTopics: weakSubjects || ["Matematik", "Fizik"],
        tips: [
          "Her gün düzenli çalış",
          "Pomodoro tekniği kullan",
          "Zayıf konulara öncelik ver",
          "Haftalık deneme çöz",
          "Yeterli uyku al"
        ],
        weeklyGoals: {
          totalQuestions: parseInt(dailyHours) * 50,
          topics: weakSubjects?.slice(0, 4) || [],
          miniExams: 1
        }
      }
    }

    return NextResponse.json(planData)
  } catch (error: any) {
    console.error('Plan oluşturma hatası:', error)
    return NextResponse.json(
      { error: error.message || 'Plan oluşturulurken bir hata oluştu' },
      { status: 500 }
    )
  }
}
