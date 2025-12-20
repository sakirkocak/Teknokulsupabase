'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Flame, Zap, Crown, Sparkles } from 'lucide-react'
import { COMBO_SETTINGS } from '@/lib/gamification'

interface ComboIndicatorProps {
  streak: number
  showBonus?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const comboLevels = [
  { min: 20, color: 'from-rose-500 to-red-600', text: 'text-rose-500', icon: Crown, label: 'GOAT' },
  { min: 15, color: 'from-purple-500 to-violet-600', text: 'text-purple-500', icon: Sparkles, label: 'EFSANE' },
  { min: 10, color: 'from-orange-500 to-amber-600', text: 'text-orange-500', icon: Flame, label: 'YANGIN' },
  { min: 5, color: 'from-yellow-500 to-amber-500', text: 'text-yellow-500', icon: Zap, label: 'COMBO' },
  { min: 3, color: 'from-green-500 to-emerald-500', text: 'text-green-500', icon: Flame, label: 'SERİ' },
  { min: 0, color: 'from-gray-400 to-gray-500', text: 'text-gray-400', icon: Flame, label: '' },
]

function getComboLevel(streak: number) {
  return comboLevels.find(level => streak >= level.min) || comboLevels[comboLevels.length - 1]
}

const sizeConfig = {
  sm: {
    container: 'px-2 py-1 gap-1',
    icon: 'w-3.5 h-3.5',
    text: 'text-xs',
    label: 'text-[10px]',
  },
  md: {
    container: 'px-3 py-1.5 gap-1.5',
    icon: 'w-4 h-4',
    text: 'text-sm',
    label: 'text-xs',
  },
  lg: {
    container: 'px-4 py-2 gap-2',
    icon: 'w-5 h-5',
    text: 'text-base',
    label: 'text-sm',
  },
}

export default function ComboIndicator({ streak, showBonus = false, size = 'md', className = '' }: ComboIndicatorProps) {
  const level = getComboLevel(streak)
  const Icon = level.icon
  const sizeClass = sizeConfig[size]
  const comboCount = Math.floor(streak / COMBO_SETTINGS.COMBO_THRESHOLD)
  const isComboActive = comboCount > 0
  
  if (streak < 1) return null
  
  return (
    <div className={`relative ${className}`}>
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className={`
          flex items-center ${sizeClass.container}
          bg-gradient-to-r ${level.color}
          rounded-full text-white shadow-lg
          relative overflow-hidden
        `}
      >
        {/* Pulse animation for active combo */}
        {streak >= 5 && (
          <motion.div
            className="absolute inset-0 bg-white/20 rounded-full"
            animate={{ 
              scale: [1, 1.5, 1],
              opacity: [0.5, 0, 0.5],
            }}
            transition={{ 
              duration: 1.5,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        )}
        
        {/* Rotating background for high streaks */}
        {streak >= 10 && (
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
            animate={{ x: ['-100%', '100%'] }}
            transition={{ 
              duration: 2,
              repeat: Infinity,
              ease: 'linear',
            }}
          />
        )}
        
        {/* Icon with animation */}
        <motion.div
          animate={streak >= 5 ? { 
            rotate: [0, -10, 10, -10, 10, 0],
            scale: [1, 1.1, 1],
          } : {}}
          transition={{ 
            duration: 0.5,
            repeat: streak >= 5 ? Infinity : 0,
            repeatDelay: 2,
          }}
          className="relative z-10"
        >
          <Icon className={sizeClass.icon} />
        </motion.div>
        
        {/* Streak number */}
        <span className={`font-bold ${sizeClass.text} relative z-10`}>
          {streak}
        </span>
        
        {/* Label */}
        {level.label && (
          <span className={`font-semibold ${sizeClass.label} relative z-10 opacity-90`}>
            {level.label}
          </span>
        )}
        
        {/* Combo multiplier */}
        {isComboActive && (
          <span className={`font-bold ${sizeClass.label} relative z-10 bg-white/30 px-1.5 rounded-full`}>
            x{comboCount}
          </span>
        )}
      </motion.div>
      
      {/* Bonus popup */}
      <AnimatePresence>
        {showBonus && isComboActive && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.8 }}
            animate={{ opacity: 1, y: -5, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.8 }}
            className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap"
          >
            <div className="px-2 py-1 bg-amber-500 text-white text-xs font-bold rounded-full shadow-lg">
              +{COMBO_SETTINGS.COMBO_BONUS_XP} BONUS!
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// Streak göstergesi (mini versiyon)
interface StreakBadgeProps {
  streak: number
  className?: string
}

export function StreakBadge({ streak, className = '' }: StreakBadgeProps) {
  if (streak < 1) return null
  
  const level = getComboLevel(streak)
  const Icon = level.icon
  
  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      className={`
        inline-flex items-center gap-1 px-2 py-1
        bg-gradient-to-r ${level.color}
        rounded-full text-white text-sm font-bold
        ${className}
      `}
    >
      <Icon className="w-3.5 h-3.5" />
      <span>{streak}</span>
    </motion.div>
  )
}

// Session içi seri göstergesi
interface SessionStreakProps {
  currentStreak: number
  maxStreak: number
  className?: string
}

export function SessionStreak({ currentStreak, maxStreak, className = '' }: SessionStreakProps) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Current streak */}
      <div className="flex items-center gap-1.5">
        <Flame className={`w-5 h-5 ${currentStreak > 0 ? 'text-orange-500' : 'text-gray-400'}`} />
        <span className={`font-bold ${currentStreak > 0 ? 'text-orange-500' : 'text-gray-400'}`}>
          {currentStreak}
        </span>
      </div>
      
      {/* Max streak indicator */}
      {maxStreak > 0 && maxStreak > currentStreak && (
        <div className="flex items-center gap-1 text-gray-400 text-sm">
          <Crown className="w-3.5 h-3.5" />
          <span>{maxStreak}</span>
        </div>
      )}
    </div>
  )
}

