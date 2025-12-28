/**
 * Guest Progress Tracker
 * 
 * LocalStorage ile misafir kullanıcıların soru çözme ilerlemesini takip eder.
 * Supabase'e hiç dokunmaz - tamamen client-side!
 */

export interface GuestProgress {
  questionsAnswered: number
  correctAnswers: number
  wrongAnswers: number
  currentStreak: number
  maxStreak: number
  lastActivity: string
  hasSeenSoftPrompt: boolean
  hasSeenHardPrompt: boolean
  promptDismissCount: number
  sessionStarted: string
  solvedQuestionIds: string[]
}

const STORAGE_KEY = 'teknokul_guest_progress'
const SOFT_PROMPT_THRESHOLD = 5  // 5 soru sonra soft prompt
const HARD_PROMPT_THRESHOLD = 8  // 8 soru sonra hard prompt

/**
 * Varsayılan guest progress
 */
function getDefaultProgress(): GuestProgress {
  return {
    questionsAnswered: 0,
    correctAnswers: 0,
    wrongAnswers: 0,
    currentStreak: 0,
    maxStreak: 0,
    lastActivity: new Date().toISOString(),
    hasSeenSoftPrompt: false,
    hasSeenHardPrompt: false,
    promptDismissCount: 0,
    sessionStarted: new Date().toISOString(),
    solvedQuestionIds: []
  }
}

/**
 * Guest progress'i localStorage'dan al
 */
export function getGuestProgress(): GuestProgress {
  if (typeof window === 'undefined') return getDefaultProgress()
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return getDefaultProgress()
    
    const progress = JSON.parse(stored) as GuestProgress
    return progress
  } catch {
    return getDefaultProgress()
  }
}

/**
 * Guest progress'i localStorage'a kaydet
 */
export function saveGuestProgress(progress: GuestProgress): void {
  if (typeof window === 'undefined') return
  
  try {
    progress.lastActivity = new Date().toISOString()
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress))
  } catch (error) {
    console.error('Failed to save guest progress:', error)
  }
}

/**
 * Soru cevaplandığında çağır
 */
export function recordAnswer(questionId: string, isCorrect: boolean): GuestProgress {
  const progress = getGuestProgress()
  
  // Aynı soruyu tekrar çözmesini engelle
  if (progress.solvedQuestionIds.includes(questionId)) {
    return progress
  }
  
  progress.questionsAnswered++
  progress.solvedQuestionIds.push(questionId)
  
  if (isCorrect) {
    progress.correctAnswers++
    progress.currentStreak++
    if (progress.currentStreak > progress.maxStreak) {
      progress.maxStreak = progress.currentStreak
    }
  } else {
    progress.wrongAnswers++
    progress.currentStreak = 0
  }
  
  saveGuestProgress(progress)
  return progress
}

/**
 * Soft prompt gösterilmeli mi? (5 soru)
 */
export function shouldShowSoftPrompt(): boolean {
  const progress = getGuestProgress()
  return progress.questionsAnswered >= SOFT_PROMPT_THRESHOLD && !progress.hasSeenSoftPrompt
}

/**
 * Hard prompt gösterilmeli mi? (8 soru)
 */
export function shouldShowHardPrompt(): boolean {
  const progress = getGuestProgress()
  return progress.questionsAnswered >= HARD_PROMPT_THRESHOLD && !progress.hasSeenHardPrompt
}

/**
 * Soft prompt görüldü olarak işaretle
 */
export function markSoftPromptSeen(): void {
  const progress = getGuestProgress()
  progress.hasSeenSoftPrompt = true
  progress.promptDismissCount++
  saveGuestProgress(progress)
}

/**
 * Hard prompt görüldü olarak işaretle
 */
export function markHardPromptSeen(): void {
  const progress = getGuestProgress()
  progress.hasSeenHardPrompt = true
  saveGuestProgress(progress)
}

/**
 * Devam edebilir mi? (Hard prompt'tan sonra block)
 */
export function canContinueSolving(): boolean {
  const progress = getGuestProgress()
  // Hard prompt görüldüyse ve dismiss edildiyse artık çözemez
  return !progress.hasSeenHardPrompt || progress.promptDismissCount < 2
}

/**
 * İstatistikleri al
 */
export function getGuestStats(): {
  total: number
  correct: number
  wrong: number
  accuracy: number
  streak: number
  maxStreak: number
} {
  const progress = getGuestProgress()
  const accuracy = progress.questionsAnswered > 0 
    ? Math.round((progress.correctAnswers / progress.questionsAnswered) * 100)
    : 0
    
  return {
    total: progress.questionsAnswered,
    correct: progress.correctAnswers,
    wrong: progress.wrongAnswers,
    accuracy,
    streak: progress.currentStreak,
    maxStreak: progress.maxStreak
  }
}

/**
 * Progress'i sıfırla (test için)
 */
export function resetGuestProgress(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(STORAGE_KEY)
}

/**
 * Kalan soru hakkı
 */
export function getRemainingQuestions(): number {
  const progress = getGuestProgress()
  if (progress.hasSeenHardPrompt) return 0
  if (progress.hasSeenSoftPrompt) return HARD_PROMPT_THRESHOLD - progress.questionsAnswered
  return SOFT_PROMPT_THRESHOLD - progress.questionsAnswered
}
