'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { 
  BookOpen, Clock, Target, Play, Trophy, Calendar,
  ChevronRight, BarChart3, Award, CheckCircle, XCircle
} from 'lucide-react'
import { motion } from 'framer-motion'

interface MockExam {
  id: string
  title: string
  exam_type: string
  status: string
  total_correct: number
  total_wrong: number
  total_empty: number
  total_net: number
  total_score: number
  time_spent_seconds: number
  created_at: string
  completed_at: string | null
}

export default function DenemePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [studentProfile, setStudentProfile] = useState<any>(null)
  const [pastExams, setPastExams] = useState<MockExam[]>([])
  const [questionCounts, setQuestionCounts] = useState<Record<string, number>>({})

  const supabase = createClient()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/giris')
      return
    }

    // Öğrenci profili
    const { data: profile } = await supabase
      .from('student_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single()
    
    if (profile) {
      setStudentProfile(profile)

      // Geçmiş denemeler
      const { data: exams } = await supabase
        .from('lgs_mock_exams')
        .select('*')
        .eq('student_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(10)
      
      if (exams) setPastExams(exams)
    }

    // Ders bazlı soru sayıları
    const { data: topics } = await supabase
      .from('lgs_topics')
      .select('id, subject')
    
    const { data: questions } = await supabase
      .from('lgs_questions')
      .select('topic_id')
      .eq('is_active', true)
    
    if (topics && questions) {
      const counts: Record<string, number> = {}
      const topicSubjectMap: Record<string, string> = {}
      
      topics.forEach(t => {
        topicSubjectMap[t.id] = t.subject
      })
      
      questions.forEach(q => {
        const subject = topicSubjectMap[q.topic_id]
        if (subject) {
          counts[subject] = (counts[subject] || 0) + 1
        }
      })
      
      setQuestionCounts(counts)
    }

    setLoading(false)
  }

  const createFullExam = async () => {
    if (creating) return
    setCreating(true)

    try {
      // Her dersten gerekli sayıda soru çek
      const subjectQuotas = {
        'Türkçe': 20,
        'Matematik': 20,
        'Fen Bilimleri': 20,
        'İnkılap Tarihi': 10,
        'Din Kültürü': 10,
        'İngilizce': 10
      }

      const allQuestionIds: string[] = []

      for (const [subject, quota] of Object.entries(subjectQuotas)) {
        // Konuları al
        const { data: topics } = await supabase
          .from('lgs_topics')
          .select('id')
          .eq('subject', subject)
        
        if (!topics || topics.length === 0) continue
        
        const topicIds = topics.map(t => t.id)
        
        // Rastgele sorular çek
        const { data: questions } = await supabase
          .from('lgs_questions')
          .select('id')
          .in('topic_id', topicIds)
          .eq('is_active', true)
          .limit(quota * 2) // Fazla çek, sonra rastgele seç
        
        if (questions && questions.length > 0) {
          // Karıştır ve quota kadar al
          const shuffled = questions.sort(() => Math.random() - 0.5)
          const selected = shuffled.slice(0, Math.min(quota, shuffled.length))
          allQuestionIds.push(...selected.map(q => q.id))
        }
      }

      if (allQuestionIds.length === 0) {
        alert('Yeterli soru bulunamadı!')
        setCreating(false)
        return
      }

      // Deneme sınavı oluştur
      const { data: exam, error } = await supabase
        .from('lgs_mock_exams')
        .insert({
          student_id: studentProfile.id,
          title: `LGS Deneme ${new Date().toLocaleDateString('tr-TR')}`,
          exam_type: 'full',
          questions: allQuestionIds,
          status: 'created',
          time_limit_minutes: 135
        })
        .select()
        .single()

      if (error) {
        console.error('Deneme oluşturma hatası:', error)
        alert('Deneme oluşturulurken bir hata oluştu!')
        setCreating(false)
        return
      }

      // Cevap kayıtlarını oluştur
      const answerRecords = allQuestionIds.map((qId, index) => ({
        exam_id: exam.id,
        question_id: qId,
        question_order: index + 1
      }))

      await supabase
        .from('mock_exam_answers')
        .insert(answerRecords)

      // Sınava yönlendir
      router.push(`/ogrenci/soru-bankasi/deneme/${exam.id}`)

    } catch (error) {
      console.error('Hata:', error)
      alert('Bir hata oluştu!')
    }

    setCreating(false)
  }

  const continueExam = (examId: string) => {
    router.push(`/ogrenci/soru-bankasi/deneme/${examId}`)
  }

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    if (hours > 0) return `${hours}sa ${minutes}dk`
    return `${minutes}dk`
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    )
  }

  const totalQuestions = Object.values(questionCounts).reduce((a, b) => a + b, 0)
  const hasEnoughQuestions = totalQuestions >= 90

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <Target className="h-8 w-8 text-indigo-500" />
            LGS Deneme Sınavları
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Gerçek sınav formatında kendini test et!
          </p>
        </div>

        {/* Yeni Deneme Kartı */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-2xl p-8 mb-8 text-white"
        >
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Tam LGS Denemesi</h2>
              <p className="text-white/80 mb-4">90 soru • 135 dakika • 6 ders</p>
              
              <div className="flex flex-wrap gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>2 saat 15 dakika</span>
                </div>
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  <span>90 soru</span>
                </div>
              </div>
            </div>

            <button
              onClick={createFullExam}
              disabled={creating || !hasEnoughQuestions}
              className="px-8 py-4 bg-white text-indigo-600 font-bold rounded-xl hover:bg-white/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {creating ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-indigo-500"></div>
                  Hazırlanıyor...
                </>
              ) : (
                <>
                  <Play className="h-5 w-5" />
                  Denemeye Başla
                </>
              )}
            </button>
          </div>

          {!hasEnoughQuestions && (
            <div className="mt-4 p-3 bg-white/10 rounded-lg text-sm">
              ⚠️ Tam deneme için yeterli soru yok. Mevcut: {totalQuestions}/90 soru
            </div>
          )}
        </motion.div>

        {/* Soru Dağılımı */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Soru Havuzu
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { subject: 'Türkçe', quota: 20, color: 'bg-blue-500' },
              { subject: 'Matematik', quota: 20, color: 'bg-red-500' },
              { subject: 'Fen Bilimleri', quota: 20, color: 'bg-green-500' },
              { subject: 'İnkılap Tarihi', quota: 10, color: 'bg-amber-500' },
              { subject: 'Din Kültürü', quota: 10, color: 'bg-teal-500' },
              { subject: 'İngilizce', quota: 10, color: 'bg-purple-500' }
            ].map(({ subject, quota, color }) => {
              const count = questionCounts[subject] || 0
              const percentage = Math.min(100, (count / quota) * 100)
              
              return (
                <div key={subject} className="text-center">
                  <div className="relative w-16 h-16 mx-auto mb-2">
                    <svg className="w-16 h-16 transform -rotate-90">
                      <circle
                        cx="32"
                        cy="32"
                        r="28"
                        stroke="currentColor"
                        strokeWidth="8"
                        fill="transparent"
                        className="text-gray-200 dark:text-gray-700"
                      />
                      <circle
                        cx="32"
                        cy="32"
                        r="28"
                        stroke="currentColor"
                        strokeWidth="8"
                        fill="transparent"
                        strokeDasharray={`${percentage * 1.76} 176`}
                        className={color.replace('bg-', 'text-')}
                      />
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-gray-900 dark:text-white">
                      {count}
                    </span>
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">{subject}</div>
                  <div className="text-xs text-gray-400">/{quota}</div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Geçmiş Denemeler */}
        <div className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              Geçmiş Denemeler
            </h3>
          </div>

          {pastExams.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Henüz deneme sınavı çözmediniz.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {pastExams.map((exam) => (
                <div
                  key={exam.id}
                  className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        exam.status === 'completed'
                          ? 'bg-green-100 dark:bg-green-900/30'
                          : 'bg-yellow-100 dark:bg-yellow-900/30'
                      }`}>
                        {exam.status === 'completed' ? (
                          <CheckCircle className="h-6 w-6 text-green-500" />
                        ) : (
                          <Clock className="h-6 w-6 text-yellow-500" />
                        )}
                      </div>
                      
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          {exam.title}
                        </h4>
                        <p className="text-sm text-gray-500">
                          {formatDate(exam.created_at)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      {exam.status === 'completed' ? (
                        <>
                          <div className="text-center">
                            <div className="text-lg font-bold text-green-500">
                              {exam.total_net.toFixed(2)}
                            </div>
                            <div className="text-xs text-gray-500">Net</div>
                          </div>
                          <div className="text-center">
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              <span className="text-green-500">{exam.total_correct}</span>
                              {' / '}
                              <span className="text-red-500">{exam.total_wrong}</span>
                              {' / '}
                              <span className="text-gray-400">{exam.total_empty}</span>
                            </div>
                            <div className="text-xs text-gray-500">D/Y/B</div>
                          </div>
                          <div className="text-center">
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              {formatTime(exam.time_spent_seconds)}
                            </div>
                            <div className="text-xs text-gray-500">Süre</div>
                          </div>
                        </>
                      ) : (
                        <span className="px-3 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 text-sm rounded-full">
                          Devam Ediyor
                        </span>
                      )}
                      
                      <button
                        onClick={() => continueExam(exam.id)}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                      >
                        <ChevronRight className="h-5 w-5 text-gray-400" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

