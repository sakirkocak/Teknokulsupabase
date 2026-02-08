'use client'

import { useState } from 'react'
import { Sparkles, BookOpen, TrendingUp, Target, Loader2 } from 'lucide-react'

interface AIAnalysis {
  overallAssessment: string
  priorityTopics: string[]
  strengths: string[]
  weaknesses: string[]
  studyPlan: string
  motivationalMessage: string
}

interface ExamAIRecommendationsProps {
  resultId: string
}

export default function ExamAIRecommendations({ resultId }: ExamAIRecommendationsProps) {
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function fetchAnalysis() {
    if (loading || analysis) return
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/mock-exam/ai-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resultId }),
      })

      if (!res.ok) throw new Error('AI analiz yapilamadi')

      const data = await res.json()
      setAnalysis(data.analysis)
    } catch (e: any) {
      setError(e.message || 'Bir hata olustu')
    } finally {
      setLoading(false)
    }
  }

  if (!analysis && !loading) {
    return (
      <div className="bg-gradient-to-br from-violet-50 to-purple-50 rounded-2xl border border-violet-100 p-6 text-center">
        <Sparkles className="w-10 h-10 text-violet-400 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-violet-900 mb-2">AI Analiz</h3>
        <p className="text-sm text-violet-600 mb-4">
          Yapay zeka ile kisisellestirilmis calisma onerisi al
        </p>
        <button
          onClick={fetchAnalysis}
          className="px-6 py-2.5 bg-violet-600 text-white rounded-xl hover:bg-violet-700 transition-colors text-sm font-medium"
        >
          Analiz Yap
        </button>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-surface-100 p-8 text-center">
        <Loader2 className="w-8 h-8 text-violet-500 mx-auto mb-3 animate-spin" />
        <p className="text-sm text-surface-500">AI analiz yapiliyor...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 rounded-2xl border border-red-100 p-6 text-center">
        <p className="text-sm text-red-600 mb-3">{error}</p>
        <button
          onClick={fetchAnalysis}
          className="text-sm text-red-700 underline hover:no-underline"
        >
          Tekrar dene
        </button>
      </div>
    )
  }

  if (!analysis) return null

  return (
    <div className="bg-white rounded-2xl border border-surface-100 p-6">
      <div className="flex items-center gap-2 mb-6">
        <Sparkles className="w-5 h-5 text-violet-500" />
        <h3 className="text-lg font-bold text-surface-900">AI Oneriler</h3>
      </div>

      {/* Genel degerlendirme */}
      <div className="bg-surface-50 rounded-xl p-4 mb-6">
        <p className="text-sm text-surface-700 leading-relaxed">{analysis.overallAssessment}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Oncelikli konular */}
        {analysis.priorityTopics && analysis.priorityTopics.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Target className="w-4 h-4 text-red-500" />
              <h4 className="text-sm font-semibold text-surface-700">Oncelikli Konular</h4>
            </div>
            <ul className="space-y-1.5">
              {analysis.priorityTopics.map((topic, i) => (
                <li key={i} className="text-sm text-surface-600 flex items-start gap-2">
                  <span className="text-red-400 mt-0.5">-</span>
                  {topic}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Guclu yonler */}
        {analysis.strengths && analysis.strengths.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-4 h-4 text-green-500" />
              <h4 className="text-sm font-semibold text-surface-700">Guclu Yonler</h4>
            </div>
            <ul className="space-y-1.5">
              {analysis.strengths.map((s, i) => (
                <li key={i} className="text-sm text-surface-600 flex items-start gap-2">
                  <span className="text-green-400 mt-0.5">+</span>
                  {s}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Calisma plani */}
      {analysis.studyPlan && (
        <div className="mt-6 bg-blue-50 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <BookOpen className="w-4 h-4 text-blue-500" />
            <h4 className="text-sm font-semibold text-blue-700">Calisma Plani</h4>
          </div>
          <p className="text-sm text-blue-700 leading-relaxed">{analysis.studyPlan}</p>
        </div>
      )}

      {/* Motivasyon */}
      {analysis.motivationalMessage && (
        <div className="mt-4 text-center">
          <p className="text-sm font-medium text-violet-600 italic">
            "{analysis.motivationalMessage}"
          </p>
        </div>
      )}
    </div>
  )
}
