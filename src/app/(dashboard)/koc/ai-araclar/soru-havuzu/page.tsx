'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { useProfile, useTeacherProfile } from '@/hooks/useProfile'
import { createClient } from '@/lib/supabase/client'
import { motion } from 'framer-motion'
import { 
  Database,
  Search,
  Filter,
  Heart,
  Copy,
  Plus,
  ChevronDown,
  BookOpen,
  Check,
  Loader2
} from 'lucide-react'

const subjects = [
  'Tümü', 'Matematik', 'Fizik', 'Kimya', 'Biyoloji', 'Türkçe', 'Edebiyat',
  'Tarih', 'Coğrafya', 'İngilizce', 'Felsefe', 'Din Kültürü'
]

const difficulties = [
  { value: 'all', label: 'Tüm Zorluklar' },
  { value: 'easy', label: 'Kolay' },
  { value: 'medium', label: 'Orta' },
  { value: 'hard', label: 'Zor' },
]

const questionTypes = [
  { value: 'all', label: 'Tüm Tipler' },
  { value: 'multiple_choice', label: 'Çoktan Seçmeli' },
  { value: 'true_false', label: 'Doğru/Yanlış' },
  { value: 'open_ended', label: 'Açık Uçlu' },
  { value: 'fill_blank', label: 'Boşluk Doldurma' },
]

const difficultyColors: Record<string, string> = {
  easy: 'bg-green-100 text-green-700',
  medium: 'bg-yellow-100 text-yellow-700',
  hard: 'bg-red-100 text-red-700',
}

const typeLabels: Record<string, string> = {
  multiple_choice: 'Çoktan Seçmeli',
  true_false: 'Doğru/Yanlış',
  open_ended: 'Açık Uçlu',
  fill_blank: 'Boşluk Doldurma',
}

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
  is_public: boolean
  usage_count: number
  likes: number
  coach_id: string
  created_at: string
}

export default function QuestionPoolPage() {
  const { profile } = useProfile()
  const { teacherProfile } = useTeacherProfile(profile?.id || '')
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSubject, setSelectedSubject] = useState('Tümü')
  const [selectedDifficulty, setSelectedDifficulty] = useState('all')
  const [selectedType, setSelectedType] = useState('all')
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    loadQuestions()
  }, [selectedSubject, selectedDifficulty, selectedType])

  async function loadQuestions() {
    setLoading(true)
    try {
      let query = supabase
        .from('ai_questions')
        .select('*')
        .eq('is_public', true)
        .order('likes', { ascending: false })

      if (selectedSubject !== 'Tümü') {
        query = query.eq('subject', selectedSubject)
      }

      if (selectedDifficulty !== 'all') {
        query = query.eq('difficulty', selectedDifficulty)
      }

      if (selectedType !== 'all') {
        query = query.eq('question_type', selectedType)
      }

      const { data, error } = await query.limit(50)

      if (error) throw error
      setQuestions(data || [])
    } catch (error) {
      console.error('Error loading questions:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleLike(questionId: string) {
    try {
      const question = questions.find(q => q.id === questionId)
      if (!question) return

      await supabase
        .from('ai_questions')
        .update({ likes: question.likes + 1 })
        .eq('id', questionId)

      setQuestions(questions.map(q => 
        q.id === questionId ? { ...q, likes: q.likes + 1 } : q
      ))
    } catch (error) {
      console.error('Error liking question:', error)
    }
  }

  async function handleCopyToMyPool(question: Question) {
    if (!teacherProfile?.id) return

    try {
      const { error } = await supabase
        .from('ai_questions')
        .insert({
          coach_id: teacherProfile.id,
          subject: question.subject,
          topic: question.topic,
          difficulty: question.difficulty,
          question_type: question.question_type,
          question_text: question.question_text,
          options: question.options,
          correct_answer: question.correct_answer,
          explanation: question.explanation,
          is_public: false,
        })

      if (error) throw error

      // Update usage count
      await supabase
        .from('ai_questions')
        .update({ usage_count: question.usage_count + 1 })
        .eq('id', question.id)

      setCopiedId(question.id)
      setTimeout(() => setCopiedId(null), 2000)
    } catch (error) {
      console.error('Error copying question:', error)
    }
  }

  const filteredQuestions = questions.filter(q =>
    q.question_text.toLowerCase().includes(searchTerm.toLowerCase()) ||
    q.topic.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <DashboardLayout role="koc">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-surface-900 flex items-center gap-2">
            <Database className="w-7 h-7 text-primary-500" />
            Soru Havuzu
          </h1>
          <p className="text-surface-500">Diğer koçların paylaştığı soruları keşfedin</p>
        </div>

        {/* Filters */}
        <div className="card p-4">
          <div className="grid md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Soru veya konu ara..."
                className="input pl-10"
              />
            </div>

            {/* Subject Filter */}
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="input"
            >
              {subjects.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>

            {/* Difficulty Filter */}
            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
              className="input"
            >
              {difficulties.map(d => (
                <option key={d.value} value={d.value}>{d.label}</option>
              ))}
            </select>

            {/* Type Filter */}
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="input"
            >
              {questionTypes.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Questions List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
          </div>
        ) : filteredQuestions.length === 0 ? (
          <div className="text-center py-12 card">
            <Database className="w-12 h-12 mx-auto text-surface-300 mb-4" />
            <p className="text-surface-500">Bu kriterlere uygun soru bulunamadı</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredQuestions.map((question, index) => (
              <motion.div
                key={question.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                className="card p-5"
              >
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2 py-1 bg-primary-100 text-primary-700 text-xs rounded-full font-medium">
                      {question.subject}
                    </span>
                    <span className="px-2 py-1 bg-surface-100 text-surface-600 text-xs rounded-full">
                      {question.topic}
                    </span>
                    <span className={`px-2 py-1 text-xs rounded-full ${difficultyColors[question.difficulty]}`}>
                      {question.difficulty === 'easy' ? 'Kolay' : question.difficulty === 'medium' ? 'Orta' : 'Zor'}
                    </span>
                    <span className="px-2 py-1 bg-surface-100 text-surface-600 text-xs rounded-full">
                      {typeLabels[question.question_type]}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleLike(question.id)}
                      className="p-2 text-surface-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Heart className={`w-5 h-5 ${question.likes > 0 ? 'fill-red-500 text-red-500' : ''}`} />
                    </button>
                    <button
                      onClick={() => handleCopyToMyPool(question)}
                      className={`p-2 rounded-lg transition-colors ${
                        copiedId === question.id 
                          ? 'bg-green-100 text-green-600' 
                          : 'text-surface-400 hover:text-primary-500 hover:bg-primary-50'
                      }`}
                    >
                      {copiedId === question.id ? (
                        <Check className="w-5 h-5" />
                      ) : (
                        <Copy className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>

                <p className="text-surface-900 font-medium mb-4">{question.question_text}</p>

                {/* Options for multiple choice */}
                {question.options && (
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    {question.options.map((opt, i) => (
                      <div
                        key={i}
                        className="p-2 bg-surface-50 rounded-lg text-sm text-surface-700"
                      >
                        {opt}
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between text-sm text-surface-500">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1">
                      <Heart className="w-4 h-4" />
                      {question.likes}
                    </span>
                    <span className="flex items-center gap-1">
                      <Copy className="w-4 h-4" />
                      {question.usage_count} kullanım
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}





