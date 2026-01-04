/**
 * Anti-Scraping Güvenlik Sistemi
 * Web kazıma ve bot saldırılarına karşı koruma
 */

// Bilinen bot User-Agent imzaları
const BOT_USER_AGENTS = [
  // Headless browsers
  'headlesschrome',
  'headless',
  'phantomjs',
  'selenium',
  'webdriver',
  'puppeteer',
  'playwright',
  // Python scrapers
  'python-requests',
  'python-urllib',
  'scrapy',
  'beautifulsoup',
  'httpx',
  'aiohttp',
  // Node.js scrapers
  'node-fetch',
  'axios',
  'got',
  'superagent',
  // Java/Go scrapers
  'java',
  'go-http-client',
  'okhttp',
  // Generic bots
  'curl',
  'wget',
  'libwww',
  'lwp-trivial',
  // Known bad bots
  'semrush',
  'ahref',
  'mj12bot',
  'dotbot',
  'petalbot',
  'bytespider',
  'gptbot',
  'ccbot',
  'claudebot',
  'anthropic',
  'openai',
]

// İzin verilen botlar (SEO için)
const ALLOWED_BOTS = [
  'googlebot',
  'bingbot',
  'yandexbot',
  'duckduckbot',
  'slurp', // Yahoo
  'baiduspider',
  'facebot',
  'twitterbot',
  'linkedinbot',
  'whatsapp',
  'telegram',
]

// Şüpheli header pattern'leri
const SUSPICIOUS_HEADERS = {
  // Headless browser tespiti
  missingAcceptLanguage: true,
  missingAcceptEncoding: true,
  // Automation tespiti
  webdriver: true,
  seleniumDriver: true,
}

export interface SecurityCheckResult {
  allowed: boolean
  reason?: string
  riskScore: number
  isBot: boolean
  isSuspicious: boolean
}

/**
 * User-Agent kontrolü
 */
export function checkUserAgent(userAgent: string | null): { isBot: boolean; isAllowed: boolean; botType?: string } {
  if (!userAgent) {
    return { isBot: true, isAllowed: false, botType: 'empty-ua' }
  }

  const ua = userAgent.toLowerCase()

  // İzin verilen botları kontrol et
  for (const allowedBot of ALLOWED_BOTS) {
    if (ua.includes(allowedBot)) {
      return { isBot: true, isAllowed: true, botType: allowedBot }
    }
  }

  // Yasaklı botları kontrol et
  for (const botSignature of BOT_USER_AGENTS) {
    if (ua.includes(botSignature)) {
      return { isBot: true, isAllowed: false, botType: botSignature }
    }
  }

  // Normal tarayıcı gibi görünüyor
  return { isBot: false, isAllowed: true }
}

/**
 * Headless browser tespiti
 */
export function detectHeadlessBrowser(headers: Headers): { isHeadless: boolean; indicators: string[] } {
  const indicators: string[] = []

  const userAgent = headers.get('user-agent') || ''
  const ua = userAgent.toLowerCase()

  // HeadlessChrome tespiti
  if (ua.includes('headlesschrome') || ua.includes('headless')) {
    indicators.push('headless-ua')
  }

  // Accept-Language eksikliği (botlar genelde göndermez)
  if (!headers.get('accept-language')) {
    indicators.push('no-accept-language')
  }

  // Accept-Encoding eksikliği
  if (!headers.get('accept-encoding')) {
    indicators.push('no-accept-encoding')
  }

  // Sec-CH-UA (Client Hints) - modern tarayıcılar gönderir
  const secChUa = headers.get('sec-ch-ua')
  if (secChUa && secChUa.includes('HeadlessChrome')) {
    indicators.push('headless-client-hint')
  }

  // webdriver flag
  if (headers.get('sec-ch-ua-platform') === '""' || headers.get('sec-ch-ua-mobile') === '""') {
    indicators.push('empty-client-hints')
  }

  // Referer kontrolü - soru sayfalarına direkt erişim şüpheli
  const referer = headers.get('referer')
  if (!referer) {
    indicators.push('no-referer')
  }

  return {
    isHeadless: indicators.length >= 2, // 2+ indikatör = muhtemelen bot
    indicators
  }
}

/**
 * IP tabanlı rate limiting için key oluştur
 */
export function getRateLimitKey(request: Request): string {
  // Cloudflare
  const cfIP = request.headers.get('cf-connecting-ip')
  if (cfIP) return `ip:${cfIP}`

  // Vercel / proxy
  const forwardedFor = request.headers.get('x-forwarded-for')
  if (forwardedFor) {
    return `ip:${forwardedFor.split(',')[0].trim()}`
  }

  // Real IP
  const realIP = request.headers.get('x-real-ip')
  if (realIP) return `ip:${realIP}`

  return 'ip:unknown'
}

/**
 * Soru endpoint'leri için özel rate limit
 */
export const QUESTION_API_LIMITS = {
  // Soru listesi: 1 dakikada max 30 istek
  QUESTION_LIST: {
    windowMs: 60000,
    maxRequests: 30,
    blockDurationMs: 300000 // 5 dakika engel
  },
  // Soru detayı: 1 dakikada max 60 istek
  QUESTION_DETAIL: {
    windowMs: 60000,
    maxRequests: 60,
    blockDurationMs: 180000 // 3 dakika engel
  },
  // Arama: 1 dakikada max 20 istek
  SEARCH: {
    windowMs: 60000,
    maxRequests: 20,
    blockDurationMs: 600000 // 10 dakika engel
  }
}

