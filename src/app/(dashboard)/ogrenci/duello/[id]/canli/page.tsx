'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { createClient } from '@/lib/supabase/client'
import { useProfile, useStudentProfile } from '@/hooks/useProfile'
import { useDuelRealtime } from '@/hooks/useDuelRealtime'
import { motion, AnimatePresence } from 'framer-motion'
import confetti from 'canvas-confetti'
import { 
  Swords, Trophy, Clock, Zap, Crown, Shield,
  Check, X, AlertCircle, Flame, Star, Loader2,
  ChevronRight, Users, Timer
} from 'lucide-react'
import { getInitials } from '@/lib/utils'
import MathRenderer from '@/components/MathRenderer'

interface DuelQuestion {
  id: string
  question_text: string
  option_a: string
  option_b: string
  option_c: string
  option_d: string
  option_e?: string | null  // Lise için 5. şık
  image_url?: string
  subject_name: string
  difficulty: string
}

export default function LiveDuelPage() {
  const params = useParams()
  const router = useRouter()
  const duelId = params.id as string
  
  const { profile } = useProfile()
  const { studentProfile } = useStudentProfile(profile?.id || '')
  const supabase = createClient()
  
  // Oyun state'leri
  const [gamePhase, setGamePhase] = useState<'loading' | 'waiting' | 'countdown' | 'playing' | 'result' | 'finished'>('loading')
  const [questions, setQuestions] = useState<DuelQuestion[]>([])
  const [correctAnswers, setCorrectAnswers] = useState<string[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [timeLeft, setTimeLeft] = useState(30)
  const [countdown, setCountdown] = useState(3)
  
  // Skorlar
  const [myScore, setMyScore] = useState(0)
  const [opponentScore, setOpponentScore] = useState(0)
  const [myStreak, setMyStreak] = useState(0)
  
  // Rakip bilgileri
  const [opponent, setOpponent] = useState<{ name: string; avatarUrl?: string } | null>(null)
  const [opponentAnswered, setOpponentAnswered] = useState(false)
  
  // Timer ref
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const questionStartTimeRef = useRef<number>(0)
  
  // Realtime hook
  const {
    gameState,
    isConnected,
    latency,
    setReady,
    submitAnswer,
    nextQuestion,
    startGame,
    endGame
  } = useDuelRealtime({
    duelId,
    playerId: studentProfile?.id || '',
    playerName: profile?.full_name || 'Oyuncu',
    playerAvatar: profile?.avatar_url || undefined,
    onGameStart: () => {
      setGamePhase('countdown')
      setCountdown(3)
    },
    onQuestionAnswer: (playerId, isCorrect, timeMs) => {
      if (playerId !== studentProfile?.id) {
        setOpponentAnswered(true)
        if (isCorrect) {
          setOpponentScore(prev => prev + 10)
        }
      }
    },
    onNextQuestion: (index) => {
      setCurrentQuestionIndex(index)
      setSelectedAnswer(null)
      setShowResult(false)
      setOpponentAnswered(false)
      setTimeLeft(30)
      questionStartTimeRef.current = Date.now()
      setGamePhase('playing')
    },
    onGameEnd: (winnerId) => {
      setGamePhase('finished')
      if (winnerId === studentProfile?.id) {
        // Kazandık!
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        })
      }
    },
    onOpponentDisconnect: () => {
      // Sayfa geçişlerinde kısa süreli bağlantı kopmaları olabilir
      // Hemen uyarı verme, bekle
      console.log('⚠️ Rakip bağlantısı kesildi, bekliyor...')
    }
  })

  // Düello bilgilerini yükle
  useEffect(() => {
    if (!studentProfile?.id || !duelId) return
    
    loadDuel()
  }, [studentProfile?.id, duelId])

  const loadDuel = async () => {
    try {
      // Düelloyu başlat ve soruları al
      const response = await fetch('/api/duel/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          duelId,
          studentId: studentProfile?.id
        })
      })

      const data = await response.json()
      console.log('📋 API Response:', data)
      console.log('📋 İlk soru:', data.questions?.[0])

      if (data.success) {
        setQuestions(data.questions)
        setCorrectAnswers(data.correctAnswers)
        
        // Rakip bilgisini al
        const duel = data.duel
        const opponentId = duel.challenger_id === studentProfile?.id 
          ? duel.opponent_id 
          : duel.challenger_id
        
        if (opponentId) {
          const { data: opponentData } = await supabase
            .from('student_profiles')
            .select('profile:profiles!student_profiles_user_id_fkey(full_name, avatar_url)')
            .eq('id', opponentId)
            .single()
          
          if (opponentData?.profile) {
            setOpponent({
              name: (opponentData.profile as any).full_name || 'Rakip',
              avatarUrl: (opponentData.profile as any).avatar_url
            })
          }
        }
        
        setGamePhase('waiting')
      } else {
        alert('Düello yüklenemedi: ' + data.error)
        router.push('/ogrenci/duello')
      }
    } catch (error) {
      console.error('Düello yükleme hatası:', error)
      router.push('/ogrenci/duello')
    }
  }

  // Countdown
  useEffect(() => {
    if (gamePhase !== 'countdown') return
    
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    } else {
      setGamePhase('playing')
      setTimeLeft(30)
      questionStartTimeRef.current = Date.now()
    }
  }, [gamePhase, countdown])

  // Question timer
  useEffect(() => {
    if (gamePhase !== 'playing' || showResult) return
    
    if (timeLeft > 0) {
      timerRef.current = setTimeout(() => setTimeLeft(timeLeft - 1), 1000)
      return () => {
        if (timerRef.current) clearTimeout(timerRef.current)
      }
    } else {
      // Süre doldu
      handleAnswer(null)
    }
  }, [gamePhase, timeLeft, showResult])

  // Cevap ver
  const handleAnswer = async (answer: string | null) => {
    if (showResult || selectedAnswer) return
    
    // Güvenlik kontrolü
    if (!correctAnswers || correctAnswers.length === 0) {
      console.error('correctAnswers yüklenmedi!')
      return
    }
    
    const timeTaken = Date.now() - questionStartTimeRef.current
    setSelectedAnswer(answer)
    setShowResult(true)
    
    const isCorrect = answer === correctAnswers[currentQuestionIndex]
    
    if (isCorrect) {
      setMyScore(prev => prev + 10)
      setMyStreak(prev => prev + 1)
    } else {
      setMyStreak(0)
    }
    
    // API'ye gönder
    try {
      await fetch('/api/duel/answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          duelId,
          studentId: studentProfile?.id,
          questionIndex: currentQuestionIndex,
          answer,
          timeTakenMs: timeTaken
        })
      })
    } catch (error) {
      console.error('Cevap gönderme hatası:', error)
    }
    
    // Realtime'a gönder
    submitAnswer(answer || '', isCorrect, currentQuestionIndex, timeTaken)
    
    // 2 saniye sonra sonraki soruya geç
    setTimeout(() => {
      if (currentQuestionIndex < questions.length - 1) {
        const nextIndex = currentQuestionIndex + 1
        nextQuestion(nextIndex)
        setCurrentQuestionIndex(nextIndex)
        setSelectedAnswer(null)
        setShowResult(false)
        setOpponentAnswered(false)
        setTimeLeft(30)
        questionStartTimeRef.current = Date.now()
      } else {
        // Düello bitti
        const winnerId = myScore > opponentScore 
          ? studentProfile?.id 
          : opponentScore > myScore 
            ? 'opponent' 
            : null
        endGame(winnerId || null)
        setGamePhase('finished')
      }
    }, 2000)
  }

  // Hazır ol
  const handleReady = () => {
    setReady()
    startGame()
  }

  // Loading
  if (gamePhase === 'loading' || !studentProfile) {
    return (
      <DashboardLayout role="ogrenci">
        <div className="flex items-center justify-center h-[60vh]">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-primary-500 mx-auto mb-4" />
            <p className="text-surface-500">Düello yükleniyor...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  // Bekleme ekranı
  if (gamePhase === 'waiting') {
    return (
      <DashboardLayout role="ogrenci">
        <div className="max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="card p-8 text-center"
          >
            <Swords className="w-20 h-20 text-red-500 mx-auto mb-6" />
            <h1 className="text-2xl font-bold text-surface-900 dark:text-white mb-2">
              Canlı Düello
            </h1>
            <p className="text-surface-500 mb-8">
              {questions.length} soru • Her soru 30 saniye
            </p>

            {/* VS Gösterimi */}
            <div className="flex items-center justify-center gap-8 mb-8">
              <div className="text-center">
                <div className="w-20 h-20 bg-primary-500 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-2 overflow-hidden">
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    getInitials(profile?.full_name || '')
                  )}
                </div>
                <p className="font-medium text-surface-900 dark:text-white">
                  {profile?.full_name || 'Sen'}
                </p>
              </div>

              <div className="text-4xl font-bold text-red-500">VS</div>

              <div className="text-center">
                <div className="w-20 h-20 bg-orange-500 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-2 overflow-hidden">
                  {opponent?.avatarUrl ? (
                    <img src={opponent.avatarUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    getInitials(opponent?.name || 'R')
                  )}
                </div>
                <p className="font-medium text-surface-900 dark:text-white">
                  {opponent?.name || 'Rakip'}
                </p>
              </div>
            </div>

            {/* Bağlantı durumu */}
            <div className="flex items-center justify-center gap-2 mb-6">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'} animate-pulse`} />
              <span className="text-sm text-surface-500">
                {isConnected ? 'Bağlı' : 'Bağlanıyor...'} • {latency}ms
              </span>
            </div>

            <button
              onClick={handleReady}
              disabled={!isConnected}
              className="btn btn-primary btn-lg"
            >
              <Zap className="w-5 h-5 mr-2" />
              Hazırım, Başla!
            </button>
          </motion.div>
        </div>
      </DashboardLayout>
    )
  }

  // Geri sayım
  if (gamePhase === 'countdown') {
    return (
      <DashboardLayout role="ogrenci">
        <div className="flex items-center justify-center h-[60vh]">
          <motion.div
            key={countdown}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.5, opacity: 0 }}
            className="text-center"
          >
            <div className="text-9xl font-bold text-primary-500">
              {countdown || 'BAŞLA!'}
            </div>
          </motion.div>
        </div>
      </DashboardLayout>
    )
  }

  // Oyun ekranı
  if (gamePhase === 'playing' || gamePhase === 'result') {
    // Sorular yüklenmeden bu faza geçildiyse loading göster
    if (!questions || questions.length === 0 || !correctAnswers || correctAnswers.length === 0) {
      return (
        <DashboardLayout role="ogrenci">
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <Loader2 className="w-12 h-12 animate-spin text-primary-500 mb-4" />
            <p className="text-surface-600">Sorular yükleniyor...</p>
          </div>
        </DashboardLayout>
      )
    }

    const question = questions[currentQuestionIndex]
    const correctAnswer = correctAnswers[currentQuestionIndex]

    // Soru bulunamadıysa
    if (!question) {
      return (
        <DashboardLayout role="ogrenci">
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
            <p className="text-surface-600">Soru yüklenemedi</p>
            <button 
              onClick={() => window.location.reload()}
              className="btn btn-primary mt-4"
            >
              Yeniden Dene
            </button>
          </div>
        </DashboardLayout>
      )
    }

    return (
      <DashboardLayout role="ogrenci">
        <div className="max-w-6xl mx-auto space-y-4">
          {/* Üst bar - Skorlar ve Timer birleşik */}
          <div className="card p-3 flex items-center justify-between">
            {/* Ben */}
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-primary-500 rounded-full flex items-center justify-center text-white font-bold text-sm overflow-hidden">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  getInitials(profile?.full_name || '')
                )}
              </div>
              <div>
                <div className="text-sm font-medium text-surface-900 dark:text-white">
                  {profile?.full_name?.split(' ')[0]}
                </div>
                <div className="text-xl font-bold text-primary-500">{myScore}</div>
              </div>
              {myStreak >= 2 && (
                <div className="flex items-center gap-1 px-1.5 py-0.5 bg-orange-100 dark:bg-orange-900/30 rounded-full">
                  <Flame className="w-3 h-3 text-orange-500" />
                  <span className="text-xs font-bold text-orange-500">{myStreak}</span>
                </div>
              )}
            </div>

            {/* Ortada - Soru sayacı ve Timer */}
            <div className="flex flex-col items-center">
              <div className="text-sm text-surface-500">
                Soru <span className="font-bold text-surface-900 dark:text-white">{currentQuestionIndex + 1}/{questions.length}</span>
              </div>
              {/* Timer bar */}
              <div className="w-32 h-1.5 bg-surface-200 dark:bg-surface-600 rounded-full overflow-hidden mt-1">
                <motion.div
                  className={`h-full ${
                    timeLeft > 10 ? 'bg-green-500' : timeLeft > 5 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  initial={{ width: '100%' }}
                  animate={{ width: `${(timeLeft / 30) * 100}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
              <span className={`text-lg font-bold ${
                timeLeft > 10 ? 'text-green-500' : timeLeft > 5 ? 'text-yellow-500' : 'text-red-500'
              }`}>
                {timeLeft}s
              </span>
            </div>

            {/* Rakip */}
            <div className="flex items-center gap-2">
              {opponentAnswered && (
                <div className="px-1.5 py-0.5 bg-green-100 dark:bg-green-900/30 rounded-full">
                  <Check className="w-3 h-3 text-green-500" />
                </div>
              )}
              <div className="text-right">
                <div className="text-sm font-medium text-surface-900 dark:text-white">
                  {opponent?.name?.split(' ')[0] || 'Rakip'}
                </div>
                <div className="text-xl font-bold text-orange-500">{opponentScore}</div>
              </div>
              <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold text-sm overflow-hidden">
                {opponent?.avatarUrl ? (
                  <img src={opponent.avatarUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  getInitials(opponent?.name || 'R')
                )}
              </div>
            </div>
          </div>

          {/* Soru kartı */}
          <motion.div
            key={currentQuestionIndex}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            className="card p-8"
          >
            {/* Soru bilgisi */}
            <div className="flex items-center gap-2 mb-6">
              <span className="px-3 py-1.5 bg-surface-100 dark:bg-surface-700 rounded-lg text-sm font-medium">
                {question.subject_name}
              </span>
              <span className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                question.difficulty === 'easy' ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300' :
                question.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300' :
                'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300'
              }`}>
                {question.difficulty === 'easy' ? 'Kolay' : 
                 question.difficulty === 'medium' ? 'Orta' : 'Zor'}
              </span>
            </div>

            {/* Soru */}
            <div className="text-lg md:text-xl lg:text-2xl leading-relaxed text-surface-900 dark:text-white mb-8">
              <MathRenderer text={question.question_text} />
            </div>

            {/* Görsel */}
            {question.image_url && (
              <div className="flex justify-center mb-8">
                <img 
                  src={question.image_url} 
                  alt="Soru görseli" 
                  className="w-full max-w-3xl h-auto max-h-[500px] object-contain rounded-xl shadow-lg"
                />
              </div>
            )}

            {/* Seçenekler (4 veya 5 şık) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {['A', 'B', 'C', 'D', 'E'].map((option) => {
                const optionKey = `option_${option.toLowerCase()}` as keyof DuelQuestion
                const optionText = question[optionKey] as string | null | undefined
                
                // E şıkkı yoksa gösterme (ortaokul soruları)
                if (option === 'E' && !optionText) return null
                
                const isSelected = selectedAnswer === option
                const isCorrectOption = showResult && option === correctAnswer
                const isWrongSelected = showResult && isSelected && option !== correctAnswer

                return (
                  <motion.button
                    key={option}
                    onClick={() => !showResult && handleAnswer(option)}
                    disabled={showResult}
                    whileHover={!showResult ? { scale: 1.02 } : {}}
                    whileTap={!showResult ? { scale: 0.98 } : {}}
                    className={`p-5 rounded-xl border-2 text-left transition-all ${
                      isCorrectOption
                        ? 'border-green-500 bg-green-50 dark:bg-green-900/30'
                        : isWrongSelected
                        ? 'border-red-500 bg-red-50 dark:bg-red-900/30'
                        : isSelected
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30'
                        : 'border-surface-200 dark:border-surface-700 hover:border-primary-300 hover:shadow-md'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <span className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-base flex-shrink-0 ${
                        isCorrectOption
                          ? 'bg-green-500 text-white'
                          : isWrongSelected
                          ? 'bg-red-500 text-white'
                          : isSelected
                          ? 'bg-primary-500 text-white'
                          : 'bg-surface-100 dark:bg-surface-700 text-surface-600'
                      }`}>
                        {isCorrectOption ? <Check className="w-5 h-5" /> :
                         isWrongSelected ? <X className="w-5 h-5" /> : option}
                      </span>
                      <span className="flex-1 text-base text-surface-900 dark:text-white leading-relaxed">
                        <MathRenderer text={optionText || ''} />
                      </span>
                    </div>
                  </motion.button>
                )
              })}
            </div>
          </motion.div>
        </div>
      </DashboardLayout>
    )
  }

  // Bitiş ekranı
  if (gamePhase === 'finished') {
    const isWinner = myScore > opponentScore
    const isDraw = myScore === opponentScore

    return (
      <DashboardLayout role="ogrenci">
        <div className="max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="card p-8 text-center"
          >
            {/* Sonuç ikonu */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', delay: 0.2 }}
            >
              {isWinner ? (
                <div className="w-24 h-24 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Trophy className="w-12 h-12 text-yellow-500" />
                </div>
              ) : isDraw ? (
                <div className="w-24 h-24 bg-gray-100 dark:bg-gray-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Shield className="w-12 h-12 text-gray-500" />
                </div>
              ) : (
                <div className="w-24 h-24 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                  <X className="w-12 h-12 text-red-500" />
                </div>
              )}
            </motion.div>

            <h1 className={`text-3xl font-bold mb-2 ${
              isWinner ? 'text-yellow-500' : isDraw ? 'text-gray-500' : 'text-red-500'
            }`}>
              {isWinner ? 'Tebrikler! Kazandın!' : isDraw ? 'Berabere!' : 'Kaybettin!'}
            </h1>

            {/* Skor karşılaştırma */}
            <div className="flex items-center justify-center gap-8 my-8">
              <div className="text-center">
                <div className="text-5xl font-bold text-primary-500">{myScore}</div>
                <div className="text-surface-500">Sen</div>
              </div>
              <div className="text-2xl text-surface-400">-</div>
              <div className="text-center">
                <div className="text-5xl font-bold text-orange-500">{opponentScore}</div>
                <div className="text-surface-500">{opponent?.name || 'Rakip'}</div>
              </div>
            </div>

            {/* Kazanılan puan */}
            {isWinner && (
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl mb-6">
                <span className="text-green-600 font-medium">
                  +10 Bonus Puan Kazandın! 🎉
                </span>
              </div>
            )}

            {/* Butonlar */}
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => router.push('/ogrenci/duello')}
                className="btn btn-secondary"
              >
                Düello Lobisine Dön
              </button>
              <button
                onClick={() => window.location.reload()}
                className="btn btn-primary"
              >
                <Swords className="w-4 h-4 mr-2" />
                Tekrar Oyna
              </button>
            </div>
          </motion.div>
        </div>
      </DashboardLayout>
    )
  }

  return null
}

