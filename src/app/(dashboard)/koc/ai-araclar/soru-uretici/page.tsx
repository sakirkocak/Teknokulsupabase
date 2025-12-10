'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { useProfile, useTeacherProfile } from '@/hooks/useProfile'
import { createClient } from '@/lib/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Sparkles,
  Loader2,
  CheckCircle,
  Save,
  Send,
  Trash2,
  Check,
  Globe,
  User,
  X
} from 'lucide-react'

type QuestionType = 'multiple_choice' | 'true_false' | 'open_ended' | 'fill_blank'
type Difficulty = 'easy' | 'medium' | 'hard' | 'auto'

interface GeneratedQuestion {
  question_text: string
  question_type: QuestionType
  options?: string[]
  correct_answer: string
  explanation: string
  difficulty: 'easy' | 'medium' | 'hard'
}

interface Student {
  id: string
  profiles: {
    full_name: string
    avatar_url: string | null
  } | null
}

const subjects = [
  'Matematik', 'Fizik', 'Kimya', 'Biyoloji', 'Türkçe', 'Edebiyat',
  'Tarih', 'Coğrafya', 'İngilizce', 'Felsefe', 'Din Kültürü'
]

const questionTypeLabels: Record<QuestionType, string> = {
  multiple_choice: 'Çoktan Seçmeli',
  true_false: 'Doğru/Yanlış',
  open_ended: 'Açık Uçlu',
  fill_blank: 'Boşluk Doldurma',
}

const difficultyLabels: Record<string, { label: string; color: string }> = {
  easy: { label: 'Kolay', color: 'bg-green-100 text-green-700' },
  medium: { label: 'Orta', color: 'bg-yellow-100 text-yellow-700' },
  hard: { label: 'Zor', color: 'bg-red-100 text-red-700' },
  auto: { label: 'Otomatik', color: 'bg-blue-100 text-blue-700' },
}

