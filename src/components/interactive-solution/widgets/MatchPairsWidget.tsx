'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'

interface Pair {
  left: string
  right: string
}

interface Props {
  prompt: string
  pairs: Pair[]
  onSubmit: (matches: Record<string, string>, isCorrect: boolean) => void
  disabled?: boolean
}

export default function MatchPairsWidget({ prompt, pairs, onSubmit, disabled }: Props) {
  const [selectedLeft, setSelectedLeft] = useState<string | null>(null)
  const [matches, setMatches] = useState<Record<string, string>>({})
  const [submitted, setSubmitted] = useState(false)

  const [rightItems] = useState(() => [...pairs.map(p => p.right)].sort(() => Math.random() - 0.5))
  const leftItems = pairs.map(p => p.left)

  const handleLeftClick = (item: string) => {
    if (submitted || disabled) return
    // If already matched, unmatch it
    if (matches[item]) {
      setMatches(prev => {
        const next = { ...prev }
        delete next[item]
        return next
      })
      return
    }
    setSelectedLeft(selectedLeft === item ? null : item)
  }

  const handleRightClick = (item: string) => {
    if (submitted || disabled) return
    // If this right item is already matched, unmatch it
    const matchedBy = getLeftForRight(item)
    if (matchedBy) {
      setMatches(prev => {
        const next = { ...prev }
        delete next[matchedBy]
        return next
      })
      return
    }
    if (!selectedLeft) return
    setMatches(prev => ({ ...prev, [selectedLeft]: item }))
    setSelectedLeft(null)
  }

  const isCorrect = pairs.every(p => matches[p.left] === p.right)
  const allMatched = Object.keys(matches).length === pairs.length

  const handleSubmit = () => {
    setSubmitted(true)
    onSubmit(matches, isCorrect)
  }

  const getMatchColor = (left: string): string => {
    const colors = ['bg-blue-100 border-blue-400', 'bg-purple-100 border-purple-400', 'bg-amber-100 border-amber-400', 'bg-teal-100 border-teal-400', 'bg-pink-100 border-pink-400']
    const idx = leftItems.indexOf(left)
    return colors[idx % colors.length]
  }

  const getLeftForRight = (right: string): string | undefined => {
    return Object.entries(matches).find(([_, v]) => v === right)?.[0]
  }

  return (
    <div className="space-y-4">
      <p className="text-sm font-medium text-gray-700">{prompt}</p>
      {selectedLeft && (
        <p className="text-xs text-indigo-500 font-medium">
          &quot;{selectedLeft}&quot; için sağ taraftan bir eşleşme seç
        </p>
      )}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          {leftItems.map(item => {
            const matched = !!matches[item]
            const isSelected = selectedLeft === item
            const correctMatch = submitted && pairs.find(p => p.left === item)?.right === matches[item]
            return (
              <button key={item} onClick={() => handleLeftClick(item)} disabled={submitted || disabled}
                className={`w-full p-3 border-2 rounded-xl text-sm text-left transition-all ${
                  submitted ? (correctMatch ? 'border-green-400 bg-green-50' : 'border-red-400 bg-red-50')
                  : matched ? `${getMatchColor(item)} cursor-pointer hover:opacity-70`
                  : isSelected ? 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-200'
                  : 'border-gray-200 bg-white hover:border-indigo-300'
                }`}
              >
                {item}
                {matched && !submitted && <span className="text-xs ml-1 opacity-50">(tıkla: kaldır)</span>}
              </button>
            )
          })}
        </div>
        <div className="space-y-2">
          {rightItems.map(item => {
            const matchedBy = getLeftForRight(item)
            const correctMatch = submitted && pairs.find(p => p.right === item)?.left === matchedBy
            return (
              <button key={item} onClick={() => handleRightClick(item)} disabled={submitted || disabled}
                className={`w-full p-3 border-2 rounded-xl text-sm text-left transition-all ${
                  submitted ? (correctMatch ? 'border-green-400 bg-green-50' : 'border-red-400 bg-red-50')
                  : matchedBy ? `${getMatchColor(matchedBy)} cursor-pointer hover:opacity-70`
                  : 'border-gray-200 bg-white hover:border-indigo-300'
                }`}
              >
                {item}
                {matchedBy && !submitted && <span className="text-xs ml-1 opacity-50">(tıkla: kaldır)</span>}
              </button>
            )
          })}
        </div>
      </div>
      {submitted && !isCorrect && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs text-gray-500">
          Doğru eşleşmeler: {pairs.map(p => `${p.left} → ${p.right}`).join(' | ')}
        </motion.div>
      )}
      {!submitted && !disabled && allMatched && (
        <button onClick={handleSubmit} className="w-full py-2 bg-indigo-500 text-white rounded-lg font-medium hover:bg-indigo-600 transition-colors text-sm">
          Kontrol Et
        </button>
      )}
    </div>
  )
}
