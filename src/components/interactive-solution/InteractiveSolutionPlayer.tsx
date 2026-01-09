'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Play, Pause, SkipForward, SkipBack, RotateCcw, 
  Volume2, VolumeX, Check, X, Lightbulb, Trophy,
  ChevronRight, Clock, Star
} from 'lucide-react'

// Types
interface QuizOption {
  id: string
  text: string
  is_correct: boolean
}

interface StepQuiz {
  question: string
  options: QuizOption[]
  hint: string
  explanation_correct: string
  explanation_wrong: string
}

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
}

interface PlayerStats {
  totalTime: number
  correctAnswers: number
  wrongAnswers: number
  hintsUsed: number
  score: number
}

// Step Type Colors & Icons
const STEP_STYLES: Record<string, { bg: string; border: string; icon: string }> = {
  explanation: { bg: 'bg-blue-50', border: 'border-blue-200', icon: '📖' },
  calculation: { bg: 'bg-purple-50', border: 'border-purple-200', icon: '🧮' },
  visualization: { bg: 'bg-green-50', border: 'border-green-200', icon: '📊' },
  quiz: { bg: 'bg-amber-50', border: 'border-amber-200', icon: '❓' },
  result: { bg: 'bg-emerald-50', border: 'border-emerald-200', icon: '✅' },
}

// Difficulty Badge
const DifficultyBadge = ({ difficulty }: { difficulty: string }) => {
  const styles = {
    easy: 'bg-green-100 text-green-700',
    medium: 'bg-amber-100 text-amber-700',
    hard: 'bg-red-100 text-red-700',
  }
  const labels = { easy: 'Kolay', medium: 'Orta', hard: 'Zor' }
  
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[difficulty as keyof typeof styles]}`}>
      {labels[difficulty as keyof typeof labels]}
    </span>
  )
}

// Quiz Component
const QuizStep = ({ 
  quiz, 
  onAnswer, 
  onHint,
  answered,
  selectedAnswer,
  showHint 
}: { 
  quiz: StepQuiz
  onAnswer: (optionId: string, isCorrect: boolean) => void
  onHint: () => void
  answered: boolean
  selectedAnswer: string | null
  showHint: boolean
}) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-800">{quiz.question}</h3>
      
      {/* İpucu */}
      {showHint && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2"
        >
          <Lightbulb className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-amber-700">{quiz.hint}</p>
        </motion.div>
      )}
      
      {/* Seçenekler */}
      <div className="grid gap-3">
        {quiz.options.map((option) => {
          const isSelected = selectedAnswer === option.id
          const showResult = answered && isSelected
          
          let buttonStyle = 'bg-white border-gray-200 hover:border-indigo-300 hover:bg-indigo-50'
          if (answered) {
            if (option.is_correct) {
              buttonStyle = 'bg-green-50 border-green-400'
            } else if (isSelected && !option.is_correct) {
              buttonStyle = 'bg-red-50 border-red-400'
            }
          }
          
          return (
            <motion.button
              key={option.id}
              onClick={() => !answered && onAnswer(option.id, option.is_correct)}
              disabled={answered}
              whileHover={!answered ? { scale: 1.02 } : {}}
              whileTap={!answered ? { scale: 0.98 } : {}}
              className={`p-4 border-2 rounded-xl text-left transition-all ${buttonStyle} ${answered ? 'cursor-default' : 'cursor-pointer'}`}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium">{option.text}</span>
                {showResult && (
                  option.is_correct 
                    ? <Check className="w-5 h-5 text-green-500" />
                    : <X className="w-5 h-5 text-red-500" />
                )}
                {answered && option.is_correct && !isSelected && (
                  <Check className="w-5 h-5 text-green-500" />
                )}
              </div>
            </motion.button>
          )
        })}
      </div>
      
      {/* Açıklama */}
      {answered && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-lg ${
            quiz.options.find(o => o.id === selectedAnswer)?.is_correct 
              ? 'bg-green-50 border border-green-200' 
              : 'bg-red-50 border border-red-200'
          }`}
        >
          <p className="text-sm">
            {quiz.options.find(o => o.id === selectedAnswer)?.is_correct 
              ? quiz.explanation_correct 
              : quiz.explanation_wrong}
          </p>
        </motion.div>
      )}
      
      {/* İpucu butonu */}
      {!answered && !showHint && (
        <button 
          onClick={onHint}
          className="flex items-center gap-2 text-sm text-amber-600 hover:text-amber-700"
        >
          <Lightbulb className="w-4 h-4" />
          İpucu Al
        </button>
      )}
    </div>
  )
}

