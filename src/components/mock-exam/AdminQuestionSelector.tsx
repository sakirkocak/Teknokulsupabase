'use client'

import { useState, useCallback } from 'react'
import { Search, Plus, X, Check, BookOpen } from 'lucide-react'
import { SUBJECT_COLORS, SUBJECT_DISPLAY_NAMES } from '@/lib/mock-exam/constants'
// @ts-ignore
import debounce from 'lodash/debounce'

interface SelectedQuestion {
  id: string
  question_text: string
  subject_code: string
  difficulty: string
  main_topic: string
}

interface AdminQuestionSelectorProps {
  grade: number
  subject: string
  maxQuestions: number
  selectedQuestions: SelectedQuestion[]
  onQuestionsChange: (questions: SelectedQuestion[]) => void
}

export default function AdminQuestionSelector({
  grade,
  subject,
  maxQuestions,
  selectedQuestions,
  onQuestionsChange,
}: AdminQuestionSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [searching, setSearching] = useState(false)

  const selectedIds = new Set(selectedQuestions.map(q => q.id))

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedSearch = useCallback(
    debounce(async (query: string) => {
      if (!query && !grade) return
      setSearching(true)

      try {
        const params = new URLSearchParams({
          q: query || '*',
          filter_by: [
            `grade:=${grade}`,
            subject ? `subject_code:=${subject}` : '',
          ].filter(Boolean).join(' && '),
          per_page: '20',
          sort_by: 'created_at:desc',
        })

        // Typesense browser client
        const host = process.env.NEXT_PUBLIC_TYPESENSE_HOST || ''
        const key = process.env.NEXT_PUBLIC_TYPESENSE_SEARCH_KEY || ''

        if (!host || !key) {
          setSearching(false)
          return
        }

        const res = await fetch(
          `https://${host}/collections/questions/documents/search?${params.toString()}`,
          { headers: { 'X-TYPESENSE-API-KEY': key } }
        )

        if (!res.ok) return

        const data = await res.json()
        setSearchResults((data.hits || []).map((h: any) => h.document))
      } catch (e) {
        console.error('Search error:', e)
      } finally {
        setSearching(false)
      }
    }, 300),
    [grade, subject]
  )

  function handleSearch(query: string) {
    setSearchQuery(query)
    debouncedSearch(query)
  }

  function addQuestion(q: any) {
    if (selectedQuestions.length >= maxQuestions) return
    if (selectedIds.has(q.question_id || q.id)) return

    onQuestionsChange([
      ...selectedQuestions,
      {
        id: q.question_id || q.id,
        question_text: q.question_text,
        subject_code: q.subject_code,
        difficulty: q.difficulty,
        main_topic: q.main_topic || '',
      },
    ])
  }

  function removeQuestion(id: string) {
    onQuestionsChange(selectedQuestions.filter(q => q.id !== id))
  }

  return (
    <div className="space-y-4">
      {/* Baslik */}
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-surface-700">
          {SUBJECT_DISPLAY_NAMES[subject] || subject} Sorulari
        </h4>
        <span className="text-xs text-surface-400">
          {selectedQuestions.length}/{maxQuestions} secildi
        </span>
      </div>

      {/* Arama */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          onFocus={() => { if (!searchResults.length) debouncedSearch('') }}
          placeholder="Soru ara..."
          className="w-full pl-10 pr-4 py-2.5 text-sm border border-surface-200 rounded-xl focus:ring-2 focus:ring-primary-200 focus:border-primary-300 outline-none"
        />
      </div>

      {/* Arama sonuclari */}
      {searchResults.length > 0 && (
        <div className="max-h-60 overflow-y-auto border border-surface-100 rounded-xl divide-y divide-surface-50">
          {searchResults.map((q: any) => {
            const qId = q.question_id || q.id
            const isSelected = selectedIds.has(qId)

            return (
              <div
                key={qId}
                className="flex items-center gap-3 px-3 py-2.5 hover:bg-surface-50 cursor-pointer"
                onClick={() => !isSelected && addQuestion(q)}
              >
                <div className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  isSelected ? 'bg-green-100 text-green-600' : 'bg-surface-100 text-surface-400'
                }`}>
                  {isSelected ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-surface-700 line-clamp-2">{q.question_text}</p>
                  <div className="flex gap-2 mt-1">
                    <span className="text-[10px] px-1.5 py-0.5 bg-surface-100 rounded text-surface-500">
                      {q.difficulty}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 bg-surface-100 rounded text-surface-500 truncate">
                      {q.main_topic}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {searching && (
        <div className="text-center py-4 text-sm text-surface-400">Araniyor...</div>
      )}

      {/* Secilmis sorular */}
      {selectedQuestions.length > 0 && (
        <div className="space-y-1.5">
          <div className="text-xs text-surface-400 font-medium">Secilmis Sorular</div>
          {selectedQuestions.map((q, idx) => (
            <div
              key={q.id}
              className="flex items-center gap-2 px-3 py-2 bg-primary-50 rounded-xl text-xs"
            >
              <span className="text-primary-600 font-bold w-5">{idx + 1}.</span>
              <span className="flex-1 text-primary-700 truncate">{q.question_text}</span>
              <button
                onClick={() => removeQuestion(q.id)}
                className="text-primary-400 hover:text-red-500 flex-shrink-0"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
