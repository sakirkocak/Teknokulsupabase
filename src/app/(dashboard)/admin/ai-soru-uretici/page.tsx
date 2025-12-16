'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { useProfile } from '@/hooks/useProfile'
import { createClient } from '@/lib/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Wand2, 
  Sparkles, 
  BookOpen, 
  GraduationCap,
  Target,
  Save,
  Loader2,
  CheckCircle,
  XCircle,
  Edit3,
  Trash2,
  RefreshCw,
  AlertTriangle,
  ChevronDown,
  ChevronUp
} from 'lucide-react'

interface Topic {
  id: string
  subject_id: string
  grade: number
  main_topic: string
  sub_topic: string | null
  learning_outcome: string | null
}

interface Subject {
  id: string
  name: string
  code: string
  icon: string
  color: string
}

interface GeneratedQuestion {
  question_text: string
  options: {
    A: string
    B: string
    C: string
    D: string
    E?: string
  }
  correct_answer: string
  explanation: string
  difficulty: string
  bloom_level: string
}

const difficultyLabels: Record<string, { label: string; color: string; bg: string }> = {
  easy: { label: 'Kolay', color: 'text-green-600', bg: 'bg-green-100' },
  medium: { label: 'Orta', color: 'text-yellow-600', bg: 'bg-yellow-100' },
  hard: { label: 'Zor', color: 'text-orange-600', bg: 'bg-orange-100' },
  legendary: { label: 'Efsane', color: 'text-red-600', bg: 'bg-red-100' }
}

const bloomLabels: Record<string, string> = {
  bilgi: '📚 Bilgi',
  kavrama: '💡 Kavrama',
  uygulama: '🔧 Uygulama',
  analiz: '🔍 Analiz',
  sentez: '🧩 Sentez',
  değerlendirme: '⚖️ Değerlendirme'
}

