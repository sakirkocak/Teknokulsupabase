// =====================================================
// DENEME DUNYASI - PDF Sonuc Raporu
// Client-side HTML template → window.print() yaklaşımı
// =====================================================

import { ExamResultDetail, NetBreakdown } from './types'
import { EXAM_CONFIGS, SUBJECT_DISPLAY_NAMES } from './constants'
import { analyzeTopics, TopicAnalysisResult } from './scoring'

// Ders renkleri (hex - print icin)
const SUBJECT_HEX_COLORS: Record<string, string> = {
  turkce: '#ef4444',
  matematik: '#3b82f6',
  fen_bilimleri: '#22c55e',
  sosyal_bilgiler: '#f59e0b',
  inkilap_tarihi: '#f97316',
  din_kulturu: '#a855f7',
  ingilizce: '#06b6d4',
  edebiyat: '#f43f5e',
  fizik: '#6366f1',
  kimya: '#10b981',
  biyoloji: '#84cc16',
  tarih: '#eab308',
  cografya: '#14b8a6',
  felsefe: '#8b5cf6',
}

function getSubjectColor(code: string): string {
  return SUBJECT_HEX_COLORS[code] || '#6b7280'
}

function getSubjectDisplayName(code: string): string {
  return SUBJECT_DISPLAY_NAMES[code] || code.replace(/_/g, ' ')
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  if (mins >= 60) {
    const hours = Math.floor(mins / 60)
    const remainingMins = mins % 60
    return `${hours}s ${remainingMins}dk`
  }
  return `${mins}dk ${secs}sn`
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('tr-TR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Deneme sinavi sonuc raporu icin HTML olustur
 */
export function generateExamReportHtml(data: ExamResultDetail): string {
  const { result, exam, questions, ranking } = data

  const config = EXAM_CONFIGS[exam.exam_type]
  const scoreRange = config?.scoreRange || { min: 100, max: 500 }
  const scorePercent = Math.round(
    ((Number(result.score) - scoreRange.min) / (scoreRange.max - scoreRange.min)) * 100
  )

  // Konu analizi
  const topicAnalysis = analyzeTopics(
    questions.map((q) => ({
      topic_name: q.topic_name,
      subject: q.subject,
      correct_answer: q.correct_answer,
      question_order: q.question_order,
    })),
    result.answers || {}
  )

  // Net breakdown'dan toplam hesapla
  const breakdown = result.net_breakdown || {}
  const subjects = Object.keys(breakdown)
  let totalCorrect = 0
  let totalWrong = 0
  let totalEmpty = 0
  let totalNet = 0
  for (const s of subjects) {
    totalCorrect += breakdown[s].dogru
    totalWrong += breakdown[s].yanlis
    totalEmpty += breakdown[s].bos
    totalNet += breakdown[s].net
  }
  totalNet = Math.round(totalNet * 100) / 100

  const studentName = result.student_name || 'Ogrenci'
  const completedDate = result.completed_at ? formatDate(result.completed_at) : ''

  return `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <title>${exam.title} - Sonuc Raporu</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif;
      font-size: 11pt;
      line-height: 1.5;
      color: #1f2937;
      background: white;
    }

    @page {
      size: A4;
      margin: 15mm 15mm 20mm 15mm;
    }

    /* KAPAK */
    .cover {
      text-align: center;
      padding: 60px 30px 40px;
      page-break-after: always;
    }

    .cover-brand {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 50px;
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
      font-size: 26px;
      font-weight: 800;
      color: #1f2937;
      margin-bottom: 8px;
    }

    .cover-subtitle {
      font-size: 15px;
      color: #6b7280;
      margin-bottom: 50px;
    }

    /* Score card */
    .score-card {
      background: linear-gradient(135deg, #f97316, #ea580c);
      color: white;
      border-radius: 20px;
      padding: 35px 40px;
      max-width: 420px;
      margin: 0 auto 50px;
    }

    .score-value {
      font-size: 56px;
      font-weight: 900;
      line-height: 1;
      margin-bottom: 8px;
    }

    .score-label {
      font-size: 13px;
      opacity: 0.85;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 20px;
    }

    .score-bar-bg {
      height: 10px;
      background: rgba(255,255,255,0.3);
      border-radius: 5px;
      margin-bottom: 20px;
      overflow: hidden;
    }

    .score-bar-fill {
      height: 100%;
      background: white;
      border-radius: 5px;
    }

    .score-stats {
      display: flex;
      justify-content: space-between;
      gap: 10px;
    }

    .score-stat {
      text-align: center;
      flex: 1;
    }

    .score-stat-value {
      font-size: 20px;
      font-weight: 700;
    }

    .score-stat-label {
      font-size: 10px;
      opacity: 0.8;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .cover-info {
      font-size: 13px;
      color: #6b7280;
      margin-top: 40px;
    }

    .cover-info span {
      display: inline-block;
      margin: 0 10px;
    }

    /* DERS ANALIZ */
    .section {
      margin-bottom: 30px;
    }

    .section-title {
      font-size: 16px;
      font-weight: 700;
      color: #1f2937;
      margin-bottom: 15px;
      padding-bottom: 8px;
      border-bottom: 2px solid #f3f4f6;
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    /* Tablo */
    .subject-table {
      width: 100%;
      border-collapse: collapse;
      border-radius: 12px;
      overflow: hidden;
    }

    .subject-table th {
      background: #f9fafb;
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #6b7280;
      padding: 10px 14px;
      text-align: center;
      border-bottom: 2px solid #e5e7eb;
    }

    .subject-table th:first-child {
      text-align: left;
    }

    .subject-table td {
      padding: 10px 14px;
      text-align: center;
      font-size: 12px;
      border-bottom: 1px solid #f3f4f6;
    }

    .subject-table td:first-child {
      text-align: left;
      font-weight: 600;
    }

    .subject-table tr:last-child td {
      border-bottom: none;
    }

    .subject-table .total-row td {
      font-weight: 700;
      background: #f9fafb;
      border-top: 2px solid #e5e7eb;
      font-size: 13px;
    }

    .subject-indicator {
      display: inline-block;
      width: 10px;
      height: 10px;
      border-radius: 3px;
      margin-right: 8px;
      vertical-align: middle;
    }

    .td-correct { color: #16a34a; font-weight: 600; }
    .td-wrong { color: #dc2626; font-weight: 600; }
    .td-empty { color: #9ca3af; }
    .td-net { font-weight: 700; color: #1f2937; }

    /* Konu analizi */
    .topic-grid {
      display: flex;
      gap: 20px;
    }

    .topic-column {
      flex: 1;
    }

    .topic-column-title {
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 10px;
      padding: 6px 12px;
      border-radius: 8px;
    }

    .topic-column-weak .topic-column-title {
      background: #fef2f2;
      color: #dc2626;
    }

    .topic-column-strong .topic-column-title {
      background: #f0fdf4;
      color: #16a34a;
    }

    .topic-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 6px 12px;
      font-size: 11px;
      border-bottom: 1px solid #f9fafb;
    }

    .topic-item-name {
      color: #374151;
    }

    .topic-item-score {
      font-weight: 600;
      font-size: 10px;
      padding: 2px 8px;
      border-radius: 10px;
    }

    .topic-column-weak .topic-item-score {
      background: #fef2f2;
      color: #dc2626;
    }

    .topic-column-strong .topic-item-score {
      background: #f0fdf4;
      color: #16a34a;
    }

    .topic-empty {
      font-size: 11px;
      color: #9ca3af;
      padding: 10px 12px;
      font-style: italic;
    }

    /* Genel istatistik kartlari */
    .stat-cards {
      display: flex;
      gap: 12px;
      margin-bottom: 30px;
    }

    .stat-card {
      flex: 1;
      background: #f9fafb;
      border-radius: 12px;
      padding: 16px;
      text-align: center;
    }

    .stat-card-value {
      font-size: 24px;
      font-weight: 800;
      color: #1f2937;
    }

    .stat-card-label {
      font-size: 10px;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-top: 4px;
    }

    .stat-card-correct .stat-card-value { color: #16a34a; }
    .stat-card-wrong .stat-card-value { color: #dc2626; }
    .stat-card-empty .stat-card-value { color: #9ca3af; }
    .stat-card-net .stat-card-value { color: #f97316; }

    /* Footer */
    .report-footer {
      margin-top: 40px;
      padding-top: 15px;
      border-top: 1px solid #e5e7eb;
      text-align: center;
      font-size: 10px;
      color: #9ca3af;
    }

    .report-footer-brand {
      font-weight: 700;
      color: #f97316;
      font-size: 12px;
    }

    @media print {
      body {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }

      .score-card {
        background: linear-gradient(135deg, #f97316, #ea580c) !important;
        -webkit-print-color-adjust: exact !important;
      }

      .subject-table th,
      .subject-table .total-row td,
      .stat-card {
        background: #f9fafb !important;
        -webkit-print-color-adjust: exact !important;
      }

      .section {
        page-break-inside: avoid;
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
    <div class="cover-subtitle">Deneme Sinavi Sonuc Raporu</div>

    <div class="score-card">
      <div class="score-value">${Number(result.score).toFixed(2)}</div>
      <div class="score-label">Puan (${scoreRange.min}-${scoreRange.max})</div>
      <div class="score-bar-bg">
        <div class="score-bar-fill" style="width: ${Math.min(100, Math.max(0, scorePercent))}%"></div>
      </div>
      <div class="score-stats">
        <div class="score-stat">
          <div class="score-stat-value">${ranking.rank}/${ranking.totalAttempts}</div>
          <div class="score-stat-label">Siralama</div>
        </div>
        <div class="score-stat">
          <div class="score-stat-value">%${ranking.percentile}</div>
          <div class="score-stat-label">Yuzdelik</div>
        </div>
        <div class="score-stat">
          <div class="score-stat-value">${formatTime(result.time_taken)}</div>
          <div class="score-stat-label">Sure</div>
        </div>
      </div>
    </div>

    <div class="cover-info">
      <span>${escapeHtml(studentName)}</span> &middot;
      <span>${completedDate}</span>
    </div>
  </div>

  <!-- DETAY SAYFA -->
  ${renderStatCards(totalCorrect, totalWrong, totalEmpty, totalNet)}

  ${renderSubjectTable(breakdown)}

  ${renderTopicAnalysis(topicAnalysis)}

  <div class="report-footer">
    <div class="report-footer-brand">teknokul.com.tr</div>
    <div style="margin-top: 4px;">Bu rapor ${new Date().toLocaleDateString('tr-TR')} tarihinde olusturulmustur.</div>
  </div>
</body>
</html>`
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function renderStatCards(correct: number, wrong: number, empty: number, net: number): string {
  return `
  <div class="section">
    <div class="section-title">Genel Istatistikler</div>
    <div class="stat-cards">
      <div class="stat-card stat-card-correct">
        <div class="stat-card-value">${correct}</div>
        <div class="stat-card-label">Dogru</div>
      </div>
      <div class="stat-card stat-card-wrong">
        <div class="stat-card-value">${wrong}</div>
        <div class="stat-card-label">Yanlis</div>
      </div>
      <div class="stat-card stat-card-empty">
        <div class="stat-card-value">${empty}</div>
        <div class="stat-card-label">Bos</div>
      </div>
      <div class="stat-card stat-card-net">
        <div class="stat-card-value">${net}</div>
        <div class="stat-card-label">Toplam Net</div>
      </div>
    </div>
  </div>`
}

function renderSubjectTable(breakdown: NetBreakdown): string {
  const subjects = Object.keys(breakdown)
  if (subjects.length === 0) return ''

  let totalCorrect = 0
  let totalWrong = 0
  let totalEmpty = 0
  let totalNet = 0

  const rows = subjects.map(code => {
    const d = breakdown[code]
    totalCorrect += d.dogru
    totalWrong += d.yanlis
    totalEmpty += d.bos
    totalNet += d.net

    return `
      <tr>
        <td>
          <span class="subject-indicator" style="background: ${getSubjectColor(code)}"></span>
          ${escapeHtml(getSubjectDisplayName(code))}
        </td>
        <td class="td-correct">${d.dogru}</td>
        <td class="td-wrong">${d.yanlis}</td>
        <td class="td-empty">${d.bos}</td>
        <td class="td-net">${d.net.toFixed(2)}</td>
      </tr>`
  }).join('')

  totalNet = Math.round(totalNet * 100) / 100

  return `
  <div class="section">
    <div class="section-title">Ders Bazli Analiz</div>
    <table class="subject-table">
      <thead>
        <tr>
          <th>Ders</th>
          <th>Dogru</th>
          <th>Yanlis</th>
          <th>Bos</th>
          <th>Net</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
        <tr class="total-row">
          <td>TOPLAM</td>
          <td class="td-correct">${totalCorrect}</td>
          <td class="td-wrong">${totalWrong}</td>
          <td class="td-empty">${totalEmpty}</td>
          <td class="td-net">${totalNet.toFixed(2)}</td>
        </tr>
      </tbody>
    </table>
  </div>`
}

function renderTopicAnalysis(analysis: TopicAnalysisResult): string {
  const { weakTopics, strongTopics } = analysis

  if (weakTopics.length === 0 && strongTopics.length === 0) {
    return ''
  }

  const weakHtml = weakTopics.length > 0
    ? weakTopics.slice(0, 8).map(t => `
        <div class="topic-item">
          <span class="topic-item-name">${escapeHtml(t.topic)} (${escapeHtml(getSubjectDisplayName(t.subject))})</span>
          <span class="topic-item-score">${t.correct}/${t.total}</span>
        </div>`).join('')
    : '<div class="topic-empty">Zayif konu bulunamadi</div>'

  const strongHtml = strongTopics.length > 0
    ? strongTopics.slice(0, 8).map(t => `
        <div class="topic-item">
          <span class="topic-item-name">${escapeHtml(t.topic)} (${escapeHtml(getSubjectDisplayName(t.subject))})</span>
          <span class="topic-item-score">${t.correct}/${t.total}</span>
        </div>`).join('')
    : '<div class="topic-empty">Guclu konu bulunamadi</div>'

  return `
  <div class="section">
    <div class="section-title">Konu Analizi</div>
    <div class="topic-grid">
      <div class="topic-column topic-column-weak">
        <div class="topic-column-title">Zayif Konular</div>
        ${weakHtml}
      </div>
      <div class="topic-column topic-column-strong">
        <div class="topic-column-title">Guclu Konular</div>
        ${strongHtml}
      </div>
    </div>
  </div>`
}

/**
 * PDF raporu yeni pencerede ac ve print dialog tetikle
 */
export function openExamReportPrint(data: ExamResultDetail): void {
  const html = generateExamReportHtml(data)
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
