import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'YKS Puan Hesaplama 2025 | TYT-AYT Net Hesaplama',
  description: '2025 YKS puan hesaplama aracı. TYT ve AYT netlerinizi girin, Sayısal, Sözel, Eşit Ağırlık veya Dil puan türüne göre tahmini puanınızı ve sıralamanızı öğrenin.',
  keywords: [
    'YKS puan hesaplama',
    'YKS puan hesaplama 2025',
    'TYT puan hesaplama',
    'AYT puan hesaplama',
    'YKS net hesaplama',
    'üniversite puan hesaplama',
    'sayısal puan hesaplama',
    'sözel puan hesaplama',
    'eşit ağırlık puan hesaplama',
    'YKS sıralama hesaplama',
    'TYT AYT hesaplama',
    'diploma notu katkısı',
  ],
  alternates: {
    canonical: 'https://www.teknokul.com.tr/yks-puan-hesaplama',
  },
  openGraph: {
    title: 'YKS Puan Hesaplama 2025 | Teknokul',
    description: 'TYT ve AYT netlerinizi girin, YKS puanınızı ve sıralamanızı anında öğrenin. Ücretsiz ve güncel katsayılarla hesaplama.',
    url: 'https://www.teknokul.com.tr/yks-puan-hesaplama',
    type: 'website',
    images: [
      {
        url: '/images/logo.png',
        width: 512,
        height: 512,
        alt: 'YKS Puan Hesaplama - Teknokul',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'YKS Puan Hesaplama 2025 | Teknokul',
    description: 'TYT ve AYT netlerinizi girin, YKS puanınızı ve sıralamanızı anında öğrenin.',
  },
}

export default function YKSPuanHesaplamaLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}

