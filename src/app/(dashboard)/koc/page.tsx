'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { useProfile, useTeacherProfile } from '@/hooks/useProfile'
import { createClient } from '@/lib/supabase/client'
import { getInitials } from '@/lib/utils'
import { motion } from 'framer-motion'
import { 
  Users, 
  ClipboardList, 
  TrendingUp, 
  Calendar, 
  ArrowRight,
  Bell,
  Star,
  CheckCircle,
  Clock,
  AlertCircle
} from 'lucide-react'

export default function CoachDashboard() {
  const { profile, loading: profileLoading } = useProfile()
  const { teacherProfile, loading: teacherLoading } = useTeacherProfile(profile?.id || '')
  const [stats, setStats] = useState({
    totalStudents: 0,
    pendingRequests: 0,
    activeTasks: 0,
    completedTasks: 0,
  })
  const [students, setStudents] = useState<any[]>([])
  const [pendingRequests, setPendingRequests] = useState<any[]>([])
  const supabase = createClient()

  useEffect(() => {
    if (teacherProfile?.id) {
      loadDashboardData()
    }
  }, [teacherProfile?.id])

  async function loadDashboardData() {
    if (!teacherProfile?.id) return

    // Aktif öğrencileri yükle
    const { data: relationships } = await supabase
      .from('coaching_relationships')
      .select(`
        *,
        student:student_id(
          id,
          user_id,
          profile:user_id(full_name, avatar_url)
        )
      `)
      .eq('coach_id', teacherProfile.id)
      .eq('status', 'active')

    if (relationships) {
      setStudents(relationships.map(r => ({
        ...r.student,
        relationship_id: r.id,
      })))
      setStats(prev => ({ ...prev, totalStudents: relationships.length }))
    }

    // Bekleyen başvuruları yükle
    const { data: pending } = await supabase
      .from('coaching_relationships')
      .select(`
        *,
        student:student_id(
          id,
          user_id,
          profile:user_id(full_name, avatar_url)
        )
      `)
      .eq('coach_id', teacherProfile.id)
      .eq('status', 'pending')

    if (pending) {
      setPendingRequests(pending)
      setStats(prev => ({ ...prev, pendingRequests: pending.length }))
    }

    // Görev istatistikleri
    const { data: tasks } = await supabase
      .from('tasks')
      .select('status')
      .eq('coach_id', teacherProfile.id)

    if (tasks) {
      const active = tasks.filter(t => t.status !== 'completed').length
      const completed = tasks.filter(t => t.status === 'completed').length
      setStats(prev => ({ ...prev, activeTasks: active, completedTasks: completed }))
    }
  }

  async function handleRequest(relationshipId: string, action: 'accept' | 'reject') {
    const newStatus = action === 'accept' ? 'active' : 'ended'
    
    const { error } = await supabase
      .from('coaching_relationships')
      .update({ 
        status: newStatus,
        started_at: action === 'accept' ? new Date().toISOString() : null,
        ended_at: action === 'reject' ? new Date().toISOString() : null,
      })
      .eq('id', relationshipId)

    if (!error) {
      loadDashboardData()
    }
  }

  const loading = profileLoading || teacherLoading

  if (loading) {
    return (
      <DashboardLayout role="koc">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout role="koc">
      <div className="space-y-6">
        {/* Welcome */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card p-6 bg-gradient-to-r from-primary-500 to-primary-600 text-white"
        >
          <h1 className="text-2xl font-bold mb-2">
            Hoş geldin, {profile?.full_name?.split(' ')[0]}! 👋
          </h1>
          <p className="text-primary-100">
            {stats.pendingRequests > 0 
              ? `${stats.pendingRequests} yeni koçluk başvurusu bekliyor.`
              : 'Bugün harika bir gün olacak!'
            }
          </p>
        </motion.div>

        {/* Stats */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Toplam Öğrenci', value: stats.totalStudents, icon: Users, color: 'text-primary-500', bg: 'bg-primary-50' },
            { label: 'Bekleyen Başvuru', value: stats.pendingRequests, icon: Bell, color: 'text-yellow-500', bg: 'bg-yellow-50' },
            { label: 'Aktif Görev', value: stats.activeTasks, icon: ClipboardList, color: 'text-accent-500', bg: 'bg-accent-50' },
            { label: 'Tamamlanan Görev', value: stats.completedTasks, icon: CheckCircle, color: 'text-secondary-500', bg: 'bg-secondary-50' },
          ].map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
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

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Pending Requests */}
          <div className="card">
            <div className="p-6 border-b border-surface-100 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-surface-900">Koçluk Başvuruları</h2>
                <p className="text-sm text-surface-500">Onay bekleyen öğrenciler</p>
              </div>
            </div>
            <div className="divide-y divide-surface-100">
              {pendingRequests.length > 0 ? pendingRequests.map((request) => (
                <div key={request.id} className="p-4 flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-accent-400 to-accent-600 rounded-xl flex items-center justify-center text-white font-medium">
                    {getInitials(request.student?.profile?.full_name)}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-surface-900">
                      {request.student?.profile?.full_name}
                    </div>
                    <div className="text-sm text-surface-500">Koçluk talep ediyor</div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleRequest(request.id, 'accept')}
                      className="btn btn-primary btn-sm"
                    >
                      Kabul Et
                    </button>
                    <button
                      onClick={() => handleRequest(request.id, 'reject')}
                      className="btn btn-ghost btn-sm text-red-500"
                    >
                      Reddet
                    </button>
                  </div>
                </div>
              )) : (
                <div className="p-8 text-center">
                  <Bell className="w-12 h-12 mx-auto mb-3 text-surface-300" />
                  <p className="text-surface-500">Bekleyen başvuru yok</p>
                </div>
              )}
            </div>
          </div>

          {/* My Students */}
          <div className="card">
            <div className="p-6 border-b border-surface-100 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-surface-900">Öğrencilerim</h2>
                <p className="text-sm text-surface-500">Aktif koçluk yaptığın öğrenciler</p>
              </div>
              <Link href="/koc/ogrenciler" className="text-primary-500 text-sm font-medium flex items-center gap-1">
                Tümünü Gör <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="divide-y divide-surface-100">
              {students.length > 0 ? students.slice(0, 5).map((student) => (
                <Link 
                  key={student.id}
                  href={`/koc/ogrenciler/${student.id}`}
                  className="p-4 flex items-center gap-4 hover:bg-surface-50 transition-colors"
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-primary-400 to-primary-600 rounded-xl flex items-center justify-center text-white font-medium">
                    {getInitials(student.profile?.full_name)}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-surface-900">{student.profile?.full_name}</div>
                    <div className="text-sm text-surface-500">0 aktif görev</div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-surface-400" />
                </Link>
              )) : (
                <div className="p-8 text-center">
                  <Users className="w-12 h-12 mx-auto mb-3 text-surface-300" />
                  <p className="text-surface-500 mb-4">Henüz öğrencin yok</p>
                  <p className="text-sm text-surface-400">Öğrenciler seni koçları sayfasından bulabilir</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

