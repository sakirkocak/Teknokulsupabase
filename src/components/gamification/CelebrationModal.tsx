'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import confetti from 'canvas-confetti'
import { X, Sparkles, Trophy, Star } from 'lucide-react'
import { type Badge, type Level } from '@/lib/gamification'

interface CelebrationModalProps {
  type: 'badge' | 'level' | null
  badge?: Badge | null
  level?: Level | null
  previousLevel?: Level | null
  onClose: () => void
}

export default function CelebrationModal({ 
  type, 
  badge, 
  level,
  previousLevel,
  onClose 
}: CelebrationModalProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (type) {
      setIsVisible(true)
      
      // Konfeti patlat
      const duration = 3000
      const animationEnd = Date.now() + duration
      
      const randomInRange = (min: number, max: number) => {
        return Math.random() * (max - min) + min
      }

      const colors = type === 'badge' 
        ? ['#FFD700', '#FFA500', '#FF6B6B', '#4ECDC4']
        : ['#8B5CF6', '#6366F1', '#EC4899', '#F59E0B']

      const interval = setInterval(() => {
        const timeLeft = animationEnd - Date.now()

        if (timeLeft <= 0) {
          clearInterval(interval)
          return
        }

        const particleCount = 50 * (timeLeft / duration)

        confetti({
          particleCount,
          startVelocity: 30,
          spread: 360,
          origin: {
            x: randomInRange(0.1, 0.9),
            y: Math.random() - 0.2,
          },
          colors,
          gravity: 1,
        })
      }, 250)

      return () => clearInterval(interval)
    }
  }, [type])

  const handleClose = () => {
    setIsVisible(false)
    setTimeout(onClose, 300)
  }

  return (
    <AnimatePresence>
      {isVisible && type && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
          onClick={handleClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.5, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.5, y: 50 }}
            transition={{ type: 'spring', damping: 15 }}
            onClick={e => e.stopPropagation()}
            className="bg-white rounded-3xl p-8 max-w-md w-full text-center relative overflow-hidden"
          >
            {/* Close button */}
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 p-2 text-surface-400 hover:text-surface-600 hover:bg-surface-100 rounded-xl transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Decorative background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                className="absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br from-yellow-200 to-orange-200 rounded-full opacity-50"
              />
              <motion.div
                animate={{ rotate: -360 }}
                transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
                className="absolute -bottom-20 -left-20 w-40 h-40 bg-gradient-to-br from-purple-200 to-pink-200 rounded-full opacity-50"
              />
            </div>

            {/* Content */}
            <div className="relative z-10">
              {type === 'badge' && badge && (
                <>
                  {/* Badge celebration */}
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: [0, 1.2, 1] }}
                    transition={{ duration: 0.5 }}
                    className="mb-6"
                  >
                    <div className={`w-28 h-28 mx-auto rounded-3xl bg-gradient-to-br ${badge.color} flex items-center justify-center text-6xl shadow-2xl`}>
                      {badge.icon}
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Sparkles className="w-5 h-5 text-amber-500" />
                      <span className="text-amber-600 font-medium">Yeni Rozet!</span>
                      <Sparkles className="w-5 h-5 text-amber-500" />
                    </div>
                    
                    <h2 className="text-3xl font-bold text-surface-900 mb-2">
                      {badge.name}
                    </h2>
                    
                    <p className="text-surface-600 mb-4">
                      {badge.description}
                    </p>
                    
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-100 to-orange-100 rounded-full">
                      <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                      <span className="text-lg font-bold text-amber-600">+{badge.xp_reward} XP</span>
                    </div>
                  </motion.div>
                </>
              )}

              {type === 'level' && level && (
                <>
                  {/* Level up celebration */}
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: [0, 1.2, 1] }}
                    transition={{ duration: 0.5 }}
                    className="mb-6"
                  >
                    <div className="w-28 h-28 mx-auto rounded-3xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-6xl shadow-2xl">
                      {level.icon}
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Trophy className="w-5 h-5 text-purple-500" />
                      <span className="text-purple-600 font-medium">Seviye Atladın!</span>
                      <Trophy className="w-5 h-5 text-purple-500" />
                    </div>
                    
                    {previousLevel && (
                      <div className="flex items-center justify-center gap-3 mb-4 text-surface-400">
                        <span className="text-2xl">{previousLevel.icon}</span>
                        <span>Lv.{previousLevel.level}</span>
                        <span>→</span>
                        <span className="text-purple-600 font-bold text-2xl">{level.icon}</span>
                        <span className="text-purple-600 font-bold">Lv.{level.level}</span>
                      </div>
                    )}
                    
                    <h2 className="text-3xl font-bold text-surface-900 mb-2">
                      {level.name}
                    </h2>
                    
                    <p className="text-surface-600 mb-4">
                      Tebrikler! Artık Lv.{level.level} {level.name} seviyesindesin.
                    </p>
                    
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-100 to-indigo-100 rounded-full">
                      <span className="text-2xl">{level.icon}</span>
                      <span className="text-lg font-bold text-purple-600">{level.name}</span>
                    </div>
                  </motion.div>
                </>
              )}

              {/* Action button */}
              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                onClick={handleClose}
                className="mt-6 w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-purple-500/30 transition-all"
              >
                Harika! Devam Et
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

