/**
 * LaTeX Sanitizer
 * Gelen metni temizler, görünmez karakterleri kaldırır
 */

/**
 * Görünmez ve sorunlu karakterleri temizle
 */
export function cleanInvisibleChars(text: string): string {
  if (!text) return ''
  
  return text
    // Zero-width characters (KaTeX "No character metrics" hatasını önler)
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    // Non-breaking space -> normal space
    .replace(/\u00A0/g, ' ')
    // Various Unicode spaces
    .replace(/[\u2000-\u200A]/g, ' ')
    // Narrow no-break space
    .replace(/\u202F/g, ' ')
    // Medium mathematical space
    .replace(/\u205F/g, ' ')
    // Ideographic space
    .replace(/\u3000/g, ' ')
    // Tab -> space
    .replace(/\t/g, ' ')
    // Carriage return
    .replace(/\r/g, '')
    // Form feed
    .replace(/\f/g, '')
}

/**
 * Çoklu backslash'leri normalize et
 */
function normalizeBackslashes(text: string): string {
  // 3+ backslash -> 2 backslash
  return text.replace(/\\{3,}/g, '\\\\')
}

/**
 * Eksik kapanış parantezlerini dene
 */
function fixBraces(text: string): string {
  const openBraces = (text.match(/{/g) || []).length
  const closeBraces = (text.match(/}/g) || []).length
  
  if (openBraces > closeBraces) {
    return text + '}'.repeat(openBraces - closeBraces)
  }
  
  return text
}

/**
 * Boş LaTeX komutlarını kaldır
 */
function removeEmptyCommands(text: string): string {
  return text
    // Boş üst simge: ^{}
    .replace(/\^\{\s*\}/g, '')
    // Boş alt simge: _{}
    .replace(/_\{\s*\}/g, '')
    // Boş kesir: \frac{}{}
    .replace(/\\frac\{\s*\}\{\s*\}/g, '')
    // Boş text: \text{}
    .replace(/\\text\{\s*\}/g, '')
    // Boş textbf: \textbf{}
    .replace(/\\textbf\{\s*\}/g, '')
    // Boş textit: \textit{}
    .replace(/\\textit\{\s*\}/g, '')
    // Boş mathrm: \mathrm{}
    .replace(/\\mathrm\{\s*\}/g, '')
    // Boş mathbf: \mathbf{}
    .replace(/\\mathbf\{\s*\}/g, '')
    // Boş sqrt: \sqrt{}
    .replace(/\\sqrt\{\s*\}/g, '')
    // Boş overline: \overline{}
    .replace(/\\overline\{\s*\}/g, '')
    // Boş underline: \underline{}
    .replace(/\\underline\{\s*\}/g, '')
}

/**
 * Ana sanitize fonksiyonu
 * Tüm temizleme işlemlerini sırasıyla uygular
 */
export function sanitizeLatex(latex: string): string {
  if (!latex || typeof latex !== 'string') return ''
  
  let sanitized = latex
  
  // 1. Görünmez karakterleri temizle
  sanitized = cleanInvisibleChars(sanitized)
  
  // 2. Backslash'leri normalize et
  sanitized = normalizeBackslashes(sanitized)
  
  // 3. Parantezleri düzelt
  sanitized = fixBraces(sanitized)
  
  // 4. Boş komutları kaldır
  sanitized = removeEmptyCommands(sanitized)
  
  // 5. Trim
  sanitized = sanitized.trim()
  
  // 6. Tamamen boş ise boş döndür
  if (!sanitized || /^\s*$/.test(sanitized)) {
    return ''
  }
  
  return sanitized
}
