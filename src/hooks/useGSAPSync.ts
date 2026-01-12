/**
 * 🎬 useGSAPSync - Ses-Görsel Senkronizasyon Hook
 * 
 * GSAP timeline ile TTS timestamp senkronizasyonu
 * Jarvis konuşurken ekranda vurgulama ve animasyon
 */

'use client'

import { useRef, useCallback, useEffect } from 'react'
import gsap from 'gsap'

interface WordTimestamp {
  word: string
  start: number // saniye
  end: number
}

interface AnimationTarget {
  selector: string
  animation: 'highlight' | 'pulse' | 'glow' | 'scale' | 'shake' | 'bounce'
  duration?: number
  color?: string
}

interface SyncConfig {
  wordTimestamps?: WordTimestamp[]
  onWordSpoken?: (word: string, index: number) => void
  onSentenceComplete?: (sentence: string) => void
  highlightDuration?: number
}

export function useGSAPSync(config: SyncConfig = {}) {
  const {
    wordTimestamps = [],
    onWordSpoken,
    onSentenceComplete,
    highlightDuration = 0.3
  } = config

  const timelineRef = useRef<gsap.core.Timeline | null>(null)
  const currentWordIndexRef = useRef(0)
  const audioTimeRef = useRef(0)

  // Timeline oluştur
  const createTimeline = useCallback(() => {
    if (timelineRef.current) {
      timelineRef.current.kill()
    }
    timelineRef.current = gsap.timeline({ paused: true })
    return timelineRef.current
  }, [])

  // Element vurgula
  const highlightElement = useCallback((
    selector: string,
    options: {
      color?: string
      scale?: number
      duration?: number
      type?: 'glow' | 'pulse' | 'shake' | 'bounce'
    } = {}
  ) => {
    const {
      color = '#00ffff',
      scale = 1.1,
      duration = highlightDuration,
      type = 'glow'
    } = options

    const element = document.querySelector(selector)
    if (!element) return

    const tl = gsap.timeline()

    switch (type) {
      case 'glow':
        tl.to(selector, {
          boxShadow: `0 0 20px ${color}, 0 0 40px ${color}`,
          borderColor: color,
          duration: duration / 2,
          ease: 'power2.out'
        }).to(selector, {
          boxShadow: 'none',
          borderColor: 'transparent',
          duration: duration / 2,
          ease: 'power2.in'
        })
        break

      case 'pulse':
        tl.to(selector, {
          scale,
          duration: duration / 2,
          ease: 'power2.out'
        }).to(selector, {
          scale: 1,
          duration: duration / 2,
          ease: 'power2.in'
        })
        break

      case 'shake':
        tl.to(selector, {
          x: -5,
          duration: 0.05
        }).to(selector, {
          x: 5,
          duration: 0.05,
          repeat: 3,
          yoyo: true
        }).to(selector, {
          x: 0,
          duration: 0.05
        })
        break

      case 'bounce':
        tl.to(selector, {
          y: -10,
          duration: duration / 2,
          ease: 'power2.out'
        }).to(selector, {
          y: 0,
          duration: duration / 2,
          ease: 'bounce.out'
        })
        break
    }

    return tl
  }, [highlightDuration])

  // Kelime senkronizasyonu
  const syncWithAudio = useCallback((currentTime: number) => {
    audioTimeRef.current = currentTime

    // Hangi kelimede olduğumuzu bul
    for (let i = currentWordIndexRef.current; i < wordTimestamps.length; i++) {
      const { word, start, end } = wordTimestamps[i]

      if (currentTime >= start && currentTime < end) {
        if (i !== currentWordIndexRef.current) {
          currentWordIndexRef.current = i
          onWordSpoken?.(word, i)
        }
        break
      }
    }
  }, [wordTimestamps, onWordSpoken])

  // Animasyon hedefleri ekle
  const addAnimationTargets = useCallback((
    targets: AnimationTarget[],
    timestamps: WordTimestamp[]
  ) => {
    const tl = createTimeline()

    targets.forEach((target, index) => {
      const timestamp = timestamps[index]
      if (!timestamp) return

      const startTime = timestamp.start

      switch (target.animation) {
        case 'highlight':
          tl.to(target.selector, {
            backgroundColor: target.color || 'rgba(0, 255, 255, 0.2)',
            duration: target.duration || 0.2
          }, startTime)
          tl.to(target.selector, {
            backgroundColor: 'transparent',
            duration: 0.2
          }, startTime + (target.duration || 0.2))
          break

        case 'pulse':
          tl.to(target.selector, {
            scale: 1.1,
            duration: (target.duration || 0.3) / 2,
            ease: 'power2.out'
          }, startTime)
          tl.to(target.selector, {
            scale: 1,
            duration: (target.duration || 0.3) / 2,
            ease: 'power2.in'
          }, startTime + (target.duration || 0.3) / 2)
          break

        case 'glow':
          tl.to(target.selector, {
            boxShadow: `0 0 20px ${target.color || '#00ffff'}`,
            duration: target.duration || 0.3
          }, startTime)
          tl.to(target.selector, {
            boxShadow: 'none',
            duration: 0.2
          }, startTime + (target.duration || 0.3))
          break

        case 'scale':
          tl.to(target.selector, {
            scale: 1.2,
            duration: target.duration || 0.3,
            ease: 'elastic.out(1, 0.5)'
          }, startTime)
          tl.to(target.selector, {
            scale: 1,
            duration: 0.2
          }, startTime + (target.duration || 0.3))
          break

        case 'shake':
          tl.to(target.selector, {
            x: -5,
            duration: 0.05
          }, startTime)
          for (let j = 0; j < 3; j++) {
            tl.to(target.selector, {
              x: j % 2 === 0 ? 5 : -5,
              duration: 0.05
            })
          }
          tl.to(target.selector, {
            x: 0,
            duration: 0.05
          })
          break

        case 'bounce':
          tl.to(target.selector, {
            y: -15,
            duration: (target.duration || 0.3) / 2,
            ease: 'power2.out'
          }, startTime)
          tl.to(target.selector, {
            y: 0,
            duration: (target.duration || 0.3) / 2,
            ease: 'bounce.out'
          })
          break
      }
    })

    return tl
  }, [createTimeline])

  // Timeline'ı başlat
  const play = useCallback(() => {
    if (timelineRef.current) {
      timelineRef.current.play()
    }
  }, [])

  // Timeline'ı durdur
  const pause = useCallback(() => {
    if (timelineRef.current) {
      timelineRef.current.pause()
    }
  }, [])

  // Timeline'ı sıfırla
  const reset = useCallback(() => {
    if (timelineRef.current) {
      timelineRef.current.seek(0)
      timelineRef.current.pause()
    }
    currentWordIndexRef.current = 0
    audioTimeRef.current = 0
  }, [])

  // Timeline'ı belirli zamana götür
  const seek = useCallback((time: number) => {
    if (timelineRef.current) {
      timelineRef.current.seek(time)
    }
    syncWithAudio(time)
  }, [syncWithAudio])

  // Cleanup
  useEffect(() => {
    return () => {
      if (timelineRef.current) {
        timelineRef.current.kill()
      }
    }
  }, [])

  // Metin içindeki kelimeleri işaretle
  const createHighlightableText = useCallback((
    text: string,
    containerSelector: string
  ) => {
    const words = text.split(/\s+/)
    const html = words.map((word, index) => 
      `<span class="gsap-word" data-word-index="${index}">${word}</span>`
    ).join(' ')

    const container = document.querySelector(containerSelector)
    if (container) {
      container.innerHTML = html
    }

    return words
  }, [])

  // Kelime animasyonu
  const animateWord = useCallback((index: number, animation: 'highlight' | 'pulse' = 'highlight') => {
    const selector = `.gsap-word[data-word-index="${index}"]`
    highlightElement(selector, { type: animation === 'highlight' ? 'glow' : 'pulse' })
  }, [highlightElement])

  return {
    timeline: timelineRef.current,
    createTimeline,
    highlightElement,
    syncWithAudio,
    addAnimationTargets,
    play,
    pause,
    reset,
    seek,
    createHighlightableText,
    animateWord,
    currentWordIndex: currentWordIndexRef.current,
    audioTime: audioTimeRef.current
  }
}

