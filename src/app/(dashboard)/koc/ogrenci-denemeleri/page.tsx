'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { useProfile, useTeacherProfile } from '@/hooks/useProfile'
import { createClient } from '@/lib/supabase/client'
import { getInitials } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  FileText,
  TrendingUp,
  TrendingDown,
  Users,
  BarChart3,
  Eye,
  X,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  AlertTriangle,
  BookOpen,
  Sparkles,
  Filter
} from 'lucide-react'

export default function StudentExamsPage() {
  const { profile, loading: profileLoading } = useProfile()
  const { teacherProfile, loading: teacherLoading } = useTeacherProfile(profile?.id || '')
  const [students, setStudents] = useState<any[]>([])
  const [allExams, setAllExams] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null)
  const [expandedExam, setExpandedExam] = useState<string | null>(null)
  const [viewingImage, setViewingImage] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    if (teacherProfile?.id) {
      loadData()
    }
  }, [teacherProfile?.id])

  async function loadData() {
    setLoading(true)

    // Koçun öğrencilerini al
    const { data: relationships } = await supabase
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

    if (relationships) {
      const studentList = relationships.map(r => r.student).filter(Boolean)
      setStudents(studentList)

      // Sadece bu koça gönderilen deneme sonuçlarını al
      const { data: exams } = await supabase
        .from('exam_results')
        .select('*')
        .eq('coach_id', teacherProfile?.id)
        .order('exam_date', { ascending: false })

      if (exams) {
        setAllExams(exams)
      }
    }

    setLoading(false)
  }

  // Öğrenciye göre filtrelenmiş denemeler
  const filteredExams = selectedStudent 
    ? allExams.filter(e => e.student_id === selectedStudent)
    : allExams

  // İstatistikler
  const totalExams = allExams.length
  const avgNet = allExams.length > 0 
    ? allExams.reduce((acc, e) => acc + (e.net_score || 0), 0) / allExams.length 
    : 0
  const recentExams = allExams.filter(e => {
    const examDate = new Date(e.exam_date)
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    return examDate >= weekAgo
  }).length

  // Öğrenci bilgisini al
  function getStudent(studentId: string) {
    return students.find(s => s.id === studentId)
  }

  const pageLoading = profileLoading || teacherLoading || loading

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
          <h1 className="text-2xl font-bold text-surface-900">Öğrenci Denemeleri</h1>
          <p className="text-surface-500">Öğrencilerinizin deneme sonuçlarını takip edin</p>
        </div>

        {/* Stats */}
        <div className="grid sm:grid-cols-4 gap-4">
          <div className="card p-5">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 bg-primary-50 rounded-xl flex items-center justify-center">
                <Users className="w-5 h-5 text-primary-500" />
              </div>
              <div>
                <div className="text-2xl font-bold text-surface-900">{students.length}</div>
                <div className="text-sm text-surface-500">Öğrenci</div>
              </div>
            </div>
          </div>
          <div className="card p-5">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 bg-accent-50 rounded-xl flex items-center justify-center">
                <FileText className="w-5 h-5 text-accent-500" />
              </div>
              <div>
                <div className="text-2xl font-bold text-surface-900">{totalExams}</div>
                <div className="text-sm text-surface-500">Toplam Deneme</div>
              </div>
            </div>
          </div>
          <div className="card p-5">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 bg-secondary-50 rounded-xl flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-secondary-500" />
              </div>
              <div>
                <div className="text-2xl font-bold text-surface-900">{avgNet.toFixed(1)}</div>
                <div className="text-sm text-surface-500">Ort. Net</div>
              </div>
            </div>
          </div>
          <div className="card p-5">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 bg-green-50 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <div className="text-2xl font-bold text-surface-900">{recentExams}</div>
                <div className="text-sm text-surface-500">Bu Hafta</div>
              </div>
            </div>
          </div>
        </div>

        {/* Filter by Student */}
        <div className="flex items-center gap-3 overflow-x-auto pb-2">
          <Filter className="w-5 h-5 text-surface-400 flex-shrink-0" />
          <button
            onClick={() => setSelectedStudent(null)}
            className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-colors ${
              !selectedStudent 
                ? 'bg-primary-500 text-white' 
                : 'bg-surface-100 text-surface-600 hover:bg-surface-200'
            }`}
          >
            Tümü
          </button>
          {students.map((student: any) => (
            <button
              key={student.id}
              onClick={() => setSelectedStudent(student.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-colors ${
                selectedStudent === student.id 
                  ? 'bg-primary-500 text-white' 
                  : 'bg-surface-100 text-surface-600 hover:bg-surface-200'
              }`}
            >
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                selectedStudent === student.id 
                  ? 'bg-white/20 text-white' 
                  : 'bg-primary-100 text-primary-600'
              }`}>
                {getInitials(student.profile?.full_name)}
              </div>
              {student.profile?.full_name?.split(' ')[0]}
            </button>
          ))}
        </div>

        {/* Exams List */}
        {filteredExams.length > 0 ? (
          <div className="space-y-4">
            {filteredExams.map((exam, index) => {
              const student = getStudent(exam.student_id)
              const isExpanded = expandedExam === exam.id

              return (
                <motion.div
                  key={exam.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className="card overflow-hidden"
                >
                  {/* Header */}
                  <div 
                    className="p-5 cursor-pointer hover:bg-surface-50 transition-colors"
                    onClick={() => setExpandedExam(isExpanded ? null : exam.id)}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                      <div className="flex items-center gap-4 flex-1">
                        {/* Student Avatar */}
                        <div className="w-12 h-12 bg-gradient-to-br from-primary-400 to-primary-600 rounded-xl flex items-center justify-center text-white font-medium overflow-hidden">
                          {student?.profile?.avatar_url ? (
                            <img src={student.profile.avatar_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            getInitials(student?.profile?.full_name)
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-surface-900">{exam.exam_name}</h3>
                            <span className="px-2 py-0.5 bg-primary-50 text-primary-600 rounded text-xs font-medium">
                              {exam.exam_type}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-surface-500">
                            <span>{student?.profile?.full_name}</span>
                            <span>•</span>
                            <span>{new Date(exam.exam_date).toLocaleDateString('tr-TR')}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        {/* Stats */}
                        <div className="flex items-center gap-3 text-sm">
                          <span className="text-green-600">D: {exam.total_correct}</span>
                          <span className="text-red-500">Y: {exam.total_wrong}</span>
                          <span className="text-surface-400">B: {exam.total_empty}</span>
                        </div>

                        {/* Net */}
                        <div className="text-center px-4 py-2 bg-primary-50 rounded-xl">
                          <div className="text-xl font-bold text-primary-600">{exam.net_score?.toFixed(1) || 0}</div>
                          <div className="text-xs text-primary-500">Net</div>
                        </div>

                        {/* View Image */}
                        {exam.image_url && (
                          <button
                            onClick={(e) => { e.stopPropagation(); setViewingImage(exam.image_url) }}
                            className="p-2 hover:bg-surface-100 rounded-lg transition-colors"
                            title="Karneyi Görüntüle"
                          >
                            <Eye className="w-5 h-5 text-surface-500" />
                          </button>
                        )}

                        {/* Expand Button */}
                        <button className="p-2 hover:bg-surface-100 rounded-lg transition-colors">
                          {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Content */}
                  <AnimatePresence>
                    {isExpanded && exam.ai_analysis && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-t border-surface-100"
                      >
                        <div className="p-5 space-y-5">
                          {/* Subject Results */}
                          <div>
                            <h4 className="font-medium text-surface-900 mb-3 flex items-center gap-2">
                              <BookOpen className="w-4 h-4" />
                              Ders Bazlı Sonuçlar
                            </h4>
                            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                              {exam.subject_results?.map((subject: any, idx: number) => (
                                <div key={idx} className="p-3 bg-surface-50 rounded-xl">
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="font-medium text-surface-900 text-sm">{subject.name}</span>
                                    <span className="text-sm font-bold text-primary-600">{subject.net?.toFixed(1)}</span>
                                  </div>
                                  <div className="flex items-center gap-2 text-xs">
                                    <span className="text-green-600">✓{subject.correct}</span>
                                    <span className="text-red-500">✗{subject.wrong}</span>
                                    <span className="text-surface-400">○{subject.empty}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Analysis */}
                          <div className="grid sm:grid-cols-2 gap-4">
                            {/* Strong Topics */}
                            {exam.strong_topics?.length > 0 && (
                              <div className="p-4 bg-green-50 rounded-xl">
                                <h5 className="font-medium text-green-800 mb-2 flex items-center gap-2">
                                  <CheckCircle className="w-4 h-4" />
                                  Güçlü Konular
                                </h5>
                                <div className="flex flex-wrap gap-2">
                                  {exam.strong_topics.map((topic: string, idx: number) => (
                                    <span key={idx} className="px-2 py-1 bg-green-100 text-green-700 rounded text-sm">
                                      {topic}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Weak Topics */}
                            {exam.weak_topics?.length > 0 && (
                              <div className="p-4 bg-red-50 rounded-xl">
                                <h5 className="font-medium text-red-800 mb-2 flex items-center gap-2">
                                  <AlertTriangle className="w-4 h-4" />
                                  Eksik Konular
                                </h5>
                                <div className="flex flex-wrap gap-2">
                                  {exam.weak_topics.map((topic: string, idx: number) => (
                                    <span key={idx} className="px-2 py-1 bg-red-100 text-red-700 rounded text-sm">
                                      {topic}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* AI Assessment */}
                          {exam.ai_analysis?.analysis?.overallAssessment && (
                            <div className="p-4 bg-purple-50 rounded-xl">
                              <h5 className="font-medium text-purple-800 mb-2 flex items-center gap-2">
                                <Sparkles className="w-4 h-4" />
                                AI Değerlendirmesi
                              </h5>
                              <p className="text-purple-700 text-sm">{exam.ai_analysis.analysis.overallAssessment}</p>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )
            })}
          </div>
        ) : (
          <div className="card p-12 text-center">
            <FileText className="w-16 h-16 mx-auto mb-4 text-surface-300" />
            <h3 className="text-lg font-medium text-surface-900 mb-2">
              {selectedStudent ? 'Bu öğrencinin deneme sonucu yok' : 'Henüz deneme sonucu yok'}
            </h3>
            <p className="text-surface-500">
              Öğrencileriniz deneme sonucu yüklediğinde burada görünecek.
            </p>
          </div>
        )}

        {/* Image Viewer Modal */}
        <AnimatePresence>
          {viewingImage && (
            <div 
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80"
              onClick={() => setViewingImage(null)}
            >
              <motion.img
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                src={viewingImage}
                alt="Deneme Karnesi"
                className="max-w-full max-h-full rounded-lg"
              />
              <button 
                className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white"
                onClick={() => setViewingImage(null)}
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          )}
        </AnimatePresence>
      </div>
    </DashboardLayout>
  )
}

