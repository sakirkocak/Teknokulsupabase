'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { 
  searchQuestionsForAdmin, 
  getQuestionStatsFast,
  isTypesenseEnabled,
  type AdminQuestionResult 
} from '@/lib/typesense/browser-client'

import MathRenderer from '@/components/MathRenderer'
import MermaidRenderer from '@/components/MermaidRenderer'
import DOMPurify from 'isomorphic-dompurify'

// ⚡ Görsel içerik türünü tespit et
function detectVisualContentType(content: string): 'mermaid' | 'latex' | 'html' {
  const trimmed = content.trim()
  const lowerTrimmed = trimmed.toLowerCase()
  
  // Mermaid diyagramları
  if (lowerTrimmed.startsWith('graph ') || 
      lowerTrimmed.startsWith('flowchart ') || 
      lowerTrimmed.startsWith('pie ') ||
      lowerTrimmed.startsWith('xychart') ||
      lowerTrimmed.startsWith('sequencediagram') ||
      lowerTrimmed.startsWith('classdiagram') ||
      lowerTrimmed.startsWith('statediagram') ||
      lowerTrimmed.startsWith('erdiagram') ||
      lowerTrimmed.startsWith('gantt') ||
      lowerTrimmed.startsWith('journey') ||
      lowerTrimmed.startsWith('timeline')) {
    return 'mermaid'
  }
  
  // LaTeX tablo/matematik
  if (trimmed.includes('\\begin{') || 
      trimmed.includes('\\hline') || 
      trimmed.includes('$$') ||
      trimmed.includes('\\frac') ||
      trimmed.includes('\\sqrt')) {
    return 'latex'
  }
  
  // HTML/SVG
  return 'html'
}

// ⚡ Görsel içeriği uygun renderer ile göster
function VisualContentRenderer({ content, className = '' }: { content: string; className?: string }) {
  const type = detectVisualContentType(content)
  
  if (type === 'mermaid') {
    return (
      <div className={className}>
        <MermaidRenderer chart={content} />
      </div>
    )
  }
  
  if (type === 'latex') {
    return (
      <div className={className}>
        <MathRenderer text={content} />
      </div>
    )
  }
  
  // HTML/SVG
  return (
    <div 
      className={className}
      dangerouslySetInnerHTML={{ 
        __html: DOMPurify.sanitize(content, {
          ADD_TAGS: ['svg', 'path', 'circle', 'rect', 'line', 'polyline', 'polygon', 'text', 'g', 'defs', 'linearGradient', 'stop', 'clipPath', 'marker', 'use', 'symbol', 'ellipse', 'tspan'],
          ADD_ATTR: ['viewBox', 'xmlns', 'd', 'fill', 'stroke', 'stroke-width', 'cx', 'cy', 'r', 'x', 'y', 'x1', 'y1', 'x2', 'y2', 'width', 'height', 'transform', 'text-anchor', 'font-size', 'font-family', 'font-weight', 'dominant-baseline', 'points', 'rx', 'ry', 'offset', 'stop-color', 'stop-opacity', 'gradientUnits', 'gradientTransform', 'stroke-dasharray', 'stroke-linecap', 'stroke-linejoin', 'opacity', 'clip-path', 'marker-end', 'marker-start', 'href', 'xlink:href']
        })
      }} 
    />
  )
}
import { 
  BookOpen, Search, Filter, Edit2, Trash2, 
  CheckCircle, XCircle, Save, X, Eye, EyeOff,
  ChevronDown, ChevronUp, Star, Zap, Crown, Sparkles,
  AlertCircle, ChevronLeft, ChevronRight, RefreshCw,
  GraduationCap, Layers, BarChart3, Clock, Plus, ImageIcon,
  FlaskConical, Video, Youtube, Loader2, ExternalLink, Play
} from 'lucide-react'
import InteractiveSolutionButton from '@/components/InteractiveSolutionButton'
import JarvisSolutionButton from '@/components/JarvisSolutionButton'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'

interface Subject {
  id: string
  name: string
  code: string
  icon: string | null
}

interface Topic {
  id: string
  subject_id: string
  grade: number
  main_topic: string
  sub_topic: string | null
  learning_outcome: string | null
  subject?: Subject
}

interface Question {
  id: string
  topic_id: string
  difficulty: 'easy' | 'medium' | 'hard' | 'legendary'
  question_text: string
  question_image_url: string | null
  options: { A: string; B: string; C: string; D: string; E?: string }
  correct_answer: 'A' | 'B' | 'C' | 'D' | 'E'
  explanation: string | null
  source: string | null
  times_answered: number
  times_correct: number
  created_at: string
  topic?: Topic
  // 🆕 Yeni Nesil Soru alanları
  visual_type?: string | null
  visual_content?: string | null
  // 🎬 Video Çözüm alanları
  video_status?: string | null
  video_solution_url?: string | null
  video_youtube_id?: string | null
  // ✨ İnteraktif Çözüm alanları
  interactive_solution_status?: string | null
  interactive_solution_id?: string | null
  // Sınav türü (TYT/AYT)
  exam_types?: string[]
}

const difficultyConfig = {
  easy: { label: 'Kolay', color: 'bg-green-500', textColor: 'text-green-600', bgLight: 'bg-green-100', emoji: '🟢' },
  medium: { label: 'Orta', color: 'bg-yellow-500', textColor: 'text-yellow-600', bgLight: 'bg-yellow-100', emoji: '🟡' },
  hard: { label: 'Zor', color: 'bg-orange-500', textColor: 'text-orange-600', bgLight: 'bg-orange-100', emoji: '🟠' },
  legendary: { label: 'Efsane', color: 'bg-purple-500', textColor: 'text-purple-600', bgLight: 'bg-purple-100', emoji: '🔴' }
}

const grades = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]

