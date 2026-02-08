'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import type {
  AnswerOption,
  ExamQuestionForClient,
  ExamBackup,
  SubmitExamResponse,
} from '@/lib/mock-exam/types'
import { STORAGE_KEYS, TIMER_WARNINGS } from '@/lib/mock-exam/constants'

interface UseMockExamOptions {
  examId: string
  slug: string
  questions: ExamQuestionForClient[]
  subjectGroups: Record<string, ExamQuestionForClient[]>
  duration: number // dakika
  onSubmit?: (response: SubmitExamResponse) => void
}

interface UseMockExamReturn {
  // State
  answers: Record<number, AnswerOption | null>
  flagged: Set<number>
  currentQuestion: number
  currentSubject: string
  timeRemaining: number
  tabSwitchCount: number
  isSubmitting: boolean
  isSubmitted: boolean
  timerWarning: 'none' | 'yellow' | 'red' | 'critical'

  // Sorular
  currentQuestionData: ExamQuestionForClient | null
  subjects: string[]
  subjectQuestions: Record<string, ExamQuestionForClient[]>

  // Istatistikler
  answeredCount: number
  totalQuestions: number
  subjectProgress: Record<string, { answered: number; total: number }>

  // Aksiyonlar
  setAnswer: (questionOrder: number, answer: AnswerOption | null) => void
  toggleFlag: (questionOrder: number) => void
  goToQuestion: (questionOrder: number) => void
  goToSubject: (subject: string) => void
  goNext: () => void
  goPrev: () => void
  submitExam: () => Promise<void>
}

