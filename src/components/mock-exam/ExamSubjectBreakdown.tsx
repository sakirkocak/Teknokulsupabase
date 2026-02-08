'use client'

import type { NetBreakdown } from '@/lib/mock-exam/types'
import { SUBJECT_COLORS, SUBJECT_DISPLAY_NAMES } from '@/lib/mock-exam/constants'

interface ExamSubjectBreakdownProps {
  netBreakdown: NetBreakdown
  maxQuestions?: number // Her ders icin max soru (bar doluluk icin)
}

export default function ExamSubjectBreakdown({ netBreakdown, maxQuestions = 20 }: ExamSubjectBreakdownProps) {
  const subjects = Object.entries(netBreakdown)

  return (
    <div className="bg-white rounded-2xl border border-surface-100 p-6">
      <h3 className="text-lg font-bold text-surface-900 mb-6">Ders Bazli Analiz</h3>

      <div className="space-y-5">
        {subjects.map(([subject, detail]) => {
          const colors = SUBJECT_COLORS[subject] || SUBJECT_COLORS.turkce
          const displayName = SUBJECT_DISPLAY_NAMES[subject] || subject
          const netPercent = Math.max(0, Math.min(100, (detail.net / maxQuestions) * 100))

          return (
            <div key={subject}>
              <div className="flex items-center justify-between mb-2">
                <span className={`text-sm font-semibold ${colors.text}`}>{displayName}</span>
                <span className="text-sm font-bold text-surface-700">
                  {detail.net.toFixed(2)} Net
                </span>
              </div>

              {/* Progress bar */}
              <div className="h-4 bg-surface-100 rounded-full overflow-hidden mb-2">
                <div
                  className={`h-full ${colors.bg} rounded-full transition-all duration-700 ease-out`}
                  style={{ width: `${netPercent}%` }}
                />
              </div>

              {/* Detay */}
              <div className="flex items-center gap-4 text-xs">
                <span className="text-green-600 font-medium">{detail.dogru}D</span>
                <span className="text-red-500 font-medium">{detail.yanlis}Y</span>
                <span className="text-surface-400">{detail.bos}B</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
