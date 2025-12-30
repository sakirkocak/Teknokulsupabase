'use client'

import { useSearchParams } from 'next/navigation'
import { Shield, Mail, AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import { Suspense } from 'react'

function SuspendedContent() {
  const searchParams = useSearchParams()
  const reason = searchParams.get('reason') || 'Hesabınız güvenlik nedeniyle askıya alındı.'

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Shield className="w-10 h-10 text-red-600" />
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Hesabınız Askıya Alındı
        </h1>
        
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700 text-left">
              {reason}
            </p>
          </div>
        </div>
        
        <p className="text-gray-600 mb-6">
          Sistemimiz hesabınızda olağandışı bir aktivite tespit etti. 
          Bu bir hata olduğunu düşünüyorsanız, lütfen bizimle iletişime geçin.
        </p>
        
        <div className="space-y-3">
          <a
            href="mailto:destek@teknokul.com.tr?subject=Hesap%20Askıya%20Alma%20İtirazı"
            className="flex items-center justify-center gap-2 w-full py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors"
          >
            <Mail className="w-5 h-5" />
            İtiraz Et
          </a>
          
          <Link
            href="/"
            className="block w-full py-3 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
          >
            Ana Sayfaya Dön
          </Link>
        </div>
        
        <p className="mt-6 text-xs text-gray-400">
          Güvenlik sistemimiz, tüm kullanıcılarımızın adil bir ortamda 
          yarışabilmesi için otomatik kontroller yapmaktadır.
        </p>
      </div>
    </div>
  )
}

export default function SuspendedPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    }>
      <SuspendedContent />
    </Suspense>
  )
}
