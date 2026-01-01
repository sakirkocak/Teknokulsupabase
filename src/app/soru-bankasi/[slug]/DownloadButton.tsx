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
      // PDF URL varsa direkt indir
      if (bank.pdf_url) {
        // İndirme sayacını artır
        await fetch('/api/question-bank/download', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ bankId: bank.id })
        })
        
        // PDF'i indir
        const a = document.createElement('a')
        a.href = bank.pdf_url
        a.download = `${bank.slug}.pdf`
        a.target = '_blank'
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        
        setIsLoading(false)
        return
      }
      
      // PDF URL yoksa yeniden oluştur
      const response = await fetch('/api/question-bank/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          input: `${bank.grade ? bank.grade + '. sınıf' : ''} ${bank.subject_name || ''} ${bank.topics?.join(' ') || ''} ${bank.question_count} soru`.trim(),
          title: bank.title 
        })
      })
      
      const data = await response.json()
      
      if (data.pdfHtml) {
        // HTML'i yeni sekmede aç ve yazdır
        const blob = new Blob([data.pdfHtml], { type: 'text/html' })
        const blobUrl = URL.createObjectURL(blob)
        const printWindow = window.open(blobUrl, '_blank')
        
        if (printWindow) {
          printWindow.onload = () => {
            setTimeout(() => printWindow.print(), 300)
          }
        }
        
        setTimeout(() => URL.revokeObjectURL(blobUrl), 60000)
        
        // İndirme sayacını artır
        await fetch('/api/question-bank/download', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ bankId: bank.id })
        })
      }
    } catch (error) {
      console.error('Download error:', error)
      alert('İndirme sırasında bir hata oluştu. Lütfen tekrar deneyin.')
    } finally {
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
