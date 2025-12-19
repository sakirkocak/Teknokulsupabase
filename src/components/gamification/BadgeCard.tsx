'use client'

import { motion } from 'framer-motion'
import { Lock, CheckCircle } from 'lucide-react'
import { type Badge, getBadgeProgress, type UserStats } from '@/lib/gamification'

interface BadgeCardProps {
  badge: Badge
  isEarned: boolean
  stats?: UserStats | null
  onClick?: () => void
  size?: 'sm' | 'md' | 'lg'
}

export default function BadgeCard({ 
  badge, 
  isEarned, 
  stats, 
  onClick,
  size = 'md' 
}: BadgeCardProps) {
  const progress = stats ? getBadgeProgress(badge, stats) : null
  
  const sizeClasses = {
    sm: {
      container: 'p-2',
      icon: 'w-10 h-10 text-xl',
      title: 'text-xs',
      xp: 'text-xs',
    },
    md: {
      container: 'p-4',
      icon: 'w-14 h-14 text-2xl',
      title: 'text-sm',
      xp: 'text-xs',
    },
    lg: {
      container: 'p-6',
      icon: 'w-20 h-20 text-4xl',
      title: 'text-base',
      xp: 'text-sm',
    },
  }

  const classes = sizeClasses[size]

  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={`relative bg-white rounded-2xl ${classes.container} text-center cursor-pointer border-2 transition-all ${
        isEarned 
          ? 'border-amber-300 shadow-lg shadow-amber-500/20 hover:shadow-xl hover:shadow-amber-500/30' 
          : 'border-surface-100 hover:border-surface-200 hover:shadow-lg'
      } ${!isEarned ? 'grayscale hover:grayscale-0' : ''}`}
    >
      {/* Earned indicator */}
      {isEarned && (
        <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center shadow-lg z-10">
          <CheckCircle className="w-4 h-4 text-white" />
        </div>
      )}
      
      {/* Badge Icon */}
      <div className={`${classes.icon} mx-auto mb-2 rounded-2xl bg-gradient-to-br ${badge.color} flex items-center justify-center shadow-lg ${
        isEarned ? '' : 'opacity-50'
      }`}>
        {badge.icon}
      </div>
      
      {/* Badge Name */}
      <h3 className={`font-bold ${classes.title} mb-1 ${isEarned ? 'text-surface-900' : 'text-surface-500'}`}>
        {badge.name}
      </h3>
      
      {/* XP Reward */}
      <div className={`${classes.xp} font-medium ${isEarned ? 'text-amber-600' : 'text-surface-400'}`}>
        +{badge.xp_reward} XP
      </div>
      
      {/* Progress Bar (for unearned badges) */}
      {!isEarned && progress && size !== 'sm' && (
        <div className="mt-2">
          <div className="h-1.5 bg-surface-100 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${progress.percentage}%` }}
              className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full"
            />
          </div>
          <div className="text-xs text-surface-400 mt-1">
            {progress.current}/{progress.target}
          </div>
        </div>
      )}
      
      {/* Lock icon for not earned (without progress) */}
      {!isEarned && !stats && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/80 rounded-2xl">
          <Lock className="w-6 h-6 text-surface-300" />
        </div>
      )}
    </motion.div>
  )
}

