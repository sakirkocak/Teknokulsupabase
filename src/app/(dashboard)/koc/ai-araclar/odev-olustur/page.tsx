'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { useProfile, useTeacherProfile } from '@/hooks/useProfile'
import { createClient } from '@/lib/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { 
  BookOpen,
  Search,
  Plus,
  Trash2,
  Send,
  User,
  Calendar,
  CheckCircle,
  Loader2,
  ChevronRight,
  HelpCircle,
  Database
} from 'lucide-react'

interface Question {
  id: string
  subject: string
  topic: string
  difficulty: string
  question_type: string
  question_text: string
  options: string[] | null
  correct_answer: string
  explanation: string
}

interface Student {
  id: string
  profiles: {
    full_name: string
    avatar_url: string | null
  } | null
}

export default function CreateAssignmentPage() {
  const router = useRouter()
  const { profile } = useProfile()
  const { teacherProfile } = useTeacherProfile(profile?.id || '')
  const [step, setStep] = useState(1)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [selectedStudentId, setSelectedStudentId] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [myQuestions, setMyQuestions] = useState<Question[]>([])
  const [selectedQuestions, setSelectedQuestions] = useState<Question[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [activeTab, setActiveTab] = useState<'my' | 'pool'>('my')
  const [poolQuestions, setPoolQuestions] = useState<Question[]>([])
  const supabase = createClient()

  useEffect(() => {
    if (teacherProfile?.id) {
      loadMyQuestions()
      loadStudents()
    }
  }, [teacherProfile?.id])

  async function loadMyQuestions() {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('ai_questions')
        .select('*')
        .eq('coach_id', teacherProfile?.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setMyQuestions(data || [])
    } catch (error) {
      console.error('Error loading questions:', error)
    } finally {
      setLoading(false)
    }
  }

  async function loadPoolQuestions() {
    try {
      const { data, error } = await supabase
        .from('ai_questions')
        .select('*')
        .eq('is_public', true)
        .neq('coach_id', teacherProfile?.id)
        .order('likes', { ascending: false })
        .limit(50)

      if (error) throw error
      setPoolQuestions(data || [])
    } catch (error) {
      console.error('Error loading pool questions:', error)
    }
  }

  async function loadStudents() {
    const { data } = await supabase
      .from('coaching_relationships')
      .select(`
        student:student_profiles!coaching_relationships_student_id_fkey(
          id,
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
            profiles: Array.isArray(student.profiles) ? student.profiles[0] : student.profiles
          } as Student
        })
        .filter((s): s is Student => s !== null)
      setStudents(studentsData)
    }
  }

  function toggleQuestion(question: Question) {
    const exists = selectedQuestions.find(q => q.id === question.id)
    if (exists) {
      setSelectedQuestions(selectedQuestions.filter(q => q.id !== question.id))
    } else {
      setSelectedQuestions([...selectedQuestions, question])
    }
  }

  async function handleSend() {
    if (!title || !selectedStudentId || selectedQuestions.length === 0) {
      alert('Lütfen tüm alanları doldurun')
      return
    }

    setSending(true)

    try {
      const { error } = await supabase
        .from('assignments')
        .insert({
          coach_id: teacherProfile?.id,
          student_id: selectedStudentId,
          title,
          description,
          questions: selectedQuestions.map(q => ({
            id: q.id,
            question_text: q.question_text,
            question_type: q.question_type,
            options: q.options,
            correct_answer: q.correct_answer,
            explanation: q.explanation,
            difficulty: q.difficulty,
          })),
          due_date: dueDate || null,
          status: 'pending',
        })

      if (error) throw error

      // Öğrenciye bildirim gönder
      const student = students.find(s => s.id === selectedStudentId)
      const { data: studentProfile } = await supabase
        .from('student_profiles')
        .select('user_id')
        .eq('id', selectedStudentId)
        .single()

      if (studentProfile) {
        await supabase
          .from('notifications')
          .insert({
            user_id: studentProfile.user_id,
            title: 'Yeni Ödev',
            body: `Koçunuz size "${title}" başlıklı bir ödev gönderdi.`,
            type: 'assignment',
            data: { link: '/ogrenci/odevler' },
          })
      }

      alert('Ödev başarıyla gönderildi!')
      router.push('/koc/gorevler')
    } catch (error: any) {
      alert('Hata: ' + error.message)
    } finally {
      setSending(false)
    }
  }

  const filteredQuestions = (activeTab === 'my' ? myQuestions : poolQuestions).filter(q =>
    q.question_text.toLowerCase().includes(searchTerm.toLowerCase()) ||
    q.topic.toLowerCase().includes(searchTerm.toLowerCase()) ||
    q.subject.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const difficultyColors: Record<string, string> = {
    easy: 'bg-green-100 text-green-700',
    medium: 'bg-yellow-100 text-yellow-700',
    hard: 'bg-red-100 text-red-700',
  }

  return (
    <DashboardLayout role="koc">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-surface-900 flex items-center gap-2">
            <BookOpen className="w-7 h-7 text-primary-500" />
            Ödev Oluştur
          </h1>
          <p className="text-surface-500">Sorulardan ödev oluşturup öğrenciye gönderin</p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center gap-2">
          {[1, 2, 3].map((s, i) => (
            <div key={s} className="flex items-center">
              <button
                onClick={() => setStep(s)}
                className={`w-8 h-8 rounded-full flex items-center justify-center font-medium text-sm transition-colors ${
                  step >= s
                    ? 'bg-primary-500 text-white'
                    : 'bg-surface-100 text-surface-400'
                }`}
              >
                {s}
              </button>
              {i < 2 && (
                <div className={`w-12 h-1 ${step > s ? 'bg-primary-500' : 'bg-surface-200'}`} />
              )}
            </div>
          ))}
        </div>

        {/* Step 1: Select Questions */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="card p-4">
              <div className="flex items-center gap-4 mb-4">
                <div className="flex gap-2">
                  <button
                    onClick={() => { setActiveTab('my'); loadMyQuestions() }}
                    className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                      activeTab === 'my'
                        ? 'bg-primary-500 text-white'
                        : 'bg-surface-100 text-surface-600 hover:bg-surface-200'
                    }`}
                  >
                    <HelpCircle className="w-4 h-4 inline mr-2" />
                    Sorularım
                  </button>
                  <button
                    onClick={() => { setActiveTab('pool'); loadPoolQuestions() }}
                    className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                      activeTab === 'pool'
                        ? 'bg-primary-500 text-white'
                        : 'bg-surface-100 text-surface-600 hover:bg-surface-200'
                    }`}
                  >
                    <Database className="w-4 h-4 inline mr-2" />
                    Soru Havuzu
                  </button>
                </div>
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Soru ara..."
                    className="input pl-10 w-full"
                  />
                </div>
              </div>

              {/* Selected Count */}
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-surface-500">
                  {selectedQuestions.length} soru seçildi
                </span>
                {selectedQuestions.length > 0 && (
                  <button
                    onClick={() => setSelectedQuestions([])}
                    className="text-sm text-red-500 hover:text-red-600"
                  >
                    Temizle
                  </button>
                )}
              </div>

              {/* Questions List */}
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
                </div>
              ) : filteredQuestions.length === 0 ? (
                <div className="text-center py-12">
                  <HelpCircle className="w-12 h-12 mx-auto text-surface-300 mb-4" />
                  <p className="text-surface-500">Soru bulunamadı</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {filteredQuestions.map((question) => {
                    const isSelected = selectedQuestions.some(q => q.id === question.id)
                    return (
                      <div
                        key={question.id}
                        onClick={() => toggleQuestion(question)}
                        className={`p-4 rounded-xl cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-primary-50 border-2 border-primary-500'
                            : 'bg-surface-50 border-2 border-transparent hover:border-surface-200'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="px-2 py-0.5 bg-surface-200 text-surface-600 text-xs rounded-full">
                                {question.subject}
                              </span>
                              <span className={`px-2 py-0.5 text-xs rounded-full ${difficultyColors[question.difficulty]}`}>
                                {question.difficulty === 'easy' ? 'Kolay' : question.difficulty === 'medium' ? 'Orta' : 'Zor'}
                              </span>
                            </div>
                            <p className="text-surface-700 text-sm line-clamp-2">{question.question_text}</p>
                          </div>
                          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                            isSelected
                              ? 'border-primary-500 bg-primary-500'
                              : 'border-surface-300'
                          }`}>
                            {isSelected && <CheckCircle className="w-4 h-4 text-white" />}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            <button
              onClick={() => setStep(2)}
              disabled={selectedQuestions.length === 0}
              className="btn btn-primary btn-lg w-full"
            >
              Devam Et ({selectedQuestions.length} soru)
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Step 2: Assignment Details */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="card p-6 space-y-4">
              <div>
                <label className="label">Ödev Başlığı</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="input"
                  placeholder="Örn: Matematik - Denklemler Quiz"
                />
              </div>

              <div>
                <label className="label">Açıklama (opsiyonel)</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="input min-h-[100px]"
                  placeholder="Ödev hakkında notlar..."
                />
              </div>

              <div>
                <label className="label">Son Teslim Tarihi (opsiyonel)</label>
                <input
                  type="datetime-local"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="input"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="btn btn-outline btn-lg flex-1"
              >
                Geri
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={!title}
                className="btn btn-primary btn-lg flex-1"
              >
                Devam Et
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Select Student */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="card p-6">
              <h3 className="font-semibold text-surface-900 mb-4 flex items-center gap-2">
                <User className="w-5 h-5" />
                Öğrenci Seç
              </h3>

              {students.length === 0 ? (
                <div className="text-center py-8">
                  <User className="w-12 h-12 mx-auto text-surface-300 mb-4" />
                  <p className="text-surface-500">Henüz öğrenciniz yok</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {students.map((student) => (
                    <div
                      key={student.id}
                      onClick={() => setSelectedStudentId(student.id)}
                      className={`p-4 rounded-xl cursor-pointer transition-all flex items-center justify-between ${
                        selectedStudentId === student.id
                          ? 'bg-primary-50 border-2 border-primary-500'
                          : 'bg-surface-50 border-2 border-transparent hover:border-surface-200'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-primary-600" />
                        </div>
                        <span className="font-medium text-surface-900">
                          {student.profiles?.full_name || 'İsimsiz Öğrenci'}
                        </span>
                      </div>
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                        selectedStudentId === student.id
                          ? 'border-primary-500 bg-primary-500'
                          : 'border-surface-300'
                      }`}>
                        {selectedStudentId === student.id && <CheckCircle className="w-4 h-4 text-white" />}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Summary */}
            <div className="card p-6 bg-surface-50">
              <h3 className="font-semibold text-surface-900 mb-4">Özet</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-surface-500">Başlık:</span>
                  <span className="text-surface-900 font-medium">{title}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-surface-500">Soru Sayısı:</span>
                  <span className="text-surface-900 font-medium">{selectedQuestions.length}</span>
                </div>
                {dueDate && (
                  <div className="flex justify-between">
                    <span className="text-surface-500">Son Teslim:</span>
                    <span className="text-surface-900 font-medium">
                      {new Date(dueDate).toLocaleString('tr-TR')}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(2)}
                className="btn btn-outline btn-lg flex-1"
              >
                Geri
              </button>
              <button
                onClick={handleSend}
                disabled={!selectedStudentId || sending}
                className="btn btn-primary btn-lg flex-1"
              >
                {sending ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Gönderiliyor...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Ödevi Gönder
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

