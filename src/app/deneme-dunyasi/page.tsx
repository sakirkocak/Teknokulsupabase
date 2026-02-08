'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { GraduationCap, Filter, Search } from 'lucide-react'
import ExamCard from '@/components/mock-exam/ExamCard'
import { EXAM_TYPE_LABELS, GRADE_OPTIONS } from '@/lib/mock-exam/constants'

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

export default function DenemeDunyasiPage() {
  const [exams, setExams] = useState<ExamItem[]>([])
  const [loading, setLoading] = useState(true)
  const [gradeFilter, setGradeFilter] = useState<string>('')
  const [typeFilter, setTypeFilter] = useState<string>('')

  useEffect(() => {
    fetchExams()
  }, [gradeFilter, typeFilter])

  async function fetchExams() {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (gradeFilter) params.set('grade', gradeFilter)
      if (typeFilter) params.set('exam_type', typeFilter)

      const res = await fetch(`/api/mock-exam/list?${params.toString()}`)
      if (!res.ok) return

      const data = await res.json()
      setExams(data.exams || [])
    } catch (e) {
      console.error('Exam list error:', e)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-surface-50">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary-600 to-primary-800 text-white">
        <div className="max-w-7xl mx-auto px-4 py-12 lg:py-16">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <GraduationCap className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-3xl font-black">Deneme Dunyasi</h1>
              <p className="text-primary-200 text-sm mt-1">
                Gercek sinav formatinda deneme coz, puanini ogren
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filtreler */}
      <div className="max-w-7xl mx-auto px-4 -mt-6">
        <div className="bg-white rounded-2xl border border-surface-100 p-4 flex flex-wrap gap-3 items-center shadow-sm">
          <Filter className="w-4 h-4 text-surface-400" />

          <select
            value={gradeFilter}
            onChange={(e) => setGradeFilter(e.target.value)}
            className="px-3 py-2 border border-surface-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-200 outline-none"
          >
            <option value="">Tum Siniflar</option>
            {GRADE_OPTIONS.map(g => (
              <option key={g.value} value={g.value}>{g.label}</option>
            ))}
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 border border-surface-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-200 outline-none"
          >
            <option value="">Tum Turler</option>
            {Object.entries(EXAM_TYPE_LABELS).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Sinav listesi */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
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
        ) : exams.length === 0 ? (
          <div className="text-center py-16">
            <GraduationCap className="w-16 h-16 text-surface-300 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-surface-600 mb-2">Henuz sinav yok</h2>
            <p className="text-surface-400">Yakinda yeni denemeler eklenecek</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {exams.map((exam) => (
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
        )}
      </div>
    </div>
  )
}
