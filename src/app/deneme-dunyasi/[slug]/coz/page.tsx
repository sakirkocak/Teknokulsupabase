'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Send, Menu, X, AlertTriangle, Loader2 } from 'lucide-react'
import { useMockExam } from '@/hooks/useMockExam'
import ExamTimer from '@/components/mock-exam/ExamTimer'
import ExamQuestionNav from '@/components/mock-exam/ExamQuestionNav'
import ExamQuestion from '@/components/mock-exam/ExamQuestion'
import type { ExamQuestionForClient, SubmitExamResponse } from '@/lib/mock-exam/types'

export default function ExamSolvePage() {
  const router = useRouter()
  const params = useParams()
  const slug = params.slug as string

  const [examData, setExamData] = useState<{
    exam: any
    questions: ExamQuestionForClient[]
    subjectGroups: Record<string, ExamQuestionForClient[]>
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Sinav verilerini yukle
  useEffect(() => {
    async function fetchExam() {
      try {
        // Slug'dan exam ID al
        const listRes = await fetch(`/api/mock-exam/list?slug=${encodeURIComponent(slug)}`)
        if (!listRes.ok) throw new Error('Sinavlar yuklenemedi')

        const listData = await listRes.json()
        const foundExam = (listData.exams || [])[0]

        if (!foundExam) {
          setError('Sinav bulunamadi')
          setLoading(false)
          return
        }

        const examId = foundExam.exam_id || foundExam.id
        const detailRes = await fetch(`/api/mock-exam/${examId}`)
        if (!detailRes.ok) throw new Error('Sinav detayi yuklenemedi')

        const detailData = await detailRes.json()
        setExamData(detailData)
      } catch (e: any) {
        setError(e.message || 'Bir hata olustu')
      } finally {
        setLoading(false)
      }
    }

    fetchExam()
  }, [slug])

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-primary-500 mx-auto mb-3 animate-spin" />
          <p className="text-surface-500">Sinav yukleniyor...</p>
        </div>
      </div>
    )
  }

  if (error || !examData) {
    return (
      <div className="min-h-screen bg-surface-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-surface-700 mb-1">{error || 'Sinav bulunamadi'}</h2>
          <button
            onClick={() => router.push('/deneme-dunyasi')}
            className="text-sm text-primary-600 hover:underline"
          >
            Sinavlara don
          </button>
        </div>
      </div>
    )
  }

  return (
    <ExamSolveContent
      exam={examData.exam}
      questions={examData.questions}
      subjectGroups={examData.subjectGroups}
      slug={slug}
      showSubmitConfirm={showSubmitConfirm}
      setShowSubmitConfirm={setShowSubmitConfirm}
      submitError={submitError}
      setSubmitError={setSubmitError}
      sidebarOpen={sidebarOpen}
      setSidebarOpen={setSidebarOpen}
      router={router}
    />
  )
}

