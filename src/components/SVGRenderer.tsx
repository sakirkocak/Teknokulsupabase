'use client'

import { useMemo, useState } from 'react'
import DOMPurify from 'isomorphic-dompurify'

interface SVGRendererProps {
  svg: string
  className?: string
  maxWidth?: number
  maxHeight?: number
}

/**
 * SVG kodunu güvenli şekilde render eder
 * XSS saldırılarına karşı DOMPurify ile temizleme yapar
 */
export default function SVGRenderer({ 
  svg, 
  className = '', 
  maxWidth = 600,
  maxHeight = 400 
}: SVGRendererProps) {
  const [error, setError] = useState<string | null>(null)

  const sanitizedSvg = useMemo(() => {
    if (!svg) return ''
    
    try {
      // SVG tag kontrolü
      if (!svg.trim().toLowerCase().startsWith('<svg')) {
        setError('Geçersiz SVG formatı')
        return ''
      }
      
      // XSS temizleme
      const clean = DOMPurify.sanitize(svg, {
        USE_PROFILES: { svg: true, svgFilters: true },
        ADD_TAGS: ['use'],
        ADD_ATTR: ['xlink:href', 'xmlns:xlink'],
      })
      
      // Boyut ayarlaması
      let adjustedSvg = clean
      
      // viewBox yoksa ekle
      if (!adjustedSvg.includes('viewBox')) {
        const widthMatch = adjustedSvg.match(/width="(\d+)"/)
        const heightMatch = adjustedSvg.match(/height="(\d+)"/)
        if (widthMatch && heightMatch) {
          const w = widthMatch[1]
          const h = heightMatch[1]
          adjustedSvg = adjustedSvg.replace('<svg', `<svg viewBox="0 0 ${w} ${h}"`)
        }
      }
      
      // Max boyut uygula
      adjustedSvg = adjustedSvg
        .replace(/width="[^"]*"/, `width="100%"`)
        .replace(/height="[^"]*"/, `height="auto"`)
      
      setError(null)
      return adjustedSvg
      
    } catch (err) {
      console.error('SVG render hatası:', err)
      setError(err instanceof Error ? err.message : 'SVG işlenemedi')
      return ''
    }
  }, [svg])

  if (error) {
    return (
      <div className={`p-4 bg-yellow-50 border border-yellow-200 rounded-lg ${className}`}>
        <div className="flex items-start gap-2">
          <svg className="w-5 h-5 text-yellow-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div>
            <p className="text-sm font-medium text-yellow-800">Görsel yüklenemedi</p>
            <p className="text-xs text-yellow-600 mt-1">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  if (!sanitizedSvg) {
    return null
  }

  return (
    <div 
      className={`svg-container overflow-hidden ${className}`}
      style={{ maxWidth, maxHeight }}
      dangerouslySetInnerHTML={{ __html: sanitizedSvg }}
    />
  )
}

/**
 * Metin içindeki SVG kod bloklarını tespit eder ve render eder
 */
export function SVGContent({ content, className = '' }: { content: string; className?: string }) {
  // SVG kod bloklarını bul: ```svg ... ``` veya direkt <svg>...</svg>
  const svgBlockRegex = /```svg\n([\s\S]*?)```/g
  const svgTagRegex = /(<svg[\s\S]*?<\/svg>)/g
  
  const parts: { type: 'text' | 'svg'; content: string }[] = []
  let processedContent = content
  
  // Önce ```svg ... ``` bloklarını işle
  let lastIndex = 0
  let match
  
  while ((match = svgBlockRegex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push({
        type: 'text',
        content: content.slice(lastIndex, match.index)
      })
    }
    
    parts.push({
      type: 'svg',
      content: match[1].trim()
    })
    
    lastIndex = match.index + match[0].length
  }
  
  // Eğer hiç SVG bloğu bulunamadıysa, direkt <svg> taglarını ara
  if (parts.length === 0) {
    lastIndex = 0
    while ((match = svgTagRegex.exec(content)) !== null) {
      if (match.index > lastIndex) {
        parts.push({
          type: 'text',
          content: content.slice(lastIndex, match.index)
        })
      }
      
      parts.push({
        type: 'svg',
        content: match[1]
      })
      
      lastIndex = match.index + match[0].length
    }
  }
  
  // Kalan metin
  if (lastIndex < content.length) {
    parts.push({
      type: 'text',
      content: content.slice(lastIndex)
    })
  }
  
  // Eğer hiç SVG bloğu yoksa direkt metni döndür
  if (parts.length === 0) {
    return <span className={className}>{content}</span>
  }
  
  return (
    <div className={className}>
      {parts.map((part, index) => (
        part.type === 'svg' ? (
          <div key={index} className="my-4 flex justify-center">
            <SVGRenderer svg={part.content} />
          </div>
        ) : (
          <span key={index}>{part.content}</span>
        )
      ))}
    </div>
  )
}
