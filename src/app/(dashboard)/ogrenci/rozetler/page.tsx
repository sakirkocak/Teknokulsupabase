'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { createClient } from '@/lib/supabase/client'
import { useProfile, useStudentProfile } from '@/hooks/useProfile'
import { motion } from 'framer-motion'
import { 
  Award, Trophy, Flame, Star, Target, Zap, Crown,
  BookOpen, GraduationCap, Medal, Gift, Lock, Check,
  Sparkles, TrendingUp
} from 'lucide-react'
import { Badge, StudentBadge, StudentPoints } from '@/types/database'
import Link from 'next/link'

const categoryInfo: Record<string, { label: string; icon: any; color: string }> = {
  streak: { label: 'Seri Rozetleri', icon: Flame, color: 'from-orange-500 to-red-500' },
  points: { label: 'Puan Rozetleri', icon: Star, color: 'from-yellow-500 to-amber-500' },
  subject: { label: 'Ders Rozetleri', icon: BookOpen, color: 'from-blue-500 to-indigo-500' },
  special: { label: 'Özel Rozetler', icon: Sparkles, color: 'from-purple-500 to-pink-500' },
  rank: { label: 'Sıralama Rozetleri', icon: Trophy, color: 'from-emerald-500 to-teal-500' },
}

const tierColors: Record<string, { bg: string; border: string; text: string }> = {
  bronze: { bg: 'from-amber-700/20 to-orange-800/20', border: 'border-amber-600/50', text: 'text-amber-500' },
  silver: { bg: 'from-gray-400/20 to-gray-500/20', border: 'border-gray-400/50', text: 'text-gray-300' },
  gold: { bg: 'from-yellow-500/20 to-amber-500/20', border: 'border-yellow-500/50', text: 'text-yellow-400' },
  platinum: { bg: 'from-cyan-400/20 to-blue-500/20', border: 'border-cyan-400/50', text: 'text-cyan-400' },
  diamond: { bg: 'from-violet-500/20 to-purple-500/20', border: 'border-violet-400/50', text: 'text-violet-400' },
}

