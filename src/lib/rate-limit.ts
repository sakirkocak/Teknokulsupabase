/**
 * Basit in-memory rate limiter
 * Production'da Redis kullanılabilir
 */

interface RateLimitEntry {
  count: number
  resetAt: number
}

// In-memory store (serverless'ta her instance ayrı)
const rateLimitStore = new Map<string, RateLimitEntry>()

// Eski kayıtları temizle (memory leak önleme)
setInterval(() => {
  const now = Date.now()
  rateLimitStore.forEach((entry, key) => {
    if (entry.resetAt < now) {
      rateLimitStore.delete(key)
    }
  })
}, 60000) // Her dakika temizle

interface RateLimitOptions {
  /** Limit penceresi (ms) */
  windowMs?: number
  /** Pencere içinde izin verilen maksimum istek */
  maxRequests?: number
  /** Rate limit key prefix */
  keyPrefix?: string
}

interface RateLimitResult {
  success: boolean
  remaining: number
  resetAt: number
  retryAfter?: number
}

/**
 * Rate limit kontrolü yap
 */
export function checkRateLimit(
  identifier: string, // userId veya IP
  options: RateLimitOptions = {}
): RateLimitResult {
  const {
    windowMs = 60000, // 1 dakika
    maxRequests = 30,
    keyPrefix = 'rl'
  } = options

  const key = `${keyPrefix}:${identifier}`
  const now = Date.now()
  const entry = rateLimitStore.get(key)

  // Yeni pencere başlat
  if (!entry || entry.resetAt < now) {
    rateLimitStore.set(key, {
      count: 1,
      resetAt: now + windowMs
    })
    return {
      success: true,
      remaining: maxRequests - 1,
      resetAt: now + windowMs
    }
  }

  // Limit aşıldı mı?
  if (entry.count >= maxRequests) {
    return {
      success: false,
      remaining: 0,
      resetAt: entry.resetAt,
      retryAfter: Math.ceil((entry.resetAt - now) / 1000)
    }
  }

  // Sayacı artır
  entry.count++
  return {
    success: true,
    remaining: maxRequests - entry.count,
    resetAt: entry.resetAt
  }
}

/**
 * Düello için özel rate limiter
 */
export const duelRateLimits = {
  // Düello oluşturma: Dakikada 5, saatte 20
  create: (userId: string) => checkRateLimit(userId, {
    windowMs: 60000,
    maxRequests: 5,
    keyPrefix: 'duel-create'
  }),
  
  // Düello başlatma: Dakikada 10
  start: (userId: string) => checkRateLimit(userId, {
    windowMs: 60000,
    maxRequests: 10,
    keyPrefix: 'duel-start'
  }),
  
  // Cevap gönderme: Saniyede 2 (anti-cheat)
  answer: (userId: string) => checkRateLimit(userId, {
    windowMs: 1000,
    maxRequests: 2,
    keyPrefix: 'duel-answer'
  }),
  
  // Genel API: Dakikada 60
  general: (userId: string) => checkRateLimit(userId, {
    windowMs: 60000,
    maxRequests: 60,
    keyPrefix: 'api-general'
  })
}

/**
 * Rate limit response headers
 */
export function getRateLimitHeaders(result: RateLimitResult) {
  return {
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': result.resetAt.toString(),
    ...(result.retryAfter && { 'Retry-After': result.retryAfter.toString() })
  }
}

