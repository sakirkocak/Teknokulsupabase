'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { TrendingUp, TrendingDown, Sparkles, Rocket } from 'lucide-react'

interface RankChangeIndicatorProps {
  change: 'up' | 'down' | 'same' | 'new'
  delta: number // Kaç sıra değişti
  showAnimation?: boolean
}

export function RankChangeIndicator({ 
  change, 
  delta, 
  showAnimation = true 
}: RankChangeIndicatorProps) {
  if (change === 'same' || delta === 0) return null

  return (
    <AnimatePresence>
      {showAnimation && (
        <motion.div
          initial={{ opacity: 0, scale: 0.5, x: -10 }}
          animate={{ opacity: 1, scale: 1, x: 0 }}
          exit={{ opacity: 0, scale: 0.5, x: 10 }}
          transition={{ type: 'spring', damping: 15 }}
          className="flex items-center gap-1"
        >
          {change === 'new' && (
            <motion.div
              animate={{ 
                scale: [1, 1.2, 1],
                rotate: [0, 5, -5, 0]
              }}
              transition={{ 
                duration: 0.5,
                repeat: 2
              }}
              className="flex items-center gap-1 px-2 py-0.5 bg-gradient-to-r from-amber-400 to-yellow-500 text-white rounded-full text-xs font-bold shadow-lg shadow-amber-500/30"
            >
              <Sparkles className="w-3 h-3" />
              YENİ
            </motion.div>
          )}

          {change === 'up' && (
            <motion.div
              initial={{ y: 10 }}
              animate={{ y: 0 }}
              className="flex items-center gap-0.5"
            >
              {delta >= 3 ? (
                // Roket - 3+ sıra atlama
                <motion.div
                  animate={{ 
                    y: [-2, 2, -2],
                    rotate: [-5, 5, -5]
                  }}
                  transition={{ 
                    duration: 0.3,
                    repeat: 3
                  }}
                  className="flex items-center gap-1 px-2 py-0.5 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-full text-xs font-bold shadow-lg shadow-purple-500/30"
                >
                  <Rocket className="w-3 h-3" />
                  +{delta}
                </motion.div>
              ) : (
                <motion.div
                  animate={{ y: [-1, 1, -1] }}
                  transition={{ duration: 0.3, repeat: 2 }}
                  className="flex items-center gap-0.5 px-1.5 py-0.5 bg-green-500/20 text-green-400 rounded text-xs font-medium"
                >
                  <TrendingUp className="w-3 h-3" />
                  +{delta}
                </motion.div>
              )}
            </motion.div>
          )}

          {change === 'down' && (
            <motion.div
              initial={{ y: -10 }}
              animate={{ y: 0 }}
              className="flex items-center gap-0.5 px-1.5 py-0.5 bg-red-500/20 text-red-400 rounded text-xs font-medium"
            >
              <TrendingDown className="w-3 h-3" />
              -{delta}
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// Sıra değişimi highlight efekti
interface RankHighlightProps {
  change: 'up' | 'down' | 'same' | 'new'
  children: React.ReactNode
}

export function RankHighlight({ change, children }: RankHighlightProps) {
  const glowColors = {
    up: 'shadow-green-500/50',
    down: 'shadow-red-500/30',
    new: 'shadow-amber-500/50',
    same: ''
  }

  const bgColors = {
    up: 'bg-green-500/10 border-green-500/30',
    down: 'bg-red-500/5 border-red-500/20',
    new: 'bg-amber-500/10 border-amber-500/30',
    same: ''
  }

  if (change === 'same') return <>{children}</>

  return (
    <motion.div
      initial={{ 
        boxShadow: change === 'new' 
          ? '0 0 30px rgba(251, 191, 36, 0.5)' 
          : change === 'up' 
          ? '0 0 20px rgba(34, 197, 94, 0.5)'
          : '0 0 15px rgba(239, 68, 68, 0.3)'
      }}
      animate={{ 
        boxShadow: '0 0 0px transparent'
      }}
      transition={{ duration: 2 }}
      className={`rounded-xl ${bgColors[change]} border transition-all duration-500`}
    >
      {children}
    </motion.div>
  )
}

export default RankChangeIndicator

