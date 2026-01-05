'use client'

import { MotionConfig } from 'framer-motion'
import { useEffect, useState } from 'react'

/**
 * Global Framer Motion ayarları
 * INP optimizasyonu için animasyonları cihaza göre ayarlar
 */
export function MotionProvider({ children }: { children: React.ReactNode }) {
  const [reducedMotion, setReducedMotion] = useState(false)
  
  useEffect(() => {
    // Kullanıcı reduced motion tercih ediyor mu?
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReducedMotion(mediaQuery.matches)
    
    // Değişiklikleri dinle
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches)
    mediaQuery.addEventListener('change', handler)
    
    return () => mediaQuery.removeEventListener('change', handler)
  }, [])
  
  return (
    <MotionConfig
      reducedMotion={reducedMotion ? 'always' : 'never'}
      transition={{
        // Daha hızlı default transition - INP için önemli
        type: 'tween',
        duration: 0.2,
        ease: 'easeOut'
      }}
    >
      {children}
    </MotionConfig>
  )
}
