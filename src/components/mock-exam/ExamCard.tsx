'use client'

import Link from 'next/link'
import { Clock, Users, BookOpen, ArrowRight } from 'lucide-react'
import { EXAM_TYPE_LABELS, SUBJECT_COLORS, EXAM_CONFIGS } from '@/lib/mock-exam/constants'

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

const EXAM_TYPE_COLORS: Record<string, { badge: string; accent: string; hover: string }> = {
  LGS:              { badge: 'bg-indigo-100 text-indigo-700', accent: 'border-l-indigo-400', hover: 'hover:border-indigo-300' },
  TYT:              { badge: 'bg-orange-100 text-orange-700', accent: 'border-l-orange-400', hover: 'hover:border-orange-300' },
  AYT:              { badge: 'bg-rose-100 text-rose-700',     accent: 'border-l-rose-400',   hover: 'hover:border-rose-300' },
  KPSS:             { badge: 'bg-blue-100 text-blue-700',     accent: 'border-l-blue-400',   hover: 'hover:border-blue-300' },
  KPSS_ONLISANS:    { badge: 'bg-cyan-100 text-cyan-700',     accent: 'border-l-cyan-400',   hover: 'hover:border-cyan-300' },
  KPSS_ORTAOGRETIM: { badge: 'bg-teal-100 text-teal-700',     accent: 'border-l-teal-400',   hover: 'hover:border-teal-300' },
  DGS:              { badge: 'bg-green-100 text-green-700',   accent: 'border-l-green-400',  hover: 'hover:border-green-300' },
  ALES:             { badge: 'bg-violet-100 text-violet-700', accent: 'border-l-violet-400', hover: 'hover:border-violet-300' },
  YDS:              { badge: 'bg-sky-100 text-sky-700',       accent: 'border-l-sky-400',    hover: 'hover:border-sky-300' },
}

function getBurslulukColor(exam_type: string) {
  if (exam_type.startsWith('BURSLULUK')) {
    return { badge: 'bg-amber-100 text-amber-700', accent: 'border-l-amber-400', hover: 'hover:border-amber-300' }
  }
  return null
}

const DEFAULT_COLORS = { badge: 'bg-primary-100 text-primary-700', accent: 'border-l-primary-400', hover: 'hover:border-primary-300' }

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
  const typeColors = EXAM_TYPE_COLORS[exam_type] || getBurslulukColor(exam_type) || DEFAULT_COLORS
  const isExamBased = EXAM_CONFIGS[exam_type]?.grades?.[0] === 0
  const showGrade = !isExamBased && grade > 0

  return (
    <Link
      href={`/deneme-dunyasi/${slug}`}
      className={`flex flex-col bg-white rounded-2xl border border-surface-100 border-l-4 ${typeColors.accent} ${typeColors.hover} hover:shadow-xl transition-all duration-200 group overflow-hidden`}
    >
      {/* Üst kısım */}
      <div className="p-6 flex-1">
        <div className="flex items-start justify-between mb-3">
          <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold ${typeColors.badge}`}>
            {EXAM_TYPE_LABELS[exam_type] || exam_type}
          </span>
          {showGrade && (
            <span className="text-xs font-medium text-surface-400 bg-surface-50 px-2.5 py-1 rounded-lg">
              {grade}. Sınıf
            </span>
          )}
        </div>

        <h3 className="text-lg font-bold text-surface-900 group-hover:text-primary-600 transition-colors leading-snug mb-2">
          {title}
        </h3>

        {description && (
          <p className="text-sm text-surface-500 line-clamp-2 leading-relaxed">
            {description}
          </p>
        )}

        {/* Ders etiketleri */}
        {subjects.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-4">
            {subjects.map(subject => {
              const color = SUBJECT_COLORS[subject] || SUBJECT_COLORS.turkce
              return (
                <span
                  key={subject}
                  className={`text-xs px-2.5 py-1 rounded-lg ${color.light} ${color.text} font-medium`}
                >
                  {subject.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </span>
              )
            })}
          </div>
        )}
      </div>

      {/* Alt istatistik bar */}
      <div className="px-6 py-4 bg-surface-50/60 border-t border-surface-100 flex items-center justify-between">
        <div className="flex items-center gap-4 text-xs text-surface-500">
          <span className="flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5" />
            {question_count} soru
          </span>
          <span className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            {duration} dk
          </span>
          <span className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5" />
            {total_attempts} kişi
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-xs font-semibold text-primary-600 group-hover:gap-2.5 transition-all">
          <span>Başla</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </div>
      </div>
    </Link>
  )
}
