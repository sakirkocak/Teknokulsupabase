'use client'

import { useState, useEffect, useRef } from 'react'
import { 
  Sparkles,
  RefreshCw, 
  Wand2, 
  Loader2,
  CheckCircle,
  AlertTriangle,
  X,
  Zap,
  BarChart3,
  Search,
  Eye,
  Play,
  Pause
} from 'lucide-react'
import MathRenderer from '@/components/MathRenderer'

interface LatexError {
  id: string
  question_id: string
  error_type: string
  error_sample: string
  field: string
  detected_at: string
  question?: {
    question_text: string
    explanation: string | null
  }
}

interface Stats {
  total_questions: number
  total_errors: number
  by_type: {
    sqrt: number
    frac: number
    times: number
  }
}

export default function LatexFixPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [errors, setErrors] = useState<LatexError[]>([])
  const [loading, setLoading] = useState(true)
  const [scanning, setScanning] = useState(false)
  const [fixing, setFixing] = useState(false)
  const [fixProgress, setFixProgress] = useState(0)
  const [fixTotal, setFixTotal] = useState(0)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [previewError, setPreviewError] = useState<LatexError | null>(null)
  
  // Batch processing ref
  const abortControllerRef = useRef<AbortController | null>(null)

  useEffect(() => {
    fetchStats()
    fetchErrors()
  }, [])

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/admin/latex-fix/stats')
      const data = await res.json()
      if (data.success) {
        setStats(data.stats)
      }
    } catch (error) {
      console.error('Stats fetch error:', error)
    }
  }

  const fetchErrors = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/admin/latex-fix/errors?limit=20')
      const data = await res.json()
      if (data.success) {
        setErrors(data.data)
      }
    } catch (error) {
      console.error('Errors fetch error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleScan = async () => {
    try {
      setScanning(true)
      const res = await fetch('/api/admin/latex-fix/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ limit: 10000 })
      })
      const data = await res.json()
      
      if (data.success) {
        setMessage({ type: 'success', text: `Tarama tamamlandı: ${data.found_errors} yeni hata bulundu.` })
        fetchStats()
        fetchErrors()
      } else {
        setMessage({ type: 'error', text: data.error || 'Tarama sırasında hata oluştu.' })
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message })
    } finally {
      setScanning(false)
    }
  }

  const handleBatchFix = async () => {
    if (!stats || stats.total_questions === 0) return
    
    // Eğer zaten çalışıyorsa durdur
    if (fixing) {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
        abortControllerRef.current = null
      }
      setFixing(false)
      return
    }

    if (!confirm(`Toplam ${stats.total_questions} soru taranacak ve düzeltilecek. Bu işlem uzun sürebilir. Başlamak istiyor musunuz?`)) {
      return
    }

    setFixing(true)
    setFixProgress(0)
    setFixTotal(stats.total_questions)
    setMessage(null)
    
    abortControllerRef.current = new AbortController()
    
    const batchSize = 1000
    let processed = 0
    let totalFixed = 0
    
    try {
      // Loop until all questions are processed
      while (processed < stats.total_questions) {
        if (abortControllerRef.current?.signal.aborted) break
        
        const res = await fetch('/api/admin/latex-fix/batch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            limit: batchSize, 
            offset: processed 
          }),
          signal: abortControllerRef.current?.signal
        })
        
        const data = await res.json()
        
        if (!data.success) {
          throw new Error(data.error || 'Batch işlem hatası')
        }
        
        const batchResult = data.data
        processed += batchResult.processed
        totalFixed += (batchResult.times_fixed + batchResult.sqrt_fixed + batchResult.frac_fixed)
        
        setFixProgress(processed)
        
        // Eğer hiç soru işlenmediyse döngüyü kır (sonsuz döngü koruması)
        if (batchResult.processed === 0) break
      }
      
      setMessage({ type: 'success', text: `İşlem tamamlandı! Toplam ${totalFixed} düzeltme yapıldı.` })
      fetchStats()
      fetchErrors()
      
    } catch (error: any) {
      if (error.name === 'AbortError') {
        setMessage({ type: 'error', text: 'İşlem durduruldu.' })
      } else {
        setMessage({ type: 'error', text: `Hata: ${error.message}` })
      }
    } finally {
      setFixing(false)
      abortControllerRef.current = null
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-purple-600" />
              Gelişmiş LaTeX Düzeltici
            </h1>
            <p className="text-gray-500">
              Toplu hata tarama ve düzeltme sistemi
            </p>
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={handleScan}
              disabled={scanning || fixing}
              className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 flex items-center gap-2"
            >
              {scanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              Hataları Tara
            </button>
            <button
              onClick={handleBatchFix}
              className={`px-4 py-2 rounded-lg text-white font-medium flex items-center gap-2 ${
                fixing ? 'bg-red-500 hover:bg-red-600' : 'bg-purple-600 hover:bg-purple-700'
              }`}
            >
              {fixing ? (
                <>
                  <Pause className="w-4 h-4" /> Durdur
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" /> Toplu Düzeltme Başlat
                </>
              )}
            </button>
          </div>
        </div>

        {/* Status Message */}
        {message && (
          <div className={`p-4 rounded-lg flex items-center gap-2 ${
            message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
            {message.text}
          </div>
        )}

        {/* Progress Bar (Only when fixing) */}
        {fixing && (
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex justify-between text-sm mb-2">
              <span className="font-medium">Düzeltme İlerlemesi</span>
              <span className="text-gray-500">{Math.round((fixProgress / fixTotal) * 100)}%</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
              <div 
                className="bg-purple-600 h-full transition-all duration-300 ease-out"
                style={{ width: `${(fixProgress / fixTotal) * 100}%` }}
              />
            </div>
            <div className="mt-2 text-xs text-center text-gray-500">
              {fixProgress.toLocaleString()} / {fixTotal.toLocaleString()} soru işlendi
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <div className="text-gray-500 text-sm mb-1">Toplam Soru</div>
            <div className="text-2xl font-bold">{stats?.total_questions.toLocaleString() || 0}</div>
          </div>
          <div className="bg-red-50 p-4 rounded-xl border border-red-100">
            <div className="text-red-600 text-sm mb-1">Tespit Edilen Hatalar</div>
            <div className="text-2xl font-bold text-red-700">{stats?.total_errors.toLocaleString() || 0}</div>
          </div>
          <div className="bg-orange-50 p-4 rounded-xl border border-orange-100">
            <div className="text-orange-600 text-sm mb-1">Sqrt Hataları</div>
            <div className="text-2xl font-bold text-orange-700">{stats?.by_type.sqrt.toLocaleString() || 0}</div>
          </div>
          <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
            <div className="text-blue-600 text-sm mb-1">Frac Hataları</div>
            <div className="text-2xl font-bold text-blue-700">{stats?.by_type.frac.toLocaleString() || 0}</div>
          </div>
        </div>

        {/* Error List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex justify-between items-center">
            <h3 className="font-semibold text-gray-900">Son Tespit Edilen Hatalar</h3>
            <button onClick={fetchErrors} className="text-gray-500 hover:text-gray-700">
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
          
          <div className="divide-y divide-gray-100">
            {errors.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                Hata bulunamadı veya hepsi düzeltildi.
              </div>
            ) : (
              errors.map((error) => (
                <div key={error.id} className="p-4 hover:bg-gray-50 transition-colors flex items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-0.5 text-xs rounded-full ${
                        error.error_type.includes('sqrt') ? 'bg-orange-100 text-orange-700' :
                        error.error_type.includes('frac') ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {error.error_type}
                      </span>
                      <span className="text-xs text-gray-400">
                        {new Date(error.detected_at).toLocaleString('tr-TR')}
                      </span>
                    </div>
                    <div className="text-sm font-mono bg-gray-50 p-2 rounded border border-gray-200 text-gray-700 break-all">
                      {error.error_sample}
                    </div>
                  </div>
                  <button
                    onClick={() => setPreviewError(error)}
                    className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                    title="Önizle"
                  >
                    <Eye className="w-5 h-5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      {previewError && previewError.question && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setPreviewError(null)}>
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b flex justify-between items-center sticky top-0 bg-white">
              <h3 className="font-bold">Hata Önizleme</h3>
              <button onClick={() => setPreviewError(null)}><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-2">Ham Metin</h4>
                <div className="bg-gray-50 p-4 rounded-lg font-mono text-sm whitespace-pre-wrap border">
                  {previewError.field === 'question_text' ? previewError.question.question_text : previewError.question.explanation}
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-2">Render Edilmiş (MathRenderer ile)</h4>
                <div className="border rounded-lg p-4">
                  <MathRenderer 
                    text={previewError.field === 'question_text' ? previewError.question.question_text : (previewError.question.explanation || '')} 
                  />
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg text-sm text-blue-700">
                <p>Not: Render edilmiş kısımda hata görünmüyorsa, Frontend düzeltmesi (MathRenderer) çalışıyor demektir.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