export default function AIQuestionGeneratorPage() {
  const { profile, loading: profileLoading } = useProfile()
  const supabase = createClient()
  
  // Form state
  const [selectedGrade, setSelectedGrade] = useState<number>(8)
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [selectedSubject, setSelectedSubject] = useState<string>('')
  const [topics, setTopics] = useState<Topic[]>([])
  const [selectedTopic, setSelectedTopic] = useState<string>('')
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('medium')
  const [questionCount, setQuestionCount] = useState<number>(5)
  
  // Generated questions state
  const [generatedQuestions, setGeneratedQuestions] = useState<GeneratedQuestion[]>([])
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null)
  
  // Loading states
  const [loadingSubjects, setLoadingSubjects] = useState(false)
  const [loadingTopics, setLoadingTopics] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<{ success: number; failed: number } | null>(null)

  // Load subjects when grade changes
  useEffect(() => {
    loadSubjects()
  }, [selectedGrade])

  // Load topics when subject changes
  useEffect(() => {
    if (selectedSubject) {
      loadTopics()
    } else {
      setTopics([])
      setSelectedTopic('')
    }
  }, [selectedSubject, selectedGrade])

  async function loadSubjects() {
    setLoadingSubjects(true)
    try {
      // Get subjects for this grade from grade_subjects table
      const { data, error } = await supabase
        .from('grade_subjects')
        .select(`
          subject_id,
          subjects (
            id,
            name,
            slug,
            icon,
            color
          )
        `)
        .eq('grade_id', selectedGrade)

      if (error) throw error

      const subjectList = data
        ?.map((gs: any) => ({
          id: gs.subjects?.id,
          name: gs.subjects?.name,
          code: gs.subjects?.slug,
          icon: gs.subjects?.icon || '📖',
          color: gs.subjects?.color || 'blue'
        }))
        .filter((s: any) => s.id) || []

      setSubjects(subjectList)
      setSelectedSubject('')
      setSelectedTopic('')
    } catch (error) {
      console.error('Dersler yüklenirken hata:', error)
    } finally {
      setLoadingSubjects(false)
    }
  }

  async function loadTopics() {
    setLoadingTopics(true)
    try {
      const { data, error } = await supabase
        .from('topics')
        .select('*')
        .eq('subject_id', selectedSubject)
        .eq('grade', selectedGrade)
        .eq('is_active', true)
        .order('unit_number', { ascending: true })
        .order('main_topic', { ascending: true })

      if (error) throw error
      setTopics(data || [])
      setSelectedTopic('')
    } catch (error) {
      console.error('Konular yüklenirken hata:', error)
    } finally {
      setLoadingTopics(false)
    }
  }

  async function handleGenerate() {
    if (!selectedSubject || !selectedTopic) {
      alert('Lütfen ders ve konu seçin')
      return
    }

    const topic = topics.find(t => t.id === selectedTopic)
    const subject = subjects.find(s => s.id === selectedSubject)
    
    if (!topic || !subject) return

    setGenerating(true)
    setGeneratedQuestions([])
    setSaveStatus(null)

    try {
      const response = await fetch('/api/ai/generate-curriculum-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grade: selectedGrade,
          subject: subject.name,
          topic: topic.main_topic + (topic.sub_topic ? ` - ${topic.sub_topic}` : ''),
          learningOutcome: topic.learning_outcome || topic.main_topic,
          difficulty: selectedDifficulty,
          count: questionCount
        })
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Soru üretme hatası')
      }

      setGeneratedQuestions(data.questions || [])
    } catch (error: any) {
      console.error('Soru üretme hatası:', error)
      alert(`Hata: ${error.message}`)
    } finally {
      setGenerating(false)
    }
  }

  async function handleSaveAll() {
    if (generatedQuestions.length === 0) return

    const topic = topics.find(t => t.id === selectedTopic)
    if (!topic) return

    setSaving(true)
    let successCount = 0
    let failedCount = 0

    try {
      for (const question of generatedQuestions) {
        const { error } = await supabase
          .from('questions')
          .insert({
            topic_id: selectedTopic,
            difficulty: question.difficulty,
            question_text: question.question_text,
            options: question.options,
            correct_answer: question.correct_answer,
            explanation: question.explanation,
            source: 'AI Generated',
            is_active: true,
            created_by: profile?.id
          })

        if (error) {
          console.error('Soru kaydetme hatası:', error)
          failedCount++
        } else {
          successCount++
        }
      }

      setSaveStatus({ success: successCount, failed: failedCount })
      
      if (successCount > 0) {
        // Clear saved questions
        setGeneratedQuestions([])
      }
    } catch (error) {
      console.error('Kaydetme hatası:', error)
    } finally {
      setSaving(false)
    }
  }

  function handleEditQuestion(index: number, field: string, value: any) {
    const updated = [...generatedQuestions]
    if (field.startsWith('options.')) {
      const optionKey = field.split('.')[1]
      updated[index] = {
        ...updated[index],
        options: {
          ...updated[index].options,
          [optionKey]: value
        }
      }
    } else {
      updated[index] = { ...updated[index], [field]: value }
    }
    setGeneratedQuestions(updated)
  }

  function handleDeleteQuestion(index: number) {
    setGeneratedQuestions(prev => prev.filter((_, i) => i !== index))
  }

  const selectedSubjectData = subjects.find(s => s.id === selectedSubject)
  const selectedTopicData = topics.find(t => t.id === selectedTopic)
  const isHighSchool = selectedGrade >= 9

  if (profileLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
      </DashboardLayout>
    )
  }

  if (profile?.role !== 'admin') {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <AlertTriangle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800">Erişim Engellendi</h2>
          <p className="text-gray-600 mt-2">Bu sayfaya erişim yetkiniz bulunmamaktadır.</p>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl shadow-lg">
              <Wand2 className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                AI Soru Üretici
              </h1>
              <p className="text-gray-600">
                Yapay zeka ile MEB müfredatına uygun sorular üretin
              </p>
            </div>
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Panel - Configuration */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-1"
          >
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 sticky top-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-6 flex items-center gap-2">
                <Target className="w-5 h-5 text-purple-600" />
                Soru Ayarları
              </h2>

              {/* Grade Selection */}
              <div className="mb-5">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <GraduationCap className="w-4 h-4 inline mr-1" />
                  Sınıf Seçin
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[1,2,3,4,5,6,7,8,9,10,11,12].map(grade => (
                    <button
                      key={grade}
                      onClick={() => setSelectedGrade(grade)}
                      className={`py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                        selectedGrade === grade
                          ? 'bg-purple-600 text-white shadow-md'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {grade}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {selectedGrade <= 4 ? '📚 İlkokul' : selectedGrade <= 8 ? '🏫 Ortaokul' : '🎓 Lise'}
                  {selectedGrade === 8 && ' (LGS)'}
                  {selectedGrade >= 11 && ' (TYT/AYT)'}
                  {' • '}{isHighSchool ? '5 şık' : '4 şık'}
                </p>
              </div>

              {/* Subject Selection */}
              <div className="mb-5">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <BookOpen className="w-4 h-4 inline mr-1" />
                  Ders Seçin
                </label>
                {loadingSubjects ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="w-5 h-5 animate-spin text-purple-600" />
                  </div>
                ) : (
                  <select
                    value={selectedSubject}
                    onChange={(e) => setSelectedSubject(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
                  >
                    <option value="">Ders seçin...</option>
                    {subjects.map(subject => (
                      <option key={subject.id} value={subject.id}>
                        {subject.icon} {subject.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Topic Selection */}
              <div className="mb-5">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Sparkles className="w-4 h-4 inline mr-1" />
                  Konu / Kazanım Seçin
                </label>
                {loadingTopics ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="w-5 h-5 animate-spin text-purple-600" />
                  </div>
                ) : topics.length === 0 ? (
                  <p className="text-sm text-gray-500 py-3 text-center bg-gray-50 rounded-lg">
                    {selectedSubject ? 'Bu ders için kazanım bulunamadı' : 'Önce ders seçin'}
                  </p>
                ) : (
                  <select
                    value={selectedTopic}
                    onChange={(e) => setSelectedTopic(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
                  >
                    <option value="">Konu seçin...</option>
                    {topics.map(topic => (
                      <option key={topic.id} value={topic.id}>
                        {topic.main_topic}{topic.sub_topic ? ` - ${topic.sub_topic}` : ''}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Difficulty Selection */}
              <div className="mb-5">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Zorluk Seviyesi
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(difficultyLabels).map(([key, { label, color, bg }]) => (
                    <button
                      key={key}
                      onClick={() => setSelectedDifficulty(key)}
                      className={`py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                        selectedDifficulty === key
                          ? `${bg} ${color} ring-2 ring-offset-1 ring-current`
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Question Count */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Soru Sayısı
                </label>
                <div className="flex gap-2">
                  {[5, 10, 15, 20].map(count => (
                    <button
                      key={count}
                      onClick={() => setQuestionCount(count)}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                        questionCount === count
                          ? 'bg-purple-600 text-white shadow-md'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {count}
                    </button>
                  ))}
                </div>
              </div>

              {/* Generate Button */}
              <button
                onClick={handleGenerate}
                disabled={generating || !selectedSubject || !selectedTopic}
                className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {generating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Üretiliyor...
                  </>
                ) : (
                  <>
                    <Wand2 className="w-5 h-5" />
                    Soru Üret
                  </>
                )}
              </button>

              {/* Selected Info */}
              {selectedTopicData && (
                <div className="mt-4 p-3 bg-purple-50 rounded-lg">
                  <p className="text-xs text-purple-600 font-medium">Seçilen Kazanım:</p>
                  <p className="text-sm text-purple-800 mt-1">
                    {selectedTopicData.learning_outcome || selectedTopicData.main_topic}
                  </p>
                </div>
              )}
            </div>
          </motion.div>

          {/* Right Panel - Generated Questions */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-2"
          >
            {/* Status Messages */}
            <AnimatePresence>
              {saveStatus && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className={`mb-4 p-4 rounded-xl flex items-center gap-3 ${
                    saveStatus.failed === 0 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                  }`}
                >
                  {saveStatus.failed === 0 ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    <AlertTriangle className="w-5 h-5" />
                  )}
                  <span>
                    {saveStatus.success} soru başarıyla kaydedildi
                    {saveStatus.failed > 0 && `, ${saveStatus.failed} soru kaydedilemedi`}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Questions Header */}
            {generatedQuestions.length > 0 && (
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-800">
                  Üretilen Sorular ({generatedQuestions.length})
                </h2>
                <div className="flex gap-2">
                  <button
                    onClick={handleGenerate}
                    disabled={generating}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all flex items-center gap-2 text-sm"
                  >
                    <RefreshCw className={`w-4 h-4 ${generating ? 'animate-spin' : ''}`} />
                    Yeniden Üret
                  </button>
                  <button
                    onClick={handleSaveAll}
                    disabled={saving}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all flex items-center gap-2 text-sm"
                  >
                    {saving ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    Tümünü Kaydet
                  </button>
                </div>
              </div>
            )}

            {/* Questions List */}
            {generatedQuestions.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-12 text-center">
                <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-10 h-10 text-purple-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">
                  Henüz soru üretilmedi
                </h3>
                <p className="text-gray-600 max-w-md mx-auto">
                  Sol panelden sınıf, ders ve konu seçtikten sonra "Soru Üret" butonuna tıklayarak yapay zeka ile sorular oluşturabilirsiniz.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {generatedQuestions.map((question, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden"
                  >
                    {/* Question Header */}
                    <div 
                      className="p-4 bg-gradient-to-r from-gray-50 to-white flex items-center justify-between cursor-pointer"
                      onClick={() => setExpandedIndex(expandedIndex === index ? null : index)}
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                          {index + 1}
                        </span>
                        <div>
                          <span className={`text-xs px-2 py-1 rounded-full ${difficultyLabels[question.difficulty]?.bg} ${difficultyLabels[question.difficulty]?.color}`}>
                            {difficultyLabels[question.difficulty]?.label}
                          </span>
                          <span className="text-xs text-gray-500 ml-2">
                            {bloomLabels[question.bloom_level] || question.bloom_level}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setEditingIndex(editingIndex === index ? null : index)
                          }}
                          className="p-2 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-all"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteQuestion(index)
                          }}
                          className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        {expandedIndex === index ? (
                          <ChevronUp className="w-5 h-5 text-gray-400" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-gray-400" />
                        )}
                      </div>
                    </div>

                    {/* Question Content */}
                    <AnimatePresence>
                      {(expandedIndex === index || editingIndex === index) && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="p-4 border-t border-gray-100">
                            {/* Question Text */}
                            <div className="mb-4">
                              <label className="text-xs text-gray-500 uppercase tracking-wide">Soru</label>
                              {editingIndex === index ? (
                                <textarea
                                  value={question.question_text}
                                  onChange={(e) => handleEditQuestion(index, 'question_text', e.target.value)}
                                  className="w-full mt-1 p-3 border border-gray-200 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                                  rows={3}
                                />
                              ) : (
                                <p className="mt-1 text-gray-800 font-medium">{question.question_text}</p>
                              )}
                            </div>

                            {/* Options */}
                            <div className="mb-4">
                              <label className="text-xs text-gray-500 uppercase tracking-wide">Şıklar</label>
                              <div className="mt-2 space-y-2">
                                {Object.entries(question.options).map(([key, value]) => (
                                  <div 
                                    key={key}
                                    className={`p-3 rounded-lg flex items-start gap-3 ${
                                      question.correct_answer === key 
                                        ? 'bg-green-50 border-2 border-green-300' 
                                        : 'bg-gray-50 border border-gray-200'
                                    }`}
                                  >
                                    <span className={`font-bold ${question.correct_answer === key ? 'text-green-600' : 'text-gray-600'}`}>
                                      {key})
                                    </span>
                                    {editingIndex === index ? (
                                      <input
                                        type="text"
                                        value={value}
                                        onChange={(e) => handleEditQuestion(index, `options.${key}`, e.target.value)}
                                        className="flex-1 bg-transparent border-none focus:outline-none"
                                      />
                                    ) : (
                                      <span className={question.correct_answer === key ? 'text-green-800' : 'text-gray-700'}>
                                        {value}
                                      </span>
                                    )}
                                    {question.correct_answer === key && (
                                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Correct Answer Selector (Edit Mode) */}
                            {editingIndex === index && (
                              <div className="mb-4">
                                <label className="text-xs text-gray-500 uppercase tracking-wide">Doğru Cevap</label>
                                <div className="flex gap-2 mt-1">
                                  {Object.keys(question.options).map(key => (
                                    <button
                                      key={key}
                                      onClick={() => handleEditQuestion(index, 'correct_answer', key)}
                                      className={`w-10 h-10 rounded-lg font-bold ${
                                        question.correct_answer === key
                                          ? 'bg-green-600 text-white'
                                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                      }`}
                                    >
                                      {key}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Explanation */}
                            <div>
                              <label className="text-xs text-gray-500 uppercase tracking-wide">Açıklama</label>
                              {editingIndex === index ? (
                                <textarea
                                  value={question.explanation}
                                  onChange={(e) => handleEditQuestion(index, 'explanation', e.target.value)}
                                  className="w-full mt-1 p-3 border border-gray-200 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                                  rows={3}
                                />
                              ) : (
                                <p className="mt-1 text-gray-600 text-sm bg-blue-50 p-3 rounded-lg">
                                  💡 {question.explanation}
                                </p>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </DashboardLayout>
  )
}

