'use client'

import { useState, useEffect, useRef } from 'react'
import { Volume2, VolumeX, Bot } from 'lucide-react'

interface JarvisAvatarProps {
  isActive?: boolean
  isSpeaking?: boolean
  audioUrl?: string
  size?: 'sm' | 'md' | 'lg'
  externalVolume?: number // Dışarıdan gelen volume (0-1)
}

export default function JarvisAvatar({
  isActive = false,
  isSpeaking = false,
  audioUrl,
  size = 'md',
  externalVolume
}: JarvisAvatarProps) {
  const [mouthOpen, setMouthOpen] = useState(0)
  
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
    sm: { container: 'w-12 h-12', inner: 'w-10 h-10', icon: 'w-5 h-5' },
    md: { container: 'w-20 h-20', inner: 'w-16 h-16', icon: 'w-8 h-8' },
    lg: { container: 'w-28 h-28', inner: 'w-24 h-24', icon: 'w-12 h-12' }
  }

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
      const average = dataArray.reduce((a, b) => a + b) / dataArray.length
      const normalizedVolume = Math.min(average / 128, 1)
      
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

  // Ses olmadan konuşma animasyonu
  useEffect(() => {
    if (!isSpeaking || audioUrl) return

    const interval = setInterval(() => {
      setMouthOpen(Math.random() * 0.7 + 0.1)
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
        {/* Arka plan glow efekti - Cyan tema */}
        {isActive && (
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full blur-lg opacity-50 animate-pulse" />
        )}
        
        {/* Dış halka - Pulse animasyonu */}
        <div 
          className={`absolute inset-0 rounded-full border-2 transition-all duration-300 ${
            isSpeaking || isPlaying
              ? 'border-cyan-400 animate-ping opacity-50'
              : 'border-transparent'
          }`}
        />
        
        {/* Ana avatar - Futuristik tasarım */}
        <div className={`relative ${sizes[size].container} bg-gradient-to-br from-cyan-600 to-blue-700 rounded-full flex items-center justify-center shadow-lg shadow-cyan-500/30`}>
          {/* İç halka */}
          <div className={`${sizes[size].inner} bg-gradient-to-br from-slate-900 to-slate-800 rounded-full relative overflow-hidden flex items-center justify-center border border-cyan-500/30`}>
            {/* Bot ikonu */}
            <Bot 
              className={`${sizes[size].icon} text-cyan-400 transition-all duration-100`}
              style={{
                transform: `scale(${1 + mouthOpen * 0.2})`,
                filter: `drop-shadow(0 0 ${4 + mouthOpen * 8}px rgb(34 211 238 / ${0.4 + mouthOpen * 0.6}))`
              }}
            />
            
            {/* Ses dalga efekti */}
            {(isSpeaking || isPlaying) && (
              <>
                <div 
                  className="absolute inset-0 rounded-full border border-cyan-400/30"
                  style={{
                    transform: `scale(${1 + mouthOpen * 0.3})`,
                    opacity: 0.5 - mouthOpen * 0.3
                  }}
                />
                <div 
                  className="absolute inset-2 rounded-full border border-cyan-400/20"
                  style={{
                    transform: `scale(${1 + mouthOpen * 0.2})`,
                    opacity: 0.3 - mouthOpen * 0.2
                  }}
                />
              </>
            )}
            
            {/* Scan line efekti */}
            {isActive && (
              <div className="absolute inset-0 overflow-hidden rounded-full opacity-30">
                <div className="absolute w-full h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-scan" />
              </div>
            )}
          </div>
        </div>
        
        {/* Konuşma göstergesi */}
        {(isSpeaking || isPlaying) && (
          <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 flex gap-0.5">
            <div className="w-1 h-1 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-1 h-1 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-1 h-1 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        )}
      </div>

      {/* Ses oynatıcı */}
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
            className="mt-2 p-2 bg-cyan-100 dark:bg-cyan-900/30 rounded-full hover:bg-cyan-200 dark:hover:bg-cyan-900/50 transition-colors"
          >
            {isPlaying ? (
              <VolumeX className="w-4 h-4 text-cyan-600" />
            ) : (
              <Volume2 className="w-4 h-4 text-cyan-600" />
            )}
          </button>
        </>
      )}

      {/* CSS Animasyonları */}
      <style jsx>{`
        @keyframes scan {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(500%); }
        }
        .animate-scan {
          animation: scan 2s linear infinite;
        }
      `}</style>
    </div>
  )
}
