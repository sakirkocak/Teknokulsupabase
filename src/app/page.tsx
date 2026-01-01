'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import Link from 'next/link'

// Hydration-safe number formatter (sunucu ve istemci aynı sonuç verir)
const formatNumber = (num: number): string => {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { getInitials } from '@/lib/utils'
import { testimonials, activityMessages, universities, demoCoaches } from '@/lib/demoData'
// ⚡ ŞIMŞEK HIZ - Doğrudan Typesense'e bağlan!
import { getStatsFast, isTypesenseEnabled, getQuestionCountsByGradeFast } from '@/lib/typesense/browser-client'
import { MagicSearchHero } from '@/components/magic-search'
import { 
  GraduationCap, 
  Users, 
  Brain, 
  TrendingUp, 
  Star, 
  CheckCircle,
  Check,
  ArrowRight,
  Sparkles,
  Clock,
  Play,
  ChevronRight,
  Menu,
  X,
  Quote,
  Zap,
  Target,
  UserPlus,
  FileText,
  Trophy,
  Flame,
  Medal,
  BarChart3,
  Rocket,
  Calculator,
  BookOpen,
  Microscope,
  Globe,
  Palette,
  Music,
  Heart,
  ChevronDown,
  Bot,
  Camera,
  Flag,
  Languages,
  Monitor,
  Wrench,
  Dumbbell,
  PieChart,
  Award,
  User,
  Calendar,
  Swords
} from 'lucide-react'

// Yeni Features Array
const features = [
  {
    icon: Target,
    title: 'Binlerce Soru',
    description: '1-12. sınıf MEB müfredatına uygun, zorluk seviyelerine göre ayrılmış binlerce soru.',
    color: 'text-orange-500',
    bg: 'bg-gradient-to-br from-orange-50 to-amber-50',
    stat: '10,000+',
    statLabel: 'soru'
  },
  {
    icon: Trophy,
    title: 'Liderlik Yarışı',
    description: 'Sınıf, okul, ilçe, il ve Türkiye genelinde arkadaşlarınla yarış.',
    color: 'text-purple-500',
    bg: 'bg-gradient-to-br from-purple-50 to-indigo-50',
    stat: '500+',
    statLabel: 'yarışmacı'
  },
  {
    icon: Flame,
    title: 'Günlük Seri',
    description: 'Her gün soru çöz, serini koru, bonus XP ve rozetler kazan.',
    color: 'text-red-500',
    bg: 'bg-gradient-to-br from-red-50 to-orange-50',
    stat: '30+',
    statLabel: 'rozet'
  },
  {
    icon: Brain,
    title: 'AI Öğretmen',
    description: 'Yapay zeka eksiklerini tespit eder, konu anlatır, soru çözer.',
    color: 'text-blue-500',
    bg: 'bg-gradient-to-br from-blue-50 to-cyan-50',
    stat: '7/24',
    statLabel: 'destek'
  },
  {
    icon: Users,
    title: 'Kişisel Koç',
    description: 'Deneyimli eğitim koçlarıyla birebir çalış, hedeflerine ulaş.',
    color: 'text-green-500',
    bg: 'bg-gradient-to-br from-green-50 to-emerald-50',
    stat: '50+',
    statLabel: 'koç'
  },
  {
    icon: BarChart3,
    title: 'Detaylı Analiz',
    description: 'Performansını takip et, güçlü ve zayıf yönlerini keşfet.',
    color: 'text-teal-500',
    bg: 'bg-gradient-to-br from-teal-50 to-cyan-50',
    stat: '%100',
    statLabel: 'şeffaflık'
  },
]

// Ders stilleri - code'a göre ikon ve renk mapping
const subjectStyles: Record<string, { icon: any, color: string, bgLight: string }> = {
  'matematik': { icon: Calculator, color: 'from-blue-500 to-indigo-600', bgLight: 'bg-blue-50' },
  'turkce': { icon: BookOpen, color: 'from-red-500 to-pink-600', bgLight: 'bg-red-50' },
  'fen_bilimleri': { icon: Microscope, color: 'from-green-500 to-emerald-600', bgLight: 'bg-green-50' },
  'sosyal_bilgiler': { icon: Globe, color: 'from-amber-500 to-orange-600', bgLight: 'bg-amber-50' },
  'hayat_bilgisi': { icon: Heart, color: 'from-pink-500 to-rose-600', bgLight: 'bg-pink-50' },
  'inkilap_tarihi': { icon: Flag, color: 'from-red-600 to-orange-600', bgLight: 'bg-red-50' },
  'ingilizce': { icon: Languages, color: 'from-purple-500 to-violet-600', bgLight: 'bg-purple-50' },
  'din_kulturu': { icon: BookOpen, color: 'from-teal-500 to-cyan-600', bgLight: 'bg-teal-50' },
  'bilisim_teknolojileri': { icon: Monitor, color: 'from-cyan-500 to-blue-600', bgLight: 'bg-cyan-50' },
  'teknoloji_tasarim': { icon: Wrench, color: 'from-gray-500 to-slate-600', bgLight: 'bg-gray-50' },
  'gorsel_sanatlar': { icon: Palette, color: 'from-pink-500 to-fuchsia-600', bgLight: 'bg-pink-50' },
  'muzik': { icon: Music, color: 'from-violet-500 to-purple-600', bgLight: 'bg-violet-50' },
  'beden_egitimi': { icon: Dumbbell, color: 'from-orange-500 to-red-600', bgLight: 'bg-orange-50' },
}

// Varsayılan stil (tanımlanmamış dersler için)
const defaultSubjectStyle = { icon: BookOpen, color: 'from-gray-500 to-slate-600', bgLight: 'bg-gray-50' }

// Rozet listesi
const badges = [
  { name: 'İlk Adım', icon: '🌟', description: 'İlk soruyu çöz', unlocked: true },
  { name: '7 Gün Seri', icon: '🔥', description: '7 gün üst üste çöz', unlocked: true },
  { name: 'Hız Şeytanı', icon: '⚡', description: '30sn altında 10 soru çöz', unlocked: false },
  { name: '100 Soru', icon: '📚', description: '100 soru çöz', unlocked: true },
  { name: '%90 Başarı', icon: '🎯', description: '%90 üzeri başarı oranı', unlocked: false },
  { name: 'İlk 10', icon: '🏆', description: 'Liderlikte ilk 10a gir', unlocked: false },
]

// Seviye sistemi
const levels = [
  { level: 1, name: 'Çaylak', xp: 0, icon: '🌱' },
  { level: 5, name: 'Öğrenci', xp: 500, icon: '📖' },
  { level: 10, name: 'Usta', xp: 1500, icon: '⭐' },
  { level: 20, name: 'Efsane', xp: 5000, icon: '🔥' },
  { level: 50, name: 'Dahi', xp: 20000, icon: '🧠' },
  { level: 100, name: 'GOAT', xp: 100000, icon: '🐐' },
]

// Activity Feed Component
function ActivityFeed() {
  const [mounted, setMounted] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    setMounted(true)
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % activityMessages.length)
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  const getIcon = (iconType: string) => {
    switch (iconType) {
      case 'match': return <Users className="w-4 h-4" />
      case 'score': return <TrendingUp className="w-4 h-4" />
      case 'task': return <CheckCircle className="w-4 h-4" />
      case 'register': return <UserPlus className="w-4 h-4" />
      case 'exam': return <FileText className="w-4 h-4" />
      case 'trophy': return <Trophy className="w-4 h-4" />
      case 'message': return <Sparkles className="w-4 h-4" />
      case 'plan': return <Target className="w-4 h-4" />
      default: return <Zap className="w-4 h-4" />
    }
  }

  if (!mounted) return null

  return (
    <div className="fixed bottom-6 left-6 z-40 hidden lg:block">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, y: 20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.9 }}
          transition={{ duration: 0.3 }}
          className="bg-white/95 backdrop-blur-lg rounded-2xl shadow-xl border border-surface-100 p-4 max-w-xs"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-primary-600 rounded-xl flex items-center justify-center text-white">
              {getIcon(activityMessages[currentIndex].icon)}
            </div>
            <div>
              <p className="text-sm text-surface-900">
                <span className="font-semibold">{activityMessages[currentIndex].name}</span>{' '}
                {activityMessages[currentIndex].action}
              </p>
              <p className="text-xs text-surface-400">{activityMessages[currentIndex].time}</p>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

// Floating Math Symbols Component
function FloatingSymbols() {
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    setMounted(true)
  }, [])
  
  if (!mounted) return null
  
  const symbols = [
    { char: '∑', x: 10, y: 20 },
    { char: '∫', x: 25, y: 40 },
    { char: 'π', x: 45, y: 15 },
    { char: '√', x: 60, y: 35 },
    { char: '∞', x: 75, y: 25 },
    { char: 'Δ', x: 85, y: 45 },
    { char: 'θ', x: 15, y: 60 },
    { char: 'α', x: 35, y: 75 },
    { char: 'β', x: 55, y: 55 },
    { char: '±', x: 70, y: 70 },
    { char: '÷', x: 90, y: 15 },
    { char: '×', x: 5, y: 85 },
  ]
  
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {symbols.map((symbol, i) => (
        <motion.div
          key={i}
          className="absolute text-4xl text-primary-200/30 font-bold select-none"
          style={{ left: `${symbol.x}%`, top: `${symbol.y}%` }}
          animate={{ 
            y: [0, -50, 100],
            opacity: [0, 0.5, 0],
            scale: [0.5, 1, 0.5],
            rotate: [0, 360]
          }}
          transition={{
            duration: 15 + (i % 5) * 2,
            repeat: Infinity,
            delay: i * 1.5,
            ease: 'linear'
          }}
        >
          {symbol.char}
        </motion.div>
      ))}
    </div>
  )
}

// Skeleton component for loading state
function StatSkeleton() {
  return (
    <span className="inline-block w-10 h-5 bg-surface-200 rounded animate-pulse" />
  )
}

