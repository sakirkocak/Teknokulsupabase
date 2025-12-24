import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

export const geminiModel = genAI.getGenerativeModel({ 
  model: 'gemini-1.5-flash',
  generationConfig: {
    temperature: 0.7,
    topP: 0.8,
    topK: 40,
    maxOutputTokens: 1024,
  }
})

export async function generateAIResponse(prompt: string, context: string): Promise<string> {
  try {
    const fullPrompt = `${context}\n\nÖğrenci mesajı: ${prompt}`
    const result = await geminiModel.generateContent(fullPrompt)
    const response = await result.response
    return response.text()
  } catch (error) {
    console.error('Gemini API error:', error)
    throw new Error('AI yanıtı alınamadı')
  }
}

export async function generateDailyTask(studentData: any): Promise<{
  title: string
  description: string
  subject_code: string
  target_count: number
  xp_reward: number
  target_accuracy?: number
}> {
  const prompt = `
Sen bir eğitim koçusun. Öğrenci verilerine göre bugün için kişiselleştirilmiş bir görev oluştur.

Öğrenci Verileri:
${JSON.stringify(studentData, null, 2)}

Görev Kuralları:
- Zayıf konulara öncelik ver
- Gerçekçi hedefler koy (10-30 soru arası)
- Motive edici bir başlık yaz
- XP ödülü 100-300 arası olsun

JSON formatında yanıt ver:
{
  "title": "Görev başlığı",
  "description": "Kısa açıklama",
  "subject_code": "matematik/turkce/fen/sosyal/ingilizce",
  "target_count": 15,
  "xp_reward": 150,
  "target_accuracy": 70
}

Sadece JSON döndür, başka bir şey yazma.
`

  try {
    const result = await geminiModel.generateContent(prompt)
    const response = await result.response
    const text = response.text()
    
    // JSON'u parse et
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0])
    }
    
    // Fallback görev
    return {
      title: 'Günlük Pratik',
      description: 'Bugün 15 soru çözerek pratik yap!',
      subject_code: 'matematik',
      target_count: 15,
      xp_reward: 150
    }
  } catch (error) {
    console.error('Task generation error:', error)
    // Fallback görev
    return {
      title: 'Günlük Pratik',
      description: 'Bugün 15 soru çözerek pratik yap!',
      subject_code: 'matematik',
      target_count: 15,
      xp_reward: 150
    }
  }
}

export async function generateAnalysisSummary(studentData: any): Promise<string> {
  const prompt = `
Sen bir eğitim koçusun. Öğrencinin performansını analiz et ve kısa bir özet yaz.

Öğrenci Verileri:
${JSON.stringify(studentData, null, 2)}

Kurallar:
- Maksimum 3-4 cümle
- Pozitif ve motive edici ol
- Somut öneriler ver
- Emoji kullanabilirsin

Türkçe yanıt ver.
`

  try {
    const result = await geminiModel.generateContent(prompt)
    const response = await result.response
    return response.text()
  } catch (error) {
    console.error('Analysis generation error:', error)
    return 'Performans analizi şu an yüklenemiyor. Soru çözmeye devam et!'
  }
}

