'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { getInitials } from '@/lib/utils'
import { motion } from 'framer-motion'
import { 
  Trophy, Medal, Crown, Star, Target, Zap,
  TrendingUp, Users, BookOpen, GraduationCap,
  ChevronRight, Flame, Award, BarChart3, MapPin,
  Building2, School, Globe, Filter
} from 'lucide-react'
import { TurkeyCity, LeaderboardEntry, Subject } from '@/types/database'

interface SubjectLeader {
  student_id: string
  full_name: string
  avatar_url: string | null
  points: number
  correct: number
  wrong: number
  total: number
  success_rate: number
  rank: number
}

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

// Sınıf bazlı ders filtreleme - MEB Müfredatı
const gradeSubjectsMap: Record<string, string[]> = {
  // İlkokul 1-3: Temel dersler
  '1': ['turkce', 'matematik', 'hayat_bilgisi', 'gorsel_sanatlar', 'muzik', 'beden_egitimi'],
  '2': ['turkce', 'matematik', 'hayat_bilgisi', 'ingilizce', 'gorsel_sanatlar', 'muzik', 'beden_egitimi'],
  '3': ['turkce', 'matematik', 'hayat_bilgisi', 'fen_bilimleri', 'ingilizce', 'gorsel_sanatlar', 'muzik', 'beden_egitimi'],
  // İlkokul 4: Hayat Bilgisi yerine Fen ve Sosyal
  '4': ['turkce', 'matematik', 'fen_bilimleri', 'sosyal_bilgiler', 'ingilizce', 'din_kulturu', 'gorsel_sanatlar', 'muzik', 'beden_egitimi', 'trafik'],
  // Ortaokul 5-7
  '5': ['turkce', 'matematik', 'fen_bilimleri', 'sosyal_bilgiler', 'ingilizce', 'din_kulturu', 'gorsel_sanatlar', 'muzik', 'beden_egitimi', 'bilisim'],
  '6': ['turkce', 'matematik', 'fen_bilimleri', 'sosyal_bilgiler', 'ingilizce', 'din_kulturu', 'gorsel_sanatlar', 'muzik', 'beden_egitimi', 'bilisim'],
  '7': ['turkce', 'matematik', 'fen_bilimleri', 'sosyal_bilgiler', 'ingilizce', 'din_kulturu', 'gorsel_sanatlar', 'muzik', 'beden_egitimi', 'teknoloji_tasarim'],
  // 8. Sınıf (LGS)
  '8': ['turkce', 'matematik', 'fen_bilimleri', 'inkilap_tarihi', 'ingilizce', 'din_kulturu'],
  // Lise 9-11
  '9': ['edebiyat', 'matematik', 'fizik', 'kimya', 'biyoloji', 'tarih', 'cografya', 'ingilizce', 'din_kulturu', 'gorsel_sanatlar', 'muzik', 'beden_egitimi'],
  '10': ['edebiyat', 'matematik', 'fizik', 'kimya', 'biyoloji', 'tarih', 'cografya', 'ingilizce', 'din_kulturu', 'felsefe'],
  '11': ['edebiyat', 'matematik', 'fizik', 'kimya', 'biyoloji', 'tarih', 'cografya', 'ingilizce', 'din_kulturu', 'felsefe'],
  // 12. Sınıf (YKS)
  '12': ['edebiyat', 'matematik', 'fizik', 'kimya', 'biyoloji', 'tarih', 'cografya', 'ingilizce', 'din_kulturu', 'felsefe'],
}

interface SchoolOption {
  id: string
  name: string
  district_id: string
}

interface DistrictOption {
  id: string
  name: string
  city_id: string
}

