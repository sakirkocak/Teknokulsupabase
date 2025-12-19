'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { Zap, ChevronRight, TrendingUp } from 'lucide-react'
import { formatNumber, type Level } from '@/lib/gamification'

interface XPCardProps {
  totalXP: number
  level: Level
  xpProgress: {
    needed: number
    progress: number
    nextLevel: Level | null
  }
  compact?: boolean
}

export default function XPCard({ totalXP, level, xpProgress, compact = false }: XPCardProps) {
  if (compact) {
    return (
      <Link href="/ogrenci/basarimlar" className="block">
        <div className="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl p-4 text-white hover:shadow-lg hover:shadow-purple-500/30 transition-all">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{level.icon}</span>
              <div>
                <div className="text-xs text-purple-200">Seviye {level.level}</div>
                <div className="font-bold">{level.name}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xl font-bold">{formatNumber(totalXP)}</div>
              <div className="text-xs text-purple-200">XP</div>
            </div>
          </div>
          <div className="h-2 bg-white/20 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${xpProgress.progress}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
              className="h-full bg-white rounded-full"
            />
          </div>
          {xpProgress.nextLevel && (
            <div className="flex justify-between mt-1 text-xs text-purple-200">
              <span>{xpProgress.progress}%</span>
              <span>{formatNumber(xpProgress.needed)} XP kaldı</span>
            </div>
          )}
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
      <div className="bg-gradient-to-br from-purple-500 to-indigo-600 p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center text-4xl">
              {level.icon}
            </div>
            <div>
              <div className="text-sm text-purple-200">Mevcut Seviye</div>
              <div className="text-2xl font-bold">Lv.{level.level} {level.name}</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold">{formatNumber(totalXP)}</div>
            <div className="text-sm text-purple-200">Toplam XP</div>
          </div>
        </div>
      </div>

      {/* Progress */}
      <div className="p-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-surface-500">Seviye İlerlemesi</span>
          <span className="text-sm font-medium text-purple-600">{xpProgress.progress}%</span>
        </div>
        
        <div className="h-4 bg-surface-100 rounded-full overflow-hidden mb-2">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${xpProgress.progress}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full"
          />
        </div>

        {xpProgress.nextLevel ? (
          <div className="flex items-center justify-between text-sm">
            <span className="text-surface-500">
              Sonraki: <span className="font-medium text-surface-700">{xpProgress.nextLevel.icon} {xpProgress.nextLevel.name}</span>
            </span>
            <span className="text-purple-600 font-medium">
              {formatNumber(xpProgress.needed)} XP kaldı
            </span>
          </div>
        ) : (
          <div className="text-center text-surface-500">
            🎉 Maksimum seviyeye ulaştınız!
          </div>
        )}

        {/* XP Kazanım İpuçları */}
        <div className="mt-4 p-4 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-4 h-4 text-purple-500" />
            <span className="text-sm font-medium text-purple-700">XP Nasıl Kazanılır?</span>
          </div>
          <ul className="text-xs text-purple-600 space-y-1">
            <li>• Doğru cevap: +10 XP</li>
            <li>• Günlük seri bonusu: +5-50 XP</li>
            <li>• Rozet kazanma: +25-1000 XP</li>
            <li>• Görev tamamlama: +20-80 XP</li>
          </ul>
        </div>

        {/* CTA */}
        <Link 
          href="/ogrenci/basarimlar" 
          className="mt-4 flex items-center justify-center gap-2 w-full py-3 bg-purple-100 text-purple-700 rounded-xl font-medium hover:bg-purple-200 transition-colors"
        >
          <TrendingUp className="w-4 h-4" />
          Tüm İstatistikleri Gör
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
    </motion.div>
  )
}