function ExamSolveContent({
  exam,
  questions,
  subjectGroups,
  slug,
  showSubmitConfirm,
  setShowSubmitConfirm,
  submitError,
  setSubmitError,
  sidebarOpen,
  setSidebarOpen,
  router,
}: any) {
  const mockExam = useMockExam({
    examId: exam.id,
    slug,
    questions,
    subjectGroups,
    duration: exam.duration,
    onSubmit: (response: SubmitExamResponse) => {
      router.push(`/deneme-dunyasi/${slug}/sonuc/${response.resultId}`)
    },
  })

  async function handleSubmit() {
    setShowSubmitConfirm(false)
    setSubmitError(null)
    try {
      await mockExam.submitExam()
    } catch (e: any) {
      setSubmitError(e.message || 'Gonderim basarisiz')
    }
  }

  const questionIndex = questions.findIndex((q: any) => q.question_order === mockExam.currentQuestion)

  return (
    <div className="min-h-screen bg-surface-50 flex flex-col">
      {/* Top bar */}
      <header className="sticky top-0 z-30 bg-white border-b border-surface-100 px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden p-2 text-surface-600 hover:bg-surface-100 rounded-lg"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <h1 className="text-sm font-bold text-surface-800 truncate max-w-[200px] lg:max-w-none">
            {exam.title}
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <ExamTimer timeRemaining={mockExam.timeRemaining} warning={mockExam.timerWarning} />

          <button
            onClick={() => setShowSubmitConfirm(true)}
            disabled={mockExam.isSubmitting}
            className="flex items-center gap-1.5 px-4 py-2 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            {mockExam.isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            <span className="hidden sm:inline">Sinavi Gonder</span>
          </button>
        </div>
      </header>

      {/* Timer uyari banner */}
      {mockExam.timerWarning === 'yellow' && (
        <div className="bg-amber-100 text-amber-800 text-center py-2 text-sm font-medium">
          15 dakikadan az sureniz kaldi!
        </div>
      )}
      {mockExam.timerWarning === 'red' && (
        <div className="bg-red-100 text-red-800 text-center py-2 text-sm font-medium animate-pulse">
          5 dakikadan az sureniz kaldi!
        </div>
      )}

      {/* Ana icerik */}
      <div className="flex-1 flex">
        {/* Sol panel - Sidebar (mobilde drawer) */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
        <aside className={`fixed lg:static top-14 left-0 h-[calc(100vh-3.5rem)] w-64 bg-white border-r border-surface-100 z-40 transform transition-transform lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } overflow-hidden`}>
          <div className="p-4 h-full">
            <ExamQuestionNav
              subjects={mockExam.subjects}
              subjectQuestions={mockExam.subjectQuestions}
              currentSubject={mockExam.currentSubject}
              currentQuestion={mockExam.currentQuestion}
              answers={mockExam.answers}
              flagged={mockExam.flagged}
              subjectProgress={mockExam.subjectProgress}
              onSubjectChange={(subject) => {
                mockExam.goToSubject(subject)
                setSidebarOpen(false)
              }}
              onQuestionChange={(order) => {
                mockExam.goToQuestion(order)
                setSidebarOpen(false)
              }}
            />
          </div>
        </aside>

        {/* Sag panel - Soru */}
        <main className="flex-1 lg:ml-0 p-4 lg:p-8 max-w-4xl mx-auto w-full">
          {mockExam.currentQuestionData ? (
            <ExamQuestion
              question={mockExam.currentQuestionData}
              selectedAnswer={mockExam.answers[mockExam.currentQuestion] || null}
              isFlagged={mockExam.flagged.has(mockExam.currentQuestion)}
              questionIndex={questionIndex}
              totalQuestions={mockExam.totalQuestions}
              onAnswer={(answer) => mockExam.setAnswer(mockExam.currentQuestion, answer)}
              onToggleFlag={() => mockExam.toggleFlag(mockExam.currentQuestion)}
              onNext={mockExam.goNext}
              onPrev={mockExam.goPrev}
            />
          ) : (
            <div className="text-center py-12 text-surface-400">
              Soru bulunamadi
            </div>
          )}
        </main>
      </div>

      {/* Ilerleme bar (mobil) */}
      <div className="lg:hidden sticky bottom-0 bg-white border-t border-surface-100 px-4 py-3">
        <div className="flex items-center justify-between text-xs text-surface-500 mb-1">
          <span>{mockExam.answeredCount}/{mockExam.totalQuestions} cevaplanmis</span>
          <span>%{Math.round((mockExam.answeredCount / mockExam.totalQuestions) * 100)}</span>
        </div>
        <div className="h-2 bg-surface-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary-500 rounded-full transition-all"
            style={{ width: `${(mockExam.answeredCount / mockExam.totalQuestions) * 100}%` }}
          />
        </div>
      </div>

      {/* Submit onay dialog */}
      {showSubmitConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <h3 className="text-lg font-bold text-surface-900 mb-2">Sinavi Gonder</h3>
            <div className="text-sm text-surface-500 mb-4 space-y-2">
              <p>
                <strong>{mockExam.answeredCount}</strong> soru cevaplanmis,{' '}
                <strong>{mockExam.totalQuestions - mockExam.answeredCount}</strong> soru bos.
              </p>
              {mockExam.totalQuestions - mockExam.answeredCount > 0 && (
                <p className="text-amber-600">
                  Bos biraktiginiz sorular 0 puan alacaktir.
                </p>
              )}
            </div>

            {submitError && (
              <div className="bg-red-50 text-red-700 text-sm px-3 py-2 rounded-xl mb-4">
                {submitError}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setShowSubmitConfirm(false)}
                className="flex-1 px-4 py-2.5 border border-surface-200 rounded-xl text-sm font-medium text-surface-600 hover:bg-surface-50"
              >
                Devam Et
              </button>
              <button
                onClick={handleSubmit}
                disabled={mockExam.isSubmitting}
                className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700 disabled:opacity-50"
              >
                {mockExam.isSubmitting ? 'Gonderiliyor...' : 'Gonder'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab switch uyarisi */}
      {mockExam.tabSwitchCount >= 2 && mockExam.tabSwitchCount <= 3 && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-red-600 text-white px-4 py-2 rounded-xl text-sm font-medium shadow-lg animate-bounce">
          Sekme degistirmeyin! ({mockExam.tabSwitchCount} kez)
        </div>
      )}
    </div>
  )
}
