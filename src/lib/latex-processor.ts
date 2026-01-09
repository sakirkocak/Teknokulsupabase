/**
 * Gemini'nin ürettiği metinlerdeki LaTeX sorunlarını düzelten post-processor
 * Bu dosya MathRenderer'dan ÖNCE çalışır - ham metni temizler
 */

// Backslash'sız LaTeX komutlarını düzelt
const LATEX_FIXES: [RegExp, string][] = [
  // Oklar - EN ÖNEMLİ (tüm varyasyonlar)
  [/\\?rightarrow/gi, '→'],
  [/\\?leftarrow/gi, '←'],
  [/\\?Rightarrow/g, '⇒'],
  [/\\?Leftarrow/g, '⇐'],
  [/\\?longrightarrow/gi, '⟶'],
  [/\\?longleftarrow/gi, '⟵'],
  [/\bto\b(?=\s*\d|\s*[a-z])/gi, '→'],  // "to 5" -> "→ 5"
  [/\s*->\s*/g, ' → '],  // -> işaretini de düzelt
  
  // Karşılaştırma operatörleri
  [/\bleq\b/gi, '≤'],
  [/\bgeq\b/gi, '≥'],
  [/\bneq\b/gi, '≠'],
  [/\bapprox\b/gi, '≈'],
  [/\bequiv\b/gi, '≡'],
  
  // Matematiksel operatörler
  [/\btimes\b/gi, '×'],
  [/\bdiv\b/gi, '÷'],
  [/\bpm\b/gi, '±'],
  [/\bcdot\b/gi, '·'],
  
  // Özel semboller
  [/\binfty\b/gi, '∞'],
  [/\bsum\b/gi, '∑'],
  [/\bprod\b/gi, '∏'],
  [/\bsqrt\b/gi, '√'],
  
  // Yunan harfleri
  [/\balpha\b/gi, 'α'],
  [/\bbeta\b/gi, 'β'],
  [/\bgamma\b/gi, 'γ'],
  [/\bdelta\b/gi, 'δ'],
  [/\btheta\b/gi, 'θ'],
  [/\blambda\b/gi, 'λ'],
  [/\bpi\b/gi, 'π'],
  [/\bsigma\b/gi, 'σ'],
  [/\bomega\b/gi, 'ω'],
  
  // Markdown bold/italic düzeltme - ** ve * işaretlerini temizle
  [/\*\*([^*]+)\*\*/g, '$1'],  // **bold** -> bold
  [/\*([^*]+)\*/g, '$1'],      // *italic* -> italic
]

/**
 * Tek bir metin string'ini işler
 */
export function processLatexText(text: string): string {
  if (!text || typeof text !== 'string') return text || ''
  
  let result = text
  
  // Tüm düzeltmeleri uygula
  for (const [pattern, replacement] of LATEX_FIXES) {
    result = result.replace(pattern, replacement)
  }
  
  // $...$ içindeki komutları da düzelt
  result = result.replace(/\$([^$]+)\$/g, (match, inner) => {
    let fixed = inner
    // $ içinde backslash'sız komutları düzelt
    fixed = fixed.replace(/rightarrow/gi, '\\rightarrow')
    fixed = fixed.replace(/leftarrow/gi, '\\leftarrow')
    fixed = fixed.replace(/times/gi, '\\times')
    fixed = fixed.replace(/div/gi, '\\div')
    fixed = fixed.replace(/leq/gi, '\\leq')
    fixed = fixed.replace(/geq/gi, '\\geq')
    fixed = fixed.replace(/neq/gi, '\\neq')
    fixed = fixed.replace(/sqrt/gi, '\\sqrt')
    fixed = fixed.replace(/frac/gi, '\\frac')
    return `$${fixed}$`
  })
  
  return result
}

/**
 * Tüm solution JSON'ını recursive olarak işler
 * Gemini'den gelen çıktıyı kaydetmeden önce çağır
 */
export function processLatexInSolution(solution: any): any {
  if (!solution) return solution
  
  if (typeof solution === 'string') {
    return processLatexText(solution)
  }
  
  if (Array.isArray(solution)) {
    return solution.map(item => processLatexInSolution(item))
  }
  
  if (typeof solution === 'object') {
    const processed: any = {}
    for (const [key, value] of Object.entries(solution)) {
      // Metin içeren alanları işle
      if (['content', 'tts_text', 'title', 'question', 'text', 'hint', 
           'explanation_correct', 'explanation_wrong', 'summary',
           'question_summary', 'left_side', 'right_side', 'label'].includes(key)) {
        processed[key] = processLatexText(value as string)
      } else {
        processed[key] = processLatexInSolution(value)
      }
    }
    return processed
  }
  
  return solution
}

/**
 * Animasyon data'sını validate ve düzelt
 * Boş veya hatalı data'ları default değerlerle doldurur
 */
export function validateAnimationData(template: string, data: any): any {
  if (!data) data = {}
  
  switch (template) {
    case 'equation_balance':
      return {
        left_side: data.left_side || '?',
        right_side: data.right_side || '?',
        steps: Array.isArray(data.steps) ? data.steps : []
      }
    
    case 'number_line':
      return {
        min: data.min ?? -10,
        max: data.max ?? 10,
        points: Array.isArray(data.points) ? data.points : [],
        highlight_range: data.highlight_range || null
      }
    
    case 'pie_chart':
      return {
        total: data.total || 100,
        segments: Array.isArray(data.segments) ? data.segments : [
          { label: 'A', value: 50, color: '#6366f1' },
          { label: 'B', value: 50, color: '#10b981' }
        ],
        highlight_segment: data.highlight_segment ?? null
      }
    
    case 'bar_chart':
    case 'bar_graph':
      return {
        bars: Array.isArray(data.bars) ? data.bars : [],
        max_value: data.max_value || 100,
        highlight_bar: data.highlight_bar ?? null
      }
    
    case 'geometry_shape':
      return {
        shape: data.shape || 'triangle',
        vertices: Array.isArray(data.vertices) ? data.vertices : [
          { x: 50, y: 150 }, { x: 150, y: 50 }, { x: 250, y: 150 }
        ],
        labels: data.labels || {},
        measurements: data.measurements || {}
      }
    
    case 'coordinate_plane':
      return {
        x_range: data.x_range || [-5, 5],
        y_range: data.y_range || [-5, 5],
        points: Array.isArray(data.points) ? data.points : [],
        lines: Array.isArray(data.lines) ? data.lines : []
      }
    
    case 'step_by_step':
      // steps array veya object array olabilir
      let steps = data.steps || []
      if (!Array.isArray(steps)) steps = []
      return {
        steps: steps.map((s: any) => typeof s === 'string' ? { text: s } : s),
        current_step: data.current_step || 0
      }
    
    case 'text_reveal':
      return {
        text: data.text || '?',
        style: data.style || 'info',
        icon: data.icon || '💡',
        celebration: data.celebration || false
      }
    
    default:
      return data
  }
}
