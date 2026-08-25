'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, Suspense } from 'react'
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
  GraduationCap,
  MapPin,
  Building2,
  Trophy,
  Medal,
  Sparkles,
  Trash2,
  AlertTriangle
} from 'lucide-react'
import Link from 'next/link'
import { TurkeyCity, TurkeyDistrict, School as SchoolType, League } from '@/types/database'

function StudentProfileContent() {
  const { profile, loading: profileLoading, refetch } = useProfile()
  const { studentProfile, loading: studentLoading, refetch: refetchStudent } = useStudentProfile(profile?.id || '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  
  // Location states
  const [cities, setCities] = useState<TurkeyCity[]>([])
  const [districts, setDistricts] = useState<TurkeyDistrict[]>([])
  const [schools, setSchools] = useState<{id: string, name: string, district_id: string}[]>([])
  const [league, setLeague] = useState<any>(null)
  const [studentPoints, setStudentPoints] = useState<any>(null)
  
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    grade: '',
    grade_level: '',
    school_name: '',
    target_exam: '',
    city_id: '',
    district_id: '',
    school_id: '',
  })
  
  const supabase = createClient()

  // İlleri yükle
  useEffect(() => {
    async function loadCities() {
      const { data } = await supabase
        .from('turkey_cities')
        .select('id, name') // OPTIMIZE: Sadece gerekli alanlar
        .order('name')
      if (data) setCities(data as any)
    }
    loadCities()
  }, [])

  // İl seçildiğinde ilçeleri yükle
  useEffect(() => {
    async function loadDistricts() {
      if (!formData.city_id) {
        setDistricts([])
        return
      }
      const { data } = await supabase
        .from('turkey_districts')
        .select('id, name, city_id') // OPTIMIZE: Sadece gerekli alanlar
        .eq('city_id', formData.city_id)
        .order('name')
      if (data) setDistricts(data as any)
    }
    loadDistricts()
  }, [formData.city_id])

  // İlçe seçildiğinde okulları yükle
  useEffect(() => {
    async function loadSchools() {
      if (!formData.district_id) {
        setSchools([])
        return
      }
      const { data } = await supabase
        .from('schools')
        .select('id, name, district_id')
        .eq('district_id', formData.district_id)
        .order('name')
        .limit(1000) // Güvenlik limiti - en kalabalık ilçelerde bile 300'den az okul var
      if (data) setSchools(data)
    }
    loadSchools()
  }, [formData.district_id])

  // Form verilerini doldur
  useEffect(() => {
    if (profile && studentProfile) {
      setFormData({
        full_name: profile.full_name || '',
        phone: profile.phone || '',
        grade: studentProfile.grade?.toString() || '',
        grade_level: studentProfile.grade_level || '',
        school_name: studentProfile.school_name || '',
        target_exam: studentProfile.target_exam || '',
        city_id: studentProfile.city_id || '',
        district_id: studentProfile.district_id || '',
        school_id: studentProfile.school_id || '',
      })
    }
  }, [profile, studentProfile])

  // Öğrenci puanlarını ve ligini yükle
  useEffect(() => {
    async function loadStudentData() {
      if (!studentProfile?.id) return

      // Puanları al
      let { data: points } = await supabase
        .from('student_points')
        .select('*')
        .eq('student_id', studentProfile.id)
        .single()
      
      // Kayıt yoksa oluştur (liderlik tablosunda görünmek için)
      if (!points) {
        const { data: newPoints } = await supabase
          .from('student_points')
          .insert({
            student_id: studentProfile.id,
            total_points: 0,
            total_questions: 0,
            total_correct: 0,
            total_wrong: 0,
            current_streak: 0,
            max_streak: 0
          })
          .select()
          .single()
        
        points = newPoints
      }
      
      if (points) {
        setStudentPoints(points)
        
        // Ligi hesapla
        const { data: leagueData } = await supabase
          .rpc('get_student_league', { p_points: points.total_points })
        
        if (leagueData && leagueData.length > 0) {
          setLeague(leagueData[0])
        }
      }
    }
    loadStudentData()
  }, [studentProfile?.id])

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
    const gradeNumber = formData.grade ? parseInt(formData.grade) : null
    
    const { error: studentError } = await supabase
      .from('student_profiles')
      .update({
        grade: gradeNumber,
        grade_level: formData.grade_level,
        school_name: formData.school_name || (formData.school_id ? null : formData.school_name),
        target_exam: formData.target_exam,
        city_id: formData.city_id || null,
        district_id: formData.district_id || null,
        school_id: formData.school_id || null,
      })
      .eq('user_id', profile?.id)

    // student_points kaydı yoksa oluştur (liderlik tablosunda görünmek için)
    if (studentProfile?.id) {
      const { data: existingPoints } = await supabase
        .from('student_points')
        .select('id')
        .eq('student_id', studentProfile.id)
        .single()

      if (!existingPoints) {
        await supabase
          .from('student_points')
          .insert({
            student_id: studentProfile.id,
            total_points: 0,
            total_questions: 0,
            total_correct: 0,
            total_wrong: 0,
            current_streak: 0,
            max_streak: 0
          })
      }
    }

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

  // Yeni okul ekle
  async function handleAddSchool() {
    if (!formData.school_name || !formData.district_id) {
      alert('Lütfen önce il, ilçe ve okul adını girin')
      return
    }

    const { data, error } = await supabase
      .from('schools')
      .insert({
        name: formData.school_name,
        district_id: formData.district_id,
        school_type: getSchoolType(parseInt(formData.grade) || 8),
      })
      .select()
      .single()

    if (data) {
      setSchools([...schools, data])
      setFormData({ ...formData, school_id: data.id })
      alert('Okul başarıyla eklendi!')
    } else if (error) {
      alert('Hata: ' + error.message)
    }
  }

  function getSchoolType(grade: number): 'ilkokul' | 'ortaokul' | 'lise' {
    if (grade <= 4) return 'ilkokul'
    if (grade <= 8) return 'ortaokul'
    return 'lise'
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
    { value: '1', label: '1. Sınıf' },
    { value: '2', label: '2. Sınıf' },
    { value: '3', label: '3. Sınıf' },
    { value: '4', label: '4. Sınıf' },
    { value: '5', label: '5. Sınıf' },
    { value: '6', label: '6. Sınıf' },
    { value: '7', label: '7. Sınıf' },
    { value: '8', label: '8. Sınıf' },
    { value: '9', label: '9. Sınıf' },
    { value: '10', label: '10. Sınıf' },
    { value: '11', label: '11. Sınıf' },
    { value: '12', label: '12. Sınıf' },
  ]

  const examOptions = [
    'LGS', 'TYT', 'AYT', 'YKS', 'KPSS', 'ALES', 'DGS', 'YDS', 'Diğer'
  ]

  return (
    <DashboardLayout role="ogrenci">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-white">Profilim</h1>
          <p className="text-surface-500">Profil bilgilerini düzenle ve liderlik tablosunda yerini al!</p>
        </div>

        {/* Success Message */}
        {saved && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-xl"
          >
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle className="w-5 h-5" />
              <span className="font-medium">Profil başarıyla güncellendi!</span>
            </div>
            <p className="text-sm text-green-600 dark:text-green-500">
              Liderlik tablolarındaki sıralamaların güncel profil bilgilerine göre yenilendi.
            </p>
          </motion.div>
        )}

        {/* Stats Card */}
        {studentPoints && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card p-6 bg-gradient-to-r from-primary-500 to-primary-600 text-white"
          >
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                {league && (
                  <div className="text-4xl">{league.league_icon}</div>
                )}
                <div>
                  <div className="text-sm text-primary-100">Mevcut Lig</div>
                  <div className="text-xl font-bold">{league?.league_name || 'Bronz'}</div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-6 text-center">
                <div>
                  <div className="text-2xl font-bold">{studentPoints.total_points}</div>
                  <div className="text-xs text-primary-100">Puan</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">{studentPoints.total_questions}</div>
                  <div className="text-xs text-primary-100">Soru</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">{studentPoints.max_streak}</div>
                  <div className="text-xs text-primary-100">Max Seri</div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Profile Card */}
        <div className="card p-6">
          <div className="flex items-center gap-6 mb-6 pb-6 border-b border-surface-100 dark:border-surface-700">
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
              <div className="font-semibold text-surface-900 dark:text-white text-lg">{profile?.full_name}</div>
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
                  value={formData.grade}
                  onChange={(e) => {
                    const val = e.target.value
                    setFormData({ 
                      ...formData, 
                      grade: val,
                      grade_level: val ? `${val}. Sınıf` : ''
                    })
                  }}
                  className="input"
                >
                  <option value="">Seçin</option>
                  {gradeOptions.map(g => (
                    <option key={g.value} value={g.value}>{g.label}</option>
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

            {/* Location Info - Liderlik için önemli */}
            <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800">
              <div className="flex items-center gap-2 mb-3">
                <Trophy className="w-5 h-5 text-amber-600" />
                <span className="font-semibold text-amber-800 dark:text-amber-400">
                  Liderlik Tablosu İçin Konum Bilgilerin
                </span>
              </div>
              <p className="text-sm text-amber-700 dark:text-amber-300 mb-4">
                İl, ilçe ve okul bilgilerini doldurarak sınıf, okul, ilçe ve il liderlik tablolarında yer alabilirsin!
              </p>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">
                    <MapPin className="w-4 h-4 inline mr-1" />
                    İl
                  </label>
                  <select
                    value={formData.city_id}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      city_id: e.target.value,
                      district_id: '',
                      school_id: ''
                    })}
                    className="input"
                  >
                    <option value="">İl Seçin</option>
                    {cities.map(city => (
                      <option key={city.id} value={city.id}>{city.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">
                    <Building2 className="w-4 h-4 inline mr-1" />
                    İlçe
                  </label>
                  <select
                    value={formData.district_id}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      district_id: e.target.value,
                      school_id: ''
                    })}
                    className="input"
                    disabled={!formData.city_id}
                  >
                    <option value="">İlçe Seçin</option>
                    {districts.map(district => (
                      <option key={district.id} value={district.id}>{district.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-4">
                <label className="label">
                  <School className="w-4 h-4 inline mr-1" />
                  Okul
                </label>
                {schools.length > 0 ? (
                  <select
                    value={formData.school_id}
                    onChange={(e) => setFormData({ ...formData, school_id: e.target.value })}
                    className="input"
                    disabled={!formData.district_id}
                  >
                    <option value="">Okul Seçin</option>
                    {schools.map(school => (
                      <option key={school.id} value={school.id}>{school.name}</option>
                    ))}
                    <option value="other">Listemizde yok, eklemek istiyorum</option>
                  </select>
                ) : (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={formData.school_name}
                      onChange={(e) => setFormData({ ...formData, school_name: e.target.value })}
                      className="input"
                      placeholder="Okulunuzun adını yazın"
                      disabled={!formData.district_id}
                    />
                    {formData.school_name && formData.district_id && (
                      <button
                        type="button"
                        onClick={handleAddSchool}
                        className="text-sm text-primary-500 hover:text-primary-600"
                      >
                        + Okulu listeye ekle
                      </button>
                    )}
                  </div>
                )}

                {formData.school_id === 'other' && (
                  <div className="mt-2 space-y-2">
                    <input
                      type="text"
                      value={formData.school_name}
                      onChange={(e) => setFormData({ ...formData, school_name: e.target.value })}
                      className="input"
                      placeholder="Okulunuzun tam adını yazın"
                    />
                    <button
                      type="button"
                      onClick={handleAddSchool}
                      className="text-sm text-primary-500 hover:text-primary-600 flex items-center gap-1"
                    >
                      <Sparkles className="w-4 h-4" />
                      Okulu sisteme ekle
                    </button>
                  </div>
                )}
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

        {/* Info Card */}
        <div className="card p-4 bg-surface-50 dark:bg-surface-800/50">
          <div className="flex items-start gap-3">
            <Medal className="w-5 h-5 text-primary-500 mt-0.5" />
            <div className="text-sm text-surface-600 dark:text-surface-400">
              <strong>Liderlik Tablosu Seviyeleri:</strong>
              <ul className="mt-2 space-y-1">
                <li>🏫 <strong>Sınıf Liderliği:</strong> Aynı okul ve sınıftaki öğrenciler</li>
                <li>🎓 <strong>Okul Liderliği:</strong> Tüm okul öğrencileri</li>
                <li>🏘️ <strong>İlçe Liderliği:</strong> Aynı ilçedeki tüm öğrenciler</li>
                <li>🌆 <strong>İl Liderliği:</strong> Aynı ildeki tüm öğrenciler</li>
                <li>🇹🇷 <strong>Türkiye Liderliği:</strong> Tüm Türkiye öğrencileri</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Danger Zone - Hesap Silme */}
        <div className="card p-6 border-2 border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-900/10">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-red-800 dark:text-red-400 mb-1">Tehlikeli Bölge</h3>
              <p className="text-sm text-red-600 dark:text-red-300 mb-4">
                Hesabınızı sildiğinizde tüm verileriniz kalıcı olarak silinir. Bu işlem geri alınamaz.
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

export default function StudentProfilePage() {
  return (
    <Suspense fallback={
      <DashboardLayout role="ogrenci">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" />
        </div>
      </DashboardLayout>
    }>
      <StudentProfileContent />
    </Suspense>
  )
}
