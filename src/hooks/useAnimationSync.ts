'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import gsap from 'gsap'

interface AnimationSyncOptions {
  duration: number  // Animasyon süresi (saniye)
  onProgress?: (progress: number) => void
  onComplete?: () => void
  autoPlay?: boolean
}

/**
 * GSAP Timeline ile TTS/Animasyon senkronizasyonu
 * 
 * Kullanım:
 * const { progress, play, pause, seek } = useAnimationSync({ duration: 10 })
 */
export function useAnimationSync(options: AnimationSyncOptions) {
  const { duration, onProgress, onComplete, autoPlay = false } = options
  
  const timelineRef = useRef<gsap.core.Timeline | null>(null)
  const [progress, setProgress] = useState(0)
  const [isPlaying, setIsPlaying] = useState(autoPlay)
  
  // Timeline oluştur
  useEffect(() => {
    const tl = gsap.timeline({
      paused: !autoPlay,
      onUpdate: () => {
        const prog = tl.progress()
        setProgress(prog)
        onProgress?.(prog)
      },
      onComplete: () => {
        setIsPlaying(false)
        onComplete?.()
      }
    })
    
    // Boş tween - sadece zamanlama için
    tl.to({}, { duration })
    
    timelineRef.current = tl
    
    return () => {
      tl.kill()
    }
  }, [duration, autoPlay])
  
  const play = useCallback(() => {
    timelineRef.current?.play()
    setIsPlaying(true)
  }, [])
  
  const pause = useCallback(() => {
    timelineRef.current?.pause()
    setIsPlaying(false)
  }, [])
  
  const toggle = useCallback(() => {
    if (isPlaying) {
      pause()
    } else {
      play()
    }
  }, [isPlaying, play, pause])
  
  const seek = useCallback((time: number) => {
    timelineRef.current?.seek(time)
    setProgress(time / duration)
  }, [duration])
  
  const seekProgress = useCallback((prog: number) => {
    const time = prog * duration
    timelineRef.current?.seek(time)
    setProgress(prog)
  }, [duration])
  
  const restart = useCallback(() => {
    timelineRef.current?.restart()
    setIsPlaying(true)
  }, [])
  
  return {
    progress,      // 0-1 arası ilerleme
    isPlaying,
    play,
    pause,
    toggle,
    seek,          // Belirli saniyeye git
    seekProgress,  // 0-1 arası progress'e git
    restart,
    timeline: timelineRef.current
  }
}

/**
 * TTS ile senkronize animasyon kontrolü
 * TTS çalarken animasyon da ilerler
 */
export function useTTSAnimationSync() {
  const [currentTime, setCurrentTime] = useState(0)
  const [totalDuration, setTotalDuration] = useState(0)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const animationRef = useRef<{ progress: number; setProgress: (p: number) => void } | null>(null)
  
  // Audio time update'i dinle
  const handleTimeUpdate = useCallback(() => {
    if (audioRef.current) {
      const current = audioRef.current.currentTime
      const total = audioRef.current.duration || 1
      setCurrentTime(current)
      setTotalDuration(total)
      
      // Animasyonu senkronize et
      if (animationRef.current) {
        animationRef.current.setProgress(current / total)
      }
    }
  }, [])
  
  const attachAudio = useCallback((audio: HTMLAudioElement) => {
    audioRef.current = audio
    audio.addEventListener('timeupdate', handleTimeUpdate)
    audio.addEventListener('loadedmetadata', () => {
      setTotalDuration(audio.duration)
    })
    
    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate)
    }
  }, [handleTimeUpdate])
  
  const attachAnimation = useCallback((animation: { progress: number; setProgress: (p: number) => void }) => {
    animationRef.current = animation
  }, [])
  
  return {
    currentTime,
    totalDuration,
    progress: totalDuration > 0 ? currentTime / totalDuration : 0,
    attachAudio,
    attachAnimation
  }
}

/**
 * Adım bazlı animasyon kontrolü
 * Her adım için ayrı timeline yönetir
 */
export function useStepAnimation(totalSteps: number) {
  const [currentStep, setCurrentStep] = useState(0)
  const [stepProgress, setStepProgress] = useState(0)
  const stepsRef = useRef<gsap.core.Timeline[]>([])
  
  // Her adım için timeline oluştur
  const createStepTimeline = useCallback((stepIndex: number, duration: number, onUpdate?: (progress: number) => void) => {
    const tl = gsap.timeline({
      paused: true,
      onUpdate: () => {
        const prog = tl.progress()
        setStepProgress(prog)
        onUpdate?.(prog)
      },
      onComplete: () => {
        // Sonraki adıma geç
        if (stepIndex < totalSteps - 1) {
          setCurrentStep(stepIndex + 1)
        }
      }
    })
    
    tl.to({}, { duration })
    stepsRef.current[stepIndex] = tl
    
    return tl
  }, [totalSteps])
  
  const playStep = useCallback((stepIndex: number) => {
    // Önceki step'leri durdur
    stepsRef.current.forEach((tl, i) => {
      if (i !== stepIndex && tl) {
        tl.pause()
      }
    })
    
    // Bu step'i oynat
    if (stepsRef.current[stepIndex]) {
      stepsRef.current[stepIndex].restart()
    }
    
    setCurrentStep(stepIndex)
  }, [])
  
  const pauseCurrentStep = useCallback(() => {
    if (stepsRef.current[currentStep]) {
      stepsRef.current[currentStep].pause()
    }
  }, [currentStep])
  
  const cleanup = useCallback(() => {
    stepsRef.current.forEach(tl => tl?.kill())
    stepsRef.current = []
  }, [])
  
  useEffect(() => {
    return cleanup
  }, [cleanup])
  
  return {
    currentStep,
    stepProgress,
    createStepTimeline,
    playStep,
    pauseCurrentStep,
    cleanup
  }
}