// Live Stats Banner Component
function LiveStatsBanner() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    todayQuestions: 0,
    activeStudents: 0,
    totalQuestions: 0
  })

  useEffect(() => {
    loadStats()
    
    // 🔄 Her 5 saniyede bir anlık güncelleme
    const interval = setInterval(loadStats, 5000)
    return () => clearInterval(interval)
  }, [])

  async function loadStats() {
    try {
      // ⚡ ŞIMŞEK HIZ - Doğrudan client-side Typesense (liderlik tablosu gibi)
      if (isTypesenseEnabled()) {
        try {
          const result = await getStatsFast()
          setStats({
            todayQuestions: result.todayQuestions || 0,
            activeStudents: result.activeStudents || 0,
            totalQuestions: result.totalQuestions || 0
          })
          console.log(`⚡ Stats (client-side): ${result.duration}ms, today: ${result.todayQuestions}, total: ${result.totalQuestions}`)
        } catch (typesenseError) {
          // Typesense hatası - API'ye fallback
          console.warn('Typesense hata, API fallback:', typesenseError)
          throw typesenseError
        }
      } else {
        // Typesense yoksa API route kullan (fallback)
        throw new Error('Typesense disabled')
      }
    } catch (error) {
      // Hata durumunda API route'a fallback
      try {
        const response = await fetch('/api/stats?t=' + Date.now()) // Cache bypass
        const result = await response.json()
        setStats({
          todayQuestions: result.todayQuestions || 0,
          activeStudents: result.activeStudents || 0,
          totalQuestions: result.totalQuestions || 0
        })
        console.log(`⚡ Stats (API fallback): ${result.duration}ms, today: ${result.todayQuestions}, total: ${result.totalQuestions}`)
      } catch (apiError) {
        console.error('Stats yüklenemedi:', apiError)
        // Mevcut değerleri koru, sıfırlama
      }
    }
    setLoading(false)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="flex flex-wrap justify-center gap-4 sm:gap-8 mt-8"
    >
      <div className="flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur rounded-full shadow-sm border border-surface-100">
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
        <span className="text-surface-600 text-sm">
          {loading ? (
            <StatSkeleton />
          ) : (
            <span className="font-bold text-surface-900">{formatNumber(stats.todayQuestions)}+</span>
          )} soru bugün çözüldü
        </span>
      </div>
      <div className="flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur rounded-full shadow-sm border border-surface-100">
        <Trophy className="w-4 h-4 text-yellow-500" />
        <span className="text-surface-600 text-sm">
          {loading ? (
            <StatSkeleton />
          ) : (
            <span className="font-bold text-surface-900">{formatNumber(stats.activeStudents)}+</span>
          )} öğrenci yarışıyor
        </span>
      </div>
      <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur rounded-full shadow-sm border border-surface-100">
        <BookOpen className="w-4 h-4 text-primary-500" />
        <span className="text-surface-600 text-sm">
          {loading ? (
            <StatSkeleton />
          ) : (
            <span className="font-bold text-surface-900">{formatNumber(stats.totalQuestions)}+</span>
          )} soru bankası
        </span>
      </div>
      <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-full shadow-lg">
        <Zap className="w-4 h-4" />
        <span className="text-sm font-medium">Sen de katıl!</span>
      </div>
    </motion.div>
  )
}

