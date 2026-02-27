'use client'

import { useState, useEffect } from 'react'
import AdminExamBuilder from '@/components/mock-exam/AdminExamBuilder'
import { Plus, Trash2, Eye, EyeOff, Loader2, BookOpen, GraduationCap, FlaskConical, School } from 'lucide-react'
import { EXAM_TYPE_LABELS } from '@/lib/mock-exam/constants'

// Kategori tanımları
const EXAM_CATEGORIES = [
  {
    id: 'all',
    label: 'Tümü',
    icon: BookOpen,
    color: 'text-surface-600',
    activeBg: 'bg-surface-900 text-white',
    match: () => true,
  },
  {
    id: 'lgs',
    label: 'LGS & Bursluluk',
    icon: GraduationCap,
    color: 'text-blue-600',
    activeBg: 'bg-blue-600 text-white',
    match: (type: string) => type === 'LGS' || type.startsWith('BURSLULUK'),
  },
  {
    id: 'tyt_ayt',
    label: 'TYT / AYT',
    icon: School,
    color: 'text-violet-600',
    activeBg: 'bg-violet-600 text-white',
    match: (type: string) => type === 'TYT' || type === 'AYT',
  },
  {
    id: 'other_exams',
    label: 'ALES / DGS / KPSS / YDS',
    icon: FlaskConical,
    color: 'text-orange-600',
    activeBg: 'bg-orange-600 text-white',
    match: (type: string) =>
      ['ALES', 'DGS', 'KPSS', 'KPSS_ONLISANS', 'KPSS_ORTAOGRETIM', 'YDS'].includes(type),
  },
  {
    id: 'sinif_1_4',
    label: '1–4. Sınıf',
    icon: BookOpen,
    color: 'text-green-600',
    activeBg: 'bg-green-600 text-white',
    match: (type: string) => ['SINIF_1', 'SINIF_2', 'SINIF_3', 'SINIF_4'].includes(type),
  },
  {
    id: 'sinif_5_8',
    label: '5–8. Sınıf',
    icon: BookOpen,
    color: 'text-teal-600',
    activeBg: 'bg-teal-600 text-white',
    match: (type: string) => ['SINIF_5', 'SINIF_6', 'SINIF_7', 'SINIF_8'].includes(type),
  },
  {
    id: 'sinif_9_12',
    label: '9–12. Sınıf',
    icon: BookOpen,
    color: 'text-indigo-600',
    activeBg: 'bg-indigo-600 text-white',
    match: (type: string) => ['SINIF_9', 'SINIF_10', 'SINIF_11', 'SINIF_12'].includes(type),
  },
]

// Exam type'a göre kategori rengi
function getExamTypeBadge(type: string) {
  if (type === 'LGS' || type.startsWith('BURSLULUK')) return 'bg-blue-100 text-blue-700'
  if (type === 'TYT' || type === 'AYT') return 'bg-violet-100 text-violet-700'
  if (['ALES', 'DGS', 'KPSS', 'KPSS_ONLISANS', 'KPSS_ORTAOGRETIM', 'YDS'].includes(type)) return 'bg-orange-100 text-orange-700'
  if (['SINIF_1', 'SINIF_2', 'SINIF_3', 'SINIF_4'].includes(type)) return 'bg-green-100 text-green-700'
  if (['SINIF_5', 'SINIF_6', 'SINIF_7', 'SINIF_8'].includes(type)) return 'bg-teal-100 text-teal-700'
  if (['SINIF_9', 'SINIF_10', 'SINIF_11', 'SINIF_12'].includes(type)) return 'bg-indigo-100 text-indigo-700'
  return 'bg-surface-100 text-surface-600'
}

