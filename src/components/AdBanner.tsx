'use client'

import { useEffect } from 'react'
import Script from 'next/script'

interface AdBannerProps {
  className?: string
}

export default function AdBanner({ className = '' }: AdBannerProps) {
  return (
    <div className={`w-full flex justify-center py-4 ${className}`}>
      <Script
        async
        data-cfasync="false"
        src="https://pl28395352.effectivegatecpm.com/6d8f5a5c42429fc5759f1edad0595362/invoke.js"
        strategy="lazyOnload"
      />
      <div id="container-6d8f5a5c42429fc5759f1edad0595362"></div>
    </div>
  )
}
