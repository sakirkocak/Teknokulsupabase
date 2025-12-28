'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Swords, X, Check, Clock, Star, BookOpen } from 'lucide-react'
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

interface DuelRequest {
  challengerId: string
  challengerName: string
  challengerAvatar?: string | null
  challengerGrade: number
  challengerPoints: number
  subject?: string | null
  questionCount: number
  expiresAt: number
}

interface DuelRequestPopupProps {
  request: DuelRequest
  onAccept: () => void
  onReject: () => void
  onTimeout: () => void
}

export default function DuelRequestPopup({ 
  request, 
  onAccept, 
  onReject, 
  onTimeout 
}: DuelRequestPopupProps) {
  const [timeLeft, setTimeLeft] = useState(30)
  const [responding, setResponding] = useState(false)
  
  const gradeColor = GRADE_COLORS[request.challengerGrade] || '#1E90FF'

  // Geri sayım
  useEffect(() => {
    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((request.expiresAt - Date.now()) / 1000))
      setTimeLeft(remaining)
      
      if (remaining <= 0) {
        clearInterval(interval)
        onTimeout()
      }
    }, 100)

    return () => clearInterval(interval)
  }, [request.expiresAt, onTimeout])

  const handleAccept = async () => {
    setResponding(true)
    onAccept()
  }

  const handleReject = async () => {
    setResponding(true)
    onReject()
  }

  const progressPercent = (timeLeft / 30) * 100

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.8, opacity: 0, y: 20 }}
          className="relative w-full max-w-sm rounded-3xl bg-white dark:bg-surface-800 shadow-2xl overflow-hidden"
        >
          {/* Progress bar */}
          <div className="absolute top-0 left-0 w-full h-1 bg-surface-200 dark:bg-surface-700">
            <motion.div
              className="h-full bg-gradient-to-r from-orange-500 to-red-500"
              initial={{ width: '100%' }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.1 }}
            />
          </div>

          {/* Header */}
          <div 
            className="p-6 text-center"
            style={{ background: `linear-gradient(135deg, ${gradeColor}20, transparent)` }}
          >
            <motion.div
              animate={{ 
                rotate: [0, -10, 10, -10, 0],
                scale: [1, 1.1, 1]
              }}
              transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
              className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4"
              style={{ backgroundColor: `${gradeColor}30`, border: `2px solid ${gradeColor}` }}
            >
              <Swords className="w-8 h-8" style={{ color: gradeColor }} />
            </motion.div>
            
            <h2 className="text-xl font-bold text-surface-900 dark:text-white mb-1">
              Düello İsteği!
            </h2>
            <p className="text-surface-500 text-sm">
              Sana meydan okumak istiyor
            </p>
          </div>

          {/* Challenger Info */}
          <div className="px-6 pb-4">
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-surface-50 dark:bg-surface-700/50">
              <div 
                className="w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-xl overflow-hidden"
                style={{ backgroundColor: gradeColor }}
              >
                {request.challengerAvatar ? (
                  <img src={request.challengerAvatar} alt="" className="w-full h-full object-cover" />
                ) : (
                  getInitials(request.challengerName)
                )}
              </div>
              
              <div className="flex-1">
                <h3 className="font-bold text-surface-900 dark:text-white">
                  {request.challengerName}
                </h3>
                <div className="flex items-center gap-3 text-sm text-surface-500">
                  <span>{request.challengerGrade}. Sınıf</span>
                  <span className="flex items-center gap-1 text-amber-500">
                    <Star className="w-3.5 h-3.5" />
                    {request.challengerPoints.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Düello Detayları */}
            <div className="flex items-center justify-center gap-6 mt-4 text-sm text-surface-600 dark:text-surface-400">
              <div className="flex items-center gap-1">
                <BookOpen className="w-4 h-4" />
                <span>{request.subject || 'Karışık'}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="font-medium">{request.questionCount}</span>
                <span>Soru</span>
              </div>
            </div>
          </div>

          {/* Timer */}
          <div className="px-6 pb-4">
            <div className="flex items-center justify-center gap-2 text-surface-500">
              <Clock className="w-4 h-4" />
              <span className={`font-mono font-bold ${timeLeft <= 10 ? 'text-red-500' : ''}`}>
                {timeLeft} saniye
              </span>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 p-6 pt-2">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleReject}
              disabled={responding}
              className="flex-1 py-3 px-4 rounded-xl bg-surface-100 dark:bg-surface-700 text-surface-700 dark:text-surface-300 font-medium hover:bg-surface-200 dark:hover:bg-surface-600 transition-colors flex items-center justify-center gap-2"
            >
              <X className="w-5 h-5" />
              Reddet
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleAccept}
              disabled={responding}
              className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white font-medium hover:from-green-600 hover:to-emerald-600 shadow-lg shadow-green-500/30 transition-all flex items-center justify-center gap-2"
            >
              <Check className="w-5 h-5" />
              Kabul Et
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
