'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { useProfile, useTeacherProfile } from '@/hooks/useProfile'
import { createClient } from '@/lib/supabase/client'
import { getInitials } from '@/lib/utils'
import { motion } from 'framer-motion'
import { 
  ArrowLeft,
  ClipboardList,
  FileText,
  CheckCircle,
  Clock,
  XCircle,
  Plus,
  TrendingUp,
  MessageSquare,
  Target
} from 'lucide-react'

export default function StudentDetailPage() {
  const params = useParams()
  const { profile, loading: profileLoading } = useProfile()
  const { teacherProfile, loading: teacherLoading } = useTeacherProfile(profile?.id || '')
  const [student, setStudent] = useState<any>(null)
  const [tasks, setTasks] = useState<any[]>([])
  const [exams, setExams] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    if (params.id) {
      loadStudentData()
    }
  }, [params.id])

  async function loadStudentData() {
    setLoading(true)

    // Öğrenci bilgisi
    const { data: studentData } = await supabase
      .from('student_profiles')
      .select(`
        *,
        profile:profiles!student_profiles_user_id_fkey(full_name, avatar_url, email)
      `)
      .eq('id', params.id)
      .single()

    if (studentData) {
      setStudent(studentData)
    }

    // Görevler
    const { data: taskData } = await supabase
      .from('tasks')
      .select('*')
      .eq('student_id', params.id)
      .order('created_at', { ascending: false })

    if (taskData) {
      setTasks(taskData)
    }

    // Deneme sonuçları
    const { data: examData } = await supabase
      .from('exam_results')
      .select('*')
      .eq('student_id', params.id)
      .order('exam_date', { ascending: false })

    if (examData) {
      setExams(examData)
    }

    setLoading(false)
  }

  async function approveExam(examId: string, approve: boolean) {
    const { error } = await supabase
      .from('exam_results')
      .update({ 
        status: approve ? 'approved' : 'rejected',
        approved_by: profile?.id,
      })
      .eq('id', examId)

    if (!error) {
      loadStudentData()
    }
  }

  const pageLoading = profileLoading || teacherLoading || loading

  if (pageLoading) {
    return (
      <DashboardLayout role="koc">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" />
        </div>
      </DashboardLayout>
    )
  }

  if (!student) {
    return (
      <DashboardLayout role="koc">
        <div className="text-center py-12">
          <h2 className="text-xl font-bold text-surface-900">Öğrenci bulunamadı</h2>
          <Link href="/koc/ogrenciler" className="text-primary-500 mt-2 inline-block">
            Öğrencilere dön
          </Link>
        </div>
      </DashboardLayout>
    )
  }

  const completedTasks = tasks.filter(t => t.status === 'completed').length
  const pendingExams = exams.filter(e => e.status === 'pending')
  const avgNet = exams.length > 0 
    ? (exams.reduce((acc, e) => acc + (e.net_score || 0), 0) / exams.length).toFixed(1)
    : '0'

  return (
    <DashboardLayout role="koc">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <Link href="/koc/ogrenciler" className="inline-flex items-center gap-2 text-surface-600 hover:text-primary-500 mb-4">
            <ArrowLeft className="w-4 h-4" />
            Öğrencilere Dön
          </Link>
        </div>

        {/* Student Info */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card p-6 bg-gradient-to-r from-accent-500 to-accent-600 text-white"
        >
          <div className="flex flex-col sm:flex-row items-start gap-6">
            <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center text-2xl font-bold overflow-hidden">
              {student.profile?.avatar_url ? (
                <img src={student.profile.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                getInitials(student.profile?.full_name)
              )}
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold mb-1">{student.profile?.full_name}</h1>
              <p className="text-accent-100">{student.grade_level} • {student.school_name || 'Okul belirtilmemiş'}</p>
              {student.target_exam && (
                <div className="inline-flex items-center gap-1 mt-2 bg-white/20 px-3 py-1 rounded-full text-sm">
                  <Target className="w-4 h-4" />
                  {student.target_exam}
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <Link href={`/koc/gorevler/yeni?ogrenci=${student.id}`} className="btn bg-white/20 hover:bg-white/30 text-white btn-sm">
                <Plus className="w-4 h-4" />
                Görev Ata
              </Link>
              <Link href="/koc/mesajlar" className="btn bg-white/20 hover:bg-white/30 text-white btn-sm">
                <MessageSquare className="w-4 h-4" />
                Mesaj
              </Link>
            </div>
          </div>
        </motion.div>

        {/* Stats */}
        <div className="grid sm:grid-cols-4 gap-4">
          <div className="card p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-accent-50 rounded-lg flex items-center justify-center">
                <ClipboardList className="w-5 h-5 text-accent-500" />
              </div>
              <div>
                <div className="text-xl font-bold text-surface-900">{tasks.length}</div>
                <div className="text-sm text-surface-500">Toplam Görev</div>
              </div>
            </div>
          </div>
          <div className="card p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-secondary-50 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-secondary-500" />
              </div>
              <div>
                <div className="text-xl font-bold text-surface-900">{completedTasks}</div>
                <div className="text-sm text-surface-500">Tamamlanan</div>
              </div>
            </div>
          </div>
          <div className="card p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary-50 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-primary-500" />
              </div>
              <div>
                <div className="text-xl font-bold text-surface-900">{exams.length}</div>
                <div className="text-sm text-surface-500">Deneme</div>
              </div>
            </div>
          </div>
          <div className="card p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-yellow-50 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-yellow-500" />
              </div>
              <div>
                <div className="text-xl font-bold text-surface-900">{avgNet}</div>
                <div className="text-sm text-surface-500">Ort. Net</div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Pending Exam Approvals */}
          <div className="card">
            <div className="p-6 border-b border-surface-100">
              <h2 className="text-lg font-semibold text-surface-900">Onay Bekleyen Denemeler</h2>
              <p className="text-sm text-surface-500">Öğrencinin yüklediği sonuçları onayla</p>
            </div>
            <div className="divide-y divide-surface-100">
              {pendingExams.length > 0 ? pendingExams.map((exam) => (
                <div key={exam.id} className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <div className="font-medium text-surface-900">{exam.exam_name}</div>
                      <div className="text-sm text-surface-500">
                        {new Date(exam.exam_date).toLocaleDateString('tr-TR')}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-primary-500">{exam.net_score?.toFixed(1)} Net</div>
                      <div className="text-xs text-surface-500">
                        D:{exam.total_correct} Y:{exam.total_wrong} B:{exam.total_empty}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => approveExam(exam.id, true)}
                      className="btn btn-primary btn-sm flex-1"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Onayla
                    </button>
                    <button
                      onClick={() => approveExam(exam.id, false)}
                      className="btn btn-ghost btn-sm text-red-500 flex-1"
                    >
                      <XCircle className="w-4 h-4" />
                      Reddet
                    </button>
                  </div>
                </div>
              )) : (
                <div className="p-8 text-center">
                  <CheckCircle className="w-12 h-12 mx-auto mb-3 text-surface-300" />
                  <p className="text-surface-500">Onay bekleyen deneme yok</p>
                </div>
              )}
            </div>
          </div>

          {/* Recent Tasks */}
          <div className="card">
            <div className="p-6 border-b border-surface-100 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-surface-900">Son Görevler</h2>
                <p className="text-sm text-surface-500">Atanan görevler</p>
              </div>
              <Link href={`/koc/gorevler/yeni?ogrenci=${student.id}`} className="text-primary-500 text-sm font-medium">
                + Yeni Görev
              </Link>
            </div>
            <div className="divide-y divide-surface-100">
              {tasks.length > 0 ? tasks.slice(0, 5).map((task) => (
                <div key={task.id} className="p-4 flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    task.status === 'completed' ? 'bg-secondary-50 text-secondary-500' :
                    task.status === 'pending' ? 'bg-yellow-50 text-yellow-500' :
                    'bg-accent-50 text-accent-500'
                  }`}>
                    {task.status === 'completed' ? <CheckCircle className="w-5 h-5" /> :
                     task.status === 'pending' ? <Clock className="w-5 h-5" /> :
                     <ClipboardList className="w-5 h-5" />}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-surface-900">{task.title}</div>
                    <div className="text-sm text-surface-500 capitalize">{task.type}</div>
                  </div>
                  {task.score !== null && (
                    <span className="text-primary-500 font-medium">{task.score} puan</span>
                  )}
                </div>
              )) : (
                <div className="p-8 text-center">
                  <ClipboardList className="w-12 h-12 mx-auto mb-3 text-surface-300" />
                  <p className="text-surface-500">Henüz görev atanmamış</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

