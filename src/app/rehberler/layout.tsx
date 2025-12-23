import type { Metadata } from 'next'

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
    canonical: 'https://www.teknokul.com.tr/rehberler',
  },
  openGraph: {
    title: 'Eğitim Rehberleri | Teknokul',
    description: 'Verimli ders çalışma teknikleri, sınav hazırlık rehberleri ve motivasyon ipuçları. Ücretsiz eğitim içerikleri.',
    url: 'https://www.teknokul.com.tr/rehberler',
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

