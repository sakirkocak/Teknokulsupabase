'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { useProfile, useStudentProfile } from '@/hooks/useProfile'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  BookOpen,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  XCircle,
  Send,
  Loader2,
  Trophy,
  Clock,
  Target,
  RotateCcw,
  HelpCircle
} from 'lucide-react'

interface Question {
  id: string
  question_text: string
  question_type: string
  options: string[] | null
  correct_answer: string
  explanation: string
  difficulty: string
}

interface Answer {
  questionId: string
  answer: string
  isCorrect: boolean | null
  timeSpent: number
}

// Açıklamadan doğru cevabı çıkarmaya çalış
function extractAnswerFromExplanation(explanation: string): string {
  if (!explanation) return ''
  
  // "Timur İmparatorluğu" gibi önemli kelimeleri bulmaya çalış
  // Açıklamada genellikle cevap ilk cümlede veya virgülden önceki kısımda olur
  
  // Önce virgüle kadar olan kısmı dene
  const parts = explanation.split(',')
  if (parts.length > 0) {
    // İlk kısımdan anahtar kelimeleri çıkar
    const firstPart = parts[0]
    // "ile X arasında" veya "X tarihinde" gibi kalıpları bul
    const ileMatch = firstPart.match(/ile\s+([^,]+?)\s+(arasında|İmparatorluğu)/i)
    if (ileMatch) return ileMatch[1].trim()
    
    // Genel olarak ilk kelimeleri al
    const words = firstPart.split(' ').filter(w => w.length > 2)
    if (words.length > 2) {
      return words.slice(0, 3).join(' ')
    }
  }
  
  return ''
}

interface AssignmentResponse {
  id: string
  answers: Answer[]
  score: number
  completed_at: string
  coach_reviewed: boolean
  coach_feedback: string | null
}

