'use client'

import Link from 'next/link'
import { ChevronRight, Star, CheckCircle, Zap, Crown, LucideIcon } from 'lucide-react'
import MathRenderer from './MathRenderer'

interface Question {
  id: string
  question_text: string
  options: { A: string; B: string; C: string; D: string; E?: string }
  difficulty: string
}

interface QuestionPreviewListProps {
  questions: Question[]
  subject: string
  grade: number
}

const difficultyConfig: Record<string, { label: string; color: string; icon: LucideIcon }> = {
  easy: { label: 'Kolay', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  medium: { label: 'Orta', color: 'bg-yellow-100 text-yellow-700', icon: Star },
  hard: { label: 'Zor', color: 'bg-orange-100 text-orange-700', icon: Zap },
  legendary: { label: 'Efsane', color: 'bg-purple-100 text-purple-700', icon: Crown },
}

export default function QuestionPreviewList({ questions, subject, grade }: QuestionPreviewListProps) {
  return (
    <div className="space-y-4">
      {questions.slice(0, 5).map((question, index) => {
        const difficulty = difficultyConfig[question.difficulty]
        const DiffIcon = difficulty?.icon || Star
        const options = question.options
        
        return (
          <Link
            key={question.id}
            href={`/sorular/${subject}/${grade}-sinif/${question.id}`}
            className="block p-6 bg-white rounded-xl border border-gray-200 hover:shadow-md hover:border-indigo-200 transition-all group"
          >
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-500">Soru {index + 1}</span>
                {difficulty && (
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${difficulty.color}`}>
                    <DiffIcon className="w-3 h-3" />
                    {difficulty.label}
                  </span>
                )}
              </div>
              <span className="text-sm text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                Detaylı Gör
                <ChevronRight className="w-4 h-4" />
              </span>
            </div>
            
            <div className="text-gray-800 mb-4 line-clamp-3 group-hover:text-gray-900 transition-colors">
              <MathRenderer text={question.question_text} />
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {Object.entries(options).filter(([_, v]) => v).map(([key, value]) => (
                <div
                  key={key}
                  className="flex items-center gap-2 p-2 rounded-lg bg-gray-50 text-sm"
                >
                  <span className="w-6 h-6 flex items-center justify-center bg-gray-200 rounded-full text-xs font-medium">
                    {key}
                  </span>
                  <span className="text-gray-700 line-clamp-1">
                    <MathRenderer text={value} />
                  </span>
                </div>
              ))}
            </div>
          </Link>
        )
      })}
    </div>
  )
}
