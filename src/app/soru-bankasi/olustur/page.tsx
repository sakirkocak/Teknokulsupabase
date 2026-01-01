'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  BookOpen, 
  Sparkles, 
  Download, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  FileText,
  GraduationCap,
  Target,
  Lightbulb,
  ArrowRight
} from 'lucide-react'
import { ParsedRequest } from '@/lib/question-bank/types'
import Link from 'next/link'

// Örnek promptlar
const EXAMPLE_PROMPTS = [
  '8. sınıf matematik denklemler 50 soru',
  'LGS Türkçe paragraf kolay 100 tane',
  '9. sınıf fizik kuvvet ve hareket zor',
  'TYT matematik limit türev 30 soru',
  '7. sınıf fen bilimleri fotosentez',
  '6. sınıf İngilizce 25 soru karışık'
]

interface ParsedResult {
  parsed: ParsedRequest
  title: string
  metaDescription: string
}

export default function SoruBankasiOlusturPage() {
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isParsing, setIsParsing] = useState(false)
  const [parsedResult, setParsedResult] = useState<ParsedResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<{ slug: string; title: string } | null>(null)
  const [customTitle, setCustomTitle] = useState('')
  
  // Parse işlemi (input değiştikçe)
  const handleParse = useCallback(async (text: string) => {
    if (!text || text.length < 5) {
      setParsedResult(null)
      return
    }
    
    setIsParsing(true)
    setError(null)
    
    try {
      const response = await fetch('/api/question-bank/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: text })
      })
      
      const data = await response.json()
      
      if (data.success) {
        setParsedResult(data)
        setCustomTitle(data.title)
      } else {
        setParsedResult(null)
      }
    } catch (err) {
      console.error('Parse error:', err)
    } finally {
      setIsParsing(false)
    }
  }, [])
  
  // Debounced parse
  const handleInputChange = (value: string) => {
    setInput(value)
    setSuccess(null)
    setError(null)
    
    // 500ms debounce
    const timeoutId = setTimeout(() => handleParse(value), 500)
    return () => clearTimeout(timeoutId)
  }
  
  // Örnek prompt seç
  const selectExample = (example: string) => {
    setInput(example)
    setSuccess(null)
    setError(null)
    handleParse(example)
  }
  
  // Soru bankası oluştur
  const handleCreate = async () => {
    if (!input || !parsedResult) return
    
    setIsLoading(true)
    setError(null)
    setSuccess(null)
    
    try {
      const response = await fetch('/api/question-bank/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          input, 
          title: customTitle || parsedResult.title 
        })
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Bir hata oluştu')
      }
      
      // PDF olarak kaydet - iframe ile print dialog göster (URL çubuğunda blob görünmez)
      if (data.pdfHtml) {
        // Gizli iframe oluştur
        const iframe = document.createElement('iframe')
        iframe.style.position = 'fixed'
        iframe.style.right = '0'
        iframe.style.bottom = '0'
        iframe.style.width = '0'
        iframe.style.height = '0'
        iframe.style.border = 'none'
        document.body.appendChild(iframe)
        
        // HTML'i iframe'e yaz
        const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document
        if (iframeDoc) {
          iframeDoc.open()
          iframeDoc.write(data.pdfHtml)
          iframeDoc.close()
          
          // Print dialog aç
          setTimeout(() => {
            iframe.contentWindow?.print()
            // Temizle
            setTimeout(() => document.body.removeChild(iframe), 1000)
          }, 500)
        }
        
        // İndirme sayacını artır
        await fetch('/api/question-bank/download', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ bankId: data.bank.id })
        })
      }
      
      setSuccess({
        slug: data.bank.slug,
        title: data.bank.title
      })
      
    } catch (err: any) {
      setError(err.message || 'Bir hata oluştu')
    } finally {
      setIsLoading(false)
    }
  }
  
  // Zorluk adı
  const getDifficultyName = (diff?: string) => {
    const names: Record<string, string> = {
      easy: 'Kolay',
      medium: 'Orta',
      hard: 'Zor',
      mixed: 'Karışık'
    }
    return names[diff || 'mixed'] || 'Karışık'
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-indigo-900">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-100 dark:bg-indigo-900/50 rounded-full text-indigo-700 dark:text-indigo-300 text-sm mb-4">
            <Sparkles className="w-4 h-4" />
            Yapay Zeka Destekli
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-3">
            Soru Bankası Oluştur
          </h1>
          <p className="text-gray-600 dark:text-gray-400 max-w-xl mx-auto">
            İstediğin soru bankasını doğal dille tarif et, sistem otomatik oluşturup PDF olarak indir!
          </p>
        </motion.div>
        
        {/* Ana Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 md:p-8 mb-6"
        >
          {/* Input */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Ne tür bir soru bankası istiyorsun?
            </label>
            <div className="relative">
              <textarea
                value={input}
                onChange={(e) => handleInputChange(e.target.value)}
                placeholder="Örnek: 8. sınıf matematik denklemler 50 soru"
                className="w-full px-4 py-4 text-lg border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-800 dark:bg-gray-700 dark:text-white transition-all resize-none"
                rows={3}
                disabled={isLoading}
              />
              {isParsing && (
                <div className="absolute right-3 top-3">
                  <Loader2 className="w-5 h-5 text-indigo-500 animate-spin" />
                </div>
              )}
            </div>
          </div>
          
          {/* Örnek Promptlar */}
          <div className="mb-6">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2 flex items-center gap-1">
              <Lightbulb className="w-4 h-4" />
              Örnek istekler:
            </p>
            <div className="flex flex-wrap gap-2">
              {EXAMPLE_PROMPTS.map((example, i) => (
                <button
                  key={i}
                  onClick={() => selectExample(example)}
                  className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
                  disabled={isLoading}
                >
                  {example}
                </button>
              ))}
            </div>
          </div>
          
          {/* Parse Sonucu */}
          <AnimatePresence mode="wait">
            {parsedResult && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-6 p-4 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl"
              >
                <h3 className="text-sm font-medium text-indigo-800 dark:text-indigo-300 mb-3">
                  📊 Anlanan Kriterler
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {parsedResult.parsed.grade && (
                    <div className="flex items-center gap-2 text-sm">
                      <GraduationCap className="w-4 h-4 text-indigo-600" />
                      <span className="text-gray-700 dark:text-gray-300">
                        {parsedResult.parsed.exam_type || `${parsedResult.parsed.grade}. Sınıf`}
                      </span>
                    </div>
                  )}
                  {parsedResult.parsed.subject_name && (
                    <div className="flex items-center gap-2 text-sm">
                      <BookOpen className="w-4 h-4 text-indigo-600" />
                      <span className="text-gray-700 dark:text-gray-300">
                        {parsedResult.parsed.subject_name}
                      </span>
                    </div>
                  )}
                  {parsedResult.parsed.topic && (
                    <div className="flex items-center gap-2 text-sm">
                      <Target className="w-4 h-4 text-indigo-600" />
                      <span className="text-gray-700 dark:text-gray-300 truncate">
                        {parsedResult.parsed.topic}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm">
                    <FileText className="w-4 h-4 text-indigo-600" />
                    <span className="text-gray-700 dark:text-gray-300">
                      {parsedResult.parsed.question_count} Soru • {getDifficultyName(parsedResult.parsed.difficulty)}
                    </span>
                  </div>
                </div>
                
                {/* Başlık düzenleme */}
                <div className="mt-4 pt-4 border-t border-indigo-200 dark:border-indigo-700">
                  <label className="block text-sm font-medium text-indigo-800 dark:text-indigo-300 mb-2">
                    📝 Banka Adı
                  </label>
                  <input
                    type="text"
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-indigo-200 dark:border-indigo-700 rounded-lg dark:bg-gray-700 dark:text-white"
                    disabled={isLoading}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Hata */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl flex items-start gap-3"
              >
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Başarı */}
          <AnimatePresence>
            {success && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-6 p-4 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-xl"
              >
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-green-700 dark:text-green-300">
                      Soru bankası başarıyla oluşturuldu ve indirildi!
                    </p>
                    <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                      {success.title}
                    </p>
                    <Link 
                      href={`/soru-bankasi/${success.slug}`}
                      className="inline-flex items-center gap-1 text-sm text-green-600 dark:text-green-400 hover:underline mt-2"
                    >
                      Detayları gör <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Oluştur Butonu */}
          <button
            onClick={handleCreate}
            disabled={isLoading || !parsedResult || !input}
            className="w-full py-4 px-6 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                PDF Oluşturuluyor...
              </>
            ) : (
              <>
                <Download className="w-5 h-5" />
                PDF Oluştur ve İndir
              </>
            )}
          </button>
          
          <div className="text-center text-xs text-gray-500 dark:text-gray-400 mt-4 space-y-1">
            <p>✅ Oluşturulan bankalar otomatik olarak yayınlanır ve herkes erişebilir</p>
            <p className="text-indigo-500">💡 İpucu: PDF kaydederken "Üstbilgi ve Altbilgi" seçeneğini kapatın</p>
          </div>
        </motion.div>
        
        {/* Alt Linkler */}
        <div className="flex flex-wrap justify-center gap-4 text-sm">
          <Link 
            href="/soru-bankasi/kesif"
            className="text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
          >
            🔍 Soru Bankalarını Keşfet
          </Link>
          <Link 
            href="/soru-bankasi/benim"
            className="text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
          >
            📚 Benim Bankalarım
          </Link>
        </div>
      </div>
    </div>
  )
}
