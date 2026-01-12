'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, Loader2, Lock, Crown } from 'lucide-react'
import { createPortal } from 'react-dom'
import dynamic from 'next/dynamic'

// JarvisSolutionModal lazy load
const JarvisSolutionModal = dynamic(() => import('./JarvisSolutionModal'), {
  ssr: false,
  loading: () => null
})

interface Props {
  questionId: string
  questionText: string
  subject: string
  options?: Record<string, string>
  correctAnswer?: string
  explanation?: string
  questionImageUrl?: string | null
  grade?: number
  isPremium?: boolean
  className?: string
}

export default function JarvisSolutionButton({
  questionId,
  questionText,
  subject,
  options,
  correctAnswer,
  explanation,
  questionImageUrl,
  grade,
  isPremium = false,
  className = ''
}: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [jarvisData, setJarvisData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleOpen = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/jarvis/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionText,
          subject,
          options,
          correctAnswer,
          explanation,
          grade
        })
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Analiz başarısız')
      }

      setJarvisData(data)
      setIsOpen(true)
    } catch (err: any) {
      console.error('Jarvis hatası:', err)
      setError(err.message || 'Bir hata oluştu')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      {/* Buton */}
      <motion.button
        onClick={handleOpen}
        disabled={isLoading}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={`
          relative group flex items-center gap-2 px-4 py-2.5 rounded-xl
          bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500
          text-white font-bold shadow-lg
          hover:shadow-cyan-500/30 hover:shadow-xl
          disabled:opacity-70 disabled:cursor-not-allowed
          transition-all duration-300
          ${className}
        `}
      >
        {/* Glow efekti */}
        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 blur-lg opacity-50 group-hover:opacity-75 transition-opacity" />
        
        {/* İçerik */}
        <div className="relative flex items-center gap-2">
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Sparkles className="w-5 h-5" />
          )}
          <span>Jarvis ile Çöz</span>
          
          {/* Premium badge */}
          {!isPremium && (
            <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 text-xs">
              <Crown className="w-3 h-3" />
              <span>2</span>
            </div>
          )}
        </div>
      </motion.button>

      {/* Hata mesajı */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-2 px-3 py-2 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 text-sm"
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal - Portal ile body'ye render */}
      {mounted && isOpen && jarvisData && createPortal(
        <JarvisSolutionModal
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          jarvisData={jarvisData}
          questionText={questionText}
          subject={subject}
          options={options}
          correctAnswer={correctAnswer}
          questionImageUrl={questionImageUrl}
        />,
        document.body
      )}
    </>
  )
}
