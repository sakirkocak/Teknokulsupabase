// =====================================================
// GAMİFİCATİON CORE - XP, Seviye, Rozet Hesaplama
// =====================================================

// Rozet Kategorileri
export type BadgeCategory = 'soru' | 'streak' | 'basari' | 'hiz' | 'liderlik' | 'ders' | 'ai_koc'

// Rozet Tipi
export interface Badge {
  id: string
  name: string
  description: string
  icon: string
  category: BadgeCategory
  requirement_type: string
  requirement_value: number
  xp_reward: number
  color: string
}

// Seviye Tipi
export interface Level {
  level: number
  name: string
  minXP: number
  maxXP: number
  icon: string
  color: string
}

// XP Kazanım Kaynağı
export type XPSource = 
  | 'question_correct' 
  | 'question_wrong' 
  | 'streak_bonus' 
  | 'badge_earned' 
  | 'challenge_completed'
  | 'level_up'

// XP Geçmişi
export interface XPHistoryEntry {
  id: string
  amount: number
  source: XPSource
  description: string
  created_at: string
}

// =====================================================
// SEVİYE SİSTEMİ
// =====================================================

export const LEVELS: Level[] = [
  { level: 1, name: 'Çaylak', minXP: 0, maxXP: 99, icon: '🌱', color: 'text-green-500' },
  { level: 2, name: 'Çaylak', minXP: 100, maxXP: 199, icon: '🌱', color: 'text-green-500' },
  { level: 3, name: 'Çaylak', minXP: 200, maxXP: 299, icon: '🌱', color: 'text-green-500' },
  { level: 4, name: 'Çaylak', minXP: 300, maxXP: 399, icon: '🌱', color: 'text-green-500' },
  { level: 5, name: 'Öğrenci', minXP: 400, maxXP: 599, icon: '📖', color: 'text-blue-500' },
  { level: 6, name: 'Öğrenci', minXP: 600, maxXP: 799, icon: '📖', color: 'text-blue-500' },
  { level: 7, name: 'Öğrenci', minXP: 800, maxXP: 999, icon: '📖', color: 'text-blue-500' },
  { level: 8, name: 'Öğrenci', minXP: 1000, maxXP: 1249, icon: '📖', color: 'text-blue-500' },
  { level: 9, name: 'Öğrenci', minXP: 1250, maxXP: 1499, icon: '📖', color: 'text-blue-500' },
  { level: 10, name: 'Usta', minXP: 1500, maxXP: 1999, icon: '⭐', color: 'text-yellow-500' },
  { level: 11, name: 'Usta', minXP: 2000, maxXP: 2499, icon: '⭐', color: 'text-yellow-500' },
  { level: 12, name: 'Usta', minXP: 2500, maxXP: 2999, icon: '⭐', color: 'text-yellow-500' },
  { level: 13, name: 'Usta', minXP: 3000, maxXP: 3499, icon: '⭐', color: 'text-yellow-500' },
  { level: 14, name: 'Usta', minXP: 3500, maxXP: 3999, icon: '⭐', color: 'text-yellow-500' },
  { level: 15, name: 'Usta', minXP: 4000, maxXP: 4499, icon: '⭐', color: 'text-yellow-500' },
  { level: 16, name: 'Usta', minXP: 4500, maxXP: 4999, icon: '⭐', color: 'text-yellow-500' },
  { level: 17, name: 'Usta', minXP: 5000, maxXP: 5999, icon: '⭐', color: 'text-yellow-500' },
  { level: 18, name: 'Usta', minXP: 6000, maxXP: 6999, icon: '⭐', color: 'text-yellow-500' },
  { level: 19, name: 'Usta', minXP: 7000, maxXP: 7999, icon: '⭐', color: 'text-yellow-500' },
  { level: 20, name: 'Efsane', minXP: 8000, maxXP: 9999, icon: '🔥', color: 'text-orange-500' },
  { level: 25, name: 'Efsane', minXP: 10000, maxXP: 14999, icon: '🔥', color: 'text-orange-500' },
  { level: 30, name: 'Efsane', minXP: 15000, maxXP: 19999, icon: '🔥', color: 'text-orange-500' },
  { level: 35, name: 'Uzman', minXP: 20000, maxXP: 29999, icon: '💎', color: 'text-purple-500' },
  { level: 40, name: 'Uzman', minXP: 30000, maxXP: 39999, icon: '💎', color: 'text-purple-500' },
  { level: 45, name: 'Uzman', minXP: 40000, maxXP: 49999, icon: '💎', color: 'text-purple-500' },
  { level: 50, name: 'Dahi', minXP: 50000, maxXP: 74999, icon: '🧠', color: 'text-indigo-500' },
  { level: 60, name: 'Dahi', minXP: 75000, maxXP: 99999, icon: '🧠', color: 'text-indigo-500' },
  { level: 70, name: 'Dahi', minXP: 100000, maxXP: 124999, icon: '🧠', color: 'text-indigo-500' },
  { level: 80, name: 'Usta Dahi', minXP: 125000, maxXP: 149999, icon: '👑', color: 'text-amber-500' },
  { level: 90, name: 'Usta Dahi', minXP: 150000, maxXP: 199999, icon: '👑', color: 'text-amber-500' },
  { level: 100, name: 'GOAT', minXP: 200000, maxXP: Infinity, icon: '🐐', color: 'text-rose-500' },
]