export default function AdminSoruYonetimiPage() {
  const [questions, setQuestions] = useState<Question[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [topics, setTopics] = useState<Topic[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  // Filtreler
  const [filterGrade, setFilterGrade] = useState<number | ''>('')
  const [filterSubject, setFilterSubject] = useState<string>('')
  const [filterDifficulty, setFilterDifficulty] = useState<string>('')
  const [filterTopic, setFilterTopic] = useState<string>('')
  const [filterHasImage, setFilterHasImage] = useState(false) // Görüntülü soru filtresi
  const [filterNewGeneration, setFilterNewGeneration] = useState(false) // Yeni nesil soru filtresi
  const [filterExamType, setFilterExamType] = useState<string>('') // TYT/AYT/LGS sınav türü filtresi
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('') // ⚡ Debounced arama
  const [showFilters, setShowFilters] = useState(true)
  const [isSearching, setIsSearching] = useState(false) // Arama animasyonu
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  // Sayfalama
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const pageSize = 20
  
  // Düzenleme
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null)
  const [editForm, setEditForm] = useState<any>(null)
  
  // Önizleme
  const [previewQuestion, setPreviewQuestion] = useState<Question | null>(null)
  
  // İstatistikler
  const [stats, setStats] = useState({
    total: 0,
    easy: 0,
    medium: 0,
    hard: 0,
    legendary: 0,
    withImage: 0, // Görüntülü soru sayısı
    newGeneration: 0, // 🆕 Yeni nesil soru sayısı
    byGrade: {} as Record<number, number>
  })
  
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [generatingVideoFor, setGeneratingVideoFor] = useState<string | null>(null) // 🎬 Video oluşturma durumu
  
  const supabase = createClient()

  useEffect(() => {
    loadAllSubjects()
    loadStats()
  }, [])

  // ⚡ Debounce arama - 300ms bekle
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }
    
    if (searchQuery !== debouncedSearchQuery) {
      setIsSearching(true)
      searchTimeoutRef.current = setTimeout(() => {
        setDebouncedSearchQuery(searchQuery)
        setCurrentPage(1)
        setIsSearching(false)
      }, 300)
    }
    
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [searchQuery])

  useEffect(() => {
    loadQuestions()
  }, [filterGrade, filterSubject, filterDifficulty, filterTopic, filterHasImage, filterNewGeneration, filterExamType, debouncedSearchQuery, currentPage])

  useEffect(() => {
    if (filterGrade) {
      loadSubjectsForGrade(filterGrade as number)
      loadTopicsForGrade(filterGrade as number)
    } else {
      loadAllSubjects()
      setTopics([])
      setFilterTopic('')
    }
  }, [filterGrade])

  useEffect(() => {
    if (filterGrade && filterSubject) {
      loadTopicsForGrade(filterGrade as number)
    }
  }, [filterSubject])

  // Tüm dersleri yükle (sınıf seçilmediğinde)
  const loadAllSubjects = async () => {
    const { data } = await supabase
      .from('subjects')
      .select('id, name, code, icon')
      .order('name')
    
    if (data) setSubjects(data)
  }

  // Seçilen sınıfa göre dersleri yükle
  const loadSubjectsForGrade = async (grade: number) => {
    const { data } = await supabase
      .from('grade_subjects')
      .select(`
        subject:subjects(id, name, code, icon)
      `)
      .eq('grade_id', grade)
    
    if (data) {
      const subjectList = data
        .map((item: any) => item.subject)
        .filter(Boolean)
        .sort((a: any, b: any) => a.name.localeCompare(b.name, 'tr'))
      setSubjects(subjectList)
      
      // Eğer seçili ders bu sınıfta yoksa temizle
      if (filterSubject && !subjectList.find((s: any) => s.id === filterSubject)) {
        setFilterSubject('')
      }
    }
  }

  const loadTopicsForGrade = async (grade: number) => {
    let query = supabase
      .from('topics')
      .select('id, subject_id, grade, main_topic, sub_topic, learning_outcome, subject:subjects(id, name, code)')
      .eq('grade', grade)
      .order('main_topic')
    
    if (filterSubject) {
      query = query.eq('subject_id', filterSubject)
    }
    
    const { data } = await query
    if (data) setTopics(data as any)
  }

  const loadStats = async () => {
    // ⚡ Typesense'den istatistikleri al (daha hızlı!)
    if (isTypesenseEnabled()) {
      try {
        const statsData = await getQuestionStatsFast()
        setStats({
          total: statsData.total,
          easy: statsData.easy,
          medium: statsData.medium,
          hard: statsData.hard,
          legendary: statsData.legendary,
          withImage: statsData.withImage,
          newGeneration: statsData.newGeneration,
          byGrade: statsData.byGrade
        })
        console.log(`⚡ Stats loaded from Typesense in ${statsData.duration}ms`)
        return
      } catch (error) {
        console.error('Typesense stats error, falling back to Supabase:', error)
      }
    }
    
    // Fallback: Supabase RPC
    const { data, error } = await supabase.rpc('get_question_stats')
    
    if (data && !error) {
      setStats({
        total: data.total || 0,
        easy: data.easy || 0,
        medium: data.medium || 0,
        hard: data.hard || 0,
        legendary: data.legendary || 0,
        withImage: data.withImage || 0,
        newGeneration: data.newGeneration || 0,
        byGrade: data.byGrade || {}
      })
    } else {
      console.error('İstatistik yüklenemedi:', error)
    }
  }

  const loadQuestions = async () => {
    setLoading(true)
    
    // ⚡ Typesense'den soru ara (çok daha hızlı!)
    if (isTypesenseEnabled()) {
      try {
        // Subject code'u al (filterSubject = subject id, subject_code lazım)
        let subjectCode = ''
        if (filterSubject) {
          const subject = subjects.find(s => s.id === filterSubject)
          subjectCode = subject?.code || ''
        }
        
        const result = await searchQuestionsForAdmin({
          grade: filterGrade,
          subjectCode,
          difficulty: filterDifficulty,
          topicId: filterTopic,
          hasImage: filterHasImage,
          isNewGeneration: filterNewGeneration,
          examType: filterExamType || undefined,
          searchQuery: debouncedSearchQuery,
          page: currentPage,
          pageSize
        })
        
        // Typesense'den gelen ID'lerle Supabase'den detayları çek
        // (Typesense optimize edildi - şıklar, doğru cevap, açıklama orada yok)
        const questionIds = result.questions.map(q => q.question_id)
        
        if (questionIds.length > 0) {
          const { data: detailedQuestions, error: detailError } = await supabase
            .from('questions')
            .select(`
              id,
              topic_id,
              exam_types,
              question_text,
              question_image_url,
              options,
              correct_answer,
              explanation,
              difficulty,
              source,
              times_answered,
              times_correct,
              created_at,
              visual_type,
              visual_content,
              video_status,
              video_solution_url,
              video_youtube_id,
              interactive_solution_status,
              interactive_solution_id,
              topic:topics(
                id,
                subject_id,
                grade,
                main_topic,
                sub_topic,
                learning_outcome,
                subject:subjects(id, name, code, icon)
              )
            `)
            .in('id', questionIds)
          
          if (detailError) {
            console.error('Supabase detail fetch error:', detailError)
          }
          
          if (detailedQuestions && detailedQuestions.length > 0) {
            // Typesense sıralamasını koru
            const questionMap = new Map(detailedQuestions.map(q => [q.id, q]))
            // Typesense sonuçlarını da map'e al (TYT/AYT için fallback)
            const typesenseMap = new Map(result.questions.map(q => [q.question_id, q]))
            const mappedQuestions: Question[] = questionIds
              .map(id => questionMap.get(id))
              .filter(Boolean)
              .map((q: any) => {
                // TYT/AYT soruları için topic_id null - Typesense verisini fallback kullan
                const tsData = typesenseMap.get(q.id)
                const topicFallback = q.topic || (tsData ? {
                  id: '',
                  subject_id: '',
                  grade: tsData.grade || 0,
                  main_topic: tsData.main_topic || 'Bilinmiyor',
                  sub_topic: tsData.sub_topic || null,
                  learning_outcome: null,
                  subject: {
                    id: '',
                    name: tsData.subject_name || 'Bilinmiyor',
                    code: tsData.subject_code || '',
                    icon: null
                  }
                } : {
                  id: '', subject_id: '', grade: 0,
                  main_topic: 'Bilinmiyor', sub_topic: null, learning_outcome: null,
                  subject: { id: '', name: 'Bilinmiyor', code: '', icon: null }
                })
                return {
                  id: q.id,
                  topic_id: q.topic_id || '',
                  exam_types: q.exam_types || (tsData as any)?.exam_types || [],
                  difficulty: q.difficulty,
                  question_text: q.question_text,
                  question_image_url: q.question_image_url,
                  options: q.options || { A: '', B: '', C: '', D: '' },
                  correct_answer: q.correct_answer,
                  explanation: q.explanation,
                  source: q.source,
                  times_answered: q.times_answered || 0,
                  times_correct: q.times_correct || 0,
                  created_at: q.created_at,
                  visual_type: q.visual_type,
                  visual_content: q.visual_content,
                  topic: topicFallback,
                }
              })
            
            setQuestions(mappedQuestions)
            setTotalCount(result.total)
            console.log(`⚡ Questions: Typesense search + Supabase details in ${result.duration}ms, found ${mappedQuestions.length}`)
            setLoading(false)
            return
          }
        }
        
        // Typesense sonuç verdi ama Supabase detay bulamadı - fallback'e geç
        console.warn('Typesense found questions but Supabase details failed, falling back...')
      } catch (error) {
        console.error('Typesense questions error, falling back to Supabase:', error)
      }
    }
    
    // Fallback: Supabase (eski yöntem)
    // Önce topic_id'leri filtrele
    let topicIds: string[] | null = null
    
    if (filterGrade || filterSubject || filterTopic) {
      let topicQuery = supabase.from('topics').select('id')
      
      if (filterGrade) {
        topicQuery = topicQuery.eq('grade', filterGrade)
      }
      if (filterSubject) {
        topicQuery = topicQuery.eq('subject_id', filterSubject)
      }
      if (filterTopic) {
        topicQuery = topicQuery.eq('id', filterTopic)
      }
      
      const { data: topicData } = await topicQuery
      topicIds = topicData?.map(t => t.id) || []
      
      if (topicIds.length === 0) {
        setQuestions([])
        setTotalCount(0)
        setLoading(false)
        return
      }
    }
    
    // Toplam sayı
    let countQuery = supabase.from('questions').select('*', { count: 'exact', head: true })
    if (topicIds) {
      countQuery = countQuery.in('topic_id', topicIds)
    }
    if (filterDifficulty) {
      countQuery = countQuery.eq('difficulty', filterDifficulty)
    }
    if (searchQuery) {
      countQuery = countQuery.ilike('question_text', `%${searchQuery}%`)
    }
    // Görüntülü soru filtresi
    if (filterHasImage) {
      countQuery = countQuery.not('question_image_url', 'is', null)
    }
    
    const { count } = await countQuery
    setTotalCount(count || 0)
    
    // Soruları yükle
    let query = supabase
      .from('questions')
      .select(`
        *,
        visual_type,
        visual_content,
        video_status,
        video_solution_url,
        video_youtube_id,
        interactive_solution_status,
        interactive_solution_id,
        topic:topics(
          id, subject_id, grade, main_topic, sub_topic, learning_outcome,
          subject:subjects(id, name, code, icon)
        )
      `)
      .order('created_at', { ascending: false })
      .range((currentPage - 1) * pageSize, currentPage * pageSize - 1)
    
    if (topicIds) {
      query = query.in('topic_id', topicIds)
    }
    if (filterDifficulty) {
      query = query.eq('difficulty', filterDifficulty)
    }
    if (searchQuery) {
      query = query.ilike('question_text', `%${searchQuery}%`)
    }
    // Görüntülü soru filtresi
    if (filterHasImage) {
      query = query.not('question_image_url', 'is', null)
    }
    
    const { data, error } = await query
    
    if (error) {
      console.error('Sorular yüklenirken hata:', error)
      setMessage({ type: 'error', text: 'Sorular yüklenirken hata oluştu!' })
    } else {
      setQuestions(data || [])
    }
    
    setLoading(false)
  }

  const handleSearch = () => {
    setCurrentPage(1)
    loadQuestions()
  }

  const handleEdit = (question: Question) => {
    setEditingQuestion(question)
    setEditForm({
      difficulty: question.difficulty,
      question_text: question.question_text,
      options: { ...question.options },
      correct_answer: question.correct_answer,
      explanation: question.explanation || ''
    })
  }

  const handleSaveEdit = async () => {
    if (!editingQuestion || !editForm) return
    
    setSaving(true)
    
    const { error } = await supabase
      .from('questions')
      .update({
        difficulty: editForm.difficulty,
        question_text: editForm.question_text,
        options: editForm.options,
        correct_answer: editForm.correct_answer,
        explanation: editForm.explanation || null
      })
      .eq('id', editingQuestion.id)
    
    if (error) {
      setMessage({ type: 'error', text: 'Soru güncellenirken hata oluştu!' })
    } else {
      setMessage({ type: 'success', text: 'Soru başarıyla güncellendi!' })
      setEditingQuestion(null)
      setEditForm(null)
      loadQuestions()
    }
    
    setSaving(false)
    setTimeout(() => setMessage(null), 3000)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Bu soruyu silmek istediğinize emin misiniz?')) return
    
    const { error } = await supabase
      .from('questions')
      .delete()
      .eq('id', id)
    
    if (error) {
      setMessage({ type: 'error', text: 'Soru silinirken hata oluştu!' })
    } else {
      setMessage({ type: 'success', text: 'Soru silindi!' })
      loadQuestions()
      loadStats()
    }
    
    setTimeout(() => setMessage(null), 3000)
  }

  // 🎬 Video çözümü oluştur
  const handleGenerateVideo = async (questionId: string) => {
    if (!confirm('Bu soru için video çözümü oluşturulacak. Devam etmek istiyor musunuz?')) return
    
    setGeneratingVideoFor(questionId)
    
    try {
      const response = await fetch('/api/video/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionId })
      })
      
      const data = await response.json()
      
      if (response.ok && data.success) {
        setMessage({ type: 'success', text: '🎬 Video kuyruğa eklendi! Admin > Videos sayfasından takip edebilirsiniz.' })
        loadQuestions() // Listeyi güncelle
      } else {
        setMessage({ type: 'error', text: data.error || 'Video oluşturulurken hata oluştu!' })
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: 'Bağlantı hatası: ' + error.message })
    } finally {
      setGeneratingVideoFor(null)
      setTimeout(() => setMessage(null), 5000)
    }
  }

  const clearFilters = () => {
    setFilterGrade('')
    setFilterSubject('')
    setFilterDifficulty('')
    setFilterTopic('')
    setFilterHasImage(false)
    setFilterNewGeneration(false)
    setSearchQuery('')
    setDebouncedSearchQuery('')
    setCurrentPage(1)
  }

  const totalPages = Math.ceil(totalCount / pageSize)

  return (
    <>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-surface-900 dark:text-white flex items-center gap-3">
              <BookOpen className="h-8 w-8 text-primary-500" />
              Soru Yönetimi
            </h1>
            <p className="text-surface-500 mt-1">Tüm soruları görüntüle, düzenle ve yönet</p>
          </div>
          <Link
            href="/admin/ai-soru-uretici"
            className="btn btn-primary flex items-center gap-2"
          >
            <Sparkles className="h-5 w-5" />
            AI ile Soru Üret
          </Link>
        </div>

        {/* İstatistikler */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          <div className="card p-4 text-center">
            <div className="text-3xl font-bold text-surface-900 dark:text-white">{stats.total}</div>
            <div className="text-sm text-surface-500">Toplam Soru</div>
          </div>
          <div className="card p-4 text-center bg-green-50 dark:bg-green-900/20">
            <div className="text-3xl font-bold text-green-600">{stats.easy}</div>
            <div className="text-sm text-green-600">🟢 Kolay</div>
          </div>
          <div className="card p-4 text-center bg-yellow-50 dark:bg-yellow-900/20">
            <div className="text-3xl font-bold text-yellow-600">{stats.medium}</div>
            <div className="text-sm text-yellow-600">🟡 Orta</div>
          </div>
          <div className="card p-4 text-center bg-orange-50 dark:bg-orange-900/20">
            <div className="text-3xl font-bold text-orange-600">{stats.hard}</div>
            <div className="text-sm text-orange-600">🟠 Zor</div>
          </div>
          <div className="card p-4 text-center bg-purple-50 dark:bg-purple-900/20">
            <div className="text-3xl font-bold text-purple-600">{stats.legendary}</div>
            <div className="text-sm text-purple-600">🔴 Efsane</div>
          </div>
          <div className="card p-4 text-center">
            <div className="text-3xl font-bold text-primary-600">{Object.keys(stats.byGrade).length}</div>
            <div className="text-sm text-surface-500">Sınıf</div>
          </div>
        </div>

        {/* Mesaj */}
        <AnimatePresence>
          {message && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`p-4 rounded-lg flex items-center gap-2 ${
                message.type === 'success' 
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                  : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
              }`}
            >
              {message.type === 'success' ? <CheckCircle className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
              {message.text}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Filtreler */}
        <div className="card">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="w-full p-4 flex items-center justify-between hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-primary-500" />
              <span className="font-medium text-surface-900 dark:text-white">Filtreler</span>
              {(filterGrade || filterSubject || filterDifficulty || filterTopic || filterHasImage || filterNewGeneration || filterExamType || searchQuery) && (
                <span className="px-2 py-0.5 bg-primary-100 text-primary-600 text-xs rounded-full">
                  Aktif
                </span>
              )}
            </div>
            {showFilters ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
          </button>
          
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="p-4 pt-0 space-y-4 border-t border-surface-100 dark:border-surface-700">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {/* Sınıf */}
                    <div>
                      <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
                        Sınıf
                      </label>
                      <select
                        value={filterGrade}
                        onChange={(e) => {
                          setFilterGrade(e.target.value ? parseInt(e.target.value) : '')
                          setFilterTopic('')
                          setCurrentPage(1)
                        }}
                        className="w-full p-2 border border-surface-300 dark:border-surface-600 rounded-lg bg-white dark:bg-surface-800"
                      >
                        <option value="">Tüm Sınıflar</option>
                        {grades.map(g => (
                          <option key={g} value={g}>
                            {g}. Sınıf {stats.byGrade[g] ? `(${stats.byGrade[g]} soru)` : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    {/* Ders */}
                    <div>
                      <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
                        Ders
                      </label>
                      <select
                        value={filterSubject}
                        onChange={(e) => {
                          setFilterSubject(e.target.value)
                          setFilterTopic('')
                          setCurrentPage(1)
                        }}
                        className="w-full p-2 border border-surface-300 dark:border-surface-600 rounded-lg bg-white dark:bg-surface-800"
                      >
                        <option value="">Tüm Dersler</option>
                        {subjects.map(s => (
                          <option key={s.id} value={s.id}>
                            {s.icon} {s.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    {/* Zorluk */}
                    <div>
                      <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
                        Zorluk
                      </label>
                      <select
                        value={filterDifficulty}
                        onChange={(e) => {
                          setFilterDifficulty(e.target.value)
                          setCurrentPage(1)
                        }}
                        className="w-full p-2 border border-surface-300 dark:border-surface-600 rounded-lg bg-white dark:bg-surface-800"
                      >
                        <option value="">Tüm Zorluklar</option>
                        {Object.entries(difficultyConfig).map(([key, { label, emoji }]) => (
                          <option key={key} value={key}>
                            {emoji} {label}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    {/* Konu */}
                    <div>
                      <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
                        Konu
                      </label>
                      <select
                        value={filterTopic}
                        onChange={(e) => {
                          setFilterTopic(e.target.value)
                          setCurrentPage(1)
                        }}
                        disabled={!filterGrade}
                        className="w-full p-2 border border-surface-300 dark:border-surface-600 rounded-lg bg-white dark:bg-surface-800 disabled:opacity-50"
                      >
                        <option value="">{filterGrade ? 'Tüm Konular' : 'Önce sınıf seçin'}</option>
                        {topics.map(t => (
                          <option key={t.id} value={t.id}>
                            {t.main_topic} {t.sub_topic ? `- ${t.sub_topic}` : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  
                  {/* Görüntülü Soru ve Yeni Nesil Soru Filtreleri */}
                  <div className="flex flex-wrap items-center gap-3 mt-4 pt-4 border-t border-surface-200 dark:border-surface-700">
                    {/* Görüntülü Sorular */}
                    <button
                      onClick={() => {
                        setFilterHasImage(!filterHasImage)
                        setCurrentPage(1)
                      }}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                        filterHasImage
                          ? 'bg-purple-500 text-white shadow-lg shadow-purple-200'
                          : 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 hover:bg-purple-100'
                      }`}
                    >
                      <ImageIcon className="w-4 h-4" />
                      Görüntülü Sorular
                      {filterHasImage && <span className="ml-1">✓</span>}
                      <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-purple-100 dark:bg-purple-800 text-purple-700 dark:text-purple-300">
                        {stats.withImage}
                      </span>
                    </button>
                    
                    {/* Yeni Nesil Sorular */}
                    <button
                      onClick={() => {
                        setFilterNewGeneration(!filterNewGeneration)
                        setCurrentPage(1)
                      }}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                        filterNewGeneration
                          ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-200'
                          : 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100'
                      }`}
                    >
                      <FlaskConical className="w-4 h-4" />
                      Yeni Nesil Sorular
                      {filterNewGeneration && <span className="ml-1">✓</span>}
                      <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-indigo-100 dark:bg-indigo-800 text-indigo-700 dark:text-indigo-300">
                        {stats.newGeneration}
                      </span>
                    </button>

                    {/* Sınav Türü: TYT / AYT / LGS */}
                    {(['tyt', 'ayt', 'lgs'] as const).map((et) => (
                      <button
                        key={et}
                        onClick={() => {
                          setFilterExamType(filterExamType === et ? '' : et)
                          setCurrentPage(1)
                        }}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                          filterExamType === et
                            ? et === 'tyt'
                              ? 'bg-orange-500 text-white shadow-lg shadow-orange-200'
                              : et === 'ayt'
                              ? 'bg-blue-600 text-white shadow-lg shadow-blue-200'
                              : 'bg-green-600 text-white shadow-lg shadow-green-200'
                            : 'bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400 hover:bg-surface-200'
                        }`}
                      >
                        {et.toUpperCase()}
                        {filterExamType === et && <span className="ml-1">✓</span>}
                      </button>
                    ))}
                  </div>
                  
                  {/* ⚡ Anlık Arama */}
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1 relative">
                      {isSearching ? (
                        <div className="absolute left-3 top-1/2 -translate-y-1/2">
                          <div className="animate-spin w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full" />
                        </div>
                      ) : (
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-surface-400" />
                      )}
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="⚡ Anlık arama... (yazın, otomatik arar)"
                        className={`w-full pl-10 pr-4 py-2 border rounded-lg bg-white dark:bg-surface-800 transition-all ${
                          isSearching 
                            ? 'border-primary-400 ring-2 ring-primary-200 dark:ring-primary-800' 
                            : 'border-surface-300 dark:border-surface-600'
                        }`}
                      />
                      {searchQuery && (
                        <button
                          onClick={() => {
                            setSearchQuery('')
                            setDebouncedSearchQuery('')
                          }}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <button
                      onClick={clearFilters}
                      className="btn btn-secondary flex items-center gap-2"
                    >
                      <RefreshCw className="h-4 w-4" />
                      Temizle
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Soru Listesi */}
        <div className="card">
          <div className="p-4 border-b border-surface-100 dark:border-surface-700 flex items-center justify-between">
            <h3 className="font-semibold text-surface-900 dark:text-white">
              {totalCount} soru bulundu
            </h3>
            <div className="flex items-center gap-2 text-sm text-surface-500">
              Sayfa {currentPage} / {totalPages || 1}
            </div>
          </div>
          
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" />
            </div>
          ) : questions.length === 0 ? (
            <div className="p-12 text-center">
              <BookOpen className="h-16 w-16 text-surface-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-surface-600 dark:text-surface-400 mb-2">
                Soru bulunamadı
              </h3>
              <p className="text-surface-500">Farklı filtreler deneyin veya yeni sorular oluşturun.</p>
            </div>
          ) : (
            <div className="divide-y divide-surface-100 dark:divide-surface-700">
              {questions.map((question, idx) => (
                <div key={question.id} className="p-4 hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors">
                  <div className="flex items-start gap-4">
                    <div className="text-sm text-surface-400 font-medium w-8">
                      {(currentPage - 1) * pageSize + idx + 1}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      {/* Meta Bilgiler */}
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        {question.topic && (
                          <>
                            {/* Grade badge: TYT/AYT için sınıf yerine sınav adı */}
                            {question.topic.grade === 0 ? (
                              <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                                question.exam_types?.includes('ayt')
                                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                                  : 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300'
                              }`}>
                                {question.exam_types?.includes('ayt') ? 'AYT' : 'TYT'}
                              </span>
                            ) : (
                              <span className="text-xs px-2 py-1 bg-surface-100 dark:bg-surface-700 rounded-full text-surface-600 dark:text-surface-400">
                                <GraduationCap className="h-3 w-3 inline mr-1" />
                                {question.topic.grade}. Sınıf
                              </span>
                            )}
                            <span className="text-xs px-2 py-1 bg-primary-100 dark:bg-primary-900/30 rounded-full text-primary-600 dark:text-primary-400">
                              {(question.topic.subject as any)?.icon} {(question.topic.subject as any)?.name}
                            </span>
                            <span className="text-xs px-2 py-1 bg-surface-100 dark:bg-surface-700 rounded-full text-surface-600 dark:text-surface-400">
                              {question.topic.main_topic}
                            </span>
                          </>
                        )}
                        <span className={`text-xs px-2 py-1 rounded-full ${difficultyConfig[question.difficulty].bgLight} ${difficultyConfig[question.difficulty].textColor}`}>
                          {difficultyConfig[question.difficulty].emoji} {difficultyConfig[question.difficulty].label}
                        </span>
                        {/* 🎬 Video durumu badge */}
                        {question.video_status === 'completed' && (
                          <span className="text-xs px-2 py-1 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 flex items-center gap-1">
                            <Youtube className="w-3 h-3" />
                            Videolu
                          </span>
                        )}
                        {question.video_status === 'pending' && (
                          <span className="text-xs px-2 py-1 rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Bekliyor
                          </span>
                        )}
                        {question.video_status === 'processing' && (
                          <span className="text-xs px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center gap-1">
                            <Loader2 className="w-3 h-3 animate-spin" />
                            İşleniyor
                          </span>
                        )}
                        {/* ✨ İnteraktif Çözüm durumu badge */}
                        {question.interactive_solution_status === 'completed' && (
                          <span className="text-xs px-2 py-1 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                            <Sparkles className="w-3 h-3" />
                            İnteraktif
                          </span>
                        )}
                      </div>
                      
                      {/* Soru Görseli (varsa) */}
                      {question.question_image_url && (
                        <div className="mb-3 rounded-lg overflow-hidden border border-surface-200 dark:border-surface-600 bg-white">
                          <div className="flex items-start gap-3 p-2">
                            <img 
                              src={question.question_image_url}
                              alt="Soru görseli"
                              className="w-24 h-24 object-contain rounded"
                            />
                            <span className="text-xs text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/30 px-2 py-1 rounded-full flex items-center gap-1">
                              <ImageIcon className="w-3 h-3" />
                              Görüntülü Soru
                            </span>
                          </div>
                        </div>
                      )}
                      
                      {/* 🆕 Yeni Nesil Görsel İçerik (tablo, grafik, diyagram vs.) */}
                      {question.visual_content && (
                        <div className="mb-3 rounded-lg overflow-hidden border border-indigo-200 dark:border-indigo-700 bg-white dark:bg-surface-800 p-3">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-1 rounded-full flex items-center gap-1">
                              <Sparkles className="w-3 h-3" />
                              Yeni Nesil {question.visual_type === 'table' ? 'Tablo' : question.visual_type === 'chart' ? 'Grafik' : question.visual_type === 'diagram' ? 'Diyagram' : question.visual_type === 'flowchart' ? 'Akış Şeması' : question.visual_type === 'pie' ? 'Pasta Grafiği' : 'Görsel'}
                            </span>
                          </div>
                          <VisualContentRenderer 
                            content={question.visual_content} 
                            className="visual-content prose prose-sm dark:prose-invert max-w-none"
                          />
                        </div>
                      )}
                      
                      {/* Soru Metni */}
                      <div className="text-surface-900 dark:text-white mb-3">
                        <MathRenderer text={question.question_text || ''} />
                      </div>
                      
                      {/* Seçenekler */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
                        {Object.entries(question.options).map(([key, value]) => (
                          <div
                            key={key}
                            className={`p-2 rounded-lg text-sm ${
                              key === question.correct_answer
                                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-300'
                                : 'bg-surface-50 dark:bg-surface-700 text-surface-700 dark:text-surface-300'
                            }`}
                          >
                            <span className="font-bold mr-2">{key})</span>
                            <MathRenderer text={(value as string) || ''} />
                            {key === question.correct_answer && (
                              <CheckCircle className="h-4 w-4 inline ml-2 text-green-500" />
                            )}
                          </div>
                        ))}
                      </div>
                      
                      {/* Açıklama */}
                      {question.explanation && (
                        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm text-blue-700 dark:text-blue-400 mb-3">
                          <strong>Açıklama:</strong> <MathRenderer text={question.explanation || ''} />
                        </div>
                      )}
                      
                      {/* İstatistikler */}
                      <div className="flex items-center gap-4 text-xs text-surface-500">
                        <span className="flex items-center gap-1">
                          <BarChart3 className="h-3 w-3" />
                          {question.times_answered} kez çözüldü
                        </span>
                        {question.times_answered > 0 && (
                          <span className="flex items-center gap-1">
                            <CheckCircle className="h-3 w-3 text-green-500" />
                            %{Math.round((question.times_correct / question.times_answered) * 100)} doğru
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(question.created_at).toLocaleDateString('tr-TR')}
                        </span>
                      </div>
                    </div>
                    
                    {/* Aksiyonlar */}
                    <div className="flex items-center gap-1">
                      {/* 🎬 Video Çözümü */}
                      {question.video_status === 'completed' && question.video_solution_url ? (
                        <a
                          href={question.video_solution_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                          title="YouTube'da İzle"
                        >
                          <Youtube className="h-5 w-5 text-red-500" />
                        </a>
                      ) : question.video_status === 'pending' || question.video_status === 'processing' ? (
                        <div className="p-2" title="Video hazırlanıyor...">
                          <Loader2 className="h-5 w-5 text-yellow-500 animate-spin" />
                        </div>
                      ) : (
                        <button
                          onClick={() => handleGenerateVideo(question.id)}
                          disabled={generatingVideoFor === question.id}
                          className="p-2 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 rounded-lg transition-colors disabled:opacity-50"
                          title="Video Çözümü Oluştur"
                        >
                          {generatingVideoFor === question.id ? (
                            <Loader2 className="h-5 w-5 text-indigo-500 animate-spin" />
                          ) : (
                            <Video className="h-5 w-5 text-indigo-500" />
                          )}
                        </button>
                      )}
                      {/* ✨ İnteraktif Çözüm */}
                      <InteractiveSolutionButton
                        questionId={question.id || ''}
                        questionText={question.question_text || ''}
                        subjectName={(question.topic?.subject as any)?.name || 'Matematik'}
                        questionImageUrl={question.question_image_url}
                        visualContent={question.visual_content}
                        options={question.options}
                        correctAnswer={question.correct_answer}
                        explanation={question.explanation}
                        className="!p-2 !px-2 !text-xs !rounded-lg"
                      />
                      {/* 🤖 Jarvis ile Çöz */}
                      <JarvisSolutionButton
                        questionId={question.id || ''}
                        questionText={question.question_text || ''}
                        subject={(question.topic?.subject as any)?.slug || 'matematik'}
                        options={question.options}
                        correctAnswer={question.correct_answer}
                        explanation={question.explanation || undefined}
                        questionImageUrl={question.question_image_url || undefined}
                        className="!p-2 !px-3 !text-xs !rounded-lg"
                      />
                      <button
                        onClick={() => setPreviewQuestion(question)}
                        className="p-2 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                        title="Önizle"
                      >
                        <Eye className="h-5 w-5 text-blue-500" />
                      </button>
                      <button
                        onClick={() => handleEdit(question)}
                        className="p-2 hover:bg-surface-100 dark:hover:bg-surface-700 rounded-lg transition-colors"
                        title="Düzenle"
                      >
                        <Edit2 className="h-5 w-5 text-primary-500" />
                      </button>
                      <button
                        onClick={() => handleDelete(question.id)}
                        className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                        title="Sil"
                      >
                        <Trash2 className="h-5 w-5 text-red-500" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {/* Sayfalama */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-surface-100 dark:border-surface-700 flex items-center justify-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 hover:bg-surface-100 dark:hover:bg-surface-700 rounded-lg disabled:opacity-50"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum
                if (totalPages <= 5) {
                  pageNum = i + 1
                } else if (currentPage <= 3) {
                  pageNum = i + 1
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i
                } else {
                  pageNum = currentPage - 2 + i
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-10 h-10 rounded-lg font-medium ${
                      currentPage === pageNum
                        ? 'bg-primary-500 text-white'
                        : 'hover:bg-surface-100 dark:hover:bg-surface-700'
                    }`}
                  >
                    {pageNum}
                  </button>
                )
              })}
              
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 hover:bg-surface-100 dark:hover:bg-surface-700 rounded-lg disabled:opacity-50"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Düzenleme Modal */}
      <AnimatePresence>
        {editingQuestion && editForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
            onClick={() => setEditingQuestion(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-surface-800 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-surface-200 dark:border-surface-700 flex items-center justify-between">
                <h2 className="text-xl font-bold text-surface-900 dark:text-white">
                  Soruyu Düzenle
                </h2>
                <button
                  onClick={() => setEditingQuestion(null)}
                  className="p-2 hover:bg-surface-100 dark:hover:bg-surface-700 rounded-lg"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <div className="p-6 space-y-4">
                {/* Zorluk */}
                <div>
                  <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                    Zorluk Seviyesi
                  </label>
                  <div className="flex gap-2">
                    {Object.entries(difficultyConfig).map(([key, { label, emoji }]) => (
                      <button
                        key={key}
                        onClick={() => setEditForm({ ...editForm, difficulty: key })}
                        className={`px-4 py-2 rounded-lg font-medium transition-all ${
                          editForm.difficulty === key
                            ? 'bg-primary-500 text-white'
                            : 'bg-surface-100 dark:bg-surface-700 hover:bg-surface-200'
                        }`}
                      >
                        {emoji} {label}
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* Soru Metni */}
                <div>
                  <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                    Soru Metni
                  </label>
                  <textarea
                    value={editForm.question_text}
                    onChange={(e) => setEditForm({ ...editForm, question_text: e.target.value })}
                    rows={4}
                    className="w-full p-3 border border-surface-300 dark:border-surface-600 rounded-lg bg-white dark:bg-surface-800"
                  />
                </div>
                
                {/* Seçenekler */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {['A', 'B', 'C', 'D', 'E'].map((key) => {
                    if (key === 'E' && !editForm.options.E) return null
                    return (
                      <div key={key}>
                        <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                          {key} Şıkkı {key === editForm.correct_answer && <span className="text-green-500">(Doğru)</span>}
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={editForm.options[key] || ''}
                            onChange={(e) => setEditForm({
                              ...editForm,
                              options: { ...editForm.options, [key]: e.target.value }
                            })}
                            className="flex-1 p-2 border border-surface-300 dark:border-surface-600 rounded-lg bg-white dark:bg-surface-800"
                          />
                          <button
                            onClick={() => setEditForm({ ...editForm, correct_answer: key })}
                            className={`p-2 rounded-lg ${
                              editForm.correct_answer === key
                                ? 'bg-green-500 text-white'
                                : 'bg-surface-100 dark:bg-surface-700 hover:bg-green-100'
                            }`}
                            title="Doğru cevap olarak işaretle"
                          >
                            <CheckCircle className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
                
                {/* Açıklama */}
                <div>
                  <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                    Açıklama (Opsiyonel)
                  </label>
                  <textarea
                    value={editForm.explanation}
                    onChange={(e) => setEditForm({ ...editForm, explanation: e.target.value })}
                    rows={3}
                    className="w-full p-3 border border-surface-300 dark:border-surface-600 rounded-lg bg-white dark:bg-surface-800"
                    placeholder="Sorunun çözümü veya açıklaması..."
                  />
                </div>
              </div>
              
              <div className="p-6 border-t border-surface-200 dark:border-surface-700 flex justify-end gap-3">
                <button
                  onClick={() => setEditingQuestion(null)}
                  className="btn btn-secondary"
                >
                  İptal
                </button>
                <button
                  onClick={handleSaveEdit}
                  disabled={saving}
                  className="btn btn-primary flex items-center gap-2"
                >
                  {saving ? (
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  Kaydet
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Önizleme Modal - Öğrenci Görünümü */}
        {previewQuestion && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setPreviewQuestion(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-white/10"
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/5">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500/20 rounded-lg">
                    <Eye className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <span className="text-white font-medium">Öğrenci Görünümü</span>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${difficultyConfig[previewQuestion.difficulty].bgLight} ${difficultyConfig[previewQuestion.difficulty].textColor}`}>
                        {difficultyConfig[previewQuestion.difficulty].emoji} {difficultyConfig[previewQuestion.difficulty].label}
                      </span>
                      {previewQuestion.topic?.subject && (
                        <span className="text-xs text-white/50">
                          {previewQuestion.topic.subject.name}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => setPreviewQuestion(null)} 
                  className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Soru İçeriği */}
              <div className="p-6">
                {/* Soru Görseli */}
                {previewQuestion.question_image_url && (
                  <div className="mb-6 rounded-xl overflow-hidden border border-white/10 bg-white/5 p-3">
                    <img 
                      src={previewQuestion.question_image_url} 
                      alt="Soru görseli" 
                      className="max-w-full max-h-[300px] mx-auto object-contain rounded-lg"
                    />
                  </div>
                )}

                {/* 🆕 Yeni Nesil Görsel İçerik */}
                {previewQuestion.visual_content && (
                  <div className="mb-6 rounded-xl overflow-hidden border border-indigo-500/30 bg-white/10 p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Sparkles className="w-4 h-4 text-indigo-400" />
                      <span className="text-indigo-300 text-sm font-medium">
                        Yeni Nesil {previewQuestion.visual_type === 'table' ? 'Tablo' : previewQuestion.visual_type === 'chart' ? 'Grafik' : previewQuestion.visual_type === 'diagram' ? 'Diyagram' : previewQuestion.visual_type === 'flowchart' ? 'Akış Şeması' : previewQuestion.visual_type === 'pie' ? 'Pasta Grafiği' : 'Görsel'}
                      </span>
                    </div>
                    <VisualContentRenderer 
                      content={previewQuestion.visual_content} 
                      className="visual-content bg-white rounded-lg p-3"
                    />
                  </div>
                )}

                {/* Soru Metni */}
                <div className="text-white text-lg leading-relaxed mb-6 p-4 bg-white/5 rounded-xl border border-white/10">
                  <MathRenderer text={previewQuestion.question_text} />
                </div>

                {/* Şıklar */}
                <div className="space-y-3">
                  {Object.entries(previewQuestion.options).map(([key, value]) => (
                    value && (
                      <div
                        key={key}
                        className={`p-4 rounded-xl border-2 transition-all ${
                          key === previewQuestion.correct_answer
                            ? 'bg-green-500/20 border-green-500/50 shadow-lg shadow-green-500/20'
                            : 'bg-white/5 border-white/10 hover:border-white/20'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <span className={`font-bold text-lg ${
                            key === previewQuestion.correct_answer 
                              ? 'text-green-400' 
                              : 'text-white/60'
                          }`}>
                            {key})
                          </span>
                          <span className={
                            key === previewQuestion.correct_answer 
                              ? 'text-green-300' 
                              : 'text-white/80'
                          }>
                            <MathRenderer text={value} />
                          </span>
                          {key === previewQuestion.correct_answer && (
                            <CheckCircle className="w-5 h-5 text-green-400 ml-auto flex-shrink-0" />
                          )}
                        </div>
                      </div>
                    )
                  ))}
                </div>

                {/* Açıklama */}
                {previewQuestion.explanation && (
                  <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertCircle className="w-4 h-4 text-blue-400" />
                      <p className="text-blue-300 text-sm font-medium">Açıklama</p>
                    </div>
                    <p className="text-white/80 leading-relaxed">
                      <MathRenderer text={previewQuestion.explanation} />
                    </p>
                  </div>
                )}

                {/* Konu Bilgisi */}
                {previewQuestion.topic && (
                  <div className="mt-4 p-3 bg-white/5 rounded-lg border border-white/10">
                    <div className="flex items-center gap-2 text-white/50 text-sm">
                      <BookOpen className="w-4 h-4" />
                      <span>
                        {previewQuestion.topic.grade === 0
                          ? (previewQuestion.exam_types?.includes('ayt') ? 'AYT' : 'TYT')
                          : `${previewQuestion.topic.grade}. Sınıf`}
                      </span>
                      <span className="text-white/30">•</span>
                      <span>{previewQuestion.topic.main_topic}</span>
                      {previewQuestion.topic.sub_topic && (
                        <>
                          <span className="text-white/30">•</span>
                          <span>{previewQuestion.topic.sub_topic}</span>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

