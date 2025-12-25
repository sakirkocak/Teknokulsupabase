'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { useProfile, useStudentProfile } from '@/hooks/useProfile'
import { createClient } from '@/lib/supabase/client'
import { getInitials } from '@/lib/utils'
import { motion } from 'framer-motion'
import { 
  Target,
  MessageSquare,
  Clock,
  Star,
  Award,
  Calendar,
  Languages,
  CheckCircle
} from 'lucide-react'

export default function MyCoachPage() {
  const { profile, loading: profileLoading } = useProfile()
  const { studentProfile, loading: studentLoading } = useStudentProfile(profile?.id || '')
  const [coach, setCoach] = useState<any>(null)
  const [relationship, setRelationship] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    if (studentProfile?.id) {
      loadCoach()
    }
  }, [studentProfile?.id])

  async function loadCoach() {
    setLoading(true)
    try {
      // 1. Coaching relationship'i çek
      const { data: relData, error: relError } = await supabase
        .from('coaching_relationships')
        .select('id, coach_id, student_id, status, started_at, created_at')
        .eq('student_id', studentProfile?.id)
        .in('status', ['active', 'pending'])
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (relError || !relData) {
        console.log('Koçluk ilişkisi bulunamadı:', relError)
        setLoading(false)
        return
      }

      setRelationship(relData)

      // 2. Teacher profile çek
      const { data: teacherData, error: teacherError } = await supabase
        .from('teacher_profiles')
        .select('id, user_id, headline, bio, subjects, experience_years, education, languages, hourly_rate, available_days, lesson_types, average_rating, review_count, is_verified')
        .eq('id', relData.coach_id)
        .single()

      if (teacherError || !teacherData) {
        console.error('Koç profili bulunamadı:', teacherError)
        setLoading(false)
        return
      }

      // 3. Profile bilgisini çek
      const { data: profileData } = await supabase
        .from('profiles')
        .select('full_name, avatar_url, email')
        .eq('id', teacherData.user_id)
        .single()

      setCoach({
        ...teacherData,
        profile: profileData
      })
    } catch (err) {
      console.error('Koç yükleme hatası:', err)
    }
    setLoading(false)
  }

  const pageLoading = profileLoading || studentLoading || loading

  if (pageLoading) {
    return (
      <DashboardLayout role="ogrenci">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" />
        </div>
      </DashboardLayout>
    )
  }

  if (!coach) {
    return (
      <DashboardLayout role="ogrenci">
        <div className="max-w-2xl mx-auto">
          <div className="card p-12 text-center">
            <Target className="w-16 h-16 mx-auto mb-4 text-surface-300" />
            <h2 className="text-xl font-bold text-surface-900 mb-2">Henüz koçun yok</h2>
            <p className="text-surface-500 mb-6">
              Bir koç bul ve eğitim yolculuğuna başla!
            </p>
            <Link href="/koclar" className="btn btn-primary btn-lg">
              Koç Bul
            </Link>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  const isPending = relationship?.status === 'pending'

  return (
    <DashboardLayout role="ogrenci">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Status Banner */}
        {isPending && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card p-4 bg-yellow-50 border-yellow-200 flex items-center gap-3"
          >
            <Clock className="w-6 h-6 text-yellow-500" />
            <div>
              <div className="font-medium text-yellow-700">Başvurun değerlendiriliyor</div>
              <div className="text-sm text-yellow-600">Koç en kısa sürede cevap verecek.</div>
            </div>
          </motion.div>
        )}

        {/* Coach Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card overflow-hidden"
        >
          {/* Header */}
          <div className="p-6 sm:p-8 bg-gradient-to-r from-primary-500 to-primary-600 text-white">
            <div className="flex flex-col sm:flex-row items-start gap-6">
              <div className="w-24 h-24 bg-white/20 rounded-2xl flex items-center justify-center text-3xl font-bold overflow-hidden">
                {coach.profile?.avatar_url ? (
                  <img src={coach.profile.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  getInitials(coach.profile?.full_name)
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  {!isPending && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-white/20 rounded-full text-xs font-medium">
                      <CheckCircle className="w-3 h-3" />
                      Koçun
                    </span>
                  )}
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold mb-2">{coach.profile?.full_name}</h1>
                <p className="text-primary-100">{coach.headline}</p>
                <div className="flex flex-wrap items-center gap-4 mt-3 text-primary-100">
                  <div className="flex items-center gap-1">
                    <Star className="w-5 h-5 text-yellow-300 fill-yellow-300" />
                    <span className="font-medium text-white">{coach.average_rating?.toFixed(1) || '5.0'}</span>
                    <span>({coach.review_count || 0})</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-5 h-5" />
                    <span>{coach.experience_years || 0} yıl deneyim</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 sm:p-8 space-y-6">
            {/* Relationship Info */}
            {!isPending && relationship?.started_at && (
              <div className="p-4 bg-secondary-50 rounded-xl flex items-center gap-3">
                <Calendar className="w-6 h-6 text-secondary-500" />
                <div>
                  <div className="font-medium text-secondary-700">
                    {new Date(relationship.started_at).toLocaleDateString('tr-TR')}'den beri koçun
                  </div>
                </div>
              </div>
            )}

            {/* Info Grid */}
            <div className="grid sm:grid-cols-2 gap-4">
              {coach.education && (
                <div className="p-4 bg-surface-50 rounded-xl">
                  <div className="flex items-center gap-2 text-surface-500 mb-1">
                    <Award className="w-4 h-4" />
                    <span className="text-sm">Eğitim</span>
                  </div>
                  <div className="font-medium text-surface-900">{coach.education}</div>
                </div>
              )}
              
              {coach.languages && coach.languages.length > 0 && (
                <div className="p-4 bg-surface-50 rounded-xl">
                  <div className="flex items-center gap-2 text-surface-500 mb-1">
                    <Languages className="w-4 h-4" />
                    <span className="text-sm">Diller</span>
                  </div>
                  <div className="font-medium text-surface-900">{coach.languages.join(', ')}</div>
                </div>
              )}

              {coach.available_days && coach.available_days.length > 0 && (
                <div className="p-4 bg-surface-50 rounded-xl">
                  <div className="flex items-center gap-2 text-surface-500 mb-1">
                    <Calendar className="w-4 h-4" />
                    <span className="text-sm">Müsait Günler</span>
                  </div>
                  <div className="font-medium text-surface-900">{coach.available_days.join(', ')}</div>
                </div>
              )}

              {coach.lesson_types && coach.lesson_types.length > 0 && (
                <div className="p-4 bg-surface-50 rounded-xl">
                  <div className="flex items-center gap-2 text-surface-500 mb-1">
                    <Target className="w-4 h-4" />
                    <span className="text-sm">Ders Türleri</span>
                  </div>
                  <div className="font-medium text-surface-900 capitalize">{coach.lesson_types.join(', ')}</div>
                </div>
              )}
            </div>

            {/* Actions */}
            {!isPending && (
              <div className="pt-4 border-t border-surface-100">
                <Link href="/ogrenci/mesajlar" className="btn btn-primary btn-lg w-full">
                  <MessageSquare className="w-5 h-5" />
                  Koçunla Mesajlaş
                </Link>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  )
}

