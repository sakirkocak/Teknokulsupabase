import Typesense from 'typesense'

/**
 * Typesense Server-Side Client
 * 
 * ONEMLI: Bu client SADECE server-side'da kullanilmali (API routes, server components)
 * Client-side'da kullanmayin - environment degiskenleri expose olur!
 */
export const typesenseClient = new Typesense.Client({
  nodes: [{
    host: process.env.TYPESENSE_HOST || '',
    port: 443,
    protocol: 'https'
  }],
  apiKey: process.env.TYPESENSE_API_KEY || '',
  connectionTimeoutSeconds: 5
})

// Eski isimle de export et (geriye uyumluluk)
export const typesenseAdmin = typesenseClient

// Feature flag - Typesense aktif mi?
// Server-side'da TYPESENSE_HOST varligina gore, client-side'da her zaman false
export const USE_TYPESENSE = typeof window === 'undefined' 
  ? !!process.env.TYPESENSE_HOST && !!process.env.TYPESENSE_API_KEY
  : false

// Collection isimleri
export const COLLECTIONS = {
  LEADERBOARD: 'leaderboard',
  QUESTIONS: 'questions'
} as const

/**
 * Typesense'in kullanilabilir olup olmadigini kontrol et
 */
export function isTypesenseAvailable(): boolean {
  return USE_TYPESENSE && !!process.env.TYPESENSE_HOST && !!process.env.TYPESENSE_API_KEY
}

