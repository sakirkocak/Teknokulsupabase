'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { 
  BookOpen, Play, CheckCircle, XCircle, 
  ChevronRight, Trophy, Target, Zap, Crown, Star,
  ArrowRight, Brain, GraduationCap,
  ChevronDown, Sparkles, ArrowLeft,
  Award, Flame, Flag, Keyboard, User, UserPlus, X, Medal, Gift
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import confetti from 'canvas-confetti'
import MathRenderer from '@/components/MathRenderer'
import { SingleXPFloat, MotivationFloat } from '@/components/XPFloatingAnimation'
import ComboIndicator from '@/components/ComboIndicator'
import { 
  XP_REWARDS, 
  COMBO_SETTINGS,
  getMotivationalMessage,
  getStreakMotivationContext,
  type MotivationContext
} from '@/lib/gamification'

interface Subject {
  id: string
  name: string
  code: string
  icon: string | null
  isExamSubject?: boolean
}

interface Topic {
  id: string
  subject_id: string
  grade: number
  main_topic: string
  sub_topic: string | null
  learning_outcome: string | null
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
  topic?: Topic & { subject?: Subject }
}

interface GuestSession {
  id: string
  nickname: string
  grade: number
  session_token: string
  total_questions: number
  total_correct: number
  total_wrong: number
  total_points: number
  current_streak: number
  max_streak: number
}

const difficultyConfig = {
  easy: { label: 'Kolay', color: 'bg-green-500', emoji: '🟢', icon: CheckCircle },
  medium: { label: 'Orta', color: 'bg-yellow-500', emoji: '🟡', icon: Star },
  hard: { label: 'Zor', color: 'bg-orange-500', emoji: '🟠', icon: Zap },
  legendary: { label: 'Efsane', color: 'bg-purple-500', emoji: '🔴', icon: Crown }
}

const subjectColorMap: Record<string, { bg: string; text: string }> = {
  'turkce': { bg: 'from-blue-500 to-blue-600', text: 'text-blue-600' },
  'matematik': { bg: 'from-red-500 to-red-600', text: 'text-red-600' },
  'fen_bilimleri': { bg: 'from-green-500 to-green-600', text: 'text-green-600' },
  'inkilap_tarihi': { bg: 'from-amber-500 to-amber-600', text: 'text-amber-600' },
  'din_kulturu': { bg: 'from-teal-500 to-teal-600', text: 'text-teal-600' },
  'ingilizce': { bg: 'from-purple-500 to-purple-600', text: 'text-purple-600' },
  'sosyal_bilgiler': { bg: 'from-orange-500 to-orange-600', text: 'text-orange-600' },
}

type ViewMode = 'setup' | 'practice'

