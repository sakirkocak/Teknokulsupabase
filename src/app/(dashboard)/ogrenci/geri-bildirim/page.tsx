'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useProfile } from '@/hooks/useProfile'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  MessageSquare, 
  Send, 
  Bug, 
  Lightbulb, 
  Sparkles, 
  HelpCircle,
  CheckCircle,
  Loader2,
  Clock,
  AlertCircle,
  RefreshCw
} from 'lucide-react'

const CATEGORIES = [
  { id: 'bug', label: 'Hata Bildirimi', icon: Bug, color: 'bg-red-500', lightColor: 'bg-red-100 text-red-700' },
  { id: 'feature', label: 'Özellik İsteği', icon: Sparkles, color: 'bg-purple-500', lightColor: 'bg-purple-100 text-purple-700' },
  { id: 'suggestion', label: 'Öneri', icon: Lightbulb, color: 'bg-amber-500', lightColor: 'bg-amber-100 text-amber-700' },
  { id: 'other', label: 'Diğer', icon: HelpCircle, color: 'bg-blue-500', lightColor: 'bg-blue-100 text-blue-700' },
]

const STATUS_CONFIG = {
  new: { label: 'Yeni', color: 'bg-blue-100 text-blue-700', icon: Clock },
  in_progress: { label: 'İnceleniyor', color: 'bg-amber-100 text-amber-700', icon: Loader2 },
  resolved: { label: 'Çözüldü', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  closed: { label: 'Kapatıldı', color: 'bg-gray-100 text-gray-700', icon: AlertCircle },
}

interface Feedback {
  id: string
  category: string
  status: string
  message: string
  created_at: string
  admin_note: string | null
}

export default function StudentFeedbackPage() {
  const { profile } = useProfile()
  const supabase = createClient()
  
  const [selectedCategory, setSelectedCategory] = useState<string>('suggestion')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([])
  const [loadingFeedbacks, setLoadingFeedbacks] = useState(true)

  useEffect(() => {
    loadMyFeedbacks()
  }, [])

  const loadMyFeedbacks = async () => {
    setLoadingFeedbacks(true)
    try {
      const response = await fetch('/api/feedback?userOnly=true&limit=50')
      const data = await response.json()
      if (data.data) {
        setFeedbacks(data.data)
      }
    } catch (err) {
      console.error('Feedbackler yüklenemedi:', err)
    } finally {
      setLoadingFeedbacks(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: selectedCategory,
          message: message,
          page_url: window.location.href
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Bir hata oluştu')
      }

      setSuccess(true)
      setMessage('')
      loadMyFeedbacks()

      setTimeout(() => setSuccess(false), 3000)

    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const getCategoryData = (categoryId: string) => {
    return CATEGORIES.find(c => c.id === categoryId) || CATEGORIES[3]
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-3 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl shadow-lg">
          <MessageSquare className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Geri Bildirim</h1>
          <p className="text-gray-500 text-sm">Fikirlerini bizimle paylaş, platformu birlikte geliştirelim!</p>
        </div>
      </div>

      {/* Feedback Form */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100"
      >
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Yeni Geri Bildirim Gönder</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Kategori Seçimi */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Kategori</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {CATEGORIES.map(category => {
                const Icon = category.icon
                return (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => setSelectedCategory(category.id)}
                    className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                      selectedCategory === category.id
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-100 hover:border-gray-200'
                    }`}
                  >
                    <div className={`p-2 rounded-lg ${category.color} text-white`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-medium text-gray-700">{category.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Mesaj */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Mesajınız</label>
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all resize-none"
              placeholder="Düşüncelerinizi yazın... (En az 10 karakter)"
              rows={4}
              required
              minLength={10}
            />
          </div>

          {/* Error */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          {/* Success */}
          <AnimatePresence>
            {success && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="p-3 bg-green-50 border border-green-200 rounded-xl text-green-600 text-sm flex items-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                Geri bildiriminiz başarıyla gönderildi!
              </motion.div>
            )}
          </AnimatePresence>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || message.length < 10}
            className="w-full py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Gönderiliyor...
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                Gönder
              </>
            )}
          </button>
        </form>
      </motion.div>

      {/* My Feedbacks */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800">Gönderdiğim Geri Bildirimler</h2>
          <button
            onClick={loadMyFeedbacks}
            disabled={loadingFeedbacks}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <RefreshCw className={`w-4 h-4 text-gray-500 ${loadingFeedbacks ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {loadingFeedbacks ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
          </div>
        ) : feedbacks.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-30" />
            <p>Henüz geri bildirim göndermediniz</p>
          </div>
        ) : (
          <div className="space-y-3">
            {feedbacks.map(feedback => {
              const category = getCategoryData(feedback.category)
              const status = STATUS_CONFIG[feedback.status as keyof typeof STATUS_CONFIG]
              const StatusIcon = status?.icon || Clock

              return (
                <div
                  key={feedback.id}
                  className="p-4 bg-gray-50 rounded-xl border border-gray-100 hover:border-gray-200 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${category.lightColor}`}>
                          {category.label}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${status?.color}`}>
                          <StatusIcon className="w-3 h-3" />
                          {status?.label}
                        </span>
                      </div>
                      <p className="text-gray-700 text-sm">{feedback.message}</p>
                      {feedback.admin_note && (
                        <div className="mt-2 p-2 bg-blue-50 rounded-lg border border-blue-100">
                          <p className="text-xs text-blue-600 font-medium mb-1">Admin Notu:</p>
                          <p className="text-sm text-blue-700">{feedback.admin_note}</p>
                        </div>
                      )}
                    </div>
                    <span className="text-xs text-gray-400 whitespace-nowrap">
                      {new Date(feedback.created_at).toLocaleDateString('tr-TR')}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </motion.div>
    </div>
  )
}

