'use client'

import { useMemo } from 'react'
import katex from 'katex'
import 'katex/dist/katex.min.css'

/**
 * 🎯 ENDÜSTRİ STANDARDI MATH RENDERER
 * 
 * Özellikler:
 * - KaTeX macros ile eksik LaTeX komutları desteği
 * - Bozuk LaTeX pattern'larını otomatik düzeltme
 * - Unicode math sembolleri desteği
 * - Türkçe karakter desteği
 * - Graceful fallback (hata durumunda okunabilir çıktı)
 * - Performans optimizasyonu (memoization)
 */

interface MathRendererProps {
  text?: string
  content?: string
  className?: string
}

// =====================================================
// KATEX CUSTOM MACROS
// KaTeX'te olmayan ama LaTeX'te olan komutlar
// =====================================================
const KATEX_MACROS: Record<string, string> = {
  // Türkçe karakterler
  '\\turkce': '\\text{Türkçe}',
  
  // Yaygın kısayollar
  '\\R': '\\mathbb{R}',
  '\\N': '\\mathbb{N}',
  '\\Z': '\\mathbb{Z}',
  '\\Q': '\\mathbb{Q}',
  '\\C': '\\mathbb{C}',
  
  // Trigonometri (Türkçe)
  '\\tg': '\\tan',
  '\\ctg': '\\cot',
  '\\cosec': '\\csc',
  '\\arcsen': '\\arcsin',
  '\\arccos': '\\arccos',
  '\\arctg': '\\arctan',
  
  // Limit ve türev
  '\\dif': '\\mathrm{d}',
  '\\Dif': '\\mathrm{D}',
  
  // Fizik
  '\\ohm': '\\Omega',
  '\\degree': '^{\\circ}',
  '\\celsius': '^{\\circ}\\text{C}',
  '\\micro': '\\mu',
  
  // Kimya (basit)
  '\\ce': '\\text',
  
  // Geometri
  '\\paralel': '\\parallel',
  '\\dik': '\\perp',
  '\\ucgen': '\\triangle',
  '\\kare': '\\square',
  '\\daire': '\\circ',
  
  // Mantık
  '\\ve': '\\wedge',
  '\\veya': '\\vee',
  '\\degil': '\\neg',
  
  // Cancel (üstü çizili)
  '\\cancel': '\\require{cancel}\\cancel',
  '\\bcancel': '\\require{cancel}\\bcancel',
  '\\xcancel': '\\require{cancel}\\xcancel',
}

// =====================================================
// UNICODE MATH SEMBOLLERI -> LATEX
// =====================================================
const UNICODE_TO_LATEX: [RegExp, string][] = [
  // Operatörler
  [/×/g, '\\times '],
  [/÷/g, '\\div '],
  [/±/g, '\\pm '],
  [/∓/g, '\\mp '],
  [/·/g, '\\cdot '],
  [/•/g, '\\bullet '],
  
  // Karşılaştırma
  [/≤/g, '\\leq '],
  [/≥/g, '\\geq '],
  [/≠/g, '\\neq '],
  [/≈/g, '\\approx '],
  [/≡/g, '\\equiv '],
  [/∝/g, '\\propto '],
  
  // Oklar
  [/→/g, '\\rightarrow '],
  [/←/g, '\\leftarrow '],
  [/↔/g, '\\leftrightarrow '],
  [/⇒/g, '\\Rightarrow '],
  [/⇐/g, '\\Leftarrow '],
  [/⇔/g, '\\Leftrightarrow '],
  [/↑/g, '\\uparrow '],
  [/↓/g, '\\downarrow '],
  
  // Yunan harfleri
  [/α/g, '\\alpha '],
  [/β/g, '\\beta '],
  [/γ/g, '\\gamma '],
  [/δ/g, '\\delta '],
  [/ε/g, '\\epsilon '],
  [/θ/g, '\\theta '],
  [/λ/g, '\\lambda '],
  [/μ/g, '\\mu '],
  [/π/g, '\\pi '],
  [/σ/g, '\\sigma '],
  [/φ/g, '\\phi '],
  [/ω/g, '\\omega '],
  [/Δ/g, '\\Delta '],
  [/Σ/g, '\\Sigma '],
  [/Ω/g, '\\Omega '],
  [/Π/g, '\\Pi '],
  
  // Matematiksel semboller
  [/∞/g, '\\infty '],
  [/√/g, '\\sqrt'],
  [/∫/g, '\\int '],
  [/∑/g, '\\sum '],
  [/∏/g, '\\prod '],
  [/∂/g, '\\partial '],
  [/∇/g, '\\nabla '],
  [/∈/g, '\\in '],
  [/∉/g, '\\notin '],
  [/⊂/g, '\\subset '],
  [/⊃/g, '\\supset '],
  [/⊆/g, '\\subseteq '],
  [/⊇/g, '\\supseteq '],
  [/∪/g, '\\cup '],
  [/∩/g, '\\cap '],
  [/∅/g, '\\emptyset '],
  [/∀/g, '\\forall '],
  [/∃/g, '\\exists '],
  [/¬/g, '\\neg '],
  [/∧/g, '\\wedge '],
  [/∨/g, '\\vee '],
  
  // Üst/alt simgeler
  [/²/g, '^2'],
  [/³/g, '^3'],
  [/⁴/g, '^4'],
  [/⁵/g, '^5'],
  [/⁶/g, '^6'],
  [/⁷/g, '^7'],
  [/⁸/g, '^8'],
  [/⁹/g, '^9'],
  [/⁰/g, '^0'],
  [/ⁿ/g, '^n'],
  [/₀/g, '_0'],
  [/₁/g, '_1'],
  [/₂/g, '_2'],
  [/₃/g, '_3'],
  [/₄/g, '_4'],
  
  // Birimler ve özel
  [/°/g, '^{\\circ}'],
  [/′/g, "'"],
  [/″/g, "''"],
  [/‰/g, '\\permil '],
  [/½/g, '\\frac{1}{2}'],
  [/¼/g, '\\frac{1}{4}'],
  [/¾/g, '\\frac{3}{4}'],
  [/⅓/g, '\\frac{1}{3}'],
  [/⅔/g, '\\frac{2}{3}'],
]

