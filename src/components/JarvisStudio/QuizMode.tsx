'use client'

import { useState, useEffect } from 'react'
import { Zap, CheckCircle, XCircle, SkipForward, Trophy, Target } from 'lucide-react'

interface Question {
  id: string
  question_text: string
  subject: string
  options?: Record<string, string>
  correct_answer?: string
}

interface QuizModeProps {
  questions: Question[]
  onAnswer: (questionId: string, answer: string, isCorrect: boolean) => void
  onComplete: (score: number, total: number) => void
  studentName?: string
}

export default function QuizMode({ questions, onAnswer, onComplete, studentName = 'Öğrenci' }: QuizModeProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [answered, setAnswered] = useState(false)
  const [score, setScore] = useState(0)
  const [showResult, setShowResult] = useState(false)

  const currentQuestion = questions[currentIndex]
  const progress = ((currentIndex) / questions.length) * 100

  const handleSelect = (key: string) => {
    if (answered) return
    setSelectedAnswer(key)
  }

  const handleCheck = () => {
    if (!selectedAnswer || answered) return
    
    const isCorrect = selectedAnswer === currentQuestion.correct_answer
    setAnswered(true)
    
    if (isCorrect) {
      setScore(s => s + 1)
    }
    
    onAnswer(currentQuestion.id, selectedAnswer, isCorrect)
  }

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(i => i + 1)
      setSelectedAnswer(null)
      setAnswered(false)
    } else {
      setShowResult(true)
      onComplete(score, questions.length)
    }
  }

  const handleSkip = () => {
    handleNext()
  }

  if (showResult) {
    const percentage = Math.round((score / questions.length) * 100)
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <div className={`w-24 h-24 rounded-full flex items-center justify-center mb-6 ${
          percentage >= 70 ? 'bg-green-500/20' : percentage >= 50 ? 'bg-yellow-500/20' : 'bg-red-500/20'
        }`}>
          <Trophy className={`w-12 h-12 ${
            percentage >= 70 ? 'text-green-400' : percentage >= 50 ? 'text-yellow-400' : 'text-red-400'
          }`} />
        </div>
        
        <h2 className="text-2xl font-bold text-white mb-2">
          {percentage >= 70 ? 'Harika!' : percentage >= 50 ? 'İyi!' : 'Tekrar Dene'}
        </h2>
        
        <p className="text-gray-400 mb-4">
          {studentName}, {questions.length} sorudan {score} tanesini doğru cevapladın.
        </p>
        
        <div className="text-4xl font-bold text-cyan-400 mb-6">
          %{percentage}
        </div>
        
        <button
          onClick={() => {
            setCurrentIndex(0)
            setScore(0)
            setShowResult(false)
            setSelectedAnswer(null)
            setAnswered(false)
          }}
          className="px-6 py-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-medium transition-colors"
        >
          Tekrar Dene
        </button>
      </div>
    )
  }

  if (!currentQuestion) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">Soru bulunamadı</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Progress */}
      <div className="p-4 border-b border-cyan-500/20">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-gray-400">
            Soru {currentIndex + 1} / {questions.length}
          </span>
          <span className="text-xs text-cyan-400 font-medium">
            <Target className="w-3 h-3 inline mr-1" />
            {score} doğru
          </span>
        </div>
        <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-cyan-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Question */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="mb-4">
          <span className="text-xs px-2 py-1 bg-cyan-500/20 text-cyan-400 rounded-lg">
            {currentQuestion.subject}
          </span>
        </div>
        
        <p className="text-gray-200 mb-6 leading-relaxed">
          {currentQuestion.question_text}
        </p>

        {/* Options */}
        {currentQuestion.options && (
          <div className="space-y-2">
            {Object.entries(currentQuestion.options).map(([key, value]) => {
              const isCorrect = key === currentQuestion.correct_answer
              const isSelected = selectedAnswer === key
              
              let style = 'border-slate-600 hover:border-cyan-500/50'
              if (answered) {
                if (isCorrect) {
                  style = 'border-green-500 bg-green-500/20'
                } else if (isSelected) {
                  style = 'border-red-500 bg-red-500/20'
                } else {
                  style = 'border-slate-600 opacity-50'
                }
              } else if (isSelected) {
                style = 'border-cyan-500 bg-cyan-500/20'
              }

              return (
                <button
                  key={key}
                  onClick={() => handleSelect(key)}
                  disabled={answered}
                  className={`w-full p-3 rounded-xl border text-left transition-all flex items-center gap-3 ${style}`}
                >
                  <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${
                    answered && isCorrect ? 'bg-green-500 text-white' :
                    answered && isSelected ? 'bg-red-500 text-white' :
                    isSelected ? 'bg-cyan-500 text-white' :
                    'bg-slate-700 text-gray-400'
                  }`}>
                    {key}
                  </span>
                  <span className="text-gray-300 text-sm flex-1">{value}</span>
                  {answered && isCorrect && <CheckCircle className="w-5 h-5 text-green-400" />}
                  {answered && isSelected && !isCorrect && <XCircle className="w-5 h-5 text-red-400" />}
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="p-4 border-t border-cyan-500/20 flex gap-2">
        {!answered ? (
          <>
            <button
              onClick={handleSkip}
              className="px-4 py-3 bg-slate-700 hover:bg-slate-600 text-gray-300 rounded-xl text-sm transition-colors flex items-center gap-2"
            >
              <SkipForward className="w-4 h-4" />
              Atla
            </button>
            <button
              onClick={handleCheck}
              disabled={!selectedAnswer}
              className="flex-1 py-3 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-medium transition-colors"
            >
              Kontrol Et
            </button>
          </>
        ) : (
          <button
            onClick={handleNext}
            className="flex-1 py-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
          >
            {currentIndex < questions.length - 1 ? 'Sonraki Soru' : 'Sonuçları Gör'}
            <SkipForward className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  )
}
