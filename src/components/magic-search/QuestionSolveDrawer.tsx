'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  X, CheckCircle, XCircle, ArrowRight, 
  Sparkles, Trophy, Flame, Star, Zap,
  BookOpen, Lightbulb, RefreshCw, Crown
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import MathRenderer from '@/components/MathRenderer'
import MembershipPrompt from './MembershipPrompt'
import {
  recordAnswer,
  shouldShowSoftPrompt,
  shouldShowHardPrompt,
  markSoftPromptSeen,
  markHardPromptSeen,
  getGuestStats,
  canContinueSolving
} from '@/lib/guestTracker'
import confetti from 'canvas-confetti'

interface Props {
  isOpen: boolean
  onClose: () => void
  questionId: string | null
  searchQuery?: string
}

interface Question {
  id: string
  question_text: string
  question_image_url: string | null
  options: { A: string; B: string; C: string; D: string; E?: string }
  correct_answer: 'A' | 'B' | 'C' | 'D' | 'E'
  explanation: string | null
  difficulty: string
  topic?: {
    main_topic: string
    grade: number
    subject?: {
      name: string
      code: string
    }
  }
}

const difficultyConfig: Record<string, { label: string; color: string; icon: typeof Star }> = {
  easy: { label: 'Kolay', color: 'bg-green-500', icon: CheckCircle },
  medium: { label: 'Orta', color: 'bg-yellow-500', icon: Star },
  hard: { label: 'Zor', color: 'bg-orange-500', icon: Zap },
  legendary: { label: 'Efsane', color: 'bg-purple-500', icon: Crown }
}

const optionLabels = ['A', 'B', 'C', 'D', 'E']

