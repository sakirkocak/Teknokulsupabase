'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="min-h-screen bg-surface-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="w-10 h-10 text-red-500" />
        </div>
        <h1 className="text-2xl font-bold text-surface-900 mb-2">Bir şeyler ters gitti</h1>
        <p className="text-surface-500 mb-8">
          Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={reset}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary-500 text-white font-medium rounded-xl hover:bg-primary-600 transition-colors"
          >
            <RefreshCw className="w-5 h-5" />
            Tekrar Dene
          </button>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-surface-100 text-surface-700 font-medium rounded-xl hover:bg-surface-200 transition-colors"
          >
            <Home className="w-5 h-5" />
            Ana Sayfa
          </Link>
        </div>
      </div>
    </div>
  )
}