/**
 * XP'ye göre seviye hesapla
 */
export function calculateLevel(xp: number): Level {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (xp >= LEVELS[i].minXP) {
      return LEVELS[i]
    }
  }
  return LEVELS[0]
}

/**
 * Seviye atlama için gereken XP
 */
export function getXPForNextLevel(currentXP: number): { needed: number; progress: number; nextLevel: Level | null } {
  const currentLevel = calculateLevel(currentXP)
  const currentIndex = LEVELS.findIndex(l => l.level === currentLevel.level)
  const nextLevel = currentIndex < LEVELS.length - 1 ? LEVELS[currentIndex + 1] : null
  
  if (!nextLevel) {
    return { needed: 0, progress: 100, nextLevel: null }
  }
  
  const xpInCurrentLevel = currentXP - currentLevel.minXP
  const xpNeededForLevel = nextLevel.minXP - currentLevel.minXP
  const progress = Math.min(100, Math.round((xpInCurrentLevel / xpNeededForLevel) * 100))
  
  return {
    needed: nextLevel.minXP - currentXP,
    progress,
    nextLevel
  }
}

// =====================================================
// XP KAZANIM SİSTEMİ
// =====================================================

export const XP_REWARDS = {
  CORRECT_ANSWER: 10,
  WRONG_ANSWER: 2, // Katılım puanı
  STREAK_BONUS_BASE: 5,
  CHALLENGE_EASY: 20,
  CHALLENGE_MEDIUM: 35,
  CHALLENGE_HARD: 50,
} as const

/**
 * Streak bonusu hesapla
 */
export function calculateStreakBonus(streakDays: number): number {
  if (streakDays <= 2) return 5
  if (streakDays <= 6) return 10
  if (streakDays <= 13) return 15
  if (streakDays <= 29) return 25
  return 50
}

/**
 * XP kazanım açıklaması oluştur
 */
export function getXPDescription(source: XPSource, extra?: string): string {
  switch (source) {
    case 'question_correct':
      return 'Doğru cevap'
    case 'question_wrong':
      return 'Soru çözme katılımı'
    case 'streak_bonus':
      return `Günlük seri bonusu${extra ? ` (${extra} gün)` : ''}`
    case 'badge_earned':
      return `Rozet kazanıldı${extra ? `: ${extra}` : ''}`
    case 'challenge_completed':
      return `Görev tamamlandı${extra ? `: ${extra}` : ''}`
    case 'level_up':
      return `Seviye atlandı${extra ? `: ${extra}` : ''}`
    default:
      return 'XP kazanıldı'
  }
}

// =====================================================
// ROZET SİSTEMİ
// =====================================================

