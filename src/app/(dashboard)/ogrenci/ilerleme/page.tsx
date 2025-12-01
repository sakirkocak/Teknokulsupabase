'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { useProfile, useStudentProfile } from '@/hooks/useProfile'
import { createClient } from '@/lib/supabase/client'
import { motion } from 'framer-motion'
import { 
  TrendingUp,
  Target,
  CheckCircle,
  Clock,
  FileText,
  Brain,
  Award,
  Calendar,
  ArrowUp,
  ArrowDown,
  Minus
} from 'lucide-react'

export default function StudentProgressPage() {
  const { profile, loading: profileLoading } = useProfile()
  const { studentProfile, loading: studentLoading } = useStudentProfile(profile?.id || '')
  const [stats, setStats] = useState({
    totalTasks: 0,
    completedTasks: 0,
    totalExams: 0,
    avgNet: 0,
    lastMonthNet: 0,
    thisMonthNet: 0,
  })
  const [exams, setExams] = useState<any[]>([])
  const [activities, setActivities] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    if (studentProfile?.id) {
      loadProgressData()
    }
  }, [studentProfile?.id])

  async function loadProgressData() {
    setLoading(true)

    // Görev istatistikleri
    const { count: totalTasks } = await supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true })
      .eq('student_id', studentProfile?.id)

    const { count: completedTasks } = await supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true })
      .eq('student_id', studentProfile?.id)
      .eq('status', 'completed')

    // Deneme sonuçları
    const { data: examData } = await supabase
      .from('exam_results')
      .select('*')
      .eq('student_id', studentProfile?.id)
      .eq('status', 'approved')
      .order('exam_date', { ascending: false })

    if (examData) {
      setExams(examData)

      const avgNet = examData.length > 0
        ? examData.reduce((acc, e) => acc + (e.net_score || 0), 0) / examData.length
        : 0

      // Son 30 gün ve önceki 30 gün karşılaştırması
      const now = new Date()
      const thisMonth = examData.filter(e => {
        const examDate = new Date(e.exam_date)
        const diffDays = (now.getTime() - examDate.getTime()) / (1000 * 60 * 60 * 24)
        return diffDays <= 30
      })
      const lastMonth = examData.filter(e => {
        const examDate = new Date(e.exam_date)
        const diffDays = (now.getTime() - examDate.getTime()) / (1000 * 60 * 60 * 24)
        return diffDays > 30 && diffDays <= 60
      })

      const thisMonthAvg = thisMonth.length > 0
        ? thisMonth.reduce((acc, e) => acc + (e.net_score || 0), 0) / thisMonth.length
        : 0
      const lastMonthAvg = lastMonth.length > 0
        ? lastMonth.reduce((acc, e) => acc + (e.net_score || 0), 0) / lastMonth.length
        : 0

      setStats({
        totalTasks: totalTasks || 0,
        completedTasks: completedTasks || 0,
        totalExams: examData.length,
        avgNet,
        thisMonthNet: thisMonthAvg,
        lastMonthNet: lastMonthAvg,
      })
    }

    // Aktivite logları
    const { data: activityData } = await supabase
      .from('activity_logs')
      .select('*')
      .eq('student_id', studentProfile?.id)
      .order('created_at', { ascending: false })
      .limit(10)

    if (activityData) {
      setActivities(activityData)
    }

    setLoading(false)
  }

  const pageLoading = profileLoading || studentLoading || loading

  if (pageLoading) {
    return (
      <DashboardLayout role="ogrenci">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" />
        </div>
      </DashboardLayout>
    )
  }

  const taskCompletionRate = stats.totalTasks > 0 
    ? Math.round((stats.completedTasks / stats.totalTasks) * 100) 
    : 0

  const netChange = stats.thisMonthNet - stats.lastMonthNet
  const netChangePercent = stats.lastMonthNet > 0 
    ? ((netChange / stats.lastMonthNet) * 100).toFixed(1)
    : 0

  return (
    <DashboardLayout role="ogrenci">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-surface-900">İlerleme Raporum</h1>
          <p className="text-surface-500">Gelişimini detaylı takip et</p>
        </div>

        {/* Overview Stats */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card p-6"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary-50 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-primary-500" />
              </div>
              <div>
                <div className="text-2xl font-bold text-surface-900">{stats.avgNet.toFixed(1)}</div>
                <div className="text-sm text-surface-500">Ortalama Net</div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="card p-6"
          >
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                netChange > 0 ? 'bg-green-50' : netChange < 0 ? 'bg-red-50' : 'bg-surface-100'
              }`}>
                {netChange > 0 ? (
                  <ArrowUp className="w-6 h-6 text-green-500" />
                ) : netChange < 0 ? (
                  <ArrowDown className="w-6 h-6 text-red-500" />
                ) : (
                  <Minus className="w-6 h-6 text-surface-400" />
                )}
              </div>
              <div>
                <div className={`text-2xl font-bold ${
                  netChange > 0 ? 'text-green-600' : netChange < 0 ? 'text-red-600' : 'text-surface-900'
                }`}>
                  {netChange > 0 ? '+' : ''}{netChange.toFixed(1)}
                </div>
                <div className="text-sm text-surface-500">Son 30 Gün Değişim</div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="card p-6"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-secondary-50 rounded-xl flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-secondary-500" />
              </div>
              <div>
                <div className="text-2xl font-bold text-surface-900">{taskCompletionRate}%</div>
                <div className="text-sm text-surface-500">Görev Başarısı</div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="card p-6"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-accent-50 rounded-xl flex items-center justify-center">
                <FileText className="w-6 h-6 text-accent-500" />
              </div>
              <div>
                <div className="text-2xl font-bold text-surface-900">{stats.totalExams}</div>
                <div className="text-sm text-surface-500">Toplam Deneme</div>
              </div>
            </div>
          </motion.div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Exam History Chart */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-surface-900 mb-4">Deneme Geçmişi</h3>
            {exams.length > 0 ? (
              <div className="space-y-4">
                {exams.slice(0, 8).map((exam, index) => {
                  const maxNet = Math.max(...exams.map(e => e.net_score || 0), 100)
                  const percentage = ((exam.net_score || 0) / maxNet) * 100

                  return (
                    <div key={exam.id} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-surface-600">{exam.exam_name}</span>
                        <span className="font-medium text-surface-900">{exam.net_score?.toFixed(1)} net</span>
                      </div>
                      <div className="h-2 bg-surface-100 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${percentage}%` }}
                          transition={{ delay: index * 0.1, duration: 0.5 }}
                          className="h-full bg-gradient-to-r from-primary-400 to-primary-600 rounded-full"
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 mx-auto mb-3 text-surface-300" />
                <p className="text-surface-500">Henüz onaylı deneme sonucu yok</p>
              </div>
            )}
          </div>

          {/* Task Progress */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-surface-900 mb-4">Görev İlerlemesi</h3>
            
            <div className="flex items-center justify-center mb-6">
              <div className="relative w-40 h-40">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="80"
                    cy="80"
                    r="70"
                    stroke="#f4f4f5"
                    strokeWidth="12"
                    fill="none"
                  />
                  <motion.circle
                    cx="80"
                    cy="80"
                    r="70"
                    stroke="url(#progressGradient)"
                    strokeWidth="12"
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray={440}
                    initial={{ strokeDashoffset: 440 }}
                    animate={{ strokeDashoffset: 440 - (440 * taskCompletionRate) / 100 }}
                    transition={{ duration: 1, ease: "easeOut" }}
                  />
                  <defs>
                    <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#22c55e" />
                      <stop offset="100%" stopColor="#16a34a" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-bold text-surface-900">{taskCompletionRate}%</span>
                  <span className="text-sm text-surface-500">Tamamlandı</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="p-3 bg-surface-50 rounded-xl">
                <div className="text-xl font-bold text-surface-900">{stats.completedTasks}</div>
                <div className="text-sm text-surface-500">Tamamlanan</div>
              </div>
              <div className="p-3 bg-surface-50 rounded-xl">
                <div className="text-xl font-bold text-surface-900">{stats.totalTasks - stats.completedTasks}</div>
                <div className="text-sm text-surface-500">Bekleyen</div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-surface-900 mb-4">Son Aktiviteler</h3>
          {activities.length > 0 ? (
            <div className="space-y-4">
              {activities.map((activity) => (
                <div key={activity.id} className="flex items-center gap-4 p-3 bg-surface-50 rounded-xl">
                  <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                    <Target className="w-5 h-5 text-primary-600" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-surface-900">{activity.activity_type}</div>
                    <div className="text-sm text-surface-500">
                      {activity.subject && `${activity.subject} • `}
                      D: {activity.correct_count} Y: {activity.wrong_count}
                    </div>
                  </div>
                  <div className="text-sm text-surface-400">
                    {new Date(activity.created_at).toLocaleDateString('tr-TR')}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Calendar className="w-12 h-12 mx-auto mb-3 text-surface-300" />
              <p className="text-surface-500">Henüz aktivite kaydı yok</p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}

