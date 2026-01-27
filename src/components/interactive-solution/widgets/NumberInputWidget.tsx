'use client'

import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'

interface Props {
  prompt: string
  correctValue: number | string
  tolerance?: number
  onSubmit: (value: string, isCorrect: boolean) => void
  disabled?: boolean
}

export default function NumberInputWidget({ prompt, correctValue, tolerance = 0, onSubmit, disabled }: Props) {
  const [value, setValue] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { inputRef.current?.focus() }, [])

  const checkCorrect = (v: string): boolean => {
    const num = parseFloat(v.replace(',', '.'))
    const correct = typeof correctValue === 'string' ? parseFloat(correctValue.replace(',', '.')) : correctValue
    if (isNaN(num) || isNaN(correct)) return v.trim().toLowerCase() === String(correctValue).trim().toLowerCase()
    return Math.abs(num - correct) <= tolerance
  }

  const isCorrect = checkCorrect(value)

  const handleSubmit = () => {
    if (!value.trim()) return
    setSubmitted(true)
    onSubmit(value, isCorrect)
  }

  return (
    <div className="space-y-4">
      <p className="text-sm font-medium text-gray-700">{prompt}</p>
      <div className="flex items-center gap-3">
        <input
          ref={inputRef}
          type="text"
          inputMode="decimal"
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !submitted && handleSubmit()}
          disabled={disabled || submitted}
          placeholder="Cevabını yaz..."
          className={`flex-1 px-4 py-3 text-lg font-mono border-2 rounded-xl outline-none transition-colors ${
            submitted ? (isCorrect ? 'border-green-400 bg-green-50' : 'border-red-400 bg-red-50') : 'border-gray-200 focus:border-indigo-400'
          } disabled:opacity-50`}
        />
        {!submitted && !disabled && (
          <button onClick={handleSubmit} disabled={!value.trim()} className="px-5 py-3 bg-indigo-500 text-white rounded-xl font-medium hover:bg-indigo-600 disabled:opacity-50 transition-colors text-sm">
            ✓
          </button>
        )}
      </div>
      {submitted && !isCorrect && (
        <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="text-sm text-gray-600">
          Doğru cevap: <span className="font-bold text-green-600">{correctValue}</span>
        </motion.p>
      )}
    </div>
  )
}
