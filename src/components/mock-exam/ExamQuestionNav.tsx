'use client'

import { SUBJECT_COLORS, SUBJECT_DISPLAY_NAMES } from '@/lib/mock-exam/constants'
import type { AnswerOption, ExamQuestionForClient } from '@/lib/mock-exam/types'
import { Flag } from 'lucide-react'

interface ExamQuestionNavProps {
  subjects: string[]
  subjectQuestions: Record<string, ExamQuestionForClient[]>
  currentSubject: string
  currentQuestion: number
  answers: Record<number, AnswerOption | null>
  flagged: Set<number>
  subjectProgress: Record<string, { answered: number; total: number }>
  onSubjectChange: (subject: string) => void
  onQuestionChange: (questionOrder: number) => void
}

export default function ExamQuestionNav({
  subjects,
  subjectQuestions,
  currentSubject,
  currentQuestion,
  answers,
  flagged,
  subjectProgress,
  onSubjectChange,
  onQuestionChange,
}: ExamQuestionNavProps) {
  return (
    <div className="flex flex-col h-full">
      {/* Ders tablari */}
      <div className="space-y-1 mb-4">
        {subjects.map(subject => {
          const isActive = subject === currentSubject
          const progress = subjectProgress[subject]
          const colors = SUBJECT_COLORS[subject] || SUBJECT_COLORS.turkce
          const displayName = SUBJECT_DISPLAY_NAMES[subject] || subject

          return (
            <button
              key={subject}
              onClick={() => onSubjectChange(subject)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? `${colors.light} ${colors.text} ${colors.border} border`
                  : 'text-surface-600 hover:bg-surface-50'
              }`}
            >
              <span className="truncate">{displayName}</span>
              <span className={`text-xs ${isActive ? colors.text : 'text-surface-400'}`}>
                {progress?.answered || 0}/{progress?.total || 0}
              </span>
            </button>
          )
        })}
      </div>

      {/* Soru grid */}
      <div className="flex-1 overflow-y-auto">
        <div className="text-xs text-surface-400 mb-2 font-medium uppercase tracking-wider">
          Sorular
        </div>
        <div className="grid grid-cols-5 gap-1.5">
          {(subjectQuestions[currentSubject] || []).map(q => {
            const isActive = q.question_order === currentQuestion
            const isAnswered = answers[q.question_order] !== null && answers[q.question_order] !== undefined
            const isFlagged = flagged.has(q.question_order)

            let bgClass = 'bg-surface-100 text-surface-600 hover:bg-surface-200'
            if (isActive) {
              bgClass = 'bg-primary-500 text-white ring-2 ring-primary-300'
            } else if (isAnswered) {
              bgClass = 'bg-primary-100 text-primary-700'
            }

            return (
              <button
                key={q.question_order}
                onClick={() => onQuestionChange(q.question_order)}
                className={`relative w-9 h-9 rounded-lg text-xs font-bold transition-all ${bgClass}`}
              >
                {q.question_order}
                {isFlagged && (
                  <Flag className="absolute -top-1 -right-1 w-3 h-3 text-amber-500 fill-amber-500" />
                )}
              </button>
            )
          })}
        </div>

        {/* Legend */}
        <div className="mt-4 space-y-1.5 text-xs text-surface-500">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-primary-100 border border-primary-200" />
            <span>Cevaplanmis</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-surface-100" />
            <span>Bos</span>
          </div>
          <div className="flex items-center gap-2">
            <Flag className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
            <span>Isaretli</span>
          </div>
        </div>
      </div>
    </div>
  )
}
