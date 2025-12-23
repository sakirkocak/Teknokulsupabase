'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { createClient } from '@/lib/supabase/client'
import { useProfile, useStudentProfile } from '@/hooks/useProfile'
import { getInitials } from '@/lib/utils'
import { motion } from 'framer-motion'
import { 
  Trophy, Medal, Crown, Star, Target, Zap,
  TrendingUp, Users, BookOpen, Flame, Award,
  ChevronUp, ChevronDown, Minus, MapPin, School,
  Building2, Globe, GraduationCap, Filter
} from 'lucide-react'
import { LeaderboardEntry, TurkeyCity } from '@/types/database'

interface MyStats {
  total_points: number
  total_questions: number
  total_correct: number
  total_wrong: number
  current_streak: number
  max_streak: number
  matematik_points: number
  turkce_points: number
  fen_points: number
}

interface MyRanks {
  class_rank: number | null
  school_rank: number | null
  district_rank: number | null
  city_rank: number | null
  turkey_rank: number | null
}

// Ders seçenekleri
interface SubjectOption {
  id: string
  name: string
  code: string
  icon: string
}

const scopes = [
  { key: 'turkey', label: 'Türkiye', icon: Globe, color: 'from-red-500 to-red-600' },
  { key: 'city', label: 'İl', icon: MapPin, color: 'from-blue-500 to-blue-600' },
  { key: 'district', label: 'İlçe', icon: Building2, color: 'from-green-500 to-green-600' },
  { key: 'school', label: 'Okul', icon: School, color: 'from-purple-500 to-purple-600' },
  { key: 'class', label: 'Sınıf', icon: GraduationCap, color: 'from-amber-500 to-amber-600' },
]

// Sınıf filtreleri
const gradeFilters = [
  { label: 'Tümü', value: 0 },
  { label: '1. Sınıf', value: 1 },
  { label: '2. Sınıf', value: 2 },
  { label: '3. Sınıf', value: 3 },
  { label: '4. Sınıf', value: 4 },
  { label: '5. Sınıf', value: 5 },
  { label: '6. Sınıf', value: 6 },
  { label: '7. Sınıf', value: 7 },
  { label: '8. Sınıf (LGS)', value: 8 },
  { label: '9. Sınıf', value: 9 },
  { label: '10. Sınıf', value: 10 },
  { label: '11. Sınıf', value: 11 },
  { label: '12. Sınıf (YKS)', value: 12 },
]

