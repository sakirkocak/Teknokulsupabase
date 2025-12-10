'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { useProfile, useTeacherProfile } from '@/hooks/useProfile'
import { createClient } from '@/lib/supabase/client'
import { motion } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import { 
  FileText,
  Loader2,
  User,
  Sparkles,
  Save,
  Copy,
  CheckCircle,
  Send,
  TrendingUp,
  TrendingDown,
  Minus,
  BarChart3,
  ClipboardList,
  Clock,
  Star
} from 'lucide-react'

interface Student {
  id: string
  user_id: string
  grade_level: string
  target_exam: string
  profiles: {
    full_name: string
    avatar_url: string | null
  }
}

interface TaskData {
  totalTasks: number
  completedTasks: number
  pendingTasks: number
  averageScore: number
  recentTasks: {
    title: string
    status: string
    score: number | null
    type: string
    completed_at: string | null
  }[]
}

interface PerformanceData {
  totalQuestions: number
  correctAnswers: number
  subjectPerformance: { subject: string; correct: number; total: number }[]
  recentTrend: 'improving' | 'stable' | 'declining'
}

export default function ReportGeneratorPage() {
  const { profile } = useProfile()
  const { teacherProfile } = useTeacherProfile(profile?.id || '')
  const [students, setStudents] = useState<Student[]>([])
  const [selectedStudentId, setSelectedStudentId] = useState('')
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [performanceData, setPerformanceData] = useState<PerformanceData | null>(null)
  const [taskData, setTaskData] = useState<TaskData | null>(null)
  const [generating, setGenerating] = useState(false)
  const [loadingData, setLoadingData] = useState(false)
  const [report, setReport] = useState('')
  const [saved, setSaved] = useState(false)
  const [copied, setCopied] = useState(false)
  const [sending, setSending] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    if (teacherProfile?.id) {
      loadStudents()
    }
  }, [teacherProfile?.id])

  useEffect(() => {
    if (selectedStudentId) {
      const student = students.find(s => s.id === selectedStudentId)
      setSelectedStudent(student || null)
      loadPerformanceData(selectedStudentId)
    }
  }, [selectedStudentId, students])

  async function loadStudents() {
    const { data } = await supabase
      .from('coaching_relationships')
      .select(`
        student:student_profiles!coaching_relationships_student_id_fkey(
          id,
          user_id,
          grade_level,
          target_exam,
          profiles:profiles!student_profiles_user_id_fkey(full_name, avatar_url)
        )
      `)
      .eq('coach_id', teacherProfile?.id)
      .eq('status', 'active')

    if (data) {
      const studentsData = data
        .map(d => {
          const student = d.student as any
          if (!student) return null
          return {
            id: student.id,
            user_id: student.user_id,
            grade_level: student.grade_level,
            target_exam: student.target_exam,
            profiles: Array.isArray(student.profiles) ? student.profiles[0] : student.profiles
          } as Student
        })
        .filter((s): s is Student => s !== null)
      setStudents(studentsData)
    }
  }

  async function loadPerformanceData(studentId: string) {
    setLoadingData(true)
    try {
      // Soru sonuçlarını al
      const { data: results } = await supabase
        .from('question_results')
        .select(`
          is_correct,
          created_at,
          question:ai_questions(subject)
        `)
        .eq('student_id', studentId)
        .order('created_at', { ascending: false })

      // Görev verilerini al
      const { data: tasks } = await supabase
        .from('tasks')
        .select('*')
        .eq('student_id', studentId)
        .order('created_at', { ascending: false })

      // Görev verilerini işle
      if (tasks && tasks.length > 0) {
        const completedTasks = tasks.filter(t => t.status === 'completed')
        const pendingTasks = tasks.filter(t => t.status !== 'completed')
        const tasksWithScore = completedTasks.filter(t => t.score !== null)
        const averageScore = tasksWithScore.length > 0
          ? tasksWithScore.reduce((sum, t) => sum + (t.score || 0), 0) / tasksWithScore.length
          : 0

        setTaskData({
          totalTasks: tasks.length,
          completedTasks: completedTasks.length,
          pendingTasks: pendingTasks.length,
          averageScore: Math.round(averageScore),
          recentTasks: tasks.slice(0, 5).map(t => ({
            title: t.title,
            status: t.status,
            score: t.score,
            type: t.type,
            completed_at: t.completed_at
          }))
        })
      } else {
        setTaskData({
          totalTasks: 0,
          completedTasks: 0,
          pendingTasks: 0,
          averageScore: 0,
          recentTasks: []
        })
      }

      if (results && results.length > 0) {
        const totalQuestions = results.length
        const correctAnswers = results.filter(r => r.is_correct).length

        // Subject performance
        const subjectMap: Record<string, { correct: number; total: number }> = {}
        results.forEach((r: any) => {
          const subject = r.question?.subject || 'Diğer'
          if (!subjectMap[subject]) {
            subjectMap[subject] = { correct: 0, total: 0 }
          }
          subjectMap[subject].total++
          if (r.is_correct) {
            subjectMap[subject].correct++
          }
        })

        const subjectPerformance = Object.entries(subjectMap).map(([subject, data]) => ({
          subject,
          correct: data.correct,
          total: data.total,
        }))

        // Recent trend (son 10 vs önceki 10)
        const recent10 = results.slice(0, 10)
        const prev10 = results.slice(10, 20)
        const recentRate = recent10.filter(r => r.is_correct).length / recent10.length
        const prevRate = prev10.length > 0 ? prev10.filter(r => r.is_correct).length / prev10.length : recentRate

        let recentTrend: 'improving' | 'stable' | 'declining' = 'stable'
        if (recentRate > prevRate + 0.1) recentTrend = 'improving'
        else if (recentRate < prevRate - 0.1) recentTrend = 'declining'

        setPerformanceData({
          totalQuestions,
          correctAnswers,
          subjectPerformance,
          recentTrend,
        })
      } else {
        setPerformanceData({
          totalQuestions: 0,
          correctAnswers: 0,
          subjectPerformance: [],
          recentTrend: 'stable',
        })
      }
    } catch (error) {
      console.error('Error loading performance data:', error)
    } finally {
      setLoadingData(false)
    }
  }

  async function handleGenerate() {
    if (!selectedStudent) {
      alert('Lütfen bir öğrenci seçin')
      return
    }

    // En az bir veri olmalı
    const hasQuestionData = performanceData && performanceData.totalQuestions > 0
    const hasTaskData = taskData && taskData.totalTasks > 0

    if (!hasQuestionData && !hasTaskData) {
      alert('Bu öğrenci için henüz yeterli veri yok')
      return
    }

    setGenerating(true)
    setReport('')

    try {
      const response = await fetch('/api/ai/generate-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentName: selectedStudent.profiles?.full_name || 'Öğrenci',
          gradeLevel: selectedStudent.grade_level || 'Belirtilmemiş',
          targetExam: selectedStudent.target_exam || 'Belirtilmemiş',
          performanceData,
          taskData,
        }),
      })

      const data = await response.json()

      if (data.error) {
        throw new Error(data.error)
      }

      setReport(data.report)
    } catch (error: any) {
      alert('Rapor oluşturma hatası: ' + error.message)
    } finally {
      setGenerating(false)
    }
  }

  async function handleSave() {
    if (!report || !teacherProfile?.id) return

    try {
      await supabase
        .from('ai_generated_content')
        .insert({
          coach_id: teacherProfile.id,
          tool_type: 'report',
          title: `${selectedStudent?.profiles?.full_name || 'Öğrenci'} - İlerleme Raporu`,
          content: { report },
          metadata: {
            studentId: selectedStudentId,
            performanceData,
            generatedAt: new Date().toISOString(),
          },
        })

      // Kullanım istatistiği
      await supabase
        .from('ai_usage_stats')
        .insert({
          coach_id: teacherProfile.id,
          tool_type: 'report',
        })

      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (error: any) {
      alert('Kaydetme hatası: ' + error.message)
    }
  }

  async function handleSendToParent() {
    if (!report || !selectedStudent) return

    setSending(true)

    try {
      // Veliye rapor gönder (parent_reports tablosuna)
      const { data: parentRelation } = await supabase
        .from('parent_student_relations')
        .select('parent_id')
        .eq('student_id', selectedStudent.user_id)
        .single()

      if (parentRelation) {
        await supabase
          .from('parent_reports')
          .insert({
            student_id: selectedStudentId,
            coach_id: teacherProfile?.id,
            parent_id: parentRelation.parent_id,
            report_type: 'progress',
            content: report,
          })

        // Bildirim gönder
        const { data: parentProfile } = await supabase
          .from('parent_profiles')
          .select('user_id')
          .eq('id', parentRelation.parent_id)
          .single()

        if (parentProfile) {
          await supabase
            .from('notifications')
            .insert({
              user_id: parentProfile.user_id,
              title: 'Yeni İlerleme Raporu',
              body: `${selectedStudent.profiles?.full_name || 'Çocuğunuz'} için yeni bir ilerleme raporu gönderildi.`,
              type: 'report',
              data: { link: '/veli/raporlar' },
            })
        }

        alert('Rapor veliye gönderildi!')
      } else {
        alert('Öğrencinin kayıtlı velisi bulunamadı.')
      }
    } catch (error: any) {
      alert('Gönderme hatası: ' + error.message)
    } finally {
      setSending(false)
    }
  }

  function handleCopy() {
    navigator.clipboard.writeText(report)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const trendConfig = {
    improving: { icon: TrendingUp, color: 'text-green-500', label: 'Yükseliyor' },
    stable: { icon: Minus, color: 'text-yellow-500', label: 'Sabit' },
    declining: { icon: TrendingDown, color: 'text-red-500', label: 'Düşüyor' },
  }

  return (
    <DashboardLayout role="koc">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-surface-900 flex items-center gap-2">
            <FileText className="w-7 h-7 text-primary-500" />
            Rapor Oluşturucu
          </h1>
          <p className="text-surface-500">Öğrenci ilerleme raporu oluşturun ve veliye gönderin</p>
        </div>

        {/* Form */}
        <div className="card p-6 space-y-6">
          <div>
            <label className="label">
              <User className="w-4 h-4 inline mr-1" />
              Öğrenci Seç
            </label>
            <select
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className="input"
            >
              <option value="">Öğrenci seçin</option>
              {students.map(s => (
                <option key={s.id} value={s.id}>{s.profiles?.full_name}</option>
              ))}
            </select>
          </div>

          {/* Performance Summary */}
          {selectedStudent && (
            loadingData ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
                <span className="ml-2 text-surface-500">Performans verileri yükleniyor...</span>
              </div>
            ) : performanceData && performanceData.totalQuestions > 0 ? (
              <div className="space-y-4">
                <h3 className="font-medium text-surface-900 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-primary-500" />
                  Performans Özeti
                </h3>
                
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 bg-surface-50 rounded-xl">
                    <p className="text-2xl font-bold text-surface-900">
                      {performanceData.totalQuestions}
                    </p>
                    <p className="text-sm text-surface-500">Çözülen Soru</p>
                  </div>
                  <div className="p-4 bg-green-50 rounded-xl">
                    <p className="text-2xl font-bold text-green-600">
                      %{performanceData.totalQuestions > 0 
                        ? ((performanceData.correctAnswers / performanceData.totalQuestions) * 100).toFixed(0) 
                        : 0}
                    </p>
                    <p className="text-sm text-green-600">Başarı Oranı</p>
                  </div>
                  <div className="p-4 bg-surface-50 rounded-xl">
                    <div className={`flex items-center gap-2 ${trendConfig[performanceData.recentTrend].color}`}>
                      {(() => {
                        const TrendIcon = trendConfig[performanceData.recentTrend].icon
                        return <TrendIcon className="w-5 h-5" />
                      })()}
                      <span className="font-bold">{trendConfig[performanceData.recentTrend].label}</span>
                    </div>
                    <p className="text-sm text-surface-500">Trend</p>
                  </div>
                </div>

                {performanceData.subjectPerformance.length > 0 && (
                  <div>
                    <p className="text-sm text-surface-500 mb-2">Ders Bazlı Performans</p>
                    <div className="space-y-2">
                      {performanceData.subjectPerformance.map(sp => (
                        <div key={sp.subject} className="flex items-center gap-3">
                          <span className="w-24 text-sm text-surface-600">{sp.subject}</span>
                          <div className="flex-1 h-3 bg-surface-100 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-primary-500 rounded-full"
                              style={{ width: `${(sp.correct / sp.total) * 100}%` }}
                            />
                          </div>
                          <span className="text-sm text-surface-500 w-16 text-right">
                            {sp.correct}/{sp.total}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Görev Verileri */}
                {taskData && taskData.totalTasks > 0 && (
                  <div className="border-t border-surface-100 pt-4 mt-4">
                    <h3 className="font-medium text-surface-900 flex items-center gap-2 mb-3">
                      <ClipboardList className="w-5 h-5 text-accent-500" />
                      Görev Performansı
                    </h3>
                    
                    <div className="grid grid-cols-4 gap-3 mb-4">
                      <div className="p-3 bg-surface-50 rounded-xl text-center">
                        <p className="text-xl font-bold text-surface-900">{taskData.totalTasks}</p>
                        <p className="text-xs text-surface-500">Toplam Görev</p>
                      </div>
                      <div className="p-3 bg-green-50 rounded-xl text-center">
                        <p className="text-xl font-bold text-green-600">{taskData.completedTasks}</p>
                        <p className="text-xs text-green-600">Tamamlanan</p>
                      </div>
                      <div className="p-3 bg-yellow-50 rounded-xl text-center">
                        <p className="text-xl font-bold text-yellow-600">{taskData.pendingTasks}</p>
                        <p className="text-xs text-yellow-600">Bekleyen</p>
                      </div>
                      <div className="p-3 bg-primary-50 rounded-xl text-center">
                        <p className="text-xl font-bold text-primary-600">{taskData.averageScore || '-'}</p>
                        <p className="text-xs text-primary-600">Ort. Puan</p>
                      </div>
                    </div>

                    {taskData.recentTasks.length > 0 && (
                      <div>
                        <p className="text-sm text-surface-500 mb-2">Son Görevler</p>
                        <div className="space-y-2">
                          {taskData.recentTasks.map((task, idx) => (
                            <div key={idx} className="flex items-center gap-3 p-2 bg-surface-50 rounded-lg">
                              <div className={`w-2 h-2 rounded-full ${
                                task.status === 'completed' ? 'bg-green-500' :
                                task.status === 'submitted' ? 'bg-purple-500' :
                                task.status === 'in_progress' ? 'bg-blue-500' :
                                'bg-yellow-500'
                              }`} />
                              <span className="flex-1 text-sm text-surface-700 truncate">{task.title}</span>
                              {task.score !== null && (
                                <span className="flex items-center gap-1 text-sm text-primary-600">
                                  <Star className="w-3 h-3" />
                                  {task.score}
                                </span>
                              )}
                              <span className="text-xs text-surface-400 capitalize">{task.type}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-surface-500">
                <BarChart3 className="w-12 h-12 mx-auto text-surface-300 mb-2" />
                <p>Bu öğrenci için henüz performans verisi yok</p>
                <p className="text-sm">Öğrenci ödev çözdükçe veriler oluşacak</p>
              </div>
            )
          )}

          <button
            onClick={handleGenerate}
            disabled={generating || !selectedStudent || ((!performanceData || performanceData.totalQuestions === 0) && (!taskData || taskData.totalTasks === 0))}
            className="btn btn-primary btn-lg w-full"
          >
            {generating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Rapor Oluşturuluyor...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                İlerleme Raporu Oluştur
              </>
            )}
          </button>
        </div>

        {/* Generated Report */}
        {report && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card"
          >
            <div className="p-4 border-b border-surface-100 flex items-center justify-between">
              <h2 className="font-semibold text-surface-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary-500" />
                Oluşturulan Rapor
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={handleCopy}
                  className={`btn btn-sm ${copied ? 'btn-primary' : 'btn-outline'}`}
                >
                  {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied ? 'Kopyalandı' : 'Kopyala'}
                </button>
                <button
                  onClick={handleSave}
                  className={`btn btn-sm ${saved ? 'btn-primary' : 'btn-outline'}`}
                >
                  {saved ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                  {saved ? 'Kaydedildi' : 'Kaydet'}
                </button>
                <button
                  onClick={handleSendToParent}
                  disabled={sending}
                  className="btn btn-sm btn-primary"
                >
                  {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  Veliye Gönder
                </button>
              </div>
            </div>
            <div className="p-6 prose prose-sm max-w-none">
              <ReactMarkdown>{report}</ReactMarkdown>
            </div>
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  )
}