export const ALL_BADGES: Badge[] = [
  // Soru Rozetleri
  { id: 'first_question', name: 'İlk Adım', description: 'İlk soruyu çöz', icon: '🌟', category: 'soru', requirement_type: 'total_questions', requirement_value: 1, xp_reward: 10, color: 'from-yellow-400 to-amber-500' },
  { id: 'questions_10', name: 'Yeni Başlangıç', description: '10 soru çöz', icon: '📘', category: 'soru', requirement_type: 'total_questions', requirement_value: 10, xp_reward: 25, color: 'from-blue-400 to-blue-500' },
  { id: 'questions_50', name: 'Azimli', description: '50 soru çöz', icon: '💪', category: 'soru', requirement_type: 'total_questions', requirement_value: 50, xp_reward: 50, color: 'from-orange-400 to-orange-500' },
  { id: 'questions_100', name: 'Çalışkan', description: '100 soru çöz', icon: '📖', category: 'soru', requirement_type: 'total_questions', requirement_value: 100, xp_reward: 100, color: 'from-green-400 to-green-500' },
  { id: 'questions_500', name: 'Soru Makinesi', description: '500 soru çöz', icon: '🚀', category: 'soru', requirement_type: 'total_questions', requirement_value: 500, xp_reward: 250, color: 'from-purple-400 to-purple-500' },
  { id: 'questions_1000', name: 'Efsane', description: '1000 soru çöz', icon: '🏆', category: 'soru', requirement_type: 'total_questions', requirement_value: 1000, xp_reward: 500, color: 'from-amber-400 to-yellow-500' },
  { id: 'questions_5000', name: 'Titanik', description: '5000 soru çöz', icon: '💫', category: 'soru', requirement_type: 'total_questions', requirement_value: 5000, xp_reward: 1000, color: 'from-rose-400 to-pink-500' },
  
  // Streak Rozetleri
  { id: 'streak_3', name: '3 Gün Seri', description: '3 gün üst üste soru çöz', icon: '🔥', category: 'streak', requirement_type: 'streak_days', requirement_value: 3, xp_reward: 30, color: 'from-orange-400 to-red-500' },
  { id: 'streak_7', name: 'Haftalık Seri', description: '7 gün üst üste soru çöz', icon: '🔥', category: 'streak', requirement_type: 'streak_days', requirement_value: 7, xp_reward: 75, color: 'from-orange-500 to-red-600' },
  { id: 'streak_14', name: '2 Haftalık Seri', description: '14 gün üst üste soru çöz', icon: '🔥', category: 'streak', requirement_type: 'streak_days', requirement_value: 14, xp_reward: 150, color: 'from-red-500 to-rose-600' },
  { id: 'streak_30', name: 'Aylık Seri', description: '30 gün üst üste soru çöz', icon: '🌟', category: 'streak', requirement_type: 'streak_days', requirement_value: 30, xp_reward: 500, color: 'from-amber-500 to-orange-600' },
  { id: 'streak_100', name: '100 Gün Efsane', description: '100 gün üst üste soru çöz', icon: '👑', category: 'streak', requirement_type: 'streak_days', requirement_value: 100, xp_reward: 2000, color: 'from-yellow-400 to-amber-500' },
  
  // Başarı Rozetleri
  { id: 'accuracy_70', name: 'Başarılı', description: '%70+ başarı oranı (min 50 soru)', icon: '🎯', category: 'basari', requirement_type: 'correct_rate_70', requirement_value: 50, xp_reward: 75, color: 'from-green-400 to-emerald-500' },
  { id: 'accuracy_80', name: 'Usta', description: '%80+ başarı oranı (min 100 soru)', icon: '⭐', category: 'basari', requirement_type: 'correct_rate_80', requirement_value: 100, xp_reward: 150, color: 'from-yellow-400 to-amber-500' },
  { id: 'accuracy_90', name: 'Uzman', description: '%90+ başarı oranı (min 200 soru)', icon: '💎', category: 'basari', requirement_type: 'correct_rate_90', requirement_value: 200, xp_reward: 300, color: 'from-purple-400 to-violet-500' },
  { id: 'accuracy_95', name: 'Mükemmel', description: '%95+ başarı oranı (min 500 soru)', icon: '👑', category: 'basari', requirement_type: 'correct_rate_95', requirement_value: 500, xp_reward: 1000, color: 'from-amber-400 to-yellow-500' },
  
  // Hız Rozetleri
  { id: 'speed_5', name: 'Hızlı', description: '30 saniyede 5 doğru cevap', icon: '⚡', category: 'hiz', requirement_type: 'speed_5_30', requirement_value: 5, xp_reward: 50, color: 'from-cyan-400 to-blue-500' },
  { id: 'speed_10', name: 'Şimşek', description: '60 saniyede 10 doğru cevap', icon: '⚡', category: 'hiz', requirement_type: 'speed_10_60', requirement_value: 10, xp_reward: 100, color: 'from-blue-400 to-indigo-500' },
  { id: 'speed_20', name: 'Işık Hızı', description: '120 saniyede 20 doğru cevap', icon: '⚡', category: 'hiz', requirement_type: 'speed_20_120', requirement_value: 20, xp_reward: 200, color: 'from-indigo-400 to-purple-500' },
  
  // Liderlik Rozetleri
  { id: 'rank_100', name: 'Top 100', description: 'Liderlikte ilk 100e gir', icon: '🏅', category: 'liderlik', requirement_type: 'leaderboard_rank', requirement_value: 100, xp_reward: 100, color: 'from-amber-400 to-orange-500' },
  { id: 'rank_50', name: 'Top 50', description: 'Liderlikte ilk 50ye gir', icon: '🥉', category: 'liderlik', requirement_type: 'leaderboard_rank', requirement_value: 50, xp_reward: 200, color: 'from-orange-400 to-amber-600' },
  { id: 'rank_10', name: 'Top 10', description: 'Liderlikte ilk 10a gir', icon: '🥈', category: 'liderlik', requirement_type: 'leaderboard_rank', requirement_value: 10, xp_reward: 500, color: 'from-gray-300 to-gray-400' },
  { id: 'rank_1', name: 'Şampiyon', description: 'Liderlikte 1. ol', icon: '👑', category: 'liderlik', requirement_type: 'leaderboard_rank', requirement_value: 1, xp_reward: 1000, color: 'from-yellow-400 to-amber-500' },
  
  // Ders Rozetleri
  { id: 'math_100', name: 'Matematik Aşığı', description: 'Matematikten 100 puan topla', icon: '📐', category: 'ders', requirement_type: 'subject_matematik', requirement_value: 100, xp_reward: 50, color: 'from-blue-400 to-indigo-500' },
  { id: 'math_500', name: 'Matematik Ustası', description: 'Matematikten 500 puan topla', icon: '📐', category: 'ders', requirement_type: 'subject_matematik', requirement_value: 500, xp_reward: 150, color: 'from-blue-500 to-indigo-600' },
  { id: 'turkish_100', name: 'Türkçe Aşığı', description: 'Türkçeden 100 puan topla', icon: '📖', category: 'ders', requirement_type: 'subject_turkce', requirement_value: 100, xp_reward: 50, color: 'from-red-400 to-pink-500' },
  { id: 'turkish_500', name: 'Türkçe Ustası', description: 'Türkçeden 500 puan topla', icon: '📖', category: 'ders', requirement_type: 'subject_turkce', requirement_value: 500, xp_reward: 150, color: 'from-red-500 to-pink-600' },
  { id: 'science_100', name: 'Fen Aşığı', description: 'Fen Bilimlerinden 100 puan topla', icon: '🔬', category: 'ders', requirement_type: 'subject_fen', requirement_value: 100, xp_reward: 50, color: 'from-green-400 to-emerald-500' },
  { id: 'science_500', name: 'Fen Ustası', description: 'Fen Bilimlerinden 500 puan topla', icon: '🔬', category: 'ders', requirement_type: 'subject_fen', requirement_value: 500, xp_reward: 150, color: 'from-green-500 to-emerald-600' },
  { id: 'social_100', name: 'Sosyal Aşığı', description: 'Sosyal Bilgilerden 100 puan topla', icon: '🌍', category: 'ders', requirement_type: 'subject_sosyal', requirement_value: 100, xp_reward: 50, color: 'from-amber-400 to-orange-500' },
  { id: 'social_500', name: 'Sosyal Ustası', description: 'Sosyal Bilgilerden 500 puan topla', icon: '🌍', category: 'ders', requirement_type: 'subject_sosyal', requirement_value: 500, xp_reward: 150, color: 'from-amber-500 to-orange-600' },
  
  // AI Koç Rozetleri
  { id: 'ai_student', name: 'AI Öğrencisi', description: 'AI Koç ile ilk sohbeti yap', icon: '🤖', category: 'ai_koc', requirement_type: 'ai_first_chat', requirement_value: 1, xp_reward: 25, color: 'from-violet-400 to-purple-500' },
  { id: 'ai_curious', name: 'Meraklı Öğrenci', description: 'AI Koç ile 10 sohbet yap', icon: '💬', category: 'ai_koc', requirement_type: 'ai_chat_count', requirement_value: 10, xp_reward: 50, color: 'from-purple-400 to-violet-500' },
  { id: 'ai_improver', name: 'Gelişim Odaklı', description: '5 AI Koç görevi tamamla', icon: '📈', category: 'ai_koc', requirement_type: 'ai_tasks_completed', requirement_value: 5, xp_reward: 100, color: 'from-cyan-400 to-blue-500' },
  { id: 'ai_focused', name: 'Odaklanmış', description: '7 gün üst üste AI görevi tamamla', icon: '🎯', category: 'ai_koc', requirement_type: 'ai_task_streak', requirement_value: 7, xp_reward: 200, color: 'from-emerald-400 to-green-500' },
  { id: 'ai_favorite', name: 'AI Koç Hayranı', description: '30 gün AI Koç ile etkileşim kur', icon: '⭐', category: 'ai_koc', requirement_type: 'ai_interaction_days', requirement_value: 30, xp_reward: 500, color: 'from-yellow-400 to-amber-500' },
  { id: 'ai_master', name: 'AI Koç Ustası', description: '20 AI Koç görevi tamamla', icon: '👑', category: 'ai_koc', requirement_type: 'ai_tasks_completed', requirement_value: 20, xp_reward: 300, color: 'from-amber-400 to-yellow-500' },
]

