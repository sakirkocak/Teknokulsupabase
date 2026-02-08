import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Deneme Dunyasi - Teknokul',
  description: 'Bursluluk, LGS ve YKS deneme sinavlari. Gercek sinav formatinda pratik yap, puanini ogren, eksiklerini kesfet.',
  openGraph: {
    title: 'Deneme Dunyasi - Teknokul',
    description: 'Bursluluk, LGS ve YKS deneme sinavlari. Gercek sinav formatinda pratik yap.',
    type: 'website',
  },
}

export default function DenemeDunyasiLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
