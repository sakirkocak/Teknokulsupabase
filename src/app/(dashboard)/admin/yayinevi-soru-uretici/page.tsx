'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import MathRenderer from '@/components/MathRenderer'
import {
  Building2, Sparkles, ImageIcon, BookOpen, Target, GraduationCap,
  CheckCircle, XCircle, Loader2, RefreshCw, Save, Layers, Wand2,
  Play, Pause, Trash2, AlertTriangle, Zap, Brain, Search,
  Triangle, BarChart3, LineChart, Dna, FlaskConical, Map,
  CheckSquare, Square, ChevronDown, ChevronUp, Download
} from 'lucide-react'

// ============================================================
// SABİTLER
// ============================================================

const EXAM_MODES = [
  { mode: null, label: '📚 Sınıf Bazlı', color: 'bg-purple-600' },
  { mode: 'TYT', label: '📝 TYT', color: 'bg-orange-500' },
  { mode: 'AYT', label: '🎯 AYT', color: 'bg-rose-500' },
  { mode: 'LGS', label: '🏫 LGS', color: 'bg-green-600' },
  { mode: 'KPSS', label: '🏛️ KPSS', color: 'bg-blue-600' },
  { mode: 'KPSS_ONLISANS', label: '🎒 KPSS ÖL', color: 'bg-cyan-600' },
  { mode: 'KPSS_ORTAOGRETIM', label: '🎒 KPSS Lise', color: 'bg-teal-600' },
  { mode: 'DGS', label: '🔄 DGS', color: 'bg-green-700' },
  { mode: 'ALES', label: '🎓 ALES', color: 'bg-violet-600' },
  { mode: 'YDS', label: '🌍 YDS', color: 'bg-indigo-600' },
]

const IMAGE_TYPES = [
  { id: 'geometry_shape', name: 'Geometrik Şekil', icon: Triangle, color: 'bg-indigo-500', emoji: '🔺', desc: 'Üçgen, dörtgen, çember' },
  { id: '3d_solid', name: '3D Cisim', icon: Layers, color: 'bg-cyan-500', emoji: '🧊', desc: 'Küp, prizma, silindir' },
  { id: 'coordinate_graph', name: 'Koordinat/Fonksiyon', icon: LineChart, color: 'bg-blue-500', emoji: '📈', desc: 'Koordinat düzlemi' },
  { id: 'data_graph', name: 'Veri Grafiği', icon: BarChart3, color: 'bg-sky-500', emoji: '🥧', desc: 'Pasta, sütun, çizgi grafik' },
  { id: 'physics_experiment', name: 'Fizik Düzeneği', icon: Zap, color: 'bg-yellow-500', emoji: '⚡', desc: 'Elektrik, optik, mekanik' },
  { id: 'wave_force', name: 'Dalga/Kuvvet', icon: Target, color: 'bg-orange-500', emoji: '〜', desc: 'Dalga grafiği, kuvvet vektörleri' },
  { id: 'biology_diagram', name: 'Biyoloji Şeması', icon: Dna, color: 'bg-green-500', emoji: '🧬', desc: 'Hücre, organ, popülasyon' },
  { id: 'chemistry_schema', name: 'Kimya Şeması', icon: FlaskConical, color: 'bg-emerald-500', emoji: '⚗️', desc: 'Elektrokimya, piston, molekül' },
  { id: 'geography_map', name: 'Coğrafya/Tarih Haritası', icon: Map, color: 'bg-amber-500', emoji: '🗺️', desc: 'Bölge haritası, iklim' },
  { id: 'logic_table', name: 'Veri/Mantık Tablosu', icon: BarChart3, color: 'bg-rose-500', emoji: '📊', desc: 'Karşılaştırma, Venn, akış' },
]

const DIFFICULTIES = [
  { id: 'easy', name: 'Kolay', emoji: '🟢', cls: 'bg-green-100 text-green-700 border-green-300' },
  { id: 'medium', name: 'Orta', emoji: '🟡', cls: 'bg-yellow-100 text-yellow-700 border-yellow-300' },
  { id: 'hard', name: 'Zor', emoji: '🟠', cls: 'bg-orange-100 text-orange-700 border-orange-300' },
  { id: 'legendary', name: 'Efsane', emoji: '🔴', cls: 'bg-red-100 text-red-700 border-red-300' },
]

const GRADES = [5, 6, 7, 8, 9, 10, 11, 12]

// ============================================================
// TIPLER
// ============================================================

interface ExamSubject {
  subject_code: string
  subject_name: string
  topics: { id: string; main_topic: string; sub_topic: string | null; learning_outcome: string | null }[]
}

interface Subject { id: string; name: string; code: string; icon: string; color: string }
interface Topic { id: string; subject_id: string; grade: number; main_topic: string; sub_topic: string | null; learning_outcome: string | null }

