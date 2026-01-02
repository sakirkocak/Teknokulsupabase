'use client'

/**
 * 🎓 Akıllı Tahta (Smart Board) Bileşeni
 * 
 * TeknoÖğretmen için interaktif görsel panel
 * - Matematik formülleri
 * - Çözüm adımları
 * - Grafikler ve diyagramlar
 * - Benzer sorular
 * - Başarı göstergesi
 */

import { useState, useEffect, useMemo, useRef } from 'react'
import { 
  BookOpen, 
  TrendingUp, 
  Sparkles, 
  Calculator,
  Target,
  Award,
  ChevronRight,
  Lightbulb,
  X
} from 'lucide-react'
import MathRenderer from '@/components/MathRenderer'

// Görsel içerik tipleri
export interface VisualContent {
  id: string
  type: 'formula' | 'steps' | 'chart' | 'question' | 'tip' | 'summary'
  title?: string
  content: string
  data?: any
  timestamp: Date
}

// Başarı durumu
export interface ProgressData {
  correct: number
  total: number
  streak: number
  level: 'beginner' | 'intermediate' | 'advanced'
}

interface SmartBoardProps {
  visuals: VisualContent[]
  progress?: ProgressData
  currentTopic?: string
  isActive?: boolean
  onClear?: () => void
}

export default function SmartBoard({
  visuals,
  progress = { correct: 0, total: 0, streak: 0, level: 'beginner' },
  currentTopic,
  isActive = true,
  onClear
}: SmartBoardProps) {
  const [animatingId, setAnimatingId] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Yeni görsel geldiğinde animasyon + auto-scroll
  useEffect(() => {
    if (visuals.length > 0) {
      const latestId = visuals[visuals.length - 1].id
      setAnimatingId(latestId)
      setTimeout(() => setAnimatingId(null), 500)
      
      // Otomatik scroll - yeni içerik görünsün
      setTimeout(() => {
        scrollRef.current?.scrollTo({
          top: scrollRef.current.scrollHeight,
          behavior: 'smooth'
        })
      }, 100)
    }
  }, [visuals.length])

  // Başarı yüzdesi
  const successRate = useMemo(() => {
    if (progress.total === 0) return 0
    return Math.round((progress.correct / progress.total) * 100)
  }, [progress])

  // Seviye renkleri
  const levelColors = {
    beginner: 'from-green-500 to-emerald-500',
    intermediate: 'from-blue-500 to-indigo-500',
    advanced: 'from-purple-500 to-pink-500'
  }

  // İçerik tipi ikonu
  const getIcon = (type: VisualContent['type']) => {
    switch (type) {
      case 'formula': return <Calculator className="w-4 h-4" />
      case 'steps': return <ChevronRight className="w-4 h-4" />
      case 'chart': return <TrendingUp className="w-4 h-4" />
      case 'question': return <Target className="w-4 h-4" />
      case 'tip': return <Lightbulb className="w-4 h-4" />
      case 'summary': return <BookOpen className="w-4 h-4" />
      default: return <Sparkles className="w-4 h-4" />
    }
  }

  // İçerik tipi rengi
  const getTypeColor = (type: VisualContent['type']) => {
    switch (type) {
      case 'formula': return 'bg-blue-500/20 border-blue-500/30 text-blue-300'
      case 'steps': return 'bg-purple-500/20 border-purple-500/30 text-purple-300'
      case 'chart': return 'bg-green-500/20 border-green-500/30 text-green-300'
      case 'question': return 'bg-amber-500/20 border-amber-500/30 text-amber-300'
      case 'tip': return 'bg-yellow-500/20 border-yellow-500/30 text-yellow-300'
      case 'summary': return 'bg-indigo-500/20 border-indigo-500/30 text-indigo-300'
      default: return 'bg-gray-500/20 border-gray-500/30 text-gray-300'
    }
  }

  if (!isActive) return null

  return (
    <div className="h-full flex flex-col bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-gray-700/50 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700/50 bg-gradient-to-r from-indigo-900/50 to-purple-900/50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center">
            <BookOpen className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="text-white font-semibold text-sm">Akıllı Tahta</h3>
            {currentTopic && (
              <p className="text-gray-400 text-xs">{currentTopic}</p>
            )}
          </div>
        </div>
        {onClear && visuals.length > 0 && (
          <button
            onClick={onClear}
            className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Başarı Göstergesi */}
      {progress.total > 0 && (
        <div className="px-4 py-3 border-b border-gray-700/50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-400">Başarı Durumu</span>
            <div className="flex items-center gap-1">
              <Award className="w-3 h-3 text-yellow-500" />
              <span className="text-xs text-yellow-500">{progress.streak} seri</span>
            </div>
          </div>
          <div className="relative h-2 bg-gray-700 rounded-full overflow-hidden">
            <div 
              className={`absolute inset-y-0 left-0 bg-gradient-to-r ${levelColors[progress.level]} transition-all duration-500`}
              style={{ width: `${successRate}%` }}
            />
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-xs text-gray-500">{progress.correct}/{progress.total} doğru</span>
            <span className="text-xs text-gray-400">%{successRate}</span>
          </div>
        </div>
      )}

      {/* Görsel İçerikler */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
        {visuals.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
            <Sparkles className="w-12 h-12 mb-3 opacity-30" />
            <p className="text-sm">Henüz içerik yok</p>
            <p className="text-xs mt-1">Ders başladığında formüller ve<br />açıklamalar burada görünecek</p>
          </div>
        ) : (
          visuals.map((visual) => (
            <div
              key={visual.id}
              className={`
                ${getTypeColor(visual.type)}
                border rounded-xl p-3 transition-all duration-300
                ${animatingId === visual.id ? 'animate-pulse scale-[1.02]' : ''}
              `}
            >
              {/* Başlık */}
              {visual.title && (
                <div className="flex items-center gap-2 mb-2">
                  {getIcon(visual.type)}
                  <span className="text-sm font-medium">{visual.title}</span>
                </div>
              )}
              
              {/* İçerik - Tüm içeriklerde KaTeX/LaTeX desteği */}
              <div className="text-white math-content">
                {visual.type === 'formula' ? (
                  <div className="text-lg">
                    <MathRenderer text={visual.content} className="text-xl leading-relaxed" />
                  </div>
                ) : visual.type === 'steps' ? (
                  <div className="space-y-1">
                    <MathRenderer text={visual.content} className="text-lg leading-relaxed" />
                  </div>
                ) : visual.type === 'question' ? (
                  <div className="space-y-2">
                    <MathRenderer text={visual.content} className="text-sm" />
                    {visual.data?.options && (
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        {Object.entries(visual.data.options).map(([key, value]) => (
                          <div key={key} className="px-2 py-1 bg-white/10 rounded text-xs">
                            <span className="font-bold mr-1">{key})</span>
                            <MathRenderer text={value as string} />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : visual.type === 'tip' ? (
                  <div className="flex gap-2">
                    <Lightbulb className="w-4 h-4 flex-shrink-0 mt-0.5 text-yellow-400" />
                    <MathRenderer text={visual.content} className="text-sm" />
                  </div>
                ) : (
                  <MathRenderer text={visual.content} className="text-sm" />
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer - Konu Özeti */}
      {currentTopic && visuals.length > 0 && (
        <div className="px-4 py-2 border-t border-gray-700/50 bg-gray-800/50">
          <p className="text-xs text-gray-400 text-center">
            📚 {visuals.length} içerik • {currentTopic}
          </p>
        </div>
      )}
    </div>
  )
}
