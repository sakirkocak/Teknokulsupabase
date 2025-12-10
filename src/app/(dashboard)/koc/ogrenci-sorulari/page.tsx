'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { useProfile, useTeacherProfile } from '@/hooks/useProfile'
import { createClient } from '@/lib/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  MessageCircle, 
  Send, 
  Loader2,
  CheckCircle,
  Clock,
  User,
  X,
  Eye,
  ArrowLeft
} from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import 'katex/dist/katex.min.css'
import { getInitials } from '@/lib/utils'

interface Question {
  id: string
  image_url: string
  solution: string
  coach_feedback: string | null
  status: 'sent_to_coach' | 'coach_replied'
  created_at: string
  student: {
    id: string
    user_id: string
    profile: {
      full_name: string
      avatar_url: string | null
    }
  }
}

export default function StudentQuestionsPage() {
  const { profile } = useProfile()
  const { teacherProfile } = useTeacherProfile(profile?.id || '')
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null)
  const [feedback, setFeedback] = useState('')
  const [sending, setSending] = useState(false)
  const [filter, setFilter] = useState<'all' | 'pending' | 'replied'>('all')
  const supabase = createClient()

  useEffect(() => {
    if (teacherProfile?.id) {
      loadQuestions()
    }
  }, [teacherProfile?.id])

  async function loadQuestions() {
    setLoading(true)

    const { data, error } = await supabase
      .from('question_solutions')
      .select(`
        *,
        student:student_profiles!question_solutions_student_id_fkey(
          id,
          user_id,
          profile:profiles!student_profiles_user_id_fkey(full_name, avatar_url)
        )
      `)
      .eq('coach_id', teacherProfile?.id)
      .in('status', ['sent_to_coach', 'coach_replied'])
      .order('created_at', { ascending: false })

    if (data) {
      setQuestions(data as Question[])
    }

    setLoading(false)
  }

  async function sendFeedback() {
    if (!selectedQuestion || !feedback.trim()) return

    setSending(true)

    try {
      // Geri dönütü kaydet
      const { error: updateError } = await supabase
        .from('question_solutions')
        .update({
          coach_feedback: feedback,
          status: 'coach_replied',
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedQuestion.id)

      if (updateError) throw updateError

      // Öğrenciye bildirim gönder
      await supabase.from('notifications').insert({
        user_id: selectedQuestion.student.user_id,
        title: '💬 Koçunuzdan Geri Dönüt',
        body: `${profile?.full_name} paylaştığınız soru çözümü hakkında geri dönüt verdi.`,
        type: 'question_feedback',
        data: { questionId: selectedQuestion.id }
      })

      // Listeyi güncelle
      setQuestions(prev => prev.map(q => 
        q.id === selectedQuestion.id 
          ? { ...q, coach_feedback: feedback, status: 'coach_replied' as const }
          : q
      ))

      setSelectedQuestion({ ...selectedQuestion, coach_feedback: feedback, status: 'coach_replied' })
      setFeedback('')
      alert('Geri dönüt başarıyla gönderildi!')
    } catch (err: any) {
      alert('Hata: ' + err.message)
    } finally {
      setSending(false)
    }
  }

  const filteredQuestions = questions.filter(q => {
    if (filter === 'pending') return q.status === 'sent_to_coach'
    if (filter === 'replied') return q.status === 'coach_replied'
    return true
  })

  const pendingCount = questions.filter(q => q.status === 'sent_to_coach').length

  if (loading) {
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-surface-900">Öğrenci Soruları</h1>
            <p className="text-surface-500">Öğrencilerinizin paylaştığı soru çözümlerini inceleyin</p>
          </div>
          {pendingCount > 0 && (
            <div className="px-4 py-2 bg-yellow-100 text-yellow-700 rounded-xl font-medium">
              {pendingCount} bekleyen soru
            </div>
          )}
        </div>

        {/* Filters */}
        <div className="flex gap-2">
          {[
            { key: 'all', label: 'Tümü' },
            { key: 'pending', label: 'Bekleyenler' },
            { key: 'replied', label: 'Cevaplananlar' },
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key as any)}
              className={`px-4 py-2 rounded-xl font-medium transition-colors ${
                filter === f.key
                  ? 'bg-primary-500 text-white'
                  : 'bg-surface-100 text-surface-600 hover:bg-surface-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Selected Question Detail */}
        <AnimatePresence>
          {selectedQuestion && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="card overflow-hidden"
            >
              <div className="p-4 bg-surface-50 border-b border-surface-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-primary-600 rounded-xl flex items-center justify-center text-white font-medium overflow-hidden">
                    {selectedQuestion.student.profile.avatar_url ? (
                      <img src={selectedQuestion.student.profile.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      getInitials(selectedQuestion.student.profile.full_name)
                    )}
                  </div>
                  <div>
                    <div className="font-semibold text-surface-900">{selectedQuestion.student.profile.full_name}</div>
                    <div className="text-sm text-surface-500">
                      {new Date(selectedQuestion.created_at).toLocaleDateString('tr-TR', {
                        day: 'numeric',
                        month: 'long',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                </div>
                <button onClick={() => setSelectedQuestion(null)} className="p-2 text-surface-400 hover:text-surface-600 hover:bg-surface-100 rounded-xl">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid lg:grid-cols-2">
                {/* Question Image & AI Solution */}
                <div className="p-4 border-r border-surface-100">
                  <h3 className="font-semibold text-surface-900 mb-3">Soru Görseli</h3>
                  <img 
                    src={selectedQuestion.image_url} 
                    alt="Soru" 
                    className="w-full rounded-xl border border-surface-200 mb-4"
                  />
                  
                  <h3 className="font-semibold text-surface-900 mb-3">AI Çözümü</h3>
                  <div className="bg-surface-50 rounded-xl p-4 prose prose-sm max-w-none max-h-[300px] overflow-y-auto math-content">
                    <ReactMarkdown 
                      remarkPlugins={[remarkMath]} 
                      rehypePlugins={[rehypeKatex]}
                    >
                      {selectedQuestion.solution}
                    </ReactMarkdown>
                  </div>
                </div>

                {/* Feedback Section */}
                <div className="p-4">
                  <h3 className="font-semibold text-surface-900 mb-3">Koç Geri Dönütü</h3>
                  
                  {selectedQuestion.coach_feedback ? (
                    <div className="bg-green-50 border border-green-200 rounded-xl p-4 prose prose-sm max-w-none math-content">
                      <div className="flex items-center gap-2 text-green-700 font-medium mb-2">
                        <CheckCircle className="w-5 h-5" />
                        Geri dönüt gönderildi
                      </div>
                      <ReactMarkdown 
                        remarkPlugins={[remarkMath]} 
                        rehypePlugins={[rehypeKatex]}
                      >
                        {selectedQuestion.coach_feedback}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
                        <div className="flex items-center gap-2 text-yellow-700 font-medium">
                          <Clock className="w-5 h-5" />
                          Geri dönüt bekleniyor
                        </div>
                        <p className="text-sm text-yellow-600 mt-1">
                          Öğrenci sizden bu çözüm hakkında geri dönüt bekliyor.
                        </p>
                      </div>

                      <div>
                        <label className="label">Geri Dönütünüz</label>
                        <textarea
                          value={feedback}
                          onChange={(e) => setFeedback(e.target.value)}
                          className="input min-h-[200px]"
                          placeholder="Öğrenciye geri dönütünüzü yazın...

Örnek:
- Çözüm doğru ama şu noktaya dikkat et...
- Alternatif bir yöntem de şöyle...
- Bu konuyu daha iyi anlamak için..."
                        />
                      </div>

                      <button
                        onClick={sendFeedback}
                        disabled={!feedback.trim() || sending}
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
                            Geri Dönüt Gönder
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Questions List */}
        {!selectedQuestion && (
          <>
            {filteredQuestions.length > 0 ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredQuestions.map((question) => (
                  <motion.div
                    key={question.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="card overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
                    onClick={() => setSelectedQuestion(question)}
                  >
                    <div className="aspect-video relative">
                      <img 
                        src={question.image_url} 
                        alt="Soru" 
                        className="w-full h-full object-cover"
                      />
                      <div className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-medium ${
                        question.status === 'coach_replied'
                          ? 'bg-green-500 text-white'
                          : 'bg-yellow-500 text-white'
                      }`}>
                        {question.status === 'coach_replied' ? '✓ Cevaplandı' : '⏳ Bekliyor'}
                      </div>
                    </div>
                    <div className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-primary-400 to-primary-600 rounded-lg flex items-center justify-center text-white text-sm font-medium overflow-hidden">
                          {question.student.profile.avatar_url ? (
                            <img src={question.student.profile.avatar_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            getInitials(question.student.profile.full_name)
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-surface-900 truncate">
                            {question.student.profile.full_name}
                          </div>
                          <div className="text-xs text-surface-400">
                            {new Date(question.created_at).toLocaleDateString('tr-TR')}
                          </div>
                        </div>
                        <Eye className="w-5 h-5 text-surface-400" />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="card p-12 text-center">
                <MessageCircle className="w-16 h-16 mx-auto mb-4 text-surface-300" />
                <h3 className="text-lg font-semibold text-surface-900 mb-2">Henüz soru yok</h3>
                <p className="text-surface-500">
                  Öğrencileriniz soru çözümlerini sizinle paylaştığında burada görünecek.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  )
}

