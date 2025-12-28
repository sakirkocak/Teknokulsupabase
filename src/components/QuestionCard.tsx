'use client'

import MathRenderer from './MathRenderer'

interface QuestionCardProps {
  questionText: string
  options?: { A: string; B: string; C: string; D: string; E?: string } | null
  className?: string
}

// Soru metni için LaTeX destekli renderer
export function QuestionText({ text, className = '' }: { text: string; className?: string }) {
  return (
    <div className={className}>
      <MathRenderer text={text} />
    </div>
  )
}

// Şık değeri için LaTeX destekli renderer
export function OptionText({ text, className = '' }: { text: string; className?: string }) {
  return (
    <span className={className}>
      <MathRenderer text={text} />
    </span>
  )
}

// Tam soru kartı (metin + şıklar)
export default function QuestionCard({ questionText, options, className = '' }: QuestionCardProps) {
  return (
    <div className={className}>
      <div className="text-gray-800 mb-4">
        <MathRenderer text={questionText} />
      </div>
      
      {options && Object.keys(options).length > 0 && (
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
      )}
    </div>
  )
}
