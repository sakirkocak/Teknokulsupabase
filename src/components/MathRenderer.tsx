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
    
    // =====================================================
    // BOZUK LATEX PATTERN DÜZELTME (Fallback)
    // JSON parse sırasında bozulan escape karakterleri
    // =====================================================
    
    // "imes" -> "\times" (çarpma işareti)
    result = result.replace(/imes/g, '\\times')
    // "\ rac" veya "rac{" -> "\frac{" (kesir)
    result = result.replace(/\\ rac/g, '\\frac')
    result = result.replace(/([^\\f])rac\{/g, '$1\\frac{')
    // "ightarrow" -> "\rightarrow" (ok)
    result = result.replace(/ightarrow/g, '\\rightarrow')
    // "ext{" -> "\text{" (metin)
    result = result.replace(/([^\\t])ext\{/g, '$1\\text{')
    // "sqrt{" -> "\sqrt{" (karekök)
    result = result.replace(/([^\\])sqrt\{/g, '$1\\sqrt{')
    // "cdot" -> "\cdot" (nokta çarpım)
    result = result.replace(/([^\\])cdot/g, '$1\\cdot')
    // " div " -> " \div " (bölme)
    result = result.replace(/ div /g, ' \\div ')
    // " pm " -> " \pm " (artı/eksi)
    result = result.replace(/ pm /g, ' \\pm ')
    // "leq" -> "\leq" (küçük eşit)
    result = result.replace(/([^\\])leq([^a-z])/g, '$1\\leq$2')
    // "geq" -> "\geq" (büyük eşit)
    result = result.replace(/([^\\])geq([^a-z])/g, '$1\\geq$2')
    // "neq" -> "\neq" (eşit değil)
    result = result.replace(/([^\\])neq([^a-z])/g, '$1\\neq$2')
    
    // =====================================================
    
    // Çift ters eğik çizgiyi tek yap (JSON'dan gelen)
    // \\frac -> \frac, \\sqrt -> \sqrt vb.
    result = result.replace(/\\\\/g, '\\')
    
    // \n satır sonlarını <br> yap
    result = result.replace(/\\n/g, '<br/>')
    result = result.replace(/\n/g, '<br/>')
    
    // KaTeX ortak ayarları - 'ignore' tüm uyarıları susturur
    const katexOptions = {
      throwOnError: false,
      strict: 'ignore' as const,  // "No character metrics" uyarılarını sustur
      trust: true,
      output: 'html' as const
    }
    
    // Display math: $$...$$ 
    result = result.replace(/\$\$([^$]+)\$\$/g, (_, math) => {
      try {
        const trimmed = math.trim()
        if (!trimmed) return ''
        return katex.renderToString(trimmed, { ...katexOptions, displayMode: true })
      } catch (e) {
        return `<span class="text-red-500 bg-red-50 px-1 rounded">${math}</span>`
      }
    })
    
    // Inline math: $...$ (tek $)
    result = result.replace(/\$([^$]+)\$/g, (_, math) => {
      try {
        const trimmed = math.trim()
        if (!trimmed) return ''
        return katex.renderToString(trimmed, { ...katexOptions, displayMode: false })
      } catch (e) {
        return `<span class="text-red-500 bg-red-50 px-1 rounded">${math}</span>`
      }
    })
    
    // \(...\) inline math (alternatif)
    result = result.replace(/\\\((.+?)\\\)/g, (_, math) => {
      try {
        const trimmed = math.trim()
        if (!trimmed) return ''
        return katex.renderToString(trimmed, { ...katexOptions, displayMode: false })
      } catch (e) {
        return `<span class="text-red-500">${math}</span>`
      }
    })
    
    // \[...\] display math (alternatif)
    result = result.replace(/\\\[(.+?)\\\]/g, (_, math) => {
      try {
        const trimmed = math.trim()
        if (!trimmed) return ''
        return katex.renderToString(trimmed, { ...katexOptions, displayMode: true })
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

