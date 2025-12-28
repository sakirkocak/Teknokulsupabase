'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { 
  X, Sparkles, Trophy, Star, Zap, Crown,
  CheckCircle, Users, BarChart3, Medal,
  ArrowRight, Gift, Flame, Target
} from 'lucide-react'
import Link from 'next/link'
import confetti from 'canvas-confetti'
import { useEffect } from 'react'

interface Props {
  isOpen: boolean
  type: 'soft' | 'hard'
  stats: {
    total: number
    correct: number
    wrong: number
    accuracy: number
    streak: number
    maxStreak: number
  }
  onClose: () => void
}

export default function MembershipPrompt({ isOpen, type, stats, onClose }: Props) {
  // Confetti effect on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.4 }
        })
      }, 300)
    }
  }, [isOpen])

  if (!isOpen) return null

  const isSoft = type === 'soft'

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-[60]"
            onClick={isSoft ? onClose : undefined}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md z-[60]"
          >
            <div className="bg-white rounded-3xl shadow-2xl overflow-hidden mx-4">
              {/* Header with gradient */}
              <div className={`relative p-8 pb-12 ${
                isSoft 
                  ? 'bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500'
                  : 'bg-gradient-to-br from-amber-500 via-orange-500 to-red-500'
              }`}>
                {/* Close button (only for soft) */}
                {isSoft && (
                  <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors"
                  >
                    <X className="w-5 h-5 text-white" />
                  </button>
                )}

                {/* Icon */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: 'spring' }}
                  className="w-20 h-20 mx-auto mb-4 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm"
                >
                  {isSoft ? (
                    <Sparkles className="w-10 h-10 text-white" />
                  ) : (
                    <Trophy className="w-10 h-10 text-white" />
                  )}
                </motion.div>

                {/* Title */}
                <motion.h2
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-2xl font-bold text-white text-center mb-2"
                >
                  {isSoft ? 'Harika Gidiyorsun! 🎉' : 'Sen Bir Efsanesin! 🏆'}
                </motion.h2>

                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="text-white/90 text-center"
                >
                  {isSoft 
                    ? `${stats.total} soru çözdün, ${stats.correct} doğru yaptın!`
                    : `${stats.total} soruyu bitirdin! Artık bir profesyonelsin!`
                  }
                </motion.p>
              </div>

              {/* Stats Cards */}
              <div className="px-6 -mt-6">
                <div className="grid grid-cols-3 gap-3">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="bg-white rounded-xl shadow-lg p-3 text-center border border-gray-100"
                  >
                    <div className="text-2xl font-bold text-indigo-600">{stats.total}</div>
                    <div className="text-xs text-gray-500">Soru</div>
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="bg-white rounded-xl shadow-lg p-3 text-center border border-gray-100"
                  >
                    <div className="text-2xl font-bold text-green-600">%{stats.accuracy}</div>
                    <div className="text-xs text-gray-500">Başarı</div>
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 }}
                    className="bg-white rounded-xl shadow-lg p-3 text-center border border-gray-100"
                  >
                    <div className="text-2xl font-bold text-orange-500">{stats.maxStreak}</div>
                    <div className="text-xs text-gray-500">Seri</div>
                  </motion.div>
                </div>
              </div>

              {/* Benefits */}
              <div className="p-6">
                <p className="text-center text-gray-600 mb-4">
                  {isSoft 
                    ? 'Ücretsiz üye ol ve daha fazlasını keşfet:'
                    : 'Devam etmek için ücretsiz kayıt ol:'
                  }
                </p>

                <div className="space-y-3 mb-6">
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.8 }}
                    className="flex items-center gap-3 p-3 bg-indigo-50 rounded-xl"
                  >
                    <div className="p-2 bg-indigo-100 rounded-lg">
                      <Target className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">Sınırsız Soru</p>
                      <p className="text-sm text-gray-500">10.000+ soruya tam erişim</p>
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.9 }}
                    className="flex items-center gap-3 p-3 bg-purple-50 rounded-xl"
                  >
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <BarChart3 className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">İlerleme Takibi</p>
                      <p className="text-sm text-gray-500">Eksiklerini tespit et</p>
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 1.0 }}
                    className="flex items-center gap-3 p-3 bg-amber-50 rounded-xl"
                  >
                    <div className="p-2 bg-amber-100 rounded-lg">
                      <Medal className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">Liderlik Yarışı</p>
                      <p className="text-sm text-gray-500">Arkadaşlarınla yarış</p>
                    </div>
                  </motion.div>
                </div>

                {/* CTA Buttons */}
                <div className="space-y-3">
                  <Link href="/kayit" className="block">
                    <motion.button
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 1.1 }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={`
                        w-full py-4 rounded-xl font-semibold text-white shadow-lg transition-all flex items-center justify-center gap-2
                        ${isSoft 
                          ? 'bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600'
                          : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600'
                        }
                      `}
                    >
                      <Gift className="w-5 h-5" />
                      <span>Ücretsiz Kayıt Ol</span>
                      <ArrowRight className="w-5 h-5" />
                    </motion.button>
                  </Link>

                  {isSoft && (
                    <motion.button
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 1.2 }}
                      onClick={onClose}
                      className="w-full py-3 text-gray-500 hover:text-gray-700 text-sm transition-colors"
                    >
                      3 soru daha çözeyim →
                    </motion.button>
                  )}
                </div>

                {/* Social Proof */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.3 }}
                  className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-center gap-2 text-sm text-gray-500"
                >
                  <Users className="w-4 h-4" />
                  <span>1.000+ öğrenci bu hafta katıldı</span>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
