'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useProfile } from '@/hooks/useProfile'
import { createClient } from '@/lib/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import MathRenderer from '@/components/MathRenderer'
import { 
  ImageIcon,
  Sparkles, 
  BookOpen, 
  GraduationCap,
  Target,
  Save,
  Loader2,
  CheckCircle,
  XCircle,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  BarChart3,
  Globe,
  Dna,
  FlaskConical,
  Triangle,
  Map,
  LineChart,
  Download,
  Eye,
  Wand2,
  AlertTriangle,
  Layers,
  Trash2,
  Play,
  Pause,
  Check,
  Zap
} from 'lucide-react'
import Image from 'next/image'

// Görüntü tipleri
// 10 gerçek ÖSYM görsel soru tipi (2025 TYT/AYT/KPSS/DGS/ALES analizine dayalı)
const IMAGE_TYPES = [
  { id: 'geometry_shape', name: 'Geometrik Şekil', icon: Triangle,    description: 'Üçgen, dörtgen, çember (TYT\'de en sık)', color: 'bg-indigo-500', emoji: '🔺', exams: ['TYT','AYT','LGS','SINIF'], subjects: ['matematik','geometri'] },
  { id: '3d_solid',        name: '3D Cisim',        icon: Layers,      description: 'Küp, prizma, silindir, koni',                  color: 'bg-cyan-500',   emoji: '🧊', exams: ['TYT','AYT','LGS','SINIF'], subjects: ['matematik','geometri'] },
  { id: 'coordinate_graph',name: 'Koordinat/Fonksiyon', icon: LineChart, description: 'Koordinat düzlemi, integral alanı (AYT)', color: 'bg-blue-500',   emoji: '📈', exams: ['AYT','TYT','ALES','DGS','SINIF'], subjects: ['matematik','geometri','fizik'] },
  { id: 'data_graph',      name: 'Veri Grafiği',    icon: BarChart3,   description: 'Pasta, sütun, çizgi grafik (KPSS\'de çok)', color: 'bg-sky-500',    emoji: '🥧', exams: ['TYT','KPSS','KPSS_ONLISANS','KPSS_ORTAOGRETIM','ALES','DGS','SINIF'], subjects: [] },
  { id: 'physics_experiment', name: 'Fizik Düzeneği', icon: Zap,       description: 'Elektrik devresi, yay-kütle, optik (TYT/AYT\'de çok)', color: 'bg-yellow-500', emoji: '⚡', exams: ['TYT','AYT','LGS','SINIF'], subjects: ['fizik','fen_bilimleri'] },
  { id: 'wave_force',      name: 'Dalga/Kuvvet',    icon: Target,      description: 'Dalga grafiği, kuvvet diyagramı, vektörler', color: 'bg-orange-500', emoji: '〜', exams: ['TYT','AYT','SINIF'], subjects: ['fizik','fen_bilimleri'] },
  { id: 'biology_diagram', name: 'Biyoloji Şeması', icon: Dna,         description: 'Hücre zarı, nefron, popülasyon grafiği',    color: 'bg-green-500',  emoji: '🧬', exams: ['TYT','AYT','LGS','SINIF'], subjects: ['biyoloji','fen_bilimleri'] },
  { id: 'chemistry_schema',name: 'Kimya Şeması',    icon: FlaskConical,description: 'Elektrokimyasal hücre, piston, molekül',   color: 'bg-emerald-500',emoji: '⚗️', exams: ['AYT','TYT','SINIF'], subjects: ['kimya','fen_bilimleri'] },
  { id: 'geography_map',   name: 'Coğrafya Haritası', icon: Map,       description: 'Numaralı bölge haritası, iklim/tarih (KPSS\'de çok)', color: 'bg-amber-500', emoji: '🗺️', exams: ['TYT','AYT','KPSS','KPSS_ONLISANS','KPSS_ORTAOGRETIM','DGS','LGS','SINIF'], subjects: ['cografya','tarih','sosyal_bilgiler'] },
  { id: 'logic_table',     name: 'Veri/Mantık Tablosu', icon: BarChart3, description: 'Karşılaştırma tablosu, Venn, akış (ALES/DGS)', color: 'bg-rose-500',  emoji: '📊', exams: ['KPSS','KPSS_ONLISANS','KPSS_ORTAOGRETIM','ALES','DGS','SINIF'], subjects: [] },
]

// Sınava göre uygun görsel tipleri filtrele
function getImageTypesForExam(examMode: string | null, subjectCode?: string) {
  if (!examMode) return IMAGE_TYPES
  return IMAGE_TYPES.filter(t => {
    const examMatch = t.exams.includes(examMode) || t.exams.includes('SINIF')
    const subjectMatch = !subjectCode || t.subjects.length === 0 || t.subjects.includes(subjectCode)
    return examMatch && subjectMatch
  })
}

// Zorluk seviyeleri
const DIFFICULTIES = [
  { id: 'easy', name: 'Kolay', emoji: '🟢', color: 'bg-green-100 text-green-700 border-green-300' },
  { id: 'medium', name: 'Orta', emoji: '🟡', color: 'bg-yellow-100 text-yellow-700 border-yellow-300' },
  { id: 'hard', name: 'Zor', emoji: '🟠', color: 'bg-orange-100 text-orange-700 border-orange-300' },
  { id: 'legendary', name: 'Efsane', emoji: '🔴', color: 'bg-red-100 text-red-700 border-red-300' },
]

// Sınıf bilgileri
const GRADES = [
  { grade: 5, label: '5. Sınıf', level: 'Ortaokul' },
  { grade: 6, label: '6. Sınıf', level: 'Ortaokul' },
  { grade: 7, label: '7. Sınıf', level: 'Ortaokul' },
  { grade: 8, label: '8. Sınıf (LGS)', level: 'Ortaokul' },
  { grade: 9, label: '9. Sınıf', level: 'Lise' },
  { grade: 10, label: '10. Sınıf', level: 'Lise' },
  { grade: 11, label: '11. Sınıf (TYT)', level: 'Lise' },
  { grade: 12, label: '12. Sınıf (YKS)', level: 'Lise' },
]

interface Subject {
  id: string
  name: string
  code: string
  icon: string
  color: string
}

interface ExamSubject {
  subject_code: string
  subject_name: string
  topics: { id: string; main_topic: string; sub_topic: string | null; learning_outcome: string | null }[]
}

interface Topic {
  id: string
  subject_id: string
  grade: number
  main_topic: string
  sub_topic: string | null
  learning_outcome: string | null
}

interface GeneratedImageQuestion {
  question_text: string
  image_prompt: string
  image_base64?: string
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
}

// Toplu üretim için interface
interface BatchQuestion {
  id: string
  question_text: string
  image_prompt: string
  image_base64?: string
  options: { A: string; B: string; C: string; D: string; E?: string }
  correct_answer: string
  explanation: string
  difficulty: string
  bloom_level: string
  status: 'pending' | 'generating' | 'completed' | 'error' | 'saved'
  error?: string
}

