import type { Metadata } from 'next'
import Script from 'next/script'
import { Suspense } from 'react'
import GoogleAdsTracker from '@/components/GoogleAdsTracker'
import './globals.css'

export const metadata: Metadata = {
  title: 'Teknokul - Eğitimin Dijital Üssü',
  description: 'Öğren. Yarış. Kazan! AI destekli soru bankası, liderlik yarışı, kişisel eğitim koçluğu ve gelişim takibi platformu.',
  keywords: ['eğitim', 'soru bankası', 'LGS', 'YKS', 'koçluk', 'öğrenme', 'yapay zeka', 'liderlik', 'yarış'],
  authors: [{ name: 'Teknokul' }],
  openGraph: {
    title: 'Teknokul - Eğitimin Dijital Üssü',
    description: 'Öğren. Yarış. Kazan! AI destekli soru bankası ve liderlik yarışı platformu.',
    siteName: 'Teknokul',
    locale: 'tr_TR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Teknokul - Eğitimin Dijital Üssü',
    description: 'Öğren. Yarış. Kazan! AI destekli soru bankası ve liderlik yarışı platformu.',
  },
  icons: {
    icon: '/images/favicon.ico',
    apple: '/images/logo-icon.png',
  },
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
          src="https://www.googletagmanager.com/gtag/js?id=AW-17821953417"
          strategy="afterInteractive"
        />
        <Script id="google-ads" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            
            gtag('config', 'AW-17821953417');
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

