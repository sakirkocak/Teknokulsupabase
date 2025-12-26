import { USE_TYPESENSE } from '@/lib/typesense/client'
import { searchQuestionsTypesense, getRelatedQuestionsTypesense } from './typesense'
import { searchQuestionsSupabase, getRelatedQuestionsSupabase } from './supabase'

export interface SearchParams {
  query: string
  grade?: number
  subjectCode?: string
  topicId?: string
  difficulty?: string
  limit?: number
}

export interface SearchResult {
  question_id: string
  question_text: string
  subject_name: string
  subject_code: string
  main_topic: string
  sub_topic?: string
  difficulty: string
  grade: number
  highlight?: string
}

export interface RelatedParams {
  questionId: string
  topicId: string
  subjectCode: string
  grade: number
  difficulty: string
  limit?: number
}

/**
 * Soru ara
 * Feature flag'e göre Typesense veya Supabase'den arama yapar
 */
export async function searchQuestions(params: SearchParams): Promise<SearchResult[]> {
  try {
    if (USE_TYPESENSE) {
      return await searchQuestionsTypesense(params)
    }
    return await searchQuestionsSupabase(params)
  } catch (error) {
    console.error('Search error:', error)
    // Typesense başarısız olursa Supabase'e fallback
    if (USE_TYPESENSE) {
      console.log('Search: Falling back to Supabase...')
      return await searchQuestionsSupabase(params)
    }
    throw error
  }
}

/**
 * Benzer soruları getir
 */
export async function getRelatedQuestions(params: RelatedParams): Promise<SearchResult[]> {
  try {
    if (USE_TYPESENSE) {
      return await getRelatedQuestionsTypesense(params)
    }
    return await getRelatedQuestionsSupabase(params)
  } catch (error) {
    console.error('Related questions error:', error)
    // Typesense başarısız olursa Supabase'e fallback
    if (USE_TYPESENSE) {
      console.log('Related: Falling back to Supabase...')
      return await getRelatedQuestionsSupabase(params)
    }
    throw error
  }
}