export default function BadgesPage() {
  const { profile } = useProfile()
  const { studentProfile } = useStudentProfile(profile?.id || '')
  
  const [badges, setBadges] = useState<Badge[]>([])
  const [earnedBadges, setEarnedBadges] = useState<StudentBadge[]>([])
  const [studentPoints, setStudentPoints] = useState<StudentPoints | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  const supabase = createClient()

  useEffect(() => {
    if (studentProfile?.id) {
      loadData()
    }
  }, [studentProfile?.id])

  const loadData = async () => {
    if (!studentProfile?.id) return
    setLoading(true)

    // Tüm rozetleri al
    const { data: badgesData } = await supabase
      .from('badges')
      .select('*')
      .eq('is_active', true)
      .order('category')
      .order('requirement_value')

    if (badgesData) setBadges(badgesData)

    // Kazanılan rozetleri al
    const { data: earnedData } = await supabase
      .from('student_badges')
      .select('*, badge:badges(*)')
      .eq('student_id', studentProfile.id)

    if (earnedData) setEarnedBadges(earnedData)

    // Öğrenci puanlarını al
    const { data: pointsData } = await supabase
      .from('student_points')
      .select('*')
      .eq('student_id', studentProfile.id)
      .single()

    if (pointsData) setStudentPoints(pointsData)

    // Rozet kontrolü yap (yeni rozetler için)
    await supabase.rpc('check_and_award_badges', { p_student_id: studentProfile.id })

    // Güncellenmiş rozetleri tekrar al
    const { data: updatedEarned } = await supabase
      .from('student_badges')
      .select('*, badge:badges(*)')
      .eq('student_id', studentProfile.id)

    if (updatedEarned) setEarnedBadges(updatedEarned)

    setLoading(false)
  }

  const isEarned = (badgeId: string) => {
    return earnedBadges.some(eb => eb.badge_id === badgeId)
  }

  const getProgress = (badge: Badge): number => {
    if (!studentPoints) return 0

    let current = 0
    const target = badge.requirement_value

    switch (badge.requirement_type) {
      case 'total_points':
        current = studentPoints.total_points
        break
      case 'total_correct':
        current = studentPoints.total_correct
        break
      case 'total_questions':
        current = studentPoints.total_questions
        break
      case 'max_streak':
        current = studentPoints.max_streak
        break
      case 'subject_points':
        switch (badge.requirement_subject) {
          case 'Matematik':
            current = studentPoints.matematik_points
            break
          case 'Türkçe':
            current = studentPoints.turkce_points
            break
          case 'Fen Bilimleri':
            current = studentPoints.fen_points
            break
        }
        break
      default:
        return 0
    }

    return Math.min(100, Math.round((current / target) * 100))
  }

  const filteredBadges = selectedCategory === 'all' 
    ? badges 
    : badges.filter(b => b.category === selectedCategory)

  const groupedBadges = filteredBadges.reduce((acc, badge) => {
    if (!acc[badge.category]) acc[badge.category] = []
    acc[badge.category].push(badge)
    return acc
  }, {} as Record<string, Badge[]>)

  const earnedCount = earnedBadges.length
  const totalCount = badges.length
  const earnedPoints = earnedBadges.reduce((acc, eb) => acc + ((eb.badge as any)?.points_reward || 0), 0)

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
              <Award className="h-8 w-8 text-yellow-500" />
              Rozetlerim
            </h1>
            <p className="text-surface-500 mt-1">Başarılarını topla ve ödüller kazan!</p>
          </div>
        </div>

        {/* İstatistikler */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card p-4 bg-gradient-to-br from-yellow-500/10 to-amber-500/10 border-yellow-500/20"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-yellow-500/20 rounded-xl flex items-center justify-center">
                <Medal className="h-6 w-6 text-yellow-500" />
              </div>
              <div>
                <div className="text-2xl font-bold text-surface-900 dark:text-white">{earnedCount}</div>
                <div className="text-sm text-surface-500">Kazanılan</div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="card p-4"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-surface-100 dark:bg-surface-700 rounded-xl flex items-center justify-center">
                <Lock className="h-6 w-6 text-surface-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-surface-900 dark:text-white">{totalCount - earnedCount}</div>
                <div className="text-sm text-surface-500">Kilitli</div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="card p-4 bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/20"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                <Gift className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <div className="text-2xl font-bold text-surface-900 dark:text-white">+{earnedPoints}</div>
                <div className="text-sm text-surface-500">Bonus Puan</div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="card p-4"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-purple-500" />
              </div>
              <div>
                <div className="text-2xl font-bold text-surface-900 dark:text-white">
                  %{totalCount > 0 ? Math.round((earnedCount / totalCount) * 100) : 0}
                </div>
                <div className="text-sm text-surface-500">Tamamlanma</div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Kategori Filtreleri */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              selectedCategory === 'all'
                ? 'bg-primary-500 text-white'
                : 'bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-300 hover:bg-surface-200'
            }`}
          >
            Tümü
          </button>
          {Object.entries(categoryInfo).map(([key, info]) => (
            <button
              key={key}
              onClick={() => setSelectedCategory(key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                selectedCategory === key
                  ? `bg-gradient-to-r ${info.color} text-white`
                  : 'bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-300 hover:bg-surface-200'
              }`}
            >
              <info.icon className="h-4 w-4" />
              {info.label}
            </button>
          ))}
        </div>

        {/* Rozet Grupları */}
        {Object.entries(groupedBadges).map(([category, categoryBadges]) => {
          const info = categoryInfo[category]
          return (
            <motion.div
              key={category}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <h2 className="text-lg font-bold text-surface-900 dark:text-white flex items-center gap-2">
                <div className={`w-8 h-8 rounded-lg bg-gradient-to-r ${info.color} flex items-center justify-center`}>
                  <info.icon className="h-4 w-4 text-white" />
                </div>
                {info.label}
              </h2>

              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {categoryBadges.map((badge, index) => {
                  const earned = isEarned(badge.id)
                  const progress = getProgress(badge)
                  const tier = badge.tier || 'bronze'
                  const tierStyle = tierColors[tier]

                  return (
                    <motion.div
                      key={badge.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.05 }}
                      className={`relative card p-4 border-2 transition-all ${
                        earned 
                          ? `bg-gradient-to-br ${tierStyle.bg} ${tierStyle.border}` 
                          : 'bg-surface-50 dark:bg-surface-800/50 border-surface-200 dark:border-surface-700 opacity-75'
                      }`}
                    >
                      {/* Earned Badge */}
                      {earned && (
                        <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                          <Check className="h-4 w-4 text-white" />
                        </div>
                      )}

                      <div className="flex items-start gap-4">
                        {/* Icon */}
                        <div className={`text-4xl ${earned ? '' : 'grayscale opacity-50'}`}>
                          {badge.icon}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className={`font-bold truncate ${earned ? tierStyle.text : 'text-surface-500'}`}>
                              {badge.name}
                            </h3>
                            {badge.tier && (
                              <span className={`text-xs px-2 py-0.5 rounded-full ${tierStyle.bg} ${tierStyle.text} border ${tierStyle.border}`}>
                                {badge.tier.charAt(0).toUpperCase() + badge.tier.slice(1)}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-surface-500 mt-1">{badge.description}</p>
                          
                          {/* Progress Bar */}
                          {!earned && progress > 0 && (
                            <div className="mt-2">
                              <div className="flex justify-between text-xs text-surface-400 mb-1">
                                <span>İlerleme</span>
                                <span>%{progress}</span>
                              </div>
                              <div className="h-2 bg-surface-200 dark:bg-surface-700 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full bg-gradient-to-r ${info.color} transition-all duration-500`}
                                  style={{ width: `${progress}%` }}
                                />
                              </div>
                            </div>
                          )}

                          {/* Reward */}
                          {badge.points_reward > 0 && (
                            <div className="mt-2 flex items-center gap-1 text-xs">
                              <Gift className="h-3 w-3 text-green-500" />
                              <span className={earned ? 'text-green-500' : 'text-surface-400'}>
                                +{badge.points_reward} puan
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Locked Overlay */}
                      {!earned && progress === 0 && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Lock className="h-8 w-8 text-surface-300" />
                        </div>
                      )}
                    </motion.div>
                  )
                })}
              </div>
            </motion.div>
          )
        })}

        {/* Henüz rozet yoksa */}
        {badges.length === 0 && (
          <div className="card p-12 text-center">
            <Award className="h-16 w-16 text-surface-300 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-surface-900 dark:text-white mb-2">
              Henüz rozet yok
            </h2>
            <p className="text-surface-500 mb-6">
              Soru çözerek rozetleri açmaya başla!
            </p>
            <Link href="/ogrenci/soru-bankasi" className="btn btn-primary btn-lg">
              Soru Çözmeye Başla
            </Link>
          </div>
        )}

        {/* Bilgi Kartı */}
        <div className="card p-4 bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20 border-primary-200 dark:border-primary-800">
          <div className="flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-primary-500 mt-0.5" />
            <div className="text-sm">
              <strong className="text-primary-700 dark:text-primary-400">Nasıl rozet kazanırım?</strong>
              <ul className="mt-2 space-y-1 text-primary-600 dark:text-primary-300">
                <li>• Soru çözerek puan kazan</li>
                <li>• Üst üste doğru yaparak seri oluştur</li>
                <li>• Belirli derslerde uzmanlaş</li>
                <li>• Liderlik tablosunda yüksel</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

