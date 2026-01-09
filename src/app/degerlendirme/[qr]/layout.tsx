import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Robot Değerlendirme | Robot Şenliği',
  description: 'Hasandağı Ortaokulu İnsansı Robot Şenliği değerlendirme sayfası',
}

export default function DegerlendirmeLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
