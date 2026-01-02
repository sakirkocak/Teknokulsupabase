'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  MessageSquarePlus, 
  X, 
  Send, 
  Bug, 
  Lightbulb, 
  Sparkles, 
  HelpCircle,
  CheckCircle,
  Loader2
} from 'lucide-react'

const CATEGORIES = [
  { id: 'bug', label: 'Hata Bildirimi', icon: Bug, color: 'bg-red-500', description: 'Bir şey çalışmıyor mu?' },
  { id: 'feature', label: 'Özellik İsteği', icon: Sparkles, color: 'bg-purple-500', description: 'Yeni bir özellik mi istiyorsun?' },
  { id: 'suggestion', label: 'Öneri', icon: Lightbulb, color: 'bg-amber-500', description: 'Geliştirmemiz gereken bir yer mi var?' },
  { id: 'other', label: 'Diğer', icon: HelpCircle, color: 'bg-blue-500', description: 'Başka bir konuda mı yazmak istiyorsun?' },
]

export default function FeedbackWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [step, setStep] = useState<'category' | 'form' | 'success'>('category')
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Modal açıldığında body scroll'u engelle
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId)
    setStep('form')
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
          ...formData,
          category: selectedCategory,
          page_url: window.location.href
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Bir hata oluştu')
      }

      setStep('success')
      
      // 3 saniye sonra kapat
      setTimeout(() => {
        handleClose()
      }, 3000)

    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setIsOpen(false)
    // Biraz bekle ve state'leri sıfırla
    setTimeout(() => {
      setStep('category')
      setSelectedCategory('')
      setFormData({ name: '', email: '', message: '' })
      setError(null)
    }, 300)
  }

  const selectedCategoryData = CATEGORIES.find(c => c.id === selectedCategory)

  return (
    <>
      {/* Floating Button */}
      <motion.button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-24 z-40 p-4 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-full shadow-lg hover:shadow-xl transition-shadow group"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1 }}
      >
        <MessageSquarePlus className="w-6 h-6" />
        <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-gray-900 text-white text-sm rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          Geri Bildirim Gönder
        </span>
      </motion.button>

      {/* Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={handleClose}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-primary-500 to-primary-600 p-5 text-white relative">
                <button
                  onClick={handleClose}
                  className="absolute top-4 right-4 p-1 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
                <h2 className="text-xl font-bold">Geri Bildirim</h2>
                <p className="text-white/80 text-sm mt-1">
                  Fikirleriniz bizim için değerli!
                </p>
              </div>

              {/* Content */}
              <div className="p-5">
                <AnimatePresence mode="wait">
                  {/* Step 1: Category Selection */}
                  {step === 'category' && (
                    <motion.div
                      key="category"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="space-y-3"
                    >
                      <p className="text-gray-600 text-sm mb-4">
                        Ne hakkında yazmak istiyorsunuz?
                      </p>
                      {CATEGORIES.map(category => {
                        const Icon = category.icon
                        return (
                          <button
                            key={category.id}
                            onClick={() => handleCategorySelect(category.id)}
                            className="w-full p-4 rounded-xl border-2 border-gray-100 hover:border-primary-200 hover:bg-primary-50 transition-all flex items-center gap-4 group"
                          >
                            <div className={`p-3 rounded-xl ${category.color} text-white group-hover:scale-110 transition-transform`}>
                              <Icon className="w-5 h-5" />
                            </div>
                            <div className="text-left">
                              <p className="font-medium text-gray-800">{category.label}</p>
                              <p className="text-sm text-gray-500">{category.description}</p>
                            </div>
                          </button>
                        )
                      })}
                    </motion.div>
                  )}

                  {/* Step 2: Form */}
                  {step === 'form' && (
                    <motion.form
                      key="form"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      onSubmit={handleSubmit}
                      className="space-y-4"
                    >
                      {/* Selected Category Badge */}
                      {selectedCategoryData && (
                        <div className="flex items-center gap-2 mb-4">
                          <button
                            type="button"
                            onClick={() => setStep('category')}
                            className="text-sm text-primary-500 hover:text-primary-600"
                          >
                            ← Geri
                          </button>
                          <span className={`px-3 py-1 rounded-full text-white text-sm ${selectedCategoryData.color}`}>
                            {selectedCategoryData.label}
                          </span>
                        </div>
                      )}

                      {/* Name (Optional) */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Adınız <span className="text-gray-400">(opsiyonel)</span>
                        </label>
                        <input
                          type="text"
                          value={formData.name}
                          onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                          placeholder="Adınızı yazın"
                        />
                      </div>

                      {/* Email (Optional) */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          E-posta <span className="text-gray-400">(opsiyonel)</span>
                        </label>
                        <input
                          type="email"
                          value={formData.email}
                          onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
                          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                          placeholder="ornek@email.com"
                        />
                      </div>

                      {/* Message */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Mesajınız <span className="text-red-500">*</span>
                        </label>
                        <textarea
                          value={formData.message}
                          onChange={e => setFormData(prev => ({ ...prev, message: e.target.value }))}
                          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all resize-none"
                          placeholder="Düşüncelerinizi bizimle paylaşın..."
                          rows={4}
                          required
                          minLength={10}
                        />
                        <p className="text-xs text-gray-400 mt-1">
                          En az 10 karakter
                        </p>
                      </div>

                      {/* Error */}
                      {error && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                          {error}
                        </div>
                      )}

                      {/* Submit */}
                      <button
                        type="submit"
                        disabled={loading || formData.message.length < 10}
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
                    </motion.form>
                  )}

                  {/* Step 3: Success */}
                  {step === 'success' && (
                    <motion.div
                      key="success"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="text-center py-8"
                    >
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', delay: 0.1 }}
                        className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4"
                      >
                        <CheckCircle className="w-10 h-10 text-green-500" />
                      </motion.div>
                      <h3 className="text-xl font-bold text-gray-800 mb-2">
                        Teşekkürler!
                      </h3>
                      <p className="text-gray-600">
                        Geri bildiriminiz başarıyla gönderildi.
                        <br />
                        <span className="text-sm text-gray-400">
                          En kısa sürede değerlendireceğiz.
                        </span>
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

