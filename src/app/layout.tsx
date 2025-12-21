import type { Metadata } from 'next'
import Script from 'next/script'
import { Suspense } from 'react'
import GoogleAdsTracker from '@/components/GoogleAdsTracker'
import './globals.css'

export const metadata: Metadata = {
  title: 'Teknokul - Akıllı Eğitim Koçluğu Platformu',
  description: 'Öğrenciler için kişiselleştirilmiş eğitim koçluğu, AI destekli öğrenme araçları ve gelişim takibi.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="tr">
      <head>
        {/* Google Ads Tag (gtag.js) */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=AW-16918605673"
          strategy="afterInteractive"
        />
        <Script id="google-ads" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'AW-16918605673');
          `}
        </Script>
      </head>
      <body className="font-sans">
        <Suspense fallback={null}>
          <GoogleAdsTracker />
        </Suspense>
        {children}
      </body>
    </html>
  )
}

