import { GoogleGenerativeAI } from '@google/generative-ai'

/**
 * 🧠 Gemini Embedding API
 * 
 * Metin → 768 boyutlu vektör dönüşümü
 * Semantic search için kullanılır
 * 
 * Model: text-embedding-004
 * Boyut: 768
 * Maliyet: Ücretsiz (15M token/dakika)
 */

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

// Embedding modeli
const embeddingModel = genAI.getGenerativeModel({ model: 'text-embedding-004' })

/**
 * Tek bir metin için embedding üret
 */
export async function getEmbedding(text: string): Promise<number[]> {
  if (!text || text.trim().length === 0) {
    throw new Error('Empty text cannot be embedded')
  }

  // Metni temizle ve kısalt (max 2048 token)
  const cleanedText = cleanTextForEmbedding(text)

  try {
    const result = await embeddingModel.embedContent(cleanedText)
    return result.embedding.values
  } catch (error: any) {
    console.error('Gemini embedding error:', error.message)
    throw error
  }
}

/**
 * Batch embedding - Birden fazla metin için (daha verimli)
 */
export async function getEmbeddingBatch(texts: string[]): Promise<number[][]> {
  if (!texts || texts.length === 0) {
    return []
  }

  const embeddings: number[][] = []
  
  // Gemini batch embedding desteklemiyor, paralel çağrı yapıyoruz
  // Rate limit'e dikkat: 15M token/dakika
  const batchSize = 10
  
  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize)
    
    const batchResults = await Promise.all(
      batch.map(async (text) => {
        try {
          return await getEmbedding(text)
        } catch (error) {
          console.error(`Failed to embed text: ${text.substring(0, 50)}...`)
          return null
        }
      })
    )
    
    embeddings.push(...batchResults.filter((e): e is number[] => e !== null))
    
    // Rate limit için kısa bekle (her 10 istekte)
    if (i + batchSize < texts.length) {
      await sleep(100)
    }
  }
  
  return embeddings
}

/**
 * Soru metni için optimize edilmiş embedding
 * Konu ve açıklama ile zenginleştirilmiş
 */
export async function getQuestionEmbedding(params: {
  questionText: string
  mainTopic?: string
  subTopic?: string
  subjectName?: string
  options?: { A: string; B: string; C: string; D: string; E?: string }
}): Promise<number[]> {
  const { questionText, mainTopic, subTopic, subjectName, options } = params
  
  // Zenginleştirilmiş metin oluştur
  let enrichedText = questionText
  
  // Konu bilgisini ekle
  if (mainTopic) {
    enrichedText = `[${mainTopic}] ${enrichedText}`
  }
  if (subTopic) {
    enrichedText = `[${subTopic}] ${enrichedText}`
  }
  if (subjectName) {
    enrichedText = `[${subjectName}] ${enrichedText}`
  }
  
  // Şıkları ekle (anlamı zenginleştirir)
  if (options) {
    const optionText = Object.entries(options)
      .filter(([_, v]) => v)
      .map(([k, v]) => `${k}) ${v}`)
      .join(' ')
    if (optionText) {
      enrichedText += ` Seçenekler: ${optionText}`
    }
  }
  
  return await getEmbedding(enrichedText)
}

/**
 * Arama sorgusu için embedding
 */
export async function getSearchEmbedding(query: string): Promise<number[]> {
  // Arama sorgusu genelde kısa, doğrudan embed et
  return await getEmbedding(query)
}

/**
 * Metni embedding için temizle
 */
function cleanTextForEmbedding(text: string): string {
  // HTML taglerini kaldır
  let cleaned = text.replace(/<[^>]*>/g, ' ')
  
  // Fazla boşlukları temizle
  cleaned = cleaned.replace(/\s+/g, ' ').trim()
  
  // Çok uzun metinleri kısalt (yaklaşık 2000 karakter)
  if (cleaned.length > 2000) {
    cleaned = cleaned.substring(0, 2000) + '...'
  }
  
  return cleaned
}

/**
 * Yardımcı: Bekle
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Cosine similarity hesapla (opsiyonel - debug için)
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Vectors must have same length')
  }
  
  let dotProduct = 0
  let normA = 0
  let normB = 0
  
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i]
    normA += a[i] * a[i]
    normB += b[i] * b[i]
  }
  
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB))
}
