'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { useProfile, useStudentProfile } from '@/hooks/useProfile'
import { createClient } from '@/lib/supabase/client'
import AvatarUpload from '@/components/ui/AvatarUpload'
import { motion } from 'framer-motion'
import { 
  User,
  Phone,
  School,
  Target,
  Save,
  Loader2,
  CheckCircle,
  GraduationCap
} from 'lucide-react'

export default function StudentProfilePage() {
  const { profile, loading: profileLoading, refetch } = useProfile()
  const { studentProfile, loading: studentLoading, refetch: refetchStudent } = useStudentProfile(profile?.id || '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    grade_level: '',
    school_name: '',
    target_exam: '',
  })
  const supabase = createClient()

  useEffect(() => {
    if (profile && studentProfile) {
      setFormData({
        full_name: profile.full_name || '',
        phone: profile.phone || '',
        grade_level: studentProfile.grade_level || '',
        school_name: studentProfile.school_name || '',
        target_exam: studentProfile.target_exam || '',
      })
    }
  }, [profile, studentProfile])

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

    // Öğrenci profili güncelle
    const { error: studentError } = await supabase
      .from('student_profiles')
      .update({
        grade_level: formData.grade_level,
        school_name: formData.school_name,
        target_exam: formData.target_exam,
      })
      .eq('user_id', profile?.id)

    if (!profileError && !studentError) {
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
      refetch()
      refetchStudent()
    } else {
      alert('Hata: ' + (profileError?.message || studentError?.message))
    }

    setSaving(false)
  }

  const pageLoading = profileLoading || studentLoading

  if (pageLoading) {
    return (
      <DashboardLayout role="ogrenci">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" />
        </div>
      </DashboardLayout>
    )
  }

  const gradeOptions = [
    '5. Sınıf', '6. Sınıf', '7. Sınıf', '8. Sınıf',
    '9. Sınıf', '10. Sınıf', '11. Sınıf', '12. Sınıf',
    'Mezun'
  ]

  const examOptions = [
    'LGS', 'TYT', 'AYT', 'YKS', 'KPSS', 'ALES', 'DGS', 'YDS', 'Diğer'
  ]

  return (
    <DashboardLayout role="ogrenci">
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
          <div className="flex items-center gap-6 mb-6 pb-6 border-b border-surface-100">
            <AvatarUpload
              userId={profile?.id || ''}
              currentAvatarUrl={profile?.avatar_url || null}
              fullName={profile?.full_name}
              onUploadComplete={(url) => {
                refetch()
              }}
              size="md"
            />
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

            {/* Education Info */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="label">
                  <GraduationCap className="w-4 h-4 inline mr-1" />
                  Sınıf
                </label>
                <select
                  value={formData.grade_level}
                  onChange={(e) => setFormData({ ...formData, grade_level: e.target.value })}
                  className="input"
                >
                  <option value="">Seçin</option>
                  {gradeOptions.map(g => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">
                  <Target className="w-4 h-4 inline mr-1" />
                  Hedef Sınav
                </label>
                <select
                  value={formData.target_exam}
                  onChange={(e) => setFormData({ ...formData, target_exam: e.target.value })}
                  className="input"
                >
                  <option value="">Seçin</option>
                  {examOptions.map(e => (
                    <option key={e} value={e}>{e}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* School */}
            <div>
              <label className="label">
                <School className="w-4 h-4 inline mr-1" />
                Okul
              </label>
              <input
                type="text"
                value={formData.school_name}
                onChange={(e) => setFormData({ ...formData, school_name: e.target.value })}
                className="input"
                placeholder="Okulunuzun adı"
              />
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