/**
 * Rozet ID'ye göre rozet bul
 */
export function getBadgeById(id: string): Badge | undefined {
  return ALL_BADGES.find(b => b.id === id)
}

/**
 * Kategoriye göre rozetleri filtrele
 */
export function getBadgesByCategory(category: BadgeCategory): Badge[] {
  return ALL_BADGES.filter(b => b.category === category)
}

/**
 * Kullanıcı istatistiklerine göre kazanılabilir rozetleri kontrol et
 */
export interface UserStats {
  total_questions: number
  total_correct: number
  current_streak: number
  max_streak: number
  leaderboard_rank?: number
  subject_points?: Record<string, number>
}

export function checkEarnableBadges(stats: UserStats, earnedBadgeIds: string[]): Badge[] {
  const earnableBadges: Badge[] = []
  
  for (const badge of ALL_BADGES) {
    // Zaten kazanılmış mı?
    if (earnedBadgeIds.includes(badge.id)) continue
    
    let earned = false
    const correctRate = stats.total_questions > 0 
      ? (stats.total_correct / stats.total_questions) * 100 
      : 0
    
    switch (badge.requirement_type) {
      case 'total_questions':
        earned = stats.total_questions >= badge.requirement_value
        break
        
      case 'streak_days':
        earned = stats.max_streak >= badge.requirement_value
        break
        
      case 'correct_rate_70':
        earned = correctRate >= 70 && stats.total_questions >= badge.requirement_value
        break
        
      case 'correct_rate_80':
        earned = correctRate >= 80 && stats.total_questions >= badge.requirement_value
        break
        
      case 'correct_rate_90':
        earned = correctRate >= 90 && stats.total_questions >= badge.requirement_value
        break
        
      case 'correct_rate_95':
        earned = correctRate >= 95 && stats.total_questions >= badge.requirement_value
        break
        
      case 'leaderboard_rank':
        if (stats.leaderboard_rank !== undefined) {
          earned = stats.leaderboard_rank <= badge.requirement_value && stats.leaderboard_rank > 0
        }
        break
        
      case 'subject_matematik':
        earned = (stats.subject_points?.['Matematik'] || 0) >= badge.requirement_value
        break
        
      case 'subject_turkce':
        earned = (stats.subject_points?.['Türkçe'] || 0) >= badge.requirement_value
        break
        
      case 'subject_fen':
        earned = (stats.subject_points?.['Fen Bilimleri'] || stats.subject_points?.['Fen'] || 0) >= badge.requirement_value
        break
        
      case 'subject_sosyal':
        earned = (stats.subject_points?.['Sosyal Bilgiler'] || stats.subject_points?.['Sosyal'] || 0) >= badge.requirement_value
        break
    }
    
    if (earned) {
      earnableBadges.push(badge)
    }
  }
  
  return earnableBadges
}

