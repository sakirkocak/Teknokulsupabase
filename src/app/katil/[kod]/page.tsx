'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { 
  GraduationCap, Users, CheckCircle, Loader2, 
  AlertCircle, ArrowRight, Eye, EyeOff, Mail, 
  Lock, User, Sparkles
} from 'lucide-react'

export default function DavetKatilPage() {
  const params = useParams()
  const router = useRouter()
  const supabase = createClient()
  const joinCode = params.kod as string

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [classroom, setClassroom] = useState<{ name: string; subject: string; grade_level: string } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [currentUser, setCurrentUser] = useState<{ id: string; email: string } | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: ''
  })
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    checkClassroomAndUser()
  }, [joinCode])

  async function checkClassroomAndUser() {
    try {
      // Sınıf bilgisini kontrol et
      const { data: classroomData, error: classroomError } = await supabase
        .from('classrooms')
        .select('name, subject, grade_level')
        .eq('join_code', joinCode)
        .eq('is_active', true)
        .single()

      if (classroomError || !classroomData) {
        setError('Geçersiz veya süresi dolmuş davet linki')
        setLoading(false)
        return
      }

      setClassroom(classroomData)

      // Kullanıcı giriş yapmış mı kontrol et
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        setCurrentUser({ id: user.id, email: user.email || '' })
      }

    } catch (err) {
      console.error('Kontrol hatası:', err)
      setError('Bir hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  // Giriş yapmış kullanıcı için direkt katılım
  async function handleJoinAsExistingUser() {
    if (!currentUser) return
    setSubmitting(true)
    setError(null)

    try {
      const response = await fetch('/api/classrooms/join-with-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          joinCode,
          existingUserId: currentUser.id
        })
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error)
        return
      }

      setSuccess(data.message)
      
      // 2 saniye sonra yönlendir
      setTimeout(() => {
        router.push('/ogrenci/siniflarim')
      }, 2000)

    } catch (err) {
      setError('Bir hata oluştu')
    } finally {
      setSubmitting(false)
    }
  }

  // Yeni kullanıcı kaydı ve katılım
  async function handleRegisterAndJoin(e: React.FormEvent) {
    e.preventDefault()
    
    if (!formData.fullName || !formData.email || !formData.password) {
      setError('Lütfen tüm alanları doldurun')
      return
    }

    if (formData.password.length < 6) {
      setError('Şifre en az 6 karakter olmalıdır')
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      const response = await fetch('/api/classrooms/join-with-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          joinCode,
          email: formData.email,
          password: formData.password,
          fullName: formData.fullName
        })
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error)
        return
      }

      setSuccess(data.message)
      
      // Otomatik giriş yap ve yönlendir
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password
      })

      if (!signInError) {
        setTimeout(() => {
          router.push('/ogrenci')
        }, 2000)
      }

    } catch (err) {
      setError('Bir hata oluştu')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // Hata durumu
  if (error && !classroom) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center"
        >
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Geçersiz Davet Linki</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link 
            href="/"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700"
          >
            Ana Sayfaya Dön
            <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>
      </div>
    )
  }

  // Başarı durumu
  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
            className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4"
          >
            <CheckCircle className="w-10 h-10 text-green-500" />
          </motion.div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Tebrikler!</h1>
          <p className="text-gray-600 mb-2">{success}</p>
          <p className="text-sm text-gray-500">Yönlendiriliyorsunuz...</p>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-white/20 rounded-lg">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <p className="text-blue-100 text-sm">Sınıfa Davet Edildiniz</p>
              <h1 className="text-xl font-bold">{classroom?.name}</h1>
            </div>
          </div>
          
          <div className="flex items-center gap-4 text-sm text-blue-100">
            {classroom?.subject && (
              <span className="flex items-center gap-1">
                <Sparkles className="w-4 h-4" />
                {classroom.subject}
              </span>
            )}
            {classroom?.grade_level && (
              <span className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                {classroom.grade_level}
              </span>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {currentUser ? (
            // Giriş yapmış kullanıcı
            <div>
              <div className="text-center mb-6">
                <p className="text-gray-600">
                  <span className="font-medium text-gray-900">{currentUser.email}</span> olarak giriş yaptınız
                </p>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                  {error}
                </div>
              )}

              <button
                onClick={handleJoinAsExistingUser}
                disabled={submitting}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {submitting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    Sınıfa Katıl
                  </>
                )}
              </button>

              <p className="text-center text-sm text-gray-500 mt-4">
                Farklı bir hesapla katılmak ister misiniz?{' '}
                <button 
                  onClick={async () => {
                    await supabase.auth.signOut()
                    setCurrentUser(null)
                  }}
                  className="text-blue-600 hover:underline"
                >
                  Çıkış yap
                </button>
              </p>
            </div>
          ) : (
            // Giriş yapmamış - Kayıt formu
            <div>
              <div className="text-center mb-6">
                <h2 className="text-lg font-semibold text-gray-900">Hesap Oluştur ve Katıl</h2>
                <p className="text-sm text-gray-500 mt-1">
                  Hızlıca kayıt ol ve sınıfa katıl
                </p>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleRegisterAndJoin} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ad Soyad
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Adınız Soyadınız"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="ornek@email.com"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Şifre
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full pl-10 pr-12 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="En az 6 karakter"
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {submitting ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      Kayıt Ol ve Katıl
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-sm text-gray-500">
                  Zaten hesabınız var mı?{' '}
                  <Link href={`/giris?redirect=/katil/${joinCode}`} className="text-blue-600 hover:underline">
                    Giriş Yap
                  </Link>
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-100">
          <p className="text-xs text-center text-gray-500">
            Kaydolarak{' '}
            <Link href="/yasal/kullanim-kosullari" className="text-blue-600 hover:underline">
              Kullanım Koşullarını
            </Link>{' '}
            kabul etmiş olursunuz.
          </p>
        </div>
      </motion.div>
    </div>
  )
}

