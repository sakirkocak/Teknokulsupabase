'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { 
  BookOpen, Filter, Play, CheckCircle, XCircle, 
  ChevronRight, Trophy, Target, Zap, Crown, Star,
  BarChart3, ArrowRight, Clock, Brain
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface Topic {
  id: string
  subject: string
  main_topic: string
  sub_topic: string
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
  topic?: Topic
}

interface StudentStats {
  topic_id: string
  total_attempted: number
  total_correct: number
  total_wrong: number
}

const subjects = ['Türkçe', 'Matematik', 'Fen Bilimleri', 'İnkılap Tarihi', 'Din Kültürü', 'İngilizce']

const difficultyConfig = {
  easy: { label: 'Kolay', color: 'bg-green-500', textColor: 'text-green-500', icon: CheckCircle },
  medium: { label: 'Orta', color: 'bg-yellow-500', textColor: 'text-yellow-500', icon: Star },
  hard: { label: 'Zor', color: 'bg-orange-500', textColor: 'text-orange-500', icon: Zap },
  legendary: { label: 'Efsane', color: 'bg-purple-500', textColor: 'text-purple-500', icon: Crown }
}

const subjectColors: Record<string, string> = {
  'Türkçe': 'from-blue-500 to-blue-600',
  'Matematik': 'from-red-500 to-red-600',
  'Fen Bilimleri': 'from-green-500 to-green-600',
  'İnkılap Tarihi': 'from-amber-500 to-amber-600',
  'Din Kültürü': 'from-teal-500 to-teal-600',
  'İngilizce': 'from-purple-500 to-purple-600'
}

