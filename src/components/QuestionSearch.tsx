'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Search, BookOpen, X, Loader2, Filter } from 'lucide-react'
import { searchQuestions, SearchResult } from '@/lib/search'
import Link from 'next/link'

interface Props {
  grade?: number
  subjectCode?: string
  onSelectQuestion?: (questionId: string) => void
  placeholder?: string
  className?: string
  showFilters?: boolean
}

const difficultyLabels: Record<string, { label: string; color: string }> = {
  easy: { label: 'Kolay', color: 'bg-green-100 text-green-700' },
  medium: { label: 'Orta', color: 'bg-yellow-100 text-yellow-700' },
  hard: { label: 'Zor', color: 'bg-orange-100 text-orange-700' },
  legendary: { label: 'Efsanevi', color: 'bg-purple-100 text-purple-700' }
}

export default function QuestionSearch({ 
  grade, 
  subjectCode, 
  onSelectQuestion,
  placeholder = "Soru ara... (örn: 'türev', 'üçgen', 'hücre')",
  className = '',
  showFilters = false
}: Props) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [selectedGrade, setSelectedGrade] = useState<number | undefined>(grade)
  const [selectedDifficulty, setSelectedDifficulty] = useState<string | undefined>()
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  
  // Debounce için timeout ref
  const timeoutRef = useRef<NodeJS.Timeout>()
  
  // Arama fonksiyonu
  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery || searchQuery.length < 2) {
      setResults([])
      setLoading(false)
      return
    }
    
    setLoading(true)
    
    try {
      const data = await searchQuestions({
        query: searchQuery,
        grade: selectedGrade,
        subjectCode,
        difficulty: selectedDifficulty,
        limit: 10
      })
      
      setResults(data)
    } catch (error) {
      console.error('Search error:', error)
      setResults([])
    }
    
    setLoading(false)
  }, [selectedGrade, subjectCode, selectedDifficulty])
  
  // Debounced search
  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    
    if (query.length >= 2) {
      setLoading(true)
      timeoutRef.current = setTimeout(() => {
        performSearch(query)
      }, 300)
    } else {
      setResults([])
      setLoading(false)
    }
    
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [query, performSearch])
  
  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])
  
  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false)
      inputRef.current?.blur()
    }
  }
  
  const handleSelectQuestion = (questionId: string) => {
    if (onSelectQuestion) {
      onSelectQuestion(questionId)
    }
    setIsOpen(false)
    setQuery('')
  }
  
  const clearSearch = () => {
    setQuery('')
    setResults([])
    inputRef.current?.focus()
  }
  
  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Arama Kutusu */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setIsOpen(true)
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full pl-12 pr-12 py-3 rounded-xl border border-gray-200 bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all text-gray-900 placeholder-gray-400"
        />
        
        {/* Loading / Clear button */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
          {loading && (
            <Loader2 className="h-5 w-5 text-indigo-500 animate-spin" />
          )}
          {query && !loading && (
            <button
              onClick={clearSearch}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="h-4 w-4 text-gray-400" />
            </button>
          )}
        </div>
      </div>
      
      {/* Filtreler */}
      {showFilters && (
        <div className="flex gap-2 mt-2">
          <select
            value={selectedGrade || ''}
            onChange={(e) => setSelectedGrade(e.target.value ? Number(e.target.value) : undefined)}
            className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200"
          >
            <option value="">Tüm Sınıflar</option>
            {[5, 6, 7, 8, 9, 10, 11, 12].map(g => (
              <option key={g} value={g}>{g}. Sınıf</option>
            ))}
          </select>
          
          <select
            value={selectedDifficulty || ''}
            onChange={(e) => setSelectedDifficulty(e.target.value || undefined)}
            className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200"
          >
            <option value="">Tüm Zorluklar</option>
            {Object.entries(difficultyLabels).map(([key, { label }]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>
      )}
      
      {/* Sonuçlar Dropdown */}
      {isOpen && (query.length >= 2 || results.length > 0) && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-gray-100 max-h-96 overflow-y-auto z-50">
          {results.length > 0 ? (
            <>
              <div className="px-4 py-2 border-b border-gray-100 bg-gray-50 rounded-t-xl">
                <span className="text-sm text-gray-500">
                  {results.length} sonuç bulundu
                </span>
              </div>
              
              {results.map((result) => {
                const difficultyInfo = difficultyLabels[result.difficulty] || difficultyLabels.medium
                
                return onSelectQuestion ? (
                  <button
                    key={result.question_id}
                    onClick={() => handleSelectQuestion(result.question_id)}
                    className="w-full p-4 text-left hover:bg-gray-50 border-b border-gray-100 last:border-0 transition-colors"
                  >
                    <QuestionResultItem result={result} difficultyInfo={difficultyInfo} />
                  </button>
                ) : (
                  <Link
                    key={result.question_id}
                    href={`/sorular/${result.subject_code}/${result.grade}-sinif/${result.question_id}`}
                    onClick={() => setIsOpen(false)}
                    className="block p-4 hover:bg-gray-50 border-b border-gray-100 last:border-0 transition-colors"
                  >
                    <QuestionResultItem result={result} difficultyInfo={difficultyInfo} />
                  </Link>
                )
              })}
            </>
          ) : loading ? (
            <div className="p-6 text-center">
              <Loader2 className="h-6 w-6 text-indigo-500 animate-spin mx-auto mb-2" />
              <p className="text-gray-500 text-sm">Aranıyor...</p>
            </div>
          ) : query.length >= 2 ? (
            <div className="p-6 text-center">
              <Filter className="h-8 w-8 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500">Sonuç bulunamadı</p>
              <p className="text-gray-400 text-sm mt-1">
                Farklı kelimeler deneyin
              </p>
            </div>
          ) : null}
        </div>
      )}
    </div>
  )
}

// Sonuç öğesi komponenti
function QuestionResultItem({ 
  result, 
  difficultyInfo 
}: { 
  result: SearchResult
  difficultyInfo: { label: string; color: string }
}) {
  // Highlight varsa kullan, yoksa normal text
  const displayText = result.highlight || result.question_text
  
  return (
    <div className="flex items-start gap-3">
      <BookOpen className="h-5 w-5 text-indigo-500 mt-1 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p 
          className="text-gray-800 line-clamp-2 text-sm"
          dangerouslySetInnerHTML={{ __html: displayText }}
        />
        <div className="flex items-center flex-wrap gap-2 mt-2">
          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
            {result.subject_name}
          </span>
          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
            {result.grade}. Sınıf
          </span>
          <span className="text-xs text-gray-400">
            {result.main_topic}
          </span>
          <span className={`px-2 py-0.5 rounded text-xs ${difficultyInfo.color}`}>
            {difficultyInfo.label}
          </span>
        </div>
      </div>
    </div>
  )
}