// In-memory scraping attempt tracker
const scrapingAttempts = new Map<string, { count: number; lastAttempt: number; blocked: boolean; blockedUntil?: number }>()

/**
 * Scraping girişimini kaydet ve kontrol et
 */
export function trackScrapingAttempt(key: string): { blocked: boolean; attemptCount: number } {
  const now = Date.now()
  let entry = scrapingAttempts.get(key)

  // Engel süresi dolmuş mu?
  if (entry?.blocked && entry.blockedUntil && now > entry.blockedUntil) {
    entry = { count: 0, lastAttempt: now, blocked: false }
  }

  // Yeni kayıt veya 1 saatten eski
  if (!entry || now - entry.lastAttempt > 3600000) {
    entry = { count: 1, lastAttempt: now, blocked: false }
    scrapingAttempts.set(key, entry)
    return { blocked: false, attemptCount: 1 }
  }

  // Zaten engelli
  if (entry.blocked) {
    return { blocked: true, attemptCount: entry.count }
  }

  // Sayacı artır
  entry.count++
  entry.lastAttempt = now

  // 1 saatte 100+ şüpheli istek = engelle
  if (entry.count > 100) {
    entry.blocked = true
    entry.blockedUntil = now + 86400000 // 24 saat engel
    scrapingAttempts.set(key, entry)
    return { blocked: true, attemptCount: entry.count }
  }

  scrapingAttempts.set(key, entry)
  return { blocked: false, attemptCount: entry.count }
}

/**
 * Tam güvenlik kontrolü
 */
export function performSecurityCheck(request: Request): SecurityCheckResult {
  const headers = request.headers
  const userAgent = headers.get('user-agent')
  const url = new URL(request.url)
  const path = url.pathname
  
  let riskScore = 0
  const reasons: string[] = []

  // 1. User-Agent kontrolü
  const uaCheck = checkUserAgent(userAgent)
  if (uaCheck.isBot && !uaCheck.isAllowed) {
    riskScore += 50
    reasons.push(`blocked-bot:${uaCheck.botType}`)
  }

  // 2. Headless browser tespiti
  const headlessCheck = detectHeadlessBrowser(headers)
  if (headlessCheck.isHeadless) {
    riskScore += 30
    reasons.push(`headless:${headlessCheck.indicators.join(',')}`)
  }

  // 3. Soru endpoint'lerine erişim kontrolü
  const isQuestionEndpoint = path.includes('/api/search/questions') || 
                              path.includes('/api/questions') ||
                              path.includes('/soru-bankasi')
  
  if (isQuestionEndpoint) {
    const key = getRateLimitKey(request)
    const attempt = trackScrapingAttempt(key)
    
    if (attempt.blocked) {
      riskScore += 100
      reasons.push('rate-blocked')
    } else if (attempt.attemptCount > 50) {
      riskScore += 20
      reasons.push('high-frequency')
    }
  }

  // 4. Şüpheli pattern'ler
  // Çok hızlı ardışık istekler için timestamp kontrolü
  const timestamp = headers.get('x-request-timestamp')
  if (timestamp) {
    const requestTime = parseInt(timestamp)
    if (Date.now() - requestTime < 100) {
      riskScore += 10
      reasons.push('too-fast')
    }
  }

  // Karar
  const allowed = riskScore < 50
  const isBot = uaCheck.isBot
  const isSuspicious = riskScore >= 30

  return {
    allowed,
    reason: reasons.length > 0 ? reasons.join('; ') : undefined,
    riskScore,
    isBot,
    isSuspicious
  }
}

/**
 * Güvenlik log'u oluştur (Supabase'e kaydetmek için)
 */
export function createSecurityLog(
  request: Request,
  checkResult: SecurityCheckResult,
  userId?: string
): {
  ip_address: string
  user_agent: string
  path: string
  method: string
  risk_score: number
  is_blocked: boolean
  reasons: string
  user_id?: string
  timestamp: string
} {
  const ip = getRateLimitKey(request).replace('ip:', '')
  
  return {
    ip_address: ip,
    user_agent: request.headers.get('user-agent') || 'unknown',
    path: new URL(request.url).pathname,
    method: request.method,
    risk_score: checkResult.riskScore,
    is_blocked: !checkResult.allowed,
    reasons: checkResult.reason || '',
    user_id: userId,
    timestamp: new Date().toISOString()
  }
}

// Periyodik temizlik
setInterval(() => {
  const now = Date.now()
  const entries = Array.from(scrapingAttempts.entries())
  entries.forEach(([key, entry]) => {
    // 24 saatten eski kayıtları sil
    if (now - entry.lastAttempt > 86400000) {
      scrapingAttempts.delete(key)
    }
    // Engeli kalkmış kayıtları temizle
    if (entry.blocked && entry.blockedUntil && now > entry.blockedUntil) {
      scrapingAttempts.delete(key)
    }
  })
}, 3600000) // Her saat temizle
