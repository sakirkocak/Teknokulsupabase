'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useProfile } from '@/hooks/useProfile'
import { createClient } from '@/lib/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Calendar,
  Plus,
  Edit2,
  Trash2,
  Clock,
  CheckCircle,
  X,
  AlertTriangle,
  Save,
  GraduationCap,
  BookOpen,
  Briefcase,
  Globe,
  Target,
  Star,
  ChevronUp,
  ChevronDown
} from 'lucide-react'

interface ExamDate {
  id: string
  title: string
  description: string | null
  exam_date: string
  exam_type: string
  is_active: boolean
  is_featured: boolean
  featured_order: number
  color: string
  icon: string
  created_at: string
}

const examTypes = [
  { value: 'lgs', label: 'LGS', color: '#10B981' },
  { value: 'bursluluk', label: 'Bursluluk/İOKBS', color: '#F59E0B' },
  { value: 'yks', label: 'YKS', color: '#6366F1' },
  { value: 'kpss', label: 'KPSS', color: '#F97316' },
  { value: 'ekpss', label: 'EKPSS', color: '#BE185D' },
  { value: 'ales', label: 'ALES', color: '#7C3AED' },
  { value: 'dgs', label: 'DGS', color: '#14B8A6' },
  { value: 'yds', label: 'YDS/e-YDS', color: '#0EA5E9' },
  { value: 'yokdil', label: 'YÖKDİL', color: '#A855F7' },
  { value: 'tus', label: 'TUS', color: '#DC2626' },
  { value: 'dus', label: 'DUS', color: '#E11D48' },
  { value: 'eus', label: 'EUS', color: '#DB2777' },
  { value: 'ydus', label: 'YDUS', color: '#B91C1C' },
  { value: 'msu', label: 'MSÜ', color: '#1E40AF' },
  { value: 'hmgs', label: 'HMGS', color: '#4338CA' },
  { value: 'meb', label: 'MEB', color: '#F59E0B' },
  { value: 'yos', label: 'TR-YÖS', color: '#8B5CF6' },
  { value: 'dib', label: 'DİB-MBSTS', color: '#14B8A6' },
  { value: 'sts', label: 'STS', color: '#EF4444' },
  { value: 'guy', label: 'GUY', color: '#059669' },
  { value: 'other', label: 'Diğer', color: '#6B7280' },
]

const iconOptions = [
  { value: 'graduation-cap', label: 'Mezuniyet', Icon: GraduationCap },
  { value: 'book-open', label: 'Kitap', Icon: BookOpen },
  { value: 'briefcase', label: 'İş', Icon: Briefcase },
  { value: 'globe', label: 'Dünya', Icon: Globe },
  { value: 'target', label: 'Hedef', Icon: Target },
  { value: 'calendar', label: 'Takvim', Icon: Calendar },
]

