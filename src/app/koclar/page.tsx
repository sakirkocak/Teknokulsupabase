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
  Filter,
  ArrowLeft,
  MapPin,
  BookOpen
} from 'lucide-react'

interface Coach {
  id: string
  user_id: string
  bio: string
  subjects: string[]
  experience_years: number
  rating: number
  total_reviews: number
  profile: {
    full_name: string
    avatar_url: string | null
  }
}

export default function CoachesPage() {
  const [coaches, setCoaches] = useState<Coach[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedSubject, setSelectedSubject] = useState('')
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
        bio,
        subjects,
        experience_years,
        rating,
        total_reviews,
        profile:user_id(full_name, avatar_url)
      `)
      .eq('is_coach', true)
      .order('rating', { ascending: false })

    if (data) {
      setCoaches(data as any)
    }
    setLoading(false)
  }

  // Tüm konuları topla
  const allSubjects = [...new Set(coaches.flatMap(c => c.subjects || []))]

  // Filtreleme
  const filteredCoaches = coaches.filter(coach => {
    const matchesSearch = !search || 
      coach.profile?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      coach.subjects?.some(s => s.toLowerCase().includes(search.toLowerCase()))
    
    const matchesSubject = !selectedSubject || 
      coach.subjects?.includes(selectedSubject)

    return matchesSearch && matchesSubject
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

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Koç veya konu ara..."
              className="input pl-12"
            />
          </div>
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="input w-full sm:w-48"
          >
            <option value="">Tüm Konular</option>
            {allSubjects.map(subject => (
              <option key={subject} value={subject}>{subject}</option>
            ))}
          </select>
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
                      <div className="w-16 h-16 bg-gradient-to-br from-primary-400 to-primary-600 rounded-xl flex items-center justify-center text-white text-xl font-bold">
                        {coach.profile?.avatar_url ? (
                          <img src={coach.profile.avatar_url} alt="" className="w-full h-full rounded-xl object-cover" />
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
                          <span className="font-medium">{coach.rating?.toFixed(1) || '5.0'}</span>
                          <span className="text-surface-400 text-sm">
                            ({coach.total_reviews || 0} değerlendirme)
                          </span>
                        </div>
                      </div>
                    </div>

                    {coach.bio && (
                      <p className="text-surface-600 text-sm mb-4 line-clamp-2">
                        {coach.bio}
                      </p>
                    )}

                    {coach.subjects && coach.subjects.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {coach.subjects.slice(0, 3).map((subject, i) => (
                          <span 
                            key={i}
                            className="px-2 py-1 bg-primary-50 text-primary-600 text-xs font-medium rounded-lg"
                          >
                            {subject}
                          </span>
                        ))}
                        {coach.subjects.length > 3 && (
                          <span className="px-2 py-1 bg-surface-100 text-surface-600 text-xs font-medium rounded-lg">
                            +{coach.subjects.length - 3}
                          </span>
                        )}
                      </div>
                    )}

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-surface-500">
                        {coach.experience_years || 0} yıl deneyim
                      </span>
                      <span className="text-primary-500 font-medium">
                        Detaylar →
                      </span>
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
              {search || selectedSubject 
                ? 'Arama kriterlerinize uygun koç bulunamadı.'
                : 'Henüz kayıtlı koç bulunmuyor.'
              }
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

