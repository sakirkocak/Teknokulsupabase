'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { AlertTriangle, Trash2, Loader2, CheckCircle, LogIn } from 'lucide-react'

export default function HesapSilme() {
  const [step, setStep] = useState<'info' | 'confirm' | 'deleting' | 'success'>('info')
  const [confirmation, setConfirmation] = useState('')
  const [error, setError] = useState('')
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null)
  const [userEmail, setUserEmail] = useState<string>('')
  const router = useRouter()
  const supabase = createClient()

  // Oturum kontrolü
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setIsLoggedIn(!!data.user)
      if (data.user?.email) {
        setUserEmail(data.user.email)
      }
    })
  }, [])

  async function handleDelete() {
    if (confirmation !== 'HESABIMI SIL') {
      setError('Lütfen onay kutusuna "HESABIMI SIL" yazın')
      return
    }

    setStep('deleting')
    setError('')

    try {
      const response = await fetch('/api/account/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmation }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Hesap silinemedi')
      }

      setStep('success')
      
      // 3 saniye sonra ana sayfaya yönlendir
      setTimeout(() => {
        router.push('/')
      }, 3000)

    } catch (err: any) {
      setError(err.message)
      setStep('confirm')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center">
              <span className="text-white text-xl">🎓</span>
            </div>
            <span className="text-xl font-bold">
              Tekn<span className="text-orange-500">okul</span>
            </span>
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-2xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Hesap Silme</h1>
        
        {step === 'success' ? (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-8 text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-green-800 mb-2">
              Hesabınız Silindi
            </h2>
            <p className="text-green-600">
              Tüm verileriniz başarıyla silindi. Ana sayfaya yönlendiriliyorsunuz...
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm p-8 space-y-6">
            
            {/* Bilgilendirme */}
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <div className="flex gap-3">
                <AlertTriangle className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-red-800 mb-1">Dikkat!</h3>
                  <p className="text-red-700 text-sm">
                    Hesabınızı sildiğinizde bu işlem geri alınamaz. Tüm verileriniz kalıcı olarak silinecektir.
                  </p>
                </div>
              </div>
            </div>

            {/* Silinecekler listesi */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">
                Silinecek Veriler:
              </h2>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-red-400 rounded-full"></span>
                  Profil bilgileriniz (ad, e-posta, telefon)
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-red-400 rounded-full"></span>
                  Eğitim bilgileriniz (okul, sınıf, deneme sonuçları)
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-red-400 rounded-full"></span>
                  Tüm ilerleme ve performans verileri
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-red-400 rounded-full"></span>
                  Görev geçmişi ve rozetler
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-red-400 rounded-full"></span>
                  Yüklediğiniz tüm dosyalar
                </li>
              </ul>
            </div>

            {step === 'info' && (
              <>
                {isLoggedIn === null ? (
                  <div className="text-center py-4">
                    <Loader2 className="w-6 h-6 text-gray-400 animate-spin mx-auto" />
                  </div>
                ) : !isLoggedIn ? (
                  <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
                    <p className="text-orange-800 mb-3">
                      Hesabınızı silmek için önce giriş yapmanız gerekmektedir.
                    </p>
                    <Link 
                      href="/giris?redirect=/yasal/hesap-silme" 
                      className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white py-2 px-4 rounded-lg font-medium transition-colors"
                    >
                      <LogIn className="w-4 h-4" />
                      Giriş Yap
                    </Link>
                  </div>
                ) : (
                  <>
                    {userEmail && (
                      <div className="bg-gray-50 rounded-xl p-4">
                        <p className="text-sm text-gray-500">Giriş yapılan hesap:</p>
                        <p className="font-medium text-gray-900">{userEmail}</p>
                      </div>
                    )}
                    <button
                      onClick={() => setStep('confirm')}
                      className="w-full bg-red-500 hover:bg-red-600 text-white py-3 px-4 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      <Trash2 className="w-5 h-5" />
                      Hesabımı Silmek İstiyorum
                    </button>
                  </>
                )}
              </>
            )}

            {step === 'confirm' && (
              <div className="space-y-4">
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                  <p className="text-yellow-800 text-sm">
                    <strong>Son adım:</strong> Bu işlem geri alınamaz. Hesabınızı silmek istediğinizden emin misiniz?
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Onaylamak için aşağıya <strong className="text-red-600">HESABIMI SIL</strong> yazın:
                  </label>
                  <input
                    type="text"
                    value={confirmation}
                    onChange={(e) => setConfirmation(e.target.value.toUpperCase())}
                    placeholder="HESABIMI SIL"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 text-center font-mono text-lg tracking-wider"
                    autoComplete="off"
                  />
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-red-600 text-sm">{error}</p>
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setStep('info')
                      setConfirmation('')
                      setError('')
                    }}
                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 px-4 rounded-xl font-medium transition-colors"
                  >
                    Vazgeç
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={confirmation !== 'HESABIMI SIL'}
                    className="flex-1 bg-red-500 hover:bg-red-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-3 px-4 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    <Trash2 className="w-5 h-5" />
                    Kalıcı Olarak Sil
                  </button>
                </div>
              </div>
            )}

            {step === 'deleting' && (
              <div className="text-center py-8">
                <Loader2 className="w-12 h-12 text-red-500 animate-spin mx-auto mb-4" />
                <p className="text-gray-600">Hesabınız siliniyor...</p>
                <p className="text-gray-400 text-sm mt-2">Bu işlem birkaç saniye sürebilir.</p>
              </div>
            )}
          </div>
        )}

        {/* KVKK Bilgisi */}
        <div className="mt-8 p-6 bg-white rounded-2xl shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-2">Yasal Bilgilendirme</h3>
          <p className="text-sm text-gray-500">
            Bu işlem, 6698 sayılı Kişisel Verilerin Korunması Kanunu&apos;nun 11. maddesi kapsamındaki 
            &ldquo;kişisel verilerin silinmesini isteme&rdquo; hakkınız doğrultusunda gerçekleştirilmektedir. 
            Hesabınızı sildikten sonra, yasal saklama yükümlülüklerimiz kapsamındaki veriler hariç 
            tüm kişisel verileriniz sistemlerimizden kalıcı olarak silinecektir.
          </p>
          <div className="mt-4 flex flex-wrap gap-4 text-sm">
            <Link href="/yasal/kvkk" className="text-orange-500 hover:underline">
              KVKK Aydınlatma Metni →
            </Link>
            <Link href="/yasal/gizlilik" className="text-orange-500 hover:underline">
              Gizlilik Politikası →
            </Link>
          </div>
        </div>

        <div className="mt-6 text-center">
          <Link href="/" className="text-orange-500 hover:underline">
            ← Ana Sayfaya Dön
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-auto py-6 text-center text-sm text-gray-400">
        © {new Date().getFullYear()} Teknokul | Tüm hakları saklıdır.
      </footer>
    </div>
  )
}

