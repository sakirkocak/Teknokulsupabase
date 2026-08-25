import type { Metadata } from 'next'
import { SITE_URL } from '@/lib/site'

export const metadata: Metadata = {
  title: 'Eğitim Rehberleri | Verimli Çalışma Teknikleri',
  description: 'LGS ve YKS hazırlık rehberleri, verimli ders çalışma teknikleri, pomodoro yöntemi, sınav kaygısı yönetimi ve motivasyon ipuçları. Ücretsiz eğitim rehberleri.',
  keywords: [
    'ders çalışma teknikleri',
    'verimli çalışma',
    'pomodoro tekniği',
    'LGS hazırlık',
    'YKS hazırlık',
    'sınav kaygısı',
    'motivasyon',
    'çalışma programı',
    'öğrenme teknikleri',
    'feynman tekniği',
    'aktif tekrar',
    'eğitim rehberi',
  ],
  alternates: {
    canonical: `${SITE_URL}/rehberler`,
  },
  openGraph: {
    title: 'Eğitim Rehberleri | Teknokul',
    description: 'Verimli ders çalışma teknikleri, sınav hazırlık rehberleri ve motivasyon ipuçları. Ücretsiz eğitim içerikleri.',
    url: `${SITE_URL}/rehberler`,
    type: 'website',
  },
}

export default function RehberlerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}

