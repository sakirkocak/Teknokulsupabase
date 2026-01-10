/**
 * Merkezi LaTeX İşlemci
 * Tüm LaTeX işlemlerini tek bir yerde toplar
 * 
 * Kullanım:
 * import { processLatex, latexToTTS, sanitizeLatex } from '@/lib/latex'
 */

export { sanitizeLatex, cleanInvisibleChars } from './sanitizer'
export { normalizeLatex, fixBackslashCommands } from './normalizer'
export { validateLatex, isValidLatex } from './validator'
export { latexToUnicode, latexToPlainText } from './unicode-fallback'
export { latexToTTS, latexToSpeakableText } from './tts-converter'
export { processGeminiOutput, cleanGeminiLatex } from './gemini-processor'

import { sanitizeLatex } from './sanitizer'
import { normalizeLatex } from './normalizer'
import { validateLatex } from './validator'
import { latexToUnicode } from './unicode-fallback'

/**
 * Ana LaTeX işleme fonksiyonu
 * Tüm temizleme, normalizasyon ve validasyon adımlarını uygular
 */
export function processLatex(input: string): {
  latex: string
  isValid: boolean
  fallback: string
  errors: string[]
} {
  if (!input || typeof input !== 'string') {
    return { latex: '', isValid: true, fallback: '', errors: [] }
  }

  const errors: string[] = []
  
  // 1. Temizle
  let processed = sanitizeLatex(input)
  
  // 2. Normalize et (backslash'sız komutları düzelt)
  processed = normalizeLatex(processed)
  
  // 3. Validate et
  const validation = validateLatex(processed)
  if (!validation.isValid) {
    errors.push(...validation.errors)
  }
  
  // 4. Fallback oluştur
  const fallback = latexToUnicode(processed)
  
  return {
    latex: processed,
    isValid: validation.isValid,
    fallback,
    errors
  }
}

/**
 * Metin içindeki LaTeX bloklarını işle
 * $...$ ve $$...$$ bloklarını bulur ve işler
 */
export function processTextWithLatex(text: string): string {
  if (!text || typeof text !== 'string') return text || ''
  
  let result = text
  
  // Block math: $$...$$
  result = result.replace(/\$\$([\s\S]*?)\$\$/g, (_, math) => {
    const { latex } = processLatex(math)
    return `$$${latex}$$`
  })
  
  // Inline math: $...$
  result = result.replace(/\$([^$\n]+)\$/g, (match, math) => {
    // $$ içinde olanları atla
    if (match.startsWith('$$') || match.endsWith('$$')) return match
    // Sadece sayı ise (para birimi) atla
    if (/^\d+([.,]\d+)?$/.test(math.trim())) return match
    
    const { latex } = processLatex(math)
    return `$${latex}$`
  })
  
  // Block math: \[...\]
  result = result.replace(/\\\[([\s\S]*?)\\\]/g, (_, math) => {
    const { latex } = processLatex(math)
    return `\\[${latex}\\]`
  })
  
  // Inline math: \(...\)
  result = result.replace(/\\\(([\s\S]*?)\\\)/g, (_, math) => {
    const { latex } = processLatex(math)
    return `\\(${latex}\\)`
  })
  
  return result
}
