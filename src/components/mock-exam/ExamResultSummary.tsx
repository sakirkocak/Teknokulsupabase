'use client'

import { Trophy, Target, Clock, Users } from 'lucide-react'

interface ExamResultSummaryProps {
  score: number
  maxScore?: number
  totalNet: number
  rank: number
  percentile: number
  totalAttempts: number
  timeTaken: number // saniye
  xpEarned?: number
}

export default function ExamResultSummary({
  score,
  maxScore = 500,
  totalNet,
  rank,
  percentile,
  totalAttempts,
  timeTaken,
  xpEarned,
}: ExamResultSummaryProps) {
  const scorePercent = Math.min(100, (score / maxScore) * 100)
  const minutes = Math.floor(timeTaken / 60)
  const seconds = timeTaken % 60

  // Puan rengini belirle
  const scoreColor = scorePercent >= 80 ? 'text-green-600' : scorePercent >= 60 ? 'text-blue-600' : scorePercent >= 40 ? 'text-amber-600' : 'text-red-600'
  const ringColor = scorePercent >= 80 ? 'stroke-green-500' : scorePercent >= 60 ? 'stroke-blue-500' : scorePercent >= 40 ? 'stroke-amber-500' : 'stroke-red-500'

  return (
    <div className="bg-white rounded-2xl border border-surface-100 p-6 lg:p-8">
      {/* Puan gauge */}
      <div className="flex flex-col items-center mb-8">
        <div className="relative w-48 h-48 mb-4">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
            {/* Arka plan halka */}
            <circle cx="60" cy="60" r="50" fill="none" strokeWidth="10" className="stroke-surface-100" />
            {/* Puan halkasi */}
            <circle
              cx="60" cy="60" r="50" fill="none" strokeWidth="10"
              className={ringColor}
              strokeLinecap="round"
              strokeDasharray={`${scorePercent * 3.14} ${314 - scorePercent * 3.14}`}
              style={{ transition: 'stroke-dasharray 1s ease-out' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-3xl font-black ${scoreColor}`}>
              {score.toFixed(1)}
            </span>
            <span className="text-sm text-surface-400">/ {maxScore}</span>
          </div>
        </div>

        {/* Toplam net */}
        <div className="text-center mb-2">
          <span className="text-2xl font-bold text-surface-800">{totalNet.toFixed(2)}</span>
          <span className="text-surface-500 ml-1">Net</span>
        </div>

        {/* XP */}
        {xpEarned && xpEarned > 0 && (
          <div className="inline-flex items-center gap-1 px-3 py-1.5 bg-amber-50 text-amber-700 rounded-full text-sm font-medium">
            +{xpEarned} XP
          </div>
        )}
      </div>

      {/* Istatistik kartlari */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-amber-50 rounded-xl p-4 text-center">
          <Trophy className="w-6 h-6 text-amber-500 mx-auto mb-2" />
          <div className="text-xl font-bold text-amber-700">{rank}.</div>
          <div className="text-xs text-amber-500">Siralama</div>
        </div>
        <div className="bg-blue-50 rounded-xl p-4 text-center">
          <Target className="w-6 h-6 text-blue-500 mx-auto mb-2" />
          <div className="text-xl font-bold text-blue-700">%{percentile.toFixed(0)}</div>
          <div className="text-xs text-blue-500">Yuzdelik</div>
        </div>
        <div className="bg-green-50 rounded-xl p-4 text-center">
          <Users className="w-6 h-6 text-green-500 mx-auto mb-2" />
          <div className="text-xl font-bold text-green-700">{totalAttempts}</div>
          <div className="text-xs text-green-500">Katilimci</div>
        </div>
        <div className="bg-purple-50 rounded-xl p-4 text-center">
          <Clock className="w-6 h-6 text-purple-500 mx-auto mb-2" />
          <div className="text-xl font-bold text-purple-700">{minutes}:{String(seconds).padStart(2, '0')}</div>
          <div className="text-xs text-purple-500">Sure</div>
        </div>
      </div>
    </div>
  )
}
