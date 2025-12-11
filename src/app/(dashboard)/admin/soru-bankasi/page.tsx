'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { 
  BookOpen, Plus, Search, Filter, Edit2, Trash2, 
  CheckCircle, XCircle, Image as ImageIcon, Save,
  ChevronDown, Star, Zap, Crown, Sparkles
} from 'lucide-react'

interface Topic {
  id: string
  subject: string
  main_topic: string
  sub_topic: string
  avg_question_count: number
}

interface Question {
  id: string
  topic_id: string
  difficulty: 'easy' | 'medium' | 'hard' | 'legendary'
  question_text: string
  question_image_url: string | null
  options: { A: string; B: string; C: string; D: string }
  correct_answer: 'A' | 'B' | 'C' | 'D'
  explanation: string | null
  source: string | null
  year: number | null
  times_answered: number
  times_correct: number
  topic?: Topic
}

const subjects = ['Türkçe', 'Matematik', 'Fen Bilimleri', 'İnkılap Tarihi', 'Din Kültürü', 'İngilizce']

const difficultyConfig = {
  easy: { label: 'Kolay', color: 'bg-green-500', icon: CheckCircle },
  medium: { label: 'Orta', color: 'bg-yellow-500', icon: Star },
  hard: { label: 'Zor', color: 'bg-orange-500', icon: Zap },
  legendary: { label: 'Efsane', color: 'bg-purple-500', icon: Crown }
}

