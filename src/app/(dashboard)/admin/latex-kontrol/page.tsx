'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import MathRenderer from '@/components/MathRenderer'

interface Question {
  id: string
  question_text: string
  options: any
  correct_answer: string
  explanation: string
  difficulty: string
  subject_id: string
}

export default function LatexAuditPage() {
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const fetchQuestions = async () => {
    setLoading(true)
    setError(null)
    try {
      // Rastgele 50 soru çekmeye çalışalım.
      // Supabase'de tam rastgele çekmek için stored procedure gerekebilir ama 
      // şimdilik basitçe son eklenenlerden veya belirli bir aralıktan çekelim.
      // limit(50) ile çekiyoruz.
      const { data, error } = await supabase
        .from('questions')
        .select('id, question_text, options, correct_answer, explanation, difficulty, subject_id')
        .limit(50)
      
      if (error) throw error
      
      setQuestions(data || [])
    } catch (err: any) {
      console.error('Veri çekme hatası:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchQuestions()
  }, [])

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">LaTeX Veri Denetimi</h1>
        <button 
          onClick={fetchQuestions}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
        >
          Yenile
        </button>
      </div>

      {loading && <div className="text-center py-10">Yükleniyor...</div>}
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          Hata: {error}
        </div>
      )}

      {!loading && !error && (
        <div className="space-y-8">
          <p className="text-gray-600 mb-4">
            Bu sayfa, veritabanındaki soruların ham halini ve yeni render motoruyla nasıl göründüğünü karşılaştırmanızı sağlar.
            Eğer "Render Edilmiş" sütununda formüller düzgün görünüyorsa, render motoru sorunu çözülmüştür.
            Eğer "Ham Veri" sütununda backslash'ler eksikse (örn: "frac" yerine "frac"), veritabanı bozuk demektir.
          </p>

          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-200 shadow-sm rounded-lg">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/2">Ham Veri (Raw)</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/2">Render Edilmiş (Yeni)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {questions.map((q) => (
                  <tr key={q.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500 font-mono">
                      {q.id.substring(0, 8)}...
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-800 font-mono bg-gray-50 align-top whitespace-pre-wrap">
                      {q.question_text}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 align-top">
                      <MathRenderer text={q.question_text} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
