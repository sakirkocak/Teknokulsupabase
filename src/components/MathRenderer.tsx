'use client'

import { useMemo } from 'react'
import katex from 'katex'
import 'katex/dist/katex.min.css'

interface MathRendererProps {
  text?: string
  content?: string // Alias for text
  className?: string
}

export default function MathRenderer({ text, content, className = '' }: MathRendererProps) {
  // content veya text kullan
  const inputText = content || text || ''
  
  const renderedHtml = useMemo(() => {
    if (!inputText) return ''
    
    let result = inputText
    
    // Çift ters eğik çizgiyi tek yap (JSON'dan gelen)
    // \\frac -> \frac, \\sqrt -> \sqrt vb.
    result = result.replace(/\\\\/g, '\\')
    
    // \n satır sonlarını <br> yap
    result = result.replace(/\\n/g, '<br/>')
    result = result.replace(/\n/g, '<br/>')
    
    // Display math: $$...$$ 
    result = result.replace(/\$\$([^$]+)\$\$/g, (_, math) => {
      try {
        return katex.renderToString(math.trim(), {
          displayMode: true,
          throwOnError: false,
          strict: false,
          trust: true
        })
      } catch (e) {
        console.error('KaTeX display error:', e, math)
        return `<span class="text-red-500 bg-red-50 px-1 rounded">${math}</span>`
      }
    })
    
    // Inline math: $...$ (tek $)
    result = result.replace(/\$([^$]+)\$/g, (_, math) => {
      try {
        return katex.renderToString(math.trim(), {
          displayMode: false,
          throwOnError: false,
          strict: false,
          trust: true
        })
      } catch (e) {
        console.error('KaTeX inline error:', e, math)
        return `<span class="text-red-500 bg-red-50 px-1 rounded">${math}</span>`
      }
    })
    
    // \(...\) inline math (alternatif)
    result = result.replace(/\\\((.+?)\\\)/g, (_, math) => {
      try {
        return katex.renderToString(math.trim(), {
          displayMode: false,
          throwOnError: false,
          strict: false,
          trust: true
        })
      } catch (e) {
        return `<span class="text-red-500">${math}</span>`
      }
    })
    
    // \[...\] display math (alternatif)
    result = result.replace(/\\\[(.+?)\\\]/g, (_, math) => {
      try {
        return katex.renderToString(math.trim(), {
          displayMode: true,
          throwOnError: false,
          strict: false,
          trust: true
        })
      } catch (e) {
        return `<span class="text-red-500">${math}</span>`
      }
    })
    
    return result
  }, [inputText])

  if (!inputText) return null

  return (
    <span 
      className={className}
      dangerouslySetInnerHTML={{ __html: renderedHtml }}
    />
  )
}

