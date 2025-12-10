'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { useProfile, useTeacherProfile } from '@/hooks/useProfile'
import { createClient } from '@/lib/supabase/client'
import { motion } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import { 
  Calendar,
  Loader2,
  User,
  Target,
  Clock,
  Sparkles,
  Save,
  Copy,
  CheckCircle,
  BookOpen
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

const examOptions = [
  'TYT', 'AYT', 'LGS', 'YKS', 'KPSS', 'DGS', 'ALES', 'Diğer'
]

const subjectOptions = [
  'Matematik', 'Fizik', 'Kimya', 'Biyoloji', 'Türkçe', 'Edebiyat',
  'Tarih', 'Coğrafya', 'İngilizce', 'Felsefe', 'Geometri'
]

export default function StudyPlanAssistantPage() {
  const { profile } = useProfile()
  const { teacherProfile } = useTeacherProfile(profile?.id || '')
  const [students, setStudents] = useState<Student[]>([])
  const [selectedStudentId, setSelectedStudentId] = useState('')
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [gradeLevel, setGradeLevel] = useState('')
  const [targetExam, setTargetExam] = useState('')
  const [weakSubjects, setWeakSubjects] = useState<string[]>([])
  const [strongSubjects, setStrongSubjects] = useState<string[]>([])
  const [hoursPerDay, setHoursPerDay] = useState(4)
  const [weeks, setWeeks] = useState(4)
  const [generating, setGenerating] = useState(false)
  const [plan, setPlan] = useState('')
  const [saved, setSaved] = useState(false)
  const [copied, setCopied] = useState(false)
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
      if (student) {
        setGradeLevel(student.grade_level || '')
        setTargetExam(student.target_exam || '')
      }
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

  function toggleSubject(subject: string, type: 'weak' | 'strong') {
    if (type === 'weak') {
      if (weakSubjects.includes(subject)) {
        setWeakSubjects(weakSubjects.filter(s => s !== subject))
      } else {
        setWeakSubjects([...weakSubjects, subject])
        setStrongSubjects(strongSubjects.filter(s => s !== subject))
      }
    } else {
      if (strongSubjects.includes(subject)) {
        setStrongSubjects(strongSubjects.filter(s => s !== subject))
      } else {
        setStrongSubjects([...strongSubjects, subject])
        setWeakSubjects(weakSubjects.filter(s => s !== subject))
      }
    }
  }

  async function handleGenerate() {
    if (!selectedStudent) {
      alert('Lütfen bir öğrenci seçin')
      return
    }

    setGenerating(true)
    setPlan('')

    try {
      const response = await fetch('/api/ai/generate-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentName: selectedStudent.profiles?.full_name || 'Öğrenci',
          gradeLevel,
          targetExam,
          weakSubjects,
          strongSubjects,
          hoursPerDay,
          weeks,
        }),
      })

      const data = await response.json()

      if (data.error) {
        throw new Error(data.error)
      }

      setPlan(data.plan)
    } catch (error: any) {
      alert('Plan oluşturma hatası: ' + error.message)
    } finally {
      setGenerating(false)
    }
  }

  async function handleSave() {
    if (!plan || !teacherProfile?.id) return

    try {
      await supabase
        .from('ai_generated_content')
        .insert({
          coach_id: teacherProfile.id,
          tool_type: 'study_plan',
          title: `${selectedStudent?.profiles?.full_name || 'Öğrenci'} - Çalışma Planı`,
          content: { plan },
          metadata: {
            studentId: selectedStudentId,
            gradeLevel,
            targetExam,
            weakSubjects,
            strongSubjects,
            hoursPerDay,
            weeks,
          },
        })

      // Kullanım istatistiği
      await supabase
        .from('ai_usage_stats')
        .insert({
          coach_id: teacherProfile.id,
          tool_type: 'study_plan',
        })

      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (error: any) {
      alert('Kaydetme hatası: ' + error.message)
    }
  }

  function handleCopy() {
    navigator.clipboard.writeText(plan)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <DashboardLayout role="koc">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-surface-900 flex items-center gap-2">
            <Calendar className="w-7 h-7 text-primary-500" />
            Plan Asistanı
          </h1>
          <p className="text-surface-500">Öğrenciler için kişiselleştirilmiş çalışma planı oluşturun</p>
        </div>

        {/* Form */}
        <div className="card p-6 space-y-6">
          {/* Student Selection */}
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

          {selectedStudent && (
            <>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="label">Sınıf / Seviye</label>
                  <input
                    type="text"
                    value={gradeLevel}
                    onChange={(e) => setGradeLevel(e.target.value)}
                    className="input"
                    placeholder="Örn: 12. Sınıf"
                  />
                </div>
                <div>
                  <label className="label">
                    <Target className="w-4 h-4 inline mr-1" />
                    Hedef Sınav
                  </label>
                  <select
                    value={targetExam}
                    onChange={(e) => setTargetExam(e.target.value)}
                    className="input"
                  >
                    <option value="">Seçin</option>
                    {examOptions.map(e => (
                      <option key={e} value={e}>{e}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Weak Subjects */}
              <div>
                <label className="label text-red-600">
                  Zayıf Konular / Dersler
                </label>
                <div className="flex flex-wrap gap-2">
                  {subjectOptions.map(subject => (
                    <button
                      key={subject}
                      onClick={() => toggleSubject(subject, 'weak')}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        weakSubjects.includes(subject)
                          ? 'bg-red-500 text-white'
                          : 'bg-surface-100 text-surface-600 hover:bg-surface-200'
                      }`}
                    >
                      {subject}
                    </button>
                  ))}
                </div>
              </div>

              {/* Strong Subjects */}
              <div>
                <label className="label text-green-600">
                  Güçlü Konular / Dersler
                </label>
                <div className="flex flex-wrap gap-2">
                  {subjectOptions.map(subject => (
                    <button
                      key={subject}
                      onClick={() => toggleSubject(subject, 'strong')}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        strongSubjects.includes(subject)
                          ? 'bg-green-500 text-white'
                          : 'bg-surface-100 text-surface-600 hover:bg-surface-200'
                      }`}
                    >
                      {subject}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="label">
                    <Clock className="w-4 h-4 inline mr-1" />
                    Günlük Çalışma Süresi: {hoursPerDay} saat
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="12"
                    value={hoursPerDay}
                    onChange={(e) => setHoursPerDay(parseInt(e.target.value))}
                    className="w-full h-2 bg-surface-200 rounded-lg appearance-none cursor-pointer accent-primary-500"
                  />
                </div>
                <div>
                  <label className="label">
                    <Calendar className="w-4 h-4 inline mr-1" />
                    Plan Süresi: {weeks} hafta
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="12"
                    value={weeks}
                    onChange={(e) => setWeeks(parseInt(e.target.value))}
                    className="w-full h-2 bg-surface-200 rounded-lg appearance-none cursor-pointer accent-primary-500"
                  />
                </div>
              </div>
            </>
          )}

          <button
            onClick={handleGenerate}
            disabled={generating || !selectedStudent}
            className="btn btn-primary btn-lg w-full"
          >
            {generating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Plan Oluşturuluyor...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Çalışma Planı Oluştur
              </>
            )}
          </button>
        </div>

        {/* Generated Plan */}
        {plan && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card"
          >
            <div className="p-4 border-b border-surface-100 flex items-center justify-between">
              <h2 className="font-semibold text-surface-900 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-primary-500" />
                Oluşturulan Plan
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
              </div>
            </div>
            <div className="p-6 prose prose-sm max-w-none">
              <ReactMarkdown>{plan}</ReactMarkdown>
            </div>
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  )
}

