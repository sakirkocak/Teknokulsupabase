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
// FALLBACK: Gemini olmadan çalışan basit çözüm üretici
// =================================================================
function generateFallbackSolution(
  questionText: string,
  explanation: string,
  options: Record<string, string>,
  correctAnswer: string,
  subjectName: string
) {
  const correctOptionText = options[correctAnswer] || correctAnswer

  // Açıklamayı cümlelere böl
  const sentences = explanation
    .split(/[.!?]/)
    .map(s => s.trim())
    .filter(s => s.length > 10)

  const steps: any[] = []
  
  // Adım 1: Soruyu tanıt
  steps.push({
    id: 'step_1',
    type: 'explanation',
    title: '📖 Soruyu İnceleyelim',
    content: questionText.substring(0, 200) + (questionText.length > 200 ? '...' : ''),
    tts_text: 'Öncelikle sorumuzu birlikte inceleyelim.',
    duration_seconds: 5,
    animation_template: 'text_reveal',
    animation_data: { text: 'Soruyu Analiz Ediyoruz...', style: 'info', icon: '🔍' }
  })

  // Adım 2-4: Açıklama cümlelerini adımlara dönüştür
  sentences.slice(0, 3).forEach((sentence, i) => {
    steps.push({
      id: `step_${i + 2}`,
      type: 'calculation',
      title: `📝 Adım ${i + 1}`,
      content: sentence,
      tts_text: sentence,
      duration_seconds: 6,
      animation_template: 'step_by_step',
      animation_data: {
        steps: [{ text: sentence, highlight: true }],
        current_step: 0
      }
    })
  })

  // Quiz adımı
  const quizOptions = Object.entries(options).map(([key, value]) => ({
    id: key.toLowerCase(),
    text: `${key}) ${value}`,
    is_correct: key === correctAnswer
  }))

  if (quizOptions.length > 0) {
    steps.push({
      id: `step_quiz`,
      type: 'quiz',
      title: '❓ Sıra Sende!',
      content: 'Şimdi sen tahmin et!',
      tts_text: 'Şimdi videoyu durdur ve cevabı bulmaya çalış!',
      duration_seconds: 10,
      animation_template: 'text_reveal',
      animation_data: { text: 'Düşün...', style: 'warning', icon: '🤔' },
      quiz: {
        question: 'Bu sorunun cevabı hangisi?',
        options: quizOptions,
        hint: 'Açıklamayı tekrar oku',
        explanation_correct: 'Harika! Doğru bildin!',
        explanation_wrong: `Doğru cevap ${correctAnswer} şıkkıydı.`
      }
    })
  }

  // Son adım: Cevap
  steps.push({
    id: 'step_final',
    type: 'result',
    title: '✅ Sonuç',
    content: `Doğru Cevap: ${correctAnswer} şıkkı (${correctOptionText})`,
    tts_text: `Doğru cevap ${correctAnswer} şıkkı, yani ${correctOptionText}.`,
    duration_seconds: 5,
    animation_template: 'text_reveal',
    animation_data: { 
      text: `Cevap: ${correctAnswer} ✅`, 
      style: 'celebration', 
      icon: '🎉' 
    }
  })

  return {
    question_summary: questionText.substring(0, 100),
    difficulty: 'medium',
    estimated_time_seconds: steps.length * 6,
    steps,
    summary: `Doğru cevap: ${correctAnswer} şıkkı (${correctOptionText})`,
    key_concepts: [subjectName],
    common_mistakes: []
  }
}

// =================================================================
// GEMINİ İLE GELİŞMİŞ ADIM ÜRETME (Var olan explanation'ı kullanır)
// =================================================================
const SIMPLE_PROMPT = `Sen bir eğitim içeriği düzenleyicisisin. Sana verilen AÇIKLAMA metnini interaktif adımlara dönüştür.

KURAL: Yeni çözüm ÜRETME! Sadece var olan açıklamayı adımlara BÖL ve animasyon şablonu seç.

ŞABLONLAR:
- equation_balance: Denklem çözümü için terazi
- number_line: Sayı karşılaştırma
- pie_chart: Kesir/yüzde
- bar_chart: Veri karşılaştırma
- step_by_step: Adım adım işlem listesi
- text_reveal: Metin gösterimi
- coordinate_plane: Grafik/fonksiyon
- geometry_shape: Geometri şekilleri

JSON FORMATI:
{
  "steps": [
    {
      "id": "step_1",
      "type": "explanation|calculation|quiz|result",
      "title": "Kısa başlık",
      "content": "Açıklama metni",
      "tts_text": "Sesli anlatım (doğal, samimi)",
      "animation_template": "şablon_adı",
      "animation_data": { /* şablona göre veri */ }
    }
  ],
  "summary": "Özet ve doğru cevap"
}

ÖNEMLİ:
- Son adımda DOĞRU CEVABI açıkça yaz!
- Her adımda animasyon olsun
- TTS metinleri doğal konuşma dili olsun`

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
      generationConfig: { temperature: 0.5, maxOutputTokens: 4096 }
    })

    let optionsText = ''
    for (const [key, value] of Object.entries(options)) {
      if (value) optionsText += `${key}) ${value}\n`
    }

    const prompt = `SORU: ${questionText}

AÇIKLAMA (bunu adımlara böl): ${explanation}

ŞIKLAR:
${optionsText}

DOĞRU CEVAP: ${correctAnswer} şıkkı

Bu açıklamayı 4-6 adıma böl ve JSON döndür.`

    const result = await model.generateContent([
      { text: SIMPLE_PROMPT },
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
        type: step.type || 'explanation',
        title: step.title || `Adım ${i + 1}`,
        content: step.content || '',
        tts_text: step.tts_text || step.content || '',
        duration_seconds: step.duration_seconds || 6,
        animation_template: step.animation_template || 'text_reveal',
        animation_data: step.animation_data || { text: step.content, style: 'info' },
        quiz: step.quiz
      }))
    }

    return {
      question_summary: questionText.substring(0, 100),
      difficulty: data.difficulty || 'medium',
      estimated_time_seconds: (data.steps?.length || 5) * 6,
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
        // Eğer body'de yoksa veritabanından al
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

    // 2. Çözüm üret
    console.log(`🔄 Generating solution for: ${question_id || 'demo'}`)

    const finalExplanation = body.explanation || explanation || ''
    const finalOptions = body.options || options || {}
    const finalCorrectAnswer = body.correct_answer || correct_answer || ''

    let solutionData = null

    // Önce Gemini dene (explanation varsa)
    if (finalExplanation && genAI) {
      console.log('📝 Gemini ile explanation adımlara bölünüyor...')
      solutionData = await generateWithGemini(
        question_text,
        finalExplanation,
        finalOptions,
        finalCorrectAnswer
      )
    }

    // Gemini başarısız olduysa FALLBACK kullan
    if (!solutionData || !solutionData.steps || solutionData.steps.length === 0) {
      console.log('⚡ Fallback çözüm kullanılıyor...')
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
          version: 1,
          is_active: true
        }, { onConflict: 'question_id' })
        .select()
        .single()

      if (saved) {
        // Questions tablosunu güncelle
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
