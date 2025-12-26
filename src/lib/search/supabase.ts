import { createClient } from '@/lib/supabase/client'
import { SearchParams, SearchResult, RelatedParams } from './index'

/**
 * Supabase'den soru ara
 */
export async function searchQuestionsSupabase(
  params: SearchParams
): Promise<SearchResult[]> {
  const supabase = createClient()
  const { query, grade, subjectCode, topicId, difficulty, limit = 20 } = params
  
  if (!query || query.length < 2) {
    return []
  }
  
  let dbQuery = supabase
    .from('questions')
    .select(`
      id,
      question_text,
      difficulty,
      topic:topics!inner(
        id,
        main_topic,
        sub_topic,
        grade,
        subject:subjects!inner(name, code)
      )
    `)
    .ilike('question_text', `%${query}%`)
    .eq('is_active', true)
    .limit(limit)
  
  if (grade) {
    dbQuery = dbQuery.eq('topic.grade', grade)
  }
  
  if (subjectCode) {
    dbQuery = dbQuery.eq('topic.subject.code', subjectCode)
  }
  
  if (topicId) {
    dbQuery = dbQuery.eq('topic_id', topicId)
  }
  
  if (difficulty) {
    dbQuery = dbQuery.eq('difficulty', difficulty)
  }
  
  const { data, error } = await dbQuery
  
  if (error) {
    console.error('Supabase search error:', error)
    throw error
  }
  
  return (data || []).map(q => ({
    question_id: q.id,
    question_text: q.question_text,
    subject_name: (q.topic as any)?.subject?.name || '',
    subject_code: (q.topic as any)?.subject?.code || '',
    main_topic: (q.topic as any)?.main_topic || '',
    sub_topic: (q.topic as any)?.sub_topic,
    difficulty: q.difficulty,
    grade: (q.topic as any)?.grade || 0
  }))
}

/**
 * Supabase'den benzer soruları getir (RPC kullanarak)
 */
export async function getRelatedQuestionsSupabase(
  params: RelatedParams
): Promise<SearchResult[]> {
  const supabase = createClient()
  const { questionId, topicId, subjectCode, grade, difficulty, limit = 5 } = params
  
  // RPC fonksiyonu varsa kullan
  const { data: rpcData, error: rpcError } = await supabase.rpc('get_related_questions', {
    p_question_id: questionId,
    p_topic_id: topicId,
    p_subject_code: subjectCode,
    p_grade: grade,
    p_difficulty: difficulty,
    p_limit: limit
  })
  
  if (!rpcError && rpcData) {
    return rpcData.map((q: any) => ({
      question_id: q.id,
      question_text: q.question_text,
      subject_name: q.subject_name || '',
      subject_code: q.subject_code || '',
      main_topic: q.main_topic || '',
      sub_topic: q.sub_topic,
      difficulty: q.difficulty,
      grade: q.grade || 0
    }))
  }
  
  // Fallback: Basit sorgu
  const { data, error } = await supabase
    .from('questions')
    .select(`
      id,
      question_text,
      difficulty,
      topic:topics!inner(
        main_topic,
        sub_topic,
        grade,
        subject:subjects!inner(name, code)
      )
    `)
    .eq('topic_id', topicId)
    .neq('id', questionId)
    .eq('is_active', true)
    .limit(limit)
  
  if (error) {
    console.error('Related questions error:', error)
    throw error
  }
  
  return (data || []).map(q => ({
    question_id: q.id,
    question_text: q.question_text,
    subject_name: (q.topic as any)?.subject?.name || '',
    subject_code: (q.topic as any)?.subject?.code || '',
    main_topic: (q.topic as any)?.main_topic || '',
    sub_topic: (q.topic as any)?.sub_topic,
    difficulty: q.difficulty,
    grade: (q.topic as any)?.grade || 0
  }))
}

