import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { GoogleGenerativeAI } from '@google/generative-ai'

// Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Gemini client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

// İnteraktif çözüm JSON şeması
const SOLUTION_SCHEMA = `{
  "question_summary": "Sorunun kısa özeti",
  "difficulty": "easy|medium|hard",
  "estimated_time_seconds": 120,
  "steps": [
    {
      "id": "step_1",
      "type": "explanation|calculation|visualization|quiz|result",
      "title": "Adım başlığı",
      "content": "Adım açıklaması (Markdown destekli)",
      "tts_text": "Sesli anlatım metni (doğal, konuşma dili)",
      "duration_seconds": 8,
      "animation_template": "equation_balance|number_line|pie_chart|bar_graph|coordinate_plane|geometry_shape|text_reveal|step_by_step|none",
      "animation_data": {
        // Template'e göre değişen veri
      },
      "quiz": {
        // Sadece type: "quiz" için
        "question": "Soru metni",
        "options": [
          {"id": "a", "text": "Seçenek A", "is_correct": false},
          {"id": "b", "text": "Seçenek B", "is_correct": true}
        ],
        "hint": "İpucu metni",
        "explanation_correct": "Doğru cevap açıklaması",
        "explanation_wrong": "Yanlış cevap açıklaması"
      }
    }
  ],
  "summary": "Çözüm özeti",
  "key_concepts": ["Kavram 1", "Kavram 2"],
  "common_mistakes": ["Sık yapılan hata 1"]
}`

const SYSTEM_PROMPT = `Sen bir matematik ve fen bilimleri öğretmenisin. Verilen soruyu analiz edip, 
öğrencinin interaktif olarak çözeceği adımları JSON formatında üreteceksin.

KURALLAR:
1. Her çözüm 4-8 adım içermeli
2. En az 1-2 "quiz" tipi adım olmalı (öğrenci tahmin etsin)
3. TTS metinleri doğal konuşma dili olmalı (robotik değil)
4. Animation template'leri akıllıca seç:
   - Denklemler → equation_balance
   - Kesirler → pie_chart  
   - Grafikler → coordinate_plane
   - Geometri → geometry_shape
   - Sayı doğrusu → number_line
5. Quiz soruları çözümün kritik noktalarında olmalı
6. Türkçe ve anlaşılır ol

ANIMATION DATA ÖRNEKLERİ:

equation_balance için:
{
  "left_side": "2x + 3",
  "right_side": "7",
  "steps": [
    {"operation": "subtract", "value": "3", "result_left": "2x", "result_right": "4"},
    {"operation": "divide", "value": "2", "result_left": "x", "result_right": "2"}
  ]
}

pie_chart için:
{
  "total": 100,
  "segments": [
    {"label": "Kırmızı", "value": 30, "color": "#ef4444"},
    {"label": "Mavi", "value": 70, "color": "#3b82f6"}
  ],
  "highlight_segment": 0
}

number_line için:
{
  "min": -10,
  "max": 10,
  "points": [
    {"value": 3, "label": "A", "color": "#22c55e"},
    {"value": -2, "label": "B", "color": "#ef4444"}
  ],
  "highlight_range": {"start": -2, "end": 3}
}

coordinate_plane için:
{
  "x_range": [-5, 5],
  "y_range": [-5, 5],
  "points": [{"x": 2, "y": 3, "label": "P"}],
  "lines": [{"equation": "y = 2x + 1", "color": "#3b82f6"}],
  "shapes": []
}

geometry_shape için:
{
  "shape": "triangle|rectangle|circle|polygon",
  "vertices": [{"x": 0, "y": 0}, {"x": 4, "y": 0}, {"x": 2, "y": 3}],
  "labels": {"sides": ["a", "b", "c"], "angles": ["A", "B", "C"]},
  "measurements": {"side_a": 5, "angle_A": 60}
}

JSON ŞEMASI:
${SOLUTION_SCHEMA}

SADECE JSON döndür, başka açıklama yazma.`

export async function POST(request: NextRequest) {
  try {
    const { question_id, question_text, subject_name, force_regenerate } = await request.json()

    if (!question_text) {
      return NextResponse.json({ error: 'question_text gerekli' }, { status: 400 })
    }

    // Önce mevcut çözüm var mı kontrol et
    if (question_id && !force_regenerate) {
      const { data: existing } = await supabase
        .from('interactive_solutions')
        .select('*')
        .eq('question_id', question_id)
        .single()

      if (existing) {
        return NextResponse.json({
          success: true,
          source: 'cache',
          solution: existing
        })
      }
    }

    // Gemini ile çözüm üret
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.0-flash-exp',
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 4096,
      }
    })

    const prompt = `SORU: ${question_text}
${subject_name ? `DERS: ${subject_name}` : ''}

Bu soruyu interaktif adımlarla çöz ve JSON formatında döndür.`

    const result = await model.generateContent([
      { text: SYSTEM_PROMPT },
      { text: prompt }
    ])

    const responseText = result.response.text()
    
    // JSON'u parse et (```json bloklarını temizle)
    let jsonStr = responseText
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim()

    let solutionData
    try {
      solutionData = JSON.parse(jsonStr)
    } catch (parseError) {
      console.error('JSON parse hatası:', parseError)
      return NextResponse.json({ 
        error: 'Gemini geçersiz JSON döndürdü',
        raw_response: responseText.substring(0, 500)
      }, { status: 500 })
    }

    // Veritabanına kaydet
    const solutionRecord = {
      question_id: question_id || null,
      question_text: question_text,
      subject_name: subject_name || null,
      solution_data: solutionData,
      version: 1,
      is_active: true,
      created_at: new Date().toISOString()
    }

    const { data: savedSolution, error: saveError } = await supabase
      .from('interactive_solutions')
      .upsert(solutionRecord, { 
        onConflict: 'question_id',
        ignoreDuplicates: false 
      })
      .select()
      .single()

    if (saveError) {
      console.error('Kayıt hatası:', saveError)
      // Kayıt başarısız olsa bile çözümü döndür
      return NextResponse.json({
        success: true,
        source: 'generated',
        saved: false,
        solution: {
          ...solutionRecord,
          solution_data: solutionData
        }
      })
    }

    return NextResponse.json({
      success: true,
      source: 'generated',
      saved: true,
      solution: savedSolution
    })

  } catch (error) {
    console.error('Interactive solution hatası:', error)
    return NextResponse.json({ 
      error: 'Çözüm üretilemedi',
      details: error instanceof Error ? error.message : 'Bilinmeyen hata'
    }, { status: 500 })
  }
}

// GET: Mevcut çözümü getir
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const questionId = searchParams.get('question_id')

  if (!questionId) {
    return NextResponse.json({ error: 'question_id gerekli' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('interactive_solutions')
    .select('*')
    .eq('question_id', questionId)
    .eq('is_active', true)
    .single()

  if (error || !data) {
    return NextResponse.json({ error: 'Çözüm bulunamadı' }, { status: 404 })
  }

  return NextResponse.json({ success: true, solution: data })
}
