'use client'

import { useState } from 'react'
import { Play, Loader2, Video, ExternalLink, X, Youtube } from 'lucide-react'

interface VideoSolutionButtonProps {
  questionId: string
  videoUrl?: string | null           // YouTube URL
  videoStorageUrl?: string | null    // Supabase Storage URL (öncelikli)
  videoStatus?: 'none' | 'pending' | 'processing' | 'completed' | 'failed'
  onVideoGenerated?: (url: string) => void
  className?: string
  compact?: boolean
}

export default function VideoSolutionButton({
  questionId,
  videoUrl,
  videoStorageUrl,
  videoStatus = 'none',
  onVideoGenerated,
  className = '',
  compact = false
}: VideoSolutionButtonProps) {
  const [status, setStatus] = useState(videoStatus)
  const [storageUrl, setStorageUrl] = useState(videoStorageUrl)
  const [youtubeUrl, setYoutubeUrl] = useState(videoUrl)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPlayer, setShowPlayer] = useState(false)

  // En iyi URL'i seç (Supabase öncelikli)
  const bestVideoUrl = storageUrl || youtubeUrl

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
      
      if (data.status === 'already_exists') {
        if (data.storageUrl) setStorageUrl(data.storageUrl)
        if (data.videoUrl) setYoutubeUrl(data.videoUrl)
        setStatus('completed')
        onVideoGenerated?.(data.storageUrl || data.videoUrl)
      } else if (data.status === 'queued') {
        setStatus('pending')
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
    const maxAttempts = 120 // 10 dakika (5 saniye aralıklarla)
    let attempts = 0
    
    const checkStatus = async () => {
      try {
        const response = await fetch(`/api/video/generate?questionId=${questionId}`)
        const data = await response.json()
        
        if (data.status === 'completed') {
          if (data.storageUrl) setStorageUrl(data.storageUrl)
          if (data.videoUrl) setYoutubeUrl(data.videoUrl)
          setStatus('completed')
          onVideoGenerated?.(data.storageUrl || data.videoUrl)
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
          setTimeout(checkStatus, 5000)
        }
        
      } catch (err) {
        console.error('Status kontrolü hatası:', err)
      }
    }
    
    setTimeout(checkStatus, 3000)
  }

  const handlePlayVideo = () => {
    if (storageUrl) {
      // Supabase video - inline player göster
      setShowPlayer(true)
    } else if (youtubeUrl) {
      // YouTube - yeni sekmede aç
      window.open(youtubeUrl, '_blank')
    }
  }

  // Video Player Modal
  if (showPlayer && storageUrl) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
        <div className="relative w-full max-w-md">
          {/* Kapatma butonu */}
          <button
            onClick={() => setShowPlayer(false)}
            className="absolute -top-10 right-0 text-white hover:text-gray-300 transition-colors"
          >
            <X className="w-8 h-8" />
          </button>
          
          {/* Video Player - 9:16 dikey format */}
          <div className="relative bg-black rounded-lg overflow-hidden" style={{ aspectRatio: '9/16' }}>
            <video
              src={storageUrl}
              controls
              autoPlay
              playsInline
              className="w-full h-full object-contain"
            >
              Tarayıcınız video oynatmayı desteklemiyor.
            </video>
          </div>
          
          {/* YouTube linki (varsa) */}
          {youtubeUrl && (
            <a
              href={youtubeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 flex items-center justify-center gap-2 text-white hover:text-red-400 transition-colors text-sm"
            >
              <Youtube className="w-4 h-4" />
              <span>YouTube'da İzle</span>
            </a>
          )}
        </div>
      </div>
    )
  }

  // Video hazır
  if (status === 'completed' && bestVideoUrl) {
    return (
      <button
        onClick={handlePlayVideo}
        className={`inline-flex items-center gap-2 px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white text-sm font-medium rounded-lg transition-colors ${className}`}
      >
        <Play className="w-4 h-4" />
        {!compact && <span>Video Çözüm İzle</span>}
        {!storageUrl && youtubeUrl && <ExternalLink className="w-3 h-3" />}
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
