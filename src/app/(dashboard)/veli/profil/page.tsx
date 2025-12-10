'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { useProfile } from '@/hooks/useProfile'
import { createClient } from '@/lib/supabase/client'
import AvatarUpload from '@/components/ui/AvatarUpload'
import { motion } from 'framer-motion'
import { 
  User,
  Phone,
  Save,
  Loader2,
  CheckCircle
} from 'lucide-react'

export default function ParentProfilePage() {
  const { profile, loading: profileLoading, refetch } = useProfile()
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
  })
  const supabase = createClient()

  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        phone: profile.phone || '',
      })
    }
  }, [profile])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)

    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: formData.full_name,
        phone: formData.phone,
      })
      .eq('id', profile?.id)

    if (!error) {
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
      refetch()
    } else {
      alert('Hata: ' + error.message)
    }

    setSaving(false)
  }

  if (profileLoading) {
    return (
      <DashboardLayout role="veli">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout role="veli">
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
