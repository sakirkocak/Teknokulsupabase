import type { Metadata } from 'next'
import { SITE_URL } from '@/lib/site'

export const metadata: Metadata = {
  title: 'LGS Puan Hesaplama 2025 | Anlık Net ve Yüzdelik Hesaplama',
  description: '2025 LGS puan hesaplama aracı. Türkçe, Matematik, Fen Bilimleri, Sosyal Bilgiler, Din Kültürü ve İngilizce netlerinizi girin, tahmini puanınızı ve yüzdelik diliminizi anında öğrenin.',
  keywords: [
    'LGS puan hesaplama',
    'LGS puan hesaplama 2025',
    'LGS net hesaplama',
    'LGS yüzdelik dilim hesaplama',
    'LGS puan hesaplama aracı',
    'LGS hesaplama',
    '8. sınıf puan hesaplama',
    'LGS matematik net hesaplama',
    'LGS Türkçe net hesaplama',
    'LGS sınav puanı',
    'liseye geçiş sınavı puan hesaplama',
  ],
  alternates: {
    canonical: `${SITE_URL}/lgs-puan-hesaplama`,
  },
  openGraph: {
    title: 'LGS Puan Hesaplama 2025 | Teknokul',
    description: 'Netlerinizi girin, LGS puanınızı ve yüzdelik diliminizi anında öğrenin. Ücretsiz ve güncel katsayılarla hesaplama.',
    url: `${SITE_URL}/lgs-puan-hesaplama`,
    type: 'website',
    images: [
      {
        url: '/images/logo.png',
        width: 512,
        height: 512,
        alt: 'LGS Puan Hesaplama - Teknokul',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'LGS Puan Hesaplama 2025 | Teknokul',
    description: 'Netlerinizi girin, LGS puanınızı ve yüzdelik diliminizi anında öğrenin.',
  },
}

export default function LGSPuanHesaplamaLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}