// =====================================================
// BOZUK LATEX PATTERN DÜZELTMELERİ
// JSON parse ve encoding hatalarından kaynaklanan
// =====================================================
const BROKEN_LATEX_FIXES: [RegExp, string][] = [
  // Eksik backslash düzeltmeleri
  [/([^\\])imes(?![a-z])/g, '$1\\times'],
  [/^imes(?![a-z])/g, '\\times'],
  [/([^\\f])rac\{/g, '$1\\frac{'],
  [/^rac\{/g, '\\frac{'],
  [/\\ rac/g, '\\frac'],
  [/([^\\])ightarrow/g, '$1\\rightarrow'],
  [/^ightarrow/g, '\\rightarrow'],
  [/([^\\])eftarrow/g, '$1\\leftarrow'],
  [/^eftarrow/g, '\\leftarrow'],
  [/([^\\t])ext\{/g, '$1\\text{'],
  [/^ext\{/g, '\\text{'],
  [/([^\\])sqrt\{/g, '$1\\sqrt{'],
  [/^sqrt\{/g, '\\sqrt{'],
  [/([^\\])sqrt\[/g, '$1\\sqrt['],
  [/^sqrt\[/g, '\\sqrt['],
  [/([^\\])cdot(?![a-z])/g, '$1\\cdot'],
  [/^cdot(?![a-z])/g, '\\cdot'],
  [/([^\\])ldots/g, '$1\\ldots'],
  [/^ldots/g, '\\ldots'],
  [/([^\\])cdots/g, '$1\\cdots'],
  [/^cdots/g, '\\cdots'],
  
  // Karşılaştırma operatörleri
  [/([^\\])leq(?![a-z])/g, '$1\\leq'],
  [/^leq(?![a-z])/g, '\\leq'],
  [/([^\\])geq(?![a-z])/g, '$1\\geq'],
  [/^geq(?![a-z])/g, '\\geq'],
  [/([^\\])neq(?![a-z])/g, '$1\\neq'],
  [/^neq(?![a-z])/g, '\\neq'],
  [/([^\\])approx(?![a-z])/g, '$1\\approx'],
  [/^approx(?![a-z])/g, '\\approx'],
  
  // Bölme ve çarpma
  [/ div /g, ' \\div '],
  [/ pm /g, ' \\pm '],
  [/ mp /g, ' \\mp '],
  
  // Trigonometri
  [/([^\\])sin(?![a-z])/g, '$1\\sin'],
  [/([^\\])cos(?![a-z])/g, '$1\\cos'],
  [/([^\\])tan(?![a-z])/g, '$1\\tan'],
  [/([^\\])cot(?![a-z])/g, '$1\\cot'],
  [/([^\\])log(?![a-z])/g, '$1\\log'],
  [/([^\\])ln(?![a-z])/g, '$1\\ln'],
  [/([^\\])lim(?![a-z])/g, '$1\\lim'],
  [/([^\\])sum(?![a-z])/g, '$1\\sum'],
  [/([^\\])int(?![a-z])/g, '$1\\int'],
  
  // Parantezler
  [/([^\\])left\(/g, '$1\\left('],
  [/([^\\])right\)/g, '$1\\right)'],
  [/([^\\])left\[/g, '$1\\left['],
  [/([^\\])right\]/g, '$1\\right]'],
  [/([^\\])left\{/g, '$1\\left\\{'],
  [/([^\\])right\}/g, '$1\\right\\}'],
  
  // Çift backslash -> tek backslash (JSON encoding fix)
  [/\\\\/g, '\\'],
  
  // Yanlış boşluklar
  [/\\ +/g, '\\ '],
  
  // Bozuk begin/end
  [/egin\{/g, '\\begin{'],
  [/nd\{/g, '\\end{'],
]

// =====================================================
// KATEX OPTIONS
// =====================================================
const getKatexOptions = (displayMode: boolean) => ({
  displayMode,
  throwOnError: false,
  strict: 'ignore' as const,
  trust: true,
  output: 'html' as const,
  macros: KATEX_MACROS,
  // Hata durumunda orijinal metni göster
  errorColor: '#cc0000',
})

// =====================================================
// PRE-PROCESSING
// =====================================================
function preprocessLatex(text: string): string {
  let result = text
  
  // 1. Unicode sembolleri LaTeX'e çevir
  for (const [pattern, replacement] of UNICODE_TO_LATEX) {
    result = result.replace(pattern, replacement)
  }
  
  // 2. Bozuk LaTeX pattern'larını düzelt
  for (const [pattern, replacement] of BROKEN_LATEX_FIXES) {
    result = result.replace(pattern, replacement)
  }
  
  // 3. Satır sonları
  result = result.replace(/\\n/g, '<br/>')
  result = result.replace(/\n/g, '<br/>')
  
  return result
}

// =====================================================
// SAFE KATEX RENDER
// =====================================================
function safeRenderMath(math: string, displayMode: boolean): string {
  const trimmed = math.trim()
  if (!trimmed) return ''
  
  try {
    // İlk deneme: normal render
    return katex.renderToString(trimmed, getKatexOptions(displayMode))
  } catch (firstError) {
    // İkinci deneme: ek düzeltmeler ile
    try {
      let fixed = trimmed
      
      // Yaygın hataları düzelt
      fixed = fixed.replace(/\\\s+/g, '\\') // Backslash sonrası fazla boşluk
      fixed = fixed.replace(/\{\s+/g, '{')  // Süslü parantez sonrası boşluk
      fixed = fixed.replace(/\s+\}/g, '}')  // Süslü parantez öncesi boşluk
      fixed = fixed.replace(/\^\s+/g, '^')  // Üst simge sonrası boşluk
      fixed = fixed.replace(/_\s+/g, '_')   // Alt simge sonrası boşluk
      
      // Eşleşmeyen süslü parantezleri düzelt
      const openCount = (fixed.match(/\{/g) || []).length
      const closeCount = (fixed.match(/\}/g) || []).length
      if (openCount > closeCount) {
        fixed += '}'.repeat(openCount - closeCount)
      } else if (closeCount > openCount) {
        fixed = '{'.repeat(closeCount - openCount) + fixed
      }
      
      return katex.renderToString(fixed, getKatexOptions(displayMode))
    } catch (secondError) {
      // Son çare: okunabilir fallback
      const cleanMath = trimmed
        .replace(/\\/g, '')
        .replace(/\{/g, '')
        .replace(/\}/g, '')
        .replace(/\^/g, '^')
        .replace(/_/g, '_')
      
      return `<span class="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-800 rounded border border-amber-200 font-mono text-sm" title="LaTeX: ${trimmed.replace(/"/g, '&quot;')}">${cleanMath}</span>`
    }
  }
}

// =====================================================
// MAIN COMPONENT
// =====================================================
export default function MathRenderer({ text, content, className = '' }: MathRendererProps) {
  const inputText = content || text || ''
  
  const renderedHtml = useMemo(() => {
    if (!inputText) return ''
    
    // Pre-processing
    let result = preprocessLatex(inputText)
    
    // Display math: $$...$$
    result = result.replace(/\$\$([^$]+)\$\$/g, (_, math) => safeRenderMath(math, true))
    
    // Inline math: $...$
    result = result.replace(/\$([^$]+)\$/g, (_, math) => safeRenderMath(math, false))
    
    // \(...\) inline math
    result = result.replace(/\\\((.+?)\\\)/g, (_, math) => safeRenderMath(math, false))
    
    // \[...\] display math
    result = result.replace(/\\\[(.+?)\\\]/g, (_, math) => safeRenderMath(math, true))
    
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

// =====================================================
// UTILITY EXPORTS
// =====================================================
export { preprocessLatex, safeRenderMath, KATEX_MACROS, UNICODE_TO_LATEX }
