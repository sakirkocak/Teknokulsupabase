'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useProfile, useStudentProfile } from '@/hooks/useProfile'
import { getInitials } from '@/lib/utils'
import { motion } from 'framer-motion'
import { 
  GraduationCap, 
  Star, 
  Clock,
  ArrowLeft,
  Send,
  CheckCircle,
  Loader2,
  BookOpen,
  Award,
  Languages,
  Calendar
} from 'lucide-react'

export default function CoachDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { profile } = useProfile()
  const { studentProfile } = useStudentProfile(profile?.id || '')
  const [coach, setCoach] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [applying, setApplying] = useState(false)
  const [applicationStatus, setApplicationStatus] = useState<'none' | 'pending' | 'active'>('none')
  const supabase = createClient()

  useEffect(() => {
    if (params.id) {
      loadCoach()
    }
  }, [params.id])

  useEffect(() => {
    if (studentProfile?.id && coach?.id) {
      checkApplicationStatus()
    }
  }, [studentProfile?.id, coach?.id])

  async function loadCoach() {
    const { data } = await supabase
      .from('teacher_profiles')
      .select(`
        *,
        profile:profiles!teacher_profiles_user_id_fkey(full_name, avatar_url, email, bio)
      `)
      .eq('id', params.id)
      .single()

    if (data) {
      setCoach(data)
    }
    setLoading(false)
  }

  async function checkApplicationStatus() {
    const { data } = await supabase
      .from('coaching_relationships')
      .select('status')
      .eq('coach_id', coach.id)
      .eq('student_id', studentProfile?.id)
      .single()

    if (data) {
      setApplicationStatus(data.status as any)
    }
  }

  async function handleApply() {
    if (!profile) {
      router.push('/giris')
      return
    }

    if (profile.role !== 'ogrenci') {
      alert('Sadece öğrenciler koçluk başvurusu yapabilir.')
      return
    }

    if (!studentProfile) {
      alert('Öğrenci profiliniz bulunamadı.')
      return
    }

    setApplying(true)

    const { error } = await supabase
      .from('coaching_relationships')
      .insert({
        coach_id: coach.id,
        student_id: studentProfile.id,
        status: 'pending',
      })

    if (error) {
      if (error.code === '23505') {
        alert('Zaten başvuru yapmışsınız.')
      } else {
        console.error(error)
        alert('Bir hata oluştu: ' + error.message)
      }
    } else {
      setApplicationStatus('pending')
    }

    setApplying(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  if (!coach) {
    return (
      <div className="min-h-screen bg-surface-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-surface-900 mb-2">Koç Bulunamadı</h1>
          <Link href="/koclar" className="text-primary-500 hover:underline">
            Koçlara dön
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-surface-50">
      {/* Header */}
      <header className="bg-white border-b border-surface-100">
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
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link href="/koclar" className="inline-flex items-center gap-2 text-surface-600 hover:text-primary-500 mb-6">
          <ArrowLeft className="w-4 h-4" />
          Tüm Koçlar
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card overflow-hidden"
        >
          {/* Header Section */}
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
                <h1 className="text-2xl sm:text-3xl font-bold mb-2">{coach.profile?.full_name}</h1>
                <p className="text-primary-100 mb-3">{coach.headline}</p>
                <div className="flex flex-wrap items-center gap-4 text-primary-100">
                  <div className="flex items-center gap-1">
                    <Star className="w-5 h-5 text-yellow-300 fill-yellow-300" />
                    <span className="font-medium text-white">{coach.average_rating?.toFixed(1) || '5.0'}</span>
                    <span>({coach.review_count || 0} değerlendirme)</span>
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
            {/* Bio */}
            {coach.profile?.bio && (
              <div>
                <h2 className="text-lg font-semibold text-surface-900 mb-3">Hakkında</h2>
                <p className="text-surface-600 leading-relaxed">{coach.profile.bio}</p>
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
                    <BookOpen className="w-4 h-4" />
                    <span className="text-sm">Ders Türleri</span>
                  </div>
                  <div className="font-medium text-surface-900 capitalize">{coach.lesson_types.join(', ')}</div>
                </div>
              )}
            </div>

            {/* Price */}
            <div className="p-4 bg-primary-50 rounded-xl flex items-center justify-between">
              <span className="text-surface-700">Saatlik Ücret</span>
              <span className="text-2xl font-bold text-primary-600">
                {coach.hourly_rate ? `${coach.hourly_rate}₺` : 'Ücretsiz'}
              </span>
            </div>

            {/* Apply Button */}
            <div className="pt-4 border-t border-surface-100">
              {applicationStatus === 'active' ? (
                <div className="flex items-center gap-3 p-4 bg-secondary-50 rounded-xl">
                  <CheckCircle className="w-6 h-6 text-secondary-500" />
                  <div>
                    <div className="font-medium text-secondary-700">Bu koçun öğrencisisin!</div>
                    <div className="text-sm text-secondary-600">Dashboard'undan koçunla iletişime geçebilirsin.</div>
                  </div>
                </div>
              ) : applicationStatus === 'pending' ? (
                <div className="flex items-center gap-3 p-4 bg-yellow-50 rounded-xl">
                  <Clock className="w-6 h-6 text-yellow-500" />
                  <div>
                    <div className="font-medium text-yellow-700">Başvurun onay bekliyor</div>
                    <div className="text-sm text-yellow-600">Koç başvurunu en kısa sürede değerlendirecek.</div>
                  </div>
                </div>
              ) : (
                <button
                  onClick={handleApply}
                  disabled={applying}
                  className="btn btn-primary btn-lg w-full"
                >
                  {applying ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      Koçluk Başvurusu Yap
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
