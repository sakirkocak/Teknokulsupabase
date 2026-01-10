/**
 * LaTeX → Unicode Fallback
 * KaTeX render edemezse Unicode karakterlerle göster
 */

// LaTeX komut → Unicode karakter eşleştirmesi
const LATEX_TO_UNICODE: Record<string, string> = {
  // Yunan harfleri (küçük)
  '\\alpha': 'α',
  '\\beta': 'β',
  '\\gamma': 'γ',
  '\\delta': 'δ',
  '\\epsilon': 'ε',
  '\\varepsilon': 'ε',
  '\\zeta': 'ζ',
  '\\eta': 'η',
  '\\theta': 'θ',
  '\\vartheta': 'ϑ',
  '\\iota': 'ι',
  '\\kappa': 'κ',
  '\\lambda': 'λ',
  '\\mu': 'μ',
  '\\nu': 'ν',
  '\\xi': 'ξ',
  '\\pi': 'π',
  '\\varpi': 'ϖ',
  '\\rho': 'ρ',
  '\\varrho': 'ϱ',
  '\\sigma': 'σ',
  '\\varsigma': 'ς',
  '\\tau': 'τ',
  '\\upsilon': 'υ',
  '\\phi': 'φ',
  '\\varphi': 'ϕ',
  '\\chi': 'χ',
  '\\psi': 'ψ',
  '\\omega': 'ω',
  
  // Yunan harfleri (büyük)
  '\\Gamma': 'Γ',
  '\\Delta': 'Δ',
  '\\Theta': 'Θ',
  '\\Lambda': 'Λ',
  '\\Xi': 'Ξ',
  '\\Pi': 'Π',
  '\\Sigma': 'Σ',
  '\\Upsilon': 'Υ',
  '\\Phi': 'Φ',
  '\\Psi': 'Ψ',
  '\\Omega': 'Ω',
  
  // Operatörler
  '\\times': '×',
  '\\div': '÷',
  '\\cdot': '·',
  '\\pm': '±',
  '\\mp': '∓',
  '\\ast': '∗',
  '\\star': '⋆',
  '\\circ': '∘',
  '\\bullet': '•',
  
  // Karşılaştırma
  '\\leq': '≤',
  '\\le': '≤',
  '\\geq': '≥',
  '\\ge': '≥',
  '\\neq': '≠',
  '\\ne': '≠',
  '\\approx': '≈',
  '\\equiv': '≡',
  '\\sim': '∼',
  '\\simeq': '≃',
  '\\cong': '≅',
  '\\propto': '∝',
  '\\ll': '≪',
  '\\gg': '≫',
  
  // Oklar
  '\\rightarrow': '→',
  '\\to': '→',
  '\\leftarrow': '←',
  '\\gets': '←',
  '\\leftrightarrow': '↔',
  '\\Rightarrow': '⇒',
  '\\Leftarrow': '⇐',
  '\\Leftrightarrow': '⇔',
  '\\uparrow': '↑',
  '\\downarrow': '↓',
  '\\updownarrow': '↕',
  '\\mapsto': '↦',
  '\\longrightarrow': '⟶',
  '\\longleftarrow': '⟵',
  
  // Küme teorisi
  '\\in': '∈',
  '\\notin': '∉',
  '\\ni': '∋',
  '\\subset': '⊂',
  '\\supset': '⊃',
  '\\subseteq': '⊆',
  '\\supseteq': '⊇',
  '\\cup': '∪',
  '\\cap': '∩',
  '\\emptyset': '∅',
  '\\varnothing': '∅',
  
  // Mantık
  '\\forall': '∀',
  '\\exists': '∃',
  '\\nexists': '∄',
  '\\neg': '¬',
  '\\land': '∧',
  '\\lor': '∨',
  '\\wedge': '∧',
  '\\vee': '∨',
  
  // Diğer semboller
  '\\infty': '∞',
  '\\partial': '∂',
  '\\nabla': '∇',
  '\\sum': '∑',
  '\\prod': '∏',
  '\\int': '∫',
  '\\oint': '∮',
  '\\sqrt': '√',
  '\\angle': '∠',
  '\\triangle': '△',
  '\\square': '□',
  '\\diamond': '◇',
  '\\perp': '⊥',
  '\\parallel': '∥',
  '\\therefore': '∴',
  '\\because': '∵',
  '\\prime': '′',
  '\\degree': '°',
  
  // Özel karakterler
  '\\ldots': '…',
  '\\cdots': '⋯',
  '\\vdots': '⋮',
  '\\ddots': '⋱',
  '\\%': '%',
  '\\$': '$',
  '\\&': '&',
  '\\#': '#',
  '\\_': '_',
  '\\{': '{',
  '\\}': '}',
  '\\backslash': '\\',
  '\\quad': '  ',
  '\\qquad': '    ',
  '\\,': ' ',
  '\\;': ' ',
  '\\!': '',
  '~': ' ',
}

