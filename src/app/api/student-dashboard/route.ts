import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { typesenseClient, COLLECTIONS, isTypesenseAvailable } from '@/lib/typesense/client'

/**
 * Student Dashboard API
 * 
 * ✅ 404 Collection not found hatası graceful handle edilir
 * ✅ Typesense yoksa boş veri döner
 * ✅ Her sorgu ayrı try-catch içinde
 */

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

    // Typesense kullanılabilir mi kontrol et
    const typesenseReady = isTypesenseAvailable()
    console.log(`📊 [Dashboard] Typesense: ${typesenseReady ? 'aktif' : 'pasif'}`)

    // Paralel olarak tüm sorguları çalıştır - HER BİRİ AYRI TRY-CATCH
    const [
      topicProgressResult,
      leaderboardResult,
      recommendedQuestionsResult,
      studentStatsResult
    ] = await Promise.allSettled([
      // 1. Konu İlerlemeleri
      safeTypesenseQuery(() => 
        typesenseClient.collections(COLLECTIONS.STUDENT_TOPIC_PROGRESS).documents().search({
          q: '*',
          query_by: 'subject_name',
          filter_by: `student_id:=${studentId}`,
          sort_by: 'last_practiced_at:desc',
          per_page: 100,
          facet_by: 'subject_code,mastery_level'
        }),
        'STUDENT_TOPIC_PROGRESS'
      ),

      // 2. Liderlik Tablosu
      safeTypesenseQuery(() =>
        typesenseClient.collections(COLLECTIONS.LEADERBOARD).documents().search({
          q: '*',
          query_by: 'full_name',
          filter_by: `grade:=${grade}`,
          sort_by: 'total_points:desc',
          per_page: 100
        }),
        'LEADERBOARD'
      ),

      // 3. Önerilen Sorular
      getRecommendedQuestions(studentId),

      // 4. Öğrenci İstatistikleri
      safeTypesenseQuery(() =>
        typesenseClient.collections(COLLECTIONS.STUDENT_STATS).documents().search({
          q: '*',
          query_by: 'student_name',
          filter_by: `student_id:=${studentId}`,
          per_page: 1
        }),
        'STUDENT_STATS'
      )
    ])

    // Sonuçları işle - hata varsa boş dizi kullan
    const topicProgress = topicProgressResult.status === 'fulfilled' 
      ? topicProgressResult.value?.hits?.map(h => h.document) || []
      : []

    const leaderboardData = leaderboardResult.status === 'fulfilled'
      ? leaderboardResult.value?.hits?.map(h => h.document as any) || []
      : []

    const recommendedQuestions = recommendedQuestionsResult.status === 'fulfilled'
      ? recommendedQuestionsResult.value
      : []

    const studentStats = studentStatsResult.status === 'fulfilled'
      ? studentStatsResult.value?.hits?.[0]?.document as any || null
      : null

    // Facet verilerini işle
    const facetCounts = topicProgressResult.status === 'fulfilled'
      ? topicProgressResult.value?.facet_counts || []
      : []

    // Öğrencinin sıralamasını bul
    const myRankIndex = leaderboardData.findIndex((item: any) => item.student_id === studentId)
    const myRank = myRankIndex >= 0 ? myRankIndex + 1 : null
    const totalStudents = leaderboardData.length

    // Yakın rakipleri bul
    const nearbyRivals = myRankIndex >= 0
      ? leaderboardData.slice(Math.max(0, myRankIndex - 2), myRankIndex + 3)
      : []

    // Zayıf konuları bul
    const weakTopics = topicProgress
      .filter((tp: any) => tp.success_rate < 50)
      .sort((a: any, b: any) => a.success_rate - b.success_rate)
      .slice(0, 5)

    // Güçlü konuları bul
    const strongTopics = topicProgress
      .filter((tp: any) => tp.success_rate >= 70)
      .sort((a: any, b: any) => b.success_rate - a.success_rate)
      .slice(0, 5)

    // Tekrar zamanı gelmiş konular
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
        topicProgress: {
          all: topicProgress.slice(0, 20),
          weak: weakTopics,
          strong: strongTopics,
          reviewDue: reviewDueTopics,
          subjectMastery
        },
        leaderboard: {
          myRank,
          totalStudents,
          nearbyRivals,
          myPoints: leaderboardData[myRankIndex]?.total_points || 0
        },
        recommendedQuestions,
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
    console.error('❌ [Dashboard] Genel hata:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data', details: (error as Error).message },
      { status: 500 }
    )
  }
}

