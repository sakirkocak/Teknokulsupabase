/**
 * Typesense question_banks işlemleri
 * Sadece isim araması için
 */

import Typesense from 'typesense'

// Typesense client
function getClient() {
  return new Typesense.Client({
    nodes: [{
      host: process.env.TYPESENSE_HOST || '',
      port: 443,
      protocol: 'https'
    }],
    apiKey: process.env.TYPESENSE_API_KEY || '',
    connectionTimeoutSeconds: 5
  })
}

export interface BankDocument {
  id: string
  title: string
  slug: string
  subject_name?: string
  grade?: number
  question_count: number
  download_count?: number
  created_at?: number
}

// Soru bankası ekle/güncelle
export async function upsertBank(bank: BankDocument) {
  if (!process.env.TYPESENSE_HOST || !process.env.TYPESENSE_API_KEY) {
    console.warn('Typesense env vars missing, skipping index')
    return
  }

  try {
    const client = getClient()
    await client.collections('question_banks').documents().upsert({
      id: bank.id,
      title: bank.title,
      slug: bank.slug,
      subject_name: bank.subject_name || '',
      grade: bank.grade || 0,
      question_count: bank.question_count,
      download_count: bank.download_count || 0,
      created_at: bank.created_at || Date.now()
    })
    console.log(`✅ Bank indexed: ${bank.title}`)
  } catch (error) {
    console.error('Typesense upsert error:', error)
  }
}

// Soru bankası sil
export async function deleteBank(bankId: string) {
  if (!process.env.TYPESENSE_HOST || !process.env.TYPESENSE_API_KEY) {
    return
  }

  try {
    const client = getClient()
    await client.collections('question_banks').documents(bankId).delete()
    console.log(`✅ Bank deleted from index: ${bankId}`)
  } catch (error) {
    console.error('Typesense delete error:', error)
  }
}

// Soru bankası ara
export async function searchBanks(query: string, options?: {
  subject_name?: string
  grade?: number
  limit?: number
}) {
  if (!process.env.TYPESENSE_HOST || !process.env.TYPESENSE_API_KEY) {
    return { hits: [], found: 0 }
  }

  try {
    const client = getClient()
    
    const filterParts: string[] = []
    if (options?.subject_name) {
      filterParts.push(`subject_name:=${options.subject_name}`)
    }
    if (options?.grade) {
      filterParts.push(`grade:=${options.grade}`)
    }

    const result = await client.collections('question_banks').documents().search({
      q: query || '*',
      query_by: 'title',
      filter_by: filterParts.length > 0 ? filterParts.join(' && ') : undefined,
      per_page: options?.limit || 50,
      sort_by: query ? '_text_match:desc,download_count:desc' : 'created_at:desc'
    })

    return {
      hits: result.hits?.map((hit: any) => hit.document) || [],
      found: result.found || 0
    }
  } catch (error) {
    console.error('Typesense search error:', error)
    return { hits: [], found: 0 }
  }
}
