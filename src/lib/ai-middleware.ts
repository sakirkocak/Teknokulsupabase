/**
 * AI Endpoint Koruma Middleware
 * - Auth: Supabase session kontrolu
 * - Rate Limit: userId bazli istek siniri
 * - Cache: LRU cache ile tekrarlayan istekleri onbellekle
 * - SSRF: URL dogrulama (analyze-exam icin)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkRateLimit, getClientIP } from '@/lib/rateLimit'
import { LRUCache, createCacheKey } from '@/lib/cache'

// AI response cache (200 entry, 30 dk default TTL)
const aiResponseCache = new LRUCache<any>(200, 30 * 60 * 1000)

// Rate limit configs per endpoint
export const AI_RATE_LIMITS = {
  'solve-question': { windowMs: 60000, maxRequests: 10, blockDurationMs: 120000 },
  'explain-topic': { windowMs: 60000, maxRequests: 15, blockDurationMs: 60000 },
  'generate-questions': { windowMs: 60000, maxRequests: 5, blockDurationMs: 120000 },
  'generate-plan': { windowMs: 60000, maxRequests: 3, blockDurationMs: 180000 },
  'analyze-exam': { windowMs: 60000, maxRequests: 5, blockDurationMs: 120000 },
} as const

export type AIEndpoint = keyof typeof AI_RATE_LIMITS

interface AIProtectionResult {
  allowed: boolean
  userId?: string
  response?: NextResponse
}

/**
 * AI endpoint icin auth + rate limit kontrolu
 */
export async function withAIProtection(
  request: NextRequest,
  endpoint: AIEndpoint
): Promise<AIProtectionResult> {
  // 1. Auth kontrolu
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return {
      allowed: false,
      response: NextResponse.json(
        { error: 'Giris yapmaniz gerekiyor' },
        { status: 401 }
      )
    }
  }

  // 2. Rate limit kontrolu (userId + IP)
  const clientIP = getClientIP(request)
  const rateLimitKey = `ai:${endpoint}:${user.id}`
  const config = AI_RATE_LIMITS[endpoint]
  const rateResult = checkRateLimit(rateLimitKey, config)

  if (!rateResult.allowed) {
    return {
      allowed: false,
      response: NextResponse.json(
        {
          error: 'Cok fazla istek gonderdiniz. Lutfen bekleyin.',
          retryAfter: Math.ceil(rateResult.resetIn / 1000)
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil(rateResult.resetIn / 1000)),
            'X-RateLimit-Remaining': String(rateResult.remaining)
          }
        }
      )
    }
  }

  return { allowed: true, userId: user.id }
}

/**
 * Cache'den yanit al (varsa)
 */
export function getCachedResponse(cacheKey: string): any | null {
  return aiResponseCache.get(cacheKey)
}

/**
 * Yaniti cache'e kaydet
 */
export function setCachedResponse(cacheKey: string, data: any, ttlMs?: number): void {
  aiResponseCache.set(cacheKey, data, ttlMs)
}

/**
 * Cache key olustur (input hash)
 */
export function makeAICacheKey(endpoint: string, ...parts: string[]): string {
  return createCacheKey(`ai:${endpoint}`, ...parts)
}

// ============================================
// SSRF KORUMASI (analyze-exam icin)
// ============================================

const PRIVATE_IP_PATTERNS = [
  /^127\./,
  /^10\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^192\.168\./,
  /^169\.254\./,
  /^0\./,
  /^::1$/,
  /^fc00:/,
  /^fe80:/,
  /^localhost$/i,
]

/**
 * URL'nin guvenli olup olmadigini kontrol et (SSRF korumasi)
 */
export function validateExternalURL(url: string): { safe: boolean; error?: string } {
  try {
    const parsed = new URL(url)

    // Sadece HTTPS
    if (parsed.protocol !== 'https:') {
      return { safe: false, error: 'Sadece HTTPS URL kabul edilir' }
    }

    // Private IP kontrolu
    const hostname = parsed.hostname
    for (const pattern of PRIVATE_IP_PATTERNS) {
      if (pattern.test(hostname)) {
        return { safe: false, error: 'Dahili ag adreslerine erisim engellendi' }
      }
    }

    return { safe: true }
  } catch {
    return { safe: false, error: 'Gecersiz URL' }
  }
}

/**
 * Guvenli fetch (timeout + size limit)
 */
export async function safeFetch(url: string, maxSizeBytes: number = 10 * 1024 * 1024): Promise<Response> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 10000) // 10s timeout

  try {
    const response = await fetch(url, { signal: controller.signal })

    // Size kontrolu
    const contentLength = response.headers.get('content-length')
    if (contentLength && parseInt(contentLength) > maxSizeBytes) {
      throw new Error(`Dosya cok buyuk (max ${Math.round(maxSizeBytes / 1024 / 1024)}MB)`)
    }

    return response
  } finally {
    clearTimeout(timeout)
  }
}
