import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { processLatexInSolution, validateAnimationData } from '@/lib/latex-processor'

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

const SYSTEM_PROMPT = `Sen deneyimli bir matematik ve fen bilimleri öğretmenisin. Verilen soruyu analiz edip,
öğrencinin interaktif olarak çözeceği GÖRSEL ZENGİN adımları JSON formatında üreteceksin.

🎯 ANA HEDEF: Her adımda mutlaka bir animasyon olmalı! Öğrenci sadece metin okumak yerine, görsel animasyonlarla öğrenmeli.

KURALLAR:
1. Her çözüm 5-8 adım içermeli
2. En az 2-3 "quiz" tipi adım olmalı (öğrenci tahmin etsin, oyunlaştırma!)
3. HER ADIMDA BİR ANİMASYON OLMALI - "none" kullanma!
4. TTS metinleri doğal, samimi ve motive edici olmalı
5. Çözümü adım adım görselleştir - soyut bırakma

ANİMASYON SEÇİM REHBERİ (Soruya göre en uygununu seç):
- Denklem çözme → equation_balance (terazi animasyonu)
- Kesir/yüzde → pie_chart (pasta grafik)
- Sayı karşılaştırma → number_line (sayı doğrusu)
- Fonksiyon/grafik → coordinate_plane (koordinat düzlemi)
- Geometri (üçgen, kare, daire) → geometry_shape
- Adım adım işlem → step_by_step (liste animasyonu)
- Sonuç/özet → text_reveal (metin animasyonu)

ÖNEMLİ: Soru ne olursa olsun, her adımda görsel bir animasyon kullan!
- Metin açıklaması için bile text_reveal kullan
- İşlem adımları için step_by_step kullan
- Sonuç için equation_balance veya text_reveal kullan

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

step_by_step için (adım adım işlemler):
{
  "steps": [
    {"text": "Verilen: 2x + 5 = 13", "highlight": true},
    {"text": "Her iki taraftan 5 çıkar", "highlight": false},
    {"text": "2x = 8", "highlight": true},
    {"text": "Her iki tarafı 2'ye böl", "highlight": false},
    {"text": "x = 4 ✓", "highlight": true}
  ],
  "current_step": 0
}

text_reveal için (metin animasyonu):
{
  "text": "Cevap: x = 4",
  "style": "success|info|warning|celebration",
  "icon": "🎉|✅|💡|🔥"
}

bar_chart için (çubuk grafik):
{
  "bars": [
    {"label": "Ocak", "value": 45, "color": "#3b82f6"},
    {"label": "Şubat", "value": 62, "color": "#22c55e"},
    {"label": "Mart", "value": 38, "color": "#f59e0b"}
  ],
  "max_value": 100,
  "highlight_bar": 1
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

    // ✅ CACHE: Önce mevcut çözüm var mı kontrol et
    if (question_id && !force_regenerate) {
      // 1. questions tablosundan kontrol et (daha hızlı)
      const { data: questionData } = await supabase
        .from('questions')
        .select('interactive_solution_id, interactive_solution_status')
        .eq('id', question_id)
        .single()

      if (questionData?.interactive_solution_status === 'completed' && questionData?.interactive_solution_id) {
        // 2. interactive_solutions'dan çözümü çek
        const { data: existing } = await supabase
          .from('interactive_solutions')
          .select('*')
          .eq('id', questionData.interactive_solution_id)
          .single()

        if (existing) {
          console.log(`✅ Cache hit: ${question_id}`)
          return NextResponse.json({
            success: true,
            source: 'cache',
            solution: existing
          })
        }
      }

      // 3. Belki question_id ile doğrudan kayıtlı
      const { data: existing } = await supabase
        .from('interactive_solutions')
        .select('*')
        .eq('question_id', question_id)
        .single()

      if (existing) {
        // questions tablosunu güncelle
        await supabase
          .from('questions')
          .update({ 
            interactive_solution_id: existing.id,
            interactive_solution_status: 'completed'
          })
          .eq('id', question_id)

        console.log(`✅ Cache hit (fixed): ${question_id}`)
        return NextResponse.json({
          success: true,
          source: 'cache',
          solution: existing
        })
      }
    }

    console.log(`🔄 Generating new solution for: ${question_id || 'demo'}`)

    // Gemini ile çözüm üret (Pro model - daha kaliteli çıktı)
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-3-pro-preview',
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 8192,
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
      
      // 🔧 POST-PROCESS: LaTeX ve animasyon düzeltmeleri
      solutionData = processLatexInSolution(solutionData)
      
      // Her adımın animasyon datasını validate et
      if (solutionData.steps && Array.isArray(solutionData.steps)) {
        solutionData.steps = solutionData.steps.map((step: any) => ({
          ...step,
          animation_data: validateAnimationData(step.animation_template, step.animation_data)
        }))
      }
      
      console.log('✅ Solution post-processed successfully')
    } catch (parseError) {
      console.error('JSON parse hatası:', parseError)
      
      // questions tablosunu failed olarak işaretle
      if (question_id) {
        await supabase
          .from('questions')
          .update({ interactive_solution_status: 'failed' })
          .eq('id', question_id)
      }
      
      return NextResponse.json({ 
        error: 'Gemini geçersiz JSON döndürdü',
        raw_response: responseText.substring(0, 500)
      }, { status: 500 })
    }

    // ✅ Veritabanına kaydet
    const { data: savedSolution, error: saveError } = await supabase
      .from('interactive_solutions')
      .insert({
        question_id: question_id || null,
        question_text: question_text,
        subject_name: subject_name || null,
        solution_data: solutionData,
        version: 1,
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (saveError) {
      console.error('Kayıt hatası:', saveError)
      return NextResponse.json({
        success: true,
        source: 'generated',
        saved: false,
        solution: {
          question_id,
          solution_data: solutionData
        }
      })
    }

    // ✅ questions tablosunu güncelle
    if (question_id && savedSolution) {
      await supabase
        .from('questions')
        .update({ 
          interactive_solution_id: savedSolution.id,
          interactive_solution_status: 'completed'
        })
        .eq('id', question_id)
      
      console.log(`✅ Solution saved and linked: ${question_id}`)

      // 🔄 Typesense'i güncelle (arka planda)
      try {
        fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/admin/questions/sync`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ questionId: question_id, action: 'upsert' })
        }).catch(() => {}) // Fire and forget
        console.log(`🔄 Typesense sync triggered: ${question_id}`)
      } catch {
        // Typesense sync hatası kritik değil
      }
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
