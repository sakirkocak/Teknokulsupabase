import type { Metadata } from 'next'
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
      <body className="font-sans">
        {children}
      </body>
    </html>
  )
}

