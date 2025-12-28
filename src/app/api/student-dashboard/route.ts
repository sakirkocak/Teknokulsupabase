import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { typesenseClient, COLLECTIONS } from '@/lib/typesense/client'

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Öğrenci profilini al
    const { data: studentProfile } = await supabase
      .from('student_profiles')
      .select('id, grade')
      .eq('user_id', user.id)
      .single()

    if (!studentProfile) {
      return NextResponse.json({ error: 'Student profile not found' }, { status: 404 })
    }

    const studentId = studentProfile.id
    const grade = studentProfile.grade || 8

    // Paralel olarak tüm Typesense sorgularını çalıştır
    const [
      topicProgressResult,
      leaderboardResult,
      recommendedQuestionsResult,
      studentStatsResult
    ] = await Promise.allSettled([
      // 1. Konu İlerlemeleri (Topic Mastery)
      typesenseClient.collections(COLLECTIONS.STUDENT_TOPIC_PROGRESS).documents().search({
        q: '*',
        query_by: 'subject_name',
        filter_by: `student_id:=${studentId}`,
        sort_by: 'last_practiced_at:desc',
        per_page: 100,
        facet_by: 'subject_code,mastery_level'
      }),

      // 2. Liderlik Tablosu
      typesenseClient.collections(COLLECTIONS.LEADERBOARD).documents().search({
        q: '*',
        query_by: 'full_name',
        filter_by: `grade:=${grade}`,
        sort_by: 'total_points:desc',
        per_page: 100
      }),

      // 3. Önerilen Sorular (zayıf konulardan)
      getRecommendedQuestions(studentId),

      // 4. Öğrenci İstatistikleri
      typesenseClient.collections(COLLECTIONS.STUDENT_STATS).documents().search({
        q: '*',
        query_by: 'student_name',
        filter_by: `student_id:=${studentId}`,
        per_page: 1
      })
    ])

    // Sonuçları işle
    const topicProgress = topicProgressResult.status === 'fulfilled' 
      ? topicProgressResult.value.hits?.map(h => h.document) || []
      : []

    const leaderboardData = leaderboardResult.status === 'fulfilled'
      ? leaderboardResult.value.hits?.map(h => h.document as any) || []
      : []

    const recommendedQuestions = recommendedQuestionsResult.status === 'fulfilled'
      ? recommendedQuestionsResult.value
      : []

    const studentStats = studentStatsResult.status === 'fulfilled'
      ? studentStatsResult.value.hits?.[0]?.document as any || null
      : null

    // Facet verilerini işle (konu mastery özeti)
    const facetCounts = topicProgressResult.status === 'fulfilled'
      ? topicProgressResult.value.facet_counts || []
      : []

    // Öğrencinin sıralamasını bul
    const myRankIndex = leaderboardData.findIndex((item: any) => item.student_id === studentId)
    const myRank = myRankIndex >= 0 ? myRankIndex + 1 : null
    const totalStudents = leaderboardData.length

    // Yakın rakipleri bul
    const nearbyRivals = myRankIndex >= 0
      ? leaderboardData.slice(Math.max(0, myRankIndex - 2), myRankIndex + 3)
      : []

    // Zayıf konuları bul (success_rate < 50)
    const weakTopics = topicProgress
      .filter((tp: any) => tp.success_rate < 50)
      .sort((a: any, b: any) => a.success_rate - b.success_rate)
      .slice(0, 5)

    // Güçlü konuları bul (success_rate >= 70)
    const strongTopics = topicProgress
      .filter((tp: any) => tp.success_rate >= 70)
      .sort((a: any, b: any) => b.success_rate - a.success_rate)
      .slice(0, 5)

    // Tekrar zamanı gelmiş konuları bul
    const now = Date.now()
    const reviewDueTopics = topicProgress
      .filter((tp: any) => tp.next_review_at && tp.next_review_at < now)
      .sort((a: any, b: any) => a.next_review_at - b.next_review_at)
      .slice(0, 5)

    // Ders bazlı mastery özeti
    const subjectMastery = calculateSubjectMastery(topicProgress, facetCounts)

    return NextResponse.json({
      success: true,
      data: {
        // Konu İlerlemeleri
        topicProgress: {
          all: topicProgress.slice(0, 20),
          weak: weakTopics,
          strong: strongTopics,
          reviewDue: reviewDueTopics,
          subjectMastery
        },
        
        // Liderlik
        leaderboard: {
          myRank,
          totalStudents,
          nearbyRivals,
          myPoints: leaderboardData[myRankIndex]?.total_points || 0
        },
        
        // Önerilen Sorular
        recommendedQuestions,
        
        // Genel İstatistikler
        stats: studentStats ? {
          totalQuestions: studentStats.total_questions || 0,
          totalCorrect: studentStats.total_correct || 0,
          successRate: studentStats.overall_success_rate || 0,
          currentStreak: studentStats.current_streak || 0,
          maxStreak: studentStats.max_streak || 0,
          totalPoints: studentStats.total_points || 0
        } : null
      }
    })

  } catch (error) {
    console.error('Student dashboard API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data', details: (error as Error).message },
      { status: 500 }
    )
  }
}

