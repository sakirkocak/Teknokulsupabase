'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { 
  ArrowLeft, Users, TrendingUp, Target, Award,
  BookOpen, BarChart2, AlertTriangle, CheckCircle2,
  Trophy, ArrowUpRight, ArrowDownRight
} from 'lucide-react'

interface ClassroomStats {
  name: string
  subject: string
  total_students: number
  joined_students: number
  total_tasks: number
  completed_tasks: number
  avg_score: number
  total_exams: number
}

interface StudentPerformance {
  id: string
  name: string
  avatar_url: string | null
  tasks_completed: number
  avg_score: number
  exam_avg: number
  trend: 'up' | 'down' | 'stable'
}

interface WeakTopic {
  topic: string
  student_count: number
  percentage: number
}

interface SubjectStats {
  subject: string
  avg_correct: number
  avg_wrong: number
  avg_net: number
}

export default function SinifIstatistiklerPage() {
  const params = useParams()
  const supabase = createClientComponentClient()

  const [stats, setStats] = useState<ClassroomStats | null>(null)
  const [topStudents, setTopStudents] = useState<StudentPerformance[]>([])
  const [weakStudents, setWeakStudents] = useState<StudentPerformance[]>([])
  const [weakTopics, setWeakTopics] = useState<WeakTopic[]>([])
  const [subjectStats, setSubjectStats] = useState<SubjectStats[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [params.id])

  async function loadStats() {
    try {
      const classroomId = params.id as string

      // Sınıf bilgisi
      const { data: classroom } = await supabase
        .from('classrooms')
        .select('name, subject')
        .eq('id', classroomId)
        .single()

      // Öğrenci sayıları
      const { count: totalStudents } = await supabase
        .from('classroom_students')
        .select('*', { count: 'exact', head: true })
        .eq('classroom_id', classroomId)

      const { count: joinedStudents } = await supabase
        .from('classroom_students')
        .select('*', { count: 'exact', head: true })
        .eq('classroom_id', classroomId)
        .eq('status', 'joined')

      // Sınıf öğrenci ID'lerini al
      const { data: classroomStudents } = await supabase
        .from('classroom_students')
        .select('student_id')
        .eq('classroom_id', classroomId)
        .eq('status', 'joined')
        .not('student_id', 'is', null)

      const studentIds = classroomStudents?.map(s => s.student_id) || []

      // Görev istatistikleri
      const { count: totalTasks } = await supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .eq('classroom_id', classroomId)

      const { data: completedTasksData } = await supabase
        .from('tasks')
        .select('score')
        .eq('classroom_id', classroomId)
        .eq('status', 'completed')

      const completedTasks = completedTasksData?.length || 0
      const avgScore = completedTasksData?.length 
        ? completedTasksData.reduce((acc, t) => acc + (t.score || 0), 0) / completedTasksData.length
        : 0

      // Deneme sayısı
      let totalExams = 0
      if (studentIds.length > 0) {
        const { count } = await supabase
          .from('exam_results')
          .select('*', { count: 'exact', head: true })
          .in('student_id', studentIds)

        totalExams = count || 0
      }

      setStats({
        name: classroom?.name || '',
        subject: classroom?.subject || '',
        total_students: totalStudents || 0,
        joined_students: joinedStudents || 0,
        total_tasks: totalTasks || 0,
        completed_tasks: completedTasks,
        avg_score: avgScore,
        total_exams: totalExams
      })

      // Öğrenci performansları
      if (studentIds.length > 0) {
        const { data: studentsData } = await supabase
          .from('student_profiles')
          .select('id, full_name, avatar_url')
          .in('id', studentIds)

        // Her öğrenci için performans hesapla
        const performances: StudentPerformance[] = []
        
        for (const student of studentsData || []) {
          // Görevler
          const { data: taskData } = await supabase
            .from('tasks')
            .select('score')
            .eq('student_id', student.id)
            .eq('classroom_id', classroomId)
            .eq('status', 'completed')

          // Denemeler
          const { data: examData } = await supabase
            .from('exam_results')
            .select('net_score')
            .eq('student_id', student.id)

          const tasksCompleted = taskData?.length || 0
          const avgTaskScore = tasksCompleted > 0 
            ? taskData!.reduce((acc, t) => acc + (t.score || 0), 0) / tasksCompleted
            : 0
          const examAvg = examData?.length
            ? examData.reduce((acc, e) => acc + (e.net_score || 0), 0) / examData.length
            : 0

          performances.push({
            id: student.id,
            name: student.full_name,
            avatar_url: student.avatar_url,
            tasks_completed: tasksCompleted,
            avg_score: avgTaskScore,
            exam_avg: examAvg,
            trend: avgTaskScore >= 70 ? 'up' : avgTaskScore >= 50 ? 'stable' : 'down'
          })
        }

        // En başarılı ve gelişmesi gereken öğrenciler
        const sorted = [...performances].sort((a, b) => b.avg_score - a.avg_score)
        setTopStudents(sorted.slice(0, 5))
        setWeakStudents(sorted.slice(-5).reverse())

        // Zayıf konuları topla
        const topicCounts: Record<string, number> = {}
        for (const studentId of studentIds) {
          const { data: exams } = await supabase
            .from('exam_results')
            .select('weak_topics')
            .eq('student_id', studentId)

          for (const exam of exams || []) {
            for (const topic of exam.weak_topics || []) {
              topicCounts[topic] = (topicCounts[topic] || 0) + 1
            }
          }
        }

        const sortedTopics = Object.entries(topicCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10)
          .map(([topic, count]) => ({
            topic,
            student_count: count,
            percentage: Math.round((count / studentIds.length) * 100)
          }))

        setWeakTopics(sortedTopics)

        // Ders bazlı istatistikler
        const subjectData: Record<string, { correct: number[], wrong: number[], net: number[] }> = {}
        
        for (const studentId of studentIds) {
          const { data: exams } = await supabase
            .from('exam_results')
            .select('subject_results')
            .eq('student_id', studentId)

          for (const exam of exams || []) {
            if (exam.subject_results) {
              for (const [subject, data] of Object.entries(exam.subject_results as any)) {
                if (!subjectData[subject]) {
                  subjectData[subject] = { correct: [], wrong: [], net: [] }
                }
                subjectData[subject].correct.push((data as any).correct || 0)
                subjectData[subject].wrong.push((data as any).wrong || 0)
                const net = ((data as any).correct || 0) - ((data as any).wrong || 0) * 0.25
                subjectData[subject].net.push(net)
              }
            }
          }
        }

        const subjectStatsArray = Object.entries(subjectData).map(([subject, data]) => ({
          subject,
          avg_correct: data.correct.length ? data.correct.reduce((a, b) => a + b, 0) / data.correct.length : 0,
          avg_wrong: data.wrong.length ? data.wrong.reduce((a, b) => a + b, 0) / data.wrong.length : 0,
          avg_net: data.net.length ? data.net.reduce((a, b) => a + b, 0) / data.net.length : 0
        }))

        setSubjectStats(subjectStatsArray)
      }

    } catch (error) {
      console.error('İstatistik yükleme hatası:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">İstatistikler yüklenemedi</p>
      </div>
    )
  }

  const taskCompletionRate = stats.total_tasks > 0 
    ? Math.round((stats.completed_tasks / stats.total_tasks) * 100) 
    : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link 
          href={`/koc/siniflarim/${params.id}`}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{stats.name} - İstatistikler</h1>
          <p className="text-gray-600">Sınıf performans analizi</p>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-xl">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.joined_students}</p>
              <p className="text-sm text-gray-500">Aktif Öğrenci</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-100 rounded-xl">
              <CheckCircle2 className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{taskCompletionRate}%</p>
              <p className="text-sm text-gray-500">Görev Tamamlama</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-100 rounded-xl">
              <Target className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.avg_score.toFixed(1)}</p>
              <p className="text-sm text-gray-500">Ortalama Puan</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-100 rounded-xl">
              <BookOpen className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.total_exams}</p>
              <p className="text-sm text-gray-500">Deneme Sonucu</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* En Başarılı Öğrenciler */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Trophy className="w-5 h-5 text-amber-500" />
            <h3 className="font-semibold text-gray-900">En Başarılı Öğrenciler</h3>
          </div>
          
          {topStudents.length === 0 ? (
            <p className="text-gray-500 text-center py-4">Henüz veri yok</p>
          ) : (
            <div className="space-y-3">
              {topStudents.map((student, index) => (
                <div key={student.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className={`
                      w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold
                      ${index === 0 ? 'bg-yellow-100 text-yellow-700' :
                        index === 1 ? 'bg-gray-100 text-gray-600' :
                        index === 2 ? 'bg-orange-100 text-orange-700' :
                        'bg-gray-50 text-gray-500'}
                    `}>
                      {index + 1}
                    </span>
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                      {student.avatar_url ? (
                        <img src={student.avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-gray-500 text-xs">{student.name.charAt(0)}</span>
                      )}
                    </div>
                    <span className="font-medium text-gray-900">{student.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-blue-600">{student.avg_score.toFixed(0)}</span>
                    {student.trend === 'up' && <ArrowUpRight className="w-4 h-4 text-green-500" />}
                    {student.trend === 'down' && <ArrowDownRight className="w-4 h-4 text-red-500" />}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Gelişmesi Gereken Öğrenciler */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-orange-500" />
            <h3 className="font-semibold text-gray-900">Destek Gerektirenler</h3>
          </div>
          
          {weakStudents.length === 0 ? (
            <p className="text-gray-500 text-center py-4">Henüz veri yok</p>
          ) : (
            <div className="space-y-3">
              {weakStudents.map((student) => (
                <div key={student.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                      {student.avatar_url ? (
                        <img src={student.avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-gray-500 text-xs">{student.name.charAt(0)}</span>
                      )}
                    </div>
                    <span className="font-medium text-gray-900">{student.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-lg font-bold ${
                      student.avg_score >= 50 ? 'text-amber-600' : 'text-red-600'
                    }`}>
                      {student.avg_score.toFixed(0)}
                    </span>
                    <span className="text-sm text-gray-500">
                      ({student.tasks_completed} görev)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Zayıf Konular */}
      {weakTopics.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-4">
            <BarChart2 className="w-5 h-5 text-red-500" />
            <h3 className="font-semibold text-gray-900">Sınıf Geneli Zayıf Konular</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {weakTopics.map((topic, index) => (
              <motion.div
                key={topic.topic}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center justify-between p-3 bg-red-50 rounded-lg"
              >
                <span className="font-medium text-gray-900">{topic.topic}</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-2 bg-red-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-red-500 rounded-full"
                      style={{ width: `${topic.percentage}%` }}
                    />
                  </div>
                  <span className="text-sm text-red-600 font-medium">
                    {topic.student_count} öğrenci
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Ders Bazlı İstatistikler */}
      {subjectStats.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-blue-500" />
            <h3 className="font-semibold text-gray-900">Ders Bazlı Ortalamalar</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {subjectStats.map((subject) => (
              <div key={subject.subject} className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-3">{subject.subject}</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Ort. Doğru</span>
                    <span className="font-medium text-green-600">{subject.avg_correct.toFixed(1)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Ort. Yanlış</span>
                    <span className="font-medium text-red-600">{subject.avg_wrong.toFixed(1)}</span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="text-gray-700 font-medium">Net</span>
                    <span className="font-bold text-blue-600">{subject.avg_net.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

