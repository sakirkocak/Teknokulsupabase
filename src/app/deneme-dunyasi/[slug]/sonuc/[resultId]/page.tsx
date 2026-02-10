'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, Share2, RefreshCw, Download } from 'lucide-react'
import ExamResultSummary from '@/components/mock-exam/ExamResultSummary'
import ExamSubjectBreakdown from '@/components/mock-exam/ExamSubjectBreakdown'
import ExamTopicAnalysis from '@/components/mock-exam/ExamTopicAnalysis'
import ExamLeaderboard from '@/components/mock-exam/ExamLeaderboard'
import ExamAIRecommendations from '@/components/mock-exam/ExamAIRecommendations'
import { analyzeTopics } from '@/lib/mock-exam/scoring'
import { openExamReportPrint } from '@/lib/mock-exam/pdf-report'

export default function ExamResultPage() {
  const params = useParams()
  const slug = params.slug as string
  const resultId = params.resultId as string

  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'summary' | 'questions'>('summary')

  useEffect(() => {
    fetchResult()
  }, [resultId])

  async function fetchResult() {
    try {
      const res = await fetch(`/api/mock-exam/results/${resultId}`)
      if (!res.ok) return

      const resultData = await res.json()
      setData(resultData)
    } catch (e) {
      console.error('Result fetch error:', e)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-50 flex items-center justify-center">
        <div className="animate-pulse text-surface-400">Sonuclar yukleniyor...</div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-surface-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-lg font-bold text-surface-600 mb-2">Sonuc bulunamadi</h2>
          <Link href="/deneme-dunyasi" className="text-primary-600 hover:underline text-sm">
            Sinavlara don
          </Link>
        </div>
      </div>
    )
  }

  const { result, exam, questions, ranking } = data

  // Konu analizi
  const topicAnalysis = analyzeTopics(
    questions.map((q: any) => ({
      topic_name: q.topic_name,
      subject: q.subject,
      correct_answer: q.correct_answer,
      question_order: q.question_order,
    })),
    result.answers || {}
  )

  return (
    <div className="min-h-screen bg-surface-50">
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Link
            href="/deneme-dunyasi"
            className="inline-flex items-center gap-1 text-sm text-surface-500 hover:text-surface-700"
          >
            <ChevronLeft className="w-4 h-4" />
            Sinavlara Don
          </Link>

          <div className="flex items-center gap-2">
            <button
              onClick={() => openExamReportPrint(data)}
              className="flex items-center gap-1 px-3 py-2 text-sm text-surface-600 hover:bg-surface-100 rounded-xl"
            >
              <Download className="w-4 h-4" />
              PDF Indir
            </button>
            <Link
              href={`/deneme-dunyasi/${slug}/coz`}
              className="flex items-center gap-1 px-3 py-2 text-sm text-primary-600 hover:bg-primary-50 rounded-xl"
            >
              <RefreshCw className="w-4 h-4" />
              Tekrar Coz
            </Link>
          </div>
        </div>

        {/* Sinav adi */}
        <h1 className="text-2xl font-black text-surface-900 mb-2">{exam.title}</h1>
        <p className="text-surface-500 mb-8">Sinav sonucunuz</p>

        {/* Tab secici */}
        <div className="flex gap-1 mb-6 bg-surface-100 rounded-xl p-1 w-fit">
          <button
            onClick={() => setActiveTab('summary')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'summary'
                ? 'bg-white text-surface-900 shadow-sm'
                : 'text-surface-500 hover:text-surface-700'
            }`}
          >
            Ozet
          </button>
          <button
            onClick={() => setActiveTab('questions')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'questions'
                ? 'bg-white text-surface-900 shadow-sm'
                : 'text-surface-500 hover:text-surface-700'
            }`}
          >
            Sorular ({questions.length})
          </button>
        </div>

        {activeTab === 'summary' ? (
          <div className="space-y-6">
            {/* Puan ozeti */}
            <ExamResultSummary
              score={Number(result.score)}
              totalNet={Number(result.total_net)}
              rank={ranking.rank}
              percentile={ranking.percentile}
              totalAttempts={ranking.totalAttempts}
              timeTaken={result.time_taken}
            />

            {/* Ders bazli analiz */}
            <ExamSubjectBreakdown netBreakdown={result.net_breakdown || {}} />

            {/* Konu analizi */}
            <ExamTopicAnalysis
              weakTopics={topicAnalysis.weakTopics}
              strongTopics={topicAnalysis.strongTopics}
            />

            {/* Siralama */}
            <ExamLeaderboard examId={result.exam_id} />

            {/* AI oneriler */}
            <ExamAIRecommendations resultId={resultId} />
          </div>
        ) : (
          /* Soru detaylari */
          <div className="space-y-4">
            {questions.map((q: any) => {
              const userAnswer = q.user_answer
              const isCorrect = q.is_correct
              const isEmpty = !userAnswer

              return (
                <div
                  key={q.question_order}
                  className={`bg-white rounded-2xl border p-5 ${
                    isCorrect ? 'border-green-200' : isEmpty ? 'border-surface-100' : 'border-red-200'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`text-xs font-bold px-2 py-1 rounded-lg ${
                      isCorrect ? 'bg-green-100 text-green-700' : isEmpty ? 'bg-surface-100 text-surface-500' : 'bg-red-100 text-red-700'
                    }`}>
                      {isCorrect ? 'Dogru' : isEmpty ? 'Bos' : 'Yanlis'}
                    </span>
                    <span className="text-xs text-surface-400">Soru {q.question_order}</span>
                    <span className="text-xs text-surface-400 ml-auto">
                      {q.subject?.replace(/_/g, ' ')}
                    </span>
                  </div>

                  <p className="text-sm text-surface-800 mb-3">{q.question_text}</p>

                  {/* Secenekler */}
                  <div className="space-y-2 mb-3">
                    {['A', 'B', 'C', 'D'].map(option => {
                      const optionText = q.options?.[option]
                      if (!optionText) return null

                      const isUserAnswer = userAnswer === option
                      const isCorrectAnswer = q.correct_answer === option

                      let optionClass = 'border-surface-100 bg-surface-50'
                      if (isCorrectAnswer) {
                        optionClass = 'border-green-300 bg-green-50'
                      } else if (isUserAnswer && !isCorrect) {
                        optionClass = 'border-red-300 bg-red-50'
                      }

                      return (
                        <div
                          key={option}
                          className={`flex items-start gap-2 px-3 py-2 rounded-xl border ${optionClass}`}
                        >
                          <span className={`text-xs font-bold w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 ${
                            isCorrectAnswer ? 'bg-green-500 text-white' : isUserAnswer ? 'bg-red-500 text-white' : 'bg-surface-200 text-surface-500'
                          }`}>
                            {option}
                          </span>
                          <span className="text-xs text-surface-600">{optionText}</span>
                        </div>
                      )
                    })}
                  </div>

                  {/* Aciklama */}
                  {q.explanation && (
                    <div className="bg-blue-50 rounded-xl p-3">
                      <span className="text-xs font-semibold text-blue-700">Aciklama:</span>
                      <p className="text-xs text-blue-600 mt-1">{q.explanation}</p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
