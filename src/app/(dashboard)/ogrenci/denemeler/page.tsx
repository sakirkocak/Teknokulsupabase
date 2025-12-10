'use client'

import { useState, useEffect, useRef } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { useProfile, useStudentProfile } from '@/hooks/useProfile'
import { createClient } from '@/lib/supabase/client'
import { compressImage } from '@/lib/imageCompressor'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  FileText, 
  Plus,
  CheckCircle,
  Clock,
  TrendingUp,
  TrendingDown,
  Upload,
  Image as ImageIcon,
  Sparkles,
  Send,
  Eye,
  X,
  BarChart3,
  BookOpen,
  AlertTriangle,
  Loader2,
  ChevronDown,
  ChevronUp
} from 'lucide-react'

interface TopicResult {
  name: string
  correct: number
  wrong: number
  empty: number
  status: 'iyi' | 'orta' | 'zayıf'
}

interface SubjectResult {
  name: string
  correct: number
  wrong: number
  empty: number
  net: number
  topics?: TopicResult[]
}

interface TopicToStudy {
  topic: string
  subject: string
  priority: 'yüksek' | 'orta' | 'düşük'
}

interface ExamAnalysis {
  subjects: SubjectResult[]
  total: {
    correct: number
    wrong: number
    empty: number
    net: number
  }
  analysis: {
    strongSubjects: string[]
    weakSubjects: string[]
    weakTopics: string[]
    strongTopics: string[]
    topicsToStudy?: TopicToStudy[]
    recommendations: string[]
    overallAssessment: string
  }
}

interface Exam {
  id: string
  exam_name: string
  exam_date: string
  exam_type: string
  image_url: string
  ai_analysis: ExamAnalysis
  subject_results: SubjectResult[]
  weak_topics: string[]
  strong_topics: string[]
  total_correct: number
  total_wrong: number
  total_empty: number
  net_score: number
  analysis_status: string
  sent_to_coach: boolean
  sent_to_coach_id: string | null
  created_at: string
}

interface Coach {
  id: string
  user_id: string
  profile: {
    full_name: string
    avatar_url: string | null
  }
}

