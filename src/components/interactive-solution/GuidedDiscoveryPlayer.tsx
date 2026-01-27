'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Volume2, VolumeX, Lightbulb, Trophy, RotateCcw,
  ChevronRight, Star, Loader2, Zap, Flame
} from 'lucide-react'
import WidgetRenderer, { StepInteraction } from './widgets/WidgetRenderer'
import AnimationRenderer from './animations'
import { useTTS, useWebSpeech } from '@/hooks/useTTS'
import MathRenderer from '@/components/MathRenderer'

// Step types for Guided Discovery
export type GuidedStepType = 'discover' | 'solve' | 'verify' | 'teach' | 'celebrate'

export interface GuidedStep {
  id: string
  type: GuidedStepType
  title: string
  content: string
  tts_text: string
  duration_seconds: number
  interaction: StepInteraction
  animation_template?: string
  animation_data?: Record<string, any>
}

export interface GuidedSolution {
  question_summary: string
  difficulty: 'easy' | 'medium' | 'hard'
  estimated_time_seconds: number
  steps: GuidedStep[]
  summary: string
  key_concepts: string[]
  common_mistakes: string[]
}

interface Props {
  solution: GuidedSolution
  questionText: string
  onComplete?: (stats: GuidedStats) => void
  voice?: 'erdem' | 'mehmet' | 'gamze'
}

export interface GuidedStats {
  totalTime: number
  correctAnswers: number
  wrongAnswers: number
  hintsUsed: number
  xp: number
  combo: number
  maxCombo: number
  stepAttempts: Record<string, number>
}

const STEP_ICONS: Record<GuidedStepType, string> = {
  discover: '🔍',
  solve: '✏️',
  verify: '✅',
  teach: '📖',
  celebrate: '🎉',
}

const STEP_COLORS: Record<GuidedStepType, string> = {
  discover: 'from-blue-500 to-cyan-500',
  solve: 'from-indigo-500 to-purple-500',
  verify: 'from-emerald-500 to-green-500',
  teach: 'from-amber-500 to-orange-500',
  celebrate: 'from-pink-500 to-rose-500',
}

