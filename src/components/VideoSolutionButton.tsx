'use client'

import { useState, useEffect } from 'react'
import { Play, Loader2, Video, ExternalLink, X, Youtube, Lock, Coins, LogIn } from 'lucide-react'
import Link from 'next/link'

interface CreditStatus {
  remaining: number
  is_premium: boolean
  daily_credits: number
  used_today: number
}

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
  
  // Kredi durumu
  const [credits, setCredits] = useState<CreditStatus | null>(null)
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null)
  const [checkingCredits, setCheckingCredits] = useState(true)

  // En iyi URL'i seç (Supabase öncelikli)
  const bestVideoUrl = storageUrl || youtubeUrl
  const hasVideo = status === 'completed' && bestVideoUrl

  // Sayfa açılınca güncel video durumunu kontrol et (cache sorunu için)
  useEffect(() => {
    const checkVideoStatus = async () => {
      try {
        const response = await fetch(`/api/video/generate?questionId=${questionId}`)
        const data = await response.json()
        
        if (data.status === 'completed') {
          if (data.storageUrl) setStorageUrl(data.storageUrl)
          if (data.videoUrl) setYoutubeUrl(data.videoUrl)
          setStatus('completed')
        } else if (data.status && data.status !== 'none') {
          setStatus(data.status)
        }
      } catch (err) {
        console.error('Video status kontrolü hatası:', err)
      }
    }
    
    // Sadece video yoksa veya pending/processing ise kontrol et
    if (!bestVideoUrl || status === 'pending' || status === 'processing') {
      checkVideoStatus()
    }
  }, [questionId])

  // Kredi durumunu kontrol et
  useEffect(() => {
    const checkCredits = async () => {
      try {
        const response = await fetch('/api/tekno-teacher/credits')
        const data = await response.json()
        
        if (response.status === 401) {
          setIsLoggedIn(false)
          setCredits(null)
        } else if (data.success) {
          setIsLoggedIn(true)
          setCredits(data.credits)
        }
      } catch (err) {
        console.error('Kredi kontrolü hatası:', err)
      } finally {
        setCheckingCredits(false)
      }
    }
    
    checkCredits()
  }, [])

  const handleGenerateVideo = async () => {
    if (loading || status === 'processing' || status === 'pending') return
    
    // Giriş kontrolü
    if (!isLoggedIn) {
      setError('Video üretmek için giriş yapmalısınız')
      return
    }
    
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
      } else if (data.status === 'queued' || data.status === 'completed') {
        if (data.storageUrl) setStorageUrl(data.storageUrl)
        if (data.videoUrl) setYoutubeUrl(data.videoUrl)
        setStatus(data.status)
        if (data.status !== 'completed') {
          pollVideoStatus()
        }
        onVideoGenerated?.(data.storageUrl || data.videoUrl)
      }
      
    } catch (err: any) {
      setError(err.message)
      setStatus('failed')
    } finally {
      setLoading(false)
    }
  }

  const pollVideoStatus = async () => {
    const maxAttempts = 120
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

  const handlePlayVideo = async () => {
    // Giriş kontrolü
    if (!isLoggedIn) {
      setError('Video izlemek için giriş yapmalısınız')
      return
    }
    
    // Kredi kontrolü (premium değilse)
    if (credits && !credits.is_premium && credits.remaining <= 0) {
      setError('Krediniz bitti! Premium üyelik alın.')
      return
    }
    
    // Kredi harca
    if (credits && !credits.is_premium) {
      try {
        await fetch('/api/video/watch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ questionId })
        })
        // Kredi güncelle
        setCredits(prev => prev ? { ...prev, remaining: prev.remaining - 1, used_today: prev.used_today + 1 } : null)
      } catch (err) {
        console.error('Kredi harcama hatası:', err)
      }
    }
    
    if (storageUrl) {
      setShowPlayer(true)
    } else if (youtubeUrl) {
      window.open(youtubeUrl, '_blank')
    }
  }

  // Yükleniyor
  if (checkingCredits) {
    return (
      <div className={`inline-flex items-center gap-2 px-3 py-1.5 bg-gray-200 text-gray-500 text-sm font-medium rounded-lg ${className}`}>
        <Loader2 className="w-4 h-4 animate-spin" />
        {!compact && <span>Yükleniyor...</span>}
      </div>
    )
  }

  // Video Player Modal
  if (showPlayer && storageUrl) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
        <div className="relative w-full max-w-md">
          <button
            onClick={() => setShowPlayer(false)}
            className="absolute -top-10 right-0 text-white hover:text-gray-300 transition-colors"
          >
            <X className="w-8 h-8" />
          </button>
          
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

  // Giriş yapmamış - Video varsa
  if (!isLoggedIn && hasVideo) {
    return (
      <Link
        href="/giris"
        className={`inline-flex items-center gap-2 px-3 py-1.5 bg-purple-500 hover:bg-purple-600 text-white text-sm font-medium rounded-lg transition-colors ${className}`}
      >
        <LogIn className="w-4 h-4" />
        {!compact && <span>Giriş Yap & İzle</span>}
      </Link>
    )
  }

  // Video hazır - Kredi kontrolü
  if (hasVideo) {
    const hasCredits = credits?.is_premium || (credits?.remaining && credits.remaining > 0)
    
    if (!hasCredits) {
      return (
        <div className={`inline-flex flex-col gap-1 ${className}`}>
          <Link
            href="/premium"
            className="inline-flex items-center gap-2 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <Lock className="w-4 h-4" />
            {!compact && <span>Premium Al</span>}
          </Link>
          <span className="text-xs text-amber-600">Krediniz bitti</span>
        </div>
      )
    }
    
    return (
      <div className={`inline-flex flex-col gap-1 ${className}`}>
        <button
          onClick={handlePlayVideo}
          className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <Play className="w-4 h-4" />
          {!compact && <span>Video Çözüm İzle</span>}
          {!storageUrl && youtubeUrl && <ExternalLink className="w-3 h-3" />}
        </button>
        {!credits?.is_premium && (
          <span className="text-xs text-gray-500 flex items-center gap-1">
            <Coins className="w-3 h-3" />
            {credits?.remaining} kredi kaldı
          </span>
        )}
      </div>
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

  // Giriş yapmamış - Video yok
  if (!isLoggedIn) {
    return (
      <Link
        href="/giris"
        className={`inline-flex items-center gap-2 px-3 py-1.5 bg-gray-400 hover:bg-gray-500 text-white text-sm font-medium rounded-lg transition-colors ${className}`}
      >
        <LogIn className="w-4 h-4" />
        {!compact && <span>Giriş Yap</span>}
      </Link>
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
