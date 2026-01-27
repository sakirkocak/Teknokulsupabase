'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface Props {
  prompt: string
  items: string[]
  categories: string[]
  correctMapping: Record<string, string> // item -> category
  onSubmit: (mapping: Record<string, string>, isCorrect: boolean) => void
  disabled?: boolean
}

export default function CategorySortWidget({ prompt, items, categories, correctMapping, onSubmit, disabled }: Props) {
  const [assignments, setAssignments] = useState<Record<string, string>>({}) // item -> category
  const [selectedItem, setSelectedItem] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)

  const unassigned = items.filter(item => !assignments[item])
  const allAssigned = Object.keys(assignments).length === items.length

  const isCorrect = items.every(item => assignments[item] === correctMapping[item])

  const handleItemClick = (item: string) => {
    if (submitted || disabled) return
    // If already assigned, unassign
    if (assignments[item]) {
      setAssignments(prev => {
        const next = { ...prev }
        delete next[item]
        return next
      })
      return
    }
    setSelectedItem(selectedItem === item ? null : item)
  }

  const handleCategoryClick = (category: string) => {
    if (submitted || disabled || !selectedItem) return
    setAssignments(prev => ({ ...prev, [selectedItem]: category }))
    setSelectedItem(null)
  }

  const handleSubmit = () => {
    setSubmitted(true)
    onSubmit(assignments, isCorrect)
  }

  const getCategoryColor = (idx: number) => {
    const colors = [
      { bg: 'bg-blue-50', border: 'border-blue-300', header: 'bg-blue-500', text: 'text-blue-700', ring: 'ring-blue-200' },
      { bg: 'bg-emerald-50', border: 'border-emerald-300', header: 'bg-emerald-500', text: 'text-emerald-700', ring: 'ring-emerald-200' },
      { bg: 'bg-amber-50', border: 'border-amber-300', header: 'bg-amber-500', text: 'text-amber-700', ring: 'ring-amber-200' },
      { bg: 'bg-purple-50', border: 'border-purple-300', header: 'bg-purple-500', text: 'text-purple-700', ring: 'ring-purple-200' },
      { bg: 'bg-rose-50', border: 'border-rose-300', header: 'bg-rose-500', text: 'text-rose-700', ring: 'ring-rose-200' },
    ]
    return colors[idx % colors.length]
  }

  return (
    <div className="space-y-4">
      <p className="text-sm font-medium text-gray-700">{prompt}</p>

      {/* Unassigned items */}
      {unassigned.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Sınıflandırılacaklar</p>
          <div className="flex flex-wrap gap-2">
            {unassigned.map(item => (
              <motion.button
                key={item}
                layout
                onClick={() => handleItemClick(item)}
                disabled={submitted || disabled}
                className={`px-4 py-2 rounded-lg text-sm font-medium border-2 transition-all ${
                  selectedItem === item
                    ? 'border-indigo-500 bg-indigo-50 text-indigo-700 ring-2 ring-indigo-200 scale-105'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-indigo-300 hover:bg-indigo-50'
                }`}
              >
                {item}
              </motion.button>
            ))}
          </div>
          {selectedItem && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs text-indigo-500 font-medium">
              &quot;{selectedItem}&quot; için bir kategori seç:
            </motion.p>
          )}
        </div>
      )}

      {/* Categories */}
      <div className={`grid gap-3 ${categories.length <= 2 ? 'grid-cols-2' : categories.length <= 3 ? 'grid-cols-3' : 'grid-cols-2'}`}>
        {categories.map((cat, idx) => {
          const color = getCategoryColor(idx)
          const catItems = items.filter(item => assignments[item] === cat)
          const isTarget = !!selectedItem
          return (
            <motion.div
              key={cat}
              onClick={() => handleCategoryClick(cat)}
              className={`rounded-xl border-2 overflow-hidden transition-all ${
                submitted ? color.border : isTarget ? `${color.border} cursor-pointer ring-2 ${color.ring} hover:scale-[1.02]` : color.border
              }`}
            >
              <div className={`${color.header} px-3 py-2`}>
                <p className="text-white text-sm font-bold text-center">{cat}</p>
              </div>
              <div className={`${color.bg} p-2 min-h-[60px]`}>
                <AnimatePresence>
                  {catItems.length === 0 && !submitted && (
                    <p className="text-xs text-gray-400 text-center py-2">
                      {isTarget ? 'Buraya yerleştir' : 'Boş'}
                    </p>
                  )}
                  {catItems.map(item => {
                    const itemCorrect = submitted && correctMapping[item] === cat
                    const itemWrong = submitted && correctMapping[item] !== cat
                    return (
                      <motion.div
                        key={item}
                        layout
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        onClick={(e) => { e.stopPropagation(); handleItemClick(item) }}
                        className={`px-3 py-1.5 mb-1 rounded-lg text-xs font-medium border transition-all ${
                          submitted
                            ? itemCorrect ? 'bg-green-100 border-green-400 text-green-700' : 'bg-red-100 border-red-400 text-red-700'
                            : `bg-white ${color.border} ${color.text} cursor-pointer hover:opacity-70`
                        }`}
                      >
                        {item} {submitted && itemWrong && '✗'} {submitted && itemCorrect && '✓'}
                      </motion.div>
                    )
                  })}
                </AnimatePresence>
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Correct answers after submit */}
      {submitted && !isCorrect && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs text-gray-500 space-y-1">
          <p className="font-medium">Doğru yerleşim:</p>
          {categories.map(cat => {
            const correctItems = items.filter(item => correctMapping[item] === cat)
            return correctItems.length > 0 ? (
              <p key={cat}><span className="font-medium">{cat}:</span> {correctItems.join(', ')}</p>
            ) : null
          })}
        </motion.div>
      )}

      {!submitted && !disabled && allAssigned && (
        <button onClick={handleSubmit} className="w-full py-2 bg-indigo-500 text-white rounded-lg font-medium hover:bg-indigo-600 transition-colors text-sm">
          Kontrol Et
        </button>
      )}
    </div>
  )
}
