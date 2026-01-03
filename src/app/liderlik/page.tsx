'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { getInitials } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Trophy, Medal, Crown, Star, Target, Zap,
  TrendingUp, Users, BookOpen, GraduationCap,
  ChevronRight, Flame, Award, BarChart3, MapPin,
  Building2, School, Globe, Filter, Radio
} from 'lucide-react'
import { LeaderboardEntry } from '@/types/database'
// ⚡ ŞIMŞEK HIZ - Doğrudan Typesense'e bağlan!
import { isTypesenseEnabled } from '@/lib/typesense/browser-client'
// 🎮 Real-time özellikler
import { useLeaderboardPolling, LeaderboardDiff } from '@/hooks/useLeaderboardPolling'
import { useTypesenseLocations } from '@/hooks/useTypesenseLocations'
import { 
  AnimatedNumber, 
  LiveActivityFeed, 
  RankChangeIndicator,
  RankHighlight,
  LeaderBadges,
  StreakIndicator,
  LeaderboardConfetti
} from '@/components/leaderboard'

// SubjectLeader interface kaldırıldı - artık ders bazlı liderlik de
// LeaderboardEntry tipini kullanıyor (Typesense polling ile)

interface SubjectOption {
  id: string
  code: string
  name: string
  icon: string
  color: string
}

const scopes = [
  { key: 'turkey', label: 'Türkiye', icon: Globe },
  { key: 'city', label: 'İl Bazlı', icon: MapPin },
  { key: 'district', label: 'İlçe Bazlı', icon: Building2 },
  { key: 'school', label: 'Okul Bazlı', icon: School },
]

// Renk haritası
const colorMap: Record<string, string> = {
  blue: 'from-blue-500 to-blue-600',
  red: 'from-red-500 to-rose-600',
  green: 'from-green-500 to-emerald-600',
  emerald: 'from-emerald-500 to-emerald-600',
  amber: 'from-amber-500 to-amber-600',
  orange: 'from-orange-500 to-orange-600',
  purple: 'from-purple-500 to-purple-600',
  pink: 'from-pink-500 to-pink-600',
  cyan: 'from-cyan-500 to-cyan-600',
  indigo: 'from-indigo-500 to-indigo-600',
  yellow: 'from-yellow-500 to-yellow-600',
  teal: 'from-teal-500 to-teal-600',
  lime: 'from-lime-500 to-lime-600',
  violet: 'from-violet-500 to-violet-600',
  slate: 'from-slate-500 to-slate-600',
  sky: 'from-sky-500 to-sky-600',
  rose: 'from-rose-500 to-rose-600',
  gray: 'from-gray-500 to-gray-600',
}

// 🎯 Typesense'de liderlik puanı olan dersler (TÜM DERSLER!)
const SUPPORTED_LEADERBOARD_SUBJECTS = [
  // Ana dersler (LGS/Ortaokul)
  'matematik', 'turkce', 'fen_bilimleri', 'inkilap_tarihi', 'din_kulturu', 'ingilizce',
  'sosyal_bilgiler', 'hayat_bilgisi',
  // Lise dersleri
  'edebiyat', 'fizik', 'kimya', 'biyoloji', 'tarih', 'cografya', 'felsefe',
  // Diğer dersler
  'gorsel_sanatlar', 'muzik', 'beden_egitimi', 'bilisim', 'teknoloji_tasarim'
]

// 📚 Varsayılan ders sıralaması - ortaokul dersleri önce!
const DEFAULT_SUBJECT_ORDER = [
  // Öncelikli dersler (ortaokul/LGS)
  'matematik', 'turkce', 'fen_bilimleri', 'ingilizce', 'din_kulturu', 'inkilap_tarihi',
  // Diğer dersler (lise/alfabetik)
  'biyoloji', 'cografya', 'edebiyat', 'felsefe', 'fizik', 'kimya', 'tarih',
  'hayat_bilgisi', 'sosyal_bilgiler', 'gorsel_sanatlar', 'muzik', 'beden_egitimi', 'bilisim', 'teknoloji_tasarim'
]