export default function QuestionSolveDrawer({ isOpen, onClose, questionId, searchQuery }: Props) {
  const [question, setQuestion] = useState<Question | null>(null)
  const [loading, setLoading] = useState(false)
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)
  const [stats, setStats] = useState(getGuestStats())
  const [showMembershipPrompt, setShowMembershipPrompt] = useState(false)
  const [membershipType, setMembershipType] = useState<'soft' | 'hard'>('soft')
  const [user, setUser] = useState<any>(null)
  const [earnedXP, setEarnedXP] = useState(0)
  const [questionShownAt, setQuestionShownAt] = useState<number>(Date.now()) // Anti-bot timestamp
  
  const supabase = createClient()
  
  // Auth durumunu kontrol et
  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }
    checkUser()
  }, [])

  // Soru yükle (Supabase'den - sadece bu endpoint)
  const loadQuestion = useCallback(async (id: string) => {
    setLoading(true)
    setSelectedAnswer(null)
    setShowResult(false)
    setQuestionShownAt(Date.now()) // Anti-bot: soru gösterilme zamanı

    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('questions')
        .select(`
          id,
          question_text,
          question_image_url,
          options,
          correct_answer,
          explanation,
          difficulty,
          topic:topics(
            main_topic,
            grade,
            subject:subjects(name, code)
          )
        `)
        .eq('id', id)
        .single()

      if (error) throw error

      // Topic'i düzelt (array olabilir)
      const topic = Array.isArray(data?.topic) ? data.topic[0] : data?.topic
      const subject = Array.isArray(topic?.subject) ? topic.subject[0] : topic?.subject

      setQuestion({
        ...data,
        topic: topic ? {
          ...topic,
          subject
        } : undefined
      } as Question)
    } catch (error) {
      console.error('Failed to load question:', error)
      setQuestion(null)
    }

    setLoading(false)
  }, [])

  // Question ID değiştiğinde yükle
  useEffect(() => {
    if (isOpen && questionId) {
      loadQuestion(questionId)
    }
  }, [isOpen, questionId, loadQuestion])

  // Cevap seç
  const handleSelectAnswer = (option: string) => {
    if (showResult || !question) return
    setSelectedAnswer(option)
  }

  // Cevabı kontrol et
  const handleSubmitAnswer = async () => {
    if (!selectedAnswer || !question) return

    const correct = selectedAnswer === question.correct_answer
    setIsCorrect(correct)
    setShowResult(true)

    // Doğruysa confetti
    if (correct) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      })
    }

    // Login olan kullanıcı için gerçek puan kaydet
    if (user) {
      try {
        // XP hesapla
        const baseXP = correct ? 10 : 2
        const difficultyBonus = question.difficulty === 'hard' ? 5 : question.difficulty === 'legendary' ? 10 : 0
        const xp = baseXP + difficultyBonus
        setEarnedXP(xp)
        
        const answerTimeMs = Date.now() - questionShownAt
        
        // user_answers tablosuna kaydet
        await supabase.from('user_answers').insert({
          user_id: user.id,
          question_id: question.id,
          selected_answer: selectedAnswer,
          is_correct: correct,
          time_spent: answerTimeMs
        })
        
        // Puan güncelle (API üzerinden) - Anti-bot timestamp ile
        const response = await fetch('/api/gamification/add-xp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user.id,
            xp,
            source: 'quick_solve',
            questionId: question.id,
            isCorrect: correct,
            questionShownAt // Anti-bot: zaman doğrulaması
          })
        })
        
        const result = await response.json()
        
        // Rate limit kontrolü
        if (response.status === 429) {
          console.warn('⚠️ Rate limit:', result.error)
        }
        
        console.log(`✅ XP earned: ${xp} (${answerTimeMs}ms)`)
      } catch (error) {
        console.error('Failed to save answer:', error)
      }
    } else {
      // Guest için local storage'a kaydet
      recordAnswer(question.id, correct)
      setStats(getGuestStats())
      setEarnedXP(correct ? 10 : 2) // Guest için de göster ama kaydetme
      
      // Membership prompt kontrolü (sadece guest için)
      setTimeout(() => {
        if (shouldShowHardPrompt()) {
          setMembershipType('hard')
          setShowMembershipPrompt(true)
        } else if (shouldShowSoftPrompt()) {
          setMembershipType('soft')
          setShowMembershipPrompt(true)
        }
      }, 1500)
    }
  }

  // Drawer'ı kapat
  const handleClose = () => {
    setQuestion(null)
    setSelectedAnswer(null)
    setShowResult(false)
    onClose()
  }

  // Membership prompt kapat
  const handleMembershipDismiss = () => {
    if (membershipType === 'soft') {
      markSoftPromptSeen()
    } else {
      markHardPromptSeen()
    }
    setShowMembershipPrompt(false)
    
    // Hard prompt'ta kapatırsa drawer'ı da kapat
    if (membershipType === 'hard') {
      handleClose()
    }
  }

  if (!isOpen) return null

  const diffInfo = question ? (difficultyConfig[question.difficulty] || difficultyConfig.medium) : difficultyConfig.medium
  const DiffIcon = diffInfo.icon

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={handleClose}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
      />

      {/* Drawer */}
      <motion.div
        initial={{ opacity: 0, x: '100%' }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="fixed right-0 top-0 h-full w-full max-w-2xl bg-white shadow-2xl z-50 overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex-shrink-0 border-b border-gray-100">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${diffInfo.color} bg-opacity-10`}>
                <BookOpen className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <h2 className="font-semibold text-gray-900">Soru Çöz</h2>
                <p className="text-sm text-gray-500">
                  {question?.topic?.subject?.name || 'Yükleniyor...'} • {question?.topic?.grade || '-'}. Sınıf
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Stats Bar */}
          <div className="px-4 pb-3 flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1 text-indigo-600">
              <Trophy className="w-4 h-4" />
              <span>{stats.total} soru</span>
            </div>
            <div className="flex items-center gap-1 text-green-600">
              <CheckCircle className="w-4 h-4" />
              <span>{stats.correct} doğru</span>
            </div>
            <div className="flex items-center gap-1 text-orange-500">
              <Flame className="w-4 h-4" />
              <span>{stats.streak} seri</span>
            </div>
            <div className="ml-auto">
              <span className={`px-2 py-1 rounded text-xs ${diffInfo.color} bg-opacity-20`}>
                <DiffIcon className="w-3 h-3 inline mr-1" />
                {diffInfo.label}
              </span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin mx-auto mb-3" />
                <p className="text-gray-500">Soru yükleniyor...</p>
              </div>
            </div>
          ) : question ? (
            <div className="space-y-6">
              {/* Topic */}
              {question.topic?.main_topic && (
                <div className="text-sm text-gray-500">
                  📚 {question.topic.main_topic}
                </div>
              )}

              {/* Question Text */}
              <div className="text-lg text-gray-800 leading-relaxed">
                <MathRenderer text={question.question_text} />
              </div>

              {/* Question Image */}
              {question.question_image_url && (
                <div className="rounded-xl overflow-hidden bg-gray-50 border border-gray-100">
                  <img
                    src={question.question_image_url}
                    alt="Soru görseli"
                    className="w-full max-h-64 object-contain"
                  />
                </div>
              )}

              {/* Options */}
              <div className="space-y-3">
                {Object.entries(question.options)
                  .filter(([_, value]) => value)
                  .map(([key, value]) => {
                    const isSelected = selectedAnswer === key
                    const isCorrectAnswer = question.correct_answer === key
                    const showCorrect = showResult && isCorrectAnswer
                    const showWrong = showResult && isSelected && !isCorrectAnswer

                    return (
                      <motion.button
                        key={key}
                        onClick={() => handleSelectAnswer(key)}
                        disabled={showResult}
                        whileHover={!showResult ? { scale: 1.01 } : {}}
                        whileTap={!showResult ? { scale: 0.99 } : {}}
                        className={`
                          w-full p-4 rounded-xl border-2 text-left transition-all
                          ${isSelected && !showResult ? 'border-indigo-500 bg-indigo-50' : ''}
                          ${showCorrect ? 'border-green-500 bg-green-50' : ''}
                          ${showWrong ? 'border-red-500 bg-red-50' : ''}
                          ${!isSelected && !showResult ? 'border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/50' : ''}
                          ${showResult && !showCorrect && !showWrong ? 'border-gray-200 opacity-50' : ''}
                        `}
                      >
                        <div className="flex items-start gap-3">
                          <span className={`
                            w-8 h-8 flex items-center justify-center rounded-lg font-semibold text-sm flex-shrink-0
                            ${isSelected && !showResult ? 'bg-indigo-500 text-white' : ''}
                            ${showCorrect ? 'bg-green-500 text-white' : ''}
                            ${showWrong ? 'bg-red-500 text-white' : ''}
                            ${!isSelected && !showResult ? 'bg-gray-100 text-gray-600' : ''}
                            ${showResult && !showCorrect && !showWrong ? 'bg-gray-100 text-gray-400' : ''}
                          `}>
                            {showCorrect ? <CheckCircle className="w-5 h-5" /> : showWrong ? <XCircle className="w-5 h-5" /> : key}
                          </span>
                          <span className="flex-1 pt-1">
                            <MathRenderer text={value} />
                          </span>
                        </div>
                      </motion.button>
                    )
                  })}
              </div>

              {/* Explanation */}
              <AnimatePresence>
                {showResult && question.explanation && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                      <div className="flex items-start gap-3">
                        <Lightbulb className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium text-blue-800 mb-1">Açıklama</p>
                          <p className="text-blue-700 text-sm">
                            <MathRenderer text={question.explanation} />
                          </p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Result Message */}
              <AnimatePresence>
                {showResult && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-4 rounded-xl ${isCorrect ? 'bg-green-100' : 'bg-red-100'}`}
                  >
                    <div className="flex items-center gap-3">
                      {isCorrect ? (
                        <>
                          <div className="p-2 bg-green-500 rounded-full">
                            <CheckCircle className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <p className="font-semibold text-green-800">Harika! Doğru cevap! 🎉</p>
                            <p className="text-sm text-green-700">
                              {user ? `+${earnedXP} XP kazandın` : 'Kayıt ol ve XP kazan!'}
                            </p>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="p-2 bg-red-500 rounded-full">
                            <XCircle className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <p className="font-semibold text-red-800">Yanlış cevap</p>
                            <p className="text-sm text-red-700">
                              Doğru cevap: {question.correct_answer}
                              {user && ` (+${earnedXP} XP)`}
                            </p>
                          </div>
                        </>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <BookOpen className="w-8 h-8 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">Soru bulunamadı</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 border-t border-gray-100 p-4">
          {!showResult ? (
            <button
              onClick={handleSubmitAnswer}
              disabled={!selectedAnswer}
              className={`
                w-full py-4 rounded-xl font-semibold text-white transition-all
                ${selectedAnswer 
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 shadow-lg' 
                  : 'bg-gray-300 cursor-not-allowed'
                }
              `}
            >
              Cevabı Kontrol Et
            </button>
          ) : (
            <button
              onClick={handleClose}
              className="w-full py-4 rounded-xl font-semibold bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:from-indigo-600 hover:to-purple-600 shadow-lg transition-all flex items-center justify-center gap-2"
            >
              <span>Aramaya Dön</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          )}
        </div>
      </motion.div>

      {/* Membership Prompt - Sadece guest kullanıcılar için */}
      {!user && (
        <MembershipPrompt
          isOpen={showMembershipPrompt}
          type={membershipType}
          stats={stats}
          onClose={handleMembershipDismiss}
        />
      )}
    </>
  )
}
