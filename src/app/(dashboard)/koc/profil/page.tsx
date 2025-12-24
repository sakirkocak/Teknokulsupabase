'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { useProfile, useTeacherProfile } from '@/hooks/useProfile'
import { createClient } from '@/lib/supabase/client'
import { getInitials } from '@/lib/utils'
import { motion } from 'framer-motion'
import AvatarUpload from '@/components/ui/AvatarUpload'
import { 
  User,
  Phone,
  Award,
  Save,
  Loader2,
  CheckCircle,
  Video,
  Target,
  BookOpen,
  Users,
  Trophy,
  Eye,
  EyeOff,
  Plus,
  X,
  ExternalLink,
  Trash2,
  AlertTriangle
} from 'lucide-react'
import Link from 'next/link'
import { trackSignup } from '@/lib/gtag'

function CoachProfileContent() {
  const searchParams = useSearchParams()
  const { profile, loading: profileLoading, refetch } = useProfile()
  const { teacherProfile, loading: teacherLoading, refetch: refetchTeacher } = useTeacherProfile(profile?.id || '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [activeTab, setActiveTab] = useState<'basic' | 'listing'>('basic')
  
  // Temel bilgiler
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    headline: '',
    bio: '',
    education: '',
    experience_years: 0,
  })

  // İlan bilgileri
  const [listingData, setListingData] = useState({
    video_url: '',
    specializations: [] as string[],
    teaching_style: '',
    target_students: '',
    achievements: '',
    certificates: [] as { name: string; issuer: string; url: string }[],
    is_listed: true,
    is_coach: true,
  })

  const [newSpecialization, setNewSpecialization] = useState('')
  const [newCertificate, setNewCertificate] = useState({ name: '', issuer: '', url: '' })

  const supabase = createClient()

  // Yeni kayıt dönüşüm takibi (Google Ads)
  useEffect(() => {
    const isWelcome = searchParams.get('welcome') === 'true'
    if (isWelcome) {
      // Google Ads dönüşümünü tetikle
      trackSignup('ogretmen')
      console.log('📊 Koç kayıt dönüşümü izlendi')
    }
  }, [searchParams])

  useEffect(() => {
    if (profile && teacherProfile) {
      setFormData({
        full_name: profile.full_name || '',
        phone: profile.phone || '',
        headline: teacherProfile.headline || '',
        bio: teacherProfile.bio || '',
        education: teacherProfile.education || '',
        experience_years: teacherProfile.experience_years || 0,
      })

      setListingData({
        video_url: teacherProfile.video_url || '',
        specializations: teacherProfile.specializations || [],
        teaching_style: teacherProfile.teaching_style || '',
        target_students: teacherProfile.target_students || '',
        achievements: teacherProfile.achievements || '',
        certificates: teacherProfile.certificates || [],
        is_listed: teacherProfile.is_listed !== false,
        is_coach: teacherProfile.is_coach !== false,
      })
    }
  }, [profile, teacherProfile])

  function addSpecialization() {
    if (newSpecialization.trim() && !listingData.specializations.includes(newSpecialization.trim())) {
      setListingData({
        ...listingData,
        specializations: [...listingData.specializations, newSpecialization.trim()]
      })
      setNewSpecialization('')
    }
  }

  function removeSpecialization(spec: string) {
    setListingData({
      ...listingData,
      specializations: listingData.specializations.filter(s => s !== spec)
    })
  }

  function addCertificate() {
    if (newCertificate.name.trim()) {
      setListingData({
        ...listingData,
        certificates: [...listingData.certificates, { ...newCertificate }]
      })
      setNewCertificate({ name: '', issuer: '', url: '' })
    }
  }

  function removeCertificate(index: number) {
    setListingData({
      ...listingData,
      certificates: listingData.certificates.filter((_, i) => i !== index)
    })
  }

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
        video_url: listingData.video_url,
        specializations: listingData.specializations,
        teaching_style: listingData.teaching_style,
        target_students: listingData.target_students,
        achievements: listingData.achievements,
        certificates: listingData.certificates,
        is_listed: listingData.is_listed,
        is_coach: listingData.is_coach,
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

  const specializationOptions = [
    'Matematik', 'Fizik', 'Kimya', 'Biyoloji', 'Türkçe', 'Edebiyat',
    'Tarih', 'Coğrafya', 'İngilizce', 'Almanca', 'Fransızca',
    'LGS Hazırlık', 'YKS Hazırlık', 'TYT', 'AYT', 'KPSS',
    'Kariyer Koçluğu', 'Motivasyon', 'Zaman Yönetimi', 'Sınav Stratejisi'
  ]

  return (
    <DashboardLayout role="koc">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Profilim & İlan Ayarları</h1>
          <p className="text-surface-500">Profil bilgilerini ve ilan ayarlarını düzenle</p>
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

        {/* Tabs */}
        <div className="flex gap-2 p-1 bg-surface-100 rounded-xl">
          <button
            onClick={() => setActiveTab('basic')}
            className={`flex-1 py-2 px-4 rounded-lg font-medium text-sm transition-colors ${
              activeTab === 'basic'
                ? 'bg-white text-surface-900 shadow-sm'
                : 'text-surface-600 hover:text-surface-900'
            }`}
          >
            <User className="w-4 h-4 inline mr-2" />
            Temel Bilgiler
          </button>
          <button
            onClick={() => setActiveTab('listing')}
            className={`flex-1 py-2 px-4 rounded-lg font-medium text-sm transition-colors ${
              activeTab === 'listing'
                ? 'bg-white text-surface-900 shadow-sm'
                : 'text-surface-600 hover:text-surface-900'
            }`}
          >
            <Eye className="w-4 h-4 inline mr-2" />
            İlan Ayarları
          </button>
        </div>

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
              <div className="flex items-center gap-2 mt-2">
                {listingData.is_listed ? (
                  <span className="px-2 py-1 bg-green-50 text-green-600 text-xs font-medium rounded-full flex items-center gap-1">
                    <Eye className="w-3 h-3" />
                    İlanlarda Görünür
                  </span>
                ) : (
                  <span className="px-2 py-1 bg-surface-100 text-surface-500 text-xs font-medium rounded-full flex items-center gap-1">
                    <EyeOff className="w-3 h-3" />
                    İlanlarda Gizli
                  </span>
                )}
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {activeTab === 'basic' && (
              <>
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
                  <label className="label">Başlık / Unvan</label>
                  <input
                    type="text"
                    value={formData.headline}
                    onChange={(e) => setFormData({ ...formData, headline: e.target.value })}
                    className="input"
                    placeholder="Örn: 10 Yıllık Deneyimli Matematik Öğretmeni"
                  />
                </div>

                {/* Bio */}
                <div>
                  <label className="label">Hakkımda</label>
                  <textarea
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    className="input min-h-[120px]"
                    placeholder="Kendinizi ve deneyimlerinizi anlatın..."
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
              </>
            )}

            {activeTab === 'listing' && (
              <>
                {/* Listing Toggle */}
                <div className="p-4 bg-surface-50 rounded-xl flex items-center justify-between">
                  <div>
                    <div className="font-medium text-surface-900">İlanlarda Görün</div>
                    <div className="text-sm text-surface-500">Koç listesinde profiliniz görünsün mü?</div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={listingData.is_listed}
                      onChange={(e) => setListingData({ ...listingData, is_listed: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-surface-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-surface-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
                  </label>
                </div>

                {/* Video URL */}
                <div>
                  <label className="label">
                    <Video className="w-4 h-4 inline mr-1" />
                    Tanıtım Videosu (YouTube)
                  </label>
                  <input
                    type="url"
                    value={listingData.video_url}
                    onChange={(e) => setListingData({ ...listingData, video_url: e.target.value })}
                    className="input"
                    placeholder="https://youtube.com/watch?v=..."
                  />
                  <p className="text-xs text-surface-500 mt-1">YouTube video linki yapıştırın</p>
                </div>

                {/* Specializations */}
                <div>
                  <label className="label">
                    <Target className="w-4 h-4 inline mr-1" />
                    Uzmanlık Alanları
                  </label>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {listingData.specializations.map((spec, i) => (
                      <span 
                        key={i}
                        className="px-3 py-1.5 bg-primary-50 text-primary-600 font-medium rounded-full flex items-center gap-2"
                      >
                        {spec}
                        <button
                          type="button"
                          onClick={() => removeSpecialization(spec)}
                          className="hover:text-primary-800"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <select
                      value={newSpecialization}
                      onChange={(e) => setNewSpecialization(e.target.value)}
                      className="input flex-1"
                    >
                      <option value="">Alan seçin veya yazın</option>
                      {specializationOptions.filter(s => !listingData.specializations.includes(s)).map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={addSpecialization}
                      className="btn btn-outline btn-md"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <input
                    type="text"
                    value={newSpecialization}
                    onChange={(e) => setNewSpecialization(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSpecialization())}
                    className="input mt-2"
                    placeholder="Veya özel alan yazın ve Enter'a basın"
                  />
                </div>

                {/* Teaching Style */}
                <div>
                  <label className="label">
                    <BookOpen className="w-4 h-4 inline mr-1" />
                    Öğretim Tarzı
                  </label>
                  <textarea
                    value={listingData.teaching_style}
                    onChange={(e) => setListingData({ ...listingData, teaching_style: e.target.value })}
                    className="input min-h-[100px]"
                    placeholder="Ders anlatım ve çalışma tarzınızı açıklayın..."
                  />
                </div>

                {/* Target Students */}
                <div>
                  <label className="label">
                    <Users className="w-4 h-4 inline mr-1" />
                    Hedef Öğrenci Kitlesi
                  </label>
                  <textarea
                    value={listingData.target_students}
                    onChange={(e) => setListingData({ ...listingData, target_students: e.target.value })}
                    className="input min-h-[80px]"
                    placeholder="Hangi öğrencilerle çalışmak istiyorsunuz? (sınıf, seviye, hedef vb.)"
                  />
                </div>

                {/* Achievements */}
                <div>
                  <label className="label">
                    <Trophy className="w-4 h-4 inline mr-1" />
                    Başarılar / Kazanımlar
                  </label>
                  <textarea
                    value={listingData.achievements}
                    onChange={(e) => setListingData({ ...listingData, achievements: e.target.value })}
                    className="input min-h-[100px]"
                    placeholder="Öğrencilerinizin başarıları, ödülleriniz vb."
                  />
                </div>

                {/* Certificates */}
                <div>
                  <label className="label">
                    <Award className="w-4 h-4 inline mr-1" />
                    Sertifikalar
                  </label>
                  
                  {listingData.certificates.length > 0 && (
                    <div className="space-y-2 mb-4">
                      {listingData.certificates.map((cert, i) => (
                        <div key={i} className="p-3 bg-yellow-50 rounded-xl flex items-center gap-3">
                          <Award className="w-6 h-6 text-yellow-500" />
                          <div className="flex-1">
                            <div className="font-medium text-surface-900">{cert.name}</div>
                            {cert.issuer && <div className="text-sm text-surface-500">{cert.issuer}</div>}
                          </div>
                          {cert.url && (
                            <a href={cert.url} target="_blank" rel="noopener noreferrer" className="text-primary-500">
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          )}
                          <button
                            type="button"
                            onClick={() => removeCertificate(i)}
                            className="text-red-500 hover:text-red-600"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="grid sm:grid-cols-3 gap-2">
                    <input
                      type="text"
                      value={newCertificate.name}
                      onChange={(e) => setNewCertificate({ ...newCertificate, name: e.target.value })}
                      className="input"
                      placeholder="Sertifika Adı"
                    />
                    <input
                      type="text"
                      value={newCertificate.issuer}
                      onChange={(e) => setNewCertificate({ ...newCertificate, issuer: e.target.value })}
                      className="input"
                      placeholder="Veren Kurum"
                    />
                    <div className="flex gap-2">
                      <input
                        type="url"
                        value={newCertificate.url}
                        onChange={(e) => setNewCertificate({ ...newCertificate, url: e.target.value })}
                        className="input flex-1"
                        placeholder="Link (opsiyonel)"
                      />
                      <button
                        type="button"
                        onClick={addCertificate}
                        className="btn btn-outline btn-md"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}

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

        {/* Danger Zone - Hesap Silme */}
        <div className="card p-6 border-2 border-red-200 bg-red-50/50">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-red-800 mb-1">Tehlikeli Bölge</h3>
              <p className="text-sm text-red-600 mb-4">
                Hesabınızı sildiğinizde tüm verileriniz, koçluk ilanınız ve öğrenci ilişkileriniz kalıcı olarak silinir. Bu işlem geri alınamaz.
              </p>
              <Link
                href="/yasal/hesap-silme"
                className="inline-flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-medium rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Hesabımı Sil
              </Link>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default function CoachProfilePage() {
  return (
    <Suspense fallback={
      <DashboardLayout role="koc">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" />
        </div>
      </DashboardLayout>
    }>
      <CoachProfileContent />
    </Suspense>
  )
}
