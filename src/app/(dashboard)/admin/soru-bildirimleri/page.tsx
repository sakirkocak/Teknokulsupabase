'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { 
  Flag, CheckCircle, XCircle, Clock, Eye, Trash2, 
  AlertTriangle, MessageSquare, Search, Filter,
  ChevronDown, ChevronUp, RefreshCw
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import MathRenderer from '@/components/MathRenderer'

interface QuestionReport {
  id: string
  question_id: string
  student_id: string
  reason: string
  status: 'pending' | 'reviewed' | 'resolved' | 'rejected'
  admin_notes: string | null
  reviewed_at: string | null
  created_at: string
  question?: {
    id: string
    question_text: string
    options: Record<string, string>
    correct_answer: string
    difficulty: string
    topic?: {
      main_topic: string
      subject?: {
        name: string
        icon: string
      }
    }
  }
  student?: {
    full_name: string
    grade: number
  }
}

const statusConfig = {
  pending: { label: 'Bekliyor', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', icon: Clock },
  reviewed: { label: 'İncelendi', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', icon: Eye },
  resolved: { label: 'Çözüldü', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', icon: CheckCircle },
  rejected: { label: 'Reddedildi', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', icon: XCircle }
}

export default function SoruBildirimleriPage() {
  const router = useRouter()
  const supabase = createClient()
  
  const [reports, setReports] = useState<QuestionReport[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedReport, setSelectedReport] = useState<QuestionReport | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('pending')
  const [adminNotes, setAdminNotes] = useState('')
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    loadReports()
  }, [statusFilter])

  const loadReports = async () => {
    setLoading(true)
    
    let query = supabase
      .from('question_reports')
      .select(`
        *,
        question:questions(
          id,
          question_text,
          options,
          correct_answer,
          difficulty,
          topic:topics(
            main_topic,
            subject:subjects(name, icon)
          )
        ),
        student:student_profiles(full_name, grade)
      `)
      .order('created_at', { ascending: false })

    if (statusFilter && statusFilter !== 'all') {
      query = query.eq('status', statusFilter)
    }

    const { data, error } = await query

    if (error) {
      console.error('Bildirimler yüklenirken hata:', error)
    } else {
      setReports(data as any || [])
    }
    
    setLoading(false)
  }

  const updateReportStatus = async (reportId: string, newStatus: string) => {
    setUpdating(true)
    
    const { error } = await supabase
      .from('question_reports')
      .update({
        status: newStatus,
        admin_notes: adminNotes || null,
        reviewed_at: new Date().toISOString()
      })
      .eq('id', reportId)

    if (error) {
      console.error('Durum güncellenirken hata:', error)
      alert('Güncelleme başarısız!')
    } else {
      await loadReports()
      setSelectedReport(null)
      setAdminNotes('')
    }
    
    setUpdating(false)
  }

  const deleteQuestion = async (questionId: string, reportId: string) => {
    if (!confirm('Bu soruyu silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.')) {
      return
    }

    setUpdating(true)

    // Önce soruyu sil
    const { error: deleteError } = await supabase
      .from('questions')
      .delete()
      .eq('id', questionId)

    if (deleteError) {
      console.error('Soru silinirken hata:', deleteError)
      alert('Soru silinemedi!')
    } else {
      // Bildirimi çözüldü olarak işaretle
      await supabase
        .from('question_reports')
        .update({
          status: 'resolved',
          admin_notes: (adminNotes ? adminNotes + '\n' : '') + 'Soru silindi.',
          reviewed_at: new Date().toISOString()
        })
        .eq('id', reportId)

      await loadReports()
      setSelectedReport(null)
      setAdminNotes('')
    }

    setUpdating(false)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-500 rounded-xl">
              <Flag className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Soru Bildirimleri</h1>
              <p className="text-gray-500 dark:text-gray-400">Öğrencilerin bildirdiği hatalı sorular</p>
            </div>
          </div>
          <button
            onClick={loadReports}
            className="p-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <RefreshCw className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        {/* Filtreler */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 mb-6 shadow-sm">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                statusFilter === 'all'
                  ? 'bg-indigo-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200'
              }`}
            >
              Tümü
            </button>
            {Object.entries(statusConfig).map(([key, { label, icon: Icon }]) => (
              <button
                key={key}
                onClick={() => setStatusFilter(key)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                  statusFilter === key
                    ? 'bg-indigo-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200'
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Bildirim Listesi */}
        {loading ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-12 text-center">
            <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-500">Yükleniyor...</p>
          </div>
        ) : reports.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-12 text-center">
            <Flag className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-600 dark:text-gray-400 mb-2">
              Bildirim Yok
            </h3>
            <p className="text-gray-500">
              {statusFilter === 'pending' ? 'Bekleyen bildirim bulunmuyor.' : 'Bu filtreye uygun bildirim yok.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {reports.map((report) => {
              const StatusIcon = statusConfig[report.status].icon
              return (
                <motion.div
                  key={report.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden"
                >
                  <div 
                    className="p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                    onClick={() => setSelectedReport(selectedReport?.id === report.id ? null : report)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${statusConfig[report.status].color}`}>
                            <StatusIcon className="h-3 w-3" />
                            {statusConfig[report.status].label}
                          </span>
                          <span className="text-sm text-gray-500">
                            {formatDate(report.created_at)}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-2">
                          <span>{report.question?.topic?.subject?.icon || '📚'}</span>
                          <span>{report.question?.topic?.subject?.name}</span>
                          <span>•</span>
                          <span>{report.question?.topic?.main_topic}</span>
                        </div>

                        <p className="text-gray-900 dark:text-white line-clamp-2">
                          {report.question?.question_text}
                        </p>

                        <div className="mt-2 flex items-center gap-2 text-sm">
                          <span className="text-gray-500">Bildiren:</span>
                          <span className="text-gray-700 dark:text-gray-300">
                            {report.student?.full_name} ({report.student?.grade}. sınıf)
                          </span>
                        </div>
                      </div>
                      
                      <div className="ml-4">
                        {selectedReport?.id === report.id ? (
                          <ChevronUp className="h-5 w-5 text-gray-400" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-gray-400" />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Detay Paneli */}
                  <AnimatePresence>
                    {selectedReport?.id === report.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-t border-gray-100 dark:border-gray-700 overflow-hidden"
                      >
                        <div className="p-4 bg-gray-50 dark:bg-gray-900/50">
                          {/* Soru Detayı */}
                          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 mb-4">
                            <h4 className="text-sm font-medium text-gray-500 mb-2">Soru</h4>
                            <div className="text-gray-900 dark:text-white mb-4">
                              <MathRenderer text={report.question?.question_text || ''} />
                            </div>
                            
                            <div className="grid grid-cols-2 gap-2">
                              {report.question?.options && Object.entries(report.question.options).map(([key, value]) => (
                                <div 
                                  key={key}
                                  className={`p-2 rounded-lg text-sm ${
                                    key === report.question?.correct_answer
                                      ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-300'
                                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                                  }`}
                                >
                                  <span className="font-medium">{key})</span> {value}
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Bildirim Sebebi */}
                          <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4 mb-4">
                            <h4 className="text-sm font-medium text-amber-700 dark:text-amber-400 mb-2 flex items-center gap-2">
                              <MessageSquare className="h-4 w-4" />
                              Bildirim Sebebi
                            </h4>
                            <p className="text-amber-800 dark:text-amber-300">{report.reason}</p>
                          </div>

                          {/* Admin Notları */}
                          {report.status === 'pending' && (
                            <div className="mb-4">
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Admin Notları (Opsiyonel)
                              </label>
                              <textarea
                                value={adminNotes}
                                onChange={(e) => setAdminNotes(e.target.value)}
                                placeholder="Bu bildirim hakkında not ekleyin..."
                                className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                                rows={2}
                              />
                            </div>
                          )}

                          {/* Mevcut Admin Notları */}
                          {report.admin_notes && (
                            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 mb-4">
                              <h4 className="text-sm font-medium text-blue-700 dark:text-blue-400 mb-2">
                                Admin Notları
                              </h4>
                              <p className="text-blue-800 dark:text-blue-300">{report.admin_notes}</p>
                            </div>
                          )}

                          {/* Aksiyonlar */}
                          {report.status === 'pending' && (
                            <div className="flex flex-wrap gap-3">
                              <button
                                onClick={() => updateReportStatus(report.id, 'resolved')}
                                disabled={updating}
                                className="flex-1 py-2 bg-green-500 hover:bg-green-600 text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                              >
                                <CheckCircle className="h-4 w-4" />
                                Çözüldü
                              </button>
                              <button
                                onClick={() => updateReportStatus(report.id, 'rejected')}
                                disabled={updating}
                                className="flex-1 py-2 bg-gray-500 hover:bg-gray-600 text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                              >
                                <XCircle className="h-4 w-4" />
                                Reddet
                              </button>
                              <button
                                onClick={() => deleteQuestion(report.question_id, report.id)}
                                disabled={updating}
                                className="py-2 px-4 bg-red-500 hover:bg-red-600 text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                              >
                                <Trash2 className="h-4 w-4" />
                                Soruyu Sil
                              </button>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

