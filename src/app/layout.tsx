import type { Metadata } from 'next'
import Script from 'next/script'
import './globals.css'

export const metadata: Metadata = {
  title: 'Teknokul - Akıllı Eğitim Koçluğu Platformu',
  description: 'Öğrenciler için kişiselleştirilmiş eğitim koçluğu, AI destekli öğrenme araçları ve gelişim takibi.',
  verification: {
    google: 'WzuPyvuTXOhcUAQKmvXXqJMOa3WIWXF5MIMmDruO7zs',
  },
  other: {
    'google-adsense-account': 'ca-pub-2370010010396512',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="tr">
      <body className="font-sans">
        {/* Google Analytics */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-C6HMDXCKK8"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-C6HMDXCKK8');
          `}
        </Script>
        {children}
      </body>
    </html>
  )
}

