import Link from 'next/link'
import { Home, Search } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-surface-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <div className="text-8xl font-bold text-primary-500 mb-4">404</div>
        <h1 className="text-2xl font-bold text-surface-900 mb-2">Sayfa Bulunamadı</h1>
        <p className="text-surface-500 mb-8">
          Aradığınız sayfa mevcut değil veya taşınmış olabilir.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary-500 text-white font-medium rounded-xl hover:bg-primary-600 transition-colors"
          >
            <Home className="w-5 h-5" />
            Ana Sayfa
          </Link>
          <Link
            href="/koclar"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-surface-100 text-surface-700 font-medium rounded-xl hover:bg-surface-200 transition-colors"
          >
            <Search className="w-5 h-5" />
            Koçları Keşfet
          </Link>
        </div>
      </div>
    </div>
  )
}


