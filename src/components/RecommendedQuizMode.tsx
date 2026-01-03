'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  X, CheckCircle, XCircle, ArrowRight, 
  Trophy, Flame, Star, Zap, Crown,
  BookOpen, Lightbulb, Target, Award,
  ChevronRight, Sparkles, TrendingUp
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import MathRenderer from '@/components/MathRenderer'
import confetti from 'canvas-confetti'

interface Question {
  question_id: string
  question_text: string
  image_url?: string | null
  options?: { A: string; B: string; C: string; D: string; E?: string } | null
  option_a?: string
  option_b?: string
  option_c?: string
  option_d?: string
  option_e?: string
  correct_answer: 'A' | 'B' | 'C' | 'D' | 'E'
  explanation?: string | null
  difficulty: string
  subject_name: string
  subject_code?: string // Ders bazlı liderlik için
  main_topic: string
  grade: number
}

// Options'ı normalize et (Typesense'den option_a, option_b vs. gelebilir)
function getOptions(question: Question): { A: string; B: string; C: string; D: string; E?: string } {
  if (question.options && typeof question.options === 'object') {
    return question.options
  }
  return {
    A: question.option_a || '',
    B: question.option_b || '',
    C: question.option_c || '',
    D: question.option_d || '',
    E: question.option_e || undefined
  }
}

interface Props {
  isOpen: boolean
  onClose: () => void
  questions: Question[]
  userId: string
}

const difficultyConfig: Record<string, { label: string; color: string; xp: number }> = {
  easy: { label: 'Kolay', color: 'bg-green-500', xp: 10 },
  medium: { label: 'Orta', color: 'bg-yellow-500', xp: 12 },
  hard: { label: 'Zor', color: 'bg-orange-500', xp: 15 },
  legendary: { label: 'Efsane', color: 'bg-purple-500', xp: 20 }
}

