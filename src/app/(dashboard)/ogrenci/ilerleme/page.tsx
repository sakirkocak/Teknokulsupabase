'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { useProfile, useStudentProfile } from '@/hooks/useProfile'
import { createClient } from '@/lib/supabase/client'
import { motion } from 'framer-motion'
import { 
  TrendingUp,
  TrendingDown,
  Target,
  CheckCircle,
  XCircle,
  FileText,
  BookOpen,
  Award,
  Calendar,
  ArrowUp,
  ArrowDown,
  Minus,
  Brain,
  Loader2,
  BarChart3,
  Sparkles,
  AlertTriangle,
  ChevronRight,
  Flame
} from 'lucide-react'

interface ExamResult {
  id: string
  exam_name: string
  exam_type: string
  exam_date: string
  net_score: number
  total_correct: number
  total_wrong: number
  total_empty: number
  weak_topics: string[]
  strong_topics: string[]
  subject_results: any[]
}

interface AssignmentResult {
  id: string
  title: string
  score: number
  completed_at: string
  correct_count: number
  wrong_count: number
}

interface SubjectProgress {
  name: string
  exams: { date: string; net: number }[]
  avgNet: number
  trend: 'up' | 'down' | 'stable'
  change: number
}

export default function StudentProgressPage() {
  const { profile, loading: profileLoading } = useProfile()
  const { studentProfile, loading: studentLoading } = useStudentProfile(profile?.id || '')
  const [exams, setExams] = useState<ExamResult[]>([])
  const [assignments, setAssignments] = useState<AssignmentResult[]>([])
  const [subjectProgress, setSubjectProgress] = useState<SubjectProgress[]>([])
  const [allWeakTopics, setAllWeakTopics] = useState<string[]>([])
  const [allStrongTopics, setAllStrongTopics] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    if (studentProfile?.id) {
      loadProgressData()
    }
  }, [studentProfile?.id])

  async function loadProgressData() {
    setLoading(true)
    try {
      // Deneme sonuçlarını yükle
      const { data: examData } = await supabase
        .from('exam_results')
        .select('*')
        .eq('student_id', studentProfile?.id)
        .order('exam_date', { ascending: true })

      if (examData) {
        setExams(examData)

        // Ders bazlı ilerleme hesapla
        const subjectMap = new Map<string, { nets: { date: string; net: number }[] }>()
        
        examData.forEach(exam => {
          if (exam.subject_results) {
            exam.subject_results.forEach((subject: any) => {
              if (!subjectMap.has(subject.name)) {
                subjectMap.set(subject.name, { nets: [] })
              }
              subjectMap.get(subject.name)?.nets.push({
                date: exam.exam_date,
                net: subject.net || 0
              })
            })
          }
        })

        // Trend ve ortalama hesapla
        const progressArray: SubjectProgress[] = []
        subjectMap.forEach((data, name) => {
          const nets = data.nets.map(n => n.net)
          const avgNet = nets.reduce((a, b) => a + b, 0) / nets.length
          
          let trend: 'up' | 'down' | 'stable' = 'stable'
          let change = 0
          
          if (nets.length >= 2) {
            const lastTwo = nets.slice(-2)
            change = lastTwo[1] - lastTwo[0]
            if (change > 1) trend = 'up'
            else if (change < -1) trend = 'down'
          }

          progressArray.push({
            name,
            exams: data.nets,
            avgNet,
            trend,
            change
          })
        })

        setSubjectProgress(progressArray.sort((a, b) => b.avgNet - a.avgNet))

        // Tüm zayıf ve güçlü konuları topla
        const weakSet = new Set<string>()
        const strongSet = new Set<string>()
        
        examData.forEach(exam => {
          exam.weak_topics?.forEach((t: string) => weakSet.add(t))
          exam.strong_topics?.forEach((t: string) => strongSet.add(t))
        })

        setAllWeakTopics(Array.from(weakSet))
        setAllStrongTopics(Array.from(strongSet))
      }

      // Ödev sonuçlarını yükle
      const { data: responsesData } = await supabase
        .from('assignment_responses')
        .select(`
          *,
          assignment:assignments!assignment_responses_assignment_id_fkey(title)
        `)
        .eq('student_id', studentProfile?.id)
        .order('completed_at', { ascending: false })
        .limit(10)

      if (responsesData) {
        const assignmentResults: AssignmentResult[] = responsesData.map(r => {
          const answers = (r.answers || []) as any[]
          return {
            id: r.id,
            title: r.assignment?.title || 'Ödev',
            score: r.score || 0,
            completed_at: r.completed_at,
            correct_count: answers.filter(a => a.isCorrect).length,
            wrong_count: answers.filter(a => !a.isCorrect).length,
          }
        })
        setAssignments(assignmentResults)
      }

    } catch (error) {
      console.error('Error loading progress:', error)
    } finally {
      setLoading(false)
    }
  }

  const pageLoading = profileLoading || studentLoading || loading

  if (pageLoading) {
    return (
      <DashboardLayout role="ogrenci">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
        </div>
      </DashboardLayout>
    )
  }

  // İstatistikler
  const totalExams = exams.length
  const avgNet = exams.length > 0 
    ? exams.reduce((a, e) => a + (e.net_score || 0), 0) / exams.length 
    : 0
  const lastExam = exams[exams.length - 1]
  const firstExam = exams[0]
  const totalProgress = lastExam && firstExam && exams.length > 1
    ? (lastExam.net_score || 0) - (firstExam.net_score || 0)
    : 0

  // Başarı trendini hesapla
  const recentExams = exams.slice(-3)
  const olderExams = exams.slice(-6, -3)
  const recentAvg = recentExams.length > 0 
    ? recentExams.reduce((a, e) => a + (e.net_score || 0), 0) / recentExams.length 
    : 0
  const olderAvg = olderExams.length > 0 
    ? olderExams.reduce((a, e) => a + (e.net_score || 0), 0) / olderExams.length 
    : recentAvg
  const weeklyChange = recentAvg - olderAvg

  // Ödev istatistikleri
  const totalCorrect = assignments.reduce((a, b) => a + b.correct_count, 0)
  const totalWrong = assignments.reduce((a, b) => a + b.wrong_count, 0)
  const assignmentAvg = assignments.length > 0
    ? assignments.reduce((a, b) => a + b.score, 0) / assignments.length
    : 0

  return (
    <DashboardLayout role="ogrenci">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-surface-900">İlerleme Raporum</h1>
            <p className="text-surface-500">Deneme ve ödev performansını takip et</p>
          </div>
          {totalExams > 0 && (
            <div className="flex items-center gap-2 px-4 py-2 bg-primary-50 rounded-xl">
              <Flame className="w-5 h-5 text-primary-500" />
              <span className="font-medium text-primary-700">{totalExams} Deneme</span>
            </div>
          )}
        </div>

        {/* Overview Stats */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card p-5"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary-50 rounded-xl flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-primary-500" />
              </div>
              <div>
                <div className="text-2xl font-bold text-surface-900">{avgNet.toFixed(1)}</div>
                <div className="text-sm text-surface-500">Ortalama Net</div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="card p-5"
          >
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                weeklyChange > 0 ? 'bg-green-50' : weeklyChange < 0 ? 'bg-red-50' : 'bg-surface-100'
              }`}>
                {weeklyChange > 0 ? (
                  <TrendingUp className="w-6 h-6 text-green-500" />
                ) : weeklyChange < 0 ? (
                  <TrendingDown className="w-6 h-6 text-red-500" />
                ) : (
                  <Minus className="w-6 h-6 text-surface-400" />
                )}
              </div>
              <div>
                <div className={`text-2xl font-bold ${
                  weeklyChange > 0 ? 'text-green-600' : weeklyChange < 0 ? 'text-red-600' : 'text-surface-900'
                }`}>
                  {weeklyChange > 0 ? '+' : ''}{weeklyChange.toFixed(1)}
                </div>
                <div className="text-sm text-surface-500">Son Dönem Değişim</div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="card p-5"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-accent-50 rounded-xl flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-accent-500" />
              </div>
              <div>
                <div className="text-2xl font-bold text-surface-900">{lastExam?.net_score?.toFixed(1) || '-'}</div>
                <div className="text-sm text-surface-500">Son Deneme Net</div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="card p-5"
          >
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                totalProgress > 0 ? 'bg-green-50' : totalProgress < 0 ? 'bg-red-50' : 'bg-surface-100'
              }`}>
                {totalProgress > 0 ? (
                  <ArrowUp className="w-6 h-6 text-green-500" />
                ) : totalProgress < 0 ? (
                  <ArrowDown className="w-6 h-6 text-red-500" />
                ) : (
                  <Target className="w-6 h-6 text-surface-400" />
                )}
              </div>
              <div>
                <div className={`text-2xl font-bold ${
                  totalProgress > 0 ? 'text-green-600' : totalProgress < 0 ? 'text-red-600' : 'text-surface-900'
                }`}>
                  {totalProgress > 0 ? '+' : ''}{totalProgress.toFixed(1)}
                </div>
                <div className="text-sm text-surface-500">Toplam Gelişim</div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Deneme Net Grafiği */}
        {exams.length > 0 && (
          <div className="card p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-surface-900">Deneme Net Grafiği</h3>
              <Link href="/ogrenci/denemeler" className="text-primary-500 text-sm font-medium flex items-center gap-1">
                Tümünü Gör <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            
            {/* Simple Bar Chart */}
            <div className="h-48 flex items-end gap-2">
              {exams.slice(-10).map((exam, index) => {
                const maxNet = Math.max(...exams.map(e => e.net_score || 0), 100)
                const height = ((exam.net_score || 0) / maxNet) * 100
                
                return (
                  <div key={exam.id} className="flex-1 flex flex-col items-center gap-2">
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${height}%` }}
                      transition={{ delay: index * 0.05, duration: 0.5 }}
                      className={`w-full rounded-t-lg ${
                        index === exams.slice(-10).length - 1 
                          ? 'bg-gradient-to-t from-primary-500 to-primary-400' 
                          : 'bg-gradient-to-t from-surface-300 to-surface-200'
                      }`}
                      title={`${exam.exam_name}: ${exam.net_score?.toFixed(1)} net`}
                    />
                    <span className="text-xs text-surface-500 font-medium">
                      {exam.net_score?.toFixed(0)}
                    </span>
                    <span className="text-[10px] text-surface-400">
                      {new Date(exam.exam_date).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit' })}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Ders Bazlı İlerleme */}
          {subjectProgress.length > 0 && (
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-surface-900 mb-4">Ders Bazlı İlerleme</h3>
              <div className="space-y-4">
                {subjectProgress.slice(0, 6).map((subject, index) => (
                  <motion.div 
                    key={subject.name}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="p-4 bg-surface-50 rounded-xl"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-surface-900">{subject.name}</span>
                      <div className="flex items-center gap-2">
                        {subject.trend === 'up' && (
                          <span className="flex items-center gap-1 text-green-600 text-sm">
                            <TrendingUp className="w-4 h-4" />
                            +{subject.change.toFixed(1)}
                          </span>
                        )}
                        {subject.trend === 'down' && (
                          <span className="flex items-center gap-1 text-red-600 text-sm">
                            <TrendingDown className="w-4 h-4" />
                            {subject.change.toFixed(1)}
                          </span>
                        )}
                        <span className="font-bold text-primary-600">{subject.avgNet.toFixed(1)} net</span>
                      </div>
                    </div>
                    
                    {/* Mini sparkline */}
                    <div className="h-8 flex items-end gap-0.5">
                      {subject.exams.slice(-8).map((exam, i) => {
                        const maxNet = Math.max(...subject.exams.map(e => e.net), 20)
                        const height = (exam.net / maxNet) * 100
                        return (
                          <div
                            key={i}
                            className={`flex-1 rounded-t ${
                              i === subject.exams.slice(-8).length - 1 
                                ? 'bg-primary-400' 
                                : 'bg-surface-300'
                            }`}
                            style={{ height: `${Math.max(height, 5)}%` }}
                          />
                        )
                      })}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Güçlü ve Zayıf Konular */}
          <div className="space-y-6">
            {allStrongTopics.length > 0 && (
              <div className="card p-6">
                <h3 className="text-lg font-semibold text-surface-900 mb-4 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  Güçlü Olduğun Konular
                </h3>
                <div className="flex flex-wrap gap-2">
                  {allStrongTopics.slice(0, 10).map((topic, i) => (
                    <motion.span
                      key={topic}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.03 }}
                      className="px-3 py-1.5 bg-green-50 text-green-700 rounded-full text-sm font-medium"
                    >
                      {topic}
                    </motion.span>
                  ))}
                </div>
              </div>
            )}

            {allWeakTopics.length > 0 && (
              <div className="card p-6">
                <h3 className="text-lg font-semibold text-surface-900 mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                  Çalışman Gereken Konular
                </h3>
                <div className="flex flex-wrap gap-2">
                  {allWeakTopics.slice(0, 10).map((topic, i) => (
                    <motion.span
                      key={topic}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.03 }}
                      className="px-3 py-1.5 bg-red-50 text-red-700 rounded-full text-sm font-medium"
                    >
                      {topic}
                    </motion.span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Ödev Sonuçları */}
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-surface-900">Ödev Sonuçları</h3>
              <div className="text-sm text-surface-500">
                Ort: <span className="font-bold text-primary-600">%{assignmentAvg.toFixed(0)}</span>
              </div>
            </div>
            {assignments.length > 0 ? (
              <div className="space-y-3">
                {assignments.slice(0, 5).map((assignment, index) => (
                  <div key={assignment.id} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-surface-600 truncate flex-1">{assignment.title}</span>
                      <span className={`font-medium ml-2 ${
                        assignment.score >= 70 ? 'text-green-600' : 
                        assignment.score >= 50 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        %{assignment.score.toFixed(0)}
                      </span>
                    </div>
                    <div className="h-2 bg-surface-100 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${assignment.score}%` }}
                        transition={{ delay: index * 0.1, duration: 0.5 }}
                        className={`h-full rounded-full ${
                          assignment.score >= 70 ? 'bg-green-500' : 
                          assignment.score >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                      />
                    </div>
                    <div className="flex gap-4 text-xs text-surface-400">
                      <span className="text-green-600">✓ {assignment.correct_count} doğru</span>
                      <span className="text-red-600">✗ {assignment.wrong_count} yanlış</span>
                      <span>{new Date(assignment.completed_at).toLocaleDateString('tr-TR')}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <BookOpen className="w-12 h-12 mx-auto mb-3 text-surface-300" />
                <p className="text-surface-500">Henüz tamamlanmış ödev yok</p>
              </div>
            )}
          </div>

          {/* Genel İstatistikler */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-surface-900 mb-4">Genel Başarı Özeti</h3>
            
            {(exams.length > 0 || assignments.length > 0) ? (
              <>
                <div className="flex items-center justify-center mb-6">
                  <div className="relative w-36 h-36">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle
                        cx="72"
                        cy="72"
                        r="64"
                        stroke="#f4f4f5"
                        strokeWidth="10"
                        fill="none"
                      />
                      <motion.circle
                        cx="72"
                        cy="72"
                        r="64"
                        stroke="url(#progressGradient)"
                        strokeWidth="10"
                        fill="none"
                        strokeLinecap="round"
                        strokeDasharray={402}
                        initial={{ strokeDashoffset: 402 }}
                        animate={{ strokeDashoffset: 402 - (402 * Math.min(avgNet / 100, 1)) }}
                        transition={{ duration: 1, ease: "easeOut" }}
                      />
                      <defs>
                        <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#f97316" />
                          <stop offset="100%" stopColor="#ea580c" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-3xl font-bold text-surface-900">{avgNet.toFixed(1)}</span>
                      <span className="text-sm text-surface-500">Ort. Net</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-surface-50 rounded-xl text-center">
                    <div className="text-xl font-bold text-surface-900">{totalExams}</div>
                    <div className="text-sm text-surface-500">Deneme</div>
                  </div>
                  <div className="p-3 bg-surface-50 rounded-xl text-center">
                    <div className="text-xl font-bold text-surface-900">{assignments.length}</div>
                    <div className="text-sm text-surface-500">Ödev</div>
                  </div>
                  <div className="p-3 bg-green-50 rounded-xl text-center">
                    <div className="text-xl font-bold text-green-600">{totalCorrect}</div>
                    <div className="text-sm text-green-600">Doğru</div>
                  </div>
                  <div className="p-3 bg-red-50 rounded-xl text-center">
                    <div className="text-xl font-bold text-red-600">{totalWrong}</div>
                    <div className="text-sm text-red-600">Yanlış</div>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <Brain className="w-12 h-12 mx-auto mb-3 text-surface-300" />
                <p className="text-surface-500 mb-4">Henüz yeterli veri yok</p>
                <Link href="/ogrenci/denemeler" className="btn btn-primary btn-sm">
                  Deneme Yükle
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Veri yoksa bilgilendirme */}
        {exams.length === 0 && assignments.length === 0 && (
          <div className="card p-12 text-center">
            <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-primary-100 to-primary-200 rounded-2xl flex items-center justify-center">
              <TrendingUp className="w-10 h-10 text-primary-500" />
            </div>
            <h3 className="text-xl font-semibold text-surface-900 mb-2">İlerleme Raporun</h3>
            <p className="text-surface-500 mb-6 max-w-md mx-auto">
              Deneme sonuçlarını ve ödevleri tamamladıkça burada detaylı ilerleme raporun oluşacak.
            </p>
            <div className="flex gap-3 justify-center">
              <Link href="/ogrenci/denemeler" className="btn btn-primary btn-md">
                <FileText className="w-5 h-5" />
                Deneme Yükle
              </Link>
              <Link href="/ogrenci/odevler" className="btn btn-outline btn-md">
                <BookOpen className="w-5 h-5" />
                Ödevlere Git
              </Link>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
