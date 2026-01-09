'use client'

import { useState } from 'react'
import InteractiveSolutionPlayer from '@/components/interactive-solution/InteractiveSolutionPlayer'
import { Sparkles, Loader2 } from 'lucide-react'

// Demo soru
const DEMO_QUESTION = "Bir sayının 3 katının 5 fazlası 23'tür. Bu sayıyı bulunuz."

// Demo çözüm (örnek JSON yapısı)
const DEMO_SOLUTION = {
  question_summary: "3x + 5 = 23 denklemini çöz",
  difficulty: "easy" as const,
  estimated_time_seconds: 90,
  steps: [
    {
      id: "step_1",
      type: "explanation" as const,
      title: "Problemi Anlayalım",
      content: "Bir sayının 3 katının 5 fazlası 23 ediyor. Bu sayıyı x olarak adlandıralım.\n\nMatematiksel ifade: 3x + 5 = 23",
      tts_text: "Önce problemi anlayalım. Bir sayının üç katının beş fazlası yirmi üç ediyor. Bu bilinmeyen sayıyı x ile gösterelim.",
      duration_seconds: 6,
      animation_template: "text_reveal",
      animation_data: {
        text: "3x + 5 = 23",
        highlight_parts: ["3x", "5", "23"]
      }
    },
    {
      id: "step_2", 
      type: "quiz" as const,
      title: "Sıra Sende! 🤔",
      content: "Denklemi çözmek için ilk adımda ne yapmalıyız?",
      tts_text: "Şimdi sıra sende! Denklemi çözmek için ilk adımda ne yapmalıyız?",
      duration_seconds: 0,
      animation_template: "none",
      quiz: {
        question: "Denklemi çözmek için ilk adımda ne yapmalıyız?",
        options: [
          { id: "a", text: "Her iki taraftan 5 çıkar", is_correct: true },
          { id: "b", text: "Her iki tarafı 3'e böl", is_correct: false },
          { id: "c", text: "Her iki tarafa 5 ekle", is_correct: false }
        ],
        hint: "Önce sabit sayıyı karşı tarafa geçirmeliyiz",
        explanation_correct: "Harika! Doğru cevap. Önce +5'i karşı tarafa geçirmek için her iki taraftan 5 çıkarıyoruz.",
        explanation_wrong: "Önce denklemdeki sabit sayıyı (5) karşı tarafa geçirmeliyiz. Bunun için her iki taraftan 5 çıkarırız."
      }
    },
    {
      id: "step_3",
      type: "calculation" as const,
      title: "5'i Çıkaralım",
      content: "Her iki taraftan 5 çıkarıyoruz:\n\n3x + 5 - 5 = 23 - 5\n3x = 18",
      tts_text: "Her iki taraftan beş çıkarıyoruz. Sol tarafta beş artı beş sıfır olur, üç x kalır. Sağ tarafta yirmi üç eksi beş eşittir on sekiz.",
      duration_seconds: 7,
      animation_template: "equation_balance",
      animation_data: {
        left_side: "3x + 5",
        right_side: "23",
        steps: [
          { operation: "subtract", value: "5", result_left: "3x", result_right: "18" }
        ]
      }
    },
    {
      id: "step_4",
      type: "quiz" as const,
      title: "Son Adım! 🎯",
      content: "3x = 18 ise x kaçtır?",
      tts_text: "Şimdi son adım! Üç x eşittir on sekiz ise, x kaçtır?",
      duration_seconds: 0,
      animation_template: "none",
      quiz: {
        question: "3x = 18 ise x = ?",
        options: [
          { id: "a", text: "x = 6", is_correct: true },
          { id: "b", text: "x = 54", is_correct: false },
          { id: "c", text: "x = 15", is_correct: false }
        ],
        hint: "Her iki tarafı x'in katsayısına böl",
        explanation_correct: "Mükemmel! 18 ÷ 3 = 6. Sayımız 6'dır!",
        explanation_wrong: "Her iki tarafı 3'e bölmeliyiz: 18 ÷ 3 = 6"
      }
    },
    {
      id: "step_5",
      type: "calculation" as const,
      title: "Bölme İşlemi",
      content: "Her iki tarafı 3'e bölüyoruz:\n\n3x ÷ 3 = 18 ÷ 3\nx = 6",
      tts_text: "Her iki tarafı üçe bölüyoruz. Üç x bölü üç eşittir x. On sekiz bölü üç eşittir altı. Demek ki x eşittir altı.",
      duration_seconds: 6,
      animation_template: "equation_balance",
      animation_data: {
        left_side: "3x",
        right_side: "18",
        steps: [
          { operation: "divide", value: "3", result_left: "x", result_right: "6" }
        ]
      }
    },
    {
      id: "step_6",
      type: "result" as const,
      title: "Sonuç ✅",
      content: "Aranan sayı 6'dır.\n\n📋 Doğrulama:\n3 × 6 + 5 = 18 + 5 = 23 ✓",
      tts_text: "Aranan sayı altıdır. Hadi doğrulayalım: Üç çarpı altı artı beş eşittir on sekiz artı beş eşittir yirmi üç. Doğru!",
      duration_seconds: 7,
      animation_template: "text_reveal",
      animation_data: {
        text: "x = 6",
        celebration: true
      }
    }
  ],
  summary: "Birinci dereceden denklem çözümünde önce sabit terimler, sonra katsayılar işlenir.",
  key_concepts: ["Birinci derece denklem", "Ters işlem", "Denklik ilkesi"],
  common_mistakes: ["Bölme yerine çarpma yapmak", "İşaret hataları"]
}

