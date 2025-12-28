'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Search, Sparkles, Zap, BookOpen, Star, 
  TrendingUp, ArrowRight, Loader2, X,
  Calculator, Microscope, Globe, Languages,
  ChevronRight
} from 'lucide-react'
import { searchQuestionsFast, isTypesenseEnabled } from '@/lib/typesense/browser-client'
import QuestionSolveDrawer from './QuestionSolveDrawer'

interface SearchResult {
  question_id: string
  question_text: string
  highlight: string
  subject_name: string
  subject_code: string
  grade: number
  main_topic: string
  difficulty: string
}

const popularTopics = [
  { label: 'Üçgenler', icon: Calculator, color: 'from-red-500 to-rose-500' },
  { label: 'Newton Yasaları', icon: Microscope, color: 'from-green-500 to-emerald-500' },
  { label: 'Kesirler', icon: Calculator, color: 'from-blue-500 to-indigo-500' },
  { label: 'Hücre Bölünmesi', icon: Microscope, color: 'from-purple-500 to-violet-500' },
  { label: 'Paragraf', icon: BookOpen, color: 'from-amber-500 to-orange-500' },
  { label: 'Simple Past', icon: Languages, color: 'from-cyan-500 to-teal-500' },
]

const difficultyConfig: Record<string, { label: string; color: string }> = {
  easy: { label: 'Kolay', color: 'bg-green-100 text-green-700' },
  medium: { label: 'Orta', color: 'bg-yellow-100 text-yellow-700' },
  hard: { label: 'Zor', color: 'bg-orange-100 text-orange-700' },
  legendary: { label: 'Efsane', color: 'bg-purple-100 text-purple-700' }
}

