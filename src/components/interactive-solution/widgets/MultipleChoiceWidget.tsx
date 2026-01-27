'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Check, X } from 'lucide-react'
import MathRenderer from '@/components/MathRenderer'

interface Option {
  id: string
  text: string
  is_correct: boolean
}

interface Props {
  prompt: string
  options: Option[]
  onSubmit: (optionId: string, isCorrect: boolean) => void
  disabled?: boolean
}

export default function MultipleChoiceWidget({ prompt, options, onSubmit, disabled }: Props) {
  const [selected, setSelected] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)

  const handleSelect = (opt: Option) => {
    if (submitted || disabled) return
    setSelected(opt.id)
    setSubmitted(true)
    onSubmit(opt.id, opt.is_correct)
  }

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-gray-700">{prompt}</p>
      <div className="grid gap-2">
        {options.map(opt => {
          const isSelected = selected === opt.id
          let style = 'bg-white border-gray-200 hover:border-indigo-300 hover:bg-indigo-50'
          if (submitted) {
            if (opt.is_correct) style = 'bg-green-50 border-green-400'
            else if (isSelected) style = 'bg-red-50 border-red-400'
            else style = 'bg-gray-50 border-gray-200 opacity-60'
          }
          return (
            <motion.button
              key={opt.id}
              whileTap={!submitted ? { scale: 0.98 } : {}}
              onClick={() => handleSelect(opt)}
              disabled={submitted || disabled}
              className={`p-3 border-2 rounded-xl text-left text-sm transition-all ${style}`}
            >
              <div className="flex items-center justify-between">
                <MathRenderer text={opt.text} />
                {submitted && isSelected && (opt.is_correct ? <Check className="w-5 h-5 text-green-500" /> : <X className="w-5 h-5 text-red-500" />)}
                {submitted && opt.is_correct && !isSelected && <Check className="w-5 h-5 text-green-500" />}
              </div>
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}
