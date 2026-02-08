'use client'

import { useState } from 'react'
import { Save, Loader2, Wand2, Eye, EyeOff } from 'lucide-react'
import { EXAM_CONFIGS, EXAM_TYPE_LABELS, GRADE_OPTIONS } from '@/lib/mock-exam/constants'
import AdminQuestionSelector from './AdminQuestionSelector'

interface AdminExamBuilderProps {
  onSave?: (exam: any) => void
}

interface SelectedQuestion {
  id: string
  question_text: string
  subject_code: string
  difficulty: string
  main_topic: string
}

export default function AdminExamBuilder({ onSave }: AdminExamBuilderProps) {
  // Form state
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [description, setDescription] = useState('')
  const [grade, setGrade] = useState(8)
  const [examType, setExamType] = useState('BURSLULUK_8')
  const [duration, setDuration] = useState(100)
  const [isActive, setIsActive] = useState(false)

  // Ders bazli sorular
  const [subjectQuestions, setSubjectQuestions] = useState<Record<string, SelectedQuestion[]>>({})

  const [saving, setSaving] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const config = EXAM_CONFIGS[examType]
  const subjects = config?.subjects || []

  // Slug otomatik olusturma
  function handleTitleChange(value: string) {
    setTitle(value)
    const autoSlug = value
      .toLowerCase()
      .replace(/[İıĞğÜüŞşÖöÇç]/g, c => {
        const map: Record<string, string> = { 'İ': 'i', 'ı': 'i', 'Ğ': 'g', 'ğ': 'g', 'Ü': 'u', 'ü': 'u', 'Ş': 's', 'ş': 's', 'Ö': 'o', 'ö': 'o', 'Ç': 'c', 'ç': 'c' }
        return map[c] || c
      })
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
    setSlug(autoSlug)
  }

  // Sinav turu degisince
  function handleExamTypeChange(type: string) {
    setExamType(type)
    const newConfig = EXAM_CONFIGS[type]
    if (newConfig) {
      setDuration(newConfig.duration)
      // Grade'i ilk uygun sinifa set et
      if (newConfig.grades.length > 0 && !newConfig.grades.includes(grade)) {
        setGrade(newConfig.grades[0])
      }
    }
    setSubjectQuestions({})
  }

  // AI ile otomatik soru sec
  async function handleAutoGenerate() {
    if (!config) return
    setGenerating(true)
    setError(null)

    try {
      const res = await fetch('/api/mock-exam/admin/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grade,
          exam_type: examType,
        }),
      })

      if (!res.ok) throw new Error('Soru secimi basarisiz')

      const data = await res.json()

      // Secilen sorulari set et (subjectCode ile esle - config.code ile ayni key)
      const newSubjectQuestions: Record<string, SelectedQuestion[]> = {}
      for (const s of data.subjects) {
        // subjectCode: generate API'den gelen gercek ders kodu (turkce, matematik, etc.)
        // Kompozit derslerde parent code kullan (orn: inkilap_tarihi+din_kulturu -> sosyal_bilgiler)
        const matchingSubject = config.subjects.find(sc =>
          sc.displayName === s.subject || sc.code === s.subjectCode
        )
        const key = matchingSubject?.code || s.subjectCode || s.subject

        if (!newSubjectQuestions[key]) {
          newSubjectQuestions[key] = []
        }
        newSubjectQuestions[key].push(...s.questionIds.map((id: string, idx: number) => ({
          id,
          question_text: `Soru ${newSubjectQuestions[key].length + idx + 1}`,
          subject_code: key,
          difficulty: 'medium',
          main_topic: '',
        })))
      }
      setSubjectQuestions(newSubjectQuestions)
      const visualInfo = data.visualQuestions ? ` (${data.visualQuestions} yeni nesil)` : ''
      setSuccess(`${data.totalQuestions} soru otomatik secildi${visualInfo}`)
    } catch (e: any) {
      setError(e.message || 'Hata olustu')
    } finally {
      setGenerating(false)
    }
  }

  // Kaydet
  async function handleSave() {
    if (!title || !slug || !grade || !examType) {
      setError('Lutfen tum zorunlu alanlari doldurun')
      return
    }

    setSaving(true)
    setError(null)

    try {
      const subjectsPayload = Object.entries(subjectQuestions).map(([subject, questions]) => ({
        subject,
        questionIds: questions.map(q => q.id),
      }))

      const res = await fetch('/api/mock-exam/admin/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          slug,
          description,
          grade,
          exam_type: examType,
          duration,
          subjects: subjectsPayload,
          is_active: isActive,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Kayit basarisiz')
      }

      const data = await res.json()
      setSuccess(`Sinav olusturuldu! ${data.questionCount} soru eklendi.`)
      onSave?.(data.exam)
    } catch (e: any) {
      setError(e.message || 'Hata olustu')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Hata / Basari mesaji */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm">
          {success}
        </div>
      )}

      {/* Temel bilgiler */}
      <div className="bg-white rounded-2xl border border-surface-100 p-6">
        <h3 className="text-lg font-bold text-surface-900 mb-4">Sinav Bilgileri</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1">Sinav Adi *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="2026 Bursluluk Deneme - 1"
              className="w-full px-4 py-2.5 border border-surface-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-200 focus:border-primary-300 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1">URL Slug *</label>
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="2026-bursluluk-deneme-1"
              className="w-full px-4 py-2.5 border border-surface-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-200 focus:border-primary-300 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1">Sinav Turu *</label>
            <select
              value={examType}
              onChange={(e) => handleExamTypeChange(e.target.value)}
              className="w-full px-4 py-2.5 border border-surface-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-200 focus:border-primary-300 outline-none"
            >
              {Object.entries(EXAM_TYPE_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1">Sinif *</label>
            <select
              value={grade}
              onChange={(e) => setGrade(Number(e.target.value))}
              className="w-full px-4 py-2.5 border border-surface-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-200 focus:border-primary-300 outline-none"
            >
              {GRADE_OPTIONS.map(g => (
                <option key={g.value} value={g.value}>{g.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1">Sure (dk) *</label>
            <input
              type="number"
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              min={30}
              max={300}
              className="w-full px-4 py-2.5 border border-surface-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-200 focus:border-primary-300 outline-none"
            />
          </div>

          <div className="flex items-center gap-3 pt-6">
            <button
              onClick={() => setIsActive(!isActive)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-green-100 text-green-700'
                  : 'bg-surface-100 text-surface-500'
              }`}
            >
              {isActive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              {isActive ? 'Aktif' : 'Taslak'}
            </button>
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-surface-700 mb-1">Aciklama</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            placeholder="Sinav aciklamasi..."
            className="w-full px-4 py-2.5 border border-surface-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-200 focus:border-primary-300 outline-none resize-none"
          />
        </div>
      </div>

      {/* Soru secimi */}
      <div className="bg-white rounded-2xl border border-surface-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-surface-900">Soru Secimi</h3>
          <button
            onClick={handleAutoGenerate}
            disabled={generating}
            className="flex items-center gap-2 px-4 py-2 bg-violet-100 text-violet-700 rounded-xl text-sm font-medium hover:bg-violet-200 transition-colors disabled:opacity-50"
          >
            {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
            Otomatik Sec
          </button>
        </div>

        <div className="space-y-8">
          {subjects.map(subjectConfig => (
            <AdminQuestionSelector
              key={subjectConfig.code}
              grade={grade}
              subject={subjectConfig.code}
              maxQuestions={subjectConfig.questionCount}
              selectedQuestions={subjectQuestions[subjectConfig.code] || []}
              onQuestionsChange={(questions) => {
                setSubjectQuestions(prev => ({
                  ...prev,
                  [subjectConfig.code]: questions,
                }))
              }}
            />
          ))}
        </div>
      </div>

      {/* Kaydet butonu */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-xl text-sm font-medium hover:bg-primary-700 transition-colors disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Sinavi Kaydet
        </button>
      </div>
    </div>
  )
}
