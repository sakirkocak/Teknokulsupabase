'use client'

import { useState, useRef, useCallback, useEffect } from 'react'

interface UseSpeechOptions {
  onVolumeChange?: (volume: number) => void
  onStart?: () => void
  onEnd?: () => void
  onError?: (error: Error) => void
}

interface UseSpeechReturn {
  // State
  isPlaying: boolean
  isLoading: boolean
  volume: number
  duration: number
  currentTime: number
  speaking: boolean // Alias for isPlaying
  supported: boolean
  
  // Actions
  speak: (text: string) => Promise<void>
  playAudio: (url: string) => Promise<void>
  stop: () => void
  pause: () => void
  resume: () => void
  
  // Refs
  audioRef: React.RefObject<HTMLAudioElement>
}

/**
 * useSpeech Hook
 * TTS ve ses oynatma için Web Audio API entegrasyonu
 * Lip-sync için volume analizi sağlar
 */
export function useSpeech(options: UseSpeechOptions & { rate?: number } = {}): UseSpeechReturn {
  const { onVolumeChange, onStart, onEnd, onError } = options
  
  const [isPlaying, setIsPlaying] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [volume, setVolume] = useState(0)
  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [supported, setSupported] = useState(false)
  
  // Browser desteğini kontrol et
  useEffect(() => {
    setSupported('speechSynthesis' in window)
  }, [])
  
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  
  // Audio context başlat
  const initAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
    }
    return audioContextRef.current
  }, [])
  
  // Volume analizi için animasyon döngüsü
  const startVolumeAnalysis = useCallback(() => {
    if (!analyserRef.current) return
    
    const analyser = analyserRef.current
    const dataArray = new Uint8Array(analyser.frequencyBinCount)
    
    const analyze = () => {
      analyser.getByteFrequencyData(dataArray)
      
      // Ortalama ses seviyesi (0-1 arası)
      const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length
      const normalizedVolume = Math.min(average / 128, 1)
      
      setVolume(normalizedVolume)
      onVolumeChange?.(normalizedVolume)
      
      animationFrameRef.current = requestAnimationFrame(analyze)
    }
    
    analyze()
  }, [onVolumeChange])
  
  // Volume analizini durdur
  const stopVolumeAnalysis = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }
    setVolume(0)
    onVolumeChange?.(0)
  }, [onVolumeChange])
  
  // Audio URL oynat
  const playAudio = useCallback(async (url: string) => {
    try {
      setIsLoading(true)
      
      // Mevcut sesi durdur
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.src = ''
      }
      
      // Yeni audio element
      const audio = new Audio()
      audio.crossOrigin = 'anonymous'
      audio.src = url
      audioRef.current = audio
      
      // Event listeners
      audio.onloadedmetadata = () => {
        setDuration(audio.duration)
      }
      
      audio.ontimeupdate = () => {
        setCurrentTime(audio.currentTime)
      }
      
      audio.onplay = () => {
        setIsPlaying(true)
        setIsLoading(false)
        onStart?.()
        
        // Audio context ve analyser ayarla
        const context = initAudioContext()
        
        if (!sourceRef.current) {
          const source = context.createMediaElementSource(audio)
          const analyser = context.createAnalyser()
          analyser.fftSize = 256
          
          source.connect(analyser)
          analyser.connect(context.destination)
          
          sourceRef.current = source
          analyserRef.current = analyser
        }
        
        startVolumeAnalysis()
      }
      
      audio.onended = () => {
        setIsPlaying(false)
        stopVolumeAnalysis()
        onEnd?.()
      }
      
      audio.onerror = () => {
        setIsPlaying(false)
        setIsLoading(false)
        stopVolumeAnalysis()
        onError?.(new Error('Ses dosyası yüklenemedi'))
      }
      
      // Oynat
      await audio.play()
      
    } catch (error: any) {
      setIsLoading(false)
      setIsPlaying(false)
      onError?.(error)
    }
  }, [initAudioContext, startVolumeAnalysis, stopVolumeAnalysis, onStart, onEnd, onError])
  
  // TTS ile konuş (Web Speech API)
  const speak = useCallback(async (text: string) => {
    try {
      setIsLoading(true)
      
      // Browser Speech Synthesis API kullan
      if (!('speechSynthesis' in window)) {
        throw new Error('Tarayıcınız ses sentezini desteklemiyor')
      }
      
      // Mevcut konuşmayı durdur
      window.speechSynthesis.cancel()
      
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = 'tr-TR'
      utterance.rate = 1.0
      utterance.pitch = 1.0
      
      // Türkçe ses bul
      const voices = window.speechSynthesis.getVoices()
      const turkishVoice = voices.find(v => v.lang.includes('tr')) || voices[0]
      if (turkishVoice) {
        utterance.voice = turkishVoice
      }
      
      // Lip-sync için ses analizi simülasyonu
      let volumeInterval: NodeJS.Timeout | null = null
      
      utterance.onstart = () => {
        setIsLoading(false)
        setIsPlaying(true)
        onStart?.()
        
        // Simüle edilmiş volume değişimi (gerçek Web Speech API volume vermiyor)
        volumeInterval = setInterval(() => {
          const simulatedVolume = 0.3 + Math.random() * 0.5
          setVolume(simulatedVolume)
          onVolumeChange?.(simulatedVolume)
        }, 100)
      }
      
      utterance.onend = () => {
        setIsPlaying(false)
        setVolume(0)
        onVolumeChange?.(0)
        onEnd?.()
        if (volumeInterval) clearInterval(volumeInterval)
      }
      
      utterance.onerror = (event) => {
        setIsPlaying(false)
        setIsLoading(false)
        setVolume(0)
        onError?.(new Error('Ses sentezi hatası'))
        if (volumeInterval) clearInterval(volumeInterval)
      }
      
      window.speechSynthesis.speak(utterance)
      
    } catch (error: any) {
      setIsLoading(false)
      setIsPlaying(false)
      onError?.(error)
    }
  }, [onStart, onEnd, onError, onVolumeChange])
  
  // Durdur
  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
    }
    setIsPlaying(false)
    setCurrentTime(0)
    stopVolumeAnalysis()
  }, [stopVolumeAnalysis])
  
  // Duraklat
  const pause = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause()
    }
    setIsPlaying(false)
    stopVolumeAnalysis()
  }, [stopVolumeAnalysis])
  
  // Devam et
  const resume = useCallback(async () => {
    if (audioRef.current) {
      await audioRef.current.play()
      setIsPlaying(true)
      startVolumeAnalysis()
    }
  }, [startVolumeAnalysis])
  
  // Cleanup
  useEffect(() => {
    return () => {
      stop()
      if (audioContextRef.current) {
        audioContextRef.current.close()
      }
    }
  }, [stop])
  
  return {
    isPlaying,
    isLoading,
    volume,
    duration,
    currentTime,
    speaking: isPlaying, // Alias
    supported,
    speak,
    playAudio,
    stop,
    pause,
    resume,
    audioRef: audioRef as React.RefObject<HTMLAudioElement>
  }
}

