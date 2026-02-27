import Link from 'next/link'
import { Building2, BookOpen, CheckCircle, ArrowRight } from 'lucide-react'

export const metadata = {
  title: 'Kurumsal Giriş — Teknokul',
  robots: { index: false },
}

const features = [
  'AI destekli, doğrulanmış sorular',
  'Geometrik şekil ve diyagram görselleri',
  'TYT, AYT ve LGS uyumlu soru bankası',
  'Kredi sistemi ile esnek satın alma',
  'PDF çıktısı ile baskıya hazır format',
]

export default function KurumsalPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-surface-50 to-primary-50 flex items-center justify-center p-6">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center">
              <BookOpen className="w-7 h-7 text-white" />
            </div>
            <span className="text-2xl font-bold">
              Tekn<span className="text-primary-500">okul</span>
            </span>
          </Link>

          <h1 className="text-3xl font-bold text-surface-900 mb-2">
            Kurumsal Platform
          </h1>
          <p className="text-surface-500">
            Yayınevleri için özel soru bankası platformu
          </p>
        </div>

        {/* Ana Kart */}
        <div className="bg-white rounded-3xl border border-surface-100 shadow-sm p-8 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-primary-50 rounded-2xl flex items-center justify-center">
              <Building2 className="w-6 h-6 text-primary-600" />
            </div>
            <div>
              <h2 className="font-bold text-surface-900">Yayınevi Girişi</h2>
              <p className="text-sm text-surface-500">Kurumsal hesabınızla giriş yapın</p>
            </div>
          </div>

          <ul className="space-y-3 mb-8">
            {features.map(feature => (
              <li key={feature} className="flex items-center gap-3 text-sm text-surface-700">
                <CheckCircle className="w-4 h-4 text-primary-500 shrink-0" />
                {feature}
              </li>
            ))}
          </ul>

          <Link
            href="/giris?redirect=/yayinevi"
            className="flex items-center justify-center gap-2 w-full bg-primary-500 hover:bg-primary-600 text-white py-4 rounded-2xl font-semibold text-lg transition-colors"
          >
            Giriş Yap
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>

        <p className="text-center text-xs text-surface-400">
          Hesabınız yok mu?{' '}
          <a href="mailto:info@teknokul.com.tr" className="text-primary-500 hover:underline">
            info@teknokul.com.tr
          </a>{' '}
          adresinden iletişime geçin.
        </p>
      </div>
    </div>
  )
}
