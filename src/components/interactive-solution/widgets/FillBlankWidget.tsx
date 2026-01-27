'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import MathRenderer from '@/components/MathRenderer'

interface Props {
  prompt: string
  template: string // "___  x ___ = 360" - ___ are blanks
  correctValues: string[]
  onSubmit: (values: string[], isCorrect: boolean) => void
  disabled?: boolean
}

export default function FillBlankWidget({ prompt, template, correctValues, onSubmit, disabled }: Props) {
  const parts = template.split('___')
  const blankCount = parts.length - 1
  const [values, setValues] = useState<string[]>(Array(blankCount).fill(''))
  const [submitted, setSubmitted] = useState(false)

  const checkCorrect = (): boolean => {
    return values.every((v, i) => {
      const cv = correctValues[i]
      if (!cv) return false
      const numV = parseFloat(v.replace(',', '.'))
      const numC = parseFloat(cv.replace(',', '.'))
      if (!isNaN(numV) && !isNaN(numC)) return Math.abs(numV - numC) < 0.01
      return v.trim().toLowerCase() === cv.trim().toLowerCase()
    })
  }

  const isCorrect = checkCorrect()

  const handleSubmit = () => {
    if (values.some(v => !v.trim())) return
    setSubmitted(true)
    onSubmit(values, isCorrect)
  }

  return (
    <div className="space-y-4">
      <p className="text-sm font-medium text-gray-700">{prompt}</p>
      <div className="flex flex-wrap items-center gap-1 text-lg font-mono bg-gray-50 p-4 rounded-xl">
        {parts.map((part, i) => (
          <span key={i} className="flex items-center gap-1">
            <MathRenderer text={part} />
            {i < blankCount && (
              <input
                type="text"
                inputMode="decimal"
                value={values[i]}
                onChange={e => { const nv = [...values]; nv[i] = e.target.value; setValues(nv) }}
                onKeyDown={e => e.key === 'Enter' && !submitted && handleSubmit()}
                disabled={disabled || submitted}
                className={`w-16 px-2 py-1 text-center border-2 border-dashed rounded-lg outline-none transition-colors ${
                  submitted ? (isCorrect ? 'border-green-400 bg-green-50' : 'border-red-400 bg-red-50') : 'border-indigo-300 focus:border-indigo-500 bg-white'
                }`}
                placeholder="?"
              />
            )}
          </span>
        ))}
      </div>
      {submitted && !isCorrect && (
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm text-gray-600">
          Doğru: {correctValues.join(', ')}
        </motion.p>
      )}
      {!submitted && !disabled && (
        <button onClick={handleSubmit} disabled={values.some(v => !v.trim())} className="w-full py-2 bg-indigo-500 text-white rounded-lg font-medium hover:bg-indigo-600 disabled:opacity-50 transition-colors text-sm">
          Kontrol Et
        </button>
      )}
    </div>
  )
}