/**
 * Rozet ilerlemesini hesapla
 */
export function getBadgeProgress(badge: Badge, stats: UserStats): { current: number; target: number; percentage: number } {
  let current = 0
  const target = badge.requirement_value
  
  switch (badge.requirement_type) {
    case 'total_questions':
      current = stats.total_questions
      break
      
    case 'streak_days':
      current = stats.max_streak
      break
      
    case 'correct_rate_70':
    case 'correct_rate_80':
    case 'correct_rate_90':
    case 'correct_rate_95':
      current = stats.total_questions
      break
      
    case 'leaderboard_rank':
      current = stats.leaderboard_rank !== undefined && stats.leaderboard_rank > 0 
        ? Math.max(0, badge.requirement_value - stats.leaderboard_rank + 1) 
        : 0
      break
      
    case 'subject_matematik':
      current = stats.subject_points?.['Matematik'] || 0
      break
      
    case 'subject_turkce':
      current = stats.subject_points?.['Türkçe'] || 0
      break
      
    case 'subject_fen':
      current = stats.subject_points?.['Fen Bilimleri'] || stats.subject_points?.['Fen'] || 0
      break
      
    case 'subject_sosyal':
      current = stats.subject_points?.['Sosyal Bilgiler'] || stats.subject_points?.['Sosyal'] || 0
      break
  }
  
  const percentage = Math.min(100, Math.round((current / target) * 100))
  
  return { current: Math.min(current, target), target, percentage }
}

// =====================================================
// STREAK SİSTEMİ
// =====================================================

/**
 * Streak'in devam edip etmediğini kontrol et
 */
export function isStreakActive(lastActivityDate: string | null): boolean {
  if (!lastActivityDate) return false
  
  const last = new Date(lastActivityDate)
  const now = new Date()
  
  // Bugünün tarihini al (saat 00:00)
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const lastDay = new Date(last.getFullYear(), last.getMonth(), last.getDate())
  
  // Bugün veya dün aktivite varsa streak devam ediyor
  const diffDays = Math.floor((today.getTime() - lastDay.getTime()) / (1000 * 60 * 60 * 24))
  
  return diffDays <= 1
}

/**
 * Bugün aktivite var mı?
 */
export function hasActivityToday(lastActivityDate: string | null): boolean {
  if (!lastActivityDate) return false
  
  const last = new Date(lastActivityDate)
  const now = new Date()
  
  return last.toDateString() === now.toDateString()
}

/**
 * Son 7 günün aktivite durumunu al
 */
export function getWeeklyActivity(activityDates: string[]): boolean[] {
  const result: boolean[] = []
  const now = new Date()
  
  for (let i = 6; i >= 0; i--) {
    const checkDate = new Date(now)
    checkDate.setDate(checkDate.getDate() - i)
    const dateStr = checkDate.toISOString().split('T')[0]
    
    const hasActivity = activityDates.some(d => d.startsWith(dateStr))
    result.push(hasActivity)
  }
  
  return result
}

// =====================================================
// GÜNLÜK GÖREVLER
// =====================================================

export interface DailyChallenge {
  id: string
  title: string
  description: string
  type: 'solve_questions' | 'solve_subject' | 'accuracy' | 'streak' | 'explore'
  target_value: number
  subject_id?: string
  subject_name?: string
  xp_reward: number
  difficulty: 'easy' | 'medium' | 'hard'
}

