'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useProfile } from '@/hooks/useProfile'
import { 
  User, Mail, Lock, Save, Loader2, 
  CheckCircle, Shield, Eye, EyeOff, Camera
} from 'lucide-react'
import { motion } from 'framer-motion'
import AvatarUpload from '@/components/ui/AvatarUpload'

export default function AdminProfilPage() {
  const router = useRouter()
  const supabase = createClient()
  const { profile, loading: profileLoading } = useProfile()
  
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPasswords, setShowPasswords] = useState(false)
  
  const [saving, setSaving] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '')
      setEmail(profile.email || '')
      setAvatarUrl(profile.avatar_url || null)
    }
  }, [profile])

  const handleAvatarUpload = (url: string) => {
    setAvatarUrl(url)
    setSuccess('Profil resmi güncellendi!')
    setTimeout(() => setSuccess(''), 3000)
  }

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')

    try {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          updated_at: new Date().toISOString()
        })
        .eq('id', profile?.id)

      if (updateError) throw updateError

      setSuccess('Profil bilgileri güncellendi!')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err: any) {
      setError(err.message || 'Profil güncellenirken hata oluştu')
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setChangingPassword(true)
    setError('')
    setSuccess('')

    if (newPassword !== confirmPassword) {
      setError('Yeni şifreler eşleşmiyor')
      setChangingPassword(false)
      return
    }

    if (newPassword.length < 6) {
      setError('Şifre en az 6 karakter olmalıdır')
      setChangingPassword(false)
      return
    }

    try {
      const { error: passwordError } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (passwordError) throw passwordError

      setSuccess('Şifre başarıyla değiştirildi!')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err: any) {
      setError(err.message || 'Şifre değiştirilirken hata oluştu')
    } finally {
      setChangingPassword(false)
    }
  }

  if (profileLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="p-3 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-surface-900">Admin Profili</h1>
            <p className="text-surface-500">Hesap ayarlarınızı yönetin</p>
          </div>
        </div>
      </motion.div>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6"
        >
          {error}
        </motion.div>
      )}

      {success && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl mb-6 flex items-center gap-2"
        >
          <CheckCircle className="w-5 h-5" />
          {success}
        </motion.div>
      )}

      <div className="grid gap-6">
        {/* Profil Resmi */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="card p-6"
        >
          <h2 className="text-xl font-semibold text-surface-900 mb-6 flex items-center gap-2">
            <Camera className="w-5 h-5 text-purple-500" />
            Profil Resmi
          </h2>
          
          <div className="flex justify-center">
            {profile && (
              <AvatarUpload
                userId={profile.id}
                currentAvatarUrl={avatarUrl}
                fullName={profile.full_name}
                onUploadComplete={handleAvatarUpload}
                size="lg"
              />
            )}
          </div>
        </motion.div>

        {/* Profil Bilgileri */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card p-6"
        >
          <h2 className="text-xl font-semibold text-surface-900 mb-6 flex items-center gap-2">
            <User className="w-5 h-5 text-purple-500" />
            Profil Bilgileri
          </h2>
          
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div>
              <label className="label">Ad Soyad</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="input pl-12"
                  placeholder="Adınız Soyadınız"
                />
              </div>
            </div>

            <div>
              <label className="label">E-posta</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
                <input
                  type="email"
                  value={email}
                  disabled
                  className="input pl-12 bg-surface-50 cursor-not-allowed"
                />
              </div>
              <p className="text-xs text-surface-500 mt-1">E-posta adresi değiştirilemez</p>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="btn btn-primary"
            >
              {saving ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Kaydet
                </>
              )}
            </button>
          </form>
        </motion.div>

        {/* Şifre Değiştir */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card p-6"
        >
          <h2 className="text-xl font-semibold text-surface-900 mb-6 flex items-center gap-2">
            <Lock className="w-5 h-5 text-purple-500" />
            Şifre Değiştir
          </h2>
          
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="label">Yeni Şifre</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
                <input
                  type={showPasswords ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="input pl-12 pr-12"
                  placeholder="En az 6 karakter"
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords(!showPasswords)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600"
                >
                  {showPasswords ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="label">Yeni Şifre Tekrar</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
                <input
                  type={showPasswords ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="input pl-12"
                  placeholder="Şifreyi tekrar girin"
                  minLength={6}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={changingPassword || !newPassword || !confirmPassword}
              className="btn btn-primary"
            >
              {changingPassword ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Lock className="w-5 h-5" />
                  Şifreyi Değiştir
                </>
              )}
            </button>
          </form>
        </motion.div>

        {/* Admin Bilgileri */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="card p-6 bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200"
        >
          <h2 className="text-xl font-semibold text-purple-900 mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-purple-600" />
            Admin Yetkileriniz
          </h2>
          
          <ul className="space-y-2 text-purple-800">
            <li className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-purple-500" />
              Kullanıcı yönetimi
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-purple-500" />
              Soru oluşturma ve yönetimi
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-purple-500" />
              İçerik yönetimi
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-purple-500" />
              Raporlar ve istatistikler
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-purple-500" />
              Sistem ayarları
            </li>
          </ul>
        </motion.div>
      </div>
    </div>
  )
}

