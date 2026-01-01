/**
 * PDF Generator - Soru Bankası PDF Oluşturma
 * 
 * Client-side print dialog kullanır
 * LaTeX render için KaTeX kullanır
 */

import { QuestionForPDF, ParsedRequest } from './types'

/**
 * LaTeX ifadelerini KaTeX için hazırla
 * $...$ ve $$...$$ formatlarını <span class="math">...</span> ile wrap et
 */
function renderLatex(text: string): string {
  if (!text) return ''
  
  // LaTeX bloklarını geçici olarak sakla
  const mathBlocks: { placeholder: string; content: string; display: boolean }[] = []
  let result = text
  let counter = 0
  
  // Display math: $$...$$
  result = result.replace(/\$\$([\s\S]*?)\$\$/g, (_, latex) => {
    const placeholder = `@@MATH_DISPLAY_${counter++}@@`
    mathBlocks.push({ placeholder, content: latex, display: true })
    return placeholder
  })
  
  // Inline math: $...$
  result = result.replace(/\$(.*?)\$/g, (_, latex) => {
    const placeholder = `@@MATH_INLINE_${counter++}@@`
    mathBlocks.push({ placeholder, content: latex, display: false })
    return placeholder
  })
  
  // \[ ... \] format
  result = result.replace(/\\\[([\s\S]*?)\\\]/g, (_, latex) => {
    const placeholder = `@@MATH_DISPLAY_${counter++}@@`
    mathBlocks.push({ placeholder, content: latex, display: true })
    return placeholder
  })
  
  // \( ... \) format
  result = result.replace(/\\\((.*?)\\\)/g, (_, latex) => {
    const placeholder = `@@MATH_INLINE_${counter++}@@`
    mathBlocks.push({ placeholder, content: latex, display: false })
    return placeholder
  })
  
  // Metin kısmını escape et
  result = escapeHtml(result)
  
  // LaTeX bloklarını geri koy
  for (const block of mathBlocks) {
    const className = block.display ? 'math display' : 'math inline'
    result = result.replace(block.placeholder, `<span class="${className}">${block.content}</span>`)
  }
  
  return result
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

/**
 * PDF için HTML template oluştur
 */
export function generatePDFHtml(
  questions: QuestionForPDF[],
  parsed: ParsedRequest,
  title: string,
  userName: string
): string {
  const date = new Date().toLocaleDateString('tr-TR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  })
  
  // Zorluk adı
  const difficultyNames: Record<string, string> = {
    easy: 'Kolay',
    medium: 'Orta',
    hard: 'Zor',
    mixed: 'Karışık'
  }
  const difficultyName = parsed.difficulty ? difficultyNames[parsed.difficulty] : 'Karışık'
  
  // Sınıf/Sınav bilgisi
  const gradeInfo = parsed.exam_type 
    ? parsed.exam_type 
    : parsed.grade 
      ? `${parsed.grade}. Sınıf` 
      : ''
  
  // Kısa başlık (sayfa header için)
  const shortTitle = `${gradeInfo} ${parsed.subject_name || ''} ${parsed.topic || ''}`.trim()
  
  // Sorular HTML
  const questionsHtml = questions.map((q, index) => {
    const questionText = renderLatex(q.question_text)
    const imageHtml = q.question_image_url 
      ? `<div class="question-image"><img src="${q.question_image_url}" alt="Soru görseli" /></div>`
      : ''
    
    return `
      <div class="question">
        <div class="question-header">
          <span class="question-number">Soru ${index + 1}</span>
        </div>
        <div class="question-text">${questionText}</div>
        ${imageHtml}
        <div class="options">
          <div class="option"><span class="option-letter">A)</span> ${renderLatex(q.option_a)}</div>
          <div class="option"><span class="option-letter">B)</span> ${renderLatex(q.option_b)}</div>
          <div class="option"><span class="option-letter">C)</span> ${renderLatex(q.option_c)}</div>
          <div class="option"><span class="option-letter">D)</span> ${renderLatex(q.option_d)}</div>
          ${q.option_e ? `<div class="option"><span class="option-letter">E)</span> ${renderLatex(q.option_e)}</div>` : ''}
        </div>
      </div>
    `
  }).join('')
  
  return `
<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <!-- KaTeX CSS -->
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif;
      font-size: 11pt;
      line-height: 1.6;
      color: #1f2937;
      background: white;
    }
    
    /* KAPAK SAYFASI */
    .cover {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      text-align: center;
      padding: 40px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      page-break-after: always;
    }
    
    .cover-logo {
      font-size: 64px;
      margin-bottom: 20px;
    }
    
    .cover-brand {
      font-size: 42px;
      font-weight: 800;
      letter-spacing: 4px;
      margin-bottom: 40px;
      text-shadow: 2px 2px 4px rgba(0,0,0,0.2);
    }
    
    .cover-main-title {
      font-size: 28px;
      font-weight: 700;
      margin-bottom: 10px;
      text-transform: uppercase;
      letter-spacing: 2px;
    }
    
    .cover-subtitle {
      font-size: 22px;
      font-weight: 600;
      margin-bottom: 15px;
      opacity: 0.95;
    }
    
    .cover-topic {
      font-size: 18px;
      opacity: 0.9;
      margin-bottom: 50px;
      padding: 10px 30px;
      border: 2px solid rgba(255,255,255,0.5);
      border-radius: 30px;
    }
    
    .cover-stats {
      display: flex;
      gap: 50px;
      margin: 40px 0;
    }
    
    .cover-stat {
      text-align: center;
    }
    
    .cover-stat-value {
      font-size: 36px;
      font-weight: 700;
    }
    
    .cover-stat-label {
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 1px;
      opacity: 0.8;
    }
    
    .cover-footer {
      margin-top: 60px;
      font-size: 12px;
      opacity: 0.7;
    }
    
    .cover-footer div {
      margin: 5px 0;
    }
    
    /* SORULAR BÖLÜMÜ */
    .questions-container {
      padding: 30px 40px;
    }
    
    .section-header {
      text-align: center;
      padding: 20px 0 30px;
      border-bottom: 3px solid #667eea;
      margin-bottom: 30px;
    }
    
    .section-title {
      font-size: 20px;
      font-weight: 700;
      color: #667eea;
      text-transform: uppercase;
      letter-spacing: 2px;
    }
    
    .section-subtitle {
      font-size: 14px;
      color: #6b7280;
      margin-top: 5px;
    }
    
    .question {
      margin-bottom: 30px;
      padding: 20px;
      background: #f9fafb;
      border-radius: 12px;
      border-left: 4px solid #667eea;
      page-break-inside: avoid;
    }
    
    .question-header {
      margin-bottom: 12px;
    }
    
    .question-number {
      display: inline-block;
      background: #667eea;
      color: white;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
    }
    
    .question-text {
      font-size: 12pt;
      line-height: 1.7;
      color: #1f2937;
      margin-bottom: 15px;
    }
    
    .question-image {
      margin: 15px 0;
      text-align: center;
    }
    
    .question-image img {
      max-width: 80%;
      max-height: 200px;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    
    .options {
      display: grid;
      gap: 10px;
      margin-top: 15px;
    }
    
    .option {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      padding: 10px 15px;
      background: white;
      border-radius: 8px;
      border: 1px solid #e5e7eb;
    }
    
    .option-letter {
      font-weight: 700;
      color: #667eea;
      min-width: 25px;
    }
    
    /* CEVAP ANAHTARI */
    .answer-key {
      padding: 40px;
      page-break-before: always;
    }
    
    .answer-key-header {
      text-align: center;
      margin-bottom: 40px;
    }
    
    .answer-key-title {
      font-size: 24px;
      font-weight: 700;
      color: #667eea;
      text-transform: uppercase;
      letter-spacing: 3px;
    }
    
    .answer-key-subtitle {
      font-size: 14px;
      color: #6b7280;
      margin-top: 10px;
    }
    
    .answer-grid {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 10px;
      max-width: 500px;
      margin: 0 auto;
    }
    
    .answer-item {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 12px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border-radius: 8px;
      font-weight: 600;
      font-size: 14px;
    }
    
    .answer-item span:first-child {
      opacity: 0.8;
      margin-right: 5px;
    }
    
    .pdf-footer {
      margin-top: 60px;
      text-align: center;
      padding-top: 30px;
      border-top: 2px solid #e5e7eb;
    }
    
    .pdf-footer-text {
      font-size: 11px;
      color: #9ca3af;
    }
    
    .pdf-footer-brand {
      font-size: 14px;
      font-weight: 600;
      color: #667eea;
      margin-top: 10px;
    }
    
    /* Math/LaTeX stilleri */
    .math {
      font-family: 'KaTeX_Main', 'Times New Roman', serif;
    }
    
    .math.display {
      display: block;
      text-align: center;
      margin: 10px 0;
    }
    
    @media print {
      body {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      
      .cover {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
        -webkit-print-color-adjust: exact !important;
      }
      
      .question {
        page-break-inside: avoid;
        background: #f9fafb !important;
      }
      
      .answer-item {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
      }
    }
    
    @page {
      size: A4;
      margin: 0;
    }
  </style>
</head>
<body>
  <!-- KAPAK -->
  <div class="cover">
    <div class="cover-logo">🎓</div>
    <div class="cover-brand">TEKNOKUL</div>
    <div class="cover-main-title">${gradeInfo} ${parsed.subject_name || ''}</div>
    <div class="cover-subtitle">SORU BANKASI</div>
    ${parsed.topic ? `<div class="cover-topic">${parsed.topic}</div>` : ''}
    
    <div class="cover-stats">
      <div class="cover-stat">
        <div class="cover-stat-value">${questions.length}</div>
        <div class="cover-stat-label">Soru</div>
      </div>
      <div class="cover-stat">
        <div class="cover-stat-value">${difficultyName}</div>
        <div class="cover-stat-label">Zorluk</div>
      </div>
    </div>
    
    <div class="cover-footer">
      <div>Hazırlayan: ${userName}</div>
      <div>${date}</div>
      <div style="margin-top: 15px; font-size: 14px; font-weight: 600;">teknokul.com.tr</div>
      <div style="margin-top: 8px; font-size: 12px;">📷 @sakirkocak</div>
    </div>
  </div>
  
  <!-- SORULAR -->
  <div class="questions-container">
    <div class="section-header">
      <div class="section-title">${shortTitle}</div>
      <div class="section-subtitle">${questions.length} Soru • ${difficultyName} Seviye</div>
    </div>
    
    ${questionsHtml}
  </div>
  
  <!-- CEVAP ANAHTARI -->
  <div class="answer-key">
    <div class="answer-key-header">
      <div class="answer-key-title">Cevap Anahtarı</div>
      <div class="answer-key-subtitle">${shortTitle}</div>
    </div>
    
    <div class="answer-grid">
      ${questions.map((q, i) => `
        <div class="answer-item">
          <span>${i + 1}.</span>
          <span>${q.correct_answer}</span>
        </div>
      `).join('')}
    </div>
    
    <div class="pdf-footer">
      <div class="pdf-footer-text" style="font-style: italic; margin-bottom: 10px;">
        "Bu soru bankası Şakir Koçak'ın tüm insanlara armağanıdır."
      </div>
      <div class="pdf-footer-brand">teknokul.com.tr</div>
      <div style="margin-top: 8px; font-size: 12px; color: #667eea;">
        📷 Instagram: @sakirkocak
      </div>
    </div>
  </div>
  <!-- KaTeX JS -->
  <script src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js"></script>
  <script>
    // LaTeX render
    document.addEventListener('DOMContentLoaded', function() {
      document.querySelectorAll('.math').forEach(function(el) {
        try {
          var displayMode = el.classList.contains('display');
          var tex = el.textContent;
          katex.render(tex, el, {
            throwOnError: false,
            displayMode: displayMode
          });
        } catch (e) {
          console.error('KaTeX error:', e);
        }
      });
    });
  </script>
</body>
</html>
  `
}

/**
 * PDF dosya adı oluştur
 */
export function generatePDFFilename(title: string): string {
  const safeName = title
    .toLowerCase()
    .replace(/ı/g, 'i')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
  
  return `${safeName}.pdf`
}
