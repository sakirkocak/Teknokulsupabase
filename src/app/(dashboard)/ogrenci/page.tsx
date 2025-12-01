'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { useProfile, useStudentProfile } from '@/hooks/useProfile'
import { createClient } from '@/lib/supabase/client'
import { getInitials } from '@/lib/utils'
import { motion } from 'framer-motion'
import { 
  Target, 
  ClipboardList, 
  TrendingUp, 
  Calendar, 
  ArrowRight,
  Brain,
  Sparkles,
  CheckCircle,
  Clock,
  AlertCircle,
  BookOpen,
  Flame
} from 'lucide-react'

export default function StudentDashboard() {
  const { profile, loading: profileLoading } = useProfile()
  const { studentProfile, loading: studentLoading } = useStudentProfile(profile?.id || '')
  const [coach, setCoach] = useState<any>(null)
  const [tasks, setTasks] = useState<any[]>([])
  const [recommendations, setRecommendations] = useState<any[]>([])
  const supabase = createClient()

  useEffect(() => {
    if (studentProfile?.id) {
      loadDashboardData()
    }
  }, [studentProfile?.id])

  async function loadDashboardData() {
    if (!studentProfile?.id) return

    // Koç bilgisini yükle
    const { data: relationship } = await supabase
      .from('coaching_relationships')
      .select(`
        *,
        coach:coach_id(
          id,
          user_id,
          bio,
          subjects,
          profile:user_id(full_name, avatar_url)
        )
      `)
      .eq('student_id', studentProfile.id)
      .eq('status', 'active')
      .single()

    if (relationship?.coach) {
      setCoach(relationship.coach)
    }

    // Görevleri yükle
    const { data: taskData } = await supabase
      .from('tasks')
      .select('*')
      .eq('student_id', studentProfile.id)
      .order('created_at', { ascending: false })
      .limit(5)

    if (taskData) {
      setTasks(taskData)
    }

    // AI önerilerini yükle
    const { data: recData } = await supabase
      .from('ai_recommendations')
      .select('*')
      .eq('student_id', studentProfile.id)
      .eq('is_dismissed', false)
      .order('created_at', { ascending: false })
      .limit(3)

    if (recData) {
      setRecommendations(recData)
    }
  }

  const loading = profileLoading || studentLoading
  const pendingTasks = tasks.filter(t => t.status === 'pending')
  const completedTasks = tasks.filter(t => t.status === 'completed')

  if (loading) {
    return (
      <DashboardLayout role="ogrenci">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout role="ogrenci">
      <div className="space-y-6">
        {/* Progress Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card p-6 bg-gradient-to-r from-accent-500 to-accent-600 text-white"
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Flame className="w-5 h-5" />
                <span className="text-sm font-medium bg-white/20 px-2 py-0.5 rounded-full">
                  Harika gidiyorsun!
                </span>
              </div>
              <h1 className="text-2xl font-bold mb-1">Merhaba, {profile?.full_name?.split(' ')[0]}! 👋</h1>
              <p className="text-accent-100">
                {pendingTasks.length > 0 
                  ? `${pendingTasks.length} görev tamamlanmayı bekliyor`
                  : 'Tüm görevler tamamlandı! 🎉'
                }
              </p>
            </div>
            {studentProfile?.target_exam && (
              <div className="mt-4 lg:mt-0 text-center lg:text-right">
                <div className="inline-flex items-center gap-2 bg-white/20 px-4 py-2 rounded-xl">
                  <Target className="w-5 h-5" />
                  <span className="font-medium">{studentProfile.target_exam}</span>
                </div>
              </div>
            )}
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* My Coach */}
            <div className="card">
              <div className="p-6 border-b border-surface-100">
                <h2 className="text-lg font-semibold text-surface-900">Koçum</h2>
              </div>
              {coach ? (
                <div className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-primary-400 to-primary-600 rounded-xl flex items-center justify-center text-white text-xl font-medium">
                      {coach.profile?.avatar_url ? (
                        <img src={coach.profile.avatar_url} alt="" className="w-full h-full rounded-xl object-cover" />
                      ) : (
                        getInitials(coach.profile?.full_name)
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-lg text-surface-900">{coach.profile?.full_name}</div>
                      <div className="text-sm text-surface-500">{coach.subjects?.join(', ')}</div>
                    </div>
                    <Link href="/ogrenci/mesajlar" className="btn btn-primary btn-sm">
                      Mesaj Gönder
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center">
                  <Target className="w-12 h-12 mx-auto mb-3 text-surface-300" />
                  <p className="text-surface-500 mb-4">Henüz bir koçun yok</p>
                  <Link href="/koclar" className="btn btn-primary btn-sm">
                    Koç Bul
                  </Link>
                </div>
              )}
            </div>

            {/* Tasks */}
            <div className="card">
              <div className="p-6 border-b border-surface-100 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-surface-900">Görevlerim</h2>
                  <p className="text-sm text-surface-500">Koçunun verdiği görevler</p>
                </div>
                <Link href="/ogrenci/gorevler" className="text-primary-500 text-sm font-medium flex items-center gap-1">
                  Tümünü Gör <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
              <div className="divide-y divide-surface-100">
                {tasks.length > 0 ? tasks.slice(0, 4).map((task) => (
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
                      <div className="text-sm text-surface-500">
                        {task.due_date 
                          ? `Son tarih: ${new Date(task.due_date).toLocaleDateString('tr-TR')}`
                          : 'Son tarih belirtilmemiş'
                        }
                      </div>
                    </div>
                    <Link href={`/ogrenci/gorevler/${task.id}`} className="btn btn-ghost btn-sm">
                      Detay
                    </Link>
                  </div>
                )) : (
                  <div className="p-8 text-center">
                    <ClipboardList className="w-12 h-12 mx-auto mb-3 text-surface-300" />
                    <p className="text-surface-500">Henüz görev atanmamış</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* AI Recommendations */}
            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-surface-900">AI Önerileri</h3>
                <Sparkles className="w-5 h-5 text-primary-500" />
              </div>
              {recommendations.length > 0 ? (
                <div className="space-y-3">
                  {recommendations.map((rec) => (
                    <div 
                      key={rec.id}
                      className={`p-3 rounded-xl text-sm ${
                        rec.priority === 'high' ? 'bg-red-50 border border-red-200' :
                        rec.priority === 'medium' ? 'bg-yellow-50 border border-yellow-200' :
                        'bg-accent-50 border border-accent-200'
                      }`}
                    >
                      <div className="font-medium mb-1">{rec.subject || 'Genel'}</div>
                      <div className="text-surface-600">{rec.message}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <Brain className="w-10 h-10 mx-auto mb-2 text-surface-300" />
                  <p className="text-sm text-surface-500">
                    Daha fazla veri toplandıkça AI önerileri burada görünecek
                  </p>
                </div>
              )}
            </div>

            {/* Quick Stats */}
            <div className="card p-6">
              <h3 className="font-semibold text-surface-900 mb-4">İstatistiklerim</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ClipboardList className="w-5 h-5 text-accent-500" />
                    <span className="text-surface-600">Toplam Görev</span>
                  </div>
                  <span className="font-bold text-surface-900">{tasks.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-secondary-500" />
                    <span className="text-surface-600">Tamamlanan</span>
                  </div>
                  <span className="font-bold text-surface-900">{completedTasks.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-yellow-500" />
                    <span className="text-surface-600">Bekleyen</span>
                  </div>
                  <span className="font-bold text-surface-900">{pendingTasks.length}</span>
                </div>
              </div>
            </div>

            {/* AI Tools */}
            <div className="card p-6">
              <h3 className="font-semibold text-surface-900 mb-4">AI Araçları</h3>
              <div className="space-y-2">
                <Link 
                  href="/ogrenci/ai-araclar"
                  className="flex items-center gap-3 p-3 rounded-xl bg-surface-50 hover:bg-surface-100 transition-colors"
                >
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-white">
                    <Brain className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-medium text-surface-900 text-sm">Soru Çözücü</div>
                    <div className="text-xs text-surface-500">Fotoğraf çek, çözüm al</div>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

