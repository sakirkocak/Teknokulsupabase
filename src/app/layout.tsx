import type { Metadata, Viewport } from 'next'
import Script from 'next/script'
import { Suspense } from 'react'
import GoogleAdsTracker from '@/components/GoogleAdsTracker'
import JsonLdSchema from '@/components/JsonLdSchema'
import FeedbackWidget from '@/components/FeedbackWidget'
import { TeknoTeacherChat } from '@/components/TeknoTeacher'
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
  icons: {
    icon: [
      { url: '/images/favicon.ico' },
      { url: '/images/logo.png', type: 'image/png' },
    ],
    apple: [
      { url: '/images/logo.png' },
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
        {/* Google AdSense */}
        <script 
          async 
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6104136038653545"
          crossOrigin="anonymous"
        />
        {/* Ezoic CMP (Consent Management Platform) - GDPR/KVKK uyumluluğu */}
        <script data-cfasync="false" src="https://cmp.gatekeeperconsent.com/min.js" />
        <script data-cfasync="false" src="https://the.gatekeeperconsent.com/cmp.min.js" />
      </head>
      <body className="font-sans">
        {/* JSON-LD Structured Data */}
        <JsonLdSchema />
        
        {/* Ezoic Reklam Ağı */}
        <Script
          src="//www.ezojs.com/ezoic/sa.min.js"
          strategy="afterInteractive"
        />
        <Script id="ezoic-init" strategy="afterInteractive">
          {`
            window.ezstandalone = window.ezstandalone || {};
            ezstandalone.cmd = ezstandalone.cmd || [];
          `}
        </Script>
        
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
        
        {/* Google AdSense */}
        <Script
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-2370010010396512"
          strategy="afterInteractive"
          crossOrigin="anonymous"
        />
        
        {/* Google Ads Dönüşüm İzleme */}
        <Suspense fallback={null}>
          <GoogleAdsTracker />
        </Suspense>
        
        {children}
        
        {/* Geri Bildirim Widget */}
        <FeedbackWidget />
        
        {/* TeknoÖğretmen AI Asistan */}
        <TeknoTeacherChat />
      </body>
    </html>
  )
}
