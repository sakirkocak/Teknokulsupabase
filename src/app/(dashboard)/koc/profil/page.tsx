'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { useProfile, useTeacherProfile } from '@/hooks/useProfile'
import { createClient } from '@/lib/supabase/client'
import { getInitials } from '@/lib/utils'
import { motion } from 'framer-motion'
import { 
  User,
  Mail,
  Phone,
  BookOpen,
  Award,
  Save,
  Loader2,
  CheckCircle
} from 'lucide-react'

export default function CoachProfilePage() {
  const { profile, loading: profileLoading, refetch } = useProfile()
  const { teacherProfile, loading: teacherLoading, refetch: refetchTeacher } = useTeacherProfile(profile?.id || '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    headline: '',
    bio: '',
    education: '',
    experience_years: 0,
    hourly_rate: 0,
    is_coach: true,
  })
  const supabase = createClient()

  useEffect(() => {
    if (profile && teacherProfile) {
      setFormData({
        full_name: profile.full_name || '',
        phone: profile.phone || '',
        headline: teacherProfile.headline || '',
        bio: teacherProfile.bio || '',
        education: teacherProfile.education || '',
        experience_years: teacherProfile.experience_years || 0,
        hourly_rate: teacherProfile.hourly_rate || 0,
        is_coach: teacherProfile.is_coach !== false,
      })
    }
  }, [profile, teacherProfile])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)

    // Profil güncelle
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        full_name: formData.full_name,
        phone: formData.phone,
      })
      .eq('id', profile?.id)

    // Öğretmen profili güncelle
    const { error: teacherError } = await supabase
      .from('teacher_profiles')
      .update({
        headline: formData.headline,
        bio: formData.bio,
        education: formData.education,
        experience_years: formData.experience_years,
        hourly_rate: formData.hourly_rate,
        is_coach: formData.is_coach,
      })
      .eq('user_id', profile?.id)

    if (!profileError && !teacherError) {
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
      refetch()
      refetchTeacher()
    } else {
      alert('Hata: ' + (profileError?.message || teacherError?.message))
    }

    setSaving(false)
  }

  const pageLoading = profileLoading || teacherLoading

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
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Profilim</h1>
          <p className="text-surface-500">Profil bilgilerini düzenle</p>
        </div>

        {/* Success Message */}
        {saved && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-green-50 text-green-700 rounded-xl flex items-center gap-2"
          >
            <CheckCircle className="w-5 h-5" />
            Profil başarıyla güncellendi!
          </motion.div>
        )}

        {/* Profile Card */}
        <div className="card p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-primary-400 to-primary-600 rounded-2xl flex items-center justify-center text-white text-2xl font-bold overflow-hidden">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                getInitials(profile?.full_name)
              )}
            </div>
            <div>
              <div className="font-semibold text-surface-900 text-lg">{profile?.full_name}</div>
              <div className="text-surface-500">{profile?.email}</div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Info */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="label">
                  <User className="w-4 h-4 inline mr-1" />
                  Ad Soyad
                </label>
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="input"
                  required
                />
              </div>
              <div>
                <label className="label">
                  <Phone className="w-4 h-4 inline mr-1" />
                  Telefon
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="input"
                  placeholder="05XX XXX XX XX"
                />
              </div>
            </div>

            {/* Headline */}
            <div>
              <label className="label">Başlık</label>
              <input
                type="text"
                value={formData.headline}
                onChange={(e) => setFormData({ ...formData, headline: e.target.value })}
                className="input"
                placeholder="Örn: Matematik Öğretmeni & Eğitim Koçu"
              />
            </div>

            {/* Bio */}
            <div>
              <label className="label">Hakkımda</label>
              <textarea
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                className="input min-h-[120px]"
                placeholder="Kendinizi tanıtın..."
              />
            </div>

            {/* Professional Info */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="label">
                  <Award className="w-4 h-4 inline mr-1" />
                  Eğitim
                </label>
                <input
                  type="text"
                  value={formData.education}
                  onChange={(e) => setFormData({ ...formData, education: e.target.value })}
                  className="input"
                  placeholder="Örn: Boğaziçi Üniversitesi - Matematik"
                />
              </div>
              <div>
                <label className="label">Deneyim (Yıl)</label>
                <input
                  type="number"
                  value={formData.experience_years}
                  onChange={(e) => setFormData({ ...formData, experience_years: parseInt(e.target.value) || 0 })}
                  className="input"
                  min="0"
                />
              </div>
            </div>

            {/* Rate & Coach */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Saatlik Ücret (₺)</label>
                <input
                  type="number"
                  value={formData.hourly_rate}
                  onChange={(e) => setFormData({ ...formData, hourly_rate: parseInt(e.target.value) || 0 })}
                  className="input"
                  min="0"
                />
              </div>
              <div className="flex items-center gap-3 pt-6">
                <input
                  type="checkbox"
                  id="is_coach"
                  checked={formData.is_coach}
                  onChange={(e) => setFormData({ ...formData, is_coach: e.target.checked })}
                  className="w-5 h-5 rounded border-surface-300 text-primary-500 focus:ring-primary-500"
                />
                <label htmlFor="is_coach" className="text-surface-700">
                  Eğitim koçluğu yapıyorum
                </label>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={saving}
              className="btn btn-primary btn-lg w-full"
            >
              {saving ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Kaydediliyor...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Kaydet
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </DashboardLayout>
  )
}

