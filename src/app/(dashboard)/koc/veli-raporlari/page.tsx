'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { useProfile, useTeacherProfile } from '@/hooks/useProfile'
import { createClient } from '@/lib/supabase/client'
import { getInitials } from '@/lib/utils'
import { motion } from 'framer-motion'
import { 
  FileText,
  Send,
  User,
  CheckCircle,
  Loader2,
  Calendar,
  TrendingUp,
  ClipboardList
} from 'lucide-react'

export default function ParentReportsPage() {
  const { profile, loading: profileLoading } = useProfile()
  const { teacherProfile, loading: teacherLoading } = useTeacherProfile(profile?.id || '')
  const [students, setStudents] = useState<any[]>([])
  const [selectedStudent, setSelectedStudent] = useState<string>('')
  const [studentData, setStudentData] = useState<any>(null)
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [reportNote, setReportNote] = useState('')
  const [sentReports, setSentReports] = useState<any[]>([])
  const supabase = createClient()

  useEffect(() => {
    if (teacherProfile?.id) {
      loadStudents()
      loadSentReports()
    }
  }, [teacherProfile?.id])

  async function loadStudents() {
    const { data } = await supabase
      .from('coaching_relationships')
      .select(`
        student:student_profiles!coaching_relationships_student_id_fkey(
          id,
          user_id,
          grade_level,
          profile:profiles!student_profiles_user_id_fkey(full_name, avatar_url)
        )
      `)
      .eq('coach_id', teacherProfile?.id)
      .eq('status', 'active')

    if (data) {
      setStudents(data.map(d => d.student))
    }
  }

  async function loadSentReports() {
    const { data } = await supabase
      .from('parent_reports')
      .select(`
        *,
        student:student_profiles!parent_reports_student_id_fkey(
          profile:profiles!student_profiles_user_id_fkey(full_name)
        ),
        parent:parent_profiles!parent_reports_parent_id_fkey(
          profile:profiles!parent_profiles_user_id_fkey(full_name)
        )
      `)
      .eq('coach_id', teacherProfile?.id)
      .order('created_at', { ascending: false })
      .limit(10)

    if (data) {
      setSentReports(data)
    }
  }

  async function loadStudentData(studentId: string) {
    // Görevler
    const { data: tasks } = await supabase
      .from('tasks')
      .select('*')
      .eq('student_id', studentId)

    // Denemeler
    const { data: exams } = await supabase
      .from('exam_results')
      .select('*')
      .eq('student_id', studentId)
      .eq('status', 'approved')
      .order('exam_date', { ascending: false })
      .limit(5)

    // Veli bilgisi
    const { data: parentRel } = await supabase
      .from('parent_students')
      .select(`
        parent:parent_profiles!parent_students_parent_id_fkey(
          id,
          profile:profiles!parent_profiles_user_id_fkey(full_name, email)
        )
      `)
      .eq('student_id', studentId)
      .eq('status', 'approved')
      .limit(1)
      .single()

    const completedTasks = tasks?.filter(t => t.status === 'completed').length || 0
    const totalTasks = tasks?.length || 0
    const avgNet = exams && exams.length > 0
      ? exams.reduce((acc, e) => acc + (e.net_score || 0), 0) / exams.length
      : 0

    setStudentData({
      tasks: { completed: completedTasks, total: totalTasks },
      exams: exams || [],
      avgNet,
      parent: parentRel?.parent || null,
    })
  }

  useEffect(() => {
    if (selectedStudent) {
      loadStudentData(selectedStudent)
    } else {
      setStudentData(null)
    }
  }, [selectedStudent])

  async function sendReport() {
    if (!selectedStudent || !studentData?.parent) {
      alert('Lütfen öğrenci seçin ve velinin kayıtlı olduğundan emin olun.')
      return
    }

    setSending(true)

    const student = students.find(s => s.id === selectedStudent)

    const reportContent = {
      student_name: student?.profile?.full_name,
      grade_level: student?.grade_level,
      tasks_completed: studentData.tasks.completed,
      tasks_total: studentData.tasks.total,
      task_rate: studentData.tasks.total > 0 
        ? Math.round((studentData.tasks.completed / studentData.tasks.total) * 100) 
        : 0,
      avg_net: studentData.avgNet.toFixed(1),
      recent_exams: studentData.exams.slice(0, 3).map((e: any) => ({
        name: e.exam_name,
        net: e.net_score,
        date: e.exam_date,
      })),
      coach_note: reportNote,
      generated_at: new Date().toISOString(),
    }

    // Raporu kaydet
    const { error } = await supabase
      .from('parent_reports')
      .insert({
        coach_id: teacherProfile?.id,
        parent_id: studentData.parent.id,
        student_id: selectedStudent,
        report_type: 'weekly',
        title: `Haftalık Rapor - ${student?.profile?.full_name}`,
        content: reportContent,
      })

    if (!error) {
      // Veliye bildirim gönder
      const parentUserId = studentData.parent.profile?.id
      if (parentUserId) {
        await supabase.from('notifications').insert({
          user_id: parentUserId,
          title: 'Yeni Rapor',
          message: `${student?.profile?.full_name} için yeni bir haftalık rapor gönderildi.`,
          type: 'info',
          link: '/veli',
        })
      }

      setSent(true)
      setReportNote('')
      loadSentReports()
      setTimeout(() => setSent(false), 3000)
    } else {
      alert('Hata: ' + error.message)
    }

    setSending(false)
  }

  const pageLoading = profileLoading || teacherLoading

  if (pageLoading) {
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
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Veli Raporları</h1>
          <p className="text-surface-500">Öğrenci ilerleme raporlarını velilere gönder</p>
        </div>

        {/* Success Message */}
        {sent && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-green-50 text-green-700 rounded-xl flex items-center gap-2"
          >
            <CheckCircle className="w-5 h-5" />
            Rapor başarıyla gönderildi!
          </motion.div>
        )}

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Create Report */}
          <div className="card p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-primary-50 rounded-xl flex items-center justify-center">
                <FileText className="w-6 h-6 text-primary-500" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-surface-900">Rapor Oluştur</h2>
                <p className="text-sm text-surface-500">Öğrenci seç ve rapor gönder</p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Student Select */}
              <div>
                <label className="label">
                  <User className="w-4 h-4 inline mr-1" />
                  Öğrenci Seç
                </label>
                <select
                  value={selectedStudent}
                  onChange={(e) => setSelectedStudent(e.target.value)}
                  className="input"
                >
                  <option value="">Öğrenci seçin</option>
                  {students.map(s => (
                    <option key={s.id} value={s.id}>{s.profile?.full_name}</option>
                  ))}
                </select>
              </div>

              {/* Student Data Preview */}
              {studentData && (
                <div className="p-4 bg-surface-50 rounded-xl space-y-3">
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div>
                      <div className="text-lg font-bold text-surface-900">
                        {studentData.tasks.completed}/{studentData.tasks.total}
                      </div>
                      <div className="text-xs text-surface-500">Görev</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-primary-500">
                        {studentData.avgNet.toFixed(1)}
                      </div>
                      <div className="text-xs text-surface-500">Ort. Net</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-secondary-500">
                        {studentData.exams.length}
                      </div>
                      <div className="text-xs text-surface-500">Deneme</div>
                    </div>
                  </div>

                  {studentData.parent ? (
                    <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 p-2 rounded-lg">
                      <CheckCircle className="w-4 h-4" />
                      Veli: {studentData.parent.profile?.full_name}
                    </div>
                  ) : (
                    <div className="text-sm text-yellow-600 bg-yellow-50 p-2 rounded-lg">
                      ⚠️ Bu öğrencinin kayıtlı velisi yok
                    </div>
                  )}
                </div>
              )}

              {/* Coach Note */}
              <div>
                <label className="label">Koç Notu (Opsiyonel)</label>
                <textarea
                  value={reportNote}
                  onChange={(e) => setReportNote(e.target.value)}
                  className="input min-h-[100px]"
                  placeholder="Veliye özel notunuz..."
                />
              </div>

              {/* Send Button */}
              <button
                onClick={sendReport}
                disabled={sending || !selectedStudent || !studentData?.parent}
                className="btn btn-primary btn-lg w-full"
              >
                {sending ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Gönderiliyor...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Veliye Rapor Gönder
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Sent Reports */}
          <div className="card">
            <div className="p-6 border-b border-surface-100">
              <h2 className="text-lg font-semibold text-surface-900">Gönderilen Raporlar</h2>
              <p className="text-sm text-surface-500">Son gönderilen raporlar</p>
            </div>
            <div className="divide-y divide-surface-100 max-h-[500px] overflow-y-auto">
              {sentReports.length > 0 ? sentReports.map((report) => (
                <div key={report.id} className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary-50 rounded-lg flex items-center justify-center">
                      <FileText className="w-5 h-5 text-primary-500" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-surface-900">
                        {report.student?.profile?.full_name}
                      </div>
                      <div className="text-sm text-surface-500">
                        → {report.parent?.profile?.full_name}
                      </div>
                    </div>
                    <div className="text-xs text-surface-400">
                      {new Date(report.created_at).toLocaleDateString('tr-TR')}
                    </div>
                  </div>
                </div>
              )) : (
                <div className="p-8 text-center">
                  <FileText className="w-12 h-12 mx-auto mb-3 text-surface-300" />
                  <p className="text-surface-500">Henüz rapor gönderilmemiş</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

