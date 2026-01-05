'use client'

import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'

// Lazy load - sayfa yüklendikten 3 saniye sonra yükle
const FeedbackWidget = dynamic(() => import('./FeedbackWidget'), {
  ssr: false,
  loading: () => null
})

const TeknoTeacherChat = dynamic(
  () => import('./TeknoTeacher').then(mod => ({ default: mod.TeknoTeacherChat })),
  {
    ssr: false,
    loading: () => null
  }
)

/**
 * Lazy yüklenen widget'lar
 * Sayfa yüklendikten sonra (idle time'da) yüklenir
 * Bu LCP ve FCP'yi iyileştirir
 */
export function LazyWidgets() {
  const [shouldLoad, setShouldLoad] = useState(false)
  
  useEffect(() => {
    // requestIdleCallback ile sayfa idle olduğunda yükle
    // Fallback: 2 saniye sonra yükle
    if ('requestIdleCallback' in window) {
      const id = (window as any).requestIdleCallback(() => {
        setShouldLoad(true)
      }, { timeout: 3000 })
      
      return () => (window as any).cancelIdleCallback(id)
    } else {
      const timer = setTimeout(() => setShouldLoad(true), 2000)
      return () => clearTimeout(timer)
    }
  }, [])
  
  if (!shouldLoad) return null
  
  return (
    <>
      <FeedbackWidget />
      <TeknoTeacherChat />
    </>
  )
}
