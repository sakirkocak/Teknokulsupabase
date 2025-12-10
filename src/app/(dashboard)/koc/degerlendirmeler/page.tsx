'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { useProfile, useTeacherProfile } from '@/hooks/useProfile'
import { createClient } from '@/lib/supabase/client'
import { getInitials } from '@/lib/utils'
import { motion } from 'framer-motion'
import { 
  Star,
  MessageSquare,
  TrendingUp,
  Users,
  Clock,
  ThumbsUp,
  Filter
} from 'lucide-react'

export default function CoachReviewsPage() {
  const { profile, loading: profileLoading } = useProfile()
  const { teacherProfile, loading: teacherLoading } = useTeacherProfile(profile?.id || '')
  const [reviews, setReviews] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')
  const supabase = createClient()

  useEffect(() => {
    if (teacherProfile?.id) {
      loadReviews()
    }
  }, [teacherProfile?.id])

  async function loadReviews() {
    setLoading(true)

    const { data } = await supabase
      .from('reviews')
      .select(`
        *,
        student:student_profiles!reviews_student_id_fkey(
          profile:profiles!student_profiles_user_id_fkey(full_name, avatar_url)
        )
      `)
      .eq('teacher_id', teacherProfile?.id)
      .order('created_at', { ascending: false })

    if (data) {
      setReviews(data)
    }

    setLoading(false)
  }

  // İstatistikler
  const approvedReviews = reviews.filter(r => r.is_approved)
  const avgOverall = approvedReviews.length > 0
    ? approvedReviews.reduce((acc, r) => acc + r.overall_rating, 0) / approvedReviews.length
    : 0
  const avgCommunication = approvedReviews.length > 0
    ? approvedReviews.reduce((acc, r) => acc + r.communication_rating, 0) / approvedReviews.length
    : 0
  const avgKnowledge = approvedReviews.length > 0
    ? approvedReviews.reduce((acc, r) => acc + r.knowledge_rating, 0) / approvedReviews.length
    : 0
  const avgPunctuality = approvedReviews.length > 0
    ? approvedReviews.reduce((acc, r) => acc + r.punctuality_rating, 0) / approvedReviews.length
    : 0

  const filteredReviews = reviews.filter(r => {
    if (filter === 'all') return true
    if (filter === 'approved') return r.is_approved
    if (filter === 'pending') return !r.is_approved
    return true
  })

  const pageLoading = profileLoading || teacherLoading || loading

  if (pageLoading) {
    return (
      <DashboardLayout role="koc">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout role="koc">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Değerlendirmelerim</h1>
          <p className="text-surface-500">Öğrencilerin sizi değerlendirmeleri</p>
        </div>

        {/* Stats */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card p-5 bg-gradient-to-br from-yellow-50 to-yellow-100"
          >
            <div className="flex items-center gap-3 mb-2">
              <Star className="w-6 h-6 text-yellow-500 fill-yellow-500" />
              <span className="text-2xl font-bold text-surface-900">{avgOverall.toFixed(1)}</span>
            </div>
            <div className="text-sm text-surface-600">Genel Puan</div>
            <div className="flex mt-2">
              {[1,2,3,4,5].map(i => (
                <Star key={i} className={`w-4 h-4 ${i <= avgOverall ? 'text-yellow-400 fill-yellow-400' : 'text-surface-200'}`} />
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="card p-5"
          >
            <div className="text-2xl font-bold text-surface-900 mb-2">{avgCommunication.toFixed(1)}</div>
            <div className="text-sm text-surface-600">İletişim</div>
            <div className="h-2 bg-surface-100 rounded-full mt-3">
              <div 
                className="h-full bg-primary-500 rounded-full" 
                style={{ width: `${(avgCommunication / 5) * 100}%` }}
              />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="card p-5"
          >
            <div className="text-2xl font-bold text-surface-900 mb-2">{avgKnowledge.toFixed(1)}</div>
            <div className="text-sm text-surface-600">Bilgi Düzeyi</div>
            <div className="h-2 bg-surface-100 rounded-full mt-3">
              <div 
                className="h-full bg-accent-500 rounded-full" 
                style={{ width: `${(avgKnowledge / 5) * 100}%` }}
              />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="card p-5"
          >
            <div className="text-2xl font-bold text-surface-900 mb-2">{avgPunctuality.toFixed(1)}</div>
            <div className="text-sm text-surface-600">Dakiklik</div>
            <div className="h-2 bg-surface-100 rounded-full mt-3">
              <div 
                className="h-full bg-secondary-500 rounded-full" 
                style={{ width: `${(avgPunctuality / 5) * 100}%` }}
              />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="card p-5"
          >
            <div className="text-2xl font-bold text-surface-900 mb-2">{approvedReviews.length}</div>
            <div className="text-sm text-surface-600">Toplam Değerlendirme</div>
            <div className="flex items-center gap-1 mt-3 text-sm text-surface-500">
              <Users className="w-4 h-4" />
              {approvedReviews.length} onaylı
            </div>
          </motion.div>
        </div>

        {/* Filter */}
        <div className="flex gap-2">
          {[
            { key: 'all', label: 'Tümü' },
            { key: 'approved', label: 'Onaylı' },
            { key: 'pending', label: 'Bekleyen' },
          ].map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                filter === f.key 
                  ? 'bg-primary-500 text-white' 
                  : 'bg-surface-100 text-surface-600 hover:bg-surface-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Reviews List */}
        <div className="card">
          <div className="p-6 border-b border-surface-100">
            <h2 className="text-lg font-semibold text-surface-900">Değerlendirmeler</h2>
          </div>
          <div className="divide-y divide-surface-100">
            {filteredReviews.length > 0 ? filteredReviews.map((review, index) => (
              <motion.div 
                key={review.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="p-6"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center text-primary-600 font-medium">
                    {review.is_anonymous ? '?' : getInitials(review.student?.profile?.full_name)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <div className="font-medium text-surface-900">
                          {review.is_anonymous ? 'Anonim Öğrenci' : review.student?.profile?.full_name}
                        </div>
                        <div className="text-sm text-surface-500 flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          {new Date(review.created_at).toLocaleDateString('tr-TR')}
                          {!review.is_approved && (
                            <span className="px-2 py-0.5 bg-yellow-50 text-yellow-600 text-xs rounded-full">
                              Onay Bekliyor
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 bg-yellow-50 px-3 py-1 rounded-full">
                        <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                        <span className="font-bold text-surface-900">{review.overall_rating}</span>
                      </div>
                    </div>

                    {/* Kategori puanları */}
                    <div className="flex flex-wrap gap-4 mb-3 text-sm">
                      <div className="flex items-center gap-1">
                        <span className="text-surface-500">İletişim:</span>
                        <span className="font-medium">{review.communication_rating}/5</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-surface-500">Bilgi:</span>
                        <span className="font-medium">{review.knowledge_rating}/5</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-surface-500">Dakiklik:</span>
                        <span className="font-medium">{review.punctuality_rating}/5</span>
                      </div>
                    </div>

                    {review.comment && (
                      <p className="text-surface-600 bg-surface-50 p-4 rounded-xl">
                        "{review.comment}"
                      </p>
                    )}
                  </div>
                </div>
              </motion.div>
            )) : (
              <div className="p-12 text-center">
                <MessageSquare className="w-16 h-16 mx-auto mb-4 text-surface-300" />
                <h3 className="text-lg font-medium text-surface-900 mb-2">Henüz değerlendirme yok</h3>
                <p className="text-surface-500">
                  Öğrencileriniz sizi değerlendirdiğinde burada görünecek.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}