// Sınıf bazlı ders filtreleme - MEB Müfredatı
const gradeSubjectsMap: Record<string, string[]> = {
  // İlkokul 1-3: Temel dersler
  '1': ['turkce', 'matematik', 'hayat_bilgisi', 'gorsel_sanatlar', 'muzik', 'beden_egitimi'],
  '2': ['turkce', 'matematik', 'hayat_bilgisi', 'ingilizce', 'gorsel_sanatlar', 'muzik', 'beden_egitimi'],
  '3': ['turkce', 'matematik', 'hayat_bilgisi', 'fen_bilimleri', 'ingilizce', 'gorsel_sanatlar', 'muzik', 'beden_egitimi'],
  // İlkokul 4: Hayat Bilgisi yerine Fen ve Sosyal
  '4': ['turkce', 'matematik', 'fen_bilimleri', 'sosyal_bilgiler', 'ingilizce', 'din_kulturu', 'gorsel_sanatlar', 'muzik', 'beden_egitimi'],
  // Ortaokul 5-7
  '5': ['turkce', 'matematik', 'fen_bilimleri', 'sosyal_bilgiler', 'ingilizce', 'din_kulturu', 'gorsel_sanatlar', 'muzik', 'beden_egitimi', 'bilisim'],
  '6': ['turkce', 'matematik', 'fen_bilimleri', 'sosyal_bilgiler', 'ingilizce', 'din_kulturu', 'gorsel_sanatlar', 'muzik', 'beden_egitimi', 'bilisim'],
  '7': ['turkce', 'matematik', 'fen_bilimleri', 'sosyal_bilgiler', 'ingilizce', 'din_kulturu', 'gorsel_sanatlar', 'muzik', 'beden_egitimi', 'teknoloji_tasarim'],
  // 8. Sınıf (LGS + Diğer dersler)
  '8': ['turkce', 'matematik', 'fen_bilimleri', 'inkilap_tarihi', 'teknoloji_tasarim', 'ingilizce', 'din_kulturu', 'gorsel_sanatlar', 'muzik', 'beden_egitimi'],
  // Lise 9-12
  '9': ['matematik', 'edebiyat', 'fizik', 'kimya', 'biyoloji', 'tarih', 'cografya', 'ingilizce', 'din_kulturu'],
  '10': ['matematik', 'edebiyat', 'fizik', 'kimya', 'biyoloji', 'tarih', 'cografya', 'ingilizce', 'din_kulturu', 'felsefe'],
  '11': ['matematik', 'edebiyat', 'fizik', 'kimya', 'biyoloji', 'tarih', 'cografya', 'ingilizce', 'din_kulturu', 'felsefe'],
  '12': ['matematik', 'edebiyat', 'fizik', 'kimya', 'biyoloji', 'tarih', 'cografya', 'ingilizce', 'din_kulturu', 'felsefe'],
}

// SchoolOption ve DistrictOption interface'leri kaldırıldı
// Artık useTypesenseLocations hook'tan LocationEntry ve SchoolEntry kullanılıyor