export const DAILY_CHALLENGE_TEMPLATES: Omit<DailyChallenge, 'id'>[] = [
  // Ana görevler
  { title: 'Günlük Pratik', description: '10 soru çöz', type: 'solve_questions', target_value: 10, xp_reward: 20, difficulty: 'easy' },
  { title: 'Azimli Öğrenci', description: '20 soru çöz', type: 'solve_questions', target_value: 20, xp_reward: 40, difficulty: 'medium' },
  { title: 'Çalışkan Arı', description: '50 soru çöz', type: 'solve_questions', target_value: 50, xp_reward: 80, difficulty: 'hard' },
  
  // Ders görevleri
  { title: 'Matematik Zamanı', description: '10 matematik sorusu çöz', type: 'solve_subject', target_value: 10, subject_name: 'Matematik', xp_reward: 30, difficulty: 'medium' },
  { title: 'Türkçe Zamanı', description: '10 Türkçe sorusu çöz', type: 'solve_subject', target_value: 10, subject_name: 'Türkçe', xp_reward: 30, difficulty: 'medium' },
  { title: 'Fen Zamanı', description: '10 Fen sorusu çöz', type: 'solve_subject', target_value: 10, subject_name: 'Fen Bilimleri', xp_reward: 30, difficulty: 'medium' },
  
  // Başarı görevleri
  { title: 'Keskin Nişancı', description: '%80 başarı ile 10 soru çöz', type: 'accuracy', target_value: 10, xp_reward: 40, difficulty: 'hard' },
  { title: 'Mükemmeliyetçi', description: '%90 başarı ile 5 soru çöz', type: 'accuracy', target_value: 5, xp_reward: 35, difficulty: 'hard' },
  
  // Streak görevi
  { title: 'Serini Koru', description: 'Bugün en az 1 soru çöz', type: 'streak', target_value: 1, xp_reward: 15, difficulty: 'easy' },
  
  // Keşfet görevi
  { title: 'Kaşif', description: 'Farklı bir dersten 5 soru çöz', type: 'explore', target_value: 5, xp_reward: 25, difficulty: 'medium' },
]

/**
 * Günlük 5 görev seç
 */
export function generateDailyChallenges(): DailyChallenge[] {
  const today = new Date().toISOString().split('T')[0]
  const seed = today.split('-').reduce((acc, n) => acc + parseInt(n), 0)
  
  // Deterministik seçim için basit shuffle
  const shuffled = [...DAILY_CHALLENGE_TEMPLATES].sort((a, b) => {
    const hashA = (a.title.charCodeAt(0) + seed) % 100
    const hashB = (b.title.charCodeAt(0) + seed) % 100
    return hashA - hashB
  })
  
  // İlk 5'i al, en az 1 kolay, 1 zor olsun
  const easy = shuffled.find(c => c.difficulty === 'easy')!
  const hard = shuffled.find(c => c.difficulty === 'hard')!
  const others = shuffled.filter(c => c !== easy && c !== hard).slice(0, 3)
  
  return [easy, ...others, hard].map((c, i) => ({
    ...c,
    id: `daily_${today}_${i}`
  }))
}

// =====================================================
// YARDIMCI FONKSİYONLAR
// =====================================================

/**
 * Sayıyı Türkçe formatla
 */
export function formatNumber(num: number): string {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}

/**
 * Kategori adını Türkçe'ye çevir
 */
export function getCategoryName(category: BadgeCategory): string {
  const names: Record<BadgeCategory, string> = {
    soru: 'Soru Rozetleri',
    streak: 'Seri Rozetleri',
    basari: 'Başarı Rozetleri',
    hiz: 'Hız Rozetleri',
    liderlik: 'Liderlik Rozetleri',
    ders: 'Ders Rozetleri',
    ai_koc: 'AI Koç Rozetleri',
  }
  return names[category]
}

/**
 * Kategori ikonunu al
 */
export function getCategoryIcon(category: BadgeCategory): string {
  const icons: Record<BadgeCategory, string> = {
    soru: '📚',
    streak: '🔥',
    basari: '🎯',
    hiz: '⚡',
    liderlik: '🏆',
    ders: '📐',
    ai_koc: '🤖',
  }
  return icons[category]
}

// =====================================================
// COMBO VE GÜNLÜK HEDEF SİSTEMİ
// =====================================================

export const COMBO_SETTINGS = {
  COMBO_THRESHOLD: 5, // Her 5 doğru cevapta bonus
  COMBO_BONUS_XP: 10, // Combo başına bonus XP
  FAST_ANSWER_THRESHOLD: 30, // 30 saniye altında hızlı cevap
  FAST_ANSWER_BONUS: 5, // Hızlı cevap bonusu
} as const

export const DAILY_TARGET_SETTINGS = {
  DEFAULT_TARGET: 20, // Varsayılan günlük hedef
  MIN_TARGET: 5,
  MAX_TARGET: 100,
} as const

export const TIMER_SETTINGS = {
  DEFAULT_DURATION: 60, // Varsayılan süre (saniye)
  MIN_DURATION: 15,
  MAX_DURATION: 120,
} as const

// =====================================================
// MOTİVASYON MESAJLARI SİSTEMİ
// =====================================================

export type MotivationContext = 
  | 'streak_3'
  | 'streak_5'
  | 'streak_10'
  | 'streak_15'
  | 'streak_20'
  | 'combo_bonus'
  | 'wrong_after_streak'
  | 'first_correct'
  | 'first_wrong'
  | 'daily_goal_quarter'
  | 'daily_goal_half'
  | 'daily_goal_almost'
  | 'daily_goal_complete'
  | 'fast_answer'
  | 'perfect_session'
  | 'comeback'
  | 'keep_going'

