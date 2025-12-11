'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { useProfile, useTeacherProfile } from '@/hooks/useProfile'
import { createClient } from '@/lib/supabase/client'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { 
  Archive,
  Search,
  Filter,
  Star,
  Trash2,
  Eye,
  BookOpen,
  FileText,
  BarChart3,
  Calendar,
  Loader2,
  HelpCircle,
  Edit3,
  Globe,
  Lock
} from 'lucide-react'

const toolTypes = [
  { value: 'all', label: 'Tümü', icon: Archive },
  { value: 'question_generator', label: 'Sorular', icon: HelpCircle },
  { value: 'study_plan', label: 'Çalışma Planları', icon: Calendar },
  { value: 'report', label: 'Raporlar', icon: FileText },
]

interface SavedQuestion {
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
  created_at: string
}

interface SavedContent {
  id: string
  tool_type: string
  title: string
  content: any
  metadata: any
  is_favorite: boolean
  created_at: string
}

export default function ArchivePage() {
  const { profile } = useProfile()
  const { teacherProfile } = useTeacherProfile(profile?.id || '')
  const [activeTab, setActiveTab] = useState<'questions' | 'content'>('questions')
  const [questions, setQuestions] = useState<SavedQuestion[]>([])
  const [contents, setContents] = useState<SavedContent[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedType, setSelectedType] = useState('all')
  const supabase = createClient()

  useEffect(() => {
    if (teacherProfile?.id) {
      if (activeTab === 'questions') {
        loadQuestions()
      } else {
        loadContents()
      }
    }
  }, [teacherProfile?.id, activeTab, selectedType])

  async function loadQuestions() {
    if (!teacherProfile?.id) return
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('ai_questions')
        .select('*')
        .eq('coach_id', teacherProfile.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setQuestions(data || [])
    } catch (error) {
      console.error('Error loading questions:', error)
    } finally {
      setLoading(false)
    }
  }

  async function loadContents() {
    if (!teacherProfile?.id) return
    setLoading(true)
    try {
      let query = supabase
        .from('ai_generated_content')
        .select('*')
        .eq('coach_id', teacherProfile.id)
        .order('created_at', { ascending: false })

      if (selectedType !== 'all') {
        query = query.eq('tool_type', selectedType)
      }

      const { data, error } = await query

      if (error) throw error
      setContents(data || [])
    } catch (error) {
      console.error('Error loading contents:', error)
    } finally {
      setLoading(false)
    }
  }

  async function toggleQuestionVisibility(questionId: string, currentState: boolean) {
    try {
      await supabase
        .from('ai_questions')
        .update({ is_public: !currentState })
        .eq('id', questionId)

      setQuestions(questions.map(q =>
        q.id === questionId ? { ...q, is_public: !currentState } : q
      ))
    } catch (error) {
      console.error('Error toggling visibility:', error)
    }
  }

  async function deleteQuestion(questionId: string) {
    if (!confirm('Bu soruyu silmek istediğinize emin misiniz?')) return

    try {
      await supabase
        .from('ai_questions')
        .delete()
        .eq('id', questionId)

      setQuestions(questions.filter(q => q.id !== questionId))
    } catch (error) {
      console.error('Error deleting question:', error)
    }
  }

  async function toggleFavorite(contentId: string, currentState: boolean) {
    try {
      await supabase
        .from('ai_generated_content')
        .update({ is_favorite: !currentState })
        .eq('id', contentId)

      setContents(contents.map(c =>
        c.id === contentId ? { ...c, is_favorite: !currentState } : c
      ))
    } catch (error) {
      console.error('Error toggling favorite:', error)
    }
  }

  const filteredQuestions = questions.filter(q =>
    q.question_text.toLowerCase().includes(searchTerm.toLowerCase()) ||
    q.topic.toLowerCase().includes(searchTerm.toLowerCase()) ||
    q.subject.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const filteredContents = contents.filter(c =>
    c.title?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const difficultyColors: Record<string, string> = {
    easy: 'bg-green-100 text-green-700',
    medium: 'bg-yellow-100 text-yellow-700',
    hard: 'bg-red-100 text-red-700',
  }

  return (
    <DashboardLayout role="koc">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-surface-900 flex items-center gap-2">
            <Archive className="w-7 h-7 text-primary-500" />
            AI İçerik Arşivi
          </h1>
          <p className="text-surface-500">Ürettiğiniz tüm içerikleri görüntüleyin ve yönetin</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-surface-200">
          <button
            onClick={() => setActiveTab('questions')}
            className={`px-4 py-3 font-medium transition-colors border-b-2 -mb-px ${
              activeTab === 'questions'
                ? 'text-primary-600 border-primary-500'
                : 'text-surface-500 border-transparent hover:text-surface-700'
            }`}
          >
            <HelpCircle className="w-4 h-4 inline mr-2" />
            Sorularım ({questions.length})
          </button>
          <button
            onClick={() => setActiveTab('content')}
            className={`px-4 py-3 font-medium transition-colors border-b-2 -mb-px ${
              activeTab === 'content'
                ? 'text-primary-600 border-primary-500'
                : 'text-surface-500 border-transparent hover:text-surface-700'
            }`}
          >
            <FileText className="w-4 h-4 inline mr-2" />
            Diğer İçerikler ({contents.length})
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="İçerik ara..."
            className="input pl-10"
          />
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
          </div>
        ) : activeTab === 'questions' ? (
          filteredQuestions.length === 0 ? (
            <div className="text-center py-12 card">
              <HelpCircle className="w-12 h-12 mx-auto text-surface-300 mb-4" />
              <p className="text-surface-500 mb-4">Henüz soru üretmediniz</p>
              <Link href="/koc/ai-araclar/soru-uretici" className="btn btn-primary">
                Soru Üret
              </Link>
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
                      {question.is_public ? (
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full flex items-center gap-1">
                          <Globe className="w-3 h-3" /> Havuzda
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-surface-100 text-surface-600 text-xs rounded-full flex items-center gap-1">
                          <Lock className="w-3 h-3" /> Özel
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => toggleQuestionVisibility(question.id, question.is_public)}
                        className="p-2 text-surface-400 hover:text-primary-500 hover:bg-primary-50 rounded-lg transition-colors"
                        title={question.is_public ? 'Havuzdan Kaldır' : 'Havuza Ekle'}
                      >
                        {question.is_public ? <Lock className="w-4 h-4" /> : <Globe className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => deleteQuestion(question.id)}
                        className="p-2 text-surface-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <p className="text-surface-900 font-medium mb-3">{question.question_text}</p>

                  {question.options && (
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      {question.options.map((opt, i) => (
                        <div
                          key={i}
                          className={`p-2 rounded-lg text-sm ${
                            opt.startsWith(question.correct_answer.charAt(0))
                              ? 'bg-green-50 text-green-700 border border-green-200'
                              : 'bg-surface-50 text-surface-700'
                          }`}
                        >
                          {opt}
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="text-xs text-surface-400">
                    {new Date(question.created_at).toLocaleDateString('tr-TR')} • 
                    {question.usage_count} kullanım • {question.likes} beğeni
                  </div>
                </motion.div>
              ))}
            </div>
          )
        ) : (
          filteredContents.length === 0 ? (
            <div className="text-center py-12 card">
              <FileText className="w-12 h-12 mx-auto text-surface-300 mb-4" />
              <p className="text-surface-500">Henüz içerik üretmediniz</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredContents.map((content, index) => (
                <motion.div
                  key={content.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className="card p-5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="px-2 py-1 bg-primary-100 text-primary-700 text-xs rounded-full">
                          {toolTypes.find(t => t.value === content.tool_type)?.label || content.tool_type}
                        </span>
                        {content.is_favorite && (
                          <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                        )}
                      </div>
                      <h3 className="font-medium text-surface-900">{content.title || 'İsimsiz İçerik'}</h3>
                      <p className="text-sm text-surface-500 mt-1">
                        {new Date(content.created_at).toLocaleDateString('tr-TR')}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => toggleFavorite(content.id, content.is_favorite)}
                        className={`p-2 rounded-lg transition-colors ${
                          content.is_favorite
                            ? 'text-yellow-500 bg-yellow-50'
                            : 'text-surface-400 hover:text-yellow-500 hover:bg-yellow-50'
                        }`}
                      >
                        <Star className={`w-4 h-4 ${content.is_favorite ? 'fill-yellow-500' : ''}`} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )
        )}
      </div>
    </DashboardLayout>
  )
}



