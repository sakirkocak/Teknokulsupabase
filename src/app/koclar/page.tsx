'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { getInitials } from '@/lib/utils'
import { motion } from 'framer-motion'
import { 
  GraduationCap, 
  Search, 
  Star, 
  Users, 
  ArrowLeft,
  Clock,
  BookOpen
} from 'lucide-react'

interface Coach {
  id: string
  user_id: string
  headline: string
  hourly_rate: number
  experience_years: number
  average_rating: number
  review_count: number
  is_coach: boolean
  profile: {
    full_name: string
    avatar_url: string | null
  }
}

export default function CoachesPage() {
  const [coaches, setCoaches] = useState<Coach[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const supabase = createClient()

  useEffect(() => {
    loadCoaches()
  }, [])

  async function loadCoaches() {
    setLoading(true)
    
    const { data, error } = await supabase
      .from('teacher_profiles')
      .select(`
        id,
        user_id,
        headline,
        hourly_rate,
        experience_years,
        average_rating,
        review_count,
        is_coach,
        profile:profiles!teacher_profiles_user_id_fkey(full_name, avatar_url)
      `)
      .eq('is_coach', true)
      .order('average_rating', { ascending: false })

    if (data) {
      // Flatten profile data
      const flattenedData = data.map((coach: any) => ({
        ...coach,
        profile: coach.profile || { full_name: 'İsimsiz Koç', avatar_url: null }
      }))
      setCoaches(flattenedData)
    }
    setLoading(false)
  }

  // Filtreleme
  const filteredCoaches = coaches.filter(coach => {
    const matchesSearch = !search || 
      coach.profile?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      coach.headline?.toLowerCase().includes(search.toLowerCase())
    return matchesSearch
  })

  return (
    <div className="min-h-screen bg-surface-50">
      {/* Header */}
      <header className="bg-white border-b border-surface-100 sticky top-0 z-50">
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
            <div className="flex items-center gap-4">
              <Link href="/giris" className="btn btn-ghost btn-md">
                Giriş Yap
              </Link>
              <Link href="/kayit" className="btn btn-primary btn-md">
                Ücretsiz Başla
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Link */}
        <Link href="/" className="inline-flex items-center gap-2 text-surface-600 hover:text-primary-500 mb-6">
          <ArrowLeft className="w-4 h-4" />
          Ana Sayfa
        </Link>

        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-surface-900 mb-2">Eğitim Koçları</h1>
          <p className="text-surface-600">
            Sana en uygun koçu bul, başvur ve eğitim yolculuğuna başla.
          </p>
        </div>

        {/* Search */}
        <div className="mb-8">
          <div className="relative max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Koç veya uzmanlık ara..."
              className="input pl-12"
            />
          </div>
        </div>

        {/* Coaches Grid */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" />
          </div>
        ) : filteredCoaches.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCoaches.map((coach, index) => (
              <motion.div
                key={coach.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Link href={`/koclar/${coach.id}`} className="card block hover:shadow-lg transition-shadow">
                  <div className="p-6">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-primary-400 to-primary-600 rounded-xl flex items-center justify-center text-white text-xl font-bold overflow-hidden">
                        {coach.profile?.avatar_url ? (
                          <img src={coach.profile.avatar_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          getInitials(coach.profile?.full_name)
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-surface-900 truncate">
                          {coach.profile?.full_name}
                        </h3>
                        <div className="flex items-center gap-1 text-yellow-500 mt-1">
                          <Star className="w-4 h-4 fill-current" />
                          <span className="font-medium">{coach.average_rating?.toFixed(1) || '5.0'}</span>
                          <span className="text-surface-400 text-sm">
                            ({coach.review_count || 0})
                          </span>
                        </div>
                      </div>
                    </div>

                    {coach.headline && (
                      <p className="text-surface-600 text-sm mb-4 line-clamp-2">
                        {coach.headline}
                      </p>
                    )}

                    <div className="flex items-center justify-between text-sm pt-4 border-t border-surface-100">
                      <div className="flex items-center gap-1 text-surface-500">
                        <Clock className="w-4 h-4" />
                        <span>{coach.experience_years || 0} yıl</span>
                      </div>
                      <div className="text-primary-500 font-semibold">
                        {coach.hourly_rate ? `${coach.hourly_rate}₺/saat` : 'Ücretsiz'}
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
              {search ? 'Arama kriterlerinize uygun koç bulunamadı.' : 'Henüz kayıtlı koç bulunmuyor.'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
