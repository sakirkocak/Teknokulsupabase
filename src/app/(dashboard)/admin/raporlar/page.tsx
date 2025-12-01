'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { useProfile } from '@/hooks/useProfile'
import { createClient } from '@/lib/supabase/client'
import { motion } from 'framer-motion'
import { 
  BarChart3,
  Users,
  Target,
  ClipboardList,
  FileText,
  TrendingUp,
  TrendingDown,
  Calendar,
  Download,
  Activity
} from 'lucide-react'

export default function AdminReportsPage() {
  const { profile, loading: profileLoading } = useProfile()
  const [stats, setStats] = useState({
    dailySignups: 0,
    weeklySignups: 0,
    monthlySignups: 0,
    activeCoachings: 0,
    completedTasks: 0,
    pendingTasks: 0,
    approvedExams: 0,
    avgNet: 0,
  })
  const [recentUsers, setRecentUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    loadReports()
  }, [])

  async function loadReports() {
    setLoading(true)

    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)

    // Günlük kayıtlar
    const { count: dailySignups } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', today.toISOString())

    // Haftalık kayıtlar
    const { count: weeklySignups } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', weekAgo.toISOString())

    // Aylık kayıtlar
    const { count: monthlySignups } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', monthAgo.toISOString())

    // Aktif koçluklar
    const { count: activeCoachings } = await supabase
      .from('coaching_relationships')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active')

    // Tamamlanan görevler
    const { count: completedTasks } = await supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'completed')

    // Bekleyen görevler
    const { count: pendingTasks } = await supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true })
      .neq('status', 'completed')

    // Onaylanan denemeler
    const { data: examData } = await supabase
      .from('exam_results')
      .select('net_score')
      .eq('status', 'approved')

    const avgNet = examData && examData.length > 0
      ? examData.reduce((acc, e) => acc + (e.net_score || 0), 0) / examData.length
      : 0

    setStats({
      dailySignups: dailySignups || 0,
      weeklySignups: weeklySignups || 0,
      monthlySignups: monthlySignups || 0,
      activeCoachings: activeCoachings || 0,
      completedTasks: completedTasks || 0,
      pendingTasks: pendingTasks || 0,
      approvedExams: examData?.length || 0,
      avgNet,
    })

    // Son kayıtlar
    const { data: users } = await supabase
      .from('profiles')
      .select('id, full_name, role, created_at')
      .order('created_at', { ascending: false })
      .limit(10)

    if (users) setRecentUsers(users)

    setLoading(false)
  }

  if (profileLoading || loading) {
    return (
      <DashboardLayout role="admin">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" />
        </div>
      </DashboardLayout>
    )
  }

  const reportCards = [
    { 
      label: 'Bugün Kayıt', 
      value: stats.dailySignups, 
      icon: Users, 
      color: 'from-blue-400 to-blue-600',
      trend: stats.dailySignups > 0 ? 'up' : 'neutral'
    },
    { 
      label: 'Bu Hafta Kayıt', 
      value: stats.weeklySignups, 
      icon: Users, 
      color: 'from-purple-400 to-purple-600',
      trend: 'up'
    },
    { 
      label: 'Bu Ay Kayıt', 
      value: stats.monthlySignups, 
      icon: Users, 
      color: 'from-pink-400 to-pink-600',
      trend: 'up'
    },
    { 
      label: 'Aktif Koçluk', 
      value: stats.activeCoachings, 
      icon: Target, 
      color: 'from-green-400 to-green-600',
      trend: 'up'
    },
    { 
      label: 'Tamamlanan Görev', 
      value: stats.completedTasks, 
      icon: ClipboardList, 
      color: 'from-teal-400 to-teal-600',
      trend: 'up'
    },
    { 
      label: 'Bekleyen Görev', 
      value: stats.pendingTasks, 
      icon: ClipboardList, 
      color: 'from-yellow-400 to-yellow-600',
      trend: 'neutral'
    },
    { 
      label: 'Onaylı Deneme', 
      value: stats.approvedExams, 
      icon: FileText, 
      color: 'from-indigo-400 to-indigo-600',
      trend: 'up'
    },
    { 
      label: 'Ortalama Net', 
      value: stats.avgNet.toFixed(1), 
      icon: TrendingUp, 
      color: 'from-orange-400 to-orange-600',
      trend: stats.avgNet > 30 ? 'up' : 'down'
    },
  ]

  const roleLabels: Record<string, string> = {
    ogretmen: 'Öğretmen',
    ogrenci: 'Öğrenci',
    veli: 'Veli',
    admin: 'Admin',
  }

  return (
    <DashboardLayout role="admin">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-surface-900">Platform Raporları</h1>
            <p className="text-surface-500">Detaylı platform istatistikleri ve analizler</p>
          </div>
          <button className="btn btn-outline btn-md">
            <Download className="w-4 h-4" />
            Rapor İndir
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {reportCards.map((card, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="card p-5"
            >
              <div className="flex items-start justify-between">
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center text-white`}>
                  <card.icon className="w-5 h-5" />
                </div>
                {card.trend === 'up' && <TrendingUp className="w-5 h-5 text-green-500" />}
                {card.trend === 'down' && <TrendingDown className="w-5 h-5 text-red-500" />}
              </div>
              <div className="mt-4">
                <div className="text-2xl font-bold text-surface-900">{card.value}</div>
                <div className="text-sm text-surface-500">{card.label}</div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Platform Health */}
          <div className="card p-6">
            <div className="flex items-center gap-3 mb-6">
              <Activity className="w-6 h-6 text-secondary-500" />
              <h2 className="text-lg font-semibold text-surface-900">Platform Sağlığı</h2>
            </div>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-surface-600">Görev Tamamlama Oranı</span>
                  <span className="font-medium text-surface-900">
                    {stats.completedTasks + stats.pendingTasks > 0 
                      ? Math.round((stats.completedTasks / (stats.completedTasks + stats.pendingTasks)) * 100)
                      : 0}%
                  </span>
                </div>
                <div className="h-2 bg-surface-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-green-400 to-green-600 rounded-full"
                    style={{ 
                      width: `${stats.completedTasks + stats.pendingTasks > 0 
                        ? (stats.completedTasks / (stats.completedTasks + stats.pendingTasks)) * 100
                        : 0}%` 
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-surface-600">Koçluk Aktifliği</span>
                  <span className="font-medium text-surface-900">
                    {stats.activeCoachings} aktif
                  </span>
                </div>
                <div className="h-2 bg-surface-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-primary-400 to-primary-600 rounded-full"
                    style={{ width: `${Math.min(stats.activeCoachings * 10, 100)}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-surface-600">Ortalama Net Performansı</span>
                  <span className="font-medium text-surface-900">{stats.avgNet.toFixed(1)} / 100</span>
                </div>
                <div className="h-2 bg-surface-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-accent-400 to-accent-600 rounded-full"
                    style={{ width: `${stats.avgNet}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Recent Signups */}
          <div className="card p-6">
            <div className="flex items-center gap-3 mb-6">
              <Calendar className="w-6 h-6 text-primary-500" />
              <h2 className="text-lg font-semibold text-surface-900">Son Kayıtlar</h2>
            </div>
            <div className="space-y-3">
              {recentUsers.map((user, i) => (
                <div key={user.id} className="flex items-center justify-between p-3 bg-surface-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center text-primary-600 font-medium text-sm">
                      {i + 1}
                    </div>
                    <div>
                      <div className="font-medium text-surface-900 text-sm">{user.full_name}</div>
                      <div className="text-xs text-surface-500">{roleLabels[user.role] || user.role}</div>
                    </div>
                  </div>
                  <div className="text-xs text-surface-400">
                    {new Date(user.created_at).toLocaleDateString('tr-TR')}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