// Zayıf konulardan soru önerileri getir (çözülmüş soruları hariç tut)
async function getRecommendedQuestions(studentId: string) {
  try {
    const supabase = await createClient()
    
    // 1. Kullanıcının daha önce çözdüğü soruları al
    const { data: answeredQuestions } = await supabase
      .from('user_answers')
      .select('question_id')
      .eq('user_id', studentId)
      .limit(500) // Son 500 cevabı kontrol et
    
    const answeredIds = answeredQuestions?.map(a => a.question_id) || []
    
    // 2. Öğrencinin zayıf konularını bul
    const progressResult = await typesenseClient.collections(COLLECTIONS.STUDENT_TOPIC_PROGRESS).documents().search({
      q: '*',
      query_by: 'subject_name',
      filter_by: `student_id:=${studentId} && success_rate:<50`,
      sort_by: 'success_rate:asc',
      per_page: 5
    })

    const weakTopicIds = progressResult.hits?.map(h => (h.document as any).topic_id) || []

    // 3. Filter oluştur - çözülmüş soruları hariç tut
    let filterBy = ''
    if (answeredIds.length > 0) {
      // Typesense'de NOT IN yerine tüm soruları alıp JS'te filtreliyoruz
      // Çünkü Typesense id:[...]:! syntax'ını tam desteklemiyor
    }

    if (weakTopicIds.length === 0) {
      // Zayıf konu yoksa popüler sorular getir
      const randomResult = await typesenseClient.collections(COLLECTIONS.QUESTIONS).documents().search({
        q: '*',
        query_by: 'question_text',
        sort_by: 'times_answered:desc',
        per_page: 100 // Daha fazla çek, sonra filtrele
      })
      
      // Çözülmüş soruları JS'te filtrele
      const allQuestions = randomResult.hits?.map(h => h.document as any) || []
      const answeredIdSet = new Set(answeredIds)
      const filteredQuestions = allQuestions.filter(q => !answeredIdSet.has(q.question_id))
      
      return filteredQuestions.slice(0, 20)
    }

    // Zayıf konulardan sorular getir (daha fazla çek, sonra filtrele)
    const questionsResult = await typesenseClient.collections(COLLECTIONS.QUESTIONS).documents().search({
      q: '*',
      query_by: 'question_text',
      filter_by: `topic_id:[${weakTopicIds.join(',')}]`,
      sort_by: 'times_answered:desc',
      per_page: 100 // Daha fazla çek
    })

    // Çözülmüş soruları JS'te filtrele
    const allQuestions = questionsResult.hits?.map(h => h.document as any) || []
    const answeredIdSet = new Set(answeredIds)
    const filteredQuestions = allQuestions.filter(q => !answeredIdSet.has(q.question_id))

    return filteredQuestions.slice(0, 20)

  } catch (error) {
    console.error('Error fetching recommended questions:', error)
    return []
  }
}

// Ders bazlı mastery hesapla
function calculateSubjectMastery(topicProgress: any[], facetCounts: any[]) {
  const subjectMap: { [key: string]: { total: number, mastered: number, name: string } } = {}

  for (const topic of topicProgress) {
    const code = topic.subject_code || 'other'
    const name = topic.subject_name || 'Diğer'
    
    if (!subjectMap[code]) {
      subjectMap[code] = { total: 0, mastered: 0, name }
    }
    
    subjectMap[code].total++
    if (topic.success_rate >= 70) {
      subjectMap[code].mastered++
    }
  }

  return Object.entries(subjectMap).map(([code, data]) => ({
    code,
    name: data.name,
    total: data.total,
    mastered: data.mastered,
    percentage: data.total > 0 ? Math.round((data.mastered / data.total) * 100) : 0
  })).sort((a, b) => b.percentage - a.percentage)
}

