/**
 * Performans Optimizasyonları
 * INP (Interaction to Next Paint) iyileştirmeleri
 */

// Cihaz performansını tespit et
export function isLowEndDevice(): boolean {
  if (typeof window === 'undefined') return false
  
  // Mobil cihaz kontrolü
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  )
  
  // Düşük bellek kontrolü (4GB altı) - TypeScript için any kullan
  const nav = navigator as any
  const lowMemory = nav.deviceMemory ? nav.deviceMemory < 4 : false
  
  // Yavaş CPU kontrolü
  const slowCPU = navigator.hardwareConcurrency ? navigator.hardwareConcurrency < 4 : false
  
  // Bağlantı hızı kontrolü
  const connection = nav.connection
  const slowConnection = connection?.effectiveType === '2g' || connection?.effectiveType === 'slow-2g'
  
  return isMobile || lowMemory || slowCPU || slowConnection
}

// Kullanıcı reduced motion tercih ediyor mu?
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

// Animasyon ayarları - düşük performanslı cihazlarda basitleştirilmiş
export function getAnimationConfig() {
  const isLowEnd = isLowEndDevice()
  const reducedMotion = prefersReducedMotion()
  
  if (reducedMotion || isLowEnd) {
    return {
      // Animasyonları devre dışı bırak veya basitleştir
      duration: 0.1,
      ease: 'linear',
      staggerChildren: 0,
      delayChildren: 0,
      // Hover efektlerini kapat
      whileHover: {},
      whileTap: {},
      // Basit transition
      transition: { duration: 0.1 }
    }
  }
  
  return {
    duration: 0.3,
    ease: [0.25, 0.1, 0.25, 1],
    staggerChildren: 0.05,
    delayChildren: 0.1,
    whileHover: { scale: 1.02 },
    whileTap: { scale: 0.98 },
    transition: { duration: 0.3 }
  }
}

// Basitleştirilmiş animasyon variants
export const simpleVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 }
}

export const fadeInVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.2 }
  }
}

// Debounce fonksiyonu - INP için önemli
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null
  
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

// Throttle fonksiyonu - scroll/resize eventleri için
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}

// startTransition wrapper - heavy işlemleri ertelemek için
export function deferUpdate(callback: () => void): void {
  if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
    (window as any).requestIdleCallback(callback, { timeout: 100 })
  } else {
    setTimeout(callback, 0)
  }
}

// Intersection Observer hook için yardımcı
export function createIntersectionObserver(
  callback: IntersectionObserverCallback,
  options?: IntersectionObserverInit
): IntersectionObserver | null {
  if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
    return null
  }
  
  return new IntersectionObserver(callback, {
    rootMargin: '50px',
    threshold: 0.1,
    ...options
  })
}