// Üst simge dönüşümleri
const SUPERSCRIPTS: Record<string, string> = {
  '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴',
  '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹',
  '+': '⁺', '-': '⁻', '=': '⁼', '(': '⁽', ')': '⁾',
  'n': 'ⁿ', 'i': 'ⁱ', 'x': 'ˣ', 'y': 'ʸ',
}

// Alt simge dönüşümleri
const SUBSCRIPTS: Record<string, string> = {
  '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄',
  '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉',
  '+': '₊', '-': '₋', '=': '₌', '(': '₍', ')': '₎',
  'a': 'ₐ', 'e': 'ₑ', 'o': 'ₒ', 'x': 'ₓ',
  'i': 'ᵢ', 'j': 'ⱼ', 'n': 'ₙ', 'm': 'ₘ',
}

/**
 * Üst simgeyi Unicode'a çevir
 */
function convertSuperscript(content: string): string {
  return content.split('').map(c => SUPERSCRIPTS[c] || c).join('')
}

/**
 * Alt simgeyi Unicode'a çevir
 */
function convertSubscript(content: string): string {
  return content.split('').map(c => SUBSCRIPTS[c] || c).join('')
}

/**
 * Kesiri Unicode'a çevir
 */
function convertFraction(numerator: string, denominator: string): string {
  // Basit kesirler için özel karakterler
  const fractions: Record<string, string> = {
    '1/2': '½', '1/3': '⅓', '2/3': '⅔',
    '1/4': '¼', '3/4': '¾', '1/5': '⅕',
    '2/5': '⅖', '3/5': '⅗', '4/5': '⅘',
    '1/6': '⅙', '5/6': '⅚', '1/8': '⅛',
    '3/8': '⅜', '5/8': '⅝', '7/8': '⅞',
  }
  
  const key = `${numerator.trim()}/${denominator.trim()}`
  if (fractions[key]) return fractions[key]
  
  return `(${numerator}/${denominator})`
}

/**
 * Ana dönüşüm fonksiyonu
 */
export function latexToUnicode(latex: string): string {
  if (!latex || typeof latex !== 'string') return ''
  
  let result = latex
  
  // 1. Basit komut dönüşümleri
  Object.entries(LATEX_TO_UNICODE).forEach(([cmd, unicode]) => {
    // Escape regex special characters
    const escaped = cmd.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    result = result.replace(new RegExp(escaped + '(?![a-zA-Z])', 'g'), unicode)
  })
  
  // 2. Üst simgeler: ^{...} veya ^x
  result = result.replace(/\^{([^}]+)}/g, (_, content) => convertSuperscript(content))
  result = result.replace(/\^([0-9a-zA-Z])/g, (_, char) => convertSuperscript(char))
  
  // 3. Alt simgeler: _{...} veya _x
  result = result.replace(/_{([^}]+)}/g, (_, content) => convertSubscript(content))
  result = result.replace(/_([0-9a-zA-Z])/g, (_, char) => convertSubscript(char))
  
  // 4. Kesirler: \frac{a}{b}
  result = result.replace(/\\frac{([^}]*)}{([^}]*)}/g, (_, num, den) => 
    convertFraction(num, den)
  )
  
  // 5. Karekök: \sqrt{...} veya \sqrt[n]{...}
  result = result.replace(/\\sqrt\[([^\]]+)\]{([^}]+)}/g, (_, n, content) => 
    `${convertSuperscript(n)}√(${content})`
  )
  result = result.replace(/\\sqrt{([^}]+)}/g, (_, content) => `√(${content})`)
  
  // 6. Text komutları: \text{...}, \textbf{...}, etc.
  result = result.replace(/\\text{([^}]*)}/g, '$1')
  result = result.replace(/\\textbf{([^}]*)}/g, '$1')
  result = result.replace(/\\textit{([^}]*)}/g, '$1')
  result = result.replace(/\\mathrm{([^}]*)}/g, '$1')
  
  // 7. Kalan backslash komutlarını temizle
  result = result.replace(/\\[a-zA-Z]+/g, '')
  
  // 8. Gereksiz boşlukları temizle
  result = result.replace(/\s+/g, ' ').trim()
  
  return result
}

/**
 * LaTeX'i düz metne çevir (daha agresif temizlik)
 */
export function latexToPlainText(latex: string): string {
  if (!latex || typeof latex !== 'string') return ''
  
  let result = latexToUnicode(latex)
  
  // Kalan özel karakterleri kaldır
  result = result.replace(/[{}[\]]/g, '')
  
  // Çoklu boşlukları tek boşluğa indir
  result = result.replace(/\s+/g, ' ').trim()
  
  return result
}
