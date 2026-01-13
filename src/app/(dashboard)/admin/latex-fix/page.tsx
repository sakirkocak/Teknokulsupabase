'use client'

import { useState, useEffect } from 'react'
import { 
  Sparkles,
  RefreshCw, 
  Wand2, 
  Loader2,
  CheckCircle,
  AlertTriangle,
  X,
  Zap,
  BarChart3
} from 'lucide-react'

interface ErrorCounts {
  total_questions: number
  times_errors: number
  sqrt_errors: number
  frac_errors: number
  total_errors: number
}

interface FixResult {
  times: number
  sqrt: number
  frac: number
  total: number
}

export default function LatexFixPage() {
  const [errorCounts, setErrorCounts] = useState<ErrorCounts | null>(null)
  const [loading, setLoading] = useState(true)
  const [fixing, setFixing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastResult, setLastResult] = useState<FixResult | null>(null)
  const [showSuccess, setShowSuccess] = useState(false)

  // Hata sayılarını getir
  const fetchErrorCounts = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/latex-fix/smart-fix')
      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.error || 'Veri çekilemedi')
      }
      
      setErrorCounts(data.data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchErrorCounts()
  }, [])

  // Akıllı düzeltmeyi çalıştır
  const handleSmartFix = async () => {
    if (!confirm('Tüm LaTeX hatalarını otomatik düzeltmek istediğinize emin misiniz?\n\nBu işlem geri alınamaz.')) {
      return
    }
    
    setFixing(true)
    setError(null)
    setShowSuccess(false)
    
    try {
      const res = await fetch('/api/admin/latex-fix/smart-fix', {
        method: 'POST'
      })
      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.error || 'Düzeltme başarısız')
      }
      
      setLastResult(data.fixed)
      setErrorCounts(data.after)
      setShowSuccess(true)
      
      // 5 saniye sonra başarı mesajını gizle
      setTimeout(() => setShowSuccess(false), 5000)
      
    } catch (err: any) {
      setError(err.message)
    } finally {
      setFixing(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm p-8 mb-6">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl mb-4">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Akıllı LaTeX Düzeltici
            </h1>
            <p className="text-gray-500">
              Tek tuşla tüm LaTeX hatalarını tespit et ve düzelt
            </p>
          </div>

          {/* Ana Buton */}
          <div className="flex justify-center mb-8">
            <button
              onClick={handleSmartFix}
              disabled={fixing || loading || (errorCounts?.total_errors === 0)}
              className="group relative px-8 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-lg font-semibold rounded-2xl hover:from-purple-700 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
            >
              {fixing ? (
                <span className="flex items-center gap-3">
                  <Loader2 className="w-6 h-6 animate-spin" />
                  Düzeltiliyor...
                </span>
              ) : (
                <span className="flex items-center gap-3">
                  <Zap className="w-6 h-6" />
                  Tara ve Düzelt
                </span>
              )}
            </button>
          </div>

          {/* Yenile Butonu */}
          <div className="flex justify-center">
            <button
              onClick={fetchErrorCounts}
              disabled={loading || fixing}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Yenile
            </button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              {error}
            </div>
            <button onClick={() => setError(null)}>
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Success Alert */}
        {showSuccess && lastResult && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-6 py-4 rounded-xl mb-6">
            <div className="flex items-center gap-3 mb-3">
              <CheckCircle className="w-6 h-6" />
              <span className="font-semibold text-lg">Düzeltme Tamamlandı!</span>
            </div>
            <div className="grid grid-cols-4 gap-4 text-center">
              <div className="bg-white/50 rounded-lg p-3">
                <div className="text-2xl font-bold text-green-600">{lastResult.times}</div>
                <div className="text-sm text-green-600/70">times</div>
              </div>
              <div className="bg-white/50 rounded-lg p-3">
                <div className="text-2xl font-bold text-green-600">{lastResult.sqrt}</div>
                <div className="text-sm text-green-600/70">sqrt</div>
              </div>
              <div className="bg-white/50 rounded-lg p-3">
                <div className="text-2xl font-bold text-green-600">{lastResult.frac}</div>
                <div className="text-sm text-green-600/70">frac</div>
              </div>
              <div className="bg-white/50 rounded-lg p-3">
                <div className="text-2xl font-bold text-green-600">{lastResult.total}</div>
                <div className="text-sm text-green-600/70">Toplam</div>
              </div>
            </div>
          </div>
        )}

        {/* İstatistikler */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="flex items-center gap-3 mb-6">
            <BarChart3 className="w-6 h-6 text-purple-500" />
            <h2 className="text-xl font-semibold text-gray-900">Mevcut Durum</h2>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
            </div>
          ) : errorCounts ? (
            <div className="space-y-6">
              {/* Toplam Sorular */}
              <div className="text-center p-4 bg-gray-50 rounded-xl">
                <div className="text-3xl font-bold text-gray-900">
                  {errorCounts.total_questions.toLocaleString()}
                </div>
                <div className="text-gray-500">Toplam Soru</div>
              </div>

              {/* Hata Detayları */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className={`p-4 rounded-xl text-center ${errorCounts.times_errors > 0 ? 'bg-orange-50' : 'bg-green-50'}`}>
                  <div className={`text-2xl font-bold ${errorCounts.times_errors > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                    {errorCounts.times_errors.toLocaleString()}
                  </div>
                  <div className={`text-sm ${errorCounts.times_errors > 0 ? 'text-orange-600/70' : 'text-green-600/70'}`}>
                    times hatası
                  </div>
                </div>
                
                <div className={`p-4 rounded-xl text-center ${errorCounts.sqrt_errors > 0 ? 'bg-orange-50' : 'bg-green-50'}`}>
                  <div className={`text-2xl font-bold ${errorCounts.sqrt_errors > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                    {errorCounts.sqrt_errors.toLocaleString()}
                  </div>
                  <div className={`text-sm ${errorCounts.sqrt_errors > 0 ? 'text-orange-600/70' : 'text-green-600/70'}`}>
                    sqrt hatası
                  </div>
                </div>
                
                <div className={`p-4 rounded-xl text-center ${errorCounts.frac_errors > 0 ? 'bg-orange-50' : 'bg-green-50'}`}>
                  <div className={`text-2xl font-bold ${errorCounts.frac_errors > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                    {errorCounts.frac_errors.toLocaleString()}
                  </div>
                  <div className={`text-sm ${errorCounts.frac_errors > 0 ? 'text-orange-600/70' : 'text-green-600/70'}`}>
                    frac hatası
                  </div>
                </div>
                
                <div className={`p-4 rounded-xl text-center ${errorCounts.total_errors > 0 ? 'bg-red-50' : 'bg-green-50'}`}>
                  <div className={`text-2xl font-bold ${errorCounts.total_errors > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {errorCounts.total_errors.toLocaleString()}
                  </div>
                  <div className={`text-sm ${errorCounts.total_errors > 0 ? 'text-red-600/70' : 'text-green-600/70'}`}>
                    Toplam Hata
                  </div>
                </div>
              </div>

              {/* Durum Mesajı */}
              {errorCounts.total_errors === 0 ? (
                <div className="flex items-center justify-center gap-3 p-6 bg-green-50 rounded-xl">
                  <CheckCircle className="w-8 h-8 text-green-500" />
                  <div>
                    <div className="font-semibold text-green-700">Tüm Sorular Temiz!</div>
                    <div className="text-sm text-green-600">Hiçbir LaTeX hatası bulunamadı.</div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-3 p-6 bg-orange-50 rounded-xl">
                  <AlertTriangle className="w-8 h-8 text-orange-500" />
                  <div>
                    <div className="font-semibold text-orange-700">
                      {errorCounts.total_errors.toLocaleString()} Hata Bulundu
                    </div>
                    <div className="text-sm text-orange-600">
                      "Tara ve Düzelt" butonuna basarak otomatik düzeltebilirsiniz.
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              Veri yüklenemedi
            </div>
          )}
        </div>

        {/* Bilgi Notu */}
        <div className="mt-6 p-4 bg-blue-50 rounded-xl text-sm text-blue-700">
          <div className="font-medium mb-1">💡 Nasıl Çalışır?</div>
          <ul className="list-disc list-inside space-y-1 text-blue-600">
            <li><code>times</code> → <code>\times</code> (çarpma işareti)</li>
            <li><code>sqrt</code> → <code>\sqrt</code> (karekök)</li>
            <li><code>frac</code> → <code>\frac</code> (kesir)</li>
            <li>Greek harfler: <code>alpha</code>, <code>beta</code>, <code>pi</code> vb.</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
