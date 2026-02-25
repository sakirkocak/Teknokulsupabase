'use client'

import { useState, useEffect, useCallback } from 'react'
import { GraduationCap, ChevronDown, Loader2 } from 'lucide-react'
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

interface Category {
  key: string
  label: string
  emoji: string
  examType?: string
  examGroup?: string
}

const CATEGORIES: Category[] = [
  { key: '', label: 'Tümü', emoji: '📚' },
  { key: 'LGS', label: 'LGS', emoji: '🏫', examType: 'LGS' },
  { key: 'TYT', label: 'TYT', emoji: '📝', examType: 'TYT' },
  { key: 'AYT', label: 'AYT', emoji: '🎯', examType: 'AYT' },
  { key: 'KPSS', label: 'KPSS Lisans', emoji: '🏛️', examType: 'KPSS' },
  { key: 'KPSS_ONLISANS', label: 'KPSS Ön Lisans', emoji: '🏛️', examType: 'KPSS_ONLISANS' },
  { key: 'KPSS_ORTAOGRETIM', label: 'KPSS Lise', emoji: '🏛️', examType: 'KPSS_ORTAOGRETIM' },
  { key: 'DGS', label: 'DGS', emoji: '🔄', examType: 'DGS' },
  { key: 'ALES', label: 'ALES', emoji: '🎓', examType: 'ALES' },
  { key: 'BURSLULUK', label: 'Bursluluk', emoji: '⭐', examGroup: 'BURSLULUK' },
]

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
      const cat = CATEGORIES.find(c => c.key === category) || CATEGORIES[0]
      const params = new URLSearchParams({ per_page: String(PER_PAGE), page: String(pageNum) })
      if (cat.examType) params.set('exam_type', cat.examType)
      if (cat.examGroup) params.set('exam_group', cat.examGroup)

      const res = await fetch(`/api/mock-exam/list?${params.toString()}`)
      if (!res.ok) return

      const data = await res.json()
      const newExams: ExamItem[] = data.exams || []
      setTotalPages(data.totalPages || 1)

      if (append) {
        setAllExams(prev => [...prev, ...newExams])
      } else {
        setAllExams(newExams)
      }
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

  return (
    <div className="min-h-screen bg-surface-50">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 text-white">
        <div className="max-w-7xl mx-auto px-4 py-12 lg:py-16">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <GraduationCap className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-3xl font-black">Teknokul Deneme Dünyası</h1>
              <p className="text-primary-200 text-sm mt-1">
                Gerçek sınav formatında dene, puanını öğren
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Kategori kartları */}
      <div className="max-w-7xl mx-auto px-4 -mt-5">
        <div className="bg-white rounded-2xl border border-surface-100 p-4 shadow-sm">
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat.key
              return (
                <button
                  key={cat.key}
                  onClick={() => setSelectedCategory(cat.key)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    isSelected
                      ? 'bg-primary-600 text-white shadow-sm shadow-primary-200'
                      : 'bg-surface-50 text-surface-600 hover:bg-surface-100'
                  }`}
                >
                  <span>{cat.emoji}</span>
                  <span>{cat.label}</span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Sinav listesi */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: PER_PAGE }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-surface-100 p-6 animate-pulse">
                <div className="h-4 bg-surface-100 rounded w-1/3 mb-3" />
                <div className="h-6 bg-surface-100 rounded w-2/3 mb-2" />
                <div className="h-3 bg-surface-100 rounded w-full mb-4" />
                <div className="flex gap-2 mb-4">
                  {[1, 2, 3, 4].map(j => (
                    <div key={j} className="h-6 bg-surface-100 rounded w-16" />
                  ))}
                </div>
                <div className="h-10 bg-surface-100 rounded" />
              </div>
            ))}
          </div>
        ) : allExams.length === 0 ? (
          <div className="text-center py-16">
            <GraduationCap className="w-16 h-16 text-surface-300 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-surface-600 mb-2">Henüz deneme yok</h2>
            <p className="text-surface-400">Bu kategoride yakında yeni denemeler eklenecek</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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

            {/* Daha Fazla Yükle */}
            {page < totalPages && (
              <div className="flex justify-center mt-8">
                <button
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="flex items-center gap-2 px-6 py-3 bg-white border border-surface-200 text-surface-700 rounded-xl text-sm font-medium hover:bg-surface-50 hover:border-surface-300 transition-all disabled:opacity-50"
                >
                  {loadingMore ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
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
