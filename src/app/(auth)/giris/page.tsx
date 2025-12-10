'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { GraduationCap, Mail, Lock, Eye, EyeOff, Loader2, ArrowLeft } from 'lucide-react'

function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  const redirectUrl = searchParams.get('redirect')

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      // Redirect URL varsa oraya git
      if (redirectUrl) {
        router.push(redirectUrl)
        router.refresh()
        return
      }

      // Yoksa kullanıcı rolüne göre yönlendir
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single()

      if (profile) {
        const routes: Record<string, string> = {
          ogretmen: '/koc',
          ogrenci: '/ogrenci',
          veli: '/veli',
          admin: '/admin',
        }
        router.push(routes[profile.role] || '/')
        router.refresh()
      }
    } catch (err: any) {
      setError(err.message === 'Invalid login credentials' 
        ? 'E-posta veya şifre hatalı' 
        : err.message)
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
