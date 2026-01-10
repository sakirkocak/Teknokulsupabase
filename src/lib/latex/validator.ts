/**
 * LaTeX Validator
 * LaTeX sözdizimini kontrol eder, hataları tespit eder
 */

interface ValidationResult {
  isValid: boolean
  errors: string[]
}

/**
 * Parantez eşleşmelerini kontrol et
 */
function checkBraceBalance(latex: string): string[] {
  const errors: string[] = []
  
  // Küme parantezleri
  const openBraces = (latex.match(/{/g) || []).length
  const closeBraces = (latex.match(/}/g) || []).length
  if (openBraces !== closeBraces) {
    errors.push(`Küme parantezi dengesiz: ${openBraces} açık, ${closeBraces} kapalı`)
  }
  
  // Köşeli parantezler (opsiyonel argümanlar)
  const openBrackets = (latex.match(/\[/g) || []).length
  const closeBrackets = (latex.match(/\]/g) || []).length
  if (openBrackets !== closeBrackets) {
    errors.push(`Köşeli parantez dengesiz: ${openBrackets} açık, ${closeBrackets} kapalı`)
  }
  
  // Normal parantezler
  const openParens = (latex.match(/\(/g) || []).length
  const closeParens = (latex.match(/\)/g) || []).length
  if (openParens !== closeParens) {
    errors.push(`Parantez dengesiz: ${openParens} açık, ${closeParens} kapalı`)
  }
  
  return errors
}

/**
 * Environment eşleşmelerini kontrol et
 */
function checkEnvironments(latex: string): string[] {
  const errors: string[] = []
  
  // \begin{...} ve \end{...} eşleşmelerini bul
  const beginRegex = /\\begin\{([^}]+)\}/g
  const endRegex = /\\end\{([^}]+)\}/g
  
  const begins: string[] = []
  const ends: string[] = []
  
  let match
  while ((match = beginRegex.exec(latex)) !== null) {
    begins.push(match[1])
  }
  while ((match = endRegex.exec(latex)) !== null) {
    ends.push(match[1])
  }
  
  // Sayı kontrolü
  if (begins.length !== ends.length) {
    errors.push(`Environment dengesiz: ${begins.length} begin, ${ends.length} end`)
  }
  
  // Her begin için karşılık gelen end var mı?
  const beginCounts: Record<string, number> = {}
  const endCounts: Record<string, number> = {}
  
  begins.forEach(env => {
    beginCounts[env] = (beginCounts[env] || 0) + 1
  })
  ends.forEach(env => {
    endCounts[env] = (endCounts[env] || 0) + 1
  })
  
  Object.keys(beginCounts).forEach(env => {
    if (beginCounts[env] !== (endCounts[env] || 0)) {
      errors.push(`"${env}" environment eşleşmiyor`)
    }
  })
  
  return errors
}

/**
 * Yaygın sözdizimi hatalarını kontrol et
 */
function checkCommonErrors(latex: string): string[] {
  const errors: string[] = []
  
  // Boş frac
  if (/\\frac\s*\{\s*\}\s*\{/.test(latex)) {
    errors.push('Boş kesir payı tespit edildi')
  }
  if (/\\frac\s*\{[^}]*\}\s*\{\s*\}/.test(latex)) {
    errors.push('Boş kesir paydası tespit edildi')
  }
  
  // Çift üst/alt simge
  if (/\^[^{]\^/.test(latex) || /\^\{[^}]*\}\^/.test(latex)) {
    errors.push('Çift üst simge tespit edildi')
  }
  if (/_[^{]_/.test(latex) || /_\{[^}]*\}_/.test(latex)) {
    errors.push('Çift alt simge tespit edildi')
  }
  
  // Geçersiz komut karakterleri
  if (/\\[0-9]/.test(latex)) {
    errors.push('Sayı ile başlayan komut tespit edildi')
  }
  
  return errors
}

/**
 * Desteklenmeyen komutları kontrol et (KaTeX için)
 */
function checkUnsupportedCommands(latex: string): string[] {
  const errors: string[] = []
  
  // KaTeX'te desteklenmeyen bazı komutlar
  const unsupported = [
    '\\def',
    '\\newcommand',
    '\\renewcommand',
    '\\DeclareMathOperator',
    '\\usepackage',
    '\\input',
    '\\include',
  ]
  
  unsupported.forEach(cmd => {
    if (latex.includes(cmd)) {
      errors.push(`Desteklenmeyen komut: ${cmd}`)
    }
  })
  
  return errors
}

/**
 * Ana validasyon fonksiyonu
 */
export function validateLatex(latex: string): ValidationResult {
  if (!latex || typeof latex !== 'string') {
    return { isValid: true, errors: [] }
  }
  
  const errors: string[] = []
  
  // 1. Parantez kontrolü
  errors.push(...checkBraceBalance(latex))
  
  // 2. Environment kontrolü
  errors.push(...checkEnvironments(latex))
  
  // 3. Yaygın hatalar
  errors.push(...checkCommonErrors(latex))
  
  // 4. Desteklenmeyen komutlar
  errors.push(...checkUnsupportedCommands(latex))
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Basit boolean validasyon
 */
export function isValidLatex(latex: string): boolean {
  return validateLatex(latex).isValid
}