export default function AdminSoruBankasiPage() {
  const [topics, setTopics] = useState<Topic[]>([])
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<'list' | 'add'>('list')
  
  // Filtreler
  const [filterSubject, setFilterSubject] = useState<string>('')
  const [filterDifficulty, setFilterDifficulty] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState('')
  
  // Yeni soru formu
  const [formData, setFormData] = useState({
    subject: '',
    topic_id: '',
    difficulty: 'medium' as 'easy' | 'medium' | 'hard' | 'legendary',
    question_text: '',
    question_image_url: '',
    optionA: '',
    optionB: '',
    optionC: '',
    optionD: '',
    correct_answer: 'A' as 'A' | 'B' | 'C' | 'D',
    explanation: '',
    source: '',
    year: new Date().getFullYear()
  })

  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const supabase = createClient()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    
    // Konuları yükle
    const { data: topicsData } = await supabase
      .from('lgs_topics')
      .select('*')
      .order('subject')
      .order('main_topic')
    
    if (topicsData) setTopics(topicsData)
    
    // Soruları yükle
    const { data: questionsData } = await supabase
      .from('lgs_questions')
      .select('*, topic:lgs_topics(*)')
      .order('created_at', { ascending: false })
      .limit(100)
    
    if (questionsData) setQuestions(questionsData)
    
    setLoading(false)
  }

  const filteredTopics = topics.filter(t => 
    !formData.subject || t.subject === formData.subject
  )

  const filteredQuestions = questions.filter(q => {
    if (filterSubject && q.topic?.subject !== filterSubject) return false
    if (filterDifficulty && q.difficulty !== filterDifficulty) return false
    if (searchQuery && !q.question_text.toLowerCase().includes(searchQuery.toLowerCase())) return false
    return true
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.topic_id || !formData.question_text || !formData.optionA || !formData.optionB || !formData.optionC || !formData.optionD) {
      setMessage({ type: 'error', text: 'Lütfen tüm zorunlu alanları doldurun!' })
      return
    }

    setSaving(true)
    
    const questionData = {
      topic_id: formData.topic_id,
      difficulty: formData.difficulty,
      question_text: formData.question_text,
      question_image_url: formData.question_image_url || null,
      options: {
        A: formData.optionA,
        B: formData.optionB,
        C: formData.optionC,
        D: formData.optionD
      },
      correct_answer: formData.correct_answer,
      explanation: formData.explanation || null,
      source: formData.source || null,
      year: formData.year || null
    }

    if (editingQuestion) {
      // Güncelle
      const { error } = await supabase
        .from('lgs_questions')
        .update(questionData)
        .eq('id', editingQuestion.id)
      
      if (error) {
        setMessage({ type: 'error', text: 'Soru güncellenirken hata oluştu!' })
      } else {
        setMessage({ type: 'success', text: 'Soru başarıyla güncellendi!' })
        setEditingQuestion(null)
        resetForm()
        loadData()
      }
    } else {
      // Yeni ekle
      const { error } = await supabase
        .from('lgs_questions')
        .insert(questionData)
      
      if (error) {
        setMessage({ type: 'error', text: 'Soru eklenirken hata oluştu!' })
        console.error(error)
      } else {
        setMessage({ type: 'success', text: 'Soru başarıyla eklendi!' })
        resetForm()
        loadData()
      }
    }
    
    setSaving(false)
    setTimeout(() => setMessage(null), 3000)
  }

  const resetForm = () => {
    setFormData({
      subject: '',
      topic_id: '',
      difficulty: 'medium',
      question_text: '',
      question_image_url: '',
      optionA: '',
      optionB: '',
      optionC: '',
      optionD: '',
      correct_answer: 'A',
      explanation: '',
      source: '',
      year: new Date().getFullYear()
    })
  }

  const handleEdit = (question: Question) => {
    setEditingQuestion(question)
    setFormData({
      subject: question.topic?.subject || '',
      topic_id: question.topic_id,
      difficulty: question.difficulty,
      question_text: question.question_text,
      question_image_url: question.question_image_url || '',
      optionA: question.options.A,
      optionB: question.options.B,
      optionC: question.options.C,
      optionD: question.options.D,
      correct_answer: question.correct_answer,
      explanation: question.explanation || '',
      source: question.source || '',
      year: question.year || new Date().getFullYear()
    })
    setActiveTab('add')
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Bu soruyu silmek istediğinize emin misiniz?')) return
    
    const { error } = await supabase
      .from('lgs_questions')
      .delete()
      .eq('id', id)
    
    if (error) {
      setMessage({ type: 'error', text: 'Soru silinirken hata oluştu!' })
    } else {
      setMessage({ type: 'success', text: 'Soru silindi!' })
      loadData()
    }
    
    setTimeout(() => setMessage(null), 3000)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <BookOpen className="h-8 w-8 text-indigo-500" />
            LGS Soru Bankası Yönetimi
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Toplam {questions.length} soru • {topics.length} konu
          </p>
        </div>

        {/* Mesaj */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg flex items-center gap-2 ${
            message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {message.type === 'success' ? <CheckCircle className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
            {message.text}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => { setActiveTab('list'); setEditingQuestion(null); resetForm() }}
            className={`px-6 py-3 rounded-lg font-medium transition-all ${
              activeTab === 'list'
                ? 'bg-indigo-500 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <Search className="h-5 w-5 inline mr-2" />
            Soru Listesi
          </button>
          <button
            onClick={() => setActiveTab('add')}
            className={`px-6 py-3 rounded-lg font-medium transition-all ${
              activeTab === 'add'
                ? 'bg-indigo-500 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <Plus className="h-5 w-5 inline mr-2" />
            {editingQuestion ? 'Soru Düzenle' : 'Yeni Soru Ekle'}
          </button>
        </div>

        {/* Liste Görünümü */}
        {activeTab === 'list' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm">
            {/* Filtreler */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex flex-wrap gap-4">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Soru ara..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              
              <select
                value={filterSubject}
                onChange={(e) => setFilterSubject(e.target.value)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">Tüm Dersler</option>
                {subjects.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              
              <select
                value={filterDifficulty}
                onChange={(e) => setFilterDifficulty(e.target.value)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">Tüm Zorluklar</option>
                {Object.entries(difficultyConfig).map(([key, { label }]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>

            {/* Soru Listesi */}
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredQuestions.length === 0 ? (
                <div className="p-12 text-center text-gray-500">
                  <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Henüz soru eklenmemiş veya filtreye uygun soru bulunamadı.</p>
                </div>
              ) : (
                filteredQuestions.map((question) => {
                  const DiffIcon = difficultyConfig[question.difficulty].icon
                  const successRate = question.times_answered > 0 
                    ? Math.round((question.times_correct / question.times_answered) * 100) 
                    : 0
                  
                  return (
                    <div key={question.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <div className="flex items-start gap-4">
                        {/* Zorluk Badge */}
                        <div className={`${difficultyConfig[question.difficulty].color} p-2 rounded-lg`}>
                          <DiffIcon className="h-5 w-5 text-white" />
                        </div>
                        
                        {/* Soru İçeriği */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-medium px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300">
                              {question.topic?.subject}
                            </span>
                            <span className="text-xs text-gray-500">
                              {question.topic?.main_topic}
                            </span>
                            {question.source && (
                              <span className="text-xs text-gray-400">• {question.source}</span>
                            )}
                          </div>
                          
                          <p className="text-gray-900 dark:text-white line-clamp-2 mb-2">
                            {question.question_text}
                          </p>
                          
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span>Doğru: {question.correct_answer}</span>
                            {question.times_answered > 0 && (
                              <span className={successRate >= 50 ? 'text-green-500' : 'text-red-500'}>
                                Başarı: %{successRate} ({question.times_answered} çözüm)
                              </span>
                            )}
                          </div>
                        </div>
                        
                        {/* Aksiyonlar */}
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(question)}
                            className="p-2 text-gray-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
                          >
                            <Edit2 className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleDelete(question.id)}
                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        )}

        {/* Soru Ekleme/Düzenleme Formu */}
        {activeTab === 'add' && (
          <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Sol Kolon */}
              <div className="space-y-6">
                {/* Ders Seçimi */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Ders *
                  </label>
                  <select
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value, topic_id: '' })}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    required
                  >
                    <option value="">Ders Seçin</option>
                    {subjects.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                {/* Konu Seçimi */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Konu *
                  </label>
                  <select
                    value={formData.topic_id}
                    onChange={(e) => setFormData({ ...formData, topic_id: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    required
                    disabled={!formData.subject}
                  >
                    <option value="">Konu Seçin</option>
                    {filteredTopics.map(t => (
                      <option key={t.id} value={t.id}>
                        {t.main_topic} {t.sub_topic ? `- ${t.sub_topic}` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Zorluk */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Zorluk Seviyesi *
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {Object.entries(difficultyConfig).map(([key, { label, color, icon: Icon }]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setFormData({ ...formData, difficulty: key as any })}
                        className={`flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-all ${
                          formData.difficulty === key
                            ? `border-indigo-500 ${color} text-white`
                            : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-gray-300'
                        }`}
                      >
                        <Icon className="h-5 w-5" />
                        <span className="text-xs font-medium">{label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Soru Metni */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Soru Metni *
                  </label>
                  <textarea
                    value={formData.question_text}
                    onChange={(e) => setFormData({ ...formData, question_text: e.target.value })}
                    rows={5}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                    placeholder="Soru metnini buraya yazın..."
                    required
                  />
                </div>

                {/* Görsel URL */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Görsel URL (Opsiyonel)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={formData.question_image_url}
                      onChange={(e) => setFormData({ ...formData, question_image_url: e.target.value })}
                      className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="https://..."
                    />
                    {formData.question_image_url && (
                      <a
                        href={formData.question_image_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        <ImageIcon className="h-5 w-5" />
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {/* Sağ Kolon */}
              <div className="space-y-6">
                {/* Şıklar */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Şıklar *
                  </label>
                  <div className="space-y-3">
                    {['A', 'B', 'C', 'D'].map((option) => (
                      <div key={option} className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, correct_answer: option as any })}
                          className={`w-10 h-10 rounded-lg font-bold transition-all ${
                            formData.correct_answer === option
                              ? 'bg-green-500 text-white'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                          }`}
                        >
                          {option}
                        </button>
                        <input
                          type="text"
                          value={formData[`option${option}` as keyof typeof formData] as string}
                          onChange={(e) => setFormData({ ...formData, [`option${option}`]: e.target.value })}
                          className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          placeholder={`${option} şıkkı`}
                          required
                        />
                      </div>
                    ))}
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    Yeşil olan şık doğru cevaptır. Değiştirmek için şık harfine tıklayın.
                  </p>
                </div>

                {/* Açıklama */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Çözüm Açıklaması (Opsiyonel)
                  </label>
                  <textarea
                    value={formData.explanation}
                    onChange={(e) => setFormData({ ...formData, explanation: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                    placeholder="Sorunun çözümünü buraya yazın..."
                  />
                </div>

                {/* Kaynak ve Yıl */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Kaynak
                    </label>
                    <input
                      type="text"
                      value={formData.source}
                      onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="Örn: 2024 LGS"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Yıl
                    </label>
                    <input
                      type="number"
                      value={formData.year}
                      onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      min={2018}
                      max={2030}
                    />
                  </div>
                </div>

                {/* Kaydet Butonu */}
                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={saving}
                    className="w-full py-4 bg-indigo-500 hover:bg-indigo-600 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {saving ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                        Kaydediliyor...
                      </>
                    ) : (
                      <>
                        <Save className="h-5 w-5" />
                        {editingQuestion ? 'Güncelle' : 'Soru Ekle'}
                      </>
                    )}
                  </button>
                  
                  {editingQuestion && (
                    <button
                      type="button"
                      onClick={() => { setEditingQuestion(null); resetForm() }}
                      className="w-full mt-2 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                    >
                      İptal
                    </button>
                  )}
                </div>
              </div>
            </div>
          </form>
        )}

        {/* Konu İstatistikleri */}
        <div className="mt-8 bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-yellow-500" />
            Ders Bazlı Soru Sayıları
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {subjects.map(subject => {
              const count = questions.filter(q => q.topic?.subject === subject).length
              const topicCount = topics.filter(t => t.subject === subject).length
              
              return (
                <div key={subject} className="p-4 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                  <div className="text-2xl font-bold text-indigo-500">{count}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">{subject}</div>
                  <div className="text-xs text-gray-500">{topicCount} konu</div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

