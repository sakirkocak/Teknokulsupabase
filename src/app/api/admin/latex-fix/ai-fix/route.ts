import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Auth kontrolü
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Admin kontrolü
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    
    if (profile?.role !== 'admin' && profile?.role !== 'ogretmen') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    
    const body = await request.json()
    const { questionId, questionText, explanation, options } = body
    
    if (!questionId) {
      return NextResponse.json({ error: 'questionId is required' }, { status: 400 })
    }
    
    // Gemini ile düzeltme yap
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' })
    
    const prompt = `Sen bir LaTeX düzeltme uzmanısın. Aşağıdaki matematik sorusundaki LaTeX formatını düzelt.

KURALLAR:
1. Sadece LaTeX syntax hatalarını düzelt, içeriği DEĞİŞTİRME
2. Eksik backslash'leri ekle (örn: "frac{" -> "\\frac{", "sqrt{" -> "\\sqrt{")
3. Eksik $ işaretlerini ekle (inline math için $...$ kullan)
4. Fazla backslash'leri temizle (örn: \\\\\\\\ -> \\\\)
5. Bozuk Greek harfleri düzelt (örn: "alpha" -> "\\alpha")
6. Bozuk operatörleri düzelt (örn: "times" -> "\\times", "div" -> "\\div")
7. Eğer metin zaten doğruysa, olduğu gibi bırak
8. Türkçe karakterleri ve normal metni KORU

SORU METNİ:
${questionText || '(boş)'}

AÇIKLAMA:
${explanation || '(boş)'}

ŞIKLAR (JSON):
${options ? JSON.stringify(options, null, 2) : '(boş)'}

Yanıtını SADECE aşağıdaki JSON formatında ver, başka hiçbir şey yazma:
{
  "fixed_question_text": "düzeltilmiş soru metni",
  "fixed_explanation": "düzeltilmiş açıklama",
  "fixed_options": { "A": "...", "B": "...", "C": "...", "D": "...", "E": "..." },
  "changes_made": ["yapılan değişiklik 1", "yapılan değişiklik 2"]
}

Eğer düzeltme gerekmiyorsa, orijinal metinleri aynen döndür ve changes_made'i boş array yap.`

    const result = await model.generateContent(prompt)
    const responseText = result.response.text()
    
    // JSON'u parse et
    let fixedData
    try {
      // Markdown code block'u temizle
      const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, responseText]
      const cleanJson = (jsonMatch[1] || responseText).trim()
      fixedData = JSON.parse(cleanJson)
    } catch (parseError) {
      console.error('JSON parse error:', parseError, 'Response:', responseText)
      return NextResponse.json({ 
        error: 'AI yanıtı parse edilemedi',
        rawResponse: responseText.substring(0, 500)
      }, { status: 500 })
    }
    
    return NextResponse.json({
      success: true,
      questionId,
      original: {
        question_text: questionText,
        explanation,
        options
      },
      fixed: {
        question_text: fixedData.fixed_question_text,
        explanation: fixedData.fixed_explanation,
        options: fixedData.fixed_options
      },
      changes: fixedData.changes_made || []
    })
    
  } catch (error: any) {
    console.error('AI Fix API error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
