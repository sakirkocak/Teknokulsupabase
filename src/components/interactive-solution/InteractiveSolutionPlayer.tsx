'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Play, Pause, SkipForward, SkipBack, RotateCcw,
  Volume2, VolumeX, Check, X, Lightbulb, Trophy,
  ChevronRight, Star, Loader2, ThumbsUp, ThumbsDown,
  Bookmark, BookmarkCheck, StickyNote, Gauge
} from 'lucide-react'
import AnimationRenderer from './animations'
import { useTTS, useWebSpeech } from '@/hooks/useTTS'
import MathRenderer from '@/components/MathRenderer'

// Types
interface QuizOption { id: string; text: string; is_correct: boolean }
interface StepQuiz { question: string; options: QuizOption[]; hint: string; explanation_correct: string; explanation_wrong: string }
interface SolutionStep {
  id: string
  type: 'explanation' | 'calculation' | 'visualization' | 'quiz' | 'result'
  title: string
  content: string
  tts_text: string
  duration_seconds: number
  animation_template: string
  animation_data?: Record<string, unknown>
  quiz?: StepQuiz
}
interface InteractiveSolution {
  question_summary: string
  difficulty: 'easy' | 'medium' | 'hard'
  estimated_time_seconds: number
  steps: SolutionStep[]
  summary: string
  key_concepts: string[]
  common_mistakes: string[]
}
interface PlayerProps {
  solution: InteractiveSolution
  questionText: string
  onComplete?: (stats: PlayerStats) => void
  autoPlay?: boolean
  voice?: 'erdem' | 'mehmet' | 'gamze'
}
interface PlayerStats { totalTime: number; correctAnswers: number; wrongAnswers: number; hintsUsed: number; score: number }

const STEP_ICONS: Record<string, string> = {
  explanation: '📖', calculation: '🧮', visualization: '📊', quiz: '❓', result: '✅'
}