// Animation Renderer
const AnimationRenderer = ({ template, data }: { template: string; data?: Record<string, unknown> }) => {
  // Placeholder - burada Manim/Canvas animasyonları render edilecek
  return (
    <div className="aspect-video bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl flex items-center justify-center">
      <div className="text-center text-white">
        <div className="text-4xl mb-2">
          {template === 'equation_balance' && '⚖️'}
          {template === 'number_line' && '📏'}
          {template === 'pie_chart' && '🥧'}
          {template === 'coordinate_plane' && '📈'}
          {template === 'geometry_shape' && '📐'}
          {template === 'bar_graph' && '📊'}
          {(template === 'text_reveal' || template === 'step_by_step' || template === 'none') && '✨'}
        </div>
        <p className="text-sm text-slate-400">Animasyon: {template}</p>
        {data && (
          <pre className="text-xs text-slate-500 mt-2 max-w-xs overflow-hidden">
            {JSON.stringify(data, null, 2).substring(0, 100)}...
          </pre>
        )}
      </div>
    </div>
  )
}

// Main Player Component
export default function InteractiveSolutionPlayer({ 
  solution, 
  questionText,
  onComplete,
  autoPlay = false 
}: PlayerProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(autoPlay)
  const [isMuted, setIsMuted] = useState(false)
  const [stats, setStats] = useState<PlayerStats>({
    totalTime: 0,
    correctAnswers: 0,
    wrongAnswers: 0,
    hintsUsed: 0,
    score: 0
  })
  
  // Quiz state
  const [quizAnswered, setQuizAnswered] = useState<Record<string, boolean>>({})
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({})
  const [hintsShown, setHintsShown] = useState<Record<string, boolean>>({})
  
  const [isComplete, setIsComplete] = useState(false)
  const [startTime] = useState(Date.now())

  const currentStep = solution.steps[currentStepIndex]
  const isLastStep = currentStepIndex === solution.steps.length - 1
  const progress = ((currentStepIndex + 1) / solution.steps.length) * 100

  // Auto-advance for non-quiz steps
  useEffect(() => {
    if (!isPlaying || currentStep.type === 'quiz') return
    
    const timer = setTimeout(() => {
      if (!isLastStep) {
        setCurrentStepIndex(prev => prev + 1)
      } else {
        setIsPlaying(false)
        handleComplete()
      }
    }, currentStep.duration_seconds * 1000)

    return () => clearTimeout(timer)
  }, [currentStepIndex, isPlaying, currentStep])

  // Time tracking
  useEffect(() => {
    const interval = setInterval(() => {
      if (isPlaying || !isComplete) {
        setStats(prev => ({
          ...prev,
          totalTime: Math.floor((Date.now() - startTime) / 1000)
        }))
      }
    }, 1000)
    return () => clearInterval(interval)
  }, [startTime, isPlaying, isComplete])

  const handleComplete = useCallback(() => {
    setIsComplete(true)
    const finalStats = {
      ...stats,
      totalTime: Math.floor((Date.now() - startTime) / 1000),
      score: Math.max(0, (stats.correctAnswers * 100) - (stats.wrongAnswers * 25) - (stats.hintsUsed * 10))
    }
    setStats(finalStats)
    onComplete?.(finalStats)
  }, [stats, startTime, onComplete])

  const handleQuizAnswer = (stepId: string, optionId: string, isCorrect: boolean) => {
    setQuizAnswered(prev => ({ ...prev, [stepId]: true }))
    setSelectedAnswers(prev => ({ ...prev, [stepId]: optionId }))
    setStats(prev => ({
      ...prev,
      correctAnswers: prev.correctAnswers + (isCorrect ? 1 : 0),
      wrongAnswers: prev.wrongAnswers + (isCorrect ? 0 : 1)
    }))
  }

  const handleHint = (stepId: string) => {
    setHintsShown(prev => ({ ...prev, [stepId]: true }))
    setStats(prev => ({ ...prev, hintsUsed: prev.hintsUsed + 1 }))
  }

  const goToStep = (index: number) => {
    if (index >= 0 && index < solution.steps.length) {
      setCurrentStepIndex(index)
      setIsPlaying(false)
    }
  }

  const restart = () => {
    setCurrentStepIndex(0)
    setIsPlaying(false)
    setQuizAnswered({})
    setSelectedAnswers({})
    setHintsShown({})
    setIsComplete(false)
    setStats({
      totalTime: 0,
      correctAnswers: 0,
      wrongAnswers: 0,
      hintsUsed: 0,
      score: 0
    })
  }

  // Completion Screen
  if (isComplete) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="max-w-2xl mx-auto p-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl text-white"
      >
        <div className="text-center space-y-6">
          <Trophy className="w-16 h-16 mx-auto text-yellow-300" />
          <h2 className="text-2xl font-bold">Tebrikler! 🎉</h2>
          <p className="text-indigo-100">{solution.summary}</p>
          
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-white/20 rounded-xl p-4">
              <div className="text-3xl font-bold">{stats.score}</div>
              <div className="text-sm text-indigo-200">Puan</div>
            </div>
            <div className="bg-white/20 rounded-xl p-4">
              <div className="text-3xl font-bold">{stats.correctAnswers}</div>
              <div className="text-sm text-indigo-200">Doğru</div>
            </div>
            <div className="bg-white/20 rounded-xl p-4">
              <div className="text-3xl font-bold">{stats.wrongAnswers}</div>
              <div className="text-sm text-indigo-200">Yanlış</div>
            </div>
            <div className="bg-white/20 rounded-xl p-4">
              <div className="text-3xl font-bold">{Math.floor(stats.totalTime / 60)}:{(stats.totalTime % 60).toString().padStart(2, '0')}</div>
              <div className="text-sm text-indigo-200">Süre</div>
            </div>
          </div>

          {/* Key Concepts */}
          <div className="text-left bg-white/10 rounded-xl p-4 mt-4">
            <h3 className="font-semibold mb-2">📚 Öğrenilen Kavramlar</h3>
            <div className="flex flex-wrap gap-2">
              {solution.key_concepts.map((concept, i) => (
                <span key={i} className="px-3 py-1 bg-white/20 rounded-full text-sm">
                  {concept}
                </span>
              ))}
            </div>
          </div>

          <button 
            onClick={restart}
            className="mt-6 px-6 py-3 bg-white text-indigo-600 rounded-xl font-semibold hover:bg-indigo-50 transition-colors flex items-center gap-2 mx-auto"
          >
            <RotateCcw className="w-5 h-5" />
            Tekrar Çöz
          </button>
        </div>
      </motion.div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <DifficultyBadge difficulty={solution.difficulty} />
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Clock className="w-4 h-4" />
            {Math.floor(stats.totalTime / 60)}:{(stats.totalTime % 60).toString().padStart(2, '0')}
          </div>
        </div>
        <h2 className="text-lg font-medium text-gray-700 line-clamp-2">{questionText}</h2>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between text-sm text-gray-500 mb-1">
          <span>Adım {currentStepIndex + 1} / {solution.steps.length}</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <motion.div 
            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      {/* Step Navigation Pills */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {solution.steps.map((step, index) => {
          const style = STEP_STYLES[step.type] || STEP_STYLES.explanation
          const isActive = index === currentStepIndex
          const isPast = index < currentStepIndex
          
          return (
            <button
              key={step.id}
              onClick={() => goToStep(index)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                isActive 
                  ? 'bg-indigo-500 text-white shadow-lg' 
                  : isPast 
                    ? 'bg-gray-200 text-gray-600' 
                    : 'bg-gray-100 text-gray-400'
              }`}
            >
              {step.type === 'quiz' ? '❓' : (index + 1)}
            </button>
          )
        })}
      </div>

      {/* Current Step Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep.id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
          className={`rounded-2xl border-2 p-6 ${STEP_STYLES[currentStep.type]?.bg} ${STEP_STYLES[currentStep.type]?.border}`}
        >
          {/* Step Header */}
          <div className="flex items-center gap-2 mb-4">
            <span className="text-2xl">{STEP_STYLES[currentStep.type]?.icon}</span>
            <h3 className="text-xl font-semibold text-gray-800">{currentStep.title}</h3>
          </div>

          {/* Animation Area */}
          {currentStep.animation_template && currentStep.animation_template !== 'none' && (
            <div className="mb-4">
              <AnimationRenderer 
                template={currentStep.animation_template} 
                data={currentStep.animation_data} 
              />
            </div>
          )}

          {/* Content */}
          {currentStep.type === 'quiz' && currentStep.quiz ? (
            <QuizStep
              quiz={currentStep.quiz}
              onAnswer={(optionId, isCorrect) => handleQuizAnswer(currentStep.id, optionId, isCorrect)}
              onHint={() => handleHint(currentStep.id)}
              answered={quizAnswered[currentStep.id] || false}
              selectedAnswer={selectedAnswers[currentStep.id] || null}
              showHint={hintsShown[currentStep.id] || false}
            />
          ) : (
            <div className="prose prose-sm max-w-none">
              <p className="text-gray-700 whitespace-pre-wrap">{currentStep.content}</p>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Controls */}
      <div className="flex items-center justify-between mt-6">
        <div className="flex items-center gap-2">
          <button
            onClick={() => goToStep(currentStepIndex - 1)}
            disabled={currentStepIndex === 0}
            className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <SkipBack className="w-5 h-5" />
          </button>
          
          {currentStep.type !== 'quiz' && (
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="p-3 rounded-xl bg-indigo-500 text-white hover:bg-indigo-600 transition-colors"
            >
              {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
            </button>
          )}
          
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </button>
        </div>

        <div className="flex items-center gap-2">
          {/* Score display */}
          <div className="flex items-center gap-1 px-3 py-1 bg-amber-100 rounded-lg">
            <Star className="w-4 h-4 text-amber-500" />
            <span className="font-medium text-amber-700">{stats.correctAnswers * 100 - stats.wrongAnswers * 25}</span>
          </div>

          {/* Next/Complete button */}
          {currentStep.type === 'quiz' && !quizAnswered[currentStep.id] ? (
            <span className="text-sm text-gray-500">Cevabını seç</span>
          ) : (
            <button
              onClick={() => {
                if (isLastStep) {
                  handleComplete()
                } else {
                  goToStep(currentStepIndex + 1)
                }
              }}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-500 text-white rounded-xl hover:bg-indigo-600 transition-colors"
            >
              {isLastStep ? 'Bitir' : 'Devam'}
              <ChevronRight className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
