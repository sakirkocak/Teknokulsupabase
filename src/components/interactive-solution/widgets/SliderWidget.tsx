'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'

interface Props {
  prompt: string
  min?: number
  max?: number
  step?: number
  correctValue: number
  onSubmit: (value: number, isCorrect: boolean) => void
  disabled?: boolean
}

export default function SliderWidget({ prompt, min = 0, max = 100, step = 1, correctValue, onSubmit, disabled }: Props) {
  const [value, setValue] = useState(Math.round((min + max) / 2))
  const [submitted, setSubmitted] = useState(false)
  const isCorrect = Math.abs(value - correctValue) <= step

  const handleSubmit = () => {
    setSubmitted(true)
    onSubmit(value, isCorrect)
  }

  const percentage = ((value - min) / (max - min)) * 100

  return (
    <div className="space-y-4">
      <p className="text-sm font-medium text-gray-700">{prompt}</p>
      <div className="space-y-2">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={e => setValue(Number(e.target.value))}
          disabled={disabled || submitted}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-500 disabled:opacity-50"
        />
        <div className="flex justify-between text-xs text-gray-400">
          <span>{min}</span>
          <motion.span
            key={value}
            initial={{ scale: 1.3 }}
            animate={{ scale: 1 }}
            className={`text-lg font-bold ${submitted ? (isCorrect ? 'text-green-600' : 'text-red-500') : 'text-indigo-600'}`}
          >
            {value}
          </motion.span>
          <span>{max}</span>
        </div>
        {submitted && !isCorrect && (
          <p className="text-xs text-gray-500">Doğru cevap: <span className="font-bold text-green-600">{correctValue}</span></p>
        )}
      </div>
      {!submitted && !disabled && (
        <button onClick={handleSubmit} className="w-full py-2 bg-indigo-500 text-white rounded-lg font-medium hover:bg-indigo-600 transition-colors text-sm">
          Kontrol Et
        </button>
      )}
    </div>
  )
}
