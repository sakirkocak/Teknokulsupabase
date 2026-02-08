'use client'

import { useState, useEffect } from 'react'
import { Trophy, Medal, Award } from 'lucide-react'

interface RankingItem {
  rank: number
  student_name: string
  score: number
  total_net: number
  time_taken: number
  is_current_user?: boolean
}

interface ExamLeaderboardProps {
  examId: string
  currentUserId?: string
  initialRankings?: RankingItem[]
}

export default function ExamLeaderboard({ examId, currentUserId, initialRankings }: ExamLeaderboardProps) {
  const [rankings, setRankings] = useState<RankingItem[]>(initialRankings || [])
  const [loading, setLoading] = useState(!initialRankings)

  useEffect(() => {
    if (initialRankings) return

    async function fetchRankings() {
      try {
        const res = await fetch(`/api/mock-exam/results?exam_id=${examId}&per_page=50`)
        if (!res.ok) return
        const data = await res.json()
        setRankings(data.rankings || [])
      } catch (e) {
        console.error('Ranking fetch error:', e)
      } finally {
        setLoading(false)
      }
    }

    fetchRankings()
  }, [examId, initialRankings])

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-surface-100 p-6">
        <h3 className="text-lg font-bold text-surface-900 mb-4">Siralama</h3>
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-12 bg-surface-100 rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  if (rankings.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-surface-100 p-6 text-center text-surface-400">
        Henuz kimse cozmemis
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-surface-100 p-6">
      <h3 className="text-lg font-bold text-surface-900 mb-4">Siralama</h3>

      <div className="space-y-2">
        {rankings.map((item) => {
          const isCurrentUser = item.is_current_user ||
            (currentUserId && (item as any).user_id === currentUserId)
          const minutes = Math.floor(item.time_taken / 60)

          return (
            <div
              key={item.rank}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                isCurrentUser
                  ? 'bg-primary-50 border border-primary-200'
                  : 'hover:bg-surface-50'
              }`}
            >
              {/* Sira */}
              <div className="w-8 text-center flex-shrink-0">
                {item.rank === 1 ? (
                  <Trophy className="w-6 h-6 text-amber-500 mx-auto" />
                ) : item.rank === 2 ? (
                  <Medal className="w-6 h-6 text-gray-400 mx-auto" />
                ) : item.rank === 3 ? (
                  <Award className="w-6 h-6 text-amber-700 mx-auto" />
                ) : (
                  <span className="text-sm font-bold text-surface-500">{item.rank}</span>
                )}
              </div>

              {/* Isim */}
              <div className="flex-1 min-w-0">
                <span className={`text-sm font-medium truncate block ${
                  isCurrentUser ? 'text-primary-700' : 'text-surface-700'
                }`}>
                  {item.student_name}
                  {isCurrentUser && <span className="text-xs ml-1">(Siz)</span>}
                </span>
              </div>

              {/* Puan */}
              <div className="text-right flex-shrink-0">
                <div className="text-sm font-bold text-surface-800">{Number(item.score).toFixed(1)}</div>
                <div className="text-xs text-surface-400">{Number(item.total_net).toFixed(1)} net / {minutes}dk</div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
