// =====================================================
// DENEME DUNYASI - TypeScript Tipleri
// =====================================================

// Sinav turleri
export type ExamType = 'BURSLULUK_2' | 'BURSLULUK_3' | 'BURSLULUK_4' | 'BURSLULUK_5' | 'BURSLULUK_6' | 'BURSLULUK_7' | 'BURSLULUK_8' | 'BURSLULUK_9' | 'BURSLULUK_10' | 'BURSLULUK_11' | 'LGS' | 'TYT' | 'AYT'

// Sinav durumu
export type ExamStatus = 'draft' | 'active' | 'ended'

// Cevap secenekleri
export type AnswerOption = 'A' | 'B' | 'C' | 'D' | 'E'

// Ders kodlari (Typesense ve DB'de kullanilan)
export type SubjectCode = 'turkce' | 'matematik' | 'geometri' | 'fen_bilimleri' | 'sosyal_bilgiler' | 'hayat_bilgisi' | 'inkilap_tarihi' | 'din_kulturu' | 'ingilizce' | 'edebiyat' | 'fizik' | 'kimya' | 'biyoloji' | 'tarih' | 'cografya' | 'felsefe'

// =====================================================
// SINAV MODELLERI
// =====================================================

export interface MockExam {
  id: string
  title: string
  slug: string
  description: string | null
  grade: number
  exam_type: ExamType
  duration: number // dakika
  question_count: number
  subjects: string[] // JSON array
  is_active: boolean
  start_date: string | null
  end_date: string | null
  seo_title: string | null
  seo_desc: string | null
  total_attempts: number
  average_score: number
  created_at: string
  updated_at: string
}

export interface MockExamQuestion {
  id: string
  exam_id: string
  question_id: string
  subject: string
  question_order: number
  topic_name: string | null
  created_at: string
}

// Sinav sonucu (DB'den gelen)
export interface MockExamResult {
  id: string
  exam_id: string
  user_id: string | null
  guest_id: string | null
  student_name: string | null
  score: number
  total_net: number
  time_taken: number // saniye
  answers: Record<string, AnswerOption | null> // { "1": "A", "2": null, ... }
  net_breakdown: NetBreakdown
  rank: number | null
  percentile: number | null
  completed_at: string
}

// Ders bazli net dagilimi
export interface SubjectNetDetail {
  dogru: number
  yanlis: number
  bos: number
  net: number
}

export type NetBreakdown = Record<string, SubjectNetDetail>

// Puanlama kurallari
export interface ExamScoringRule {
  id: string
  exam_type: string
  year: number
  base_points: number
  coefficients: Record<string, number>
  description: string | null
}

// =====================================================
// SINAV COZME STATE
// =====================================================

// Client'a gonderilen soru (correct_answer OLMADAN)
export interface ExamQuestionForClient {
  id: string
  question_id: string
  question_order: number
  subject: string
  topic_name: string | null
  question_text: string
  question_image_url: string | null
  visual_type: string | null
  visual_content: string | null
  options: { A: string; B: string; C: string; D: string; E?: string }
}

// Sinav cozme durumu (localStorage + state)
export interface ExamState {
  examId: string
  slug: string
  answers: Record<number, AnswerOption | null> // { questionOrder: answer }
  flagged: Set<number> // isaretlenen soru numaralari
  currentQuestion: number // aktif soru numarasi (1-based)
  currentSubject: string // aktif ders
  startedAt: number // timestamp
  timeRemaining: number // saniye
  tabSwitchCount: number
  isSubmitted: boolean
}

// localStorage yedegi
export interface ExamBackup {
  examId: string
  answers: Record<number, AnswerOption | null>
  flagged: number[]
  currentQuestion: number
  currentSubject: string
  startedAt: number
  timeRemaining: number
  tabSwitchCount: number
  savedAt: number
}

// =====================================================
// API REQUEST/RESPONSE TIPLERI
// =====================================================

// Submit request
export interface SubmitExamRequest {
  examId: string
  answers: Record<string, AnswerOption | null> // { "1": "A", "2": null, ... }
  timeTaken: number // saniye
  tabSwitchCount: number
  studentName?: string // misafir icin
}

// Submit response
export interface SubmitExamResponse {
  resultId: string
  score: number
  totalNet: number
  netBreakdown: NetBreakdown
  rank: number
  percentile: number
  totalAttempts: number
  xpEarned?: number
}

// Sinav listesi response
export interface ExamListItem {
  id: string
  title: string
  slug: string
  description: string | null
  grade: number
  exam_type: ExamType
  duration: number
  question_count: number
  is_active: boolean
  total_attempts: number
  average_score: number
  subjects: string[]
  start_date: string | null
  end_date: string | null
}

// Sinav detay response (sorular dahil)
export interface ExamDetailResponse {
  exam: MockExam
  questions: ExamQuestionForClient[]
  subjectGroups: Record<string, ExamQuestionForClient[]>
  userPreviousResult?: {
    resultId: string
    score: number
    completedAt: string
  } | null
}

// Siralama response
export interface ExamRankingItem {
  rank: number
  student_name: string
  score: number
  total_net: number
  time_taken: number
  completed_at: string
  is_current_user?: boolean
}

// Sonuc detay response
export interface ExamResultDetail {
  result: MockExamResult
  exam: MockExam
  questions: ExamQuestionWithAnswer[]
  ranking: {
    rank: number
    percentile: number
    totalAttempts: number
  }
}

// Sonuc sayfasi icin soru (cevap anahtari dahil)
export interface ExamQuestionWithAnswer extends ExamQuestionForClient {
  correct_answer: AnswerOption
  user_answer: AnswerOption | null
  is_correct: boolean
  explanation: string | null
}

// =====================================================
// ADMIN TIPLERI
// =====================================================

export interface CreateExamRequest {
  title: string
  slug: string
  description?: string
  grade: number
  exam_type: ExamType
  duration: number
  questionIds: string[] // secilen soru ID'leri (sirali)
  subjects: SubjectQuestionMap[]
  is_active?: boolean
  start_date?: string
  end_date?: string
  seo_title?: string
  seo_desc?: string
}

export interface SubjectQuestionMap {
  subject: string
  questionIds: string[]
}

export interface UpdateExamRequest extends Partial<CreateExamRequest> {
  examId: string
}

// AI soru secimi icin
export interface GenerateExamRequest {
  grade: number
  exam_type: ExamType
  subjectDistribution: Record<string, number> // { "turkce": 20, "matematik": 20, ... }
  difficultyDistribution?: Record<string, number> // { "easy": 30, "medium": 50, "hard": 20 }
}

// =====================================================
// TYPESENSE DOCUMENT TIPLERI
// =====================================================

export interface MockExamDocument {
  id: string
  exam_id: string
  title: string
  slug: string
  description: string
  grade: number
  exam_type: string
  duration: number
  question_count: number
  is_active: boolean
  total_attempts: number
  average_score: number
  subjects: string[]
  start_date: number // unix timestamp
  end_date: number // unix timestamp
  created_at: number
}

export interface MockExamResultDocument {
  id: string
  result_id: string
  exam_id: string
  exam_title: string
  user_id: string
  student_name: string
  score: number
  total_net: number
  time_taken: number
  grade: number
  exam_type: string
  rank: number
  percentile: number
  turkce_net: number
  matematik_net: number
  fen_net: number
  sosyal_net: number
  completed_at: number
}
