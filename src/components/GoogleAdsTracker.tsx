'use client'

import { useEffect } from 'react'
import { useSearchParams, usePathname } from 'next/navigation'
import { trackGoogleSignup, trackLogin, pageview } from '@/lib/gtag'

/**
 * Google Ads dönüşüm izleme bileşeni
 * Layout'a eklenir ve URL parametrelerini kontrol ederek dönüşümleri izler
 */
export default function GoogleAdsTracker() {
  const searchParams = useSearchParams()
  const pathname = usePathname()

  // Sayfa görüntüleme izleme
  useEffect(() => {
    pageview(pathname)
  }, [pathname])

  // Google kayıt/giriş izleme
  useEffect(() => {
    const googleSignup = searchParams.get('google_signup')
    const googleLogin = searchParams.get('google_login')

    if (googleSignup) {
      // Google ile kayıt dönüşümü
      trackGoogleSignup(googleSignup as 'ogrenci' | 'ogretmen' | 'veli')
      console.log('📊 Google kayıt izlendi:', googleSignup)
      
      // URL'den parametreyi temizle (history'yi bozmadan)
      const url = new URL(window.location.href)
      url.searchParams.delete('google_signup')
      window.history.replaceState({}, '', url.toString())
    }

    if (googleLogin === 'true') {
      // Google ile giriş dönüşümü
      trackLogin('google')
      console.log('📊 Google giriş izlendi')
      
      // URL'den parametreyi temizle
      const url = new URL(window.location.href)
      url.searchParams.delete('google_login')
      window.history.replaceState({}, '', url.toString())
    }
  }, [searchParams])

  // Bu component görsel bir şey render etmez
  return null
}

