'use client'

import type { AnswerOption, ExamQuestionForClient } from '@/lib/mock-exam/types'
import { Flag, ChevronLeft, ChevronRight } from 'lucide-react'
import DOMPurify from 'isomorphic-dompurify'
import MathRenderer from '../MathRenderer'

interface ExamQuestionProps {
  question: ExamQuestionForClient
  selectedAnswer: AnswerOption | null
  isFlagged: boolean
  questionIndex: number
  totalQuestions: number
  onAnswer: (answer: AnswerOption | null) => void
  onToggleFlag: () => void
  onNext: () => void
  onPrev: () => void
}

const OPTION_LABELS: AnswerOption[] = ['A', 'B', 'C', 'D']

// DOMPurify SVG/HTML sanitize config
const SANITIZE_CONFIG = {
  ADD_TAGS: ['svg', 'path', 'circle', 'rect', 'line', 'polyline', 'polygon', 'text', 'g', 'defs', 'linearGradient', 'stop', 'clipPath', 'marker', 'use', 'symbol', 'ellipse', 'tspan', 'table', 'thead', 'tbody', 'tr', 'td', 'th'],
  ADD_ATTR: ['viewBox', 'xmlns', 'd', 'fill', 'stroke', 'stroke-width', 'cx', 'cy', 'r', 'x', 'y', 'x1', 'y1', 'x2', 'y2', 'width', 'height', 'transform', 'text-anchor', 'font-size', 'font-family', 'font-weight', 'dominant-baseline', 'points', 'rx', 'ry', 'offset', 'stop-color', 'stop-opacity', 'gradientUnits', 'gradientTransform', 'stroke-dasharray', 'stroke-linecap', 'stroke-linejoin', 'opacity', 'clip-path', 'marker-end', 'marker-start', 'href', 'xlink:href', 'style', 'colspan', 'rowspan', 'scope'],
}

export default function ExamQuestion({
  question,
  selectedAnswer,
  isFlagged,
  questionIndex,
  totalQuestions,
  onAnswer,
  onToggleFlag,
  onNext,
  onPrev,
}: ExamQuestionProps) {
  const hasVisual = question.visual_content && question.visual_type && question.visual_type !== 'none'

  return (
    <div className="flex flex-col h-full">
      {/* Soru header */}
      <div className="flex items-center justify-between mb-4">
        <div className="text-sm text-surface-500">
          Soru <span className="font-bold text-surface-900">{question.question_order}</span>
          <span className="text-surface-400">/{totalQuestions}</span>
        </div>
        <span className="text-xs px-2.5 py-1 rounded-full bg-surface-100 text-surface-500 font-medium">
          {question.subject?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
        </span>
      </div>

      {/* Soru metni + gorsel */}
      <div className="flex-1 overflow-y-auto mb-6">
        {/* Yeni Nesil Gorsel */}
        {hasVisual && (
          <div className="mb-4 p-3 bg-white rounded-xl border border-surface-100 shadow-sm">
            <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-700 text-[10px] font-medium rounded-full mb-2">
              <span>✨</span> Yeni Nesil Grafik
            </div>
            <div
              className="overflow-x-auto"
              dangerouslySetInnerHTML={{
                __html: DOMPurify.sanitize(question.visual_content!, SANITIZE_CONFIG)
              }}
            />
          </div>
        )}

        {/* Soru metni */}
        <div className="prose prose-sm max-w-none">
          <div className="text-surface-800 text-base leading-relaxed">
            <MathRenderer text={question.question_text} />
          </div>
        </div>

        {/* Soru gorseli (eski tip - base64/URL) */}
        {question.question_image_url && (
          <div className="mt-4">
            <img
              src={question.question_image_url}
              alt={`Soru ${question.question_order}`}
              className="max-w-full rounded-xl border border-surface-100"
              loading="lazy"
            />
          </div>
        )}

        {/* Secenekler */}
        <div className="mt-6 space-y-3">
          {OPTION_LABELS.map(option => {
            const optionText = question.options[option]
            if (!optionText) return null

            const isSelected = selectedAnswer === option

            return (
              <button
                key={option}
                onClick={() => onAnswer(isSelected ? null : option)}
                className={`w-full flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-all ${
                  isSelected
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-surface-100 hover:border-surface-200 hover:bg-surface-50'
                }`}
              >
                <span
                  className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${
                    isSelected
                      ? 'bg-primary-500 text-white'
                      : 'bg-surface-100 text-surface-600'
                  }`}
                >
                  {option}
                </span>
                <span
                  className={`text-sm leading-relaxed pt-1 ${
                    isSelected ? 'text-primary-800 font-medium' : 'text-surface-700'
                  }`}
                >
                  <MathRenderer text={optionText} />
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Alt butonlar */}
      <div className="flex items-center justify-between pt-4 border-t border-surface-100">
        <button
          onClick={onPrev}
          disabled={questionIndex === 0}
          className="flex items-center gap-1 px-4 py-2.5 text-sm font-medium text-surface-600 hover:bg-surface-50 rounded-xl transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="w-4 h-4" />
          Onceki
        </button>

        <button
          onClick={onToggleFlag}
          className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium rounded-xl transition-colors ${
            isFlagged
              ? 'bg-amber-100 text-amber-700'
              : 'text-surface-500 hover:bg-surface-50'
          }`}
        >
          <Flag className={`w-4 h-4 ${isFlagged ? 'fill-amber-500' : ''}`} />
          {isFlagged ? 'Isaretli' : 'Isaretle'}
        </button>

        <button
          onClick={onNext}
          disabled={questionIndex === totalQuestions - 1}
          className="flex items-center gap-1 px-4 py-2.5 text-sm font-medium text-primary-600 hover:bg-primary-50 rounded-xl transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          Sonraki
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
