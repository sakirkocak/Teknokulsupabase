'use client'

import { useMemo } from 'react'
import katex from 'katex'
import 'katex/dist/katex.min.css'

interface MathRendererProps {
  text?: string
  content?: string  // Alias for text
  className?: string
}

// =====================================================
// YARDIMCI FONKSİYONLAR
// =====================================================

/**
 * LaTeX komutlarını düz metne çevirir (fallback için)
 * Render edilemeyen formüller için okunabilir alternatif sağlar
 */
function latexToPlainText(latex: string): string {
  if (!latex) return ''
  
  return latex
    // Kesirler: \frac{a}{b} -> a/b
    .replace(/\\frac\{([^}]*)\}\{([^}]*)\}/g, '($1)/($2)')
    // Karekök: \sqrt{x} -> √x
    .replace(/\\sqrt\{([^}]*)\}/g, '√($1)')
    // n. dereceden kök: \sqrt[n]{x} -> ⁿ√x
    .replace(/\\sqrt\[([^\]]*)\]\{([^}]*)\}/g, '$1√($2)')
    // Üst simge: x^{2} -> x²
    .replace(/\^{([^}]*)}/g, '^($1)')
    .replace(/\^(\d)/g, '^$1')
    // Alt simge: x_{1} -> x₁
    .replace(/_{([^}]*)}/g, '_($1)')
    .replace(/_(\d)/g, '_$1')
    // Matematiksel operatörler
    .replace(/\\times/g, '×')
    .replace(/\\div/g, '÷')
    .replace(/\\pm/g, '±')
    .replace(/\\mp/g, '∓')
    .replace(/\\cdot/g, '·')
    .replace(/\\ast/g, '*')
    // Karşılaştırma operatörleri
    .replace(/\\leq/g, '≤')
    .replace(/\\geq/g, '≥')
    .replace(/\\neq/g, '≠')
    .replace(/\\approx/g, '≈')
    .replace(/\\equiv/g, '≡')
    // Yunan harfleri
    .replace(/\\alpha/g, 'α')
    .replace(/\\beta/g, 'β')
    .replace(/\\gamma/g, 'γ')
    .replace(/\\delta/g, 'δ')
    .replace(/\\epsilon/g, 'ε')
    .replace(/\\theta/g, 'θ')
    .replace(/\\lambda/g, 'λ')
    .replace(/\\mu/g, 'μ')
    .replace(/\\pi/g, 'π')
    .replace(/\\sigma/g, 'σ')
    .replace(/\\omega/g, 'ω')
    .replace(/\\phi/g, 'φ')
    .replace(/\\psi/g, 'ψ')
    // Özel semboller
    .replace(/\\infty/g, '∞')
    .replace(/\\sum/g, '∑')
    .replace(/\\prod/g, '∏')
    .replace(/\\int/g, '∫')
    .replace(/\\partial/g, '∂')
    .replace(/\\nabla/g, '∇')
    .replace(/\\forall/g, '∀')
    .replace(/\\exists/g, '∃')
    .replace(/\\in/g, '∈')
    .replace(/\\notin/g, '∉')
    .replace(/\\subset/g, '⊂')
    .replace(/\\supset/g, '⊃')
    .replace(/\\cup/g, '∪')
    .replace(/\\cap/g, '∩')
    .replace(/\\emptyset/g, '∅')
    // Oklar
    .replace(/\\rightarrow/g, '→')
    .replace(/\\leftarrow/g, '←')
    .replace(/\\Rightarrow/g, '⇒')
    .replace(/\\Leftarrow/g, '⇐')
    .replace(/\\leftrightarrow/g, '↔')
    // Noktalar
    .replace(/\\ldots/g, '...')
    .replace(/\\cdots/g, '···')
    // Metin komutları
    .replace(/\\text\{([^}]*)\}/g, '$1')
    .replace(/\\textbf\{([^}]*)\}/g, '$1')
    .replace(/\\textit\{([^}]*)\}/g, '$1')
    .replace(/\\mathrm\{([^}]*)\}/g, '$1')
    // Trigonometrik fonksiyonlar
    .replace(/\\sin/g, 'sin')
    .replace(/\\cos/g, 'cos')
    .replace(/\\tan/g, 'tan')
    .replace(/\\cot/g, 'cot')
    .replace(/\\log/g, 'log')
    .replace(/\\ln/g, 'ln')
    .replace(/\\exp/g, 'exp')
    .replace(/\\lim/g, 'lim')
    // Parantezler
    .replace(/\\left/g, '')
    .replace(/\\right/g, '')
    .replace(/\\big/g, '')
    .replace(/\\Big/g, '')
    .replace(/\\bigg/g, '')
    .replace(/\\Bigg/g, '')
    // Boşluklar
    .replace(/\\quad/g, '  ')
    .replace(/\\qquad/g, '    ')
    .replace(/\\,/g, ' ')
    .replace(/\\;/g, ' ')
    .replace(/\\!/g, '')
    // Kalan backslash'leri kaldır
    .replace(/\\([a-zA-Z]+)/g, '$1')
    .replace(/\\/g, '')
    // Süslü parantezleri kaldır
    .replace(/[{}]/g, '')
    // Çoklu boşlukları tek boşluğa indir
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * LaTeX'i render öncesi temizler ve normalize eder
 * Bozuk escape sequence'ları düzeltir
 */
