import { typesenseSearch, COLLECTIONS } from '@/lib/typesense/client'
import { SearchParams, SearchResult, RelatedParams } from './index'

/**
 * Typesense'den soru ara
 */
export async function searchQuestionsTypesense(
  params: SearchParams
): Promise<SearchResult[]> {
  const { query, grade, subjectCode, topicId, difficulty, limit = 20 } = params
  
  if (!query || query.length < 2) {
    return []
  }
  
  // Filtreler
  const filters: string[] = []
  
  if (grade) {
    filters.push(`grade:=${grade}`)
  }
  
  if (subjectCode) {
    filters.push(`subject_code:=${subjectCode}`)
  }
  
  if (topicId) {
    filters.push(`topic_id:=${topicId}`)
  }
  
  if (difficulty) {
    filters.push(`difficulty:=${difficulty}`)
  }
  
  const searchParams: any = {
    q: query,
    query_by: 'question_text,main_topic,sub_topic',
    per_page: limit,
    highlight_full_fields: 'question_text',
    include_fields: [
      'question_id', 'question_text', 'subject_name', 'subject_code',
      'main_topic', 'sub_topic', 'difficulty', 'grade'
    ].join(',')
  }
  
  if (filters.length > 0) {
    searchParams.filter_by = filters.join(' && ')
  }
  
  const results = await typesenseSearch
    .collections(COLLECTIONS.QUESTIONS)
    .documents()
    .search(searchParams)
  
  return results.hits?.map(hit => {
    const doc = hit.document as any
    const highlightObj = hit.highlight as Record<string, { snippet?: string }> | undefined
    const highlight = highlightObj?.question_text?.snippet
    
    return {
      question_id: doc.question_id,
      question_text: doc.question_text,
      subject_name: doc.subject_name || '',
      subject_code: doc.subject_code || '',
      main_topic: doc.main_topic || '',
      sub_topic: doc.sub_topic,
      difficulty: doc.difficulty,
      grade: doc.grade || 0,
      highlight: highlight
    }
  }) || []
}

/**
 * Typesense'den benzer soruları getir
 */
export async function getRelatedQuestionsTypesense(
  params: RelatedParams
): Promise<SearchResult[]> {
  const { questionId, topicId, subjectCode, grade, difficulty, limit = 5 } = params
  
  // Öncelik 1: Aynı topic'teki sorular
  const filters = [
    `question_id:!=${questionId}`, // Kendisi hariç
    `topic_id:=${topicId}`
  ]
  
  let searchParams: any = {
    q: '*',
    query_by: 'question_text',
    filter_by: filters.join(' && '),
    per_page: limit,
    include_fields: [
      'question_id', 'question_text', 'subject_name', 'subject_code',
      'main_topic', 'sub_topic', 'difficulty', 'grade'
    ].join(',')
  }
  
  let results = await typesenseSearch
    .collections(COLLECTIONS.QUESTIONS)
    .documents()
    .search(searchParams)
  
  // Yeterli sonuç yoksa aynı ders ve sınıftan genişlet
  if (!results.hits || results.hits.length < limit) {
    const broaderFilters = [
      `question_id:!=${questionId}`,
      `subject_code:=${subjectCode}`,
      `grade:=${grade}`
    ]
    
    searchParams = {
      q: '*',
      query_by: 'question_text',
      filter_by: broaderFilters.join(' && '),
      per_page: limit,
      include_fields: [
        'question_id', 'question_text', 'subject_name', 'subject_code',
        'main_topic', 'sub_topic', 'difficulty', 'grade'
      ].join(',')
    }
    
    results = await typesenseSearch
      .collections(COLLECTIONS.QUESTIONS)
      .documents()
      .search(searchParams)
  }
  
  return results.hits?.map(hit => {
    const doc = hit.document as any
    return {
      question_id: doc.question_id,
      question_text: doc.question_text,
      subject_name: doc.subject_name || '',
      subject_code: doc.subject_code || '',
      main_topic: doc.main_topic || '',
      sub_topic: doc.sub_topic,
      difficulty: doc.difficulty,
      grade: doc.grade || 0
    }
  }) || []
}

/**
 * Facet (kategori) bilgilerini getir
 */
export async function getSearchFacets(): Promise<{
  subjects: Array<{ value: string; count: number }>
  grades: Array<{ value: number; count: number }>
  difficulties: Array<{ value: string; count: number }>
}> {
  const results = await typesenseSearch
    .collections(COLLECTIONS.QUESTIONS)
    .documents()
    .search({
      q: '*',
      query_by: 'question_text',
      facet_by: 'subject_name,grade,difficulty',
      max_facet_values: 20,
      per_page: 0 // Sadece facet'ler
    })
  
  const facetCounts = results.facet_counts || []
  
  const subjectFacet = facetCounts.find(f => f.field_name === 'subject_name')
  const gradeFacet = facetCounts.find(f => f.field_name === 'grade')
  const difficultyFacet = facetCounts.find(f => f.field_name === 'difficulty')
  
  return {
    subjects: subjectFacet?.counts?.map(c => ({ 
      value: c.value as string, 
      count: c.count 
    })) || [],
    grades: gradeFacet?.counts?.map(c => ({ 
      value: Number(c.value), 
      count: c.count 
    })) || [],
    difficulties: difficultyFacet?.counts?.map(c => ({ 
      value: c.value as string, 
      count: c.count 
    })) || []
  }
}

