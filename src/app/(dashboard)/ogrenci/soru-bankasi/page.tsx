'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { 
  BookOpen, Filter, Play, CheckCircle, XCircle, 
  ChevronRight, Trophy, Target, Zap, Crown, Star,
  BarChart3, ArrowRight, Clock, Brain, GraduationCap,
  ChevronDown, ChevronUp, Layers, Sparkles, ArrowLeft,
  TrendingUp, Award, Flame, Home
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import MathRenderer from '@/components/MathRenderer'

interface Subject {
  id: string
  name: string
  code: string
  icon: string | null
  color: string | null
  category: string | null
}

interface GradeSubject {
  id: string
  grade_id: number
  subject_id: string
  is_exam_subject: boolean
  subject: Subject
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
  topic?: Topic
  times_answered?: number
  times_correct?: number
}

interface StudentStats {
  topic_id: string
  total_attempted: number
  total_correct: number
  total_wrong: number
}

interface QuestionCount {
  subject_id: string
  count: number
}

interface TopicQuestionCount {
  topic_id: string
  count: number
}

const difficultyConfig = {
  easy: { label: 'Kolay', color: 'bg-green-500', textColor: 'text-green-500', emoji: '🟢', icon: CheckCircle },
  medium: { label: 'Orta', color: 'bg-yellow-500', textColor: 'text-yellow-500', emoji: '🟡', icon: Star },
  hard: { label: 'Zor', color: 'bg-orange-500', textColor: 'text-orange-500', emoji: '🟠', icon: Zap },
  legendary: { label: 'Efsane', color: 'bg-purple-500', textColor: 'text-purple-500', emoji: '🔴', icon: Crown }
}

// Ders renkleri
const subjectColorMap: Record<string, { bg: string; border: string; text: string }> = {
  'turkce': { bg: 'from-blue-500 to-blue-600', border: 'border-blue-300', text: 'text-blue-600' },
  'matematik': { bg: 'from-red-500 to-red-600', border: 'border-red-300', text: 'text-red-600' },
  'fen_bilimleri': { bg: 'from-green-500 to-green-600', border: 'border-green-300', text: 'text-green-600' },
  'inkilap_tarihi': { bg: 'from-amber-500 to-amber-600', border: 'border-amber-300', text: 'text-amber-600' },
  'din_kulturu': { bg: 'from-teal-500 to-teal-600', border: 'border-teal-300', text: 'text-teal-600' },
  'ingilizce': { bg: 'from-purple-500 to-purple-600', border: 'border-purple-300', text: 'text-purple-600' },
  'hayat_bilgisi': { bg: 'from-lime-500 to-lime-600', border: 'border-lime-300', text: 'text-lime-600' },
  'sosyal_bilgiler': { bg: 'from-orange-500 to-orange-600', border: 'border-orange-300', text: 'text-orange-600' },
  'edebiyat': { bg: 'from-indigo-500 to-indigo-600', border: 'border-indigo-300', text: 'text-indigo-600' },
  'fizik': { bg: 'from-cyan-500 to-cyan-600', border: 'border-cyan-300', text: 'text-cyan-600' },
  'kimya': { bg: 'from-violet-500 to-violet-600', border: 'border-violet-300', text: 'text-violet-600' },
  'biyoloji': { bg: 'from-emerald-500 to-emerald-600', border: 'border-emerald-300', text: 'text-emerald-600' },
  'tarih': { bg: 'from-yellow-500 to-yellow-600', border: 'border-yellow-300', text: 'text-yellow-600' },
  'cografya': { bg: 'from-sky-500 to-sky-600', border: 'border-sky-300', text: 'text-sky-600' },
  'felsefe': { bg: 'from-fuchsia-500 to-fuchsia-600', border: 'border-fuchsia-300', text: 'text-fuchsia-600' },
}

// Navigasyon durumu
type ViewMode = 'subjects' | 'topics' | 'practice'

