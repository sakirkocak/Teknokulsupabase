'use client'

import { useState, useRef, useEffect } from 'react'
import { Search, Loader2, Filter, Zap, Clock, Lightbulb, X, GraduationCap, ChevronDown } from 'lucide-react'
import { searchQuestionsFast, getTopicSuggestionsFast, isTypesenseEnabled } from '@/lib/typesense/browser-client'

interface Question {
  id: string
  question_text: string
  subject: string
  subject_code?: string
  topic?: string
  difficulty?: string
  grade?: number
}

interface TopicSuggestion {
  topic: string
  subject_name: string
  count: number
}

interface QuestionSearchProps {
  onSelect: (question: Question) => void
  onStartQuiz?: (questions: Question[]) => void
  grade?: number
}

// Arama geçmişi
const HISTORY_KEY = 'jarvis_search_history'
const getHistory = (): string[] => {
  if (typeof window === 'undefined') return []
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]') } catch { return [] }
}
const addHistory = (q: string) => {
  if (!q || q.length < 2) return
  const h = getHistory().filter(x => x.toLowerCase() !== q.toLowerCase())
  localStorage.setItem(HISTORY_KEY, JSON.stringify([q, ...h].slice(0, 5)))
}

export default function QuestionSearch({ onSelect, onStartQuiz, grade: defaultGrade }: QuestionSearchProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Question[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [totalResults, setTotalResults] = useState(0)
  const [searchDuration, setSearchDuration] = useState(0)
  const [suggestions, setSuggestions] = useState<TopicSuggestion[]>([])
  const [history, setHistory] = useState<string[]>([])
  const [selectedGrade, setSelectedGrade] = useState<number | null>(defaultGrade || null)
  const [showGradeDropdown, setShowGradeDropdown] = useState(false)
  
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<NodeJS.Timeout>()
  const suggestionRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    setHistory(getHistory())
  }, [])

  // ⚡ Şimşek hızlı arama - Doğrudan Typesense'den (~20ms)
  const search = async (searchQuery: string) => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setResults([])
      setTotalResults(0)
      return
    }

    setIsSearching(true)
    setSuggestions([])
    
    try {
      if (!isTypesenseEnabled()) {
        console.warn('Typesense not enabled')
        setIsSearching(false)
        return
      }

      const { results: searchResults, total, duration } = await searchQuestionsFast(searchQuery, {
        grade: selectedGrade || undefined,
        limit: 12
      })

      console.log(`⚡ Jarvis Search: ${duration}ms, ${searchResults.length} results`)
      
      const questions: Question[] = searchResults.map(r => ({
        id: r.question_id,
        question_text: r.question_text,
        subject: r.subject_name,
        subject_code: r.subject_code,
        topic: r.main_topic,
        difficulty: r.difficulty,
        grade: r.grade
      }))
      
      setResults(questions)
      setTotalResults(total)
      setSearchDuration(duration)
      
      // Arama geçmişine ekle
      addHistory(searchQuery)
      setHistory(getHistory())
      
    } catch (error) {
      console.error('Search error:', error)
      setResults([])
    } finally {
      setIsSearching(false)
    }
  }

  // Konu önerileri (1-2 karakter)
  const loadSuggestions = async (q: string) => {
    if (!q || q.length > 2 || !isTypesenseEnabled()) {
      setSuggestions([])
      return
    }
    
    try {
      const { suggestions: s } = await getTopicSuggestionsFast({
        query: q,
        grade: selectedGrade || undefined,
        limit: 5
      })
      setSuggestions(s)
    } catch {
      setSuggestions([])
    }
  }

  const handleInputChange = (value: string) => {
    setQuery(value)
    
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (suggestionRef.current) clearTimeout(suggestionRef.current)
    
    if (value.length >= 2) {
      setIsSearching(true)
      debounceRef.current = setTimeout(() => search(value), 150)
    } else if (value.length >= 1) {
      suggestionRef.current = setTimeout(() => loadSuggestions(value), 100)
      setResults([])
      setTotalResults(0)
    } else {
      setResults([])
      setTotalResults(0)
      setSuggestions([])
    }
  }

  const handleSuggestionClick = (topic: string) => {
    setQuery(topic)
    setSuggestions([])
    search(topic)
  }

  const handleHistoryClick = (item: string) => {
    setQuery(item)
    search(item)
  }

  const startQuizWithResults = () => {
    if (results.length >= 5 && onStartQuiz) {
      onStartQuiz(results.slice(0, 10))
    }
  }

  const difficultyColors: Record<string, string> = {
    easy: 'bg-green-500/20 text-green-400',
    medium: 'bg-yellow-500/20 text-yellow-400',
    hard: 'bg-red-500/20 text-red-400',
    legendary: 'bg-purple-500/20 text-purple-400'
  }

  const difficultyLabels: Record<string, string> = {
    easy: 'Kolay',
    medium: 'Orta',
    hard: 'Zor',
    legendary: 'Efsane'
  }

  return (
    <div className="flex flex-col h-full">
      {/* Search Input */}
      <div className="p-4 border-b border-cyan-500/20">
        <div className="flex gap-2 mb-3">
          {/* Grade selector */}
          <div className="relative">
            <button
              onClick={() => setShowGradeDropdown(!showGradeDropdown)}
              className="flex items-center gap-1.5 px-3 py-2.5 bg-slate-800 border border-cyan-500/20 rounded-xl text-sm text-gray-300 hover:border-cyan-500/40"
            >
              <GraduationCap className="w-4 h-4 text-cyan-400" />
              <span>{selectedGrade ? `${selectedGrade}.` : 'Tümü'}</span>
              <ChevronDown className={`w-3 h-3 transition-transform ${showGradeDropdown ? 'rotate-180' : ''}`} />
            </button>
            
            {showGradeDropdown && (
              <div className="absolute top-full left-0 mt-1 w-28 bg-slate-800 border border-cyan-500/20 rounded-xl shadow-xl z-50 overflow-hidden">
                <button
                  onClick={() => { setSelectedGrade(null); setShowGradeDropdown(false); if (query) search(query) }}
                  className={`w-full px-3 py-2 text-left text-sm hover:bg-slate-700 ${!selectedGrade ? 'bg-cyan-500/20 text-cyan-400' : 'text-gray-300'}`}
                >
                  Tümü
                </button>
                {[1,2,3,4,5,6,7,8,9,10,11,12].map(g => (
                  <button
                    key={g}
                    onClick={() => { setSelectedGrade(g); setShowGradeDropdown(false); if (query) search(query) }}
                    className={`w-full px-3 py-2 text-left text-sm hover:bg-slate-700 ${selectedGrade === g ? 'bg-cyan-500/20 text-cyan-400' : 'text-gray-300'}`}
                  >
                    {g}. Sınıf
                  </button>
                ))}
              </div>
            )}
          </div>
          
          {/* Search input */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => handleInputChange(e.target.value)}
              placeholder="Konu ara... kesir, üçgen, hücre..."
              className="w-full pl-10 pr-8 py-2.5 bg-slate-800 border border-cyan-500/20 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 text-sm"
            />
            {isSearching ? (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-400 animate-spin" />
            ) : query && (
              <button onClick={() => { setQuery(''); setResults([]); setSuggestions([]) }} className="absolute right-3 top-1/2 -translate-y-1/2">
                <X className="w-4 h-4 text-gray-500 hover:text-white" />
              </button>
            )}
          </div>
        </div>

        {/* Stats */}
        {totalResults > 0 && (
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-400 flex items-center gap-2">
              <span>{totalResults.toLocaleString('tr-TR')} sonuç</span>
              <span className="text-cyan-400 flex items-center gap-1">
                <Zap className="w-3 h-3" />
                {searchDuration}ms
              </span>
            </p>
            {results.length >= 5 && onStartQuiz && (
              <button onClick={startQuizWithResults} className="px-3 py-1.5 bg-yellow-500/20 text-yellow-400 rounded-lg text-xs font-medium flex items-center gap-1 hover:bg-yellow-500/30">
                <Zap className="w-3 h-3" />
                Quiz Başlat
              </button>
            )}
          </div>
        )}
      </div>

      {/* Results / Suggestions / History */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {/* Search History (when empty) */}
        {!query && history.length > 0 && (
          <div className="mb-4">
            <p className="text-xs text-gray-500 flex items-center gap-1 mb-2">
              <Clock className="w-3 h-3" /> Son Aramalar
            </p>
            <div className="flex flex-wrap gap-2">
              {history.map((item, i) => (
                <button
                  key={i}
                  onClick={() => handleHistoryClick(item)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-gray-400 hover:text-white rounded-lg text-xs"
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Topic Suggestions (1-2 chars) */}
        {query.length >= 1 && query.length < 2 && suggestions.length > 0 && (
          <div className="mb-4">
            <p className="text-xs text-gray-500 flex items-center gap-1 mb-2">
              <Lightbulb className="w-3 h-3 text-yellow-500" /> Konu Önerileri
            </p>
            {suggestions.map((s, i) => (
              <button
                key={i}
                onClick={() => handleSuggestionClick(s.topic)}
                className="w-full p-2 text-left hover:bg-slate-800 rounded-lg flex items-center justify-between"
              >
                <span className="text-sm text-gray-300">{s.topic}</span>
                <span className="text-xs text-gray-500">{s.count} soru</span>
              </button>
            ))}
          </div>
        )}

        {/* Results */}
        {results.length > 0 ? (
          results.map((q) => (
            <button
              key={q.id}
              onClick={() => onSelect(q)}
              className="w-full text-left p-3 bg-slate-800/50 hover:bg-slate-700/50 rounded-xl border border-cyan-500/10 hover:border-cyan-500/30 transition-all group"
            >
              <p className="text-sm text-gray-300 line-clamp-2 group-hover:text-white">
                {q.question_text}
              </p>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <span className="text-xs px-2 py-0.5 bg-cyan-500/20 text-cyan-400 rounded-full">
                  {q.subject}
                </span>
                {q.topic && (
                  <span className="text-xs px-2 py-0.5 bg-slate-700 text-gray-400 rounded-full">
                    {q.topic}
                  </span>
                )}
                {q.difficulty && (
                  <span className={`text-xs px-2 py-0.5 rounded-full ${difficultyColors[q.difficulty] || 'bg-slate-700 text-gray-400'}`}>
                    {difficultyLabels[q.difficulty] || q.difficulty}
                  </span>
                )}
                {q.grade && (
                  <span className="text-xs text-gray-500">
                    {q.grade}. sınıf
                  </span>
                )}
              </div>
            </button>
          ))
        ) : query && query.length >= 2 && !isSearching ? (
          <div className="text-center py-8 text-gray-500 text-sm">
            Sonuç bulunamadı
          </div>
        ) : !query ? (
          <div className="text-center py-8">
            <Search className="w-10 h-10 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400 text-sm font-medium">⚡ Şimşek Hızlı Arama</p>
            <p className="text-gray-600 text-xs mt-1">105.000+ soru • ~20ms</p>
            
            {/* Popular topics */}
            <div className="mt-6 space-y-2">
              <p className="text-xs text-gray-500">Popüler:</p>
              <div className="flex flex-wrap gap-2 justify-center">
                {['kesir', 'denklem', 'üçgen', 'hücre', 'fotosentez', 'Newton'].map(topic => (
                  <button
                    key={topic}
                    onClick={() => handleHistoryClick(topic)}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-gray-400 hover:text-white rounded-lg text-xs transition-colors"
                  >
                    {topic}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}