export default function GuidedDiscoveryPlayer({ solution, questionText, onComplete, voice = 'erdem' }: Props) {
  const [started, setStarted] = useState(false)
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [isMuted, setIsMuted] = useState(false)
  const [stats, setStats] = useState<GuidedStats>({
    totalTime: 0, correctAnswers: 0, wrongAnswers: 0, hintsUsed: 0,
    xp: 0, combo: 0, maxCombo: 0, stepAttempts: {}
  })
  const [stepCompleted, setStepCompleted] = useState<Record<string, boolean>>({})
  const [stepCorrect, setStepCorrect] = useState<Record<string, boolean>>({})
  const [hintLevel, setHintLevel] = useState<Record<string, number>>({}) // 0-2
  const [isComplete, setIsComplete] = useState(false)
  const [startTime] = useState(Date.now())
  const [floatingXP, setFloatingXP] = useState<{ id: number; amount: number; x: number } | null>(null)
  const [widgetResetKey, setWidgetResetKey] = useState(0)
  const [showingWrongFeedback, setShowingWrongFeedback] = useState(false)
  const xpIdRef = useRef(0)
  const lastSpokenRef = useRef<string | null>(null)

  const { speak, stop: stopTTS, isPlaying: isTTSPlaying, isLoading: isTTSLoading } = useTTS({
    voice,
    onEnd: () => {}
  })
  const webSpeech = useWebSpeech()

  const currentStep = solution?.steps?.[currentStepIndex]
  const isLastStep = currentStepIndex === (solution?.steps?.length || 1) - 1
  const progress = ((currentStepIndex + 1) / (solution?.steps?.length || 1)) * 100

  // Timer
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isComplete) setStats(prev => ({ ...prev, totalTime: Math.floor((Date.now() - startTime) / 1000) }))
    }, 1000)
    return () => clearInterval(interval)
  }, [startTime, isComplete])

  // Auto-speak on every step change (after user has started)
  useEffect(() => {
    if (!currentStep || isMuted || !started) return
    if (lastSpokenRef.current === currentStep.id) return
    lastSpokenRef.current = currentStep.id
    const text = currentStep.tts_text || currentStep.interaction?.prompt || currentStep.content
    if (text) speak(text).catch(() => webSpeech.speak(text))
  }, [currentStepIndex, currentStep, isMuted, started])

  // Cleanup
  useEffect(() => { if (isMuted) { stopTTS(); webSpeech.stop() } }, [isMuted])

  const showFloatingXP = (amount: number) => {
    const id = ++xpIdRef.current
    setFloatingXP({ id, amount, x: Math.random() * 60 + 20 })
    setTimeout(() => setFloatingXP(prev => prev?.id === id ? null : prev), 1500)
  }

  const handleInteractionResult = useCallback((isCorrect: boolean, _value: any) => {
    const stepId = currentStep?.id || ''
    const attempts = (stats.stepAttempts[stepId] || 0) + 1
    const maxAttempts = currentStep?.interaction?.max_attempts || 3
    const firstTry = attempts === 1

    setStats(prev => {
      const newCombo = isCorrect ? prev.combo + 1 : 0
      const maxCombo = Math.max(prev.maxCombo, newCombo)
      let xpGain = 0

      if (isCorrect) {
        xpGain = 15 // Base XP
        if (firstTry) xpGain += 5 // First try bonus
        if (newCombo >= 3) xpGain += 10 // Combo bonus
      }

      if (xpGain > 0) showFloatingXP(xpGain)

      return {
        ...prev,
        correctAnswers: prev.correctAnswers + (isCorrect ? 1 : 0),
        wrongAnswers: prev.wrongAnswers + (isCorrect ? 0 : 1),
        xp: prev.xp + xpGain,
        combo: newCombo,
        maxCombo,
        stepAttempts: { ...prev.stepAttempts, [stepId]: attempts }
      }
    })

    // Speak feedback
    if (!isMuted && currentStep?.interaction) {
      const feedback = isCorrect ? currentStep.interaction.feedback_correct : currentStep.interaction.feedback_wrong
      if (feedback) speak(feedback).catch(() => webSpeech.speak(feedback))
    }

    if (isCorrect || attempts >= maxAttempts) {
      // Lock the widget permanently
      setStepCompleted(prev => ({ ...prev, [stepId]: true }))
      setStepCorrect(prev => ({ ...prev, [stepId]: isCorrect }))
    } else {
      // Wrong but has more attempts: show feedback briefly, then reset widget
      setShowingWrongFeedback(true)
      setStepCorrect(prev => ({ ...prev, [stepId]: false }))
      setTimeout(() => {
        setShowingWrongFeedback(false)
        setStepCorrect(prev => { const n = { ...prev }; delete n[stepId]; return n })
        setWidgetResetKey(k => k + 1)
      }, 2000)
    }
  }, [currentStep, stats.stepAttempts, isMuted])

  const handleHint = () => {
    if (!currentStep) return
    const stepId = currentStep.id
    const current = hintLevel[stepId] || 0
    const hints = currentStep.interaction?.hints || []
    if (current >= hints.length) return

    setHintLevel(prev => ({ ...prev, [stepId]: current + 1 }))
    setStats(prev => ({ ...prev, hintsUsed: prev.hintsUsed + 1, xp: Math.max(0, prev.xp - 5) }))

    if (!isMuted && hints[current]) {
      speak(hints[current]).catch(() => webSpeech.speak(hints[current]))
    }
  }

  const goNext = () => {
    stopTTS()
    lastSpokenRef.current = null
    if (isLastStep) {
      handleComplete()
    } else {
      setCurrentStepIndex(prev => prev + 1)
    }
  }

  const handleComplete = () => {
    setIsComplete(true)
    stopTTS()
    const finalStats = { ...stats, totalTime: Math.floor((Date.now() - startTime) / 1000) }
    setStats(finalStats)
    onComplete?.(finalStats)
  }

  const restart = () => {
    stopTTS()
    lastSpokenRef.current = null
    setCurrentStepIndex(0)
    setStepCompleted({})
    setStepCorrect({})
    setHintLevel({})
    setIsComplete(false)
    setShowingWrongFeedback(false)
    setWidgetResetKey(0)
    setStats({ totalTime: 0, correctAnswers: 0, wrongAnswers: 0, hintsUsed: 0, xp: 0, combo: 0, maxCombo: 0, stepAttempts: {} })
  }

  if (!solution?.steps?.length) {
    return <div className="p-8 bg-gray-100 rounded-2xl text-center"><p className="text-gray-500">Çözüm verisi bulunamadı</p></div>
  }

  // Start screen - requires user click to satisfy browser autoplay policy
  if (!started) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl p-8 text-white">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring' }}>
          <div className="text-5xl mb-4 text-center">🔍</div>
          <h2 className="text-2xl font-bold text-center mb-2">Rehberli Keşif</h2>
          <p className="text-white/50 text-center text-xs mb-6">{solution.steps.length} adım · {solution.key_concepts?.join(', ')}</p>
          <button
            onClick={() => setStarted(true)}
            className="w-full py-3 bg-white text-indigo-700 rounded-xl font-bold text-lg hover:bg-white/90 transition-colors shadow-lg"
          >
            Başla
          </button>
        </motion.div>
      </div>
    )
  }

  // Completion Screen
  if (isComplete) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl text-white p-8 h-full flex flex-col items-center justify-center">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.2 }}>
          <Trophy className="w-16 h-16 text-yellow-300 mb-4 mx-auto" />
        </motion.div>
        <h2 className="text-2xl font-bold mb-2">Tebrikler!</h2>
        <p className="text-white/70 mb-6">Çözümü başarıyla tamamladın</p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full max-w-lg mb-6">
          <div className="bg-white/15 backdrop-blur rounded-xl p-3 text-center">
            <Zap className="w-5 h-5 text-yellow-300 mx-auto mb-1" />
            <div className="text-2xl font-bold">{stats.xp}</div>
            <div className="text-xs text-white/60">XP</div>
          </div>
          <div className="bg-white/15 backdrop-blur rounded-xl p-3 text-center">
            <Star className="w-5 h-5 text-green-300 mx-auto mb-1" />
            <div className="text-2xl font-bold">{stats.correctAnswers}</div>
            <div className="text-xs text-white/60">Doğru</div>
          </div>
          <div className="bg-white/15 backdrop-blur rounded-xl p-3 text-center">
            <Flame className="w-5 h-5 text-orange-300 mx-auto mb-1" />
            <div className="text-2xl font-bold">{stats.maxCombo}</div>
            <div className="text-xs text-white/60">Max Kombo</div>
          </div>
          <div className="bg-white/15 backdrop-blur rounded-xl p-3 text-center">
            <Lightbulb className="w-5 h-5 text-amber-300 mx-auto mb-1" />
            <div className="text-2xl font-bold">{stats.hintsUsed}</div>
            <div className="text-xs text-white/60">İpucu</div>
          </div>
        </div>

        {/* Per-step breakdown */}
        <div className="w-full max-w-lg bg-white/10 rounded-xl p-4 mb-6">
          <h3 className="text-sm font-medium text-white/70 mb-2">Adım Detayları</h3>
          <div className="space-y-1">
            {solution.steps.filter(s => s.interaction?.type !== 'none').map((step, i) => (
              <div key={step.id} className="flex items-center justify-between text-xs">
                <span className="text-white/80">{STEP_ICONS[step.type]} {step.title}</span>
                <span className="text-white/60">{stats.stepAttempts[step.id] || 0} deneme</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-3">
          <button onClick={restart} className="px-5 py-2.5 bg-white/20 hover:bg-white/30 rounded-xl font-medium flex items-center gap-2 transition-colors">
            <RotateCcw className="w-4 h-4" /> Tekrar Çöz
          </button>
        </div>
      </motion.div>
    )
  }

  const currentHintLevel = hintLevel[currentStep.id] || 0
  const hints = currentStep.interaction?.hints || []
  const hasInteraction = currentStep.interaction && currentStep.interaction.type !== 'none'
  const isStepDone = stepCompleted[currentStep.id]
  const canProceed = !hasInteraction || isStepDone || currentStep.type === 'teach' || currentStep.type === 'celebrate'

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl overflow-hidden">
      {/* Header: Progress + XP + Combo */}
      <div className="bg-gray-50 px-4 py-3 border-b">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-gray-500 font-medium">
            Adım {currentStepIndex + 1}/{solution.steps.length}
          </span>
          <div className="flex items-center gap-3">
            {stats.combo >= 3 && (
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex items-center gap-1 px-2 py-0.5 bg-orange-100 rounded-full">
                <Flame className="w-3 h-3 text-orange-500" />
                <span className="text-xs font-bold text-orange-600">{stats.combo}x</span>
              </motion.div>
            )}
            <div className="flex items-center gap-1 px-2 py-0.5 bg-yellow-100 rounded-full">
              <Zap className="w-3 h-3 text-yellow-600" />
              <span className="text-xs font-bold text-yellow-700">{stats.xp} XP</span>
            </div>
          </div>
        </div>
        {/* Progress bar */}
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <motion.div
            className={`h-full rounded-full bg-gradient-to-r ${STEP_COLORS[currentStep.type]}`}
            animate={{ width: `${progress}%` }}
            transition={{ type: 'spring', stiffness: 100 }}
          />
        </div>
        {/* Step pills */}
        <div className="flex gap-1 mt-2 overflow-x-auto">
          {solution.steps.map((step, i) => (
            <div key={step.id}
              className={`flex-shrink-0 w-7 h-7 rounded-full text-xs flex items-center justify-center transition-all ${
                i === currentStepIndex ? `bg-gradient-to-r ${STEP_COLORS[step.type]} text-white shadow-md`
                : stepCompleted[step.id] ? 'bg-green-100 text-green-700'
                : 'bg-gray-100 text-gray-400'
              }`}
            >
              {stepCompleted[step.id] ? '✓' : STEP_ICONS[step.type]}
            </div>
          ))}
        </div>
      </div>

      {/* Main content area */}
      <div className="flex-1 overflow-y-auto relative">
        {/* Floating XP animation */}
        <AnimatePresence>
          {floatingXP && (
            <motion.div
              key={floatingXP.id}
              initial={{ opacity: 1, y: 0, x: `${floatingXP.x}%` }}
              animate={{ opacity: 0, y: -80 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.2 }}
              className="absolute top-4 z-20 pointer-events-none"
              style={{ left: `${floatingXP.x}%` }}
            >
              <span className="text-xl font-black text-yellow-500 drop-shadow-lg">+{floatingXP.amount} XP</span>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="p-5 space-y-4"
          >
            {/* Step header */}
            <div className="flex items-center gap-2">
              <span className={`w-8 h-8 rounded-full bg-gradient-to-r ${STEP_COLORS[currentStep.type]} flex items-center justify-center text-white text-sm`}>
                {STEP_ICONS[currentStep.type]}
              </span>
              <div>
                <h3 className="font-semibold text-gray-800 text-sm">{currentStep.title}</h3>
                <span className="text-xs text-gray-400 capitalize">{currentStep.type}</span>
              </div>
              {(isTTSLoading || isTTSPlaying) && (
                <span className="ml-auto">
                  {isTTSLoading ? <Loader2 className="w-4 h-4 animate-spin text-indigo-400" /> : <Volume2 className="w-4 h-4 text-indigo-400 animate-pulse" />}
                </span>
              )}
            </div>

            {/* Content text */}
            <div className="text-sm text-gray-700 leading-relaxed bg-gray-50 rounded-xl p-4">
              <MathRenderer text={currentStep.content} />
            </div>

            {/* Animation area */}
            {currentStep.animation_template && currentStep.animation_template !== 'none' && (
              <div className="rounded-xl overflow-hidden" style={{ maxHeight: '280px' }}>
                <AnimationRenderer
                  template={currentStep.animation_template}
                  data={currentStep.animation_data || {}}
                  isPlaying={true}
                />
              </div>
            )}

            {/* Interactive Widget */}
            {hasInteraction && (
              <div className="border-2 border-dashed border-indigo-200 rounded-xl p-4 bg-indigo-50/30">
                <WidgetRenderer
                  key={`${currentStep.id}-${widgetResetKey}`}
                  interaction={currentStep.interaction}
                  onResult={handleInteractionResult}
                  disabled={isStepDone || showingWrongFeedback}
                />
              </div>
            )}

            {/* Hints */}
            {hasInteraction && !isStepDone && hints.length > 0 && (
              <div className="space-y-2">
                {Array.from({ length: currentHintLevel }).map((_, i) => (
                  <motion.div key={i} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                    className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
                    <Lightbulb className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                    <span>{hints[i]}</span>
                  </motion.div>
                ))}
              </div>
            )}

            {/* Correct/wrong feedback after interaction */}
            {(isStepDone || showingWrongFeedback) && currentStep.interaction?.type !== 'none' && stepCorrect[currentStep.id] !== undefined && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className={`p-3 rounded-xl text-sm font-medium ${
                  stepCorrect[currentStep.id]
                    ? 'bg-green-50 text-green-700 border border-green-200'
                    : 'bg-red-50 text-red-700 border border-red-200'
                }`}>
                {stepCorrect[currentStep.id]
                  ? (currentStep.interaction.feedback_correct || 'Doğru!')
                  : (currentStep.interaction.feedback_wrong || 'Yanlış cevap.')}
                {showingWrongFeedback && !isStepDone && (
                  <span className="block text-xs mt-1 opacity-70">
                    Tekrar dene! ({(currentStep.interaction?.max_attempts || 3) - (stats.stepAttempts[currentStep.id] || 0)} hak kaldı)
                  </span>
                )}
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom controls */}
      <div className="bg-gray-50 border-t px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button onClick={() => setIsMuted(!isMuted)}
            className={`p-2 rounded-lg transition-colors ${isMuted ? 'bg-red-100 text-red-500' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}>
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
          {hasInteraction && !isStepDone && currentHintLevel < hints.length && (
            <button onClick={handleHint}
              className="flex items-center gap-1 px-3 py-2 bg-amber-100 text-amber-700 rounded-lg text-xs font-medium hover:bg-amber-200 transition-colors">
              <Lightbulb className="w-3 h-3" />
              İpucu ({currentHintLevel}/{hints.length})
              <span className="text-amber-500">-5 XP</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {!isMuted && currentStep.tts_text && (
            <button onClick={() => { lastSpokenRef.current = null; speak(currentStep.tts_text).catch(() => webSpeech.speak(currentStep.tts_text)) }}
              className="px-3 py-2 bg-gray-200 text-gray-600 rounded-lg text-xs font-medium hover:bg-gray-300 transition-colors">
              🔊 Tekrar Dinle
            </button>
          )}
          <button
            onClick={goNext}
            disabled={!canProceed}
            className={`flex items-center gap-1 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              canProceed
                ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:from-indigo-600 hover:to-purple-600 shadow-lg shadow-indigo-500/25'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            {isLastStep ? 'Bitir' : 'Devam'} <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
