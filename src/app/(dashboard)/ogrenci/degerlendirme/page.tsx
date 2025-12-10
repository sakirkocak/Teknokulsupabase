'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { useProfile, useStudentProfile } from '@/hooks/useProfile'
import { createClient } from '@/lib/supabase/client'
import { getInitials } from '@/lib/utils'
import { motion } from 'framer-motion'
import { 
  Star,
  MessageSquare,
  Send,
  Loader2,
  CheckCircle,
  User,
  Clock,
  BookOpen,
  ThumbsUp
} from 'lucide-react'

export default function StudentReviewPage() {
  const router = useRouter()
  const { profile, loading: profileLoading } = useProfile()
  const { studentProfile, loading: studentLoading } = useStudentProfile(profile?.id || '')
  const [coaches, setCoaches] = useState<any[]>([])
  const [selectedCoach, setSelectedCoach] = useState<any>(null)
  const [existingReview, setExistingReview] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  
  const [form, setForm] = useState({
    overall_rating: 0,
    communication_rating: 0,
    knowledge_rating: 0,
    punctuality_rating: 0,
    comment: '',
    is_anonymous: false,
  })

  const supabase = createClient()

  useEffect(() => {
    if (studentProfile?.id) {
      loadCoaches()
    }
  }, [studentProfile?.id])

  useEffect(() => {
    if (selectedCoach) {
      checkExistingReview()
    }
  }, [selectedCoach])

  async function loadCoaches() {
    setLoading(true)

    // Aktif veya tamamlanmış koçluk ilişkilerini al
    const { data } = await supabase
      .from('coaching_relationships')
      .select(`
        *,
        coach:teacher_profiles!coaching_relationships_coach_id_fkey(
          id,
          profile:profiles!teacher_profiles_user_id_fkey(full_name, avatar_url)
        )
      `)
      .eq('student_id', studentProfile?.id)
      .in('status', ['active', 'ended'])

    if (data) {
      const coachList = data.map(d => ({
        relationship_id: d.id,
        status: d.status,
        ...d.coach,
      }))
      setCoaches(coachList)
      
      if (coachList.length === 1) {
        setSelectedCoach(coachList[0])
      }
    }

    setLoading(false)
  }

  async function checkExistingReview() {
    const { data } = await supabase
      .from('reviews')
      .select('*')
      .eq('teacher_id', selectedCoach.id)
      .eq('student_id', studentProfile?.id)
      .single()

    if (data) {
      setExistingReview(data)
      setForm({
        overall_rating: data.overall_rating,
        communication_rating: data.communication_rating,
        knowledge_rating: data.knowledge_rating,
        punctuality_rating: data.punctuality_rating,
        comment: data.comment || '',
        is_anonymous: data.is_anonymous,
      })
    } else {
      setExistingReview(null)
      setForm({
        overall_rating: 0,
        communication_rating: 0,
        knowledge_rating: 0,
        punctuality_rating: 0,
        comment: '',
        is_anonymous: false,
      })
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    if (form.overall_rating === 0 || form.communication_rating === 0 || 
        form.knowledge_rating === 0 || form.punctuality_rating === 0) {
      alert('Lütfen tüm kategorileri puanlayın.')
      return
    }

    setSubmitting(true)

    const reviewData = {
      teacher_id: selectedCoach.id,
      student_id: studentProfile?.id,
      overall_rating: form.overall_rating,
      communication_rating: form.communication_rating,
      knowledge_rating: form.knowledge_rating,
      punctuality_rating: form.punctuality_rating,
      comment: form.comment || null,
      is_anonymous: form.is_anonymous,
    }

    let error
    if (existingReview) {
      // Güncelle
      const result = await supabase
        .from('reviews')
        .update(reviewData)
        .eq('id', existingReview.id)
      error = result.error
    } else {
      // Yeni oluştur
      const result = await supabase
        .from('reviews')
        .insert(reviewData)
      error = result.error
    }

    if (!error) {
      setSubmitted(true)
    } else {
      alert('Hata: ' + error.message)
    }

    setSubmitting(false)
  }

  const StarRating = ({ value, onChange, label }: { value: number; onChange: (v: number) => void; label: string }) => (
    <div className="flex flex-col items-center gap-2">
      <div className="text-sm font-medium text-surface-600">{label}</div>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map(star => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className="focus:outline-none"
          >
            <Star 
              className={`w-8 h-8 transition-colors ${
                star <= value 
                  ? 'text-yellow-400 fill-yellow-400' 
                  : 'text-surface-200 hover:text-yellow-200'
              }`}
            />
          </button>
        ))}
      </div>
    </div>
  )

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

  if (submitted) {
    return (
      <DashboardLayout role="ogrenci">
        <div className="max-w-lg mx-auto">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="card p-12 text-center"
          >
            <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-500" />
            <h2 className="text-xl font-bold text-surface-900 mb-2">Teşekkürler!</h2>
            <p className="text-surface-500 mb-6">
              Değerlendirmeniz başarıyla kaydedildi.
            </p>
            <button
              onClick={() => router.push('/ogrenci')}
              className="btn btn-primary btn-md"
            >
              Dashboard'a Dön
            </button>
          </motion.div>
        </div>
      </DashboardLayout>
    )
  }

  if (coaches.length === 0) {
    return (
      <DashboardLayout role="ogrenci">
        <div className="max-w-lg mx-auto">
          <div className="card p-12 text-center">
            <MessageSquare className="w-16 h-16 mx-auto mb-4 text-surface-300" />
            <h2 className="text-xl font-bold text-surface-900 mb-2">Değerlendirilecek koç yok</h2>
            <p className="text-surface-500">
              Değerlendirme yapmak için aktif veya tamamlanmış bir koçluk ilişkiniz olmalı.
            </p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout role="ogrenci">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Koç Değerlendirmesi</h1>
          <p className="text-surface-500">Koçunuzu değerlendirerek diğer öğrencilere yardımcı olun</p>
        </div>

        {/* Coach Selection */}
        {coaches.length > 1 && !selectedCoach && (
          <div className="card p-6">
            <h2 className="font-semibold text-surface-900 mb-4">Koç Seçin</h2>
            <div className="space-y-3">
              {coaches.map(coach => (
                <button
                  key={coach.id}
                  onClick={() => setSelectedCoach(coach)}
                  className="w-full p-4 bg-surface-50 rounded-xl flex items-center gap-4 hover:bg-surface-100 transition-colors"
                >
                  <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center text-primary-600 font-medium">
                    {getInitials(coach.profile?.full_name)}
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-surface-900">{coach.profile?.full_name}</div>
                    <div className="text-sm text-surface-500">
                      {coach.status === 'active' ? 'Aktif Koçluk' : 'Tamamlanmış Koçluk'}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Review Form */}
        {selectedCoach && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {/* Selected Coach */}
            <div className="card p-6 mb-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-primary-400 to-primary-600 rounded-xl flex items-center justify-center text-white text-xl font-bold">
                  {getInitials(selectedCoach.profile?.full_name)}
                </div>
                <div>
                  <div className="font-semibold text-surface-900 text-lg">{selectedCoach.profile?.full_name}</div>
                  <div className="text-surface-500">Eğitim Koçu</div>
                  {existingReview && (
                    <div className="mt-1 text-sm text-primary-500">
                      Daha önce değerlendirme yaptınız - güncelleme yapabilirsiniz
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="card p-6 space-y-8">
              {/* Star Ratings */}
              <div>
                <h3 className="font-semibold text-surface-900 mb-6 text-center">Puanlama</h3>
                <div className="grid sm:grid-cols-2 gap-8">
                  <StarRating
                    value={form.overall_rating}
                    onChange={(v) => setForm({ ...form, overall_rating: v })}
                    label="Genel Değerlendirme"
                  />
                  <StarRating
                    value={form.communication_rating}
                    onChange={(v) => setForm({ ...form, communication_rating: v })}
                    label="İletişim"
                  />
                  <StarRating
                    value={form.knowledge_rating}
                    onChange={(v) => setForm({ ...form, knowledge_rating: v })}
                    label="Bilgi Düzeyi"
                  />
                  <StarRating
                    value={form.punctuality_rating}
                    onChange={(v) => setForm({ ...form, punctuality_rating: v })}
                    label="Dakiklik"
                  />
                </div>
              </div>

              {/* Comment */}
              <div>
                <label className="label">Yorumunuz (Opsiyonel)</label>
                <textarea
                  value={form.comment}
                  onChange={(e) => setForm({ ...form, comment: e.target.value })}
                  className="input min-h-[120px]"
                  placeholder="Koçunuzla ilgili deneyimlerinizi paylaşın..."
                />
              </div>

              {/* Anonymous */}
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="anonymous"
                  checked={form.is_anonymous}
                  onChange={(e) => setForm({ ...form, is_anonymous: e.target.checked })}
                  className="w-5 h-5 rounded border-surface-300 text-primary-500 focus:ring-primary-500"
                />
                <label htmlFor="anonymous" className="text-surface-700">
                  Anonim olarak değerlendirme yap (isminiz görünmez)
                </label>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={submitting}
                className="btn btn-primary btn-lg w-full"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Gönderiliyor...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    {existingReview ? 'Değerlendirmeyi Güncelle' : 'Değerlendirme Gönder'}
                  </>
                )}
              </button>
            </form>
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  )
}


