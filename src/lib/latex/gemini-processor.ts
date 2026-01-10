/**
 * Gemini Output Processor
 * Gemini AI çıktısındaki LaTeX'i temizler ve düzeltir
 */

import { sanitizeLatex } from './sanitizer'
import { normalizeLatex } from './normalizer'

/**
 * Gemini'nin ürettiği yaygın LaTeX hatalarını düzelt
 */
export function cleanGeminiLatex(text: string): string {
  if (!text || typeof text !== 'string') return ''
  
  let result = text
  
  // 1. Markdown kod bloklarını temizle
  // ```latex ... ``` veya ``` ... ```
  result = result.replace(/```latex\n?([\s\S]*?)```/g, '$$$1$$')
  result = result.replace(/```\n?([\s\S]*?)```/g, (match, content) => {
    // Eğer içerik LaTeX gibi görünüyorsa
    if (content.includes('\\') || content.includes('^') || content.includes('_')) {
      return `$$${content}$$`
    }
    return match
  })
  
  // 2. Yanlış math delimiter'ları düzelt
  // \( ve \) -> $ $ (inline için)
  result = result.replace(/\\\(/g, '$')
  result = result.replace(/\\\)/g, '$')
  
  // \[ ve \] -> $$ $$ (block için)
  result = result.replace(/\\\[/g, '$$')
  result = result.replace(/\\\]/g, '$$')
  
  // 3. Çift dolar işareti tutarsızlıklarını düzelt
  // $$ $ -> $$ (tek $ fazladan)
  result = result.replace(/\$\$\s*\$/g, '$$')
  result = result.replace(/\$\s*\$\$/g, '$$')
  
  // 4. Boş math bloklarını kaldır
  result = result.replace(/\$\s*\$/g, '')
  result = result.replace(/\$\$\s*\$\$/g, '')
  
  // 5. Gemini'nin sık yaptığı backslash hataları
  // Bazen \\ yerine sadece \ kullanıyor (satır sonu için)
  // Bu tablolarda sorun yaratır
  result = result.replace(/([^\\])\\\s*\n/g, '$1\\\\\n')
  
  // 6. Yanlış escape'leri düzelt
  // \\times -> \times (çift backslash gereksiz)
  result = result.replace(/\\\\(times|div|cdot|pm|mp|leq|geq|neq|approx)/g, '\\$1')
  
  // 7. Eksik boşlukları ekle
  // \times5 -> \times 5
  result = result.replace(/\\(times|div|cdot)(\d)/g, '\\$1 $2')
  
  // 8. Türkçe karakterlerden sonra gelen LaTeX sorunları
  // "değeri $x$" formatını koru
  result = result.replace(/([a-zğüşıöçA-ZĞÜŞİÖÇ])\$([^$]+)\$/g, '$1 $$$2$$')
  
  // 9. Çoklu satır sonu düzelt
  result = result.replace(/\n{3,}/g, '\n\n')
  
  return result
}

/**
 * Math bloklarını bul ve her birini işle
 */
function processMathBlocks(text: string, processor: (math: string) => string): string {
  let result = text
  
  // Block math: $$...$$
  result = result.replace(/\$\$([\s\S]*?)\$\$/g, (_, math) => {
    return `$$${processor(math)}$$`
  })
  
  // Inline math: $...$
  result = result.replace(/\$([^$\n]+)\$/g, (match, math) => {
    // Sadece sayı ise (para birimi) atla
    if (/^\d+([.,]\d+)?$/.test(math.trim())) return match
    return `$${processor(math)}$`
  })
  
  return result
}

/**
 * Ana Gemini çıktı işleme fonksiyonu
 */
export function processGeminiOutput(output: string): string {
  if (!output || typeof output !== 'string') return ''
  
  // 1. Önce genel temizlik
  let result = cleanGeminiLatex(output)
  
  // 2. Math bloklarını bul ve her birini sanitize + normalize et
  result = processMathBlocks(result, (math) => {
    let processed = sanitizeLatex(math)
    processed = normalizeLatex(processed)
    return processed
  })
  
  // 3. Son düzeltmeler
  // Cümle sonundaki noktalama işaretlerini math dışına al
  result = result.replace(/\$([^$]+)\.\$/g, '$$$1$$.')
  result = result.replace(/\$([^$]+),\$/g, '$$$1$$,')
  
  return result
}

/**
 * Gemini stream chunk'ını işle
 * Streaming sırasında partial LaTeX'i handle et
 */
export function processGeminiChunk(chunk: string, buffer: string): {
  processed: string
  newBuffer: string
} {
  const combined = buffer + chunk
  
  // Açık math block var mı kontrol et
  const dollarCount = (combined.match(/\$/g) || []).length
  const hasOpenBlock = dollarCount % 2 !== 0
  
  if (hasOpenBlock) {
    // Math block tamamlanmamış, buffer'da tut
    const lastDollar = combined.lastIndexOf('$')
    return {
      processed: processGeminiOutput(combined.substring(0, lastDollar)),
      newBuffer: combined.substring(lastDollar)
    }
  }
  
  // Tüm bloklar kapalı, işle
  return {
    processed: processGeminiOutput(combined),
    newBuffer: ''
  }
}
