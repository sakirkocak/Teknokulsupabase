'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'

import { useProfile } from '@/hooks/useProfile'
import { createClient } from '@/lib/supabase/client'
import { getInitials } from '@/lib/utils'
import { motion } from 'framer-motion'
import { 
  ClipboardList,
  FileText,
  Search,
  Trash2,
  Eye,
  Filter,
  CheckCircle,
  Clock,
  XCircle
} from 'lucide-react'

export default function AdminContentPage() {
  const { profile, loading: profileLoading } = useProfile()
  const [activeTab, setActiveTab] = useState<'tasks' | 'exams'>('tasks')
  const [tasks, setTasks] = useState<any[]>([])
  const [exams, setExams] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const supabase = createClient()

  useEffect(() => {
    loadContent()
  }, [activeTab])

  async function loadContent() {
    setLoading(true)

    if (activeTab === 'tasks') {
      const { data } = await supabase
        .from('tasks')
        .select(`
          *,
          student:student_profiles!tasks_student_id_fkey(
            profile:profiles!student_profiles_user_id_fkey(full_name)
          ),
          coach:teacher_profiles!tasks_coach_id_fkey(
            profile:profiles!teacher_profiles_user_id_fkey(full_name)
          )
        `)
        .order('created_at', { ascending: false })
        .limit(50)

      if (data) setTasks(data)
    } else {
      const { data } = await supabase
        .from('exam_results')
        .select(`
          *,
          student:student_profiles!exam_results_student_id_fkey(
            profile:profiles!student_profiles_user_id_fkey(full_name)
          )
        `)
        .order('created_at', { ascending: false })
        .limit(50)

      if (data) setExams(data)
    }

    setLoading(false)
  }

  async function deleteTask(taskId: string) {
    if (!confirm('Bu görevi silmek istediğinize emin misiniz?')) return

    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId)

    if (!error) {
      setTasks(prev => prev.filter(t => t.id !== taskId))
    }
  }

  async function deleteExam(examId: string) {
    if (!confirm('Bu deneme sonucunu silmek istediğinize emin misiniz?')) return

    const { error } = await supabase
      .from('exam_results')
      .delete()
      .eq('id', examId)

    if (!error) {
      setExams(prev => prev.filter(e => e.id !== examId))
    }
  }

  const filteredTasks = tasks.filter(t => 
    !search || 
    t.title?.toLowerCase().includes(search.toLowerCase()) ||
    t.student?.profile?.full_name?.toLowerCase().includes(search.toLowerCase())
  )

  const filteredExams = exams.filter(e =>
    !search ||
    e.exam_name?.toLowerCase().includes(search.toLowerCase()) ||
    e.student?.profile?.full_name?.toLowerCase().includes(search.toLowerCase())
  )

  const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
    pending: { label: 'Bekliyor', color: 'bg-yellow-50 text-yellow-600', icon: Clock },
    in_progress: { label: 'Devam Ediyor', color: 'bg-blue-50 text-blue-600', icon: Clock },
    completed: { label: 'Tamamlandı', color: 'bg-green-50 text-green-600', icon: CheckCircle },
    approved: { label: 'Onaylandı', color: 'bg-green-50 text-green-600', icon: CheckCircle },
    rejected: { label: 'Reddedildi', color: 'bg-red-50 text-red-600', icon: XCircle },
  }

  if (profileLoading || loading) {
    return (
      <>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" />
        </div>
      </>
    )
  }

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-surface-900">İçerik Yönetimi</h1>
          <p className="text-surface-500">Görevleri ve deneme sonuçlarını yönet</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('tasks')}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors flex items-center gap-2 ${
              activeTab === 'tasks'
                ? 'bg-primary-500 text-white'
                : 'bg-surface-100 text-surface-600 hover:bg-surface-200'
            }`}
          >
            <ClipboardList className="w-4 h-4" />
            Görevler ({tasks.length})
          </button>
          <button
            onClick={() => setActiveTab('exams')}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors flex items-center gap-2 ${
              activeTab === 'exams'
                ? 'bg-primary-500 text-white'
                : 'bg-surface-100 text-surface-600 hover:bg-surface-200'
            }`}
          >
            <FileText className="w-4 h-4" />
            Denemeler ({exams.length})
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Ara..."
            className="input pl-12"
          />
        </div>

        {/* Content Table */}
        <div className="card overflow-hidden">
          {activeTab === 'tasks' ? (
            <table className="w-full">
              <thead className="bg-surface-50 border-b border-surface-100">
                <tr>
                  <th className="text-left p-4 font-medium text-surface-600">Görev</th>
                  <th className="text-left p-4 font-medium text-surface-600">Öğrenci</th>
                  <th className="text-left p-4 font-medium text-surface-600">Koç</th>
                  <th className="text-left p-4 font-medium text-surface-600">Durum</th>
                  <th className="text-left p-4 font-medium text-surface-600">Tarih</th>
                  <th className="text-right p-4 font-medium text-surface-600">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100">
                {filteredTasks.map((task) => {
                  const status = statusConfig[task.status] || statusConfig.pending
                  const StatusIcon = status.icon

                  return (
                    <tr key={task.id} className="hover:bg-surface-50">
                      <td className="p-4">
                        <div className="font-medium text-surface-900">{task.title}</div>
                        <div className="text-sm text-surface-500 capitalize">{task.type}</div>
                      </td>
                      <td className="p-4 text-surface-600">
                        {task.student?.profile?.full_name || '-'}
                      </td>
                      <td className="p-4 text-surface-600">
                        {task.coach?.profile?.full_name || '-'}
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${status.color}`}>
                          <StatusIcon className="w-3 h-3" />
                          {status.label}
                        </span>
                      </td>
                      <td className="p-4 text-surface-600 text-sm">
                        {new Date(task.created_at).toLocaleDateString('tr-TR')}
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => deleteTask(task.id)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          ) : (
            <table className="w-full">
              <thead className="bg-surface-50 border-b border-surface-100">
                <tr>
                  <th className="text-left p-4 font-medium text-surface-600">Deneme</th>
                  <th className="text-left p-4 font-medium text-surface-600">Öğrenci</th>
                  <th className="text-left p-4 font-medium text-surface-600">Net</th>
                  <th className="text-left p-4 font-medium text-surface-600">Durum</th>
                  <th className="text-left p-4 font-medium text-surface-600">Tarih</th>
                  <th className="text-right p-4 font-medium text-surface-600">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100">
                {filteredExams.map((exam) => {
                  const status = statusConfig[exam.status] || statusConfig.pending
                  const StatusIcon = status.icon

                  return (
                    <tr key={exam.id} className="hover:bg-surface-50">
                      <td className="p-4">
                        <div className="font-medium text-surface-900">{exam.exam_name}</div>
                      </td>
                      <td className="p-4 text-surface-600">
                        {exam.student?.profile?.full_name || '-'}
                      </td>
                      <td className="p-4">
                        <span className="font-medium text-primary-600">
                          {exam.net_score?.toFixed(1) || '-'}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${status.color}`}>
                          <StatusIcon className="w-3 h-3" />
                          {status.label}
                        </span>
                      </td>
                      <td className="p-4 text-surface-600 text-sm">
                        {new Date(exam.exam_date).toLocaleDateString('tr-TR')}
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => deleteExam(exam.id)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}

          {((activeTab === 'tasks' && filteredTasks.length === 0) ||
            (activeTab === 'exams' && filteredExams.length === 0)) && (
            <div className="p-12 text-center">
              {activeTab === 'tasks' ? (
                <ClipboardList className="w-12 h-12 mx-auto mb-3 text-surface-300" />
              ) : (
                <FileText className="w-12 h-12 mx-auto mb-3 text-surface-300" />
              )}
              <p className="text-surface-500">İçerik bulunamadı</p>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

