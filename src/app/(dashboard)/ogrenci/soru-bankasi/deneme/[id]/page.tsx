'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useParams } from 'next/navigation'
import { 
  Clock, ChevronLeft, ChevronRight, Flag, CheckCircle, 
  XCircle, AlertCircle, Home, BarChart3, Target, Volume2
} from 'lucide-react'
import SpeakButton from '@/components/SpeakButton'
import MathRenderer from '@/components/MathRenderer'
import { motion, AnimatePresence } from 'framer-motion'

interface Question {
  id: string
  topic_id: string
  difficulty: string
  question_text: string
  question_image_url: string | null
  options: { A: string; B: string; C: string; D: string }
  correct_answer: 'A' | 'B' | 'C' | 'D'
  explanation: string | null
  topic?: {
    subject: string
    main_topic: string
  }
}

interface Answer {
  id: string
  question_id: string
  question_order: number
  student_answer: string | null
  is_correct: boolean | null
}

interface Exam {
  id: string
  title: string
  status: string
  time_limit_minutes: number
  time_spent_seconds: number
  started_at: string | null
  questions: string[]
  total_correct?: number
  total_wrong?: number
  total_empty?: number
  total_net?: number
}

const subjectOrder = ['Türkçe', 'Matematik', 'Fen Bilimleri', 'İnkılap Tarihi', 'Din Kültürü', 'İngilizce']

