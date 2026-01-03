'use client'

import { useMemo } from 'react'
import katex from 'katex'
import 'katex/dist/katex.min.css'

interface MathRendererProps {
  text?: string
  content?: string  // Alias for text
  className?: string
}

/**
 * Matematiksel formülleri KaTeX ile render eder
 * 
 * Desteklenen formatlar:
 * - \[...\] veya $$...$$ - block math
 * - \(...\) veya $...$ - inline math
 */
export default function MathRenderer({ text, content, className = '' }: MathRendererProps) {
  const inputText = text || content || ''
  
  const renderedContent = useMemo(() => {
    // 🛡️ Boş veya geçersiz input kontrolü
    if (!inputText || typeof inputText !== 'string') {
      return ''
    }
    
    try {
      let result = inputText
      
      // Block math: \[...\] veya $$...$$
      result = result.replace(/\\\[([\s\S]*?)\\\]/g, (_, math) => {
        try {
          return `<div class="math-block my-2 overflow-x-auto">${katex.renderToString(math.trim(), { 
            displayMode: true,
            throwOnError: false,
            trust: true
          })}</div>`
        } catch (e) {
          return `<code class="text-red-500">${math}</code>`
        }
      })
      
      result = result.replace(/\$\$([\s\S]*?)\$\$/g, (_, math) => {
        try {
          return `<div class="math-block my-2 overflow-x-auto">${katex.renderToString(math.trim(), { 
            displayMode: true,
            throwOnError: false,
            trust: true
          })}</div>`
        } catch (e) {
          return `<code class="text-red-500">${math}</code>`
        }
      })
      
      // Inline math: \(...\) veya $...$
      result = result.replace(/\\\(([\s\S]*?)\\\)/g, (_, math) => {
        try {
          return katex.renderToString(math.trim(), { 
            displayMode: false,
            throwOnError: false,
            trust: true
          })
        } catch (e) {
          return `<code class="text-red-500">${math}</code>`
        }
      })
      
      // Tek $ işareti için - daha güvenli regex (lookbehind olmadan)
      result = result.replace(/\$([^$]+)\$/g, (match, math) => {
        // $$ içinde olanları atla
        if (match.startsWith('$$') || match.endsWith('$$')) return match
        try {
          return katex.renderToString(math.trim(), { 
            displayMode: false,
            throwOnError: false,
            trust: true
          })
        } catch (e) {
          return `<code class="text-red-500">${math}</code>`
        }
      })
      
      return result
    } catch (error) {
      // 🛡️ Herhangi bir hata durumunda orijinal metni göster
      console.error('MathRenderer error:', error)
      return inputText
    }
  }, [inputText])
  
  // 🛡️ Render hatası durumunda fallback
  if (!renderedContent && inputText) {
    return <div className={className}>{inputText}</div>
  }
  
  return (
    <div 
      className={`math-content ${className}`}
      dangerouslySetInnerHTML={{ __html: renderedContent }}
    />
  )
}
