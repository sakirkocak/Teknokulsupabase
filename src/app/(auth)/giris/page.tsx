'use client'

import { useState, Suspense, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { GraduationCap, Mail, Lock, Eye, EyeOff, Loader2, ArrowLeft } from 'lucide-react'
import { trackLogin } from '@/lib/gtag'

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

function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  const redirectUrl = searchParams.get('redirect')
  const errorParam = searchParams.get('error')

  // URL'den gelen hata mesajını göster
  useEffect(() => {
    if (errorParam) {
      setError(decodeURIComponent(errorParam))
    }
  }, [errorParam])

  // Google ile giriş
  async function handleGoogleLogin() {
    setGoogleLoading(true)
    setError('')

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback${redirectUrl ? `?next=${encodeURIComponent(redirectUrl)}` : ''}`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      })

      if (error) throw error
    } catch (err: any) {
      setError(err.message || 'Google ile giriş yapılamadı')
      setGoogleLoading(false)
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // 🔒 API üzerinden güvenli giriş (rate limiting)
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Giriş yapılamadı')
      }

      // 📊 Google Ads giriş dönüşümü izleme
      trackLogin('email')
      
      // Supabase client tarafında da oturum aç
      await supabase.auth.signInWithPassword({ email, password })

      // Redirect URL varsa oraya git
      if (redirectUrl) {
        router.push(redirectUrl)
        router.refresh()
        return
      }

      // API'den gelen yönlendirmeyi kullan
      router.push(data.redirectTo || '/')
      router.refresh()
    } catch (err: any) {
      setError(err.message || 'Giriş yapılamadı')
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
          Tekn<span className="text-primary-500">okul</span>
        </span>
      </Link>

      <h1 className="text-2xl font-bold text-surface-900 mb-2">
        Hoş Geldin!
      </h1>
      <p className="text-surface-600 mb-8">
        {redirectUrl 
          ? 'Başvuru yapmak için giriş yapın veya kayıt olun.'
          : 'Hesabına giriş yap ve öğrenmeye devam et.'}
      </p>

      {redirectUrl && (
        <div className="bg-primary-50 border border-primary-200 text-primary-700 px-4 py-3 rounded-xl mb-6 text-sm">
          Koçluk başvurusu yapmak için giriş yapmanız gerekiyor.
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl mb-6 text-sm">
          {error}
        </div>
      )}

      {/* Google ile Giriş */}
      <button
        type="button"
        onClick={handleGoogleLogin}
        disabled={googleLoading}
        className="w-full flex items-center justify-center gap-3 px-4 py-3 border-2 border-surface-200 rounded-xl font-medium text-surface-700 hover:bg-surface-50 hover:border-surface-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {googleLoading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <>
            <GoogleIcon />
            Google ile Giriş Yap
          </>
        )}
      </button>

      {/* Ayırıcı */}
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-surface-200"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-4 bg-white text-surface-500">veya e-posta ile</span>
        </div>
      </div>

      <form onSubmit={handleLogin} className="space-y-5">
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
              placeholder="••••••••"
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

        <button
          type="submit"
          disabled={loading}
          className="btn btn-primary btn-lg w-full"
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            'Giriş Yap'
          )}
        </button>
      </form>

      <p className="text-center text-surface-600 mt-6">
        Hesabın yok mu?{' '}
        <Link 
          href={redirectUrl ? `/kayit?redirect=${encodeURIComponent(redirectUrl)}` : '/kayit'} 
          className="text-primary-500 font-medium hover:underline"
        >
          Kayıt Ol
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

export default function LoginPage() {
  return (
    <div className="min-h-screen flex">
      {/* Sol Panel - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <Suspense fallback={
          <div className="w-full max-w-md flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
          </div>
        }>
          <LoginForm />
        </Suspense>
      </div>

      {/* Sağ Panel - Görsel */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-primary-500 to-primary-700 items-center justify-center p-12">
        <div className="text-white text-center max-w-md">
          <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <GraduationCap className="w-10 h-10" />
          </div>
          <h2 className="text-3xl font-bold mb-4">
            Eğitimde Yeni Nesil
          </h2>
          <p className="text-primary-100">
            Kişisel koçunla birlikte hedeflerine ulaş. 
            AI destekli öneriler ve gelişim takibi ile fark yarat.
          </p>
        </div>
      </div>
    </div>
  )
}
