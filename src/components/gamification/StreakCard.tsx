'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { Flame, CheckCircle, Calendar, ChevronRight } from 'lucide-react'
import { getWeeklyActivity, calculateStreakBonus } from '@/lib/gamification'

interface StreakCardProps {
  currentStreak: number
  maxStreak: number
  streakActive: boolean
  activityToday: boolean
  activityDates?: string[]
  compact?: boolean
}

const DAY_NAMES = ['P', 'S', 'Ç', 'P', 'C', 'C', 'P']

export default function StreakCard({ 
  currentStreak, 
  maxStreak, 
  streakActive, 
  activityToday,
  activityDates = [],
  compact = false 
}: StreakCardProps) {
  const [weeklyActivity, setWeeklyActivity] = useState<boolean[]>([])
  
  useEffect(() => {
    setWeeklyActivity(getWeeklyActivity(activityDates))
  }, [activityDates])

  const streakBonus = calculateStreakBonus(currentStreak)
  
  // Günün indeksi (0 = Pazartesi)
  const today = new Date().getDay()
  const adjustedToday = today === 0 ? 6 : today - 1 // JS'de Pazar = 0, bizde Pazartesi = 0

  if (compact) {
    return (
      <Link href="/ogrenci/basarimlar" className="block">
        <div className={`rounded-2xl p-4 text-white hover:shadow-lg transition-all ${
          currentStreak >= 7 
            ? 'bg-gradient-to-br from-orange-500 to-red-600 hover:shadow-orange-500/30'
            : currentStreak >= 3
            ? 'bg-gradient-to-br from-amber-500 to-orange-600 hover:shadow-amber-500/30'
            : 'bg-gradient-to-br from-gray-500 to-gray-600 hover:shadow-gray-500/30'
        }`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <motion.div
                animate={streakActive ? { scale: [1, 1.2, 1] } : {}}
                transition={{ duration: 0.5, repeat: streakActive ? Infinity : 0, repeatDelay: 1 }}
              >
                <Flame className="w-6 h-6" />
              </motion.div>
              <div>
                <div className="text-xs opacity-80">Günlük Seri</div>
                <div className="font-bold text-xl">{currentStreak} gün</div>
              </div>
            </div>
            {streakActive && (
              <div className="text-xs bg-white/20 px-2 py-1 rounded-full">
                +{streakBonus} XP/gün
              </div>
            )}
          </div>
          
          {/* Mini haftalık görünüm */}
          <div className="flex justify-between">
            {weeklyActivity.map((active, i) => (
              <div 
                key={i}
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                  active 
                    ? 'bg-white text-orange-500' 
                    : i === adjustedToday && !activityToday
                    ? 'bg-white/30 border-2 border-white/50'
                    : 'bg-white/20'
                }`}
              >
                {active ? '✓' : DAY_NAMES[i]}
              </div>
            ))}
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
      <div className={`p-6 text-white ${
        currentStreak >= 7 
          ? 'bg-gradient-to-br from-orange-500 to-red-600'
          : currentStreak >= 3
          ? 'bg-gradient-to-br from-amber-500 to-orange-600'
          : 'bg-gradient-to-br from-gray-500 to-gray-600'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <motion.div
              animate={streakActive ? { scale: [1, 1.2, 1], rotate: [0, 5, -5, 0] } : {}}
              transition={{ duration: 0.5, repeat: streakActive ? Infinity : 0, repeatDelay: 1 }}
              className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center"
            >
              <Flame className="w-8 h-8" />
            </motion.div>
            <div>
              <div className="text-sm opacity-80">Günlük Seri</div>
              <div className="text-3xl font-bold">{currentStreak} gün</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm opacity-80">Rekor</div>
            <div className="text-xl font-bold">{maxStreak} gün</div>
          </div>
        </div>

        {/* Streak bonus */}
        {streakActive && (
          <div className="mt-4 flex items-center gap-2 bg-white/20 px-3 py-2 rounded-xl">
            <span className="text-sm">Günlük bonus:</span>
            <span className="font-bold">+{streakBonus} XP</span>
          </div>
        )}
      </div>

      {/* Haftalık Takvim */}
      <div className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-4 h-4 text-surface-500" />
          <span className="text-sm font-medium text-surface-700">Bu Hafta</span>
        </div>

        <div className="grid grid-cols-7 gap-2 mb-4">
          {DAY_NAMES.map((day, i) => (
            <div key={i} className="text-center">
              <div className="text-xs text-surface-400 mb-1">{day}</div>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: i * 0.05 }}
                className={`w-10 h-10 mx-auto rounded-xl flex items-center justify-center text-lg ${
                  weeklyActivity[i]
                    ? 'bg-gradient-to-br from-orange-500 to-red-500 text-white shadow-lg shadow-orange-500/30'
                    : i === adjustedToday && !activityToday
                    ? 'bg-orange-100 border-2 border-orange-300 text-orange-500'
                    : 'bg-surface-100 text-surface-400'
                }`}
              >
                {weeklyActivity[i] ? <CheckCircle className="w-5 h-5" /> : ''}
              </motion.div>
            </div>
          ))}
        </div>

        {/* Durum mesajı */}
        <div className={`p-4 rounded-xl text-center ${
          activityToday
            ? 'bg-green-50 text-green-700'
            : 'bg-orange-50 text-orange-700'
        }`}>
          {activityToday ? (
            <div className="flex items-center justify-center gap-2">
              <CheckCircle className="w-5 h-5" />
              <span className="font-medium">Bugün soru çözdün! Serin devam ediyor 🔥</span>
            </div>
          ) : streakActive ? (
            <div>
              <span className="font-medium">⚠️ Serini kaybetmemek için bugün soru çöz!</span>
            </div>
          ) : (
            <div>
              <span className="font-medium">Soru çözerek yeni bir seri başlat!</span>
            </div>
          )}
        </div>

        {/* Streak rozetleri */}
        <div className="mt-4 grid grid-cols-4 gap-2">
          {[3, 7, 14, 30].map(days => (
            <div 
              key={days}
              className={`text-center p-2 rounded-xl ${
                maxStreak >= days
                  ? 'bg-gradient-to-br from-orange-100 to-red-100'
                  : 'bg-surface-50'
              }`}
            >
              <div className="text-lg mb-1">{maxStreak >= days ? '🔥' : '🔒'}</div>
              <div className={`text-xs font-medium ${
                maxStreak >= days ? 'text-orange-600' : 'text-surface-400'
              }`}>
                {days} gün
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        {!activityToday && (
          <Link 
            href="/ogrenci/soru-bankasi" 
            className="mt-4 flex items-center justify-center gap-2 w-full py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-orange-500/30 transition-all"
          >
            <Flame className="w-4 h-4" />
            Şimdi Soru Çöz
            <ChevronRight className="w-4 h-4" />
          </Link>
        )}
      </div>
    </motion.div>
  )
}