/**
 * Güvenli Typesense sorgusu - 404 ve diğer hataları yakalar
 */
async function safeTypesenseQuery<T>(
  queryFn: () => Promise<T>,
  collectionName: string
): Promise<T | null> {
  try {
    return await queryFn()
  } catch (error: any) {
    // 404 - Collection not found
    if (error?.httpStatus === 404 || error?.message?.includes('not found')) {
      console.warn(`⚠️ [Dashboard] Koleksiyon bulunamadı: ${collectionName}, varsayılan liste dönülüyor`)
      return null
    }
    
    // Diğer hatalar
    console.error(`❌ [Dashboard] Typesense sorgu hatası (${collectionName}):`, error?.message || error)
    return null
  }
}

/**
 * Önerilen soruları getir - 404 hatası graceful handle edilir
 */
async function getRecommendedQuestions(studentId: string): Promise<any[]> {
  try {
    const supabase = await createClient()
    
    // 1. Çözülmüş soruları al
    const { data: answeredQuestions } = await supabase
      .from('user_answers')
      .select('question_id')
      .eq('user_id', studentId)
      .limit(500)
    
    const answeredIds = answeredQuestions?.map(a => a.question_id) || []
    const answeredIdSet = new Set(answeredIds)

    // 2. Zayıf konuları bul
    let weakTopicIds: string[] = []
    try {
      const progressResult = await typesenseClient.collections(COLLECTIONS.STUDENT_TOPIC_PROGRESS).documents().search({
        q: '*',
        query_by: 'subject_name',
        filter_by: `student_id:=${studentId} && success_rate:<50`,
        sort_by: 'success_rate:asc',
        per_page: 5
      })
      weakTopicIds = progressResult.hits?.map(h => (h.document as any).topic_id) || []
    } catch (error: any) {
      if (error?.httpStatus === 404) {
        console.warn('⚠️ [Dashboard] student_topic_progress koleksiyonu bulunamadı')
      } else {
        console.error('❌ [Dashboard] Zayıf konu sorgusu hatası:', error?.message)
      }
    }

    // 3. Soruları getir
    let allQuestions: any[] = []
    try {
      // filterBy sadece topic varsa kullan, yoksa filter olmadan sor
      const searchParams: any = {
        q: '*',
        query_by: 'question_text',
        sort_by: 'created_at:desc',
        per_page: 100
      }
      
      // Sadece zayıf konular varsa filter ekle
      if (weakTopicIds.length > 0) {
        searchParams.filter_by = `topic_id:[${weakTopicIds.join(',')}]`
      }

      const questionsResult = await typesenseClient.collections(COLLECTIONS.QUESTIONS).documents().search(searchParams)
      allQuestions = questionsResult.hits?.map(h => h.document as any) || []
    } catch (error: any) {
      const status = error?.httpStatus || error?.status
      if (status === 404) {
        console.warn('⚠️ [Dashboard] questions koleksiyonu bulunamadı, varsayılan liste dönülüyor')
      } else if (status === 400) {
        console.warn('⚠️ [Dashboard] questions sorgu hatası (400), filter kaldırılıyor')
        // Filter olmadan tekrar dene
        try {
          const questionsResult = await typesenseClient.collections(COLLECTIONS.QUESTIONS).documents().search({
            q: '*',
            query_by: 'question_text',
            sort_by: 'created_at:desc',
            per_page: 100
          })
          allQuestions = questionsResult.hits?.map(h => h.document as any) || []
        } catch (retryError: any) {
          console.warn('⚠️ [Dashboard] questions retry hatası:', retryError?.message)
        }
      } else {
        console.error('❌ [Dashboard] Soru sorgusu hatası:', error?.message)
      }
      // allQuestions boş kalır, aşağıda return [] yapmıyoruz ki filtre işlemi çalışsın
    }

    // Çözülmüş soruları filtrele
    const filteredQuestions = allQuestions.filter(q => !answeredIdSet.has(q.question_id))
    return filteredQuestions.slice(0, 20)

  } catch (error) {
    console.error('❌ [Dashboard] getRecommendedQuestions hatası:', error)
    return [] // Hata durumunda boş dizi
  }
}

/**
 * Ders bazlı mastery hesapla
 */
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
