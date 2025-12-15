'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { GraduationCap, Mail, Lock, Eye, EyeOff, User, Loader2, Users, UserCheck, Users2, ArrowLeft, School } from 'lucide-react'

type RoleOption = {
  id: 'ogrenci' | 'ogretmen' | 'veli'
  label: string
  description: string
  icon: any
}

const roles: RoleOption[] = [
  {
    id: 'ogrenci',
    label: 'Öğrenci',
    description: 'Koç bul, görev tamamla, gelişimini takip et',
    icon: User,
  },
  {
    id: 'ogretmen',
    label: 'Öğretmen / Koç',
    description: 'Öğrenci kabul et, görev ver, gelişim takibi yap',
    icon: UserCheck,
  },
  {
    id: 'veli',
    label: 'Veli',
    description: 'Çocuğunun gelişimini takip et',
    icon: Users2,
  },
]

// Sınıf seçenekleri
const gradeOptions = [
  { id: 1, name: '1. Sınıf', level: 'İlkokul' },
  { id: 2, name: '2. Sınıf', level: 'İlkokul' },
  { id: 3, name: '3. Sınıf', level: 'İlkokul' },
  { id: 4, name: '4. Sınıf', level: 'İlkokul' },
  { id: 5, name: '5. Sınıf', level: 'Ortaokul' },
  { id: 6, name: '6. Sınıf', level: 'Ortaokul' },
  { id: 7, name: '7. Sınıf', level: 'Ortaokul' },
  { id: 8, name: '8. Sınıf', level: 'Ortaokul (LGS)' },
  { id: 9, name: '9. Sınıf', level: 'Lise' },
  { id: 10, name: '10. Sınıf', level: 'Lise' },
  { id: 11, name: '11. Sınıf', level: 'Lise (TYT)' },
  { id: 12, name: '12. Sınıf', level: 'Lise (TYT-AYT)' },
]

