/**
 * 🧠 LRU Cache - TeknoÖğretmen için In-Memory Cache
 * 
 * Supabase ve API yükünü azaltmak için kullanılır
 * - Öğrenci profilleri (5 dk TTL)
 * - Öğrenci analizi sonuçları (5 dk TTL)
 * - Embedding sonuçları (10 dk TTL)
 */

interface CacheEntry<T> {
  value: T
  expiresAt: number
  hits: number
}

class LRUCache<T> {
  private cache: Map<string, CacheEntry<T>>
  private readonly maxSize: number
  private readonly defaultTTL: number

  constructor(maxSize: number = 500, defaultTTL: number = 5 * 60 * 1000) {
    this.cache = new Map()
    this.maxSize = maxSize
    this.defaultTTL = defaultTTL
  }

  get(key: string): T | null {
    const entry = this.cache.get(key)
    
    if (!entry) return null
    
    // TTL kontrolü
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key)
      return null
    }
    
    // LRU: En son erişileni sona taşı
    entry.hits++
    this.cache.delete(key)
    this.cache.set(key, entry)
    
    return entry.value
  }

  set(key: string, value: T, ttl?: number): void {
    // Max size kontrolü - en eski (ilk) elemanı sil
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value
      if (firstKey) this.cache.delete(firstKey)
    }
    
    this.cache.set(key, {
      value,
      expiresAt: Date.now() + (ttl || this.defaultTTL),
      hits: 0
    })
  }

  has(key: string): boolean {
    const entry = this.cache.get(key)
    if (!entry) return false
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key)
      return false
    }
    return true
  }

  delete(key: string): boolean {
    return this.cache.delete(key)
  }

  clear(): void {
    this.cache.clear()
  }

  // Cache istatistikleri
  stats(): { size: number, maxSize: number, keys: string[] } {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      keys: Array.from(this.cache.keys())
    }
  }

  // Süresi dolmuş kayıtları temizle
  cleanup(): number {
    const now = Date.now()
    let cleaned = 0
    
    this.cache.forEach((entry, key) => {
      if (now > entry.expiresAt) {
        this.cache.delete(key)
        cleaned++
      }
    })
    
    return cleaned
  }
}

// ============================================
// 📦 CACHE INSTANCES
// ============================================

// Öğrenci profilleri (5 dakika TTL)
export const profileCache = new LRUCache<{
  id: string
  full_name: string
  grade: number
  avatar_url?: string
}>(500, 5 * 60 * 1000)

// Öğrenci analizi sonuçları (5 dakika TTL) - any kullan çünkü StudentAnalysis API'den geliyor
export const studentAnalysisCache = new LRUCache<any>(500, 5 * 60 * 1000)

// Semantic search sonuçları (10 dakika TTL)
export const semanticSearchCache = new LRUCache<{
  questions: Array<{
    id: string
    question_text: string
    similarity: number
    main_topic: string
  }>
}>(200, 10 * 60 * 1000)

// Embedding cache (30 dakika TTL) - Sık kullanılan sorgular için
export const embeddingCache = new LRUCache<number[]>(100, 30 * 60 * 1000)

// ============================================
// 🔧 HELPER FUNCTIONS
// ============================================

/**
 * Cache key oluştur
 */
export function createCacheKey(prefix: string, ...parts: (string | number)[]): string {
  return `${prefix}:${parts.join(':')}`
}

/**
 * Cached fetch - Cache'te varsa döndür, yoksa fetch et ve cache'le
 */
export async function cachedFetch<T>(
  cache: LRUCache<T>,
  key: string,
  fetcher: () => Promise<T>,
  ttl?: number
): Promise<T> {
  // Cache'te var mı?
  const cached = cache.get(key)
  if (cached !== null) {
    return cached
  }
  
  // Fetch et
  const result = await fetcher()
  
  // Cache'le
  cache.set(key, result, ttl)
  
  return result
}

// ============================================
// 🧹 PERIODIC CLEANUP
// ============================================

// Her 5 dakikada bir süresi dolmuş kayıtları temizle
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    profileCache.cleanup()
    studentAnalysisCache.cleanup()
    semanticSearchCache.cleanup()
    embeddingCache.cleanup()
  }, 5 * 60 * 1000)
}

export { LRUCache }
export default {
  profileCache,
  studentAnalysisCache,
  semanticSearchCache,
  embeddingCache,
  createCacheKey,
  cachedFetch
}