interface MotivationMessage {
  text: string
  emoji: string
  color: string
}

const MOTIVATION_MESSAGES: Record<MotivationContext, MotivationMessage[]> = {
  streak_3: [
    { text: '3 seri! Devam et!', emoji: '🔥', color: 'text-orange-500' },
    { text: 'Üçleme! Harika gidiyorsun!', emoji: '🎯', color: 'text-orange-500' },
  ],
  streak_5: [
    { text: '5 SERİ! COMBO BONUS!', emoji: '⚡', color: 'text-yellow-500' },
    { text: 'Beşleme! Muhteşem!', emoji: '🌟', color: 'text-yellow-500' },
  ],
  streak_10: [
    { text: '10 SERİ! EFSANE!', emoji: '🚀', color: 'text-purple-500' },
    { text: 'Onluk! Sen bir makinasın!', emoji: '💪', color: 'text-purple-500' },
  ],
  streak_15: [
    { text: '15 SERİ! DURDURULAMIYORSUN!', emoji: '🔥', color: 'text-red-500' },
    { text: 'İnanılmaz! 15 üst üste!', emoji: '👑', color: 'text-red-500' },
  ],
  streak_20: [
    { text: '20 SERİ! GOAT!', emoji: '🐐', color: 'text-rose-500' },
    { text: 'Efsane! 20 seri doğru!', emoji: '🏆', color: 'text-rose-500' },
  ],
  combo_bonus: [
    { text: 'COMBO BONUS +10 XP!', emoji: '💥', color: 'text-amber-500' },
    { text: 'Bonus kazandın!', emoji: '🎁', color: 'text-amber-500' },
  ],
  wrong_after_streak: [
    { text: 'Olur böyle şeyler, devam!', emoji: '💪', color: 'text-blue-500' },
    { text: 'Kafayı takma, yeniden başla!', emoji: '🔄', color: 'text-blue-500' },
    { text: 'Bu sefer olmadı, bir dahakine!', emoji: '✊', color: 'text-blue-500' },
  ],
  first_correct: [
    { text: 'İlk adım! Harika başladın!', emoji: '🌟', color: 'text-green-500' },
    { text: 'Güzel başlangıç!', emoji: '👏', color: 'text-green-500' },
  ],
  first_wrong: [
    { text: 'Problem değil, devam et!', emoji: '💪', color: 'text-blue-500' },
    { text: 'Herkes hata yapar, önemli olan devam etmek!', emoji: '🎯', color: 'text-blue-500' },
  ],
  daily_goal_quarter: [
    { text: 'Çeyrek yol tamam!', emoji: '🏃', color: 'text-blue-500' },
    { text: '%25 ilerleme!', emoji: '📈', color: 'text-blue-500' },
  ],
  daily_goal_half: [
    { text: 'Yarı yoldasın!', emoji: '💪', color: 'text-indigo-500' },
    { text: '%50! Yarısı bitti!', emoji: '🎯', color: 'text-indigo-500' },
  ],
  daily_goal_almost: [
    { text: 'Neredeyse tamam! Son hamle!', emoji: '🔥', color: 'text-orange-500' },
    { text: 'Az kaldı! Bitir şunu!', emoji: '🏁', color: 'text-orange-500' },
  ],
  daily_goal_complete: [
    { text: 'GÜNLÜK HEDEF TAMAM!', emoji: '🎉', color: 'text-green-500' },
    { text: 'Tebrikler! Bugünkü hedefini tamamladın!', emoji: '🏆', color: 'text-green-500' },
    { text: 'Süpersin! Günlük görev bitti!', emoji: '⭐', color: 'text-green-500' },
  ],
  fast_answer: [
    { text: 'HIZLI CEVAP!', emoji: '⚡', color: 'text-cyan-500' },
    { text: 'Şimşek hızı!', emoji: '💨', color: 'text-cyan-500' },
  ],
  perfect_session: [
    { text: 'MÜKEMMEL OTURUM!', emoji: '💎', color: 'text-purple-500' },
    { text: 'Tek hata yok! Harikasın!', emoji: '👑', color: 'text-purple-500' },
  ],
  comeback: [
    { text: 'Geri döndün!', emoji: '🔥', color: 'text-orange-500' },
    { text: 'İşte bu! Devam!', emoji: '💪', color: 'text-orange-500' },
  ],
  keep_going: [
    { text: 'Devam et!', emoji: '👊', color: 'text-blue-500' },
    { text: 'Her adım önemli!', emoji: '🎯', color: 'text-blue-500' },
    { text: 'İyi gidiyorsun!', emoji: '👍', color: 'text-blue-500' },
  ],
}

/**
 * Motivasyon mesajı al
 */
export function getMotivationalMessage(context: MotivationContext): MotivationMessage {
  const messages = MOTIVATION_MESSAGES[context]
  const randomIndex = Math.floor(Math.random() * messages.length)
  return messages[randomIndex]
}

