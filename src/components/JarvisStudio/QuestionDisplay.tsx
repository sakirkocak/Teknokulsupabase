'use client'

import { useState } from 'react'
import { ArrowLeft, Image, CheckCircle, XCircle, HelpCircle } from 'lucide-react'
import MathRenderer from '@/components/MathRenderer'

interface Question {
  id: string
  question_text: string
  subject: string
  topic?: string
  difficulty?: string
  options?: Record<string, string>
  correct_answer?: string
  image_url?: string
  explanation?: string
}

interface QuestionDisplayProps {
  question: Question
  onBack: () => void
  onAnswer?: (answer: string, isCorrect: boolean) => void
  showAnswer?: boolean
}

export default function QuestionDisplay({ question, onBack, onAnswer, showAnswer = false }: QuestionDisplayProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [revealed, setRevealed] = useState(showAnswer)

  const handleSelect = (key: string) => {
    if (revealed) return
    setSelectedAnswer(key)
  }

  const handleCheck = () => {
    if (!selectedAnswer) return
    setRevealed(true)
    const isCorrect = selectedAnswer === question.correct_answer
    onAnswer?.(selectedAnswer, isCorrect)
  }

  const getOptionStyle = (key: string) => {
    if (!revealed) {
      return selectedAnswer === key
        ? 'border-cyan-500 bg-cyan-500/20'
        : 'border-slate-600 hover:border-cyan-500/50'
    }
    
    if (key === question.correct_answer) {
      return 'border-green-500 bg-green-500/20'
    }
    
    if (selectedAnswer === key && key !== question.correct_answer) {
      return 'border-red-500 bg-red-500/20'
    }
    
    return 'border-slate-600 opacity-50'
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-cyan-500/20">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 text-sm mb-3"
        >
          <ArrowLeft className="w-4 h-4" />
          Aramaya dön
        </button>
        
        <div className="flex items-center gap-2">
          <span className="px-2 py-1 bg-cyan-500/20 text-cyan-400 rounded-lg text-xs">
            {question.subject}
          </span>
          {question.topic && (
            <span className="text-gray-500 text-xs">{question.topic}</span>
          )}
        </div>
      </div>

      {/* Question Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Question Text */}
        <div className="mb-4">
          <div className="text-gray-200 leading-relaxed">
            <MathRenderer text={question.question_text} />
          </div>
        </div>

        {/* Image */}
        {question.image_url && (
          <div className="mb-4">
            <img
              src={question.image_url}
              alt="Soru görseli"
              className="w-full rounded-xl border border-cyan-500/20"
            />
          </div>
        )}

        {/* Options */}
        {question.options && (
          <div className="space-y-2 mb-4">
            {Object.entries(question.options).map(([key, value]) => (
              <button
                key={key}
                onClick={() => handleSelect(key)}
                disabled={revealed}
                className={`w-full p-3 rounded-xl border text-left transition-all flex items-center gap-3 ${getOptionStyle(key)}`}
              >
                <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${
                  revealed && key === question.correct_answer
                    ? 'bg-green-500 text-white'
                    : revealed && selectedAnswer === key
                    ? 'bg-red-500 text-white'
                    : selectedAnswer === key
                    ? 'bg-cyan-500 text-white'
                    : 'bg-slate-700 text-gray-400'
                }`}>
                  {key}
                </span>
                <span className="text-gray-300 text-sm flex-1"><MathRenderer text={value} /></span>
                {revealed && key === question.correct_answer && (
                  <CheckCircle className="w-5 h-5 text-green-400" />
                )}
                {revealed && selectedAnswer === key && key !== question.correct_answer && (
                  <XCircle className="w-5 h-5 text-red-400" />
                )}
              </button>
            ))}
          </div>
        )}

        {/* Check Button */}
        {!revealed && selectedAnswer && (
          <button
            onClick={handleCheck}
            className="w-full py-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-medium transition-colors"
          >
            Cevabı Kontrol Et
          </button>
        )}

        {/* Explanation */}
        {revealed && question.explanation && (
          <div className="mt-4 p-4 bg-slate-800/50 rounded-xl border border-cyan-500/20">
            <div className="flex items-center gap-2 mb-2">
              <HelpCircle className="w-4 h-4 text-cyan-400" />
              <span className="text-cyan-400 text-sm font-medium">Açıklama</span>
            </div>
            <div className="text-gray-300 text-sm"><MathRenderer text={question.explanation} /></div>
          </div>
        )}
      </div>
    </div>
  )
}
