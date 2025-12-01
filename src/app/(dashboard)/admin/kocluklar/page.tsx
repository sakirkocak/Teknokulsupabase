'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { useProfile } from '@/hooks/useProfile'
import { createClient } from '@/lib/supabase/client'
import { getInitials } from '@/lib/utils'
import { motion } from 'framer-motion'
import { 
  Target, 
  Search,
  CheckCircle,
  Clock,
  XCircle,
  ArrowRight
} from 'lucide-react'

export default function AdminCoachingsPage() {
  const { profile, loading: profileLoading } = useProfile()
  const [relationships, setRelationships] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')
  const supabase = createClient()

  useEffect(() => {
    loadRelationships()
  }, [])

  async function loadRelationships() {
    setLoading(true)
    const { data } = await supabase
      .from('coaching_relationships')
      .select(`
        *,
        coach:teacher_profiles!coaching_relationships_coach_id_fkey(
          id,
          profile:profiles!teacher_profiles_user_id_fkey(full_name, avatar_url)
        ),
        student:student_profiles!coaching_relationships_student_id_fkey(
          id,
          profile:profiles!student_profiles_user_id_fkey(full_name, avatar_url)
        )
      `)
      .order('created_at', { ascending: false })

    if (data) {
      setRelationships(data)
    }
    setLoading(false)
  }

  async function updateStatus(id: string, status: string) {
    const updateData: any = { status }
    if (status === 'active') {
      updateData.started_at = new Date().toISOString()
    } else if (status === 'ended') {
      updateData.ended_at = new Date().toISOString()
    }

    const { error } = await supabase
      .from('coaching_relationships')
      .update(updateData)
      .eq('id', id)

    if (!error) {
      loadRelationships()
    }
  }

  const filteredRelationships = relationships.filter(r => 
    filter === 'all' || r.status === filter
  )

  const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
    pending: { label: 'Bekliyor', color: 'bg-yellow-50 text-yellow-600', icon: Clock },
    active: { label: 'Aktif', color: 'bg-green-50 text-green-600', icon: CheckCircle },
    ended: { label: 'Sonlandı', color: 'bg-red-50 text-red-600', icon: XCircle },
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
          <h1 className="text-2xl font-bold text-surface-900">Koçluk İlişkileri</h1>
          <p className="text-surface-500">Tüm koç-öğrenci eşleşmelerini yönet</p>
        </div>

        {/* Stats */}
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            { label: 'Aktif', count: relationships.filter(r => r.status === 'active').length, color: 'bg-green-50' },
            { label: 'Bekleyen', count: relationships.filter(r => r.status === 'pending').length, color: 'bg-yellow-50' },
            { label: 'Sonlanan', count: relationships.filter(r => r.status === 'ended').length, color: 'bg-red-50' },
          ].map((stat, i) => (
            <div key={i} className={`card p-4 ${stat.color}`}>
              <div className="text-2xl font-bold text-surface-900">{stat.count}</div>
              <div className="text-sm text-surface-600">{stat.label} Koçluk</div>
            </div>
          ))}
        </div>

        {/* Filter */}
        <div className="flex gap-2">
          {[
            { key: 'all', label: 'Tümü' },
            { key: 'active', label: 'Aktif' },
            { key: 'pending', label: 'Bekleyen' },
            { key: 'ended', label: 'Sonlanan' },
          ].map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
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

        {/* Relationships List */}
        {filteredRelationships.length > 0 ? (
          <div className="space-y-4">
            {filteredRelationships.map((rel, index) => {
              const config = statusConfig[rel.status] || statusConfig.pending
              const StatusIcon = config.icon

              return (
                <motion.div
                  key={rel.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="card p-6"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    {/* Coach */}
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-12 h-12 bg-gradient-to-br from-primary-400 to-primary-600 rounded-xl flex items-center justify-center text-white font-medium overflow-hidden">
                        {rel.coach?.profile?.avatar_url ? (
                          <img src={rel.coach.profile.avatar_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          getInitials(rel.coach?.profile?.full_name)
                        )}
                      </div>
                      <div>
                        <div className="text-xs text-surface-500">Koç</div>
                        <div className="font-medium text-surface-900">{rel.coach?.profile?.full_name || 'İsimsiz'}</div>
                      </div>
                    </div>

                    <ArrowRight className="w-5 h-5 text-surface-300 hidden sm:block" />

                    {/* Student */}
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-12 h-12 bg-gradient-to-br from-accent-400 to-accent-600 rounded-xl flex items-center justify-center text-white font-medium overflow-hidden">
                        {rel.student?.profile?.avatar_url ? (
                          <img src={rel.student.profile.avatar_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          getInitials(rel.student?.profile?.full_name)
                        )}
                      </div>
                      <div>
                        <div className="text-xs text-surface-500">Öğrenci</div>
                        <div className="font-medium text-surface-900">{rel.student?.profile?.full_name || 'İsimsiz'}</div>
                      </div>
                    </div>

                    {/* Status & Actions */}
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
                          <StatusIcon className="w-3 h-3" />
                          {config.label}
                        </span>
                        <div className="text-xs text-surface-500 mt-1">
                          {new Date(rel.created_at).toLocaleDateString('tr-TR')}
                        </div>
                      </div>
                      
                      {rel.status === 'pending' && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => updateStatus(rel.id, 'active')}
                            className="btn btn-primary btn-sm"
                          >
                            Onayla
                          </button>
                          <button
                            onClick={() => updateStatus(rel.id, 'ended')}
                            className="btn btn-ghost btn-sm text-red-500"
                          >
                            Reddet
                          </button>
                        </div>
                      )}
                      
                      {rel.status === 'active' && (
                        <button
                          onClick={() => updateStatus(rel.id, 'ended')}
                          className="btn btn-ghost btn-sm text-red-500"
                        >
                          Sonlandır
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        ) : (
          <div className="card p-12 text-center">
            <Target className="w-16 h-16 mx-auto mb-4 text-surface-300" />
            <h3 className="text-lg font-medium text-surface-900 mb-2">Koçluk ilişkisi bulunamadı</h3>
            <p className="text-surface-500">
              {filter !== 'all' ? 'Bu filtreye uygun ilişki yok.' : 'Henüz koçluk ilişkisi kurulmamış.'}
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

