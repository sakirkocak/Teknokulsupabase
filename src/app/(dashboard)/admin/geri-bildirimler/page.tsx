'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useProfile } from '@/hooks/useProfile'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  MessageSquare, 
  Bug, 
  Lightbulb, 
  Sparkles, 
  HelpCircle,
  CheckCircle,
  Loader2,
  Clock,
  AlertCircle,
  RefreshCw,
  Filter,
  X,
  User,
  Globe,
  Calendar,
  ExternalLink,
  Save,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Search
} from 'lucide-react'

const CATEGORIES = [
  { id: 'bug', label: 'Hata Bildirimi', icon: Bug, color: 'bg-red-500', lightColor: 'bg-red-100 text-red-700' },
  { id: 'feature', label: 'Özellik İsteği', icon: Sparkles, color: 'bg-purple-500', lightColor: 'bg-purple-100 text-purple-700' },
  { id: 'suggestion', label: 'Öneri', icon: Lightbulb, color: 'bg-amber-500', lightColor: 'bg-amber-100 text-amber-700' },
  { id: 'other', label: 'Diğer', icon: HelpCircle, color: 'bg-blue-500', lightColor: 'bg-blue-100 text-blue-700' },
]

const STATUS_CONFIG = {
  new: { label: 'Yeni', color: 'bg-blue-100 text-blue-700 border-blue-200', icon: Clock },
  in_progress: { label: 'İnceleniyor', color: 'bg-amber-100 text-amber-700 border-amber-200', icon: Loader2 },
  resolved: { label: 'Çözüldü', color: 'bg-green-100 text-green-700 border-green-200', icon: CheckCircle },
  closed: { label: 'Kapatıldı', color: 'bg-gray-100 text-gray-700 border-gray-200', icon: AlertCircle },
}

interface Feedback {
  id: string
  user_id: string | null
  name: string | null
  email: string | null
  category: string
  status: string
  message: string
  page_url: string | null
  admin_note: string | null
  created_at: string
  updated_at: string
  profiles?: {
    full_name: string | null
    email: string | null
    avatar_url: string | null
  }
}

