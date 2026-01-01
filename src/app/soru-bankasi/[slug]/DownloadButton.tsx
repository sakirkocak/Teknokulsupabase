'use client'

import { useState } from 'react'
import { Download, Loader2 } from 'lucide-react'

interface BankProps {
  id: string
  title: string
  slug: string
  pdf_url?: string | null
  grade?: number | null
  subject_name?: string | null
  topics?: string[] | null
  question_count: number
}

interface DownloadButtonProps {
  bank: BankProps
}

export default function DownloadButton({ bank }: DownloadButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  
  const handleDownload = async () => {
    setIsLoading(true)
    
    try {
      // PDF URL varsa direkt aç
      if (bank.pdf_url) {
        // İndirme sayacını artır (async)
        fetch('/api/question-bank/download', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ bankId: bank.id })
        })
        
        // PDF'i yeni sekmede aç - kullanıcı kaydedebilir
        window.open(bank.pdf_url, '_blank')
        setIsLoading(false)
        return
      }
      
      // PDF URL yoksa - detay sayfasına yönlendir (PDF henüz oluşturulmamış olabilir)
      alert('PDF henüz hazırlanmamış. Lütfen daha sonra tekrar deneyin veya yeni bir soru bankası oluşturun.')
      setIsLoading(false)
    } catch (error) {
      console.error('Download error:', error)
      alert('İndirme sırasında bir hata oluştu. Lütfen tekrar deneyin.')
      setIsLoading(false)
    }
  }
  
  return (
    <button
      onClick={handleDownload}
      disabled={isLoading}
      className="w-full py-4 px-6 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
    >
      {isLoading ? (
        <>
          <Loader2 className="w-5 h-5 animate-spin" />
          PDF Hazırlanıyor...
        </>
      ) : (
        <>
          <Download className="w-5 h-5" />
          Ücretsiz İndir (PDF)
        </>
      )}
    </button>
  )
}
