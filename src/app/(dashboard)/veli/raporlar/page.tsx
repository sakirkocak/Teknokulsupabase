'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { useProfile, useParentProfile } from '@/hooks/useProfile'
import { createClient } from '@/lib/supabase/client'
import { getInitials } from '@/lib/utils'
import { motion } from 'framer-motion'
import { 
  FileText,
  Calendar,
  User,
  TrendingUp,
  CheckCircle,
  Clock,
  ChevronRight
} from 'lucide-react'

export default function ParentReportsPage() {
  const { profile, loading: profileLoading } = useProfile()
  const { parentProfile, loading: parentLoading } = useParentProfile(profile?.id || '')
  const [reports, setReports] = useState<any[]>([])
  const [selectedReport, setSelectedReport] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    if (parentProfile?.id) {
      loadReports()
    }
  }, [parentProfile?.id])

  async function loadReports() {
    setLoading(true)

    const { data } = await supabase
      .from('parent_reports')
      .select(`
        *,
        student:student_profiles!parent_reports_student_id_fkey(
          profile:profiles!student_profiles_user_id_fkey(full_name, avatar_url)
        ),
        coach:teacher_profiles!parent_reports_coach_id_fkey(
          profile:profiles!teacher_profiles_user_id_fkey(full_name)
        )
      `)
      .eq('parent_id', parentProfile?.id)
      .order('created_at', { ascending: false })

    if (data) {
      setReports(data)
      // İlk raporu seç
      if (data.length > 0 && !selectedReport) {
        setSelectedReport(data[0])
      }
    }

    setLoading(false)
  }

  async function markAsRead(reportId: string) {
    await supabase
      .from('parent_reports')
      .update({ is_read: true })
      .eq('id', reportId)
  }

  function selectReport(report: any) {
    setSelectedReport(report)
    if (!report.is_read) {
      markAsRead(report.id)
      setReports(prev => prev.map(r => 
        r.id === report.id ? { ...r, is_read: true } : r
      ))
    }
  }

  const pageLoading = profileLoading || parentLoading || loading

  if (pageLoading) {
    return (
      <DashboardLayout role="veli">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout role="veli">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Raporlarım</h1>
          <p className="text-surface-500">Koçlardan gelen ilerleme raporları</p>
        </div>

        {reports.length > 0 ? (
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Report List */}
            <div className="card overflow-hidden">
              <div className="p-4 border-b border-surface-100">
                <h3 className="font-semibold text-surface-900">Raporlar</h3>
              </div>
              <div className="divide-y divide-surface-100 max-h-[600px] overflow-y-auto">
                {reports.map((report) => (
                  <button
                    key={report.id}
                    onClick={() => selectReport(report)}
                    className={`w-full p-4 text-left hover:bg-surface-50 transition-colors ${
                      selectedReport?.id === report.id ? 'bg-primary-50' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        !report.is_read ? 'bg-primary-100' : 'bg-surface-100'
                      }`}>
                        <FileText className={`w-5 h-5 ${
                          !report.is_read ? 'text-primary-600' : 'text-surface-500'
                        }`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-surface-900 truncate">
                            {report.student?.profile?.full_name}
                          </span>
                          {!report.is_read && (
                            <span className="w-2 h-2 bg-primary-500 rounded-full" />
                          )}
                        </div>
                        <div className="text-sm text-surface-500 truncate">
                          {report.coach?.profile?.full_name}
                        </div>
                      </div>
                      <div className="text-xs text-surface-400">
                        {new Date(report.created_at).toLocaleDateString('tr-TR')}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Report Detail */}
            <div className="lg:col-span-2">
              {selectedReport ? (
                <motion.div
                  key={selectedReport.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="card"
                >
                  {/* Report Header */}
                  <div className="p-6 border-b border-surface-100 bg-gradient-to-r from-primary-50 to-accent-50">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center shadow-sm overflow-hidden">
                        {selectedReport.student?.profile?.avatar_url ? (
                          <img src={selectedReport.student.profile.avatar_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-xl font-bold text-primary-500">
                            {getInitials(selectedReport.student?.profile?.full_name)}
                          </span>
                        )}
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-surface-900">
                          {selectedReport.title || 'Haftalık Rapor'}
                        </h2>
                        <p className="text-surface-600">
                          {selectedReport.student?.profile?.full_name}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-surface-600">
                      <span className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        Koç: {selectedReport.coach?.profile?.full_name}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {new Date(selectedReport.created_at).toLocaleDateString('tr-TR')}
                      </span>
                    </div>
                  </div>

                  {/* Report Content */}
                  <div className="p-6 space-y-6">
                    {/* Stats */}
                    <div className="grid sm:grid-cols-3 gap-4">
                      <div className="p-4 bg-surface-50 rounded-xl text-center">
                        <div className="text-2xl font-bold text-surface-900">
                          {selectedReport.content?.tasks_completed || 0}/{selectedReport.content?.tasks_total || 0}
                        </div>
                        <div className="text-sm text-surface-500">Tamamlanan Görev</div>
                        <div className="mt-2 h-2 bg-surface-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-secondary-500 rounded-full"
                            style={{ width: `${selectedReport.content?.task_rate || 0}%` }}
                          />
                        </div>
                      </div>
                      <div className="p-4 bg-surface-50 rounded-xl text-center">
                        <div className="text-2xl font-bold text-primary-500">
                          {selectedReport.content?.avg_net || '0'}
                        </div>
                        <div className="text-sm text-surface-500">Ortalama Net</div>
                      </div>
                      <div className="p-4 bg-surface-50 rounded-xl text-center">
                        <div className="text-2xl font-bold text-accent-500">
                          {selectedReport.content?.task_rate || 0}%
                        </div>
                        <div className="text-sm text-surface-500">Başarı Oranı</div>
                      </div>
                    </div>

                    {/* Recent Exams */}
                    {selectedReport.content?.recent_exams?.length > 0 && (
                      <div>
                        <h3 className="font-semibold text-surface-900 mb-3">Son Denemeler</h3>
                        <div className="space-y-2">
                          {selectedReport.content.recent_exams.map((exam: any, i: number) => (
                            <div key={i} className="flex items-center justify-between p-3 bg-surface-50 rounded-lg">
                              <div>
                                <div className="font-medium text-surface-900">{exam.name}</div>
                                <div className="text-sm text-surface-500">
                                  {new Date(exam.date).toLocaleDateString('tr-TR')}
                                </div>
                              </div>
                              <div className="text-lg font-bold text-primary-500">
                                {exam.net?.toFixed(1)} net
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Coach Note */}
                    {selectedReport.content?.coach_note && (
                      <div className="p-4 bg-primary-50 rounded-xl">
                        <h3 className="font-semibold text-primary-900 mb-2">Koç Notu</h3>
                        <p className="text-primary-700">{selectedReport.content.coach_note}</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              ) : (
                <div className="card p-12 text-center">
                  <FileText className="w-16 h-16 mx-auto mb-4 text-surface-300" />
                  <p className="text-surface-500">Rapor seçin</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="card p-12 text-center">
            <FileText className="w-16 h-16 mx-auto mb-4 text-surface-300" />
            <h3 className="text-lg font-medium text-surface-900 mb-2">Henüz rapor yok</h3>
            <p className="text-surface-500">
              Koçlar ilerleme raporlarını buradan paylaşacak.
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

