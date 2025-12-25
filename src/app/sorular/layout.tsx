import { Metadata } from 'next'

export const metadata: Metadata = {
  title: {
    template: '%s | Teknokul Soru Bankası',
    default: 'Soru Bankası - Teknokul',
  },
  description: 'MEB müfredatına uygun binlerce soru ile pratik yap. Matematik, Türkçe, Fen Bilimleri ve daha fazlası.',
  openGraph: {
    type: 'website',
    locale: 'tr_TR',
    siteName: 'Teknokul',
  },
}

export default function SorularLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50">
      {children}
    </div>
  )
}

