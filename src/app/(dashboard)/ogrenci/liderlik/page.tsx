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
  ChevronUp, ChevronDown, Minus
} from 'lucide-react'

interface LeaderboardEntry {
  student_id: string
  full_name: string
  avatar_url: string | null
  total_points: number
  total_questions: number
  total_correct: number
  total_wrong: number
  max_streak: number
  success_rate: number
  rank: number
}

interface MyStats {
  total_points: number
  total_questions: number
  total_correct: number
  total_wrong: number
  current_streak: number
  max_streak: number
  rank: number
  matematik_points: number
  turkce_points: number
  fen_points: number
}

const subjects = [
  { key: 'genel', label: 'Genel', icon: Trophy, color: 'from-yellow-500 to-amber-600' },
  { key: 'matematik', label: 'Matematik', icon: Target, color: 'from-red-500 to-rose-600' },
  { key: 'turkce', label: 'Türkçe', icon: BookOpen, color: 'from-blue-500 to-indigo-600' },
  { key: 'fen', label: 'Fen Bilimleri', icon: Zap, color: 'from-green-500 to-emerald-600' },
]

export default function StudentLeaderboardPage() {
  const { profile } = useProfile()
  const { studentProfile } = useStudentProfile(profile?.id || '')
  
  const [activeTab, setActiveTab] = useState('genel')
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [myStats, setMyStats] = useState<MyStats | null>(null)
  const [myRank, setMyRank] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  const supabase = createClient()

  useEffect(() => {
    if (studentProfile?.id) {
      loadData()
    }
  }, [studentProfile?.id, activeTab])

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
        rank: 0, // Aşağıda hesaplanacak
        matematik_points: myPointsData.matematik_points || 0,
        turkce_points: myPointsData.turkce_points || 0,
        fen_points: myPointsData.fen_points || 0,
      })
    }

    // Liderlik tablosunu al
    const { data, error } = await supabase
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
          profile:profiles!student_profiles_user_id_fkey(full_name, avatar_url)
        )
      `)
      .gt('total_questions', 0)
      .order('total_points', { ascending: false })
      .limit(100)

    if (data) {
      const formatted = data.map((item: any, index: number) => ({
        student_id: item.student_id,
        full_name: item.student?.profile?.full_name || 'Anonim',
        avatar_url: item.student?.profile?.avatar_url,
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

      // Kendi sıramı bul
      const myEntry = formatted.find(e => e.student_id === studentProfile.id)
      if (myEntry) {
        setMyRank(myEntry.rank)
      } else if (myPointsData && myPointsData.total_questions > 0) {
        // 100'den sonra olabilir, sıramızı hesapla
        const { count } = await supabase
          .from('student_points')
          .select('*', { count: 'exact', head: true })
          .gt('total_points', myPointsData.total_points)
        
        setMyRank((count || 0) + 1)
      }
    }

    setLoading(false)
  }

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="h-6 w-6 text-yellow-400" />
    if (rank === 2) return <Medal className="h-6 w-6 text-gray-300" />
    if (rank === 3) return <Medal className="h-6 w-6 text-amber-600" />
    return <span className="text-lg font-bold text-surface-400">{rank}</span>
  }

  const getRankStyle = (rank: number, isMe: boolean) => {
    if (isMe) return 'bg-primary-500/20 border-primary-500 ring-2 ring-primary-500/50'
    if (rank === 1) return 'bg-yellow-500/10 border-yellow-500/30'
    if (rank === 2) return 'bg-gray-400/10 border-gray-400/30'
    if (rank === 3) return 'bg-amber-600/10 border-amber-600/30'
    return 'bg-surface-50 dark:bg-surface-800 border-surface-200 dark:border-surface-700 hover:bg-surface-100 dark:hover:bg-surface-700'
  }

  if (loading) {
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
                  <div className="text-primary-100 flex items-center gap-2">
                    {myRank ? (
                      <>
                        <span className="bg-white/20 px-2 py-0.5 rounded-full text-sm font-medium">
                          #{myRank}. sıra
                        </span>
                        {myRank <= 10 && <Star className="h-4 w-4 text-yellow-300 fill-yellow-300" />}
                      </>
                    ) : (
                      <span className="text-sm">Henüz sıralama yok</span>
                    )}
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

            {/* Ders Bazlı Puanlar */}
            <div className="mt-4 pt-4 border-t border-white/20 grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-lg font-bold">{myStats.matematik_points}</div>
                <div className="text-xs text-primary-100">Matematik</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold">{myStats.turkce_points}</div>
                <div className="text-xs text-primary-100">Türkçe</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold">{myStats.fen_points}</div>
                <div className="text-xs text-primary-100">Fen</div>
              </div>
            </div>
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

        {/* Tab'lar */}
        <div className="flex flex-wrap gap-2">
          {subjects.map((subject) => (
            <button
              key={subject.key}
              onClick={() => setActiveTab(subject.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                activeTab === subject.key
                  ? `bg-gradient-to-r ${subject.color} text-white shadow-lg`
                  : 'bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-300 hover:bg-surface-200 dark:hover:bg-surface-700'
              }`}
            >
              <subject.icon className="h-4 w-4" />
              {subject.label}
            </button>
          ))}
        </div>

        {/* Liderlik Listesi */}
        <div className="card overflow-hidden">
          <div className="p-4 border-b border-surface-200 dark:border-surface-700">
            <h3 className="font-semibold text-surface-900 dark:text-white flex items-center gap-2">
              <Award className="h-5 w-5 text-primary-500" />
              En İyi 100
            </h3>
          </div>
          
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
                      {entry.total_questions} soru • %{entry.success_rate} başarı
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
                <p className="text-surface-500">Henüz kimse soru çözmemiş</p>
                <p className="text-sm text-surface-400 mt-1">İlk sen ol!</p>
              </div>
            )}
          </div>
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

