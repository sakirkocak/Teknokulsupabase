'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { useProfile, useStudentProfile } from '@/hooks/useProfile'
import { createClient } from '@/lib/supabase/client'
import { motion } from 'framer-motion'
import { 
  ClipboardList, 
  CheckCircle,
  Clock,
  AlertCircle,
  ArrowRight
} from 'lucide-react'

export default function StudentTasksPage() {
  const { profile, loading: profileLoading } = useProfile()
  const { studentProfile, loading: studentLoading } = useStudentProfile(profile?.id || '')
  const [tasks, setTasks] = useState<any[]>([])
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all')
  const supabase = createClient()

  useEffect(() => {
    if (studentProfile?.id) {
      loadTasks()
    }
  }, [studentProfile?.id])

  async function loadTasks() {
    const { data } = await supabase
      .from('tasks')
      .select('*')
      .eq('student_id', studentProfile?.id)
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

  const loading = profileLoading || studentLoading

  if (loading) {
    return (
      <DashboardLayout role="ogrenci">
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
    <DashboardLayout role="ogrenci">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Görevlerim</h1>
          <p className="text-surface-500">Koçunun sana atadığı görevler</p>
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
                  <Link href={`/ogrenci/gorevler/${task.id}`} className="card p-6 block hover:shadow-lg transition-shadow">
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        task.status === 'completed' ? 'bg-secondary-100 text-secondary-600' :
                        task.status === 'pending' ? 'bg-yellow-100 text-yellow-600' :
                        'bg-accent-100 text-accent-600'
                      }`}>
                        <StatusIcon className="w-6 h-6" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4">
                          <h3 className="font-semibold text-surface-900">{task.title}</h3>
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
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
                      <ArrowRight className="w-5 h-5 text-surface-400 flex-shrink-0" />
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
            <p className="text-surface-500">
              {filter !== 'all' 
                ? 'Bu filtreye uygun görev yok.'
                : 'Henüz görev atanmamış.'
              }
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

