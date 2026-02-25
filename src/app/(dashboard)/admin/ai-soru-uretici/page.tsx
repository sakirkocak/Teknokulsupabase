'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback } from 'react'
import { useProfile } from '@/hooks/useProfile'
import { createClient } from '@/lib/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import MathRenderer from '@/components/MathRenderer'
import DOMPurify from 'isomorphic-dompurify'
import { 
  Wand2, 
  Sparkles, 
  BookOpen, 
  GraduationCap,
  Target,
  Save,
  Loader2,
  CheckCircle,
  XCircle,
  Edit3,
  Trash2,
  RefreshCw,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  ArrowLeft,
  ArrowRight,
  Check,
  Layers,
  Volume2,
  Play,
  Pause,
  Square,
  Zap,
  Clock,
  BarChart3,
  Settings2
} from 'lucide-react'
import SpeakButton from '@/components/SpeakButton'

// Otomatik üretim yapılandırması
const AUTO_GEN_CONFIG = {
  DELAY_BETWEEN_REQUESTS: 8000,  // 8 saniye (rate limit için artırıldı)
  ERROR_RETRY_DELAY: 45000,      // 45 saniye (rate limit sonrası daha uzun bekle)
  MAX_RETRIES: 5,                // 5 deneme (artırıldı)
  MAX_QUESTIONS_PER_TOPIC: 10,
  DAILY_LIMIT: 1000,
  DB_RETRY_DELAY: 2000,          // DB hatası sonrası 2 saniye bekle
  DB_MAX_RETRIES: 3,             // DB için 3 deneme
}

// Toplu üretim durumu
interface BatchProgress {
  currentTopicIndex: number
  totalTopics: number
  completedTopics: string[]
  failedTopics: string[]
  totalQuestionsGenerated: number
  totalQuestionsSaved: number
  startTime: Date | null
  currentTopic: Topic | null
  status: 'idle' | 'running' | 'paused' | 'completed' | 'error'
  lastError: string | null
}

interface Topic {
  id: string
  subject_id: string
  grade: number
  main_topic: string
  sub_topic: string | null
  learning_outcome: string | null
  unit_number: number | null
}

interface Subject {
  id: string
  name: string
  code: string
  icon: string
  color: string
}

interface ExamTopic {
  id: string
  exam_type: string
  subject_code: string
  subject_name: string
  main_topic: string
  sub_topic: string | null
  topic_order: number
  question_weight: number
  osym_frequency: string
}

interface GeneratedQuestion {
  question_text: string
  options: {
    A: string
    B: string
    C: string
    D: string
    E?: string
  }
  correct_answer: string
  explanation: string
  difficulty: string
  bloom_level: string
  // 🆕 Yeni Nesil Soru alanları
  visual_type?: string
  visual_content?: string
}

const STEPS = [
  { id: 1, name: 'Sınıf', icon: GraduationCap },
  { id: 2, name: 'Ders', icon: BookOpen },
  { id: 3, name: 'Konu', icon: Layers },
  { id: 4, name: 'Ayarlar', icon: Target },
  { id: 5, name: 'Üret', icon: Wand2 }
]

const difficultyLabels: Record<string, { label: string; color: string; bg: string; emoji: string }> = {
  easy: { label: 'Kolay', color: 'text-green-600', bg: 'bg-green-100', emoji: '🟢' },
  medium: { label: 'Orta', color: 'text-yellow-600', bg: 'bg-yellow-100', emoji: '🟡' },
  hard: { label: 'Zor', color: 'text-orange-600', bg: 'bg-orange-100', emoji: '🟠' },
  legendary: { label: 'Efsane', color: 'text-red-600', bg: 'bg-red-100', emoji: '🔴' }
}

const bloomLabels: Record<string, string> = {
  bilgi: '📚 Bilgi',
  kavrama: '💡 Kavrama',
  uygulama: '🔧 Uygulama',
  analiz: '🔍 Analiz',
  sentez: '🧩 Sentez',
  değerlendirme: '⚖️ Değerlendirme'
}

const gradeInfo: Record<number, { level: string; emoji: string; exam?: string }> = {
  1: { level: 'İlkokul', emoji: '📚' },
  2: { level: 'İlkokul', emoji: '📚' },
  3: { level: 'İlkokul', emoji: '📚' },
  4: { level: 'İlkokul', emoji: '📚' },
  5: { level: 'Ortaokul', emoji: '🏫' },
  6: { level: 'Ortaokul', emoji: '🏫' },
  7: { level: 'Ortaokul', emoji: '🏫' },
  8: { level: 'Ortaokul', emoji: '🏫', exam: 'LGS' },
  9: { level: 'Lise', emoji: '🎓' },
  10: { level: 'Lise', emoji: '🎓' },
  11: { level: 'Lise', emoji: '🎓', exam: 'TYT' },
  12: { level: 'Lise', emoji: '🎓', exam: 'TYT/AYT' }
}

