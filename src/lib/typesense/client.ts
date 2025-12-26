import Typesense from 'typesense'

// Server-side admin client (API routes, scripts için)
export const typesenseAdmin = new Typesense.Client({
  nodes: [{
    host: process.env.TYPESENSE_HOST || '',
    port: 443,
    protocol: 'https'
  }],
  apiKey: process.env.TYPESENSE_API_KEY || '',
  connectionTimeoutSeconds: 5
})

// Client-side search client (frontend için)
export const typesenseSearch = new Typesense.Client({
  nodes: [{
    host: process.env.NEXT_PUBLIC_TYPESENSE_HOST || '',
    port: 443,
    protocol: 'https'
  }],
  apiKey: process.env.NEXT_PUBLIC_TYPESENSE_SEARCH_KEY || '',
  connectionTimeoutSeconds: 2
})

// Feature flag - Typesense aktif mi?
// NOT: Vercel env variables düzgün ayarlanana kadar false
export const USE_TYPESENSE = false // process.env.NEXT_PUBLIC_USE_TYPESENSE === 'true'

// Collection isimleri
export const COLLECTIONS = {
  LEADERBOARD: 'leaderboard',
  QUESTIONS: 'questions'
} as const

