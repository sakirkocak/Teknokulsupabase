import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Sonuçlar | Robot Şenliği',
  description: 'Hasandağı Ortaokulu İnsansı Robot Şenliği sonuçları ve kategori birincileri',
}

export default function SonuclarLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