/**
 * useLetterSpeech Hook
 * Harf, hece ve kelime okuma için basit TTS hook'u
 */
export function useLetterSpeech() {
  const [speaking, setSpeaking] = useState(false)
  const [supported, setSupported] = useState(false)
  
  useEffect(() => {
    setSupported('speechSynthesis' in window)
  }, [])
  
  const speak = useCallback((text: string, rate = 0.8) => {
    if (!supported) return
    
    window.speechSynthesis.cancel()
    
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'tr-TR'
    utterance.rate = rate
    utterance.pitch = 1.0
    
    const voices = window.speechSynthesis.getVoices()
    const turkishVoice = voices.find(v => v.lang.includes('tr'))
    if (turkishVoice) {
      utterance.voice = turkishVoice
    }
    
    utterance.onstart = () => setSpeaking(true)
    utterance.onend = () => setSpeaking(false)
    utterance.onerror = () => setSpeaking(false)
    
    window.speechSynthesis.speak(utterance)
  }, [supported])
  
  const speakLetter = useCallback((letter: string) => {
    speak(letter, 0.6)
  }, [speak])
  
  const speakSyllable = useCallback((syllable: string) => {
    speak(syllable, 0.7)
  }, [speak])
  
  const speakWord = useCallback((word: string) => {
    speak(word, 0.8)
  }, [speak])
  
  return {
    speakLetter,
    speakSyllable,
    speakWord,
    speaking,
    supported
  }
}

export default useSpeech
