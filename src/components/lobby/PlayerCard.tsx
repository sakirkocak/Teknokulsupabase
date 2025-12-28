'use client'

import { motion } from 'framer-motion'
import { Swords, Star, BookOpen, Loader2 } from 'lucide-react'
import { getInitials } from '@/lib/utils'

// Sınıf renkleri
const GRADE_COLORS: Record<number, string> = {
  1: '#87CEEB',
  2: '#90EE90',
  3: '#FFA500',
  4: '#BA55D3',
  5: '#FF69B4',
  6: '#40E0D0',
  7: '#1E90FF',
  8: '#FF4500',
  9: '#FFD700',
  10: '#C0C0C0',
  11: '#CD7F32',
  12: '#E5E4E2',
}

interface PlayerCardProps {
  player: {
    student_id: string
    fullName: string
    avatarUrl?: string | null
    grade: number
    total_points: number
    preferred_subject?: string | null
    status: string
  }
  onChallenge: (playerId: string) => void
  isLoading?: boolean
  disabled?: boolean
}

export default function PlayerCard({ player, onChallenge, isLoading, disabled }: PlayerCardProps) {
  const gradeColor = GRADE_COLORS[player.grade] || '#1E90FF'
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      whileHover={{ scale: 1.02 }}
      className="relative overflow-hidden rounded-2xl bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 shadow-sm hover:shadow-lg transition-all duration-300"
    >
      {/* Üst gradient bar */}
      <div 
        className="h-2 w-full"
        style={{ background: `linear-gradient(90deg, ${gradeColor}, ${gradeColor}80)` }}
      />
      
      <div className="p-4">
        {/* Avatar ve İsim */}
        <div className="flex items-center gap-3 mb-3">
          <div 
            className="relative w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg overflow-hidden"
            style={{ backgroundColor: gradeColor }}
          >
            {player.avatarUrl ? (
              <img src={player.avatarUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              getInitials(player.fullName)
            )}
            {/* Online göstergesi */}
            <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-surface-800" />
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-surface-900 dark:text-white truncate">
              {player.fullName}
            </h3>
            <p className="text-sm text-surface-500">
              {player.grade}. Sınıf
            </p>
          </div>
        </div>

        {/* İstatistikler */}
        <div className="flex items-center gap-3 mb-3 text-sm">
          <div className="flex items-center gap-1 text-amber-500">
            <Star className="w-4 h-4" />
            <span className="font-medium">{player.total_points.toLocaleString()}</span>
          </div>
        </div>

        {/* Seçilen Ders */}
        <div className="mb-4">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-surface-50 dark:bg-surface-700/50">
            <BookOpen className="w-4 h-4 text-primary-500" />
            <span className="text-sm font-medium text-surface-700 dark:text-surface-300">
              {player.preferred_subject || 'Karışık'}
            </span>
          </div>
        </div>

        {/* Düello Butonu */}
        <motion.button
          whileHover={{ scale: disabled ? 1 : 1.02 }}
          whileTap={{ scale: disabled ? 1 : 0.98 }}
          onClick={() => !disabled && onChallenge(player.student_id)}
          disabled={disabled || isLoading || player.status !== 'available'}
          className={`w-full py-2.5 px-4 rounded-xl font-medium flex items-center justify-center gap-2 transition-all ${
            disabled || player.status !== 'available'
              ? 'bg-surface-100 dark:bg-surface-700 text-surface-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-red-500 to-orange-500 text-white hover:from-red-600 hover:to-orange-600 shadow-md hover:shadow-lg'
          }`}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Gönderiliyor...
            </>
          ) : player.status !== 'available' ? (
            'Meşgul'
          ) : (
            <>
              <Swords className="w-4 h-4" />
              Düello Gönder
            </>
          )}
        </motion.button>
      </div>
    </motion.div>
  )
}
