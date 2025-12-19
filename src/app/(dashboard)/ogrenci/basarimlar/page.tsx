'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { useGamification } from '@/hooks/useGamification'
import { useDailyChallenge } from '@/hooks/useDailyChallenge'
import { 
  XPCard, 
  StreakCard, 
  DailyChallengesCard, 
  BadgeCard 
} from '@/components/gamification'
import { 
  ALL_BADGES, 
  getBadgesByCategory,
  getCategoryName,
  getCategoryIcon,
  formatNumber,
  type BadgeCategory 
} from '@/lib/gamification'
import { 
  Trophy, 
  Medal, 
  Target, 
  Flame, 
  TrendingUp, 
  Award,
  ChevronRight,
  Clock,
  CheckCircle,
  Star,
  Filter,
  History,
  Calendar,
  BarChart3
} from 'lucide-react'

const categories: (BadgeCategory | 'all')[] = ['all', 'soru', 'streak', 'basari', 'hiz', 'liderlik', 'ders']

export default function AchievementsPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<BadgeCategory | 'all'>('all')
  const [xpHistory, setXpHistory] = useState<any[]>([])
  const [activityDates, setActivityDates] = useState<string[]>([])
  
  const supabase = createClient()
  
  useEffect(() => {
    loadUser()
  }, [])

  async function loadUser() {
    const { data: { user: authUser } } = await supabase.auth.getUser()
    setUser(authUser)
    
    if (authUser) {
      // XP geçmişini al
      const { data: history } = await supabase
        .from('xp_history')
        .select('*')
        .eq('user_id', authUser.id)
        .order('created_at', { ascending: false })
        .limit(50)
      
      setXpHistory(history || [])

      // Aktivite tarihlerini al (son 30 gün)
      const { data: studentProfile } = await supabase
        .from('student_profiles')
        .select('id')
        .eq('user_id', authUser.id)
        .single()

      if (studentProfile) {
        // Basit aktivite tarihleri - student_points'ten son aktivite alınabilir
        // veya question_answers tablosundan çekilebilir
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
        
        // Şimdilik xp_history'den aktivite tarihlerini çekelim
        const dates = history?.map(h => h.created_at.split('T')[0]) || []
        setActivityDates(Array.from(new Set(dates)))
      }
    }
    
    setLoading(false)
  }

  const gamification = useGamification(user?.id || null)
  const dailyChallenge = useDailyChallenge(user?.id || null)

  const filteredBadges = selectedCategory === 'all' 
    ? ALL_BADGES 
    : getBadgesByCategory(selectedCategory)

  const earnedBadges = filteredBadges.filter(b => gamification.earnedBadges.includes(b.id))
  const unearnedBadges = filteredBadges.filter(b => !gamification.earnedBadges.includes(b.id))

  // Başarı oranı
  const successRate = gamification.stats?.total_questions 
    ? Math.round((gamification.stats.total_correct / gamification.stats.total_questions) * 100)
    : 0

  if (loading || gamification.loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Başarımlarım</h1>
          <p className="text-surface-500">XP, rozetler ve günlük görevlerin</p>
        </div>
        <Link 
          href="/rozetler" 
          className="flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-700 rounded-xl font-medium hover:bg-purple-200 transition-colors"
        >
          <Medal className="w-4 h-4" />
          Tüm Rozetler
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl p-4 text-white"
        >
          <div className="flex items-center gap-2 mb-2">
            <Star className="w-5 h-5" />
            <span className="text-sm opacity-80">Toplam XP</span>
          </div>
          <div className="text-3xl font-bold">{formatNumber(gamification.totalXP)}</div>
          <div className="text-sm opacity-80">Lv.{gamification.level.level} {gamification.level.name}</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-4 text-white"
        >
          <div className="flex items-center gap-2 mb-2">
            <Medal className="w-5 h-5" />
            <span className="text-sm opacity-80">Rozetler</span>
          </div>
          <div className="text-3xl font-bold">{gamification.earnedBadges.length}</div>
          <div className="text-sm opacity-80">/ {ALL_BADGES.length} rozet</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-red-500 to-rose-600 rounded-2xl p-4 text-white"
        >
          <div className="flex items-center gap-2 mb-2">
            <Flame className="w-5 h-5" />
            <span className="text-sm opacity-80">Günlük Seri</span>
          </div>
          <div className="text-3xl font-bold">{gamification.currentStreak}</div>
          <div className="text-sm opacity-80">Rekor: {gamification.maxStreak} gün</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-4 text-white"
        >
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-5 h-5" />
            <span className="text-sm opacity-80">Başarı Oranı</span>
          </div>
          <div className="text-3xl font-bold">%{successRate}</div>
          <div className="text-sm opacity-80">{gamification.stats?.total_questions || 0} soru</div>
        </motion.div>
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column - XP & Level */}
        <div className="lg:col-span-2 space-y-6">
          {/* XP Card */}
          <XPCard 
            totalXP={gamification.totalXP}
            level={gamification.level}
            xpProgress={gamification.xpProgress}
          />

          {/* Streak Card */}
          <StreakCard
            currentStreak={gamification.currentStreak}
            maxStreak={gamification.maxStreak}
            streakActive={gamification.streakActive}
            activityToday={gamification.activityToday}
            activityDates={activityDates}
          />

          {/* XP History */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl shadow-lg border border-surface-100 overflow-hidden"
          >
            <div className="p-6 border-b border-surface-100">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-purple-500" />
                <h2 className="text-lg font-bold text-surface-900">XP Geçmişi</h2>
              </div>
            </div>
            
            <div className="p-4 max-h-[400px] overflow-y-auto">
              {xpHistory.length === 0 ? (
                <div className="text-center py-8 text-surface-500">
                  <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>Henüz XP kazanmadınız</p>
                  <Link 
                    href="/ogrenci/soru-bankasi" 
                    className="text-purple-600 font-medium hover:underline"
                  >
                    Soru çözmeye başla →
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {xpHistory.map((entry, index) => (
                    <motion.div
                      key={entry.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center gap-4 p-3 bg-surface-50 rounded-xl"
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        entry.xp_amount > 0 
                          ? 'bg-green-100 text-green-600' 
                          : 'bg-red-100 text-red-600'
                      }`}>
                        {entry.source_type === 'badge_earned' ? (
                          <Medal className="w-5 h-5" />
                        ) : entry.source_type === 'streak_bonus' ? (
                          <Flame className="w-5 h-5" />
                        ) : entry.source_type === 'challenge_completed' ? (
                          <Target className="w-5 h-5" />
                        ) : (
                          <Star className="w-5 h-5" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-surface-900 truncate">
                          {entry.description || entry.source_type}
                        </div>
                        <div className="text-xs text-surface-500">
                          {new Date(entry.created_at).toLocaleDateString('tr-TR', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </div>
                      <div className={`font-bold ${
                        entry.xp_amount > 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {entry.xp_amount > 0 ? '+' : ''}{entry.xp_amount} XP
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Right Column - Daily Challenges & Badges */}
        <div className="space-y-6">
          {/* Daily Challenges */}
          <DailyChallengesCard
            challenges={dailyChallenge.challenges}
            progress={dailyChallenge.progress}
          />

          {/* Recent Badges */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl shadow-lg border border-surface-100 overflow-hidden"
          >
            <div className="p-6 border-b border-surface-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-amber-500" />
                  <h2 className="text-lg font-bold text-surface-900">Son Rozetler</h2>
                </div>
                <Link 
                  href="/rozetler" 
                  className="text-sm text-purple-600 hover:underline"
                >
                  Tümünü gör
                </Link>
              </div>
            </div>
            
            <div className="p-4">
              {earnedBadges.length === 0 ? (
                <div className="text-center py-6 text-surface-500">
                  <Medal className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Henüz rozet kazanmadınız</p>
                  <p className="text-xs mt-1">Soru çözerek rozet kazanın!</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-3">
                  {earnedBadges.slice(0, 6).map((badge) => (
                    <BadgeCard
                      key={badge.id}
                      badge={badge}
                      isEarned={true}
                      size="sm"
                    />
                  ))}
                </div>
              )}
            </div>
          </motion.div>

          {/* Next Badges to Earn */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl shadow-lg border border-surface-100 overflow-hidden"
          >
            <div className="p-6 border-b border-surface-100">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-purple-500" />
                <h2 className="text-lg font-bold text-surface-900">Sıradaki Hedefler</h2>
              </div>
            </div>
            
            <div className="p-4 space-y-3">
              {unearnedBadges.slice(0, 4).map((badge) => {
                const progress = gamification.getBadgeProgress(badge)
                return (
                  <div 
                    key={badge.id}
                    className="flex items-center gap-3 p-3 bg-surface-50 rounded-xl"
                  >
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${badge.color} flex items-center justify-center text-lg opacity-50`}>
                      {badge.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-surface-900 text-sm truncate">
                        {badge.name}
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-surface-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-purple-500 rounded-full"
                            style={{ width: `${progress.percentage}%` }}
                          />
                        </div>
                        <span className="text-xs text-surface-500">
                          {progress.percentage}%
                        </span>
                      </div>
                    </div>
                    <div className="text-xs text-amber-600 font-medium">
                      +{badge.xp_reward}
                    </div>
                  </div>
                )
              })}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Badges Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-3xl shadow-lg border border-surface-100 overflow-hidden"
      >
        <div className="p-6 border-b border-surface-100">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-500" />
              <h2 className="text-lg font-bold text-surface-900">Tüm Rozetler</h2>
            </div>
            <div className="text-sm text-surface-500">
              {gamification.earnedBadges.length}/{ALL_BADGES.length} kazanıldı
            </div>
          </div>

          {/* Category Filters */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-all text-sm ${
                  selectedCategory === category
                    ? 'bg-purple-600 text-white shadow'
                    : 'bg-surface-100 text-surface-600 hover:bg-surface-200'
                }`}
              >
                {category === 'all' ? (
                  <>
                    <Filter className="w-4 h-4" />
                    Tümü
                  </>
                ) : (
                  <>
                    <span>{getCategoryIcon(category)}</span>
                    {getCategoryName(category)}
                  </>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Badges Grid */}
        <div className="p-6">
          {/* Earned */}
          {earnedBadges.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-surface-500 mb-3 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                Kazanılan ({earnedBadges.length})
              </h3>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                {earnedBadges.map((badge) => (
                  <BadgeCard
                    key={badge.id}
                    badge={badge}
                    isEarned={true}
                    stats={gamification.stats}
                    size="sm"
                  />
                ))}
              </div>
            </div>
          )}

          {/* Unearned */}
          {unearnedBadges.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-surface-500 mb-3 flex items-center gap-2">
                <Target className="w-4 h-4 text-purple-500" />
                Hedefler ({unearnedBadges.length})
              </h3>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                {unearnedBadges.map((badge) => (
                  <BadgeCard
                    key={badge.id}
                    badge={badge}
                    isEarned={false}
                    stats={gamification.stats}
                    size="sm"
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}

