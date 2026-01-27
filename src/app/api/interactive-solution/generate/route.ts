import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { GoogleGenerativeAI } from '@google/generative-ai'

// Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Gemini client (opsiyonel - başarısız olursa fallback kullanılır)
let genAI: GoogleGenerativeAI | null = null
try {
  if (process.env.GEMINI_API_KEY) {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  }
} catch (e) {
  console.warn('Gemini API key bulunamadı, fallback kullanılacak')
}

// =================================================================
// GUIDED DISCOVERY STEP TYPES
// discover - Öğrenci keşfetsin (interaktif widget ile)
// solve    - Öğrenci çözsün (input, drag-drop ile)
// verify   - Sonucu doğrulasın (mini quiz)
// teach    - Kısa açıklama (TTS ile)
// celebrate - Başarı kutlaması
// =================================================================

// =================================================================
// FALLBACK: Gemini olmadan çalışan Guided Discovery üretici
// =================================================================
function generateFallbackSolution(
  questionText: string,
  explanation: string,
  options: Record<string, string>,
  correctAnswer: string,
  subjectName: string
) {
  const correctOptionText = options[correctAnswer] || correctAnswer
  const sentences = explanation.split(/[.!?]/).map(s => s.trim()).filter(s => s.length > 10)

  const steps: any[] = []

  // Step 1: teach - Soruyu tanıt
  steps.push({
    id: 'step_1',
    type: 'teach',
    title: 'Soruyu İnceleyelim',
    content: questionText.substring(0, 300) + (questionText.length > 300 ? '...' : ''),
    tts_text: 'Öncelikle sorumuzu birlikte inceleyelim. Dikkatli oku ve ne sorulduğunu anlamaya çalış.',
    duration_seconds: 5,
    animation_template: 'text_reveal',
    animation_data: { text: 'Soruyu Analiz Ediyoruz...', style: 'info', icon: '🔍' },
    interaction: { type: 'none', prompt: '', correct_value: null, hints: [], feedback_correct: '', feedback_wrong: '', max_attempts: 0 }
  })

  // Step 2: discover - Öğrenci düşünsün
  if (sentences.length > 0) {
    steps.push({
      id: 'step_2',
      type: 'discover',
      title: 'Keşfet',
      content: sentences[0] || 'Bu adımda çözümün ilk ipucunu keşfedeceksin.',
      tts_text: 'Şimdi soruyu çözmek için ilk adımı düşün. Ne yapman gerekiyor?',
      duration_seconds: 8,
      animation_template: 'step_by_step',
      animation_data: { steps: [{ text: sentences[0] || 'Çözüme başla', highlight: true }], current_step: 0 },
      interaction: {
        type: 'multiple_choice',
        prompt: 'Bu soruyu çözmek için ilk ne yapmalıyız?',
        correct_value: 'a',
        hints: [
          'Soruyu tekrar oku ve ne sorulduğunu bul.',
          'Verileri not al.',
          sentences[0] || 'Açıklamayı incele.'
        ],
        feedback_correct: 'Harika! Doğru yaklaşım.',
        feedback_wrong: 'Tekrar düşün. ' + (sentences[0] || ''),
        max_attempts: 3,
        options: [
          { id: 'a', text: sentences[0]?.substring(0, 80) || 'Verileri analiz edelim', is_correct: true },
          { id: 'b', text: 'Rastgele bir şık seçelim', is_correct: false },
          { id: 'c', text: 'Soruyu atlayalım', is_correct: false }
        ]
      }
    })
  }

  // Step 3-4: solve - Açıklama adımları
  sentences.slice(1, 3).forEach((sentence, i) => {
    steps.push({
      id: `step_${i + 3}`,
      type: 'solve',
      title: `Çöz - Adım ${i + 1}`,
      content: sentence,
      tts_text: sentence,
      duration_seconds: 8,
      animation_template: 'step_by_step',
      animation_data: { steps: sentences.slice(0, i + 2).map((s, j) => ({ text: s, highlight: j === i + 1 })), current_step: i + 1 },
      interaction: {
        type: 'number_input',
        prompt: `Bu adımın sonucunu yaz:`,
        correct_value: '',
        hints: [
          sentence,
          'İşlemleri adım adım yap.',
          'Sonucu kontrol et.'
        ],
        feedback_correct: 'Doğru! Devam edelim.',
        feedback_wrong: 'Doğru değil ama sorun yok, açıklamayı oku.',
        max_attempts: 3
      }
    })
  })

  // Step: verify - Quiz
  const quizOptions = Object.entries(options).map(([key, value]) => ({
    id: key.toLowerCase(),
    text: `${key}) ${value}`,
    is_correct: key === correctAnswer
  }))

  if (quizOptions.length > 0) {
    steps.push({
      id: 'step_verify',
      type: 'verify',
      title: 'Cevabını Doğrula',
      content: 'Artık sorunun cevabını biliyorsun. Doğru şıkkı seç!',
      tts_text: 'Şimdi cevabını doğrula. Doğru şıkkı seç!',
      duration_seconds: 10,
      animation_template: 'text_reveal',
      animation_data: { text: 'Sıra Sende!', style: 'warning', icon: '🤔' },
      interaction: {
        type: 'multiple_choice',
        prompt: 'Doğru cevap hangisi?',
        correct_value: correctAnswer.toLowerCase(),
        hints: [
          'Çözüm adımlarını tekrar düşün.',
          sentences[0] || 'Açıklamayı hatırla.',
          `Cevap ${correctAnswer} şıkkıdır.`
        ],
        feedback_correct: 'Mükemmel! Doğru cevap! 🎉',
        feedback_wrong: `Doğru cevap ${correctAnswer} şıkkıydı: ${correctOptionText}`,
        max_attempts: 2,
        options: quizOptions
      }
    })
  }

  // Step: celebrate
  steps.push({
    id: 'step_celebrate',
    type: 'celebrate',
    title: 'Tebrikler!',
    content: `Doğru Cevap: ${correctAnswer} şıkkı (${correctOptionText})`,
    tts_text: `Harika iş çıkardın! Doğru cevap ${correctAnswer} şıkkı, yani ${correctOptionText}. Çözümü başarıyla tamamladın!`,
    duration_seconds: 5,
    animation_template: 'text_reveal',
    animation_data: { text: `Cevap: ${correctAnswer} ✅`, style: 'celebration', icon: '🎉' },
    interaction: { type: 'none', prompt: '', correct_value: null, hints: [], feedback_correct: '', feedback_wrong: '', max_attempts: 0 }
  })

  const solution = {
    question_summary: questionText.substring(0, 100),
    difficulty: 'medium' as const,
    estimated_time_seconds: steps.length * 8,
    steps,
    summary: `Doğru cevap: ${correctAnswer} şıkkı (${correctOptionText})`,
    key_concepts: [subjectName],
    common_mistakes: []
  }

  return solution
}

