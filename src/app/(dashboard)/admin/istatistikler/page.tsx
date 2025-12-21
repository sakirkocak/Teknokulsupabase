'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'

import { useProfile } from '@/hooks/useProfile'
import { createClient } from '@/lib/supabase/client'
import { motion } from 'framer-motion'
import { 
  TrendingUp,
  Users,
  Target,
  ClipboardList,
  FileText,
  Activity,
  Calendar
} from 'lucide-react'

export default function AdminStatsPage() {
  const { profile, loading: profileLoading } = useProfile()
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalTeachers: 0,
    totalStudents: 0,
    totalParents: 0,
    activeCoachings: 0,
    totalTasks: 0,
    completedTasks: 0,
    totalExams: 0,
    approvedExams: 0,
  })
  const [recentActivity, setRecentActivity] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    loadStats()
  }, [])

  async function loadStats() {
    setLoading(true)

    // Kullanıcı sayıları
    const { count: totalUsers } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })

    const { count: totalTeachers } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'ogretmen')

    const { count: totalStudents } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'ogrenci')

    const { count: totalParents } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'veli')

    const { count: activeCoachings } = await supabase
      .from('coaching_relationships')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active')

    const { count: totalTasks } = await supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true })

    const { count: completedTasks } = await supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'completed')

    const { count: totalExams } = await supabase
      .from('exam_results')
      .select('*', { count: 'exact', head: true })

    const { count: approvedExams } = await supabase
      .from('exam_results')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'approved')

    setStats({
      totalUsers: totalUsers || 0,
      totalTeachers: totalTeachers || 0,
      totalStudents: totalStudents || 0,
      totalParents: totalParents || 0,
      activeCoachings: activeCoachings || 0,
      totalTasks: totalTasks || 0,
      completedTasks: completedTasks || 0,
      totalExams: totalExams || 0,
      approvedExams: approvedExams || 0,
    })

    // Son aktiviteler
    const { data: recentUsers } = await supabase
      .from('profiles')
      .select('id, full_name, role, created_at')
      .order('created_at', { ascending: false })
      .limit(5)

    if (recentUsers) {
      setRecentActivity(recentUsers.map(u => ({
        type: 'user',
        title: `${u.full_name} kayıt oldu`,
        subtitle: u.role === 'ogretmen' ? 'Öğretmen' : u.role === 'ogrenci' ? 'Öğrenci' : 'Veli',
        date: u.created_at,
      })))
    }

    setLoading(false)
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

  const statCards = [
    { label: 'Toplam Kullanıcı', value: stats.totalUsers, icon: Users, color: 'from-primary-400 to-primary-600' },
    { label: 'Öğretmen/Koç', value: stats.totalTeachers, icon: Users, color: 'from-accent-400 to-accent-600' },
    { label: 'Öğrenci', value: stats.totalStudents, icon: Users, color: 'from-secondary-400 to-secondary-600' },
    { label: 'Veli', value: stats.totalParents, icon: Users, color: 'from-purple-400 to-purple-600' },
    { label: 'Aktif Koçluk', value: stats.activeCoachings, icon: Target, color: 'from-yellow-400 to-yellow-600' },
    { label: 'Toplam Görev', value: stats.totalTasks, icon: ClipboardList, color: 'from-blue-400 to-blue-600' },
    { label: 'Tamamlanan Görev', value: stats.completedTasks, icon: ClipboardList, color: 'from-green-400 to-green-600' },
    { label: 'Deneme Sonucu', value: stats.totalExams, icon: FileText, color: 'from-red-400 to-red-600' },
  ]

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-surface-900">İstatistikler</h1>
          <p className="text-surface-500">Platform genelindeki istatistikler</p>
        </div>

        {/* Stats Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="card p-6"
            >
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center text-white`}>
                  <stat.icon className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-surface-900">{stat.value}</div>
                  <div className="text-sm text-surface-500">{stat.label}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Completion Rate */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-surface-900 mb-4">Görev Tamamlama Oranı</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-surface-600">Tamamlanan</span>
                  <span className="font-medium text-surface-900">
                    {stats.totalTasks > 0 ? Math.round((stats.completedTasks / stats.totalTasks) * 100) : 0}%
                  </span>
                </div>
                <div className="h-3 bg-surface-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-secondary-400 to-secondary-600 rounded-full transition-all duration-500"
                    style={{ width: `${stats.totalTasks > 0 ? (stats.completedTasks / stats.totalTasks) * 100 : 0}%` }}
                  />
                </div>
              </div>
              <div className="flex justify-between text-sm text-surface-500">
                <span>{stats.completedTasks} tamamlandı</span>
                <span>{stats.totalTasks - stats.completedTasks} bekliyor</span>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-surface-900 mb-4">Son Kayıtlar</h3>
            <div className="space-y-4">
              {recentActivity.length > 0 ? recentActivity.map((activity, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary-50 rounded-full flex items-center justify-center">
                    <Users className="w-5 h-5 text-primary-500" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-surface-900 text-sm">{activity.title}</div>
                    <div className="text-xs text-surface-500">{activity.subtitle}</div>
                  </div>
                  <div className="text-xs text-surface-400">
                    {new Date(activity.date).toLocaleDateString('tr-TR')}
                  </div>
                </div>
              )) : (
                <div className="text-center py-4">
                  <Activity className="w-10 h-10 mx-auto mb-2 text-surface-300" />
                  <p className="text-sm text-surface-500">Henüz aktivite yok</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