export default function SolveAssignmentPage() {
  const params = useParams()
  const assignmentId = params.id as string
  const router = useRouter()
  const { profile } = useProfile()
  const { studentProfile } = useStudentProfile(profile?.id || '')
  const [assignment, setAssignment] = useState<any>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<Answer[]>([])
  const [currentAnswer, setCurrentAnswer] = useState('')
  const [showResult, setShowResult] = useState(false)
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [completed, setCompleted] = useState(false)
  const [startTime, setStartTime] = useState<number>(Date.now())
  const [assignmentResponse, setAssignmentResponse] = useState<AssignmentResponse | null>(null)
  const [viewMode, setViewMode] = useState<'solve' | 'results'>('solve')
  const supabase = createClient()

  useEffect(() => {
    if (assignmentId && studentProfile?.id) {
      loadAssignment()
    }
  }, [assignmentId, studentProfile?.id])

  async function loadAssignment() {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('assignments')
        .select('*')
        .eq('id', assignmentId)
        .single()

      if (error) throw error
      
      setAssignment(data)
      setQuestions(data.questions || [])

      // Check if already completed
      const { data: response } = await supabase
        .from('assignment_responses')
        .select('*')
        .eq('assignment_id', assignmentId)
        .eq('student_id', studentProfile?.id)
        .single()

      if (response) {
        setAnswers(response.answers || [])
        setAssignmentResponse(response)
        setCompleted(true)
        // Tamamlanmış ödevler için sonuç moduna geç
        if (data.status === 'completed' || data.status === 'reviewed') {
          setViewMode('results')
        }
      }

      // Update status to in_progress if pending
      if (data.status === 'pending') {
        await supabase
          .from('assignments')
          .update({ status: 'in_progress' })
          .eq('id', assignmentId)
      }
    } catch (error) {
      console.error('Error loading assignment:', error)
    } finally {
      setLoading(false)
    }
  }

  function checkAnswer() {
    if (!currentAnswer) return

    const question = questions[currentIndex]
    let correct = false
    
    // correct_answer null veya boş ise açıklamadan çıkar
    const correctAnswer = question.correct_answer || extractAnswerFromExplanation(question.explanation) || ''

    if (question.question_type === 'multiple_choice') {
      // A, B, C, D formatında kontrol
      correct = currentAnswer.charAt(0).toUpperCase() === correctAnswer.charAt(0).toUpperCase()
    } else if (question.question_type === 'true_false') {
      correct = currentAnswer.toLowerCase() === correctAnswer.toLowerCase()
    } else {
      // Açık uçlu ve boşluk doldurma için esnek karşılaştırma
      const userAnswer = currentAnswer.toLowerCase().trim()
      const expectedAnswer = correctAnswer.toLowerCase().trim()
      
      // Tam eşleşme veya içerme kontrolü
      correct = userAnswer === expectedAnswer || 
                expectedAnswer.includes(userAnswer) || 
                userAnswer.includes(expectedAnswer)
    }

    setIsCorrect(correct)
    setShowResult(true)

    // Cevabı kaydet
    const timeSpent = Math.round((Date.now() - startTime) / 1000)
    const newAnswer: Answer = {
      questionId: question.id,
      answer: currentAnswer,
      isCorrect: correct,
      timeSpent,
    }

    setAnswers([...answers.filter(a => a.questionId !== question.id), newAnswer])
  }

  function nextQuestion() {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1)
      setCurrentAnswer('')
      setShowResult(false)
      setIsCorrect(null)
      setStartTime(Date.now())
    }
  }

  function prevQuestion() {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
      const prevAnswer = answers.find(a => a.questionId === questions[currentIndex - 1].id)
      setCurrentAnswer(prevAnswer?.answer || '')
      setShowResult(false)
      setIsCorrect(null)
      setStartTime(Date.now())
    }
  }

  async function handleSubmit() {
    if (answers.length !== questions.length) {
      alert('Lütfen tüm soruları cevaplayın')
      return
    }

    setSubmitting(true)

    try {
      const correctCount = answers.filter(a => a.isCorrect).length
      const score = (correctCount / questions.length) * 100

      // Save response
      const { error: responseError } = await supabase
        .from('assignment_responses')
        .insert({
          assignment_id: assignmentId,
          student_id: studentProfile?.id,
          answers,
          score,
          completed_at: new Date().toISOString(),
        })

      if (responseError) throw responseError

      // Update assignment status
      await supabase
        .from('assignments')
        .update({ status: 'completed' })
        .eq('id', assignmentId)

      // Save individual results for stats
      for (const answer of answers) {
        const question = questions.find(q => q.id === answer.questionId)
        if (question) {
          await supabase
            .from('question_results')
            .insert({
              student_id: studentProfile?.id,
              question_id: answer.questionId,
              is_correct: answer.isCorrect,
              time_spent: answer.timeSpent,
            })
        }
      }

      // Koça bildirim gönder
      if (assignment?.coach_id) {
        const { data: coachProfile } = await supabase
          .from('teacher_profiles')
          .select('user_id')
          .eq('id', assignment.coach_id)
          .single()

        if (coachProfile?.user_id) {
          await supabase
            .from('notifications')
            .insert({
              user_id: coachProfile.user_id,
              title: 'Ödev Tamamlandı',
              body: `${profile?.full_name || 'Öğrenciniz'} "${assignment.title}" ödevini tamamladı. Puan: %${score.toFixed(0)}`,
              type: 'assignment',
              data: { link: '/koc/odev-sonuclari' },
            })
        }
      }

      setCompleted(true)
    } catch (error: any) {
      alert('Hata: ' + error.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <DashboardLayout role="ogrenci">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
        </div>
      </DashboardLayout>
    )
  }

  const currentQuestion = questions[currentIndex]
  const correctCount = answers.filter(a => a.isCorrect).length
  const progress = (answers.length / questions.length) * 100

  // Sonuç görünümü (tamamlanmış ödevler için)
  if (viewMode === 'results' && assignmentResponse) {
    const score = assignmentResponse.score || (correctCount / questions.length) * 100
    const savedAnswers = assignmentResponse.answers || answers
    const wrongAnswers = savedAnswers.filter(a => !a.isCorrect)
    
    return (
      <DashboardLayout role="ogrenci">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/ogrenci/odevler')}
              className="btn btn-ghost"
            >
              <ChevronLeft className="w-5 h-5" />
              Geri
            </button>
            <div>
              <h1 className="text-xl font-bold text-surface-900">{assignment?.title}</h1>
              <p className="text-sm text-surface-500">Ödev Sonuçları</p>
            </div>
          </div>

          {/* Skor Kartı */}
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="card p-6"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                  score >= 70 ? 'bg-green-100' : score >= 50 ? 'bg-yellow-100' : 'bg-red-100'
                }`}>
                  <Trophy className={`w-8 h-8 ${
                    score >= 70 ? 'text-green-600' : score >= 50 ? 'text-yellow-600' : 'text-red-600'
                  }`} />
                </div>
                <div>
                  <p className="text-3xl font-bold text-surface-900">%{score.toFixed(0)}</p>
                  <p className="text-surface-500">Başarı Oranı</p>
                </div>
              </div>
              
              <div className="flex gap-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">{savedAnswers.filter(a => a.isCorrect).length}</p>
                  <p className="text-sm text-surface-500">Doğru</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-red-600">{wrongAnswers.length}</p>
                  <p className="text-sm text-surface-500">Yanlış</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-surface-600">{questions.length}</p>
                  <p className="text-sm text-surface-500">Toplam</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Koç Geri Bildirimi */}
          {assignmentResponse.coach_reviewed && (
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="card p-6 border-l-4 border-l-primary-500 bg-primary-50/30"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-5 h-5 text-primary-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-surface-900 mb-1">Koçunuzdan Geri Bildirim</h3>
                  <p className="text-surface-700">
                    {assignmentResponse.coach_feedback || 'Ödeviniz incelendi.'}
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Yanlış Cevaplar */}
          {wrongAnswers.length > 0 && (
            <div className="card p-6">
              <h2 className="font-semibold text-surface-900 mb-4 flex items-center gap-2">
                <XCircle className="w-5 h-5 text-red-500" />
                Yanlış Cevaplarınız ({wrongAnswers.length})
              </h2>
              <div className="space-y-4">
                {wrongAnswers.map((answer, i) => {
                  const question = questions.find(q => q.id === answer.questionId)
                  if (!question) return null
                  
                  return (
                    <div key={answer.questionId} className="p-4 bg-red-50 rounded-xl">
                      <p className="font-medium text-surface-900 mb-2">
                        {i + 1}. {question.question_text}
                      </p>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-red-600 font-medium">Sizin cevabınız: </span>
                          <span className="text-surface-700">{answer.answer}</span>
                        </div>
                        <div>
                          <span className="text-green-600 font-medium">Doğru cevap: </span>
                          <span className="text-surface-700">{question.correct_answer || 'Açıklamaya bakınız'}</span>
                        </div>
                      </div>
                      {question.explanation && (
                        <p className="mt-2 text-sm text-surface-600 bg-white p-2 rounded">
                          <strong>Açıklama:</strong> {question.explanation}
                        </p>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Tüm Cevaplar */}
          <div className="card p-6">
            <h2 className="font-semibold text-surface-900 mb-4">Tüm Cevaplarınız</h2>
            <div className="space-y-3">
              {questions.map((question, i) => {
                const answer = savedAnswers.find(a => a.questionId === question.id)
                const isCorrectAnswer = answer?.isCorrect
                
                return (
                  <div 
                    key={question.id} 
                    className={`p-3 rounded-lg flex items-center justify-between ${
                      isCorrectAnswer ? 'bg-green-50' : 'bg-red-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                        isCorrectAnswer ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                      }`}>
                        {i + 1}
                      </span>
                      <span className="text-surface-700 line-clamp-1">{question.question_text}</span>
                    </div>
                    {isCorrectAnswer ? (
                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  // Yeni tamamlama ekranı (ödev çözüldükten hemen sonra)
  if (completed && !assignmentResponse) {
    const score = (correctCount / questions.length) * 100
    return (
      <DashboardLayout role="ogrenci">
        <div className="max-w-2xl mx-auto">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="card p-8 text-center"
          >
            <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
              <Trophy className="w-10 h-10 text-white" />
            </div>
            
            <h1 className="text-2xl font-bold text-surface-900 mb-2">
              Ödev Tamamlandı!
            </h1>
            <p className="text-surface-500 mb-6">{assignment?.title}</p>

            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="p-4 bg-green-50 rounded-xl">
                <p className="text-3xl font-bold text-green-600">{correctCount}</p>
                <p className="text-sm text-green-600">Doğru</p>
              </div>
              <div className="p-4 bg-red-50 rounded-xl">
                <p className="text-3xl font-bold text-red-600">{questions.length - correctCount}</p>
                <p className="text-sm text-red-600">Yanlış</p>
              </div>
              <div className="p-4 bg-primary-50 rounded-xl">
                <p className="text-3xl font-bold text-primary-600">%{score.toFixed(0)}</p>
                <p className="text-sm text-primary-600">Başarı</p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => router.push('/ogrenci/odevler')}
                className="btn btn-outline btn-lg flex-1"
              >
                <ChevronLeft className="w-5 h-5" />
                Ödevlere Dön
              </button>
            </div>
          </motion.div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout role="ogrenci">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.push('/ogrenci/odevler')}
            className="btn btn-ghost"
          >
            <ChevronLeft className="w-5 h-5" />
            Geri
          </button>
          <div className="text-center">
            <h1 className="font-semibold text-surface-900">{assignment?.title}</h1>
            <p className="text-sm text-surface-500">
              Soru {currentIndex + 1} / {questions.length}
            </p>
          </div>
          <div className="w-20" />
        </div>

        {/* Progress */}
        <div className="card p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-surface-500">İlerleme</span>
            <span className="text-sm font-medium text-surface-900">
              {answers.length}/{questions.length} cevaplandı
            </span>
          </div>
          <div className="h-2 bg-surface-100 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-primary-500 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Question Card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="card p-6"
          >
            {/* Question Header */}
            <div className="flex items-center gap-2 mb-4">
              <span className="w-8 h-8 bg-primary-100 text-primary-600 rounded-lg flex items-center justify-center font-bold text-sm">
                {currentIndex + 1}
              </span>
              <span className={`px-2 py-1 text-xs rounded-full ${
                currentQuestion.difficulty === 'easy' 
                  ? 'bg-green-100 text-green-700' 
                  : currentQuestion.difficulty === 'medium'
                    ? 'bg-yellow-100 text-yellow-700'
                    : 'bg-red-100 text-red-700'
              }`}>
                {currentQuestion.difficulty === 'easy' ? 'Kolay' : currentQuestion.difficulty === 'medium' ? 'Orta' : 'Zor'}
              </span>
            </div>

            {/* Question Text */}
            <p className="text-lg text-surface-900 font-medium mb-6">
              {currentQuestion.question_text}
            </p>

            {/* Answer Options */}
            {currentQuestion.question_type === 'multiple_choice' && currentQuestion.options && (
              <div className="space-y-3 mb-6">
                {currentQuestion.options.map((option, i) => {
                  const letter = option.charAt(0)
                  const isSelected = currentAnswer.charAt(0) === letter
                  const isCorrectOption = showResult && letter === currentQuestion.correct_answer.charAt(0)
                  const isWrongSelected = showResult && isSelected && !isCorrectOption

                  return (
                    <button
                      key={i}
                      onClick={() => !showResult && setCurrentAnswer(letter)}
                      disabled={showResult}
                      className={`w-full p-4 text-left rounded-xl border-2 transition-all ${
                        isCorrectOption
                          ? 'border-green-500 bg-green-50'
                          : isWrongSelected
                            ? 'border-red-500 bg-red-50'
                            : isSelected
                              ? 'border-primary-500 bg-primary-50'
                              : 'border-surface-200 hover:border-surface-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-medium ${
                          isCorrectOption
                            ? 'bg-green-500 text-white'
                            : isWrongSelected
                              ? 'bg-red-500 text-white'
                              : isSelected
                                ? 'bg-primary-500 text-white'
                                : 'bg-surface-100 text-surface-600'
                        }`}>
                          {letter}
                        </div>
                        <span className="flex-1">{option.substring(3)}</span>
                        {isCorrectOption && <CheckCircle className="w-5 h-5 text-green-500" />}
                        {isWrongSelected && <XCircle className="w-5 h-5 text-red-500" />}
                      </div>
                    </button>
                  )
                })}
              </div>
            )}

            {/* True/False */}
            {currentQuestion.question_type === 'true_false' && (
              <div className="flex gap-4 mb-6">
                {['Doğru', 'Yanlış'].map((option) => {
                  const isSelected = currentAnswer === option
                  const isCorrectOption = showResult && option === currentQuestion.correct_answer
                  const isWrongSelected = showResult && isSelected && !isCorrectOption

                  return (
                    <button
                      key={option}
                      onClick={() => !showResult && setCurrentAnswer(option)}
                      disabled={showResult}
                      className={`flex-1 p-4 rounded-xl border-2 transition-all ${
                        isCorrectOption
                          ? 'border-green-500 bg-green-50'
                          : isWrongSelected
                            ? 'border-red-500 bg-red-50'
                            : isSelected
                              ? 'border-primary-500 bg-primary-50'
                              : 'border-surface-200 hover:border-surface-300'
                      }`}
                    >
                      {option}
                    </button>
                  )
                })}
              </div>
            )}

            {/* Open Ended / Fill Blank */}
            {(currentQuestion.question_type === 'open_ended' || currentQuestion.question_type === 'fill_blank') && (
              <div className="mb-6">
                <input
                  type="text"
                  value={currentAnswer}
                  onChange={(e) => !showResult && setCurrentAnswer(e.target.value)}
                  disabled={showResult}
                  className="input w-full"
                  placeholder="Cevabınızı yazın..."
                />
              </div>
            )}

            {/* Check Button */}
            {!showResult && (
              <button
                onClick={checkAnswer}
                disabled={!currentAnswer}
                className="btn btn-primary btn-lg w-full"
              >
                <Target className="w-5 h-5" />
                Kontrol Et
              </button>
            )}

            {/* Result */}
            {showResult && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-4 rounded-xl ${
                  isCorrect ? 'bg-green-50' : 'bg-red-50'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  {isCorrect ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-500" />
                  )}
                  <span className={`font-medium ${isCorrect ? 'text-green-700' : 'text-red-700'}`}>
                    {isCorrect ? 'Doğru!' : 'Yanlış'}
                  </span>
                </div>
                {!isCorrect && (
                  <p className="text-sm text-surface-600 mb-2">
                    <strong>Doğru cevap:</strong> {currentQuestion.correct_answer || 'Açıklamaya bakınız'}
                  </p>
                )}
                <p className="text-sm text-surface-600">
                  <strong>Açıklama:</strong> {currentQuestion.explanation}
                </p>
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex justify-between">
          <button
            onClick={prevQuestion}
            disabled={currentIndex === 0}
            className="btn btn-outline"
          >
            <ChevronLeft className="w-5 h-5" />
            Önceki
          </button>

          {currentIndex === questions.length - 1 && showResult ? (
            <button
              onClick={handleSubmit}
              disabled={submitting || answers.length !== questions.length}
              className="btn btn-primary"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Gönderiliyor...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Tamamla ve Gönder
                </>
              )}
            </button>
          ) : (
            <button
              onClick={nextQuestion}
              disabled={currentIndex === questions.length - 1 || !showResult}
              className="btn btn-primary"
            >
              Sonraki
              <ChevronRight className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}

