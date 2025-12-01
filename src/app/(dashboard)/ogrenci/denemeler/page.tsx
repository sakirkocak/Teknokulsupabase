'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { useProfile, useStudentProfile } from '@/hooks/useProfile'
import { createClient } from '@/lib/supabase/client'
import { motion } from 'framer-motion'
import { 
  FileText, 
  Plus,
  CheckCircle,
  Clock,
  XCircle,
  TrendingUp,
  Upload
} from 'lucide-react'

export default function ExamResultsPage() {
  const { profile, loading: profileLoading } = useProfile()
  const { studentProfile, loading: studentLoading } = useStudentProfile(profile?.id || '')
  const [exams, setExams] = useState<any[]>([])
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [form, setForm] = useState({
    exam_name: '',
    exam_date: '',
    total_correct: '',
    total_wrong: '',
    total_empty: '',
  })
  const supabase = createClient()

  useEffect(() => {
    if (studentProfile?.id) {
      loadExams()
    }
  }, [studentProfile?.id])

  async function loadExams() {
    const { data } = await supabase
      .from('exam_results')
      .select('*')
      .eq('student_id', studentProfile?.id)
      .order('exam_date', { ascending: false })

    if (data) {
      setExams(data)
    }
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault()
    setUploading(true)

    const correct = parseInt(form.total_correct) || 0
    const wrong = parseInt(form.total_wrong) || 0
    const empty = parseInt(form.total_empty) || 0
    const net = correct - (wrong * 0.25)

    const { error } = await supabase
      .from('exam_results')
      .insert({
        student_id: studentProfile?.id,
        exam_name: form.exam_name,
        exam_date: form.exam_date,
        total_correct: correct,
        total_wrong: wrong,
        total_empty: empty,
        net_score: net,
        status: 'pending',
      })

    if (error) {
      alert('Hata: ' + error.message)
    } else {
      setShowUploadModal(false)
      setForm({ exam_name: '', exam_date: '', total_correct: '', total_wrong: '', total_empty: '' })
      loadExams()
    }

    setUploading(false)
  }

  const loading = profileLoading || studentLoading

  if (loading) {
    return (
      <DashboardLayout role="ogrenci">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" />
        </div>
      </DashboardLayout>
    )
  }

  const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
    pending: { label: 'Onay Bekliyor', color: 'bg-yellow-50 text-yellow-600', icon: Clock },
    approved: { label: 'Onaylandı', color: 'bg-green-50 text-green-600', icon: CheckCircle },
    rejected: { label: 'Reddedildi', color: 'bg-red-50 text-red-600', icon: XCircle },
  }

  return (
    <DashboardLayout role="ogrenci">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-surface-900">Deneme Sonuçlarım</h1>
            <p className="text-surface-500">Deneme sınavlarını yükle ve takip et</p>
          </div>
          <button 
            onClick={() => setShowUploadModal(true)}
            className="btn btn-primary btn-md"
          >
            <Plus className="w-5 h-5" />
            Sonuç Yükle
          </button>
        </div>

        {/* Stats */}
        {exams.length > 0 && (
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="card p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary-50 rounded-xl flex items-center justify-center">
                  <FileText className="w-6 h-6 text-primary-500" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-surface-900">{exams.length}</div>
                  <div className="text-sm text-surface-500">Toplam Deneme</div>
                </div>
              </div>
            </div>
            <div className="card p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-secondary-50 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-secondary-500" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-surface-900">
                    {exams.length > 0 
                      ? (exams.reduce((acc, e) => acc + (e.net_score || 0), 0) / exams.length).toFixed(1)
                      : '0'
                    }
                  </div>
                  <div className="text-sm text-surface-500">Ortalama Net</div>
                </div>
              </div>
            </div>
            <div className="card p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-accent-50 rounded-xl flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-accent-500" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-surface-900">
                    {exams.filter(e => e.status === 'approved').length}
                  </div>
                  <div className="text-sm text-surface-500">Onaylanan</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Exams List */}
        {exams.length > 0 ? (
          <div className="space-y-4">
            {exams.map((exam, index) => {
              const config = statusConfig[exam.status] || statusConfig.pending
              const StatusIcon = config.icon

              return (
                <motion.div
                  key={exam.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="card p-6"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-12 h-12 bg-gradient-to-br from-primary-400 to-primary-600 rounded-xl flex items-center justify-center text-white font-bold">
                        {exam.exam_name?.charAt(0) || 'D'}
                      </div>
                      <div>
                        <h3 className="font-semibold text-surface-900">{exam.exam_name}</h3>
                        <p className="text-sm text-surface-500">
                          {new Date(exam.exam_date).toLocaleDateString('tr-TR')}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <div className="text-xl font-bold text-secondary-500">{exam.total_correct || 0}</div>
                        <div className="text-xs text-surface-500">Doğru</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xl font-bold text-red-500">{exam.total_wrong || 0}</div>
                        <div className="text-xs text-surface-500">Yanlış</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xl font-bold text-surface-400">{exam.total_empty || 0}</div>
                        <div className="text-xs text-surface-500">Boş</div>
                      </div>
                      <div className="text-center px-4 py-2 bg-primary-50 rounded-lg">
                        <div className="text-xl font-bold text-primary-600">{exam.net_score?.toFixed(2) || 0}</div>
                        <div className="text-xs text-primary-500">Net</div>
                      </div>
                    </div>

                    <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium ${config.color}`}>
                      <StatusIcon className="w-4 h-4" />
                      {config.label}
                    </span>
                  </div>
                </motion.div>
              )
            })}
          </div>
        ) : (
          <div className="card p-12 text-center">
            <FileText className="w-16 h-16 mx-auto mb-4 text-surface-300" />
            <h3 className="text-lg font-medium text-surface-900 mb-2">Henüz deneme sonucu yok</h3>
            <p className="text-surface-500 mb-4">İlk deneme sonucunu yükle ve gelişimini takip et.</p>
            <button 
              onClick={() => setShowUploadModal(true)}
              className="btn btn-primary btn-md"
            >
              <Upload className="w-5 h-5" />
              Sonuç Yükle
            </button>
          </div>
        )}

        {/* Upload Modal */}
        {showUploadModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="card p-6 w-full max-w-md"
            >
              <h2 className="text-xl font-bold text-surface-900 mb-4">Deneme Sonucu Yükle</h2>
              
              <form onSubmit={handleUpload} className="space-y-4">
                <div>
                  <label className="label">Deneme Adı</label>
                  <input
                    type="text"
                    value={form.exam_name}
                    onChange={(e) => setForm({ ...form, exam_name: e.target.value })}
                    className="input"
                    placeholder="Örn: TYT Deneme 1"
                    required
                  />
                </div>
                
                <div>
                  <label className="label">Sınav Tarihi</label>
                  <input
                    type="date"
                    value={form.exam_date}
                    onChange={(e) => setForm({ ...form, exam_date: e.target.value })}
                    className="input"
                    required
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="label">Doğru</label>
                    <input
                      type="number"
                      value={form.total_correct}
                      onChange={(e) => setForm({ ...form, total_correct: e.target.value })}
                      className="input"
                      min="0"
                      required
                    />
                  </div>
                  <div>
                    <label className="label">Yanlış</label>
                    <input
                      type="number"
                      value={form.total_wrong}
                      onChange={(e) => setForm({ ...form, total_wrong: e.target.value })}
                      className="input"
                      min="0"
                      required
                    />
                  </div>
                  <div>
                    <label className="label">Boş</label>
                    <input
                      type="number"
                      value={form.total_empty}
                      onChange={(e) => setForm({ ...form, total_empty: e.target.value })}
                      className="input"
                      min="0"
                      required
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button 
                    type="button"
                    onClick={() => setShowUploadModal(false)}
                    className="btn btn-ghost btn-md flex-1"
                  >
                    İptal
                  </button>
                  <button 
                    type="submit"
                    disabled={uploading}
                    className="btn btn-primary btn-md flex-1"
                  >
                    {uploading ? 'Yükleniyor...' : 'Kaydet'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

