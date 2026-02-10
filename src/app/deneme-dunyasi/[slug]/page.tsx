'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import {
  Clock, BookOpen, Users, BarChart3, Play, ChevronLeft, AlertTriangle, CheckCircle, Download
} from 'lucide-react'
import { EXAM_TYPE_LABELS, SUBJECT_COLORS, SUBJECT_DISPLAY_NAMES } from '@/lib/mock-exam/constants'
import { ExamQuestionForClient } from '@/lib/mock-exam/types'
import { openExamPaperPrint } from '@/lib/mock-exam/exam-paper-pdf'

export default function ExamDetailPage() {
  const router = useRouter()
  const params = useParams()
  const slug = params.slug as string

  const [exam, setExam] = useState<any>(null)
  const [questions, setQuestions] = useState<ExamQuestionForClient[]>([])
  const [subjectGroups, setSubjectGroups] = useState<Record<string, ExamQuestionForClient[]>>({})
  const [loading, setLoading] = useState(true)
  const [previousResult, setPreviousResult] = useState<any>(null)
  const [showConfirm, setShowConfirm] = useState(false)

  useEffect(() => {
    fetchExamBySlug()
  }, [slug])

  async function fetchExamBySlug() {
    try {
      // Typesense'den slug ile direkt ara
      const listRes = await fetch(`/api/mock-exam/list?slug=${encodeURIComponent(slug)}`)
      if (!listRes.ok) return

      const listData = await listRes.json()
      const foundExam = (listData.exams || [])[0]

      if (!foundExam) {
        setLoading(false)
        return
      }

      // Detay API'sini cagir
      const examId = foundExam.exam_id || foundExam.id
      const detailRes = await fetch(`/api/mock-exam/${examId}`)
      if (!detailRes.ok) {
        setLoading(false)
        return
      }

      const detailData = await detailRes.json()
      setExam(detailData.exam)
      setQuestions(detailData.questions || [])
      setSubjectGroups(detailData.subjectGroups || {})
      setPreviousResult(detailData.userPreviousResult)
    } catch (e) {
      console.error('Exam detail error:', e)
    } finally {
      setLoading(false)
    }
  }

  function handleStartExam() {
    if (previousResult) {
      setShowConfirm(true)
    } else {
      router.push(`/deneme-dunyasi/${slug}/coz`)
    }
  }

  function handleDownloadPaper() {
    if (!exam || questions.length === 0) return
    openExamPaperPrint(exam, questions, subjectGroups)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-50 flex items-center justify-center">
        <div className="animate-pulse text-surface-400">Yukleniyor...</div>
      </div>
    )
  }

  if (!exam) {
    return (
      <div className="min-h-screen bg-surface-50 flex flex-col items-center justify-center">
        <h1 className="text-2xl font-bold text-surface-600 mb-2">Sinav Bulunamadi</h1>
        <Link href="/deneme-dunyasi" className="text-primary-600 hover:underline text-sm">
          Sinavlara don
        </Link>
      </div>
    )
  }

  const subjects = exam.subjects || []

  return (
    <div className="min-h-screen bg-surface-50">
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Geri butonu */}
        <Link
          href="/deneme-dunyasi"
          className="inline-flex items-center gap-1 text-sm text-surface-500 hover:text-surface-700 mb-6"
        >
          <ChevronLeft className="w-4 h-4" />
          Sinavlara Don
        </Link>

        {/* Sinav karti */}
        <div className="bg-white rounded-2xl border border-surface-100 p-6 lg:p-8">
          {/* Badge */}
          <span className="inline-block px-3 py-1 bg-primary-50 text-primary-600 rounded-full text-xs font-medium mb-4">
            {EXAM_TYPE_LABELS[exam.exam_type] || exam.exam_type}
          </span>

          <h1 className="text-2xl lg:text-3xl font-black text-surface-900 mb-3">{exam.title}</h1>

          {exam.description && (
            <p className="text-surface-500 mb-6">{exam.description}</p>
          )}

          {/* Bilgiler */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-surface-50 rounded-xl p-4 text-center">
              <BookOpen className="w-6 h-6 text-primary-500 mx-auto mb-2" />
              <div className="text-lg font-bold text-surface-800">{exam.question_count || 80}</div>
              <div className="text-xs text-surface-400">Soru</div>
            </div>
            <div className="bg-surface-50 rounded-xl p-4 text-center">
              <Clock className="w-6 h-6 text-blue-500 mx-auto mb-2" />
              <div className="text-lg font-bold text-surface-800">{exam.duration}</div>
              <div className="text-xs text-surface-400">Dakika</div>
            </div>
            <div className="bg-surface-50 rounded-xl p-4 text-center">
              <Users className="w-6 h-6 text-green-500 mx-auto mb-2" />
              <div className="text-lg font-bold text-surface-800">{exam.total_attempts || 0}</div>
              <div className="text-xs text-surface-400">Katilimci</div>
            </div>
            <div className="bg-surface-50 rounded-xl p-4 text-center">
              <BarChart3 className="w-6 h-6 text-amber-500 mx-auto mb-2" />
              <div className="text-lg font-bold text-surface-800">{Math.round(exam.average_score || 0)}</div>
              <div className="text-xs text-surface-400">Ort. Puan</div>
            </div>
          </div>

          {/* Ders dagilimi */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-surface-600 mb-3">Ders Dagilimi</h3>
            <div className="flex flex-wrap gap-2">
              {subjects.map((subject: string) => {
                const colors = SUBJECT_COLORS[subject] || SUBJECT_COLORS.turkce
                const displayName = SUBJECT_DISPLAY_NAMES[subject] || subject
                return (
                  <span
                    key={subject}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium ${colors.light} ${colors.text}`}
                  >
                    {displayName}
                  </span>
                )
              })}
            </div>
          </div>

          {/* Kurallar */}
          <div className="bg-amber-50 rounded-xl p-4 mb-6">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-amber-800">
                <p className="font-semibold mb-1">Sinav Kurallari:</p>
                <ul className="space-y-1 list-disc list-inside text-amber-700">
                  <li>3 yanlis cevap 1 dogru cevabi goturur</li>
                  <li>Sinav suresi basladiktan sonra durmaz</li>
                  <li>Sure bittiginde otomatik gonderilir</li>
                  <li>Cevaplar otomatik yedeklenir</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Onceki sonuc */}
          {previousResult && (
            <div className="bg-green-50 rounded-xl p-4 mb-6">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span className="text-sm text-green-700 font-medium">
                  Daha once cozdiniz: {Number(previousResult.score).toFixed(1)} puan
                </span>
                <Link
                  href={`/deneme-dunyasi/${slug}/sonuc/${previousResult.resultId}`}
                  className="text-sm text-green-600 underline hover:no-underline ml-auto"
                >
                  Sonucu gor
                </Link>
              </div>
            </div>
          )}

          {/* Butonlar */}
          <div className="flex gap-3">
            <button
              onClick={handleStartExam}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-primary-600 text-white rounded-xl text-lg font-bold hover:bg-primary-700 transition-colors"
            >
              <Play className="w-6 h-6" />
              Sinava Basla
            </button>
            {questions.length > 0 && (
              <button
                onClick={handleDownloadPaper}
                className="flex items-center justify-center gap-2 px-5 py-4 border-2 border-surface-200 text-surface-600 rounded-xl text-sm font-medium hover:bg-surface-50 hover:border-surface-300 transition-colors"
                title="Soru kagidini indir / yazdir"
              >
                <Download className="w-5 h-5" />
                <span className="hidden sm:inline">Soru Kagidi</span>
              </button>
            )}
          </div>
        </div>

        {/* Yeniden cozme onay */}
        {showConfirm && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full">
              <h3 className="text-lg font-bold text-surface-900 mb-2">Tekrar Cozmek Ister misiniz?</h3>
              <p className="text-sm text-surface-500 mb-4">
                Bu sinavi daha once {Number(previousResult.score).toFixed(1)} puanla cozdiniz.
                Yeni bir sonuc olusturulacak.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirm(false)}
                  className="flex-1 px-4 py-2.5 border border-surface-200 rounded-xl text-sm font-medium text-surface-600 hover:bg-surface-50"
                >
                  Vazgec
                </button>
                <button
                  onClick={() => router.push(`/deneme-dunyasi/${slug}/coz`)}
                  className="flex-1 px-4 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-medium hover:bg-primary-700"
                >
                  Tekrar Coz
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