/**
 * Streak'e göre motivasyon context'i belirle
 */
export function getStreakMotivationContext(streak: number): MotivationContext | null {
  if (streak >= 20) return 'streak_20'
  if (streak >= 15) return 'streak_15'
  if (streak >= 10) return 'streak_10'
  if (streak >= 5) return 'streak_5'
  if (streak >= 3) return 'streak_3'
  return null
}

/**
 * Günlük ilerlemeye göre motivasyon context'i belirle
 */
export function getDailyProgressMotivationContext(solved: number, target: number): MotivationContext | null {
  const progress = solved / target
  if (progress >= 1) return 'daily_goal_complete'
  if (progress >= 0.9) return 'daily_goal_almost'
  if (progress >= 0.5 && solved === Math.floor(target * 0.5)) return 'daily_goal_half'
  if (progress >= 0.25 && solved === Math.floor(target * 0.25)) return 'daily_goal_quarter'
  return null
}

/**
 * Combo bonusu hesapla
 */
export function calculateComboBonus(streak: number): number {
  if (streak > 0 && streak % COMBO_SETTINGS.COMBO_THRESHOLD === 0) {
    return COMBO_SETTINGS.COMBO_BONUS_XP
  }
  return 0
}

/**
 * Combo seviyesini hesapla (kaç kez combo yapıldı)
 */
export function getComboLevel(streak: number): number {
  return Math.floor(streak / COMBO_SETTINGS.COMBO_THRESHOLD)
}

// =====================================================
// LOCALSTORAGE YARDIMCI FONKSİYONLARI
// =====================================================

export interface TeknokulSettings {
  timerEnabled: boolean
  timerDuration: number
  dailyTarget: number
  soundEnabled: boolean
}

export interface DailyProgress {
  date: string
  solved: number
  correct: number
  wrong: number
  targetCompleted: boolean
  xpEarned: number
}

const SETTINGS_KEY = 'teknokul_settings'
const DAILY_PROGRESS_KEY = 'teknokul_daily_progress'

/**
 * Ayarları localStorage'dan al
 */
export function getSettings(): TeknokulSettings {
  if (typeof window === 'undefined') {
    return {
      timerEnabled: false,
      timerDuration: TIMER_SETTINGS.DEFAULT_DURATION,
      dailyTarget: DAILY_TARGET_SETTINGS.DEFAULT_TARGET,
      soundEnabled: true,
    }
  }
  
  try {
    const stored = localStorage.getItem(SETTINGS_KEY)
    if (stored) {
      return JSON.parse(stored)
    }
  } catch (e) {
    console.error('Settings parse error:', e)
  }
  
  return {
    timerEnabled: false,
    timerDuration: TIMER_SETTINGS.DEFAULT_DURATION,
    dailyTarget: DAILY_TARGET_SETTINGS.DEFAULT_TARGET,
    soundEnabled: true,
  }
}

/**
 * Ayarları localStorage'a kaydet
 */
export function saveSettings(settings: Partial<TeknokulSettings>): void {
  if (typeof window === 'undefined') return
  
  try {
    const current = getSettings()
    const updated = { ...current, ...settings }
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated))
  } catch (e) {
    console.error('Settings save error:', e)
  }
}

/**
 * Günlük ilerlemeyi localStorage'dan al
 */
export function getDailyProgress(): DailyProgress {
  const today = new Date().toISOString().split('T')[0]
  
  if (typeof window === 'undefined') {
    return {
      date: today,
      solved: 0,
      correct: 0,
      wrong: 0,
      targetCompleted: false,
      xpEarned: 0,
    }
  }
  
  try {
    const stored = localStorage.getItem(DAILY_PROGRESS_KEY)
    if (stored) {
      const progress = JSON.parse(stored) as DailyProgress
      // Farklı bir gün ise sıfırla
      if (progress.date !== today) {
        const newProgress: DailyProgress = {
          date: today,
          solved: 0,
          correct: 0,
          wrong: 0,
          targetCompleted: false,
          xpEarned: 0,
        }
        localStorage.setItem(DAILY_PROGRESS_KEY, JSON.stringify(newProgress))
        return newProgress
      }
      return progress
    }
  } catch (e) {
    console.error('Daily progress parse error:', e)
  }
  
  return {
    date: today,
    solved: 0,
    correct: 0,
    wrong: 0,
    targetCompleted: false,
    xpEarned: 0,
  }
}

/**
 * Günlük ilerlemeyi güncelle
 */
export function updateDailyProgress(updates: Partial<Omit<DailyProgress, 'date'>>): DailyProgress {
  if (typeof window === 'undefined') {
    return getDailyProgress()
  }
  
  try {
    const current = getDailyProgress()
    const updated: DailyProgress = {
      ...current,
      ...updates,
    }
    localStorage.setItem(DAILY_PROGRESS_KEY, JSON.stringify(updated))
    return updated
  } catch (e) {
    console.error('Daily progress update error:', e)
    return getDailyProgress()
  }
}

