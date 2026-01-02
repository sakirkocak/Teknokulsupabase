'use client'

import { useState, useEffect, useRef } from 'react'
import { Volume2, VolumeX } from 'lucide-react'

interface TeknoTeacherAvatarProps {
  isActive?: boolean
  isSpeaking?: boolean
  audioUrl?: string
  size?: 'sm' | 'md' | 'lg'
  personality?: 'friendly' | 'strict' | 'motivating'
  externalVolume?: number // Dışarıdan gelen volume (0-1)
}

export default function TeknoTeacherAvatar({
  isActive = false,
  isSpeaking = false,
  audioUrl,
  size = 'md',
  personality = 'friendly',
  externalVolume
}: TeknoTeacherAvatarProps) {
  const [mouthOpen, setMouthOpen] = useState(0) // 0-1 arası
  
  // Dışarıdan volume geliyorsa kullan
  useEffect(() => {
    if (externalVolume !== undefined) {
      setMouthOpen(externalVolume)
    }
  }, [externalVolume])
  const [isPlaying, setIsPlaying] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const animationRef = useRef<number | null>(null)

  // Boyut değerleri
  const sizes = {
    sm: { container: 'w-16 h-16', face: 'w-12 h-12' },
    md: { container: 'w-24 h-24', face: 'w-20 h-20' },
    lg: { container: 'w-32 h-32', face: 'w-28 h-28' }
  }

  // Kişilik renkleri
  const colors = {
    friendly: {
      bg: 'from-indigo-500 to-purple-600',
      face: 'bg-amber-100',
      cheeks: 'bg-pink-200'
    },
    strict: {
      bg: 'from-slate-600 to-slate-800',
      face: 'bg-amber-50',
      cheeks: 'bg-transparent'
    },
    motivating: {
      bg: 'from-orange-500 to-red-500',
      face: 'bg-amber-100',
      cheeks: 'bg-pink-300'
    }
  }

  const colorScheme = colors[personality]

  // Web Audio API ile ses analizi
  useEffect(() => {
    if (!audioUrl || !isPlaying) return

    const audio = audioRef.current
    if (!audio) return

    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    const analyser = audioContext.createAnalyser()
    analyser.fftSize = 256

    const source = audioContext.createMediaElementSource(audio)
    source.connect(analyser)
    analyser.connect(audioContext.destination)

    analyserRef.current = analyser

    const dataArray = new Uint8Array(analyser.frequencyBinCount)

    const animate = () => {
      analyser.getByteFrequencyData(dataArray)
      
      // Ortalama ses seviyesini hesapla
      const average = dataArray.reduce((a, b) => a + b) / dataArray.length
      const normalizedVolume = Math.min(average / 128, 1) // 0-1 arası normalize et
      
      setMouthOpen(normalizedVolume)
      animationRef.current = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
      audioContext.close()
    }
  }, [audioUrl, isPlaying])

  // Ses olmadan konuşma animasyonu (simülasyon)
  useEffect(() => {
    if (!isSpeaking || audioUrl) return

    const interval = setInterval(() => {
      setMouthOpen(Math.random() * 0.7 + 0.1) // 0.1-0.8 arası rastgele
    }, 100)

    return () => {
      clearInterval(interval)
      setMouthOpen(0)
    }
  }, [isSpeaking, audioUrl])

  const playAudio = () => {
    if (audioRef.current) {
      audioRef.current.play()
      setIsPlaying(true)
    }
  }

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
      setIsPlaying(false)
      setMouthOpen(0)
    }
  }

  return (
    <div className="flex flex-col items-center">
      {/* Avatar Container */}
      <div className={`${sizes[size].container} relative`}>
        {/* Arka plan glow efekti */}
        {isActive && (
          <div className={`absolute inset-0 bg-gradient-to-br ${colorScheme.bg} rounded-full blur-lg opacity-50 animate-pulse`} />
        )}
        
        {/* Ana avatar */}
        <div className={`relative ${sizes[size].container} bg-gradient-to-br ${colorScheme.bg} rounded-full flex items-center justify-center shadow-lg`}>
          {/* Yüz */}
          <div className={`${sizes[size].face} ${colorScheme.face} rounded-full relative overflow-hidden`}>
            {/* Gözler */}
            <div className="absolute top-1/3 left-0 right-0 flex justify-center gap-3">
              {/* Sol göz */}
              <div className="relative">
                <div className="w-3 h-3 bg-gray-800 rounded-full">
                  {/* Göz parlaması */}
                  <div className="absolute top-0.5 left-0.5 w-1 h-1 bg-white rounded-full" />
                </div>
                {/* Göz kırpma animasyonu */}
                {isActive && (
                  <div className="absolute inset-0 bg-amber-100 rounded-full animate-blink" 
                       style={{ animationDuration: '3s' }} />
                )}
              </div>
              
              {/* Sağ göz */}
              <div className="relative">
                <div className="w-3 h-3 bg-gray-800 rounded-full">
                  <div className="absolute top-0.5 left-0.5 w-1 h-1 bg-white rounded-full" />
                </div>
                {isActive && (
                  <div className="absolute inset-0 bg-amber-100 rounded-full animate-blink"
                       style={{ animationDuration: '3s' }} />
                )}
              </div>
            </div>
            
            {/* Yanaklar */}
            <div className="absolute top-1/2 left-1 w-2 h-1.5 rounded-full opacity-60"
                 style={{ backgroundColor: personality === 'strict' ? 'transparent' : '#fbb6ce' }} />
            <div className="absolute top-1/2 right-1 w-2 h-1.5 rounded-full opacity-60"
                 style={{ backgroundColor: personality === 'strict' ? 'transparent' : '#fbb6ce' }} />
            
            {/* Ağız - Lip Sync */}
            <div className="absolute bottom-1/4 left-1/2 transform -translate-x-1/2">
              <div 
                className="bg-gray-800 rounded-full transition-all duration-75"
                style={{
                  width: `${8 + mouthOpen * 4}px`,
                  height: `${2 + mouthOpen * 8}px`,
                  borderRadius: mouthOpen > 0.3 ? '50%' : '9999px'
                }}
              />
              {/* Dil (konuşurken) */}
              {mouthOpen > 0.4 && (
                <div 
                  className="absolute top-1/2 left-1/2 transform -translate-x-1/2 bg-red-400 rounded-full"
                  style={{
                    width: '4px',
                    height: `${mouthOpen * 3}px`
                  }}
                />
              )}
            </div>
          </div>
        </div>
        
        {/* Konuşma göstergesi */}
        {(isSpeaking || isPlaying) && (
          <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 flex gap-0.5">
            <div className="w-1 h-1 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-1 h-1 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-1 h-1 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        )}
      </div>

      {/* Ses oynatıcı (audioUrl varsa) */}
      {audioUrl && (
        <>
          <audio
            ref={audioRef}
            src={audioUrl}
            onEnded={() => {
              setIsPlaying(false)
              setMouthOpen(0)
            }}
          />
          <button
            onClick={isPlaying ? stopAudio : playAudio}
            className="mt-2 p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-full hover:bg-indigo-200 dark:hover:bg-indigo-900/50 transition-colors"
          >
            {isPlaying ? (
              <VolumeX className="w-4 h-4 text-indigo-600" />
            ) : (
              <Volume2 className="w-4 h-4 text-indigo-600" />
            )}
          </button>
        </>
      )}

      {/* CSS Animasyonları */}
      <style jsx>{`
        @keyframes blink {
          0%, 90%, 100% { transform: scaleY(0); }
          95% { transform: scaleY(1); }
        }
        .animate-blink {
          animation: blink 3s infinite;
        }
      `}</style>
    </div>
  )
}