// =================================================================
// GEMINİ İLE GUIDED DISCOVERY ADIM ÜRETME
// =================================================================
const GUIDED_DISCOVERY_PROMPT = `Sen bir eğitim içeriği uzmanısın. "Guided Discovery" (Rehberli Keşif) yöntemiyle interaktif çözüm adımları üreteceksin.

ÖNEMLİ: Öğrenci pasif dinlemek yerine AKTİF OLARAK her adımda bir şey yapacak!

ADIM TİPLERİ:
- discover: Öğrenci bir kavramı KEŞFETSİN (slider, drag_drop, match_pairs ile)
- solve: Öğrenci ÇÖZSÜN (number_input, fill_blank ile)
- verify: Sonucu DOĞRULASIN (multiple_choice ile)
- teach: Kısa açıklama (widget yok, sadece TTS)
- celebrate: Kutlama (son adım)

WIDGET TİPLERİ (her adımda BİRİ olmalı):
- slider: Değer seçme (min, max, step, correct_value)
- number_input: Sayı yazma (correct_value, tolerance)
- fill_blank: Boşluk doldur (template: "__ x __ = 360", correct_values: ["3", "120"])
- multiple_choice: Çoktan seçmeli (options: [{id, text, is_correct}])
- drag_drop: Sürükle bırak SIRALAMA (items: [...], correct_order: [...]) - sadece sıralama için!
- category_sort: Kategoriye ayır (items: [...], categories: [...], correct_mapping: {"item": "category"}) - kelimeleri/öğeleri kategorilere ayırmak için!
- match_pairs: Eşleştir (pairs: [{left, right}])
- order_steps: Adımları sırala (items: [...], correct_order: [...])
- none: Widget yok (sadece teach ve celebrate için)

ANİMASYON ŞABLONLARI (her adımda birini seç):
- equation_balance: Terazi (denklem çözümü) → data: {left_side, right_side, steps: [{operation, value, result_left, result_right}]}
- number_line: Sayı doğrusu → data: {min, max, points: [{value, label, color}], highlight_range: {start, end}}
- pie_chart: Pasta grafik → data: {total, segments: [{label, value, color}], highlight_segment}
- bar_chart: Çubuk grafik → data: {bars: [{label, value, color}], max_value, highlight_bar}
- step_by_step: Adım listesi → data: {steps: [{text, highlight}], current_step}
- text_reveal: Metin gösterim → data: {text, style: "info"|"warning"|"celebration", icon}
- coordinate_plane: Koordinat → data: {x_range, y_range, points: [{x, y, label}]}
- geometry_shape: Geometri → data: {shape, vertices: [{x,y}], labels: {sides, angles}, measurements}
- none: Animasyon yok

JSON FORMATI:
{
  "steps": [
    {
      "id": "step_1",
      "type": "teach|discover|solve|verify|celebrate",
      "title": "Kısa başlık",
      "content": "Açıklama metni",
      "tts_text": "Sesli anlatım (doğal, samimi, motive edici)",
      "animation_template": "şablon_adı",
      "animation_data": { /* şablona göre veri */ },
      "interaction": {
        "type": "widget_tipi",
        "prompt": "Öğrenciye soru/görev",
        "correct_value": "doğru cevap",
        "hints": ["İpucu 1", "İpucu 2", "İpucu 3"],
        "feedback_correct": "Aferin mesajı",
        "feedback_wrong": "Yanlış mesajı + ipucu",
        "max_attempts": 3,
        // Widget'a özel alanlar:
        "min": 0, "max": 100, "step": 1,
        "tolerance": 0,
        "template": "__ + __ = 10",
        "correct_values": ["3", "7"],
        "options": [{"id": "a", "text": "Seçenek", "is_correct": true}],
        "items": ["A", "B", "C"],
        "correct_order": ["B", "A", "C"],
        "pairs": [{"left": "X", "right": "Y"}],
        "categories": ["Kategori1", "Kategori2"],
        "correct_mapping": {"A": "Kategori1", "B": "Kategori2"}
      }
    }
  ],
  "summary": "Özet"
}

KURALLAR:
1. İlk adım her zaman "teach" - soruyu tanıt
2. Son adım her zaman "celebrate" - kutlama
3. Arada en az 2-3 interaktif adım (discover/solve/verify)
4. Her interaktif adımda 3 ipucu olsun
5. Feedback mesajları motive edici olsun
6. TTS metinleri doğal konuşma dili, samimi
7. Widget seçimi soruya uygun olsun (matematik=number_input, sıralama=order_steps, vb.)
8. Toplam 4-7 adım olsun
9. Doğru cevabı açıkça belirt
10. teach ve celebrate adımlarında interaction.type = "none" olsun
11. Her adıma SORUYLA İLGİLİ animasyon şablonu seç (matematik=equation_balance/number_line/step_by_step, geometri=geometry_shape, veri=bar_chart/pie_chart, genel=text_reveal)
12. animation_data'yı şablona uygun doldur (boş bırakma!)
13. celebrate adımında animation_template = "text_reveal", animation_data = {text: "Tebrikler!", style: "celebration", icon: "🎉"} kullan`

