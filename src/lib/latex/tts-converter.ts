/**
 * LaTeX → TTS Converter
 * LaTeX'i sesli okumaya uygun metne çevirir
 */

// LaTeX komut → Türkçe okunuş
const LATEX_TO_SPEECH: Record<string, string> = {
  // Yunan harfleri
  '\\alpha': 'alfa',
  '\\beta': 'beta',
  '\\gamma': 'gama',
  '\\delta': 'delta',
  '\\epsilon': 'epsilon',
  '\\zeta': 'zeta',
  '\\eta': 'eta',
  '\\theta': 'teta',
  '\\iota': 'iota',
  '\\kappa': 'kapa',
  '\\lambda': 'lambda',
  '\\mu': 'mü',
  '\\nu': 'nü',
  '\\xi': 'ksi',
  '\\pi': 'pi',
  '\\rho': 'ro',
  '\\sigma': 'sigma',
  '\\tau': 'tau',
  '\\upsilon': 'ipsilon',
  '\\phi': 'fi',
  '\\chi': 'ki',
  '\\psi': 'psi',
  '\\omega': 'omega',
  
  // Büyük Yunan harfleri
  '\\Gamma': 'büyük gama',
  '\\Delta': 'büyük delta',
  '\\Theta': 'büyük teta',
  '\\Lambda': 'büyük lambda',
  '\\Xi': 'büyük ksi',
  '\\Pi': 'büyük pi',
  '\\Sigma': 'büyük sigma',
  '\\Phi': 'büyük fi',
  '\\Psi': 'büyük psi',
  '\\Omega': 'büyük omega',
  
  // Operatörler
  '\\times': 'çarpı',
  '\\cdot': 'çarpı',
  '\\div': 'bölü',
  '\\pm': 'artı eksi',
  '\\mp': 'eksi artı',
  
  // Karşılaştırma
  '\\leq': 'küçük eşit',
  '\\le': 'küçük eşit',
  '\\geq': 'büyük eşit',
  '\\ge': 'büyük eşit',
  '\\neq': 'eşit değil',
  '\\ne': 'eşit değil',
  '\\approx': 'yaklaşık eşit',
  '\\equiv': 'denk',
  '\\sim': 'benzer',
  
  // Oklar
  '\\rightarrow': 'sağ ok',
  '\\to': 'ok',
  '\\leftarrow': 'sol ok',
  '\\Rightarrow': 'çift sağ ok',
  '\\Leftarrow': 'çift sol ok',
  '\\leftrightarrow': 'çift yönlü ok',
  '\\mapsto': 'eşlenir',
  
  // Küme
  '\\in': 'elemanıdır',
  '\\notin': 'elemanı değildir',
  '\\subset': 'alt kümesidir',
  '\\supset': 'üst kümesidir',
  '\\cup': 'birleşim',
  '\\cap': 'kesişim',
  '\\emptyset': 'boş küme',
  
  // Mantık
  '\\forall': 'her',
  '\\exists': 'vardır',
  '\\neg': 'değil',
  '\\land': 've',
  '\\lor': 'veya',
  
  // Diğer
  '\\infty': 'sonsuz',
  '\\partial': 'kısmi türev',
  '\\nabla': 'nabla',
  '\\sum': 'toplam',
  '\\prod': 'çarpım',
  '\\int': 'integral',
  '\\sqrt': 'karekök',
  '\\angle': 'açı',
  '\\triangle': 'üçgen',
  '\\perp': 'dik',
  '\\parallel': 'paralel',
  '\\prime': 'üssü',
  '\\degree': 'derece',
  
  // Trigonometri
  '\\sin': 'sinüs',
  '\\cos': 'kosinüs',
  '\\tan': 'tanjant',
  '\\cot': 'kotanjant',
  '\\sec': 'sekant',
  '\\csc': 'kosekant',
  '\\arcsin': 'ark sinüs',
  '\\arccos': 'ark kosinüs',
  '\\arctan': 'ark tanjant',
  
  // Logaritma
  '\\log': 'logaritma',
  '\\ln': 'doğal logaritma',
  '\\exp': 'üstel',
  '\\lim': 'limit',
}

/**
 * Üst simgeyi sesli metne çevir
 */
function superscriptToSpeech(content: string): string {
  // Sayılar için
  if (/^-?\d+$/.test(content.trim())) {
    const num = content.trim()
    if (num === '2') return 'kare'
    if (num === '3') return 'küp'
    if (num === '-1') return 'eksi bir üssü'
    return `üssü ${num}`
  }
  
  // Değişkenler için
  return `üssü ${content}`
}

/**
 * Alt simgeyi sesli metne çevir
 */
