import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { typesenseClient, isTypesenseAvailable, COLLECTIONS } from '@/lib/typesense/client'

/**
 * Adaptive Learning API
 * 
 * Öğrencinin performansına göre uygun zorlukta soru seçer.
 * - Streak yüksekse -> zor sorular
 * - Başarı düşükse -> kolay sorular
 * - Normal durumda -> orta zorluk
 */

// Zorluk seviyeleri
const DIFFICULTY_ORDER = ['easy', 'medium', 'hard', 'legendary'] as const

interface AdaptiveParams {
  studentId: string
  topicId?: string
  subjectCode?: string
  grade?: number
  consecutiveCorrect?: number
  consecutiveWrong?: number
  currentDifficulty?: string
  excludeQuestionIds?: string[]
}

// Adaptive zorluk hesaplama
function calculateAdaptiveDifficulty(params: {
  consecutiveCorrect: number
  consecutiveWrong: number
  currentDifficulty: string
  topicSuccessRate?: number
}): string {
  const { consecutiveCorrect, consecutiveWrong, currentDifficulty, topicSuccessRate } = params
  
  const currentIndex = DIFFICULTY_ORDER.indexOf(currentDifficulty as any)
  
  // 3 üst üste doğru -> zorluk artsın
  if (consecutiveCorrect >= 3) {
    const newIndex = Math.min(currentIndex + 1, DIFFICULTY_ORDER.length - 1)
    return DIFFICULTY_ORDER[newIndex]
  }
  
  // 2 üst üste yanlış -> zorluk azalsın
  if (consecutiveWrong >= 2) {
    const newIndex = Math.max(currentIndex - 1, 0)
    return DIFFICULTY_ORDER[newIndex]
  }
  
  // Topic başarı oranına göre ayarla
  if (topicSuccessRate !== undefined) {
    if (topicSuccessRate >= 80 && currentIndex < DIFFICULTY_ORDER.length - 1) {
      return DIFFICULTY_ORDER[currentIndex + 1]
    }
    if (topicSuccessRate < 50 && currentIndex > 0) {
      return DIFFICULTY_ORDER[currentIndex - 1]
    }
  }
  
  return currentDifficulty
}

export async function POST(req: NextRequest) {
  try {
    const params: AdaptiveParams = await req.json()
    
    const {
      studentId,
      topicId,
      subjectCode,
      grade,
      consecutiveCorrect = 0,
      consecutiveWrong = 0,
      currentDifficulty = 'medium',
      excludeQuestionIds = []
    } = params
    
    // Öğrencinin topic istatistiklerini çek
    let topicSuccessRate: number | undefined
    
    if (studentId && topicId) {
      const supabase = await createClient()
      const { data: topicStats } = await supabase
        .from('student_topic_stats')
        .select('total_attempted, total_correct, current_difficulty, mastery_level')
        .eq('student_id', studentId)
        .eq('topic_id', topicId)
        .single()
      
      if (topicStats && topicStats.total_attempted > 0) {
        topicSuccessRate = (topicStats.total_correct / topicStats.total_attempted) * 100
      }
    }
    
    // Adaptive zorluk hesapla
    const adaptiveDifficulty = calculateAdaptiveDifficulty({
      consecutiveCorrect,
      consecutiveWrong,
      currentDifficulty,
      topicSuccessRate
    })
    
    // Soru getir
    if (isTypesenseAvailable()) {
      try {
        // Typesense filtresi oluştur
        const filters: string[] = []
        
        if (topicId) {
          filters.push(`topic_id:=${topicId}`)
        } else if (subjectCode) {
          filters.push(`subject_code:=${subjectCode}`)
        }
        
        if (grade) {
          filters.push(`grade:=${grade}`)
        }
        
        // Adaptif zorluk filtresi - tam eşleşme veya komşu zorluklar
        const diffIndex = DIFFICULTY_ORDER.indexOf(adaptiveDifficulty as any)
        const allowedDifficulties = [adaptiveDifficulty]
        if (diffIndex > 0) allowedDifficulties.push(DIFFICULTY_ORDER[diffIndex - 1])
        if (diffIndex < DIFFICULTY_ORDER.length - 1) allowedDifficulties.push(DIFFICULTY_ORDER[diffIndex + 1])
        filters.push(`difficulty:[${allowedDifficulties.join(',')}]`)  // Doğru Typesense syntax
        
        // Çözülmüş soruları hariç tut (limit)
        // NOT: Typesense'de NOT IN filtresi için farklı yöntem gerekiyor
        // Şimdilik sonuçları client-side filtreleyeceğiz
        
        const result = await typesenseClient
          .collections(COLLECTIONS.QUESTIONS)
          .documents()
          .search({
            q: '*',
            query_by: 'question_text',
            filter_by: filters.join(' && '),
            sort_by: '_text_match:desc,times_answered:asc', // Az çözülenlere öncelik
            per_page: 20
          })
        
        const hits = result.hits || []
        
        // Exclude edilen soruları filtrele
        let candidates = hits.filter(hit => {
          const doc = hit.document as any
          return !excludeQuestionIds.includes(doc.question_id || doc.id)
        })
        
        if (candidates.length === 0 && hits.length > 0) {
          // Exclude edilmeyenler bitti, herhangi birini seç
          candidates = hits
        }
        
        if (candidates.length > 0) {
          // Ağırlıklı rastgele seçim - adaptif zorluğa tam uyanlara öncelik
          const exactMatch = candidates.filter(hit => {
            const doc = hit.document as any
            return doc.difficulty === adaptiveDifficulty
          })
          
          const pool = exactMatch.length > 0 ? exactMatch : candidates
          const randomIndex = Math.floor(Math.random() * pool.length)
          const selectedQuestion = pool[randomIndex].document as any
          
          return NextResponse.json({
            success: true,
            source: 'typesense',
            adaptiveDifficulty,
            question: {
              id: selectedQuestion.question_id || selectedQuestion.id,
              question_text: selectedQuestion.question_text,
              difficulty: selectedQuestion.difficulty,
              subject_name: selectedQuestion.subject_name,
              main_topic: selectedQuestion.main_topic,
              times_answered: selectedQuestion.times_answered,
              success_rate: selectedQuestion.success_rate
            },
            debug: {
              totalCandidates: candidates.length,
              exactMatches: exactMatch.length,
              topicSuccessRate
            }
          })
        }
      } catch (error: any) {
        // 400/404 hatalarını sessizce logla, Supabase fallback'e düş
        const status = error?.httpStatus || error?.status
        if (status === 400 || status === 404) {
          console.warn(`⚠️ Adaptive Question: Typesense ${status} hatası, Supabase'e geçiliyor`)
        } else {
          console.error('Typesense adaptive question error:', error?.message || error)
        }
        // Fallback to Supabase
      }
    }
    
    // Supabase fallback
    const supabase = await createClient()
    
    let query = supabase
      .from('questions')
      .select('id, question_text, difficulty, topic_id, options, correct_answer, explanation, question_image_url, topic:topics(main_topic, grade, subject:subjects(name, code))')
      .eq('is_active', true)
    
    if (topicId) {
      query = query.eq('topic_id', topicId)
    }
    
    // Adaptif zorluk filtresi
    const diffIndex = DIFFICULTY_ORDER.indexOf(adaptiveDifficulty as any)
    const allowedDifficulties = [adaptiveDifficulty]
    if (diffIndex > 0) allowedDifficulties.push(DIFFICULTY_ORDER[diffIndex - 1])
    if (diffIndex < DIFFICULTY_ORDER.length - 1) allowedDifficulties.push(DIFFICULTY_ORDER[diffIndex + 1])
    
    query = query.in('difficulty', allowedDifficulties)
    
    // Exclude
    if (excludeQuestionIds.length > 0) {
      query = query.not('id', 'in', `(${excludeQuestionIds.join(',')})`)
    }
    
    query = query.limit(20)
    
    const { data: questions, error } = await query
    
    if (error) {
      console.error('Supabase adaptive question error:', error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
    
    if (!questions || questions.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'No questions found',
        adaptiveDifficulty 
      }, { status: 404 })
    }
    
    // Ağırlıklı seçim
    const exactMatch = questions.filter(q => q.difficulty === adaptiveDifficulty)
    const pool = exactMatch.length > 0 ? exactMatch : questions
    const randomIndex = Math.floor(Math.random() * pool.length)
    const selectedQuestion = pool[randomIndex]
    
    return NextResponse.json({
      success: true,
      source: 'supabase',
      adaptiveDifficulty,
      question: selectedQuestion,
      debug: {
        totalCandidates: questions.length,
        exactMatches: exactMatch.length,
        topicSuccessRate
      }
    })
    
  } catch (error) {
    console.error('Adaptive question API error:', error)
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    )
  }
}

