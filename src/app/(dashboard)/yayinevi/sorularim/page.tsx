'use client'

import { useState, useEffect, useCallback } from 'react'
import { BookOpen, Download, Loader2, CheckSquare, Square, Filter } from 'lucide-react'

interface PurchasedQuestion {
  id: string
  question_text: string
  options: Record<string, string>
  correct_answer: string
  explanation: string | null
  subject: string
  topic: string
  difficulty: string
  exam_type: string | null
  image_url: string | null
  image_type: string | null
  grade: number | null
  updated_at: string
}

export default function SorularimPage() {
  const [questions, setQuestions] = useState<PurchasedQuestion[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [subjectFilter, setSubjectFilter] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [exporting, setExporting] = useState(false)
  const [publisherName, setPublisherName] = useState('')

  const fetchPurchases = useCallback(async (p = 1) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: p.toString(), limit: '20' })
      if (subjectFilter) params.set('subject', subjectFilter)
      const res = await fetch(`/api/publisher/purchases?${params}`)
      const data = await res.json()
      setQuestions(data.questions || [])
      setTotal(data.total || 0)
      setPage(p)
    } finally {
      setLoading(false)
    }
  }, [subjectFilter])

  useEffect(() => {
    fetchPurchases(1)
  }, [fetchPurchases])

  useEffect(() => {
    // Profil adını al
    fetch('/api/publisher/credits')
      .then(r => r.json())
      .then(() => {
        // Profile adı için supabase'den çekebiliriz
        // Basit tutuyoruz
      })
  }, [])

  function toggleSelect(id: string) {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleAll() {
    if (selected.size === questions.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(questions.map(q => q.id)))
    }
  }

  async function handleExportPDF() {
    if (selected.size === 0) return
    setExporting(true)
    try {
      const res = await fetch('/api/publisher/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question_ids: Array.from(selected) }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      // Client-side PDF üretimi
      await generatePDF(data.questions, data.publisher_name, data.export_date)
    } catch (e) {
      alert(e instanceof Error ? e.message : 'PDF üretme hatası')
    } finally {
      setExporting(false)
    }
  }

  async function generatePDF(
    qs: PurchasedQuestion[],
    publisherName: string,
    exportDate: string
  ) {
    const { jsPDF } = await import('jspdf')
    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.getWidth()
    let y = 20

    // Başlık
    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    doc.text(publisherName || 'Yayınevi', pageWidth / 2, y, { align: 'center' })
    y += 8
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text(`Teknokul Kurumsal — ${exportDate}`, pageWidth / 2, y, { align: 'center' })
    y += 15

    const answerKey: string[] = []

    qs.forEach((q, index) => {
      if (y > 240) {
        doc.addPage()
        y = 20
      }

      // Soru
      doc.setFontSize(11)
      doc.setFont('helvetica', 'bold')
      doc.text(`${index + 1}. `, 15, y)

      const questionLines = doc.splitTextToSize(q.question_text, pageWidth - 35)
      doc.setFont('helvetica', 'normal')
      doc.text(questionLines, 22, y)
      y += questionLines.length * 5 + 4

      // Şıklar
      Object.entries(q.options).forEach(([key, val]) => {
        if (y > 270) { doc.addPage(); y = 20 }
        const line = doc.splitTextToSize(`${key}) ${val}`, pageWidth - 40)
        doc.text(line, 22, y)
        y += line.length * 5 + 2
      })

      y += 5
      answerKey.push(`${index + 1}. ${q.correct_answer}`)
    })

    // Cevap anahtarı — son sayfa
    doc.addPage()
    y = 20
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('CEVAP ANAHTARI', pageWidth / 2, y, { align: 'center' })
    y += 12
    doc.setFontSize(11)
    doc.setFont('helvetica', 'normal')

    const cols = 5
    answerKey.forEach((ans, i) => {
      const col = i % cols
      const row = Math.floor(i / cols)
      doc.text(ans, 20 + col * 36, y + row * 8)
    })

    doc.save(`teknokul-sorular-${Date.now()}.pdf`)
  }

  const totalPages = Math.ceil(total / 20)

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Sorularım</h1>
          <p className="text-surface-500 text-sm mt-1">{total} soru</p>
        </div>
        {selected.size > 0 && (
          <button
            onClick={handleExportPDF}
            disabled={exporting}
            className="flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
          >
            {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            PDF İndir ({selected.size} soru)
          </button>
        )}
      </div>

      {/* Filtreler */}
      <div className="bg-white rounded-2xl border border-surface-100 p-4 mb-5 flex items-center gap-3">
        <Filter className="w-4 h-4 text-surface-400" />
        <select
          value={subjectFilter}
          onChange={e => setSubjectFilter(e.target.value)}
          className="border border-surface-200 rounded-xl px-3 py-2 text-sm"
        >
          <option value="">Tüm Dersler</option>
          {['Matematik', 'Fizik', 'Kimya', 'Biyoloji', 'Türkçe', 'Edebiyat', 'Tarih', 'Coğrafya'].map(s => (
            <option key={s}>{s}</option>
          ))}
        </select>

        {questions.length > 0 && (
          <button onClick={toggleAll} className="flex items-center gap-2 text-sm text-surface-600 hover:text-primary-600 ml-auto">
            {selected.size === questions.length ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
            {selected.size === questions.length ? 'Seçimi Kaldır' : 'Tümünü Seç'}
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
        </div>
      ) : questions.length === 0 ? (
        <div className="bg-white rounded-2xl border border-surface-100 p-12 text-center">
          <BookOpen className="w-12 h-12 text-surface-300 mx-auto mb-3" />
          <p className="text-surface-500 mb-3">Henüz soru satın almadınız</p>
          <a href="/yayinevi/market" className="text-primary-600 text-sm font-medium hover:underline">
            Markete git →
          </a>
        </div>
      ) : (
        <div className="space-y-4">
          {questions.map(q => (
            <div
              key={q.id}
              onClick={() => toggleSelect(q.id)}
              className={`bg-white rounded-2xl border p-5 cursor-pointer transition-colors ${
                selected.has(q.id)
                  ? 'border-primary-300 bg-primary-50/30'
                  : 'border-surface-100 hover:border-surface-200'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="mt-1 shrink-0">
                  {selected.has(q.id)
                    ? <CheckSquare className="w-5 h-5 text-primary-600" />
                    : <Square className="w-5 h-5 text-surface-300" />
                  }
                </div>
                <div className="flex-1">
                  <div className="flex flex-wrap gap-2 mb-2">
                    <span className="text-xs bg-primary-50 text-primary-700 px-2 py-0.5 rounded-lg">{q.subject}</span>
                    <span className="text-xs bg-surface-100 text-surface-600 px-2 py-0.5 rounded-lg">{q.topic}</span>
                    {q.exam_type && <span className="text-xs bg-surface-100 text-surface-600 px-2 py-0.5 rounded-lg">{q.exam_type}</span>}
                  </div>
                  <p className="font-medium text-surface-900 mb-3">{q.question_text}</p>

                  {/* Şıklar */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-3">
                    {Object.entries(q.options).map(([key, val]) => (
                      <div
                        key={key}
                        className={`text-sm px-3 py-2 rounded-xl border ${
                          key === q.correct_answer
                            ? 'bg-green-50 border-green-200 text-green-800'
                            : 'bg-surface-50 border-surface-100 text-surface-700'
                        }`}
                      >
                        <span className="font-semibold">{key})</span> {val}
                      </div>
                    ))}
                  </div>

                  {q.explanation && (
                    <div className="bg-blue-50 rounded-xl p-3 text-sm text-blue-700">
                      <strong>Açıklama:</strong> {q.explanation}
                    </div>
                  )}

                  {q.image_url && (
                    <div className="mt-3">
                      <img
                        src={q.image_url}
                        alt="Soru görseli"
                        className="max-h-48 border border-surface-200 rounded-xl"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          <button onClick={() => fetchPurchases(page - 1)} disabled={page === 1} className="px-4 py-2 border border-surface-200 rounded-xl text-sm disabled:opacity-40">Önceki</button>
          <span className="px-4 py-2 text-sm text-surface-500">{page} / {totalPages}</span>
          <button onClick={() => fetchPurchases(page + 1)} disabled={page === totalPages} className="px-4 py-2 border border-surface-200 rounded-xl text-sm disabled:opacity-40">Sonraki</button>
        </div>
      )}
    </div>
  )
}
