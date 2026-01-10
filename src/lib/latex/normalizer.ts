/**
 * LaTeX Normalizer
 * Backslash'sız komutları düzeltir, tutarsızlıkları giderir
 */

/**
 * Backslash'sız LaTeX komutlarını düzelt
 * Gemini bazen "times" yerine "\times" yazmıyor
 */
export function fixBackslashCommands(text: string): string {
  if (!text) return ''
  
  return text
    // ============ MATEMATİKSEL OPERATÖRLER ============
    // times (çarpı)
    .replace(/\btimes(\d)/gi, '\\times $1')
    .replace(/\btimes\b/gi, '\\times')
    // div (bölü)
    .replace(/\bdiv(\d)/gi, '\\div $1')
    .replace(/\bdiv\b/gi, '\\div')
    // cdot (nokta çarpı)
    .replace(/\bcdot\b/gi, '\\cdot')
    // pm (artı eksi)
    .replace(/\bpm\b/gi, '\\pm')
    // mp (eksi artı)
    .replace(/\bmp\b/gi, '\\mp')
    
    // ============ KARŞILAŞTIRMA OPERATÖRLERİ ============
    .replace(/\bleq\b/gi, '\\leq')
    .replace(/\bgeq\b/gi, '\\geq')
    .replace(/\bneq\b/gi, '\\neq')
    .replace(/\bapprox\b/gi, '\\approx')
    .replace(/\bequiv\b/gi, '\\equiv')
    .replace(/\bsim\b/gi, '\\sim')
    
    // ============ OKLAR ============
    .replace(/\brightarrow\b/gi, '\\rightarrow')
    .replace(/\bleftarrow\b/gi, '\\leftarrow')
    .replace(/\bRightarrow\b/g, '\\Rightarrow')
    .replace(/\bLeftarrow\b/g, '\\Leftarrow')
    .replace(/\blongrightarrow\b/gi, '\\longrightarrow')
    .replace(/\blongleftarrow\b/gi, '\\longleftarrow')
    .replace(/\bto\b/gi, '\\to')
    // -> işaretini ok sembolüne çevir ($ dışında)
    .replace(/\s*->\s*/g, ' \\to ')
    
    // ============ MATEMATİKSEL FONKSİYONLAR ============
    .replace(/\bsqrt\b/gi, '\\sqrt')
    .replace(/\bfrac\b/gi, '\\frac')
    .replace(/\bsum\b/gi, '\\sum')
    .replace(/\bprod\b/gi, '\\prod')
    .replace(/\bint\b/gi, '\\int')
    .replace(/\blim\b/gi, '\\lim')
    .replace(/\binfty\b/gi, '\\infty')
    
    // ============ TRİGONOMETRİ ============
    .replace(/\bsin\b/gi, '\\sin')
    .replace(/\bcos\b/gi, '\\cos')
    .replace(/\btan\b/gi, '\\tan')
    .replace(/\bcot\b/gi, '\\cot')
    .replace(/\bsec\b/gi, '\\sec')
    .replace(/\bcsc\b/gi, '\\csc')
    .replace(/\barcsin\b/gi, '\\arcsin')
    .replace(/\barccos\b/gi, '\\arccos')
    .replace(/\barctan\b/gi, '\\arctan')
    
    // ============ LOGARİTMA ============
    .replace(/\blog\b/gi, '\\log')
    .replace(/\bln\b/gi, '\\ln')
    .replace(/\bexp\b/gi, '\\exp')
    
    // ============ YUNAN HARFLERİ ============
    .replace(/\balpha\b/gi, '\\alpha')
    .replace(/\bbeta\b/gi, '\\beta')
    .replace(/\bgamma\b/gi, '\\gamma')
    .replace(/\bdelta\b/gi, '\\delta')
    .replace(/\bepsilon\b/gi, '\\epsilon')
    .replace(/\bzeta\b/gi, '\\zeta')
    .replace(/\beta\b/gi, '\\eta')
    .replace(/\btheta\b/gi, '\\theta')
    .replace(/\biota\b/gi, '\\iota')
    .replace(/\bkappa\b/gi, '\\kappa')
    .replace(/\blambda\b/gi, '\\lambda')
    .replace(/\bmu\b/gi, '\\mu')
    .replace(/\bnu\b/gi, '\\nu')
    .replace(/\bxi\b/gi, '\\xi')
    .replace(/\bpi\b/gi, '\\pi')
    .replace(/\brho\b/gi, '\\rho')
    .replace(/\bsigma\b/gi, '\\sigma')
    .replace(/\btau\b/gi, '\\tau')
    .replace(/\bupsilon\b/gi, '\\upsilon')
    .replace(/\bphi\b/gi, '\\phi')
    .replace(/\bchi\b/gi, '\\chi')
    .replace(/\bpsi\b/gi, '\\psi')
    .replace(/\bomega\b/gi, '\\omega')
    
    // ============ KÜME TEORİSİ ============
    .replace(/\bforall\b/gi, '\\forall')
    .replace(/\bexists\b/gi, '\\exists')
    .replace(/\bin\b/gi, '\\in')
    .replace(/\bnotin\b/gi, '\\notin')
    .replace(/\bsubset\b/gi, '\\subset')
    .replace(/\bsupset\b/gi, '\\supset')
    .replace(/\bcup\b/gi, '\\cup')
    .replace(/\bcap\b/gi, '\\cap')
    .replace(/\bemptyset\b/gi, '\\emptyset')
    
    // ============ TABLO KOMUTLARI ============
    .replace(/\bbegin\{/gi, '\\begin{')
    .replace(/\bend\{/gi, '\\end{')
    .replace(/\bhline\b/gi, '\\hline')
    .replace(/\btextbf\{/gi, '\\textbf{')
    .replace(/\btext\{/gi, '\\text{')
    .replace(/\bmathrm\{/gi, '\\mathrm{')
}

/**
 * Tablo satır sonlarını düzelt
 */
function fixTableLineBreaks(text: string): string {
  return text
    // Tek backslash + boşluk + hline -> çift backslash + hline
    .replace(/\s*\\\s*\\hline/g, ' \\\\ \\hline')
    // Tek backslash satır sonu (tablo içinde) -> çift backslash
    .replace(/([^\\])\\\s+\\hline/g, '$1 \\\\ \\hline')
}

/**
 * Düz metin ok işaretlerini Unicode'a çevir
 */
function convertPlainTextArrows(text: string): string {
  return text
    // -> işareti ($ dışında)
    .replace(/(?<!\$[^$]*)\s*->\s*(?![^$]*\$)/g, ' → ')
    // => işareti
    .replace(/(?<!\$[^$]*)\s*=>\s*(?![^$]*\$)/g, ' ⇒ ')
    // <- işareti
    .replace(/(?<!\$[^$]*)\s*<-\s*(?![^$]*\$)/g, ' ← ')
}

/**
 * Ana normalize fonksiyonu
 */
export function normalizeLatex(latex: string): string {
  if (!latex || typeof latex !== 'string') return ''
  
  let normalized = latex
  
  // 1. Backslash'sız komutları düzelt
  normalized = fixBackslashCommands(normalized)
  
  // 2. Tablo satır sonlarını düzelt
  normalized = fixTableLineBreaks(normalized)
  
  // 3. Düz metin oklarını çevir
  normalized = convertPlainTextArrows(normalized)
  
  return normalized
}