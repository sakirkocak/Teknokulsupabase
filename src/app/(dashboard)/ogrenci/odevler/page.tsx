'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { useProfile, useStudentProfile } from '@/hooks/useProfile'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { 
  BookOpen,
  Clock,
  CheckCircle,
  AlertCircle,
  ChevronRight,
  Calendar,
  HelpCircle,
  Loader2,
  Play
} from 'lucide-react'

interface Assignment {
  id: string
  title: string
  description: string | null
  questions: any[]
  due_date: string | null
  status: string
  created_at: string
  coach: {
    profiles: {
      full_name: string
    }
  }
}

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  pending: { label: 'Bekliyor', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
  in_progress: { label: 'Devam Ediyor', color: 'bg-blue-100 text-blue-700', icon: Play },
  completed: { label: 'Tamamlandı', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  reviewed: { label: 'İncelendi', color: 'bg-purple-100 text-purple-700', icon: CheckCircle },
}

export default function StudentAssignmentsPage() {
  const { profile } = useProfile()
  const { studentProfile } = useStudentProfile(profile?.id || '')
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'completed'>('all')
  const supabase = createClient()

  useEffect(() => {
    if (studentProfile?.id) {
      loadAssignments()
    }
  }, [studentProfile?.id])

  async function loadAssignments() {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('assignments')
        .select(`
          *,
          coach:teacher_profiles!assignments_coach_id_fkey(
            profiles:profiles!teacher_profiles_user_id_fkey(full_name)
          )
        `)
        .eq('student_id', studentProfile?.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setAssignments(data || [])
    } catch (error) {
      console.error('Error loading assignments:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredAssignments = assignments.filter(a => {
    if (activeTab === 'pending') return a.status === 'pending' || a.status === 'in_progress'
    if (activeTab === 'completed') return a.status === 'completed' || a.status === 'reviewed'
    return true
  })

  const pendingCount = assignments.filter(a => a.status === 'pending' || a.status === 'in_progress').length
  const completedCount = assignments.filter(a => a.status === 'completed' || a.status === 'reviewed').length

  function isOverdue(dueDate: string | null) {
    if (!dueDate) return false
    return new Date(dueDate) < new Date()
  }

  return (
    <DashboardLayout role="ogrenci">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-surface-900 flex items-center gap-2">
            <BookOpen className="w-7 h-7 text-primary-500" />
            Ödevlerim
          </h1>
          <p className="text-surface-500">Koçunuzun gönderdiği ödevleri görüntüleyin</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="card p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-surface-100 rounded-lg flex items-center justify-center">
                <HelpCircle className="w-5 h-5 text-surface-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-surface-900">{assignments.length}</p>
                <p className="text-sm text-surface-500">Toplam</p>
              </div>
            </div>
          </div>
          <div className="card p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-surface-900">{pendingCount}</p>
                <p className="text-sm text-surface-500">Bekleyen</p>
              </div>
            </div>
          </div>
          <div className="card p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-surface-900">{completedCount}</p>
                <p className="text-sm text-surface-500">Tamamlanan</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-surface-200">
          {[
            { id: 'all', label: 'Tümü' },
            { id: 'pending', label: `Bekleyenler (${pendingCount})` },
            { id: 'completed', label: `Tamamlananlar (${completedCount})` },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-3 font-medium transition-colors border-b-2 -mb-px ${
                activeTab === tab.id
                  ? 'text-primary-600 border-primary-500'
                  : 'text-surface-500 border-transparent hover:text-surface-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Assignments List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
          </div>
        ) : filteredAssignments.length === 0 ? (
          <div className="text-center py-12 card">
            <BookOpen className="w-12 h-12 mx-auto text-surface-300 mb-4" />
            <p className="text-surface-500">
              {activeTab === 'pending' 
                ? 'Bekleyen ödev yok' 
                : activeTab === 'completed' 
                  ? 'Henüz tamamlanan ödev yok'
                  : 'Henüz ödev yok'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredAssignments.map((assignment, index) => {
              const status = statusConfig[assignment.status] || statusConfig.pending
              const StatusIcon = status.icon
              const overdue = isOverdue(assignment.due_date) && assignment.status === 'pending'

              return (
                <motion.div
                  key={assignment.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Link href={`/ogrenci/odevler/${assignment.id}`}>
                    <div className={`card p-5 hover:shadow-lg transition-all group ${
                      overdue ? 'border-l-4 border-l-red-500' : ''
                    }`}>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`px-2 py-1 text-xs rounded-full ${status.color}`}>
                              <StatusIcon className="w-3 h-3 inline mr-1" />
                              {status.label}
                            </span>
                            {overdue && (
                              <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-700">
                                <AlertCircle className="w-3 h-3 inline mr-1" />
                                Süresi Geçti
                              </span>
                            )}
                          </div>
                          
                          <h3 className="font-semibold text-surface-900 group-hover:text-primary-600 transition-colors">
                            {assignment.title}
                          </h3>
                          
                          {assignment.description && (
                            <p className="text-sm text-surface-500 mt-1 line-clamp-2">
                              {assignment.description}
                            </p>
                          )}

                          <div className="flex items-center gap-4 mt-3 text-sm text-surface-400">
                            <span className="flex items-center gap-1">
                              <HelpCircle className="w-4 h-4" />
                              {assignment.questions.length} soru
                            </span>
                            {assignment.due_date && (
                              <span className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                {new Date(assignment.due_date).toLocaleDateString('tr-TR')}
                              </span>
                            )}
                            <span>
                              Koç: {assignment.coach?.profiles?.full_name || 'Bilinmiyor'}
                            </span>
                          </div>
                        </div>

                        <ChevronRight className="w-5 h-5 text-surface-400 group-hover:text-primary-500 group-hover:translate-x-1 transition-all flex-shrink-0" />
                      </div>
                    </div>
                  </Link>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}