interface BatchQuestion {
  id: string
  question_text: string
  options: Record<string, string>
  correct_answer: string
  explanation: string
  difficulty: string
  bloom_level: string
  image_prompt?: string
  image_base64?: string
  image_type?: string
  verified: boolean
  embedding?: number[]
  status: 'pending' | 'generating' | 'completed' | 'error' | 'saved'
  error?: string
  savedId?: string
}

// ============================================================
// SAYFA
// ============================================================

export default function YayineviSoruUreticiPage() {
  const [mode, setMode] = useState<'single' | 'batch'>('single')

  // Sınav modu
  const [examMode, setExamMode] = useState<string | null>(null)
  const [examSubjects, setExamSubjects] = useState<ExamSubject[]>([])
  const [examSubjectCode, setExamSubjectCode] = useState('')
  const [loadingExamSubjects, setLoadingExamSubjects] = useState(false)

  // Sınıf bazlı
  const [grade, setGrade] = useState(8)
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [selectedSubject, setSelectedSubject] = useState('')
  const [topics, setTopics] = useState<Topic[]>([])
  const [loadingSubjects, setLoadingSubjects] = useState(false)
  const [loadingTopics, setLoadingTopics] = useState(false)

  // Ortak
  const [selectedTopic, setSelectedTopic] = useState('')
  const [imageType, setImageType] = useState('geometry_shape')
  const [difficulty, setDifficulty] = useState('medium')
  const [imageDescription, setImageDescription] = useState('')   // Özel şekil/görsel açıklaması
  const [generateImage, setGenerateImage] = useState(true)
  const [autoApprove, setAutoApprove] = useState(false)

  // Tekli mod
  const [generating, setGenerating] = useState(false)
  const [result, setResult] = useState<BatchQuestion | null>(null)
  const [saving, setSaving] = useState(false)
  const [savedId, setSavedId] = useState<string | null>(null)

  // Toplu mod
  const [batchCount, setBatchCount] = useState(5)
  const [batchDiff, setBatchDiff] = useState({ easy: true, medium: true, hard: true, legendary: false })
  const [batch, setBatch] = useState<BatchQuestion[]>([])
  const [batchRunning, setBatchRunning] = useState(false)
  const [batchPaused, setBatchPaused] = useState(false)
  const [savingAll, setSavingAll] = useState(false)
  const batchPausedRef = useRef(false)

  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // ── Sınav modu değişince ──────────────────────────────────
  useEffect(() => {
    if (examMode) {
      setLoadingExamSubjects(true)
      fetch(`/api/exam-topics?exam_type=${examMode}`)
        .then(r => r.json())
        .then(d => { setExamSubjects(d.subjects || []); setExamSubjectCode(''); setSelectedTopic('') })
        .finally(() => setLoadingExamSubjects(false))
    } else {
      setExamSubjects([])
    }
  }, [examMode])

  // ── Grade değişince sınıf bazlı dersler ──────────────────
  useEffect(() => {
    if (!examMode) loadGradeSubjects()
  }, [grade, examMode])

  useEffect(() => {
    if (selectedSubject && !examMode) loadTopics()
  }, [selectedSubject, grade])

  async function loadGradeSubjects() {
    setLoadingSubjects(true)
    setSelectedSubject(''); setSelectedTopic(''); setTopics([])
    try {
      const { createClient } = await import('@/lib/supabase/client')
      const sb = createClient()
      const { data } = await sb.from('grade_subjects')
        .select('subject:subjects(id,name,code,icon,color)')
        .eq('grade_id', grade)
        .order('is_exam_subject', { ascending: false })
      setSubjects((data || []).filter((d: any) => d.subject).map((d: any) => d.subject))
    } catch { } finally { setLoadingSubjects(false) }
  }

  async function loadTopics() {
    setLoadingTopics(true)
    try {
      const { createClient } = await import('@/lib/supabase/client')
      const sb = createClient()
      const { data } = await sb.from('topics')
        .select('id,subject_id,grade,main_topic,sub_topic,learning_outcome')
        .eq('subject_id', selectedSubject).eq('grade', grade).order('unit_number')
      setTopics(data || [])
    } catch { } finally { setLoadingTopics(false) }
  }

  // ── Seçili kazanım bilgisi ────────────────────────────────
  function getSelectedLearningOutcome(): string | undefined {
    if (examMode) {
      const sub = examSubjects.find(s => s.subject_code === examSubjectCode)
      const t = sub?.topics.find(t => t.id === selectedTopic)
      return t?.learning_outcome || undefined
    } else {
      const t = topics.find(t => t.id === selectedTopic)
      return t?.learning_outcome || undefined
    }
  }

  function getSubjectName(): string {
    if (examMode) return examSubjects.find(s => s.subject_code === examSubjectCode)?.subject_name || examSubjectCode
    return subjects.find(s => s.id === selectedSubject)?.name || ''
  }

  function getTopicName(): string {
    if (examMode) {
      const sub = examSubjects.find(s => s.subject_code === examSubjectCode)
      const t = sub?.topics.find(t => t.id === selectedTopic)
      return t ? `${t.main_topic}${t.sub_topic ? ` — ${t.sub_topic}` : ''}` : ''
    }
    const t = topics.find(t => t.id === selectedTopic)
    return t ? `${t.main_topic}${t.sub_topic ? ` — ${t.sub_topic}` : ''}` : ''
  }

  function isFormValid(): boolean {
    if (examMode) return !!examSubjectCode && !!selectedTopic
    return !!selectedSubject && !!selectedTopic
  }

  function randomDifficulty(): string {
    const enabled = Object.entries(batchDiff).filter(([, v]) => v).map(([k]) => k)
    return enabled[Math.floor(Math.random() * enabled.length)] || 'medium'
  }

  // ── TEKLİ ÜRETİM ─────────────────────────────────────────
  async function handleGenerate() {
    if (!isFormValid()) return
    setGenerating(true); setError(null); setResult(null); setSavedId(null)

    try {
      const res = await fetch('/api/publisher/admin/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: getSubjectName(),
          topic: getTopicName(),
          imageType,
          difficulty,
          examMode,
          grade: examMode ? undefined : grade,
          imageDescription: imageDescription || undefined,
          learningOutcome: getSelectedLearningOutcome(),
          count: 1,
          generateImage,
          autoSave: false,
        }),
      })
      const data = await res.json()
      if (!res.ok || !data.results?.[0]) throw new Error(data.error || 'Üretim hatası')
      const r = data.results[0]
      if (r.error) throw new Error(r.error)
      setResult({
        id: `single-${Date.now()}`,
        ...r.question,
        verified: r.verified,
        embedding: r.embedding,
        status: 'completed',
      })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Hata oluştu')
    } finally {
      setGenerating(false)
    }
  }

  async function handleSaveSingle(action: 'approve' | 'save_pending') {
    if (!result) return
    setSaving(true); setError(null)
    try {
      const res = await fetch('/api/publisher/admin/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: {
            ...result,
            subject: getSubjectName(),
            topic: getTopicName(),
            exam_type: examMode,
            learning_outcome: getSelectedLearningOutcome(),
            image_description: imageDescription || null,
            price_credits: 1,
          },
          action,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setSavedId(data.question.id)
      setResult(prev => prev ? { ...prev, status: 'saved', savedId: data.question.id } : prev)
      setSuccess(action === 'approve' ? 'Soru onaylandı ve yayına alındı!' : 'Soru inceleme kuyruğuna eklendi.')
      setTimeout(() => setSuccess(null), 4000)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Kaydetme hatası')
    } finally {
      setSaving(false)
    }
  }

  // ── TOPLU ÜRETİM ─────────────────────────────────────────
  async function startBatch() {
    if (!isFormValid()) return
    setError(null); setBatchRunning(true); setBatchPaused(false)
    batchPausedRef.current = false

    const initial: BatchQuestion[] = Array.from({ length: batchCount }, (_, i) => ({
      id: `batch-${Date.now()}-${i}`,
      question_text: '', options: { A: '', B: '', C: '', D: '' },
      correct_answer: '', explanation: '', difficulty: '', bloom_level: '',
      verified: false, status: 'pending',
    }))
    setBatch(initial)

    for (let i = 0; i < batchCount; i++) {
      if (batchPausedRef.current) break

      setBatch(prev => prev.map((q, idx) => idx === i ? { ...q, status: 'generating' } : q))

      try {
        const res = await fetch('/api/publisher/admin/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            subject: getSubjectName(),
            topic: getTopicName(),
            imageType,
            difficulty: randomDifficulty(),
            examMode,
            grade: examMode ? undefined : grade,
            imageDescription: imageDescription || undefined,
            learningOutcome: getSelectedLearningOutcome(),
            count: 1,
            generateImage,
            autoSave: autoApprove,
            autoApprove,
          }),
        })
        const data = await res.json()
        const r = data.results?.[0]

        if (r?.error || !r?.question) {
          setBatch(prev => prev.map((q, idx) => idx === i
            ? { ...q, status: 'error', error: r?.error || 'Üretim başarısız' } : q))
        } else {
          setBatch(prev => prev.map((q, idx) => idx === i
            ? {
              ...q,
              ...r.question,
              verified: r.verified,
              embedding: r.embedding,
              status: autoApprove ? 'saved' : 'completed',
              savedId: r.savedId,
            } : q))
        }
      } catch (e) {
        setBatch(prev => prev.map((q, idx) => idx === i
          ? { ...q, status: 'error', error: e instanceof Error ? e.message : 'Hata' } : q))
      }

      if (i < batchCount - 1) await new Promise(r => setTimeout(r, 1500))
    }

    setBatchRunning(false)
  }

  function toggleBatchPause() {
    const next = !batchPaused
    setBatchPaused(next)
    batchPausedRef.current = next
  }

  async function saveBatchItem(index: number, action: 'approve' | 'save_pending') {
    const q = batch[index]
    if (!q || q.status !== 'completed') return

    setBatch(prev => prev.map((item, i) => i === index ? { ...item, status: 'generating' } : item))
    try {
      const res = await fetch('/api/publisher/admin/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: {
            ...q,
            subject: getSubjectName(),
            topic: getTopicName(),
            exam_type: examMode,
            learning_outcome: getSelectedLearningOutcome(),
            image_description: imageDescription || null,
            price_credits: 1,
          },
          action,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setBatch(prev => prev.map((item, i) => i === index
        ? { ...item, status: 'saved', savedId: data.question.id } : item))
    } catch (e) {
      setBatch(prev => prev.map((item, i) => i === index
        ? { ...item, status: 'error', error: e instanceof Error ? e.message : 'Kaydetme hatası' } : item))
    }
  }

  async function saveAllBatch() {
    setSavingAll(true)
    const completedIdxs = batch.map((q, i) => q.status === 'completed' ? i : -1).filter(i => i >= 0)
    for (const idx of completedIdxs) {
      await saveBatchItem(idx, autoApprove ? 'approve' : 'save_pending')
    }
    setSavingAll(false)
    setSuccess(`${completedIdxs.length} soru kaydedildi!`)
    setTimeout(() => setSuccess(null), 4000)
  }

  const batchStats = {
    completed: batch.filter(q => q.status === 'completed').length,
    saved: batch.filter(q => q.status === 'saved').length,
    error: batch.filter(q => q.status === 'error').length,
    pending: batch.filter(q => ['pending', 'generating'].includes(q.status)).length,
  }

  // ── SEÇIM PANOSU (sol panel) ──────────────────────────────
  const selectedTopicObj = examMode
    ? examSubjects.find(s => s.subject_code === examSubjectCode)?.topics.find(t => t.id === selectedTopic)
    : topics.find(t => t.id === selectedTopic)

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-3 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl shadow-lg">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
              Yayınevi Soru Üretici
            </h1>
            <p className="text-gray-500">ÖSYM kalitesinde görüntülü soru • AI doğrulama • Vektör embedding</p>
          </div>
        </div>
        <div className="flex items-center gap-2 mt-3 text-sm text-gray-500">
          <Sparkles className="w-4 h-4 text-emerald-500" />
          <span>Gemini Pro + Gemini Embed + Gemini Verify Pipeline</span>
        </div>

        {/* Tek / Toplu sekme */}
        <div className="flex items-center gap-2 mt-4 p-1 bg-gray-100 rounded-xl w-fit">
          {[
            { id: 'single', label: 'Tekli Üretim', icon: Wand2, activeColor: 'text-emerald-600' },
            { id: 'batch', label: 'Toplu Üretim', icon: Layers, activeColor: 'text-orange-600' },
          ].map(({ id, label, icon: Icon, activeColor }) => (
            <button
              key={id}
              onClick={() => setMode(id as 'single' | 'batch')}
              className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                mode === id ? `bg-white shadow ${activeColor}` : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>
      </motion.div>

      <div className="grid lg:grid-cols-[380px_1fr] gap-6">
        {/* ─── SOL PANEL: Form ─────────────────────────────── */}
        <div className="space-y-4">

          {/* Sınav Modu */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-2xl shadow-sm p-5 border border-gray-100">
            <h2 className="font-semibold text-gray-900 mb-3 flex items-center gap-2 text-sm">
              <Target className="w-4 h-4 text-emerald-500" />
              Sınav / Seviye
            </h2>
            <div className="flex flex-wrap gap-2">
              {EXAM_MODES.map(({ mode: m, label, color }) => (
                <button key={String(m)} onClick={() => {
                  setExamMode(m); setSelectedSubject(''); setSelectedTopic('')
                  setExamSubjectCode(''); setTopics([])
                }}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    examMode === m ? `${color} text-white shadow` : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}>
                  {label}
                </button>
              ))}
            </div>
          </motion.div>

          {/* Sınıf (sadece sınıf bazlı) */}
          {!examMode && (
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-2xl shadow-sm p-5 border border-gray-100">
              <h2 className="font-semibold text-gray-900 mb-3 flex items-center gap-2 text-sm">
                <GraduationCap className="w-4 h-4 text-emerald-500" />
                Sınıf Seviyesi
              </h2>
              <div className="grid grid-cols-4 gap-2">
                {GRADES.map(g => (
                  <button key={g} onClick={() => setGrade(g)}
                    className={`py-2 rounded-xl text-sm font-medium transition-all ${
                      grade === g ? 'bg-emerald-500 text-white shadow-md scale-105' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                    }`}>
                    {g}. Sınıf
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Ders & Konu */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl shadow-sm p-5 border border-gray-100">
            <h2 className="font-semibold text-gray-900 mb-3 flex items-center gap-2 text-sm">
              <BookOpen className="w-4 h-4 text-emerald-500" />
              {examMode ? `${examMode} — Ders & Konu` : 'Ders & Konu'}
            </h2>

            {examMode ? (
              <>
                <div className="mb-3">
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Ders</label>
                  {loadingExamSubjects ? (
                    <div className="flex items-center gap-2 py-2 text-sm text-gray-400">
                      <Loader2 className="w-4 h-4 animate-spin" /> Yükleniyor...
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {examSubjects.map(sub => (
                        <button key={sub.subject_code}
                          onClick={() => { setExamSubjectCode(sub.subject_code); setSelectedTopic('') }}
                          className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                            examSubjectCode === sub.subject_code
                              ? 'bg-emerald-500 text-white shadow'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}>
                          {sub.subject_name}
                          <span className="ml-1 opacity-60">({sub.topics.length})</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Konu</label>
                  <select value={selectedTopic} onChange={e => setSelectedTopic(e.target.value)}
                    disabled={!examSubjectCode}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent disabled:opacity-50">
                    <option value="">Konu seçin...</option>
                    {(examSubjects.find(s => s.subject_code === examSubjectCode)?.topics || []).map(t => (
                      <option key={t.id} value={t.id}>
                        {t.main_topic}{t.sub_topic ? ` — ${t.sub_topic}` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            ) : (
              <>
                <div className="mb-3">
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Ders</label>
                  <select value={selectedSubject} onChange={e => { setSelectedSubject(e.target.value); setSelectedTopic('') }}
                    disabled={loadingSubjects}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent">
                    <option value="">Ders seçin...</option>
                    {subjects.map(s => <option key={s.id} value={s.id}>{s.icon} {s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Konu</label>
                  <select value={selectedTopic} onChange={e => setSelectedTopic(e.target.value)}
                    disabled={!selectedSubject || loadingTopics}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent disabled:opacity-50">
                    <option value="">Konu seçin...</option>
                    {topics.map(t => (
                      <option key={t.id} value={t.id}>
                        {t.main_topic}{t.sub_topic ? ` — ${t.sub_topic}` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}

            {/* Seçilen kazanım */}
            {selectedTopicObj?.learning_outcome && (
              <div className="mt-3 p-2.5 bg-emerald-50 rounded-xl border border-emerald-100">
                <p className="text-xs font-semibold text-emerald-700 mb-0.5">📋 Kazanım</p>
                <p className="text-xs text-emerald-600 leading-relaxed">{selectedTopicObj.learning_outcome}</p>
              </div>
            )}
          </motion.div>

          {/* Görsel Tipi */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}
            className="bg-white rounded-2xl shadow-sm p-5 border border-gray-100">
            <h2 className="font-semibold text-gray-900 mb-3 flex items-center gap-2 text-sm">
              <ImageIcon className="w-4 h-4 text-emerald-500" />
              Görsel Tipi
            </h2>
            <div className="grid grid-cols-2 gap-2">
              {IMAGE_TYPES.map(type => {
                const Icon = type.icon
                return (
                  <button key={type.id} onClick={() => setImageType(type.id)}
                    className={`p-3 rounded-xl text-left transition-all hover:scale-[1.02] ${
                      imageType === type.id
                        ? 'bg-emerald-50 border-2 border-emerald-500 shadow-md'
                        : 'bg-gray-50 border-2 border-transparent hover:border-gray-200'
                    }`}>
                    <span className="text-lg">{type.emoji}</span>
                    <p className="font-medium text-gray-900 text-xs mt-1">{type.name}</p>
                    <p className="text-gray-400 text-xs mt-0.5 line-clamp-1">{type.desc}</p>
                  </button>
                )
              })}
            </div>

            {/* Özel görsel açıklaması */}
            <div className="mt-3">
              <label className="block text-xs font-medium text-gray-600 mb-1.5">
                🎨 Özel Şekil / Görsel Tanımı (opsiyonel)
              </label>
              <input
                type="text"
                value={imageDescription}
                onChange={e => setImageDescription(e.target.value)}
                placeholder="ör. İkizkenar üçgen, köşe açıları 40-70-70 derece"
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-emerald-500"
              />
              <p className="text-xs text-gray-400 mt-1">
                Boş bırakırsanız AI otomatik tasarlar
              </p>
            </div>
          </motion.div>

          {/* Zorluk */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl shadow-sm p-5 border border-gray-100">
            <h2 className="font-semibold text-gray-900 mb-3 flex items-center gap-2 text-sm">
              <Target className="w-4 h-4 text-emerald-500" />
              Zorluk
            </h2>
            <div className="flex flex-wrap gap-2">
              {DIFFICULTIES.map(d => (
                <button key={d.id} onClick={() => setDifficulty(d.id)}
                  className={`px-4 py-2 rounded-xl border-2 font-medium transition-all text-sm ${
                    difficulty === d.id ? `${d.cls} scale-105 shadow-md` : 'bg-gray-50 border-gray-200 text-gray-600'
                  }`}>
                  {d.emoji} {d.name}
                </button>
              ))}
            </div>
          </motion.div>

          {/* Görsel üret toggle */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.22 }}
            className="bg-white rounded-2xl shadow-sm p-5 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900 text-sm">Görsel Üret</p>
                <p className="text-xs text-gray-500">Görseli AI ile üret (~30 sn ekstra)</p>
              </div>
              <button onClick={() => setGenerateImage(!generateImage)}
                className={`w-12 h-6 rounded-full transition-colors ${generateImage ? 'bg-emerald-500' : 'bg-gray-300'}`}>
                <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform mx-0.5 ${generateImage ? 'translate-x-6' : 'translate-x-0'}`} />
              </button>
            </div>
            <div className="flex items-center justify-between mt-3">
              <div>
                <p className="font-medium text-gray-900 text-sm">Otomatik Onayla</p>
                <p className="text-xs text-gray-500">Direkt markete çıkar</p>
              </div>
              <button onClick={() => setAutoApprove(!autoApprove)}
                className={`w-12 h-6 rounded-full transition-colors ${autoApprove ? 'bg-green-500' : 'bg-gray-300'}`}>
                <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform mx-0.5 ${autoApprove ? 'translate-x-6' : 'translate-x-0'}`} />
              </button>
            </div>
          </motion.div>

          {/* Toplu mod sayı + dağılım */}
          {mode === 'batch' && (
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-2xl shadow-sm p-5 border border-gray-100">
              <h2 className="font-semibold text-gray-900 mb-3 text-sm flex items-center gap-2">
                <Layers className="w-4 h-4 text-orange-500" />
                Toplu Üretim Ayarları
              </h2>
              <div className="mb-3">
                <label className="text-xs font-medium text-gray-600">Soru Sayısı: {batchCount}</label>
                <input type="range" min={1} max={20} value={batchCount} onChange={e => setBatchCount(+e.target.value)}
                  className="w-full mt-1 accent-orange-500" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-2 block">Zorluk Dağılımı</label>
                <div className="flex flex-wrap gap-2">
                  {DIFFICULTIES.map(d => (
                    <button key={d.id} onClick={() => setBatchDiff(prev => ({ ...prev, [d.id]: !prev[d.id as keyof typeof prev] }))}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium border-2 transition-all ${
                        batchDiff[d.id as keyof typeof batchDiff] ? d.cls : 'bg-gray-50 border-gray-200 text-gray-400'
                      }`}>
                      {d.emoji} {d.name}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* Üret butonu */}
          {mode === 'single' ? (
            <motion.button initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
              onClick={handleGenerate}
              disabled={generating || !isFormValid()}
              className={`w-full py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 transition-all ${
                generating || !isFormValid()
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:shadow-xl hover:scale-[1.02]'
              }`}>
              {generating ? <><Loader2 className="w-6 h-6 animate-spin" /> Üretiliyor...</>
                : <><Sparkles className="w-6 h-6" /> Yayınevi Sorusu Üret</>}
            </motion.button>
          ) : (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
              className="flex gap-2">
              <button
                onClick={batchRunning ? toggleBatchPause : startBatch}
                disabled={!isFormValid() && !batchRunning}
                className={`flex-1 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all ${
                  batchRunning
                    ? batchPaused
                      ? 'bg-green-500 text-white hover:bg-green-600'
                      : 'bg-amber-500 text-white hover:bg-amber-600'
                    : !isFormValid()
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-orange-500 to-amber-500 text-white hover:shadow-xl'
                }`}>
                {batchRunning
                  ? batchPaused ? <><Play className="w-5 h-5" /> Devam Et</> : <><Pause className="w-5 h-5" /> Duraklat</>
                  : <><Layers className="w-5 h-5" /> {batchCount} Soru Üret</>}
              </button>
              {batch.length > 0 && (
                <button onClick={() => setBatch([])}
                  className="px-4 py-4 rounded-2xl bg-gray-200 text-gray-600 hover:bg-gray-300 transition-colors">
                  <Trash2 className="w-5 h-5" />
                </button>
              )}
            </motion.div>
          )}
        </div>

        {/* ─── SAĞ PANEL: Sonuçlar ─────────────────────────── */}
        <div className="space-y-4">
          {/* Hata / Başarı */}
          <AnimatePresence>
            {error && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
                <XCircle className="w-5 h-5 text-red-500 shrink-0" />
                <p className="text-red-700 text-sm">{error}</p>
              </motion.div>
            )}
            {success && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />
                <p className="text-green-700 text-sm font-medium">{success}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── TEKLİ SONUÇ ──────────────────────────────── */}
          {mode === 'single' && (
            <>
              {generating && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
                  <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Brain className="w-8 h-8 text-emerald-500 animate-pulse" />
                  </div>
                  <p className="text-gray-700 font-medium">ÖSYM kalitesinde soru üretiliyor...</p>
                  <p className="text-gray-400 text-sm mt-1">Gemini üretim → cevap doğrulama → embedding</p>
                  <div className="mt-4 flex justify-center gap-1">
                    {[0, 0.15, 0.3].map(d => (
                      <div key={d} className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce"
                        style={{ animationDelay: `${d}s` }} />
                    ))}
                  </div>
                </motion.div>
              )}

              {result && !generating && (
                <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
                  className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  {/* Görsel */}
                  {result.image_base64 && (
                    <div className="bg-gray-50 border-b border-gray-100 p-4">
                      <img src={result.image_base64} alt="Soru görseli"
                        className="max-h-56 mx-auto object-contain rounded-xl" />
                    </div>
                  )}

                  <div className="p-6">
                    {/* Badges */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                        DIFFICULTIES.find(d => d.id === result.difficulty)?.cls || 'bg-gray-100'
                      }`}>
                        {DIFFICULTIES.find(d => d.id === result.difficulty)?.emoji}{' '}
                        {DIFFICULTIES.find(d => d.id === result.difficulty)?.name}
                      </span>
                      {result.bloom_level && (
                        <span className="px-2.5 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                          🎓 {result.bloom_level}
                        </span>
                      )}
                      {result.verified ? (
                        <span className="px-2.5 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" /> Doğrulandı
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-medium flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> Doğrulanamadı
                        </span>
                      )}
                      {result.status === 'saved' && (
                        <span className="px-2.5 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">✓ Kaydedildi</span>
                      )}
                    </div>

                    {/* Soru */}
                    <div className="mb-4">
                      <p className="text-xs font-semibold text-gray-500 mb-1.5">SORU</p>
                      <p className="text-gray-900 font-medium leading-relaxed">
                        <MathRenderer content={result.question_text} />
                      </p>
                    </div>

                    {/* Şıklar */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
                      {Object.entries(result.options).map(([key, val]) => (
                        <div key={key} className={`p-3 rounded-xl border-2 text-sm ${
                          key === result.correct_answer
                            ? 'border-green-400 bg-green-50'
                            : 'border-gray-200 bg-gray-50'
                        }`}>
                          <span className={`font-bold ${key === result.correct_answer ? 'text-green-600' : 'text-gray-600'}`}>{key})</span>{' '}
                          <MathRenderer content={val} />
                          {key === result.correct_answer && <CheckCircle className="inline ml-1.5 w-3.5 h-3.5 text-green-500" />}
                        </div>
                      ))}
                    </div>

                    {/* Açıklama */}
                    {result.explanation && (
                      <div className="bg-blue-50 rounded-xl p-4 mb-4">
                        <p className="text-xs font-semibold text-blue-800 mb-1">AÇIKLAMA</p>
                        <p className="text-blue-700 text-sm"><MathRenderer content={result.explanation} /></p>
                      </div>
                    )}

                    {/* Kaydet butonları */}
                    {result.status !== 'saved' && (
                      <div className="flex gap-3">
                        <button onClick={() => handleSaveSingle('save_pending')} disabled={saving}
                          className="flex-1 border-2 border-gray-200 text-gray-700 py-2.5 rounded-xl text-sm font-medium hover:border-gray-300 disabled:opacity-50 flex items-center justify-center gap-2">
                          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                          İncelemeye Al
                        </button>
                        <button onClick={() => handleSaveSingle('approve')} disabled={saving}
                          className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-500 text-white py-2.5 rounded-xl text-sm font-medium hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                          Onayla & Yayınla
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {!result && !generating && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-12 text-center border-2 border-dashed border-emerald-200">
                  <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Building2 className="w-10 h-10 text-emerald-500" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">Yayınevi Sorusu Üretin</h3>
                  <p className="text-gray-500 text-sm max-w-sm mx-auto">
                    Sınav modu, ders, konu ve görsel tipini seçin. AI ÖSYM formatında doğrulanmış, embedding'li soru üretecek.
                  </p>
                  <div className="mt-6 grid grid-cols-3 gap-3 max-w-xs mx-auto">
                    {IMAGE_TYPES.slice(0, 3).map(t => (
                      <div key={t.id} className="p-3 bg-white rounded-xl shadow-sm text-center">
                        <span className="text-2xl">{t.emoji}</span>
                        <p className="text-xs text-gray-600 mt-1">{t.name}</p>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </>
          )}

          {/* ── TOPLU SONUÇLAR ────────────────────────────── */}
          {mode === 'batch' && (
            <>
              {/* İstatistik bar */}
              {batch.length > 0 && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex gap-4 text-sm">
                      <span className="text-green-600 font-semibold">✓ {batchStats.completed} tamamlandı</span>
                      <span className="text-blue-600 font-semibold">💾 {batchStats.saved} kaydedildi</span>
                      <span className="text-red-500 font-semibold">✗ {batchStats.error} hata</span>
                      <span className="text-gray-400 font-semibold">⏳ {batchStats.pending} bekliyor</span>
                    </div>
                    {batchStats.completed > 0 && !batchRunning && (
                      <button onClick={saveAllBatch} disabled={savingAll}
                        className="flex items-center gap-2 bg-emerald-500 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-emerald-600 disabled:opacity-50 transition-colors">
                        {savingAll ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Tümünü Kaydet
                      </button>
                    )}
                  </div>
                  {/* Progress bar */}
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${batch.length > 0 ? ((batchStats.completed + batchStats.saved) / batch.length) * 100 : 0}%` }} />
                  </div>
                </motion.div>
              )}

              {/* Soru kartları */}
              <div className="space-y-3">
                {batch.map((q, i) => (
                  <motion.div key={q.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className={`bg-white rounded-2xl border shadow-sm p-4 ${
                      q.status === 'generating' ? 'border-emerald-300 bg-emerald-50/30'
                        : q.status === 'completed' ? 'border-green-200'
                        : q.status === 'saved' ? 'border-blue-200 bg-blue-50/20'
                        : q.status === 'error' ? 'border-red-200 bg-red-50/20'
                        : 'border-gray-100'
                    }`}>
                    <div className="flex items-start gap-3">
                      {/* Status icon */}
                      <div className="shrink-0 mt-0.5">
                        {q.status === 'pending' && <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center"><span className="text-xs font-bold text-gray-500">{i + 1}</span></div>}
                        {q.status === 'generating' && <Loader2 className="w-6 h-6 text-emerald-500 animate-spin" />}
                        {q.status === 'completed' && <CheckCircle className="w-6 h-6 text-green-500" />}
                        {q.status === 'saved' && <CheckSquare className="w-6 h-6 text-blue-500" />}
                        {q.status === 'error' && <XCircle className="w-6 h-6 text-red-500" />}
                      </div>

                      <div className="flex-1 min-w-0">
                        {q.status === 'pending' && <p className="text-sm text-gray-400">Bekliyor...</p>}
                        {q.status === 'generating' && (
                          <div>
                            <p className="text-sm text-emerald-600 font-medium">Üretiliyor...</p>
                            <div className="flex gap-1 mt-2">
                              {[0, 0.1, 0.2].map(d => (
                                <div key={d} className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce"
                                  style={{ animationDelay: `${d}s` }} />
                              ))}
                            </div>
                          </div>
                        )}
                        {q.status === 'error' && <p className="text-sm text-red-600">{q.error || 'Üretim hatası'}</p>}
                        {(q.status === 'completed' || q.status === 'saved') && q.question_text && (
                          <div>
                            <div className="flex flex-wrap gap-1.5 mb-2">
                              <span className={`text-xs px-2 py-0.5 rounded-full ${DIFFICULTIES.find(d => d.id === q.difficulty)?.cls || 'bg-gray-100'}`}>
                                {q.difficulty}
                              </span>
                              {q.verified && <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full">✓ Doğrulandı</span>}
                              {q.status === 'saved' && <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">💾 Kaydedildi</span>}
                            </div>
                            <p className="text-sm text-gray-800 line-clamp-2">{q.question_text}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              Cevap: <span className="font-bold text-green-600">{q.correct_answer}</span>
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Kaydet butonları (completed) */}
                      {q.status === 'completed' && (
                        <div className="flex flex-col gap-1 shrink-0">
                          <button onClick={() => saveBatchItem(i, 'save_pending')}
                            className="text-xs px-2.5 py-1.5 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 flex items-center gap-1">
                            <Save className="w-3 h-3" /> İncele
                          </button>
                          <button onClick={() => saveBatchItem(i, 'approve')}
                            className="text-xs px-2.5 py-1.5 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" /> Onayla
                          </button>
                          <button onClick={() => setBatch(prev => prev.filter((_, idx) => idx !== i))}
                            className="text-xs px-2.5 py-1.5 border border-red-100 text-red-400 rounded-lg hover:bg-red-50 flex items-center gap-1">
                            <Trash2 className="w-3 h-3" /> Sil
                          </button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>

              {batch.length === 0 && !batchRunning && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl p-12 text-center border-2 border-dashed border-orange-200">
                  <Layers className="w-16 h-16 text-orange-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">Toplu Üretim</h3>
                  <p className="text-gray-500 text-sm">Parametreleri seçin ve üretimi başlatın. Sorular otomatik doğrulanır ve embedding'leri oluşturulur.</p>
                </motion.div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