async function generateWithGemini(
  questionText: string,
  explanation: string,
  options: Record<string, string>,
  correctAnswer: string
) {
  if (!genAI) return null

  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash-exp',
      generationConfig: { temperature: 0.6, maxOutputTokens: 6000 }
    })

    let optionsText = ''
    for (const [key, value] of Object.entries(options)) {
      if (value) optionsText += `${key}) ${value}\n`
    }

    const prompt = `SORU: ${questionText}

AÇIKLAMA: ${explanation}

ŞIKLAR:
${optionsText}

DOĞRU CEVAP: ${correctAnswer} şıkkı

Bu soruyu "Guided Discovery" yöntemiyle 4-7 adıma böl. Her adımda öğrenci AKTİF olarak bir şey yapsın. JSON döndür.`

    const result = await model.generateContent([
      { text: GUIDED_DISCOVERY_PROMPT },
      { text: prompt }
    ])

    const responseText = result.response.text()
    const jsonStr = responseText
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim()

    const data = JSON.parse(jsonStr)

    // Eksik alanları doldur
    if (data.steps) {
      data.steps = data.steps.map((step: any, i: number) => ({
        id: step.id || `step_${i + 1}`,
        type: step.type || 'teach',
        title: step.title || `Adım ${i + 1}`,
        content: step.content || '',
        tts_text: step.tts_text || step.content || '',
        duration_seconds: step.duration_seconds || 8,
        animation_template: step.animation_template || 'text_reveal',
        animation_data: step.animation_data || { text: step.content || step.title || '...', style: 'info' },
        interaction: {
          type: step.interaction?.type || 'none',
          prompt: step.interaction?.prompt || '',
          correct_value: step.interaction?.correct_value ?? null,
          hints: step.interaction?.hints || [],
          feedback_correct: step.interaction?.feedback_correct || 'Doğru!',
          feedback_wrong: step.interaction?.feedback_wrong || 'Tekrar dene.',
          max_attempts: step.interaction?.max_attempts || 3,
          // Widget-specific
          min: step.interaction?.min,
          max: step.interaction?.max,
          step: step.interaction?.step,
          tolerance: step.interaction?.tolerance,
          template: step.interaction?.template,
          correct_values: step.interaction?.correct_values,
          options: step.interaction?.options,
          items: step.interaction?.items,
          correct_order: step.interaction?.correct_order,
          pairs: step.interaction?.pairs,
          categories: step.interaction?.categories,
          correct_mapping: step.interaction?.correct_mapping,
        }
      }))
    }

    return {
      question_summary: questionText.substring(0, 100),
      difficulty: data.difficulty || 'medium',
      estimated_time_seconds: (data.steps?.length || 5) * 8,
      steps: data.steps || [],
      summary: data.summary || `Doğru cevap: ${correctAnswer}`,
      key_concepts: data.key_concepts || [],
      common_mistakes: data.common_mistakes || []
    }
  } catch (e) {
    console.error('Gemini hatası:', e)
    return null
  }
}

