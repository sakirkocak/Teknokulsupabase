'use client'

import { Suspense, lazy } from 'react'
import MathRenderer from './MathRenderer'

// Lazy load Mermaid ve SVG renderers (client-side only)
const MermaidRenderer = lazy(() => import('./MermaidRenderer'))
const SVGRenderer = lazy(() => import('./SVGRenderer'))

// Yeni Nesil Soru görsel türleri
type VisualType = 'none' | 'table' | 'chart' | 'flowchart' | 'pie' | 'diagram' | 'mixed'

interface QuestionCardProps {
  questionText: string
  options?: { A: string; B: string; C: string; D: string; E?: string } | null
  className?: string
  // 🆕 Yeni Nesil Soru alanları
  visualType?: VisualType
  visualContent?: string
}

// Görsel içeriği render et
function VisualContentRenderer({ visualType, visualContent }: { visualType?: VisualType; visualContent?: string }) {
  if (!visualContent || visualType === 'none') return null

  // Mermaid türleri
  const isMermaid = ['chart', 'flowchart', 'pie', 'diagram'].includes(visualType || '')
  
  // SVG kontrolü
  const isSvg = visualContent.trim().toLowerCase().startsWith('<svg')
  
  // LaTeX tablo kontrolü (table türü veya \begin{array} içeren içerik)
  const isLatexTable = visualType === 'table' || 
    visualContent.includes('\\begin{array}') || 
    visualContent.includes('\\begin{tabular}')

  if (isMermaid && !isSvg && !isLatexTable) {
    return (
      <Suspense fallback={<div className="animate-pulse bg-gray-100 rounded-lg h-40 flex items-center justify-center text-gray-400">📊 Grafik yükleniyor...</div>}>
        <div className="my-4 p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
          <MermaidRenderer chart={visualContent} />
        </div>
      </Suspense>
    )
  }

  if (isSvg) {
    return (
      <Suspense fallback={<div className="animate-pulse bg-gray-100 rounded-lg h-40 flex items-center justify-center text-gray-400">🖼️ Görsel yükleniyor...</div>}>
        <div className="my-4 flex justify-center">
          <SVGRenderer svg={visualContent} className="max-w-full" />
        </div>
      </Suspense>
    )
  }

  if (isLatexTable) {
    // LaTeX tablo - MathRenderer zaten destekliyor
    return (
      <div className="my-4 overflow-x-auto">
        <MathRenderer text={visualContent} />
      </div>
    )
  }

  // Bilinmeyen tür - ham içeriği göster
  return (
    <div className="my-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
      <pre className="text-xs text-gray-600 whitespace-pre-wrap">{visualContent}</pre>
    </div>
  )
}

// Soru metni için LaTeX destekli renderer
export function QuestionText({ 
  text, 
  className = '',
  visualType,
  visualContent 
}: { 
  text: string; 
  className?: string;
  visualType?: VisualType;
  visualContent?: string;
}) {
  return (
    <div className={className}>
      <MathRenderer text={text} />
      <VisualContentRenderer visualType={visualType} visualContent={visualContent} />
    </div>
  )
}

// Şık değeri için LaTeX destekli renderer
export function OptionText({ text, className = '' }: { text: string; className?: string }) {
  return (
    <span className={className}>
      <MathRenderer text={text} />
    </span>
  )
}

// Tam soru kartı (metin + şıklar + görsel)
export default function QuestionCard({ 
  questionText, 
  options, 
  className = '',
  visualType,
  visualContent
}: QuestionCardProps) {
  // Yeni Nesil Soru badge'i
  const isNewGeneration = visualType && visualType !== 'none' && visualContent
  
  return (
    <div className={className}>
      {/* Yeni Nesil badge */}
      {isNewGeneration && (
        <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-700 text-xs font-medium rounded-full mb-2">
          <span>🆕</span>
          <span>Yeni Nesil</span>
        </div>
      )}
      
      <div className="text-gray-800 mb-4">
        <MathRenderer text={questionText} />
      </div>
      
      {/* Görsel içerik */}
      <VisualContentRenderer visualType={visualType} visualContent={visualContent} />
      
      {options && Object.keys(options).length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {Object.entries(options).filter(([_, v]) => v).map(([key, value]) => (
            <div
              key={key}
              className="flex items-center gap-2 p-2 rounded-lg bg-gray-50 text-sm"
            >
              <span className="w-6 h-6 flex items-center justify-center bg-gray-200 rounded-full text-xs font-medium">
                {key}
              </span>
              <span className="text-gray-700 line-clamp-1">
                <MathRenderer text={value} />
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
