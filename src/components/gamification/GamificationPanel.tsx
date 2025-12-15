'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { motion } from 'framer-motion'
import { 
  Trophy, Star, Flame, Crown, Medal, Swords,
  Award, Sparkles, Target, Zap, Gift, Heart,
  MapPin, School, Building2, Globe, TrendingUp,
  GraduationCap, Rocket, BookOpen
} from 'lucide-react'

interface GamificationPanelProps {
  studentId: string
  grade: number | null
}

interface StudentStats {
  total_points: number
  total_questions: number
  total_correct: number
  current_streak: number
  max_streak: number
}

interface RankInfo {
  class_rank?: number
  school_rank?: number
  district_rank?: number
  city_rank?: number
  turkey_rank?: number
}

// Yaş grubu belirleme
function getAgeGroup(grade: number | null): 'minik' | 'rekabetci' | 'profesyonel' {
  if (!grade) return 'rekabetci'
  if (grade <= 4) return 'minik'
  if (grade <= 8) return 'rekabetci'
  return 'profesyonel'
}

// Lig bilgisi
function getLeagueInfo(points: number) {
  if (points >= 15000) return { name: 'Efsane', icon: '👑', color: 'from-red-500 to-red-600' }
  if (points >= 7000) return { name: 'Elmas', icon: '💠', color: 'from-violet-500 to-purple-600' }
  if (points >= 3500) return { name: 'Platin', icon: '💎', color: 'from-cyan-400 to-blue-500' }
  if (points >= 1500) return { name: 'Altın', icon: '🥇', color: 'from-yellow-400 to-amber-500' }
  if (points >= 500) return { name: 'Gümüş', icon: '🥈', color: 'from-gray-300 to-gray-400' }
  return { name: 'Bronz', icon: '🥉', color: 'from-amber-600 to-orange-700' }
}

