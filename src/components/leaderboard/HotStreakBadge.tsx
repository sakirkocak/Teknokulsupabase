'use client'

import { motion } from 'framer-motion'
import { Flame, Zap, Swords, Crown, Rocket } from 'lucide-react'

interface HotStreakBadgeProps {
  type: 'hot' | 'fire' | 'duel' | 'king' | 'rocket'
  label?: string
  size?: 'sm' | 'md' | 'lg'
}

export function HotStreakBadge({ type, label, size = 'sm' }: HotStreakBadgeProps) {
  const sizeClasses = {
    sm: 'text-[10px] px-1.5 py-0.5 gap-0.5',
    md: 'text-xs px-2 py-1 gap-1',
    lg: 'text-sm px-3 py-1.5 gap-1.5'
  }

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  }

  const badges = {
    hot: {
      icon: Flame,
      gradient: 'from-orange-500 to-red-600',
      shadow: 'shadow-orange-500/40',
      text: label || 'HOT!',
      animate: { 
        scale: [1, 1.1, 1],
        rotate: [-3, 3, -3]
      }
    },
    fire: {
      icon: Zap,
      gradient: 'from-amber-400 to-orange-500',
      shadow: 'shadow-amber-500/40',
      text: label || 'YANGIN!',
      animate: { 
        y: [-1, 1, -1]
      }
    },
    duel: {
      icon: Swords,
      gradient: 'from-purple-500 to-pink-600',
      shadow: 'shadow-purple-500/40',
      text: label || 'DÜELLO!',
      animate: { 
        x: [-1, 1, -1]
      }
    },
    king: {
      icon: Crown,
      gradient: 'from-yellow-400 to-amber-500',
      shadow: 'shadow-yellow-500/40',
      text: label || 'KRAL',
      animate: { 
        rotate: [-5, 5, -5]
      }
    },
    rocket: {
      icon: Rocket,
      gradient: 'from-indigo-500 to-purple-600',
      shadow: 'shadow-indigo-500/40',
      text: label || 'ROKET!',
      animate: { 
        y: [-2, 0, -2],
        rotate: [-10, 10, -10]
      }
    }
  }

  const badge = badges[type]
  const Icon = badge.icon

  return (
    <motion.div
      animate={badge.animate}
      transition={{ 
        duration: 0.5, 
        repeat: Infinity,
        ease: 'easeInOut'
      }}
      className={`
        inline-flex items-center font-bold text-white rounded-full
        bg-gradient-to-r ${badge.gradient}
        shadow-lg ${badge.shadow}
        ${sizeClasses[size]}
      `}
    >
      <Icon className={iconSizes[size]} />
      <span>{badge.text}</span>
    </motion.div>
  )
}

// Birden fazla badge gösteren wrapper
interface BadgeContainerProps {
  isHot?: boolean // Son 5 dk'da aktif
  isOnFire?: boolean // 100+ XP kazanmış
  isDueling?: boolean // Yakın rakip var
  isKing?: boolean // 1. sırada
  rocketLevel?: number // Kaç sıra atladı (3+)
  size?: 'sm' | 'md' | 'lg'
}

export function LeaderBadges({ 
  isHot, 
  isOnFire, 
  isDueling, 
  isKing, 
  rocketLevel,
  size = 'sm' 
}: BadgeContainerProps) {
  return (
    <div className="flex flex-wrap gap-1">
      {isKing && <HotStreakBadge type="king" size={size} />}
      {rocketLevel && rocketLevel >= 3 && (
        <HotStreakBadge type="rocket" label={`+${rocketLevel}`} size={size} />
      )}
      {isOnFire && <HotStreakBadge type="fire" size={size} />}
      {isHot && !isOnFire && <HotStreakBadge type="hot" size={size} />}
      {isDueling && <HotStreakBadge type="duel" size={size} />}
    </div>
  )
}

// Streak göstergesi
interface StreakIndicatorProps {
  streak: number
  maxStreak?: number
  showMax?: boolean
}

export function StreakIndicator({ streak, maxStreak, showMax = false }: StreakIndicatorProps) {
  if (streak < 3) return null

  const getStreakColor = () => {
    if (streak >= 20) return 'from-purple-500 to-pink-500'
    if (streak >= 10) return 'from-orange-500 to-red-500'
    if (streak >= 5) return 'from-amber-400 to-orange-500'
    return 'from-yellow-400 to-amber-400'
  }

  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      className={`
        inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold text-white
        bg-gradient-to-r ${getStreakColor()}
      `}
    >
      <Flame className="w-3 h-3" />
      <span>{streak}</span>
      {showMax && maxStreak && maxStreak > streak && (
        <span className="text-white/60 text-[10px]">/ {maxStreak}</span>
      )}
    </motion.div>
  )
}

export default HotStreakBadge