export default function RecommendedQuizMode({ isOpen, onClose, questions, userId }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)
  const [totalXP, setTotalXP] = useState(0)
  const [correctCount, setCorrectCount] = useState(0)
  const [wrongCount, setWrongCount] = useState(0)
  const [streak, setStreak] = useState(0)
  const [maxStreak, setMaxStreak] = useState(0)
  const [totalSolved, setTotalSolved] = useState(0)
  const [todaySolved, setTodaySolved] = useState(0)
  const [isFinished, setIsFinished] = useState(false)
  const [answeredQuestions, setAnsweredQuestions] = useState<Set<string>>(new Set())
  const [questionShownAt, setQuestionShownAt] = useState<number>(Date.now()) // Anti-bot: soru gösterilme zamanı
  
  const supabase = createClient()
  const currentQuestion = questions[currentIndex]
  const progress = ((currentIndex + 1) / questions.length) * 100
  const diffInfo = currentQuestion ? (difficultyConfig[currentQuestion.difficulty] || difficultyConfig.medium) : difficultyConfig.medium

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(0)
      setSelectedAnswer(null)
      setShowResult(false)
      setTotalXP(0)
      setCorrectCount(0)
      setWrongCount(0)
      setStreak(0)
      setMaxStreak(0)
      setIsFinished(false)
      setAnsweredQuestions(new Set())
      setTotalSolved(0)
      setTodaySolved(0)
    }
  }, [isOpen])

  // Quiz bittiğinde toplam ve günlük istatistikleri çek
  useEffect(() => {
    if (isFinished && userId) {
      const fetchStats = async () => {
        try {
          // Toplam çözülen soru
          const { count: total } = await supabase
            .from('user_answers')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', userId)
          
          // Bugün çözülen soru
          const today = new Date()
          today.setHours(0, 0, 0, 0)
          const { count: todayCount } = await supabase
            .from('user_answers')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', userId)
            .gte('created_at', today.toISOString())
          
          setTotalSolved(total || 0)
          setTodaySolved(todayCount || 0)
        } catch (error) {
          console.error('Error fetching stats:', error)
        }
      }
      fetchStats()
    }
  }, [isFinished, userId, supabase])

  // Cevabı kaydet ve XP ver
  const saveAnswer = async (questionId: string, answer: string, correct: boolean) => {
    const baseXP = correct ? diffInfo.xp : 2
    const streakBonus = correct && streak >= 3 ? Math.min(streak, 10) : 0
    const earnedXP = baseXP + streakBonus

    try {
      // user_answers tablosuna kaydet
      await supabase.from('user_answers').insert({
        user_id: userId,
        question_id: questionId,
        selected_answer: answer,
        is_correct: correct,
        time_spent: Date.now() - questionShownAt // Gerçek cevap süresi
      })

      // XP ekle (API üzerinden) - Anti-bot timestamp ile
      const response = await fetch('/api/gamification/add-xp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          xp: earnedXP,
          source: 'recommended_quiz',
          questionId,
          isCorrect: correct,
          questionShownAt, // Anti-bot: zaman doğrulaması için
          subjectCode: currentQuestion?.subject_code // Ders bazlı liderlik için (varsa)
        })
      })

      const result = await response.json()
      
      // Rate limit veya şüpheli aktivite uyarısı
      if (response.status === 429) {
        console.warn('Rate limit:', result.error)
      }
      
      if (result.warning) {
        console.warn('Uyarı:', result.warning)
      }

      return earnedXP
    } catch (error) {
      console.error('Failed to save answer:', error)
      return earnedXP
    }
  }

  // Cevap seç
  const handleSelectAnswer = (option: string) => {
    if (showResult) return
    setSelectedAnswer(option)
  }

  // Cevabı kontrol et
  const handleSubmitAnswer = async () => {
    if (!selectedAnswer || !currentQuestion) return

    const correct = selectedAnswer === currentQuestion.correct_answer
    setIsCorrect(correct)
    setShowResult(true)

    // Doğruysa confetti
    if (correct) {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.7 }
      })
      setCorrectCount(prev => prev + 1)
      setStreak(prev => {
        const newStreak = prev + 1
        if (newStreak > maxStreak) setMaxStreak(newStreak)
        return newStreak
      })
    } else {
      setWrongCount(prev => prev + 1)
      setStreak(0)
    }

    // XP kaydet
    const earnedXP = await saveAnswer(currentQuestion.question_id, selectedAnswer, correct)
    setTotalXP(prev => prev + earnedXP)
    setAnsweredQuestions(prev => new Set([...Array.from(prev), currentQuestion.question_id]))
  }

  // Sonraki soru
  const handleNextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1)
      setSelectedAnswer(null)
      setShowResult(false)
      setQuestionShownAt(Date.now()) // Anti-bot: yeni soru için timestamp sıfırla
    } else {
      // Quiz bitti
      setIsFinished(true)
      confetti({
        particleCount: 200,
        spread: 100,
        origin: { y: 0.5 }
      })
    }
  }

  if (!isOpen) return null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-gradient-to-br from-indigo-900 via-purple-900 to-violet-900 z-50 overflow-hidden"
    >
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 bg-black/20 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onClose}
              className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>
            <div>
              <h2 className="text-white font-semibold flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-400" />
                Sana Özel Sorular
              </h2>
              <p className="text-white/60 text-sm">Zayıf konularından {questions.length} soru</p>
            </div>
          </div>
          
          {/* Stats */}
          <div className="flex items-center gap-4 text-white/80 text-sm">
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 text-yellow-400" />
              <span className="font-bold text-yellow-400">{totalXP} XP</span>
            </div>
            <div className="flex items-center gap-1">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <span>{correctCount}</span>
            </div>
            <div className="flex items-center gap-1">
              <XCircle className="w-4 h-4 text-red-400" />
              <span>{wrongCount}</span>
            </div>
            {streak >= 2 && (
              <div className="flex items-center gap-1 px-2 py-1 bg-orange-500/20 rounded-lg">
                <Flame className="w-4 h-4 text-orange-400" />
                <span className="font-bold text-orange-400">{streak}x</span>
              </div>
            )}
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="h-1 bg-white/10">
          <motion.div
            className="h-full bg-gradient-to-r from-yellow-400 to-orange-500"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      {/* Content */}
      <div className="h-full pt-24 pb-24 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4">
          <AnimatePresence mode="wait">
            {isFinished ? (
              // Sonuç Ekranı
              <motion.div
                key="result"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 text-center"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: 'spring' }}
                  className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center"
                >
                  <Trophy className="w-12 h-12 text-white" />
                </motion.div>
                
                <h2 className="text-3xl font-bold text-white mb-2">Tebrikler! 🎉</h2>
                <p className="text-white/70 mb-8">{questions.length} soruyu tamamladın!</p>
                
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="bg-white/10 rounded-2xl p-4">
                    <div className="text-3xl font-bold text-yellow-400">{totalXP}</div>
                    <div className="text-white/60 text-sm">Kazanılan XP</div>
                  </div>
                  <div className="bg-white/10 rounded-2xl p-4">
                    <div className="text-3xl font-bold text-green-400">{correctCount}</div>
                    <div className="text-white/60 text-sm">Doğru</div>
                  </div>
                  <div className="bg-white/10 rounded-2xl p-4">
                    <div className="text-3xl font-bold text-orange-400">{maxStreak}</div>
                    <div className="text-white/60 text-sm">En Uzun Seri</div>
                  </div>
                </div>

                {/* Toplam İstatistikler */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 rounded-2xl p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <Target className="w-5 h-5 text-indigo-400" />
                      <span className="text-white/70 text-sm">Bugün Çözülen</span>
                    </div>
                    <div className="text-3xl font-bold text-indigo-400">{todaySolved}</div>
                  </div>
                  <div className="bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 rounded-2xl p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <TrendingUp className="w-5 h-5 text-emerald-400" />
                      <span className="text-white/70 text-sm">Toplam Çözülen</span>
                    </div>
                    <div className="text-3xl font-bold text-emerald-400">{totalSolved}</div>
                  </div>
                </div>
                
                <div className="text-white/80 mb-8">
                  <div className="text-lg mb-2">Başarı Oranı</div>
                  <div className="text-4xl font-bold text-white">
                    %{Math.round((correctCount / questions.length) * 100)}
                  </div>
                </div>
                
                <button
                  onClick={onClose}
                  className="w-full py-4 bg-gradient-to-r from-yellow-400 to-orange-500 text-white font-bold rounded-xl hover:from-yellow-500 hover:to-orange-600 transition-all"
                >
                  Dashboard'a Dön
                </button>
              </motion.div>
            ) : currentQuestion ? (
              // Soru Kartı
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                className="bg-white/10 backdrop-blur-lg rounded-3xl overflow-hidden"
              >
                {/* Soru Header */}
                <div className="bg-white/5 px-6 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center text-white font-bold">
                      {currentIndex + 1}
                    </div>
                    <div>
                      <div className="text-white font-medium">{currentQuestion.subject_name}</div>
                      <div className="text-white/60 text-sm">{currentQuestion.main_topic}</div>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-lg text-white text-sm ${diffInfo.color}`}>
                    {diffInfo.label} (+{diffInfo.xp} XP)
                  </span>
                </div>
                
                {/* Soru */}
                <div className="p-6">
                  <div className="text-xl text-white leading-relaxed mb-6">
                    <MathRenderer text={currentQuestion.question_text} />
                  </div>
                  
                  {currentQuestion.image_url && (
                    <div className="mb-6 rounded-xl overflow-hidden bg-white/5">
                      <img
                        src={currentQuestion.image_url}
                        alt="Soru görseli"
                        className="w-full max-h-64 object-contain"
                      />
                    </div>
                  )}
                  
                  {/* Şıklar */}
                  <div className="space-y-3">
                    {Object.entries(getOptions(currentQuestion))
                      .filter(([_, value]) => value)
                      .map(([key, value]) => {
                        const isSelected = selectedAnswer === key
                        const isCorrectAnswer = currentQuestion.correct_answer === key
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
                              w-full p-4 rounded-xl text-left transition-all
                              ${isSelected && !showResult ? 'bg-indigo-500 border-2 border-indigo-300' : ''}
                              ${showCorrect ? 'bg-green-500 border-2 border-green-300' : ''}
                              ${showWrong ? 'bg-red-500 border-2 border-red-300' : ''}
                              ${!isSelected && !showResult ? 'bg-white/10 hover:bg-white/20 border-2 border-transparent' : ''}
                              ${showResult && !showCorrect && !showWrong ? 'bg-white/5 border-2 border-transparent opacity-50' : ''}
                            `}
                          >
                            <div className="flex items-start gap-3">
                              <span className={`
                                w-8 h-8 flex items-center justify-center rounded-lg font-semibold text-sm flex-shrink-0
                                ${isSelected || showCorrect || showWrong ? 'bg-white/20 text-white' : 'bg-white/10 text-white/70'}
                              `}>
                                {showCorrect ? <CheckCircle className="w-5 h-5" /> : showWrong ? <XCircle className="w-5 h-5" /> : key}
                              </span>
                              <span className="flex-1 text-white pt-1">
                                <MathRenderer text={value} />
                              </span>
                            </div>
                          </motion.button>
                        )
                      })}
                  </div>
                  
                  {/* Açıklama */}
                  <AnimatePresence>
                    {showResult && currentQuestion.explanation && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-6 overflow-hidden"
                      >
                        <div className="p-4 bg-blue-500/20 rounded-xl border border-blue-400/30">
                          <div className="flex items-start gap-3">
                            <Lightbulb className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                            <div>
                              <p className="font-medium text-blue-300 mb-1">Açıklama</p>
                              <p className="text-blue-200/80 text-sm">
                                <MathRenderer text={currentQuestion.explanation} />
                              </p>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  
                  {/* Sonuç Mesajı */}
                  <AnimatePresence>
                    {showResult && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`mt-6 p-4 rounded-xl ${isCorrect ? 'bg-green-500/30' : 'bg-red-500/30'}`}
                      >
                        <div className="flex items-center gap-3">
                          {isCorrect ? (
                            <>
                              <div className="p-2 bg-green-500 rounded-full">
                                <CheckCircle className="w-6 h-6 text-white" />
                              </div>
                              <div>
                                <p className="font-semibold text-green-300">Harika! 🎉</p>
                                <p className="text-sm text-green-200/80">
                                  +{diffInfo.xp + (streak >= 3 ? Math.min(streak, 10) : 0)} XP kazandın
                                  {streak >= 3 && ` (${streak}x seri bonusu!)`}
                                </p>
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="p-2 bg-red-500 rounded-full">
                                <XCircle className="w-6 h-6 text-white" />
                              </div>
                              <div>
                                <p className="font-semibold text-red-300">Yanlış</p>
                                <p className="text-sm text-red-200/80">
                                  Doğru cevap: {currentQuestion.correct_answer} (+2 XP)
                                </p>
                              </div>
                            </>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </div>

      {/* Footer */}
      {!isFinished && (
        <div className="absolute bottom-0 left-0 right-0 bg-black/20 backdrop-blur-sm">
          <div className="max-w-3xl mx-auto px-4 py-4">
            {!showResult ? (
              <button
                onClick={handleSubmitAnswer}
                disabled={!selectedAnswer}
                className={`
                  w-full py-4 rounded-xl font-bold text-white transition-all
                  ${selectedAnswer 
                    ? 'bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 shadow-lg' 
                    : 'bg-white/20 cursor-not-allowed'
                  }
                `}
              >
                Cevabı Kontrol Et
              </button>
            ) : (
              <button
                onClick={handleNextQuestion}
                className="w-full py-4 bg-gradient-to-r from-yellow-400 to-orange-500 text-white font-bold rounded-xl hover:from-yellow-500 hover:to-orange-600 shadow-lg transition-all flex items-center justify-center gap-2"
              >
                {currentIndex < questions.length - 1 ? (
                  <>
                    <span>Sonraki Soru ({currentIndex + 2}/{questions.length})</span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                ) : (
                  <>
                    <Trophy className="w-5 h-5" />
                    <span>Sonuçları Gör</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      )}
    </motion.div>
  )
}
