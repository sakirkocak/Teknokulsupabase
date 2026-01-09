'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, X, Loader2, RefreshCw, Image as ImageIcon } from 'lucide-react'
import InteractiveSolutionPlayer from './interactive-solution/InteractiveSolutionPlayer'
import MathRenderer from './MathRenderer'

interface Props {
  questionId: string
  questionText: string
  subjectName: string
  questionImageUrl?: string | null
  visualContent?: string | null  // Yeni nesil soru grafiği (SVG/HTML)
  options?: { A?: string; B?: string; C?: string; D?: string; E?: string }
  correctAnswer?: string
  explanation?: string | null
  className?: string
}

export default function InteractiveSolutionButton({ 
  questionId, 
  questionText, 
  subjectName, 
  questionImageUrl,
  visualContent,
  options,
  correctAnswer,
  explanation,
  className = '' 
}: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [solution, setSolution] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [source, setSource] = useState<string>('')

  async function loadSolution(forceRegenerate = false) {
    setIsLoading(true)
    setError(null)

    // Basit string değerler
    const payload = {
      question_id: String(questionId || ''),
      question_text: String(questionText || ''),
      subject_name: String(subjectName || ''),
      force_regenerate: forceRegenerate
    }

    try {
      const res = await fetch('/api/interactive-solution/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const data = await res.json()

      if (data.success) {
        const solutionData = data.solution?.solution_data || data.solution
        if (solutionData?.steps) {
          setSolution(solutionData)
          setSource(data.source || 'generated')
          setIsOpen(true)
        } else {
          setError('Çözüm formatı hatalı')
        }
      } else {
        setError(data.error || 'Çözüm üretilemedi')
      }
    } catch (e) {
      setError('Sunucu hatası')
      console.error(e)
    } finally {
      setIsLoading(false)
    }
  }

  const voice = subjectName?.toLowerCase().includes('matematik') ? 'erdem' 
    : subjectName?.toLowerCase().includes('türkçe') ? 'gamze' 
    : 'mehmet'

  return (
    <>
      <button
        onClick={() => loadSolution(false)}
        disabled={isLoading}
        className={`inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-medium rounded-xl hover:from-indigo-600 hover:to-purple-600 disabled:opacity-50 transition-all shadow-lg shadow-indigo-500/25 ${className}`}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Hazırlanıyor...
          </>
        ) : (
          <>
            <Sparkles className="w-5 h-5" />
            İnteraktif Çöz
          </>
        )}
      </button>

      {error && <p className="text-sm text-red-500 mt-2">{error}</p>}

      <AnimatePresence>
        {isOpen && solution && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-gray-900"
          >
            {/* Header */}
            <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-4 py-3 bg-gray-900/95 backdrop-blur border-b border-gray-700">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-indigo-400" />
                  <span className="font-semibold text-white">İnteraktif Çözüm</span>
                </div>
                {source && (
                  <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                    source === 'cache' ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'
                  }`}>
                    {source === 'cache' ? '⚡ Önbellek' : '✨ Yeni üretildi'}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => { setIsOpen(false); setSolution(null); loadSolution(true) }}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors text-orange-400 hover:text-orange-300"
                  title="Yeniden üret"
                >
                  <RefreshCw className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Main Content - Split Layout */}
            <div className="h-full pt-14 flex flex-col lg:flex-row">
              {/* Sol Panel - Soru Detayları */}
              <div className="lg:w-2/5 xl:w-1/3 bg-gray-800 overflow-y-auto border-r border-gray-700">
                <div className="p-4 lg:p-6 space-y-4">
                  {/* Ders Etiketi */}
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 bg-indigo-500/20 text-indigo-300 rounded-full text-sm font-medium">
                      {subjectName}
                    </span>
                  </div>

                  {/* Soru Metni */}
                  <div className="bg-gray-700/50 rounded-xl p-4">
                    <h3 className="text-xs text-gray-400 uppercase tracking-wide mb-2">Soru</h3>
                    <div className="text-white leading-relaxed">
                      <MathRenderer text={questionText || ''} />
                    </div>
                  </div>

                  {/* Yeni Nesil Grafik */}
                  {visualContent && (
                    <div className="bg-gray-700/50 rounded-xl p-4">
                      <h3 className="text-xs text-gray-400 uppercase tracking-wide mb-2 flex items-center gap-1">
                        📊 Soru Grafiği
                      </h3>
                      <div 
                        className="w-full bg-white rounded-lg p-4 overflow-auto"
                        dangerouslySetInnerHTML={{ __html: visualContent }}
                      />
                    </div>
                  )}

                  {/* Soru Görseli */}
                  {questionImageUrl && (
                    <div className="bg-gray-700/50 rounded-xl p-4">
                      <h3 className="text-xs text-gray-400 uppercase tracking-wide mb-2 flex items-center gap-1">
                        <ImageIcon className="w-3 h-3" /> Görsel
                      </h3>
                      <img 
                        src={questionImageUrl} 
                        alt="Soru görseli" 
                        className="w-full rounded-lg max-h-48 object-contain bg-white"
                      />
                    </div>
                  )}

                  {/* Şıklar */}
                  {options && Object.keys(options).length > 0 && (
                    <div className="bg-gray-700/50 rounded-xl p-4">
                      <h3 className="text-xs text-gray-400 uppercase tracking-wide mb-3">Şıklar</h3>
                      <div className="space-y-2">
                        {(['A', 'B', 'C', 'D', 'E'] as const).map(key => {
                          const value = options[key]
                          if (!value) return null
                          const isCorrect = correctAnswer === key
                          return (
                            <div 
                              key={key} 
                              className={`flex items-start gap-2 p-2 rounded-lg ${
                                isCorrect ? 'bg-green-500/20 border border-green-500/30' : 'bg-gray-600/30'
                              }`}
                            >
                              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                                isCorrect ? 'bg-green-500 text-white' : 'bg-gray-600 text-gray-300'
                              }`}>
                                {key}
                              </span>
                              <span className={`text-sm ${isCorrect ? 'text-green-300' : 'text-gray-300'}`}>
                                <MathRenderer text={value} />
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Açıklama */}
                  {explanation && (
                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
                      <h3 className="text-xs text-amber-400 uppercase tracking-wide mb-2">💡 Açıklama</h3>
                      <div className="text-amber-100/90 text-sm leading-relaxed">
                        <MathRenderer text={explanation} />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Sağ Panel - İnteraktif Çözüm */}
              <div className="flex-1 bg-gradient-to-br from-slate-50 to-indigo-50 overflow-hidden flex flex-col">
                <InteractiveSolutionPlayer
                  solution={solution}
                  questionText={String(questionText || '')}
                  onComplete={() => {}}
                  voice={voice as 'erdem' | 'mehmet' | 'gamze'}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