export default function ExamPage() {
  const router = useRouter()
  const params = useParams()
  const examId = params.id as string

  const [loading, setLoading] = useState(true)
  const [exam, setExam] = useState<Exam | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [answers, setAnswers] = useState<Answer[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [timeRemaining, setTimeRemaining] = useState(0)
  const [showResults, setShowResults] = useState(false)
  const [results, setResults] = useState<any>(null)
  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<number>>(new Set())

  const supabase = createClient()

  useEffect(() => {
    loadExam()
  }, [examId])

  // Zamanlayıcı
  useEffect(() => {
    if (!exam || exam.status === 'completed' || showResults) return

    const interval = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 0) {
          clearInterval(interval)
          finishExam()
          return 0
        }
        return prev - 1
      })

      // Her 30 saniyede bir kaydet
      if (timeRemaining % 30 === 0) {
        saveProgress()
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [exam, showResults])

  const loadExam = async () => {
    setLoading(true)

    // Sınav bilgisi
    const { data: examData, error: examError } = await supabase
      .from('lgs_mock_exams')
      .select('*')
      .eq('id', examId)
      .single()

    if (examError || !examData) {
      router.push('/ogrenci/soru-bankasi/deneme')
      return
    }

    setExam(examData)

    // Tamamlanmış mı kontrol et
    if (examData.status === 'completed') {
      setShowResults(true)
      await loadResults(examData)
      setLoading(false)
      return
    }

    // Süre hesapla
    if (examData.started_at) {
      const startTime = new Date(examData.started_at).getTime()
      const elapsed = Math.floor((Date.now() - startTime) / 1000)
      const remaining = (examData.time_limit_minutes * 60) - elapsed
      setTimeRemaining(Math.max(0, remaining))
    } else {
      // İlk başlangıç
      await supabase
        .from('lgs_mock_exams')
        .update({ 
          started_at: new Date().toISOString(),
          status: 'in_progress'
        })
        .eq('id', examId)
      
      setTimeRemaining(examData.time_limit_minutes * 60)
    }

    // Soruları yükle
    const { data: questionsData } = await supabase
      .from('lgs_questions')
      .select('*, topic:lgs_topics(subject, main_topic)')
      .in('id', examData.questions)

    if (questionsData) {
      // Sıralama: Türkçe -> Matematik -> Fen -> İnkılap -> Din -> İngilizce
      const sorted = [...questionsData].sort((a, b) => {
        const aSubject = a.topic?.subject || ''
        const bSubject = b.topic?.subject || ''
        return subjectOrder.indexOf(aSubject) - subjectOrder.indexOf(bSubject)
      })
      setQuestions(sorted)
    }

    // Cevapları yükle
    const { data: answersData } = await supabase
      .from('mock_exam_answers')
      .select('*')
      .eq('exam_id', examId)
      .order('question_order')

    if (answersData) {
      setAnswers(answersData)
    }

    setLoading(false)
  }

  const loadResults = async (examData: Exam) => {
    // Cevapları yükle
    const { data: answersData } = await supabase
      .from('mock_exam_answers')
      .select('*, question:lgs_questions(*, topic:lgs_topics(subject))')
      .eq('exam_id', examId)

    if (answersData) {
      setAnswers(answersData)
      
      // Sonuçları hesapla
      const subjectStats: Record<string, { correct: number; wrong: number; empty: number }> = {}
      
      answersData.forEach((ans: any) => {
        const subject = ans.question?.topic?.subject || 'Bilinmeyen'
        if (!subjectStats[subject]) {
          subjectStats[subject] = { correct: 0, wrong: 0, empty: 0 }
        }
        
        if (ans.student_answer === null) {
          subjectStats[subject].empty++
        } else if (ans.is_correct) {
          subjectStats[subject].correct++
        } else {
          subjectStats[subject].wrong++
        }
      })

      setResults({
        totalCorrect: examData.total_correct,
        totalWrong: examData.total_wrong,
        totalEmpty: examData.total_empty,
        totalNet: examData.total_net,
        subjectStats
      })
    }

    // Soruları da yükle
    const { data: questionsData } = await supabase
      .from('lgs_questions')
      .select('*, topic:lgs_topics(subject, main_topic)')
      .in('id', examData.questions)

    if (questionsData) {
      const sorted = [...questionsData].sort((a, b) => {
        const aSubject = a.topic?.subject || ''
        const bSubject = b.topic?.subject || ''
        return subjectOrder.indexOf(aSubject) - subjectOrder.indexOf(bSubject)
      })
      setQuestions(sorted)
    }
  }

  const saveProgress = async () => {
    if (!exam) return

    const elapsedTime = (exam.time_limit_minutes * 60) - timeRemaining

    await supabase
      .from('lgs_mock_exams')
      .update({ time_spent_seconds: elapsedTime })
      .eq('id', examId)
  }

  const handleAnswer = async (answer: string) => {
    if (!questions[currentIndex] || showResults) return

    const question = questions[currentIndex]
    const isCorrect = answer === question.correct_answer

    // Cevabı güncelle
    await supabase
      .from('mock_exam_answers')
      .update({
        student_answer: answer,
        is_correct: isCorrect,
        answered_at: new Date().toISOString()
      })
      .eq('exam_id', examId)
      .eq('question_id', question.id)

    // Local state güncelle
    setAnswers(prev => prev.map(a => 
      a.question_id === question.id 
        ? { ...a, student_answer: answer, is_correct: isCorrect }
        : a
    ))
  }

  const clearAnswer = async () => {
    if (!questions[currentIndex] || showResults) return

    const question = questions[currentIndex]

    await supabase
      .from('mock_exam_answers')
      .update({
        student_answer: null,
        is_correct: null,
        answered_at: null
      })
      .eq('exam_id', examId)
      .eq('question_id', question.id)

    setAnswers(prev => prev.map(a => 
      a.question_id === question.id 
        ? { ...a, student_answer: null, is_correct: null }
        : a
    ))
  }

  const toggleFlag = () => {
    setFlaggedQuestions(prev => {
      const newSet = new Set(prev)
      if (newSet.has(currentIndex)) {
        newSet.delete(currentIndex)
      } else {
        newSet.add(currentIndex)
      }
      return newSet
    })
  }

  const finishExam = async () => {
    if (!exam) return

    const elapsedTime = (exam.time_limit_minutes * 60) - timeRemaining

    // Sonuçları hesapla
    const subjectStats: Record<string, { correct: number; wrong: number; empty: number }> = {}
    let totalCorrect = 0
    let totalWrong = 0
    let totalEmpty = 0

    answers.forEach(ans => {
      const question = questions.find(q => q.id === ans.question_id)
      const subject = question?.topic?.subject || 'Bilinmeyen'
      
      if (!subjectStats[subject]) {
        subjectStats[subject] = { correct: 0, wrong: 0, empty: 0 }
      }

      if (ans.student_answer === null) {
        subjectStats[subject].empty++
        totalEmpty++
      } else if (ans.is_correct) {
        subjectStats[subject].correct++
        totalCorrect++
      } else {
        subjectStats[subject].wrong++
        totalWrong++
      }
    })

    const totalNet = totalCorrect - (totalWrong / 3)
    const totalScore = (totalNet / 90) * 100

    // Veritabanını güncelle
    await supabase
      .from('lgs_mock_exams')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        time_spent_seconds: elapsedTime,
        total_correct: totalCorrect,
        total_wrong: totalWrong,
        total_empty: totalEmpty,
        total_net: totalNet,
        total_score: totalScore,
        turkce_correct: subjectStats['Türkçe']?.correct || 0,
        turkce_wrong: subjectStats['Türkçe']?.wrong || 0,
        turkce_empty: subjectStats['Türkçe']?.empty || 0,
        matematik_correct: subjectStats['Matematik']?.correct || 0,
        matematik_wrong: subjectStats['Matematik']?.wrong || 0,
        matematik_empty: subjectStats['Matematik']?.empty || 0,
        fen_correct: subjectStats['Fen Bilimleri']?.correct || 0,
        fen_wrong: subjectStats['Fen Bilimleri']?.wrong || 0,
        fen_empty: subjectStats['Fen Bilimleri']?.empty || 0,
        inkilap_correct: subjectStats['İnkılap Tarihi']?.correct || 0,
        inkilap_wrong: subjectStats['İnkılap Tarihi']?.wrong || 0,
        inkilap_empty: subjectStats['İnkılap Tarihi']?.empty || 0,
        din_correct: subjectStats['Din Kültürü']?.correct || 0,
        din_wrong: subjectStats['Din Kültürü']?.wrong || 0,
        din_empty: subjectStats['Din Kültürü']?.empty || 0,
        ingilizce_correct: subjectStats['İngilizce']?.correct || 0,
        ingilizce_wrong: subjectStats['İngilizce']?.wrong || 0,
        ingilizce_empty: subjectStats['İngilizce']?.empty || 0
      })
      .eq('id', examId)

    setResults({
      totalCorrect,
      totalWrong,
      totalEmpty,
      totalNet,
      subjectStats
    })
    setShowResults(true)
  }

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = seconds % 60
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  const getCurrentAnswer = () => {
    if (!questions[currentIndex]) return null
    return answers.find(a => a.question_id === questions[currentIndex].id)?.student_answer
  }

  const getSubjectRange = (subject: string) => {
    const startIndex = questions.findIndex(q => q.topic?.subject === subject)
    const endIndex = questions.filter(q => q.topic?.subject === subject).length + startIndex - 1
    return startIndex >= 0 ? `${startIndex + 1}-${endIndex + 1}` : ''
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    )
  }

  // Sonuç Ekranı
  if (showResults && results) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-indigo-900 to-purple-900 p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          {/* Başlık */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Sınav Sonuçları</h1>
            <p className="text-white/60">{exam?.title}</p>
          </div>

          {/* Genel Sonuçlar */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 mb-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              <div>
                <div className="text-4xl font-bold text-green-400">{results.totalCorrect}</div>
                <div className="text-white/60">Doğru</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-red-400">{results.totalWrong}</div>
                <div className="text-white/60">Yanlış</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-gray-400">{results.totalEmpty}</div>
                <div className="text-white/60">Boş</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-indigo-400">{results.totalNet.toFixed(2)}</div>
                <div className="text-white/60">Net</div>
              </div>
            </div>
          </div>

          {/* Ders Bazlı Sonuçlar */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 mb-6">
            <h3 className="text-lg font-semibold text-white mb-4">Ders Bazlı Sonuçlar</h3>
            <div className="space-y-4">
              {subjectOrder.map(subject => {
                const stats = results.subjectStats[subject]
                if (!stats) return null
                
                const net = stats.correct - (stats.wrong / 3)
                const total = stats.correct + stats.wrong + stats.empty

                return (
                  <div key={subject} className="flex items-center gap-4">
                    <div className="w-32 text-white/80 text-sm">{subject}</div>
                    <div className="flex-1">
                      <div className="h-4 bg-white/10 rounded-full overflow-hidden flex">
                        <div 
                          className="bg-green-500 h-full"
                          style={{ width: `${(stats.correct / total) * 100}%` }}
                        />
                        <div 
                          className="bg-red-500 h-full"
                          style={{ width: `${(stats.wrong / total) * 100}%` }}
                        />
                      </div>
                    </div>
                    <div className="w-20 text-right">
                      <span className="text-green-400">{stats.correct}</span>
                      <span className="text-white/30">/</span>
                      <span className="text-red-400">{stats.wrong}</span>
                      <span className="text-white/30">/</span>
                      <span className="text-white/50">{stats.empty}</span>
                    </div>
                    <div className="w-16 text-right text-indigo-400 font-medium">
                      {net.toFixed(2)}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Aksiyonlar */}
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => router.push('/ogrenci/soru-bankasi/deneme')}
              className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors flex items-center gap-2"
            >
              <Home className="h-5 w-5" />
              Ana Sayfa
            </button>
            <button
              onClick={() => setShowResults(false)}
              className="px-6 py-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl transition-colors flex items-center gap-2"
            >
              <BarChart3 className="h-5 w-5" />
              Soruları İncele
            </button>
          </div>
        </div>
      </div>
    )
  }

  const currentQuestion = questions[currentIndex]
  const currentAnswer = getCurrentAnswer()

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {/* Üst Bar */}
      <div className="bg-gray-800 border-b border-gray-700 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-white font-medium">Soru {currentIndex + 1}/{questions.length}</span>
            <span className="text-gray-400 text-sm">
              {currentQuestion?.topic?.subject} • {currentQuestion?.topic?.main_topic}
            </span>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Zamanlayıcı */}
            <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
              timeRemaining < 300 ? 'bg-red-500/20 text-red-400' : 'bg-gray-700 text-white'
            }`}>
              <Clock className="h-5 w-5" />
              <span className="font-mono text-lg">{formatTime(timeRemaining)}</span>
            </div>
            
            {/* Bitir Butonu */}
            <button
              onClick={() => {
                if (confirm('Sınavı bitirmek istediğinize emin misiniz?')) {
                  finishExam()
                }
              }}
              className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
            >
              Sınavı Bitir
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex">
        {/* Sol Panel - Soru Navigasyonu */}
        <div className="w-64 bg-gray-800 border-r border-gray-700 p-4 overflow-y-auto hidden lg:block">
          <h3 className="text-white font-medium mb-4">Soru Haritası</h3>
          
          {subjectOrder.map(subject => {
            const subjectQuestions = questions.filter(q => q.topic?.subject === subject)
            if (subjectQuestions.length === 0) return null
            
            const startIndex = questions.findIndex(q => q.id === subjectQuestions[0].id)
            
            return (
              <div key={subject} className="mb-4">
                <div className="text-gray-400 text-xs uppercase mb-2">{subject}</div>
                <div className="grid grid-cols-5 gap-1">
                  {subjectQuestions.map((q, i) => {
                    const globalIndex = startIndex + i
                    const answer = answers.find(a => a.question_id === q.id)
                    const isCurrent = globalIndex === currentIndex
                    const isFlagged = flaggedQuestions.has(globalIndex)
                    
                    let bgClass = 'bg-gray-700'
                    if (isCurrent) bgClass = 'bg-indigo-500'
                    else if (answer?.student_answer) bgClass = 'bg-green-600'
                    
                    return (
                      <button
                        key={q.id}
                        onClick={() => setCurrentIndex(globalIndex)}
                        className={`w-8 h-8 rounded text-xs font-medium transition-all relative ${bgClass} ${
                          isCurrent ? 'text-white ring-2 ring-indigo-400' : 'text-white/70 hover:bg-gray-600'
                        }`}
                      >
                        {globalIndex + 1}
                        {isFlagged && (
                          <Flag className="h-3 w-3 text-yellow-400 absolute -top-1 -right-1" />
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>

        {/* Ana İçerik */}
        <div className="flex-1 p-4 md:p-8 overflow-y-auto">
          <div className="max-w-3xl mx-auto">
            {/* Soru */}
            <div className="bg-gray-800 rounded-2xl p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <span className={`px-3 py-1 rounded-full text-sm ${
                  currentQuestion?.difficulty === 'easy' ? 'bg-green-500/20 text-green-400' :
                  currentQuestion?.difficulty === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                  currentQuestion?.difficulty === 'hard' ? 'bg-orange-500/20 text-orange-400' :
                  'bg-purple-500/20 text-purple-400'
                }`}>
                  {currentQuestion?.difficulty === 'easy' ? 'Kolay' :
                   currentQuestion?.difficulty === 'medium' ? 'Orta' :
                   currentQuestion?.difficulty === 'hard' ? 'Zor' : 'Efsane'}
                </span>
                
                <button
                  onClick={toggleFlag}
                  className={`p-2 rounded-lg transition-colors ${
                    flaggedQuestions.has(currentIndex)
                      ? 'bg-yellow-500/20 text-yellow-400'
                      : 'bg-gray-700 text-gray-400 hover:text-yellow-400'
                  }`}
                >
                  <Flag className="h-5 w-5" />
                </button>
              </div>

              <div className="flex items-start gap-3 mb-6">
                <div className="text-white text-lg leading-relaxed flex-1">
                  <MathRenderer text={currentQuestion?.question_text || ''} />
                </div>
                {currentQuestion?.question_text && (
                  <SpeakButton 
                    text={currentQuestion.question_text} 
                    size="md"
                    className="flex-shrink-0 mt-1"
                  />
                )}
              </div>

              {currentQuestion?.question_image_url && (
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
                {currentQuestion && Object.entries(currentQuestion.options).map(([key, value]) => (
                  <button
                    key={key}
                    onClick={() => handleAnswer(key)}
                    className={`w-full p-4 rounded-xl text-left transition-all border-2 ${
                      currentAnswer === key
                        ? 'border-indigo-500 bg-indigo-500/20'
                        : 'border-gray-700 bg-gray-700/50 hover:border-gray-600'
                    }`}
                  >
                    <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full mr-3 ${
                      currentAnswer === key
                        ? 'bg-indigo-500 text-white'
                        : 'bg-gray-600 text-white/70'
                    }`}>
                      {key}
                    </span>
                    <span className="text-white">{value}</span>
                  </button>
                ))}
              </div>

              {/* Cevap Temizle */}
              {currentAnswer && (
                <button
                  onClick={clearAnswer}
                  className="mt-4 text-gray-400 hover:text-white text-sm flex items-center gap-1"
                >
                  <XCircle className="h-4 w-4" />
                  Cevabı Temizle
                </button>
              )}
            </div>

            {/* Navigasyon */}
            <div className="flex justify-between">
              <button
                onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
                disabled={currentIndex === 0}
                className="px-6 py-3 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl transition-colors flex items-center gap-2"
              >
                <ChevronLeft className="h-5 w-5" />
                Önceki
              </button>
              
              <button
                onClick={() => setCurrentIndex(Math.min(questions.length - 1, currentIndex + 1))}
                disabled={currentIndex === questions.length - 1}
                className="px-6 py-3 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl transition-colors flex items-center gap-2"
              >
                Sonraki
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