export default function LeaderboardPage() {
  const [activeTab, setActiveTab] = useState('genel')
  const [activeScope, setActiveScope] = useState('turkey')
  const [selectedCity, setSelectedCity] = useState<string>('')
  const [selectedDistrict, setSelectedDistrict] = useState<string>('')
  const [selectedSchool, setSelectedSchool] = useState<string>('')
  const [selectedGrade, setSelectedGrade] = useState<string>('') // '' = tümü
  const [cities, setCities] = useState<TurkeyCity[]>([])
  const [districts, setDistricts] = useState<DistrictOption[]>([])
  const [schools, setSchools] = useState<SchoolOption[]>([])
  const [subjects, setSubjects] = useState<SubjectOption[]>([])
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [subjectLeaders, setSubjectLeaders] = useState<SubjectLeader[]>([])
  const [loading, setLoading] = useState(true)
  const [totalStudents, setTotalStudents] = useState(0)
  const [totalQuestions, setTotalQuestions] = useState(0)
  
  // Auth state
  const [user, setUser] = useState<any>(null)
  const [userProfile, setUserProfile] = useState<any>(null)

  const supabase = createClient()

  // Auth durumunu kontrol et
  useEffect(() => {
    async function checkAuth() {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
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
          .select('*')
          .eq('id', session.user.id)
          .single()
        setUserProfile(profile)
      } else {
        setUserProfile(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  // İlleri ve dersleri yükle
  useEffect(() => {
    async function loadCities() {
      const { data } = await supabase
        .from('turkey_cities')
        .select('*')
        .order('name')
      if (data) setCities(data)
    }

    async function loadSubjects() {
      // Sadece temel MEB müfredatı dersleri
      const allowedSubjects = [
        'turkce', 'matematik', 'hayat_bilgisi', 'fen_bilimleri', 
        'sosyal_bilgiler', 'ingilizce', 'din_kulturu',
        'edebiyat', 'fizik', 'kimya', 'biyoloji',
        'tarih', 'cografya', 'inkilap_tarihi', 'felsefe',
        'gorsel_sanatlar', 'muzik', 'beden_egitimi',
        'bilisim', 'teknoloji_tasarim'
      ]
      
      const { data } = await supabase
        .from('subjects')
        .select('id, name, code, icon, color')
        .in('code', allowedSubjects)
        .order('name')
      if (data) setSubjects(data as SubjectOption[])
    }

    loadCities()
    loadSubjects()
  }, [])

  // İl seçildiğinde ilçeleri yükle
  useEffect(() => {
    async function loadDistricts() {
      if (!selectedCity) {
        setDistricts([])
        setSelectedDistrict('')
        setSchools([])
        setSelectedSchool('')
        return
      }
      
      const { data } = await supabase
        .from('turkey_districts')
        .select('id, name, city_id')
        .eq('city_id', selectedCity)
        .order('name')
      
      if (data) setDistricts(data)
    }
    
    loadDistricts()
  }, [selectedCity])

  // İlçe seçildiğinde okulları yükle
  useEffect(() => {
    async function loadSchools() {
      if (!selectedDistrict) {
        setSchools([])
        setSelectedSchool('')
        return
      }
      
      const { data: schoolsData } = await supabase
        .from('schools')
        .select('id, name, district_id')
        .eq('district_id', selectedDistrict)
        .order('name')
        .limit(500)
      
      if (schoolsData) setSchools(schoolsData)
    }
    
    loadSchools()
  }, [selectedDistrict])

  useEffect(() => {
    loadLeaderboard()
  }, [activeTab, activeScope, selectedCity, selectedDistrict, selectedSchool, selectedGrade])

  const loadLeaderboard = async () => {
    setLoading(true)

    // 🔒 GUARD: İl bazlı modda il seçilmeden veri gösterme
    if (activeScope === 'city' && !selectedCity) {
      setLeaderboard([])
      setSubjectLeaders([])
      setTotalStudents(0)
      setTotalQuestions(0)
      setLoading(false)
      return
    }

    // 🔒 GUARD: İlçe bazlı modda il veya ilçe seçilmeden veri gösterme
    if (activeScope === 'district' && (!selectedCity || !selectedDistrict)) {
      setLeaderboard([])
      setSubjectLeaders([])
      setTotalStudents(0)
      setTotalQuestions(0)
      setLoading(false)
      return
    }

    // 🔒 GUARD: Okul bazlı modda il, ilçe veya okul seçilmeden veri gösterme
    if (activeScope === 'school' && (!selectedCity || !selectedDistrict || !selectedSchool)) {
      setLeaderboard([])
      setSubjectLeaders([])
      setTotalStudents(0)
      setTotalQuestions(0)
      setLoading(false)
      return
    }

    if (activeTab === 'genel') {
      if (activeScope === 'turkey') {
        // Türkiye liderliği - doğrudan student_points'tan çek
        const { data } = await supabase
          .from('student_points')
          .select(`
            student_id,
            total_points,
            total_questions,
            total_correct,
            total_wrong,
            max_streak,
            student:student_profiles!student_points_student_id_fkey(
              user_id,
              grade,
              profile:profiles!student_profiles_user_id_fkey(full_name, avatar_url),
              city:turkey_cities!student_profiles_city_id_fkey(name),
              district:turkey_districts!student_profiles_district_id_fkey(name),
              school:schools!student_profiles_school_id_fkey(name)
            )
          `)
          .gt('total_questions', 0)
          .order('total_points', { ascending: false })
          .limit(200)

        if (data) {
          let filteredData = data
          
          // Sınıf filtrelemesi uygula
          if (selectedGrade !== '') {
            const gradeNum = parseInt(selectedGrade)
            if (!isNaN(gradeNum)) {
              filteredData = data.filter((item: any) => item.student?.grade === gradeNum)
            }
          }

          const formatted: LeaderboardEntry[] = filteredData.map((item: any, index: number) => ({
            student_id: item.student_id,
            full_name: item.student?.profile?.full_name || 'Anonim',
            avatar_url: item.student?.profile?.avatar_url,
            grade: item.student?.grade,
            city_name: item.student?.city?.name || null,
            district_name: item.student?.district?.name || null,
            school_name: item.student?.school?.name || null,
            total_points: item.total_points,
            total_questions: item.total_questions,
            total_correct: item.total_correct,
            total_wrong: item.total_wrong,
            max_streak: item.max_streak,
            success_rate: item.total_questions > 0 
              ? Math.round((item.total_correct / item.total_questions) * 100) 
              : 0,
            rank: index + 1,
          }))
          setLeaderboard(formatted)
          setTotalStudents(formatted.length)
          setTotalQuestions(formatted.reduce((acc, item) => acc + item.total_questions, 0))
        }
      } else if (activeScope === 'city' && selectedCity) {
        // İl liderliği - doğrudan student_points'tan çek
        const { data } = await supabase
          .from('student_points')
          .select(`
            student_id,
            total_points,
            total_questions,
            total_correct,
            total_wrong,
            max_streak,
            student:student_profiles!student_points_student_id_fkey(
              user_id,
              grade,
              city_id,
              district_id,
              school_id,
              profile:profiles!student_profiles_user_id_fkey(full_name, avatar_url),
              city:turkey_cities!student_profiles_city_id_fkey(name),
              district:turkey_districts!student_profiles_district_id_fkey(name),
              school:schools!student_profiles_school_id_fkey(name)
            )
          `)
          .gt('total_questions', 0)
          .order('total_points', { ascending: false })
          .limit(500)

        if (data) {
          // İl'e göre filtrele
          let filteredData = data.filter((item: any) => item.student?.city_id === selectedCity)
          
          // Sınıf filtrelemesi uygula
          if (selectedGrade !== '') {
            const gradeNum = parseInt(selectedGrade)
            if (!isNaN(gradeNum)) {
              filteredData = filteredData.filter((item: any) => item.student?.grade === gradeNum)
            }
          }

          const formatted: LeaderboardEntry[] = filteredData.map((item: any, index: number) => ({
            student_id: item.student_id,
            full_name: item.student?.profile?.full_name || 'Anonim',
            avatar_url: item.student?.profile?.avatar_url,
            grade: item.student?.grade,
            city_name: item.student?.city?.name,
            district_name: item.student?.district?.name,
            school_name: item.student?.school?.name,
            total_points: item.total_points,
            total_questions: item.total_questions,
            total_correct: item.total_correct,
            total_wrong: item.total_wrong,
            max_streak: item.max_streak,
            success_rate: item.total_questions > 0 
              ? Math.round((item.total_correct / item.total_questions) * 100) 
              : 0,
            rank: index + 1
          }))
          setLeaderboard(formatted)
          setTotalStudents(formatted.length)
          setTotalQuestions(formatted.reduce((acc, item) => acc + item.total_questions, 0))
        }
      } else if (activeScope === 'district' && selectedDistrict) {
        // İlçe liderliği
        const { data } = await supabase
          .from('student_points')
          .select(`
            student_id,
            total_points,
            total_questions,
            total_correct,
            total_wrong,
            max_streak,
            student:student_profiles!student_points_student_id_fkey(
              user_id,
              grade,
              city_id,
              district_id,
              school_id,
              profile:profiles!student_profiles_user_id_fkey(full_name, avatar_url),
              city:turkey_cities!student_profiles_city_id_fkey(name),
              district:turkey_districts!student_profiles_district_id_fkey(name),
              school:schools!student_profiles_school_id_fkey(name)
            )
          `)
          .gt('total_questions', 0)
          .order('total_points', { ascending: false })
          .limit(500)

        if (data) {
          // İlçeye göre filtrele
          let filteredData = data.filter((item: any) => item.student?.district_id === selectedDistrict)
          
          // Sınıf filtrelemesi uygula
          if (selectedGrade !== '') {
            const gradeNum = parseInt(selectedGrade)
            if (!isNaN(gradeNum)) {
              filteredData = filteredData.filter((item: any) => item.student?.grade === gradeNum)
            }
          }

          const formatted: LeaderboardEntry[] = filteredData.map((item: any, index: number) => ({
            student_id: item.student_id,
            full_name: item.student?.profile?.full_name || 'Anonim',
            avatar_url: item.student?.profile?.avatar_url,
            grade: item.student?.grade,
            city_name: item.student?.city?.name,
            district_name: item.student?.district?.name,
            school_name: item.student?.school?.name,
            total_points: item.total_points,
            total_questions: item.total_questions,
            total_correct: item.total_correct,
            total_wrong: item.total_wrong,
            max_streak: item.max_streak,
            success_rate: item.total_questions > 0 
              ? Math.round((item.total_correct / item.total_questions) * 100) 
              : 0,
            rank: index + 1
          }))
          setLeaderboard(formatted)
          setTotalStudents(formatted.length)
          setTotalQuestions(formatted.reduce((acc, item) => acc + item.total_questions, 0))
        }
      } else if (activeScope === 'school' && selectedSchool) {
        // Okul liderliği
        const { data } = await supabase
          .from('student_points')
          .select(`
            student_id,
            total_points,
            total_questions,
            total_correct,
            total_wrong,
            max_streak,
            student:student_profiles!student_points_student_id_fkey(
              user_id,
              grade,
              school_id,
              profile:profiles!student_profiles_user_id_fkey(full_name, avatar_url),
              city:turkey_cities!student_profiles_city_id_fkey(name),
              district:turkey_districts!student_profiles_district_id_fkey(name),
              school:schools!student_profiles_school_id_fkey(name)
            )
          `)
          .gt('total_questions', 0)
          .order('total_points', { ascending: false })
          .limit(500)

        if (data) {
          // Okula göre filtrele
          let filteredData = data.filter((item: any) => item.student?.school_id === selectedSchool)
          
          // Sınıf filtrelemesi uygula
          if (selectedGrade !== '') {
            const gradeNum = parseInt(selectedGrade)
            if (!isNaN(gradeNum)) {
              filteredData = filteredData.filter((item: any) => item.student?.grade === gradeNum)
            }
          }

          const formatted: LeaderboardEntry[] = filteredData.map((item: any, index: number) => ({
            student_id: item.student_id,
            full_name: item.student?.profile?.full_name || 'Anonim',
            avatar_url: item.student?.profile?.avatar_url,
            grade: item.student?.grade,
            city_name: item.student?.city?.name,
            district_name: item.student?.district?.name,
            school_name: item.student?.school?.name,
            total_points: item.total_points,
            total_questions: item.total_questions,
            total_correct: item.total_correct,
            total_wrong: item.total_wrong,
            max_streak: item.max_streak,
            success_rate: item.total_questions > 0 
              ? Math.round((item.total_correct / item.total_questions) * 100) 
              : 0,
            rank: index + 1
          }))
          setLeaderboard(formatted)
          setTotalStudents(formatted.length)
          setTotalQuestions(formatted.reduce((acc, item) => acc + item.total_questions, 0))
        }
      } else {
        // Fallback - tüm öğrenciler
        const { data } = await supabase
          .from('student_points')
          .select(`
            student_id,
            total_points,
            total_questions,
            total_correct,
            total_wrong,
            max_streak,
            student:student_profiles!student_points_student_id_fkey(
              user_id,
              grade,
              city_id,
              profile:profiles!student_profiles_user_id_fkey(full_name, avatar_url),
              city:turkey_cities!student_profiles_city_id_fkey(name),
              district:turkey_districts!student_profiles_district_id_fkey(name),
              school:schools!student_profiles_school_id_fkey(name)
            )
          `)
          .gt('total_questions', 0)
          .order('total_points', { ascending: false })
          .limit(200)

        if (data) {
          let filteredData = data
          
          // Sınıf filtrelemesi uygula
          if (selectedGrade !== '') {
            const gradeNum = parseInt(selectedGrade)
            if (!isNaN(gradeNum)) {
              filteredData = data.filter((item: any) => item.student?.grade === gradeNum)
            }
          }
          
          const formatted: LeaderboardEntry[] = filteredData.map((item: any, index: number) => ({
            student_id: item.student_id,
            full_name: item.student?.profile?.full_name || 'Anonim',
            avatar_url: item.student?.profile?.avatar_url,
            grade: item.student?.grade,
            city_name: item.student?.city?.name || null,
            district_name: item.student?.district?.name || null,
            school_name: item.student?.school?.name || null,
            total_points: item.total_points,
            total_questions: item.total_questions,
            total_correct: item.total_correct,
            total_wrong: item.total_wrong,
            max_streak: item.max_streak,
            success_rate: item.total_questions > 0 
              ? Math.round((item.total_correct / item.total_questions) * 100) 
              : 0,
            rank: index + 1
          }))
          setLeaderboard(formatted)
          setTotalStudents(formatted.length)
          setTotalQuestions(formatted.reduce((acc, item) => acc + item.total_questions, 0))
        }
      }
    } else {
      // Ders bazlı liderlik
      // Mevcut student_points tablosunda desteklenen dersler
      const subjectMap: Record<string, { points: string; correct: string; wrong: string }> = {
        'matematik': { points: 'matematik_points', correct: 'matematik_correct', wrong: 'matematik_wrong' },
        'turkce': { points: 'turkce_points', correct: 'turkce_correct', wrong: 'turkce_wrong' },
        'fen_bilimleri': { points: 'fen_points', correct: 'fen_correct', wrong: 'fen_wrong' },
        'inkilap_tarihi': { points: 'inkilap_points', correct: 'inkilap_correct', wrong: 'inkilap_wrong' },
        'din_kulturu': { points: 'din_points', correct: 'din_correct', wrong: 'din_wrong' },
        'ingilizce': { points: 'ingilizce_points', correct: 'ingilizce_correct', wrong: 'ingilizce_wrong' },
      }

      const cols = subjectMap[activeTab]
      if (cols) {
        const { data } = await supabase
          .from('student_points')
          .select(`
            student_id,
            ${cols.points},
            ${cols.correct},
            ${cols.wrong},
            student:student_profiles!student_points_student_id_fkey(
              user_id,
              grade,
              profile:profiles!student_profiles_user_id_fkey(full_name, avatar_url)
            )
          `)
          .gt(cols.correct, 0)
          .order(cols.points, { ascending: false })
          .limit(100)

        if (data) {
          let filteredData = data
          
          // Sınıf filtrelemesi
          if (selectedGrade !== '') {
            const gradeNum = parseInt(selectedGrade)
            if (!isNaN(gradeNum)) {
              filteredData = data.filter((item: any) => item.student?.grade === gradeNum)
            }
          }

          const formatted = filteredData.map((item: any, index: number) => {
            const correct = item[cols.correct] || 0
            const wrong = item[cols.wrong] || 0
            const total = correct + wrong
            return {
              student_id: item.student_id,
              full_name: item.student?.profile?.full_name || 'Anonim',
              avatar_url: item.student?.profile?.avatar_url,
              points: item[cols.points] || 0,
              correct,
              wrong,
              total,
              success_rate: total > 0 ? Math.round((correct / total) * 100) : 0,
              rank: index + 1
            }
          })
          setSubjectLeaders(formatted)
        }
      } else {
        // Bu ders için henüz ayrı istatistik yok
        setSubjectLeaders([])
      }
    }

    setLoading(false)
  }

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

        {/* İstatistikler */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-500/20 rounded-lg flex items-center justify-center">
                <Users className="h-5 w-5 text-indigo-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-white">{totalStudents}</div>
                <div className="text-xs text-white/50">Aktif Öğrenci</div>
              </div>
            </div>
          </div>
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                <Target className="h-5 w-5 text-green-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-white">{totalQuestions.toLocaleString()}</div>
                <div className="text-xs text-white/50">Çözülen Soru</div>
              </div>
            </div>
          </div>
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                <Trophy className="h-5 w-5 text-yellow-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-white">
                  {leaderboard[0]?.total_points || 0}
                </div>
                <div className="text-xs text-white/50">En Yüksek Puan</div>
              </div>
            </div>
          </div>
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center">
                <Flame className="h-5 w-5 text-orange-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-white">
                  {Math.max(...leaderboard.map(l => l.max_streak), 0)}
                </div>
                <div className="text-xs text-white/50">En Uzun Seri</div>
              </div>
            </div>
          </div>
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
                  <option value="" className="bg-gray-900">İl Seçin</option>
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
                      <option value="" className="bg-gray-900">İlçe Seçin ({districts.length} ilçe)</option>
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
                      <option value="" className="bg-gray-900">Okul Seçin ({schools.length} okul)</option>
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
            
            {/* Dinamik dersler - sınıfa göre filtrelenmiş */}
            {subjects
              .filter(subject => {
                // Sınıf seçilmemişse tüm temel dersleri göster
                if (!selectedGrade) {
                  // Sadece ana dersleri göster
                  const mainSubjects = ['turkce', 'matematik', 'fen_bilimleri', 'sosyal_bilgiler', 'ingilizce', 'din_kulturu', 'inkilap_tarihi', 'edebiyat', 'fizik', 'kimya', 'biyoloji', 'tarih', 'cografya']
                  return mainSubjects.includes(subject.code)
                }
                // Sınıf seçilmişse sadece o sınıfın derslerini göster
                const gradeSubjects = gradeSubjectsMap[selectedGrade]
                return gradeSubjects?.includes(subject.code)
              })
              .map((subject) => (
              <button
                key={subject.id}
                onClick={() => setActiveTab(subject.code)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
                  activeTab === subject.code
                    ? `bg-gradient-to-r ${colorMap[subject.color] || 'from-indigo-500 to-indigo-600'} text-white shadow-lg`
                    : 'bg-white/10 text-white/60 hover:bg-white/20 hover:text-white'
                }`}
              >
                <span>{subject.icon}</span>
                {subject.name}
              </button>
            ))}
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
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-br from-yellow-500/20 to-amber-500/20 backdrop-blur-sm rounded-2xl p-8 border border-yellow-500/30 relative overflow-hidden"
                  >
                    <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-yellow-400/10 to-transparent"></div>
                    <div className="text-center relative">
                      <Crown className="h-10 w-10 text-yellow-400 mx-auto mb-3" />
                      <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-full flex items-center justify-center mx-auto mb-3 text-2xl font-bold text-white shadow-lg shadow-yellow-500/30 overflow-hidden">
                        {leaderboard[0].avatar_url ? (
                          <img src={leaderboard[0].avatar_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          getInitials(leaderboard[0].full_name)
                        )}
                      </div>
                      <div className="text-xl font-bold text-white mb-1">{leaderboard[0].full_name}</div>
                      {leaderboard[0].city_name && (
                        <div className="text-sm text-white/60 mb-2">{leaderboard[0].city_name}</div>
                      )}
                      <div className="text-3xl font-bold text-yellow-400">{leaderboard[0].total_points}</div>
                      <div className="text-sm text-white/50">puan</div>
                      <div className="flex items-center justify-center gap-4 mt-4 text-sm">
                        <span className="text-green-400">{leaderboard[0].total_correct} doğru</span>
                        <span className="text-white/30">|</span>
                        <span className="text-white/60">{leaderboard[0].total_questions} soru</span>
                      </div>
                    </div>
                  </motion.div>
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
              leaderboard.slice(3).map((entry, index) => (
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
                      {entry.city_name && <span className="mr-2">{entry.city_name}</span>}
                      {entry.grade && <span className="mr-2">{entry.grade}. Sınıf</span>}
                      • {entry.total_questions} soru • %{entry.success_rate} başarı
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-white">{entry.total_points}</div>
                    <div className="text-xs text-white/50">puan</div>
                  </div>
                </motion.div>
              ))
            ) : (
              subjectLeaders.map((entry, index) => (
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
                      {entry.correct} doğru / {entry.total} soru • %{entry.success_rate} başarı
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-white">{entry.points}</div>
                    <div className="text-xs text-white/50">puan</div>
                  </div>
                </motion.div>
              ))
            )}

            {/* Liste Boş */}
            {((activeTab === 'genel' && leaderboard.length === 0) || 
              (activeTab !== 'genel' && subjectLeaders.length === 0)) && (
              <div className="text-center py-16">
                <Trophy className="h-16 w-16 text-white/20 mx-auto mb-4" />
                <h3 className="text-xl font-medium text-white/60 mb-2">
                  {activeScope === 'city' && !selectedCity 
                    ? 'Lütfen bir il seçin' 
                    : activeScope === 'district' && !selectedDistrict
                    ? 'Lütfen bir ilçe seçin'
                    : activeScope === 'school' && !selectedSchool
                    ? 'Lütfen bir okul seçin'
                    : activeTab !== 'genel' && !['matematik', 'turkce', 'fen_bilimleri', 'inkilap_tarihi', 'din_kulturu', 'ingilizce'].includes(activeTab)
                    ? 'Bu ders için henüz liderlik tablosu oluşturulmadı'
                    : 'Henüz veri yok'}
                </h3>
                <p className="text-white/40">
                  {activeTab !== 'genel' && !['matematik', 'turkce', 'fen_bilimleri', 'inkilap_tarihi', 'din_kulturu', 'ingilizce'].includes(activeTab)
                    ? 'Yakında bu ders için de liderlik tablosu eklenecek!'
                    : activeScope === 'city' && !selectedCity 
                    ? '81 il arasından seçim yapın'
                    : activeScope === 'district' && !selectedDistrict
                    ? 'Önce il seçin, sonra ilçe seçin'
                    : activeScope === 'school' && !selectedSchool
                    ? 'Önce il ve ilçe seçin, sonra okul seçin'
                    : 'İlk soru çözen sen ol!'}
                </p>
              </div>
            )}
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
    </div>
  )
}