// =================================================================
// ANA API ENDPOINT
// =================================================================
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      question_id,
      question_text,
      subject_name,
      options = {},
      correct_answer = '',
      explanation = '',
      force_regenerate = false
    } = body

    if (!question_text) {
      return NextResponse.json({ error: 'question_text gerekli' }, { status: 400 })
    }

    // 1. Cache kontrol (force değilse)
    if (question_id && !force_regenerate) {
      // Önce questions tablosundan kontrol
      const { data: questionData } = await supabase
        .from('questions')
        .select('interactive_solution_id, interactive_solution_status, explanation, options, correct_answer')
        .eq('id', question_id)
        .single()

      if (questionData?.interactive_solution_status === 'completed' && questionData?.interactive_solution_id) {
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
            solution: existing.solution_data || existing
          })
        }
      }

      // Soru bilgilerini al (explanation, options, correct_answer)
      if (questionData) {
        if (!explanation && questionData.explanation) {
          body.explanation = questionData.explanation
        }
        if (Object.keys(options).length === 0 && questionData.options) {
          body.options = questionData.options
        }
        if (!correct_answer && questionData.correct_answer) {
          body.correct_answer = questionData.correct_answer
        }
      }
    }

    // 2. Çözüm üret (Guided Discovery formatında)
    console.log(`🔄 Generating guided discovery for: ${question_id || 'demo'}`)

    const finalExplanation = body.explanation || explanation || ''
    const finalOptions = body.options || options || {}
    const finalCorrectAnswer = body.correct_answer || correct_answer || ''

    let solutionData = null

    // Önce Gemini dene
    if (finalExplanation && genAI) {
      console.log('📝 Gemini ile Guided Discovery adımları üretiliyor...')
      solutionData = await generateWithGemini(
        question_text,
        finalExplanation,
        finalOptions,
        finalCorrectAnswer
      )
    }

    // Gemini başarısız olduysa FALLBACK kullan
    if (!solutionData || !solutionData.steps || solutionData.steps.length === 0) {
      console.log('⚡ Fallback Guided Discovery kullanılıyor...')
      solutionData = generateFallbackSolution(
        question_text,
        finalExplanation || 'Bu sorunun çözümü için adımları takip edin.',
        finalOptions,
        finalCorrectAnswer,
        subject_name || 'Genel'
      )
    }

    // 3. Veritabanına kaydet
    if (question_id && solutionData) {
      const { data: saved, error: saveError } = await supabase
        .from('interactive_solutions')
        .upsert({
          question_id,
          question_text,
          subject_name: subject_name || 'Genel',
          solution_data: solutionData,
          version: 2, // v2 = Guided Discovery
          is_active: true
        }, { onConflict: 'question_id' })
        .select()
        .single()

      if (saved) {
        await supabase
          .from('questions')
          .update({
            interactive_solution_id: saved.id,
            interactive_solution_status: 'completed'
          })
          .eq('id', question_id)

        // Typesense güncelle (background)
        fetch(`${process.env.NEXT_PUBLIC_APP_URL || ''}/api/admin/questions/sync`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'upsert', questionId: question_id })
        }).catch(() => {})
      }

      if (saveError) {
        console.error('Kayıt hatası:', saveError)
      }
    }

    return NextResponse.json({
      success: true,
      source: 'generated',
      solution: solutionData
    })

  } catch (error) {
    console.error('API Hatası:', error)
    return NextResponse.json({
      error: 'Sunucu hatası',
      details: error instanceof Error ? error.message : 'Bilinmeyen hata'
    }, { status: 500 })
  }
}