export default function GamificationPanel({ studentId, grade }: GamificationPanelProps) {
  const [stats, setStats] = useState<StudentStats | null>(null)
  const [ranks, setRanks] = useState<RankInfo>({})
  const [badgeCount, setBadgeCount] = useState(0)
  const [loading, setLoading] = useState(true)
  
  const supabase = createClient()
  const ageGroup = getAgeGroup(grade)

  useEffect(() => {
    if (studentId) {
      loadData()
    }
  }, [studentId])

  const loadData = async () => {
    setLoading(true)

    // Puanları al
    const { data: pointsData } = await supabase
      .from('student_points')
      .select('*')
      .eq('student_id', studentId)
      .single()

    if (pointsData) {
      setStats({
        total_points: pointsData.total_points || 0,
        total_questions: pointsData.total_questions || 0,
        total_correct: pointsData.total_correct || 0,
        current_streak: pointsData.current_streak || 0,
        max_streak: pointsData.max_streak || 0,
      })
    }

    // Rozet sayısını al
    const { count } = await supabase
      .from('student_badges')
      .select('*', { count: 'exact', head: true })
      .eq('student_id', studentId)

    setBadgeCount(count || 0)

    // Sıralamaları al
    const rankData: RankInfo = {}

    const { data: turkeyRank } = await supabase
      .from('leaderboard_turkey')
      .select('turkey_rank')
      .eq('student_id', studentId)
      .single()
    if (turkeyRank) rankData.turkey_rank = turkeyRank.turkey_rank

    const { data: cityRank } = await supabase
      .from('leaderboard_by_city')
      .select('city_rank')
      .eq('student_id', studentId)
      .single()
    if (cityRank) rankData.city_rank = cityRank.city_rank

    const { data: schoolRank } = await supabase
      .from('leaderboard_by_school')
      .select('school_rank')
      .eq('student_id', studentId)
      .single()
    if (schoolRank) rankData.school_rank = schoolRank.school_rank

    const { data: classRank } = await supabase
      .from('leaderboard_by_classroom')
      .select('class_rank')
      .eq('student_id', studentId)
      .single()
    if (classRank) rankData.class_rank = classRank.class_rank

    setRanks(rankData)
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="card p-6 animate-pulse">
        <div className="h-32 bg-surface-200 dark:bg-surface-700 rounded-xl"></div>
      </div>
    )
  }

  const league = getLeagueInfo(stats?.total_points || 0)

  // Minik Kaşifler (1-4. Sınıf) - Renkli, eğlenceli
  if (ageGroup === 'minik') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card overflow-hidden"
      >
        {/* Renkli başlık */}
        <div className="bg-gradient-to-r from-pink-400 via-purple-400 to-indigo-400 p-6 text-white">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center text-4xl animate-bounce">
              🚀
            </div>
            <div>
              <div className="text-sm opacity-90">Macera Seviyesi</div>
              <div className="text-2xl font-bold">{league.name} Kaşif {league.icon}</div>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-4">
          {/* Yıldız puanları */}
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-yellow-100 to-amber-100 dark:from-yellow-900/20 dark:to-amber-900/20 rounded-2xl">
            <div className="flex items-center gap-3">
              <Star className="w-8 h-8 text-yellow-500 fill-yellow-500" />
              <span className="font-bold text-lg text-yellow-700 dark:text-yellow-400">Yıldızlarım</span>
            </div>
            <div className="text-3xl font-bold text-yellow-600">{stats?.total_points || 0} ⭐</div>
          </div>

          {/* İlerleme çubuğu */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-surface-600">Sonraki seviyeye</span>
              <span className="font-medium">%{Math.min(100, Math.round(((stats?.total_points || 0) % 500) / 5))}</span>
            </div>
            <div className="h-4 bg-surface-200 dark:bg-surface-700 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, Math.round(((stats?.total_points || 0) % 500) / 5))}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="h-full bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500"
              />
            </div>
          </div>

          {/* Başarılar */}
          <div className="grid grid-cols-3 gap-3">
            <Link href="/ogrenci/soru-bankasi" className="p-3 bg-green-100 dark:bg-green-900/20 rounded-xl text-center hover:scale-105 transition-transform">
              <div className="text-2xl mb-1">📚</div>
              <div className="text-xs text-green-700 dark:text-green-400">{stats?.total_questions || 0} soru</div>
            </Link>
            <Link href="/ogrenci/rozetler" className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-xl text-center hover:scale-105 transition-transform">
              <div className="text-2xl mb-1">🏆</div>
              <div className="text-xs text-purple-700 dark:text-purple-400">{badgeCount} rozet</div>
            </Link>
            <Link href="/ogrenci/liderlik" className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-xl text-center hover:scale-105 transition-transform">
              <div className="text-2xl mb-1">🌟</div>
              <div className="text-xs text-blue-700 dark:text-blue-400">
                {ranks.class_rank ? `#${ranks.class_rank} sınıf` : 'Yarış!'}
              </div>
            </Link>
          </div>

          {/* Motivasyon mesajı */}
          <div className="p-4 bg-gradient-to-r from-pink-50 to-purple-50 dark:from-pink-900/10 dark:to-purple-900/10 rounded-xl text-center">
            <div className="text-2xl mb-2">🎉</div>
            <p className="text-sm text-surface-700 dark:text-surface-300">
              {stats?.current_streak && stats.current_streak >= 3 
                ? `Harika! ${stats.current_streak} soru üst üste doğru! 🔥`
                : 'Soru çözmeye devam et, yıldızlarını topla! ✨'}
            </p>
          </div>
        </div>
      </motion.div>
    )
  }

  // Rekabetçi Takım (5-8. Sınıf - LGS) - Rekabet odaklı
  if (ageGroup === 'rekabetci') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card overflow-hidden"
      >
        {/* Lig başlığı */}
        <div className={`bg-gradient-to-r ${league.color} p-6 text-white`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="text-4xl">{league.icon}</div>
              <div>
                <div className="text-sm opacity-90">Mevcut Lig</div>
                <div className="text-2xl font-bold">{league.name}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold">{stats?.total_points || 0}</div>
              <div className="text-sm opacity-90">puan</div>
            </div>
          </div>

          {/* Seri */}
          {(stats?.current_streak || 0) > 0 && (
            <div className="mt-4 flex items-center gap-2 bg-white/20 px-3 py-1.5 rounded-full w-fit">
              <Flame className="w-5 h-5 text-orange-300" />
              <span className="font-medium">{stats?.current_streak} seri!</span>
            </div>
          )}
        </div>

        <div className="p-6 space-y-4">
          {/* Sıralamalar */}
          <div className="grid grid-cols-2 gap-3">
            {ranks.class_rank && (
              <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl flex items-center gap-3">
                <GraduationCap className="w-6 h-6 text-amber-600" />
                <div>
                  <div className="text-xs text-surface-500">Sınıf</div>
                  <div className="font-bold text-amber-600">#{ranks.class_rank}</div>
                </div>
              </div>
            )}
            {ranks.school_rank && (
              <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-xl flex items-center gap-3">
                <School className="w-6 h-6 text-purple-600" />
                <div>
                  <div className="text-xs text-surface-500">Okul</div>
                  <div className="font-bold text-purple-600">#{ranks.school_rank}</div>
                </div>
              </div>
            )}
            {ranks.city_rank && (
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center gap-3">
                <MapPin className="w-6 h-6 text-blue-600" />
                <div>
                  <div className="text-xs text-surface-500">İl</div>
                  <div className="font-bold text-blue-600">#{ranks.city_rank}</div>
                </div>
              </div>
            )}
            {ranks.turkey_rank && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-xl flex items-center gap-3">
                <Globe className="w-6 h-6 text-red-600" />
                <div>
                  <div className="text-xs text-surface-500">Türkiye</div>
                  <div className="font-bold text-red-600">#{ranks.turkey_rank}</div>
                </div>
              </div>
            )}
          </div>

          {/* Sıralama yoksa bilgi */}
          {!ranks.class_rank && !ranks.school_rank && (
            <Link 
              href="/ogrenci/profil" 
              className="block p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl text-center"
            >
              <MapPin className="w-6 h-6 text-amber-600 mx-auto mb-2" />
              <p className="text-sm text-amber-700 dark:text-amber-400">
                Sıralamalarda yer almak için profil bilgilerini tamamla
              </p>
            </Link>
          )}

          {/* İstatistikler */}
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-3 bg-surface-50 dark:bg-surface-800 rounded-xl">
              <div className="text-lg font-bold text-surface-900 dark:text-white">{stats?.total_questions || 0}</div>
              <div className="text-xs text-surface-500">Soru</div>
            </div>
            <div className="text-center p-3 bg-surface-50 dark:bg-surface-800 rounded-xl">
              <div className="text-lg font-bold text-green-600">{stats?.total_correct || 0}</div>
              <div className="text-xs text-surface-500">Doğru</div>
            </div>
            <div className="text-center p-3 bg-surface-50 dark:bg-surface-800 rounded-xl">
              <div className="text-lg font-bold text-surface-900 dark:text-white">{badgeCount}</div>
              <div className="text-xs text-surface-500">Rozet</div>
            </div>
          </div>

          {/* Hızlı erişim */}
          <div className="grid grid-cols-2 gap-3">
            <Link href="/ogrenci/duello" className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors">
              <Swords className="w-5 h-5 text-red-500" />
              <span className="text-sm font-medium text-red-700 dark:text-red-400">Düello</span>
            </Link>
            <Link href="/ogrenci/rozetler" className="flex items-center gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl hover:bg-yellow-100 dark:hover:bg-yellow-900/30 transition-colors">
              <Award className="w-5 h-5 text-yellow-500" />
              <span className="text-sm font-medium text-yellow-700 dark:text-yellow-400">Rozetler</span>
            </Link>
          </div>
        </div>
      </motion.div>
    )
  }

  // Genç Profesyoneller (9-12. Sınıf) - İstatistik odaklı
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card overflow-hidden"
    >
      {/* Profesyonel başlık */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-slate-400">Performans Özeti</div>
            <div className="text-2xl font-bold">{stats?.total_points || 0} Puan</div>
          </div>
          <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-lg">
            <span className="text-2xl">{league.icon}</span>
            <span className="font-medium">{league.name}</span>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-4">
        {/* Detaylı istatistikler */}
        <div className="grid grid-cols-4 gap-3">
          <div className="text-center p-3 border border-surface-200 dark:border-surface-700 rounded-lg">
            <div className="text-2xl font-bold text-surface-900 dark:text-white">{stats?.total_questions || 0}</div>
            <div className="text-xs text-surface-500">Toplam Soru</div>
          </div>
          <div className="text-center p-3 border border-surface-200 dark:border-surface-700 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{stats?.total_correct || 0}</div>
            <div className="text-xs text-surface-500">Doğru</div>
          </div>
          <div className="text-center p-3 border border-surface-200 dark:border-surface-700 rounded-lg">
            <div className="text-2xl font-bold text-surface-900 dark:text-white">
              %{stats?.total_questions ? Math.round((stats.total_correct / stats.total_questions) * 100) : 0}
            </div>
            <div className="text-xs text-surface-500">Başarı</div>
          </div>
          <div className="text-center p-3 border border-surface-200 dark:border-surface-700 rounded-lg">
            <div className="text-2xl font-bold text-orange-500">{stats?.max_streak || 0}</div>
            <div className="text-xs text-surface-500">Max Seri</div>
          </div>
        </div>

        {/* Yüzdelik dilim */}
        {ranks.turkey_rank && (
          <div className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-surface-700 dark:text-surface-300">Türkiye Sıralaması</span>
              <span className="text-lg font-bold text-indigo-600">#{ranks.turkey_rank}</span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-indigo-500" />
              <span className="text-sm text-indigo-600 dark:text-indigo-400">
                İlk %{Math.max(1, Math.min(100, Math.round((ranks.turkey_rank / 1000) * 100)))} içindesin
              </span>
            </div>
          </div>
        )}

        {/* Bölgesel sıralamalar */}
        <div className="space-y-2">
          <div className="text-sm font-medium text-surface-700 dark:text-surface-300">Bölgesel Sıralama</div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            {ranks.city_rank && (
              <div className="flex items-center justify-between p-2 bg-surface-50 dark:bg-surface-800 rounded-lg">
                <span className="text-surface-600 dark:text-surface-400">İl</span>
                <span className="font-bold">#{ranks.city_rank}</span>
              </div>
            )}
            {ranks.district_rank && (
              <div className="flex items-center justify-between p-2 bg-surface-50 dark:bg-surface-800 rounded-lg">
                <span className="text-surface-600 dark:text-surface-400">İlçe</span>
                <span className="font-bold">#{ranks.district_rank}</span>
              </div>
            )}
            {ranks.school_rank && (
              <div className="flex items-center justify-between p-2 bg-surface-50 dark:bg-surface-800 rounded-lg">
                <span className="text-surface-600 dark:text-surface-400">Okul</span>
                <span className="font-bold">#{ranks.school_rank}</span>
              </div>
            )}
            {ranks.class_rank && (
              <div className="flex items-center justify-between p-2 bg-surface-50 dark:bg-surface-800 rounded-lg">
                <span className="text-surface-600 dark:text-surface-400">Sınıf</span>
                <span className="font-bold">#{ranks.class_rank}</span>
              </div>
            )}
          </div>
        </div>

        {/* Hızlı erişim */}
        <div className="flex gap-2">
          <Link href="/ogrenci/liderlik" className="flex-1 btn btn-primary btn-sm justify-center">
            <Trophy className="w-4 h-4 mr-1" />
            Liderlik
          </Link>
          <Link href="/ogrenci/rozetler" className="flex-1 btn bg-surface-100 dark:bg-surface-800 text-surface-900 dark:text-white btn-sm justify-center">
            <Award className="w-4 h-4 mr-1" />
            Rozetler
          </Link>
        </div>
      </div>
    </motion.div>
  )
}