/**
 * Basit vurgulama utility
 */
export function highlightOnSpeak(
  element: HTMLElement | string,
  options: {
    color?: string
    duration?: number
    type?: 'border' | 'background' | 'shadow'
  } = {}
) {
  const { color = '#00ffff', duration = 0.5, type = 'shadow' } = options
  
  const el = typeof element === 'string' ? document.querySelector(element) : element
  if (!el) return

  const originalStyle = {
    boxShadow: (el as HTMLElement).style.boxShadow,
    backgroundColor: (el as HTMLElement).style.backgroundColor,
    borderColor: (el as HTMLElement).style.borderColor
  }

  gsap.to(el, {
    ...(type === 'shadow' && { boxShadow: `0 0 20px ${color}, 0 0 40px ${color}` }),
    ...(type === 'background' && { backgroundColor: `${color}33` }),
    ...(type === 'border' && { borderColor: color, borderWidth: 2 }),
    duration: duration / 2,
    ease: 'power2.out',
    onComplete: () => {
      gsap.to(el, {
        boxShadow: originalStyle.boxShadow || 'none',
        backgroundColor: originalStyle.backgroundColor || 'transparent',
        borderColor: originalStyle.borderColor || 'transparent',
        duration: duration / 2,
        ease: 'power2.in'
      })
    }
  })
}

export default useGSAPSync
