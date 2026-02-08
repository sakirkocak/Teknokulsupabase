'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import AdminExamBuilder from '@/components/mock-exam/AdminExamBuilder'
import { Plus, Trash2, Eye, EyeOff, Edit, Loader2 } from 'lucide-react'
import { EXAM_TYPE_LABELS } from '@/lib/mock-exam/constants'

export default function AdminDenemePage() {
  const [exams, setExams] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showBuilder, setShowBuilder] = useState(false)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  useEffect(() => {
    fetchExams()
  }, [])

  async function fetchExams() {
    try {
      // Admin icin tum sinavlari goster (aktif olmayanlar dahil)
      // Supabase'den cek (Typesense sadece aktif olanlari tutar)
      const res = await fetch('/api/mock-exam/list?per_page=100')
      if (!res.ok) return
      const data = await res.json()
      setExams(data.exams || [])
    } catch (e) {
      console.error('Admin exam list error:', e)
    } finally {
      setLoading(false)
    }
  }

  async function toggleExamStatus(examId: string, currentStatus: boolean) {
    setTogglingId(examId)
    try {
      const res = await fetch('/api/mock-exam/admin/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ examId, is_active: !currentStatus }),
      })
      if (res.ok) {
        setExams(prev => prev.map(e =>
          (e.id === examId || e.exam_id === examId)
            ? { ...e, is_active: !currentStatus }
            : e
        ))
      }
    } catch (e) {
      console.error('Toggle error:', e)
    } finally {
      setTogglingId(null)
    }
  }

  async function deleteExam(examId: string) {
    if (!confirm('Bu sinavi silmek istediginize emin misiniz?')) return

    try {
      const res = await fetch(`/api/mock-exam/admin/delete?examId=${examId}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        setExams(prev => prev.filter(e => e.id !== examId && e.exam_id !== examId))
      }
    } catch (e) {
      console.error('Delete error:', e)
    }
  }

  return (
    <DashboardLayout role="admin">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-black text-surface-900">Deneme Yonetimi</h1>
            <p className="text-sm text-surface-500">Deneme sinavlarini olustur ve yonet</p>
          </div>
          <button
            onClick={() => setShowBuilder(!showBuilder)}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-medium hover:bg-primary-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Yeni Sinav
          </button>
        </div>

        {/* Sinav builder */}
        {showBuilder && (
          <div className="mb-8">
            <AdminExamBuilder
              onSave={(exam) => {
                setExams(prev => [exam, ...prev])
                setShowBuilder(false)
              }}
            />
          </div>
        )}

        {/* Sinav listesi */}
        <div className="bg-white rounded-2xl border border-surface-100">
          {loading ? (
            <div className="p-8 text-center text-surface-400">Yukleniyor...</div>
          ) : exams.length === 0 ? (
            <div className="p-8 text-center text-surface-400">
              Henuz sinav olusturulmamis
            </div>
          ) : (
            <div className="divide-y divide-surface-50">
              {exams.map((exam) => {
                const examId = exam.id || exam.exam_id
                return (
                  <div key={examId} className="flex items-center gap-4 px-6 py-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-surface-800 truncate">{exam.title}</h3>
                      <div className="flex items-center gap-3 text-xs text-surface-400 mt-1">
                        <span>{EXAM_TYPE_LABELS[exam.exam_type] || exam.exam_type}</span>
                        <span>{exam.grade}. Sinif</span>
                        <span>{exam.question_count || 0} soru</span>
                        <span>{exam.total_attempts || 0} katilimci</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Aktif/Pasif toggle */}
                      <button
                        onClick={() => toggleExamStatus(examId, exam.is_active)}
                        disabled={togglingId === examId}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                          exam.is_active
                            ? 'bg-green-100 text-green-700 hover:bg-green-200'
                            : 'bg-surface-100 text-surface-500 hover:bg-surface-200'
                        }`}
                      >
                        {togglingId === examId ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : exam.is_active ? (
                          <Eye className="w-3 h-3" />
                        ) : (
                          <EyeOff className="w-3 h-3" />
                        )}
                        {exam.is_active ? 'Aktif' : 'Taslak'}
                      </button>

                      {/* Sil */}
                      <button
                        onClick={() => deleteExam(examId)}
                        className="p-2 text-surface-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