export default function AIQuestionGeneratorPage() {
  const { profile, loading: profileLoading } = useProfile()
  const supabase = createClient()
  
  // Wizard state
  const [currentStep, setCurrentStep] = useState(1)
  
  // Form state
  const [selectedGrade, setSelectedGrade] = useState<number | null>(null)
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [selectedSubject, setSelectedSubject] = useState<string>('')
  const [topics, setTopics] = useState<Topic[]>([])
  const [selectedTopic, setSelectedTopic] = useState<string>('')
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('medium')
  const [questionCount, setQuestionCount] = useState<number>(5)
  
  // Generated questions state
  const [generatedQuestions, setGeneratedQuestions] = useState<GeneratedQuestion[]>([])
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null)
  
  // Loading states
  const [loadingSubjects, setLoadingSubjects] = useState(false)
  const [loadingTopics, setLoadingTopics] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<{ success: number; failed: number } | null>(null)

  // ========== SINAV BAZLI MOD ==========
  const [selectedExamMode, setSelectedExamMode] = useState<'TYT' | 'AYT' | 'KPSS' | 'KPSS_ONLISANS' | 'KPSS_ORTAOGRETIM' | null>(null)
  const [examSubjects, setExamSubjects] = useState<{ subject_code: string; subject_name: string; topics: ExamTopic[] }[]>([])
  const [selectedExamSubject, setSelectedExamSubject] = useState<string>('')
  const [examTopics, setExamTopics] = useState<ExamTopic[]>([])
  const [selectedExamTopic, setSelectedExamTopic] = useState<ExamTopic | null>(null)
  const [loadingExamTopics, setLoadingExamTopics] = useState(false)

  // ========== DİL SEÇİMİ (QUESTLY GLOBAL) ==========
  const [selectedLanguage, setSelectedLanguage] = useState<'tr' | 'en'>('tr')
  
  // ========== YENİ NESİL SORU (GÖRSEL TÜRÜ) ==========
  type VisualType = 'none' | 'table' | 'chart' | 'flowchart' | 'pie' | 'diagram' | 'mixed'
  const [selectedVisualType, setSelectedVisualType] = useState<VisualType>('none')
  const visualTypeLabels: Record<VisualType, { label: string; emoji: string; description: string }> = {
    none: { label: 'Metin', emoji: '📝', description: 'Sadece metin tabanlı sorular' },
    table: { label: 'Tablo', emoji: '📊', description: 'LaTeX tablo içeren sorular' },
    chart: { label: 'Grafik', emoji: '📈', description: 'Çubuk/çizgi grafik içeren sorular' },
    flowchart: { label: 'Akış Şeması', emoji: '🔄', description: 'Süreç ve adım gösteren sorular' },
    pie: { label: 'Pasta Grafiği', emoji: '🥧', description: 'Dağılım ve oran gösteren sorular' },
    diagram: { label: 'Diyagram', emoji: '🔬', description: 'Bilimsel şema içeren sorular' },
    mixed: { label: 'Karışık', emoji: '🎨', description: 'AI en uygun türü seçsin' },
  }
  
  // ========== TOPLU ÜRETİM MODÜ ==========
  const [generationMode, setGenerationMode] = useState<'single' | 'batch'>('single')
  const [batchSelectedSubjects, setBatchSelectedSubjects] = useState<string[]>([])
  const [batchSelectedDifficulties, setBatchSelectedDifficulties] = useState<string[]>(['medium'])
  const [batchQuestionsPerTopic, setBatchQuestionsPerTopic] = useState(5)
  const [batchSelectedVisualType, setBatchSelectedVisualType] = useState<VisualType>('none')
  const [batchProgress, setBatchProgress] = useState<BatchProgress>({
    currentTopicIndex: 0,
    totalTopics: 0,
    completedTopics: [],
    failedTopics: [],
    totalQuestionsGenerated: 0,
    totalQuestionsSaved: 0,
    startTime: null,
    currentTopic: null,
    status: 'idle',
    lastError: null,
  })
  const [batchTopics, setBatchTopics] = useState<Topic[]>([])
  const [batchExamTopics, setBatchExamTopics] = useState<ExamTopic[]>([])
  const [batchSelectedExamSubjects, setBatchSelectedExamSubjects] = useState<string[]>([])
  const [shouldStopBatch, setShouldStopBatch] = useState(false)
  const [batchLogs, setBatchLogs] = useState<{ time: Date; message: string; type: 'info' | 'success' | 'error' | 'warning' }[]>([])

  // Group topics by main_topic for better organization
  const groupedTopics = topics.reduce((acc, topic) => {
    const key = topic.main_topic
    if (!acc[key]) {
      acc[key] = []
    }
    acc[key].push(topic)
    return acc
  }, {} as Record<string, Topic[]>)

  // Load subjects when grade changes
  useEffect(() => {
    if (selectedGrade) {
      loadSubjects()
    }
  }, [selectedGrade])

  // Load topics when subject changes
  useEffect(() => {
    if (selectedSubject && selectedGrade) {
      loadTopics()
    } else {
      setTopics([])
      setSelectedTopic('')
    }
  }, [selectedSubject, selectedGrade])

  const loadSubjects = useCallback(async () => {
    if (!selectedGrade) return
    setLoadingSubjects(true)
    try {
      const { data, error } = await supabase
        .from('grade_subjects')
        .select(`
          subject_id,
          subjects (
            id,
            name,
            name_en,
            slug,
            icon,
            color,
            is_global
          )
        `)
        .eq('grade_id', selectedGrade)

      if (error) throw error

      // Filter subjects based on language selection
      // English: show only is_global=true subjects
      // Turkish: show all subjects
      let subjectList = data
        ?.map((gs: any) => ({
          id: gs.subjects?.id,
          name: selectedLanguage === 'en' && gs.subjects?.name_en 
            ? gs.subjects.name_en 
            : gs.subjects?.name,
          code: gs.subjects?.slug,
          icon: gs.subjects?.icon || '📖',
          color: gs.subjects?.color || 'blue',
          is_global: gs.subjects?.is_global || false
        }))
        .filter((s: any) => s.id) || []

      // For English, only show global subjects
      if (selectedLanguage === 'en') {
        subjectList = subjectList.filter((s: any) => s.is_global)
      }

      setSubjects(subjectList)
      setSelectedSubject('')
      setSelectedTopic('')
    } catch (error) {
      console.error('Dersler yüklenirken hata:', error)
    } finally {
      setLoadingSubjects(false)
    }
  }, [selectedGrade, selectedLanguage, supabase])

  const loadTopics = useCallback(async () => {
    if (!selectedSubject || !selectedGrade) return
    setLoadingTopics(true)
    try {
      const { data, error } = await supabase
        .from('topics')
        .select('*')
        .eq('subject_id', selectedSubject)
        .eq('grade', selectedGrade)
        .eq('is_active', true)
        .order('unit_number', { ascending: true })
        .order('main_topic', { ascending: true })

      if (error) throw error
      setTopics(data || [])
      setSelectedTopic('')
    } catch (error) {
      console.error('Konular yüklenirken hata:', error)
    } finally {
      setLoadingTopics(false)
    }
  }, [selectedSubject, selectedGrade, supabase])

  // Load exam topics when exam mode changes
  const loadExamTopics = useCallback(async (examType: string) => {
    setLoadingExamTopics(true)
    try {
      const response = await fetch(`/api/exam-topics?exam_type=${examType}`)
      const data = await response.json()
      if (data.subjects) {
        setExamSubjects(data.subjects)
      }
    } catch (error) {
      console.error('Sınav konuları yüklenirken hata:', error)
    } finally {
      setLoadingExamTopics(false)
    }
  }, [])

  useEffect(() => {
    if (selectedExamMode) {
      loadExamTopics(selectedExamMode)
      setSelectedExamSubject('')
      setSelectedExamTopic(null)
      setExamTopics([])
      setCurrentStep(1)
    }
  }, [selectedExamMode, loadExamTopics])

  // When exam subject changes, filter topics
  useEffect(() => {
    if (selectedExamSubject && examSubjects.length > 0) {
      const subjectData = examSubjects.find(s => s.subject_code === selectedExamSubject)
      setExamTopics(subjectData?.topics || [])
      setSelectedExamTopic(null)
    }
  }, [selectedExamSubject, examSubjects])

  async function handleGenerate() {
    // Sınav modu kontrolü
    if (selectedExamMode) {
      if (!selectedExamSubject || !selectedExamTopic) {
        alert('Lütfen ders ve konu seçin')
        return
      }
    } else {
      if (!selectedSubject || !selectedTopic || !selectedGrade) {
        alert('Lütfen tüm seçimleri yapın')
        return
      }
    }

    const isExamMode = !!selectedExamMode

    // Sınav modunda exam topic bilgilerini kullan
    const subjectName = isExamMode ? selectedExamTopic!.subject_name : subjects.find(s => s.id === selectedSubject)?.name
    const topicName = isExamMode
      ? selectedExamTopic!.main_topic + (selectedExamTopic!.sub_topic ? ` - ${selectedExamTopic!.sub_topic}` : '')
      : (() => { const t = topics.find(t => t.id === selectedTopic); return t ? t.main_topic + (t.sub_topic ? ` - ${t.sub_topic}` : '') : '' })()
    const learningOutcome = isExamMode
      ? selectedExamTopic!.main_topic + (selectedExamTopic!.sub_topic ? ` - ${selectedExamTopic!.sub_topic}` : '')
      : topics.find(t => t.id === selectedTopic)?.learning_outcome || topicName

    if (!subjectName) return

    setGenerating(true)
    setGeneratedQuestions([])
    setSaveStatus(null)

    try {
      const response = await fetch('/api/ai/generate-curriculum-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grade: isExamMode ? 11 : selectedGrade,
          subject: subjectName,
          topic: topicName,
          learningOutcome,
          difficulty: selectedDifficulty,
          count: questionCount,
          lang: selectedLanguage,
          visualType: selectedVisualType,
          examMode: selectedExamMode  // 📋 TYT/AYT modu
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Soru üretme hatası')
      }

      setGeneratedQuestions(data.questions || [])
    } catch (error: any) {
      console.error('Soru üretme hatası:', error)
      alert(`Hata: ${error.message}`)
    } finally {
      setGenerating(false)
    }
  }

  async function handleSaveAll() {
    if (generatedQuestions.length === 0) return

    const isExamMode = !!selectedExamMode

    // Sınav modunda topic_id olarak curriculum topic'i bulmaya çalış, yoksa null
    const topicId = isExamMode ? null : selectedTopic
    if (!isExamMode && !topicId) return

    setSaving(true)
    let successCount = 0
    let failedCount = 0
    const savedQuestionIds: string[] = []

    try {
      for (const question of generatedQuestions) {
        const insertData: Record<string, any> = {
          difficulty: question.difficulty,
          question_text: question.question_text,
          options: question.options,
          correct_answer: question.correct_answer,
          explanation: question.explanation,
          source: isExamMode ? `AI Generated (${selectedExamMode})` : selectedLanguage === 'en' ? 'AI Generated (Questly)' : 'AI Generated',
          is_active: true,
          created_by: profile?.id,
          lang: selectedLanguage,
          visual_type: question.visual_type || null,
          visual_content: question.visual_content || null,
        }

        // Sınav modu: exam_types ve exam_topic_id ekle
        if (isExamMode && selectedExamTopic) {
          insertData.exam_types = [selectedExamMode!.toLowerCase()]
          insertData.exam_topic_id = selectedExamTopic.id
        }

        // Curriculum topic_id varsa ekle
        if (topicId) {
          insertData.topic_id = topicId
        }

        const { data, error } = await supabase
          .from('questions')
          .insert(insertData)
          .select('id')
          .single()

        if (error) {
          console.error('Soru kaydetme hatası:', error)
          failedCount++
        } else {
          successCount++
          if (data?.id) {
            savedQuestionIds.push(data.id)
          }
        }
      }

      // 🔄 Typesense'e otomatik senkronize et
      if (savedQuestionIds.length > 0) {
        try {
          await fetch('/api/admin/questions/sync', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ questionIds: savedQuestionIds })
          })
          console.log(`✅ ${savedQuestionIds.length} soru Typesense'e senkronize edildi`)
        } catch (syncError) {
          console.error('Typesense sync hatası:', syncError)
          // Sync hatası kritik değil, devam et
        }
      }

      setSaveStatus({ success: successCount, failed: failedCount })
      
      if (successCount > 0) {
        setGeneratedQuestions([])
      }
    } catch (error) {
      console.error('Kaydetme hatası:', error)
    } finally {
      setSaving(false)
    }
  }

  function handleEditQuestion(index: number, field: string, value: any) {
    const updated = [...generatedQuestions]
    if (field.startsWith('options.')) {
      const optionKey = field.split('.')[1]
      updated[index] = {
        ...updated[index],
        options: {
          ...updated[index].options,
          [optionKey]: value
        }
      }
    } else {
      updated[index] = { ...updated[index], [field]: value }
    }
    setGeneratedQuestions(updated)
  }

  function handleDeleteQuestion(index: number) {
    setGeneratedQuestions(prev => prev.filter((_, i) => i !== index))
  }

  function canProceedToStep(step: number): boolean {
    if (selectedExamMode) {
      // Sınav bazlı mod: TYT dersi → TYT konusu → Ayarlar → Üret
      switch (step) {
        case 2: return selectedExamSubject !== ''
        case 3: return selectedExamSubject !== '' && selectedExamTopic !== null
        case 4: return selectedExamSubject !== '' && selectedExamTopic !== null
        case 5: return selectedExamSubject !== '' && selectedExamTopic !== null
        default: return true
      }
    }
    switch (step) {
      case 2: return selectedGrade !== null
      case 3: return selectedGrade !== null && selectedSubject !== ''
      case 4: return selectedGrade !== null && selectedSubject !== '' && selectedTopic !== ''
      case 5: return selectedGrade !== null && selectedSubject !== '' && selectedTopic !== ''
      default: return true
    }
  }

  function goToStep(step: number) {
    if (step >= 1 && step <= 5 && canProceedToStep(step)) {
      setCurrentStep(step)
    }
  }

  // ========== TOPLU ÜRETİM FONKSİYONLARI ==========
  
  const addBatchLog = (message: string, type: 'info' | 'success' | 'error' | 'warning' = 'info') => {
    setBatchLogs(prev => [...prev.slice(-49), { time: new Date(), message, type }])
  }

  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

  const loadBatchTopics = async () => {
    if (!selectedGrade || batchSelectedSubjects.length === 0) return
    
    addBatchLog(`${selectedGrade}. sınıf için konular yükleniyor...`, 'info')
    
    const { data, error } = await supabase
      .from('topics')
      .select('*')
      .eq('grade', selectedGrade)
      .in('subject_id', batchSelectedSubjects)
      .eq('is_active', true)
      .order('subject_id')
      .order('unit_number')
    
    if (error) {
      addBatchLog(`Konular yüklenirken hata: ${error.message}`, 'error')
      return
    }
    
    setBatchTopics(data || [])
    addBatchLog(`${data?.length || 0} konu bulundu`, 'success')
  }

  const loadBatchExamTopics = () => {
    if (batchSelectedExamSubjects.length === 0 || examSubjects.length === 0) return

    const topics: ExamTopic[] = []
    for (const subjectCode of batchSelectedExamSubjects) {
      const subjectData = examSubjects.find(s => s.subject_code === subjectCode)
      if (subjectData) {
        topics.push(...subjectData.topics)
      }
    }

    setBatchExamTopics(topics)
    addBatchLog(`${topics.length} ${selectedExamMode} konusu seçildi (${batchSelectedExamSubjects.length} ders)`, 'success')
  }

  useEffect(() => {
    if (generationMode === 'batch' && selectedExamMode && batchSelectedExamSubjects.length > 0 && examSubjects.length > 0) {
      loadBatchExamTopics()
    } else if (generationMode === 'batch' && !selectedExamMode && selectedGrade && batchSelectedSubjects.length > 0) {
      loadBatchTopics()
    }
  }, [generationMode, selectedGrade, batchSelectedSubjects, selectedExamMode, batchSelectedExamSubjects, examSubjects])

  const generateQuestionsForExamTopic = async (examTopic: ExamTopic, difficulty: string): Promise<GeneratedQuestion[]> => {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 60000)

    try {
      const response = await fetch('/api/ai/generate-curriculum-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: examTopic.subject_name,
          topic: examTopic.main_topic + (examTopic.sub_topic ? ` - ${examTopic.sub_topic}` : ''),
          learningOutcome: examTopic.main_topic + (examTopic.sub_topic ? ` - ${examTopic.sub_topic}` : ''),
          difficulty,
          count: batchQuestionsPerTopic,
          lang: selectedLanguage,
          visualType: batchSelectedVisualType,
          examMode: 'TYT'
        }),
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        const errorMsg = errorData.error || `HTTP ${response.status}`
        if (response.status === 429 || errorMsg.includes('429') || errorMsg.includes('rate') || errorMsg.includes('quota')) {
          throw new Error(`429: Rate limit aşıldı`)
        }
        throw new Error(errorMsg)
      }

      const data = await response.json()
      return data.questions || []
    } catch (error: any) {
      clearTimeout(timeoutId)
      if (error.name === 'AbortError') throw new Error('Timeout: AI yanıt vermedi (60s)')
      if (error.message === 'Failed to fetch') throw new Error('Network hatası: Bağlantı kurulamadı')
      throw error
    }
  }

  const generateQuestionsForTopic = async (topic: Topic, difficulty: string): Promise<GeneratedQuestion[]> => {
    const subject = subjects.find(s => s.id === topic.subject_id)
    if (!subject) throw new Error('Ders bulunamadı')

    // AbortController ile timeout ekle (60 saniye)
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 60000)

    try {
      const response = await fetch('/api/ai/generate-curriculum-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grade: selectedGrade,
          subject: subject.name,
          topic: topic.main_topic + (topic.sub_topic ? ` - ${topic.sub_topic}` : ''),
          learningOutcome: topic.learning_outcome || topic.main_topic,
          difficulty: difficulty,
          count: batchQuestionsPerTopic,
          lang: selectedLanguage,  // 🌍 Questly Global için dil desteği
          visualType: batchSelectedVisualType  // 🆕 Yeni Nesil Soru görsel türü
        }),
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        const errorMsg = errorData.error || `HTTP ${response.status}`
        
        // Rate limit kontrolü
        if (response.status === 429 || errorMsg.includes('429') || errorMsg.includes('rate') || errorMsg.includes('quota')) {
          throw new Error(`429: Rate limit aşıldı`)
        }
        
        throw new Error(errorMsg)
      }

      const data = await response.json()
      return data.questions || []
      
    } catch (error: any) {
      clearTimeout(timeoutId)
      
      // Abort hatası (timeout)
      if (error.name === 'AbortError') {
        throw new Error('Timeout: AI yanıt vermedi (60s)')
      }
      
      // Network hatası
      if (error.message === 'Failed to fetch') {
        throw new Error('Network hatası: Bağlantı kurulamadı')
      }
      
      throw error
    }
  }

  const saveQuestionsToDb = async (
    questions: GeneratedQuestion[],
    topicId: string | null,
    examMeta?: { exam_types: string[]; exam_topic_id: string }
  ): Promise<{ success: number; failed: number; savedIds: string[] }> => {
    let success = 0
    let failed = 0
    const savedIds: string[] = []
    const failedQuestions: { question: GeneratedQuestion; error: string }[] = []

    for (const question of questions) {
      let retries = 0
      let saved = false

      while (retries < AUTO_GEN_CONFIG.DB_MAX_RETRIES && !saved) {
        const insertData: Record<string, any> = {
          difficulty: question.difficulty,
          question_text: question.question_text,
          options: question.options,
          correct_answer: question.correct_answer,
          explanation: question.explanation,
          source: examMeta ? `AI Generated (TYT Batch)` : selectedLanguage === 'en' ? 'AI Generated (Questly)' : 'AI Generated (Batch)',
          is_active: true,
          created_by: profile?.id,
          lang: selectedLanguage,
          visual_type: question.visual_type || null,
          visual_content: question.visual_content || null,
        }

        if (topicId) {
          insertData.topic_id = topicId
        }

        if (examMeta) {
          insertData.exam_types = examMeta.exam_types
          insertData.exam_topic_id = examMeta.exam_topic_id
        }

        const { data, error } = await supabase
          .from('questions')
          .insert(insertData)
          .select('id')
          .single()

        if (error) {
          retries++
          const errorMsg = error.message || error.code || 'Bilinmeyen hata'
          
          // Duplicate kontrolü - tekrar denemeye gerek yok
          if (errorMsg.includes('duplicate') || errorMsg.includes('unique')) {
            console.warn(`⚠️ Duplicate soru atlandı: ${question.question_text.substring(0, 50)}...`)
            addBatchLog(`⚠️ Duplicate soru atlandı`, 'warning')
            break
          }
          
          // Son deneme değilse bekle ve tekrar dene
          if (retries < AUTO_GEN_CONFIG.DB_MAX_RETRIES) {
            console.log(`🔄 DB hatası, tekrar deneniyor (${retries}/${AUTO_GEN_CONFIG.DB_MAX_RETRIES}): ${errorMsg}`)
            await sleep(AUTO_GEN_CONFIG.DB_RETRY_DELAY)
          } else {
            console.error(`❌ Soru kaydedilemedi: ${errorMsg}`)
            failedQuestions.push({ question, error: errorMsg })
            failed++
          }
        } else {
          saved = true
          success++
          if (data?.id) {
            savedIds.push(data.id)
          }
        }
      }
    }

    // Başarısız soruları logla
    if (failedQuestions.length > 0) {
      console.error(`📋 Başarısız sorular (${failedQuestions.length}):`, 
        failedQuestions.map(f => ({ 
          text: f.question.question_text.substring(0, 30), 
          error: f.error 
        }))
      )
      addBatchLog(`⚠️ ${failedQuestions.length} soru kaydedilemedi - detaylar konsolda`, 'warning')
    }

    // 🔄 Typesense'e senkronize et
    if (savedIds.length > 0) {
      try {
        const syncResponse = await fetch('/api/admin/questions/sync', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ questionIds: savedIds })
        })
        
        if (syncResponse.ok) {
          console.log(`✅ ${savedIds.length} soru Typesense'e senkronize edildi`)
        } else {
          console.warn(`⚠️ Typesense sync başarısız:`, await syncResponse.text())
        }
      } catch (syncError) {
        console.error('Typesense sync hatası:', syncError)
        // Sync hatası kritik değil, devam et
      }
    }

    return { success, failed, savedIds }
  }

  const startBatchGeneration = async () => {
    const isExamBatch = !!selectedExamMode
    const topicsList = isExamBatch ? batchExamTopics : batchTopics

    if (topicsList.length === 0) {
      addBatchLog('Üretilecek konu bulunamadı!', 'error')
      return
    }

    setShouldStopBatch(false)
    setBatchProgress({
      currentTopicIndex: 0,
      totalTopics: topicsList.length * batchSelectedDifficulties.length,
      completedTopics: [],
      failedTopics: [],
      totalQuestionsGenerated: 0,
      totalQuestionsSaved: 0,
      startTime: new Date(),
      currentTopic: null,
      status: 'running',
      lastError: null,
    })
    setBatchLogs([])
    addBatchLog(`🚀 ${isExamBatch ? 'TYT ' : ''}Toplu üretim başlatıldı`, 'info')

    let totalGenerated = 0
    let totalSaved = 0
    let processedCount = 0
    const completedTopics: string[] = []
    const failedTopics: string[] = []

    for (const topic of topicsList) {
      for (const difficulty of batchSelectedDifficulties) {
        // Durdurma kontrolü
        if (shouldStopBatch) {
          addBatchLog('⏹️ Üretim kullanıcı tarafından durduruldu', 'warning')
          setBatchProgress(prev => ({ ...prev, status: 'paused' }))
          return
        }

        const topicId = topic.id
        const topicKey = `${topicId}-${difficulty}`
        const topicName = isExamBatch
          ? (topic as ExamTopic).main_topic
          : (topic as Topic).main_topic
        const topicIcon = isExamBatch
          ? ({ turkce: '📖', matematik: '📐', geometri: '📏', fizik: '⚛️', kimya: '🧪', biyoloji: '🧬', tarih: '📜', cografya: '🌍', felsefe: '💭', din_kulturu: '🕌' } as Record<string, string>)[(topic as ExamTopic).subject_code] || '📖'
          : subjects.find(s => s.id === (topic as Topic).subject_id)?.icon || '📖'

        setBatchProgress(prev => ({
          ...prev,
          currentTopicIndex: processedCount,
          currentTopic: isExamBatch ? { id: topicId, subject_id: '', grade: 0, main_topic: topicName, sub_topic: (topic as ExamTopic).sub_topic, learning_outcome: null, unit_number: null } : topic as Topic,
        }))

        addBatchLog(`📝 ${topicIcon} ${topicName.substring(0, 40)}${(topic as any).sub_topic ? ` - ${(topic as any).sub_topic}` : ''}... (${difficultyLabels[difficulty]?.label})`, 'info')

        let retries = 0
        let success = false
        let consecutiveRateLimits = 0

        while (retries < AUTO_GEN_CONFIG.MAX_RETRIES && !success) {
          try {
            let questions: GeneratedQuestion[]

            if (isExamBatch) {
              questions = await generateQuestionsForExamTopic(topic as ExamTopic, difficulty)
            } else {
              questions = await generateQuestionsForTopic(topic as Topic, difficulty)
            }

            totalGenerated += questions.length
            consecutiveRateLimits = 0

            // Veritabanına kaydet
            const saveResult = isExamBatch
              ? await saveQuestionsToDb(questions, null, {
                  exam_types: [selectedExamMode!.toLowerCase()],
                  exam_topic_id: topicId
                })
              : await saveQuestionsToDb(questions, topicId)

            totalSaved += saveResult.success

            completedTopics.push(topicKey)
            addBatchLog(`✅ ${questions.length} soru üretildi, ${saveResult.success} kaydedildi`, 'success')
            success = true

            setBatchProgress(prev => ({
              ...prev,
              totalQuestionsGenerated: totalGenerated,
              totalQuestionsSaved: totalSaved,
              completedTopics: [...completedTopics],
            }))

          } catch (error: any) {
            retries++
            const errorMsg = error.message || 'Bilinmeyen hata'
            const isRateLimit = errorMsg.includes('429') || errorMsg.includes('rate') || errorMsg.includes('quota')
            const isTimeout = errorMsg.includes('Timeout') || errorMsg.includes('timeout')
            const isNetwork = errorMsg.includes('Network') || errorMsg.includes('fetch')

            if (isRateLimit) {
              consecutiveRateLimits++
              const waitTime = AUTO_GEN_CONFIG.ERROR_RETRY_DELAY * Math.pow(1.5, consecutiveRateLimits - 1)
              const waitSeconds = Math.round(waitTime / 1000)
              addBatchLog(`⚠️ Rate limit! ${waitSeconds} saniye bekleniyor (${consecutiveRateLimits}. kez)...`, 'warning')
              await sleep(waitTime)
            } else if (isTimeout || isNetwork) {
              addBatchLog(`⚠️ ${isTimeout ? 'Timeout' : 'Network'} hatası. 10 saniye bekleniyor...`, 'warning')
              await sleep(10000)
            } else if (retries < AUTO_GEN_CONFIG.MAX_RETRIES) {
              addBatchLog(`⚠️ Hata: ${errorMsg}. Tekrar deneniyor (${retries}/${AUTO_GEN_CONFIG.MAX_RETRIES})...`, 'warning')
              await sleep(5000)
            } else {
              failedTopics.push(topicKey)
              addBatchLog(`❌ ${topicName.substring(0, 30)}... başarısız: ${errorMsg}`, 'error')
              setBatchProgress(prev => ({
                ...prev,
                failedTopics: [...failedTopics],
                lastError: errorMsg,
              }))
            }
          }
        }

        processedCount++

        // Rate limit koruması - istekler arası bekleme
        if (!shouldStopBatch && processedCount < topicsList.length * batchSelectedDifficulties.length) {
          await sleep(AUTO_GEN_CONFIG.DELAY_BETWEEN_REQUESTS)
        }
      }
    }

    setBatchProgress(prev => ({
      ...prev,
      status: 'completed',
      currentTopic: null,
    }))
    addBatchLog(`🎉 ${isExamBatch ? 'TYT ' : ''}Toplu üretim tamamlandı! ${totalSaved} soru kaydedildi.`, 'success')
  }

  const pauseBatchGeneration = () => {
    setShouldStopBatch(true)
    addBatchLog('⏸️ Üretim duraklatılıyor...', 'warning')
  }

  const getElapsedTime = () => {
    if (!batchProgress.startTime) return '0 dk'
    const elapsed = Math.floor((Date.now() - batchProgress.startTime.getTime()) / 1000)
    const minutes = Math.floor(elapsed / 60)
    const seconds = elapsed % 60
    return `${minutes} dk ${seconds} sn`
  }

  const getEstimatedTime = () => {
    if (!batchProgress.startTime || batchProgress.currentTopicIndex === 0) return 'Hesaplanıyor...'
    const elapsed = Date.now() - batchProgress.startTime.getTime()
    const perTopic = elapsed / batchProgress.currentTopicIndex
    const remaining = (batchProgress.totalTopics - batchProgress.currentTopicIndex) * perTopic
    const minutes = Math.floor(remaining / 60000)
    return `~${minutes} dk`
  }

  const selectedSubjectData = subjects.find(s => s.id === selectedSubject)
  const selectedTopicData = topics.find(t => t.id === selectedTopic)
  const isHighSchool = !!selectedExamMode || (selectedGrade !== null && selectedGrade >= 9)

  if (profileLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    )
  }

  if (profile?.role !== 'admin') {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-800">Erişim Engellendi</h2>
        <p className="text-gray-600 mt-2">Bu sayfaya erişim yetkiniz bulunmamaktadır.</p>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl shadow-lg">
                <Wand2 className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  AI Soru Üretici
                </h1>
                <p className="text-gray-600">
                  {selectedExamMode ? `ÖSYM ${selectedExamMode} formatında sorular üretin` : 'MEB müfredatına uygun sorular üretin'}
                </p>
              </div>
            </div>

            {/* 🌍 Language Toggle - Questly Global - BÜYÜK VE BELİRGİN */}
            <div className="flex flex-col items-end gap-2 mr-4">
              <div className="flex bg-gradient-to-r from-gray-100 to-gray-50 rounded-2xl p-1.5 shadow-lg border-2 border-gray-200">
                <button
                  onClick={() => setSelectedLanguage('tr')}
                  className={`px-6 py-3 rounded-xl font-bold text-lg transition-all flex items-center gap-3 ${
                    selectedLanguage === 'tr'
                      ? 'bg-white text-red-600 shadow-lg ring-2 ring-red-300 scale-105'
                      : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  🇹🇷 Türkçe
                  {selectedLanguage === 'tr' && <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">Teknokul</span>}
                </button>
                <button
                  onClick={() => setSelectedLanguage('en')}
                  className={`px-6 py-3 rounded-xl font-bold text-lg transition-all flex items-center gap-3 ${
                    selectedLanguage === 'en'
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg ring-2 ring-purple-300 scale-105'
                      : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  🌍 English
                  {selectedLanguage === 'en' && <span className="text-xs bg-white/20 text-white px-2 py-0.5 rounded-full">Questly Global</span>}
                </button>
              </div>
              {selectedLanguage === 'en' && (
                <div className="text-xs text-purple-600 bg-purple-50 px-3 py-1 rounded-full border border-purple-200 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Sorular questlyonline.com'da yayınlanacak
                </div>
              )}
            </div>

            {/* Exam Mode Toggle */}
            <div className="flex flex-col items-end gap-2">
              <div className="flex bg-gray-100 rounded-xl p-1">
                <button
                  onClick={() => { setSelectedExamMode(null); setCurrentStep(1) }}
                  className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                    !selectedExamMode
                      ? 'bg-white text-purple-600 shadow'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <GraduationCap className="w-4 h-4" />
                  Sınıf Bazlı
                </button>
                <button
                  onClick={() => { setSelectedExamMode('TYT'); setGenerationMode('single') }}
                  className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                    selectedExamMode === 'TYT'
                      ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Target className="w-4 h-4" />
                  TYT
                </button>
                <button
                  onClick={() => { setSelectedExamMode('AYT'); setGenerationMode('single') }}
                  className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                    selectedExamMode === 'AYT'
                      ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Target className="w-4 h-4" />
                  AYT
                </button>
                <button
                  onClick={() => { setSelectedExamMode('KPSS'); setGenerationMode('single') }}
                  className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                    selectedExamMode === 'KPSS'
                      ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-white shadow'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Target className="w-4 h-4" />
                  KPSS Lisans
                </button>
                <button
                  onClick={() => { setSelectedExamMode('KPSS_ONLISANS'); setGenerationMode('single') }}
                  className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                    selectedExamMode === 'KPSS_ONLISANS'
                      ? 'bg-gradient-to-r from-amber-400 to-orange-400 text-white shadow'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Target className="w-4 h-4" />
                  KPSS Ön Lisans
                </button>
                <button
                  onClick={() => { setSelectedExamMode('KPSS_ORTAOGRETIM'); setGenerationMode('single') }}
                  className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                    selectedExamMode === 'KPSS_ORTAOGRETIM'
                      ? 'bg-gradient-to-r from-yellow-500 to-lime-500 text-white shadow'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Target className="w-4 h-4" />
                  KPSS Lise
                </button>
              </div>
              {selectedExamMode && (
                <div className={`text-xs px-3 py-1 rounded-full border flex items-center gap-1 ${
                  selectedExamMode === 'TYT' ? 'text-orange-600 bg-orange-50 border-orange-200'
                  : selectedExamMode === 'AYT' ? 'text-blue-600 bg-blue-50 border-blue-200'
                  : selectedExamMode === 'KPSS' ? 'text-amber-700 bg-amber-50 border-amber-200'
                  : selectedExamMode === 'KPSS_ONLISANS' ? 'text-amber-600 bg-orange-50 border-orange-200'
                  : 'text-lime-700 bg-lime-50 border-lime-200'
                }`}>
                  <Sparkles className="w-3 h-3" /> ÖSYM {
                    selectedExamMode === 'KPSS' ? 'KPSS Lisans'
                    : selectedExamMode === 'KPSS_ONLISANS' ? 'KPSS Ön Lisans'
                    : selectedExamMode === 'KPSS_ORTAOGRETIM' ? 'KPSS Ortaöğretim'
                    : selectedExamMode
                  } formatında soru üretimi
                </div>
              )}
            </div>

            {/* Mode Toggle */}
            <div className="flex bg-gray-100 rounded-xl p-1">
              <button
                onClick={() => setGenerationMode('single')}
                className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                  generationMode === 'single'
                    ? 'bg-white text-purple-600 shadow'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Wand2 className="w-4 h-4" />
                Tekli Üretim
              </button>
              <button
                onClick={() => setGenerationMode('batch')}
                className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                  generationMode === 'batch'
                    ? 'bg-white text-orange-600 shadow'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Zap className="w-4 h-4" />
                Toplu Üretim
              </button>
            </div>
          </div>
        </motion.div>

        {/* ========== TEKLİ ÜRETİM MODU ========== */}
        {generationMode === 'single' && (
          <>
        {/* Breadcrumb Navigation */}
        {selectedExamMode ? (
          /* Sınav bazlı breadcrumb */
          (selectedExamSubject || selectedExamTopic) && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-6 flex items-center gap-2 text-sm flex-wrap">
              <span className="px-3 py-1.5 bg-orange-100 text-orange-700 rounded-full font-medium">{selectedExamMode}</span>
              {selectedExamSubject && (
                <>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                  <button onClick={() => goToStep(1)} className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition-all font-medium">
                    {examSubjects.find(s => s.subject_code === selectedExamSubject)?.subject_name}
                  </button>
                </>
              )}
              {selectedExamTopic && (
                <>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                  <button onClick={() => goToStep(2)} className="px-3 py-1.5 bg-green-100 text-green-700 rounded-full hover:bg-green-200 transition-all font-medium">
                    {selectedExamTopic.main_topic.substring(0, 30)}{selectedExamTopic.sub_topic ? ` - ${selectedExamTopic.sub_topic.substring(0, 20)}` : ''}
                  </button>
                </>
              )}
            </motion.div>
          )
        ) : (
          /* Sınıf bazlı breadcrumb */
          (selectedGrade || selectedSubjectData || selectedTopicData) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-6 flex items-center gap-2 text-sm flex-wrap"
          >
            {selectedGrade && (
              <>
                <button
                  onClick={() => goToStep(1)}
                  className="px-3 py-1.5 bg-purple-100 text-purple-700 rounded-full hover:bg-purple-200 transition-all font-medium"
                >
                  {gradeInfo[selectedGrade].emoji} {selectedGrade}. Sınıf
                </button>
              </>
            )}
            {selectedSubjectData && (
              <>
                <ChevronRight className="w-4 h-4 text-gray-400" />
                <button
                  onClick={() => goToStep(2)}
                  className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition-all font-medium"
                >
                  {selectedSubjectData.icon} {selectedSubjectData.name}
                </button>
              </>
            )}
            {selectedTopicData && (
              <>
                <ChevronRight className="w-4 h-4 text-gray-400" />
                <button
                  onClick={() => goToStep(3)}
                  className="px-3 py-1.5 bg-green-100 text-green-700 rounded-full hover:bg-green-200 transition-all font-medium"
                >
                  📝 {selectedTopicData.main_topic.substring(0, 30)}...
                </button>
              </>
            )}
          </motion.div>
          )
        )}

        {/* Step Progress */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            {(selectedExamMode
              ? [
                  { id: 1, name: 'Ders', icon: BookOpen },
                  { id: 2, name: 'Konu', icon: Layers },
                  { id: 3, name: 'Ayarlar', icon: Target },
                  { id: 4, name: 'Üret', icon: Wand2 }
                ]
              : STEPS
            ).map((step, index, arr) => (
              <div key={step.id} className="flex items-center">
                <button
                  onClick={() => goToStep(step.id)}
                  disabled={!canProceedToStep(step.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
                    currentStep === step.id
                      ? selectedExamMode ? 'bg-orange-500 text-white shadow-lg' : 'bg-purple-600 text-white shadow-lg'
                      : currentStep > step.id
                      ? 'bg-green-100 text-green-700'
                      : canProceedToStep(step.id)
                      ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      : 'bg-gray-50 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {currentStep > step.id ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <step.icon className="w-5 h-5" />
                  )}
                  <span className="hidden sm:inline font-medium">{step.name}</span>
                </button>
                {index < arr.length - 1 && (
                  <div className={`w-8 lg:w-16 h-1 mx-2 rounded ${
                    currentStep > step.id ? 'bg-green-400' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </motion.div>

        {/* Step Content */}
        <AnimatePresence mode="wait">
          {/* Step 1: Grade Selection OR Exam Subject Selection */}
          {currentStep === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8"
            >
              {selectedExamMode ? (
                /* Sınav (TYT/AYT) Ders Seçimi */
                <>
                  <h2 className="text-2xl font-bold text-gray-800 mb-2">{selectedExamMode} Dersi Seçin</h2>
                  <p className="text-gray-600 mb-6">ÖSYM {selectedExamMode} formatında soru üretmek istediğiniz dersi seçin</p>

                  {loadingExamTopics ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className={`w-8 h-8 animate-spin ${selectedExamMode === 'AYT' ? 'text-blue-600' : 'text-orange-600'}`} />
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                      {examSubjects.map(subject => {
                        const subjectIcons: Record<string, string> = {
                          turkce: '📖', matematik: '📐', geometri: '📏', fizik: '⚛️',
                          kimya: '🧪', biyoloji: '🧬', tarih: '📜', cografya: '🌍',
                          felsefe: '💭', din_kulturu: '🕌', edebiyat: '📚'
                        }
                        const examQuestionCounts: Record<string, Record<string, number>> = {
                          TYT: { turkce: 40, matematik: 30, geometri: 10, fizik: 7, kimya: 7, biyoloji: 6, tarih: 5, cografya: 5, felsefe: 5, din_kulturu: 5 },
                          AYT: { edebiyat: 24, matematik: 29, geometri: 11, fizik: 14, kimya: 13, biyoloji: 13, tarih: 21, cografya: 17, felsefe: 12, din_kulturu: 6 }
                        }
                        const qCount = examQuestionCounts[selectedExamMode!]?.[subject.subject_code]
                        const accentColor = selectedExamMode === 'AYT' ? 'blue' : 'orange'
                        return (
                          <button
                            key={subject.subject_code}
                            onClick={() => {
                              setSelectedExamSubject(subject.subject_code)
                              setCurrentStep(2)
                            }}
                            className={`p-4 rounded-xl border-2 transition-all hover:scale-105 text-left ${
                              selectedExamSubject === subject.subject_code
                                ? `border-${accentColor}-500 bg-${accentColor}-50 shadow-lg`
                                : `border-gray-200 hover:border-${accentColor}-300 hover:bg-${accentColor}-50`
                            }`}
                          >
                            <div className="text-3xl mb-2">{subjectIcons[subject.subject_code] || '📖'}</div>
                            <div className="font-bold text-gray-800">{subject.subject_name}</div>
                            <div className="text-xs text-gray-500 mt-1">
                              {subject.topics.length} konu
                            </div>
                            <div className={`mt-1 text-xs px-2 py-0.5 bg-${accentColor}-100 text-${accentColor}-700 rounded-full inline-block`}>
                              {selectedExamMode}: {qCount || '?'} soru
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  )}
                </>
              ) : (
                /* Sınıf Seçimi (orijinal) */
                <>
                  <h2 className="text-2xl font-bold text-gray-800 mb-2">Sınıf Seçin</h2>
                  <p className="text-gray-600 mb-6">Soru oluşturmak istediğiniz sınıf seviyesini seçin</p>

                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                    {[1,2,3,4,5,6,7,8,9,10,11,12].map(grade => (
                      <button
                        key={grade}
                        onClick={() => {
                          setSelectedGrade(grade)
                          setCurrentStep(2)
                        }}
                        className={`p-4 rounded-xl border-2 transition-all hover:scale-105 ${
                          selectedGrade === grade
                            ? 'border-purple-500 bg-purple-50 shadow-lg'
                            : 'border-gray-200 hover:border-purple-300 hover:bg-purple-50'
                        }`}
                      >
                        <div className="text-3xl mb-2">{gradeInfo[grade].emoji}</div>
                        <div className="text-xl font-bold text-gray-800">{grade}. Sınıf</div>
                        <div className="text-sm text-gray-500">{gradeInfo[grade].level}</div>
                        {gradeInfo[grade].exam && (
                          <div className="mt-1 text-xs px-2 py-1 bg-orange-100 text-orange-700 rounded-full inline-block">
                            {gradeInfo[grade].exam}
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </motion.div>
          )}

          {/* Step 2: Subject Selection OR TYT Topic Selection */}
          {currentStep === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8"
            >
              {selectedExamMode ? (
                /* Sınav (TYT/AYT) Konu Seçimi */
                <>
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-800">TYT Konu Seçin</h2>
                      <p className="text-gray-600">
                        {examSubjects.find(s => s.subject_code === selectedExamSubject)?.subject_name} konuları
                      </p>
                    </div>
                    <button
                      onClick={() => setCurrentStep(1)}
                      className="flex items-center gap-2 text-gray-600 hover:text-orange-600"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      Geri
                    </button>
                  </div>

                  {examTopics.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="text-6xl mb-4">📭</div>
                      <p className="text-gray-500">Bu ders için TYT konusu bulunamadı</p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
                      {examTopics.map(topic => {
                        const freqColors: Record<string, string> = {
                          cok_sik: 'bg-red-100 text-red-700',
                          sik: 'bg-orange-100 text-orange-700',
                          orta: 'bg-yellow-100 text-yellow-700',
                          nadir: 'bg-gray-100 text-gray-600'
                        }
                        const freqLabels: Record<string, string> = {
                          cok_sik: 'Çok Sık', sik: 'Sık', orta: 'Orta', nadir: 'Nadir'
                        }
                        return (
                          <button
                            key={topic.id}
                            onClick={() => {
                              setSelectedExamTopic(topic)
                              setCurrentStep(3)
                            }}
                            className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-all hover:bg-orange-50 flex items-center justify-between ${
                              selectedExamTopic?.id === topic.id
                                ? 'border-orange-500 bg-orange-50 shadow'
                                : 'border-gray-200 hover:border-orange-300'
                            }`}
                          >
                            <div>
                              <div className="font-medium text-gray-800">
                                {topic.main_topic}
                              </div>
                              {topic.sub_topic && (
                                <div className="text-sm text-gray-500 mt-0.5">
                                  {topic.sub_topic}
                                </div>
                              )}
                            </div>
                            <span className={`text-xs px-2 py-1 rounded-full font-medium ${freqColors[topic.osym_frequency] || 'bg-gray-100 text-gray-600'}`}>
                              {freqLabels[topic.osym_frequency] || topic.osym_frequency}
                            </span>
                          </button>
                        )
                      })}
                    </div>
                  )}
                </>
              ) : (
                /* Orijinal Ders Seçimi */
                <>
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-800">Ders Seçin</h2>
                      <p className="text-gray-600">{selectedGrade}. Sınıf müfredatındaki dersler</p>
                    </div>
                    <button
                      onClick={() => setCurrentStep(1)}
                      className="flex items-center gap-2 text-gray-600 hover:text-purple-600"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      Geri
                    </button>
                  </div>

                  {loadingSubjects ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
                    </div>
                  ) : subjects.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      Bu sınıf için ders bulunamadı
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                      {subjects.map(subject => (
                        <button
                          key={subject.id}
                          onClick={() => {
                            setSelectedSubject(subject.id)
                            setCurrentStep(3)
                          }}
                          className={`p-4 rounded-xl border-2 transition-all hover:scale-105 text-left ${
                            selectedSubject === subject.id
                              ? 'border-blue-500 bg-blue-50 shadow-lg'
                              : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                          }`}
                        >
                          <div className="text-3xl mb-2">{subject.icon}</div>
                          <div className="font-bold text-gray-800">{subject.name}</div>
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}
            </motion.div>
          )}

          {/* Step 3: Topic Selection (curriculum) OR Settings (exam mode) */}
          {currentStep === 3 && (
            selectedExamMode ? (
              /* Exam Mode Step 3 = Settings */
              <motion.div
                key="step3-exam-settings"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8"
              >
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800">Soru Ayarları</h2>
                    <p className="text-gray-600">Zorluk seviyesi ve soru sayısını belirleyin</p>
                  </div>
                  <button onClick={() => setCurrentStep(2)} className="flex items-center gap-2 text-gray-600 hover:text-orange-600">
                    <ArrowLeft className="w-4 h-4" /> Geri
                  </button>
                </div>

                {/* Selected Exam Topic Info */}
                {selectedExamTopic && (
                  <div className="mb-8 p-4 bg-gradient-to-r from-orange-50 to-red-50 rounded-xl border border-orange-100">
                    <div className="text-sm text-orange-600 font-medium mb-1">TYT - {selectedExamTopic.subject_name}:</div>
                    <div className="text-gray-800 font-medium">
                      {selectedExamTopic.main_topic}
                      {selectedExamTopic.sub_topic && <span className="text-gray-600"> - {selectedExamTopic.sub_topic}</span>}
                    </div>
                  </div>
                )}

                {/* Difficulty */}
                <div className="mb-8">
                  <label className="block text-lg font-semibold text-gray-800 mb-4">Zorluk Seviyesi</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {Object.entries(difficultyLabels).map(([key, { label, color, bg, emoji }]) => (
                      <button key={key} onClick={() => setSelectedDifficulty(key)}
                        className={`p-4 rounded-xl border-2 transition-all ${selectedDifficulty === key ? `border-current ${bg} ${color} shadow-lg` : 'border-gray-200 hover:border-gray-300'}`}>
                        <div className="text-2xl mb-2">{emoji}</div>
                        <div className={`font-bold ${selectedDifficulty === key ? color : 'text-gray-700'}`}>{label}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Visual Type */}
                <div className="mb-8">
                  <label className="block text-lg font-semibold text-gray-800 mb-2">Yeni Nesil Soru Türü</label>
                  <p className="text-sm text-gray-500 mb-4">Sorularınıza tablo, grafik ve diyagram ekleyebilirsiniz</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
                    {Object.entries(visualTypeLabels).map(([key, { label, emoji, description }]) => (
                      <button key={key} onClick={() => setSelectedVisualType(key as VisualType)} title={description}
                        className={`p-3 rounded-xl border-2 transition-all ${selectedVisualType === key ? 'border-indigo-500 bg-indigo-50 shadow-lg' : 'border-gray-200 hover:border-indigo-300 hover:bg-gray-50'}`}>
                        <div className="text-2xl mb-1">{emoji}</div>
                        <div className={`text-xs font-medium ${selectedVisualType === key ? 'text-indigo-700' : 'text-gray-600'}`}>{label}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Question Count */}
                <div className="mb-8">
                  <label className="block text-lg font-semibold text-gray-800 mb-4">Soru Sayısı</label>
                  <div className="flex gap-4">
                    {[5, 10, 15, 20].map(count => (
                      <button key={count} onClick={() => setQuestionCount(count)}
                        className={`flex-1 py-4 rounded-xl text-lg font-bold transition-all ${questionCount === count ? 'bg-orange-500 text-white shadow-lg' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                        {count}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Option Count Info */}
                <div className="mb-8 p-4 bg-orange-50 rounded-xl border border-orange-100">
                  <div className="flex items-center gap-2 text-orange-700">
                    <Target className="w-5 h-5" />
                    <span className="font-medium">5 şıklı sorular üretilecek (ÖSYM TYT formatı)</span>
                  </div>
                </div>

                {/* Generate Button */}
                <button
                  onClick={() => { setCurrentStep(4); handleGenerate() }}
                  className="w-full py-4 bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold text-lg rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-3"
                >
                  <Wand2 className="w-6 h-6" />
                  TYT Soru Üret
                  <ArrowRight className="w-6 h-6" />
                </button>
              </motion.div>
            ) : (
              /* Curriculum Mode Step 3 = Topic Selection */
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8"
              >
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800">Konu / Kazanım Seçin</h2>
                    <p className="text-gray-600">{selectedSubjectData?.icon} {selectedSubjectData?.name} dersi konuları</p>
                  </div>
                  <button
                    onClick={() => setCurrentStep(2)}
                    className="flex items-center gap-2 text-gray-600 hover:text-purple-600"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Geri
                  </button>
                </div>

                {loadingTopics ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
                  </div>
                ) : topics.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">📭</div>
                    <p className="text-gray-500">Bu ders için konu/kazanım bulunamadı</p>
                    <p className="text-sm text-gray-400 mt-2">Önce müfredat veritabanına konu ekleyin</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                    {Object.entries(groupedTopics).map(([mainTopic, topicList]) => (
                      <div key={mainTopic} className="border border-gray-200 rounded-xl overflow-hidden">
                        <div className="bg-gray-50 px-4 py-2 font-medium text-gray-700 flex items-center gap-2">
                          <Layers className="w-4 h-4 text-gray-500" />
                          {mainTopic}
                        </div>
                        <div className="divide-y divide-gray-100">
                          {topicList.map(topic => (
                            <button
                              key={topic.id}
                              onClick={() => {
                                setSelectedTopic(topic.id)
                                setCurrentStep(4)
                              }}
                              className={`w-full text-left px-4 py-3 transition-all hover:bg-green-50 ${
                                selectedTopic === topic.id ? 'bg-green-100' : ''
                              }`}
                            >
                              <div className="flex items-start gap-3">
                                <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                                  selectedTopic === topic.id ? 'bg-green-500' : 'bg-gray-300'
                                }`} />
                                <div>
                                  {topic.sub_topic && (
                                    <div className="text-sm text-gray-500 mb-1">{topic.sub_topic}</div>
                                  )}
                                  <div className="text-gray-700">
                                    {topic.learning_outcome || topic.main_topic}
                                  </div>
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )
          )}

          {/* Step 4: Settings (curriculum) - skip in exam mode */}
          {currentStep === 4 && !selectedExamMode && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">Soru Ayarları</h2>
                  <p className="text-gray-600">Zorluk seviyesi ve soru sayısını belirleyin</p>
                </div>
                <button 
                  onClick={() => setCurrentStep(3)}
                  className="flex items-center gap-2 text-gray-600 hover:text-purple-600"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Geri
                </button>
              </div>

              {/* Selected Topic Info */}
              <div className="mb-8 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-100">
                <div className="text-sm text-purple-600 font-medium mb-1">Seçilen Kazanım:</div>
                <div className="text-gray-800">
                  {selectedTopicData?.learning_outcome || selectedTopicData?.main_topic}
                </div>
              </div>

              {/* Difficulty */}
              <div className="mb-8">
                <label className="block text-lg font-semibold text-gray-800 mb-4">Zorluk Seviyesi</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {Object.entries(difficultyLabels).map(([key, { label, color, bg, emoji }]) => (
                    <button
                      key={key}
                      onClick={() => setSelectedDifficulty(key)}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        selectedDifficulty === key
                          ? `border-current ${bg} ${color} shadow-lg`
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="text-2xl mb-2">{emoji}</div>
                      <div className={`font-bold ${selectedDifficulty === key ? color : 'text-gray-700'}`}>
                        {label}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* 🆕 Yeni Nesil Soru - Görsel Türü */}
              <div className="mb-8">
                <label className="block text-lg font-semibold text-gray-800 mb-2">
                  🆕 Yeni Nesil Soru Türü
                </label>
                <p className="text-sm text-gray-500 mb-4">
                  Sorularınıza tablo, grafik ve diyagram ekleyebilirsiniz
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
                  {Object.entries(visualTypeLabels).map(([key, { label, emoji, description }]) => (
                    <button
                      key={key}
                      onClick={() => setSelectedVisualType(key as VisualType)}
                      className={`p-3 rounded-xl border-2 transition-all group relative ${
                        selectedVisualType === key
                          ? 'border-indigo-500 bg-indigo-50 shadow-lg'
                          : 'border-gray-200 hover:border-indigo-300 hover:bg-gray-50'
                      }`}
                      title={description}
                    >
                      <div className="text-2xl mb-1">{emoji}</div>
                      <div className={`text-xs font-medium ${selectedVisualType === key ? 'text-indigo-700' : 'text-gray-600'}`}>
                        {label}
                      </div>
                      {/* Tooltip */}
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                        {description}
                      </div>
                    </button>
                  ))}
                </div>
                {selectedVisualType !== 'none' && (
                  <div className="mt-3 p-3 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg border border-indigo-100">
                    <div className="flex items-center gap-2 text-indigo-700">
                      <Sparkles className="w-4 h-4" />
                      <span className="text-sm font-medium">
                        Yeni Nesil: {visualTypeLabels[selectedVisualType].label} içeren sorular üretilecek
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Question Count */}
              <div className="mb-8">
                <label className="block text-lg font-semibold text-gray-800 mb-4">Soru Sayısı</label>
                <div className="flex gap-4">
                  {[5, 10, 15, 20].map(count => (
                    <button
                      key={count}
                      onClick={() => setQuestionCount(count)}
                      className={`flex-1 py-4 rounded-xl text-lg font-bold transition-all ${
                        questionCount === count
                          ? 'bg-purple-600 text-white shadow-lg'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {count}
                    </button>
                  ))}
                </div>
              </div>

              {/* Option Count Info */}
              <div className="mb-8 p-4 bg-blue-50 rounded-xl border border-blue-100">
                <div className="flex items-center gap-2 text-blue-700">
                  <AlertTriangle className="w-5 h-5" />
                  <span className="font-medium">
                    {isHighSchool ? '5 şıklı sorular üretilecek (YKS formatı)' : '4 şıklı sorular üretilecek (LGS formatı)'}
                  </span>
                </div>
              </div>

              {/* Generate Button */}
              <button
                onClick={() => {
                  setCurrentStep(5)
                  handleGenerate()
                }}
                className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold text-lg rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-3"
              >
                <Wand2 className="w-6 h-6" />
                Soru Üret
                <ArrowRight className="w-6 h-6" />
              </button>
            </motion.div>
          )}

          {/* Step 5 (curriculum) / Step 4 (exam): Generated Questions */}
          {((currentStep === 5 && !selectedExamMode) || (currentStep === 4 && selectedExamMode)) && (
            <motion.div
              key="step-results"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">
                    {generating ? 'Sorular Üretiliyor...' : `Üretilen Sorular (${generatedQuestions.length})`}
                  </h2>
                  <p className="text-gray-600">
                    {selectedExamMode
                      ? `TYT - ${selectedExamTopic?.main_topic || ''}`
                      : selectedTopicData?.main_topic}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentStep(selectedExamMode ? 3 : 4)}
                    className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-purple-600 bg-white rounded-lg border"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Geri
                  </button>
                  {generatedQuestions.length > 0 && (
                    <>
                      <button
                        onClick={handleGenerate}
                        disabled={generating}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all flex items-center gap-2"
                      >
                        <RefreshCw className={`w-4 h-4 ${generating ? 'animate-spin' : ''}`} />
                        Yeniden
                      </button>
                      <button
                        onClick={handleSaveAll}
                        disabled={saving}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all flex items-center gap-2"
                      >
                        {saving ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Save className="w-4 h-4" />
                        )}
                        Tümünü Kaydet
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Save Status */}
              <AnimatePresence>
                {saveStatus && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className={`mb-4 p-4 rounded-xl flex items-center gap-3 ${
                      saveStatus.failed === 0 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {saveStatus.failed === 0 ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : (
                      <AlertTriangle className="w-5 h-5" />
                    )}
                    <span>
                      {saveStatus.success} soru başarıyla kaydedildi
                      {saveStatus.failed > 0 && `, ${saveStatus.failed} soru kaydedilemedi`}
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Loading State */}
              {generating && (
                <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-12 text-center">
                  <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                    <Sparkles className="w-10 h-10 text-purple-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">
                    AI sorularınızı hazırlıyor...
                  </h3>
                  <p className="text-gray-600">
                    {questionCount} adet {difficultyLabels[selectedDifficulty]?.label?.toLowerCase()} zorlukta soru üretiliyor
                  </p>
                  <div className="mt-4">
                    <Loader2 className="w-8 h-8 animate-spin text-purple-600 mx-auto" />
                  </div>
                </div>
              )}

              {/* Success State - After Save */}
              {!generating && generatedQuestions.length === 0 && saveStatus && saveStatus.success > 0 && (
                <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-12 text-center">
                  <div className="text-6xl mb-4">🎉</div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">
                    Sorular başarıyla kaydedildi!
                  </h3>
                  <p className="text-gray-600 mb-6">
                    {saveStatus.success} soru soru bankasına eklendi.
                  </p>
                  <div className="flex gap-4 justify-center">
                    <button
                      onClick={() => {
                        setSaveStatus(null)
                        setCurrentStep(selectedExamMode ? 2 : 3)
                      }}
                      className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all"
                    >
                      Farklı Konu Seç
                    </button>
                    <button
                      onClick={() => {
                        setSaveStatus(null)
                        handleGenerate()
                      }}
                      className="px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-all"
                    >
                      Aynı Konuda Yeni Sorular Üret
                    </button>
                  </div>
                </div>
              )}

              {/* Empty State - Error */}
              {!generating && generatedQuestions.length === 0 && !saveStatus && (
                <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-12 text-center">
                  <div className="text-6xl mb-4">🤔</div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">
                    Soru üretilemedi
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Bir hata oluşmuş olabilir. Lütfen tekrar deneyin.
                  </p>
                  <button
                    onClick={handleGenerate}
                    className="px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-all"
                  >
                    Tekrar Dene
                  </button>
                </div>
              )}

              {/* Questions List */}
              {!generating && generatedQuestions.length > 0 && (
                <div className="space-y-4">
                  {generatedQuestions.map((question, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden"
                    >
                      {/* Question Header */}
                      <div 
                        className="p-4 bg-gradient-to-r from-gray-50 to-white flex items-center justify-between cursor-pointer"
                        onClick={() => setExpandedIndex(expandedIndex === index ? null : index)}
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                            {index + 1}
                          </span>
                          <div>
                            <span className={`text-xs px-2 py-1 rounded-full ${difficultyLabels[question.difficulty]?.bg} ${difficultyLabels[question.difficulty]?.color}`}>
                              {difficultyLabels[question.difficulty]?.label}
                            </span>
                            <span className="text-xs text-gray-500 ml-2">
                              {bloomLabels[question.bloom_level] || question.bloom_level}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setEditingIndex(editingIndex === index ? null : index)
                            }}
                            className="p-2 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-all"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeleteQuestion(index)
                            }}
                            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                          {expandedIndex === index ? (
                            <ChevronUp className="w-5 h-5 text-gray-400" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-gray-400" />
                          )}
                        </div>
                      </div>

                      {/* Question Content */}
                      <AnimatePresence>
                        {(expandedIndex === index || editingIndex === index) && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="p-4 border-t border-gray-100">
                              {/* Question Text */}
                              <div className="mb-4">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <label className="text-xs text-gray-500 uppercase tracking-wide">Soru</label>
                                    {/* 🆕 Yeni Nesil Badge */}
                                    {question.visual_type && question.visual_type !== 'none' && (
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-700 text-xs font-medium rounded-full">
                                        <span>🆕</span>
                                        <span>Yeni Nesil</span>
                                      </span>
                                    )}
                                  </div>
                                  <SpeakButton 
                                    text={question.question_text} 
                                    size="sm"
                                    variant="pill"
                                    label="Soruyu Oku"
                                  />
                                </div>
                                {editingIndex === index ? (
                                  <textarea
                                    value={question.question_text}
                                    onChange={(e) => handleEditQuestion(index, 'question_text', e.target.value)}
                                    className="w-full mt-1 p-3 border border-gray-200 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                                    rows={3}
                                  />
                                ) : (
                                  <div className="mt-1 text-gray-800 font-medium">
                                    <MathRenderer text={question.question_text} />
                                  </div>
                                )}
                                {/* 🆕 Visual Content (Tablo, Grafik, Diyagram) */}
                                {question.visual_content && (
                                  <div className="mt-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                                    <div className="text-xs text-gray-500 uppercase tracking-wide mb-2">
                                      📊 Görsel İçerik ({question.visual_type})
                                    </div>
                                    {/* 🎨 Görsel içerik render - HTML/SVG veya LaTeX fallback */}
                                    {question.visual_content.includes('<svg') || question.visual_content.includes('<div') || question.visual_content.includes('<table') ? (
                                      // HTML/SVG içerik - DOMPurify ile güvenli render
                                      <div 
                                        className="overflow-x-auto visual-content-render"
                                        dangerouslySetInnerHTML={{ 
                                          __html: DOMPurify.sanitize(question.visual_content, {
                                            ALLOWED_TAGS: [
                                              // HTML
                                              'table', 'thead', 'tbody', 'tr', 'th', 'td', 'caption', 'colgroup', 'col', 
                                              'div', 'span', 'p', 'br', 'strong', 'b', 'em', 'i',
                                              // SVG
                                              'svg', 'g', 'path', 'rect', 'circle', 'ellipse', 'line', 'polyline', 'polygon',
                                              'text', 'tspan', 'defs', 'linearGradient', 'radialGradient', 'stop', 'marker', 'use'
                                            ],
                                            ALLOWED_ATTR: [
                                              // HTML
                                              'style', 'class', 'colspan', 'rowspan',
                                              // SVG
                                              'viewBox', 'xmlns', 'width', 'height', 'x', 'y', 'x1', 'y1', 'x2', 'y2',
                                              'cx', 'cy', 'r', 'rx', 'ry', 'd', 'fill', 'stroke', 'stroke-width', 
                                              'transform', 'text-anchor', 'font-size', 'font-weight', 'font-family',
                                              'id', 'offset', 'stop-color', 'gradientUnits', 'markerWidth', 'markerHeight',
                                              'refX', 'refY', 'orient', 'markerUnits', 'points', 'marker-end', 'href'
                                            ]
                                          })
                                        }} 
                                      />
                                    ) : (
                                      // LaTeX fallback - MathRenderer ile render
                                      <MathRenderer text={question.visual_content} />
                                    )}
                                  </div>
                                )}
                              </div>

                              {/* Options */}
                              <div className="mb-4">
                                <label className="text-xs text-gray-500 uppercase tracking-wide">Şıklar</label>
                                <div className="mt-2 space-y-2">
                                  {Object.entries(question.options).map(([key, value]) => (
                                    <div 
                                      key={key}
                                      className={`p-3 rounded-lg flex items-start gap-3 ${
                                        question.correct_answer === key 
                                          ? 'bg-green-50 border-2 border-green-300' 
                                          : 'bg-gray-50 border border-gray-200'
                                      }`}
                                    >
                                      <span className={`font-bold ${question.correct_answer === key ? 'text-green-600' : 'text-gray-600'}`}>
                                        {key})
                                      </span>
                                      {editingIndex === index ? (
                                        <input
                                          type="text"
                                          value={value}
                                          onChange={(e) => handleEditQuestion(index, `options.${key}`, e.target.value)}
                                          className="flex-1 bg-transparent border-none focus:outline-none"
                                        />
                                      ) : (
                                        <span className={question.correct_answer === key ? 'text-green-800' : 'text-gray-700'}>
                                          <MathRenderer text={value} />
                                        </span>
                                      )}
                                      {question.correct_answer === key && (
                                        <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* Correct Answer Selector (Edit Mode) */}
                              {editingIndex === index && (
                                <div className="mb-4">
                                  <label className="text-xs text-gray-500 uppercase tracking-wide">Doğru Cevap</label>
                                  <div className="flex gap-2 mt-1">
                                    {Object.keys(question.options).map(key => (
                                      <button
                                        key={key}
                                        onClick={() => handleEditQuestion(index, 'correct_answer', key)}
                                        className={`w-10 h-10 rounded-lg font-bold ${
                                          question.correct_answer === key
                                            ? 'bg-green-600 text-white'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                      >
                                        {key}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Explanation */}
                              <div>
                                <label className="text-xs text-gray-500 uppercase tracking-wide">Açıklama</label>
                                {editingIndex === index ? (
                                  <textarea
                                    value={question.explanation}
                                    onChange={(e) => handleEditQuestion(index, 'explanation', e.target.value)}
                                    className="w-full mt-1 p-3 border border-gray-200 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                                    rows={3}
                                  />
                                ) : (
                                  <div className="mt-1 text-gray-600 text-sm bg-blue-50 p-3 rounded-lg">
                                    💡 <MathRenderer text={question.explanation} />
                                  </div>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
          </>
        )}

        {/* ========== TOPLU ÜRETİM MODU ========== */}
        {generationMode === 'batch' && (
          <div className="space-y-6">
            {/* Yapılandırma Kartı */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Settings2 className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-800">Toplu Üretim Yapılandırması</h2>
                  <p className="text-sm text-gray-500">Seçilen konular için otomatik soru üretimi</p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {selectedExamMode ? (
                  /* Sınav (TYT/AYT) Ders Seçimi - tek blok, sınıf gerekmez */
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      📋 {selectedExamMode} Dersleri ({batchSelectedExamSubjects.length} seçili)
                    </label>
                    {loadingExamTopics ? (
                      <div className="flex items-center justify-center py-4">
                        <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
                      </div>
                    ) : examSubjects.length === 0 ? (
                      <div className="text-center py-4 text-gray-500 bg-gray-50 rounded-lg">
                        {selectedExamMode} dersleri yükleniyor...
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-2 p-3 bg-gray-50 rounded-lg">
                        <button
                          onClick={() => {
                            if (batchSelectedExamSubjects.length === examSubjects.length) {
                              setBatchSelectedExamSubjects([])
                            } else {
                              setBatchSelectedExamSubjects(examSubjects.map(s => s.subject_code))
                            }
                          }}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                            batchSelectedExamSubjects.length === examSubjects.length
                              ? 'bg-orange-500 text-white'
                              : 'bg-white text-gray-700 border border-gray-200'
                          }`}
                        >
                          {batchSelectedExamSubjects.length === examSubjects.length ? '✓ Tümü' : 'Tümünü Seç'}
                        </button>
                        {examSubjects.map(subject => {
                          const subjectIcons: Record<string, string> = {
                            turkce: '📖', matematik: '📐', geometri: '📏', fizik: '⚛️',
                            kimya: '🧪', biyoloji: '🧬', tarih: '📜', cografya: '🌍',
                            felsefe: '💭', din_kulturu: '🕌'
                          }
                          return (
                            <button
                              key={subject.subject_code}
                              onClick={() => {
                                setBatchSelectedExamSubjects(prev =>
                                  prev.includes(subject.subject_code)
                                    ? prev.filter(c => c !== subject.subject_code)
                                    : [...prev, subject.subject_code]
                                )
                              }}
                              className={`px-3 py-1.5 rounded-lg text-sm transition-all flex items-center gap-1 ${
                                batchSelectedExamSubjects.includes(subject.subject_code)
                                  ? 'bg-orange-500 text-white'
                                  : 'bg-white text-gray-700 border border-gray-200 hover:border-orange-300'
                              }`}
                            >
                              <span>{subjectIcons[subject.subject_code] || '📖'}</span>
                              <span>{subject.subject_name}</span>
                              <span className="text-xs opacity-75">({subject.topics.length})</span>
                              {batchSelectedExamSubjects.includes(subject.subject_code) && <Check className="w-3 h-3" />}
                            </button>
                          )
                        })}
                      </div>
                    )}
                    {batchExamTopics.length > 0 && (
                      <div className="mt-2 text-xs text-gray-500">
                        Toplam {batchExamTopics.length} TYT konusu seçili derslerde mevcut
                      </div>
                    )}
                  </div>
                ) : (
                  /* Sınıf Bazlı - Sınıf + Ders Seçimi */
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">📚 Sınıf Seçin</label>
                      <div className="grid grid-cols-4 gap-2">
                        {[1,2,3,4,5,6,7,8,9,10,11,12].map(grade => (
                          <button
                            key={grade}
                            onClick={() => {
                              setSelectedGrade(grade)
                              setBatchSelectedSubjects([])
                            }}
                            className={`p-2 rounded-lg text-center transition-all ${
                              selectedGrade === grade
                                ? 'bg-orange-500 text-white shadow-lg'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            <div className="font-bold">{grade}</div>
                            <div className="text-xs opacity-75">{gradeInfo[grade].level.charAt(0)}</div>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        📖 Dersler ({batchSelectedSubjects.length} seçili)
                      </label>
                      {loadingSubjects ? (
                        <div className="flex items-center justify-center py-4">
                          <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
                        </div>
                      ) : subjects.length === 0 ? (
                        <div className="text-center py-4 text-gray-500 bg-gray-50 rounded-lg">
                          {selectedGrade ? 'Ders bulunamadı' : 'Önce sınıf seçin'}
                        </div>
                      ) : (
                        <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto p-2 bg-gray-50 rounded-lg">
                          <button
                            onClick={() => {
                              if (batchSelectedSubjects.length === subjects.length) {
                                setBatchSelectedSubjects([])
                              } else {
                                setBatchSelectedSubjects(subjects.map(s => s.id))
                              }
                            }}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                              batchSelectedSubjects.length === subjects.length
                                ? 'bg-orange-500 text-white'
                                : 'bg-white text-gray-700 border border-gray-200'
                            }`}
                          >
                            {batchSelectedSubjects.length === subjects.length ? '✓ Tümü' : 'Tümünü Seç'}
                          </button>
                          {subjects.map(subject => (
                            <button
                              key={subject.id}
                              onClick={() => {
                                setBatchSelectedSubjects(prev =>
                                  prev.includes(subject.id)
                                    ? prev.filter(id => id !== subject.id)
                                    : [...prev, subject.id]
                                )
                              }}
                              className={`px-3 py-1.5 rounded-lg text-sm transition-all flex items-center gap-1 ${
                                batchSelectedSubjects.includes(subject.id)
                                  ? 'bg-orange-500 text-white'
                                  : 'bg-white text-gray-700 border border-gray-200 hover:border-orange-300'
                              }`}
                            >
                              <span>{subject.icon}</span>
                              <span>{subject.name}</span>
                              {batchSelectedSubjects.includes(subject.id) && <Check className="w-3 h-3" />}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                )}

                {/* Zorluk Seçimi */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">🎯 Zorluk Seviyeleri</label>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(difficultyLabels).map(([key, { label, emoji }]) => (
                      <button
                        key={key}
                        onClick={() => {
                          setBatchSelectedDifficulties(prev =>
                            prev.includes(key)
                              ? prev.filter(d => d !== key)
                              : [...prev, key]
                          )
                        }}
                        className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 ${
                          batchSelectedDifficulties.includes(key)
                            ? 'bg-orange-500 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        <span>{emoji}</span>
                        <span>{label}</span>
                        {batchSelectedDifficulties.includes(key) && <Check className="w-4 h-4" />}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Soru Sayısı */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">📝 Her Konu İçin Soru Sayısı</label>
                  <div className="flex gap-2">
                    {[3, 5, 10].map(count => (
                      <button
                        key={count}
                        onClick={() => setBatchQuestionsPerTopic(count)}
                        className={`flex-1 py-3 rounded-lg font-bold transition-all ${
                          batchQuestionsPerTopic === count
                            ? 'bg-orange-500 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {count}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 🆕 Yeni Nesil Soru Türü - Toplu Üretim */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">🆕 Yeni Nesil Soru Türü</label>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(visualTypeLabels).map(([key, { label, emoji }]) => (
                      <button
                        key={key}
                        onClick={() => setBatchSelectedVisualType(key as VisualType)}
                        className={`px-3 py-2 rounded-lg transition-all flex items-center gap-1 text-sm ${
                          batchSelectedVisualType === key
                            ? 'bg-indigo-500 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        <span>{emoji}</span>
                        <span>{label}</span>
                        {batchSelectedVisualType === key && <Check className="w-3 h-3" />}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Özet ve Başlat */}
              <div className="mt-6 p-4 bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl border border-orange-100">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="space-y-1">
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">{selectedExamMode ? batchExamTopics.length : batchTopics.length}</span> konu × <span className="font-medium">{batchSelectedDifficulties.length}</span> zorluk × <span className="font-medium">{batchQuestionsPerTopic}</span> soru =
                      <span className="text-orange-600 font-bold ml-1">
                        ~{(selectedExamMode ? batchExamTopics.length : batchTopics.length) * batchSelectedDifficulties.length * batchQuestionsPerTopic} soru
                      </span>
                    </div>
                    <div className="text-xs text-gray-500">
                      ⏱️ Tahmini süre: ~{Math.ceil(((selectedExamMode ? batchExamTopics.length : batchTopics.length) * batchSelectedDifficulties.length * AUTO_GEN_CONFIG.DELAY_BETWEEN_REQUESTS) / 60000)} dakika
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    {batchProgress.status === 'idle' || batchProgress.status === 'completed' || batchProgress.status === 'paused' ? (
                      <button
                        onClick={startBatchGeneration}
                        disabled={(selectedExamMode ? batchExamTopics.length === 0 : batchTopics.length === 0) || batchSelectedDifficulties.length === 0}
                        className="px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        <Play className="w-5 h-5" />
                        {batchProgress.status === 'paused' ? 'Devam Et' : selectedExamMode ? 'TYT Üretimi Başlat' : 'Üretimi Başlat'}
                      </button>
                    ) : (
                      <button
                        onClick={pauseBatchGeneration}
                        className="px-6 py-3 bg-red-500 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
                      >
                        <Square className="w-5 h-5" />
                        Durdur
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* İlerleme Kartı */}
            {batchProgress.status !== 'idle' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className={`p-2 rounded-lg ${
                    batchProgress.status === 'running' ? 'bg-blue-100' :
                    batchProgress.status === 'completed' ? 'bg-green-100' :
                    batchProgress.status === 'paused' ? 'bg-yellow-100' : 'bg-red-100'
                  }`}>
                    <BarChart3 className={`w-6 h-6 ${
                      batchProgress.status === 'running' ? 'text-blue-600' :
                      batchProgress.status === 'completed' ? 'text-green-600' :
                      batchProgress.status === 'paused' ? 'text-yellow-600' : 'text-red-600'
                    }`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-bold text-gray-800">
                        {batchProgress.status === 'running' ? '🔄 Üretim Devam Ediyor...' :
                         batchProgress.status === 'completed' ? '✅ Üretim Tamamlandı!' :
                         batchProgress.status === 'paused' ? '⏸️ Üretim Duraklatıldı' : '❌ Hata Oluştu'}
                      </h3>
                      <div className="text-sm text-gray-500">
                        {batchProgress.status === 'running' && (
                          <span className="flex items-center gap-1">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            {batchProgress.currentTopicIndex + 1} / {batchProgress.totalTopics}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {/* Progress Bar */}
                    <div className="mt-2 h-3 bg-gray-100 rounded-full overflow-hidden">
                      <motion.div 
                        className={`h-full rounded-full ${
                          batchProgress.status === 'running' ? 'bg-gradient-to-r from-blue-500 to-cyan-500' :
                          batchProgress.status === 'completed' ? 'bg-gradient-to-r from-green-500 to-emerald-500' :
                          'bg-gradient-to-r from-yellow-500 to-amber-500'
                        }`}
                        initial={{ width: 0 }}
                        animate={{ 
                          width: `${batchProgress.totalTopics > 0 ? (batchProgress.currentTopicIndex / batchProgress.totalTopics) * 100 : 0}%` 
                        }}
                        transition={{ duration: 0.5 }}
                      />
                    </div>
                  </div>
                </div>

                {/* İstatistikler */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="bg-blue-50 rounded-xl p-3">
                    <div className="text-2xl font-bold text-blue-600">{batchProgress.totalQuestionsGenerated}</div>
                    <div className="text-xs text-blue-600/70">Üretilen Soru</div>
                  </div>
                  <div className="bg-green-50 rounded-xl p-3">
                    <div className="text-2xl font-bold text-green-600">{batchProgress.totalQuestionsSaved}</div>
                    <div className="text-xs text-green-600/70">Kaydedilen Soru</div>
                  </div>
                  <div className="bg-purple-50 rounded-xl p-3">
                    <div className="text-2xl font-bold text-purple-600">{batchProgress.completedTopics.length}</div>
                    <div className="text-xs text-purple-600/70">Tamamlanan Konu</div>
                  </div>
                  <div className="bg-orange-50 rounded-xl p-3">
                    <div className="text-lg font-bold text-orange-600">{getElapsedTime()}</div>
                    <div className="text-xs text-orange-600/70">Geçen Süre</div>
                  </div>
                </div>

                {/* Mevcut İşlem */}
                {batchProgress.currentTopic && batchProgress.status === 'running' && (
                  <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
                    <div className="flex items-center gap-2 text-blue-800">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="font-medium">Şu an:</span>
                      <span>{batchProgress.currentTopic.main_topic}</span>
                    </div>
                  </div>
                )}

                {/* Log */}
                <div className="bg-gray-900 rounded-xl p-4 max-h-60 overflow-y-auto font-mono text-sm">
                  {batchLogs.length === 0 ? (
                    <div className="text-gray-500">Henüz log yok...</div>
                  ) : (
                    batchLogs.map((log, i) => (
                      <div 
                        key={i} 
                        className={`py-1 ${
                          log.type === 'error' ? 'text-red-400' :
                          log.type === 'success' ? 'text-green-400' :
                          log.type === 'warning' ? 'text-yellow-400' : 'text-gray-300'
                        }`}
                      >
                        <span className="text-gray-500 mr-2">
                          {log.time.toLocaleTimeString('tr-TR')}
                        </span>
                        {log.message}
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            )}
          </div>
        )}
      </div>
  )
}
