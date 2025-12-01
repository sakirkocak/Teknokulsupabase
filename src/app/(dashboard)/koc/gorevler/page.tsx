'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { useProfile, useTeacherProfile } from '@/hooks/useProfile'
import { createClient } from '@/lib/supabase/client'
import { getInitials } from '@/lib/utils'
import { motion } from 'framer-motion'
import { 
  ClipboardList, 
  Plus,
  Search,
  Filter,
  CheckCircle,
  Clock,
  AlertCircle
} from 'lucide-react'

export default function CoachTasksPage() {
  const { profile, loading: profileLoading } = useProfile()
  const { teacherProfile, loading: teacherLoading } = useTeacherProfile(profile?.id || '')
  const [tasks, setTasks] = useState<any[]>([])
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all')
  const supabase = createClient()

  useEffect(() => {
    if (teacherProfile?.id) {
      loadTasks()
    }
  }, [teacherProfile?.id])

  async function loadTasks() {
    const { data } = await supabase
      .from('tasks')
      .select(`
        *,
        student:student_profiles!tasks_student_id_fkey(
          id,
          profiles:profiles!student_profiles_user_id_fkey(full_name, avatar_url)
        )
      `)
      .eq('coach_id', teacherProfile?.id)
      .order('created_at', { ascending: false })

    if (data) {
      setTasks(data)
    }
  }

  const filteredTasks = tasks.filter(t => {
    if (filter === 'pending') return t.status !== 'completed'
    if (filter === 'completed') return t.status === 'completed'
    return true
  })

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

  const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
    pending: { label: 'Bekliyor', color: 'bg-yellow-50 text-yellow-600', icon: Clock },
    in_progress: { label: 'Devam Ediyor', color: 'bg-blue-50 text-blue-600', icon: AlertCircle },
    submitted: { label: 'Teslim Edildi', color: 'bg-purple-50 text-purple-600', icon: ClipboardList },
    completed: { label: 'Tamamlandı', color: 'bg-green-50 text-green-600', icon: CheckCircle },
  }

  return (
    <DashboardLayout role="koc">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-surface-900">Görevler</h1>
            <p className="text-surface-500">Öğrencilere atadığın görevleri yönet</p>
          </div>
          <Link href="/koc/gorevler/yeni" className="btn btn-primary btn-md">
            <Plus className="w-5 h-5" />
            Yeni Görev
          </Link>
        </div>

        {/* Filter */}
        <div className="flex gap-2">
          {[
            { key: 'all', label: 'Tümü' },
            { key: 'pending', label: 'Bekleyen' },
            { key: 'completed', label: 'Tamamlanan' },
          ].map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key as any)}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                filter === f.key 
                  ? 'bg-primary-500 text-white' 
                  : 'bg-surface-100 text-surface-600 hover:bg-surface-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Tasks List */}
        {filteredTasks.length > 0 ? (
          <div className="space-y-4">
            {filteredTasks.map((task, index) => {
              const config = statusConfig[task.status] || statusConfig.pending
              const StatusIcon = config.icon

              return (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Link href={`/koc/gorevler/${task.id}`} className="card p-6 block hover:shadow-lg transition-shadow">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-primary-400 to-primary-600 rounded-xl flex items-center justify-center text-white font-medium overflow-hidden">
                        {task.student?.profiles?.avatar_url ? (
                          <img src={task.student.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          getInitials(task.student?.profiles?.full_name)
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h3 className="font-semibold text-surface-900">{task.title}</h3>
                            <p className="text-sm text-surface-500">{task.student?.profiles?.full_name}</p>
                          </div>
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
                            <StatusIcon className="w-3 h-3" />
                            {config.label}
                          </span>
                        </div>
                        {task.description && (
                          <p className="text-sm text-surface-600 mt-2 line-clamp-2">{task.description}</p>
                        )}
                        <div className="flex items-center gap-4 mt-3 text-sm text-surface-500">
                          <span className="capitalize">{task.type}</span>
                          {task.due_date && (
                            <span>Son: {new Date(task.due_date).toLocaleDateString('tr-TR')}</span>
                          )}
                          {task.score !== null && (
                            <span className="text-primary-500 font-medium">Puan: {task.score}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              )
            })}
          </div>
        ) : (
          <div className="card p-12 text-center">
            <ClipboardList className="w-16 h-16 mx-auto mb-4 text-surface-300" />
            <h3 className="text-lg font-medium text-surface-900 mb-2">Görev bulunamadı</h3>
            <p className="text-surface-500 mb-4">
              {filter !== 'all' 
                ? 'Bu filtreye uygun görev yok.'
                : 'Henüz görev oluşturmadın.'
              }
            </p>
            <Link href="/koc/gorevler/yeni" className="btn btn-primary btn-md">
              <Plus className="w-5 h-5" />
              İlk Görevini Oluştur
            </Link>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