export default function ExamResultsPage() {
  const { profile, loading: profileLoading } = useProfile()
  const { studentProfile, loading: studentLoading } = useStudentProfile(profile?.id || '')
  const [exams, setExams] = useState<Exam[]>([])
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>('')
  const [analysisResult, setAnalysisResult] = useState<ExamAnalysis | null>(null)
  const [expandedExam, setExpandedExam] = useState<string | null>(null)
  const [viewingImage, setViewingImage] = useState<string | null>(null)
  const [form, setForm] = useState({
    exam_name: '',
    exam_date: new Date().toISOString().split('T')[0],
    exam_type: 'TYT',
  })
  const [coaches, setCoaches] = useState<Coach[]>([])
  const [selectedCoachId, setSelectedCoachId] = useState<string>('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  useEffect(() => {
    if (studentProfile?.id) {
      loadExams()
      loadCoaches()
    }
  }, [studentProfile?.id])

  async function loadCoaches() {
    const { data } = await supabase
      .from('coaching_relationships')
      .select(`
        coach:teacher_profiles!coaching_relationships_coach_id_fkey(
          id,
          user_id,
          profile:profiles!teacher_profiles_user_id_fkey(full_name, avatar_url)
        )
      `)
      .eq('student_id', studentProfile?.id)
      .eq('status', 'active')

    if (data) {
      const coachList: Coach[] = []
      data.forEach(d => {
        if (d.coach && typeof d.coach === 'object' && 'id' in d.coach) {
          coachList.push(d.coach as Coach)
        }
      })
      setCoaches(coachList)
      if (coachList.length === 1) {
        setSelectedCoachId(coachList[0].id)
      }
    }
  }

  async function loadExams() {
    const { data } = await supabase
      .from('exam_results')
      .select('*')
      .eq('student_id', studentProfile?.id)
      .order('exam_date', { ascending: false })

    if (data) {
      setExams(data as Exam[])
    }
  }

  async function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    // Görsel sıkıştır
    try {
      const compressed = await compressImage(file)
      setSelectedImage(compressed)
      setImagePreview(URL.createObjectURL(compressed))
    } catch (error) {
      setSelectedImage(file)
      setImagePreview(URL.createObjectURL(file))
    }
  }

  async function handleAnalyze() {
    if (!selectedImage) {
      alert('Lütfen önce bir görsel seçin')
      return
    }

    setAnalyzing(true)
    setAnalysisResult(null)

    try {
      // Görseli Supabase'e yükle
      const fileName = `${Date.now()}-${selectedImage.name}`
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('exam-results')
        .upload(fileName, selectedImage)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('exam-results')
        .getPublicUrl(fileName)

      // AI analiz
      const response = await fetch('/api/ai/analyze-exam', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl: publicUrl,
          examType: form.exam_type,
          studentName: profile?.full_name
        })
      })

      const data = await response.json()

      if (data.error) {
        throw new Error(data.error)
      }

      setAnalysisResult(data.analysis)
      
      // Form'a image URL'i kaydet
      setForm(prev => ({ ...prev, imageUrl: publicUrl }))

    } catch (error: any) {
      console.error('Analiz hatası:', error)
      alert('Analiz hatası: ' + error.message)
    } finally {
      setAnalyzing(false)
    }
  }

  async function handleSaveAndSend() {
    if (!analysisResult || !selectedImage) {
      alert('Önce analiz yapın')
      return
    }

    if (coaches.length > 1 && !selectedCoachId) {
      alert('Lütfen bir koç seçin')
      return
    }

    const targetCoachId = selectedCoachId || (coaches.length === 1 ? coaches[0].id : null)

    setUploading(true)

    try {
      // Görseli yükle (eğer henüz yüklenmediyse)
      let imageUrl = (form as any).imageUrl
      if (!imageUrl) {
        const fileName = `${Date.now()}-${selectedImage.name}`
        const { error: uploadError } = await supabase.storage
          .from('exam-results')
          .upload(fileName, selectedImage)

        if (uploadError) throw uploadError

        const { data: { publicUrl } } = supabase.storage
          .from('exam-results')
          .getPublicUrl(fileName)
        imageUrl = publicUrl
      }

      // Veritabanına kaydet
      const { error } = await supabase
        .from('exam_results')
        .insert({
          student_id: studentProfile?.id,
          coach_id: targetCoachId,
          exam_name: form.exam_name,
          exam_date: form.exam_date,
          exam_type: form.exam_type,
          image_url: imageUrl,
          ai_analysis: analysisResult,
          subject_results: analysisResult.subjects,
          weak_topics: analysisResult.analysis.weakTopics,
          strong_topics: analysisResult.analysis.strongTopics,
          total_correct: analysisResult.total.correct,
          total_wrong: analysisResult.total.wrong,
          total_empty: analysisResult.total.empty,
          net_score: analysisResult.total.net,
          analysis_status: 'completed',
          sent_to_coach: !!targetCoachId,
        })

      if (error) throw error

      // Seçilen koça bildirim gönder
      if (targetCoachId) {
        const selectedCoach = coaches.find(c => c.id === targetCoachId)
        if (selectedCoach) {
          await supabase.from('notifications').insert({
            user_id: selectedCoach.user_id,
            title: '📊 Yeni Deneme Sonucu',
            body: `${profile?.full_name} yeni bir ${form.exam_type} deneme sonucu yükledi. Net: ${analysisResult.total.net.toFixed(1)}`,
            type: 'exam_result',
            data: { exam_type: form.exam_type }
          })
        }
      }

      // Modal'ı kapat ve listeyi yenile
      setShowUploadModal(false)
      setSelectedImage(null)
      setImagePreview('')
      setAnalysisResult(null)
      setSelectedCoachId('')
      setForm({ exam_name: '', exam_date: new Date().toISOString().split('T')[0], exam_type: 'TYT' })
      loadExams()

      alert(targetCoachId 
        ? 'Deneme sonucu kaydedildi ve koçunuza gönderildi!' 
        : 'Deneme sonucu kaydedildi!'
      )

    } catch (error: any) {
      console.error('Kayıt hatası:', error)
      alert('Kayıt hatası: ' + error.message)
    } finally {
      setUploading(false)
    }
  }

  // Gelişim hesapla
  function calculateProgress(currentExam: Exam, index: number): { trend: 'up' | 'down' | 'stable', diff: number } {
    if (index >= exams.length - 1) return { trend: 'stable', diff: 0 }
    
    const prevExam = exams[index + 1]
    const diff = (currentExam.net_score || 0) - (prevExam.net_score || 0)
    
    if (diff > 2) return { trend: 'up', diff }
    if (diff < -2) return { trend: 'down', diff }
    return { trend: 'stable', diff }
  }

  const loading = profileLoading || studentLoading

  if (loading) {
    return (
      <DashboardLayout role="ogrenci">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" />
        </div>
      </DashboardLayout>
    )
  }

  // İstatistikler
  const avgNet = exams.length > 0 
    ? exams.reduce((acc, e) => acc + (e.net_score || 0), 0) / exams.length 
    : 0
  const lastExam = exams[0]
  const firstExam = exams[exams.length - 1]
  const totalProgress = lastExam && firstExam 
    ? (lastExam.net_score || 0) - (firstExam.net_score || 0) 
    : 0

  return (
    <DashboardLayout role="ogrenci">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-surface-900">Deneme Sonuçlarım</h1>
            <p className="text-surface-500">Deneme karneni yükle, AI analiz etsin</p>
          </div>
          <button 
            onClick={() => setShowUploadModal(true)}
            className="btn btn-primary btn-md"
          >
            <Plus className="w-5 h-5" />
            Deneme Yükle
          </button>
        </div>

        {/* Stats */}
        {exams.length > 0 && (
          <div className="grid sm:grid-cols-4 gap-4">
            <div className="card p-5">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 bg-primary-50 rounded-xl flex items-center justify-center">
                  <FileText className="w-5 h-5 text-primary-500" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-surface-900">{exams.length}</div>
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
                  <div className="text-sm text-surface-500">Ortalama Net</div>
                </div>
              </div>
            </div>
            <div className="card p-5">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 bg-accent-50 rounded-xl flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-accent-500" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-surface-900">{lastExam?.net_score?.toFixed(1) || 0}</div>
                  <div className="text-sm text-surface-500">Son Net</div>
                </div>
              </div>
            </div>
            <div className="card p-5">
              <div className="flex items-center gap-3">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${
                  totalProgress > 0 ? 'bg-green-50' : totalProgress < 0 ? 'bg-red-50' : 'bg-surface-100'
                }`}>
                  {totalProgress > 0 ? (
                    <TrendingUp className="w-5 h-5 text-green-500" />
                  ) : totalProgress < 0 ? (
                    <TrendingDown className="w-5 h-5 text-red-500" />
                  ) : (
                    <BarChart3 className="w-5 h-5 text-surface-400" />
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
            </div>
          </div>
        )}

        {/* Exams List */}
        {exams.length > 0 ? (
          <div className="space-y-4">
            {exams.map((exam, index) => {
              const progress = calculateProgress(exam, index)
              const isExpanded = expandedExam === exam.id

              return (
                <motion.div
                  key={exam.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="card overflow-hidden"
                >
                  {/* Header */}
                  <div 
                    className="p-5 cursor-pointer hover:bg-surface-50 transition-colors"
                    onClick={() => setExpandedExam(isExpanded ? null : exam.id)}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                      <div className="flex items-center gap-4 flex-1">
                        {exam.image_url ? (
                          <div 
                            className="w-14 h-14 rounded-xl overflow-hidden cursor-pointer border-2 border-surface-100 hover:border-primary-300 transition-colors"
                            onClick={(e) => { e.stopPropagation(); setViewingImage(exam.image_url) }}
                          >
                            <img src={exam.image_url} alt="" className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <div className="w-14 h-14 bg-gradient-to-br from-primary-400 to-primary-600 rounded-xl flex items-center justify-center text-white font-bold text-lg">
                            {exam.exam_type?.charAt(0) || 'D'}
                          </div>
                        )}
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-surface-900">{exam.exam_name}</h3>
                            <span className="px-2 py-0.5 bg-primary-50 text-primary-600 rounded text-xs font-medium">
                              {exam.exam_type}
                            </span>
                          </div>
                          <p className="text-sm text-surface-500">
                            {new Date(exam.exam_date).toLocaleDateString('tr-TR', { 
                              day: 'numeric', month: 'long', year: 'numeric' 
                            })}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        {/* Net */}
                        <div className="text-center px-4 py-2 bg-primary-50 rounded-xl">
                          <div className="text-2xl font-bold text-primary-600">{exam.net_score?.toFixed(1) || 0}</div>
                          <div className="text-xs text-primary-500">Net</div>
                        </div>
                        
                        {/* Trend */}
                        {index < exams.length - 1 && (
                          <div className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium ${
                            progress.trend === 'up' ? 'bg-green-50 text-green-600' :
                            progress.trend === 'down' ? 'bg-red-50 text-red-600' :
                            'bg-surface-100 text-surface-500'
                          }`}>
                            {progress.trend === 'up' ? <TrendingUp className="w-4 h-4" /> :
                             progress.trend === 'down' ? <TrendingDown className="w-4 h-4" /> : null}
                            {progress.diff > 0 ? '+' : ''}{progress.diff.toFixed(1)}
                          </div>
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
                          {/* Subject Results with Topics */}
                          <div>
                            <h4 className="font-medium text-surface-900 mb-3 flex items-center gap-2">
                              <BookOpen className="w-4 h-4" />
                              Ders ve Konu Bazlı Sonuçlar
                            </h4>
                            <div className="space-y-4">
                              {exam.ai_analysis?.subjects?.map((subject, idx) => (
                                <div key={idx} className="border border-surface-200 rounded-xl overflow-hidden">
                                  {/* Subject Header */}
                                  <div className="p-4 bg-surface-50 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                      <span className="font-semibold text-surface-900">{subject.name}</span>
                                      <div className="flex items-center gap-2 text-sm">
                                        <span className="text-green-600">D: {subject.correct}</span>
                                        <span className="text-red-500">Y: {subject.wrong}</span>
                                        <span className="text-surface-400">B: {subject.empty}</span>
                                      </div>
                                    </div>
                                    <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-bold">
                                      {subject.net?.toFixed(1)} net
                                    </span>
                                  </div>
                                  
                                  {/* Topics */}
                                  {subject.topics && subject.topics.length > 0 && (
                                    <div className="p-4 grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                      {subject.topics.map((topic, tidx) => (
                                        <div 
                                          key={tidx} 
                                          className={`p-2 rounded-lg text-sm flex items-center justify-between ${
                                            topic.status === 'iyi' ? 'bg-green-50 border border-green-200' :
                                            topic.status === 'zayıf' ? 'bg-red-50 border border-red-200' :
                                            'bg-yellow-50 border border-yellow-200'
                                          }`}
                                        >
                                          <span className={`font-medium ${
                                            topic.status === 'iyi' ? 'text-green-700' :
                                            topic.status === 'zayıf' ? 'text-red-700' :
                                            'text-yellow-700'
                                          }`}>
                                            {topic.name}
                                          </span>
                                          <div className="flex items-center gap-1 text-xs">
                                            <span className="text-green-600">{topic.correct}D</span>
                                            <span className="text-red-500">{topic.wrong}Y</span>
                                            {topic.empty > 0 && <span className="text-surface-400">{topic.empty}B</span>}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Topics to Study - Priority List */}
                          {exam.ai_analysis?.analysis?.topicsToStudy && exam.ai_analysis.analysis.topicsToStudy.length > 0 && (
                            <div className="p-4 bg-orange-50 rounded-xl border border-orange-200">
                              <h5 className="font-medium text-orange-800 mb-3 flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4" />
                                Öncelikli Çalışılması Gereken Konular
                              </h5>
                              <div className="space-y-2">
                                {exam.ai_analysis.analysis.topicsToStudy.map((item, idx) => (
                                  <div key={idx} className="flex items-center justify-between p-2 bg-white rounded-lg">
                                    <div>
                                      <span className="font-medium text-surface-900">{item.topic}</span>
                                      <span className="text-surface-500 text-sm ml-2">({item.subject})</span>
                                    </div>
                                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                                      item.priority === 'yüksek' ? 'bg-red-100 text-red-700' :
                                      item.priority === 'orta' ? 'bg-yellow-100 text-yellow-700' :
                                      'bg-blue-100 text-blue-700'
                                    }`}>
                                      {item.priority}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

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
                                  {exam.strong_topics.map((topic, idx) => (
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
                                  Çalışılması Gereken Konular
                                </h5>
                                <div className="flex flex-wrap gap-2">
                                  {exam.weak_topics.map((topic, idx) => (
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

                          {/* Recommendations */}
                          {exam.ai_analysis?.analysis?.recommendations?.length > 0 && (
                            <div className="p-4 bg-blue-50 rounded-xl">
                              <h5 className="font-medium text-blue-800 mb-2">💡 Öneriler</h5>
                              <ul className="space-y-1">
                                {exam.ai_analysis.analysis.recommendations.map((rec, idx) => (
                                  <li key={idx} className="text-blue-700 text-sm flex items-start gap-2">
                                    <span>•</span>
                                    <span>{rec}</span>
                                  </li>
                                ))}
                              </ul>
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
            <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-primary-100 to-primary-200 rounded-2xl flex items-center justify-center">
              <FileText className="w-10 h-10 text-primary-500" />
            </div>
            <h3 className="text-lg font-medium text-surface-900 mb-2">Henüz deneme sonucu yok</h3>
            <p className="text-surface-500 mb-6">Deneme karneni yükle, AI analiz etsin ve gelişimini takip et!</p>
            <button 
              onClick={() => setShowUploadModal(true)}
              className="btn btn-primary btn-md"
            >
              <Upload className="w-5 h-5" />
              Deneme Yükle
            </button>
          </div>
        )}

        {/* Upload Modal */}
        <AnimatePresence>
          {showUploadModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="card p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-surface-900">Deneme Sonucu Yükle</h2>
                  <button 
                    onClick={() => {
                      setShowUploadModal(false)
                      setSelectedImage(null)
                      setImagePreview('')
                      setAnalysisResult(null)
                    }}
                    className="p-2 hover:bg-surface-100 rounded-lg"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="space-y-5">
                  {/* Form Fields */}
                  <div className="grid sm:grid-cols-3 gap-4">
                    <div>
                      <label className="label">Deneme Adı</label>
                      <input
                        type="text"
                        value={form.exam_name}
                        onChange={(e) => setForm({ ...form, exam_name: e.target.value })}
                        className="input"
                        placeholder="Örn: TYT Deneme 1"
                        required
                      />
                    </div>
                    <div>
                      <label className="label">Sınav Türü</label>
                      <select
                        value={form.exam_type}
                        onChange={(e) => setForm({ ...form, exam_type: e.target.value })}
                        className="input"
                      >
                        <option value="TYT">TYT</option>
                        <option value="AYT">AYT</option>
                        <option value="LGS">LGS</option>
                        <option value="YKS">YKS Genel</option>
                        <option value="Diğer">Diğer</option>
                      </select>
                    </div>
                    <div>
                      <label className="label">Sınav Tarihi</label>
                      <input
                        type="date"
                        value={form.exam_date}
                        onChange={(e) => setForm({ ...form, exam_date: e.target.value })}
                        className="input"
                        required
                      />
                    </div>
                  </div>

                  {/* Coach Selection */}
                  {coaches.length > 1 && (
                    <div>
                      <label className="label">Hangi Koça Gönderilsin?</label>
                      <div className="grid sm:grid-cols-2 gap-3">
                        {coaches.map((coach) => (
                          <div
                            key={coach.id}
                            onClick={() => setSelectedCoachId(coach.id)}
                            className={`p-4 border-2 rounded-xl cursor-pointer transition-all flex items-center gap-3 ${
                              selectedCoachId === coach.id 
                                ? 'border-primary-500 bg-primary-50' 
                                : 'border-surface-200 hover:border-primary-300'
                            }`}
                          >
                            <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-primary-600 rounded-xl flex items-center justify-center text-white font-medium">
                              {coach.profile?.full_name?.charAt(0) || 'K'}
                            </div>
                            <div className="flex-1">
                              <div className="font-medium text-surface-900">{coach.profile?.full_name}</div>
                            </div>
                            {selectedCoachId === coach.id && (
                              <CheckCircle className="w-5 h-5 text-primary-500" />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {coaches.length === 1 && (
                    <div className="p-4 bg-blue-50 rounded-xl flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-primary-600 rounded-xl flex items-center justify-center text-white font-medium">
                        {coaches[0]?.profile?.full_name?.charAt(0) || 'K'}
                      </div>
                      <div>
                        <div className="text-sm text-blue-600">Sonuç gönderilecek koç:</div>
                        <div className="font-medium text-blue-800">{coaches[0]?.profile?.full_name}</div>
                      </div>
                    </div>
                  )}

                  {/* Image Upload */}
                  <div>
                    <label className="label">Sonuç Karnesi Görseli</label>
                    <div 
                      className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
                        imagePreview ? 'border-primary-300 bg-primary-50' : 'border-surface-200 hover:border-primary-300'
                      }`}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      {imagePreview ? (
                        <div className="space-y-3">
                          <img src={imagePreview} alt="Önizleme" className="max-h-48 mx-auto rounded-lg" />
                          <p className="text-sm text-primary-600">Değiştirmek için tıklayın</p>
                        </div>
                      ) : (
                        <>
                          <ImageIcon className="w-12 h-12 mx-auto mb-3 text-surface-300" />
                          <p className="text-surface-600 mb-1">Deneme sonuç karnesinin fotoğrafını yükleyin</p>
                          <p className="text-sm text-surface-400">PNG, JPG veya JPEG</p>
                        </>
                      )}
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageSelect}
                      className="hidden"
                    />
                  </div>

                  {/* Analyze Button */}
                  {selectedImage && !analysisResult && (
                    <button
                      onClick={handleAnalyze}
                      disabled={analyzing || !form.exam_name}
                      className="btn btn-accent btn-lg w-full"
                    >
                      {analyzing ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          AI Analiz Ediyor...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-5 h-5" />
                          AI ile Analiz Et
                        </>
                      )}
                    </button>
                  )}

                  {/* Analysis Result */}
                  {analysisResult && (
                    <div className="space-y-4">
                      <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
                        <div className="flex items-center gap-2 text-green-700 font-medium mb-3">
                          <CheckCircle className="w-5 h-5" />
                          Analiz Tamamlandı!
                        </div>
                        
                        {/* Total */}
                        <div className="grid grid-cols-4 gap-3 mb-4">
                          <div className="text-center p-2 bg-white rounded-lg">
                            <div className="text-xl font-bold text-green-600">{analysisResult.total.correct}</div>
                            <div className="text-xs text-surface-500">Doğru</div>
                          </div>
                          <div className="text-center p-2 bg-white rounded-lg">
                            <div className="text-xl font-bold text-red-500">{analysisResult.total.wrong}</div>
                            <div className="text-xs text-surface-500">Yanlış</div>
                          </div>
                          <div className="text-center p-2 bg-white rounded-lg">
                            <div className="text-xl font-bold text-surface-400">{analysisResult.total.empty}</div>
                            <div className="text-xs text-surface-500">Boş</div>
                          </div>
                          <div className="text-center p-2 bg-primary-100 rounded-lg">
                            <div className="text-xl font-bold text-primary-600">{analysisResult.total.net.toFixed(1)}</div>
                            <div className="text-xs text-primary-500">Net</div>
                          </div>
                        </div>

                        {/* Subjects */}
                        <div className="space-y-2">
                          {analysisResult.subjects.map((subject, idx) => (
                            <div key={idx} className="flex items-center justify-between p-2 bg-white rounded-lg">
                              <span className="font-medium text-surface-700">{subject.name}</span>
                              <div className="flex items-center gap-3 text-sm">
                                <span className="text-green-600">D: {subject.correct}</span>
                                <span className="text-red-500">Y: {subject.wrong}</span>
                                <span className="font-bold text-primary-600">{subject.net.toFixed(1)} net</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Save Button */}
                      <button
                        onClick={handleSaveAndSend}
                        disabled={uploading}
                        className="btn btn-primary btn-lg w-full"
                      >
                        {uploading ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Kaydediliyor...
                          </>
                        ) : (
                          <>
                            <Send className="w-5 h-5" />
                            Kaydet ve Koçuma Gönder
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

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
