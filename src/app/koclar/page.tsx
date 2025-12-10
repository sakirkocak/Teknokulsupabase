'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useProfile } from '@/hooks/useProfile'
import { getInitials } from '@/lib/utils'
import { demoCoaches } from '@/lib/demoData'
import { motion } from 'framer-motion'
import { 
  GraduationCap,
  Search,
  Star,
  Clock,
  Award,
  MessageSquare,
  Filter,
  ChevronDown,
  Play,
  Users,
  CheckCircle,
  SortAsc
} from 'lucide-react'

export default function CoachesPage() {
  const { profile } = useProfile()
  const [coaches, setCoaches] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [specializationFilter, setSpecializationFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<string>('rating')
  const supabase = createClient()

  useEffect(() => {
    loadCoaches()
  }, [])

  async function loadCoaches() {
    setLoading(true)

    const { data: coachData } = await supabase
      .from('teacher_profiles')
      .select(`
        *,
        profile:profiles!teacher_profiles_user_id_fkey(id, full_name, avatar_url, email)
      `)
      .eq('is_coach', true)
      .eq('is_listed', true)

    let allCoaches: any[] = []

    if (coachData && coachData.length > 0) {
      // Her koç için değerlendirme ortalamalarını al
      const coachesWithReviews = await Promise.all(coachData.map(async (coach) => {
        const { data: reviews } = await supabase
          .from('reviews')
          .select('overall_rating, communication_rating, knowledge_rating, punctuality_rating')
          .eq('teacher_id', coach.id)
          .eq('is_approved', true)

        const reviewCount = reviews?.length || 0
        const avgRating = reviewCount > 0
          ? reviews!.reduce((acc, r) => acc + r.overall_rating, 0) / reviewCount
          : 0

        return {
          ...coach,
          reviewCount,
          avgRating,
        }
      }))

      allCoaches = coachesWithReviews
    }

    // Demo koçları ekle (gerçek koçlar az olsa bile)
    const demoCoachesFormatted = demoCoaches.map((coach, i) => ({
      id: `demo-${i}`,
      ...coach,
      profile: { full_name: coach.full_name, avatar_url: null },
      avgRating: coach.rating,
      reviewCount: coach.review_count,
      isDemo: true,
      created_at: new Date().toISOString(),
    }))

    // Gerçek koçlar önce, sonra demo koçlar
    setCoaches([...allCoaches, ...demoCoachesFormatted])
    setLoading(false)
  }

  // Tüm uzmanlık alanlarını topla
  const allSpecializations = Array.from(
    new Set(coaches.flatMap(c => c.specializations || []).filter(Boolean))
  )

  // Filtreleme ve sıralama
  const filteredCoaches = coaches
    .filter(coach => {
      const matchesSearch = !search || 
        coach.profile?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
        coach.headline?.toLowerCase().includes(search.toLowerCase()) ||
        coach.specializations?.some((s: string) => s.toLowerCase().includes(search.toLowerCase()))
      
      const matchesSpecialization = specializationFilter === 'all' ||
        coach.specializations?.includes(specializationFilter)
      
      return matchesSearch && matchesSpecialization
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'rating':
          return b.avgRating - a.avgRating
        case 'reviews':
          return b.reviewCount - a.reviewCount
        case 'experience':
          return (b.experience_years || 0) - (a.experience_years || 0)
        case 'new':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        default:
          return 0
      }
    })

  return (
    <div className="min-h-screen bg-surface-50">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b border-surface-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold">
                Tekno<span className="text-primary-500">kul</span>
              </span>
            </Link>
            
            {profile ? (
              <Link 
                href={`/${profile.role === 'ogretmen' ? 'koc' : profile.role}`}
                className="btn btn-primary btn-sm"
              >
                Dashboard
              </Link>
            ) : (
              <div className="flex items-center gap-3">
                <Link href="/giris" className="btn btn-ghost btn-sm">
                  Giriş Yap
                </Link>
                <Link href="/kayit" className="btn btn-primary btn-sm">
                  Kayıt Ol
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-surface-900 mb-2">Eğitim Koçları</h1>
          <p className="text-surface-600 max-w-2xl mx-auto">
            Deneyimli eğitim koçlarımız arasından size en uygun olanı seçin ve 
            eğitim yolculuğunuza profesyonel destek alın.
          </p>
        </div>

        {/* Filters */}
        <div className="card p-4 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Koç ara (isim, uzmanlık alanı...)"
                className="input pl-12"
              />
            </div>

            {/* Specialization Filter */}
            <select
              value={specializationFilter}
              onChange={(e) => setSpecializationFilter(e.target.value)}
              className="input w-full lg:w-48"
            >
              <option value="all">Tüm Alanlar</option>
              {allSpecializations.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="input w-full lg:w-48"
            >
              <option value="rating">En Yüksek Puan</option>
              <option value="reviews">En Çok Yorum</option>
              <option value="experience">En Deneyimli</option>
              <option value="new">En Yeni</option>
            </select>
          </div>
        </div>

        {/* Results Count */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-surface-600">
            <span className="font-semibold text-surface-900">{filteredCoaches.length}</span> koç bulundu
          </p>
        </div>

        {/* Coaches Grid */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" />
          </div>
        ) : filteredCoaches.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCoaches.map((coach, index) => (
              <motion.div
                key={coach.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Link href={coach.isDemo ? '#' : `/koclar/${coach.id}`}>
                  <div className="card group hover:shadow-xl transition-all duration-300 overflow-hidden">
                    {/* Video/Avatar Header */}
                    <div className="relative h-48 bg-gradient-to-br from-primary-100 to-accent-100">
                      {coach.video_url ? (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                          <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Play className="w-8 h-8 text-primary-500 ml-1" />
                          </div>
                        </div>
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-24 h-24 bg-gradient-to-br from-primary-400 to-primary-600 rounded-2xl flex items-center justify-center text-white text-3xl font-bold shadow-lg overflow-hidden">
                            {coach.profile?.avatar_url ? (
                              <img src={coach.profile.avatar_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                              getInitials(coach.profile?.full_name || coach.full_name)
                            )}
                          </div>
                        </div>
                      )}
                      
                      {/* Badges */}
                      <div className="absolute top-3 right-3 flex gap-2">
                        {coach.isDemo && (
                          <span className="px-2 py-1 bg-primary-500 text-white text-xs font-medium rounded-full">
                            Örnek
                          </span>
                        )}
                        {coach.certificates && coach.certificates.length > 0 && (
                          <span className="px-2 py-1 bg-yellow-400 text-yellow-900 text-xs font-medium rounded-full flex items-center gap-1">
                            <Award className="w-3 h-3" />
                            Sertifikalı
                          </span>
                        )}
                        {coach.is_verified && (
                          <span className="px-2 py-1 bg-green-400 text-green-900 text-xs font-medium rounded-full flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" />
                            Onaylı
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-5">
                      <h3 className="text-lg font-bold text-surface-900 mb-1 group-hover:text-primary-600 transition-colors">
                        {coach.profile?.full_name || coach.full_name}
                      </h3>
                      <p className="text-surface-600 text-sm mb-3 line-clamp-2">
                        {coach.headline || 'Eğitim Koçu'}
                      </p>

                      {/* Specializations */}
                      {coach.specializations && coach.specializations.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-4">
                          {coach.specializations.slice(0, 3).map((spec: string, i: number) => (
                            <span 
                              key={i}
                              className="px-2 py-0.5 bg-primary-50 text-primary-600 text-xs font-medium rounded-full"
                            >
                              {spec}
                            </span>
                          ))}
                          {coach.specializations.length > 3 && (
                            <span className="px-2 py-0.5 bg-surface-100 text-surface-600 text-xs rounded-full">
                              +{coach.specializations.length - 3}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Stats */}
                      <div className="flex items-center justify-between pt-4 border-t border-surface-100">
                        <div className="flex items-center gap-4">
                          {/* Rating */}
                          <div className="flex items-center gap-1">
                            <Star className={`w-4 h-4 ${coach.avgRating > 0 ? 'text-yellow-400 fill-yellow-400' : 'text-surface-300'}`} />
                            <span className="font-medium text-surface-900">
                              {coach.avgRating > 0 ? coach.avgRating.toFixed(1) : '-'}
                            </span>
                            <span className="text-surface-500 text-sm">
                              ({coach.reviewCount})
                            </span>
                          </div>

                          {/* Experience */}
                          <div className="flex items-center gap-1 text-surface-500 text-sm">
                            <Clock className="w-4 h-4" />
                            {coach.experience_years || 0} yıl
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="card p-12 text-center">
            <Users className="w-16 h-16 mx-auto mb-4 text-surface-300" />
            <h3 className="text-lg font-medium text-surface-900 mb-2">Koç bulunamadı</h3>
            <p className="text-surface-500">
              Arama kriterlerinizi değiştirmeyi deneyin.
            </p>
          </div>
        )}
      </main>
    </div>
  )
}