export default function ImageQuestionGeneratorPage() {
  const { profile, loading: profileLoading } = useProfile()
  const supabase = createClient()
  
  // Üretim modu: tekli veya toplu
  const [generationMode, setGenerationMode] = useState<'single' | 'batch'>('single')
  
  // Form state
  const [selectedGrade, setSelectedGrade] = useState<number>(8)
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [selectedSubject, setSelectedSubject] = useState<string>('')
  const [topics, setTopics] = useState<Topic[]>([])
  const [selectedTopic, setSelectedTopic] = useState<string>('')
  const [selectedImageType, setSelectedImageType] = useState<string>('geometry_shape')
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('medium')

  // Sınav modu (TYT, AYT, KPSS, DGS, ALES veya null=sınıf bazlı)
  const [selectedExamMode, setSelectedExamMode] = useState<string | null>(null)
  const [examSubjects, setExamSubjects] = useState<ExamSubject[]>([])
  const [loadingExamSubjects, setLoadingExamSubjects] = useState(false)
  const [selectedExamSubjectCode, setSelectedExamSubjectCode] = useState<string>('')
  
  // Generated question state (Tekli mod)
  const [generatedQuestion, setGeneratedQuestion] = useState<GeneratedImageQuestion | null>(null)
  const [expandedSection, setExpandedSection] = useState<string | null>(null)
  
  // Toplu üretim state
  const [batchQuestionCount, setBatchQuestionCount] = useState<number>(3)
  const [batchDifficultyDistribution, setBatchDifficultyDistribution] = useState({
    easy: true, medium: true, hard: true, legendary: false
  })
  const [batchQuestions, setBatchQuestions] = useState<BatchQuestion[]>([])
  const [isBatchGenerating, setIsBatchGenerating] = useState(false)
  const [currentBatchIndex, setCurrentBatchIndex] = useState<number>(-1)
  const [isBatchPaused, setIsBatchPaused] = useState(false)
  const [savingAllBatch, setSavingAllBatch] = useState(false)
  
  // Saved image questions list
  const [savedImageQuestions, setSavedImageQuestions] = useState<any[]>([])
  const [loadingSavedQuestions, setLoadingSavedQuestions] = useState(false)
  
  // Loading states
  const [loadingSubjects, setLoadingSubjects] = useState(false)
  const [loadingTopics, setLoadingTopics] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [generatingImage, setGeneratingImage] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Load subjects when grade changes
  useEffect(() => {
    loadSubjects()
    loadSavedImageQuestions()
  }, [selectedGrade])
  
  // Kaydedilmiş görüntülü soruları yükle
  async function loadSavedImageQuestions() {
    setLoadingSavedQuestions(true)
    try {
      const { data, error } = await supabase
        .from('questions')
        .select(`
          id,
          question_text,
          question_image_url,
          difficulty,
          correct_answer,
          created_at,
          topic:topics(main_topic, subject:subjects(name))
        `)
        .not('question_image_url', 'is', null)
        .order('created_at', { ascending: false })
        .limit(10)

      if (error) throw error
      setSavedImageQuestions(data || [])
    } catch (err: any) {
      console.error('Görüntülü sorular yüklenemedi:', err)
    } finally {
      setLoadingSavedQuestions(false)
    }
  }

  // Load topics when subject changes
  useEffect(() => {
    if (selectedSubject) {
      loadTopics()
    }
  }, [selectedSubject, selectedGrade])

  // Sınav modu değişince exam subjects yükle
  useEffect(() => {
    if (selectedExamMode) {
      loadExamSubjects(selectedExamMode)
    } else {
      setExamSubjects([])
    }
  }, [selectedExamMode])

  // Dersleri yükle - Sınıfa göre müfredattaki dersler
  async function loadSubjects() {
    setLoadingSubjects(true)
    setSelectedSubject('') // Sınıf değişince ders seçimini sıfırla
    setSelectedTopic('') // Konu seçimini de sıfırla
    setTopics([]) // Konuları temizle
    
    try {
      const { data, error } = await supabase
        .from('grade_subjects')
        .select(`
          subject_id,
          is_exam_subject,
          subject:subjects(id, name, code, icon, color)
        `)
        .eq('grade_id', selectedGrade)
        .order('is_exam_subject', { ascending: false })

      if (error) throw error
      
      // Veri yapısını dönüştür - subject objesini çıkar
      const subjectsList = (data || [])
        .filter((d: any) => d.subject) // null subject'leri filtrele
        .map((d: any) => d.subject as Subject)
      
      setSubjects(subjectsList)
    } catch (err: any) {
      console.error('Dersler yüklenemedi:', err)
    } finally {
      setLoadingSubjects(false)
    }
  }

  // Konuları yükle
  async function loadTopics() {
    setLoadingTopics(true)
    try {
      const { data, error } = await supabase
        .from('topics')
        .select('id, subject_id, grade, main_topic, sub_topic, learning_outcome')
        .eq('subject_id', selectedSubject)
        .eq('grade', selectedGrade)
        .order('unit_number')

      if (error) throw error
      setTopics(data || [])
    } catch (err: any) {
      console.error('Konular yüklenemedi:', err)
    } finally {
      setLoadingTopics(false)
    }
  }

  // Sınav konularını yükle (TYT/AYT/KPSS/DGS/ALES)
  async function loadExamSubjects(examMode: string) {
    setLoadingExamSubjects(true)
    setExamSubjects([])
    setSelectedExamSubjectCode('')
    setSelectedTopic('')
    setTopics([])
    try {
      const res = await fetch(`/api/exam-topics?exam_type=${examMode}`)
      const data = await res.json()
      if (data.subjects) setExamSubjects(data.subjects)
    } catch (err) {
      console.error('Sınav konuları yüklenemedi:', err)
    } finally {
      setLoadingExamSubjects(false)
    }
  }

  // Sınav modu değişince (sadece state güncelle — yükleme useEffect'te)
  function handleExamModeChange(mode: string | null) {
    setSelectedExamMode(mode)
    setSelectedSubject('')
    setSelectedTopic('')
    setTopics([])
    setGeneratedQuestion(null)
    setSelectedExamSubjectCode('')
    setExamSubjects([])
    if (mode) {
      const compatibleTypes = getImageTypesForExam(mode, undefined)
      if (compatibleTypes.length > 0) setSelectedImageType(compatibleTypes[0].id)
    }
  }

  // Görüntülü soru üret
  async function generateImageQuestion() {
    if (selectedExamMode) {
      if (!selectedExamSubjectCode || !selectedTopic) {
        setError('Lütfen ders ve konu seçin')
        return
      }
    } else if (!selectedSubject || !selectedTopic) {
      setError('Lütfen ders ve konu seçin')
      return
    }

    setGenerating(true)
    setError(null)
    setGeneratedQuestion(null)

    // Ders adını al
    let subjectName = ''
    let topicName = ''
    if (selectedExamMode) {
      const examSub = examSubjects.find(s => s.subject_code === selectedExamSubjectCode)
      subjectName = examSub?.subject_name || selectedExamSubjectCode
      const examTopic = examSub?.topics.find(t => t.id === selectedTopic)
      topicName = examTopic ? `${examTopic.main_topic}${examTopic.sub_topic ? ` - ${examTopic.sub_topic}` : ''}` : ''
    } else {
      const selectedSubjectData = subjects.find(s => s.id === selectedSubject)
      const selectedTopicData = topics.find(t => t.id === selectedTopic)
      subjectName = selectedSubjectData?.name || ''
      topicName = selectedTopicData?.main_topic || ''
    }

    let questionData: any = null

    try {
      // Aşama 1: Soru metnini üret (görselsiz, hızlı ~15s)
      const response = await fetch('/api/ai/generate-image-question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grade: selectedExamMode ? 11 : selectedGrade,
          subject: subjectName,
          topic: topicName,
          imageType: selectedImageType,
          difficulty: selectedDifficulty,
          generateImage: false,
          examMode: selectedExamMode,
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Soru üretme hatası')
      }

      questionData = data.question
      setGeneratedQuestion(questionData)
      setExpandedSection('preview')

    } catch (err: any) {
      console.error('Soru üretme hatası:', err)
      setError(err.message || 'Soru üretilirken bir hata oluştu')
    } finally {
      setGenerating(false)
    }

    // Aşama 2: Görseli ayrı istek olarak üret (soru zaten ekranda)
    if (questionData?.image_prompt) {
      setGeneratingImage(true)
      try {
        const imgResponse = await fetch(`/api/ai/generate-image-question?prompt=${encodeURIComponent(questionData.image_prompt)}`)
        const imgData = await imgResponse.json()
        if (imgResponse.ok && imgData.image) {
          setGeneratedQuestion(prev => prev ? { ...prev, image_base64: imgData.image } : prev)
        }
      } catch (imgErr) {
        console.error('Görsel üretme hatası:', imgErr)
      } finally {
        setGeneratingImage(false)
      }
    }
  }

  // Sadece görüntüyü yeniden üret
  async function regenerateImage() {
    if (!generatedQuestion) return

    setGeneratingImage(true)
    setError(null)

    try {
      const response = await fetch(`/api/ai/generate-image-question?prompt=${encodeURIComponent(generatedQuestion.image_prompt)}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Görüntü üretme hatası')
      }

      setGeneratedQuestion({
        ...generatedQuestion,
        image_base64: data.image
      })

    } catch (err: any) {
      console.error('Görüntü üretme hatası:', err)
      setError(err.message || 'Görüntü üretilirken bir hata oluştu')
    } finally {
      setGeneratingImage(false)
    }
  }

  // Soruyu kaydet
  async function saveQuestion() {
    if (!generatedQuestion || !selectedSubject || !selectedTopic) return

    setSaving(true)
    setError(null)

    try {
      const { data, error } = await supabase
        .from('questions')
        .insert({
          topic_id: selectedTopic,
          question_text: generatedQuestion.question_text,
          options: generatedQuestion.options,
          correct_answer: generatedQuestion.correct_answer,
          explanation: generatedQuestion.explanation,
          difficulty: generatedQuestion.difficulty,
          question_image_url: generatedQuestion.image_base64, // Base64 olarak kaydediyoruz
          is_active: true,
          created_by: profile?.id
        })
        .select('id')
        .single()

      if (error) throw error

      // 🔄 Typesense'e otomatik senkronize et
      if (data?.id) {
        try {
          await fetch('/api/admin/questions/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ questionId: data.id, action: 'upsert' })
          })
          console.log('✅ Soru Typesense\'e senkronize edildi')
        } catch (syncError) {
          console.error('Typesense sync hatası:', syncError)
        }
      }

      setSuccessMessage('Soru başarıyla kaydedildi!')
      setTimeout(() => setSuccessMessage(null), 3000)

    } catch (err: any) {
      console.error('Kaydetme hatası:', err)
      setError(err.message || 'Soru kaydedilemedi')
    } finally {
      setSaving(false)
    }
  }

  // Görüntüyü indir
  function downloadImage() {
    if (!generatedQuestion?.image_base64) return

    const link = document.createElement('a')
    link.href = generatedQuestion.image_base64
    link.download = `soru-gorseli-${Date.now()}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // ========== TOPLU ÜRETİM FONKSİYONLARI ==========
  
  // Zorluk dağılımından rastgele zorluk seç
  function getRandomBatchDifficulty(): string {
    const enabledDifficulties = Object.entries(batchDifficultyDistribution)
      .filter(([_, enabled]) => enabled)
      .map(([key]) => key)
    if (enabledDifficulties.length === 0) return 'medium'
    return enabledDifficulties[Math.floor(Math.random() * enabledDifficulties.length)]
  }

  // Tek bir soru üret (toplu mod için)
  async function generateBatchSingleQuestion(index: number): Promise<BatchQuestion | null> {
    // Sınav modu veya sınıf bazlı
    let subjectName = ''
    let topicName = ''

    if (selectedExamMode) {
      const examSub = examSubjects.find(s => s.subject_code === selectedExamSubjectCode)
      if (!examSub) return null
      subjectName = examSub.subject_name
      const examTopic = examSub.topics.find(t => t.id === selectedTopic)
      if (!examTopic) return null
      topicName = examTopic.main_topic + (examTopic.sub_topic ? ` - ${examTopic.sub_topic}` : '')
    } else {
      const topic = topics.find(t => t.id === selectedTopic)
      const subject = subjects.find(s => s.id === selectedSubject)
      if (!topic || !subject) return null
      subjectName = subject.name
      topicName = topic.main_topic + (topic.sub_topic ? ` - ${topic.sub_topic}` : '')
    }

    try {
      const response = await fetch('/api/ai/generate-image-question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grade: selectedExamMode ? 11 : selectedGrade,
          subject: subjectName,
          topic: topicName,
          imageType: selectedImageType,
          difficulty: getRandomBatchDifficulty(),
          generateImage: false,
          examMode: selectedExamMode,
        })
      })

      if (!response.ok) throw new Error('API hatası')
      const data = await response.json()
      if (data.error) throw new Error(data.error)

      return {
        id: `batch-${Date.now()}-${index}`,
        ...data.question,
        status: 'completed' as const
      }
    } catch (err: any) {
      return {
        id: `batch-${Date.now()}-${index}`,
        question_text: '',
        image_prompt: '',
        options: { A: '', B: '', C: '', D: '' },
        correct_answer: '',
        explanation: '',
        difficulty: '',
        bloom_level: '',
        status: 'error' as const,
        error: err.message
      }
    }
  }

  // Toplu üretimi başlat
  async function startBatchGeneration() {
    if (selectedExamMode) {
      if (!selectedExamSubjectCode || !selectedTopic) {
        setError('Lütfen ders ve konu seçin')
        return
      }
    } else if (!selectedSubject || !selectedTopic) {
      setError('Lütfen ders ve konu seçin')
      return
    }

    setError(null)
    setIsBatchGenerating(true)
    setIsBatchPaused(false)

    const initialQuestions: BatchQuestion[] = Array.from({ length: batchQuestionCount }, (_, i) => ({
      id: `batch-pending-${i}`,
      question_text: '',
      image_prompt: '',
      options: { A: '', B: '', C: '', D: '' },
      correct_answer: '',
      explanation: '',
      difficulty: '',
      bloom_level: '',
      status: 'pending' as const
    }))
    setBatchQuestions(initialQuestions)

    for (let i = 0; i < batchQuestionCount; i++) {
      if (isBatchPaused) break

      setCurrentBatchIndex(i)
      setBatchQuestions(prev => prev.map((q, idx) => 
        idx === i ? { ...q, status: 'generating' as const } : q
      ))

      const question = await generateBatchSingleQuestion(i)
      if (question) {
        setBatchQuestions(prev => prev.map((q, idx) => 
          idx === i ? question : q
        ))
      }

      if (i < batchQuestionCount - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000))
      }
    }

    setIsBatchGenerating(false)
    setCurrentBatchIndex(-1)
  }

  // Toplu üretimi duraklat/devam et
  function toggleBatchPause() {
    setIsBatchPaused(!isBatchPaused)
  }

  // Tek soruyu kaydet (toplu mod)
  async function saveBatchSingleQuestion(index: number) {
    const question = batchQuestions[index]
    if (!question || question.status !== 'completed') return

    try {
      const { data, error } = await supabase
        .from('questions')
        .insert({
          topic_id: selectedTopic,
          question_text: question.question_text,
          options: question.options,
          correct_answer: question.correct_answer,
          explanation: question.explanation,
          difficulty: question.difficulty,
          question_image_url: question.image_base64,
          is_active: true,
          created_by: profile?.id
        })
        .select('id')
        .single()

      if (error) throw error

      // 🔄 Typesense'e otomatik senkronize et
      if (data?.id) {
        try {
          await fetch('/api/admin/questions/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ questionId: data.id, action: 'upsert' })
          })
        } catch (syncError) {
          console.error('Typesense sync hatası:', syncError)
        }
      }

      setBatchQuestions(prev => prev.map((q, idx) => 
        idx === index ? { ...q, status: 'saved' as const } : q
      ))
    } catch (err: any) {
      console.error('Kaydetme hatası:', err)
      setError('Soru kaydedilemedi: ' + err.message)
    }
  }

  // Tüm başarılı soruları kaydet
  async function saveAllBatchQuestions() {
    setSavingAllBatch(true)
    setError(null)

    const completedQuestions = batchQuestions.filter(q => q.status === 'completed')
    
    for (let i = 0; i < batchQuestions.length; i++) {
      if (batchQuestions[i].status === 'completed') {
        await saveBatchSingleQuestion(i)
      }
    }

    setSavingAllBatch(false)
    setSuccessMessage(`${completedQuestions.length} soru başarıyla kaydedildi!`)
    loadSavedImageQuestions()
    setTimeout(() => setSuccessMessage(null), 3000)
  }

  // Soruyu listeden kaldır
  function removeBatchQuestion(index: number) {
    setBatchQuestions(prev => prev.filter((_, idx) => idx !== index))
  }

  // Toplu üretim listesini temizle
  function clearBatchQuestions() {
    setBatchQuestions([])
    setError(null)
    setSuccessMessage(null)
  }

  // Toplu üretim istatistikleri
  const batchStats = {
    total: batchQuestions.length,
    completed: batchQuestions.filter(q => q.status === 'completed').length,
    saved: batchQuestions.filter(q => q.status === 'saved').length,
    error: batchQuestions.filter(q => q.status === 'error').length,
    pending: batchQuestions.filter(q => q.status === 'pending' || q.status === 'generating').length
  }

  // Admin kontrolü
  if (profileLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    )
  }

  if (profile?.role !== 'admin') {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold text-red-500">Erişim Engellendi</h1>
        <p className="text-gray-600 mt-2">Bu sayfaya erişim yetkiniz yok.</p>
      </div>
    )
  }

  const selectedSubjectData = subjects.find(s => s.id === selectedSubject)
  const selectedTopicData = topics.find(t => t.id === selectedTopic)

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl shadow-lg">
              <ImageIcon className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Görüntülü Soru Üretici
              </h1>
              <p className="text-gray-600">
                AI ile grafik, diyagram ve şema içeren sorular oluşturun
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-3 text-sm text-gray-500">
            <Sparkles className="w-4 h-4 text-purple-500" />
            <span>Powered by Google Gemini Nano Banana</span>
          </div>

          {/* Tekli / Toplu Üretim Tab Butonları */}
          <div className="flex items-center gap-2 mt-4 p-1 bg-gray-100 rounded-xl w-fit">
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
              <Layers className="w-4 h-4" />
              Toplu Üretim
            </button>
          </div>
        </motion.div>

        {/* ========== TEKLİ ÜRETİM MODU ========== */}
        {generationMode === 'single' && (
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Sol Panel - Form */}
          <div className="space-y-6">
            {/* Sınav Modu Seçimi */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-2xl shadow-lg p-5 border border-gray-100"
            >
              <h2 className="font-semibold text-gray-900 mb-3 flex items-center gap-2 text-sm">
                <Target className="w-4 h-4 text-purple-500" />
                Sınav Modu
              </h2>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handleExamModeChange(null)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    !selectedExamMode ? 'bg-purple-600 text-white shadow' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >📚 Sınıf Bazlı</button>
                {[
                  { mode: 'TYT', color: 'bg-orange-500', emoji: '📝' },
                  { mode: 'AYT', color: 'bg-rose-500', emoji: '🎯' },
                  { mode: 'KPSS', color: 'bg-blue-600', emoji: '🏛️' },
                  { mode: 'KPSS_ONLISANS', color: 'bg-cyan-600', emoji: '🎒', label: 'KPSS Ön L.' },
                  { mode: 'KPSS_ORTAOGRETIM', color: 'bg-teal-600', emoji: '🎒', label: 'KPSS Lise' },
                  { mode: 'DGS', color: 'bg-green-600', emoji: '🔄' },
                  { mode: 'ALES', color: 'bg-violet-600', emoji: '🎓' },
                ].map(({ mode, color, emoji, label }) => (
                  <button
                    key={mode}
                    onClick={() => handleExamModeChange(mode)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      selectedExamMode === mode ? `${color} text-white shadow` : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {emoji} {label || mode}
                  </button>
                ))}
              </div>
              {selectedExamMode && (
                <p className="mt-2 text-xs text-purple-600 bg-purple-50 px-3 py-1.5 rounded-lg">
                  ✨ ÖSYM {selectedExamMode} formatında görüntülü soru üretilecek
                </p>
              )}
            </motion.div>

            {/* Sınıf Seçimi (sadece sınıf bazlı modda) */}
            {!selectedExamMode && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100"
            >
              <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-purple-500" />
                Sınıf Seçimi
              </h2>
              <div className="grid grid-cols-4 gap-2">
                {GRADES.map(({ grade, label, level }) => (
                  <button
                    key={grade}
                    onClick={() => setSelectedGrade(grade)}
                    className={`p-3 rounded-xl text-sm font-medium transition-all ${
                      selectedGrade === grade
                        ? 'bg-purple-500 text-white shadow-lg scale-105'
                        : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {grade}. Sınıf
                  </button>
                ))}
              </div>
            </motion.div>
            )}

            {/* Ders ve Konu Seçimi */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100"
            >
              <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-purple-500" />
                {selectedExamMode ? `${selectedExamMode} Ders ve Konu` : 'Ders ve Konu'}
              </h2>

              {/* Sınav modu: ders listesi */}
              {selectedExamMode ? (
                <>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Ders</label>
                    {loadingExamSubjects ? (
                      <div className="flex items-center gap-2 py-3 text-sm text-gray-500">
                        <Loader2 className="w-4 h-4 animate-spin" /> Yükleniyor...
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {examSubjects.map(sub => (
                          <button
                            key={sub.subject_code}
                            onClick={() => {
                              setSelectedExamSubjectCode(sub.subject_code)
                              setSelectedTopic('')
                              // Görsel tipini derse uygun ayarla
                              const compatibleTypes = getImageTypesForExam(selectedExamMode, sub.subject_code)
                              if (compatibleTypes.length > 0) setSelectedImageType(compatibleTypes[0].id)
                            }}
                            className={`px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                              selectedExamSubjectCode === sub.subject_code
                                ? 'bg-purple-500 text-white shadow'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                          >
                            {sub.subject_name}
                            <span className="ml-1 text-xs opacity-70">({sub.topics.length})</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Konu</label>
                    <select
                      value={selectedTopic}
                      onChange={(e) => setSelectedTopic(e.target.value)}
                      disabled={!selectedExamSubjectCode}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="">Konu seçin...</option>
                      {(examSubjects.find(s => s.subject_code === selectedExamSubjectCode)?.topics || []).map(t => (
                        <option key={t.id} value={t.id}>
                          {t.main_topic}{t.sub_topic ? ` — ${t.sub_topic}` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              ) : (
                <>
              {/* Sınıf bazlı: normal ders listesi */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Ders</label>
                <select
                  value={selectedSubject}
                  onChange={(e) => {
                    setSelectedSubject(e.target.value)
                    setSelectedTopic('')
                  }}
                  disabled={loadingSubjects}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="">Ders seçin...</option>
                  {subjects.map(subject => (
                    <option key={subject.id} value={subject.id}>
                      {subject.icon} {subject.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Konu Seçimi */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Konu</label>
                <select
                  value={selectedTopic}
                  onChange={(e) => setSelectedTopic(e.target.value)}
                  disabled={!selectedSubject || loadingTopics}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="">Konu seçin...</option>
                  {topics.map(topic => (
                    <option key={topic.id} value={topic.id}>
                      {topic.main_topic} {topic.sub_topic ? `- ${topic.sub_topic}` : ''}
                    </option>
                  ))}
                </select>
              </div>
                </>
              )}
            </motion.div>

            {/* Görüntü Tipi Seçimi */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100"
            >
              <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-purple-500" />
                Görüntü Tipi
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {getImageTypesForExam(selectedExamMode, selectedExamSubjectCode || undefined).map(type => {
                  const Icon = type.icon
                  return (
                    <button
                      key={type.id}
                      onClick={() => setSelectedImageType(type.id)}
                      className={`p-3 rounded-xl text-left transition-all hover:scale-105 ${
                        selectedImageType === type.id
                          ? 'bg-purple-50 border-2 border-purple-500 shadow-lg'
                          : 'bg-gray-50 border-2 border-transparent hover:border-gray-200'
                      }`}
                    >
                      <div className={`w-9 h-9 ${type.color} rounded-lg flex items-center justify-center mb-2`}>
                        <span className="text-base">{type.emoji}</span>
                      </div>
                      <p className="font-medium text-gray-900 text-sm">{type.name}</p>
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{type.description}</p>
                    </button>
                  )
                })}
              </div>
              
              {/* Bilgi Notu */}
              <div className="mt-4 p-3 bg-purple-50 rounded-xl border border-purple-100">
                <p className="text-sm text-purple-700 flex items-center gap-2">
                  <Wand2 className="w-4 h-4" />
                  AI, seçtiğiniz konuya uygun görsel açıklamasını otomatik oluşturacak
                </p>
              </div>
            </motion.div>

            {/* Zorluk Seçimi */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100"
            >
              <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Target className="w-5 h-5 text-purple-500" />
                Zorluk Seviyesi
              </h2>
              <div className="flex flex-wrap gap-2">
                {DIFFICULTIES.map(diff => (
                  <button
                    key={diff.id}
                    onClick={() => setSelectedDifficulty(diff.id)}
                    className={`px-4 py-2 rounded-xl border-2 font-medium transition-all ${
                      selectedDifficulty === diff.id
                        ? diff.color + ' scale-105 shadow-md'
                        : 'bg-gray-50 border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    {diff.emoji} {diff.name}
                  </button>
                ))}
              </div>
            </motion.div>

            {/* Üret Butonu */}
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              onClick={generateImageQuestion}
              disabled={generating || !selectedSubject || !selectedTopic}
              className={`w-full py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 transition-all ${
                generating || !selectedSubject || !selectedTopic
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:shadow-xl hover:scale-[1.02]'
              }`}
            >
              {generating ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" />
                  AI Görsel ve Soru Üretiyor...
                </>
              ) : (
                <>
                  <Sparkles className="w-6 h-6" />
                  Görüntülü Soru Üret
                </>
              )}
            </motion.button>
          </div>

          {/* Sağ Panel - Önizleme */}
          <div className="space-y-6">
            {/* Hata Mesajı */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3"
                >
                  <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-red-700">Hata</p>
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Başarı Mesajı */}
            <AnimatePresence>
              {successMessage && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-start gap-3"
                >
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <p className="font-medium text-green-700">{successMessage}</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Üretilen Soru Önizlemesi */}
            {generatedQuestion ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden"
              >
                {/* Görüntü */}
                <div className="relative bg-gray-100 aspect-video">
                  {generatedQuestion.image_base64 ? (
                    <>
                      <img
                        src={generatedQuestion.image_base64}
                        alt="Soru görseli"
                        className="w-full h-full object-contain"
                      />
                      {/* Görüntü Araçları */}
                      <div className="absolute top-3 right-3 flex gap-2">
                        <button
                          onClick={regenerateImage}
                          disabled={generatingImage}
                          className="p-2 bg-white/90 rounded-lg shadow-md hover:bg-white transition-colors"
                          title="Yeniden Üret"
                        >
                          {generatingImage ? (
                            <Loader2 className="w-5 h-5 animate-spin text-purple-500" />
                          ) : (
                            <RefreshCw className="w-5 h-5 text-purple-500" />
                          )}
                        </button>
                        <button
                          onClick={downloadImage}
                          className="p-2 bg-white/90 rounded-lg shadow-md hover:bg-white transition-colors"
                          title="İndir"
                        >
                          <Download className="w-5 h-5 text-purple-500" />
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                      <AlertTriangle className="w-12 h-12 mb-2" />
                      <p>Görüntü üretilemedi</p>
                      <button
                        onClick={regenerateImage}
                        disabled={generatingImage}
                        className="mt-3 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
                      >
                        {generatingImage ? 'Üretiliyor...' : 'Tekrar Dene'}
                      </button>
                    </div>
                  )}
                </div>

                {/* Soru İçeriği */}
                <div className="p-6">
                  {/* Soru Metni */}
                  <div className="mb-6">
                    <h3 className="font-semibold text-gray-900 mb-2">Soru</h3>
                    <p className="text-gray-700">
                      <MathRenderer content={generatedQuestion.question_text} />
                    </p>
                  </div>

                  {/* Şıklar */}
                  <div className="space-y-2 mb-6">
                    {Object.entries(generatedQuestion.options).map(([key, value]) => {
                      if (!value) return null
                      const isCorrect = key === generatedQuestion.correct_answer
                      return (
                        <div
                          key={key}
                          className={`p-3 rounded-xl border-2 ${
                            isCorrect
                              ? 'border-green-500 bg-green-50'
                              : 'border-gray-200 bg-gray-50'
                          }`}
                        >
                          <span className={`font-bold ${isCorrect ? 'text-green-600' : 'text-gray-600'}`}>
                            {key})
                          </span>{' '}
                          <MathRenderer content={value} />
                          {isCorrect && (
                            <CheckCircle className="inline-block ml-2 w-4 h-4 text-green-500" />
                          )}
                        </div>
                      )
                    })}
                  </div>

                  {/* Açıklama */}
                  <div className="bg-blue-50 rounded-xl p-4 mb-6">
                    <h4 className="font-semibold text-blue-800 mb-2">Açıklama</h4>
                    <p className="text-blue-700 text-sm">
                      <MathRenderer content={generatedQuestion.explanation} />
                    </p>
                  </div>

                  {/* Meta Bilgiler */}
                  <div className="flex flex-wrap gap-2 mb-6">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      DIFFICULTIES.find(d => d.id === generatedQuestion.difficulty)?.color || 'bg-gray-100'
                    }`}>
                      {DIFFICULTIES.find(d => d.id === generatedQuestion.difficulty)?.emoji}{' '}
                      {DIFFICULTIES.find(d => d.id === generatedQuestion.difficulty)?.name}
                    </span>
                    <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                      🎓 {generatedQuestion.bloom_level}
                    </span>
                  </div>

                  {/* Kaydet Butonu */}
                  <button
                    onClick={saveQuestion}
                    disabled={saving}
                    className="w-full py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-semibold flex items-center justify-center gap-2 hover:shadow-lg transition-all"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Kaydediliyor...
                      </>
                    ) : (
                      <>
                        <Save className="w-5 h-5" />
                        Soruyu Kaydet
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            ) : (
              /* Boş Durum */
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-12 text-center border-2 border-dashed border-purple-200"
              >
                <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ImageIcon className="w-10 h-10 text-purple-500" />
                </div>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">
                  Görüntülü Soru Üretin
                </h3>
                <p className="text-gray-500 max-w-md mx-auto">
                  Sol taraftaki formu doldurun ve &quot;Görüntülü Soru Üret&quot; butonuna tıklayın.
                  AI, açıklamanıza uygun bir görsel ve soru oluşturacaktır.
                </p>
                
                {/* Örnek Görseller */}
                <div className="mt-8 grid grid-cols-3 gap-4">
                  {IMAGE_TYPES.slice(0, 3).map(type => {
                    const Icon = type.icon
                    return (
                      <div key={type.id} className="p-4 bg-white rounded-xl shadow-sm">
                        <div className={`w-12 h-12 ${type.color} rounded-lg flex items-center justify-center mx-auto mb-2`}>
                          <Icon className="w-6 h-6 text-white" />
                        </div>
                        <p className="text-sm text-gray-600">{type.name}</p>
                      </div>
                    )
                  })}
                </div>
              </motion.div>
            )}

            {/* Bilgi Kutusu */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl p-6 text-white"
            >
              <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                Görüntülü Soru Hakkında
              </h3>
              <ul className="space-y-2 text-sm text-purple-100">
                <li className="flex items-start gap-2">
                  <span>•</span>
                  <span>AI, açıklamanıza uygun eğitim amaçlı görseller üretir</span>
                </li>
                <li className="flex items-start gap-2">
                  <span>•</span>
                  <span>Grafik, diyagram, tablo ve harita türünde görseller desteklenir</span>
                </li>
                <li className="flex items-start gap-2">
                  <span>•</span>
                  <span>Üretilen görseller MEB müfredatına uygun şekilde tasarlanır</span>
                </li>
                <li className="flex items-start gap-2">
                  <span>•</span>
                  <span>Beğenmezseniz &quot;Yeniden Üret&quot; ile farklı bir görsel alabilirsiniz</span>
                </li>
              </ul>
            </motion.div>

            {/* Kaydedilen Görüntülü Sorular */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg text-gray-900 flex items-center gap-2">
                  <ImageIcon className="w-5 h-5 text-purple-500" />
                  Kaydedilen Görüntülü Sorular
                </h3>
                <button
                  onClick={loadSavedImageQuestions}
                  disabled={loadingSavedQuestions}
                  className="p-2 text-purple-500 hover:bg-purple-50 rounded-lg transition-colors"
                >
                  <RefreshCw className={`w-4 h-4 ${loadingSavedQuestions ? 'animate-spin' : ''}`} />
                </button>
              </div>

              {loadingSavedQuestions ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
                </div>
              ) : savedImageQuestions.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  Henüz görüntülü soru kaydedilmemiş
                </p>
              ) : (
                <div className="space-y-3">
                  {savedImageQuestions.map((q) => (
                    <div
                      key={q.id}
                      className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
                      onClick={() => {
                        // Soruyu önizle
                        setGeneratedQuestion({
                          question_text: q.question_text,
                          image_prompt: '',
                          image_base64: q.question_image_url,
                          options: { A: '', B: '', C: '', D: '' },
                          correct_answer: q.correct_answer,
                          explanation: '',
                          difficulty: q.difficulty,
                          bloom_level: ''
                        })
                      }}
                    >
                      {/* Küçük Görsel */}
                      {q.question_image_url && (
                        <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-white border">
                          <img
                            src={q.question_image_url}
                            alt="Soru görseli"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-700 line-clamp-2">
                          <MathRenderer text={q.question_text?.substring(0, 100) || ''} />
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-purple-600 bg-purple-50 px-2 py-0.5 rounded">
                            {q.topic?.subject?.name}
                          </span>
                          <span className="text-xs text-gray-500">
                            {q.topic?.main_topic}
                          </span>
                          <span className={`text-xs px-2 py-0.5 rounded ${
                            q.difficulty === 'easy' ? 'bg-green-100 text-green-700' :
                            q.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                            q.difficulty === 'hard' ? 'bg-orange-100 text-orange-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {q.difficulty === 'easy' ? 'Kolay' :
                             q.difficulty === 'medium' ? 'Orta' :
                             q.difficulty === 'hard' ? 'Zor' : 'Efsane'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </div>
        </div>
        )}

        {/* ========== TOPLU ÜRETİM MODU ========== */}
        {generationMode === 'batch' && (
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Sol Panel - Tekli üretimle aynı ayarlar */}
            <div className="space-y-4">

              {/* Sınav Modu */}
              <div className="bg-white rounded-xl shadow-lg p-4 border border-gray-100">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2 text-sm">
                  <Target className="w-4 h-4 text-orange-500" />
                  Sınav Modu
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    onClick={() => handleExamModeChange(null)}
                    disabled={isBatchGenerating}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all disabled:opacity-50 ${
                      !selectedExamMode ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-600'
                    }`}
                  >📚 Sınıf</button>
                  {[
                    { mode: 'TYT', emoji: '📝' }, { mode: 'AYT', emoji: '🎯' },
                    { mode: 'KPSS', emoji: '🏛️' }, { mode: 'KPSS_ONLISANS', emoji: '🎒', label: 'KPSS ÖL' },
                    { mode: 'KPSS_ORTAOGRETIM', emoji: '🎒', label: 'KPSS L' },
                    { mode: 'DGS', emoji: '🔄' }, { mode: 'ALES', emoji: '🎓' },
                  ].map(({ mode, emoji, label }) => (
                    <button key={mode} onClick={() => handleExamModeChange(mode)} disabled={isBatchGenerating}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all disabled:opacity-50 ${
                        selectedExamMode === mode ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-600'
                      }`}
                    >{emoji} {label || mode}</button>
                  ))}
                </div>
              </div>

              {/* Sınıf (sadece sınıf bazlı modda) */}
              {!selectedExamMode && (
              <div className="bg-white rounded-xl shadow-lg p-4 border border-gray-100">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-orange-500" />
                  Sınıf
                </h3>
                <select
                  value={selectedGrade}
                  onChange={(e) => setSelectedGrade(Number(e.target.value))}
                  disabled={isBatchGenerating}
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-orange-500 disabled:opacity-50"
                >
                  {GRADES.map(g => (
                    <option key={g.grade} value={g.grade}>{g.label} - {g.level}</option>
                  ))}
                </select>
              </div>
              )}

              {/* Ders ve Konu */}
              <div className="bg-white rounded-xl shadow-lg p-4 border border-gray-100">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-orange-500" />
                  {selectedExamMode ? `${selectedExamMode} Ders ve Konu` : 'Ders ve Konu'}
                </h3>

                {selectedExamMode ? (
                  <>
                    {/* Sınav ders butonları */}
                    <div className="mb-3">
                      {loadingExamSubjects ? (
                        <div className="flex items-center gap-2 py-2 text-sm text-gray-400">
                          <Loader2 className="w-4 h-4 animate-spin" /> Yükleniyor...
                        </div>
                      ) : (
                        <div className="flex flex-wrap gap-1.5">
                          {examSubjects.map(sub => (
                            <button
                              key={sub.subject_code}
                              onClick={() => {
                                setSelectedExamSubjectCode(sub.subject_code)
                                setSelectedTopic('')
                                const types = getImageTypesForExam(selectedExamMode, sub.subject_code)
                                if (types.length > 0) setSelectedImageType(types[0].id)
                              }}
                              disabled={isBatchGenerating}
                              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all disabled:opacity-50 ${
                                selectedExamSubjectCode === sub.subject_code
                                  ? 'bg-orange-500 text-white'
                                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                              }`}
                            >
                              {sub.subject_name}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <select
                      value={selectedTopic}
                      onChange={(e) => setSelectedTopic(e.target.value)}
                      disabled={!selectedExamSubjectCode || isBatchGenerating}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-orange-500 disabled:opacity-50"
                    >
                      <option value="">Konu seçin...</option>
                      {(examSubjects.find(s => s.subject_code === selectedExamSubjectCode)?.topics || []).map(t => (
                        <option key={t.id} value={t.id}>
                          {t.main_topic}{t.sub_topic ? ` — ${t.sub_topic}` : ''}
                        </option>
                      ))}
                    </select>
                  </>
                ) : (
                  <>
                    <select
                      value={selectedSubject}
                      onChange={(e) => { setSelectedSubject(e.target.value); setSelectedTopic('') }}
                      disabled={loadingSubjects || isBatchGenerating}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-orange-500 disabled:opacity-50 mb-3"
                    >
                      <option value="">Ders seçin...</option>
                      {subjects.map(s => <option key={s.id} value={s.id}>{s.icon} {s.name}</option>)}
                    </select>
                    <select
                      value={selectedTopic}
                      onChange={(e) => setSelectedTopic(e.target.value)}
                      disabled={loadingTopics || !selectedSubject || isBatchGenerating}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-orange-500 disabled:opacity-50"
                    >
                      <option value="">Konu seçin...</option>
                      {topics.map(t => (
                        <option key={t.id} value={t.id}>
                          {t.main_topic}{t.sub_topic ? ` - ${t.sub_topic}` : ''}
                        </option>
                      ))}
                    </select>
                  </>
                )}
              </div>

              {/* Görsel Tipi */}
              <div className="bg-white rounded-xl shadow-lg p-4 border border-gray-100">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <ImageIcon className="w-5 h-5 text-orange-500" />
                  Görsel Tipi
                </h3>
                <div className="grid grid-cols-2 gap-1.5">
                  {getImageTypesForExam(selectedExamMode, selectedExamSubjectCode || undefined).map(type => (
                    <button
                      key={type.id}
                      onClick={() => setSelectedImageType(type.id)}
                      disabled={isBatchGenerating}
                      className={`p-2 rounded-lg border-2 transition-all text-left flex items-center gap-2 ${
                        selectedImageType === type.id ? 'border-orange-500 bg-orange-50' : 'border-gray-200 hover:border-orange-300'
                      } disabled:opacity-50`}
                    >
                      <span className="text-base">{type.emoji}</span>
                      <span className="text-xs font-medium truncate">{type.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Soru Adedi */}
              <div className="bg-white rounded-xl shadow-lg p-4 border border-gray-100">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Layers className="w-5 h-5 text-orange-500" />
                  Soru Adedi
                </h3>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={batchQuestionCount}
                    onChange={(e) => setBatchQuestionCount(Number(e.target.value))}
                    disabled={isBatchGenerating}
                    className="flex-1"
                  />
                  <span className="text-2xl font-bold text-orange-600 w-8 text-center">
                    {batchQuestionCount}
                  </span>
                </div>
              </div>

              {/* Zorluk Dağılımı */}
              <div className="bg-white rounded-xl shadow-lg p-4 border border-gray-100">
                <h3 className="font-semibold text-gray-900 mb-3">Zorluk Dağılımı</h3>
                <div className="space-y-2">
                  {DIFFICULTIES.map(diff => (
                    <label
                      key={diff.id}
                      className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all ${
                        batchDifficultyDistribution[diff.id as keyof typeof batchDifficultyDistribution]
                          ? diff.color + ' border'
                          : 'bg-gray-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={batchDifficultyDistribution[diff.id as keyof typeof batchDifficultyDistribution]}
                        onChange={(e) => setBatchDifficultyDistribution(prev => ({
                          ...prev,
                          [diff.id]: e.target.checked
                        }))}
                        disabled={isBatchGenerating}
                        className="w-4 h-4"
                      />
                      <span>{diff.emoji} {diff.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Üretim Butonu */}
              <button
                onClick={isBatchGenerating ? toggleBatchPause : startBatchGeneration}
                disabled={!selectedSubject || !selectedTopic}
                className={`w-full py-4 rounded-xl font-bold text-white flex items-center justify-center gap-2 transition-all ${
                  isBatchGenerating
                    ? 'bg-orange-500 hover:bg-orange-600'
                    : 'bg-gradient-to-r from-orange-500 to-red-500 hover:shadow-lg'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {isBatchGenerating ? (
                  <>
                    {isBatchPaused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
                    {isBatchPaused ? 'Devam Et' : 'Duraklat'}
                  </>
                ) : (
                  <>
                    <Zap className="w-5 h-5" />
                    {batchQuestionCount} Soru Üret
                  </>
                )}
              </button>
            </div>

            {/* Sağ Panel - Üretilen Sorular */}
            <div className="lg:col-span-2">
              {/* İstatistikler */}
              {batchQuestions.length > 0 && (
                <div className="bg-white rounded-xl shadow-lg p-4 border border-gray-100 mb-4">
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-900">{batchStats.total}</div>
                        <div className="text-xs text-gray-500">Toplam</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">{batchStats.completed}</div>
                        <div className="text-xs text-gray-500">Tamamlandı</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">{batchStats.saved}</div>
                        <div className="text-xs text-gray-500">Kaydedildi</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-red-600">{batchStats.error}</div>
                        <div className="text-xs text-gray-500">Hata</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {batchStats.completed > 0 && (
                        <button
                          onClick={saveAllBatchQuestions}
                          disabled={savingAllBatch}
                          className="px-4 py-2 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 transition-all flex items-center gap-2 disabled:opacity-50"
                        >
                          {savingAllBatch ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Save className="w-4 h-4" />
                          )}
                          Tümünü Kaydet
                        </button>
                      )}
                      <button
                        onClick={clearBatchQuestions}
                        disabled={isBatchGenerating}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-all flex items-center gap-2 disabled:opacity-50"
                      >
                        <Trash2 className="w-4 h-4" />
                        Temizle
                      </button>
                    </div>
                  </div>

                  {/* İlerleme Çubuğu */}
                  {isBatchGenerating && (
                    <div className="mt-4">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-orange-500 to-red-500 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${((batchStats.completed + batchStats.error) / batchStats.total) * 100}%` }}
                        />
                      </div>
                      <p className="text-sm text-gray-500 mt-1 text-center">
                        {currentBatchIndex + 1} / {batchStats.total} üretiliyor...
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Soru Listesi */}
              {batchQuestions.length === 0 ? (
                <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-2xl p-12 text-center border-2 border-dashed border-orange-200">
                  <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Layers className="w-10 h-10 text-orange-500" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">
                    Toplu Soru Üretin
                  </h3>
                  <p className="text-gray-500">
                    Soldaki ayarları yapıp "Üret" butonuna tıklayın
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {batchQuestions.map((question, index) => (
                    <motion.div
                      key={question.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`bg-white rounded-xl shadow-lg border overflow-hidden ${
                        question.status === 'generating' ? 'border-orange-300 animate-pulse' :
                        question.status === 'completed' ? 'border-green-300' :
                        question.status === 'saved' ? 'border-blue-300' :
                        question.status === 'error' ? 'border-red-300' :
                        'border-gray-200'
                      }`}
                    >
                      {/* Soru Başlığı */}
                      <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-lg font-bold text-gray-700">#{index + 1}</span>
                          
                          {question.status === 'pending' && (
                            <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">Bekliyor</span>
                          )}
                          {question.status === 'generating' && (
                            <span className="px-2 py-1 bg-orange-100 text-orange-600 rounded-full text-xs flex items-center gap-1">
                              <Loader2 className="w-3 h-3 animate-spin" />
                              Üretiliyor
                            </span>
                          )}
                          {question.status === 'completed' && (
                            <span className="px-2 py-1 bg-green-100 text-green-600 rounded-full text-xs flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" />
                              Tamamlandı
                            </span>
                          )}
                          {question.status === 'saved' && (
                            <span className="px-2 py-1 bg-blue-100 text-blue-600 rounded-full text-xs flex items-center gap-1">
                              <Check className="w-3 h-3" />
                              Kaydedildi
                            </span>
                          )}
                          {question.status === 'error' && (
                            <span className="px-2 py-1 bg-red-100 text-red-600 rounded-full text-xs flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" />
                              Hata
                            </span>
                          )}

                          {question.difficulty && (
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              DIFFICULTIES.find(d => d.id === question.difficulty)?.color
                            }`}>
                              {DIFFICULTIES.find(d => d.id === question.difficulty)?.emoji}{' '}
                              {DIFFICULTIES.find(d => d.id === question.difficulty)?.name}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          {question.status === 'completed' && (
                            <button
                              onClick={() => saveBatchSingleQuestion(index)}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                              title="Kaydet"
                            >
                              <Save className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => removeBatchQuestion(index)}
                            disabled={question.status === 'generating'}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50"
                            title="Kaldır"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Soru İçeriği */}
                      {(question.status === 'completed' || question.status === 'saved') && (
                        <div className="p-4">
                          <div className="flex gap-4">
                            {question.image_base64 && (
                              <div className="w-32 h-32 rounded-lg overflow-hidden border bg-white flex-shrink-0">
                                <img
                                  src={question.image_base64}
                                  alt="Soru görseli"
                                  className="w-full h-full object-contain"
                                />
                              </div>
                            )}
                            
                            <div className="flex-1">
                              <div className="text-gray-800 mb-3">
                                <MathRenderer text={question.question_text} />
                              </div>
                              
                              <div className="grid grid-cols-2 gap-2">
                                {Object.entries(question.options).map(([key, value]) => (
                                  value && (
                                    <div
                                      key={key}
                                      className={`p-2 rounded-lg text-sm ${
                                        key === question.correct_answer
                                          ? 'bg-green-100 text-green-700 border border-green-300'
                                          : 'bg-gray-50 text-gray-600'
                                      }`}
                                    >
                                      <span className="font-bold mr-1">{key})</span>
                                      <MathRenderer text={value as string} />
                                    </div>
                                  )
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Hata Mesajı */}
                      {question.status === 'error' && (
                        <div className="p-4 bg-red-50 text-red-600 text-sm">
                          <AlertTriangle className="w-4 h-4 inline mr-2" />
                          {question.error || 'Soru üretilemedi'}
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
    </div>
  )
}

