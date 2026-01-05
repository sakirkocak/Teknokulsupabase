'use client'

import { MotionConfig } from 'framer-motion'
import { useEffect, useState } from 'react'

/**
 * Global Framer Motion ayarları
 * Mobilde animasyonları KAPAT - performans için kritik
 */
export function MotionProvider({ children }: { children: React.ReactNode }) {
  const [shouldReduceMotion, setShouldReduceMotion] = useState(true) // Default: animasyonlar kapalı
  
  useEffect(() => {
    // Mobil cihaz mı kontrol et (touch ekran)
    const isMobile = window.matchMedia('(hover: none) and (pointer: coarse)').matches
    
    // Kullanıcı reduced motion tercih ediyor mu?
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    
    // Düşük performanslı cihaz mı? (4 core altı veya 4GB altı RAM)
    const isLowEnd = navigator.hardwareConcurrency < 4 || 
                     (navigator as any).deviceMemory < 4
    
    // Mobil, reduced motion tercihi veya düşük performanslı cihazda animasyonları kapat
    setShouldReduceMotion(isMobile || prefersReducedMotion || isLowEnd)
  }, [])
  
  return (
    <MotionConfig
      reducedMotion={shouldReduceMotion ? 'always' : 'never'}
      transition={{
        // Çok hızlı geçişler
        type: 'tween',
        duration: shouldReduceMotion ? 0 : 0.15,
        ease: 'linear'
      }}
    >
      {children}
    </MotionConfig>
  )
}