export default function AdminExamCalendarPage() {
  const { profile, loading: profileLoading } = useProfile()
  const [exams, setExams] = useState<ExamDate[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingExam, setEditingExam] = useState<ExamDate | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'all' | 'featured'>('featured')
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    exam_date: '',
    exam_time: '10:00',
    exam_type: 'lgs',
    color: '#10B981',
    icon: 'graduation-cap',
  })

  const supabase = createClient()

  useEffect(() => {
    loadExams()
  }, [])

  async function loadExams() {
    setLoading(true)
    const { data, error } = await supabase
      .from('exam_dates')
      .select('*')
      .order('exam_date', { ascending: true })

    if (data) {
      setExams(data)
    }
    setLoading(false)
  }

  function openAddModal() {
    setEditingExam(null)
    setFormData({
      title: '',
      description: '',
      exam_date: '',
      exam_time: '10:00',
      exam_type: 'lgs',
      color: '#10B981',
      icon: 'graduation-cap',
    })
    setShowModal(true)
  }

  function openEditModal(exam: ExamDate) {
    setEditingExam(exam)
    const date = new Date(exam.exam_date)
    setFormData({
      title: exam.title,
      description: exam.description || '',
      exam_date: date.toISOString().split('T')[0],
      exam_time: date.toTimeString().slice(0, 5),
      exam_type: exam.exam_type,
      color: exam.color,
      icon: exam.icon,
    })
    setShowModal(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)

    const examDateTime = new Date(`${formData.exam_date}T${formData.exam_time}:00`)
    
    const examData = {
      title: formData.title,
      description: formData.description || null,
      exam_date: examDateTime.toISOString(),
      exam_type: formData.exam_type,
      color: formData.color,
      icon: formData.icon,
      is_active: true,
    }

    if (editingExam) {
      const { error } = await supabase
        .from('exam_dates')
        .update(examData)
        .eq('id', editingExam.id)

      if (error) {
        alert('Güncelleme hatası: ' + error.message)
      } else {
        setShowModal(false)
        loadExams()
      }
    } else {
      const { error } = await supabase
        .from('exam_dates')
        .insert(examData)

      if (error) {
        alert('Ekleme hatası: ' + error.message)
      } else {
        setShowModal(false)
        loadExams()
      }
    }

    setSaving(false)
  }

  async function toggleActive(exam: ExamDate) {
    const { error } = await supabase
      .from('exam_dates')
      .update({ is_active: !exam.is_active })
      .eq('id', exam.id)

    if (!error) {
      loadExams()
    }
  }

  async function toggleFeatured(exam: ExamDate) {
    const featuredCount = exams.filter(e => e.is_featured).length
    
    if (!exam.is_featured && featuredCount >= 5) {
      alert('En fazla 5 sınav öne çıkarılabilir!')
      return
    }

    const newOrder = exam.is_featured ? 0 : featuredCount + 1
    
    const { error } = await supabase
      .from('exam_dates')
      .update({ 
        is_featured: !exam.is_featured,
        featured_order: newOrder
      })
      .eq('id', exam.id)

    if (!error) {
      loadExams()
    }
  }

  async function moveFeaturedOrder(exam: ExamDate, direction: 'up' | 'down') {
    const featuredExams = exams
      .filter(e => e.is_featured)
      .sort((a, b) => a.featured_order - b.featured_order)
    
    const currentIndex = featuredExams.findIndex(e => e.id === exam.id)
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
    
    if (targetIndex < 0 || targetIndex >= featuredExams.length) return
    
    const targetExam = featuredExams[targetIndex]
    
    // Swap orders
    await supabase
      .from('exam_dates')
      .update({ featured_order: targetExam.featured_order })
      .eq('id', exam.id)
    
    await supabase
      .from('exam_dates')
      .update({ featured_order: exam.featured_order })
      .eq('id', targetExam.id)
    
    loadExams()
  }

  async function deleteExam(id: string) {
    const { error } = await supabase
      .from('exam_dates')
      .delete()
      .eq('id', id)

    if (!error) {
      setDeleteConfirm(null)
      loadExams()
    }
  }

  function getTimeUntil(dateStr: string) {
    const now = new Date()
    const examDate = new Date(dateStr)
    const diff = examDate.getTime() - now.getTime()
    
    if (diff < 0) return { text: 'Geçti', isPast: true }
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    
    if (days > 0) {
      return { text: `${days} gün ${hours} saat`, isPast: false }
    }
    return { text: `${hours} saat`, isPast: false }
  }

  function getIconComponent(iconName: string) {
    const found = iconOptions.find(i => i.value === iconName)
    return found ? found.Icon : Calendar
  }

  const featuredExams = exams
    .filter(e => e.is_featured)
    .sort((a, b) => a.featured_order - b.featured_order)

  const upcomingExams = exams.filter(e => new Date(e.exam_date) > new Date())

  if (profileLoading || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Sınav Takvimi Yönetimi</h1>
          <p className="text-surface-500">Sınav tarihlerini ekle, düzenle ve öne çıkar</p>
        </div>
        <button
          onClick={openAddModal}
          className="btn btn-primary flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Yeni Sınav Ekle
        </button>
      </div>

      {/* Stats */}
      <div className="grid sm:grid-cols-4 gap-4">
        <div className="card p-4 bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center">
              <Star className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-2xl font-bold text-amber-700">{featuredExams.length}/5</div>
              <div className="text-sm text-amber-600">Öne Çıkan</div>
            </div>
          </div>
        </div>
        <div className="card p-4 bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-2xl font-bold text-green-700">{exams.filter(e => e.is_active).length}</div>
              <div className="text-sm text-green-600">Aktif Sınav</div>
            </div>
          </div>
        </div>
        <div className="card p-4 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center">
              <Clock className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-700">{upcomingExams.length}</div>
              <div className="text-sm text-blue-600">Yaklaşan</div>
            </div>
          </div>
        </div>
        <div className="card p-4 bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-500 rounded-xl flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-700">{exams.length}</div>
              <div className="text-sm text-purple-600">Toplam</div>
            </div>
          </div>
        </div>
      </div>

      {/* Featured Exams Section */}
      <div className="card p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center">
            <Star className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-surface-900">Öne Çıkan Sınavlar</h2>
            <p className="text-sm text-surface-500">Ana sayfada geri sayım gösterilecek sınavlar (max 5)</p>
          </div>
        </div>

        {featuredExams.length === 0 ? (
          <div className="text-center py-8 text-surface-500">
            <Star className="w-12 h-12 mx-auto mb-3 text-surface-300" />
            <p>Henüz öne çıkan sınav seçilmemiş</p>
            <p className="text-sm">Aşağıdaki listeden sınavları yıldıza tıklayarak öne çıkarabilirsiniz</p>
          </div>
        ) : (
          <div className="space-y-2">
            {featuredExams.map((exam, index) => {
              const IconComponent = getIconComponent(exam.icon)
              const timeUntil = getTimeUntil(exam.exam_date)
              
              return (
                <div 
                  key={exam.id}
                  className="flex items-center gap-4 p-3 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-200"
                >
                  <div className="flex flex-col gap-1">
                    <button
                      onClick={() => moveFeaturedOrder(exam, 'up')}
                      disabled={index === 0}
                      className="p-1 hover:bg-amber-200 rounded disabled:opacity-30"
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => moveFeaturedOrder(exam, 'down')}
                      disabled={index === featuredExams.length - 1}
                      className="p-1 hover:bg-amber-200 rounded disabled:opacity-30"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center text-white font-bold">
                    {index + 1}
                  </div>
                  <div 
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: exam.color + '20', color: exam.color }}
                  >
                    <IconComponent className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-surface-900">{exam.title}</div>
                    <div className="text-sm text-surface-500">
                      {new Date(exam.exam_date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
                      {' • '}
                      <span className={timeUntil.isPast ? 'text-red-500' : 'text-amber-600 font-medium'}>
                        {timeUntil.text}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => toggleFeatured(exam)}
                    className="p-2 text-amber-500 hover:bg-amber-100 rounded-lg"
                    title="Öne çıkarmayı kaldır"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-surface-200">
        <button
          onClick={() => setActiveTab('featured')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            activeTab === 'featured'
              ? 'border-primary-500 text-primary-600'
              : 'border-transparent text-surface-500 hover:text-surface-700'
          }`}
        >
          Yaklaşan Sınavlar
        </button>
        <button
          onClick={() => setActiveTab('all')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            activeTab === 'all'
              ? 'border-primary-500 text-primary-600'
              : 'border-transparent text-surface-500 hover:text-surface-700'
          }`}
        >
          Tüm Sınavlar ({exams.length})
        </button>
      </div>

      {/* Exams List */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-surface-50 border-b border-surface-100">
              <tr>
                <th className="text-left p-4 font-medium text-surface-600 w-10">Öne Çıkar</th>
                <th className="text-left p-4 font-medium text-surface-600">Sınav</th>
                <th className="text-left p-4 font-medium text-surface-600">Tür</th>
                <th className="text-left p-4 font-medium text-surface-600">Tarih</th>
                <th className="text-left p-4 font-medium text-surface-600">Kalan Süre</th>
                <th className="text-left p-4 font-medium text-surface-600">Durum</th>
                <th className="text-right p-4 font-medium text-surface-600">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100">
              {(activeTab === 'featured' ? upcomingExams : exams).map((exam) => {
                const timeUntil = getTimeUntil(exam.exam_date)
                const IconComponent = getIconComponent(exam.icon)
                const typeInfo = examTypes.find(t => t.value === exam.exam_type)

                return (
                  <tr key={exam.id} className="hover:bg-surface-50">
                    <td className="p-4">
                      <button
                        onClick={() => toggleFeatured(exam)}
                        className={`p-2 rounded-lg transition-colors ${
                          exam.is_featured 
                            ? 'text-amber-500 bg-amber-50 hover:bg-amber-100' 
                            : 'text-surface-300 hover:text-amber-400 hover:bg-surface-100'
                        }`}
                        title={exam.is_featured ? 'Öne çıkarmayı kaldır' : 'Öne çıkar'}
                      >
                        <Star className={`w-5 h-5 ${exam.is_featured ? 'fill-current' : ''}`} />
                      </button>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-10 h-10 rounded-xl flex items-center justify-center"
                          style={{ backgroundColor: exam.color + '20', color: exam.color }}
                        >
                          <IconComponent className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="font-medium text-surface-900">{exam.title}</div>
                          {exam.description && (
                            <div className="text-sm text-surface-500 line-clamp-1">{exam.description}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span 
                        className="px-2 py-1 rounded-full text-xs font-medium"
                        style={{ backgroundColor: typeInfo?.color + '20', color: typeInfo?.color }}
                      >
                        {typeInfo?.label || exam.exam_type.toUpperCase()}
                      </span>
                    </td>
                    <td className="p-4 text-surface-600">
                      {new Date(exam.exam_date).toLocaleDateString('tr-TR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                    <td className="p-4">
                      <span className={`font-medium ${timeUntil.isPast ? 'text-surface-400' : 'text-primary-600'}`}>
                        {timeUntil.text}
                      </span>
                    </td>
                    <td className="p-4">
                      <button
                        onClick={() => toggleActive(exam)}
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium cursor-pointer transition-colors ${
                          exam.is_active 
                            ? 'bg-green-50 text-green-600 hover:bg-green-100' 
                            : 'bg-surface-100 text-surface-500 hover:bg-surface-200'
                        }`}
                      >
                        {exam.is_active ? (
                          <><CheckCircle className="w-3 h-3" /> Aktif</>
                        ) : (
                          <><X className="w-3 h-3" /> Pasif</>
                        )}
                      </button>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(exam)}
                          className="p-2 hover:bg-surface-100 rounded-lg text-surface-500 hover:text-primary-600"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(exam.id)}
                          className="p-2 hover:bg-red-50 rounded-lg text-surface-500 hover:text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {exams.length === 0 && (
          <div className="p-12 text-center">
            <Calendar className="w-12 h-12 mx-auto mb-3 text-surface-300" />
            <p className="text-surface-500">Henüz sınav tarihi eklenmemiş</p>
            <button
              onClick={openAddModal}
              className="mt-4 btn btn-primary"
            >
              İlk Sınavı Ekle
            </button>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-surface-100">
                <h2 className="text-xl font-bold text-surface-900">
                  {editingExam ? 'Sınavı Düzenle' : 'Yeni Sınav Ekle'}
                </h2>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-surface-700 mb-1">
                    Sınav Adı *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Örn: 2026 LGS"
                    className="input"
                    required
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-surface-700 mb-1">
                    Açıklama
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Sınav hakkında kısa açıklama..."
                    className="input min-h-[80px] resize-none"
                    rows={3}
                  />
                </div>

                {/* Date & Time */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-surface-700 mb-1">
                      Tarih *
                    </label>
                    <input
                      type="date"
                      value={formData.exam_date}
                      onChange={(e) => setFormData({ ...formData, exam_date: e.target.value })}
                      className="input"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-surface-700 mb-1">
                      Saat *
                    </label>
                    <input
                      type="time"
                      value={formData.exam_time}
                      onChange={(e) => setFormData({ ...formData, exam_time: e.target.value })}
                      className="input"
                      required
                    />
                  </div>
                </div>

                {/* Exam Type */}
                <div>
                  <label className="block text-sm font-medium text-surface-700 mb-1">
                    Sınav Türü
                  </label>
                  <select
                    value={formData.exam_type}
                    onChange={(e) => {
                      const type = examTypes.find(t => t.value === e.target.value)
                      setFormData({ 
                        ...formData, 
                        exam_type: e.target.value,
                        color: type?.color || formData.color
                      })
                    }}
                    className="input"
                  >
                    {examTypes.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>

                {/* Color & Icon */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-surface-700 mb-1">
                      Renk
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={formData.color}
                        onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                        className="w-10 h-10 rounded-lg cursor-pointer border border-surface-200"
                      />
                      <input
                        type="text"
                        value={formData.color}
                        onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                        className="input flex-1"
                        placeholder="#10B981"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-surface-700 mb-1">
                      İkon
                    </label>
                    <select
                      value={formData.icon}
                      onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                      className="input"
                    >
                      {iconOptions.map(icon => (
                        <option key={icon.value} value={icon.value}>{icon.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Preview */}
                <div className="p-4 bg-surface-50 rounded-xl">
                  <div className="text-xs text-surface-500 mb-2">Önizleme</div>
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-12 h-12 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: formData.color + '20', color: formData.color }}
                    >
                      {(() => {
                        const Icon = getIconComponent(formData.icon)
                        return <Icon className="w-6 h-6" />
                      })()}
                    </div>
                    <div>
                      <div className="font-semibold text-surface-900">
                        {formData.title || 'Sınav Adı'}
                      </div>
                      <div className="text-sm text-surface-500">
                        {formData.exam_date 
                          ? new Date(`${formData.exam_date}T${formData.exam_time}`).toLocaleDateString('tr-TR', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })
                          : 'Tarih seçiniz'
                        }
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="btn btn-secondary flex-1"
                  >
                    İptal
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="btn btn-primary flex-1 flex items-center justify-center gap-2"
                  >
                    {saving ? (
                      <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                    ) : (
                      <>
                        <Save className="w-5 h-5" />
                        {editingExam ? 'Güncelle' : 'Kaydet'}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setDeleteConfirm(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-center text-surface-900 mb-2">
                Sınavı Sil
              </h3>
              <p className="text-center text-surface-600 mb-6">
                Bu sınavı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="btn btn-secondary flex-1"
                >
                  İptal
                </button>
                <button
                  onClick={() => deleteExam(deleteConfirm)}
                  className="btn bg-red-600 hover:bg-red-700 text-white flex-1"
                >
                  Sil
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