export default function HizliCozPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()
  
  // View mode
  const [viewMode, setViewMode] = useState<ViewMode>('setup')
  
  // Setup state
  const [nickname, setNickname] = useState('')
  const [selectedGrade, setSelectedGrade] = useState<number>(8)
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null)
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [topics, setTopics] = useState<Topic[]>([])
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null)
  const [loading, setLoading] = useState(true)
  
  // Guest session
  const [guestSession, setGuestSession] = useState<GuestSession | null>(null)
  
  // Practice state
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null)
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)
  const [questionIndex, setQuestionIndex] = useState(0)
  const [sessionStats, setSessionStats] = useState({ correct: 0, wrong: 0 })
  const [earnedPoints, setEarnedPoints] = useState<number | null>(null)
  const [practiceLoading, setPracticeLoading] = useState(false)
  
  // Gamification
  const [sessionStreak, setSessionStreak] = useState(0)
  const [showXPFloat, setShowXPFloat] = useState(false)
  const [floatXPAmount, setFloatXPAmount] = useState(0)
  const [floatXPType, setFloatXPType] = useState<'correct' | 'wrong' | 'combo' | 'streak' | 'fast'>('correct')
  const [showMotivation, setShowMotivation] = useState(false)
  const [motivationMessage, setMotivationMessage] = useState({ text: '', emoji: '', color: '' })
  const [showComboBonus, setShowComboBonus] = useState(false)
  const [questionStartTime, setQuestionStartTime] = useState<number>(0)
  
  // Registration prompts
  const [showRegisterPrompt, setShowRegisterPrompt] = useState(false)
  const [promptType, setPromptType] = useState<'milestone' | 'streak' | 'session'>('milestone')
  const [showSessionSummary, setShowSessionSummary] = useState(false)
  
  // URL parametreleri - REF olarak tutulacak (state gecikmesi olmasın)
  const urlGradeRef = useRef<number | null>(null)
  const urlSubjectIdRef = useRef<string | null>(null)
  const [urlParamsProcessed, setUrlParamsProcessed] = useState(false)
  const [shouldAutoStart, setShouldAutoStart] = useState(false)
  const [subjectsLoaded, setSubjectsLoaded] = useState(false)
  const [autoStartSubjectId, setAutoStartSubjectId] = useState<string | null>(null)

  // 1. İlk yükleme - URL parametrelerini oku ve REF'lere kaydet
  useEffect(() => {
    const nicknameParam = searchParams.get('nickname')
    const sinifParam = searchParams.get('sinif')
    const dersIdParam = searchParams.get('dersId') // Subject ID
    const autostartParam = searchParams.get('autostart')
    
    // URL'den okunan değerleri REF'lere kaydet (anlık erişim için)
    if (sinifParam) {
      const grade = parseInt(sinifParam) || 8
      urlGradeRef.current = grade
      setSelectedGrade(grade)
    }
    if (dersIdParam) {
      urlSubjectIdRef.current = dersIdParam
      setAutoStartSubjectId(dersIdParam)
    }
    if (nicknameParam) setNickname(nicknameParam)
    if (autostartParam === 'true' && nicknameParam) {
      setShouldAutoStart(true)
    }
    
    setUrlParamsProcessed(true)
  }, []) // Sadece ilk mount'ta çalış

  // 2. Sınıf değiştiğinde dersleri yükle
  useEffect(() => {
    if (urlParamsProcessed) {
      loadGradeSubjects()
    }
  }, [selectedGrade, urlParamsProcessed])

  // 3. İlk yüklemede session kontrolü
  useEffect(() => {
    checkExistingSession()
  }, [])

  // 4. Autostart - her şey hazır olduğunda başlat
  useEffect(() => {
    if (!shouldAutoStart || !subjectsLoaded || !nickname || loading) return
    
    // URL'den gelen sınıf değerini kullan (REF'ten, state'ten değil!)
    const gradeToUse = urlGradeRef.current ?? selectedGrade
    const subjectIdToUse = urlSubjectIdRef.current
    
    // Ders ID'si varsa, subject'i bul
    let subjectToUse: Subject | null = null
    if (subjectIdToUse) {
      const matchingSubject = subjects.find(s => s.id === subjectIdToUse)
      if (matchingSubject) {
        console.log('Ders eşleşti:', matchingSubject.name)
        subjectToUse = matchingSubject
        setSelectedSubject(matchingSubject)
      } else {
        console.log('Ders bulunamadı, karışık devam ediliyor. ID:', subjectIdToUse)
      }
    }
    
    // Her şey hazır, başlat!
    console.log('Autostart tetikleniyor:', { nickname, gradeToUse, subject: subjectToUse?.name || 'Karışık' })
    setShouldAutoStart(false)
    
    // REF değerlerini temizle (bir kez kullanıldı)
    urlGradeRef.current = null
    urlSubjectIdRef.current = null
    setAutoStartSubjectId(null)
    
    // Direkt parametrelerle başlat (state'e güvenme!)
    startPracticeWithParams(gradeToUse, subjectToUse)
  }, [shouldAutoStart, subjectsLoaded, nickname, loading, subjects])
  
  // Load topics when subject/grade changes
  useEffect(() => {
    if (selectedSubject && selectedGrade) {
      loadTopics()
    }
  }, [selectedSubject, selectedGrade])

  const checkExistingSession = async () => {
    // Check localStorage for existing session
    const sessionToken = localStorage.getItem('guest_session_token')
    if (sessionToken) {
      const { data } = await supabase
        .from('guest_sessions')
        .select('*')
        .eq('session_token', sessionToken)
        .gt('expires_at', new Date().toISOString())
        .single()
      
      if (data) {
        setGuestSession(data)
        setNickname(data.nickname)
        setSelectedGrade(data.grade)
      }
    }
    setLoading(false)
  }

  const loadGradeSubjects = async () => {
    setSubjectsLoaded(false)
    
    // Autostart değilse ve sınıf değiştiyse ders seçimini sıfırla
    if (!shouldAutoStart) {
      setSelectedSubject(null)
    }
    setTopics([])
    
    // Sınıfa göre müfredattaki dersleri getir
    const { data } = await supabase
      .from('grade_subjects')
      .select(`
        id,
        grade_id,
        is_exam_subject,
        subject:subjects(id, name, code, icon)
      `)
      .eq('grade_id', selectedGrade)
      .order('is_exam_subject', { ascending: false })
    
    if (data) {
      // Subject verilerini düzleştir
      const formattedSubjects = data
        .filter((gs: any) => gs.subject) // null olanları filtrele
        .map((gs: any) => ({
          id: gs.subject.id,
          name: gs.subject.name,
          code: gs.subject.code,
          icon: gs.subject.icon,
          isExamSubject: gs.is_exam_subject
        }))
      setSubjects(formattedSubjects)
    } else {
      setSubjects([])
    }
    
    setSubjectsLoaded(true)
  }

  const loadTopics = async () => {
    if (!selectedSubject) return
    
    const { data } = await supabase
      .from('topics')
      .select('*')
      .eq('subject_id', selectedSubject.id)
      .eq('grade', selectedGrade)
      .eq('is_active', true)
      .order('main_topic')
    
    if (data) setTopics(data)
  }

  // Create or update guest session
  const startGuestSession = async () => {
    if (!nickname.trim()) return
    
    let session = guestSession
    
    if (!session) {
      const { data, error } = await supabase
        .from('guest_sessions')
        .insert({
          nickname: nickname.trim(),
          grade: selectedGrade
        })
        .select()
        .single()
      
      if (error) {
        console.error('Session creation error:', error)
        return
      }
      
      session = data
      setGuestSession(data)
      localStorage.setItem('guest_session_token', data.session_token)
    }
    
    return session
  }

  // Start practice with explicit parameters (for autostart from URL)
  const startPracticeWithParams = async (grade: number, subject: Subject | null) => {
    if (!nickname.trim()) {
      alert('Lütfen bir takma ad girin')
      return
    }
    
    // Grade'i güncelle
    setSelectedGrade(grade)
    if (subject) setSelectedSubject(subject)
    
    await startGuestSession()
    
    setViewMode('practice')
    setQuestionIndex(0)
    setSessionStats({ correct: 0, wrong: 0 })
    setSessionStreak(0)
    setQuestionStartTime(Date.now())
    setPracticeLoading(true)
    // Parametreleri direkt geç (state'e güvenme!)
    await loadNextQuestion(grade, subject)
    setPracticeLoading(false)
  }

  // Start practice from UI (uses current state)
  const startPractice = async () => {
    if (!nickname.trim()) {
      alert('Lütfen bir takma ad girin')
      return
    }
    
    await startGuestSession()
    
    setViewMode('practice')
    setQuestionIndex(0)
    setSessionStats({ correct: 0, wrong: 0 })
    setSessionStreak(0)
    setQuestionStartTime(Date.now())
    setPracticeLoading(true)
    // UI'dan başlatıldığında state değerlerini kullan
    await loadNextQuestion(selectedGrade, selectedSubject)
    setPracticeLoading(false)
  }

  // Load next question - grade ve subject parametreleri opsiyonel (sonraki sorular için state'ten alınır)
  const loadNextQuestion = async (gradeParam?: number, subjectParam?: Subject | null) => {
    setSelectedAnswer(null)
    setShowResult(false)
    setEarnedPoints(null)
    setQuestionStartTime(Date.now())

    // Parametre verilmişse onu kullan, yoksa state'ten al
    const currentGrade = gradeParam ?? selectedGrade
    const currentSubject = subjectParam !== undefined ? subjectParam : selectedSubject

    console.log('Soru yükleniyor - Sınıf:', currentGrade, 'Ders:', currentSubject?.name || 'Karışık')

    // Önce uygun topic'leri bul
    let topicQuery = supabase
      .from('topics')
      .select('id')
      .eq('grade', currentGrade)
      .eq('is_active', true)

    // Ders seçiliyse sadece o dersin topic'lerini al
    if (currentSubject) {
      topicQuery = topicQuery.eq('subject_id', currentSubject.id)
    }

    const { data: relevantTopics } = await topicQuery

    console.log('Bulunan topic sayısı:', relevantTopics?.length || 0)

    if (!relevantTopics || relevantTopics.length === 0) {
      setCurrentQuestion(null)
      return
    }

    const topicIds = relevantTopics.map(t => t.id)

    // Soruları getir
    const { data } = await supabase
      .from('questions')
      .select('*, topic:topics(*, subject:subjects(*))')
      .eq('is_active', true)
      .in('topic_id', topicIds)

    console.log('Bulunan soru sayısı:', data?.length || 0)

    if (data && data.length > 0) {
      const randomIndex = Math.floor(Math.random() * data.length)
      setCurrentQuestion(data[randomIndex] as any)
      setQuestionIndex(prev => prev + 1)
    } else {
      setCurrentQuestion(null)
    }
  }

  // Confetti effect
  const triggerConfetti = useCallback((type: 'small' | 'medium' | 'celebration') => {
    const config = {
      small: { particleCount: 30, spread: 50, origin: { y: 0.6 } },
      medium: { particleCount: 60, spread: 80, origin: { y: 0.5 } },
      celebration: { particleCount: 150, spread: 360, origin: { y: 0.5 }, colors: ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1'] }
    }
    confetti({ ...config[type], gravity: 1.2, ticks: 200 })
  }, [])

  // Show motivation message
  const showMotivationMessage = useCallback((context: MotivationContext) => {
    const msg = getMotivationalMessage(context)
    setMotivationMessage(msg)
    setShowMotivation(true)
    setTimeout(() => setShowMotivation(false), 2500)
  }, [])

  // Show XP animation
  const showXPAnimation = useCallback((amount: number, type: 'correct' | 'wrong' | 'combo' | 'streak' | 'fast') => {
    setFloatXPAmount(amount)
    setFloatXPType(type)
    setShowXPFloat(true)
    setTimeout(() => setShowXPFloat(false), 1500)
  }, [])

  // Handle answer
  const handleAnswer = async (answer: string) => {
    if (showResult || !currentQuestion) return

    setSelectedAnswer(answer)
    const correct = answer === currentQuestion.correct_answer
    setIsCorrect(correct)
    setShowResult(true)

    // Fast answer check
    const answerTime = (Date.now() - questionStartTime) / 1000
    const isFastAnswer = answerTime <= COMBO_SETTINGS.FAST_ANSWER_THRESHOLD

    // Calculate XP
    let baseXP = correct ? XP_REWARDS.CORRECT_ANSWER : XP_REWARDS.WRONG_ANSWER
    if (correct && isFastAnswer) baseXP += COMBO_SETTINGS.FAST_ANSWER_BONUS

    setEarnedPoints(baseXP)

    // Update streak
    const newSessionStreak = correct ? sessionStreak + 1 : 0
    const prevSessionStreak = sessionStreak
    setSessionStreak(newSessionStreak)

    setSessionStats(prev => ({
      correct: prev.correct + (correct ? 1 : 0),
      wrong: prev.wrong + (correct ? 0 : 1)
    }))

    // Combo bonus
    let comboBonus = 0
    if (correct && newSessionStreak > 0 && newSessionStreak % COMBO_SETTINGS.COMBO_THRESHOLD === 0) {
      comboBonus = COMBO_SETTINGS.COMBO_BONUS_XP
      setShowComboBonus(true)
      setTimeout(() => setShowComboBonus(false), 2000)
    }

    // XP animation
    if (correct) {
      showXPAnimation(baseXP + comboBonus, comboBonus > 0 ? 'combo' : (isFastAnswer ? 'fast' : 'correct'))
      triggerConfetti(newSessionStreak >= 10 ? 'medium' : 'small')
    } else {
      showXPAnimation(baseXP, 'wrong')
    }

    // Motivation messages
    const streakContext = getStreakMotivationContext(newSessionStreak)
    if (streakContext) {
      setTimeout(() => showMotivationMessage(streakContext), 300)
    } else if (!correct && prevSessionStreak >= 3) {
      setTimeout(() => showMotivationMessage('wrong_after_streak'), 300)
    }

    // Update guest session
    if (guestSession) {
      const subjectCode = currentQuestion.topic?.subject?.code || 'turkce'
      
      const updateData: any = {
        total_questions: guestSession.total_questions + 1,
        total_correct: guestSession.total_correct + (correct ? 1 : 0),
        total_wrong: guestSession.total_wrong + (correct ? 0 : 1),
        total_points: guestSession.total_points + baseXP + comboBonus,
        current_streak: newSessionStreak,
        max_streak: Math.max(newSessionStreak, guestSession.max_streak),
        last_activity_at: new Date().toISOString()
      }

      // Subject-specific points
      const subjectMap: Record<string, string> = {
        'matematik': 'matematik',
        'turkce': 'turkce',
        'fen_bilimleri': 'fen',
        'inkilap_tarihi': 'inkilap',
        'din_kulturu': 'din',
        'ingilizce': 'ingilizce'
      }

      const subjectKey = subjectMap[subjectCode]
      if (subjectKey) {
        updateData[`${subjectKey}_points`] = (guestSession as any)[`${subjectKey}_points`] + baseXP + comboBonus
        updateData[`${subjectKey}_correct`] = (guestSession as any)[`${subjectKey}_correct`] + (correct ? 1 : 0)
        updateData[`${subjectKey}_wrong`] = (guestSession as any)[`${subjectKey}_wrong`] + (correct ? 0 : 1)
      }

      await supabase
        .from('guest_sessions')
        .update(updateData)
        .eq('id', guestSession.id)

      setGuestSession({ ...guestSession, ...updateData })

      // Show registration prompts at milestones
      const totalQuestions = updateData.total_questions
      if (totalQuestions === 5 || totalQuestions === 15 || totalQuestions === 30) {
        setTimeout(() => {
          setPromptType('milestone')
          setShowRegisterPrompt(true)
        }, 1500)
      }

      // Show registration prompt for streaks
      if (newSessionStreak === 10 || newSessionStreak === 20) {
        setTimeout(() => {
          setPromptType('streak')
          setShowRegisterPrompt(true)
        }, 1500)
      }
    }
  }

  // End session
  const endSession = () => {
    setShowSessionSummary(true)
  }

  // Close session summary
  const closeSessionSummary = () => {
    setShowSessionSummary(false)
    setPromptType('session')
    setShowRegisterPrompt(true)
  }

  // Keyboard shortcuts
  useEffect(() => {
    if (viewMode !== 'practice') return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      
      const key = e.key.toUpperCase()
      
      if (['A', 'B', 'C', 'D', 'E'].includes(key) && !showResult && currentQuestion) {
        const options = Object.keys(currentQuestion.options)
        if (options.includes(key)) handleAnswer(key)
      }
      
      if (e.key === 'Enter' && showResult) loadNextQuestion()
      if (e.key === 'Escape') endSession()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [viewMode, showResult, currentQuestion])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-violet-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white/60">Yükleniyor...</p>
        </div>
      </div>
    )
  }

  // Practice Mode
  if (viewMode === 'practice') {
    if (practiceLoading) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-purple-950 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            <motion.div 
              animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              className="w-24 h-24 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-purple-500/30"
            >
              <Brain className="h-12 w-12 text-white" />
            </motion.div>
            <h2 className="text-2xl font-bold text-white mb-2">Sorular Hazırlanıyor</h2>
            <p className="text-white/60 mb-6">{nickname}, senin için sorular seçiliyor...</p>
            <div className="flex items-center justify-center gap-2">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  animate={{ y: [0, -10, 0], opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.2 }}
                  className="w-3 h-3 bg-purple-500 rounded-full"
                />
              ))}
            </div>
          </motion.div>
        </div>
      )
    }

    if (!currentQuestion) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-purple-950 flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
            <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <BookOpen className="h-10 w-10 text-white/60" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Soru Bulunamadı</h2>
            <p className="text-white/60 mb-6">Bu seçenekler için soru bulunmuyor.</p>
            <button
              onClick={() => setViewMode('setup')}
              className="px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-xl font-medium"
            >
              Farklı Seçenekler Dene
            </button>
          </motion.div>
        </div>
      )
    }

    const DiffIcon = difficultyConfig[currentQuestion.difficulty].icon

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-purple-950 p-4 md:p-6 relative overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
        </div>

        <div className="max-w-4xl mx-auto relative z-10">
          {/* Top Bar */}
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-4 mb-6 border border-white/10">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <button
                  onClick={endSession}
                  className="flex items-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-xl transition-all border border-red-500/30"
                >
                  <XCircle className="h-5 w-5" />
                  <span className="hidden sm:inline font-medium">Bitir</span>
                </button>

                <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-xl">
                  <User className="h-4 w-4 text-purple-400" />
                  <span className="text-white font-medium">{nickname}</span>
                </div>

                <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-xl">
                  <Target className="h-4 w-4 text-indigo-400" />
                  <span className="text-white font-medium">Soru {questionIndex}</span>
                </div>

                <div className={`${difficultyConfig[currentQuestion.difficulty].color} px-3 py-2 rounded-xl text-white text-sm flex items-center gap-2 shadow-lg`}>
                  <DiffIcon className="h-4 w-4" />
                  <span className="hidden sm:inline font-medium">{difficultyConfig[currentQuestion.difficulty].label}</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {sessionStreak >= 3 && (
                  <ComboIndicator streak={sessionStreak} showBonus={showComboBonus} size="md" />
                )}

                <div className="flex items-center gap-2 bg-white/10 px-3 py-2 rounded-xl">
                  <Trophy className="h-4 w-4 text-yellow-400" />
                  <span className="text-white font-bold">{guestSession?.total_points || 0}</span>
                  <span className="text-white/60 text-sm">XP</span>
                </div>

                <div className="hidden sm:flex items-center gap-4 bg-white/10 px-4 py-2 rounded-xl">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle className="h-4 w-4 text-green-400" />
                    <span className="text-green-400 font-bold">{sessionStats.correct}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <XCircle className="h-4 w-4 text-red-400" />
                    <span className="text-red-400 font-bold">{sessionStats.wrong}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Progress info */}
            <div className="flex items-center justify-between text-xs text-white/60">
              <span>🎯 {selectedGrade}. Sınıf • {currentQuestion.topic?.subject?.name || 'Karışık'}</span>
              <span className="flex items-center gap-1">
                <Flame className="h-3 w-3 text-orange-400" />
                En uzun seri: {guestSession?.max_streak || 0}
              </span>
            </div>
          </div>

          {/* Question Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 md:p-8 border border-white/20 shadow-2xl relative"
          >
            {/* Topic Info */}
            <div className="flex items-center gap-2 text-sm mb-4">
              <span className="text-2xl">{currentQuestion.topic?.subject?.icon || '📚'}</span>
              <span className="text-indigo-300 font-medium">{currentQuestion.topic?.subject?.name}</span>
              <ChevronRight className="h-4 w-4 text-white/40" />
              <span className="text-white/60">{currentQuestion.topic?.main_topic}</span>
            </div>

            {/* Question Text */}
            <div className="text-white text-lg md:text-xl mb-8 leading-relaxed font-medium">
              <MathRenderer text={currentQuestion.question_text} />
            </div>

            {/* Image */}
            {currentQuestion.question_image_url && (
              <div className="mb-8 rounded-xl overflow-hidden border border-white/10">
                <img src={currentQuestion.question_image_url} alt="Soru görseli" className="max-w-full" />
              </div>
            )}

            {/* Options */}
            <div className="space-y-3">
              {Object.entries(currentQuestion.options).map(([key, value]) => {
                if (!value) return null
                
                let buttonClass = 'bg-white/5 hover:bg-white/10 border-white/10 hover:border-white/30'
                let iconClass = 'bg-white/10 text-white'
                
                if (showResult) {
                  if (key === currentQuestion.correct_answer) {
                    buttonClass = 'bg-green-500/20 border-green-500/50 ring-2 ring-green-500/30'
                    iconClass = 'bg-green-500 text-white'
                  } else if (key === selectedAnswer && !isCorrect) {
                    buttonClass = 'bg-red-500/20 border-red-500/50 ring-2 ring-red-500/30'
                    iconClass = 'bg-red-500 text-white'
                  } else {
                    buttonClass = 'opacity-50'
                  }
                } else if (selectedAnswer === key) {
                  buttonClass = 'bg-indigo-500/20 border-indigo-500/50 ring-2 ring-indigo-500/30'
                  iconClass = 'bg-indigo-500 text-white'
                }

                return (
                  <motion.button
                    key={key}
                    onClick={() => handleAnswer(key)}
                    disabled={showResult}
                    whileHover={!showResult ? { scale: 1.01, x: 4 } : {}}
                    whileTap={!showResult ? { scale: 0.99 } : {}}
                    className={`w-full p-4 md:p-5 rounded-2xl border-2 text-left transition-all duration-200 ${buttonClass} ${showResult ? 'cursor-default' : 'cursor-pointer'}`}
                  >
                    <div className="flex items-start gap-4">
                      <span className={`flex-shrink-0 inline-flex items-center justify-center w-10 h-10 rounded-xl font-bold transition-colors ${iconClass}`}>
                        {key}
                      </span>
                      <span className="text-white text-base md:text-lg flex-1 pt-1">
                        <MathRenderer text={value} />
                      </span>
                    </div>
                  </motion.button>
                )
              })}
            </div>

            {/* Keyboard hint */}
            {!showResult && (
              <div className="mt-4 flex items-center justify-center gap-2 text-white/40 text-sm">
                <Keyboard className="h-4 w-4" />
                <span>A, B, C, D tuşlarıyla seç</span>
              </div>
            )}

            {/* XP Float */}
            <SingleXPFloat 
              amount={floatXPAmount} 
              type={floatXPType}
              show={showXPFloat} 
              className="top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
            />

            {/* Result */}
            <AnimatePresence>
              {showResult && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-8"
                >
                  <div className={`flex items-center justify-between p-5 rounded-2xl ${
                    isCorrect 
                      ? 'bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30' 
                      : 'bg-gradient-to-r from-red-500/20 to-rose-500/20 border border-red-500/30'
                  }`}>
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isCorrect ? 'bg-green-500' : 'bg-red-500'}`}>
                        {isCorrect ? <CheckCircle className="h-6 w-6 text-white" /> : <XCircle className="h-6 w-6 text-white" />}
                      </div>
                      <div>
                        <span className={`font-bold text-lg ${isCorrect ? 'text-green-400' : 'text-red-400'}`}>
                          {isCorrect ? 'Doğru Cevap!' : 'Yanlış Cevap'}
                        </span>
                        {!isCorrect && (
                          <p className="text-white/60 text-sm">
                            Doğru cevap: <span className="font-bold text-white">{currentQuestion.correct_answer}</span>
                          </p>
                        )}
                      </div>
                    </div>
                    <motion.div
                      initial={{ scale: 0, rotate: -10 }}
                      animate={{ scale: 1, rotate: 0 }}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-lg ${
                        isCorrect 
                          ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg shadow-green-500/30' 
                          : 'bg-gradient-to-r from-red-500 to-rose-500 text-white shadow-lg shadow-red-500/30'
                      }`}
                    >
                      <Zap className="h-5 w-5" />
                      {earnedPoints && earnedPoints > 0 ? `+${earnedPoints}` : earnedPoints} XP
                    </motion.div>
                  </div>

                  {currentQuestion.explanation && (
                    <div className="mt-4 p-5 rounded-2xl bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/20">
                      <h4 className="text-indigo-300 font-semibold mb-3 flex items-center gap-2">
                        <Sparkles className="h-5 w-5" />
                        Açıklama
                      </h4>
                      <p className="text-white/80 leading-relaxed">
                        <MathRenderer text={currentQuestion.explanation} />
                      </p>
                    </div>
                  )}

                  <div className="flex gap-3 mt-6">
                    <button
                      onClick={() => loadNextQuestion()}
                      className="flex-1 py-4 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/30"
                    >
                      Sonraki Soru
                      <ArrowRight className="h-5 w-5" />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Motivation Float */}
          <MotivationFloat 
            message={motivationMessage.text}
            emoji={motivationMessage.emoji}
            color={motivationMessage.color}
            show={showMotivation}
          />
        </div>

        {/* Session Summary Modal */}
        <AnimatePresence>
          {showSessionSummary && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
              onClick={closeSessionSummary}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full"
                onClick={e => e.stopPropagation()}
              >
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <Trophy className="h-8 w-8 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    Harika İş {nickname}! 🎉
                  </h2>
                  <p className="text-gray-500 dark:text-gray-400 mb-6">
                    Toplam {questionIndex} soru çözdün
                  </p>

                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4">
                      <div className="flex items-center justify-center gap-2 text-green-600 dark:text-green-400 mb-1">
                        <CheckCircle className="h-5 w-5" />
                        <span className="font-medium">Doğru</span>
                      </div>
                      <p className="text-3xl font-bold text-green-600 dark:text-green-400">{sessionStats.correct}</p>
                    </div>
                    <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4">
                      <div className="flex items-center justify-center gap-2 text-red-600 dark:text-red-400 mb-1">
                        <XCircle className="h-5 w-5" />
                        <span className="font-medium">Yanlış</span>
                      </div>
                      <p className="text-3xl font-bold text-red-600 dark:text-red-400">{sessionStats.wrong}</p>
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-xl p-4 mb-6">
                    <div className="flex items-center justify-center gap-2 text-yellow-600 dark:text-yellow-400 mb-1">
                      <Zap className="h-5 w-5" />
                      <span className="font-medium">Kazanılan XP</span>
                    </div>
                    <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">{guestSession?.total_points || 0}</p>
                  </div>

                  {questionIndex > 0 && (
                    <div className="mb-6">
                      <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400 mb-2">
                        <span>Başarı Oranı</span>
                        <span>{Math.round((sessionStats.correct / questionIndex) * 100)}%</span>
                      </div>
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-green-500 to-emerald-500 transition-all"
                          style={{ width: `${(sessionStats.correct / questionIndex) * 100}%` }}
                        />
                      </div>
                    </div>
                  )}

                  <button
                    onClick={closeSessionSummary}
                    className="w-full py-3 bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-medium rounded-xl transition-colors"
                  >
                    Devam Et
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Registration Prompt Modal */}
        <AnimatePresence>
          {showRegisterPrompt && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className="bg-gradient-to-br from-purple-600 to-indigo-700 rounded-3xl p-6 max-w-md w-full shadow-2xl border border-white/20"
              >
                <button 
                  onClick={() => setShowRegisterPrompt(false)}
                  className="absolute top-4 right-4 text-white/60 hover:text-white"
                >
                  <X className="h-6 w-6" />
                </button>

                <div className="text-center">
                  {/* Icon based on prompt type */}
                  <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    {promptType === 'streak' ? (
                      <Flame className="h-10 w-10 text-orange-400" />
                    ) : promptType === 'milestone' ? (
                      <Medal className="h-10 w-10 text-yellow-400" />
                    ) : (
                      <Trophy className="h-10 w-10 text-yellow-400" />
                    )}
                  </div>

                  <h2 className="text-2xl font-bold text-white mb-2">
                    {promptType === 'streak' 
                      ? `🔥 ${sessionStreak} Seri! Muhteşem!`
                      : promptType === 'milestone'
                        ? `🎯 ${guestSession?.total_questions} Soru Çözdün!`
                        : '🏆 Harika Performans!'
                    }
                  </h2>
                  
                  <p className="text-white/80 mb-6">
                    {promptType === 'streak' 
                      ? 'Bu seriyi kaybetmek istemezsin! Kayıt ol ve ilerlemeni kaydet.'
                      : promptType === 'milestone'
                        ? 'Puanların 24 saat sonra silinecek. Kayıt ol ve liderlik tablosunda görün!'
                        : 'Puanlarını kaybet! Ücretsiz kayıt ol, liderlik tablosunda yer al.'
                    }
                  </p>

                  {/* Benefits */}
                  <div className="bg-white/10 rounded-xl p-4 mb-6 text-left">
                    <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
                      <Gift className="h-5 w-5 text-yellow-400" />
                      Kayıt Olunca:
                    </h4>
                    <ul className="space-y-2 text-white/80 text-sm">
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-400" />
                        Puanların kalıcı olsun
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-400" />
                        Liderlik tablosunda görün
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-400" />
                        Rozetler ve başarılar kazan
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-400" />
                        AI öğretmenle çalış
                      </li>
                    </ul>
                  </div>

                  {/* Current stats */}
                  <div className="flex justify-center gap-4 mb-6">
                    <div className="text-center">
                      <p className="text-3xl font-bold text-yellow-400">{guestSession?.total_points || 0}</p>
                      <p className="text-white/60 text-sm">XP</p>
                    </div>
                    <div className="text-center">
                      <p className="text-3xl font-bold text-green-400">{guestSession?.total_correct || 0}</p>
                      <p className="text-white/60 text-sm">Doğru</p>
                    </div>
                    <div className="text-center">
                      <p className="text-3xl font-bold text-orange-400">{guestSession?.max_streak || 0}</p>
                      <p className="text-white/60 text-sm">En Uzun Seri</p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowRegisterPrompt(false)}
                      className="flex-1 py-3 bg-white/10 hover:bg-white/20 text-white font-medium rounded-xl transition-colors"
                    >
                      Sonra
                    </button>
                    <Link
                      href={`/kayit?nickname=${encodeURIComponent(nickname)}&grade=${selectedGrade}`}
                      className="flex-1 py-3 bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg"
                    >
                      <UserPlus className="h-5 w-5" />
                      Ücretsiz Kayıt
                    </Link>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    )
  }

  // Setup Mode
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-violet-900 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-violet-500/10 rounded-full blur-3xl" />
      </div>

      {/* Navbar */}
      <nav className="relative z-20 p-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-white">
              Tekn<span className="text-yellow-400">okul</span>
            </span>
          </Link>
          <Link 
            href="/kayit" 
            className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors border border-white/20"
          >
            <UserPlus className="w-5 h-5" />
            <span className="hidden sm:inline">Kayıt Ol</span>
          </Link>
        </div>
      </nav>

      <div className="relative z-10 max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-2xl shadow-orange-500/30"
          >
            <Zap className="w-10 h-10 text-white" />
          </motion.div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
            Hemen Soru Çöz! 🚀
          </h1>
          <p className="text-white/70 text-lg">
            Kayıt olmadan, ücretsiz, sınırsız soru çöz
          </p>
        </div>

        {/* Setup Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 sm:p-8 border border-white/20 shadow-2xl"
        >
          {/* Nickname */}
          <div className="mb-6">
            <label className="block text-white/80 font-medium mb-2">
              Takma Adın
            </label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/40" />
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="Örn: Kahraman123"
                maxLength={20}
                className="w-full pl-12 pr-4 py-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <p className="text-white/50 text-sm mt-2">
              Liderlik tablosunda bu isimle görüneceksin
            </p>
          </div>

          {/* Grade Selection */}
          <div className="mb-6">
            <label className="block text-white/80 font-medium mb-2">
              Sınıfın
            </label>
            <div className="relative">
              <GraduationCap className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/40" />
              <select
                value={selectedGrade}
                onChange={(e) => setSelectedGrade(Number(e.target.value))}
                className="w-full pl-12 pr-10 py-4 bg-white/10 border border-white/20 rounded-xl text-white appearance-none focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent cursor-pointer"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(grade => (
                  <option key={grade} value={grade} className="bg-gray-800 text-white">
                    {grade}. Sınıf
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/40 pointer-events-none" />
            </div>
          </div>

          {/* Subject Selection (Optional) */}
          <div className="mb-6">
            <label className="block text-white/80 font-medium mb-2">
              Ders <span className="text-white/40">(opsiyonel)</span>
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              <button
                onClick={() => setSelectedSubject(null)}
                className={`p-3 rounded-xl text-center transition-all border ${
                  !selectedSubject
                    ? 'bg-purple-500 border-purple-400 text-white'
                    : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
                }`}
              >
                <Sparkles className="h-5 w-5 mx-auto mb-1" />
                <span className="text-xs">Karışık</span>
              </button>
              {subjects.map(subject => (
                <button
                  key={subject.id}
                  onClick={() => setSelectedSubject(subject)}
                  className={`p-3 rounded-xl text-center transition-all border relative ${
                    selectedSubject?.id === subject.id
                      ? 'bg-purple-500 border-purple-400 text-white'
                      : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
                  }`}
                >
                  {subject.isExamSubject && (
                    <span className="absolute -top-1 -right-1 text-[10px] bg-yellow-500 text-white px-1 rounded">
                      ⭐
                    </span>
                  )}
                  <span className="text-lg block mb-1">{subject.icon || '📚'}</span>
                  <span className="text-xs truncate block">{subject.name}</span>
                </button>
              ))}
            </div>
            {subjects.length === 0 && (
              <p className="text-white/40 text-sm mt-2 text-center">
                Bu sınıf için ders bulunamadı
              </p>
            )}
          </div>

          {/* Start Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={startPractice}
            disabled={!nickname.trim()}
            className="w-full py-4 bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white font-bold text-lg rounded-xl transition-all shadow-lg shadow-orange-500/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
          >
            <Play className="h-6 w-6" />
            Soru Çözmeye Başla!
          </motion.button>

          {/* Info */}
          <div className="mt-6 p-4 bg-white/5 rounded-xl border border-white/10">
            <h4 className="text-white/80 font-medium mb-2 flex items-center gap-2">
              <Info className="h-4 w-4" />
              Bilgilendirme
            </h4>
            <ul className="text-white/60 text-sm space-y-1">
              <li>• Puanların 24 saat saklanır</li>
              <li>• Liderlik tablosuna girmek için kayıt ol</li>
              <li>• Kayıt ol, puanların kalıcı olsun!</li>
            </ul>
          </div>
        </motion.div>

        {/* Stats preview if session exists */}
        {guestSession && guestSession.total_questions > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-6 bg-white/10 backdrop-blur-xl rounded-2xl p-4 border border-white/20"
          >
            <h3 className="text-white font-medium mb-3 flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-400" />
              Devam Eden Oturum
            </h3>
            <div className="flex justify-between">
              <div className="text-center">
                <p className="text-2xl font-bold text-yellow-400">{guestSession.total_points}</p>
                <p className="text-white/60 text-xs">XP</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-400">{guestSession.total_correct}</p>
                <p className="text-white/60 text-xs">Doğru</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-red-400">{guestSession.total_wrong}</p>
                <p className="text-white/60 text-xs">Yanlış</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-orange-400">{guestSession.max_streak}</p>
                <p className="text-white/60 text-xs">Max Seri</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* CTA for registration */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-8 text-center"
        >
          <p className="text-white/60 mb-3">Puanların kalıcı olsun mu?</p>
          <Link
            href="/kayit"
            className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors border border-white/20"
          >
            <UserPlus className="h-5 w-5" />
            Ücretsiz Kayıt Ol
            <ArrowRight className="h-4 w-4" />
          </Link>
        </motion.div>
      </div>
    </div>
  )
}

// Info icon component
function Info({ className }: { className?: string }) {
  return (
    <svg 
      className={className} 
      fill="none" 
      viewBox="0 0 24 24" 
      stroke="currentColor"
    >
      <path 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        strokeWidth={2} 
        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
      />
    </svg>
  )
}

