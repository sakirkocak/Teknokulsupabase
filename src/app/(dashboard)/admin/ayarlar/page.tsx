'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { useProfile } from '@/hooks/useProfile'
import { createClient } from '@/lib/supabase/client'
import { motion } from 'framer-motion'
import { 
  Settings,
  Database,
  Shield,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Trash2,
  Terminal
} from 'lucide-react'

export default function AdminSettingsPage() {
  const { profile, loading: profileLoading } = useProfile()
  const [dbStats, setDbStats] = useState({
    profiles: 0,
    teachers: 0,
    students: 0,
    coachings: 0,
    tasks: 0,
    exams: 0,
  })
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const supabase = createClient()

  useEffect(() => {
    loadDbStats()
  }, [])

  async function loadDbStats() {
    setLoading(true)

    const counts = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('teacher_profiles').select('*', { count: 'exact', head: true }),
      supabase.from('student_profiles').select('*', { count: 'exact', head: true }),
      supabase.from('coaching_relationships').select('*', { count: 'exact', head: true }),
      supabase.from('tasks').select('*', { count: 'exact', head: true }),
      supabase.from('exam_results').select('*', { count: 'exact', head: true }),
    ])

    setDbStats({
      profiles: counts[0].count || 0,
      teachers: counts[1].count || 0,
      students: counts[2].count || 0,
      coachings: counts[3].count || 0,
      tasks: counts[4].count || 0,
      exams: counts[5].count || 0,
    })

    setLoading(false)
  }

  async function clearOldTasks() {
    setActionLoading('clearTasks')
    
    // 30 günden eski tamamlanmış görevleri sil
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('status', 'completed')
      .lt('updated_at', thirtyDaysAgo.toISOString())

    if (error) {
      setMessage({ type: 'error', text: 'Görevler silinemedi: ' + error.message })
    } else {
      setMessage({ type: 'success', text: 'Eski görevler temizlendi' })
      loadDbStats()
    }

    setActionLoading(null)
  }

  async function clearDismissedRecommendations() {
    setActionLoading('clearRecs')

    const { error } = await supabase
      .from('ai_recommendations')
      .delete()
      .eq('is_dismissed', true)

    if (error) {
      setMessage({ type: 'error', text: 'Öneriler silinemedi: ' + error.message })
    } else {
      setMessage({ type: 'success', text: 'Kapatılmış öneriler temizlendi' })
    }

    setActionLoading(null)
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

  return (
    <DashboardLayout role="admin">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Sistem Ayarları</h1>
          <p className="text-surface-500">Veritabanı ve sistem yönetimi</p>
        </div>

        {/* Message */}
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-4 rounded-xl flex items-center gap-3 ${
              message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
            }`}
          >
            {message.type === 'success' ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <AlertCircle className="w-5 h-5" />
            )}
            {message.text}
            <button 
              onClick={() => setMessage(null)}
              className="ml-auto text-current opacity-50 hover:opacity-100"
            >
              ✕
            </button>
          </motion.div>
        )}

        {/* Database Stats */}
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-6">
            <Database className="w-6 h-6 text-primary-500" />
            <h2 className="text-lg font-semibold text-surface-900">Veritabanı İstatistikleri</h2>
            <button 
              onClick={loadDbStats}
              className="ml-auto p-2 hover:bg-surface-100 rounded-lg"
            >
              <RefreshCw className="w-4 h-4 text-surface-500" />
            </button>
          </div>
          <div className="grid sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { label: 'Profiller', count: dbStats.profiles },
              { label: 'Öğretmenler', count: dbStats.teachers },
              { label: 'Öğrenciler', count: dbStats.students },
              { label: 'Koçluklar', count: dbStats.coachings },
              { label: 'Görevler', count: dbStats.tasks },
              { label: 'Denemeler', count: dbStats.exams },
            ].map((stat, i) => (
              <div key={i} className="bg-surface-50 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-surface-900">{stat.count}</div>
                <div className="text-sm text-surface-500">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Maintenance Actions */}
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-6">
            <Terminal className="w-6 h-6 text-accent-500" />
            <h2 className="text-lg font-semibold text-surface-900">Bakım İşlemleri</h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-surface-50 rounded-xl">
              <div>
                <div className="font-medium text-surface-900">Eski Görevleri Temizle</div>
                <div className="text-sm text-surface-500">30 günden eski tamamlanmış görevleri sil</div>
              </div>
              <button
                onClick={clearOldTasks}
                disabled={actionLoading === 'clearTasks'}
                className="btn btn-outline btn-sm"
              >
                {actionLoading === 'clearTasks' ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                Temizle
              </button>
            </div>

            <div className="flex items-center justify-between p-4 bg-surface-50 rounded-xl">
              <div>
                <div className="font-medium text-surface-900">Kapatılmış Önerileri Sil</div>
                <div className="text-sm text-surface-500">Kullanıcıların kapattığı AI önerilerini sil</div>
              </div>
              <button
                onClick={clearDismissedRecommendations}
                disabled={actionLoading === 'clearRecs'}
                className="btn btn-outline btn-sm"
              >
                {actionLoading === 'clearRecs' ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                Temizle
              </button>
            </div>
          </div>
        </div>

        {/* Security Info */}
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-6 h-6 text-secondary-500" />
            <h2 className="text-lg font-semibold text-surface-900">Güvenlik</h2>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <span className="text-green-700">RLS (Row Level Security)</span>
              <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                Aktif
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <span className="text-green-700">SSL/TLS Şifreleme</span>
              <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                Aktif
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <span className="text-green-700">Auth Token Kontrolü</span>
              <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                Aktif
              </span>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

