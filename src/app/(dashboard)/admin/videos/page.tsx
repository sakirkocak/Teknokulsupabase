'use client'

import { useState, useEffect } from 'react'
import { useProfile } from '@/hooks/useProfile'
import { createClient } from '@/lib/supabase/client'
import { 
  Video, 
  Play, 
  Clock, 
  CheckCircle, 
  XCircle, 
  RefreshCw,
  TrendingUp,
  DollarSign,
  Loader2,
  ExternalLink,
  Youtube,
  Copy,
  Eye,
  Ban,
  Trash2
} from 'lucide-react'

interface VideoStats {
  total_videos: number
  pending_count: number
  processing_count: number
  completed_count: number
  failed_count: number
  total_cost_usd: number
}

interface QueueItem {
  id: string
  question_id: string
  status: string
  created_at: string
  completed_at: string | null
  estimated_cost_usd: number | null
  questions: { 
    question_text: string
    video_solution_url: string | null
    video_youtube_id: string | null
    video_status: string | null
  } | null
}

export default function AdminVideosPage() {
  const { profile, loading: profileLoading } = useProfile()
  const [stats, setStats] = useState<VideoStats | null>(null)
  const [recentVideos, setRecentVideos] = useState<QueueItem[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [batchCount, setBatchCount] = useState(10)
  const [cancelling, setCancelling] = useState(false)

  useEffect(() => {
    if (profile?.role === 'admin') {
      fetchData()
    }
  }, [profile])

  const fetchData = async () => {
    try {
      const response = await fetch('/api/video/process')
      const data = await response.json()
      
      if (data.success) {
        setStats(data.stats)
        setRecentVideos(data.recentVideos || [])
      }
    } catch (error) {
      console.error('Veri alınamadı:', error)
    } finally {
      setLoading(false)
    }
  }

  const processNextVideo = async () => {
    setProcessing(true)
    try {
      const response = await fetch('/api/video/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      
      const data = await response.json()
      
      if (data.success) {
        alert(data.message)
        fetchData()
      } else {
        alert('Hata: ' + data.error)
      }
    } catch (error: any) {
      alert('Hata: ' + error.message)
    } finally {
      setProcessing(false)
    }
  }

  const addBatchToQueue = async () => {
    setProcessing(true)
    try {
      const supabase = createClient()
      
      // Video çözümü olmayan soruları al
      const { data: questions, error } = await supabase
        .from('questions')
        .select('id')
        .or('video_status.is.null,video_status.eq.none')
        .limit(batchCount)
      
      if (error) throw error
      
      if (!questions || questions.length === 0) {
        alert('Eklenecek soru bulunamadı')
        return
      }
      
      // Her birini queue'ya ekle
      let added = 0
      for (const q of questions) {
        const response = await fetch('/api/video/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ questionId: q.id })
        })
        
        if (response.ok) added++
      }
      
      alert(`${added} soru kuyruğa eklendi`)
      fetchData()
      
    } catch (error: any) {
      alert('Hata: ' + error.message)
    } finally {
      setProcessing(false)
    }
  }

  // Bekleyen ve işlenen tüm videoları iptal et
  const cancelAllPending = async () => {
    if (!confirm('Bekleyen ve işlenen TÜM videoları iptal etmek istediğinize emin misiniz?')) return
    
    setCancelling(true)
    try {
      const supabase = createClient()
      
      // 1. Queue'daki pending/processing kayıtları cancelled yap
      const { error: queueError } = await supabase
        .from('video_generation_queue')
        .update({ status: 'cancelled' })
        .in('status', ['pending', 'processing'])
      
      if (queueError) throw queueError
      
      // 2. Questions tablosundaki video_status'ları sıfırla
      const { error: questionsError } = await supabase
        .from('questions')
        .update({ video_status: 'none' })
        .in('video_status', ['pending', 'processing'])
      
      if (questionsError) throw questionsError
      
      alert('✅ Tüm bekleyen videolar iptal edildi!')
      fetchData()
      
    } catch (error: any) {
      alert('Hata: ' + error.message)
    } finally {
      setCancelling(false)
    }
  }

  if (profileLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    )
  }

  if (profile?.role !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-red-500">Bu sayfaya erişim yetkiniz yok.</p>
      </div>
    )
  }

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    processing: 'bg-blue-100 text-blue-800',
    completed: 'bg-green-100 text-green-800',
    failed: 'bg-red-100 text-red-800'
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Video className="w-7 h-7 text-indigo-600" />
            Video Çözüm Yönetimi
          </h1>
          <p className="text-gray-500 mt-1">Manim + ElevenLabs ile otomatik video üretimi</p>
        </div>
        
        <button
          onClick={fetchData}
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      {/* İstatistikler */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        <div className="bg-white rounded-xl p-4 shadow-sm border">
          <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
            <Video className="w-4 h-4" />
            Toplam
          </div>
          <div className="text-2xl font-bold text-gray-900">{stats?.total_videos || 0}</div>
        </div>
        
        <div className="bg-white rounded-xl p-4 shadow-sm border">
          <div className="flex items-center gap-2 text-yellow-500 text-sm mb-1">
            <Clock className="w-4 h-4" />
            Bekliyor
          </div>
          <div className="text-2xl font-bold text-yellow-600">{stats?.pending_count || 0}</div>
        </div>
        
        <div className="bg-white rounded-xl p-4 shadow-sm border">
          <div className="flex items-center gap-2 text-blue-500 text-sm mb-1">
            <Loader2 className="w-4 h-4" />
            İşleniyor
          </div>
          <div className="text-2xl font-bold text-blue-600">{stats?.processing_count || 0}</div>
        </div>
        
        <div className="bg-white rounded-xl p-4 shadow-sm border">
          <div className="flex items-center gap-2 text-green-500 text-sm mb-1">
            <CheckCircle className="w-4 h-4" />
            Tamamlandı
          </div>
          <div className="text-2xl font-bold text-green-600">{stats?.completed_count || 0}</div>
        </div>
        
        <div className="bg-white rounded-xl p-4 shadow-sm border">
          <div className="flex items-center gap-2 text-red-500 text-sm mb-1">
            <XCircle className="w-4 h-4" />
            Başarısız
          </div>
          <div className="text-2xl font-bold text-red-600">{stats?.failed_count || 0}</div>
        </div>
        
        <div className="bg-white rounded-xl p-4 shadow-sm border">
          <div className="flex items-center gap-2 text-indigo-500 text-sm mb-1">
            <DollarSign className="w-4 h-4" />
            Toplam Maliyet
          </div>
          <div className="text-2xl font-bold text-indigo-600">
            ${(stats?.total_cost_usd || 0).toFixed(2)}
          </div>
        </div>
      </div>

      {/* Aksiyonlar */}
      <div className="bg-white rounded-xl p-6 shadow-sm border mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Aksiyonlar</h2>
        
        <div className="flex flex-wrap gap-4">
          <button
            onClick={processNextVideo}
            disabled={processing}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg disabled:opacity-50"
          >
            {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            Sıradaki Videoyu İşle
          </button>
          
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={batchCount}
              onChange={(e) => setBatchCount(Number(e.target.value))}
              min={1}
              max={100}
              className="w-20 px-3 py-2 border rounded-lg"
            />
            <button
              onClick={addBatchToQueue}
              disabled={processing}
              className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg disabled:opacity-50"
            >
              {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <TrendingUp className="w-4 h-4" />}
              Toplu Ekle
            </button>
          </div>
          
          {/* Tümünü İptal Et Butonu */}
          {(stats?.pending_count || 0) + (stats?.processing_count || 0) > 0 && (
            <button
              onClick={cancelAllPending}
              disabled={cancelling}
              className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg disabled:opacity-50"
            >
              {cancelling ? <Loader2 className="w-4 h-4 animate-spin" /> : <Ban className="w-4 h-4" />}
              Tümünü İptal Et ({(stats?.pending_count || 0) + (stats?.processing_count || 0)})
            </button>
          )}
        </div>
      </div>

      {/* Son İşlenen Videolar */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Son İşlenen Videolar</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Soru</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Durum</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">YouTube</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Maliyet</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tarih</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Aksiyon</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {recentVideos.map((video) => (
                <tr key={video.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <p className="text-sm text-gray-900 line-clamp-1">
                      {video.questions?.question_text?.slice(0, 60) || 'Bilinmeyen'}...
                    </p>
                    <p className="text-xs text-gray-500">{video.question_id.slice(0, 8)}...</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${statusColors[video.status] || 'bg-gray-100'}`}>
                      {video.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {video.questions?.video_solution_url ? (
                      <div className="flex items-center gap-2">
                        <a 
                          href={video.questions.video_solution_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-xs font-medium"
                        >
                          <Youtube className="w-3 h-3" />
                          İzle
                        </a>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(video.questions?.video_solution_url || '')
                            alert('Link kopyalandı!')
                          }}
                          className="p-1 hover:bg-gray-100 rounded"
                          title="Linki kopyala"
                        >
                          <Copy className="w-3 h-3 text-gray-400" />
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    ${(video.estimated_cost_usd || 0).toFixed(3)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(video.created_at).toLocaleDateString('tr-TR')}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {video.questions?.video_solution_url && (
                        <a
                          href={video.questions.video_solution_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1 hover:bg-indigo-100 rounded text-indigo-600"
                          title="Videoyu aç"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                      <a
                        href={`/sorular/matematik/8/${video.question_id}`}
                        target="_blank"
                        className="p-1 hover:bg-blue-100 rounded text-blue-600"
                        title="Soruyu görüntüle"
                      >
                        <Eye className="w-4 h-4" />
                      </a>
                    </div>
                  </td>
                </tr>
              ))}
              
              {recentVideos.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    Henüz video işlenmemiş
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Maliyet Bilgisi */}
      <div className="mt-8 p-4 bg-indigo-50 rounded-xl">
        <h3 className="font-medium text-indigo-900 mb-2">💰 Tahmini Maliyet Bilgisi</h3>
        <ul className="text-sm text-indigo-700 space-y-1">
          <li>• ElevenLabs: ~$0.165 / 1000 karakter (Scale plan)</li>
          <li>• Gemini: ~$0.005 / istek</li>
          <li>• YouTube: Ücretsiz</li>
          <li>• <strong>Ortalama video maliyeti: ~$0.17-0.20</strong></li>
        </ul>
      </div>
    </div>
  )
}