export default function HomePage() {
  const [coaches, setCoaches] = useState<any[]>([])
  const [loadingCoaches, setLoadingCoaches] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [testimonialIndex, setTestimonialIndex] = useState(0)
  const [topLeaders, setTopLeaders] = useState<any[]>([])
  const [selectedGrade, setSelectedGrade] = useState(8)
  const [subjectQuestionCounts, setSubjectQuestionCounts] = useState<Record<string, number>>({})
  const [subjectCountsLoading, setSubjectCountsLoading] = useState(false)
  const [leaderboardTab, setLeaderboardTab] = useState<'daily' | 'weekly' | 'monthly' | 'all'>('all')
  const [leaderboardLoading, setLeaderboardLoading] = useState(false)
  
  // Quick Start form state
  const [quickStartNickname, setQuickStartNickname] = useState('')
  const [quickStartSubject, setQuickStartSubject] = useState('')
  const [gradeSubjectsForQuickStart, setGradeSubjectsForQuickStart] = useState<{id: string, name: string, code: string, icon: string}[]>([])
  
  // Auth state
  const [user, setUser] = useState<any>(null)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [authLoading, setAuthLoading] = useState(true)
  
  const supabase = createClient()

  // Auth durumunu kontrol et
  useEffect(() => {
    checkAuth()
    
    // Auth değişikliklerini dinle
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null)
      if (session?.user) {
        loadUserProfile(session.user.id)
      } else {
        setUserProfile(null)
        setAuthLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function checkAuth() {
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)
    if (user) {
      await loadUserProfile(user.id)
    } else {
      setAuthLoading(false)
    }
  }

  async function loadUserProfile(userId: string) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    
    setUserProfile(profile)
    setAuthLoading(false)
  }

  useEffect(() => {
    loadFeaturedCoaches()
    loadTopLeaders()
    loadGradeSubjectsForQuickStart()
  }, [selectedGrade])

  // Leaderboard tab değiştiğinde yeniden yükle
  useEffect(() => {
    loadTopLeaders()
  }, [leaderboardTab])

  // Load grade subjects for quick start dropdown - ve soru sayılarını da yükle
  async function loadGradeSubjectsForQuickStart() {
    const { data } = await supabase
      .from('grade_subjects')
      .select(`
        id,
        is_exam_subject,
        subject:subjects(id, name, code, icon)
      `)
      .eq('grade_id', selectedGrade)
      .order('is_exam_subject', { ascending: false })
    
    if (data) {
      const subjects = data
        .filter((gs: any) => gs.subject)
        .map((gs: any) => ({
          id: gs.subject.id,
          name: gs.subject.name,
          code: gs.subject.code,
          icon: gs.subject.icon || '📚'
        }))
      setGradeSubjectsForQuickStart(subjects)
      
      // Dersler yüklendikten sonra soru sayılarını çek
      loadSubjectQuestionCounts(subjects)
    } else {
      setGradeSubjectsForQuickStart([])
      setSubjectQuestionCounts({})
    }
  }

  // Handle quick start button click
  function handleQuickStart() {
    if (!quickStartNickname.trim()) return
    
    const params = new URLSearchParams()
    params.set('nickname', quickStartNickname.trim())
    params.set('sinif', selectedGrade.toString())
    params.set('autostart', 'true') // Direkt soru çözmeye başla
    if (quickStartSubject) {
      params.set('dersId', quickStartSubject) // Subject ID gönder
    }
    
    window.location.href = `/hizli-coz?${params.toString()}`
  }

  // Soru sayılarını yükle - ⚡ TYPESENSE ile tek sorgu!
  async function loadSubjectQuestionCounts(subjectsToCount: {id: string, name: string}[]) {
    if (!subjectsToCount || subjectsToCount.length === 0) {
      setSubjectQuestionCounts({})
      return
    }

    setSubjectCountsLoading(true)
    
    try {
      // ⚡ Typesense ile tek sorguda tüm sınıfın soru sayılarını al
      if (isTypesenseEnabled()) {
        const { bySubject, duration } = await getQuestionCountsByGradeFast(selectedGrade)
        console.log(`⚡ Subject counts from Typesense: ${duration}ms`)
        
        // Ders adı bazlı map oluştur (Typesense subject_name ile döner)
        const counts: Record<string, number> = {}
        subjectsToCount.forEach(subject => {
          // Hem ID hem isim bazlı ekle
          const count = bySubject[subject.name] || 0
          counts[subject.id] = count
          counts[subject.name] = count
        })
        
        setSubjectQuestionCounts(counts)
      } else {
        // Fallback: Supabase ile paralel sorgular
        const countPromises = subjectsToCount.map(async (subject) => {
          const { count } = await supabase
            .from('questions')
            .select('id', { count: 'exact', head: true })
            .eq('topic.subject_id', subject.id)
            .eq('topic.grade', selectedGrade)
            .eq('is_active', true)
          
          return { id: subject.id, name: subject.name, count: count || 0 }
        })

        const results = await Promise.all(countPromises)
        
        const counts: Record<string, number> = {}
        results.forEach(r => {
          counts[r.id] = r.count
          counts[r.name] = r.count
        })
        
        setSubjectQuestionCounts(counts)
      }
    } catch (error) {
      console.error('Soru sayıları yüklenirken hata:', error)
    } finally {
      setSubjectCountsLoading(false)
    }
  }

  async function loadTopLeaders() {
    setLeaderboardLoading(true)
    
    try {
      let data: any[] | null = null
      let error: any = null

      // Dönem bazlı liderlik fonksiyonlarını kullan
      switch (leaderboardTab) {
        case 'daily':
          const dailyResult = await supabase.rpc('get_daily_leaderboard', { p_limit: 10 })
          data = dailyResult.data
          error = dailyResult.error
          break
        case 'weekly':
          const weeklyResult = await supabase.rpc('get_weekly_leaderboard', { p_limit: 10 })
          data = weeklyResult.data
          error = weeklyResult.error
          break
        case 'monthly':
          const monthlyResult = await supabase.rpc('get_monthly_leaderboard', { p_limit: 10 })
          data = monthlyResult.data
          error = monthlyResult.error
          break
        case 'all':
        default:
          const allResult = await supabase.rpc('get_alltime_leaderboard', { p_limit: 10 })
          data = allResult.data
          error = allResult.error
      }

      // Hata durumunda veya fonksiyon yoksa eski yönteme fallback
      if (error) {
        console.log('RPC fonksiyonu bulunamadı, fallback kullanılıyor:', error.message)
        
        // Eski yöntem - student_points tablosundan çek
        const { data: fallbackData } = await supabase
          .from('student_points')
          .select(`
            student_id,
            total_points,
            total_questions,
            total_correct,
            max_streak,
            student:student_profiles!student_points_student_id_fkey(
              user_id,
              grade,
              profile:profiles!student_profiles_user_id_fkey(full_name, avatar_url)
            )
          `)
          .gt('total_questions', 0)
          .order('total_points', { ascending: false })
          .limit(10)
        
        if (fallbackData && fallbackData.length > 0) {
          setTopLeaders(fallbackData.map((item: any, index: number) => ({
            rank: index + 1,
            name: item.student?.profile?.full_name || 'Anonim',
            avatar: item.student?.profile?.avatar_url,
            points: item.total_points,
            questions: item.total_questions,
            correct: item.total_correct,
            streak: item.max_streak,
            grade: item.student?.grade
          })))
        } else {
          setTopLeaders([])
        }
        return
      }

      if (data && data.length > 0) {
        setTopLeaders(data.map((item: any) => ({
          rank: Number(item.rank),
          name: item.full_name || 'Anonim',
          avatar: item.avatar_url,
          points: Number(item.total_points),
          questions: Number(item.total_questions),
          correct: Number(item.total_questions), // Dönem bazlı correct sayısı yok, questions kullan
          streak: 0,
          grade: null
        })))
      } else {
        // Dönem bazlı veri yoksa bilgilendirme için boş bırak
        setTopLeaders([])
      }
    } catch (error) {
      console.error('Liderlik tablosu yüklenirken hata:', error)
      setTopLeaders([])
    } finally {
      setLeaderboardLoading(false)
    }
  }

  // Auto-rotate testimonials
  useEffect(() => {
    const interval = setInterval(() => {
      setTestimonialIndex((prev) => (prev + 1) % testimonials.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  async function loadFeaturedCoaches() {
    try {
      const { data: coachData, error } = await supabase
        .from('teacher_profiles')
        .select(`
          id,
          user_id,
          headline,
          bio,
          subjects,
          experience_years,
          hourly_rate,
          is_verified,
          profile:profiles!teacher_profiles_user_id_fkey(id, full_name, avatar_url)
        `)
        .eq('is_coach', true)
        .eq('is_listed', true)
        .limit(6)

      // Hata varsa veya veri yoksa demo veri kullan
      if (error || !coachData || coachData.length === 0) {
        if (error) console.log('Koçlar yüklenemedi, demo veri kullanılıyor')
        setCoaches(demoCoaches.slice(0, 6).map((coach, i) => ({
          id: `demo-${i}`,
          ...coach,
          profile: { full_name: coach.full_name, avatar_url: null },
          avgRating: coach.rating,
          reviewCount: coach.review_count,
          isDemo: true,
        })))
        setLoadingCoaches(false)
        return
      }

      // N+1 Query Optimizasyonu: Tüm koçların review'larını tek sorguda çek
      const coachIds = coachData.map(c => c.id)
      const { data: allReviews } = await supabase
        .from('reviews')
        .select('teacher_id, overall_rating')
        .in('teacher_id', coachIds)
        .eq('is_approved', true)

      // Review'ları koçlara göre grupla
      const reviewsByCoach = new Map<string, number[]>()
      allReviews?.forEach(review => {
        const ratings = reviewsByCoach.get(review.teacher_id) || []
        ratings.push(review.overall_rating)
        reviewsByCoach.set(review.teacher_id, ratings)
      })

      // Her koça review verilerini ekle
      const coachesWithReviews = coachData.map(coach => {
        const ratings = reviewsByCoach.get(coach.id) || []
        const reviewCount = ratings.length
        const avgRating = reviewCount > 0
          ? ratings.reduce((acc, r) => acc + r, 0) / reviewCount
          : 0
        return { ...coach, reviewCount, avgRating }
      })

      setCoaches(coachesWithReviews)
    } catch (err) {
      // Herhangi bir hata durumunda demo veri kullan
      console.log('Koçlar yüklenemedi, demo veri kullanılıyor:', err)
      setCoaches(demoCoaches.slice(0, 6).map((coach, i) => ({
        id: `demo-${i}`,
        ...coach,
        profile: { full_name: coach.full_name, avatar_url: null },
        avgRating: coach.rating,
        reviewCount: coach.review_count,
        isDemo: true,
      })))
    } finally {
      setLoadingCoaches(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-surface-50 to-white">
      {/* Activity Feed */}
      <ActivityFeed />

      {/* Mobile Floating Action Button */}
      <Link 
        href="/hizli-coz"
        className="fixed bottom-6 right-6 z-50 md:hidden flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-full shadow-lg shadow-orange-500/30 font-semibold"
      >
        <Target className="w-5 h-5" />
        Soru Çöz
      </Link>

      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-lg border-b border-surface-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold">
                Tekn<span className="text-primary-500">okul</span>
              </span>
            </Link>
            
            {/* Desktop Navigation - Sadeleştirilmiş */}
            <div className="hidden md:flex items-center gap-4">
              <Link href="/hizli-coz" className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-100 text-orange-600 rounded-full font-medium text-sm hover:bg-orange-200 transition-colors">
                <Target className="w-4 h-4" />
                Soru Çöz
              </Link>
              <Link href="/liderlik" className="text-surface-600 hover:text-primary-500 font-medium transition-colors flex items-center gap-1 text-sm">
                <Trophy className="w-4 h-4" />
                Liderlik
              </Link>
              <Link href="/koclar" className="text-surface-600 hover:text-primary-500 font-medium transition-colors flex items-center gap-1 text-sm">
                <Users className="w-4 h-4" />
                Koçlar
              </Link>
              <Link href="/rehberler" className="text-surface-600 hover:text-primary-500 font-medium transition-colors flex items-center gap-1 text-sm">
                <BookOpen className="w-4 h-4" />
                Rehberlik
              </Link>
              {/* Araçlar Dropdown */}
              <div className="relative group">
                <button className="text-surface-600 hover:text-primary-500 font-medium transition-colors flex items-center gap-1 text-sm">
                  <Sparkles className="w-4 h-4" />
                  Araçlar
                  <ChevronDown className="w-3 h-3 group-hover:rotate-180 transition-transform" />
                </button>
                <div className="absolute top-full left-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-surface-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 py-2">
                  <Link 
                    href="/sorular" 
                    className="flex items-center gap-3 px-4 py-2.5 text-surface-600 hover:bg-surface-50 hover:text-primary-500 transition-colors"
                  >
                    <FileText className="w-4 h-4" />
                    Sorular
                  </Link>
                  <Link 
                    href="/soru-bankasi/olustur" 
                    className="flex items-center gap-3 px-4 py-2.5 text-surface-600 hover:bg-surface-50 hover:text-primary-500 transition-colors"
                  >
                    <FileText className="w-4 h-4" />
                    <div>
                      <div className="font-medium">PDF Soru Bankası</div>
                      <div className="text-xs text-surface-400">Ücretsiz oluştur</div>
                    </div>
                  </Link>
                  <Link 
                    href="/soru-bankasi/kesif" 
                    className="flex items-center gap-3 px-4 py-2.5 text-surface-600 hover:bg-surface-50 hover:text-primary-500 transition-colors"
                  >
                    <BookOpen className="w-4 h-4" />
                    Soru Bankaları
                  </Link>
                  <div className="border-t border-surface-100 my-2"></div>
                  <Link 
                    href="/sinav-takvimi" 
                    className="flex items-center gap-3 px-4 py-2.5 text-surface-600 hover:bg-surface-50 hover:text-primary-500 transition-colors"
                  >
                    <Calendar className="w-4 h-4" />
                    Sınav Takvimi
                  </Link>
                  <Link 
                    href="/lgs-puan-hesaplama" 
                    className="flex items-center gap-3 px-4 py-2.5 text-surface-600 hover:bg-surface-50 hover:text-primary-500 transition-colors"
                  >
                    <Calculator className="w-4 h-4" />
                    LGS Puan Hesapla
                  </Link>
                  <Link 
                    href="/yks-puan-hesaplama" 
                    className="flex items-center gap-3 px-4 py-2.5 text-surface-600 hover:bg-surface-50 hover:text-primary-500 transition-colors"
                  >
                    <GraduationCap className="w-4 h-4" />
                    YKS Puan Hesapla
                  </Link>
                </div>
              </div>
            </div>

            <div className="hidden md:flex items-center gap-3">
              {/* Koç Ol Butonu */}
              <Link 
                href="/koc-ol" 
                className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-emerald-500/25 transition-all text-sm"
              >
                <UserPlus className="w-4 h-4" />
                Koç Ol
              </Link>
              
              {authLoading ? (
                <div className="w-8 h-8 rounded-full bg-surface-100 animate-pulse" />
              ) : user && userProfile ? (
                <>
                  <Link 
                    href={userProfile.role === 'admin' ? '/admin' : userProfile.role === 'ogretmen' ? '/koc' : userProfile.role === 'veli' ? '/veli' : '/ogrenci'}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl font-medium hover:shadow-lg transition-all"
                  >
                    {userProfile.avatar_url ? (
                      <img src={userProfile.avatar_url} alt="" className="w-6 h-6 rounded-full object-cover" />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold">
                        {getInitials(userProfile.full_name)}
                      </div>
                    )}
                    Dashboard
                  </Link>
                </>
              ) : (
                <>
                  <Link href="/giris" className="btn btn-ghost btn-md">
                    Giriş Yap
                  </Link>
                  <Link href="/kayit" className="btn btn-primary btn-md">
                    Ücretsiz Başla
                  </Link>
                </>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-surface-600 hover:bg-surface-100 rounded-xl"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu - Sadeleştirilmiş */}
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="md:hidden bg-white border-b border-surface-100 px-4 py-4"
          >
            <div className="space-y-2">
              <Link 
                href="/hizli-coz" 
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 px-4 py-3 bg-orange-50 text-orange-600 rounded-xl font-medium"
              >
                <Target className="w-5 h-5" />
                Soru Çöz
              </Link>
              <Link 
                href="/liderlik" 
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 px-4 py-3 text-surface-600 hover:bg-surface-50 rounded-xl font-medium"
              >
                <Trophy className="w-4 h-4" />
                Liderlik
              </Link>
              <Link 
                href="/koclar" 
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 px-4 py-3 text-surface-600 hover:bg-surface-50 rounded-xl font-medium"
              >
                <Users className="w-4 h-4" />
                Koçlar
              </Link>
              
              <Link 
                href="/rehberler" 
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 px-4 py-3 text-surface-600 hover:bg-surface-50 rounded-xl font-medium"
              >
                <BookOpen className="w-4 h-4" />
                Rehberlik
              </Link>
              
              {/* Araçlar Bölümü */}
              <div className="px-4 py-2">
                <p className="text-xs text-surface-400 font-medium mb-2 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  ARAÇLAR
                </p>
                <div className="space-y-1 pl-2">
                  <Link 
                    href="/sorular" 
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 text-surface-600 hover:bg-surface-50 rounded-lg font-medium text-sm"
                  >
                    <FileText className="w-4 h-4" />
                    Sorular
                  </Link>
                  <Link 
                    href="/soru-bankasi/olustur" 
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 text-surface-600 hover:bg-surface-50 rounded-lg font-medium text-sm"
                  >
                    <FileText className="w-4 h-4" />
                    PDF Soru Bankası
                  </Link>
                  <Link 
                    href="/soru-bankasi/kesif" 
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 text-surface-600 hover:bg-surface-50 rounded-lg font-medium text-sm"
                  >
                    <BookOpen className="w-4 h-4" />
                    Soru Bankaları
                  </Link>
                  <Link 
                    href="/sinav-takvimi" 
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 text-surface-600 hover:bg-surface-50 rounded-lg font-medium text-sm"
                  >
                    <Calendar className="w-4 h-4" />
                    Sınav Takvimi
                  </Link>
                  <Link 
                    href="/lgs-puan-hesaplama" 
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 text-surface-600 hover:bg-surface-50 rounded-lg font-medium text-sm"
                  >
                    <Calculator className="w-4 h-4" />
                    LGS Puan Hesapla
                  </Link>
                  <Link 
                    href="/yks-puan-hesaplama" 
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 text-surface-600 hover:bg-surface-50 rounded-lg font-medium text-sm"
                  >
                    <GraduationCap className="w-4 h-4" />
                    YKS Puan Hesapla
                  </Link>
                </div>
              </div>
              
              {/* Koç Ol Butonu - Mobile */}
              <Link 
                href="/koc-ol" 
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-medium"
              >
                <UserPlus className="w-5 h-5" />
                Koç Ol
              </Link>
              <div className="pt-3 border-t border-surface-100 space-y-2">
                {user && userProfile ? (
                  <Link 
                    href={userProfile.role === 'admin' ? '/admin' : userProfile.role === 'ogretmen' ? '/koc' : userProfile.role === 'veli' ? '/veli' : '/ogrenci'}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl font-medium"
                  >
                    {userProfile.avatar_url ? (
                      <img src={userProfile.avatar_url} alt="" className="w-6 h-6 rounded-full object-cover" />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold">
                        {getInitials(userProfile.full_name)}
                      </div>
                    )}
                    Dashboard'a Git
                  </Link>
                ) : (
                  <>
                    <Link href="/giris" className="btn btn-ghost btn-md w-full">
                      Giriş Yap
                    </Link>
                    <Link href="/kayit" className="btn btn-primary btn-md w-full">
                      Ücretsiz Başla
                    </Link>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </nav>

      {/* Hero - YENİ TASARIM */}
      <section className="pt-28 pb-12 px-4 relative overflow-hidden">
        <FloatingSymbols />
        
        <div className="max-w-7xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-100 to-amber-100 text-orange-600 rounded-full text-sm font-medium mb-6">
              <Sparkles className="w-4 h-4" />
              AI Destekli Soru Bankası & Liderlik Yarışı & Koçluk Sistemi
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold text-surface-900 mb-6 leading-tight">
              <span className="bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 bg-clip-text text-transparent">ÖĞREN.</span>{' '}
              <span className="bg-gradient-to-r from-purple-500 via-violet-500 to-purple-600 bg-clip-text text-transparent">YARIŞ.</span>{' '}
              <span className="bg-gradient-to-r from-emerald-500 via-green-500 to-emerald-600 bg-clip-text text-transparent">KAZAN.</span>{' '}
              <span className="bg-gradient-to-r from-teal-500 via-cyan-500 to-teal-600 bg-clip-text text-transparent">KOÇ OL.</span>
            </h1>
            
            <p className="text-lg sm:text-xl text-surface-600 max-w-3xl mx-auto mb-8">
              Binlerce soruyla pratik yap, Türkiye sıralamasında yüksel, 
              <span className="font-semibold text-surface-800"> AI destekli öğrenme</span> ile fark yarat.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 flex-wrap">
              <Link href="/hizli-coz" className="group relative btn btn-lg px-8 py-4 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-lg shadow-orange-500/30 transition-all hover:shadow-xl hover:shadow-orange-500/40 hover:scale-105">
                <Target className="w-5 h-5" />
                Hemen Soru Çöz
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link href="/soru-bankasi/kesif" className="btn btn-outline btn-lg border-indigo-300 text-indigo-600 hover:bg-indigo-50">
                <FileText className="w-5 h-5" />
                Soru Bankaları
              </Link>
              <Link href="/liderlik" className="btn btn-outline btn-lg border-purple-300 text-purple-600 hover:bg-purple-50">
                <Trophy className="w-5 h-5" />
                Liderlik Tablosu
              </Link>
              <Link href="/ogrenci/duello" className="btn btn-outline btn-lg border-red-300 text-red-600 hover:bg-red-50 relative">
                <Swords className="w-5 h-5" />
                Canlı Düello
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
              </Link>
              <Link href="/koclar" className="btn btn-ghost btn-lg text-surface-600">
                Koçunu Bul
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Live Stats Banner */}
            <LiveStatsBanner />
          </motion.div>
        </div>
      </section>

      {/* 🚀 HEMEN SORU ÇÖZ - ANA BÖLÜM */}
      <section className="py-8 px-4 -mt-8 relative z-20">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gradient-to-br from-indigo-600 via-purple-600 to-violet-700 rounded-3xl shadow-2xl shadow-purple-500/30 p-6 sm:p-8 relative overflow-hidden"
          >
            {/* Background decorations */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-2xl" />
            </div>

            <div className="relative z-10">
              {/* Header */}
              <div className="text-center mb-6">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur rounded-full text-white text-sm font-medium mb-4">
                  <Sparkles className="w-4 h-4 text-yellow-300" />
                  Kayıt Olmadan, Ücretsiz, Sınırsız!
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                  🚀 Hemen Soru Çözmeye Başla!
                </h2>
                <p className="text-white/70">
                  Takma adını yaz, sınıfını seç, anında başla
                </p>
              </div>

              {/* Quick Start Form */}
              <div className="grid sm:grid-cols-3 gap-4 mb-6">
                {/* Nickname Input */}
                <div className="relative">
                  <label className="block text-white/80 text-sm font-medium mb-2">Takma Adın</label>
                  <input
                    type="text"
                    value={quickStartNickname}
                    onChange={(e) => setQuickStartNickname(e.target.value)}
                    placeholder="Örn: Kahraman123"
                    maxLength={20}
                    className="w-full px-4 py-3 bg-white/20 backdrop-blur border border-white/30 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/50"
                  />
                </div>

                {/* Grade Selection */}
                <div className="relative">
                  <label className="block text-white/80 text-sm font-medium mb-2">Sınıfın</label>
                  <div className="relative">
                    <select
                      value={selectedGrade}
                      onChange={(e) => setSelectedGrade(Number(e.target.value))}
                      className="w-full px-4 py-3 bg-white/20 backdrop-blur border border-white/30 rounded-xl text-white appearance-none focus:outline-none focus:ring-2 focus:ring-white/50 cursor-pointer"
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(grade => (
                        <option key={grade} value={grade} className="bg-purple-800 text-white">{grade}. Sınıf</option>
                      ))}
                    </select>
                    <ChevronDown className="w-5 h-5 absolute right-3 top-1/2 -translate-y-1/2 text-white/60 pointer-events-none" />
                  </div>
                </div>

                {/* Subject Selection */}
                <div className="relative">
                  <label className="block text-white/80 text-sm font-medium mb-2">Ders (opsiyonel)</label>
                  <div className="relative">
                    <select
                      value={quickStartSubject}
                      onChange={(e) => setQuickStartSubject(e.target.value)}
                      className="w-full px-4 py-3 bg-white/20 backdrop-blur border border-white/30 rounded-xl text-white appearance-none focus:outline-none focus:ring-2 focus:ring-white/50 cursor-pointer"
                    >
                      <option value="" className="bg-purple-800 text-white">Karışık</option>
                      {gradeSubjectsForQuickStart.map(subject => (
                        <option key={subject.id} value={subject.id} className="bg-purple-800 text-white">
                          {subject.icon} {subject.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-5 h-5 absolute right-3 top-1/2 -translate-y-1/2 text-white/60 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Start Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleQuickStart}
                disabled={!quickStartNickname.trim()}
                className="w-full py-4 bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white font-bold text-lg rounded-xl transition-all shadow-lg shadow-orange-500/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
              >
                <Play className="w-6 h-6" />
                Soru Çözmeye Başla!
                <ArrowRight className="w-5 h-5" />
              </motion.button>

              {/* Quick info */}
              <div className="flex flex-wrap justify-center gap-4 mt-4 text-white/60 text-sm">
                <span className="flex items-center gap-1">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  Kayıt gerektirmez
                </span>
                <span className="flex items-center gap-1">
                  <Zap className="w-4 h-4 text-yellow-400" />
                  XP kazan
                </span>
                <span className="flex items-center gap-1">
                  <Trophy className="w-4 h-4 text-orange-400" />
                  Sıralamada yüksel
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 🔮 SİHİRLİ SORU ARAMA - TYPESENSE */}
      <MagicSearchHero />

      {/* 📚 PDF SORU BANKASI OLUŞTUR */}
      <section className="py-12 px-4 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-white rounded-2xl shadow-lg p-6 md:p-8"
          >
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center flex-shrink-0">
                <FileText className="w-8 h-8 text-white" />
              </div>
              <div className="flex-1 text-center md:text-left">
                <div className="inline-flex items-center gap-1 px-2 py-1 bg-indigo-100 rounded-full text-indigo-700 text-xs font-medium mb-2">
                  <Sparkles className="w-3 h-3" />
                  Yeni
                </div>
                <h3 className="text-xl font-bold text-surface-900 mb-1">
                  Kendi Soru Bankamı Oluştur
                </h3>
                <p className="text-surface-500 text-sm">
                  "8. sınıf matematik denklemler 50 soru" yaz, PDF olarak indir!
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                <Link
                  href="/soru-bankasi/olustur"
                  className="px-5 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 text-sm"
                >
                  <Sparkles className="w-4 h-4" />
                  PDF Oluştur
                </Link>
                <Link
                  href="/soru-bankasi/kesif"
                  className="px-5 py-3 bg-surface-100 hover:bg-surface-200 text-surface-700 font-medium rounded-xl transition-all flex items-center justify-center gap-2 text-sm"
                >
                  <BookOpen className="w-4 h-4" />
                  Keşfet
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* HIZLI BAŞLA KARTLARI */}
      <section className="py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-white rounded-3xl shadow-xl border border-surface-100 p-6 sm:p-8"
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-2xl font-bold text-surface-900 flex items-center gap-2">
                  <BookOpen className="w-6 h-6 text-purple-500" />
                  Derse Göre Soru Çöz
                </h2>
                <p className="text-surface-500 mt-1">{selectedGrade}. sınıf derslerini keşfet</p>
              </div>
            </div>

            {/* Ders Kartları - Dinamik */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
              {gradeSubjectsForQuickStart.length === 0 ? (
                // Yüklenirken skeleton kartlar
                Array.from({ length: 6 }).map((_, index) => (
                  <div key={index} className="bg-gray-100 rounded-2xl p-4 animate-pulse">
                    <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-gray-200" />
                    <div className="h-4 bg-gray-200 rounded mx-auto w-16 mb-2" />
                    <div className="h-3 bg-gray-200 rounded mx-auto w-12" />
                  </div>
                ))
              ) : (
                gradeSubjectsForQuickStart.map((subject, index) => {
                  const style = subjectStyles[subject.code] || defaultSubjectStyle
                  const SubjectIcon = style.icon
                  const questionCount = subjectQuestionCounts[subject.id] || subjectQuestionCounts[subject.name] || 0
                  
                  return (
                    <motion.div
                      key={subject.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.05 }}
                      viewport={{ once: true }}
                      whileHover={{ scale: 1.05, y: -5 }}
                      className="relative group cursor-pointer"
                    >
                      <Link href={`/hizli-coz?dersId=${subject.id}&sinif=${selectedGrade}`}>
                        <div className={`${style.bgLight} rounded-2xl p-4 text-center transition-all duration-300 group-hover:shadow-lg border border-transparent group-hover:border-surface-200`}>
                          <div className={`w-12 h-12 mx-auto mb-3 rounded-xl bg-gradient-to-br ${style.color} flex items-center justify-center shadow-lg`}>
                            <SubjectIcon className="w-6 h-6 text-white" />
                          </div>
                          <h3 className="font-semibold text-surface-900 text-sm mb-1">{subject.name}</h3>
                          {subjectCountsLoading ? (
                            <div className="h-3 bg-gray-200 rounded mx-auto w-12 animate-pulse" />
                          ) : (
                            <p className="text-xs text-surface-500">{formatNumber(questionCount)} soru</p>
                          )}
                          <div className="mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="text-xs font-medium text-primary-600">Çöz →</span>
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  )
                })
              )}
            </div>

            {/* Alt Butonlar */}
            <div className="flex flex-wrap justify-center gap-3">
              <Link href={`/hizli-coz?sinif=${selectedGrade}`} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-violet-500 text-white rounded-xl text-sm font-medium hover:shadow-lg transition-all">
                <Zap className="w-4 h-4" />
                Rastgele Soru
              </Link>
              <Link href="/kayit" className="flex items-center gap-2 px-4 py-2 bg-surface-100 text-surface-700 rounded-xl text-sm font-medium hover:bg-surface-200 transition-all">
                <Target className="w-4 h-4" />
                Eksik Konular
              </Link>
              <Link href="/kayit" className="flex items-center gap-2 px-4 py-2 bg-surface-100 text-surface-700 rounded-xl text-sm font-medium hover:bg-surface-200 transition-all">
                <FileText className="w-4 h-4" />
                Deneme Sınavı
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ✨ PREMIUM KOÇLUK BÖLÜMÜ - YENİ KONUM */}
      <section className="py-20 px-4 bg-gradient-to-br from-emerald-900 via-green-900 to-teal-900 relative overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-72 h-72 bg-emerald-500/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-teal-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-green-500/10 rounded-full blur-3xl"></div>
        </div>
        
        {/* Decorative Pattern */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMtOS45NDEgMC0xOCA4LjA1OS0xOCAxOHM4LjA1OSAxOCAxOCAxOCAxOC04LjA1OSAxOC0xOC04LjA1OS0xOC0xOC0xOHptMCAzMmMtNy43MzIgMC0xNC02LjI2OC0xNC0xNHM2LjI2OC0xNCAxNC0xNCAxNCA2LjI2OCAxNCAxNC02LjI2OCAxNC0xNCAxNHoiIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iLjAyIi8+PC9nPjwvc3ZnPg==')] opacity-30"></div>
        
        <div className="max-w-7xl mx-auto relative z-10">
          {/* Header */}
          <div className="text-center mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full text-white text-sm font-medium mb-6"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
              </span>
              Birebir Koçluk Desteği
            </motion.div>
            
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              viewport={{ once: true }}
              className="text-4xl sm:text-5xl font-extrabold text-white mb-4"
            >
              Uzman Koçlarla{' '}
              <span className="bg-gradient-to-r from-emerald-400 via-green-400 to-teal-400 bg-clip-text text-transparent">
                Hedefe Ulaş
              </span>
            </motion.h2>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              viewport={{ once: true }}
              className="text-lg text-emerald-100/80 max-w-2xl mx-auto"
            >
              LGS ve YKS'de başarıya giden en kısa yol: Deneyimli koçlarla birebir çalış, 
              kişisel çalışma planınla fark yarat
            </motion.p>
          </div>

          {/* Stats Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            viewport={{ once: true }}
            className="flex flex-wrap justify-center gap-8 mb-12"
          >
            {[
              { value: '50+', label: 'Uzman Koç', icon: '👨‍🏫' },
              { value: '%95', label: 'Memnuniyet', icon: '⭐' },
              { value: '1000+', label: 'Başarılı Öğrenci', icon: '🎓' },
              { value: '24/7', label: 'Destek', icon: '💬' },
            ].map((stat, index) => (
              <div key={index} className="flex items-center gap-3 px-6 py-3 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10">
                <span className="text-2xl">{stat.icon}</span>
                <div>
                  <div className="text-2xl font-bold text-white">{stat.value}</div>
                  <div className="text-xs text-emerald-200/70">{stat.label}</div>
                </div>
              </div>
            ))}
          </motion.div>

          {/* Coaches Grid */}
          {loadingCoaches ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin w-10 h-10 border-4 border-emerald-400 border-t-transparent rounded-full" />
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {coaches.slice(0, 3).map((coach, index) => (
                <motion.div
                  key={coach.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index }}
                  viewport={{ once: true }}
                >
                  <Link href={coach.isDemo ? '#' : `/koclar/${coach.id}`}>
                    <div className="group relative bg-white/10 backdrop-blur-md rounded-3xl overflow-hidden border border-white/20 hover:border-emerald-400/50 transition-all duration-500 hover:shadow-2xl hover:shadow-emerald-500/20 hover:-translate-y-2">
                      {/* Top Gradient Banner */}
                      <div className="h-28 bg-gradient-to-br from-emerald-500/30 to-teal-500/30 relative">
                        {/* Floating Badge */}
                        {coach.video_url && (
                          <div className="absolute top-4 right-4 px-3 py-1.5 bg-white/20 backdrop-blur-sm text-white text-xs font-medium rounded-full flex items-center gap-1.5 border border-white/20">
                            <Play className="w-3 h-3" />
                            Video Tanıtım
                          </div>
                        )}
                        
                        {/* Avatar */}
                        <div className="absolute -bottom-10 left-1/2 -translate-x-1/2">
                          <div className="relative">
                            <div className="w-24 h-24 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-2xl rotate-3 absolute inset-0 opacity-50 blur-sm group-hover:rotate-6 transition-transform"></div>
                            <div className="w-24 h-24 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-2xl flex items-center justify-center text-white text-3xl font-bold shadow-xl overflow-hidden border-4 border-white/30 relative group-hover:scale-105 transition-transform">
                              {coach.profile?.avatar_url ? (
                                <img src={coach.profile.avatar_url} alt="" className="w-full h-full object-cover" />
                              ) : (
                                getInitials(coach.profile?.full_name || coach.full_name)
                              )}
                            </div>
                            {/* Online Indicator */}
                            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-400 rounded-full border-2 border-white flex items-center justify-center">
                              <Check className="w-3 h-3 text-white" />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="pt-14 pb-6 px-6 text-center">
                        <h3 className="text-xl font-bold text-white mb-1 group-hover:text-emerald-300 transition-colors">
                          {coach.profile?.full_name || coach.full_name}
                        </h3>
                        <p className="text-emerald-200/70 text-sm mb-4 line-clamp-1">
                          {coach.headline || 'Eğitim Koçu'}
                        </p>

                        {/* Specializations */}
                        {coach.specializations && coach.specializations.length > 0 && (
                          <div className="flex flex-wrap justify-center gap-2 mb-5">
                            {coach.specializations.slice(0, 3).map((spec: string, i: number) => (
                              <span 
                                key={i}
                                className="px-3 py-1 bg-emerald-500/20 text-emerald-300 text-xs font-medium rounded-full border border-emerald-500/30"
                              >
                                {spec}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Stats */}
                        <div className="flex items-center justify-center gap-6 pt-5 border-t border-white/10">
                          <div className="flex items-center gap-1.5">
                            <Star className={`w-5 h-5 ${coach.avgRating > 0 ? 'text-yellow-400 fill-yellow-400' : 'text-white/30'}`} />
                            <span className="font-bold text-white">
                              {coach.avgRating > 0 ? coach.avgRating.toFixed(1) : '-'}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 text-emerald-200/70 text-sm">
                            <Clock className="w-4 h-4" />
                            {coach.experience_years || 0} yıl deneyim
                          </div>
                        </div>

                        {/* CTA Button */}
                        <button className="mt-5 w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold rounded-xl opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/30">
                          Koçla Tanış
                        </button>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}

          {/* Bottom CTA Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            viewport={{ once: true }}
            className="mt-16 text-center"
          >
            <div className="inline-flex flex-col sm:flex-row items-center gap-4">
              <Link 
                href="/koclar" 
                className="group px-8 py-4 bg-white text-emerald-900 font-bold rounded-2xl hover:shadow-2xl hover:shadow-white/20 transition-all duration-300 flex items-center gap-2"
              >
                <Users className="w-5 h-5" />
                Tüm Koçları Keşfet
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link 
                href="/kayit?role=ogretmen" 
                className="px-8 py-4 bg-white/10 backdrop-blur-sm text-white font-semibold rounded-2xl border border-white/20 hover:bg-white/20 transition-all flex items-center gap-2"
              >
                <GraduationCap className="w-5 h-5" />
                Koç Olarak Katıl
              </Link>
            </div>
            
            <p className="mt-6 text-emerald-200/60 text-sm">
              💡 İlk görüşme ücretsiz! Koçunla tanış, hedeflerini paylaş.
            </p>
          </motion.div>
        </div>
      </section>

      {/* GAMİFİCATİON HUB - YENİ BÖLÜM */}
      <section className="py-16 px-4 bg-gradient-to-br from-indigo-900 via-purple-900 to-violet-900 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMtOS45NDEgMC0xOCA4LjA1OS0xOCAxOHM4LjA1OSAxOCAxOCAxOCAxOC04LjA1OSAxOC0xOC04LjA1OS0xOC0xOC0xOHptMCAzMmMtNy43MzIgMC0xNC02LjI2OC0xNC0xNHM2LjI2OC0xNCAxNC0xNCAxNCA2LjI2OCAxNCAxNC02LjI2OCAxNC0xNCAxNHoiIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iLjAyIi8+PC9nPjwvc3ZnPg==')] opacity-30"></div>
        
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="text-center mb-10">
            <motion.div
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur rounded-full text-white/80 text-sm font-medium mb-4"
            >
              <Flame className="w-4 h-4 text-orange-400" />
              Oyunlaştırılmış Öğrenme
            </motion.div>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3">
              XP Kazan, Seviye Atla, Rozet Topla!
            </h2>
            <p className="text-white/60 max-w-2xl mx-auto">
              Her doğru cevap seni bir adım öne taşır. Arkadaşlarınla yarış, rozetleri aç!
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Günlük Meydan Okuma */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/10"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Target className="w-5 h-5 text-orange-400" />
                  Günlük Görev
                </h3>
                <span className="text-xs text-white/50 bg-white/10 px-2 py-1 rounded-full">23:45:12</span>
              </div>
              <p className="text-white/80 mb-4">
                "Bugün <span className="font-bold text-orange-400">20 matematik</span> sorusu çöz!"
              </p>
              <div className="relative h-3 bg-white/10 rounded-full overflow-hidden mb-3">
                <motion.div 
                  initial={{ width: 0 }}
                  whileInView={{ width: '60%' }}
                  transition={{ duration: 1, delay: 0.5 }}
                  className="absolute h-full bg-gradient-to-r from-orange-500 to-amber-500 rounded-full"
                />
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-white/60">12/20 soru</span>
                <span className="text-orange-400 font-medium">+50 XP</span>
              </div>
              <Link href="/ogrenci/basarimlar" className="mt-4 w-full btn bg-white/20 hover:bg-white/30 text-white border-0">
                Göreve Katıl
              </Link>
            </motion.div>

            {/* XP ve Seviye */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              viewport={{ once: true }}
              className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/10"
            >
              <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
                <Zap className="w-5 h-5 text-yellow-400" />
                Seviye Sistemi
              </h3>
              <div className="space-y-3">
                {levels.slice(0, 4).map((level, i) => (
                  <div key={level.level} className="flex items-center gap-3">
                    <span className="text-2xl">{level.icon}</span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-white font-medium text-sm">Lv.{level.level} {level.name}</span>
                        <span className="text-white/50 text-xs">{formatNumber(level.xp)} XP</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 p-3 bg-white/5 rounded-xl">
                <p className="text-xs text-white/60 text-center">
                  Her doğru: <span className="text-green-400 font-bold">+10 XP</span> • 
                  Streak: <span className="text-orange-400 font-bold">+5 XP/gün</span>
                </p>
              </div>
            </motion.div>

            {/* Rozetler */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              viewport={{ once: true }}
              className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/10"
            >
              <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
                <Medal className="w-5 h-5 text-amber-400" />
                Rozetler
              </h3>
              <div className="grid grid-cols-3 gap-3">
                {badges.map((badge) => (
                  <div 
                    key={badge.name}
                    className={`text-center p-2 rounded-xl transition-all ${
                      badge.unlocked 
                        ? 'bg-white/10' 
                        : 'bg-white/5 opacity-50'
                    }`}
                  >
                    <span className="text-2xl block mb-1">{badge.icon}</span>
                    <span className="text-xs text-white/80 block">{badge.name}</span>
                  </div>
                ))}
              </div>
              <Link href="/rozetler" className="mt-4 text-center block text-sm text-white/60 hover:text-white transition-colors">
                Tüm rozetleri gör →
              </Link>
            </motion.div>
          </div>

          {/* Streak Göstergesi */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            viewport={{ once: true }}
            className="mt-8 bg-gradient-to-r from-orange-500/20 to-red-500/20 backdrop-blur-sm rounded-2xl p-6 border border-orange-500/30"
          >
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="text-5xl">🔥</div>
                <div>
                  <h3 className="text-xl font-bold text-white">Serini Koru!</h3>
                  <p className="text-white/60">Her gün soru çöz, serinizi kaybetme</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {['P', 'S', 'Ç', 'P', 'C', 'C', 'P'].map((day, i) => (
                  <div 
                    key={i}
                    className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-medium ${
                      i < 5 
                        ? 'bg-gradient-to-br from-orange-500 to-red-500 text-white' 
                        : 'bg-white/10 text-white/40'
                    }`}
                  >
                    {i < 5 ? '✓' : day}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* LİDERLİK TABLOSU - GELİŞTİRİLMİŞ */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              viewport={{ once: true }}
              className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-yellow-500/30"
            >
              <Trophy className="w-8 h-8 text-white" />
            </motion.div>
            <h2 className="text-3xl font-bold text-surface-900 mb-2">
              Liderlik Tablosu
            </h2>
            <p className="text-surface-600">
              En çok soru çözen ve en yüksek puana sahip öğrenciler
            </p>
          </div>

          {/* Tabs */}
          <div className="flex justify-center gap-2 mb-8">
            {[
              { key: 'daily', label: 'Günlük' },
              { key: 'weekly', label: 'Haftalık' },
              { key: 'monthly', label: 'Aylık' },
              { key: 'all', label: 'Tüm Zamanlar' },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setLeaderboardTab(tab.key as any)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  leaderboardTab === tab.key
                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30'
                    : 'bg-surface-100 text-surface-600 hover:bg-surface-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {leaderboardLoading ? (
            // Loading skeleton
            <div className="flex flex-col md:flex-row items-end justify-center gap-4 mb-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className={`bg-gray-100 rounded-2xl p-5 text-center w-full md:w-48 animate-pulse ${i === 2 ? 'md:order-first' : ''}`}>
                  <div className="w-12 h-12 bg-gray-200 rounded-full mx-auto mb-2" />
                  <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-2" />
                  <div className="h-4 bg-gray-200 rounded w-24 mx-auto mb-2" />
                  <div className="h-6 bg-gray-200 rounded w-16 mx-auto" />
                </div>
              ))}
            </div>
          ) : topLeaders.length > 0 ? (
            <>
              {/* Top 3 Podium */}
              <div className="flex flex-col md:flex-row items-end justify-center gap-4 mb-8">
                {/* 2nd Place */}
                {topLeaders[1] && (
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    viewport={{ once: true }}
                    className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl p-5 text-center w-full md:w-48 border-2 border-gray-300"
                  >
                    <div className="text-4xl mb-2">🥈</div>
                    <div className="w-16 h-16 bg-gradient-to-br from-gray-400 to-gray-500 rounded-full flex items-center justify-center mx-auto mb-2 text-white font-bold text-xl overflow-hidden border-4 border-white shadow-lg">
                      {topLeaders[1].avatar ? (
                        <img src={topLeaders[1].avatar} alt="" className="w-full h-full object-cover" />
                      ) : (
                        getInitials(topLeaders[1].name)
                      )}
                    </div>
                    <div className="font-bold text-surface-900 truncate">{topLeaders[1].name}</div>
                    <div className="text-2xl font-bold text-gray-600">{formatNumber(topLeaders[1].points)}</div>
                    <div className="text-xs text-surface-500">XP</div>
                  </motion.div>
                )}

                {/* 1st Place */}
                {topLeaders[0] && (
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="bg-gradient-to-br from-yellow-100 via-amber-100 to-yellow-200 rounded-2xl p-6 text-center w-full md:w-56 border-2 border-yellow-400 relative shadow-xl"
                  >
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-gradient-to-r from-yellow-500 to-amber-500 text-white text-xs font-bold rounded-full shadow-lg">
                      ŞAMPİYON
                    </div>
                    <div className="text-5xl mb-2">👑</div>
                    <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-full flex items-center justify-center mx-auto mb-3 text-white font-bold text-2xl shadow-lg shadow-yellow-500/30 overflow-hidden border-4 border-white">
                      {topLeaders[0].avatar ? (
                        <img src={topLeaders[0].avatar} alt="" className="w-full h-full object-cover" />
                      ) : (
                        getInitials(topLeaders[0].name)
                      )}
                    </div>
                    <div className="text-lg font-bold text-surface-900 truncate">{topLeaders[0].name}</div>
                    <div className="text-3xl font-bold bg-gradient-to-r from-yellow-600 to-amber-600 bg-clip-text text-transparent">{formatNumber(topLeaders[0].points)}</div>
                    <div className="text-sm text-surface-500">XP</div>
                    <div className="mt-2 text-xs text-surface-500">
                      {topLeaders[0].correct} doğru • {topLeaders[0].questions} soru
                    </div>
                  </motion.div>
                )}

                {/* 3rd Place */}
                {topLeaders[2] && (
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    viewport={{ once: true }}
                    className="bg-gradient-to-br from-amber-100 to-orange-200 rounded-2xl p-5 text-center w-full md:w-48 border-2 border-amber-400"
                  >
                    <div className="text-4xl mb-2">🥉</div>
                    <div className="w-16 h-16 bg-gradient-to-br from-amber-600 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-2 text-white font-bold text-xl overflow-hidden border-4 border-white shadow-lg">
                      {topLeaders[2].avatar ? (
                        <img src={topLeaders[2].avatar} alt="" className="w-full h-full object-cover" />
                      ) : (
                        getInitials(topLeaders[2].name)
                      )}
                    </div>
                    <div className="font-bold text-surface-900 truncate">{topLeaders[2].name}</div>
                    <div className="text-2xl font-bold text-amber-700">{formatNumber(topLeaders[2].points)}</div>
                    <div className="text-xs text-surface-500">XP</div>
                  </motion.div>
                )}
              </div>

              {/* Rest of Leaderboard */}
              {topLeaders.slice(3, 10).length > 0 && (
                <div className="bg-surface-50 rounded-2xl p-4 space-y-2">
                  {topLeaders.slice(3, 10).map((leader, index) => (
                    <motion.div
                      key={leader.rank}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + index * 0.05 }}
                      viewport={{ once: true }}
                      className="flex items-center gap-4 bg-white rounded-xl px-4 py-3 shadow-sm hover:shadow-md transition-shadow"
                    >
                      <span className="w-8 text-lg font-bold text-surface-400">{leader.rank}.</span>
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-indigo-500 rounded-full flex items-center justify-center text-white font-bold text-sm overflow-hidden">
                        {leader.avatar ? (
                          <img src={leader.avatar} alt="" className="w-full h-full object-cover" />
                        ) : (
                          getInitials(leader.name)
                        )}
                      </div>
                      <div className="flex-1">
                        <span className="font-medium text-surface-900">{leader.name}</span>
                        {leader.grade && (
                          <span className="ml-2 text-xs text-surface-400">{leader.grade}. sınıf</span>
                        )}
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-purple-600">{formatNumber(leader.points)}</span>
                        <span className="text-xs text-surface-400 ml-1">XP</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12 bg-surface-50 rounded-2xl">
              <Trophy className="w-12 h-12 text-surface-300 mx-auto mb-4" />
              <p className="text-surface-500">Henüz liderlik tablosunda kimse yok.</p>
              <p className="text-surface-400 text-sm mt-1">İlk sen ol!</p>
            </div>
          )}

          {/* CTA */}
          <div className="text-center mt-8">
            <Link 
              href="/liderlik" 
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-purple-500/30 transition-all"
            >
              Tüm Sıralamayı Gör
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* AI ARAÇLARI - YENİ BÖLÜM */}
      <section className="py-16 px-4 bg-gradient-to-br from-blue-50 via-cyan-50 to-blue-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <motion.div
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-600 rounded-full text-sm font-medium mb-4"
            >
              <Bot className="w-4 h-4" />
              Yapay Zeka Destekli
            </motion.div>
            <h2 className="text-3xl font-bold text-surface-900 mb-3">
              AI Öğrenme Araçları
            </h2>
            <p className="text-surface-600 max-w-2xl mx-auto">
              Yapay zeka asistanımız 7/24 sana yardımcı olmaya hazır
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* AI Konu Anlatımı */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all group"
            >
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg shadow-blue-500/30">
                <Brain className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-surface-900 mb-2">AI Konu Anlatımı</h3>
              <p className="text-surface-600 mb-4">
                Anlamadığın konuyu yapay zeka sana adım adım anlatsın. İstediğin kadar soru sor!
              </p>
              <Link href="/kayit" className="inline-flex items-center gap-2 text-blue-600 font-medium hover:gap-3 transition-all">
                Dene <ArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>

            {/* Soru Çözümü */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              viewport={{ once: true }}
              className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all group"
            >
              <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-violet-500 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg shadow-purple-500/30">
                <Camera className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-surface-900 mb-2">Soru Çözümü</h3>
              <p className="text-surface-600 mb-4">
                Sorunun fotoğrafını çek, AI adım adım çözsün. Çözüm mantığını öğren!
              </p>
              <Link href="/kayit" className="inline-flex items-center gap-2 text-purple-600 font-medium hover:gap-3 transition-all">
                Dene <ArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>

            {/* Eksik Analizi */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              viewport={{ once: true }}
              className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all group"
            >
              <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-green-500 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg shadow-emerald-500/30">
                <PieChart className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-surface-900 mb-2">Eksik Analizi</h3>
              <p className="text-surface-600 mb-4">
                Hangi konularda eksiğin var? AI analiz etsin, sana özel çalışma planı oluştursun.
              </p>
              <Link href="/kayit" className="inline-flex items-center gap-2 text-emerald-600 font-medium hover:gap-3 transition-all">
                Dene <ArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-4 bg-gradient-to-br from-primary-50 to-accent-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-surface-900 mb-4">
              Başarı Hikayeleri
            </h2>
            <p className="text-surface-600 max-w-2xl mx-auto">
              Öğrencilerimizin deneyimlerini okuyun
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            {testimonials.slice(0, 3).map((testimonial, index) => (
              <motion.div
                key={testimonial.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
                className="card p-6 bg-white"
              >
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
                
                <Quote className="w-8 h-8 text-primary-200 mb-3" />
                
                <p className="text-surface-700 mb-4 line-clamp-4">
                  "{testimonial.text}"
                </p>
                
                <div className="flex items-center justify-between pt-4 border-t border-surface-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                      {getInitials(testimonial.name)}
                    </div>
                    <div>
                      <div className="font-medium text-surface-900">{testimonial.name}</div>
                      <div className="text-xs text-surface-500">{testimonial.school}</div>
                    </div>
                  </div>
                  <div className="px-2 py-1 bg-green-50 text-green-600 text-xs font-medium rounded-full">
                    {testimonial.improvement}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Scrolling Testimonial */}
          <div className="relative overflow-hidden bg-white rounded-2xl shadow-lg p-6 sm:p-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={testimonialIndex}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col sm:flex-row items-center gap-6"
              >
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-accent-400 to-accent-600 rounded-2xl flex items-center justify-center text-white font-bold text-2xl flex-shrink-0">
                  {getInitials(testimonials[testimonialIndex].name)}
                </div>
                <div className="text-center sm:text-left flex-1">
                  <p className="text-lg text-surface-700 mb-3">
                    "{testimonials[testimonialIndex].text}"
                  </p>
                  <div className="flex items-center justify-center sm:justify-start gap-3">
                    <div>
                      <span className="font-semibold text-surface-900">{testimonials[testimonialIndex].name}</span>
                      <span className="text-surface-400 mx-2">•</span>
                      <span className="text-surface-500">{testimonials[testimonialIndex].school}</span>
                    </div>
                    <span className="px-3 py-1 bg-primary-50 text-primary-600 text-sm font-medium rounded-full">
                      {testimonials[testimonialIndex].examType}
                    </span>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
            
            <div className="flex justify-center gap-2 mt-6">
              {testimonials.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setTestimonialIndex(i)}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    i === testimonialIndex ? 'bg-primary-500' : 'bg-surface-200'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features - YENİ */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-surface-900 mb-4">
              Neden Teknokul?
            </h2>
            <p className="text-surface-600 max-w-2xl mx-auto">
              Geleneksel eğitimden farklı, oyunlaştırılmış ve AI destekli bir deneyim
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
                className="card p-6 hover:shadow-lg transition-all group"
              >
                <div className={`w-14 h-14 ${feature.bg} rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <feature.icon className={`w-7 h-7 ${feature.color}`} />
                </div>
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-xl font-semibold text-surface-900">
                    {feature.title}
                  </h3>
                  <div className="text-right">
                    <div className={`text-lg font-bold ${feature.color}`}>{feature.stat}</div>
                    <div className="text-xs text-surface-400">{feature.statLabel}</div>
                  </div>
                </div>
                <p className="text-surface-600">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works - YENİ */}
      <section className="py-20 px-4 bg-surface-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-surface-900 mb-4">
              Nasıl Çalışır?
            </h2>
            <p className="text-surface-600 max-w-2xl mx-auto">
              4 adımda öğrenmeye başla ve gelişimini takip et
            </p>
          </div>
          
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { step: '1', title: 'Kayıt Ol', desc: '30 saniyede ücretsiz kayıt ol, sınıfını seç.', icon: UserPlus, color: 'from-blue-500 to-indigo-500' },
              { step: '2', title: 'Soru Çözmeye Başla', desc: 'Dersini seç, zorluk belirle, pratik yap.', icon: Target, color: 'from-orange-500 to-amber-500' },
              { step: '3', title: 'XP Kazan, Yüksel', desc: 'Her doğru cevap XP kazandırır. Liderlikte yüksel!', icon: TrendingUp, color: 'from-purple-500 to-violet-500' },
              { step: '4', title: 'Gelişimini Hızlandır', desc: 'AI araçları ve koçlarla daha hızlı ilerle.', icon: Rocket, color: 'from-green-500 to-emerald-500' },
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
                className="text-center relative"
              >
                {index < 3 && (
                  <div className="hidden md:block absolute top-8 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-surface-200 to-surface-100" />
                )}
                <div className={`w-16 h-16 bg-gradient-to-br ${item.color} text-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg relative z-10`}>
                  <item.icon className="w-7 h-7" />
                </div>
                <div className="text-sm font-bold text-surface-400 mb-1">Adım {item.step}</div>
                <h3 className="text-xl font-semibold text-surface-900 mb-2">{item.title}</h3>
                <p className="text-surface-600 text-sm">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* SPLIT CTA - YENİ */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Kendi Kendine Öğren */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-gradient-to-br from-orange-500 to-amber-500 rounded-3xl p-8 text-white relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />
              
              <div className="relative z-10">
                <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mb-4">
                  <Rocket className="w-7 h-7" />
                </div>
                <h3 className="text-2xl font-bold mb-2">Kendi Kendine Öğren</h3>
                <p className="text-white/80 mb-6">Hemen başla, ücretsiz!</p>
                
                <ul className="space-y-3 mb-6">
                  {['Sınırsız soru çözme', 'Liderlik yarışı', 'AI araçları', 'Rozetler ve XP'].map((item) => (
                    <li key={item} className="flex items-center gap-2 text-sm">
                      <CheckCircle className="w-5 h-5 text-white/80" />
                      {item}
                    </li>
                  ))}
                </ul>
                
                <Link href="/kayit" className="btn bg-white text-orange-600 hover:bg-orange-50 w-full">
                  Ücretsiz Başla
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </div>
            </motion.div>

            {/* Koçla Birlikte Öğren */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-gradient-to-br from-green-500 to-emerald-500 rounded-3xl p-8 text-white relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />
              
              <div className="relative z-10">
                <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mb-4">
                  <Users className="w-7 h-7" />
                </div>
                <h3 className="text-2xl font-bold mb-2">Koçla Birlikte Öğren</h3>
                <p className="text-white/80 mb-6">Kişisel rehberlik al</p>
                
                <ul className="space-y-3 mb-6">
                  {['Kişisel çalışma planı', 'Birebir destek', 'Deneme analizi', 'Motivasyon koçluğu'].map((item) => (
                    <li key={item} className="flex items-center gap-2 text-sm">
                      <CheckCircle className="w-5 h-5 text-white/80" />
                      {item}
                    </li>
                  ))}
                </ul>
                
                <Link href="/koclar" className="btn bg-white text-green-600 hover:bg-green-50 w-full">
                  Koçları Gör
                  <ChevronRight className="w-5 h-5" />
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* SINAV ARAÇLARI - YENİ SEO BÖLÜMÜ */}
      <section className="py-20 px-4 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 bg-purple-500/20 text-purple-300 px-4 py-2 rounded-full text-sm mb-4"
            >
              <Calculator className="w-4 h-4" />
              Ücretsiz Sınav Araçları
            </motion.div>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Puanını Hesapla, Hedefini Belirle
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              LGS ve YKS puan hesaplama araçları ile sınav performansını analiz et
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {/* LGS Hesaplama */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <Link href="/lgs-puan-hesaplama" className="block group">
                <div className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 backdrop-blur-sm rounded-2xl border border-purple-500/30 p-6 h-full hover:border-purple-400/50 hover:shadow-lg hover:shadow-purple-500/10 transition-all">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center">
                      <GraduationCap className="w-7 h-7 text-white" />
                    </div>
                    <span className="px-3 py-1 bg-purple-500/20 text-purple-300 text-xs rounded-full">8. Sınıf</span>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2 group-hover:text-purple-300 transition">
                    LGS Puan Hesaplama
                  </h3>
                  <p className="text-gray-400 text-sm mb-4">
                    Netlerini gir, tahmini puanını ve yüzdelik dilimini anında öğren.
                  </p>
                  <div className="flex items-center text-purple-400 text-sm font-medium group-hover:gap-2 transition-all">
                    Hesapla <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              </Link>
            </motion.div>

            {/* YKS Hesaplama */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <Link href="/yks-puan-hesaplama" className="block group">
                <div className="bg-gradient-to-br from-indigo-600/20 to-blue-600/20 backdrop-blur-sm rounded-2xl border border-indigo-500/30 p-6 h-full hover:border-indigo-400/50 hover:shadow-lg hover:shadow-indigo-500/10 transition-all">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-blue-500 rounded-2xl flex items-center justify-center">
                      <Award className="w-7 h-7 text-white" />
                    </div>
                    <span className="px-3 py-1 bg-indigo-500/20 text-indigo-300 text-xs rounded-full">12. Sınıf</span>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2 group-hover:text-indigo-300 transition">
                    YKS Puan Hesaplama
                  </h3>
                  <p className="text-gray-400 text-sm mb-4">
                    TYT-AYT netlerini gir, puan türüne göre sıralamanı öğren.
                  </p>
                  <div className="flex items-center text-indigo-400 text-sm font-medium group-hover:gap-2 transition-all">
                    Hesapla <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* REHBERLER - YENİ SEO BÖLÜMÜ */}
      <section className="py-20 px-4 bg-gradient-to-br from-emerald-50 to-teal-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-700 px-4 py-2 rounded-full text-sm mb-4"
            >
              <BookOpen className="w-4 h-4" />
              Ücretsiz Eğitim Rehberleri
            </motion.div>
            <h2 className="text-3xl md:text-4xl font-bold text-surface-900 mb-4">
              Verimli Çalışma Teknikleri
            </h2>
            <p className="text-surface-600 max-w-2xl mx-auto">
              Sınavlara hazırlık, motivasyon ve verimli çalışma rehberleri
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                slug: 'pomodoro-teknigi-ile-verimli-ders-calisma',
                title: 'Pomodoro Tekniği',
                desc: '25 dakika odaklanma ile verimliliğini %40 artır',
                icon: Clock,
                color: 'from-red-500 to-orange-500',
                tag: 'Popüler'
              },
              {
                slug: 'lgs-hazirlik-rehberi-8-sinif',
                title: 'LGS Hazırlık Rehberi',
                desc: 'Adım adım LGS hazırlık stratejileri',
                icon: Target,
                color: 'from-purple-500 to-indigo-500',
                tag: 'LGS'
              },
              {
                slug: 'yks-calisma-programi-nasil-yapilir',
                title: 'YKS Çalışma Programı',
                desc: 'Kişisel YKS programı oluşturma rehberi',
                icon: PieChart,
                color: 'from-blue-500 to-cyan-500',
                tag: 'YKS'
              },
              {
                slug: 'sinav-kaygisi-nasil-yenilir',
                title: 'Sınav Kaygısı Yönetimi',
                desc: 'Stres ve kaygıyı yenmek için 7 teknik',
                icon: Heart,
                color: 'from-pink-500 to-rose-500',
                tag: 'Motivasyon'
              },
            ].map((rehber, index) => (
              <motion.div
                key={rehber.slug}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Link href={`/rehberler/${rehber.slug}`} className="block group h-full">
                  <div className="bg-white rounded-2xl border border-surface-100 p-5 h-full shadow-sm hover:shadow-md hover:border-emerald-200 transition-all">
                    <div className="flex items-start justify-between mb-3">
                      <div className={`w-11 h-11 bg-gradient-to-br ${rehber.color} rounded-xl flex items-center justify-center`}>
                        <rehber.icon className="w-5 h-5 text-white" />
                      </div>
                      <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 text-xs rounded-full">
                        {rehber.tag}
                      </span>
                    </div>
                    <h3 className="font-semibold text-surface-900 mb-1 group-hover:text-emerald-600 transition">
                      {rehber.title}
                    </h3>
                    <p className="text-surface-500 text-sm">
                      {rehber.desc}
                    </p>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>

          <div className="text-center mt-8">
            <Link
              href="/rehberler"
              className="inline-flex items-center gap-2 text-emerald-600 font-medium hover:text-emerald-700 hover:gap-3 transition-all"
            >
              Tüm Rehberleri Gör
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* University Logos */}
      <section className="py-12 px-4 bg-surface-50 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8">
            <p className="text-surface-500 text-sm font-medium">
              Öğrencilerimizin hedeflediği üniversiteler
            </p>
          </div>
          
          <div className="relative">
            <div className="flex animate-marquee gap-6">
              {[...universities, ...universities].map((uni, index) => (
                <a
                  key={index}
                  href={uni.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-shrink-0 group"
                  title={uni.name}
                >
                  <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${uni.color} flex items-center justify-center shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all duration-300 cursor-pointer`}>
                    <span className="text-white font-bold text-lg drop-shadow-sm">{uni.abbr}</span>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-surface-100 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid sm:grid-cols-2 lg:grid-cols-6 gap-8 mb-8">
            <div className="lg:col-span-2">
              <Link href="/" className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center">
                  <GraduationCap className="w-6 h-6 text-white" />
                </div>
                <span className="text-xl font-bold">
                  Tekn<span className="text-primary-500">okul</span>
                </span>
              </Link>
              <p className="text-surface-500 text-sm">
                AI destekli soru bankası, liderlik yarışı ve eğitim koçluğu platformu
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold text-surface-900 mb-4">Öğrenme</h4>
              <ul className="space-y-2 text-surface-600">
                <li><Link href="/hizli-coz" className="hover:text-primary-500">Soru Çöz</Link></li>
                <li><Link href="/soru-bankasi/olustur" className="hover:text-primary-500">PDF Soru Bankası</Link></li>
                <li><Link href="/liderlik" className="hover:text-primary-500">Liderlik</Link></li>
                <li><Link href="/rehberler" className="hover:text-primary-500">Rehberler</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-surface-900 mb-4">Araçlar</h4>
              <ul className="space-y-2 text-surface-600">
                <li><Link href="/lgs-puan-hesaplama" className="hover:text-primary-500">LGS Hesaplama</Link></li>
                <li><Link href="/yks-puan-hesaplama" className="hover:text-primary-500">YKS Hesaplama</Link></li>
                <li><Link href="/sinav-takvimi" className="hover:text-primary-500">Sınav Takvimi</Link></li>
                <li><Link href="/koclar" className="hover:text-primary-500">Koçlar</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-surface-900 mb-4">Hesap</h4>
              <ul className="space-y-2 text-surface-600">
                <li><Link href="/giris" className="hover:text-primary-500">Giriş Yap</Link></li>
                <li><Link href="/kayit" className="hover:text-primary-500">Kayıt Ol</Link></li>
                <li><Link href="/koc-ol" className="hover:text-primary-500">Koç Ol</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-surface-900 mb-4">Yasal</h4>
              <ul className="space-y-2 text-surface-600">
                <li><Link href="/yasal/gizlilik" className="hover:text-primary-500">Gizlilik</Link></li>
                <li><Link href="/yasal/kullanim-kosullari" className="hover:text-primary-500">Koşullar</Link></li>
                <li><Link href="/yasal/kvkk" className="hover:text-primary-500">KVKK</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="pt-8 border-t border-surface-100">
            <div className="flex flex-col items-center gap-3 mb-4">
              <p className="text-surface-600 flex items-center gap-2">
                <span className="text-red-500">❤️</span>
                <span>Sevgiyle öğrenciler için tasarlandı</span>
                <span className="text-red-500">❤️</span>
              </p>
            </div>
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-surface-500 text-sm">
              <p>© 2026 Tekn<span className="text-primary-500">okul</span>. Tüm hakları saklıdır.</p>
              <div className="flex gap-4">
                <Link href="/yasal/gizlilik" className="hover:text-primary-500">Gizlilik</Link>
                <Link href="/yasal/kullanim-kosullari" className="hover:text-primary-500">Koşullar</Link>
                <Link href="/yasal/kvkk" className="hover:text-primary-500">KVKK</Link>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Custom styles for marquee animation */}
      <style jsx>{`
        @keyframes marquee {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        .animate-marquee {
          animation: marquee 20s linear infinite;
        }
      `}</style>
    </div>
  )
}
