// =====================================================
// DENEME DUNYASI - Soru Kagidi PDF
// Client-side HTML template → window.print() yaklasimi
// =====================================================

import { ExamQuestionForClient, MockExam } from './types'
import { EXAM_TYPE_LABELS, EXAM_CONFIGS, SUBJECT_DISPLAY_NAMES } from './constants'

// =====================================================
// YARDIMCI FONKSIYONLAR
// =====================================================

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/**
 * LaTeX ifadelerini KaTeX icin hazirla
 */
function renderLatex(text: string): string {
  if (!text) return ''

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

  // Metin kismini escape et
  result = escapeHtml(result)

  // LaTeX bloklarini geri koy
  for (const block of mathBlocks) {
    const className = block.display ? 'math display' : 'math inline'
    result = result.replace(block.placeholder, `<span class="${className}">${block.content}</span>`)
  }

  return result
}

function getSubjectDisplayName(code: string): string {
  return SUBJECT_DISPLAY_NAMES[code] || code.replace(/_/g, ' ')
}

/**
 * SVG watermark pattern data URI olustur
 * Her 300x200 kutuda diyagonal "teknokul.com.tr" yazar
 */
function getWatermarkSvgDataUri(): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200"><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" transform="rotate(-30 150 100)" font-family="Arial,sans-serif" font-size="14" font-weight="700" fill="%23f97316" opacity="0.09" letter-spacing="2">teknokul.com.tr</text></svg>`
  return `data:image/svg+xml,${svg}`
}

// =====================================================
// SORU KAGIDI HTML OLUSTUR
// =====================================================

/**
 * Deneme sinavi soru kagidi icin HTML olustur
 * correct_answer YOKTUR - guvenli
 */
export function generateExamPaperHtml(
  exam: MockExam,
  questions: ExamQuestionForClient[],
  subjectGroups: Record<string, ExamQuestionForClient[]>
): string {
  const date = new Date().toLocaleDateString('tr-TR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })

  const config = EXAM_CONFIGS[exam.exam_type]
  const examTypeLabel = EXAM_TYPE_LABELS[exam.exam_type] || exam.exam_type
  const totalQuestions = questions.length

  // Ders bazli soru HTML'leri
  const subjectSections = renderSubjectSections(subjectGroups)

  // Optik form
  const opticalForm = renderOpticalForm(totalQuestions)

  const watermarkBg = getWatermarkSvgDataUri()

  return `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <title>${escapeHtml(exam.title)} - Soru Kagidi</title>
  <!-- KaTeX CSS -->
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif;
      font-size: 9pt;
      line-height: 1.35;
      color: #1f2937;
      background: white;
      background-image: url("${watermarkBg}");
      background-repeat: repeat;
    }

    @page {
      size: A4;
      margin: 10mm 12mm 12mm 12mm;
    }

    /* KAPAK */
    .cover {
      text-align: center;
      padding: 50px 30px 40px;
      page-break-after: always;
      background: white;
    }

    .cover-brand {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 40px;
    }

    .cover-brand-icon {
      width: 48px;
      height: 48px;
      background: #f97316;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: 800;
      font-size: 22px;
    }

    .cover-brand-text {
      font-size: 32px;
      font-weight: 800;
      color: #f97316;
      letter-spacing: 2px;
    }

    .cover-exam-title {
      font-size: 24px;
      font-weight: 800;
      color: #1f2937;
      margin-bottom: 6px;
    }

    .cover-subtitle {
      font-size: 14px;
      color: #6b7280;
      margin-bottom: 40px;
    }

    .cover-info-grid {
      display: flex;
      justify-content: center;
      gap: 40px;
      margin-bottom: 50px;
    }

    .cover-info-item { text-align: center; }

    .cover-info-value {
      font-size: 28px;
      font-weight: 800;
      color: #f97316;
    }

    .cover-info-label {
      font-size: 11px;
      color: #9ca3af;
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    .cover-name-box {
      max-width: 400px;
      margin: 0 auto;
      border: 2px solid #e5e7eb;
      border-radius: 12px;
      padding: 16px 24px;
    }

    .cover-name-label {
      font-size: 11px;
      color: #9ca3af;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 8px;
    }

    .cover-name-line {
      border-bottom: 1px dashed #d1d5db;
      height: 28px;
    }

    .cover-date {
      margin-top: 30px;
      font-size: 12px;
      color: #9ca3af;
    }

    /* DERS BOLUMU */
    .subject-section {
      margin-bottom: 4px;
    }

    .subject-header {
      background: #f3f4f6;
      padding: 4px 14px;
      margin: 0 0 6px 0;
      border-left: 4px solid #f97316;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .subject-title {
      font-size: 10px;
      font-weight: 700;
      color: #1f2937;
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    .subject-count {
      font-size: 9px;
      color: #6b7280;
    }

    /* SORU - KOMPAKT */
    .question {
      margin-bottom: 8px;
      padding: 5px 10px;
      border-left: 2px solid #d1d5db;
      page-break-inside: avoid;
    }

    .question-number {
      display: inline-block;
      background: #374151;
      color: white;
      padding: 1px 7px;
      border-radius: 8px;
      font-size: 8px;
      font-weight: 700;
      margin-bottom: 3px;
    }

    .question-text {
      font-size: 9pt;
      line-height: 1.3;
      color: #1f2937;
      margin-bottom: 4px;
    }

    .question-image {
      margin: 4px 0;
      text-align: center;
    }

    .question-image img {
      max-width: 50%;
      max-height: 120px;
      border-radius: 4px;
    }

    .visual-content {
      margin: 4px 0;
      max-height: 130px;
      overflow: hidden;
    }

    .visual-content table {
      border-collapse: collapse;
      font-size: 8px;
      margin: 0 auto;
    }

    .visual-content td, .visual-content th {
      border: 1px solid #d1d5db;
      padding: 1px 5px;
    }

    .visual-content svg {
      max-width: 100%;
      max-height: 120px;
    }

    /* SECENEKLER - 2x2 GRID */
    .options {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1px 12px;
    }

    .option {
      display: flex;
      align-items: flex-start;
      gap: 4px;
      padding: 1px 0;
      font-size: 9pt;
      line-height: 1.3;
    }

    .option-letter {
      font-weight: 700;
      color: #374151;
      min-width: 16px;
      flex-shrink: 0;
    }

    /* OPTIK FORM */
    .optical-form {
      page-break-before: always;
      padding: 25px 30px;
      background: white;
    }

    .optical-header {
      text-align: center;
      margin-bottom: 20px;
    }

    .optical-title {
      font-size: 16px;
      font-weight: 700;
      color: #1f2937;
      text-transform: uppercase;
      letter-spacing: 2px;
    }

    .optical-subtitle {
      font-size: 11px;
      color: #6b7280;
      margin-top: 4px;
    }

    .optical-name-row {
      display: flex;
      gap: 20px;
      margin-bottom: 16px;
      padding-bottom: 12px;
      border-bottom: 1px solid #e5e7eb;
    }

    .optical-name-field { flex: 1; }

    .optical-name-field label {
      font-size: 9px;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    .optical-name-field .field-line {
      border-bottom: 1px solid #d1d5db;
      height: 22px;
      margin-top: 4px;
    }

    .optical-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 6px;
    }

    .optical-row {
      display: flex;
      align-items: center;
      gap: 5px;
      padding: 2px 6px;
      border-bottom: 1px solid #f3f4f6;
    }

    .optical-q-num {
      font-size: 10px;
      font-weight: 600;
      color: #374151;
      min-width: 22px;
      text-align: right;
    }

    .optical-circles {
      display: flex;
      gap: 5px;
    }

    .optical-circle {
      width: 16px;
      height: 16px;
      border: 1.5px solid #9ca3af;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 7px;
      font-weight: 600;
      color: #9ca3af;
    }

    /* Math/LaTeX */
    .math {
      font-family: 'KaTeX_Main', 'Times New Roman', serif;
    }

    .math.display {
      display: block;
      text-align: center;
      margin: 4px 0;
    }

    /* Footer */
    .paper-footer {
      margin-top: 20px;
      padding-top: 10px;
      border-top: 1px solid #e5e7eb;
      text-align: center;
      font-size: 9px;
      color: #9ca3af;
    }

    .paper-footer-brand {
      font-weight: 700;
      color: #f97316;
      font-size: 11px;
    }

    @media print {
      body {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        background-image: url("${watermarkBg}") !important;
      }

      .question {
        page-break-inside: avoid;
      }

      .subject-header {
        background: #f3f4f6 !important;
        -webkit-print-color-adjust: exact !important;
      }

      .question-number {
        background: #374151 !important;
        -webkit-print-color-adjust: exact !important;
      }
    }
  </style>
</head>
<body>
  <!-- KAPAK -->
  <div class="cover">
    <div class="cover-brand">
      <div class="cover-brand-icon">T</div>
      <div class="cover-brand-text">TEKNOKUL</div>
    </div>

    <div class="cover-exam-title">${escapeHtml(exam.title)}</div>
    <div class="cover-subtitle">${examTypeLabel} &middot; Soru Kagidi</div>

    <div class="cover-info-grid">
      <div class="cover-info-item">
        <div class="cover-info-value">${totalQuestions}</div>
        <div class="cover-info-label">Soru</div>
      </div>
      <div class="cover-info-item">
        <div class="cover-info-value">${exam.duration}</div>
        <div class="cover-info-label">Dakika</div>
      </div>
      <div class="cover-info-item">
        <div class="cover-info-value">${config?.wrongPenalty || 3}</div>
        <div class="cover-info-label">Yanlis = 1 Dogru</div>
      </div>
    </div>

    <div class="cover-name-box">
      <div class="cover-name-label">Ad Soyad</div>
      <div class="cover-name-line"></div>
    </div>

    <div class="cover-date">${date}</div>
  </div>

  <!-- SORULAR -->
  ${subjectSections}

  <!-- OPTIK FORM -->
  ${opticalForm}

  <div class="paper-footer">
    <div class="paper-footer-brand">teknokul.com.tr</div>
    <div style="margin-top: 4px;">Bu soru kagidi ${date} tarihinde olusturulmustur.</div>
  </div>

  <!-- KaTeX JS -->
  <script src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js"><\/script>
  <script>
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
  <\/script>
</body>
</html>`
}

// =====================================================
// DERS BAZLI SORU RENDER
// =====================================================

function renderSubjectSections(
  subjectGroups: Record<string, ExamQuestionForClient[]>
): string {
  const subjects = Object.keys(subjectGroups)
  if (subjects.length === 0) return ''

  return subjects
    .map((subjectCode) => {
      const questions = subjectGroups[subjectCode]
      if (!questions || questions.length === 0) return ''

      const displayName = getSubjectDisplayName(subjectCode)

      const questionsHtml = questions
        .map((q) => {
          const questionText = renderLatex(q.question_text)
          const imageHtml = q.question_image_url
            ? `<div class="question-image"><img src="${q.question_image_url}" alt="Soru gorseli" /></div>`
            : ''
          const visualHtml = q.visual_content
            ? `<div class="visual-content">${q.visual_content}</div>`
            : ''

          return `
        <div class="question">
          <span class="question-number">Soru ${q.question_order}</span>
          <div class="question-text">${questionText}</div>
          ${imageHtml}
          ${visualHtml}
          <div class="options">
            <div class="option"><span class="option-letter">A)</span> ${renderLatex(q.options.A)}</div>
            <div class="option"><span class="option-letter">B)</span> ${renderLatex(q.options.B)}</div>
            <div class="option"><span class="option-letter">C)</span> ${renderLatex(q.options.C)}</div>
            <div class="option"><span class="option-letter">D)</span> ${renderLatex(q.options.D)}</div>
          </div>
        </div>`
        })
        .join('')

      return `
      <div class="subject-section">
        <div class="subject-header">
          <div class="subject-title">${escapeHtml(displayName)}</div>
          <div class="subject-count">(${questions.length} Soru)</div>
        </div>
        ${questionsHtml}
      </div>`
    })
    .join('')
}

// =====================================================
// OPTIK FORM RENDER
// =====================================================

function renderOpticalForm(totalQuestions: number): string {
  const questionsPerColumn = Math.ceil(totalQuestions / 4)
  const columns: string[] = []

  for (let col = 0; col < 4; col++) {
    const start = col * questionsPerColumn + 1
    const end = Math.min((col + 1) * questionsPerColumn, totalQuestions)
    const rows: string[] = []

    for (let i = start; i <= end; i++) {
      rows.push(`
        <div class="optical-row">
          <span class="optical-q-num">${i}.</span>
          <div class="optical-circles">
            <div class="optical-circle">A</div>
            <div class="optical-circle">B</div>
            <div class="optical-circle">C</div>
            <div class="optical-circle">D</div>
          </div>
        </div>`)
    }

    columns.push(`<div class="optical-column">${rows.join('')}</div>`)
  }

  return `
  <div class="optical-form">
    <div class="optical-header">
      <div class="optical-title">Cevap Formu</div>
      <div class="optical-subtitle">Dogrusu isaretleyin. Her sorunun tek bir dogru cevabi vardir.</div>
    </div>

    <div class="optical-name-row">
      <div class="optical-name-field">
        <label>Ad Soyad</label>
        <div class="field-line"></div>
      </div>
      <div class="optical-name-field">
        <label>Tarih</label>
        <div class="field-line"></div>
      </div>
    </div>

    <div class="optical-grid">
      ${columns.join('')}
    </div>
  </div>`
}

// =====================================================
// PRINT FONKSIYONU
// =====================================================

/**
 * Soru kagidini yeni pencerede ac ve print dialog tetikle
 */
export function openExamPaperPrint(
  exam: MockExam,
  questions: ExamQuestionForClient[],
  subjectGroups: Record<string, ExamQuestionForClient[]>
): void {
  const html = generateExamPaperHtml(exam, questions, subjectGroups)
  const printWindow = window.open('', '_blank')
  if (!printWindow) {
    alert('Pop-up engelleyici aktif. Lutfen pop-up engelleyiciyi kapatip tekrar deneyin.')
    return
  }
  printWindow.document.write(html)
  printWindow.document.close()
  printWindow.onload = () => {
    printWindow.print()
  }
}