export default function InteractiveSolutionDemo() {
  const [solution, setSolution] = useState(DEMO_SOLUTION)
  const [questionText, setQuestionText] = useState(DEMO_QUESTION)
  const [isGenerating, setIsGenerating] = useState(false)
  const [customQuestion, setCustomQuestion] = useState('')
  const [error, setError] = useState('')

  const generateSolution = async () => {
    if (!customQuestion.trim()) return
    
    setIsGenerating(true)
    setError('')
    
    try {
      const response = await fetch('/api/interactive-solution/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question_text: customQuestion,
          subject_name: 'Matematik'
        })
      })

      const data = await response.json()
      
      if (data.success) {
        setSolution(data.solution.solution_data)
        setQuestionText(customQuestion)
      } else {
        setError(data.error || 'Çözüm üretilemedi')
      }
    } catch (err) {
      setError('Bağlantı hatası')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleComplete = (stats: { totalTime: number; correctAnswers: number; wrongAnswers: number; score: number }) => {
    console.log('Çözüm tamamlandı:', stats)
    // Burada interaction log kaydedilebilir
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 flex items-center justify-center gap-2">
            <Sparkles className="w-8 h-8 text-indigo-500" />
            İnteraktif Çözüm Kartı
          </h1>
          <p className="text-gray-500 mt-2">AI destekli interaktif soru çözüm sistemi</p>
        </div>

        {/* Custom Question Input */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <h2 className="font-semibold text-gray-700 mb-3">🎯 Kendi Sorunuzu Deneyin</h2>
          <div className="flex gap-3">
            <input
              type="text"
              value={customQuestion}
              onChange={(e) => setCustomQuestion(e.target.value)}
              placeholder="Matematik sorusu yazın..."
              className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              onClick={generateSolution}
              disabled={isGenerating || !customQuestion.trim()}
              className="px-6 py-3 bg-indigo-500 text-white rounded-xl hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Üretiliyor...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Çözüm Üret
                </>
              )}
            </button>
          </div>
          {error && (
            <p className="mt-2 text-sm text-red-500">{error}</p>
          )}
        </div>

        {/* Player */}
        <InteractiveSolutionPlayer
          solution={solution}
          questionText={questionText}
          onComplete={handleComplete}
        />

        {/* Debug Info */}
        <details className="mt-8 bg-slate-100 rounded-xl p-4">
          <summary className="cursor-pointer text-sm text-gray-500 font-medium">
            🔧 Debug: JSON Veri Yapısı
          </summary>
          <pre className="mt-4 text-xs overflow-auto max-h-96 bg-slate-800 text-green-400 p-4 rounded-lg">
            {JSON.stringify(solution, null, 2)}
          </pre>
        </details>
      </div>
    </div>
  )
}