function subscriptToSpeech(content: string): string {
  return `alt ${content}`
}

/**
 * Kesiri sesli metne çevir
 */
function fractionToSpeech(numerator: string, denominator: string): string {
  const num = numerator.trim()
  const den = denominator.trim()
  
  // Basit kesirler
  if (num === '1' && den === '2') return 'yarım'
  if (num === '1' && den === '3') return 'üçte bir'
  if (num === '1' && den === '4') return 'dörtte bir'
  
  return `${num} bölü ${den}`
}

/**
 * Ana TTS dönüşüm fonksiyonu
 */
export function latexToTTS(latex: string): string {
  if (!latex || typeof latex !== 'string') return ''
  
  let result = latex
  
  // 1. Kesirler: \frac{a}{b}
  result = result.replace(/\\frac{([^}]*)}{([^}]*)}/g, (_, num, den) => 
    ` ${fractionToSpeech(num, den)} `
  )
  
  // 2. Karekök: \sqrt{...} veya \sqrt[n]{...}
  result = result.replace(/\\sqrt\[([^\]]+)\]{([^}]+)}/g, (_, n, content) => 
    ` ${n}. dereceden kök ${content} `
  )
  result = result.replace(/\\sqrt{([^}]+)}/g, (_, content) => ` karekök ${content} `)
  
  // 3. Üst simgeler: ^{...} veya ^x
  result = result.replace(/\^{([^}]+)}/g, (_, content) => ` ${superscriptToSpeech(content)} `)
  result = result.replace(/\^([0-9a-zA-Z])/g, (_, char) => ` ${superscriptToSpeech(char)} `)
  
  // 4. Alt simgeler: _{...} veya _x
  result = result.replace(/_{([^}]+)}/g, (_, content) => ` ${subscriptToSpeech(content)} `)
  result = result.replace(/_([0-9a-zA-Z])/g, (_, char) => ` ${subscriptToSpeech(char)} `)
  
  // 5. LaTeX komutlarını Türkçe'ye çevir
  Object.entries(LATEX_TO_SPEECH).forEach(([cmd, speech]) => {
    const escaped = cmd.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    result = result.replace(new RegExp(escaped + '(?![a-zA-Z])', 'g'), ` ${speech} `)
  })
  
  // 6. Text komutları
  result = result.replace(/\\text{([^}]*)}/g, ' $1 ')
  result = result.replace(/\\textbf{([^}]*)}/g, ' $1 ')
  result = result.replace(/\\mathrm{([^}]*)}/g, ' $1 ')
  
  // 7. Matematiksel sembolleri Türkçe'ye çevir
  result = result.replace(/\+/g, ' artı ')
  result = result.replace(/-/g, ' eksi ')
  result = result.replace(/=/g, ' eşittir ')
  result = result.replace(/</g, ' küçüktür ')
  result = result.replace(/>/g, ' büyüktür ')
  result = result.replace(/\(/g, ' parantez aç ')
  result = result.replace(/\)/g, ' parantez kapa ')
  result = result.replace(/\[/g, ' köşeli parantez aç ')
  result = result.replace(/\]/g, ' köşeli parantez kapa ')
  
  // 8. Kalan backslash komutlarını kaldır
  result = result.replace(/\\[a-zA-Z]+/g, '')
  
  // 9. Özel karakterleri temizle
  result = result.replace(/[{}[\]\\|]/g, ' ')
  
  // 10. Çoklu boşlukları düzelt
  result = result.replace(/\s+/g, ' ').trim()
  
  return result
}

/**
 * Kısa versiyon - sadece temel dönüşümler
 */
export function latexToSpeakableText(latex: string): string {
  if (!latex || typeof latex !== 'string') return ''
  
  let result = latex
  
  // Basit dönüşümler
  result = result.replace(/\\frac{([^}]*)}{([^}]*)}/g, '$1 bölü $2')
  result = result.replace(/\\sqrt{([^}]+)}/g, 'karekök $1')
  result = result.replace(/\^{?(\d+)}?/g, ' üssü $1')
  result = result.replace(/_{?(\d+)}?/g, ' alt $1')
  
  // Temel komutlar
  result = result.replace(/\\times/g, ' çarpı ')
  result = result.replace(/\\div/g, ' bölü ')
  result = result.replace(/\\pm/g, ' artı eksi ')
  result = result.replace(/\\pi/g, ' pi ')
  result = result.replace(/\\infty/g, ' sonsuz ')
  
  // Temizlik
  result = result.replace(/\\[a-zA-Z]+/g, '')
  result = result.replace(/[{}[\]\\]/g, '')
  result = result.replace(/\s+/g, ' ').trim()
  
  return result
}