export default function SoruBankasiPage() {
  const router = useRouter()
  const [topics, setTopics] = useState<Topic[]>([])
  const [questions, setQuestions] = useState<Question[]>([])
  const [stats, setStats] = useState<StudentStats[]>([])
  const [loading, setLoading] = useState(true)
  const [studentProfile, setStudentProfile] = useState<any>(null)

  // Filtreler
  const [selectedSubject, setSelectedSubject] = useState<string>('')
  const [selectedTopic, setSelectedTopic] = useState<string>('')
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('')

  // Soru Çözme
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null)
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)
  const [practiceMode, setPracticeMode] = useState(false)
  const [questionIndex, setQuestionIndex] = useState(0)
  const [sessionStats, setSessionStats] = useState({ correct: 0, wrong: 0 })

  const supabase = createClient()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)

    // Kullanıcı bilgisi
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
    
    if (profile) setStudentProfile(profile)

    // Konuları yükle
    const { data: topicsData } = await supabase
      .from('lgs_topics')
      .select('*')
      .eq('is_active', true)
      .order('subject')
      .order('main_topic')
    
    if (topicsData) setTopics(topicsData)

    // Soru sayılarını yükle (ders bazlı)
    const { data: questionsData } = await supabase
      .from('lgs_questions')
      .select('id, topic_id, difficulty, topic:lgs_topics(subject)')
      .eq('is_active', true)
    
    if (questionsData) setQuestions(questionsData as any)

    // İstatistikleri yükle
    if (profile) {
      const { data: statsData } = await supabase
        .from('student_question_stats')
        .select('*')
        .eq('student_id', profile.id)
      
      if (statsData) setStats(statsData)
    }

    setLoading(false)
  }

  const filteredTopics = topics.filter(t => 
    !selectedSubject || t.subject === selectedSubject
  )

  const getSubjectQuestionCount = (subject: string) => {
    return questions.filter(q => (q.topic as any)?.subject === subject).length
  }

  const getSubjectStats = (subject: string) => {
    const subjectTopics = topics.filter(t => t.subject === subject)
    const topicIds = subjectTopics.map(t => t.id)
    const subjectStats = stats.filter(s => topicIds.includes(s.topic_id))
    
    const total = subjectStats.reduce((acc, s) => acc + s.total_attempted, 0)
    const correct = subjectStats.reduce((acc, s) => acc + s.total_correct, 0)
    
    return { total, correct, percentage: total > 0 ? Math.round((correct / total) * 100) : 0 }
  }

  const startPractice = async () => {
    if (!selectedSubject && !selectedTopic) return

    setPracticeMode(true)
    setQuestionIndex(0)
    setSessionStats({ correct: 0, wrong: 0 })
    
    await loadNextQuestion()
  }

  const loadNextQuestion = async () => {
    setSelectedAnswer(null)
    setShowResult(false)

    let query = supabase
      .from('lgs_questions')
      .select('*, topic:lgs_topics(*)')
      .eq('is_active', true)

    if (selectedTopic) {
      query = query.eq('topic_id', selectedTopic)
    } else if (selectedSubject) {
      const subjectTopicIds = topics.filter(t => t.subject === selectedSubject).map(t => t.id)
      query = query.in('topic_id', subjectTopicIds)
    }

    if (selectedDifficulty) {
      query = query.eq('difficulty', selectedDifficulty)
    }

    // Rastgele bir soru seç
    const { data, count } = await query
    
    if (data && data.length > 0) {
      const randomIndex = Math.floor(Math.random() * data.length)
      setCurrentQuestion(data[randomIndex])
      setQuestionIndex(prev => prev + 1)
    } else {
      setCurrentQuestion(null)
    }
  }

  const handleAnswer = async (answer: string) => {
    if (showResult || !currentQuestion) return

    setSelectedAnswer(answer)
    const correct = answer === currentQuestion.correct_answer
    setIsCorrect(correct)
    setShowResult(true)

    // Session stats güncelle
    setSessionStats(prev => ({
      correct: prev.correct + (correct ? 1 : 0),
      wrong: prev.wrong + (correct ? 0 : 1)
    }))

    // Soru istatistiklerini güncelle
    await supabase
      .from('lgs_questions')
      .update({
        times_answered: currentQuestion.times_answered + 1,
        times_correct: currentQuestion.times_correct + (correct ? 1 : 0)
      })
      .eq('id', currentQuestion.id)

    // Öğrenci istatistiklerini güncelle
    if (studentProfile) {
      const { data: existingStat } = await supabase
        .from('student_question_stats')
        .select('*')
        .eq('student_id', studentProfile.id)
        .eq('topic_id', currentQuestion.topic_id)
        .single()

      if (existingStat) {
        await supabase
          .from('student_question_stats')
          .update({
            total_attempted: existingStat.total_attempted + 1,
            total_correct: existingStat.total_correct + (correct ? 1 : 0),
            total_wrong: existingStat.total_wrong + (correct ? 0 : 1),
            last_attempted_at: new Date().toISOString()
          })
          .eq('id', existingStat.id)
      } else {
        await supabase
          .from('student_question_stats')
          .insert({
            student_id: studentProfile.id,
            topic_id: currentQuestion.topic_id,
            total_attempted: 1,
            total_correct: correct ? 1 : 0,
            total_wrong: correct ? 0 : 1,
            last_attempted_at: new Date().toISOString()
          })
      }
    }
  }

  const exitPractice = () => {
    setPracticeMode(false)
    setCurrentQuestion(null)
    setSelectedAnswer(null)
    setShowResult(false)
    loadData() // Stats'ları yenile
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    )
  }

  // Soru Çözme Modu
  if (practiceMode && currentQuestion) {
    const DiffIcon = difficultyConfig[currentQuestion.difficulty].icon

    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-indigo-900 to-purple-900 p-4 md:p-6">
        <div className="max-w-4xl mx-auto">
          {/* Üst Bar */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <span className="text-white/70">Soru {questionIndex}</span>
              <div className={`${difficultyConfig[currentQuestion.difficulty].color} px-3 py-1 rounded-full text-white text-sm flex items-center gap-1`}>
                <DiffIcon className="h-4 w-4" />
                {difficultyConfig[currentQuestion.difficulty].label}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-green-400">✓ {sessionStats.correct}</span>
              <span className="text-red-400">✗ {sessionStats.wrong}</span>
              <button
                onClick={exitPractice}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
              >
                Çık
              </button>
            </div>
          </div>

          {/* Soru Kartı */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 md:p-8"
          >
            {/* Konu Bilgisi */}
            <div className="text-indigo-300 text-sm mb-4">
              {currentQuestion.topic?.subject} • {currentQuestion.topic?.main_topic}
            </div>

            {/* Soru Metni */}
            <div className="text-white text-lg md:text-xl mb-6 leading-relaxed">
              {currentQuestion.question_text}
            </div>

            {/* Görsel */}
            {currentQuestion.question_image_url && (
              <div className="mb-6">
                <img 
                  src={currentQuestion.question_image_url} 
                  alt="Soru görseli"
                  className="max-w-full rounded-lg"
                />
              </div>
            )}

            {/* Şıklar */}
            <div className="space-y-3">
              {Object.entries(currentQuestion.options).map(([key, value]) => {
                let buttonClass = 'bg-white/5 hover:bg-white/10 border-white/20'
                
                if (showResult) {
                  if (key === currentQuestion.correct_answer) {
                    buttonClass = 'bg-green-500/30 border-green-500'
                  } else if (key === selectedAnswer && !isCorrect) {
                    buttonClass = 'bg-red-500/30 border-red-500'
                  }
                } else if (selectedAnswer === key) {
                  buttonClass = 'bg-indigo-500/30 border-indigo-500'
                }

                return (
                  <button
                    key={key}
                    onClick={() => handleAnswer(key)}
                    disabled={showResult}
                    className={`w-full p-4 rounded-xl border-2 text-left transition-all ${buttonClass} ${
                      showResult ? 'cursor-default' : 'cursor-pointer'
                    }`}
                  >
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-white/10 text-white font-bold mr-3">
                      {key}
                    </span>
                    <span className="text-white">{value}</span>
                  </button>
                )
              })}
            </div>

            {/* Sonuç ve Açıklama */}
            <AnimatePresence>
              {showResult && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-6"
                >
                  {/* Sonuç Mesajı */}
                  <div className={`flex items-center gap-3 p-4 rounded-xl ${
                    isCorrect ? 'bg-green-500/20' : 'bg-red-500/20'
                  }`}>
                    {isCorrect ? (
                      <>
                        <CheckCircle className="h-6 w-6 text-green-400" />
                        <span className="text-green-400 font-medium">Doğru Cevap!</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="h-6 w-6 text-red-400" />
                        <span className="text-red-400 font-medium">
                          Yanlış! Doğru cevap: {currentQuestion.correct_answer}
                        </span>
                      </>
                    )}
                  </div>

                  {/* Açıklama */}
                  {currentQuestion.explanation && (
                    <div className="mt-4 p-4 rounded-xl bg-white/5">
                      <h4 className="text-indigo-300 font-medium mb-2">Açıklama:</h4>
                      <p className="text-white/80">{currentQuestion.explanation}</p>
                    </div>
                  )}

                  {/* Sonraki Soru Butonu */}
                  <button
                    onClick={loadNextQuestion}
                    className="w-full mt-6 py-4 bg-indigo-500 hover:bg-indigo-600 text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
                  >
                    Sonraki Soru
                    <ArrowRight className="h-5 w-5" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    )
  }

  // Ana Sayfa
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <BookOpen className="h-8 w-8 text-indigo-500" />
            LGS Soru Bankası
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Konu bazlı soru çöz, kendini geliştir!
          </p>
        </div>

        {/* Hızlı Aksiyonlar */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <button
            onClick={() => router.push('/ogrenci/soru-bankasi/deneme')}
            className="p-6 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl text-white hover:opacity-90 transition-all group"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold mb-1">Deneme Sınavı</h3>
                <p className="text-white/70">90 soruluk tam LGS denemesi çöz</p>
              </div>
              <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Target className="h-8 w-8" />
              </div>
            </div>
          </button>

          <div className="p-6 bg-white dark:bg-gray-800 rounded-2xl">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">Genel İstatistikler</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-indigo-500">
                  {stats.reduce((acc, s) => acc + s.total_attempted, 0)}
                </div>
                <div className="text-xs text-gray-500">Çözülen</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-500">
                  {stats.reduce((acc, s) => acc + s.total_correct, 0)}
                </div>
                <div className="text-xs text-gray-500">Doğru</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-500">
                  {stats.reduce((acc, s) => acc + s.total_wrong, 0)}
                </div>
                <div className="text-xs text-gray-500">Yanlış</div>
              </div>
            </div>
          </div>
        </div>

        {/* Ders Kartları */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          {subjects.map(subject => {
            const questionCount = getSubjectQuestionCount(subject)
            const subjectStats = getSubjectStats(subject)
            const isSelected = selectedSubject === subject

            return (
              <button
                key={subject}
                onClick={() => {
                  setSelectedSubject(isSelected ? '' : subject)
                  setSelectedTopic('')
                }}
                className={`p-4 rounded-xl transition-all ${
                  isSelected
                    ? `bg-gradient-to-br ${subjectColors[subject]} text-white shadow-lg scale-105`
                    : 'bg-white dark:bg-gray-800 hover:shadow-md'
                }`}
              >
                <div className={`text-2xl font-bold ${isSelected ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                  {questionCount}
                </div>
                <div className={`text-sm font-medium ${isSelected ? 'text-white/90' : 'text-gray-600 dark:text-gray-400'}`}>
                  {subject}
                </div>
                {subjectStats.total > 0 && (
                  <div className={`text-xs mt-1 ${isSelected ? 'text-white/70' : 'text-gray-500'}`}>
                    %{subjectStats.percentage} başarı
                  </div>
                )}
              </button>
            )
          })}
        </div>

        {/* Konu Seçimi ve Filtreler */}
        {selectedSubject && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 mb-8"
          >
            <div className="flex flex-wrap items-center gap-4 mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {selectedSubject} Konuları
              </h3>
              
              {/* Zorluk Filtresi */}
              <select
                value={selectedDifficulty}
                onChange={(e) => setSelectedDifficulty(e.target.value)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
              >
                <option value="">Tüm Zorluklar</option>
                {Object.entries(difficultyConfig).map(([key, { label }]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>

            {/* Konular */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredTopics.map(topic => {
                const topicStats = stats.find(s => s.topic_id === topic.id)
                const isSelected = selectedTopic === topic.id

                return (
                  <button
                    key={topic.id}
                    onClick={() => setSelectedTopic(isSelected ? '' : topic.id)}
                    className={`p-4 rounded-lg text-left transition-all ${
                      isSelected
                        ? 'bg-indigo-500 text-white'
                        : 'bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600'
                    }`}
                  >
                    <div className={`font-medium ${isSelected ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                      {topic.main_topic}
                    </div>
                    {topic.sub_topic && (
                      <div className={`text-sm ${isSelected ? 'text-white/70' : 'text-gray-500'}`}>
                        {topic.sub_topic}
                      </div>
                    )}
                    {topicStats && (
                      <div className={`text-xs mt-2 ${isSelected ? 'text-white/60' : 'text-gray-400'}`}>
                        {topicStats.total_correct}/{topicStats.total_attempted} doğru
                      </div>
                    )}
                  </button>
                )
              })}
            </div>

            {/* Başla Butonu */}
            <div className="mt-6 flex justify-center">
              <button
                onClick={startPractice}
                className="px-8 py-4 bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-medium rounded-xl hover:opacity-90 transition-all flex items-center gap-2"
              >
                <Play className="h-5 w-5" />
                Soru Çözmeye Başla
              </button>
            </div>
          </motion.div>
        )}

        {/* Soru Yoksa Mesaj */}
        {!selectedSubject && questions.length === 0 && (
          <div className="text-center py-12">
            <Brain className="h-16 w-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-xl font-medium text-gray-600 dark:text-gray-400">
              Henüz soru eklenmemiş
            </h3>
            <p className="text-gray-500 mt-2">
              Admin panelinden soru ekleyebilirsiniz.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

