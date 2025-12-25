'use client'

export const dynamic = 'force-dynamic'

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
  ArrowRight,
  Bell,
  CheckCircle,
  XCircle,
  Clock,
  Plus,
  Target
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
  const [recentTasks, setRecentTasks] = useState<any[]>([])
  const supabase = createClient()

  useEffect(() => {
    if (teacherProfile?.id) {
      loadDashboardData()
    }
  }, [teacherProfile?.id])

  async function loadDashboardData() {
    if (!teacherProfile?.id) return

    try {
      // 1. Aktif ilişkileri çek
      const { data: activeRelationships, error: activeError } = await supabase
        .from('coaching_relationships')
        .select('id, student_id, started_at')
        .eq('coach_id', teacherProfile.id)
        .eq('status', 'active')

      if (activeError) {
        console.error('Aktif ilişkiler hatası:', activeError)
      }

      // 2. Bekleyen ilişkileri çek
      const { data: pendingRelationships, error: pendingError } = await supabase
        .from('coaching_relationships')
        .select('id, student_id, created_at')
        .eq('coach_id', teacherProfile.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })

      if (pendingError) {
        console.error('Bekleyen ilişkiler hatası:', pendingError)
      }

      // 3. Tüm student ID'leri topla
      const allStudentIds = [
        ...(activeRelationships || []).map(r => r.student_id),
        ...(pendingRelationships || []).map(r => r.student_id)
      ].filter(Boolean)

      if (allStudentIds.length === 0) {
        setStudents([])
        setPendingRequests([])
        setStats(prev => ({ ...prev, totalStudents: 0, pendingRequests: 0 }))
        return
      }

      // 4. Student profiles çek
      const { data: studentProfiles, error: spError } = await supabase
        .from('student_profiles')
        .select('id, user_id, grade_level, school_name')
        .in('id', allStudentIds)

      if (spError) {
        console.error('Student profiles hatası:', spError)
      }

      // 5. Profiles çek
      const userIds = (studentProfiles || []).map(sp => sp.user_id).filter(Boolean)
      const { data: profiles, error: pError } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .in('id', userIds)

      if (pError) {
        console.error('Profiles hatası:', pError)
      }

      // 6. Verileri birleştir - Aktif öğrenciler
      if (activeRelationships) {
        const studentData = activeRelationships.map(rel => {
          const studentProfile = studentProfiles?.find(sp => sp.id === rel.student_id)
          const profile = profiles?.find(p => p.id === studentProfile?.user_id)
          return {
            id: studentProfile?.id,
            user_id: studentProfile?.user_id,
            grade_level: studentProfile?.grade_level,
            profiles: profile ? { full_name: profile.full_name, avatar_url: profile.avatar_url } : null,
            relationship_id: rel.id,
            started_at: rel.started_at,
          }
        }).filter(s => s.id)
        setStudents(studentData)
        setStats(prev => ({ ...prev, totalStudents: studentData.length }))
      }

      // 7. Verileri birleştir - Bekleyen başvurular
      if (pendingRelationships) {
        const pendingData = pendingRelationships.map(rel => {
          const studentProfile = studentProfiles?.find(sp => sp.id === rel.student_id)
          const profile = profiles?.find(p => p.id === studentProfile?.user_id)
          return {
            id: rel.id,
            student: {
              id: studentProfile?.id,
              user_id: studentProfile?.user_id,
              grade_level: studentProfile?.grade_level,
              school_name: studentProfile?.school_name,
              profiles: profile ? { full_name: profile.full_name, avatar_url: profile.avatar_url } : null,
            }
          }
        }).filter(r => r.student.id)
        setPendingRequests(pendingData)
        setStats(prev => ({ ...prev, pendingRequests: pendingData.length }))
      }
    } catch (err) {
      console.error('Dashboard veri yükleme hatası:', err)
    }

    // Görev istatistikleri
    const { data: tasks } = await supabase
      .from('tasks')
      .select('*')
      .eq('coach_id', teacherProfile.id)
      .order('created_at', { ascending: false })
      .limit(5)

    if (tasks) {
      setRecentTasks(tasks)
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
            { label: 'Tamamlanan', value: stats.completedTasks, icon: CheckCircle, color: 'text-secondary-500', bg: 'bg-secondary-50' },
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
              {stats.pendingRequests > 0 && (
                <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-sm font-medium rounded-full">
                  {stats.pendingRequests} yeni
                </span>
              )}
            </div>
            <div className="divide-y divide-surface-100">
              {pendingRequests.length > 0 ? pendingRequests.map((request) => (
                <div key={request.id} className="p-4">
                  <div className="flex items-center gap-4 mb-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-accent-400 to-accent-600 rounded-xl flex items-center justify-center text-white font-medium overflow-hidden">
                      {request.student?.profiles?.avatar_url ? (
                        <img src={request.student.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        getInitials(request.student?.profiles?.full_name)
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-surface-900">
                        {request.student?.profiles?.full_name}
                      </div>
                      <div className="text-sm text-surface-500">
                        {request.student?.grade_level} • {request.student?.school_name || 'Okul belirtilmemiş'}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleRequest(request.id, 'accept')}
                      className="btn btn-primary btn-sm flex-1"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Kabul Et
                    </button>
                    <button
                      onClick={() => handleRequest(request.id, 'reject')}
                      className="btn btn-ghost btn-sm text-red-500 flex-1"
                    >
                      <XCircle className="w-4 h-4" />
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
                  <div className="w-12 h-12 bg-gradient-to-br from-primary-400 to-primary-600 rounded-xl flex items-center justify-center text-white font-medium overflow-hidden">
                    {student.profiles?.avatar_url ? (
                      <img src={student.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      getInitials(student.profiles?.full_name)
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-surface-900">{student.profiles?.full_name}</div>
                    <div className="text-sm text-surface-500">{student.grade_level}</div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-surface-400" />
                </Link>
              )) : (
                <div className="p-8 text-center">
                  <Users className="w-12 h-12 mx-auto mb-3 text-surface-300" />
                  <p className="text-surface-500 mb-4">Henüz öğrencin yok</p>
                  <p className="text-sm text-surface-400">Öğrenciler koçlar sayfasından sana başvurabilir</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-surface-900 mb-4">Hızlı İşlemler</h2>
          <div className="grid sm:grid-cols-3 gap-4">
            <Link href="/koc/gorevler/yeni" className="p-4 border-2 border-dashed border-surface-200 rounded-xl hover:border-primary-500 hover:bg-primary-50 transition-colors text-center">
              <Plus className="w-8 h-8 mx-auto mb-2 text-primary-500" />
              <span className="font-medium text-surface-900">Yeni Görev Ata</span>
            </Link>
            <Link href="/koc/mesajlar" className="p-4 border-2 border-dashed border-surface-200 rounded-xl hover:border-primary-500 hover:bg-primary-50 transition-colors text-center">
              <Target className="w-8 h-8 mx-auto mb-2 text-primary-500" />
              <span className="font-medium text-surface-900">Mesajlara Git</span>
            </Link>
            <Link href="/koc/ogrenciler" className="p-4 border-2 border-dashed border-surface-200 rounded-xl hover:border-primary-500 hover:bg-primary-50 transition-colors text-center">
              <Users className="w-8 h-8 mx-auto mb-2 text-primary-500" />
              <span className="font-medium text-surface-900">Öğrencileri Gör</span>
            </Link>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