// GET - Öğrencinin topic istatistiklerini getir
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const studentId = searchParams.get('studentId')
    const topicId = searchParams.get('topicId')
    
    if (!studentId) {
      return NextResponse.json({ error: 'studentId required' }, { status: 400 })
    }
    
    const supabase = await createClient()
    
    let query = supabase
      .from('student_topic_stats')
      .select(`
        *,
        topic:topics(
          main_topic,
          grade,
          subject:subjects(name, code)
        )
      `)
      .eq('student_id', studentId)
    
    if (topicId) {
      query = query.eq('topic_id', topicId)
    }
    
    const { data, error } = await query
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    // Zayıf ve güçlü konuları hesapla
    const stats = data || []
    const weakTopics = stats
      .filter(s => s.total_attempted >= 5 && (s.total_correct / s.total_attempted) < 0.5)
      .map(s => ({
        topicId: s.topic_id,
        mainTopic: s.topic?.main_topic,
        subjectName: s.topic?.subject?.name,
        successRate: s.total_attempted > 0 ? Math.round((s.total_correct / s.total_attempted) * 100) : 0,
        masteryLevel: s.mastery_level
      }))
    
    const strongTopics = stats
      .filter(s => s.total_attempted >= 5 && (s.total_correct / s.total_attempted) >= 0.7)
      .map(s => ({
        topicId: s.topic_id,
        mainTopic: s.topic?.main_topic,
        subjectName: s.topic?.subject?.name,
        successRate: s.total_attempted > 0 ? Math.round((s.total_correct / s.total_attempted) * 100) : 0,
        masteryLevel: s.mastery_level
      }))
    
    return NextResponse.json({
      success: true,
      stats: topicId ? stats[0] || null : stats,
      weakTopics,
      strongTopics,
      summary: {
        totalTopics: stats.length,
        masteredTopics: stats.filter(s => s.mastery_level === 'master').length,
        learningTopics: stats.filter(s => s.mastery_level === 'learning' || s.mastery_level === 'proficient').length,
        beginnerTopics: stats.filter(s => s.mastery_level === 'beginner').length
      }
    })
    
  } catch (error) {
    console.error('Student stats API error:', error)
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    )
  }
}