export default function InteractiveSolutionPlayer({ 
  solution, questionText, onComplete, autoPlay = false, voice = 'erdem'
}: PlayerProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(autoPlay)
  const [isMuted, setIsMuted] = useState(false)
  const [stats, setStats] = useState<PlayerStats>({ totalTime: 0, correctAnswers: 0, wrongAnswers: 0, hintsUsed: 0, score: 0 })
  const [quizAnswered, setQuizAnswered] = useState<Record<string, boolean>>({})
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({})
  const [hintsShown, setHintsShown] = useState<Record<string, boolean>>({})
  const [isComplete, setIsComplete] = useState(false)
  const [startTime] = useState(Date.now())
  const lastSpokenStepRef = useRef<string | null>(null)

  // Interaktif özellikler
  const [playbackSpeed, setPlaybackSpeed] = useState(1)
  const [stepUnderstood, setStepUnderstood] = useState<Record<string, boolean>>({})
  const [showNotes, setShowNotes] = useState(false)
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [bookmarkedSteps, setBookmarkedSteps] = useState<Record<string, boolean>>({})

  const { speak, stop: stopTTS, isPlaying: isTTSPlaying, isLoading: isTTSLoading } = useTTS({ 
    voice,
    onEnd: () => {
      if (isPlaying && currentStep?.type !== 'quiz' && !isLastStep) {
        setTimeout(() => setCurrentStepIndex(prev => prev + 1), 1000)
      }
    }
  })
  const webSpeech = useWebSpeech()

  const currentStep = solution?.steps?.[currentStepIndex]
  const isLastStep = currentStepIndex === (solution?.steps?.length || 1) - 1
  const progress = ((currentStepIndex + 1) / (solution?.steps?.length || 1)) * 100

  const playStepAudio = useCallback(async (step: SolutionStep) => {
    if (isMuted || !step?.tts_text) return
    if (lastSpokenStepRef.current === step.id) return
    lastSpokenStepRef.current = step.id
    try { await speak(step.tts_text) } catch { webSpeech.speak(step.tts_text) }
  }, [isMuted, speak, webSpeech])

  useEffect(() => { if (currentStep && isPlaying) playStepAudio(currentStep) }, [currentStepIndex, isPlaying])
  useEffect(() => { if (isMuted) { stopTTS(); webSpeech.stop() } }, [isMuted, stopTTS, webSpeech])
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isComplete) setStats(prev => ({ ...prev, totalTime: Math.floor((Date.now() - startTime) / 1000) }))
    }, 1000)
    return () => clearInterval(interval)
  }, [startTime, isComplete])

  useEffect(() => {
    if (!isPlaying || currentStep?.type === 'quiz' || isTTSPlaying || isTTSLoading) return
    if (isMuted || !currentStep?.tts_text) {
      const duration = ((currentStep?.duration_seconds || 5) * 1000) / playbackSpeed
      const timer = setTimeout(() => {
        if (!isLastStep) setCurrentStepIndex(prev => prev + 1)
        else { setIsPlaying(false); handleComplete() }
      }, duration)
      return () => clearTimeout(timer)
    }
  }, [currentStepIndex, isPlaying, currentStep, isTTSPlaying, isTTSLoading, isMuted, isLastStep, playbackSpeed])

  const handleComplete = useCallback(() => {
    setIsComplete(true); stopTTS()
    const finalStats = { ...stats, totalTime: Math.floor((Date.now() - startTime) / 1000), score: Math.max(0, (stats.correctAnswers * 100) - (stats.wrongAnswers * 25) - (stats.hintsUsed * 10)) }
    setStats(finalStats); onComplete?.(finalStats)
  }, [stats, startTime, onComplete, stopTTS])

  const handleQuizAnswer = (stepId: string, optionId: string, isCorrect: boolean) => {
    setQuizAnswered(prev => ({ ...prev, [stepId]: true }))
    setSelectedAnswers(prev => ({ ...prev, [stepId]: optionId }))
    setStats(prev => ({ ...prev, correctAnswers: prev.correctAnswers + (isCorrect ? 1 : 0), wrongAnswers: prev.wrongAnswers + (isCorrect ? 0 : 1) }))
    if (!isMuted) speak(isCorrect ? 'Harika! Doğru cevap.' : 'Maalesef yanlış.')
  }

  const goToStep = (index: number) => { if (index >= 0 && index < (solution?.steps?.length || 0)) { stopTTS(); lastSpokenStepRef.current = null; setCurrentStepIndex(index) } }
  const togglePlay = () => { if (isPlaying) { stopTTS(); setIsPlaying(false) } else { setIsPlaying(true); if (currentStep) { lastSpokenStepRef.current = null; playStepAudio(currentStep) } } }
  const restart = () => { stopTTS(); lastSpokenStepRef.current = null; setCurrentStepIndex(0); setIsPlaying(false); setQuizAnswered({}); setSelectedAnswers({}); setHintsShown({}); setIsComplete(false); setStats({ totalTime: 0, correctAnswers: 0, wrongAnswers: 0, hintsUsed: 0, score: 0 }) }

  if (!solution || !solution.steps || solution.steps.length === 0) {
    return <div className="p-8 bg-gray-100 rounded-2xl text-center"><p className="text-gray-500">Çözüm verisi bulunamadı</p></div>
  }

  // Completion Screen - Kompakt
  if (isComplete) {
    return (
      <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl text-white p-6">
        <div className="text-center">
          <Trophy className="w-12 h-12 mx-auto text-yellow-300 mb-3" />
          <h2 className="text-xl font-bold mb-2">Tebrikler! 🎉</h2>
          <div className="grid grid-cols-4 gap-3 my-4">
            <div className="bg-white/20 rounded-lg p-2"><div className="text-2xl font-bold">{stats.score}</div><div className="text-xs">Puan</div></div>
            <div className="bg-white/20 rounded-lg p-2"><div className="text-2xl font-bold">{stats.correctAnswers}</div><div className="text-xs">Doğru</div></div>
            <div className="bg-white/20 rounded-lg p-2"><div className="text-2xl font-bold">{stats.wrongAnswers}</div><div className="text-xs">Yanlış</div></div>
            <div className="bg-white/20 rounded-lg p-2"><div className="text-2xl font-bold">{Math.floor(stats.totalTime / 60)}:{String(stats.totalTime % 60).padStart(2, '0')}</div><div className="text-xs">Süre</div></div>
          </div>
          {/* Anladım istatistikleri */}
          {Object.keys(stepUnderstood).length > 0 && (
            <div className="bg-white/10 rounded-lg p-3 text-sm mb-3">
              <span className="text-green-300">Anladığın adımlar: {Object.values(stepUnderstood).filter(Boolean).length}/{solution.steps.length}</span>
            </div>
          )}

          {/* Kaydedilen notlar */}
          {Object.keys(notes).filter(k => notes[k]).length > 0 && (
            <div className="bg-white/10 rounded-lg p-3 text-left text-sm mb-3">
              <p className="text-blue-300 font-medium mb-1">Notların:</p>
              {Object.entries(notes).filter(([, v]) => v).map(([stepId, note]) => (
                <p key={stepId} className="text-white/80 text-xs mb-1">- {note}</p>
              ))}
            </div>
          )}

          <button onClick={restart} className="px-4 py-2 bg-white text-indigo-600 rounded-lg font-semibold hover:bg-indigo-50 flex items-center gap-2 mx-auto">
            <RotateCcw className="w-4 h-4" /> Tekrar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Progress Bar */}
      <div className="bg-white px-4 py-3 border-b">
        <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
          <span>Adım {currentStepIndex + 1}/{solution.steps.length}</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="h-1.5 bg-gray-300 rounded-full overflow-hidden">
          <motion.div className="h-full bg-indigo-500" animate={{ width: `${progress}%` }} />
        </div>
      </div>

      {/* Step Pills - Yatay Scroll */}
      <div className="bg-gray-50 px-4 py-2 flex gap-1.5 overflow-x-auto">
        {solution.steps.map((step, i) => (
          <button
            key={step.id}
            onClick={() => goToStep(i)}
            className={`flex-shrink-0 w-8 h-8 rounded-full text-xs font-medium flex items-center justify-center transition-all ${
              i === currentStepIndex ? 'bg-indigo-500 text-white shadow' 
              : i < currentStepIndex || quizAnswered[step.id] ? 'bg-green-100 text-green-700' 
              : 'bg-gray-200 text-gray-400'
            }`}
          >
            {step.type === 'quiz' ? (quizAnswered[step.id] ? '✓' : '?') : (i < currentStepIndex ? '✓' : i + 1)}
          </button>
        ))}
      </div>

      {/* İçerik Alanı - Animasyon + Content */}
      <div className="flex-1 overflow-y-auto bg-white">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="p-4"
          >
            {/* Adım Başlığı */}
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xl">{STEP_ICONS[currentStep.type] || '📝'}</span>
              <h3 className="font-semibold text-gray-800">{currentStep.title}</h3>
              {(isTTSLoading || isTTSPlaying) && (
                <span className="ml-auto flex items-center gap-1 text-xs text-indigo-500">
                  {isTTSLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Volume2 className="w-3 h-3 animate-pulse" />}
                </span>
              )}
            </div>

            {/* Animasyon Alanı - TAM EKRAN */}
            <div className="mb-4 rounded-xl overflow-hidden bg-gradient-to-br from-slate-900 to-slate-800" style={{ minHeight: '400px' }}>
              <AnimationRenderer 
                template={currentStep.animation_template || 'text_reveal'} 
                data={currentStep.animation_data || { text: currentStep.content, style: 'info' }} 
                isPlaying={isPlaying} 
              />
            </div>

            {/* İçerik veya Quiz */}
            {currentStep.type === 'quiz' && currentStep.quiz ? (
              <div className="space-y-3">
                <p className="text-sm text-gray-700 font-medium">
                  <MathRenderer text={currentStep.quiz.question || ''} />
                </p>
                
                {hintsShown[currentStep.id] && (
                  <div className="p-2 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2 text-xs">
                    <Lightbulb className="w-4 h-4 text-amber-500 flex-shrink-0" />
                    <MathRenderer text={currentStep.quiz.hint || ''} />
                  </div>
                )}

                <div className="grid gap-2">
                  {currentStep.quiz.options.map(option => {
                    const isSelected = selectedAnswers[currentStep.id] === option.id
                    const answered = quizAnswered[currentStep.id]
                    let style = 'bg-white border-gray-200 hover:border-indigo-300'
                    if (answered) {
                      if (option.is_correct) style = 'bg-green-50 border-green-400'
                      else if (isSelected) style = 'bg-red-50 border-red-400'
                    }
                    return (
                      <button
                        key={option.id}
                        onClick={() => !answered && handleQuizAnswer(currentStep.id, option.id, option.is_correct)}
                        disabled={answered}
                        className={`p-3 border-2 rounded-xl text-left text-sm transition-all ${style}`}
                      >
                        <div className="flex items-center justify-between">
                          <MathRenderer text={option.text || ''} />
                          {answered && isSelected && (option.is_correct ? <Check className="w-4 h-4 text-green-500" /> : <X className="w-4 h-4 text-red-500" />)}
                          {answered && option.is_correct && !isSelected && <Check className="w-4 h-4 text-green-500" />}
                        </div>
                      </button>
                    )
                  })}
                </div>

                {quizAnswered[currentStep.id] && (
                  <div className={`p-3 rounded-lg text-sm ${currentStep.quiz.options.find(o => o.id === selectedAnswers[currentStep.id])?.is_correct ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                    <MathRenderer text={currentStep.quiz.options.find(o => o.id === selectedAnswers[currentStep.id])?.is_correct ? currentStep.quiz.explanation_correct : currentStep.quiz.explanation_wrong} />
                  </div>
                )}

                {!quizAnswered[currentStep.id] && !hintsShown[currentStep.id] && (
                  <button onClick={() => { setHintsShown(p => ({ ...p, [currentStep.id]: true })); setStats(p => ({ ...p, hintsUsed: p.hintsUsed + 1 })) }} className="text-xs text-amber-600 flex items-center gap-1">
                    <Lightbulb className="w-3 h-3" /> İpucu (-10 puan)
                  </button>
                )}
              </div>
            ) : (
              <div className="text-sm text-gray-700 leading-relaxed">
                <MathRenderer text={currentStep.content || ''} />
              </div>
            )}

            {/* Interaktif Araçlar */}
            <div className="mt-4 space-y-3">
              {/* Anladın mı? */}
              {currentStep.type !== 'quiz' && !stepUnderstood[currentStep.id] && (
                <div className="flex items-center gap-3 p-3 bg-indigo-50 border border-indigo-200 rounded-xl">
                  <span className="text-sm font-medium text-indigo-700">Bu adımı anladın mı?</span>
                  <div className="flex gap-2 ml-auto">
                    <button
                      onClick={() => {
                        setStepUnderstood(p => ({ ...p, [currentStep.id]: true }))
                        setStats(p => ({ ...p, score: p.score + 5 }))
                        if (!isMuted) speak('Harika! Devam edelim.')
                      }}
                      className="flex items-center gap-1 px-3 py-1.5 bg-green-500 text-white rounded-lg text-sm hover:bg-green-600 transition-colors"
                    >
                      <ThumbsUp className="w-4 h-4" /> Evet
                    </button>
                    <button
                      onClick={() => {
                        lastSpokenStepRef.current = null
                        if (currentStep) playStepAudio(currentStep)
                        if (!isMuted) speak('Tamam, tekrar dinleyelim.')
                      }}
                      className="flex items-center gap-1 px-3 py-1.5 bg-orange-500 text-white rounded-lg text-sm hover:bg-orange-600 transition-colors"
                    >
                      <RotateCcw className="w-4 h-4" /> Tekrar Dinle
                    </button>
                  </div>
                </div>
              )}

              {stepUnderstood[currentStep.id] && (
                <div className="flex items-center gap-2 p-2 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
                  <Check className="w-4 h-4" /> Anladın! +5 puan
                </div>
              )}

              {/* Bookmark + Not Al */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setBookmarkedSteps(p => ({ ...p, [currentStep.id]: !p[currentStep.id] }))}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs transition-colors ${
                    bookmarkedSteps[currentStep.id]
                      ? 'bg-amber-100 text-amber-700 border border-amber-300'
                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}
                >
                  {bookmarkedSteps[currentStep.id] ? <BookmarkCheck className="w-3.5 h-3.5" /> : <Bookmark className="w-3.5 h-3.5" />}
                  {bookmarkedSteps[currentStep.id] ? 'Kaydedildi' : 'Kaydet'}
                </button>
                <button
                  onClick={() => setShowNotes(!showNotes)}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs transition-colors ${
                    showNotes ? 'bg-blue-100 text-blue-700 border border-blue-300' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}
                >
                  <StickyNote className="w-3.5 h-3.5" /> Not Al
                </button>
              </div>

              {/* Not Alanı */}
              {showNotes && (
                <textarea
                  value={notes[currentStep.id] || ''}
                  onChange={(e) => setNotes(p => ({ ...p, [currentStep.id]: e.target.value }))}
                  placeholder="Bu adım hakkında notlarını yaz..."
                  className="w-full p-3 border border-blue-200 rounded-xl text-sm bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
                  rows={3}
                />
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Kontroller - Alt Sabit */}
      <div className="bg-gray-50 border-t p-3 flex items-center justify-between rounded-b-2xl">
        <div className="flex items-center gap-1">
          <button onClick={() => goToStep(currentStepIndex - 1)} disabled={currentStepIndex === 0} className="p-2 rounded-lg bg-gray-200 hover:bg-gray-300 disabled:opacity-50">
            <SkipBack className="w-4 h-4" />
          </button>
          {currentStep.type !== 'quiz' && (
            <button onClick={togglePlay} disabled={isTTSLoading} className="p-2 rounded-lg bg-indigo-500 text-white hover:bg-indigo-600">
              {isTTSLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
            </button>
          )}
          <button onClick={() => { setIsMuted(!isMuted); if (!isMuted) stopTTS() }} className={`p-2 rounded-lg ${isMuted ? 'bg-red-100 text-red-600' : 'bg-gray-200'}`}>
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
          <button onClick={restart} className="p-2 rounded-lg bg-gray-200 hover:bg-gray-300">
            <RotateCcw className="w-4 h-4" />
          </button>
          {/* Hız Kontrolü */}
          <button
            onClick={() => {
              const speeds = [0.5, 0.75, 1, 1.25, 1.5, 2]
              const idx = speeds.indexOf(playbackSpeed)
              const nextSpeed = speeds[(idx + 1) % speeds.length]
              setPlaybackSpeed(nextSpeed)
            }}
            className="px-2 py-1 rounded-lg bg-gray-200 hover:bg-gray-300 text-xs font-bold text-gray-600 min-w-[42px]"
            title="Hız değiştir"
          >
            {playbackSpeed}x
          </button>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 px-2 py-1 bg-amber-100 rounded-lg text-sm">
            <Star className="w-4 h-4 text-amber-500" />
            <span className="font-medium text-amber-700">{Math.max(0, stats.correctAnswers * 100 - stats.wrongAnswers * 25 - stats.hintsUsed * 10)}</span>
          </div>

          {currentStep.type === 'quiz' && !quizAnswered[currentStep.id] ? (
            <span className="text-xs text-gray-500">Cevabını seç</span>
          ) : (
            <button
              onClick={() => { stopTTS(); if (isLastStep) handleComplete(); else goToStep(currentStepIndex + 1) }}
              className="flex items-center gap-1 px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 text-sm font-medium"
            >
              {isLastStep ? 'Bitir' : 'Devam'} <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
