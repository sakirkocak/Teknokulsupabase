/**
 * Güvenlik yardımcı fonksiyonları
 * - Disposable email kontrolü
 * - Rate limiting
 * - Spam koruması
 */

// Bilinen tek kullanımlık (disposable) email domain'leri
const DISPOSABLE_EMAIL_DOMAINS = [
  // Popüler servisler
  'tempmail.com', 'temp-mail.org', 'temp-mail.io',
  'guerrillamail.com', 'guerrillamail.org', 'guerrillamail.net',
  '10minutemail.com', '10minutemail.net', '10minmail.com',
  'throwaway.email', 'throwawaymail.com',
  'mailinator.com', 'mailinator.net', 'mailinator2.com',
  'fakeinbox.com', 'fakemailgenerator.com',
  'yopmail.com', 'yopmail.fr', 'yopmail.net',
  'dispostable.com', 'disposablemail.com',
  'tempail.com', 'tempmailaddress.com',
  'trashmail.com', 'trashmail.net', 'trashmail.org',
  'sharklasers.com', 'guerrillamailblock.com',
  'spam4.me', 'spamgourmet.com',
  'maildrop.cc', 'mailnesia.com',
  'getnada.com', 'getairmail.com',
  'mohmal.com', 'emailondeck.com',
  'tempinbox.com', 'tempr.email',
  'discard.email', 'discardmail.com',
  'spambox.us', 'mytrashmail.com',
  'mailcatch.com', 'mailexpire.com',
  'mailnull.com', 'mailscrap.com',
  'mintemail.com', 'mt2009.com',
  'thankyou2010.com', 'trash2009.com',
  'mt2014.com', 'tempsky.com',
  'binkmail.com', 'safetymail.info',
  'mailtemp.net', 'tmpmail.net',
  'tmpmail.org', 'emailfake.com',
  'generator.email', 'fakemailgenerator.net',
  'emailtemporario.com.br', 'crazymailing.com',
  'tempmailo.com', 'tempmailgen.com',
  'dropmail.me', 'emaildrop.io',
  'minuteinbox.com', 'tempail.com',
  // Türkiye'de yaygın olanlar
  'gecelikmail.com', 'anlıkmail.com',
  // Daha fazla eklenebilir
]

// Şüpheli email pattern'leri
const SUSPICIOUS_EMAIL_PATTERNS = [
  /^test\d+@/i,
  /^user\d+@/i,
  /^asdf+@/i,
  /^qwerty+@/i,
  /^abc\d+@/i,
  /^spam\d*@/i,
  /^fake\d*@/i,
  /^temp\d*@/i,
  /^\d{8,}@/i, // 8+ rakamla başlayan
]

/**
 * Email'in geçerli olup olmadığını kontrol eder
 */
export function validateEmail(email: string): { valid: boolean; reason?: string } {
  if (!email) {
    return { valid: false, reason: 'E-posta adresi gerekli' }
  }

  // Temel format kontrolü
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return { valid: false, reason: 'Geçersiz e-posta formatı' }
  }

  const domain = email.split('@')[1]?.toLowerCase()
  
  // Disposable email kontrolü
  if (DISPOSABLE_EMAIL_DOMAINS.includes(domain)) {
    return { valid: false, reason: 'Lütfen kalıcı bir e-posta adresi kullanın' }
  }

  // Alt domain ile disposable email denemesi
  for (const disposableDomain of DISPOSABLE_EMAIL_DOMAINS) {
    if (domain.endsWith(`.${disposableDomain}`)) {
      return { valid: false, reason: 'Lütfen kalıcı bir e-posta adresi kullanın' }
    }
  }

  // Şüpheli pattern kontrolü
  for (const pattern of SUSPICIOUS_EMAIL_PATTERNS) {
    if (pattern.test(email)) {
      return { valid: false, reason: 'Bu e-posta adresi kabul edilmiyor' }
    }
  }

  return { valid: true }
}

/**
 * Honeypot değerinin dolu olup olmadığını kontrol eder
 * Dolu ise bot olarak işaretler
 */
export function isHoneypotTriggered(value: string | undefined | null): boolean {
  return !!value && value.trim().length > 0
}

/**
 * Form gönderim süresini kontrol eder
 * Çok hızlı doldurulmuşsa bot olabilir (< 3 saniye)
 */
export function isSubmissionTooFast(formLoadTime: number, minSeconds: number = 3): boolean {
  const submissionTime = Date.now()
  const timeDiff = (submissionTime - formLoadTime) / 1000 // saniye
  return timeDiff < minSeconds
}

