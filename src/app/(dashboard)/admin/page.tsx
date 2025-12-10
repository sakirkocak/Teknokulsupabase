'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { useProfile } from '@/hooks/useProfile'
import { createClient } from '@/lib/supabase/client'
import { motion } from 'framer-motion'
import { 
  Users, 
  Target, 
  TrendingUp, 
  AlertTriangle,
  ArrowRight,
  Settings,
  UserCheck,
  BookOpen,
  Activity
} from 'lucide-react'

export default function AdminDashboard() {
  const { profile, loading: profileLoading } = useProfile()
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalTeachers: 0,
    totalStudents: 0,
    totalParents: 0,
    activeCoachings: 0,
    totalTasks: 0,
  })
  const supabase = createClient()

  useEffect(() => {
    loadStats()
  }, [])

  async function loadStats() {
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

    setStats({
      totalUsers: totalUsers || 0,
      totalTeachers: totalTeachers || 0,
      totalStudents: totalStudents || 0,
      totalParents: totalParents || 0,
      activeCoachings: activeCoachings || 0,
      totalTasks: totalTasks || 0,
    })
  }

  if (profileLoading) {
    return (
      <DashboardLayout role="admin">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout role="admin">
      <div className="space-y-6">
        {/* Welcome */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card p-6 bg-gradient-to-r from-surface-800 to-surface-900 text-white"
        >
          <h1 className="text-2xl font-bold mb-2">
            Admin Panel 🛡️
          </h1>
          <p className="text-surface-300">
            Tüm sistemi buradan yönetebilirsiniz.
          </p>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { label: 'Toplam Kullanıcı', value: stats.totalUsers, icon: Users, color: 'text-primary-500', bg: 'bg-primary-50' },
            { label: 'Öğretmen/Koç', value: stats.totalTeachers, icon: UserCheck, color: 'text-accent-500', bg: 'bg-accent-50' },
            { label: 'Öğrenci', value: stats.totalStudents, icon: BookOpen, color: 'text-secondary-500', bg: 'bg-secondary-50' },
            { label: 'Veli', value: stats.totalParents, icon: Users, color: 'text-purple-500', bg: 'bg-purple-50' },
            { label: 'Aktif Koçluk', value: stats.activeCoachings, icon: Target, color: 'text-yellow-500', bg: 'bg-yellow-50' },
            { label: 'Toplam Görev', value: stats.totalTasks, icon: Activity, color: 'text-red-500', bg: 'bg-red-50' },
          ].map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="card p-6"
            >
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 ${stat.bg} rounded-xl flex items-center justify-center`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
                <div>
                  <div className="text-2xl font-bold text-surface-900">{stat.value}</div>
                  <div className="text-sm text-surface-500">{stat.label}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Quick Links */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Kullanıcıları Yönet', href: '/admin/kullanicilar', icon: Users, color: 'from-primary-500 to-primary-600' },
            { label: 'Koçlukları Yönet', href: '/admin/kocluklar', icon: Target, color: 'from-accent-500 to-accent-600' },
            { label: 'İstatistikler', href: '/admin/istatistikler', icon: TrendingUp, color: 'from-secondary-500 to-secondary-600' },
            { label: 'Sistem Ayarları', href: '/admin/ayarlar', icon: Settings, color: 'from-surface-600 to-surface-800' },
          ].map((link, index) => (
            <Link 
              key={index}
              href={link.href}
              className="card p-6 hover:shadow-lg transition-shadow group"
            >
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${link.color} flex items-center justify-center text-white mb-4`}>
                <link.icon className="w-6 h-6" />
              </div>
              <div className="font-medium text-surface-900 group-hover:text-primary-500 transition-colors flex items-center gap-2">
                {link.label}
                <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </DashboardLayout>
  )
}