export default function AdminDenemePage() {
  const [exams, setExams] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showBuilder, setShowBuilder] = useState(false)
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [activeCategory, setActiveCategory] = useState('all')

  useEffect(() => {
    fetchExams()
  }, [])

  async function fetchExams() {
    try {
      const res = await fetch('/api/mock-exam/list?per_page=200')
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
    if (!confirm('Bu sınavı silmek istediğinize emin misiniz?')) return
    try {
      const res = await fetch(`/api/mock-exam/admin/delete?examId=${examId}`, { method: 'DELETE' })
      if (res.ok) {
        setExams(prev => prev.filter(e => e.id !== examId && e.exam_id !== examId))
      }
    } catch (e) {
      console.error('Delete error:', e)
    }
  }

  const activeCat = EXAM_CATEGORIES.find(c => c.id === activeCategory)!
  const filteredExams = exams.filter(e => activeCat.match(e.exam_type))

  // Filtrelenmiş sınavları exam_type'a göre grupla
  const grouped = filteredExams.reduce((acc: Record<string, any[]>, exam) => {
    const key = exam.exam_type || 'Diğer'
    if (!acc[key]) acc[key] = []
    acc[key].push(exam)
    return acc
  }, {})

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-surface-900">Deneme Yönetimi</h1>
          <p className="text-sm text-surface-500">Deneme sınavlarını oluştur ve yönet</p>
        </div>
        <button
          onClick={() => setShowBuilder(!showBuilder)}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-medium hover:bg-primary-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Yeni Sınav
        </button>
      </div>

      {/* Sınav builder */}
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

      {/* Kategori Tab'ları */}
      <div className="flex flex-wrap gap-2 mb-6">
        {EXAM_CATEGORIES.map(cat => {
          const count = cat.id === 'all'
            ? exams.length
            : exams.filter(e => cat.match(e.exam_type)).length
          const isActive = activeCategory === cat.id
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? cat.activeBg + ' shadow-sm'
                  : 'bg-white border border-surface-200 ' + cat.color + ' hover:border-surface-300'
              }`}
            >
              <span>{cat.label}</span>
              <span className={`px-1.5 py-0.5 rounded-md text-xs font-bold ${
                isActive ? 'bg-white/20' : 'bg-surface-100 text-surface-500'
              }`}>
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {/* Sınav listesi */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-surface-100 p-8 text-center text-surface-400">
          <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
          Yükleniyor...
        </div>
      ) : filteredExams.length === 0 ? (
        <div className="bg-white rounded-2xl border border-surface-100 p-8 text-center text-surface-400">
          Bu kategoride henüz sınav oluşturulmamış
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([examType, groupExams]) => (
            <div key={examType} className="bg-white rounded-2xl border border-surface-100 overflow-hidden">
              {/* Grup başlığı */}
              <div className="flex items-center gap-3 px-6 py-3 border-b border-surface-50 bg-surface-50/50">
                <span className={`px-2.5 py-0.5 rounded-lg text-xs font-semibold ${getExamTypeBadge(examType)}`}>
                  {EXAM_TYPE_LABELS[examType] || examType}
                </span>
                <span className="text-xs text-surface-400">{groupExams.length} sınav</span>
                <span className="ml-auto text-xs text-surface-400">
                  {groupExams.filter(e => e.is_active).length} aktif
                </span>
              </div>

              {/* Grup içi sınavlar */}
              <div className="divide-y divide-surface-50">
                {groupExams.map((exam) => {
                  const examId = exam.id || exam.exam_id
                  return (
                    <div key={examId} className="flex items-center gap-4 px-6 py-3.5 hover:bg-surface-50/50 transition-colors">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-surface-800 truncate">{exam.title}</h3>
                        <div className="flex items-center gap-3 text-xs text-surface-400 mt-0.5">
                          {exam.grade > 0 && <span>{exam.grade}. Sınıf</span>}
                          <span>{exam.question_count || 0} soru</span>
                          <span>{exam.duration || 0} dk</span>
                          <span>{exam.total_attempts || 0} katılımcı</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => toggleExamStatus(examId, exam.is_active)}
                          disabled={togglingId === examId}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
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

                        <button
                          onClick={() => deleteExam(examId)}
                          className="p-1.5 text-surface-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