export default function QuestionGeneratorPage() {
  const { profile } = useProfile()
  const { teacherProfile } = useTeacherProfile(profile?.id || '')
  const [subject, setSubject] = useState('')
  const [topic, setTopic] = useState('')
  const [questionTypes, setQuestionTypes] = useState<QuestionType[]>(['multiple_choice'])
  const [difficulty, setDifficulty] = useState<Difficulty>('auto')
  const [count, setCount] = useState(5)
  const [generating, setGenerating] = useState(false)
  const [questions, setQuestions] = useState<GeneratedQuestion[]>([])
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  
  // Ödev gönderme için
  const [showSendModal, setShowSendModal] = useState(false)
  const [students, setStudents] = useState<Student[]>([])
  const [selectedStudentId, setSelectedStudentId] = useState('')
  const [assignmentTitle, setAssignmentTitle] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  
  const supabase = createClient()

  useEffect(() => {
    if (teacherProfile?.id) {
      loadStudents()
    }
  }, [teacherProfile?.id])

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

  function toggleQuestionType(type: QuestionType) {
    if (questionTypes.includes(type)) {
      if (questionTypes.length > 1) {
        setQuestionTypes(questionTypes.filter(t => t !== type))
      }
    } else {
      setQuestionTypes([...questionTypes, type])
    }
  }

  async function handleGenerate() {
    if (!subject || !topic) {
      alert('Lütfen ders ve konu seçin')
      return
    }

    setGenerating(true)
    setQuestions([])

    try {
      const response = await fetch('/api/ai/generate-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject,
          topic,
          questionTypes,
          difficulty,
          count,
        }),
      })

      const data = await response.json()

      if (data.error) {
        throw new Error(data.error)
      }

      setQuestions(data.questions)
      // Varsayılan ödev başlığı
      setAssignmentTitle(`${subject} - ${topic}`)
    } catch (error: any) {
      alert('Soru üretme hatası: ' + error.message)
    } finally {
      setGenerating(false)
    }
  }

  async function handleSaveAll(isPublic: boolean = false) {
    if (!teacherProfile?.id || questions.length === 0) return

    setSaving(true)

    try {
      const questionsToSave = questions.map(q => ({
        coach_id: teacherProfile.id,
        subject,
        topic,
        difficulty: q.difficulty,
        question_type: q.question_type,
        question_text: q.question_text,
        options: q.options || null,
        correct_answer: q.correct_answer,
        explanation: q.explanation,
        is_public: isPublic,
      }))

      const { error } = await supabase
        .from('ai_questions')
        .insert(questionsToSave)

      if (error) throw error

      // Kullanım istatistiği kaydet
      await supabase
        .from('ai_usage_stats')
        .insert({
          coach_id: teacherProfile.id,
          tool_type: 'question_generator',
        })

      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (error: any) {
      alert('Kaydetme hatası: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleSendAssignment() {
    if (!teacherProfile?.id || !selectedStudentId || questions.length === 0) {
      alert('Lütfen öğrenci seçin')
      return
    }

    setSending(true)

    try {
      // Önce soruları kaydet ve ID'lerini al
      const questionsToSave = questions.map((q, index) => ({
        id: `temp-${index}`, // Geçici ID
        question_text: q.question_text,
        question_type: q.question_type,
        options: q.options || null,
        correct_answer: q.correct_answer,
        explanation: q.explanation,
        difficulty: q.difficulty,
      }))

      // Ödevi oluştur
      const { error: assignmentError } = await supabase
        .from('assignments')
        .insert({
          coach_id: teacherProfile.id,
          student_id: selectedStudentId,
          title: assignmentTitle || `${subject} - ${topic}`,
          description: `${subject} dersi, ${topic} konusu - ${questions.length} soru`,
          questions: questionsToSave,
          status: 'pending',
        })

      if (assignmentError) throw assignmentError

      // Öğrenciye bildirim gönder
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
            body: `Koçunuz size "${assignmentTitle || subject}" ödevini gönderdi.`,
            type: 'assignment',
            data: { link: '/ogrenci/odevler' },
          })
      }

      // Soruları da veritabanına kaydet
      await supabase
        .from('ai_questions')
        .insert(questions.map(q => ({
          coach_id: teacherProfile.id,
          subject,
          topic,
          difficulty: q.difficulty,
          question_type: q.question_type,
          question_text: q.question_text,
          options: q.options || null,
          correct_answer: q.correct_answer,
          explanation: q.explanation,
          is_public: false,
        })))

      setSent(true)
      setShowSendModal(false)
      setTimeout(() => setSent(false), 3000)
    } catch (error: any) {
      alert('Gönderme hatası: ' + error.message)
    } finally {
      setSending(false)
    }
  }

  function removeQuestion(index: number) {
    setQuestions(questions.filter((_, i) => i !== index))
  }

  return (
    <DashboardLayout role="koc">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-surface-900 flex items-center gap-2">
              <Sparkles className="w-7 h-7 text-primary-500" />
              AI Soru Üretici
            </h1>
            <p className="text-surface-500">Yapay zeka ile anında soru oluşturun</p>
          </div>
        </div>

        {/* Generator Form */}
        <div className="card p-6 space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Ders Seçimi */}
            <div>
              <label className="label">Ders</label>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="input"
              >
                <option value="">Ders seçin</option>
                {subjects.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            {/* Konu */}
            <div>
              <label className="label">Konu</label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="input"
                placeholder="Örn: İkinci Dereceden Denklemler"
              />
            </div>
          </div>

          {/* Soru Tipleri */}
          <div>
            <label className="label">Soru Tipleri</label>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(questionTypeLabels) as QuestionType[]).map(type => (
                <button
                  key={type}
                  onClick={() => toggleQuestionType(type)}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                    questionTypes.includes(type)
                      ? 'bg-primary-500 text-white'
                      : 'bg-surface-100 text-surface-600 hover:bg-surface-200'
                  }`}
                >
                  {questionTypeLabels[type]}
                </button>
              ))}
            </div>
          </div>

          {/* Zorluk ve Sayı */}
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="label">Zorluk Seviyesi</label>
              <div className="flex flex-wrap gap-2">
                {(['auto', 'easy', 'medium', 'hard'] as Difficulty[]).map(d => (
                  <button
                    key={d}
                    onClick={() => setDifficulty(d)}
                    className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                      difficulty === d
                        ? difficultyLabels[d].color + ' ring-2 ring-offset-2 ring-current'
                        : 'bg-surface-100 text-surface-600 hover:bg-surface-200'
                    }`}
                  >
                    {difficultyLabels[d].label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="label">Soru Sayısı: {count}</label>
              <input
                type="range"
                min="1"
                max="20"
                value={count}
                onChange={(e) => setCount(parseInt(e.target.value))}
                className="w-full h-2 bg-surface-200 rounded-lg appearance-none cursor-pointer accent-primary-500"
              />
              <div className="flex justify-between text-xs text-surface-400 mt-1">
                <span>1</span>
                <span>20</span>
              </div>
            </div>
          </div>

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={generating || !subject || !topic}
            className="btn btn-primary btn-lg w-full"
          >
            {generating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Sorular Üretiliyor...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                {count} Soru Üret
              </>
            )}
          </button>
        </div>

        {/* Success Messages */}
        <AnimatePresence>
          {saved && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-4 bg-green-50 text-green-700 rounded-xl flex items-center gap-2"
            >
              <CheckCircle className="w-5 h-5" />
              {questions.length} soru başarıyla kaydedildi!
            </motion.div>
          )}
          {sent && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-4 bg-blue-50 text-blue-700 rounded-xl flex items-center gap-2"
            >
              <Send className="w-5 h-5" />
              Ödev başarıyla gönderildi!
            </motion.div>
          )}
        </AnimatePresence>

        {/* Generated Questions */}
        {questions.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <h2 className="text-lg font-semibold text-surface-900">
                Üretilen Sorular ({questions.length})
              </h2>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handleSaveAll(false)}
                  disabled={saving}
                  className="btn btn-outline btn-md"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Kaydet
                </button>
                <button
                  onClick={() => handleSaveAll(true)}
                  disabled={saving}
                  className="btn btn-outline btn-md"
                >
                  <Globe className="w-4 h-4" />
                  Havuza Ekle
                </button>
                <button
                  onClick={() => setShowSendModal(true)}
                  className="btn btn-primary btn-md"
                >
                  <Send className="w-4 h-4" />
                  Ödev Olarak Gönder
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {questions.map((question, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="card p-5"
                >
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex items-center gap-2">
                      <span className="w-8 h-8 bg-primary-100 text-primary-600 rounded-lg flex items-center justify-center font-bold text-sm">
                        {index + 1}
                      </span>
                      <span className="px-2 py-1 bg-surface-100 text-surface-600 text-xs rounded-full">
                        {questionTypeLabels[question.question_type]}
                      </span>
                      <span className={`px-2 py-1 text-xs rounded-full ${difficultyLabels[question.difficulty].color}`}>
                        {difficultyLabels[question.difficulty].label}
                      </span>
                    </div>
                    <button
                      onClick={() => removeQuestion(index)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <p className="text-surface-900 font-medium mb-4">{question.question_text}</p>

                  {/* Options for multiple choice */}
                  {question.options && (
                    <div className="space-y-2 mb-4">
                      {question.options.map((opt, i) => (
                        <div
                          key={i}
                          className={`p-3 rounded-lg ${
                            opt.startsWith(question.correct_answer.charAt(0))
                              ? 'bg-green-50 border border-green-200'
                              : 'bg-surface-50'
                          }`}
                        >
                          {opt}
                          {opt.startsWith(question.correct_answer.charAt(0)) && (
                            <Check className="w-4 h-4 text-green-500 inline ml-2" />
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Correct answer for other types */}
                  {!question.options && (
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg mb-4">
                      <span className="text-sm text-green-600 font-medium">Doğru Cevap: </span>
                      <span className="text-green-700">{question.correct_answer}</span>
                    </div>
                  )}

                  {/* Explanation */}
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <span className="text-sm text-blue-600 font-medium">Açıklama: </span>
                    <span className="text-blue-700 text-sm">{question.explanation}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Send Assignment Modal */}
        {showSendModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-2xl max-w-md w-full"
            >
              <div className="p-6 border-b border-surface-100 flex items-center justify-between">
                <h2 className="text-xl font-bold text-surface-900">
                  Ödev Olarak Gönder
                </h2>
                <button
                  onClick={() => setShowSendModal(false)}
                  className="p-2 text-surface-400 hover:bg-surface-100 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                {/* Ödev Başlığı */}
                <div>
                  <label className="label">Ödev Başlığı</label>
                  <input
                    type="text"
                    value={assignmentTitle}
                    onChange={(e) => setAssignmentTitle(e.target.value)}
                    className="input"
                    placeholder={`${subject} - ${topic}`}
                  />
                </div>

                {/* Öğrenci Seçimi */}
                <div>
                  <label className="label">Öğrenci Seç</label>
                  {students.length === 0 ? (
                    <div className="p-4 bg-surface-50 rounded-xl text-center text-surface-500">
                      <User className="w-8 h-8 mx-auto mb-2 text-surface-300" />
                      <p>Henüz öğrenciniz yok</p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {students.map((student) => (
                        <div
                          key={student.id}
                          onClick={() => setSelectedStudentId(student.id)}
                          className={`p-3 rounded-xl cursor-pointer flex items-center justify-between transition-all ${
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
                          {selectedStudentId === student.id && (
                            <CheckCircle className="w-5 h-5 text-primary-500" />
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Özet */}
                <div className="p-4 bg-surface-50 rounded-xl">
                  <p className="text-sm text-surface-600">
                    <strong>{questions.length}</strong> soru gönderilecek
                  </p>
                </div>
              </div>

              <div className="p-6 border-t border-surface-100 flex justify-end gap-3">
                <button
                  onClick={() => setShowSendModal(false)}
                  className="btn btn-ghost"
                >
                  İptal
                </button>
                <button
                  onClick={handleSendAssignment}
                  disabled={sending || !selectedStudentId || students.length === 0}
                  className="btn btn-primary"
                >
                  {sending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  Gönder
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
