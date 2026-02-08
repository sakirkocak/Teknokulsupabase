import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { createClient } from '@supabase/supabase-js'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const { resultId } = await req.json()

    if (!resultId) {
      return NextResponse.json({ error: 'resultId gerekli' }, { status: 400 })
    }

    // Sonuc bilgisini al
    const { data: result } = await supabaseAdmin
      .from('mock_exam_results')
      .select('*, mock_exams(title, exam_type, grade)')
      .eq('id', resultId)
      .single()

    if (!result) {
      return NextResponse.json({ error: 'Sonuc bulunamadi' }, { status: 404 })
    }

    const netBreakdown = result.net_breakdown || {}
    const examTitle = (result as any).mock_exams?.title || 'Deneme Sinavi'
    const grade = (result as any).mock_exams?.grade || 8

    // AI analiz prompt
    const prompt = `Sen bir egitim danismanisin. Asagidaki deneme sinavi sonucunu analiz et ve Turkce olarak ogrenciye kisisellestirilmis tavsiyeler ver.

Sinav: ${examTitle}
Sinif: ${grade}. Sinif
Toplam Puan: ${result.score}/500
Toplam Net: ${result.total_net}

Ders Bazli Sonuclar:
${Object.entries(netBreakdown).map(([subject, detail]: [string, any]) =>
  `- ${subject}: ${detail.dogru}D/${detail.yanlis}Y/${detail.bos}B = ${detail.net} Net`
).join('\n')}

Lütfen su formatta yanit ver (JSON):
{
  "overallAssessment": "Genel degerlendirme (2-3 cumle)",
  "priorityTopics": ["Oncelikli calisma konulari (3-5 adet)"],
  "strengths": ["Guclu yonler (2-3 adet)"],
  "weaknesses": ["Gelistirilmesi gereken yonler (2-3 adet)"],
  "studyPlan": "Haftalik calisma onerisi (3-4 cumle)",
  "motivationalMessage": "Motivasyon mesaji (1-2 cumle)"
}`

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })
    const aiResult = await model.generateContent(prompt)
    const text = aiResult.response.text()

    // JSON'u parse et
    let analysis
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      analysis = jsonMatch ? JSON.parse(jsonMatch[0]) : { overallAssessment: text }
    } catch {
      analysis = { overallAssessment: text }
    }

    return NextResponse.json({ analysis })
  } catch (error: any) {
    console.error('AI analysis error:', error)
    return NextResponse.json({ error: 'AI analiz yapilamadi' }, { status: 500 })
  }
}
