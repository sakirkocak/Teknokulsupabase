'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Clock, AlertTriangle, Zap } from 'lucide-react'
import { COMBO_SETTINGS } from '@/lib/gamification'

interface QuestionTimerProps {
  duration: number // Total duration in seconds
  isRunning: boolean
  onTimeUp?: () => void
  onTick?: (remaining: number) => void
  onFastAnswer?: () => void // Called when answered within FAST_ANSWER_THRESHOLD
  className?: string
  variant?: 'circle' | 'bar' | 'compact'
  showFastBonus?: boolean
}

export default function QuestionTimer({
  duration,
  isRunning,
  onTimeUp,
  onTick,
  onFastAnswer,
  className = '',
  variant = 'circle',
  showFastBonus = true,
}: QuestionTimerProps) {
  const [remaining, setRemaining] = useState(duration)
  const [showFastIndicator, setShowFastIndicator] = useState(false)
  
  // Reset timer when duration changes
  useEffect(() => {
    setRemaining(duration)
  }, [duration])
  
  // Timer logic
  useEffect(() => {
    if (!isRunning) return
    
    const interval = setInterval(() => {
      setRemaining(prev => {
        const newValue = prev - 1
        onTick?.(newValue)
        
        if (newValue <= 0) {
          clearInterval(interval)
          onTimeUp?.()
          return 0
        }
        
        return newValue
      })
    }, 1000)
    
    return () => clearInterval(interval)
  }, [isRunning, onTimeUp, onTick])
  
  // Calculate progress percentage
  const progress = (remaining / duration) * 100
  const timeSpent = duration - remaining
  const isFastAnswer = timeSpent <= COMBO_SETTINGS.FAST_ANSWER_THRESHOLD
  
  // Get color based on remaining time
  const getColor = useCallback(() => {
    const percentRemaining = (remaining / duration) * 100
    if (percentRemaining > 60) return { bg: 'bg-green-500', text: 'text-green-500', stroke: 'stroke-green-500' }
    if (percentRemaining > 30) return { bg: 'bg-yellow-500', text: 'text-yellow-500', stroke: 'stroke-yellow-500' }
    if (percentRemaining > 10) return { bg: 'bg-orange-500', text: 'text-orange-500', stroke: 'stroke-orange-500' }
    return { bg: 'bg-red-500', text: 'text-red-500', stroke: 'stroke-red-500' }
  }, [remaining, duration])
  
  const colors = getColor()
  
  // Format time as mm:ss
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }
  
  // Check if time is low
  const isLowTime = remaining <= 10
  
  // Call onFastAnswer when timer stops in fast zone
  const handleFastAnswer = useCallback(() => {
    if (isFastAnswer && isRunning) {
      setShowFastIndicator(true)
      onFastAnswer?.()
      setTimeout(() => setShowFastIndicator(false), 2000)
    }
  }, [isFastAnswer, isRunning, onFastAnswer])
  
  if (variant === 'compact') {
    return (
      <div className={`flex items-center gap-1.5 ${className}`}>
        <Clock className={`w-4 h-4 ${colors.text}`} />
        <motion.span
          key={remaining}
          initial={isLowTime ? { scale: 1.2 } : { scale: 1 }}
          animate={{ scale: 1 }}
          className={`font-mono font-bold ${colors.text} ${isLowTime ? 'animate-pulse' : ''}`}
        >
          {formatTime(remaining)}
        </motion.span>
        
        {/* Fast answer indicator */}
        {showFastBonus && isFastAnswer && isRunning && (
          <Zap className="w-4 h-4 text-cyan-500 animate-pulse" />
        )}
      </div>
    )
  }
  
  if (variant === 'bar') {
    return (
      <div className={`${className}`}>
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-1.5">
            <Clock className={`w-4 h-4 ${colors.text}`} />
            <span className={`text-sm font-bold ${colors.text}`}>
              {formatTime(remaining)}
            </span>
          </div>
          
          {showFastBonus && isFastAnswer && isRunning && (
            <div className="flex items-center gap-1 text-cyan-500 text-xs font-medium">
              <Zap className="w-3.5 h-3.5" />
              Hızlı bonus!
            </div>
          )}
        </div>
        
        <div className="h-2 bg-white/20 rounded-full overflow-hidden">
          <motion.div
            className={`h-full ${colors.bg} rounded-full relative`}
            initial={{ width: '100%' }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5 }}
          >
            {/* Pulse effect when low time */}
            {isLowTime && (
              <motion.div
                className="absolute inset-0 bg-white/30"
                animate={{ opacity: [0, 0.5, 0] }}
                transition={{ duration: 0.5, repeat: Infinity }}
              />
            )}
          </motion.div>
        </div>
      </div>
    )
  }
  
  // Circle variant (default)
  const circumference = 2 * Math.PI * 40 // radius = 40
  const strokeDashoffset = circumference - (progress / 100) * circumference
  
  return (
    <div className={`relative ${className}`}>
      <svg width="100" height="100" className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx="50"
          cy="50"
          r="40"
          fill="none"
          stroke="currentColor"
          strokeWidth="8"
          className="text-white/20"
        />
        
        {/* Progress circle */}
        <motion.circle
          cx="50"
          cy="50"
          r="40"
          fill="none"
          strokeWidth="8"
          strokeLinecap="round"
          className={colors.stroke}
          strokeDasharray={circumference}
          animate={{ strokeDashoffset }}
          transition={{ duration: 0.5 }}
        />
      </svg>
      
      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          key={remaining}
          initial={isLowTime ? { scale: 1.2 } : { scale: 1 }}
          animate={{ scale: 1 }}
          className={`text-2xl font-bold font-mono ${colors.text} ${isLowTime ? 'animate-pulse' : ''}`}
        >
          {formatTime(remaining)}
        </motion.span>
        
        {isLowTime && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-1 text-red-500 text-xs mt-1"
          >
            <AlertTriangle className="w-3 h-3" />
            Acele et!
          </motion.div>
        )}
        
        {showFastBonus && isFastAnswer && isRunning && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-1 text-cyan-500 text-xs mt-1"
          >
            <Zap className="w-3 h-3" />
            Hızlı!
          </motion.div>
        )}
      </div>
      
      {/* Fast answer popup */}
      <AnimatePresence>
        {showFastIndicator && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.8 }}
            animate={{ opacity: 1, y: -20, scale: 1 }}
            exit={{ opacity: 0, y: -30, scale: 0.8 }}
            className="absolute -top-2 left-1/2 -translate-x-1/2 whitespace-nowrap"
          >
            <div className="px-3 py-1.5 bg-cyan-500 text-white text-sm font-bold rounded-full shadow-lg flex items-center gap-1">
              <Zap className="w-4 h-4" />
              +{COMBO_SETTINGS.FAST_ANSWER_BONUS} HIZLI BONUS!
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// Hook for timer logic
export function useQuestionTimer(duration: number, autoStart: boolean = false) {
  const [remaining, setRemaining] = useState(duration)
  const [isRunning, setIsRunning] = useState(autoStart)
  const [timeSpent, setTimeSpent] = useState(0)
  
  const start = useCallback(() => {
    setIsRunning(true)
  }, [])
  
  const pause = useCallback(() => {
    setIsRunning(false)
  }, [])
  
  const reset = useCallback(() => {
    setRemaining(duration)
    setTimeSpent(0)
    setIsRunning(false)
  }, [duration])
  
  const stop = useCallback(() => {
    setIsRunning(false)
    setTimeSpent(duration - remaining)
    return duration - remaining
  }, [duration, remaining])
  
  useEffect(() => {
    if (!isRunning) return
    
    const interval = setInterval(() => {
      setRemaining(prev => {
        if (prev <= 1) {
          setIsRunning(false)
          setTimeSpent(duration)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    
    return () => clearInterval(interval)
  }, [isRunning, duration])
  
  const isFastAnswer = (duration - remaining) <= COMBO_SETTINGS.FAST_ANSWER_THRESHOLD
  const isTimeUp = remaining === 0
  const progress = (remaining / duration) * 100
  
  return {
    remaining,
    isRunning,
    timeSpent,
    isFastAnswer,
    isTimeUp,
    progress,
    start,
    pause,
    reset,
    stop,
  }
}

// Timer settings modal component
interface TimerSettingsProps {
  enabled: boolean
  duration: number
  onEnabledChange: (enabled: boolean) => void
  onDurationChange: (duration: number) => void
  className?: string
}

export function TimerSettings({
  enabled,
  duration,
  onEnabledChange,
  onDurationChange,
  className = '',
}: TimerSettingsProps) {
  const presets = [30, 45, 60, 90, 120]
  
  return (
    <div className={`space-y-4 ${className}`}>
      {/* Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-gray-500" />
          <span className="font-medium">Zamanlayıcı</span>
        </div>
        <button
          onClick={() => onEnabledChange(!enabled)}
          className={`
            relative w-12 h-6 rounded-full transition-colors
            ${enabled ? 'bg-indigo-500' : 'bg-gray-300'}
          `}
        >
          <motion.div
            className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow"
            animate={{ x: enabled ? 24 : 0 }}
          />
        </button>
      </div>
      
      {/* Duration selector */}
      {enabled && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
        >
          <label className="block text-sm text-gray-600 mb-2">
            Soru başına süre
          </label>
          <div className="flex flex-wrap gap-2">
            {presets.map((preset) => (
              <button
                key={preset}
                onClick={() => onDurationChange(preset)}
                className={`
                  px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
                  ${duration === preset
                    ? 'bg-indigo-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }
                `}
              >
                {preset}s
              </button>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  )
}

