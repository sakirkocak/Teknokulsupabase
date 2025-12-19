'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { Target, CheckCircle, Clock, ChevronRight, Sparkles, Gift, Zap } from 'lucide-react'
import { type DailyChallenge } from '@/lib/gamification'

interface ChallengeProgress {
  challenge_id: string
  current_progress: number
  is_completed: boolean
}

interface DailyChallengesCardProps {
  challenges: DailyChallenge[]
  progress: Record<string, ChallengeProgress>
  compact?: boolean
}

export default function DailyChallengesCard({ 
  challenges, 
  progress,
  compact = false 
}: DailyChallengesCardProps) {
  const [timeRemaining, setTimeRemaining] = useState('')

  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      const midnight = new Date(now)
      midnight.setHours(24, 0, 0, 0)
      
      const diff = midnight.getTime() - now.getTime()
      
      const hours = Math.floor(diff / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((diff % (1000 * 60)) / 1000)
      
      setTimeRemaining(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`)
    }

    updateTime()
    const interval = setInterval(updateTime, 1000)
    return () => clearInterval(interval)
  }, [])

  const completedCount = Object.values(progress).filter(p => p.is_completed).length
  const totalXPEarned = challenges.reduce((total, challenge) => {
    const challengeProgress = progress[challenge.id]
    return total + (challengeProgress?.is_completed ? challenge.xp_reward : 0)
  }, 0)
  const totalXPAvailable = challenges.reduce((total, c) => total + c.xp_reward, 0)
  
  // Eğer görev yoksa hiçbir şey gösterme
  if (challenges.length === 0) {
    return null
  }

  if (compact) {
    return (
      <Link href="/ogrenci/basarimlar" className="block">
        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-4 text-white hover:shadow-lg hover:shadow-emerald-500/30 transition-all">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Target className="w-6 h-6" />
              <div>
                <div className="text-xs opacity-80">Günlük Görevler</div>
                <div className="font-bold">{completedCount}/{challenges.length} tamamlandı</div>
              </div>
            </div>
            <div className="flex items-center gap-1 text-xs bg-white/20 px-2 py-1 rounded-full">
              <Clock className="w-3 h-3" />
              {timeRemaining}
            </div>
          </div>
          
          {/* Progress bar */}
          <div className="h-2 bg-white/20 rounded-full overflow-hidden mb-2">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${challenges.length > 0 ? (completedCount / challenges.length) * 100 : 0}%` }}
              transition={{ duration: 0.5 }}
              className="h-full bg-white rounded-full"
            />
          </div>
          
          <div className="flex justify-between text-xs opacity-80">
            <span>+{totalXPEarned} XP kazanıldı</span>
            <span>+{totalXPAvailable - totalXPEarned} XP kaldı</span>
          </div>
        </div>
      </Link>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-3xl shadow-lg border border-surface-100 overflow-hidden"
    >
      {/* Header */}
      <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
              <Target className="w-8 h-8" />
            </div>
            <div>
              <div className="text-sm opacity-80">Günlük Görevler</div>
              <div className="text-2xl font-bold">{completedCount}/{challenges.length}</div>
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-1 text-sm opacity-80">
              <Clock className="w-4 h-4" />
              Kalan süre
            </div>
            <div className="text-xl font-mono font-bold">{timeRemaining}</div>
          </div>
        </div>

        {/* XP Progress */}
        <div className="mt-4">
          <div className="flex justify-between text-sm mb-1">
            <span className="opacity-80">XP İlerlemesi</span>
            <span className="font-bold">{totalXPEarned}/{totalXPAvailable} XP</span>
          </div>
          <div className="h-3 bg-white/20 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(totalXPEarned / totalXPAvailable) * 100}%` }}
              transition={{ duration: 0.5 }}
              className="h-full bg-white rounded-full"
            />
          </div>
        </div>
      </div>

      {/* Challenges List */}
      <div className="p-4 space-y-3">
        {challenges.map((challenge, index) => {
          const challengeProgress = progress[challenge.id]
          const isCompleted = challengeProgress?.is_completed || false
          const current = challengeProgress?.current_progress || 0
          const progressPercent = Math.min(100, (current / challenge.target_value) * 100)

          return (
            <motion.div
              key={challenge.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`p-4 rounded-xl border-2 transition-all ${
                isCompleted
                  ? 'bg-green-50 border-green-200'
                  : 'bg-surface-50 border-surface-100 hover:border-emerald-200'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    isCompleted
                      ? 'bg-green-500 text-white'
                      : challenge.difficulty === 'easy'
                      ? 'bg-emerald-100 text-emerald-600'
                      : challenge.difficulty === 'medium'
                      ? 'bg-amber-100 text-amber-600'
                      : 'bg-red-100 text-red-600'
                  }`}>
                    {isCompleted ? <CheckCircle className="w-5 h-5" /> : <Target className="w-5 h-5" />}
                  </div>
                  <div>
                    <h4 className={`font-medium ${isCompleted ? 'text-green-700 line-through' : 'text-surface-900'}`}>
                      {challenge.title}
                    </h4>
                    <p className={`text-sm ${isCompleted ? 'text-green-600' : 'text-surface-500'}`}>
                      {challenge.description}
                    </p>
                  </div>
                </div>
                <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-sm font-medium ${
                  isCompleted
                    ? 'bg-green-200 text-green-700'
                    : 'bg-amber-100 text-amber-700'
                }`}>
                  <Zap className="w-3 h-3" />
                  +{challenge.xp_reward}
                </div>
              </div>

              {/* Progress bar */}
              {!isCompleted && (
                <div className="mt-2">
                  <div className="flex justify-between text-xs text-surface-500 mb-1">
                    <span>{current}/{challenge.target_value}</span>
                    <span>{Math.round(progressPercent)}%</span>
                  </div>
                  <div className="h-2 bg-surface-200 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${progressPercent}%` }}
                      transition={{ duration: 0.5 }}
                      className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full"
                    />
                  </div>
                </div>
              )}
            </motion.div>
          )
        })}
      </div>

      {/* Bonus info */}
      {completedCount === challenges.length && (
        <div className="px-4 pb-4">
          <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl text-center">
            <Gift className="w-8 h-8 text-amber-500 mx-auto mb-2" />
            <p className="text-amber-700 font-medium">🎉 Tüm görevleri tamamladın!</p>
            <p className="text-sm text-amber-600">Yarın yeni görevler için tekrar gel</p>
          </div>
        </div>
      )}

      {/* CTA */}
      {completedCount < challenges.length && (
        <div className="px-4 pb-4">
          <Link 
            href="/ogrenci/soru-bankasi" 
            className="flex items-center justify-center gap-2 w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-emerald-500/30 transition-all"
          >
            <Sparkles className="w-4 h-4" />
            Görevleri Tamamla
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      )}
    </motion.div>
  )
}