function sanitizeLatex(latex: string): string {
  if (!latex) return ''
  
  let sanitized = latex
  
  // 1. Bozuk escape sequence'ları düzelt
  // Bazen \t, \r, \n gibi karakterler yanlışlıkla oluşur
  sanitized = sanitized
    .replace(/\t/g, ' ')  // Tab -> boşluk
    .replace(/\r/g, '')   // CR kaldır
    // \f -> \f (form feed) literal olarak kalmalı ama LaTeX'te yok
    
  // 2. Çoklu backslash'leri normalize et
  // \\\\times -> \\times (JSON'dan sonra 2 backslash kalmalı)
  sanitized = sanitized.replace(/\\{3,}/g, '\\\\')
  
  // 3. Eksik kapanış parantezlerini dene
  // Basit kontrol - derinlemesine analiz yapmıyoruz
  const openBraces = (sanitized.match(/{/g) || []).length
  const closeBraces = (sanitized.match(/}/g) || []).length
  if (openBraces > closeBraces) {
    sanitized += '}'.repeat(openBraces - closeBraces)
  }
  
  // 4. Boş içerikleri kaldır
  sanitized = sanitized
    .replace(/\^\{\s*\}/g, '')  // Boş üst simge
    .replace(/_\{\s*\}/g, '')   // Boş alt simge
    .replace(/\\frac\{\s*\}\{\s*\}/g, '')  // Boş kesir
    
  return sanitized
}

/**
 * Matematiksel formülleri KaTeX ile render eder
 * 
 * Desteklenen formatlar:
 * - \[...\] veya $$...$$ - block math
 * - \(...\) veya $...$ - inline math
 * 
 * Özellikler:
 * - Hata durumunda graceful fallback
 * - LaTeX sanitization
 * - Düz metin alternatifi
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
      
      // 🛡️ KaTeX render fonksiyonu - hata yönetimi ile
      const renderMath = (math: string, displayMode: boolean): string => {
        const sanitized = sanitizeLatex(math.trim())
        
        if (!sanitized) return ''
        
        try {
          return katex.renderToString(sanitized, { 
            displayMode,
            throwOnError: false,
            trust: true,
            strict: false,  // Uyarıları bastır
            macros: {
              // Yaygın kısa yollar
              "\\R": "\\mathbb{R}",
              "\\N": "\\mathbb{N}",
              "\\Z": "\\mathbb{Z}",
              "\\Q": "\\mathbb{Q}",
            }
          })
        } catch (katexError) {
          // KaTeX başarısız olursa düz metin göster
          console.warn('KaTeX render hatası:', katexError)
          const plainText = latexToPlainText(sanitized)
          return `<span class="math-fallback text-gray-700 font-mono text-sm bg-gray-100 px-1 rounded">${plainText}</span>`
        }
      }
      
      // Block math: \[...\] 
      result = result.replace(/\\\[([\s\S]*?)\\\]/g, (_, math) => {
        const rendered = renderMath(math, true)
        return rendered ? `<div class="math-block my-2 overflow-x-auto">${rendered}</div>` : ''
      })
      
      // Block math: $$...$$
      result = result.replace(/\$\$([\s\S]*?)\$\$/g, (_, math) => {
        const rendered = renderMath(math, true)
        return rendered ? `<div class="math-block my-2 overflow-x-auto">${rendered}</div>` : ''
      })
      
      // Inline math: \(...\)
      result = result.replace(/\\\(([\s\S]*?)\\\)/g, (_, math) => {
        return renderMath(math, false)
      })
      
      // Inline math: $...$  (tek dolar işareti)
      // Daha güvenli regex - para birimi $5 gibi durumları atla
      result = result.replace(/\$([^$\n]+)\$/g, (match, math) => {
        // $$ içinde olanları atla
        if (match.startsWith('$$') || match.endsWith('$$')) return match
        
        // Sadece sayı ise (para birimi) atla: $5, $100 gibi
        if (/^\d+([.,]\d+)?$/.test(math.trim())) return match
        
        return renderMath(math, false)
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