// In-memory rate limiting için basit bir store
// Production'da Redis kullanılması önerilir
interface RateLimitEntry {
  count: number
  firstAttempt: number
  lastAttempt: number
}

const rateLimitStore = new Map<string, RateLimitEntry>()

// Periyodik temizlik
setInterval(() => {
  const oneHourAgo = Date.now() - 60 * 60 * 1000
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.lastAttempt < oneHourAgo) {
      rateLimitStore.delete(key)
    }
  }
}, 5 * 60 * 1000) // Her 5 dakikada temizle

/**
 * Rate limiting kontrolü
 * @param identifier - IP adresi veya benzeri tanımlayıcı
 * @param maxAttempts - İzin verilen maksimum deneme sayısı
 * @param windowMs - Zaman penceresi (ms)
 */
export function checkRateLimit(
  identifier: string,
  maxAttempts: number = 5,
  windowMs: number = 60 * 60 * 1000 // 1 saat
): { allowed: boolean; remaining: number; resetIn: number } {
  const now = Date.now()
  const entry = rateLimitStore.get(identifier)

  if (!entry) {
    // İlk deneme
    rateLimitStore.set(identifier, {
      count: 1,
      firstAttempt: now,
      lastAttempt: now,
    })
    return { allowed: true, remaining: maxAttempts - 1, resetIn: windowMs }
  }

  // Pencere süresi geçtiyse sıfırla
  if (now - entry.firstAttempt > windowMs) {
    rateLimitStore.set(identifier, {
      count: 1,
      firstAttempt: now,
      lastAttempt: now,
    })
    return { allowed: true, remaining: maxAttempts - 1, resetIn: windowMs }
  }

  // Limit kontrolü
  if (entry.count >= maxAttempts) {
    const resetIn = windowMs - (now - entry.firstAttempt)
    return { allowed: false, remaining: 0, resetIn }
  }

  // Sayacı artır
  entry.count++
  entry.lastAttempt = now
  rateLimitStore.set(identifier, entry)

  return {
    allowed: true,
    remaining: maxAttempts - entry.count,
    resetIn: windowMs - (now - entry.firstAttempt),
  }
}

/**
 * Şüpheli aktivite logla
 */
export interface SuspiciousActivity {
  type: 'honeypot' | 'rate_limit' | 'disposable_email' | 'fast_submission' | 'suspicious_pattern'
  ip?: string
  email?: string
  details?: string
  timestamp: Date
}

const suspiciousActivityLog: SuspiciousActivity[] = []

export function logSuspiciousActivity(activity: Omit<SuspiciousActivity, 'timestamp'>): void {
  const entry = { ...activity, timestamp: new Date() }
  suspiciousActivityLog.push(entry)
  
  // Son 1000 kaydı tut
  if (suspiciousActivityLog.length > 1000) {
    suspiciousActivityLog.shift()
  }
  
  // Console'a da log
  console.warn('[SECURITY] Şüpheli aktivite:', entry)
}

export function getSuspiciousActivityLog(): SuspiciousActivity[] {
  return [...suspiciousActivityLog]
}

/**
 * Güvenlik skoru hesapla (0-100)
 * Düşük skor = şüpheli
 */
export function calculateSecurityScore(params: {
  email: string
  honeypotValue?: string
  formLoadTime?: number
  userAgent?: string
}): number {
  let score = 100

  // Email kontrolü
  const emailCheck = validateEmail(params.email)
  if (!emailCheck.valid) {
    score -= 50
  }

  // Honeypot kontrolü
  if (isHoneypotTriggered(params.honeypotValue)) {
    score -= 100 // Bot kesin
  }

  // Hız kontrolü
  if (params.formLoadTime && isSubmissionTooFast(params.formLoadTime)) {
    score -= 30
  }

  // User agent kontrolü
  if (!params.userAgent || params.userAgent.length < 10) {
    score -= 20
  }

  // Bilinen bot user-agent'ları
  const botUserAgents = ['bot', 'crawler', 'spider', 'curl', 'wget', 'python', 'java']
  if (params.userAgent && botUserAgents.some(bot => params.userAgent!.toLowerCase().includes(bot))) {
    score -= 50
  }

  return Math.max(0, score)
}

export default {
  validateEmail,
  isHoneypotTriggered,
  isSubmissionTooFast,
  checkRateLimit,
  logSuspiciousActivity,
  calculateSecurityScore,
}

