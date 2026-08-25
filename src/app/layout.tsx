import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import JsonLdSchema from '@/components/JsonLdSchema'
import { MotionProvider } from '@/components/MotionProvider'
import { LazyWidgets } from '@/components/LazyWidgets'
import './globals.css'
import { SITE_URL } from '@/lib/site'

const baseUrl = SITE_URL

const inter = Inter({
  subsets: ['latin', 'latin-ext'],
  display: 'swap',
  weight: ['300', '400', '500', '600', '700', '800'],
})

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
      </head>
      <body className={`${inter.className} font-sans`}>
        {/* JSON-LD Structured Data */}
        <JsonLdSchema />
        
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
