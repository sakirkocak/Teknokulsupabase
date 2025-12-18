'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { useProfile } from '@/hooks/useProfile'
import { createClient } from '@/lib/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import MathRenderer from '@/components/MathRenderer'
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
  ChevronUp,
  ChevronRight,
  ArrowLeft,
  ArrowRight,
  Check,
  Layers,
  Volume2
} from 'lucide-react'
import SpeakButton from '@/components/SpeakButton'

interface Topic {
  id: string
  subject_id: string
  grade: number
  main_topic: string
  sub_topic: string | null
  learning_outcome: string | null
  unit_number: number | null
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

const STEPS = [
  { id: 1, name: 'Sınıf', icon: GraduationCap },
  { id: 2, name: 'Ders', icon: BookOpen },
  { id: 3, name: 'Konu', icon: Layers },
  { id: 4, name: 'Ayarlar', icon: Target },
  { id: 5, name: 'Üret', icon: Wand2 }
]

const difficultyLabels: Record<string, { label: string; color: string; bg: string; emoji: string }> = {
  easy: { label: 'Kolay', color: 'text-green-600', bg: 'bg-green-100', emoji: '🟢' },
  medium: { label: 'Orta', color: 'text-yellow-600', bg: 'bg-yellow-100', emoji: '🟡' },
  hard: { label: 'Zor', color: 'text-orange-600', bg: 'bg-orange-100', emoji: '🟠' },
  legendary: { label: 'Efsane', color: 'text-red-600', bg: 'bg-red-100', emoji: '🔴' }
}

const bloomLabels: Record<string, string> = {
  bilgi: '📚 Bilgi',
  kavrama: '💡 Kavrama',
  uygulama: '🔧 Uygulama',
  analiz: '🔍 Analiz',
  sentez: '🧩 Sentez',
  değerlendirme: '⚖️ Değerlendirme'
}

const gradeInfo: Record<number, { level: string; emoji: string; exam?: string }> = {
  1: { level: 'İlkokul', emoji: '📚' },
  2: { level: 'İlkokul', emoji: '📚' },
  3: { level: 'İlkokul', emoji: '📚' },
  4: { level: 'İlkokul', emoji: '📚' },
  5: { level: 'Ortaokul', emoji: '🏫' },
  6: { level: 'Ortaokul', emoji: '🏫' },
  7: { level: 'Ortaokul', emoji: '🏫' },
  8: { level: 'Ortaokul', emoji: '🏫', exam: 'LGS' },
  9: { level: 'Lise', emoji: '🎓' },
  10: { level: 'Lise', emoji: '🎓' },
  11: { level: 'Lise', emoji: '🎓', exam: 'TYT' },
  12: { level: 'Lise', emoji: '🎓', exam: 'TYT/AYT' }
}

export default function AIQuestionGeneratorPage() {
  const { profile, loading: profileLoading } = useProfile()
  const supabase = createClient()
  
  // Wizard state
  const [currentStep, setCurrentStep] = useState(1)
  
  // Form state
  const [selectedGrade, setSelectedGrade] = useState<number | null>(null)
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

  // Group topics by main_topic for better organization
  const groupedTopics = topics.reduce((acc, topic) => {
    const key = topic.main_topic
    if (!acc[key]) {
      acc[key] = []
    }
    acc[key].push(topic)
    return acc
  }, {} as Record<string, Topic[]>)

  // Load subjects when grade changes
  useEffect(() => {
    if (selectedGrade) {
      loadSubjects()
    }
  }, [selectedGrade])

  // Load topics when subject changes
  useEffect(() => {
    if (selectedSubject && selectedGrade) {
      loadTopics()
    } else {
      setTopics([])
      setSelectedTopic('')
    }
  }, [selectedSubject, selectedGrade])

  const loadSubjects = useCallback(async () => {
    if (!selectedGrade) return
    setLoadingSubjects(true)
    try {
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
  }, [selectedGrade, supabase])

  const loadTopics = useCallback(async () => {
    if (!selectedSubject || !selectedGrade) return
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
  }, [selectedSubject, selectedGrade, supabase])

  async function handleGenerate() {
    if (!selectedSubject || !selectedTopic || !selectedGrade) {
      alert('Lütfen tüm seçimleri yapın')
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

  function canProceedToStep(step: number): boolean {
    switch (step) {
      case 2: return selectedGrade !== null
      case 3: return selectedGrade !== null && selectedSubject !== ''
      case 4: return selectedGrade !== null && selectedSubject !== '' && selectedTopic !== ''
      case 5: return selectedGrade !== null && selectedSubject !== '' && selectedTopic !== ''
      default: return true
    }
  }

  function goToStep(step: number) {
    if (step >= 1 && step <= 5 && canProceedToStep(step)) {
      setCurrentStep(step)
    }
  }

  const selectedSubjectData = subjects.find(s => s.id === selectedSubject)
  const selectedTopicData = topics.find(t => t.id === selectedTopic)
  const isHighSchool = selectedGrade !== null && selectedGrade >= 9

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
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
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
                MEB müfredatına uygun sorular üretin
              </p>
            </div>
          </div>
        </motion.div>

        {/* Breadcrumb Navigation */}
        {(selectedGrade || selectedSubjectData || selectedTopicData) && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-6 flex items-center gap-2 text-sm flex-wrap"
          >
            {selectedGrade && (
              <>
                <button 
                  onClick={() => goToStep(1)}
                  className="px-3 py-1.5 bg-purple-100 text-purple-700 rounded-full hover:bg-purple-200 transition-all font-medium"
                >
                  {gradeInfo[selectedGrade].emoji} {selectedGrade}. Sınıf
                </button>
              </>
            )}
            {selectedSubjectData && (
              <>
                <ChevronRight className="w-4 h-4 text-gray-400" />
                <button 
                  onClick={() => goToStep(2)}
                  className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition-all font-medium"
                >
                  {selectedSubjectData.icon} {selectedSubjectData.name}
                </button>
              </>
            )}
            {selectedTopicData && (
              <>
                <ChevronRight className="w-4 h-4 text-gray-400" />
                <button 
                  onClick={() => goToStep(3)}
                  className="px-3 py-1.5 bg-green-100 text-green-700 rounded-full hover:bg-green-200 transition-all font-medium"
                >
                  📝 {selectedTopicData.main_topic.substring(0, 30)}...
                </button>
              </>
            )}
          </motion.div>
        )}

        {/* Step Progress */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            {STEPS.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <button
                  onClick={() => goToStep(step.id)}
                  disabled={!canProceedToStep(step.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
                    currentStep === step.id
                      ? 'bg-purple-600 text-white shadow-lg'
                      : currentStep > step.id
                      ? 'bg-green-100 text-green-700'
                      : canProceedToStep(step.id)
                      ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      : 'bg-gray-50 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {currentStep > step.id ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <step.icon className="w-5 h-5" />
                  )}
                  <span className="hidden sm:inline font-medium">{step.name}</span>
                </button>
                {index < STEPS.length - 1 && (
                  <div className={`w-8 lg:w-16 h-1 mx-2 rounded ${
                    currentStep > step.id ? 'bg-green-400' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </motion.div>

        {/* Step Content */}
        <AnimatePresence mode="wait">
          {/* Step 1: Grade Selection */}
          {currentStep === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8"
            >
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Sınıf Seçin</h2>
              <p className="text-gray-600 mb-6">Soru oluşturmak istediğiniz sınıf seviyesini seçin</p>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {[1,2,3,4,5,6,7,8,9,10,11,12].map(grade => (
                  <button
                    key={grade}
                    onClick={() => {
                      setSelectedGrade(grade)
                      setCurrentStep(2)
                    }}
                    className={`p-4 rounded-xl border-2 transition-all hover:scale-105 ${
                      selectedGrade === grade
                        ? 'border-purple-500 bg-purple-50 shadow-lg'
                        : 'border-gray-200 hover:border-purple-300 hover:bg-purple-50'
                    }`}
                  >
                    <div className="text-3xl mb-2">{gradeInfo[grade].emoji}</div>
                    <div className="text-xl font-bold text-gray-800">{grade}. Sınıf</div>
                    <div className="text-sm text-gray-500">{gradeInfo[grade].level}</div>
                    {gradeInfo[grade].exam && (
                      <div className="mt-1 text-xs px-2 py-1 bg-orange-100 text-orange-700 rounded-full inline-block">
                        {gradeInfo[grade].exam}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Step 2: Subject Selection */}
          {currentStep === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">Ders Seçin</h2>
                  <p className="text-gray-600">{selectedGrade}. Sınıf müfredatındaki dersler</p>
                </div>
                <button 
                  onClick={() => setCurrentStep(1)}
                  className="flex items-center gap-2 text-gray-600 hover:text-purple-600"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Geri
                </button>
              </div>

              {loadingSubjects ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
                </div>
              ) : subjects.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  Bu sınıf için ders bulunamadı
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {subjects.map(subject => (
                    <button
                      key={subject.id}
                      onClick={() => {
                        setSelectedSubject(subject.id)
                        setCurrentStep(3)
                      }}
                      className={`p-4 rounded-xl border-2 transition-all hover:scale-105 text-left ${
                        selectedSubject === subject.id
                          ? 'border-blue-500 bg-blue-50 shadow-lg'
                          : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                      }`}
                    >
                      <div className="text-3xl mb-2">{subject.icon}</div>
                      <div className="font-bold text-gray-800">{subject.name}</div>
                    </button>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* Step 3: Topic Selection */}
          {currentStep === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">Konu / Kazanım Seçin</h2>
                  <p className="text-gray-600">{selectedSubjectData?.icon} {selectedSubjectData?.name} dersi konuları</p>
                </div>
                <button 
                  onClick={() => setCurrentStep(2)}
                  className="flex items-center gap-2 text-gray-600 hover:text-purple-600"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Geri
                </button>
              </div>

              {loadingTopics ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
                </div>
              ) : topics.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">📭</div>
                  <p className="text-gray-500">Bu ders için konu/kazanım bulunamadı</p>
                  <p className="text-sm text-gray-400 mt-2">Önce müfredat veritabanına konu ekleyin</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                  {Object.entries(groupedTopics).map(([mainTopic, topicList]) => (
                    <div key={mainTopic} className="border border-gray-200 rounded-xl overflow-hidden">
                      <div className="bg-gray-50 px-4 py-2 font-medium text-gray-700 flex items-center gap-2">
                        <Layers className="w-4 h-4 text-gray-500" />
                        {mainTopic}
                      </div>
                      <div className="divide-y divide-gray-100">
                        {topicList.map(topic => (
                          <button
                            key={topic.id}
                            onClick={() => {
                              setSelectedTopic(topic.id)
                              setCurrentStep(4)
                            }}
                            className={`w-full text-left px-4 py-3 transition-all hover:bg-green-50 ${
                              selectedTopic === topic.id ? 'bg-green-100' : ''
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                                selectedTopic === topic.id ? 'bg-green-500' : 'bg-gray-300'
                              }`} />
                              <div>
                                {topic.sub_topic && (
                                  <div className="text-sm text-gray-500 mb-1">{topic.sub_topic}</div>
                                )}
                                <div className="text-gray-700">
                                  {topic.learning_outcome || topic.main_topic}
                                </div>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* Step 4: Settings */}
          {currentStep === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">Soru Ayarları</h2>
                  <p className="text-gray-600">Zorluk seviyesi ve soru sayısını belirleyin</p>
                </div>
                <button 
                  onClick={() => setCurrentStep(3)}
                  className="flex items-center gap-2 text-gray-600 hover:text-purple-600"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Geri
                </button>
              </div>

              {/* Selected Topic Info */}
              <div className="mb-8 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-100">
                <div className="text-sm text-purple-600 font-medium mb-1">Seçilen Kazanım:</div>
                <div className="text-gray-800">
                  {selectedTopicData?.learning_outcome || selectedTopicData?.main_topic}
                </div>
              </div>

              {/* Difficulty */}
              <div className="mb-8">
                <label className="block text-lg font-semibold text-gray-800 mb-4">Zorluk Seviyesi</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {Object.entries(difficultyLabels).map(([key, { label, color, bg, emoji }]) => (
                    <button
                      key={key}
                      onClick={() => setSelectedDifficulty(key)}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        selectedDifficulty === key
                          ? `border-current ${bg} ${color} shadow-lg`
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="text-2xl mb-2">{emoji}</div>
                      <div className={`font-bold ${selectedDifficulty === key ? color : 'text-gray-700'}`}>
                        {label}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Question Count */}
              <div className="mb-8">
                <label className="block text-lg font-semibold text-gray-800 mb-4">Soru Sayısı</label>
                <div className="flex gap-4">
                  {[5, 10, 15, 20].map(count => (
                    <button
                      key={count}
                      onClick={() => setQuestionCount(count)}
                      className={`flex-1 py-4 rounded-xl text-lg font-bold transition-all ${
                        questionCount === count
                          ? 'bg-purple-600 text-white shadow-lg'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {count}
                    </button>
                  ))}
                </div>
              </div>

              {/* Option Count Info */}
              <div className="mb-8 p-4 bg-blue-50 rounded-xl border border-blue-100">
                <div className="flex items-center gap-2 text-blue-700">
                  <AlertTriangle className="w-5 h-5" />
                  <span className="font-medium">
                    {isHighSchool ? '5 şıklı sorular üretilecek (YKS formatı)' : '4 şıklı sorular üretilecek (LGS formatı)'}
                  </span>
                </div>
              </div>

              {/* Generate Button */}
              <button
                onClick={() => {
                  setCurrentStep(5)
                  handleGenerate()
                }}
                className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold text-lg rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-3"
              >
                <Wand2 className="w-6 h-6" />
                Soru Üret
                <ArrowRight className="w-6 h-6" />
              </button>
            </motion.div>
          )}

          {/* Step 5: Generated Questions */}
          {currentStep === 5 && (
            <motion.div
              key="step5"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">
                    {generating ? 'Sorular Üretiliyor...' : `Üretilen Sorular (${generatedQuestions.length})`}
                  </h2>
                  <p className="text-gray-600">
                    {selectedTopicData?.main_topic}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setCurrentStep(4)}
                    className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-purple-600 bg-white rounded-lg border"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Geri
                  </button>
                  {generatedQuestions.length > 0 && (
                    <>
                      <button
                        onClick={handleGenerate}
                        disabled={generating}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all flex items-center gap-2"
                      >
                        <RefreshCw className={`w-4 h-4 ${generating ? 'animate-spin' : ''}`} />
                        Yeniden
                      </button>
                      <button
                        onClick={handleSaveAll}
                        disabled={saving}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all flex items-center gap-2"
                      >
                        {saving ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Save className="w-4 h-4" />
                        )}
                        Tümünü Kaydet
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Save Status */}
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

              {/* Loading State */}
              {generating && (
                <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-12 text-center">
                  <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                    <Sparkles className="w-10 h-10 text-purple-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">
                    AI sorularınızı hazırlıyor...
                  </h3>
                  <p className="text-gray-600">
                    {questionCount} adet {difficultyLabels[selectedDifficulty]?.label?.toLowerCase()} zorlukta soru üretiliyor
                  </p>
                  <div className="mt-4">
                    <Loader2 className="w-8 h-8 animate-spin text-purple-600 mx-auto" />
                  </div>
                </div>
              )}

              {/* Success State - After Save */}
              {!generating && generatedQuestions.length === 0 && saveStatus && saveStatus.success > 0 && (
                <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-12 text-center">
                  <div className="text-6xl mb-4">🎉</div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">
                    Sorular başarıyla kaydedildi!
                  </h3>
                  <p className="text-gray-600 mb-6">
                    {saveStatus.success} soru soru bankasına eklendi.
                  </p>
                  <div className="flex gap-4 justify-center">
                    <button
                      onClick={() => {
                        setSaveStatus(null)
                        setCurrentStep(3)
                      }}
                      className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all"
                    >
                      Farklı Konu Seç
                    </button>
                    <button
                      onClick={() => {
                        setSaveStatus(null)
                        handleGenerate()
                      }}
                      className="px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-all"
                    >
                      Aynı Konuda Yeni Sorular Üret
                    </button>
                  </div>
                </div>
              )}

              {/* Empty State - Error */}
              {!generating && generatedQuestions.length === 0 && !saveStatus && (
                <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-12 text-center">
                  <div className="text-6xl mb-4">🤔</div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">
                    Soru üretilemedi
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Bir hata oluşmuş olabilir. Lütfen tekrar deneyin.
                  </p>
                  <button
                    onClick={handleGenerate}
                    className="px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-all"
                  >
                    Tekrar Dene
                  </button>
                </div>
              )}

              {/* Questions List */}
              {!generating && generatedQuestions.length > 0 && (
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
                                <div className="flex items-center justify-between">
                                  <label className="text-xs text-gray-500 uppercase tracking-wide">Soru</label>
                                  <SpeakButton 
                                    text={question.question_text} 
                                    size="sm"
                                    variant="pill"
                                    label="Soruyu Oku"
                                  />
                                </div>
                                {editingIndex === index ? (
                                  <textarea
                                    value={question.question_text}
                                    onChange={(e) => handleEditQuestion(index, 'question_text', e.target.value)}
                                    className="w-full mt-1 p-3 border border-gray-200 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                                    rows={3}
                                  />
                                ) : (
                                  <div className="mt-1 text-gray-800 font-medium">
                                    <MathRenderer text={question.question_text} />
                                  </div>
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
                                          <MathRenderer text={value} />
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
                                  <div className="mt-1 text-gray-600 text-sm bg-blue-50 p-3 rounded-lg">
                                    💡 <MathRenderer text={question.explanation} />
                                  </div>
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
          )}
        </AnimatePresence>
      </div>
    </DashboardLayout>
  )
}
