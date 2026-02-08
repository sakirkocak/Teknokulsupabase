'use client'

import Link from 'next/link'
import { Clock, Users, BarChart3, BookOpen } from 'lucide-react'
import { EXAM_TYPE_LABELS, SUBJECT_COLORS } from '@/lib/mock-exam/constants'

interface ExamCardProps {
  id: string
  title: string
  slug: string
  description: string | null
  grade: number
  exam_type: string
  duration: number
  question_count: number
  total_attempts: number
  average_score: number
  subjects: string[]
}

export default function ExamCard({
  title,
  slug,
  description,
  grade,
  exam_type,
  duration,
  question_count,
  total_attempts,
  average_score,
  subjects,
}: ExamCardProps) {
  return (
    <Link
      href={`/deneme-dunyasi/${slug}`}
      className="block bg-white rounded-2xl border border-surface-100 hover:border-primary-300 hover:shadow-lg transition-all p-6 group"
    >
      {/* Ust kisim */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <span className="inline-block px-3 py-1 bg-primary-50 text-primary-600 rounded-full text-xs font-medium mb-2">
            {EXAM_TYPE_LABELS[exam_type] || exam_type}
          </span>
          <h3 className="text-lg font-bold text-surface-900 group-hover:text-primary-600 transition-colors">
            {title}
          </h3>
          {description && (
            <p className="text-sm text-surface-500 mt-1 line-clamp-2">{description}</p>
          )}
        </div>
        <span className="text-sm font-medium text-surface-400 bg-surface-50 px-3 py-1 rounded-lg">
          {grade}. Sinif
        </span>
      </div>

      {/* Ders etiketleri */}
      <div className="flex flex-wrap gap-2 mb-4">
        {subjects.map(subject => {
          const color = SUBJECT_COLORS[subject] || SUBJECT_COLORS.turkce
          return (
            <span
              key={subject}
              className={`text-xs px-2 py-1 rounded-md ${color.light} ${color.text} font-medium`}
            >
              {subject.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </span>
          )
        })}
      </div>

      {/* Istatistikler */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-surface-50">
        <div className="flex items-center gap-2 text-sm text-surface-500">
          <BookOpen className="w-4 h-4" />
          <span>{question_count} soru</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-surface-500">
          <Clock className="w-4 h-4" />
          <span>{duration} dk</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-surface-500">
          <Users className="w-4 h-4" />
          <span>{total_attempts} kisi</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-surface-500">
          <BarChart3 className="w-4 h-4" />
          <span>Ort. {Math.round(average_score)}</span>
        </div>
      </div>
    </Link>
  )
}
