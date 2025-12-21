/**
 * Google Ads & Analytics Dönüşüm İzleme
 * Tag ID: AW-16918605673
 */

// Google Ads ID
export const GA_ADS_ID = 'AW-16918605673'

// Dönüşüm etiketleri - Google Ads'te oluşturulduktan sonra güncelle
export const CONVERSION_LABELS = {
  SIGNUP: 'signup', // Kayıt dönüşümü
  LOGIN: 'login', // Giriş dönüşümü
  QUESTION_SOLVED: 'question_solved', // Soru çözme
  COACH_APPLICATION: 'coach_application', // Koç başvurusu
  FIRST_QUESTION: 'first_question', // İlk soru çözme
  SUBSCRIPTION: 'subscription', // Abonelik (gelecekte)
}

// TypeScript için window.gtag tanımı
declare global {
  interface Window {
    gtag: (...args: any[]) => void
    dataLayer: any[]
  }
}

/**
 * Sayfa görüntüleme izleme
 */
export function pageview(url: string) {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('config', GA_ADS_ID, {
      page_path: url,
    })
  }
}

/**
 * Özel event gönderme
 */
export function event(action: string, params?: Record<string, any>) {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', action, params)
  }
}

/**
 * Google Ads dönüşüm izleme
 * @param conversionLabel - Dönüşüm etiketi (Google Ads'ten alınacak)
 * @param value - Dönüşüm değeri (opsiyonel)
 * @param currency - Para birimi (varsayılan: TRY)
 */
export function trackConversion(
  conversionLabel: string,
  value?: number,
  currency: string = 'TRY'
) {
  if (typeof window !== 'undefined' && window.gtag) {
    const conversionData: Record<string, any> = {
      send_to: `${GA_ADS_ID}/${conversionLabel}`,
    }

    if (value !== undefined) {
      conversionData.value = value
      conversionData.currency = currency
    }

    window.gtag('event', 'conversion', conversionData)
    console.log('📊 Dönüşüm izlendi:', conversionLabel, conversionData)
  }
}

// ============================================
// HAZIR DÖNÜŞÜM FONKSİYONLARI
// ============================================

/**
 * Kayıt dönüşümü
 */
export function trackSignup(role: 'ogrenci' | 'ogretmen' | 'veli') {
  event('sign_up', {
    method: 'email',
    role: role,
  })
  trackConversion(CONVERSION_LABELS.SIGNUP)
}

/**
 * Google ile kayıt dönüşümü
 */
export function trackGoogleSignup(role: 'ogrenci' | 'ogretmen' | 'veli') {
  event('sign_up', {
    method: 'google',
    role: role,
  })
  trackConversion(CONVERSION_LABELS.SIGNUP)
}

/**
 * Giriş dönüşümü
 */
export function trackLogin(method: 'email' | 'google' = 'email') {
  event('login', {
    method: method,
  })
  trackConversion(CONVERSION_LABELS.LOGIN)
}

/**
 * Soru çözme dönüşümü
 */
export function trackQuestionSolved(params: {
  subject?: string
  grade?: number
  difficulty?: string
  correct: boolean
}) {
  event('question_solved', {
    subject: params.subject,
    grade: params.grade,
    difficulty: params.difficulty,
    correct: params.correct,
  })
  
  // Sadece doğru cevapları dönüşüm olarak say
  if (params.correct) {
    trackConversion(CONVERSION_LABELS.QUESTION_SOLVED)
  }
}

/**
 * İlk soru çözme dönüşümü (önemli milestone)
 */
export function trackFirstQuestion() {
  event('first_question_solved', {
    milestone: true,
  })
  trackConversion(CONVERSION_LABELS.FIRST_QUESTION)
}

/**
 * Koç başvurusu dönüşümü
 */
export function trackCoachApplication(coachId: string) {
  event('coach_application', {
    coach_id: coachId,
  })
  trackConversion(CONVERSION_LABELS.COACH_APPLICATION, 50) // 50 TL değer
}

/**
 * Düello başlatma
 */
export function trackDuelStart(opponentId?: string) {
  event('duel_start', {
    opponent_id: opponentId,
  })
}

/**
 * Rozet kazanma
 */
export function trackBadgeEarned(badgeId: string, badgeName: string) {
  event('badge_earned', {
    badge_id: badgeId,
    badge_name: badgeName,
  })
}

/**
 * Seviye atlama
 */
export function trackLevelUp(newLevel: number, levelName: string) {
  event('level_up', {
    level: newLevel,
    level_name: levelName,
  })
}

/**
 * Günlük görev tamamlama
 */
export function trackDailyChallengeComplete(challengeId: string, xpEarned: number) {
  event('daily_challenge_complete', {
    challenge_id: challengeId,
    xp_earned: xpEarned,
  })
}

export default {
  pageview,
  event,
  trackConversion,
  trackSignup,
  trackGoogleSignup,
  trackLogin,
  trackQuestionSolved,
  trackFirstQuestion,
  trackCoachApplication,
  trackDuelStart,
  trackBadgeEarned,
  trackLevelUp,
  trackDailyChallengeComplete,
}

