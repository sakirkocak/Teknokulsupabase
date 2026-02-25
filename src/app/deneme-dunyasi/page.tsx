'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { ChevronDown, Loader2 } from 'lucide-react'
import ExamCard from '@/components/mock-exam/ExamCard'

interface ExamItem {
  id: string
  exam_id: string
  title: string
  slug: string
  description: string
  grade: number
  exam_type: string
  duration: number
  question_count: number
  total_attempts: number
  average_score: number
  subjects: string[]
  start_date: string | null
  end_date: string | null
}

interface ExamTypeCategory {
  key: string
  label: string
  shortLabel: string
  icon: string
  color: string
  bg: string
  border: string
  selectedBg: string
  examType?: string
  examGroup?: string
}

interface GradeCategory {
  grade: number
  label: string
  examType: string
  level: 'ilkokul' | 'ortaokul' | 'lise'
}

const EXAM_CATEGORIES: ExamTypeCategory[] = [
  { key: '', label: 'Tüm Denemeler', shortLabel: 'Tümü', icon: '📚', color: 'text-surface-700', bg: 'bg-white', border: 'border-surface-200', selectedBg: 'bg-surface-900' },
  { key: 'LGS', label: 'LGS', shortLabel: 'LGS', icon: '🏫', color: 'text-indigo-700', bg: 'bg-indigo-50', border: 'border-indigo-200', selectedBg: 'bg-indigo-600', examType: 'LGS' },
  { key: 'TYT', label: 'TYT', shortLabel: 'TYT', icon: '📝', color: 'text-orange-700', bg: 'bg-orange-50', border: 'border-orange-200', selectedBg: 'bg-orange-500', examType: 'TYT' },
  { key: 'AYT', label: 'AYT', shortLabel: 'AYT', icon: '🎯', color: 'text-rose-700', bg: 'bg-rose-50', border: 'border-rose-200', selectedBg: 'bg-rose-600', examType: 'AYT' },
  { key: 'KPSS', label: 'KPSS Lisans', shortLabel: 'KPSS', icon: '🏛️', color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200', selectedBg: 'bg-blue-600', examType: 'KPSS' },
  { key: 'KPSS_ONLISANS', label: 'KPSS Ön Lisans', shortLabel: 'KPSS Ön L.', icon: '🎒', color: 'text-cyan-700', bg: 'bg-cyan-50', border: 'border-cyan-200', selectedBg: 'bg-cyan-600', examType: 'KPSS_ONLISANS' },
  { key: 'KPSS_ORTAOGRETIM', label: 'KPSS Lise', shortLabel: 'KPSS Lise', icon: '🎒', color: 'text-teal-700', bg: 'bg-teal-50', border: 'border-teal-200', selectedBg: 'bg-teal-600', examType: 'KPSS_ORTAOGRETIM' },
  { key: 'DGS', label: 'DGS', shortLabel: 'DGS', icon: '🔄', color: 'text-green-700', bg: 'bg-green-50', border: 'border-green-200', selectedBg: 'bg-green-600', examType: 'DGS' },
  { key: 'ALES', label: 'ALES', shortLabel: 'ALES', icon: '🎓', color: 'text-violet-700', bg: 'bg-violet-50', border: 'border-violet-200', selectedBg: 'bg-violet-600', examType: 'ALES' },
  { key: 'BURSLULUK', label: 'Bursluluk', shortLabel: 'Bursluluk', icon: '⭐', color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200', selectedBg: 'bg-amber-500', examGroup: 'BURSLULUK' },
]

const GRADE_CATEGORIES: GradeCategory[] = [
  { grade: 1, label: '1. Sınıf', examType: 'SINIF_1', level: 'ilkokul' },
  { grade: 2, label: '2. Sınıf', examType: 'SINIF_2', level: 'ilkokul' },
  { grade: 3, label: '3. Sınıf', examType: 'SINIF_3', level: 'ilkokul' },
  { grade: 4, label: '4. Sınıf', examType: 'SINIF_4', level: 'ilkokul' },
  { grade: 5, label: '5. Sınıf', examType: 'SINIF_5', level: 'ortaokul' },
  { grade: 6, label: '6. Sınıf', examType: 'SINIF_6', level: 'ortaokul' },
  { grade: 7, label: '7. Sınıf', examType: 'SINIF_7', level: 'ortaokul' },
  { grade: 8, label: '8. Sınıf', examType: 'SINIF_8', level: 'ortaokul' },
  { grade: 9, label: '9. Sınıf', examType: 'SINIF_9', level: 'lise' },
  { grade: 10, label: '10. Sınıf', examType: 'SINIF_10', level: 'lise' },
  { grade: 11, label: '11. Sınıf', examType: 'SINIF_11', level: 'lise' },
  { grade: 12, label: '12. Sınıf', examType: 'SINIF_12', level: 'lise' },
]

const LEVEL_COLORS = {
  ilkokul:  { base: 'text-emerald-700 bg-emerald-50 border-emerald-200', selected: 'bg-emerald-500 text-white border-transparent', dot: 'bg-emerald-400' },
  ortaokul: { base: 'text-blue-700 bg-blue-50 border-blue-200',          selected: 'bg-blue-500 text-white border-transparent',    dot: 'bg-blue-400' },
  lise:     { base: 'text-purple-700 bg-purple-50 border-purple-200',    selected: 'bg-purple-500 text-white border-transparent',  dot: 'bg-purple-400' },
}

const PER_PAGE = 6

export default function DenemeDunyasiPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [allExams, setAllExams] = useState<ExamItem[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)

  const fetchExams = useCallback(async (category: string, pageNum: number, append: boolean) => {
    if (pageNum === 1) setLoading(true)
    else setLoadingMore(true)

    try {
      const params = new URLSearchParams({ per_page: String(PER_PAGE), page: String(pageNum) })

      // Exam type kategori mi yoksa sınıf bazlı mı?
      const examCat = EXAM_CATEGORIES.find(c => c.key === category)
      const gradeCat = GRADE_CATEGORIES.find(c => c.examType === category)

      if (examCat?.examType) params.set('exam_type', examCat.examType)
      if (examCat?.examGroup) params.set('exam_group', examCat.examGroup)
      if (gradeCat) params.set('exam_type', gradeCat.examType)

      const res = await fetch(`/api/mock-exam/list?${params.toString()}`)
      if (!res.ok) return

      const data = await res.json()
      setTotalPages(data.totalPages || 1)

      if (append) setAllExams(prev => [...prev, ...(data.exams || [])])
      else setAllExams(data.exams || [])
    } catch (e) {
      console.error('Exam list error:', e)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [])

  useEffect(() => {
    setPage(1)
    setAllExams([])
    fetchExams(selectedCategory, 1, false)
  }, [selectedCategory, fetchExams])

  function handleLoadMore() {
    const nextPage = page + 1
    setPage(nextPage)
    fetchExams(selectedCategory, nextPage, true)
  }

  const activeExamCat = EXAM_CATEGORIES.find(c => c.key === selectedCategory)
  const activeGradeCat = GRADE_CATEGORIES.find(c => c.examType === selectedCategory)
  const activeLabel = activeExamCat?.label || activeGradeCat?.label || 'Tüm Denemeler'
  const activeIcon = activeExamCat?.icon || (activeGradeCat?.level === 'ilkokul' ? '🌱' : activeGradeCat?.level === 'ortaokul' ? '📘' : '🏆') || '📚'

  return (
    <div className="min-h-screen bg-surface-50">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-white/5 rounded-full translate-y-1/2" />
        <div className="max-w-7xl mx-auto px-4 py-10 lg:py-14 relative">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-9 h-9 bg-white/20 rounded-lg flex items-center justify-center overflow-hidden">
              <Image src="/images/logo-white.png" alt="Teknokul" width={28} height={28} className="object-contain"
                onError={(e) => { e.currentTarget.style.display = 'none' }} />
            </div>
            <span className="text-white/80 text-sm font-semibold tracking-wide">Teknokul</span>
          </div>
          <h1 className="text-4xl lg:text-5xl font-black tracking-tight mb-3">Deneme Dünyası</h1>
          <p className="text-primary-200 text-base max-w-lg">
            Gerçek sınav formatında dene, puanını öğren. Her sınav için adım adım analiz.
          </p>
        </div>
      </div>

      {/* Kategori paneli */}
      <div className="max-w-7xl mx-auto px-4 py-5">
        <div className="bg-white rounded-2xl border border-surface-100 shadow-sm overflow-hidden">

          {/* Sınav Türleri */}
          <div className="p-4 border-b border-surface-100">
            <p className="text-xs font-semibold text-surface-400 uppercase tracking-wider mb-3">Sınav Türü</p>
            <div className="flex flex-wrap gap-2">
              {EXAM_CATEGORIES.map((cat) => {
                const isSelected = selectedCategory === cat.key
                return (
                  <button key={cat.key} onClick={() => setSelectedCategory(cat.key)}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-xl border-2 text-sm font-semibold transition-all duration-200 hover:scale-105 active:scale-95 ${
                      isSelected ? `${cat.selectedBg} text-white border-transparent shadow-sm` : `${cat.bg} ${cat.color} ${cat.border}`
                    }`}
                  >
                    <span>{cat.icon}</span>
                    <span>{cat.shortLabel}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Sınıf Düzeyi */}
          <div className="p-4">
            <p className="text-xs font-semibold text-surface-400 uppercase tracking-wider mb-3">Sınıf Düzeyi</p>
            <div className="space-y-2">
              {(['ilkokul', 'ortaokul', 'lise'] as const).map((level) => {
                const levelLabel = level === 'ilkokul' ? '🌱 İlkokul' : level === 'ortaokul' ? '📘 Ortaokul' : '🏆 Lise'
                const grades = GRADE_CATEGORIES.filter(g => g.level === level)
                const colors = LEVEL_COLORS[level]
                return (
                  <div key={level} className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-surface-400 w-16 shrink-0">{levelLabel}</span>
                    {grades.map((g) => {
                      const isSelected = selectedCategory === g.examType
                      return (
                        <button key={g.examType} onClick={() => setSelectedCategory(g.examType)}
                          className={`flex flex-col items-center justify-center w-14 h-14 rounded-xl border-2 transition-all duration-200 hover:scale-105 active:scale-95 ${
                            isSelected ? colors.selected : colors.base
                          }`}
                        >
                          <span className="text-lg font-black leading-none">{g.grade}</span>
                          <span className="text-[10px] font-medium opacity-80">Sınıf</span>
                        </button>
                      )
                    })}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Aktif başlık */}
      <div className="max-w-7xl mx-auto px-4 pb-4 flex items-center gap-2">
        <span className="text-lg">{activeIcon}</span>
        <h2 className="text-lg font-bold text-surface-800">{activeLabel}</h2>
        {!loading && allExams.length > 0 && (
          <span className="text-sm text-surface-400 font-normal ml-1">{allExams.length} deneme</span>
        )}
      </div>

      {/* Sınav listesi */}
      <div className="max-w-7xl mx-auto px-4 pb-12">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: PER_PAGE }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-surface-100 p-6 animate-pulse">
                <div className="h-4 bg-surface-100 rounded w-1/3 mb-4" />
                <div className="h-7 bg-surface-100 rounded w-3/4 mb-3" />
                <div className="h-3 bg-surface-100 rounded w-full mb-2" />
                <div className="h-3 bg-surface-100 rounded w-4/5 mb-5" />
                <div className="flex gap-2 mb-5">
                  {[1, 2, 3].map(j => <div key={j} className="h-7 bg-surface-100 rounded-lg w-20" />)}
                </div>
                <div className="grid grid-cols-4 gap-2 pt-4 border-t border-surface-50">
                  {[1, 2, 3, 4].map(j => <div key={j} className="h-8 bg-surface-100 rounded" />)}
                </div>
              </div>
            ))}
          </div>
        ) : allExams.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">{activeIcon}</div>
            <h2 className="text-xl font-bold text-surface-600 mb-2">Henüz deneme yok</h2>
            <p className="text-surface-400">Bu kategoride yakında yeni denemeler eklenecek</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {allExams.map((exam) => (
                <ExamCard
                  key={exam.id || exam.exam_id}
                  id={exam.id || exam.exam_id}
                  title={exam.title}
                  slug={exam.slug}
                  description={exam.description}
                  grade={exam.grade}
                  exam_type={exam.exam_type}
                  duration={exam.duration}
                  question_count={exam.question_count}
                  total_attempts={exam.total_attempts}
                  average_score={exam.average_score}
                  subjects={exam.subjects || []}
                />
              ))}
            </div>
            {page < totalPages && (
              <div className="flex justify-center mt-10">
                <button onClick={handleLoadMore} disabled={loadingMore}
                  className="flex items-center gap-2 px-8 py-3.5 bg-white border border-surface-200 text-surface-700 rounded-2xl text-sm font-semibold hover:bg-surface-50 transition-all disabled:opacity-50 shadow-sm"
                >
                  {loadingMore ? <Loader2 className="w-4 h-4 animate-spin" /> : <ChevronDown className="w-4 h-4" />}
                  Daha Fazla Yükle
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
