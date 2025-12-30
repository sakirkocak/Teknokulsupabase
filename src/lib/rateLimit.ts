/**
 * In-Memory Rate Limiter
 * Bot ve spam koruması için Edge-uyumlu rate limiting
 */

interface RateLimitEntry {
  count: number
  resetTime: number
  blocked: boolean
  blockUntil?: number
}

interface RateLimitConfig {
  windowMs: number      // Zaman penceresi (ms)
  maxRequests: number   // Max istek sayısı
  blockDurationMs?: number  // Engellenme süresi (ms)
}

// In-memory storage (Edge Runtime uyumlu)
const rateLimitStore = new Map<string, RateLimitEntry>()

// Varsayılan yapılandırmalar
export const RATE_LIMITS = {
  // Soru cevaplama: 5 saniyede max 3 cevap
  ANSWER_SUBMISSION: {
    windowMs: 5000,
    maxRequests: 3,
    blockDurationMs: 30000  // 30 saniye engelle
  },
  // Genel API: 1 dakikada max 60 istek
  GENERAL_API: {
    windowMs: 60000,
    maxRequests: 60,
    blockDurationMs: 60000
  },
  // Sıkı mod: Şüpheli aktivite sonrası
  STRICT: {
    windowMs: 10000,
    maxRequests: 2,
    blockDurationMs: 300000  // 5 dakika engelle
  }
} as const

/**
 * Rate limit kontrolü
 * @param identifier Kullanıcı ID veya IP adresi
 * @param config Rate limit yapılandırması
 * @returns { allowed: boolean, remaining: number, resetIn: number }
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig = RATE_LIMITS.ANSWER_SUBMISSION
): { allowed: boolean; remaining: number; resetIn: number; blocked: boolean } {
  const now = Date.now()
  const key = `rate:${identifier}`
  
  let entry = rateLimitStore.get(key)
  
  // Engelli mi kontrol et
  if (entry?.blocked && entry.blockUntil && now < entry.blockUntil) {
    return {
      allowed: false,
      remaining: 0,
      resetIn: entry.blockUntil - now,
      blocked: true
    }
  }
  
  // Yeni pencere veya süresi dolmuş
  if (!entry || now > entry.resetTime) {
    entry = {
      count: 1,
      resetTime: now + config.windowMs,
      blocked: false
    }
    rateLimitStore.set(key, entry)
    
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetIn: config.windowMs,
      blocked: false
    }
  }
  
  // Limit aşıldı mı?
  if (entry.count >= config.maxRequests) {
    // Engelle
    entry.blocked = true
    entry.blockUntil = now + (config.blockDurationMs || 30000)
    rateLimitStore.set(key, entry)
    
    return {
      allowed: false,
      remaining: 0,
      resetIn: entry.blockUntil - now,
      blocked: true
    }
  }
  
  // İstek sayısını artır
  entry.count++
  rateLimitStore.set(key, entry)
  
  return {
    allowed: true,
    remaining: config.maxRequests - entry.count,
    resetIn: entry.resetTime - now,
    blocked: false
  }
}

/**
 * Kullanıcıyı manuel olarak engelle
 */
export function blockUser(identifier: string, durationMs: number = 300000): void {
  const key = `rate:${identifier}`
  rateLimitStore.set(key, {
    count: 999,
    resetTime: Date.now() + durationMs,
    blocked: true,
    blockUntil: Date.now() + durationMs
  })
}

/**
 * Kullanıcının engelini kaldır
 */
export function unblockUser(identifier: string): void {
  const key = `rate:${identifier}`
  rateLimitStore.delete(key)
}

/**
 * Şüpheli aktivite skoru hesapla
 * @returns 0-100 arası risk skoru
 */
export function calculateSuspicionScore(
  answersInLastMinute: number,
  avgAnswerTimeMs: number,
  accuracyPercent: number
): number {
  let score = 0
  
  // Çok hızlı cevaplama (1 dakikada 20+ = şüpheli)
  if (answersInLastMinute > 20) {
    score += Math.min(40, (answersInLastMinute - 20) * 4)
  }
  
  // Çok kısa cevap süresi (2 saniyeden az = bot)
  if (avgAnswerTimeMs < 2000) {
    score += Math.min(40, (2000 - avgAnswerTimeMs) / 50)
  }
  
  // Yüksek doğruluk + hız kombinasyonu
  if (accuracyPercent > 95 && avgAnswerTimeMs < 3000) {
    score += 20
  }
  
  return Math.min(100, score)
}

/**
 * IP adresini request'ten al
 */
export function getClientIP(request: Request): string {
  // Cloudflare
  const cfIP = request.headers.get('cf-connecting-ip')
  if (cfIP) return cfIP
  
  // Vercel / diğer proxy'ler
  const forwardedFor = request.headers.get('x-forwarded-for')
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim()
  }
  
  // Real IP header
  const realIP = request.headers.get('x-real-ip')
  if (realIP) return realIP
  
  return 'unknown'
}

/**
 * Minimum cevap süresi kontrolü
 * @param questionShownAt Sorunun gösterildiği timestamp (client)
 * @param minTimeMs Minimum süre (ms)
 */
export function validateAnswerTime(
  questionShownAt: number,
  minTimeMs: number = 2000
): { valid: boolean; elapsedMs: number; message?: string } {
  const now = Date.now()
  const elapsed = now - questionShownAt
  
  // Gelecek tarih (manipulation)
  if (questionShownAt > now) {
    return {
      valid: false,
      elapsedMs: 0,
      message: 'Geçersiz zaman damgası'
    }
  }
  
  // Çok eski (10 dakikadan fazla)
  if (elapsed > 600000) {
    return {
      valid: false,
      elapsedMs: elapsed,
      message: 'Soru süresi doldu'
    }
  }
  
  // Çok hızlı
  if (elapsed < minTimeMs) {
    return {
      valid: false,
      elapsedMs: elapsed,
      message: `Çok hızlı cevapladınız (${elapsed}ms). Minimum ${minTimeMs}ms beklenmeli.`
    }
  }
  
  return {
    valid: true,
    elapsedMs: elapsed
  }
}

// Periyodik temizlik (memory leak önleme)
setInterval(() => {
  const now = Date.now()
  const entries = Array.from(rateLimitStore.entries())
  for (let i = 0; i < entries.length; i++) {
    const [key, entry] = entries[i]
    // Süresi dolmuş ve engelsiz kayıtları sil
    if (now > entry.resetTime && !entry.blocked) {
      rateLimitStore.delete(key)
    }
    // Engeli kalkmış kayıtları sil
    if (entry.blocked && entry.blockUntil && now > entry.blockUntil) {
      rateLimitStore.delete(key)
    }
  }
}, 60000) // Her dakika temizle

export default {
  checkRateLimit,
  blockUser,
  unblockUser,
  calculateSuspicionScore,
  getClientIP,
  validateAnswerTime,
  RATE_LIMITS
}