export default function LeaderboardPage() {
  const [activeTab, setActiveTab] = useState('genel')
  const [activeScope, setActiveScope] = useState('turkey')
  const [selectedGrade, setSelectedGrade] = useState<string>('') // '' = tümü
  const [subjects, setSubjects] = useState<SubjectOption[]>([])
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [totalStudents, setTotalStudents] = useState(0)
  const [totalQuestions, setTotalQuestions] = useState(0)
  
  // Auth state
  const [user, setUser] = useState<any>(null)
  const [userProfile, setUserProfile] = useState<any>(null)
  
  // 🗺️ Typesense'den il/ilçe/okul - Artık tamamen Typesense!
  const {
    cities,
    districts,
    schools,
    selectedCity,
    selectedDistrict,
    selectedSchool,
    setSelectedCity,
    setSelectedDistrict,
    setSelectedSchool,
    citiesLoading,
    districtsLoading,
    schoolsLoading,
    resetSelection
  } = useTypesenseLocations()
  
  // 🎮 Real-time polling - Typesense'den her 5 saniyede güncelleme
  const pollingFilters = useMemo(() => ({
    scope: activeScope as 'turkey' | 'city' | 'district' | 'school',
    cityId: selectedCity || null,
    districtId: selectedDistrict || null,
    schoolId: selectedSchool || null,
    grade: selectedGrade ? parseInt(selectedGrade) : null,
    limit: 100
  }), [activeScope, selectedCity, selectedDistrict, selectedSchool, selectedGrade])
  
  // Polling her zaman aktif (genel ve ders bazlı)
  const shouldPoll = isTypesenseEnabled()
  
  // Ders kodu (genel ise null)
  const currentSubject = activeTab === 'genel' ? null : activeTab
  
  const { 
    leaderboard: polledLeaderboard,
    stats: polledStats,
    diffs,
    activities,
    loading: pollingLoading,
    lastUpdated
  } = useLeaderboardPolling({
    filters: pollingFilters,
    subject: currentSubject,
    pollingInterval: 5000, // 5 saniye
    enabled: shouldPoll
  })
  
  // Polling verilerini kullan (hem genel hem ders bazlı)
  useEffect(() => {
    if (shouldPoll && polledLeaderboard.length > 0) {
      const formatted: LeaderboardEntry[] = polledLeaderboard.map((item) => ({
        student_id: item.student_id,
        full_name: item.full_name || 'Anonim',
        avatar_url: item.avatar_url,
        grade: item.grade,
        city_name: item.city_name || null,
        district_name: item.district_name || null,
        school_name: item.school_name || null,
        total_points: item.total_points,
        total_questions: item.total_questions,
        total_correct: item.total_correct,
        total_wrong: item.total_wrong,
        max_streak: item.max_streak,
        success_rate: item.total_questions > 0 
          ? (item.total_correct / item.total_questions) * 100 
          : 0,
        rank: item.rank,
      }))
      setLeaderboard(formatted)
      setTotalStudents(polledStats.totalStudents)
      setTotalQuestions(polledStats.totalQuestions)
      setLoading(false)
    } else if (shouldPoll && polledLeaderboard.length === 0 && !pollingLoading) {
      setLeaderboard([])
      setTotalStudents(0)
      setTotalQuestions(0)
      setLoading(false)
    }
  }, [shouldPoll, polledLeaderboard, polledStats, pollingLoading])
  
  // Diff'leri sıra değişimi için map'e dönüştür
  const diffMap = useMemo(() => {
    const map = new Map<string, LeaderboardDiff>()
    diffs.forEach(diff => map.set(diff.studentId, diff))
    return map
  }, [diffs])

  // Supabase client - sadece bir kez oluştur
  const supabase = useMemo(() => createClient(), [])

  // Auth durumunu kontrol et
  useEffect(() => {
    async function checkAuth() {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url, role')
          .eq('id', user.id)
          .single()
        setUserProfile(profile)
      }
    }
    
    checkAuth()
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user || null)
      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url, role')
          .eq('id', session.user.id)
          .single()
        setUserProfile(profile)
      } else {
        setUserProfile(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  // 📚 Dersleri yükle (Supabase'den - sabit veri)
  useEffect(() => {
    async function loadSubjects() {
      try {
        // Sadece temel MEB müfredatı dersleri
        const allowedSubjects = [
          'turkce', 'matematik', 'hayat_bilgisi', 'fen_bilimleri', 
          'sosyal_bilgiler', 'ingilizce', 'din_kulturu',
          'edebiyat', 'fizik', 'kimya', 'biyoloji',
          'tarih', 'cografya', 'inkilap_tarihi', 'felsefe',
          'gorsel_sanatlar', 'muzik', 'beden_egitimi',
          'bilisim', 'teknoloji_tasarim'
        ]
        
        const { data, error } = await supabase
          .from('subjects')
          .select('id, name, code, icon, color')
          .in('code', allowedSubjects)
          .order('name')
        
        if (error) {
          console.error('Dersler yüklenirken hata:', error)
          return
        }
        
        if (data) setSubjects(data as SubjectOption[])
      } catch (err) {
        console.error('Dersler yüklenirken beklenmeyen hata:', err)
      }
    }

    loadSubjects()
  }, [supabase])

  // 🗺️ İl/İlçe/Okul artık useTypesenseLocations hook'undan geliyor
  // 🎮 Liderlik verisi useLeaderboardPolling hook'undan geliyor (hem genel hem ders bazlı)

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="h-6 w-6 text-yellow-400" />
    if (rank === 2) return <Medal className="h-6 w-6 text-gray-300" />
    if (rank === 3) return <Medal className="h-6 w-6 text-amber-600" />
    return <span className="text-lg font-bold text-white/60">{rank}</span>
  }

  const getRankStyle = (rank: number) => {
    if (rank === 1) return 'bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border-yellow-500/50'
    if (rank === 2) return 'bg-gradient-to-r from-gray-400/20 to-gray-500/20 border-gray-400/50'
    if (rank === 3) return 'bg-gradient-to-r from-amber-600/20 to-orange-600/20 border-amber-600/50'
    return 'bg-white/5 border-white/10 hover:bg-white/10'
  }

  const getSelectedCityName = () => {
    const city = cities.find(c => c.id === selectedCity)
    return city?.name || 'İl'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-indigo-950 to-purple-950">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/20 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-white">
              Tekn<span className="text-primary-400">okul</span>
            </span>
          </Link>
          <div className="flex items-center gap-3">
            {user && userProfile ? (
              <Link 
                href={userProfile.role === 'admin' ? '/admin' : userProfile.role === 'ogretmen' ? '/koc' : userProfile.role === 'veli' ? '/veli' : '/ogrenci'}
                className="flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors"
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
            ) : (
              <>
                <Link href="/giris" className="px-4 py-2 text-white/70 hover:text-white transition-colors">
                  Giriş Yap
                </Link>
                <Link href="/kayit" className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors">
                  Kayıt Ol
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Hero */}
        <div className="text-center mb-12">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-yellow-500/30"
          >
            <Trophy className="h-10 w-10 text-white" />
          </motion.div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Liderlik Tablosu
          </h1>
          <p className="text-xl text-white/60 max-w-2xl mx-auto">
            En çok soru çözen ve en yüksek puana sahip öğrencileri keşfet!
          </p>
        </div>

        {/* 🔴 Canlı Gösterge */}
        {shouldPoll && (
          <div className="flex items-center justify-center gap-2 mb-4">
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
              className="w-2 h-2 bg-green-500 rounded-full"
            />
            <span className="text-sm text-green-400 font-medium">CANLI</span>
            <span className="text-xs text-white/40">
              • Her 5 saniyede güncelleniyor
              {lastUpdated && ` • Son: ${lastUpdated.toLocaleTimeString('tr-TR')}`}
            </span>
          </div>
        )}

        {/* İstatistikler - Animasyonlu */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <motion.div 
            className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10 relative overflow-hidden"
            whileHover={{ scale: 1.02 }}
            transition={{ type: 'spring', stiffness: 300 }}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-500/20 rounded-lg flex items-center justify-center">
                <Users className="h-5 w-5 text-indigo-400" />
              </div>
              <div>
                {loading && !shouldPoll ? (
                  <div className="h-8 w-16 bg-white/10 rounded animate-pulse" />
                ) : (
                  <div className="text-2xl font-bold text-white">
                    <AnimatedNumber value={totalStudents} />
                  </div>
                )}
                <div className="text-xs text-white/50">Aktif Öğrenci</div>
              </div>
            </div>
          </motion.div>
          <motion.div 
            className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10 relative overflow-hidden"
            whileHover={{ scale: 1.02 }}
            transition={{ type: 'spring', stiffness: 300 }}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                <Target className="h-5 w-5 text-green-400" />
              </div>
              <div>
                {loading && !shouldPoll ? (
                  <div className="h-8 w-16 bg-white/10 rounded animate-pulse" />
                ) : (
                  <div className="text-2xl font-bold text-white">
                    <AnimatedNumber value={totalQuestions} />
                  </div>
                )}
                <div className="text-xs text-white/50">Çözülen Soru</div>
              </div>
            </div>
          </motion.div>
          <motion.div 
            className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10 relative overflow-hidden"
            whileHover={{ scale: 1.02 }}
            transition={{ type: 'spring', stiffness: 300 }}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                <Trophy className="h-5 w-5 text-yellow-400" />
              </div>
              <div>
                {loading && !shouldPoll ? (
                  <div className="h-8 w-16 bg-white/10 rounded animate-pulse" />
                ) : (
                  <div className="text-2xl font-bold text-white">
                    <AnimatedNumber value={leaderboard[0]?.total_points || 0} />
                  </div>
                )}
                <div className="text-xs text-white/50">En Yüksek Puan</div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Sınıf Filtresi */}
        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10 mb-6">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-indigo-400" />
              <span className="text-sm font-medium text-white/70">Sınıf:</span>
            </div>
            <select
              value={selectedGrade}
              onChange={(e) => setSelectedGrade(e.target.value)}
              className="px-4 py-2 rounded-lg bg-white/10 text-white border border-white/20 focus:outline-none focus:border-indigo-500 cursor-pointer min-w-[160px]"
            >
              <option value="" className="bg-gray-900">Tüm Sınıflar</option>
              <option value="1" className="bg-gray-900">1. Sınıf</option>
              <option value="2" className="bg-gray-900">2. Sınıf</option>
              <option value="3" className="bg-gray-900">3. Sınıf</option>
              <option value="4" className="bg-gray-900">4. Sınıf</option>
              <option value="5" className="bg-gray-900">5. Sınıf</option>
              <option value="6" className="bg-gray-900">6. Sınıf</option>
              <option value="7" className="bg-gray-900">7. Sınıf</option>
              <option value="8" className="bg-gray-900">8. Sınıf (LGS)</option>
              <option value="9" className="bg-gray-900">9. Sınıf</option>
              <option value="10" className="bg-gray-900">10. Sınıf</option>
              <option value="11" className="bg-gray-900">11. Sınıf</option>
              <option value="12" className="bg-gray-900">12. Sınıf (YKS)</option>
            </select>
          </div>
        </div>

        {/* 🎮 Canlı Aktivite Akışı */}
        {shouldPoll && activities.length > 0 && (
          <div className="mb-6">
            <LiveActivityFeed activities={activities} maxItems={5} />
          </div>
        )}

        {/* Scope ve Tab Seçimi */}
        <div className="flex flex-col gap-4 mb-8">
          {/* Scope */}
          <div className="flex flex-wrap gap-2">
            {scopes.map((scope) => (
              <button
                key={scope.key}
                onClick={() => {
                  setActiveScope(scope.key)
                  if (scope.key === 'turkey') {
                    setSelectedCity('')
                    setSelectedDistrict('')
                    setSelectedSchool('')
                  }
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                  activeScope === scope.key
                    ? 'bg-white text-gray-900 shadow-lg'
                    : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
                }`}
              >
                <scope.icon className="h-4 w-4" />
                {scope.label}
              </button>
            ))}
          </div>

          {/* Kademeli Seçim: İl → İlçe → Okul */}
          {(activeScope === 'city' || activeScope === 'district' || activeScope === 'school') && (
            <div className="flex flex-wrap gap-3 items-center bg-white/5 rounded-xl p-4 border border-white/10">
              {/* İl Seçimi */}
              <div className="flex flex-col gap-1">
                <label className="text-xs text-white/50 flex items-center gap-1">
                  <MapPin className="h-3 w-3" /> İl
                </label>
                <select
                  value={selectedCity}
                  onChange={(e) => {
                    setSelectedCity(e.target.value)
                    setSelectedDistrict('')
                    setSelectedSchool('')
                  }}
                  className="px-4 py-2 rounded-lg bg-white/10 text-white border border-white/20 focus:outline-none focus:border-primary-500 min-w-[160px]"
                >
                  <option value="" className="bg-gray-900">{citiesLoading ? 'Yükleniyor...' : 'İl Seçin'}</option>
                  {cities.map(city => (
                    <option key={city.id} value={city.id} className="bg-gray-900">{city.name}</option>
                  ))}
                </select>
              </div>

              {/* İlçe Seçimi */}
              {(activeScope === 'district' || activeScope === 'school') && selectedCity && (
                <>
                  <ChevronRight className="h-5 w-5 text-white/30 hidden sm:block" />
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-white/50 flex items-center gap-1">
                      <Building2 className="h-3 w-3" /> İlçe
                    </label>
                    <select
                      value={selectedDistrict}
                      onChange={(e) => {
                        setSelectedDistrict(e.target.value)
                        setSelectedSchool('')
                      }}
                      className="px-4 py-2 rounded-lg bg-white/10 text-white border border-white/20 focus:outline-none focus:border-primary-500 min-w-[180px]"
                    >
                      <option value="" className="bg-gray-900">{districtsLoading ? 'Yükleniyor...' : `İlçe Seçin (${districts.length} ilçe)`}</option>
                      {districts.map(district => (
                        <option key={district.id} value={district.id} className="bg-gray-900">{district.name}</option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              {/* Okul Seçimi */}
              {activeScope === 'school' && selectedDistrict && (
                <>
                  <ChevronRight className="h-5 w-5 text-white/30 hidden sm:block" />
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-white/50 flex items-center gap-1">
                      <School className="h-3 w-3" /> Okul
                    </label>
                    <select
                      value={selectedSchool}
                      onChange={(e) => setSelectedSchool(e.target.value)}
                      className="px-4 py-2 rounded-lg bg-white/10 text-white border border-white/20 focus:outline-none focus:border-primary-500 min-w-[280px]"
                    >
                      <option value="" className="bg-gray-900">{schoolsLoading ? 'Yükleniyor...' : `Okul Seçin (${schools.length} okul)`}</option>
                      {schools.map(school => (
                        <option key={school.id} value={school.id} className="bg-gray-900">{school.name}</option>
                      ))}
                    </select>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Ders Tab'ları */}
        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <BookOpen className="h-5 w-5 text-indigo-400" />
            <span className="text-sm font-medium text-white/70">
              Ders Filtresi 
              {selectedGrade && <span className="text-indigo-400 ml-1">({selectedGrade}. Sınıf Müfredatı)</span>}
            </span>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {/* Genel butonu */}
            <button
              onClick={() => setActiveTab('genel')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
                activeTab === 'genel'
                  ? 'bg-gradient-to-r from-yellow-500 to-amber-600 text-white shadow-lg'
                  : 'bg-white/10 text-white/60 hover:bg-white/20 hover:text-white'
              }`}
            >
              <Trophy className="h-4 w-4" />
              Genel
            </button>
            
            {/* Dinamik dersler - sınıfa göre filtrelenmiş ve sıralanmış */}
            {subjects
              .filter(subject => {
                // Sınıf seçilmemişse sadece desteklenen dersleri göster (ortaokul öncelikli)
                if (!selectedGrade) {
                  return SUPPORTED_LEADERBOARD_SUBJECTS.includes(subject.code)
                }
                // Sınıf seçilmişse sadece o sınıfın derslerini göster
                const gradeSubjects = gradeSubjectsMap[selectedGrade]
                return gradeSubjects?.includes(subject.code)
              })
              // Sırala - DEFAULT_SUBJECT_ORDER'a göre
              .sort((a, b) => {
                const aIndex = DEFAULT_SUBJECT_ORDER.indexOf(a.code)
                const bIndex = DEFAULT_SUBJECT_ORDER.indexOf(b.code)
                // Listede yoksa sona at
                const aOrder = aIndex === -1 ? 999 : aIndex
                const bOrder = bIndex === -1 ? 999 : bIndex
                return aOrder - bOrder
              })
              .map((subject) => {
                const isSupported = SUPPORTED_LEADERBOARD_SUBJECTS.includes(subject.code)
                return (
              <button
                key={subject.id}
                onClick={() => setActiveTab(subject.code)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
                  activeTab === subject.code
                    ? `bg-gradient-to-r ${colorMap[subject.color] || 'from-indigo-500 to-indigo-600'} text-white shadow-lg`
                    : isSupported 
                      ? 'bg-white/10 text-white/60 hover:bg-white/20 hover:text-white'
                      : 'bg-white/5 text-white/40 hover:bg-white/10 hover:text-white/60'
                }`}
                title={!isSupported ? 'Bu ders için henüz liderlik tablosu yok' : undefined}
              >
                <span>{subject.icon}</span>
                {subject.name}
                {!isSupported && <span className="text-xs opacity-50">🔒</span>}
              </button>
            )})}
          </div>
          
          {/* LGS/YKS Sınav Bilgisi */}
          {selectedGrade === '8' && (
            <div className="mt-3 px-3 py-2 bg-orange-500/20 border border-orange-500/30 rounded-lg">
              <p className="text-sm text-orange-300">
                📚 <strong>LGS Sınavı:</strong> Türkçe, Matematik, Fen Bilimleri, T.C. İnkılap Tarihi, İngilizce, Din Kültürü
              </p>
            </div>
          )}
          {selectedGrade === '12' && (
            <div className="mt-3 px-3 py-2 bg-purple-500/20 border border-purple-500/30 rounded-lg">
              <p className="text-sm text-purple-300">
                🎓 <strong>YKS Sınavı:</strong> TYT (Temel) + AYT (Alan) dersleri
              </p>
            </div>
          )}
        </div>

        {/* Başlık */}
        {activeScope === 'city' && selectedCity && (
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
            <MapPin className="h-6 w-6 text-primary-400" />
            {cities.find(c => c.id === selectedCity)?.name} İl Liderliği
          </h2>
        )}

        {activeScope === 'district' && selectedDistrict && (
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
            <Building2 className="h-6 w-6 text-green-400" />
            {districts.find(d => d.id === selectedDistrict)?.name} İlçe Liderliği
            <span className="text-sm font-normal text-white/50 ml-2">
              ({cities.find(c => c.id === selectedCity)?.name})
            </span>
          </h2>
        )}

        {activeScope === 'school' && selectedSchool && (
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
            <School className="h-6 w-6 text-purple-400" />
            {schools.find(s => s.id === selectedSchool)?.name} Okul Liderliği
          </h2>
        )}

        {/* Liderlik Listesi */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
          </div>
        ) : (
          <div className="space-y-3">
            {/* İlk 3 - Özel Tasarım */}
            {activeTab === 'genel' && leaderboard.slice(0, 3).length > 0 && (
              <div className="grid md:grid-cols-3 gap-4 mb-8">
                {/* 2. Sıra (Solda) */}
                {leaderboard[1] && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-gradient-to-br from-gray-400/20 to-gray-500/20 backdrop-blur-sm rounded-2xl p-6 border border-gray-400/30 md:mt-8"
                  >
                    <div className="text-center">
                      <Medal className="h-8 w-8 text-gray-300 mx-auto mb-3" />
                      <div className="w-16 h-16 bg-gray-600 rounded-full flex items-center justify-center mx-auto mb-3 text-xl font-bold text-white overflow-hidden">
                        {leaderboard[1].avatar_url ? (
                          <img src={leaderboard[1].avatar_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          getInitials(leaderboard[1].full_name)
                        )}
                      </div>
                      <div className="font-bold text-white mb-1">{leaderboard[1].full_name}</div>
                      {leaderboard[1].city_name && (
                        <div className="text-xs text-white/50 mb-2">{leaderboard[1].city_name}</div>
                      )}
                      <div className="text-2xl font-bold text-gray-300">{leaderboard[1].total_points}</div>
                      <div className="text-xs text-white/50">puan</div>
                    </div>
                  </motion.div>
                )}

                {/* 1. Sıra (Ortada - En büyük) */}
                {leaderboard[0] && (
                  <RankHighlight change={diffMap.get(leaderboard[0].student_id)?.rankChange || 'same'}>
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-gradient-to-br from-yellow-500/20 to-amber-500/20 backdrop-blur-sm rounded-2xl p-8 border border-yellow-500/30 relative overflow-hidden"
                    >
                      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-yellow-400/10 to-transparent"></div>
                      <div className="text-center relative">
                        <motion.div
                          animate={{ rotate: [0, -10, 10, -10, 0] }}
                          transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                        >
                          <Crown className="h-10 w-10 text-yellow-400 mx-auto mb-3" />
                        </motion.div>
                        <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-full flex items-center justify-center mx-auto mb-3 text-2xl font-bold text-white shadow-lg shadow-yellow-500/30 overflow-hidden">
                          {leaderboard[0].avatar_url ? (
                            <img src={leaderboard[0].avatar_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            getInitials(leaderboard[0].full_name)
                          )}
                        </div>
                        <div className="flex items-center justify-center gap-2 mb-1">
                          <span className="text-xl font-bold text-white">{leaderboard[0].full_name}</span>
                          <LeaderBadges isKing={true} />
                        </div>
                        {leaderboard[0].city_name && (
                          <div className="text-sm text-white/60 mb-2">{leaderboard[0].city_name}</div>
                        )}
                        <div className="text-3xl font-bold text-yellow-400">
                          <AnimatedNumber value={leaderboard[0].total_points} showDelta />
                        </div>
                        <div className="text-sm text-white/50">puan</div>
                        {leaderboard[0].max_streak && leaderboard[0].max_streak >= 5 && (
                          <div className="mt-2">
                            <StreakIndicator streak={leaderboard[0].max_streak} />
                          </div>
                        )}
                        <div className="flex items-center justify-center gap-4 mt-4 text-sm">
                          <span className="text-green-400">{leaderboard[0].total_correct} doğru</span>
                          <span className="text-white/30">|</span>
                          <span className="text-white/60">{leaderboard[0].total_questions} soru</span>
                        </div>
                        {/* Sıra değişim göstergesi */}
                        {diffMap.get(leaderboard[0].student_id) && (
                          <div className="mt-2">
                            <RankChangeIndicator 
                              change={diffMap.get(leaderboard[0].student_id)!.rankChange}
                              delta={diffMap.get(leaderboard[0].student_id)!.rankDelta}
                            />
                          </div>
                        )}
                      </div>
                    </motion.div>
                  </RankHighlight>
                )}

                {/* 3. Sıra (Sağda) */}
                {leaderboard[2] && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-gradient-to-br from-amber-600/20 to-orange-600/20 backdrop-blur-sm rounded-2xl p-6 border border-amber-600/30 md:mt-8"
                  >
                    <div className="text-center">
                      <Medal className="h-8 w-8 text-amber-600 mx-auto mb-3" />
                      <div className="w-16 h-16 bg-amber-700 rounded-full flex items-center justify-center mx-auto mb-3 text-xl font-bold text-white overflow-hidden">
                        {leaderboard[2].avatar_url ? (
                          <img src={leaderboard[2].avatar_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          getInitials(leaderboard[2].full_name)
                        )}
                      </div>
                      <div className="font-bold text-white mb-1">{leaderboard[2].full_name}</div>
                      {leaderboard[2].city_name && (
                        <div className="text-xs text-white/50 mb-2">{leaderboard[2].city_name}</div>
                      )}
                      <div className="text-2xl font-bold text-amber-500">{leaderboard[2].total_points}</div>
                      <div className="text-xs text-white/50">puan</div>
                    </div>
                  </motion.div>
                )}
              </div>
            )}

            {/* Diğer Sıralar */}
            {activeTab === 'genel' ? (
              <AnimatePresence mode="popLayout">
                {leaderboard.slice(3).map((entry, index) => {
                  const diff = diffMap.get(entry.student_id)
                  return (
                    <RankHighlight key={entry.student_id} change={diff?.rankChange || 'same'}>
                      <motion.div
                        layout
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ delay: index * 0.03 }}
                        className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${getRankStyle(entry.rank)}`}
                      >
                        <div className="w-10 h-10 flex items-center justify-center relative">
                          {getRankIcon(entry.rank)}
                          {/* Sıra değişim göstergesi */}
                          {diff && diff.rankChange !== 'same' && (
                            <div className="absolute -top-1 -right-1">
                              <RankChangeIndicator 
                                change={diff.rankChange}
                                delta={diff.rankDelta}
                              />
                            </div>
                          )}
                        </div>
                        <div className="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center font-bold text-white overflow-hidden">
                          {entry.avatar_url ? (
                            <img src={entry.avatar_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            getInitials(entry.full_name)
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-white">{entry.full_name}</span>
                            {/* Hot streak ve roket badge'leri */}
                            <LeaderBadges 
                              rocketLevel={diff?.rankDelta}
                              isHot={diff && diff.pointsGained > 50}
                            />
                          </div>
                          <div className="text-sm text-white/50">
                            {entry.city_name && <span className="mr-2">{entry.city_name}</span>}
                            {entry.grade && <span className="mr-2">{entry.grade}. Sınıf</span>}
                            • {entry.total_questions} soru • %{Math.round(entry.success_rate)} başarı
                            {entry.max_streak >= 5 && (
                              <span className="ml-2">
                                <StreakIndicator streak={entry.max_streak} />
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xl font-bold text-white relative">
                            <AnimatedNumber value={entry.total_points} />
                            {/* Puan artış göstergesi */}
                            {diff && diff.pointsGained > 0 && (
                              <motion.span
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="absolute -top-4 right-0 text-xs text-green-400 font-medium"
                              >
                                +{diff.pointsGained}
                              </motion.span>
                            )}
                          </div>
                          <div className="text-xs text-white/50">puan</div>
                        </div>
                      </motion.div>
                    </RankHighlight>
                  )
                })}
              </AnimatePresence>
            ) : (
              /* Ders bazlı liderlik - artık aynı leaderboard verisi kullanılıyor (Typesense polling) */
              leaderboard.map((entry, index) => (
                <motion.div
                  key={entry.student_id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${getRankStyle(entry.rank)}`}
                >
                  <div className="w-10 h-10 flex items-center justify-center">
                    {getRankIcon(entry.rank)}
                  </div>
                  <div className="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center font-bold text-white overflow-hidden">
                    {entry.avatar_url ? (
                      <img src={entry.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      getInitials(entry.full_name)
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-white">{entry.full_name}</div>
                    <div className="text-sm text-white/50">
                      {entry.total_correct} doğru / {entry.total_questions} soru • %{Math.round(entry.success_rate || 0)} başarı
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-white">{entry.total_points}</div>
                    <div className="text-xs text-white/50">puan</div>
                  </div>
                </motion.div>
              ))
            )}

            {/* Liste Boş veya Desteklenmeyen Ders */}
            {(leaderboard.length === 0 && !loading) || (activeTab !== 'genel' && !SUPPORTED_LEADERBOARD_SUBJECTS.includes(activeTab)) ? (
              <div className="text-center py-16">
                {activeTab !== 'genel' && !SUPPORTED_LEADERBOARD_SUBJECTS.includes(activeTab) ? (
                  // Desteklenmeyen ders
                  <>
                    <div className="text-6xl mb-4">🔒</div>
                    <h3 className="text-xl font-medium text-white/60 mb-2">
                      Bu ders için henüz liderlik tablosu yok
                    </h3>
                    <p className="text-white/40 max-w-md mx-auto">
                      Şu an sadece <span className="text-indigo-400">Matematik, Türkçe, Fen Bilimleri, İngilizce, Din Kültürü ve İnkılap Tarihi</span> dersleri için liderlik tablosu var.
                      <br /><br />
                      Yakında diğer dersler de eklenecek! 🚀
                    </p>
                  </>
                ) : (
                  // Boş liste
                  <>
                    <Trophy className="h-16 w-16 text-white/20 mx-auto mb-4" />
                    <h3 className="text-xl font-medium text-white/60 mb-2">
                      {activeScope === 'city' && !selectedCity 
                        ? 'Lütfen bir il seçin' 
                        : activeScope === 'district' && !selectedDistrict
                        ? 'Lütfen bir ilçe seçin'
                        : activeScope === 'school' && !selectedSchool
                        ? 'Lütfen bir okul seçin'
                        : 'Henüz veri yok'}
                    </h3>
                    <p className="text-white/40">
                      {activeScope === 'city' && !selectedCity 
                        ? '81 il arasından seçim yapın'
                        : activeScope === 'district' && !selectedDistrict
                        ? 'Önce il seçin, sonra ilçe seçin'
                        : activeScope === 'school' && !selectedSchool
                        ? 'Önce il ve ilçe seçin, sonra okul seçin'
                        : 'İlk soru çözen sen ol!'}
                    </p>
                  </>
                )}
              </div>
            ) : null}
          </div>
        )}

        {/* CTA */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-12 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl p-8 text-center"
        >
          <h2 className="text-2xl font-bold text-white mb-2">
            🎯 Sen de yarışmaya katıl!
          </h2>
          <p className="text-white/80 mb-6 max-w-lg mx-auto">
            Soru çöz, puan kazan ve liderlik tablosunda yerini al. 
            Her doğru cevap +2, her yanlış cevap -1 puan!
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link 
              href="/kayit" 
              className="px-8 py-3 bg-white text-indigo-600 font-medium rounded-xl hover:bg-white/90 transition-colors flex items-center gap-2"
            >
              <Award className="h-5 w-5" />
              Ücretsiz Kayıt Ol
            </Link>
            <Link 
              href="/giris" 
              className="px-8 py-3 bg-white/10 text-white font-medium rounded-xl hover:bg-white/20 transition-colors"
            >
              Giriş Yap
            </Link>
          </div>
        </motion.div>

        {/* Liderlik Seviyeleri Bilgisi */}
        <div className="mt-8 bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Award className="h-5 w-5 text-primary-400" />
            Liderlik Seviyeleri
          </h3>
          <div className="grid sm:grid-cols-2 md:grid-cols-5 gap-4 text-sm">
            <div className="bg-white/5 rounded-lg p-3">
              <div className="flex items-center gap-2 text-amber-400 mb-1">
                <GraduationCap className="h-4 w-4" />
                <span className="font-medium">Sınıf Lideri</span>
              </div>
              <p className="text-white/60">Sınıfındaki 1. ol</p>
            </div>
            <div className="bg-white/5 rounded-lg p-3">
              <div className="flex items-center gap-2 text-purple-400 mb-1">
                <School className="h-4 w-4" />
                <span className="font-medium">Okul Şampiyonu</span>
              </div>
              <p className="text-white/60">Okulundaki 1. ol</p>
            </div>
            <div className="bg-white/5 rounded-lg p-3">
              <div className="flex items-center gap-2 text-green-400 mb-1">
                <Building2 className="h-4 w-4" />
                <span className="font-medium">İlçe Yıldızı</span>
              </div>
              <p className="text-white/60">İlçendeki 1. ol</p>
            </div>
            <div className="bg-white/5 rounded-lg p-3">
              <div className="flex items-center gap-2 text-blue-400 mb-1">
                <MapPin className="h-4 w-4" />
                <span className="font-medium">İl Efsanesi</span>
              </div>
              <p className="text-white/60">İlindeki 1. ol</p>
            </div>
            <div className="bg-white/5 rounded-lg p-3">
              <div className="flex items-center gap-2 text-red-400 mb-1">
                <Globe className="h-4 w-4" />
                <span className="font-medium">Türkiye 1.si</span>
              </div>
              <p className="text-white/60">Türkiye'de 1. ol</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* 🎊 Konfeti Efektleri - Sıra değişikliklerinde tetiklenir */}
      {shouldPoll && (
        <LeaderboardConfetti 
          diffs={diffs} 
          currentUserId={user?.id}
        />
      )}
    </div>
  )
}
