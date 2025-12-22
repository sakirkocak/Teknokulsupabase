'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useProfile } from '@/hooks/useProfile'
import { createClient } from '@/lib/supabase/client'
import { getInitials } from '@/lib/utils'
import { motion } from 'framer-motion'
import AvatarUpload from '@/components/ui/AvatarUpload'
import { 
  User,
  Phone,
  Save,
  Loader2,
  CheckCircle,
  Shield
} from 'lucide-react'

export default function AdminProfilePage() {
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

  async function handleSave() {
    if (!profile?.id) return
    
    setSaving(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name,
          phone: formData.phone,
          updated_at: new Date().toISOString(),
        })
        .eq('id', profile.id)

      if (error) throw error
      
      await refetch()
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (error) {
      console.error('Error updating profile:', error)
      alert('Profil güncellenirken bir hata oluştu')
    } finally {
      setSaving(false)
    }
  }

  if (profileLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card p-6 bg-gradient-to-r from-surface-800 to-surface-900 text-white"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center">
            <Shield className="w-6 h-6 text-red-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Admin Profili</h1>
            <p className="text-surface-300">Hesap bilgilerinizi yönetin</p>
          </div>
        </div>
      </motion.div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Avatar Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card p-6"
        >
          <h2 className="font-semibold text-surface-900 mb-4">Profil Fotoğrafı</h2>
          <div className="flex flex-col items-center">
            <AvatarUpload
              currentAvatar={profile?.avatar_url}
              userName={profile?.full_name || ''}
              onUploadComplete={async (url) => {
                await supabase
                  .from('profiles')
                  .update({ avatar_url: url })
                  .eq('id', profile?.id)
                refetch()
              }}
            />
            <p className="text-sm text-surface-500 mt-4 text-center">
              JPG, PNG veya GIF formatında yükleyebilirsiniz
            </p>
          </div>
        </motion.div>

        {/* Form Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2 card p-6"
        >
          <h2 className="font-semibold text-surface-900 mb-6">Temel Bilgiler</h2>
          
          <div className="space-y-4">
            {/* Ad Soyad */}
            <div>
              <label className="label">Ad Soyad</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="input pl-10"
                  placeholder="Adınız ve soyadınız"
                />
              </div>
            </div>

            {/* Telefon */}
            <div>
              <label className="label">Telefon</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="input pl-10"
                  placeholder="05XX XXX XX XX"
                />
              </div>
            </div>

            {/* E-posta (readonly) */}
            <div>
              <label className="label">E-posta</label>
              <input
                type="email"
                value={profile?.email || ''}
                className="input bg-surface-50"
                disabled
              />
              <p className="text-xs text-surface-400 mt-1">E-posta adresi değiştirilemez</p>
            </div>

            {/* Rol */}
            <div>
              <label className="label">Rol</label>
              <div className="flex items-center gap-2 px-4 py-3 bg-red-50 rounded-xl border border-red-200">
                <Shield className="w-5 h-5 text-red-500" />
                <span className="font-medium text-red-700">Sistem Yöneticisi (Admin)</span>
              </div>
            </div>

            {/* Save Button */}
            <div className="pt-4">
              <button
                onClick={handleSave}
                disabled={saving}
                className="btn btn-primary btn-lg w-full"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Kaydediliyor...
                  </>
                ) : saved ? (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    Kaydedildi!
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Değişiklikleri Kaydet
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

