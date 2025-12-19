'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { 
  ALL_BADGES, 
  getBadgesByCategory, 
  getBadgeProgress,
  getCategoryName,
  getCategoryIcon,
  formatNumber,
  type Badge, 
  type BadgeCategory,
  type UserStats
} from '@/lib/gamification'
import { 
  GraduationCap, 
  Trophy, 
  ArrowLeft, 
  Lock, 
  CheckCircle,
  X,
  ChevronRight,
  Flame,
  Target,
  Zap,
  Medal,
  BookOpen,
  Filter
} from 'lucide-react'

const categories: BadgeCategory[] = ['soru', 'streak', 'basari', 'hiz', 'liderlik', 'ders']

export default function BadgesPage() {
  const [selectedCategory, setSelectedCategory] = useState<BadgeCategory | 'all'>('all')
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null)
  const [earnedBadges, setEarnedBadges] = useState<string[]>([])
  const [userStats, setUserStats] = useState<UserStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  
  const supabase = createClient()

  useEffect(() => {
    loadUserData()
  }, [])

  async function loadUserData() {
    const { data: { user: authUser } } = await supabase.auth.getUser()
    setUser(authUser)

    if (authUser) {
      // Kazanılmış rozetleri al
      const { data: badges } = await supabase
        .from('user_badges')
        .select('badge_id')
        .eq('user_id', authUser.id)

      setEarnedBadges(badges?.map(b => b.badge_id) || [])

      // Kullanıcı istatistiklerini al
      const { data: studentProfile } = await supabase
        .from('student_profiles')
        .select('id')
        .eq('user_id', authUser.id)
        .single()

      if (studentProfile) {
        const { data: pointsData } = await supabase
          .from('student_points')
          .select('*')
          .eq('student_id', studentProfile.id)
          .single()

        // Ders puanlarını al
        const { data: subjectPoints } = await supabase
          .from('student_subject_points')
          .select(`points, subject:subjects(name)`)
          .eq('student_id', studentProfile.id)

        const subjectPointsMap: Record<string, number> = {}
        subjectPoints?.forEach((sp: any) => {
          if (sp.subject?.name) {
            subjectPointsMap[sp.subject.name] = sp.points || 0
          }
        })

        setUserStats({
          total_questions: pointsData?.total_questions || 0,
          total_correct: pointsData?.total_correct || 0,
          current_streak: pointsData?.current_streak || 0,
          max_streak: pointsData?.max_streak || 0,
          subject_points: subjectPointsMap,
        })
      }
    }

    setLoading(false)
  }

  const filteredBadges = selectedCategory === 'all' 
    ? ALL_BADGES 
    : getBadgesByCategory(selectedCategory)

  const earnedCount = earnedBadges.length
  const totalCount = ALL_BADGES.length

  return (
    <div className="min-h-screen bg-gradient-to-b from-surface-50 to-white">
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
            
            <div className="flex items-center gap-4">
              {user ? (
                <Link href="/ogrenci/basarimlar" className="btn btn-primary btn-md">
                  Başarımlarım
                </Link>
              ) : (
                <Link href="/kayit" className="btn btn-primary btn-md">
                  Kayıt Ol
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-24 pb-8 px-4">
        <div className="max-w-6xl mx-auto">
          <Link href="/" className="inline-flex items-center gap-2 text-surface-500 hover:text-surface-700 mb-6">
            <ArrowLeft className="w-4 h-4" />
            Ana Sayfa
          </Link>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-amber-400 to-orange-500 rounded-3xl mb-6 shadow-lg shadow-amber-500/30">
              <Medal className="w-10 h-10 text-white" />
            </div>
            
            <h1 className="text-4xl sm:text-5xl font-bold text-surface-900 mb-4">
              Rozetleri Keşfet
            </h1>
            
            <p className="text-lg text-surface-600 max-w-2xl mx-auto mb-6">
              Soru çöz, seri yap, başarılı ol ve rozetleri topla! Her rozet sana XP kazandırır.
            </p>

            {user && (
              <div className="inline-flex items-center gap-4 px-6 py-3 bg-gradient-to-r from-purple-100 to-indigo-100 rounded-2xl">
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{earnedCount}</div>
                  <div className="text-xs text-purple-500">Kazanıldı</div>
                </div>
                <div className="w-px h-10 bg-purple-200" />
                <div className="text-center">
                  <div className="text-2xl font-bold text-surface-400">{totalCount - earnedCount}</div>
                  <div className="text-xs text-surface-500">Kilitli</div>
                </div>
                <div className="w-px h-10 bg-purple-200" />
                <div className="text-center">
                  <div className="text-2xl font-bold text-indigo-600">{totalCount}</div>
                  <div className="text-xs text-indigo-500">Toplam</div>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </section>

      {/* Category Filters */}
      <section className="py-4 px-4 sticky top-16 bg-white/80 backdrop-blur-lg z-40 border-b border-surface-100">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium whitespace-nowrap transition-all ${
                selectedCategory === 'all'
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30'
                  : 'bg-surface-100 text-surface-600 hover:bg-surface-200'
              }`}
            >
              <Filter className="w-4 h-4" />
              Tümü
            </button>
            
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium whitespace-nowrap transition-all ${
                  selectedCategory === category
                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30'
                    : 'bg-surface-100 text-surface-600 hover:bg-surface-200'
                }`}
              >
                <span>{getCategoryIcon(category)}</span>
                {getCategoryName(category)}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Badges Grid */}
      <section className="py-8 px-4">
        <div className="max-w-6xl mx-auto">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full" />
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {filteredBadges.map((badge, index) => {
                const isEarned = earnedBadges.includes(badge.id)
                const progress = userStats ? getBadgeProgress(badge, userStats) : null
                
                return (
                  <motion.div
                    key={badge.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.03 }}
                    onClick={() => setSelectedBadge(badge)}
                    className={`relative cursor-pointer group ${
                      isEarned ? '' : 'grayscale hover:grayscale-0'
                    }`}
                  >
                    <div className={`bg-white rounded-2xl p-4 text-center transition-all border-2 ${
                      isEarned 
                        ? 'border-amber-300 shadow-lg shadow-amber-500/20' 
                        : 'border-surface-100 hover:border-surface-200 hover:shadow-lg'
                    }`}>
                      {/* Earned indicator */}
                      {isEarned && (
                        <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
                          <CheckCircle className="w-4 h-4 text-white" />
                        </div>
                      )}
                      
                      {/* Badge Icon */}
                      <div className={`w-16 h-16 mx-auto mb-3 rounded-2xl bg-gradient-to-br ${badge.color} flex items-center justify-center text-3xl shadow-lg ${
                        isEarned ? '' : 'opacity-50'
                      }`}>
                        {badge.icon}
                      </div>
                      
                      {/* Badge Name */}
                      <h3 className={`font-bold text-sm mb-1 ${isEarned ? 'text-surface-900' : 'text-surface-500'}`}>
                        {badge.name}
                      </h3>
                      
                      {/* XP Reward */}
                      <div className={`text-xs font-medium ${isEarned ? 'text-amber-600' : 'text-surface-400'}`}>
                        +{badge.xp_reward} XP
                      </div>
                      
                      {/* Progress Bar */}
                      {!isEarned && progress && (
                        <div className="mt-2">
                          <div className="h-1.5 bg-surface-100 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full transition-all"
                              style={{ width: `${progress.percentage}%` }}
                            />
                          </div>
                          <div className="text-xs text-surface-400 mt-1">
                            {progress.current}/{progress.target}
                          </div>
                        </div>
                      )}
                      
                      {/* Lock icon for not earned */}
                      {!isEarned && !user && (
                        <div className="absolute inset-0 flex items-center justify-center bg-white/80 rounded-2xl">
                          <Lock className="w-6 h-6 text-surface-300" />
                        </div>
                      )}
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )}
        </div>
      </section>

      {/* Badge Detail Modal */}
      <AnimatePresence>
        {selectedBadge && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedBadge(null)}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full relative"
            >
              <button
                onClick={() => setSelectedBadge(null)}
                className="absolute top-4 right-4 p-2 text-surface-400 hover:text-surface-600 hover:bg-surface-100 rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              {(() => {
                const isEarned = earnedBadges.includes(selectedBadge.id)
                const progress = userStats ? getBadgeProgress(selectedBadge, userStats) : null
                
                return (
                  <div className="text-center">
                    {/* Badge Icon */}
                    <div className={`w-24 h-24 mx-auto mb-4 rounded-3xl bg-gradient-to-br ${selectedBadge.color} flex items-center justify-center text-5xl shadow-xl ${
                      isEarned ? '' : 'grayscale opacity-75'
                    }`}>
                      {selectedBadge.icon}
                    </div>
                    
                    {/* Earned Status */}
                    {isEarned && (
                      <div className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-600 rounded-full text-sm font-medium mb-3">
                        <CheckCircle className="w-4 h-4" />
                        Kazanıldı!
                      </div>
                    )}
                    
                    {/* Badge Name */}
                    <h2 className="text-2xl font-bold text-surface-900 mb-2">
                      {selectedBadge.name}
                    </h2>
                    
                    {/* Description */}
                    <p className="text-surface-600 mb-4">
                      {selectedBadge.description}
                    </p>
                    
                    {/* Category */}
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-surface-100 rounded-full text-sm text-surface-600 mb-4">
                      <span>{getCategoryIcon(selectedBadge.category)}</span>
                      {getCategoryName(selectedBadge.category)}
                    </div>
                    
                    {/* XP Reward */}
                    <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl p-4 mb-4">
                      <div className="text-3xl font-bold text-amber-600">+{selectedBadge.xp_reward} XP</div>
                      <div className="text-sm text-amber-500">Rozet ödülü</div>
                    </div>
                    
                    {/* Progress */}
                    {!isEarned && progress && user && (
                      <div className="mb-4">
                        <div className="flex items-center justify-between text-sm mb-2">
                          <span className="text-surface-500">İlerleme</span>
                          <span className="font-medium text-purple-600">{progress.percentage}%</span>
                        </div>
                        <div className="h-3 bg-surface-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full transition-all"
                            style={{ width: `${progress.percentage}%` }}
                          />
                        </div>
                        <div className="text-sm text-surface-500 mt-2">
                          {formatNumber(progress.current)} / {formatNumber(progress.target)}
                        </div>
                      </div>
                    )}
                    
                    {/* CTA */}
                    {!user ? (
                      <Link href="/kayit" className="btn btn-primary w-full">
                        Rozet Toplamaya Başla
                        <ChevronRight className="w-4 h-4" />
                      </Link>
                    ) : !isEarned ? (
                      <Link href="/ogrenci/soru-bankasi" className="btn btn-primary w-full">
                        Soru Çözmeye Git
                        <ChevronRight className="w-4 h-4" />
                      </Link>
                    ) : (
                      <Link href="/ogrenci/basarimlar" className="btn btn-outline w-full">
                        Tüm Başarımlarım
                        <ChevronRight className="w-4 h-4" />
                      </Link>
                    )}
                  </div>
                )
              })()}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CTA Section */}
      {!user && (
        <section className="py-12 px-4">
          <div className="max-w-4xl mx-auto">
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-3xl p-8 text-center text-white">
              <Trophy className="w-12 h-12 mx-auto mb-4 text-yellow-300" />
              <h2 className="text-2xl font-bold mb-2">Rozet Toplamaya Başla!</h2>
              <p className="text-purple-100 mb-6 max-w-lg mx-auto">
                Ücretsiz kayıt ol, soru çöz ve rozetleri kazanmaya başla. Her rozet sana XP kazandırır!
              </p>
              <Link href="/kayit" className="btn bg-white text-purple-600 hover:bg-purple-50 btn-lg">
                Ücretsiz Başla
                <ChevronRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-surface-100 bg-white">
        <div className="max-w-6xl mx-auto text-center text-surface-500 text-sm">
          <p>© 2026 Tekn<span className="text-primary-500">okul</span>. Tüm hakları saklıdır.</p>
        </div>
      </footer>
    </div>
  )
}

