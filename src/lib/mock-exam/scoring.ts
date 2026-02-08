// =====================================================
// DENEME DUNYASI - Puanlama Algoritmasi
// =====================================================

import {
  AnswerOption,
  NetBreakdown,
  SubjectNetDetail,
  ExamScoringRule,
  MockExamQuestion
} from './types'
import { EXAM_CONFIGS, SUBJECT_CODE_MAP } from './constants'

interface QuestionWithAnswer {
  question_order: number
  subject: string
  correct_answer: AnswerOption
}

interface ScoringInput {
  questions: QuestionWithAnswer[]
  answers: Record<string, AnswerOption | null> // { "1": "A", "2": null, ... }
  examType: string
  scoringRule?: ExamScoringRule | null
}

export interface ScoringResult {
  score: number
  totalNet: number
  netBreakdown: NetBreakdown
  totalCorrect: number
  totalWrong: number
  totalEmpty: number
}

/**
 * Sinav puanini hesapla
 *
 * Formul:
 * Her ders icin: net = dogru - (yanlis / wrongPenalty)
 * Toplam puan = base_points + SUM(ders_net * ders_katsayisi)
 * Puan = clamp(puan, scoreRange.min, scoreRange.max)
 */
export function calculateScore(input: ScoringInput): ScoringResult {
  const { questions, answers, examType, scoringRule } = input

  // Ders bazli gruplama
  const subjectGroups = new Map<string, QuestionWithAnswer[]>()
  for (const q of questions) {
    const subjectKey = normalizeSubjectKey(q.subject)
    if (!subjectGroups.has(subjectKey)) {
      subjectGroups.set(subjectKey, [])
    }
    subjectGroups.get(subjectKey)!.push(q)
  }

  // Sinav config'i al
  const config = EXAM_CONFIGS[examType]
  const wrongPenalty = config?.wrongPenalty || 3

  // Her ders icin net hesapla
  const netBreakdown: NetBreakdown = {}
  let totalCorrect = 0
  let totalWrong = 0
  let totalEmpty = 0
  let totalNet = 0

  for (const [subjectKey, subjectQuestions] of Array.from(subjectGroups.entries())) {
    let correct = 0
    let wrong = 0
    let empty = 0

    for (const q of subjectQuestions) {
      const userAnswer = answers[String(q.question_order)]
      if (!userAnswer) {
        empty++
      } else if (userAnswer === q.correct_answer) {
        correct++
      } else {
        wrong++
      }
    }

    const net = wrongPenalty > 0
      ? correct - (wrong / wrongPenalty)
      : correct // Goturu yoksa sadece dogru sayisi

    netBreakdown[subjectKey] = {
      dogru: correct,
      yanlis: wrong,
      bos: empty,
      net: Math.round(net * 100) / 100, // 2 ondalik
    }

    totalCorrect += correct
    totalWrong += wrong
    totalEmpty += empty
    totalNet += net
  }

  // Puan hesaplama
  let score: number

  if (scoringRule) {
    // DB'den gelen puanlama kurali ile hesapla
    score = scoringRule.base_points
    for (const [subjectKey, detail] of Object.entries(netBreakdown)) {
      const coefficient = scoringRule.coefficients[subjectKey] || 0
      score += detail.net * coefficient
    }
  } else if (config) {
    // Config'den hesapla
    score = config.basePoints
    for (const subjectConfig of config.subjects) {
      const detail = netBreakdown[subjectConfig.code]
      if (detail) {
        score += detail.net * subjectConfig.coefficient
      }
    }
  } else {
    // Fallback: basit net * 5 + 100
    score = 100 + totalNet * 5
  }

  // Puan araligini sinirla
  const scoreRange = config?.scoreRange || { min: 100, max: 500 }
  score = Math.max(scoreRange.min, Math.min(scoreRange.max, score))
  score = Math.round(score * 100) / 100 // 2 ondalik

  totalNet = Math.round(totalNet * 100) / 100

  return {
    score,
    totalNet,
    netBreakdown,
    totalCorrect,
    totalWrong,
    totalEmpty,
  }
}

/**
 * Ders adini normalize et (buyuk/kucuk harf, bosluk farkliliklar)
 */
function normalizeSubjectKey(subject: string): string {
  // Once direkt map'te ara
  if (SUBJECT_CODE_MAP[subject]) {
    return SUBJECT_CODE_MAP[subject]
  }

  // Kucuk harfe cevir ve bosluk/ozel karakter temizle
  const normalized = subject
    .toLowerCase()
    .replace(/İ/gi, 'i')
    .replace(/ı/g, 'i')
    .replace(/ş/g, 's')
    .replace(/ç/g, 'c')
    .replace(/ö/g, 'o')
    .replace(/ü/g, 'u')
    .replace(/ğ/g, 'g')
    .replace(/\s+/g, '_')
    .trim()

  // Bilinen key'lere eslestir
  if (normalized.includes('turkce')) return 'turkce'
  if (normalized.includes('matematik')) return 'matematik'
  if (normalized.includes('fen')) return 'fen_bilimleri'
  if (normalized.includes('sosyal')) return 'sosyal_bilgiler'
  if (normalized.includes('inkilap')) return 'inkilap_tarihi'
  if (normalized.includes('din')) return 'din_kulturu'
  if (normalized.includes('ingilizce')) return 'ingilizce'

  return normalized
}

/**
 * Siralama ve yuzdelik dilim hesapla
 */
export function calculateRankAndPercentile(
  userScore: number,
  allScores: number[] // Tum sonuclar (buyukten kucuge sirali)
): { rank: number; percentile: number } {
  // Mevcut sonuclara yeni puani ekle
  const scores = [...allScores, userScore].sort((a, b) => b - a)
  const rank = scores.indexOf(userScore) + 1
  const totalParticipants = scores.length
  const percentile = Math.round(((totalParticipants - rank) / totalParticipants) * 100 * 100) / 100

  return { rank, percentile }
}

/**
 * Konu bazli analiz (zayif/guclu konular)
 */
export interface TopicAnalysisResult {
  weakTopics: { topic: string; subject: string; correct: number; total: number; rate: number }[]
  strongTopics: { topic: string; subject: string; correct: number; total: number; rate: number }[]
}

export function analyzeTopics(
  questions: Array<{
    topic_name: string | null
    subject: string
    correct_answer: AnswerOption
    question_order: number
  }>,
  answers: Record<string, AnswerOption | null>
): TopicAnalysisResult {
  // Konu bazli gruplama
  const topicMap = new Map<string, { subject: string; correct: number; total: number }>()

  for (const q of questions) {
    const topicKey = q.topic_name || 'Genel'
    if (!topicMap.has(topicKey)) {
      topicMap.set(topicKey, { subject: q.subject, correct: 0, total: 0 })
    }
    const topic = topicMap.get(topicKey)!
    topic.total++

    const userAnswer = answers[String(q.question_order)]
    if (userAnswer === q.correct_answer) {
      topic.correct++
    }
  }

  // Zayif ve guclu konulari ayir
  const topics = Array.from(topicMap.entries()).map(([topic, data]) => ({
    topic,
    subject: normalizeSubjectKey(data.subject),
    correct: data.correct,
    total: data.total,
    rate: data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0,
  }))

  const weakTopics = topics
    .filter(t => t.rate < 50 && t.total >= 2)
    .sort((a, b) => a.rate - b.rate)

  const strongTopics = topics
    .filter(t => t.rate >= 75 && t.total >= 2)
    .sort((a, b) => b.rate - a.rate)

  return { weakTopics, strongTopics }
}
