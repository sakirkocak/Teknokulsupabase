'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { useProfile, useParentProfile } from '@/hooks/useProfile'
import { createClient } from '@/lib/supabase/client'
import { getInitials } from '@/lib/utils'
import { motion } from 'framer-motion'
import { 
  ArrowLeft,
  TrendingUp,
  Target,
  CheckCircle,
  Clock,
  FileText,
  ClipboardList,
  Calendar,
  User
} from 'lucide-react'

export default function ChildDetailPage() {
  const params = useParams()
  const { profile, loading: profileLoading } = useProfile()
  const { parentProfile, loading: parentLoading } = useParentProfile(profile?.id || '')
  const [child, setChild] = useState<any>(null)
  const [tasks, setTasks] = useState<any[]>([])
  const [exams, setExams] = useState<any[]>([])
  const [coach, setCoach] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    if (params.id) {
      loadChildData()
    }
  }, [params.id])

  async function loadChildData() {
    setLoading(true)

    // Çocuk bilgisi
    const { data: childData } = await supabase
      .from('student_profiles')
      .select(`
        *,
        profile:profiles!student_profiles_user_id_fkey(full_name, avatar_url, email)
      `)
      .eq('id', params.id)
      .single()

    if (childData) {
      setChild(childData)
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
      .eq('status', 'approved')
      .order('exam_date', { ascending: false })

    if (examData) {
      setExams(examData)
    }

    // Koç bilgisi
    const { data: coachData } = await supabase
      .from('coaching_relationships')
      .select(`
        coach:teacher_profiles!coaching_relationships_coach_id_fkey(
          profile:profiles!teacher_profiles_user_id_fkey(full_name, avatar_url)
        )
      `)
      .eq('student_id', params.id)
      .eq('status', 'active')
      .single()

    if (coachData?.coach) {
      setCoach(coachData.coach)
    }

    setLoading(false)
  }

  const pageLoading = profileLoading || parentLoading || loading

  if (pageLoading) {
    return (
      <DashboardLayout role="veli">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" />
        </div>
      </DashboardLayout>
    )
  }

  if (!child) {
    return (
      <DashboardLayout role="veli">
        <div className="text-center py-12">
          <h2 className="text-xl font-bold text-surface-900">Çocuk bulunamadı</h2>
          <Link href="/veli" className="text-primary-500 mt-2 inline-block">
            Ana sayfaya dön
          </Link>
        </div>
      </DashboardLayout>
    )
  }

  const completedTasks = tasks.filter(t => t.status === 'completed').length
  const taskRate = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0
  const avgNet = exams.length > 0 
    ? (exams.reduce((acc, e) => acc + (e.net_score || 0), 0) / exams.length).toFixed(1)
    : '0'

  return (
    <DashboardLayout role="veli">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <Link href="/veli" className="inline-flex items-center gap-2 text-surface-600 hover:text-primary-500 mb-4">
            <ArrowLeft className="w-4 h-4" />
            Geri Dön
          </Link>
        </div>

        {/* Child Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card p-6 bg-gradient-to-r from-accent-500 to-accent-600 text-white"
        >
          <div className="flex flex-col sm:flex-row items-start gap-6">
            <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center text-2xl font-bold overflow-hidden">
              {child.profile?.avatar_url ? (
                <img src={child.profile.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                getInitials(child.profile?.full_name)
              )}
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold mb-1">{child.profile?.full_name}</h1>
              <p className="text-accent-100">
                {child.grade_level}
                {child.school_name && ` • ${child.school_name}`}
              </p>
              {child.target_exam && (
                <div className="inline-flex items-center gap-1 mt-2 bg-white/20 px-3 py-1 rounded-full text-sm">
                  <Target className="w-4 h-4" />
                  {child.target_exam}
                </div>
              )}
            </div>
            {coach && (
              <div className="bg-white/10 rounded-xl p-4">
                <div className="text-sm text-accent-100 mb-1">Koçu</div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center text-sm font-medium overflow-hidden">
                    {coach.profile?.avatar_url ? (
                      <img src={coach.profile.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      getInitials(coach.profile?.full_name)
                    )}
                  </div>
                  <span className="font-medium">{coach.profile?.full_name}</span>
                </div>
              </div>
            )}
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
                <div className="text-xl font-bold text-surface-900">{taskRate}%</div>
                <div className="text-sm text-surface-500">Başarı Oranı</div>
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
          {/* Recent Tasks */}
          <div className="card">
            <div className="p-6 border-b border-surface-100">
              <h2 className="text-lg font-semibold text-surface-900">Son Görevler</h2>
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
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    task.status === 'completed' ? 'bg-secondary-50 text-secondary-600' :
                    task.status === 'pending' ? 'bg-yellow-50 text-yellow-600' :
                    'bg-accent-50 text-accent-600'
                  }`}>
                    {task.status === 'completed' ? 'Tamamlandı' : 
                     task.status === 'pending' ? 'Bekliyor' : 'Devam Ediyor'}
                  </span>
                </div>
              )) : (
                <div className="p-8 text-center">
                  <ClipboardList className="w-12 h-12 mx-auto mb-3 text-surface-300" />
                  <p className="text-surface-500">Henüz görev atanmamış</p>
                </div>
              )}
            </div>
          </div>

          {/* Exam Results */}
          <div className="card">
            <div className="p-6 border-b border-surface-100">
              <h2 className="text-lg font-semibold text-surface-900">Deneme Sonuçları</h2>
            </div>
            <div className="divide-y divide-surface-100">
              {exams.length > 0 ? exams.slice(0, 5).map((exam) => (
                <div key={exam.id} className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <div className="font-medium text-surface-900">{exam.exam_name}</div>
                      <div className="text-sm text-surface-500">
                        {new Date(exam.exam_date).toLocaleDateString('tr-TR')}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-primary-500">{exam.net_score?.toFixed(1)}</div>
                      <div className="text-xs text-surface-500">Net</div>
                    </div>
                  </div>
                  <div className="flex gap-4 text-sm">
                    <span className="text-secondary-600">D: {exam.total_correct}</span>
                    <span className="text-red-500">Y: {exam.total_wrong}</span>
                    <span className="text-surface-400">B: {exam.total_empty}</span>
                  </div>
                </div>
              )) : (
                <div className="p-8 text-center">
                  <FileText className="w-12 h-12 mx-auto mb-3 text-surface-300" />
                  <p className="text-surface-500">Henüz onaylı deneme sonucu yok</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