export function useMockExam(options: UseMockExamOptions): UseMockExamReturn {
  const { examId, slug, questions, subjectGroups, duration, onSubmit } = options

  // State
  const [answers, setAnswers] = useState<Record<number, AnswerOption | null>>({})
  const [flagged, setFlagged] = useState<Set<number>>(new Set())
  const [currentQuestion, setCurrentQuestion] = useState(1)
  const [currentSubject, setCurrentSubject] = useState('')
  const [timeRemaining, setTimeRemaining] = useState(duration * 60)
  const [tabSwitchCount, setTabSwitchCount] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [startedAt] = useState(Date.now())

  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const backupRef = useRef<NodeJS.Timeout | null>(null)
  const submitLockRef = useRef(false)

  // Ders listesi
  const subjects = Object.keys(subjectGroups)

  // Baslangic: localStorage'dan yedek yukle veya ilk dersi sec
  useEffect(() => {
    const backup = loadBackup(examId)
    if (backup) {
      setAnswers(backup.answers)
      setFlagged(new Set(backup.flagged))
      setCurrentQuestion(backup.currentQuestion)
      setCurrentSubject(backup.currentSubject)
      setTimeRemaining(backup.timeRemaining)
      setTabSwitchCount(backup.tabSwitchCount)
    } else if (subjects.length > 0) {
      setCurrentSubject(subjects[0])
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [examId])

  // Timer
  useEffect(() => {
    if (isSubmitted) return

    timerRef.current = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          // Sure bitti, otomatik gonder
          handleAutoSubmit()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSubmitted])

  // localStorage yedekleme (her 10 saniye)
  useEffect(() => {
    if (isSubmitted) return

    backupRef.current = setInterval(() => {
      saveBackup()
    }, 10000)

    return () => {
      if (backupRef.current) clearInterval(backupRef.current)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [answers, flagged, currentQuestion, currentSubject, timeRemaining, isSubmitted])

  // Tab degistirme algilama
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && !isSubmitted) {
        setTabSwitchCount(prev => prev + 1)
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [isSubmitted])

  // beforeunload uyarisi
  useEffect(() => {
    if (isSubmitted) return

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      saveBackup()
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSubmitted])

  // Timer uyari seviyesi
  const timerWarning = (() => {
    const minutes = timeRemaining / 60
    if (minutes <= TIMER_WARNINGS.CRITICAL) return 'critical' as const
    if (minutes <= TIMER_WARNINGS.RED) return 'red' as const
    if (minutes <= TIMER_WARNINGS.YELLOW) return 'yellow' as const
    return 'none' as const
  })()

  // Mevcut soru
  const currentQuestionData = questions.find(q => q.question_order === currentQuestion) || null

  // Cevaplanmis soru sayisi
  const answeredCount = Object.values(answers).filter(a => a !== null).length
  const totalQuestions = questions.length

  // Ders bazli ilerleme
  const subjectProgress: Record<string, { answered: number; total: number }> = {}
  for (const [subject, qs] of Object.entries(subjectGroups)) {
    const answered = qs.filter(q => answers[q.question_order] !== null && answers[q.question_order] !== undefined).length
    subjectProgress[subject] = { answered, total: qs.length }
  }

  // Aksiyonlar
  const setAnswer = useCallback((questionOrder: number, answer: AnswerOption | null) => {
    setAnswers(prev => ({ ...prev, [questionOrder]: answer }))
  }, [])

  const toggleFlag = useCallback((questionOrder: number) => {
    setFlagged(prev => {
      const next = new Set(prev)
      if (next.has(questionOrder)) {
        next.delete(questionOrder)
      } else {
        next.add(questionOrder)
      }
      return next
    })
  }, [])

  const goToQuestion = useCallback((questionOrder: number) => {
    setCurrentQuestion(questionOrder)
    // Dersi de guncelle
    const q = questions.find(q => q.question_order === questionOrder)
    if (q) setCurrentSubject(q.subject)
  }, [questions])

  const goToSubject = useCallback((subject: string) => {
    setCurrentSubject(subject)
    const firstQ = subjectGroups[subject]?.[0]
    if (firstQ) setCurrentQuestion(firstQ.question_order)
  }, [subjectGroups])

  const goNext = useCallback(() => {
    const currentIdx = questions.findIndex(q => q.question_order === currentQuestion)
    if (currentIdx < questions.length - 1) {
      const nextQ = questions[currentIdx + 1]
      setCurrentQuestion(nextQ.question_order)
      setCurrentSubject(nextQ.subject)
    }
  }, [questions, currentQuestion])

  const goPrev = useCallback(() => {
    const currentIdx = questions.findIndex(q => q.question_order === currentQuestion)
    if (currentIdx > 0) {
      const prevQ = questions[currentIdx - 1]
      setCurrentQuestion(prevQ.question_order)
      setCurrentSubject(prevQ.subject)
    }
  }, [questions, currentQuestion])

  // Submit
  const submitExam = useCallback(async () => {
    if (submitLockRef.current || isSubmitted) return
    submitLockRef.current = true
    setIsSubmitting(true)

    try {
      // Timer durdur
      if (timerRef.current) clearInterval(timerRef.current)
      if (backupRef.current) clearInterval(backupRef.current)

      const timeTaken = Math.floor((Date.now() - startedAt) / 1000)

      // Cevaplari string key'e cevir
      const answersForSubmit: Record<string, AnswerOption | null> = {}
      for (const [order, answer] of Object.entries(answers)) {
        answersForSubmit[order] = answer
      }

      const response = await fetch('/api/mock-exam/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          examId,
          answers: answersForSubmit,
          timeTaken: Math.min(timeTaken, duration * 60 + 30),
          tabSwitchCount,
        }),
      })

      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.error || 'Gonderim basarisiz')
      }

      const result: SubmitExamResponse = await response.json()

      setIsSubmitted(true)
      clearBackup(examId)

      onSubmit?.(result)
    } catch (error) {
      console.error('Submit error:', error)
      submitLockRef.current = false
      throw error
    } finally {
      setIsSubmitting(false)
    }
  }, [answers, examId, duration, startedAt, tabSwitchCount, isSubmitted, onSubmit])

  // Auto-submit (sure bittiginde)
  const handleAutoSubmit = useCallback(() => {
    submitExam().catch(console.error)
  }, [submitExam])

  // Yedekleme fonksiyonlari
  function saveBackup() {
    try {
      const backup: ExamBackup = {
        examId,
        answers,
        flagged: Array.from(flagged),
        currentQuestion,
        currentSubject,
        startedAt,
        timeRemaining,
        tabSwitchCount,
        savedAt: Date.now(),
      }
      localStorage.setItem(
        `${STORAGE_KEYS.EXAM_BACKUP}_${examId}`,
        JSON.stringify(backup)
      )
    } catch {
      // localStorage dolu veya kullanilamamis
    }
  }

  return {
    answers,
    flagged,
    currentQuestion,
    currentSubject,
    timeRemaining,
    tabSwitchCount,
    isSubmitting,
    isSubmitted,
    timerWarning,
    currentQuestionData,
    subjects,
    subjectQuestions: subjectGroups,
    answeredCount,
    totalQuestions,
    subjectProgress,
    setAnswer,
    toggleFlag,
    goToQuestion,
    goToSubject,
    goNext,
    goPrev,
    submitExam,
  }
}

// Yardimci fonksiyonlar
function loadBackup(examId: string): ExamBackup | null {
  try {
    const raw = localStorage.getItem(`${STORAGE_KEYS.EXAM_BACKUP}_${examId}`)
    if (!raw) return null

    const backup: ExamBackup = JSON.parse(raw)

    // 24 saatten eski yedekleri kabul etme
    if (Date.now() - backup.savedAt > 24 * 60 * 60 * 1000) {
      localStorage.removeItem(`${STORAGE_KEYS.EXAM_BACKUP}_${examId}`)
      return null
    }

    return backup
  } catch {
    return null
  }
}

function clearBackup(examId: string) {
  try {
    localStorage.removeItem(`${STORAGE_KEYS.EXAM_BACKUP}_${examId}`)
  } catch {
    // Ignore
  }
}
