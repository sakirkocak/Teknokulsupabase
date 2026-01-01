'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { 
  FileText, Search, Edit2, Trash2, Eye, Download,
  CheckCircle, XCircle, RefreshCw, Save, X,
  GraduationCap, BookOpen, Calendar, User
} from 'lucide-react'

interface QuestionBank {
  id: string
  title: string
  slug: string
  user_name: string
  grade: number | null
  exam_type: string | null
  subject_code: string | null
  subject_name: string | null
  difficulty: string | null
  question_count: number
  view_count: number
  download_count: number
  is_public: boolean
  created_at: string
  pdf_url: string | null
  pdf_size_kb: number | null
}

const difficultyLabels: Record<string, string> = {
  easy: 'Kolay',
  medium: 'Orta',
  hard: 'Zor',
  mixed: 'Karışık'
}

export default function AdminPDFSoruBankalariPage() {
  const [banks, setBanks] = useState<QuestionBank[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterSubject, setFilterSubject] = useState('')
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  
  // Düzenleme modal
  const [editingBank, setEditingBank] = useState<QuestionBank | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [saving, setSaving] = useState(false)

  const supabase = createClient()

  const loadBanks = useCallback(async () => {
    setLoading(true)
    
    const { data, error } = await supabase
      .from('question_banks')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Error loading banks:', error)
      setMessage({ type: 'error', text: 'Soru bankaları yüklenemedi!' })
    } else {
      setBanks(data || [])
    }
    
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    loadBanks()
  }, [loadBanks])

  // Typesense arama
  const searchFromTypesense = useCallback(async (query: string, subject?: string) => {
    if (!query && !subject) {
      loadBanks()
      return
    }
    
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (query) params.set('q', query)
      if (subject) params.set('subject', subject)
      params.set('limit', '100')
      
      const res = await fetch(`/api/question-bank/search?${params}`)
      const data = await res.json()
      
      if (data.banks) {
        // Typesense sonuçlarını ID'lere göre filtrele
        const typesenseIds = new Set(data.banks.map((b: any) => b.id))
        const filtered = banks.filter(b => typesenseIds.has(b.id))
        // Typesense sırasını koru
        const sorted = data.banks.map((tb: any) => 
          banks.find(b => b.id === tb.id)
        ).filter(Boolean)
        setBanks(sorted as QuestionBank[])
      }
    } catch (error) {
      console.error('Search error:', error)
    }
    setLoading(false)
  }, [banks, loadBanks])

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery || filterSubject) {
        searchFromTypesense(searchQuery, filterSubject)
      } else {
        loadBanks()
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery, filterSubject])

  // Filtrelenmiş bankalar (client-side fallback)
  const filteredBanks = banks.filter(bank => {
    if (filterSubject && bank.subject_code !== filterSubject) return false
    return true
  })

  // Benzersiz subject kodları
  const uniqueSubjects = Array.from(new Set(banks.map(b => b.subject_code).filter(Boolean)))

  // Sil (API kullanarak - Typesense + Storage senkronizasyonu)
  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`"${title}" soru bankasını silmek istediğinize emin misiniz?`)) return
    
    try {
      const res = await fetch('/api/question-bank/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      })
      
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Silme hatası')
      }
      
      setMessage({ type: 'success', text: 'Soru bankası silindi!' })
      // State'i güncelle ve yeniden yükle
      setSearchQuery('')
      setFilterSubject('')
      await loadBanks()
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Silme işlemi başarısız!' })
    }
    
    setTimeout(() => setMessage(null), 3000)
  }

  // Tümünü sil (API kullanarak)
  const handleDeleteAll = async () => {
    if (!confirm(`TÜM ${banks.length} soru bankasını silmek istediğinize emin misiniz? Bu işlem geri alınamaz!`)) return
    if (!confirm('Gerçekten emin misiniz?')) return
    
    try {
      const res = await fetch('/api/question-bank/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deleteAll: true })
      })
      
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Silme hatası')
      }
      
      const data = await res.json()
      setMessage({ type: 'success', text: `${data.deleted} soru bankası silindi!` })
      loadBanks()
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Toplu silme işlemi başarısız!' })
    }
    
    setTimeout(() => setMessage(null), 3000)
  }

  // Düzenleme başlat
  const startEdit = (bank: QuestionBank) => {
    setEditingBank(bank)
    setEditTitle(bank.title)
  }

  // Kaydet (API kullanarak - Typesense senkronizasyonu)
  const handleSave = async () => {
    if (!editingBank || !editTitle.trim()) return
    
    setSaving(true)
    
    try {
      const res = await fetch('/api/question-bank/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          id: editingBank.id, 
          title: editTitle 
        })
      })
      
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Güncelleme hatası')
      }
      
      setMessage({ type: 'success', text: 'Soru bankası güncellendi!' })
      setEditingBank(null)
      loadBanks()
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Güncelleme başarısız!' })
    }
    
    setSaving(false)
    setTimeout(() => setMessage(null), 3000)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <FileText className="h-8 w-8 text-indigo-500" />
              PDF Soru Bankaları Yönetimi
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Toplam {banks.length} soru bankası
            </p>
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={loadBanks}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Yenile
            </button>
            
            {banks.length > 0 && (
              <button
                onClick={handleDeleteAll}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Tümünü Sil
              </button>
            )}
          </div>
        </div>

        {/* Mesaj */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg flex items-center gap-2 ${
            message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {message.type === 'success' ? <CheckCircle className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
            {message.text}
          </div>
        )}

        {/* Filtreler */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 mb-6">
          <div className="flex flex-wrap gap-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Soru bankası ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            
            <select
              value={filterSubject}
              onChange={(e) => setFilterSubject(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">Tüm Dersler</option>
              {uniqueSubjects.map(s => (
                <option key={s} value={s || ''}>{s}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Liste */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
          {filteredBanks.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Henüz soru bankası oluşturulmamış.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Başlık
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Detaylar
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      İstatistik
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Tarih
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      İşlemler
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredBanks.map((bank) => (
                    <tr key={bank.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <td className="px-4 py-4">
                        <div className="max-w-xs">
                          <p className="font-medium text-gray-900 dark:text-white truncate">
                            {bank.title}
                          </p>
                          <p className="text-xs text-gray-500 truncate mt-1">
                            {bank.slug}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-wrap gap-2">
                          {bank.grade && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300">
                              <GraduationCap className="h-3 w-3" />
                              {bank.exam_type || `${bank.grade}. Sınıf`}
                            </span>
                          )}
                          {bank.subject_name && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300">
                              <BookOpen className="h-3 w-3" />
                              {bank.subject_name}
                            </span>
                          )}
                          <span className="px-2 py-1 text-xs rounded bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                            {bank.question_count} Soru
                          </span>
                          {bank.difficulty && (
                            <span className="px-2 py-1 text-xs rounded bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300">
                              {difficultyLabels[bank.difficulty] || bank.difficulty}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Eye className="h-4 w-4" />
                            {bank.view_count}
                          </span>
                          <span className="flex items-center gap-1">
                            <Download className="h-4 w-4" />
                            {bank.download_count}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {new Date(bank.created_at).toLocaleDateString('tr-TR')}
                          </div>
                          <div className="flex items-center gap-1 mt-1 text-xs">
                            <User className="h-3 w-3" />
                            {bank.user_name}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex justify-end gap-2">
                          {bank.pdf_url && (
                            <a
                              href={bank.pdf_url}
                              target="_blank"
                              className="p-2 text-gray-400 hover:text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                              title={`PDF İndir (${bank.pdf_size_kb || 0} KB)`}
                            >
                              <Download className="h-5 w-5" />
                            </a>
                          )}
                          <a
                            href={`/soru-bankasi/${bank.slug}`}
                            target="_blank"
                            className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                            title="Görüntüle"
                          >
                            <Eye className="h-5 w-5" />
                          </a>
                          <button
                            onClick={() => startEdit(bank)}
                            className="p-2 text-gray-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
                            title="Düzenle"
                          >
                            <Edit2 className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleDelete(bank.id, bank.title)}
                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            title="Sil"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* İstatistikler */}
        <div className="mt-8 grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
            <div className="text-3xl font-bold text-indigo-500">{banks.length}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Toplam Banka</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
            <div className="text-3xl font-bold text-blue-500">
              {banks.reduce((sum, b) => sum + b.question_count, 0)}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Toplam Soru</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
            <div className="text-3xl font-bold text-green-500">
              {banks.reduce((sum, b) => sum + b.view_count, 0)}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Toplam Görüntüleme</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
            <div className="text-3xl font-bold text-purple-500">
              {banks.reduce((sum, b) => sum + b.download_count, 0)}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Toplam İndirme</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
            <div className="text-3xl font-bold text-orange-500">
              {Math.round(banks.reduce((sum, b) => sum + (b.pdf_size_kb || 0), 0) / 1024 * 10) / 10} MB
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Toplam PDF Boyutu</div>
          </div>
        </div>
      </div>

      {/* Düzenleme Modal */}
      {editingBank && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-lg w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                Soru Bankası Düzenle
              </h3>
              <button
                onClick={() => setEditingBank(null)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Başlık
                </label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Soru bankası başlığı"
                />
              </div>
              
              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg text-sm">
                <div className="grid grid-cols-2 gap-2 text-gray-600 dark:text-gray-400">
                  <div>Sınıf: <span className="font-medium text-gray-900 dark:text-white">{editingBank.exam_type || `${editingBank.grade}. Sınıf`}</span></div>
                  <div>Ders: <span className="font-medium text-gray-900 dark:text-white">{editingBank.subject_name || '-'}</span></div>
                  <div>Soru: <span className="font-medium text-gray-900 dark:text-white">{editingBank.question_count}</span></div>
                  <div>Zorluk: <span className="font-medium text-gray-900 dark:text-white">{difficultyLabels[editingBank.difficulty || ''] || 'Karışık'}</span></div>
                </div>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setEditingBank(null)}
                className="flex-1 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                İptal
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !editTitle.trim()}
                className="flex-1 py-3 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                    Kaydediliyor...
                  </>
                ) : (
                  <>
                    <Save className="h-5 w-5" />
                    Kaydet
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
