'use client'

import { useState } from 'react'
import { Play, Loader2, Video, ExternalLink } from 'lucide-react'

interface VideoSolutionButtonProps {
  questionId: string
  videoUrl?: string | null
  videoStatus?: 'none' | 'pending' | 'processing' | 'completed' | 'failed'
  onVideoGenerated?: (url: string) => void
  className?: string
  compact?: boolean
}

export default function VideoSolutionButton({
  questionId,
  videoUrl,
  videoStatus = 'none',
  onVideoGenerated,
  className = '',
  compact = false
}: VideoSolutionButtonProps) {
  const [status, setStatus] = useState(videoStatus)
  const [url, setUrl] = useState(videoUrl)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleGenerateVideo = async () => {
    if (loading || status === 'processing' || status === 'pending') return
    
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/video/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionId })
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Video üretilemedi')
      }
      
      if (data.status === 'already_exists' && data.videoUrl) {
        setUrl(data.videoUrl)
        setStatus('completed')
        onVideoGenerated?.(data.videoUrl)
      } else if (data.status === 'queued') {
        setStatus('pending')
        // Polling başlat
        pollVideoStatus()
      }
      
    } catch (err: any) {
      setError(err.message)
      setStatus('failed')
    } finally {
      setLoading(false)
    }
  }

  const pollVideoStatus = async () => {
    const maxAttempts = 60 // 5 dakika (5 saniye aralıklarla)
    let attempts = 0
    
    const checkStatus = async () => {
      try {
        const response = await fetch(`/api/video/generate?questionId=${questionId}`)
        const data = await response.json()
        
        if (data.status === 'completed' && data.videoUrl) {
          setUrl(data.videoUrl)
          setStatus('completed')
          onVideoGenerated?.(data.videoUrl)
          return
        }
        
        if (data.status === 'failed') {
          setStatus('failed')
          setError('Video üretimi başarısız oldu')
          return
        }
        
        attempts++
        if (attempts < maxAttempts && (data.status === 'pending' || data.status === 'processing')) {
          setStatus(data.status)
          setTimeout(checkStatus, 5000) // 5 saniye sonra tekrar kontrol
        }
        
      } catch (err) {
        console.error('Status kontrolü hatası:', err)
      }
    }
    
    setTimeout(checkStatus, 3000)
  }

  const openVideo = () => {
    if (url) {
      window.open(url, '_blank')
    }
  }

  // Video hazır
  if (status === 'completed' && url) {
    return (
      <button
        onClick={openVideo}
        className={`inline-flex items-center gap-2 px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white text-sm font-medium rounded-lg transition-colors ${className}`}
      >
        <Play className="w-4 h-4" />
        {!compact && <span>Video Çözüm İzle</span>}
        <ExternalLink className="w-3 h-3" />
      </button>
    )
  }

  // Bekliyor veya işleniyor
  if (status === 'pending' || status === 'processing' || loading) {
    return (
      <button
        disabled
        className={`inline-flex items-center gap-2 px-3 py-1.5 bg-yellow-500 text-white text-sm font-medium rounded-lg cursor-wait ${className}`}
      >
        <Loader2 className="w-4 h-4 animate-spin" />
        {!compact && (
          <span>
            {status === 'processing' ? 'Üretiliyor...' : 'Sırada...'}
          </span>
        )}
      </button>
    )
  }

  // Hata durumu
  if (status === 'failed' || error) {
    return (
      <div className={`inline-flex flex-col gap-1 ${className}`}>
        <button
          onClick={handleGenerateVideo}
          className="inline-flex items-center gap-2 px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <Video className="w-4 h-4" />
          {!compact && <span>Tekrar Dene</span>}
        </button>
        {error && <span className="text-xs text-red-500">{error}</span>}
      </div>
    )
  }

  // Varsayılan - Video üret butonu
  return (
    <button
      onClick={handleGenerateVideo}
      disabled={loading}
      className={`inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-medium rounded-lg transition-colors ${className}`}
    >
      <Video className="w-4 h-4" />
      {!compact && <span>Video Çözüm Üret</span>}
    </button>
  )
}
