'use client'

import { useState, useRef, useCallback, useEffect } from 'react'

interface UseTTSOptions {
  voice?: 'erdem' | 'mehmet' | 'gamze'
  onStart?: () => void
  onEnd?: () => void
  onError?: (error: Error) => void
}

interface UseTTSReturn {
  speak: (text: string) => Promise<void>
  stop: () => void
  isPlaying: boolean
  isLoading: boolean
  error: Error | null
}

export function useTTS(options: UseTTSOptions = {}): UseTTSReturn {
  const { voice = 'erdem', onStart, onEnd, onError } = options
  const [isPlaying, setIsPlaying] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  const speak = useCallback(async (text: string) => {
    if (!text || text.trim().length === 0) return

    // Önceki sesi durdur
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    setIsLoading(true)
    setError(null)
    abortControllerRef.current = new AbortController()

    try {
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, voice }),
        signal: abortControllerRef.current.signal
      })

      if (!response.ok) {
        throw new Error('TTS isteği başarısız')
      }

      const audioBlob = await response.blob()
      const audioUrl = URL.createObjectURL(audioBlob)
      
      const audio = new Audio(audioUrl)
      audioRef.current = audio

      audio.onplay = () => {
        setIsPlaying(true)
        onStart?.()
      }

      audio.onended = () => {
        setIsPlaying(false)
        URL.revokeObjectURL(audioUrl)
        onEnd?.()
      }

      audio.onerror = () => {
        const err = new Error('Ses çalınamadı')
        setError(err)
        setIsPlaying(false)
        onError?.(err)
      }

      setIsLoading(false)
      await audio.play()
    } catch (err) {
      if ((err as Error).name === 'AbortError') {
        // Request iptal edildi, hata değil
        return
      }
      const error = err instanceof Error ? err : new Error('TTS hatası')
      setError(error)
      setIsLoading(false)
      onError?.(error)
    }
  }, [voice, onStart, onEnd, onError])

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
      setIsPlaying(false)
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
  }, [])

  return {
    speak,
    stop,
    isPlaying,
    isLoading,
    error
  }
}

// Basit Web Speech API fallback (ElevenLabs çalışmazsa)
export function useWebSpeech() {
  const [isPlaying, setIsPlaying] = useState(false)
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)

  const speak = useCallback((text: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return

    window.speechSynthesis.cancel()
    
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'tr-TR'
    utterance.rate = 1.0
    utterance.pitch = 1.0

    utterance.onstart = () => setIsPlaying(true)
    utterance.onend = () => setIsPlaying(false)
    utterance.onerror = () => setIsPlaying(false)

    utteranceRef.current = utterance
    window.speechSynthesis.speak(utterance)
  }, [])

  const stop = useCallback(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel()
      setIsPlaying(false)
    }
  }, [])

  return { speak, stop, isPlaying }
}