export default function MagicSearchHero() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [isFocused, setIsFocused] = useState(false)
  const [selectedQuestion, setSelectedQuestion] = useState<SearchResult | null>(null)
  const [showDrawer, setShowDrawer] = useState(false)
  
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const timeoutRef = useRef<NodeJS.Timeout>()

  // Typesense ile arama
  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery || searchQuery.length < 2) {
      setResults([])
      setLoading(false)
      return
    }

    if (!isTypesenseEnabled()) {
      console.warn('Typesense not enabled')
      setLoading(false)
      return
    }

    setLoading(true)

    try {
      const { results: searchResults, duration } = await searchQuestionsFast(searchQuery, {
        limit: 8
      })
      
      console.log(`⚡ Magic Search: ${duration}ms, ${searchResults.length} results`)
      setResults(searchResults)
    } catch (error) {
      console.error('Search error:', error)
      setResults([])
    }

    setLoading(false)
  }, [])

  // Debounced search
  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    if (query.length >= 2) {
      setLoading(true)
      timeoutRef.current = setTimeout(() => {
        performSearch(query)
      }, 200) // 200ms debounce - çok hızlı!
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

  const handleSelectQuestion = (question: SearchResult) => {
    setSelectedQuestion(question)
    setShowDrawer(true)
    setIsOpen(false)
  }

  const handleTopicClick = (topic: string) => {
    setQuery(topic)
    setIsOpen(true)
    inputRef.current?.focus()
  }

  return (
    <>
      <section className="relative py-16 md:py-24 overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-50 via-white to-white" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse" />
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20" />

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Title */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-8"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-purple-100 to-indigo-100 text-purple-700 text-sm font-medium mb-4">
              <Sparkles className="w-4 h-4" />
              <span>Yapay Zeka Destekli Arama</span>
              <Zap className="w-4 h-4 text-yellow-500" />
            </div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              Sihirli Soru Arama
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Konu yaz, anında bul, hemen çöz! 
              <span className="text-indigo-600 font-medium"> 10.000+ soru</span> arasında 
              <span className="text-purple-600 font-medium"> 20ms</span>'de ara.
            </p>
          </motion.div>

          {/* Search Box */}
          <motion.div
            ref={containerRef}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="relative max-w-3xl mx-auto"
          >
            <div className={`relative transition-all duration-300 ${isFocused ? 'scale-[1.02]' : ''}`}>
              {/* Glow Effect */}
              <div className={`absolute -inset-1 bg-gradient-to-r from-purple-500 via-indigo-500 to-pink-500 rounded-2xl blur-lg transition-opacity duration-300 ${isFocused ? 'opacity-40' : 'opacity-0'}`} />
              
              {/* Input Container */}
              <div className="relative bg-white rounded-2xl shadow-xl border border-gray-100">
                <div className="flex items-center">
                  <div className="pl-5">
                    {loading ? (
                      <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
                    ) : (
                      <Search className="w-6 h-6 text-gray-400" />
                    )}
                  </div>
                  <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(e) => {
                      setQuery(e.target.value)
                      setIsOpen(true)
                    }}
                    onFocus={() => {
                      setIsFocused(true)
                      setIsOpen(true)
                    }}
                    onBlur={() => setIsFocused(false)}
                    placeholder="Konu ara... üçgenler, newton, hücre, kesirler..."
                    className="flex-1 px-4 py-5 text-lg bg-transparent border-none focus:outline-none focus:ring-0 text-gray-900 placeholder-gray-400"
                  />
                  {query && (
                    <button
                      onClick={() => {
                        setQuery('')
                        setResults([])
                        inputRef.current?.focus()
                      }}
                      className="pr-5 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                  {!query && (
                    <div className="pr-5">
                      <span className="px-3 py-1.5 bg-gradient-to-r from-purple-500 to-indigo-500 text-white text-sm font-medium rounded-lg">
                        ⌘K
                      </span>
                    </div>
                  )}
                </div>

                {/* Results Dropdown */}
                <AnimatePresence>
                  {isOpen && (query.length >= 2 || results.length > 0) && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      className="border-t border-gray-100"
                    >
                      {results.length > 0 ? (
                        <div className="max-h-96 overflow-y-auto">
                          <div className="px-4 py-2 bg-gray-50 border-b border-gray-100">
                            <span className="text-sm text-gray-500">
                              {results.length} sonuç bulundu
                            </span>
                          </div>
                          {results.map((result, index) => {
                            const diffInfo = difficultyConfig[result.difficulty] || difficultyConfig.medium
                            
                            return (
                              <motion.button
                                key={result.question_id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.05 }}
                                onClick={() => handleSelectQuestion(result)}
                                className="w-full p-4 text-left hover:bg-indigo-50 border-b border-gray-50 last:border-0 transition-colors group"
                              >
                                <div className="flex items-start gap-3">
                                  <div className="p-2 bg-indigo-100 rounded-lg group-hover:bg-indigo-200 transition-colors">
                                    <BookOpen className="w-4 h-4 text-indigo-600" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p 
                                      className="text-gray-800 line-clamp-2 text-sm"
                                      dangerouslySetInnerHTML={{ __html: result.highlight }}
                                    />
                                    <div className="flex items-center flex-wrap gap-2 mt-2">
                                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                                        {result.subject_name}
                                      </span>
                                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                                        {result.grade}. Sınıf
                                      </span>
                                      <span className={`px-2 py-0.5 rounded text-xs ${diffInfo.color}`}>
                                        {diffInfo.label}
                                      </span>
                                    </div>
                                  </div>
                                  <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                    <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-600 text-white text-xs font-medium rounded-lg">
                                      Çöz
                                      <ArrowRight className="w-3 h-3" />
                                    </span>
                                  </div>
                                </div>
                              </motion.button>
                            )
                          })}
                        </div>
                      ) : loading ? (
                        <div className="p-8 text-center">
                          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mx-auto mb-3" />
                          <p className="text-gray-500">Aranıyor...</p>
                        </div>
                      ) : query.length >= 2 ? (
                        <div className="p-8 text-center">
                          <Search className="w-8 h-8 text-gray-300 mx-auto mb-3" />
                          <p className="text-gray-500">Sonuç bulunamadı</p>
                          <p className="text-gray-400 text-sm mt-1">Farklı kelimeler deneyin</p>
                        </div>
                      ) : null}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Popular Topics */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="mt-6"
            >
              <div className="flex items-center justify-center gap-2 mb-3">
                <TrendingUp className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-500">Popüler Konular</span>
              </div>
              <div className="flex flex-wrap justify-center gap-2">
                {popularTopics.map((topic, index) => (
                  <motion.button
                    key={topic.label}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 + index * 0.05 }}
                    onClick={() => handleTopicClick(topic.label)}
                    className="group inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-full hover:border-indigo-300 hover:shadow-md transition-all"
                  >
                    <div className={`p-1 rounded-md bg-gradient-to-r ${topic.color}`}>
                      <topic.icon className="w-3 h-3 text-white" />
                    </div>
                    <span className="text-sm text-gray-700 group-hover:text-indigo-600 transition-colors">
                      {topic.label}
                    </span>
                  </motion.button>
                ))}
              </div>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-8 flex items-center justify-center gap-6 text-sm text-gray-500"
            >
              <div className="flex items-center gap-1">
                <Zap className="w-4 h-4 text-yellow-500" />
                <span>~20ms arama</span>
              </div>
              <div className="w-1 h-1 bg-gray-300 rounded-full" />
              <div className="flex items-center gap-1">
                <BookOpen className="w-4 h-4 text-indigo-500" />
                <span>10.000+ soru</span>
              </div>
              <div className="w-1 h-1 bg-gray-300 rounded-full" />
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 text-amber-500" />
                <span>Kayıt gerektirmez</span>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Question Solve Drawer */}
      <QuestionSolveDrawer
        isOpen={showDrawer}
        onClose={() => {
          setShowDrawer(false)
          setSelectedQuestion(null)
        }}
        questionId={selectedQuestion?.question_id || null}
        searchQuery={query}
      />
    </>
  )
}