export default function StudentLeaderboardPage() {
  const { profile } = useProfile()
  const { studentProfile } = useStudentProfile(profile?.id || '')
  
  const [activeScope, setActiveScope] = useState('school') // Varsayılan: Okul
  const [selectedGradeFilter, setSelectedGradeFilter] = useState<number | null>(null) // null = henüz yüklenmedi
  const [selectedSubject, setSelectedSubject] = useState<string>('genel') // 'genel' veya subject_id
  const [availableSubjects, setAvailableSubjects] = useState<SubjectOption[]>([])
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [myStats, setMyStats] = useState<MyStats | null>(null)
  const [myRanks, setMyRanks] = useState<MyRanks | null>(null)
  const [loading, setLoading] = useState(true)
  const [locationInfo, setLocationInfo] = useState<{
    city_name: string | null
    district_name: string | null
    school_name: string | null
    grade: number | null
  }>({ city_name: null, district_name: null, school_name: null, grade: null })

  const supabase = createClient()

  // Öğrenci profili yüklendiğinde varsayılan sınıf filtresini ayarla
  useEffect(() => {
    if (selectedGradeFilter === null) {
      if (studentProfile?.grade) {
        setSelectedGradeFilter(studentProfile.grade)
        loadSubjectsForGrade(studentProfile.grade)
      } else if (studentProfile !== undefined) {
        // Profil yüklendi ama sınıf yok - tümünü göster
        setSelectedGradeFilter(0)
      }
    }
  }, [studentProfile?.grade, studentProfile])

  // Sınıf değiştiğinde dersleri yükle
  useEffect(() => {
    if (selectedGradeFilter && selectedGradeFilter > 0) {
      loadSubjectsForGrade(selectedGradeFilter)
      setSelectedSubject('genel') // Sınıf değişince genel'e dön
    }
  }, [selectedGradeFilter])

  useEffect(() => {
    if (studentProfile?.id && selectedGradeFilter !== null) {
      loadData()
      loadMyRanks()
      loadLocationInfo()
    }
  }, [studentProfile?.id, activeScope, selectedGradeFilter, selectedSubject])

  // Sınıfa göre dersleri yükle
  const loadSubjectsForGrade = async (grade: number) => {
    const { data } = await supabase
      .from('grade_subjects')
      .select(`
        subject:subjects(id, name, code, icon)
      `)
      .eq('grade_id', grade)

    if (data) {
      const subjects = data
        .map((item: any) => item.subject)
        .filter(Boolean)
        .sort((a: any, b: any) => a.name.localeCompare(b.name, 'tr'))
      setAvailableSubjects(subjects)
    }
  }

  const loadLocationInfo = async () => {
    if (!studentProfile?.id) return

    const { data } = await supabase
      .from('student_profiles')
      .select(`
        grade,
        city:turkey_cities(name),
        district:turkey_districts(name),
        school:schools(name)
      `)
      .eq('id', studentProfile.id)
      .single()

    if (data) {
      setLocationInfo({
        city_name: (data.city as any)?.name || null,
        district_name: (data.district as any)?.name || null,
        school_name: (data.school as any)?.name || null,
        grade: data.grade
      })
    }
  }

  const loadMyRanks = async () => {
    if (!studentProfile?.id) return

    // Türkiye sıralaması
    const { data: turkeyData } = await supabase
      .from('leaderboard_turkey')
      .select('turkey_rank')
      .eq('student_id', studentProfile.id)
      .single()

    // İl sıralaması
    const { data: cityData } = await supabase
      .from('leaderboard_by_city')
      .select('city_rank')
      .eq('student_id', studentProfile.id)
      .single()

    // İlçe sıralaması
    const { data: districtData } = await supabase
      .from('leaderboard_by_district')
      .select('district_rank')
      .eq('student_id', studentProfile.id)
      .single()

    // Okul sıralaması
    const { data: schoolData } = await supabase
      .from('leaderboard_by_school')
      .select('school_rank')
      .eq('student_id', studentProfile.id)
      .single()

    // Sınıf sıralaması
    const { data: classData } = await supabase
      .from('leaderboard_by_classroom')
      .select('class_rank')
      .eq('student_id', studentProfile.id)
      .single()

    setMyRanks({
      turkey_rank: turkeyData?.turkey_rank || null,
      city_rank: cityData?.city_rank || null,
      district_rank: districtData?.district_rank || null,
      school_rank: schoolData?.school_rank || null,
      class_rank: classData?.class_rank || null,
    })
  }

  const loadData = async () => {
    if (!studentProfile?.id) return
    setLoading(true)

    // Kendi istatistiklerimi al
    const { data: myPointsData } = await supabase
      .from('student_points')
      .select('*')
      .eq('student_id', studentProfile.id)
      .single()

    if (myPointsData) {
      setMyStats({
        total_points: myPointsData.total_points || 0,
        total_questions: myPointsData.total_questions || 0,
        total_correct: myPointsData.total_correct || 0,
        total_wrong: myPointsData.total_wrong || 0,
        current_streak: myPointsData.current_streak || 0,
        max_streak: myPointsData.max_streak || 0,
        matematik_points: myPointsData.matematik_points || 0,
        turkce_points: myPointsData.turkce_points || 0,
        fen_points: myPointsData.fen_points || 0,
      })
    }

    // Sınıf filtresi - null veya number
    const gradeFilter = selectedGradeFilter && selectedGradeFilter > 0 ? selectedGradeFilter : null

    // Genel liderlik için veritabanı fonksiyonlarını kullan
    if (selectedSubject === 'genel') {
      let data: any[] | null = null
      let error: any = null

      // Scope'a göre uygun fonksiyonu çağır
      if (activeScope === 'turkey') {
        const result = await supabase.rpc('get_leaderboard_turkey', {
          p_grade_filter: gradeFilter,
          p_limit: 100
        })
        data = result.data
        error = result.error
      } else if (activeScope === 'city' && studentProfile.city_id) {
        const result = await supabase.rpc('get_leaderboard_by_city', {
          p_city_id: studentProfile.city_id,
          p_grade_filter: gradeFilter,
          p_limit: 100
        })
        data = result.data
        error = result.error
      } else if (activeScope === 'district' && studentProfile.district_id) {
        const result = await supabase.rpc('get_leaderboard_by_district', {
          p_district_id: studentProfile.district_id,
          p_grade_filter: gradeFilter,
          p_limit: 100
        })
        data = result.data
        error = result.error
      } else if (activeScope === 'school' && studentProfile.school_id) {
        const result = await supabase.rpc('get_leaderboard_by_school', {
          p_school_id: studentProfile.school_id,
          p_grade_filter: gradeFilter,
          p_limit: 100
        })
        data = result.data
        error = result.error
      } else if (activeScope === 'class' && studentProfile.school_id && studentProfile.grade) {
        const result = await supabase.rpc('get_leaderboard_by_classroom', {
          p_school_id: studentProfile.school_id,
          p_grade: studentProfile.grade,
          p_limit: 100
        })
        data = result.data
        error = result.error
      }

      if (error) {
        console.error('Liderlik tablosu yüklenirken hata:', error)
        // Hata durumunda fallback yöntemini kullan
        await loadDataFallback()
        return
      }

      if (data && data.length > 0) {
        const formatted: LeaderboardEntry[] = data.map((item: any) => ({
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
          max_streak: item.max_streak,
          success_rate: Number(item.success_rate) || 0,
          rank: Number(item.rank),
        }))
        setLeaderboard(formatted)
      } else {
        setLeaderboard([])
      }
    } else {
      // Ders bazlı: student_subject_points tablosundan
      const { data, error } = await supabase
        .from('student_subject_points')
        .select('*')
        .eq('subject_id', selectedSubject)
        .gt('points', 0)
        .order('points', { ascending: false })
        .limit(200)

      if (error) {
        console.error('Ders puanları yüklenirken hata:', error)
        setSelectedSubject('genel')
        setLoading(false)
        return
      }

      if (!data || data.length === 0) {
        setLeaderboard([])
        setLoading(false)
        return
      }

      // Tüm student_id'leri al
      const studentIds = data.map(p => p.student_id)

      // Student profillerini çek
      const { data: studentsData } = await supabase
        .from('student_profiles')
        .select('id, grade, city_id, district_id, school_id, user_id')
        .in('id', studentIds)

      // Profile bilgilerini çek
      const userIds = studentsData?.map(s => s.user_id).filter(Boolean) || []
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .in('id', userIds)

      // Map'ler oluştur
      const studentMap = new Map(studentsData?.map(s => [s.id, s]) || [])
      const profileMap = new Map(profilesData?.map(p => [p.id, p]) || [])

      // Verileri birleştir ve filtrele
      let combined = data.map(points => {
        const student = studentMap.get(points.student_id)
        const profile = student ? profileMap.get(student.user_id) : null
        return {
          ...points,
          grade: student?.grade,
          city_id: student?.city_id,
          district_id: student?.district_id,
          school_id: student?.school_id,
          full_name: profile?.full_name || 'Anonim',
          avatar_url: profile?.avatar_url,
        }
      })

      // Scope filtreleri
      if (activeScope === 'city' && studentProfile.city_id) {
        combined = combined.filter(item => item.city_id === studentProfile.city_id)
      } else if (activeScope === 'district' && studentProfile.district_id) {
        combined = combined.filter(item => item.district_id === studentProfile.district_id)
      } else if (activeScope === 'school' && studentProfile.school_id) {
        combined = combined.filter(item => item.school_id === studentProfile.school_id)
      } else if (activeScope === 'class' && studentProfile.school_id && studentProfile.grade) {
        combined = combined.filter(item => 
          item.school_id === studentProfile.school_id && item.grade === studentProfile.grade
        )
      }

      // Sınıf filtresi
      if (gradeFilter) {
        combined = combined.filter(item => item.grade === gradeFilter)
      }

      // Sırala ve formatla
      combined.sort((a, b) => (b.points || 0) - (a.points || 0))

      const formatted: LeaderboardEntry[] = combined.slice(0, 100).map((item, index) => {
        const totalQuestions = (item.correct_count || 0) + (item.wrong_count || 0)
        const totalCorrect = item.correct_count || 0
        
        return {
          student_id: item.student_id,
          full_name: item.full_name,
          avatar_url: item.avatar_url,
          grade: item.grade,
          city_name: null,
          district_name: null,
          school_name: null,
          total_points: item.points || 0,
          total_questions: totalQuestions,
          total_correct: totalCorrect,
          max_streak: 0,
          success_rate: totalQuestions > 0 
            ? Math.round((totalCorrect / totalQuestions) * 100) 
            : 0,
          rank: index + 1,
        }
      })

      setLeaderboard(formatted)
    }

    setLoading(false)
  }

  // Fallback fonksiyonu - veritabanı fonksiyonları çalışmazsa
  const loadDataFallback = async () => {
    const gradeFilter = selectedGradeFilter && selectedGradeFilter > 0 ? selectedGradeFilter : null

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
          profile:profiles!student_profiles_user_id_fkey(full_name, avatar_url)
        )
      `)
      .gt('total_questions', 0)
      .order('total_points', { ascending: false })
      .limit(500)

    if (data) {
      let filteredData = data

      // Scope filtreleri
      if (activeScope === 'city' && studentProfile?.city_id) {
        filteredData = filteredData.filter((item: any) => item.student?.city_id === studentProfile.city_id)
      } else if (activeScope === 'district' && studentProfile?.district_id) {
        filteredData = filteredData.filter((item: any) => item.student?.district_id === studentProfile.district_id)
      } else if (activeScope === 'school' && studentProfile?.school_id) {
        filteredData = filteredData.filter((item: any) => item.student?.school_id === studentProfile.school_id)
      } else if (activeScope === 'class' && studentProfile?.school_id && studentProfile?.grade) {
        filteredData = filteredData.filter((item: any) => 
          item.student?.school_id === studentProfile.school_id && item.student?.grade === studentProfile.grade
        )
      }

      // Sınıf filtresi
      if (gradeFilter) {
        filteredData = filteredData.filter((item: any) => item.student?.grade === gradeFilter)
      }

      const formatted: LeaderboardEntry[] = filteredData.slice(0, 100).map((item: any, index: number) => ({
        student_id: item.student_id,
        full_name: item.student?.profile?.full_name || 'Anonim',
        avatar_url: item.student?.profile?.avatar_url,
        grade: item.student?.grade,
        city_name: null,
        district_name: null,
        school_name: null,
        total_points: item.total_points,
        total_questions: item.total_questions,
        total_correct: item.total_correct,
        max_streak: item.max_streak,
        success_rate: item.total_questions > 0 
          ? Math.round((item.total_correct / item.total_questions) * 100) 
          : 0,
        rank: index + 1,
      }))
      setLeaderboard(formatted)
    }
    setLoading(false)
  }

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="h-6 w-6 text-yellow-400" />
    if (rank === 2) return <Medal className="h-6 w-6 text-gray-300" />
    if (rank === 3) return <Medal className="h-6 w-6 text-amber-600" />
    return <span className="text-lg font-bold text-surface-400">{rank}</span>
  }

  const getScopeTitle = () => {
    const subjectName = selectedSubject !== 'genel' 
      ? availableSubjects.find(s => s.id === selectedSubject)?.name 
      : null
    const subjectSuffix = subjectName ? ` - ${subjectName}` : ''
    
    switch (activeScope) {
      case 'turkey': return `Türkiye Liderlik Tablosu${subjectSuffix}`
      case 'city': return locationInfo.city_name ? `${locationInfo.city_name} İl Liderliği${subjectSuffix}` : `İl Liderliği${subjectSuffix}`
      case 'district': return locationInfo.district_name ? `${locationInfo.district_name} İlçe Liderliği${subjectSuffix}` : `İlçe Liderliği${subjectSuffix}`
      case 'school': return locationInfo.school_name ? `${locationInfo.school_name} Okul Liderliği${subjectSuffix}` : `Okul Liderliği${subjectSuffix}`
      case 'class': return locationInfo.grade ? `${locationInfo.grade}. Sınıf Liderliği${subjectSuffix}` : `Sınıf Liderliği${subjectSuffix}`
      default: return `Liderlik Tablosu${subjectSuffix}`
    }
  }

  const canAccessScope = (scope: string) => {
    switch (scope) {
      case 'turkey': return true
      case 'city': return !!studentProfile?.city_id
      case 'district': return !!studentProfile?.district_id
      case 'school': return !!studentProfile?.school_id
      case 'class': return !!studentProfile?.school_id && !!studentProfile?.grade
      default: return false
    }
  }

  // Profil henüz yüklenmemişse veya sınıf filtresi belirlenmemişse loading göster
  if (studentProfile === undefined || (loading && !myStats && selectedGradeFilter === null)) {
    return (
      <DashboardLayout role="ogrenci">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout role="ogrenci">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-surface-900 dark:text-white flex items-center gap-3">
              <Trophy className="h-8 w-8 text-yellow-500" />
              Liderlik Tablosu
            </h1>
            <p className="text-surface-500 mt-1">Sıralaman ve rakiplerin</p>
          </div>
          <Link 
            href="/liderlik" 
            target="_blank"
            className="text-sm text-primary-500 hover:text-primary-600 flex items-center gap-1"
          >
            Herkese açık sayfayı gör →
          </Link>
        </div>

        {/* Kendi Kartım */}
        {myStats && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card p-6 bg-gradient-to-r from-primary-500 to-primary-600 text-white"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center text-2xl font-bold overflow-hidden">
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    getInitials(profile?.full_name || '')
                  )}
                </div>
                <div>
                  <div className="text-lg font-bold">{profile?.full_name}</div>
                  <div className="text-primary-100 text-sm">
                    {locationInfo.school_name && <span>{locationInfo.school_name}</span>}
                    {locationInfo.grade && <span> • {locationInfo.grade}. Sınıf</span>}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-3xl font-bold">{myStats.total_points}</div>
                  <div className="text-xs text-primary-100">Toplam Puan</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold">{myStats.total_questions}</div>
                  <div className="text-xs text-primary-100">Çözülen Soru</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-300">{myStats.total_correct}</div>
                  <div className="text-xs text-primary-100">Doğru</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold flex items-center justify-center gap-1">
                    <Flame className="h-6 w-6 text-orange-300" />
                    {myStats.current_streak}
                  </div>
                  <div className="text-xs text-primary-100">Seri</div>
                </div>
              </div>
            </div>

            {/* Sıralamalar */}
            {myRanks && (
              <div className="mt-4 pt-4 border-t border-white/20">
                <div className="text-sm text-primary-100 mb-2">Sıralamalarım</div>
                <div className="flex flex-wrap gap-3">
                  {myRanks.class_rank && (
                    <div className="bg-white/10 px-3 py-1.5 rounded-full text-sm flex items-center gap-1">
                      <GraduationCap className="w-4 h-4" />
                      Sınıf: #{myRanks.class_rank}
                    </div>
                  )}
                  {myRanks.school_rank && (
                    <div className="bg-white/10 px-3 py-1.5 rounded-full text-sm flex items-center gap-1">
                      <School className="w-4 h-4" />
                      Okul: #{myRanks.school_rank}
                    </div>
                  )}
                  {myRanks.district_rank && (
                    <div className="bg-white/10 px-3 py-1.5 rounded-full text-sm flex items-center gap-1">
                      <Building2 className="w-4 h-4" />
                      İlçe: #{myRanks.district_rank}
                    </div>
                  )}
                  {myRanks.city_rank && (
                    <div className="bg-white/10 px-3 py-1.5 rounded-full text-sm flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      İl: #{myRanks.city_rank}
                    </div>
                  )}
                  {myRanks.turkey_rank && (
                    <div className="bg-white/10 px-3 py-1.5 rounded-full text-sm flex items-center gap-1">
                      <Globe className="w-4 h-4" />
                      Türkiye: #{myRanks.turkey_rank}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Konum bilgisi yoksa uyarı */}
            {!studentProfile?.city_id && (
              <div className="mt-4 pt-4 border-t border-white/20">
                <Link 
                  href="/ogrenci/profil" 
                  className="flex items-center gap-2 text-sm text-amber-300 hover:text-amber-200"
                >
                  <MapPin className="w-4 h-4" />
                  Profilinden il/ilçe/okul bilgilerini ekle ve tüm sıralamalarda yer al!
                </Link>
              </div>
            )}
          </motion.div>
        )}

        {/* Henüz soru çözmediyse */}
        {!myStats && (
          <div className="card p-8 text-center">
            <Trophy className="h-16 w-16 text-surface-300 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-surface-900 dark:text-white mb-2">
              Henüz puan kazanmadın
            </h2>
            <p className="text-surface-500 mb-6">
              Soru çözerek puan kazan ve liderlik tablosunda yerini al!
            </p>
            <Link href="/ogrenci/soru-bankasi" className="btn btn-primary btn-lg">
              Soru Çözmeye Başla
            </Link>
          </div>
        )}

        {/* Filtreler */}
        <div className="card p-4 space-y-4">
          {/* Scope Seçimi */}
          <div>
            <p className="text-sm font-medium text-surface-500 mb-2">Kapsam</p>
            <div className="flex flex-wrap gap-2">
              {scopes.map((scope) => {
                const canAccess = canAccessScope(scope.key)
                return (
                  <button
                    key={scope.key}
                    onClick={() => canAccess && setActiveScope(scope.key)}
                    disabled={!canAccess}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                      activeScope === scope.key
                        ? `bg-gradient-to-r ${scope.color} text-white shadow-lg`
                        : canAccess
                        ? 'bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-300 hover:bg-surface-200 dark:hover:bg-surface-700'
                        : 'bg-surface-100 dark:bg-surface-800 text-surface-400 cursor-not-allowed opacity-50'
                    }`}
                  >
                    <scope.icon className="h-4 w-4" />
                    {scope.label}
                    {!canAccess && <span className="text-xs">(Profil eksik)</span>}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Ders Seçimi */}
          <div>
            <p className="text-sm font-medium text-surface-500 mb-2">Ders</p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedSubject('genel')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                  selectedSubject === 'genel'
                    ? 'bg-gradient-to-r from-yellow-500 to-amber-600 text-white shadow-lg'
                    : 'bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-300 hover:bg-surface-200 dark:hover:bg-surface-700'
                }`}
              >
                <Trophy className="h-4 w-4" />
                Tüm Dersler
              </button>
              {availableSubjects.map((subject) => (
                <button
                  key={subject.id}
                  onClick={() => setSelectedSubject(subject.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                    selectedSubject === subject.id
                      ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg'
                      : 'bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-300 hover:bg-surface-200 dark:hover:bg-surface-700'
                  }`}
                >
                  <span>{subject.icon || '📚'}</span>
                  {subject.name}
                </button>
              ))}
            </div>
          </div>

          {/* Sınıf Filtresi */}
          <div>
            <p className="text-sm font-medium text-surface-500 mb-2">
              Sınıf Filtresi 
              {studentProfile?.grade && (
                <span className="text-xs ml-2 text-primary-500">(Senin sınıfın: {studentProfile.grade})</span>
              )}
            </p>
            <div className="flex flex-wrap gap-2">
              {gradeFilters.map((filter) => {
                const isSelected = selectedGradeFilter === filter.value
                const isMyGrade = filter.value === studentProfile?.grade
                return (
                  <button
                    key={filter.value}
                    onClick={() => setSelectedGradeFilter(filter.value)}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${
                      isSelected
                        ? 'bg-indigo-500 text-white shadow-lg'
                        : isMyGrade
                        ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 border-2 border-indigo-300 dark:border-indigo-700'
                        : 'bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-300 hover:bg-surface-200 dark:hover:bg-surface-700'
                    }`}
                  >
                    {filter.label}
                    {isMyGrade && !isSelected && <span className="ml-1 text-xs">★</span>}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Liderlik Listesi */}
        <div className="card overflow-hidden">
          <div className="p-4 border-b border-surface-200 dark:border-surface-700">
            <h3 className="font-semibold text-surface-900 dark:text-white flex items-center gap-2">
              <Award className="h-5 w-5 text-primary-500" />
              {getScopeTitle()}
            </h3>
            <p className="text-xs text-surface-500 mt-1">
              {selectedSubject === 'genel' 
                ? '📚 Tüm derslerden kazanılan puanlar dahildir' 
                : `📖 Sadece ${availableSubjects.find(s => s.id === selectedSubject)?.name || 'seçili ders'} puanları`
              }
            </p>
          </div>
          
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" />
            </div>
          ) : (
            <div className="divide-y divide-surface-100 dark:divide-surface-700">
              {leaderboard.map((entry, index) => {
                const isMe = entry.student_id === studentProfile?.id
                
                return (
                  <motion.div
                    key={entry.student_id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.02 }}
                    className={`flex items-center gap-4 p-4 transition-all ${
                      isMe ? 'bg-primary-50 dark:bg-primary-900/20' : 'hover:bg-surface-50 dark:hover:bg-surface-800'
                    }`}
                  >
                    <div className="w-10 h-10 flex items-center justify-center">
                      {getRankIcon(entry.rank)}
                    </div>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white overflow-hidden ${
                      isMe ? 'bg-primary-500' : 'bg-indigo-500'
                    }`}>
                      {entry.avatar_url ? (
                        <img src={entry.avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        getInitials(entry.full_name)
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={`font-medium truncate ${isMe ? 'text-primary-600 dark:text-primary-400' : 'text-surface-900 dark:text-white'}`}>
                        {entry.full_name}
                        {isMe && <span className="ml-2 text-xs bg-primary-500 text-white px-2 py-0.5 rounded-full">Sen</span>}
                      </div>
                      <div className="text-sm text-surface-500">
                        {activeScope === 'turkey' && entry.city_name && (
                          <span className="mr-2">{entry.city_name}</span>
                        )}
                        {(activeScope === 'city' || activeScope === 'turkey') && entry.school_name && (
                          <span className="mr-2">{entry.school_name}</span>
                        )}
                        {entry.grade && <span className="mr-2">{entry.grade}. Sınıf</span>}
                        <span>• {entry.total_questions} soru • %{entry.success_rate} başarı</span>
                        {entry.max_streak > 0 && (
                          <span className="ml-2 text-orange-500">
                            🔥 {entry.max_streak}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-xl font-bold ${isMe ? 'text-primary-600 dark:text-primary-400' : 'text-surface-900 dark:text-white'}`}>
                        {entry.total_points}
                      </div>
                      <div className="text-xs text-surface-400">puan</div>
                    </div>
                  </motion.div>
                )
              })}

              {leaderboard.length === 0 && (
                <div className="p-12 text-center">
                  <Trophy className="h-12 w-12 text-surface-300 mx-auto mb-3" />
                  <p className="text-surface-500">
                    {!canAccessScope(activeScope) 
                      ? 'Bu liderlik tablosunu görmek için profil bilgilerini tamamla'
                      : 'Henüz kimse soru çözmemiş'}
                  </p>
                  {!canAccessScope(activeScope) && (
                    <Link href="/ogrenci/profil" className="btn btn-primary mt-4">
                      Profili Tamamla
                    </Link>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Puan Bilgisi */}
        <div className="card p-4 bg-surface-50 dark:bg-surface-800">
          <div className="flex items-center gap-3 text-sm text-surface-600 dark:text-surface-400">
            <div className="flex items-center gap-1">
              <span className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-bold">+2</span>
              Doğru cevap
            </div>
            <div className="flex items-center gap-1">
              <span className="w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-bold">-1</span>
              Yanlış cevap
            </div>
            <div className="flex items-center gap-1 ml-auto">
              <Flame className="h-4 w-4 text-orange-500" />
              Seri = Üst üste doğru
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
