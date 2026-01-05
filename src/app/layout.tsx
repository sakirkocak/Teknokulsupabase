import type { Metadata, Viewport } from 'next'
import Script from 'next/script'
import { Suspense } from 'react'
import GoogleAdsTracker from '@/components/GoogleAdsTracker'
import JsonLdSchema from '@/components/JsonLdSchema'
import { MotionProvider } from '@/components/MotionProvider'
import { LazyWidgets } from '@/components/LazyWidgets'
import './globals.css'

const baseUrl = 'https://www.teknokul.com.tr'

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: 'Teknokul - Eğitimin Dijital Üssü | AI Destekli Soru Bankası',
    template: '%s | Teknokul',
  },
  description: 'Öğren. Yarış. Kazan! AI destekli soru bankası, liderlik yarışı, kişisel eğitim koçluğu ve gelişim takibi platformu. 1-12. sınıf MEB müfredatına uygun 10.000+ soru.',
  keywords: [
    'eğitim',
    'soru bankası',
    'online soru çöz',
    'LGS',
    'LGS hazırlık',
    'LGS soruları',
    'LGS puan hesaplama',
    'YKS',
    'YKS hazırlık',
    'YKS puan hesaplama',
    'TYT',
    'AYT',
    'koçluk',
    'eğitim koçu',
    'öğrenme',
    'yapay zeka eğitim',
    'AI soru çözümü',
    'liderlik yarışı',
    'matematik soruları',
    'türkçe soruları',
    'fen bilimleri soruları',
    'verimli ders çalışma',
    'pomodoro tekniği',
    '8. sınıf',
    '12. sınıf',
    'MEB müfredat',
  ],
  authors: [{ name: 'Teknokul', url: baseUrl }],
  creator: 'Teknokul',
  publisher: 'Teknokul',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  verification: {
    google: 'WzuPyvuTXOhcUAQKmvXXqJMOa3WIWXF5MIMmDruO7zs',
  },
  other: {
    'google-adsense-account': 'ca-pub-2370010010396512',
  },
  alternates: {
    canonical: baseUrl,
    languages: {
      'tr-TR': baseUrl,
    },
  },
  openGraph: {
    title: 'Teknokul - Eğitimin Dijital Üssü',
    description: 'Öğren. Yarış. Kazan! AI destekli soru bankası, liderlik yarışı ve eğitim koçluğu platformu. 10.000+ soru ile sınavlara hazırlan!',
    siteName: 'Teknokul',
    locale: 'tr_TR',
    type: 'website',
    url: baseUrl,
    images: [
      {
        url: '/images/logo.png',
        width: 512,
        height: 512,
        alt: 'Teknokul Logo',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Teknokul - Eğitimin Dijital Üssü',
    description: 'Öğren. Yarış. Kazan! AI destekli soru bankası ve liderlik yarışı platformu.',
    images: ['/images/logo.png'],
    creator: '@teknokul',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  // Next.js App Router: src/app/icon.png ve apple-icon.png otomatik tanınır
  icons: {
    icon: [
      { url: '/icon.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  category: 'education',
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0f172a' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="tr">
      <head>
        {/* 🚀 Preconnect - Erken bağlantı kurarak LCP'yi iyileştir */}
        <link rel="preconnect" href="https://kc8bx4n1ldm30q6fp-1.a1.typesense.net" />
        <link rel="preconnect" href="https://cnawnprwdcfmyswqolsu.supabase.co" />
        <link rel="dns-prefetch" href="https://kc8bx4n1ldm30q6fp-1.a1.typesense.net" />
        <link rel="dns-prefetch" href="https://cnawnprwdcfmyswqolsu.supabase.co" />
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
        <link rel="dns-prefetch" href="https://pagead2.googlesyndication.com" />
      </head>
      <body className="font-sans">
        {/* JSON-LD Structured Data */}
        <JsonLdSchema />
        
        {/* Google Analytics + Ads Tag (gtag.js) */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-C6HMDXCKK8"
          strategy="afterInteractive"
        />
        <Script id="google-tags" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            
            gtag('config', 'G-C6HMDXCKK8');
            gtag('config', 'AW-17821953417');
          `}
        </Script>
        
        {/* Google AdSense - lazyOnload ile yükle (LCP iyileştirmesi) */}
        <Script
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-2370010010396512"
          strategy="lazyOnload"
          crossOrigin="anonymous"
        />
        
        {/* Google Ads Dönüşüm İzleme */}
        <Suspense fallback={null}>
          <GoogleAdsTracker />
        </Suspense>
        
        {/* Framer Motion Performans Optimizasyonu */}
        <MotionProvider>
          {children}
        </MotionProvider>
        
        {/* Lazy yüklenen widget'lar - sayfa yüklendikten sonra */}
        <LazyWidgets />
      </body>
    </html>
  )
}
