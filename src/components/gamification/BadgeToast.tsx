'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, X } from 'lucide-react'
import { type Badge } from '@/lib/gamification'

interface BadgeToastProps {
  badges: Badge[]
  onDismiss: () => void
}

export default function BadgeToast({ badges, onDismiss }: BadgeToastProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    if (badges.length === 0) return

    // Her rozet için 3 saniye göster
    const interval = setInterval(() => {
      if (currentIndex < badges.length - 1) {
        setCurrentIndex(prev => prev + 1)
      } else {
        setVisible(false)
        setTimeout(onDismiss, 300)
      }
    }, 3000)

    // 5 saniye sonra otomatik kapat
    const timeout = setTimeout(() => {
      setVisible(false)
      setTimeout(onDismiss, 300)
    }, badges.length * 3000 + 1000)

    return () => {
      clearInterval(interval)
      clearTimeout(timeout)
    }
  }, [badges, currentIndex, onDismiss])

  if (badges.length === 0) return null

  const currentBadge = badges[currentIndex]

  return (
    <AnimatePresence>
      {visible && currentBadge && (
        <motion.div
          initial={{ opacity: 0, x: 100, y: 0 }}
          animate={{ opacity: 1, x: 0, y: 0 }}
          exit={{ opacity: 0, x: 100 }}
          className="fixed top-20 right-4 z-50"
        >
          <div className="bg-white rounded-2xl shadow-2xl border border-surface-100 p-4 min-w-[300px] max-w-[350px]">
            <div className="flex items-start gap-4">
              {/* Badge icon */}
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', damping: 10 }}
                className={`w-14 h-14 rounded-xl bg-gradient-to-br ${currentBadge.color} flex items-center justify-center text-2xl shadow-lg flex-shrink-0`}
              >
                {currentBadge.icon}
              </motion.div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1 text-amber-600 text-sm font-medium mb-1">
                  <Sparkles className="w-4 h-4" />
                  Yeni Rozet!
                </div>
                <h4 className="font-bold text-surface-900 truncate">
                  {currentBadge.name}
                </h4>
                <p className="text-sm text-surface-500 truncate">
                  {currentBadge.description}
                </p>
                <div className="mt-1 text-sm font-medium text-amber-600">
                  +{currentBadge.xp_reward} XP
                </div>
              </div>

              {/* Close button */}
              <button
                onClick={() => {
                  setVisible(false)
                  setTimeout(onDismiss, 300)
                }}
                className="p-1 text-surface-400 hover:text-surface-600 hover:bg-surface-100 rounded-lg transition-colors flex-shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Progress dots */}
            {badges.length > 1 && (
              <div className="flex items-center justify-center gap-1 mt-3">
                {badges.map((_, i) => (
                  <div
                    key={i}
                    className={`w-2 h-2 rounded-full transition-all ${
                      i === currentIndex
                        ? 'bg-purple-500 w-4'
                        : i < currentIndex
                        ? 'bg-green-500'
                        : 'bg-surface-200'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

