'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { useProfile, useTeacherProfile } from '@/hooks/useProfile'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { 
  ClipboardCheck,
  User,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  ChevronRight,
  BarChart3,
  Loader2,
  FileText,
  Star
} from 'lucide-react'

interface AssignmentResult {
  id: string
  assignment_id: string
  score: number
  completed_at: string
  coach_reviewed: boolean
  coach_feedback: string | null
  answers: any[]
  assignment: {
    id: string
    title: string
    questions: any[]
    student: {
      profiles: {
        full_name: string
        avatar_url: string | null
      }
    }
  }
}

export default function AssignmentResultsPage() {
  const { profile } = useProfile()
  const { teacherProfile } = useTeacherProfile(profile?.id || '')
  const [results, setResults] = useState<AssignmentResult[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedResult, setSelectedResult] = useState<AssignmentResult | null>(null)
  const [feedback, setFeedback] = useState('')
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    if (teacherProfile?.id) {
      loadResults()
    }
  }, [teacherProfile?.id])

  async function loadResults() {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('assignment_responses')
        .select(`
          *,
          assignment:assignments!assignment_responses_assignment_id_fkey(
            id,
            title,
            questions,
            student:student_profiles!assignments_student_id_fkey(
              profiles:profiles!student_profiles_user_id_fkey(full_name, avatar_url)
            )
          )
        `)
        .order('completed_at', { ascending: false })

      if (error) throw error

      // Sadece bu koça ait ödevlerin sonuçlarını filtrele
      const filteredResults = (data || []).filter((r: any) => {
        // Bu ödevin koçu bu kullanıcı mı kontrol et
        return true // Şimdilik tümünü göster, RLS zaten filtreler
      })

      setResults(filteredResults.map((r: any) => ({
        ...r,
        assignment: {
          ...r.assignment,
          student: {
            profiles: Array.isArray(r.assignment?.student?.profiles) 
              ? r.assignment.student.profiles[0] 
              : r.assignment?.student?.profiles
          }
        }
      })))
    } catch (error) {
      console.error('Error loading results:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleReview(resultId: string) {
    setSaving(true)
    try {
      await supabase
        .from('assignment_responses')
        .update({
          coach_reviewed: true,
          coach_feedback: feedback || null,
        })
        .eq('id', resultId)

      // Ödev durumunu "reviewed" yap
      if (selectedResult) {
        await supabase
          .from('assignments')
          .update({ status: 'reviewed' })
          .eq('id', selectedResult.assignment_id)

        // Öğrenciye bildirim gönder
        const { data: assignment } = await supabase
          .from('assignments')
          .select(`
            title,
            student:student_profiles!assignments_student_id_fkey(user_id)
          `)
          .eq('id', selectedResult.assignment_id)
          .single()

        if (assignment?.student) {
          const studentUserId = Array.isArray(assignment.student) 
            ? (assignment.student as any)[0]?.user_id 
            : (assignment.student as any)?.user_id

          if (studentUserId) {
            await supabase
              .from('notifications')
              .insert({
                user_id: studentUserId,
                title: 'Ödeviniz İncelendi',
                body: feedback 
                  ? `"${assignment.title}" ödeviniz incelendi. Koçunuzdan geri bildirim: "${feedback.substring(0, 50)}${feedback.length > 50 ? '...' : ''}"`
                  : `"${assignment.title}" ödeviniz koçunuz tarafından incelendi.`,
                type: 'assignment',
                data: { link: '/ogrenci/odevler' },
              })
          }
        }
      }

      setResults(results.map(r => 
        r.id === resultId 
          ? { ...r, coach_reviewed: true, coach_feedback: feedback }
          : r
      ))
      setSelectedResult(null)
      setFeedback('')
    } catch (error) {
      console.error('Error saving review:', error)
    } finally {
      setSaving(false)
    }
  }

  function getScoreColor(score: number) {
    if (score >= 80) return 'text-green-600 bg-green-100'
    if (score >= 60) return 'text-yellow-600 bg-yellow-100'
    return 'text-red-600 bg-red-100'
  }

  return (
    <DashboardLayout role="koc">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-surface-900 flex items-center gap-2">
            <ClipboardCheck className="w-7 h-7 text-primary-500" />
            Ödev Sonuçları
          </h1>
          <p className="text-surface-500">Öğrencilerin tamamladığı ödevleri inceleyin</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="card p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-surface-100 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-surface-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-surface-900">{results.length}</p>
                <p className="text-sm text-surface-500">Toplam Sonuç</p>
              </div>
            </div>
          </div>
          <div className="card p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-surface-900">
                  {results.filter(r => !r.coach_reviewed).length}
                </p>
                <p className="text-sm text-surface-500">İncelenmemiş</p>
              </div>
            </div>
          </div>
          <div className="card p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-surface-900">
                  {results.filter(r => r.coach_reviewed).length}
                </p>
                <p className="text-sm text-surface-500">İncelendi</p>
              </div>
            </div>
          </div>
        </div>

        {/* Results List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
          </div>
        ) : results.length === 0 ? (
          <div className="text-center py-12 card">
            <ClipboardCheck className="w-12 h-12 mx-auto text-surface-300 mb-4" />
            <p className="text-surface-500">Henüz tamamlanmış ödev yok</p>
          </div>
        ) : (
          <div className="space-y-4">
            {results.map((result, index) => (
              <motion.div
                key={result.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="card p-5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
                      <User className="w-6 h-6 text-primary-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-surface-900">
                        {result.assignment?.title || 'Ödev'}
                      </h3>
                      <p className="text-sm text-surface-500">
                        {result.assignment?.student?.profiles?.full_name || 'Öğrenci'}
                      </p>
                      <div className="flex items-center gap-3 mt-2 text-sm text-surface-400">
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {new Date(result.completed_at).toLocaleDateString('tr-TR')}
                        </span>
                        <span className="flex items-center gap-1">
                          <BarChart3 className="w-4 h-4" />
                          {result.assignment?.questions?.length || 0} soru
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    {/* Score */}
                    <div className={`px-4 py-2 rounded-xl font-bold text-lg ${getScoreColor(result.score)}`}>
                      %{result.score.toFixed(0)}
                    </div>

                    {/* Status Badge */}
                    {result.coach_reviewed ? (
                      <span className="px-3 py-1 bg-green-100 text-green-700 text-sm rounded-full flex items-center gap-1">
                        <CheckCircle className="w-4 h-4" />
                        İncelendi
                      </span>
                    ) : (
                      <button
                        onClick={() => setSelectedResult(result)}
                        className="btn btn-primary btn-sm"
                      >
                        <Eye className="w-4 h-4" />
                        İncele
                      </button>
                    )}
                  </div>
                </div>

                {/* Answer Summary */}
                {result.answers && (
                  <div className="mt-4 pt-4 border-t border-surface-100">
                    <div className="flex items-center gap-4 text-sm">
                      <span className="flex items-center gap-1 text-green-600">
                        <CheckCircle className="w-4 h-4" />
                        {result.answers.filter(a => a.isCorrect).length} doğru
                      </span>
                      <span className="flex items-center gap-1 text-red-600">
                        <XCircle className="w-4 h-4" />
                        {result.answers.filter(a => !a.isCorrect).length} yanlış
                      </span>
                    </div>
                  </div>
                )}

                {/* Coach Feedback */}
                {result.coach_feedback && (
                  <div className="mt-4 p-3 bg-blue-50 rounded-xl">
                    <p className="text-sm text-blue-700">
                      <strong>Geri bildiriminiz:</strong> {result.coach_feedback}
                    </p>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}

        {/* Review Modal */}
        {selectedResult && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto"
            >
              <div className="p-6 border-b border-surface-100">
                <h2 className="text-xl font-bold text-surface-900">
                  Ödev İnceleme
                </h2>
                <p className="text-surface-500">
                  {selectedResult.assignment?.title} - {selectedResult.assignment?.student?.profiles?.full_name}
                </p>
              </div>

              <div className="p-6 space-y-4">
                {/* Score */}
                <div className={`p-4 rounded-xl ${getScoreColor(selectedResult.score)}`}>
                  <div className="text-center">
                    <p className="text-3xl font-bold">%{selectedResult.score.toFixed(0)}</p>
                    <p className="text-sm opacity-80">Başarı Oranı</p>
                  </div>
                </div>

                {/* Questions & Answers */}
                <div className="space-y-3">
                  <h3 className="font-medium text-surface-900">Cevaplar</h3>
                  {selectedResult.answers?.map((answer, i) => {
                    const question = selectedResult.assignment?.questions?.find(
                      (q: any) => q.id === answer.questionId
                    )
                    return (
                      <div
                        key={i}
                        className={`p-3 rounded-xl ${
                          answer.isCorrect ? 'bg-green-50' : 'bg-red-50'
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          {answer.isCorrect ? (
                            <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                          ) : (
                            <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                          )}
                          <div className="flex-1">
                            <p className="text-sm font-medium text-surface-900">
                              {question?.question_text || `Soru ${i + 1}`}
                            </p>
                            <p className={`text-sm ${answer.isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                              Cevap: {answer.answer}
                              {!answer.isCorrect && question && (
                                <span className="text-green-600 ml-2">
                                  (Doğru: {question.correct_answer})
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Feedback */}
                <div>
                  <label className="label">Geri Bildirim (opsiyonel)</label>
                  <textarea
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    className="input min-h-[100px]"
                    placeholder="Öğrenciye geri bildirim yazın..."
                  />
                </div>
              </div>

              <div className="p-6 border-t border-surface-100 flex justify-end gap-3">
                <button
                  onClick={() => setSelectedResult(null)}
                  className="btn btn-ghost"
                >
                  İptal
                </button>
                <button
                  onClick={() => handleReview(selectedResult.id)}
                  disabled={saving}
                  className="btn btn-primary"
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle className="w-4 h-4" />
                  )}
                  İncelendi Olarak İşaretle
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