export default function SoruBankasiPage() {
  const router = useRouter()
  const supabase = createClient()
  
  // Ana state
  const [viewMode, setViewMode] = useState<ViewMode>('subjects')
  const [gradeSubjects, setGradeSubjects] = useState<GradeSubject[]>([])
  const [topics, setTopics] = useState<Topic[]>([])
  const [questionCounts, setQuestionCounts] = useState<QuestionCount[]>([])
  const [topicQuestionCounts, setTopicQuestionCounts] = useState<TopicQuestionCount[]>([])
  const [totalGradeQuestions, setTotalGradeQuestions] = useState(0)
  const [stats, setStats] = useState<StudentStats[]>([])
  const [loading, setLoading] = useState(true)
  const [countsLoading, setCountsLoading] = useState(false)
  const [studentProfile, setStudentProfile] = useState<any>(null)
  const [studentPoints, setStudentPoints] = useState<any>(null)

  // Seçimler
  const [selectedGrade, setSelectedGrade] = useState<number>(8)
  const [selectedSubject, setSelectedSubject] = useState<GradeSubject | null>(null)
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null)
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('')
  const [expandedMainTopics, setExpandedMainTopics] = useState<string[]>([])

  // Soru çözme state
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null)
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)
  const [questionIndex, setQuestionIndex] = useState(0)
  const [sessionStats, setSessionStats] = useState({ correct: 0, wrong: 0 })
  const [earnedPoints, setEarnedPoints] = useState<number | null>(null)

  // İlk yükleme
  useEffect(() => {
    loadInitialData()
  }, [])

  // Sınıf değiştiğinde
  useEffect(() => {
    if (selectedGrade) {
      loadGradeData()
    }
  }, [selectedGrade])

  // Ders değiştiğinde
  useEffect(() => {
    if (selectedSubject) {
      loadSubjectTopics()
    }
  }, [selectedSubject])

  const loadInitialData = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      router.push('/giris')
      return
    }

    // Öğrenci profili
    const { data: profile } = await supabase
      .from('student_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single()
    
    if (profile) {
      setStudentProfile(profile)
      if (profile.grade) {
        setSelectedGrade(profile.grade)
      }
    }

    // Öğrenci puanları
    if (profile) {
      const { data: points } = await supabase
        .from('student_points')
        .select('*')
        .eq('student_id', profile.id)
        .single()
      
      if (points) {
        setStudentPoints(points)
      }
    }

    setLoading(false)
  }

  const loadGradeData = async () => {
    // Dersleri yükle
    const { data: gsData } = await supabase
      .from('grade_subjects')
      .select(`
        id,
        grade_id,
        subject_id,
        is_exam_subject,
        subject:subjects(id, name, code, icon, color, category)
      `)
      .eq('grade_id', selectedGrade)
      .order('is_exam_subject', { ascending: false })

    if (gsData) {
      setGradeSubjects(gsData as any)
    }

    // Soru sayılarını paralel olarak yükle (arka planda)
    loadQuestionCountsParallel(gsData)
  }

  // Soru sayılarını paralel yükle - UI'ı bloklamadan
  const loadQuestionCountsParallel = async (gsData: any[] | null) => {
    if (!gsData || gsData.length === 0) {
      setQuestionCounts([])
      setTotalGradeQuestions(0)
      return
    }

    setCountsLoading(true)

    try {
      // Önce bu sınıftaki TÜM topic'leri al (tek sorgu)
      const { data: allTopics } = await supabase
        .from('topics')
        .select('id, subject_id')
        .eq('grade', selectedGrade)
        .eq('is_active', true)

      if (!allTopics || allTopics.length === 0) {
        setQuestionCounts(gsData.map((gs: any) => ({ subject_id: gs.subject_id, count: 0 })))
        setTotalGradeQuestions(0)
        setCountsLoading(false)
        return
      }

      // Topic ID'lerini subject bazında grupla
      const topicsBySubject: Record<string, string[]> = {}
      allTopics.forEach(topic => {
        if (!topicsBySubject[topic.subject_id]) {
          topicsBySubject[topic.subject_id] = []
        }
        topicsBySubject[topic.subject_id].push(topic.id)
      })

      // Tüm topic ID'lerini birleştir
      const allTopicIds = allTopics.map(t => t.id)

      // Toplam soru sayısını al (tek sorgu)
      const { count: totalCount } = await supabase
        .from('questions')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true)
        .in('topic_id', allTopicIds)

      setTotalGradeQuestions(totalCount || 0)

      // Her ders için PARALEL olarak soru sayısını hesapla
      const countPromises = gsData.map(async (gs: any) => {
        const topicIds = topicsBySubject[gs.subject_id] || []
        if (topicIds.length === 0) {
          return { subject_id: gs.subject_id, count: 0 }
        }

        const { count } = await supabase
          .from('questions')
          .select('*', { count: 'exact', head: true })
          .eq('is_active', true)
          .in('topic_id', topicIds)

        return { subject_id: gs.subject_id, count: count || 0 }
      })

      const counts = await Promise.all(countPromises)
      setQuestionCounts(counts)
    } catch (error) {
      console.error('Soru sayıları yüklenirken hata:', error)
    } finally {
      setCountsLoading(false)
    }
  }

  const loadSubjectTopics = async () => {
    if (!selectedSubject) return

    const { data } = await supabase
      .from('topics')
      .select('*')
      .eq('subject_id', selectedSubject.subject_id)
      .eq('grade', selectedGrade)
      .eq('is_active', true)
      .order('unit_number', { ascending: true })
      .order('main_topic', { ascending: true })

    if (data) {
      setTopics(data)
      // İlk ana konuyu aç
      const mainTopics = Array.from(new Set(data.map(t => t.main_topic)))
      if (mainTopics.length > 0) {
        setExpandedMainTopics([mainTopics[0]])
      }

      // Konu bazında soru sayılarını paralel yükle
      loadTopicQuestionCounts(data)
    }
  }

  // Konu bazında soru sayılarını yükle
  const loadTopicQuestionCounts = async (topicsData: Topic[]) => {
    if (!topicsData || topicsData.length === 0) {
      setTopicQuestionCounts([])
      return
    }

    try {
      const topicIds = topicsData.map(t => t.id)
      
      // Tüm soruları topic_id ile al ve grupla
      const { data: questions } = await supabase
        .from('questions')
        .select('topic_id')
        .eq('is_active', true)
        .in('topic_id', topicIds)

      if (questions) {
        // topic_id bazında grupla
        const countMap: Record<string, number> = {}
        questions.forEach(q => {
          countMap[q.topic_id] = (countMap[q.topic_id] || 0) + 1
        })

        const counts = topicsData.map(topic => ({
          topic_id: topic.id,
          count: countMap[topic.id] || 0
        }))
        
        setTopicQuestionCounts(counts)
      }
    } catch (error) {
      console.error('Konu soru sayıları yüklenirken hata:', error)
    }
  }

  // Belirli bir konunun soru sayısını getir
  const getTopicQuestionCount = (topicId: string) => {
    return topicQuestionCounts.find(tc => tc.topic_id === topicId)?.count || 0
  }

  // Ana konulara göre grupla
  const groupedTopics = topics.reduce((acc, topic) => {
    const key = topic.main_topic
    if (!acc[key]) {
      acc[key] = []
    }
    acc[key].push(topic)
    return acc
  }, {} as Record<string, Topic[]>)

  const toggleMainTopic = (mainTopic: string) => {
    setExpandedMainTopics(prev => 
      prev.includes(mainTopic)
        ? prev.filter(t => t !== mainTopic)
        : [...prev, mainTopic]
    )
  }

  const getSubjectQuestionCount = (subjectId: string) => {
    return questionCounts.find(qc => qc.subject_id === subjectId)?.count || 0
  }

  const startPractice = async (topic?: Topic) => {
    if (topic) {
      setSelectedTopic(topic)
    }
    
    setViewMode('practice')
    setQuestionIndex(0)
    setSessionStats({ correct: 0, wrong: 0 })
    await loadNextQuestion(topic)
  }

  // Hızlı Başla - Rastgele soru çöz (tüm derslerden)
  const quickStart = async () => {
    setSelectedSubject(null)
    setSelectedTopic(null)
    setSelectedDifficulty('')
    setViewMode('practice')
    setQuestionIndex(0)
    setSessionStats({ correct: 0, wrong: 0 })
    await loadRandomQuestion()
  }

  // Ders bazlı hızlı başla
  const quickStartSubject = async (gs: GradeSubject) => {
    setSelectedSubject(gs)
    setSelectedTopic(null)
    setSelectedDifficulty('')
    setViewMode('practice')
    setQuestionIndex(0)
    setSessionStats({ correct: 0, wrong: 0 })
    await loadRandomQuestionFromSubject(gs.subject_id)
  }

  // Tüm sınıftan rastgele soru yükle
  const loadRandomQuestion = async () => {
    setSelectedAnswer(null)
    setShowResult(false)
    setEarnedPoints(null)

    // Bu sınıftaki tüm topic'leri al
    const { data: allTopics } = await supabase
      .from('topics')
      .select('id')
      .eq('grade', selectedGrade)
      .eq('is_active', true)

    if (!allTopics || allTopics.length === 0) {
      setCurrentQuestion(null)
      return
    }

    const topicIds = allTopics.map(t => t.id)
    
    const { data } = await supabase
      .from('questions')
      .select('*, topic:topics(*, subject:subjects(*))')
      .eq('is_active', true)
      .in('topic_id', topicIds)

    if (data && data.length > 0) {
      const randomIndex = Math.floor(Math.random() * data.length)
      setCurrentQuestion(data[randomIndex] as any)
      setQuestionIndex(prev => prev + 1)
    } else {
      setCurrentQuestion(null)
    }
  }

  // Belirli dersten rastgele soru yükle
  const loadRandomQuestionFromSubject = async (subjectId: string) => {
    setSelectedAnswer(null)
    setShowResult(false)
    setEarnedPoints(null)

    const { data: subjectTopics } = await supabase
      .from('topics')
      .select('id')
      .eq('subject_id', subjectId)
      .eq('grade', selectedGrade)
      .eq('is_active', true)

    if (!subjectTopics || subjectTopics.length === 0) {
      setCurrentQuestion(null)
      return
    }

    const topicIds = subjectTopics.map(t => t.id)
    
    const { data } = await supabase
      .from('questions')
      .select('*, topic:topics(*, subject:subjects(*))')
      .eq('is_active', true)
      .in('topic_id', topicIds)

    if (data && data.length > 0) {
      const randomIndex = Math.floor(Math.random() * data.length)
      setCurrentQuestion(data[randomIndex] as any)
      setQuestionIndex(prev => prev + 1)
    } else {
      setCurrentQuestion(null)
    }
  }

  const loadNextQuestion = async (topic?: Topic) => {
    setSelectedAnswer(null)
    setShowResult(false)
    setEarnedPoints(null)

    const topicToUse = topic || selectedTopic

    let query = supabase
      .from('questions')
      .select('*, topic:topics(*, subject:subjects(*))')
      .eq('is_active', true)

    if (topicToUse) {
      query = query.eq('topic_id', topicToUse.id)
    } else if (selectedSubject) {
      const topicIds = topics.map(t => t.id)
      if (topicIds.length > 0) {
        query = query.in('topic_id', topicIds)
      }
    }

    if (selectedDifficulty) {
      query = query.eq('difficulty', selectedDifficulty)
    }

    const { data } = await query

    if (data && data.length > 0) {
      const randomIndex = Math.floor(Math.random() * data.length)
      setCurrentQuestion(data[randomIndex] as any)
      setQuestionIndex(prev => prev + 1)
    } else {
      setCurrentQuestion(null)
    }
  }

  const handleAnswer = async (answer: string) => {
    if (showResult || !currentQuestion) return

    setSelectedAnswer(answer)
    const correct = answer === currentQuestion.correct_answer
    setIsCorrect(correct)
    setShowResult(true)

    const points = correct ? 2 : -1
    setEarnedPoints(points)

    setSessionStats(prev => ({
      correct: prev.correct + (correct ? 1 : 0),
      wrong: prev.wrong + (correct ? 0 : 1)
    }))

    // Soru istatistiklerini güncelle
    await supabase
      .from('questions')
      .update({
        times_answered: (currentQuestion.times_answered || 0) + 1,
        times_correct: (currentQuestion.times_correct || 0) + (correct ? 1 : 0)
      })
      .eq('id', currentQuestion.id)

    // Öğrenci puanlarını güncelle
    if (studentProfile) {
      const subjectCode = currentQuestion.topic?.subject?.code || 'turkce'
      
      const { data: existingPoints } = await supabase
        .from('student_points')
        .select('*')
        .eq('student_id', studentProfile.id)
        .single()

      const subjectMap: Record<string, { points: string; correct: string; wrong: string }> = {
        'turkce': { points: 'turkce_points', correct: 'turkce_correct', wrong: 'turkce_wrong' },
        'matematik': { points: 'matematik_points', correct: 'matematik_correct', wrong: 'matematik_wrong' },
        'fen_bilimleri': { points: 'fen_points', correct: 'fen_correct', wrong: 'fen_wrong' },
        'inkilap_tarihi': { points: 'inkilap_points', correct: 'inkilap_correct', wrong: 'inkilap_wrong' },
        'din_kulturu': { points: 'din_points', correct: 'din_correct', wrong: 'din_wrong' },
        'ingilizce': { points: 'ingilizce_points', correct: 'ingilizce_correct', wrong: 'ingilizce_wrong' },
      }

      if (existingPoints) {
        const updateData: any = {
          total_points: Math.max(0, existingPoints.total_points + points),
          total_questions: existingPoints.total_questions + 1,
          total_correct: existingPoints.total_correct + (correct ? 1 : 0),
          total_wrong: existingPoints.total_wrong + (correct ? 0 : 1),
          current_streak: correct ? existingPoints.current_streak + 1 : 0,
          max_streak: correct && existingPoints.current_streak + 1 > existingPoints.max_streak 
            ? existingPoints.current_streak + 1 
            : existingPoints.max_streak,
          last_activity_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }

        if (subjectMap[subjectCode]) {
          const cols = subjectMap[subjectCode]
          updateData[cols.points] = Math.max(0, (existingPoints[cols.points] || 0) + points)
          updateData[cols.correct] = (existingPoints[cols.correct] || 0) + (correct ? 1 : 0)
          updateData[cols.wrong] = (existingPoints[cols.wrong] || 0) + (correct ? 0 : 1)
        }

        await supabase
          .from('student_points')
          .update(updateData)
          .eq('student_id', studentProfile.id)

        setStudentPoints({ ...existingPoints, ...updateData })
      } else {
        const insertData: any = {
          student_id: studentProfile.id,
          total_points: Math.max(0, points),
          total_questions: 1,
          total_correct: correct ? 1 : 0,
          total_wrong: correct ? 0 : 1,
          current_streak: correct ? 1 : 0,
          max_streak: correct ? 1 : 0,
          last_activity_at: new Date().toISOString()
        }

        await supabase.from('student_points').insert(insertData)
        setStudentPoints(insertData)
      }
    }
  }

  const goBack = () => {
    if (viewMode === 'practice') {
      setViewMode('topics')
      setCurrentQuestion(null)
    } else if (viewMode === 'topics') {
      setViewMode('subjects')
      setSelectedSubject(null)
      setTopics([])
    }
  }

  const goHome = () => {
    setViewMode('subjects')
    setSelectedSubject(null)
    setSelectedTopic(null)
    setTopics([])
    setCurrentQuestion(null)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Yükleniyor...</p>
        </div>
      </div>
    )
  }

  // Soru Çözme Modu
  if (viewMode === 'practice') {
    if (!currentQuestion) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-indigo-900 to-purple-900 flex items-center justify-center p-4">
          <div className="text-center">
            <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <BookOpen className="h-10 w-10 text-white/60" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Soru Bulunamadı</h2>
            <p className="text-white/60 mb-6">Bu konu için henüz soru eklenmemiş.</p>
            <button
              onClick={goBack}
              className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all"
            >
              Geri Dön
            </button>
          </div>
        </div>
      )
    }

    const DiffIcon = difficultyConfig[currentQuestion.difficulty].icon

    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-indigo-900 to-purple-900 p-4 md:p-6">
        <div className="max-w-4xl mx-auto">
          {/* Üst Bar */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <button
                onClick={goBack}
                className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <span className="text-white/70">Soru {questionIndex}</span>
              <div className={`${difficultyConfig[currentQuestion.difficulty].color} px-3 py-1 rounded-full text-white text-sm flex items-center gap-1`}>
                <DiffIcon className="h-4 w-4" />
                {difficultyConfig[currentQuestion.difficulty].label}
              </div>
            </div>
            <div className="flex items-center gap-4">
              {/* Session Stats */}
              <div className="flex items-center gap-3 bg-white/10 px-4 py-2 rounded-xl">
                <span className="text-green-400 flex items-center gap-1">
                  <CheckCircle className="h-4 w-4" />
                  {sessionStats.correct}
                </span>
                <span className="text-red-400 flex items-center gap-1">
                  <XCircle className="h-4 w-4" />
                  {sessionStats.wrong}
                </span>
              </div>
              {/* Streak */}
              {studentPoints?.current_streak > 0 && (
                <div className="flex items-center gap-1 bg-orange-500/20 px-3 py-2 rounded-xl text-orange-400">
                  <Flame className="h-4 w-4" />
                  {studentPoints.current_streak}
                </div>
              )}
            </div>
          </div>

          {/* Soru Kartı */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 md:p-8"
          >
            {/* Konu Bilgisi */}
            <div className="text-indigo-300 text-sm mb-4 flex items-center gap-2">
              <span>{currentQuestion.topic?.subject?.icon || '📚'}</span>
              <span>{currentQuestion.topic?.subject?.name}</span>
              <ChevronRight className="h-4 w-4" />
              <span>{currentQuestion.topic?.main_topic}</span>
            </div>

            {/* Soru Metni */}
            <div className="text-white text-lg md:text-xl mb-6 leading-relaxed">
              <MathRenderer text={currentQuestion.question_text} />
            </div>

            {/* Görsel */}
            {currentQuestion.question_image_url && (
              <div className="mb-6">
                <img 
                  src={currentQuestion.question_image_url} 
                  alt="Soru görseli"
                  className="max-w-full rounded-lg"
                />
              </div>
            )}

            {/* Şıklar */}
            <div className="space-y-3">
              {Object.entries(currentQuestion.options).map(([key, value]) => {
                if (!value) return null
                
                let buttonClass = 'bg-white/5 hover:bg-white/10 border-white/20'
                
                if (showResult) {
                  if (key === currentQuestion.correct_answer) {
                    buttonClass = 'bg-green-500/30 border-green-500'
                  } else if (key === selectedAnswer && !isCorrect) {
                    buttonClass = 'bg-red-500/30 border-red-500'
                  }
                } else if (selectedAnswer === key) {
                  buttonClass = 'bg-indigo-500/30 border-indigo-500'
                }

                return (
                  <button
                    key={key}
                    onClick={() => handleAnswer(key)}
                    disabled={showResult}
                    className={`w-full p-4 rounded-xl border-2 text-left transition-all ${buttonClass} ${
                      showResult ? 'cursor-default' : 'cursor-pointer'
                    }`}
                  >
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-white/10 text-white font-bold mr-3">
                      {key}
                    </span>
                    <span className="text-white">
                      <MathRenderer text={value} />
                    </span>
                  </button>
                )
              })}
            </div>

            {/* Sonuç ve Açıklama */}
            <AnimatePresence>
              {showResult && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-6"
                >
                  {/* Sonuç Mesajı */}
                  <div className={`flex items-center justify-between p-4 rounded-xl ${
                    isCorrect ? 'bg-green-500/20' : 'bg-red-500/20'
                  }`}>
                    <div className="flex items-center gap-3">
                      {isCorrect ? (
                        <>
                          <CheckCircle className="h-6 w-6 text-green-400" />
                          <span className="text-green-400 font-medium">Doğru Cevap!</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="h-6 w-6 text-red-400" />
                          <span className="text-red-400 font-medium">
                            Yanlış! Doğru: {currentQuestion.correct_answer}
                          </span>
                        </>
                      )}
                    </div>
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className={`flex items-center gap-1 px-3 py-1 rounded-full font-bold ${
                        isCorrect ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                      }`}
                    >
                      <Trophy className="h-4 w-4" />
                      {isCorrect ? '+2' : '-1'} puan
                    </motion.div>
                  </div>

                  {/* Açıklama */}
                  {currentQuestion.explanation && (
                    <div className="mt-4 p-4 rounded-xl bg-white/5">
                      <h4 className="text-indigo-300 font-medium mb-2 flex items-center gap-2">
                        <Sparkles className="h-4 w-4" />
                        Açıklama
                      </h4>
                      <p className="text-white/80">
                        <MathRenderer text={currentQuestion.explanation} />
                      </p>
                    </div>
                  )}

                  {/* Sonraki Soru Butonu */}
                  <button
                    onClick={() => loadNextQuestion()}
                    className="w-full mt-6 py-4 bg-indigo-500 hover:bg-indigo-600 text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
                  >
                    Sonraki Soru
                    <ArrowRight className="h-5 w-5" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    )
  }

  // Konu Seçim Modu
  if (viewMode === 'topics' && selectedSubject) {
    const colorClass = subjectColorMap[selectedSubject.subject.code] || { bg: 'from-gray-500 to-gray-600', border: 'border-gray-300', text: 'text-gray-600' }

    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6">
        <div className="max-w-4xl mx-auto">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm mb-6">
            <button onClick={goHome} className="text-gray-500 hover:text-indigo-500 flex items-center gap-1">
              <Home className="h-4 w-4" />
              Ana Sayfa
            </button>
            <ChevronRight className="h-4 w-4 text-gray-400" />
            <span className={`font-medium ${colorClass.text}`}>
              {selectedSubject.subject.icon} {selectedSubject.subject.name}
            </span>
          </div>

          {/* Ders Başlığı */}
          <div className={`bg-gradient-to-r ${colorClass.bg} rounded-2xl p-6 text-white mb-6`}>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-4xl mb-2">{selectedSubject.subject.icon}</div>
                <h1 className="text-2xl font-bold">{selectedSubject.subject.name}</h1>
                <p className="text-white/70 mt-1">{selectedGrade}. Sınıf Konuları</p>
              </div>
              <button
                onClick={() => startPractice()}
                className="px-6 py-3 bg-white/20 hover:bg-white/30 rounded-xl transition-all flex items-center gap-2"
              >
                <Play className="h-5 w-5" />
                Tümünü Çöz
              </button>
            </div>
          </div>

          {/* Zorluk Filtresi */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 mb-6">
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">Zorluk Seviyesi</h3>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedDifficulty('')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  !selectedDifficulty
                    ? 'bg-indigo-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200'
                }`}
              >
                Tümü
              </button>
              {Object.entries(difficultyConfig).map(([key, { label, emoji }]) => (
                <button
                  key={key}
                  onClick={() => setSelectedDifficulty(key)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1 ${
                    selectedDifficulty === key
                      ? 'bg-indigo-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200'
                  }`}
                >
                  {emoji} {label}
                </button>
              ))}
            </div>
          </div>

          {/* Konular (Accordion) */}
          {topics.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-12 text-center">
              <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-gray-600 dark:text-gray-400">
                Bu ders için henüz konu eklenmemiş
              </h3>
            </div>
          ) : (
            <div className="space-y-3">
              {Object.entries(groupedTopics).map(([mainTopic, topicList]) => (
                <div key={mainTopic} className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm">
                  {/* Ana Konu Başlığı */}
                  <button
                    onClick={() => toggleMainTopic(mainTopic)}
                    className="w-full px-5 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
                  >
                    <div className="flex items-center gap-3 flex-wrap">
                      <Layers className={`h-5 w-5 ${colorClass.text}`} />
                      <span className="font-medium text-gray-900 dark:text-white">{mainTopic}</span>
                      <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-gray-500">
                        {topicList.length} kazanım
                      </span>
                      <span className="text-xs px-2 py-1 bg-indigo-100 dark:bg-indigo-900/30 rounded-full text-indigo-600 dark:text-indigo-400">
                        {topicList.reduce((sum, t) => sum + getTopicQuestionCount(t.id), 0)} soru
                      </span>
                    </div>
                    {expandedMainTopics.includes(mainTopic) ? (
                      <ChevronUp className="h-5 w-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-gray-400" />
                    )}
                  </button>

                  {/* Alt Konular */}
                  <AnimatePresence>
                    {expandedMainTopics.includes(mainTopic) && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="border-t border-gray-100 dark:border-gray-700">
                          {topicList.map((topic, idx) => {
                            const topicQCount = getTopicQuestionCount(topic.id)
                            return (
                              <button
                                key={topic.id}
                                onClick={() => startPractice(topic)}
                                disabled={topicQCount === 0}
                                className={`w-full px-5 py-3 flex items-center justify-between transition-all border-b border-gray-50 dark:border-gray-700 last:border-b-0 ${
                                  topicQCount > 0 
                                    ? 'hover:bg-indigo-50 dark:hover:bg-indigo-900/20 cursor-pointer' 
                                    : 'opacity-50 cursor-not-allowed'
                                }`}
                              >
                                <div className="flex items-start gap-3 text-left flex-1">
                                  <span className="text-gray-400 text-sm mt-0.5">{idx + 1}.</span>
                                  <div className="flex-1">
                                    {topic.sub_topic && (
                                      <p className="text-xs text-gray-500 mb-0.5">{topic.sub_topic}</p>
                                    )}
                                    <p className="text-gray-700 dark:text-gray-300">
                                      {topic.learning_outcome || topic.main_topic}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-3">
                                  <span className={`text-xs px-2 py-1 rounded-full ${
                                    topicQCount > 0 
                                      ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' 
                                      : 'bg-gray-100 text-gray-400 dark:bg-gray-700'
                                  }`}>
                                    {topicQCount} soru
                                  </span>
                                  {topicQCount > 0 && (
                                    <Play className="h-4 w-4 text-indigo-500" />
                                  )}
                                </div>
                              </button>
                            )
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  // Ana Sayfa - Ders Seçimi
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl shadow-lg">
              <BookOpen className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Soru Bankası</h1>
              <p className="text-gray-600 dark:text-gray-400">
                {studentProfile?.grade ? `${studentProfile.grade}. Sınıf` : 'Sınıfını seç'} • Soru çöz, puan kazan!
              </p>
            </div>
          </div>
        </div>

        {/* Kullanıcı İstatistikleri */}
        {studentPoints && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
              <div className="flex items-center gap-2 text-yellow-500 mb-2">
                <Trophy className="h-5 w-5" />
                <span className="text-sm font-medium">Toplam Puan</span>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {studentPoints.total_points || 0}
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
              <div className="flex items-center gap-2 text-green-500 mb-2">
                <CheckCircle className="h-5 w-5" />
                <span className="text-sm font-medium">Doğru</span>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {studentPoints.total_correct || 0}
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
              <div className="flex items-center gap-2 text-red-500 mb-2">
                <XCircle className="h-5 w-5" />
                <span className="text-sm font-medium">Yanlış</span>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {studentPoints.total_wrong || 0}
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
              <div className="flex items-center gap-2 text-orange-500 mb-2">
                <Flame className="h-5 w-5" />
                <span className="text-sm font-medium">En Uzun Seri</span>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {studentPoints.max_streak || 0}
              </p>
            </div>
          </div>
        )}

        {/* 🚀 Hızlı Başla Butonu */}
        {totalGradeQuestions > 0 && (
          <motion.button
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={quickStart}
            className="w-full mb-6 p-4 bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 rounded-2xl shadow-lg hover:shadow-xl transition-all text-white"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
                  <Zap className="h-8 w-8 text-yellow-300" />
                </div>
                <div className="text-left">
                  <h3 className="text-xl font-bold flex items-center gap-2">
                    🚀 Hızlı Başla
                  </h3>
                  <p className="text-white/80 text-sm">
                    {totalGradeQuestions} sorudan rastgele çöz
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-xl">
                <Play className="h-5 w-5" />
                <span className="font-medium">Başla</span>
              </div>
            </div>
          </motion.button>
        )}

        {/* Sınıf Seçimi */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 mb-6 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <GraduationCap className="h-5 w-5 text-indigo-500" />
            <span className="font-medium text-gray-900 dark:text-white">Sınıf</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {[1,2,3,4,5,6,7,8,9,10,11,12].map(grade => (
              <button
                key={grade}
                onClick={() => {
                  setSelectedGrade(grade)
                  setSelectedSubject(null)
                }}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  selectedGrade === grade
                    ? 'bg-indigo-500 text-white shadow-md'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200'
                }`}
              >
                {grade}
                {grade === 8 && <span className="text-xs ml-1 opacity-75">(LGS)</span>}
                {grade === 12 && <span className="text-xs ml-1 opacity-75">(YKS)</span>}
              </button>
            ))}
          </div>
        </div>

        {/* Dersler - Kart Grid */}
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {selectedGrade}. Sınıf Dersleri
        </h2>

        {gradeSubjects.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {gradeSubjects.map(gs => {
              const subject = gs.subject
              const colorClass = subjectColorMap[subject.code] || { bg: 'from-gray-500 to-gray-600', border: 'border-gray-300', text: 'text-gray-600' }
              const questionCount = getSubjectQuestionCount(subject.id)

              return (
                <motion.div
                  key={gs.id}
                  whileHover={{ scale: 1.01 }}
                  className="relative overflow-hidden bg-white dark:bg-gray-800 rounded-2xl shadow-sm hover:shadow-lg transition-all border-2 border-transparent hover:border-indigo-200 dark:hover:border-indigo-800"
                >
                  {/* Gradient Accent */}
                  <div className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${colorClass.bg}`} />
                  
                  <div className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="text-4xl">{subject.icon || '📚'}</div>
                      {gs.is_exam_subject && (
                        <div className="flex items-center gap-1 text-xs text-amber-500 bg-amber-50 dark:bg-amber-900/30 px-2 py-1 rounded-full">
                          <Star className="h-3 w-3" />
                          Sınav
                        </div>
                      )}
                    </div>
                    
                    <h3 className="font-semibold text-gray-900 dark:text-white text-left mb-1">
                      {subject.name}
                    </h3>
                    
                    <div className="flex items-center gap-2 mb-4">
                      {countsLoading ? (
                        <span className="text-sm text-gray-400 animate-pulse">Yükleniyor...</span>
                      ) : (
                        <span className="text-sm text-gray-500 flex items-center gap-1">
                          <BookOpen className="h-3.5 w-3.5" />
                          {questionCount} soru
                        </span>
                      )}
                    </div>

                    {/* Aksiyon Butonları */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setSelectedSubject(gs)
                          setViewMode('topics')
                        }}
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                      >
                        <Layers className="h-4 w-4" />
                        Konular
                      </button>
                      {questionCount > 0 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            quickStartSubject(gs)
                          }}
                          className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium text-white bg-gradient-to-r ${colorClass.bg} rounded-lg hover:opacity-90 transition-opacity shadow-sm`}
                        >
                          <Play className="h-4 w-4" />
                          Başla
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl">
            <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">{selectedGrade}. sınıf için ders bulunamadı.</p>
          </div>
        )}
      </div>
    </div>
  )
}
