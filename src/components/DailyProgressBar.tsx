'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Target, CheckCircle, Trophy, Flame, Star } from 'lucide-react'

interface DailyProgressBarProps {
  solved: number
  target: number
  correct?: number
  className?: string
  variant?: 'full' | 'compact' | 'minimal'
  showMilestones?: boolean
}

const milestones = [
  { percent: 25, label: '%25', emoji: '🏃' },
  { percent: 50, label: '%50', emoji: '💪' },
  { percent: 75, label: '%75', emoji: '🔥' },
  { percent: 100, label: 'Tamam!', emoji: '🎉' },
]

export default function DailyProgressBar({ 
  solved, 
  target, 
  correct = 0,
  className = '',
  variant = 'full',
  showMilestones = true,
}: DailyProgressBarProps) {
  const progress = Math.min(100, Math.round((solved / target) * 100))
  const isCompleted = solved >= target
  const accuracy = solved > 0 ? Math.round((correct / solved) * 100) : 0
  
  // Get gradient color based on progress
  const getGradientColor = () => {
    if (isCompleted) return 'from-green-500 via-emerald-500 to-teal-500'
    if (progress >= 75) return 'from-orange-500 via-amber-500 to-yellow-500'
    if (progress >= 50) return 'from-blue-500 via-indigo-500 to-purple-500'
    return 'from-indigo-500 via-purple-500 to-pink-500'
  }
  
  if (variant === 'minimal') {
    return (
      <div className={`w-full ${className}`}>
        <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className={`h-full bg-gradient-to-r ${getGradientColor()} rounded-full`}
          />
        </div>
      </div>
    )
  }
  
  if (variant === 'compact') {
    return (
      <div className={`${className}`}>
        <div className="flex items-center gap-2 mb-1">
          <Target className="w-4 h-4 text-white/70" />
          <span className="text-xs text-white/70">
            {solved}/{target}
          </span>
          <span className="text-xs font-bold text-white">
            {progress}%
          </span>
        </div>
        <div className="h-2 bg-white/20 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className={`h-full bg-gradient-to-r ${getGradientColor()} rounded-full relative`}
          >
            {/* Shimmer effect */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
              animate={{ x: ['-100%', '100%'] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            />
          </motion.div>
        </div>
      </div>
    )
  }
  
  // Full variant
  return (
    <div className={`bg-white/10 backdrop-blur-sm rounded-2xl p-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`
            w-10 h-10 rounded-xl flex items-center justify-center
            ${isCompleted ? 'bg-green-500' : 'bg-white/20'}
          `}>
            {isCompleted ? (
              <Trophy className="w-5 h-5 text-white" />
            ) : (
              <Target className="w-5 h-5 text-white" />
            )}
          </div>
          <div>
            <h3 className="text-white font-semibold text-sm">Günlük Hedef</h3>
            <p className="text-white/60 text-xs">
              {isCompleted ? 'Tamamlandı!' : `${target - solved} soru kaldı`}
            </p>
          </div>
        </div>
        
        <div className="text-right">
          <div className="text-2xl font-bold text-white">{solved}/{target}</div>
          <div className="text-xs text-white/60">
            {accuracy > 0 && `%${accuracy} başarı`}
          </div>
        </div>
      </div>
      
      {/* Progress bar */}
      <div className="relative">
        <div className="h-4 bg-white/20 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className={`h-full bg-gradient-to-r ${getGradientColor()} rounded-full relative`}
          >
            {/* Shimmer effect */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
              animate={{ x: ['-100%', '100%'] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
            />
            
            {/* Pulse effect when close to complete */}
            {progress >= 90 && !isCompleted && (
              <motion.div
                className="absolute inset-0 bg-white/20"
                animate={{ opacity: [0, 0.5, 0] }}
                transition={{ duration: 1, repeat: Infinity }}
              />
            )}
          </motion.div>
        </div>
        
        {/* Milestones */}
        {showMilestones && (
          <div className="absolute inset-0 flex items-center">
            {milestones.slice(0, -1).map((milestone) => (
              <div
                key={milestone.percent}
                className="absolute top-1/2 -translate-y-1/2"
                style={{ left: `${milestone.percent}%` }}
              >
                <div className={`
                  w-1 h-6 rounded-full transition-colors
                  ${progress >= milestone.percent ? 'bg-white/60' : 'bg-white/20'}
                `} />
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Progress percentage */}
      <div className="flex items-center justify-between mt-2">
        <span className="text-xs text-white/60">0%</span>
        <motion.span
          key={progress}
          initial={{ scale: 1.2 }}
          animate={{ scale: 1 }}
          className={`text-sm font-bold ${isCompleted ? 'text-green-400' : 'text-white'}`}
        >
          {progress}%
        </motion.span>
        <span className="text-xs text-white/60">100%</span>
      </div>
      
      {/* Completion celebration */}
      <AnimatePresence>
        {isCompleted && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mt-3 flex items-center justify-center gap-2 py-2 bg-green-500/20 rounded-xl"
          >
            <CheckCircle className="w-5 h-5 text-green-400" />
            <span className="text-green-400 font-semibold text-sm">
              Günlük hedefini tamamladın!
            </span>
            <span className="text-xl">🎉</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// Session stats component
interface SessionStatsProps {
  correct: number
  wrong: number
  total: number
  className?: string
}

export function SessionStats({ correct, wrong, total, className = '' }: SessionStatsProps) {
  const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0
  
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Correct */}
      <div className="flex items-center gap-1.5 bg-green-500/20 px-3 py-1.5 rounded-lg">
        <CheckCircle className="w-4 h-4 text-green-400" />
        <span className="text-green-400 font-bold">{correct}</span>
      </div>
      
      {/* Wrong */}
      <div className="flex items-center gap-1.5 bg-red-500/20 px-3 py-1.5 rounded-lg">
        <span className="w-4 h-4 flex items-center justify-center text-red-400 font-bold">✗</span>
        <span className="text-red-400 font-bold">{wrong}</span>
      </div>
      
      {/* Accuracy */}
      {total > 0 && (
        <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-lg">
          <Star className="w-4 h-4 text-amber-400" />
          <span className="text-white font-bold">%{accuracy}</span>
        </div>
      )}
    </div>
  )
}

// Mini progress indicator for top bar
interface MiniProgressProps {
  solved: number
  target: number
  className?: string
}

export function MiniProgress({ solved, target, className = '' }: MiniProgressProps) {
  const progress = Math.min(100, Math.round((solved / target) * 100))
  const isCompleted = solved >= target
  
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="flex items-center gap-1 text-white/80 text-sm">
        <Target className="w-4 h-4" />
        <span className="font-medium">{solved}/{target}</span>
      </div>
      <div className="w-20 h-1.5 bg-white/20 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          className={`h-full rounded-full ${
            isCompleted 
              ? 'bg-green-500' 
              : 'bg-gradient-to-r from-indigo-500 to-purple-500'
          }`}
        />
      </div>
    </div>
  )
}