function RegisterForm() {
  const [step, setStep] = useState(1)
  const [role, setRole] = useState<'ogrenci' | 'ogretmen' | 'veli'>('ogrenci')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [grade, setGrade] = useState<number>(8) // Varsayılan 8. sınıf (LGS)
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  const redirectUrl = searchParams.get('redirect')

  // Eğer koç sayfasından geliyorsa, öğrenci olarak kayıt olmasını öner
  useEffect(() => {
    if (redirectUrl && redirectUrl.includes('/koclar/')) {
      setRole('ogrenci')
    }
  }, [redirectUrl])

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // 1. Kullanıcı oluştur
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            role: role,
          },
        },
      })

      if (authError) throw authError

      if (authData.user) {
        // 2. Trigger çalışmayabilir, manuel olarak profil oluştur
        // Önce profil var mı kontrol et
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', authData.user.id)
          .single()

        if (!existingProfile) {
          // Profile oluştur
          const { error: profileError } = await supabase
            .from('profiles')
            .insert({
              id: authData.user.id,
              email: email,
              full_name: fullName,
              role: role,
            })

          if (profileError && !profileError.message.includes('duplicate')) {
            console.error('Profil oluşturma hatası:', profileError)
          }
        }

        // 3. Role göre ek profil oluştur
        if (role === 'ogrenci') {
          const { data: existingStudentProfile } = await supabase
            .from('student_profiles')
            .select('id')
            .eq('user_id', authData.user.id)
            .single()

          if (!existingStudentProfile) {
            const { error: studentError } = await supabase
              .from('student_profiles')
              .insert({ 
                user_id: authData.user.id,
                grade: grade // Sınıf bilgisi
              })

            if (studentError && !studentError.message.includes('duplicate')) {
              console.error('Öğrenci profili oluşturma hatası:', studentError)
            }
          }
        } else if (role === 'ogretmen') {
          const { data: existingTeacherProfile } = await supabase
            .from('teacher_profiles')
            .select('id')
            .eq('user_id', authData.user.id)
            .single()

          if (!existingTeacherProfile) {
            const { error: teacherError } = await supabase
              .from('teacher_profiles')
              .insert({ user_id: authData.user.id, is_coach: true })

            if (teacherError && !teacherError.message.includes('duplicate')) {
              console.error('Öğretmen profili oluşturma hatası:', teacherError)
            }
          }
        } else if (role === 'veli') {
          const { data: existingParentProfile } = await supabase
            .from('parent_profiles')
            .select('id')
            .eq('user_id', authData.user.id)
            .single()

          if (!existingParentProfile) {
            const { error: parentError } = await supabase
              .from('parent_profiles')
              .insert({ user_id: authData.user.id })

            if (parentError && !parentError.message.includes('duplicate')) {
              console.error('Veli profili oluşturma hatası:', parentError)
            }
          }
        }

        // Redirect URL varsa oraya git
        if (redirectUrl) {
          router.push(redirectUrl)
          router.refresh()
          return
        }

        // Yoksa role göre yönlendir
        const routes: Record<string, string> = {
          ogretmen: '/koc',
          ogrenci: '/ogrenci',
          veli: '/veli',
        }
        router.push(routes[role] || '/')
        router.refresh()
      }
    } catch (err: any) {
      if (err.message.includes('already registered')) {
        setError('Bu e-posta adresi zaten kayıtlı')
      } else {
        setError(err.message)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md">
      <Link href="/" className="flex items-center gap-2 mb-8">
        <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center">
          <GraduationCap className="w-6 h-6 text-white" />
        </div>
        <span className="text-xl font-bold">
          Tekno<span className="text-primary-500">kul</span>
        </span>
      </Link>

      <h1 className="text-2xl font-bold text-surface-900 mb-2">
        Ücretsiz Kayıt Ol
      </h1>
      <p className="text-surface-600 mb-8">
        {redirectUrl 
          ? 'Koçluk başvurusu yapmak için kayıt olun.'
          : 'Eğitim yolculuğuna hemen başla.'}
      </p>

      {redirectUrl && (
        <div className="bg-primary-50 border border-primary-200 text-primary-700 px-4 py-3 rounded-xl mb-6 text-sm">
          Koçluk başvurusu yapmak için <strong>öğrenci</strong> olarak kayıt olmanız gerekiyor.
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl mb-6 text-sm">
          {error}
        </div>
      )}

      {step === 1 ? (
        <div className="space-y-4">
          <p className="text-sm text-surface-600 mb-4">Rolünü seç:</p>
          {roles.map((r) => (
            <button
              key={r.id}
              onClick={() => setRole(r.id)}
              className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                role === r.id
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-surface-200 hover:border-surface-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  role === r.id ? 'bg-primary-500 text-white' : 'bg-surface-100 text-surface-600'
                }`}>
                  <r.icon className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-medium text-surface-900">{r.label}</div>
                  <div className="text-sm text-surface-500">{r.description}</div>
                </div>
              </div>
            </button>
          ))}
          <button
            onClick={() => setStep(role === 'ogrenci' ? 2 : 3)}
            className="btn btn-primary btn-lg w-full mt-6"
          >
            Devam Et
          </button>
        </div>
      ) : step === 2 && role === 'ogrenci' ? (
        <div className="space-y-4">
          <p className="text-sm text-surface-600 mb-4">Sınıfını seç:</p>
          
          {/* İlkokul */}
          <div>
            <p className="text-xs font-medium text-surface-500 mb-2">İLKOKUL</p>
            <div className="grid grid-cols-4 gap-2">
              {gradeOptions.filter(g => g.id <= 4).map((g) => (
                <button
                  key={g.id}
                  onClick={() => setGrade(g.id)}
                  className={`p-3 rounded-lg border-2 text-center transition-all ${
                    grade === g.id
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-surface-200 hover:border-surface-300'
                  }`}
                >
                  <span className="font-bold">{g.id}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Ortaokul */}
          <div>
            <p className="text-xs font-medium text-surface-500 mb-2">ORTAOKUL</p>
            <div className="grid grid-cols-4 gap-2">
              {gradeOptions.filter(g => g.id >= 5 && g.id <= 8).map((g) => (
                <button
                  key={g.id}
                  onClick={() => setGrade(g.id)}
                  className={`p-3 rounded-lg border-2 text-center transition-all ${
                    grade === g.id
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-surface-200 hover:border-surface-300'
                  } ${g.id === 8 ? 'ring-2 ring-orange-300' : ''}`}
                >
                  <span className="font-bold">{g.id}</span>
                  {g.id === 8 && <span className="block text-xs text-orange-600">LGS</span>}
                </button>
              ))}
            </div>
          </div>

          {/* Lise */}
          <div>
            <p className="text-xs font-medium text-surface-500 mb-2">LİSE</p>
            <div className="grid grid-cols-4 gap-2">
              {gradeOptions.filter(g => g.id >= 9).map((g) => (
                <button
                  key={g.id}
                  onClick={() => setGrade(g.id)}
                  className={`p-3 rounded-lg border-2 text-center transition-all ${
                    grade === g.id
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-surface-200 hover:border-surface-300'
                  } ${g.id >= 11 ? 'ring-2 ring-purple-300' : ''}`}
                >
                  <span className="font-bold">{g.id}</span>
                  {g.id === 11 && <span className="block text-xs text-purple-600">TYT</span>}
                  {g.id === 12 && <span className="block text-xs text-purple-600">AYT</span>}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="btn btn-ghost btn-lg flex-1"
            >
              Geri
            </button>
            <button
              onClick={() => setStep(3)}
              className="btn btn-primary btn-lg flex-1"
            >
              Devam Et
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleRegister} className="space-y-5">
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
                required
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
                onChange={(e) => setEmail(e.target.value)}
                className="input pl-12"
                placeholder="ornek@email.com"
                required
              />
            </div>
          </div>

          <div>
            <label className="label">Şifre</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input pl-12 pr-12"
                placeholder="En az 6 karakter"
                minLength={6}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setStep(role === 'ogrenci' ? 2 : 1)}
              className="btn btn-ghost btn-lg flex-1"
            >
              Geri
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary btn-lg flex-1"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                'Kayıt Ol'
              )}
            </button>
          </div>
        </form>
      )}

      <p className="text-center text-surface-600 mt-6">
        Zaten hesabın var mı?{' '}
        <Link 
          href={redirectUrl ? `/giris?redirect=${encodeURIComponent(redirectUrl)}` : '/giris'} 
          className="text-primary-500 font-medium hover:underline"
        >
          Giriş Yap
        </Link>
      </p>

      {redirectUrl && (
        <Link 
          href={redirectUrl}
          className="flex items-center justify-center gap-2 text-surface-500 mt-4 hover:text-surface-700"
        >
          <ArrowLeft className="w-4 h-4" />
          Koç profiline geri dön
        </Link>
      )}
    </div>
  )
}

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex">
      {/* Sol Panel - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <Suspense fallback={
          <div className="w-full max-w-md flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
          </div>
        }>
          <RegisterForm />
        </Suspense>
      </div>

      {/* Sağ Panel - Görsel */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-secondary-500 to-secondary-700 items-center justify-center p-12">
        <div className="text-white text-center max-w-md">
          <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Users className="w-10 h-10" />
          </div>
          <h2 className="text-3xl font-bold mb-4">
            Topluluğumuza Katıl
          </h2>
          <p className="text-secondary-100">
            Binlerce öğrenci ve koç ile birlikte eğitimde yeni bir sayfa aç.
          </p>
        </div>
      </div>
    </div>
  )
}