export default function AdminFeedbackPage() {
  const { profile } = useProfile()
  const supabase = createClient()
  
  // Liste state
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 })
  
  // Filtreler
  const [filterStatus, setFilterStatus] = useState<string>('')
  const [filterCategory, setFilterCategory] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState('')
  
  // Detay modal
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null)
  const [adminNote, setAdminNote] = useState('')
  const [newStatus, setNewStatus] = useState('')
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // İstatistikler
  const [stats, setStats] = useState({ new: 0, in_progress: 0, resolved: 0, closed: 0, total: 0 })

  useEffect(() => {
    loadFeedbacks()
    loadStats()
  }, [filterStatus, filterCategory, pagination.page])

  const loadStats = async () => {
    try {
      const { data, error } = await supabase
        .from('feedback')
        .select('status')
      
      if (data) {
        const counts = { new: 0, in_progress: 0, resolved: 0, closed: 0, total: data.length }
        data.forEach(f => {
          if (f.status in counts) {
            counts[f.status as keyof typeof counts]++
          }
        })
        setStats(counts)
      }
    } catch (err) {
      console.error('İstatistikler yüklenemedi:', err)
    }
  }

  const loadFeedbacks = async () => {
    setLoading(true)
    try {
      let url = `/api/feedback?page=${pagination.page}&limit=15`
      if (filterStatus) url += `&status=${filterStatus}`
      if (filterCategory) url += `&category=${filterCategory}`
      
      const response = await fetch(url)
      const data = await response.json()
      
      if (data.data) {
        setFeedbacks(data.data)
        setPagination(prev => ({
          ...prev,
          totalPages: data.pagination.totalPages,
          total: data.pagination.total
        }))
      }
    } catch (err) {
      console.error('Feedbackler yüklenemedi:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleOpenDetail = (feedback: Feedback) => {
    setSelectedFeedback(feedback)
    setAdminNote(feedback.admin_note || '')
    setNewStatus(feedback.status)
  }

  const handleSave = async () => {
    if (!selectedFeedback) return
    setSaving(true)

    try {
      const response = await fetch('/api/feedback', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedFeedback.id,
          status: newStatus,
          admin_note: adminNote
        })
      })

      if (!response.ok) throw new Error('Güncelleme başarısız')

      // Listeyi yenile
      loadFeedbacks()
      loadStats()
      setSelectedFeedback(null)

    } catch (err) {
      console.error('Kaydetme hatası:', err)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedFeedback || !confirm('Bu geri bildirimi silmek istediğinize emin misiniz?')) return
    setDeleting(true)

    try {
      const response = await fetch(`/api/feedback?id=${selectedFeedback.id}`, {
        method: 'DELETE'
      })

      if (!response.ok) throw new Error('Silme başarısız')

      loadFeedbacks()
      loadStats()
      setSelectedFeedback(null)

    } catch (err) {
      console.error('Silme hatası:', err)
    } finally {
      setDeleting(false)
    }
  }

  const getCategoryData = (categoryId: string) => {
    return CATEGORIES.find(c => c.id === categoryId) || CATEGORIES[3]
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl shadow-lg">
            <MessageSquare className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Geri Bildirimler</h1>
            <p className="text-gray-500 text-sm">Kullanıcı geri bildirimlerini yönetin</p>
          </div>
        </div>
        <button
          onClick={() => { loadFeedbacks(); loadStats(); }}
          disabled={loading}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <RefreshCw className={`w-5 h-5 text-gray-500 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* İstatistik Kartları */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <p className="text-sm text-gray-500">Toplam</p>
          <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
        </div>
        <div 
          onClick={() => setFilterStatus(filterStatus === 'new' ? '' : 'new')}
          className={`bg-white rounded-xl p-4 border shadow-sm cursor-pointer transition-all ${filterStatus === 'new' ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-100 hover:border-blue-200'}`}
        >
          <p className="text-sm text-blue-600">Yeni</p>
          <p className="text-2xl font-bold text-blue-700">{stats.new}</p>
        </div>
        <div 
          onClick={() => setFilterStatus(filterStatus === 'in_progress' ? '' : 'in_progress')}
          className={`bg-white rounded-xl p-4 border shadow-sm cursor-pointer transition-all ${filterStatus === 'in_progress' ? 'border-amber-500 ring-2 ring-amber-200' : 'border-gray-100 hover:border-amber-200'}`}
        >
          <p className="text-sm text-amber-600">İnceleniyor</p>
          <p className="text-2xl font-bold text-amber-700">{stats.in_progress}</p>
        </div>
        <div 
          onClick={() => setFilterStatus(filterStatus === 'resolved' ? '' : 'resolved')}
          className={`bg-white rounded-xl p-4 border shadow-sm cursor-pointer transition-all ${filterStatus === 'resolved' ? 'border-green-500 ring-2 ring-green-200' : 'border-gray-100 hover:border-green-200'}`}
        >
          <p className="text-sm text-green-600">Çözüldü</p>
          <p className="text-2xl font-bold text-green-700">{stats.resolved}</p>
        </div>
        <div 
          onClick={() => setFilterStatus(filterStatus === 'closed' ? '' : 'closed')}
          className={`bg-white rounded-xl p-4 border shadow-sm cursor-pointer transition-all ${filterStatus === 'closed' ? 'border-gray-500 ring-2 ring-gray-200' : 'border-gray-100 hover:border-gray-300'}`}
        >
          <p className="text-sm text-gray-600">Kapatıldı</p>
          <p className="text-2xl font-bold text-gray-700">{stats.closed}</p>
        </div>
      </div>

      {/* Filtreler */}
      <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <Filter className="w-5 h-5 text-gray-400" />
          
          {/* Kategori Filtresi */}
          <select
            value={filterCategory}
            onChange={e => { setFilterCategory(e.target.value); setPagination(p => ({ ...p, page: 1 })); }}
            className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-primary-500"
          >
            <option value="">Tüm Kategoriler</option>
            {CATEGORIES.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.label}</option>
            ))}
          </select>

          {/* Filtreleri Temizle */}
          {(filterStatus || filterCategory) && (
            <button
              onClick={() => { setFilterStatus(''); setFilterCategory(''); setPagination(p => ({ ...p, page: 1 })); }}
              className="px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              Filtreleri Temizle
            </button>
          )}

          <span className="ml-auto text-sm text-gray-500">
            {pagination.total} sonuç
          </span>
        </div>
      </div>

      {/* Feedback Listesi */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
          </div>
        ) : feedbacks.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <MessageSquare className="w-16 h-16 mx-auto mb-3 opacity-30" />
            <p>Geri bildirim bulunamadı</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {feedbacks.map(feedback => {
              const category = getCategoryData(feedback.category)
              const status = STATUS_CONFIG[feedback.status as keyof typeof STATUS_CONFIG]
              const StatusIcon = status?.icon || Clock
              const CategoryIcon = category.icon

              return (
                <div
                  key={feedback.id}
                  onClick={() => handleOpenDetail(feedback)}
                  className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <div className="flex items-start gap-4">
                    {/* Kategori İkonu */}
                    <div className={`p-2 rounded-lg ${category.color} text-white flex-shrink-0`}>
                      <CategoryIcon className="w-5 h-5" />
                    </div>

                    {/* İçerik */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium border ${status?.color}`}>
                          {status?.label}
                        </span>
                        <span className="text-xs text-gray-400">
                          {new Date(feedback.created_at).toLocaleDateString('tr-TR', { 
                            day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' 
                          })}
                        </span>
                      </div>
                      <p className="text-gray-800 line-clamp-2">{feedback.message}</p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                        {feedback.profiles?.full_name || feedback.name ? (
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {feedback.profiles?.full_name || feedback.name}
                          </span>
                        ) : (
                          <span className="flex items-center gap-1">
                            <Globe className="w-3 h-3" />
                            Anonim
                          </span>
                        )}
                        {feedback.page_url && (
                          <span className="truncate max-w-[200px]">
                            {feedback.page_url.replace(/^https?:\/\/[^\/]+/, '')}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Admin Notu İşareti */}
                    {feedback.admin_note && (
                      <div className="flex-shrink-0">
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">Not var</span>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Sayfalama */}
        {pagination.totalPages > 1 && (
          <div className="p-4 border-t border-gray-100 flex items-center justify-center gap-2">
            <button
              onClick={() => setPagination(p => ({ ...p, page: Math.max(1, p.page - 1) }))}
              disabled={pagination.page === 1}
              className="p-2 hover:bg-gray-100 rounded-lg disabled:opacity-50"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-sm text-gray-600">
              {pagination.page} / {pagination.totalPages}
            </span>
            <button
              onClick={() => setPagination(p => ({ ...p, page: Math.min(p.totalPages, p.page + 1) }))}
              disabled={pagination.page === pagination.totalPages}
              className="p-2 hover:bg-gray-100 rounded-lg disabled:opacity-50"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>

      {/* Detay Modal */}
      <AnimatePresence>
        {selectedFeedback && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedFeedback(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${getCategoryData(selectedFeedback.category).color} text-white`}>
                    {(() => {
                      const CategoryIcon = getCategoryData(selectedFeedback.category).icon
                      return <CategoryIcon className="w-5 h-5" />
                    })()}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">
                      {getCategoryData(selectedFeedback.category).label}
                    </h3>
                    <p className="text-xs text-gray-500">
                      {new Date(selectedFeedback.created_at).toLocaleString('tr-TR')}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedFeedback(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-5 space-y-4">
                {/* Kullanıcı Bilgisi */}
                <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl">
                  <User className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="font-medium text-gray-800">
                      {selectedFeedback.profiles?.full_name || selectedFeedback.name || 'Anonim'}
                    </p>
                    {(selectedFeedback.profiles?.email || selectedFeedback.email) && (
                      <p className="text-sm text-gray-500">
                        {selectedFeedback.profiles?.email || selectedFeedback.email}
                      </p>
                    )}
                  </div>
                </div>

                {/* Mesaj */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Mesaj</label>
                  <div className="p-4 bg-gray-50 rounded-xl text-gray-800 whitespace-pre-wrap">
                    {selectedFeedback.message}
                  </div>
                </div>

                {/* Sayfa URL */}
                {selectedFeedback.page_url && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Sayfa</label>
                    <a
                      href={selectedFeedback.page_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-primary-600 hover:text-primary-700 text-sm"
                    >
                      <ExternalLink className="w-4 h-4" />
                      {selectedFeedback.page_url}
                    </a>
                  </div>
                )}

                {/* Durum Güncelleme */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Durum</label>
                  <div className="grid grid-cols-4 gap-2">
                    {Object.entries(STATUS_CONFIG).map(([key, config]) => {
                      const Icon = config.icon
                      return (
                        <button
                          key={key}
                          onClick={() => setNewStatus(key)}
                          className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-1 ${
                            newStatus === key
                              ? 'border-primary-500 bg-primary-50'
                              : 'border-gray-100 hover:border-gray-200'
                          }`}
                        >
                          <Icon className={`w-5 h-5 ${newStatus === key ? 'text-primary-600' : 'text-gray-400'}`} />
                          <span className="text-xs font-medium">{config.label}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Admin Notu */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Admin Notu</label>
                  <textarea
                    value={adminNote}
                    onChange={e => setAdminNote(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all resize-none"
                    placeholder="İç notlarınızı buraya yazabilirsiniz..."
                    rows={3}
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-5 border-t border-gray-100 flex items-center justify-between">
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-2"
                >
                  {deleting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                  Sil
                </button>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedFeedback(null)}
                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    İptal
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors flex items-center gap-2"
                  >
                    {saving ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    Kaydet
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

