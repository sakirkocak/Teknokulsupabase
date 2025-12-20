'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Zap, Flame, Gift } from 'lucide-react'

interface XPFloatItem {
  id: string
  amount: number
  type: 'correct' | 'wrong' | 'combo' | 'streak' | 'fast'
  x?: number
  y?: number
}

interface XPFloatingAnimationProps {
  items: XPFloatItem[]
  onComplete: (id: string) => void
}

const typeConfig = {
  correct: {
    icon: Zap,
    color: 'text-green-500',
    bgColor: 'bg-green-500/20',
    borderColor: 'border-green-500/50',
  },
  wrong: {
    icon: Zap,
    color: 'text-gray-400',
    bgColor: 'bg-gray-500/20',
    borderColor: 'border-gray-500/50',
  },
  combo: {
    icon: Gift,
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/20',
    borderColor: 'border-amber-500/50',
  },
  streak: {
    icon: Flame,
    color: 'text-orange-500',
    bgColor: 'bg-orange-500/20',
    borderColor: 'border-orange-500/50',
  },
  fast: {
    icon: Zap,
    color: 'text-cyan-500',
    bgColor: 'bg-cyan-500/20',
    borderColor: 'border-cyan-500/50',
  },
}

export default function XPFloatingAnimation({ items, onComplete }: XPFloatingAnimationProps) {
  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      <AnimatePresence>
        {items.map((item) => {
          const config = typeConfig[item.type]
          const Icon = config.icon
          
          return (
            <motion.div
              key={item.id}
              initial={{ 
                opacity: 0, 
                scale: 0.5, 
                x: item.x ?? '50%',
                y: item.y ?? '50%',
              }}
              animate={{ 
                opacity: [0, 1, 1, 0],
                scale: [0.5, 1.2, 1, 0.8],
                y: (item.y ?? window.innerHeight / 2) - 100,
              }}
              exit={{ opacity: 0, scale: 0 }}
              transition={{ 
                duration: 1.5,
                ease: 'easeOut',
                times: [0, 0.2, 0.7, 1],
              }}
              onAnimationComplete={() => onComplete(item.id)}
              className="absolute"
              style={{ 
                left: item.x ?? '50%',
                transform: 'translateX(-50%)',
              }}
            >
              <div className={`
                flex items-center gap-2 px-4 py-2 
                ${config.bgColor} backdrop-blur-sm
                border ${config.borderColor}
                rounded-full shadow-lg
              `}>
                <Icon className={`w-5 h-5 ${config.color}`} />
                <span className={`text-lg font-bold ${config.color}`}>
                  {item.amount > 0 ? '+' : ''}{item.amount} XP
                </span>
              </div>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}

// Tek bir XP animasyonu için basit component
interface SingleXPFloatProps {
  amount: number
  type?: 'correct' | 'wrong' | 'combo' | 'streak' | 'fast'
  show: boolean
  onComplete?: () => void
  className?: string
}

export function SingleXPFloat({ amount, type = 'correct', show, onComplete, className = '' }: SingleXPFloatProps) {
  const config = typeConfig[type]
  const Icon = config.icon
  
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 0, scale: 0.5 }}
          animate={{ 
            opacity: [0, 1, 1, 0],
            y: -60,
            scale: [0.5, 1.3, 1, 0.9],
          }}
          exit={{ opacity: 0 }}
          transition={{ 
            duration: 1.2,
            ease: 'easeOut',
            times: [0, 0.15, 0.6, 1],
          }}
          onAnimationComplete={onComplete}
          className={`absolute pointer-events-none ${className}`}
        >
          <div className={`
            flex items-center gap-1.5 px-3 py-1.5 
            ${config.bgColor} backdrop-blur-sm
            border ${config.borderColor}
            rounded-full shadow-lg
          `}>
            <Icon className={`w-4 h-4 ${config.color}`} />
            <span className={`text-base font-bold ${config.color}`}>
              {amount > 0 ? '+' : ''}{amount}
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// Motivasyon mesajı animasyonu
interface MotivationFloatProps {
  message: string
  emoji: string
  color?: string
  show: boolean
  onComplete?: () => void
}

export function MotivationFloat({ message, emoji, color = 'text-green-500', show, onComplete }: MotivationFloatProps) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.8 }}
          animate={{ 
            opacity: [0, 1, 1, 0],
            y: [-10, -30],
            scale: [0.8, 1.1, 1, 0.95],
          }}
          exit={{ opacity: 0 }}
          transition={{ 
            duration: 2,
            ease: 'easeOut',
            times: [0, 0.2, 0.7, 1],
          }}
          onAnimationComplete={onComplete}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-50"
        >
          <div className="flex items-center gap-2 px-5 py-3 bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-white/50">
            <span className="text-2xl">{emoji}</span>
            <span className={`text-lg font-bold ${color}`}>{message}</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

