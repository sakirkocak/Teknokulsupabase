'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { GraduationCap, Mail, Lock, Eye, EyeOff, User, Loader2, Users, UserCheck, Users2, ArrowLeft, School } from 'lucide-react'
import { trackSignup, trackGoogleSignup } from '@/lib/gtag'

// Google SVG Icon
const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
    />
  </svg>
)

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
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()
  
  // 🔒 Güvenlik state'leri
  const [honeypot, setHoneypot] = useState('') // Bot tuzağı
  const [formLoadTime] = useState(Date.now()) // Form yüklenme zamanı

  const redirectUrl = searchParams.get('redirect')

  // Eğer koç sayfasından geliyorsa, öğrenci olarak kayıt olmasını öner
  useEffect(() => {
    if (redirectUrl && redirectUrl.includes('/koclar/')) {
      setRole('ogrenci')
    }
  }, [redirectUrl])

  // Google ile kayıt - rol ve sınıf bilgisini de gönder
  async function handleGoogleRegister() {
    setGoogleLoading(true)
    setError('')

    try {
      // Rol ve sınıf bilgisini callback'e gönder
      const params = new URLSearchParams()
      params.set('role', role)
      if (role === 'ogrenci') {
        params.set('grade', grade.toString())
      }
      if (redirectUrl) {
        params.set('next', redirectUrl)
      }

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?${params.toString()}`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      })

      if (error) throw error
    } catch (err: any) {
      setError(err.message || 'Google ile kayıt yapılamadı')
      setGoogleLoading(false)
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // 🔒 API üzerinden güvenli kayıt
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          fullName,
          role,
          grade: role === 'ogrenci' ? grade : undefined,
          honeypot, // Bot tuzağı (boş olmalı)
          formLoadTime, // Form yüklenme zamanı
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Kayıt sırasında bir hata oluştu')
      }

      if (data.success) {
        // 📊 Google Ads dönüşüm izleme
        trackSignup(role)
        
        // Supabase oturumunu senkronize et
        await supabase.auth.signInWithPassword({ email, password })
        
        // Redirect URL varsa oraya git
        if (redirectUrl) {
          router.push(redirectUrl)
          router.refresh()
          return
        }

        // Yoksa API'den gelen yönlendirmeyi kullan
        router.push(data.redirectTo || '/')
        router.refresh()
      }
    } catch (err: any) {
      setError(err.message || 'Kayıt sırasında bir hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md">
      <Link href="/" className="flex flex-col items-start mb-8">
        <img 
          src="/images/logo.png" 
          alt="Teknokul - Eğitimin Dijital Üssü" 
          className="h-16 object-contain"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none'
            const fallback = document.getElementById('register-logo-fallback')
            if (fallback) fallback.style.display = 'flex'
          }}
        />
        <div id="register-logo-fallback" className="hidden items-center gap-2">
          <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center">
            <GraduationCap className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-bold">
            Tekn<span className="text-primary-500">okul</span>
          </span>
        </div>
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
        <div className="space-y-5">
          {/* Seçilen rol ve sınıf bilgisi */}
          <div className="bg-primary-50 border border-primary-200 rounded-xl p-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary-500 text-white flex items-center justify-center">
                {role === 'ogrenci' ? <User className="w-5 h-5" /> : role === 'ogretmen' ? <UserCheck className="w-5 h-5" /> : <Users2 className="w-5 h-5" />}
              </div>
              <div>
                <div className="font-medium text-primary-900">
                  {role === 'ogrenci' ? 'Öğrenci' : role === 'ogretmen' ? 'Öğretmen / Koç' : 'Veli'}
                  {role === 'ogrenci' && <span className="text-primary-600"> • {grade}. Sınıf</span>}
                </div>
                <button 
                  onClick={() => setStep(1)} 
                  className="text-xs text-primary-600 hover:underline"
                >
                  Değiştir
                </button>
              </div>
            </div>
          </div>

          {/* Google ile Hızlı Kayıt */}
          <button
            type="button"
            onClick={handleGoogleRegister}
            disabled={googleLoading}
            className="w-full flex items-center justify-center gap-3 px-4 py-3.5 border-2 border-surface-200 rounded-xl font-medium text-surface-700 hover:bg-surface-50 hover:border-surface-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {googleLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <GoogleIcon />
                Google ile Hızlı Kayıt
              </>
            )}
          </button>

          {/* Ayırıcı */}
          <div className="relative my-2">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-surface-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-surface-500">veya e-posta ile</span>
            </div>
          </div>

          <form onSubmit={handleRegister} className="space-y-4">
            {/* 🔒 Honeypot - Bot tuzağı (kullanıcıya görünmez) */}
            <div 
              aria-hidden="true" 
              style={{ 
                position: 'absolute', 
                left: '-9999px', 
                top: '-9999px',
                opacity: 0, 
                height: 0, 
                width: 0,
                overflow: 'hidden',
                pointerEvents: 'none'
              }}
            >
              <label htmlFor="website">Website</label>
              <input
                type="text"
                id="website"
                name="website"
                value={honeypot}
                onChange={(e) => setHoneypot(e.target.value)}
                tabIndex={-1}
                autoComplete="off"
              />
            </div>

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

            <div className="flex gap-3 pt-2">
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
        </div>
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
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-secondary-500 to-secondary-700 items-center justify-center p-12 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-64 h-64 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-80 h-80 bg-white rounded-full blur-3xl"></div>
        </div>
        
        <div className="text-white text-center max-w-md relative z-10">
          <img 
            src="/images/logo-white.png" 
            alt="Teknokul" 
            className="h-24 object-contain mx-auto mb-6"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none'
              const fallback = document.getElementById('register-panel-fallback')
              if (fallback) fallback.style.display = 'flex'
            }}
          />
          <div id="register-panel-fallback" className="hidden flex-col items-center mb-6">
            <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center mb-4">
              <Users className="w-10 h-10" />
            </div>
            <span className="text-3xl font-bold">Tekn<span className="text-secondary-200">okul</span></span>
          </div>
          <h2 className="text-3xl font-bold mb-2">
            Eğitimin Dijital Üssü
          </h2>
          <p className="text-lg text-secondary-100 mb-4">
            Topluluğumuza Katıl
          </p>
          <p className="text-secondary-200">
            Binlerce öğrenci ve koç ile birlikte eğitimde yeni bir sayfa aç.
          </p>
        </div>
      </div>
    </div>
  )
}
