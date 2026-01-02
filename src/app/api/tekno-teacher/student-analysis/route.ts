/**
 * 🎯 TeknoÖğretmen - Öğrenci Analizi API
 * 
 * Typesense'ten öğrenci verilerini çeker:
 * - weak_topics, strong_topics
 * - mastery_level, success_rate
 * - Son aktiviteler
 * 
 * Supabase'e yük bindirmez!
 */

import { NextRequest, NextResponse } from 'next/server'
import { typesenseClient, COLLECTIONS, isTypesenseAvailable } from '@/lib/typesense/client'
import { studentAnalysisCache, createCacheKey, cachedFetch } from '@/lib/cache'
import { checkRateLimit, getClientIP } from '@/lib/rateLimit'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface StudentAnalysis {
  studentId: string
  studentName: string
  grade: number
  // Zayıf ve güçlü konular
  weakTopics: string[]
  strongTopics: string[]
  // Genel istatistikler
  stats: {
    totalQuestions: number
    totalCorrect: number
    totalWrong: number
    successRate: number
    currentStreak: number
    maxStreak: number
    totalPoints: number
  }
  // Konu bazlı mastery seviyeleri
  topicProgress: Array<{
    topicId: string
    mainTopic: string
    subjectCode: string
    masteryLevel: 'beginner' | 'learning' | 'proficient' | 'master'
    successRate: number
    totalAttempted: number
  }>
  // Son 7 günlük aktivite özeti
  recentActivity: {
    questionsLast7Days: number
    correctLast7Days: number
    avgDailyQuestions: number
  }
}

/**
 * Typesense'ten öğrenci analizini çek
 */
async function fetchStudentAnalysis(studentId: string): Promise<StudentAnalysis | null> {
  if (!isTypesenseAvailable()) {
    console.warn('Typesense not available, returning null')
    return null
  }

  try {
    // 1. Student Stats'ı çek
    const statsResult = await typesenseClient
      .collections(COLLECTIONS.STUDENT_STATS)
      .documents()
      .search({
        q: '*',
        filter_by: `student_id:=${studentId}`,
        per_page: 1
      })

    const statsHit = statsResult.hits?.[0]?.document as any
    
    if (!statsHit) {
      console.log(`No stats found for student: ${studentId}`)
      return null
    }

    // 2. Topic Progress'i çek (en düşük ve en yüksek başarı oranına göre)
    const progressResult = await typesenseClient
      .collections(COLLECTIONS.STUDENT_TOPIC_PROGRESS)
      .documents()
      .search({
        q: '*',
        filter_by: `student_id:=${studentId}`,
        sort_by: 'success_rate:asc',
        per_page: 20
      })

    const topicProgress = (progressResult.hits || []).map((hit: any) => ({
      topicId: hit.document.topic_id,
      mainTopic: hit.document.main_topic,
      subjectCode: hit.document.subject_code,
      masteryLevel: hit.document.mastery_level || 'beginner',
      successRate: hit.document.success_rate || 0,
      totalAttempted: hit.document.total_attempted || 0
    }))

    // 3. Son 7 günlük aktiviteyi çek
    const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000)
    
    let recentActivity = {
      questionsLast7Days: 0,
      correctLast7Days: 0,
      avgDailyQuestions: 0
    }

    try {
      const activityResult = await typesenseClient
        .collections(COLLECTIONS.QUESTION_ACTIVITY)
        .documents()
        .search({
          q: '*',
          filter_by: `student_id:=${studentId} && created_at:>=${sevenDaysAgo}`,
          per_page: 0,  // Sadece count istiyoruz
          facet_by: 'is_correct'
        })

      const totalRecent = activityResult.found || 0
      const correctFacet = activityResult.facet_counts?.find((f: any) => f.field_name === 'is_correct')
      const correctCount = correctFacet?.counts?.find((c: any) => c.value === 'true')?.count || 0

      recentActivity = {
        questionsLast7Days: totalRecent,
        correctLast7Days: correctCount,
        avgDailyQuestions: Math.round(totalRecent / 7)
      }
    } catch (activityError) {
      console.warn('Could not fetch recent activity:', activityError)
    }

    // 4. Zayıf ve güçlü konuları belirle
    const weakTopics = topicProgress
      .filter(t => t.successRate < 50 && t.totalAttempted >= 3)
      .slice(0, 5)
      .map(t => t.mainTopic)

    const strongTopics = topicProgress
      .filter(t => t.successRate >= 80 && t.totalAttempted >= 5)
      .slice(-5)
      .map(t => t.mainTopic)

    return {
      studentId,
      studentName: statsHit.student_name || 'Öğrenci',
      grade: statsHit.grade || 8,
      weakTopics: statsHit.weak_topics || weakTopics,
      strongTopics: statsHit.strong_topics || strongTopics,
      stats: {
        totalQuestions: statsHit.total_questions || 0,
        totalCorrect: statsHit.total_correct || 0,
        totalWrong: statsHit.total_wrong || 0,
        successRate: statsHit.overall_success_rate || 0,
        currentStreak: statsHit.current_streak || 0,
        maxStreak: statsHit.max_streak || 0,
        totalPoints: statsHit.total_points || 0
      },
      topicProgress,
      recentActivity
    }

  } catch (error) {
    console.error('Typesense student analysis error:', error)
    return null
  }
}

export async function GET(request: NextRequest) {
  const startTime = Date.now()

  // Rate limit kontrolü
  const ip = getClientIP(request)
  const rateLimit = checkRateLimit(`tekno-teacher:${ip}`, {
    windowMs: 60000,
    maxRequests: 30,
    blockDurationMs: 60000
  })

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'Rate limit exceeded', retryAfter: Math.ceil(rateLimit.resetIn / 1000) },
      { status: 429 }
    )
  }

  // studentId parametresini al
  const { searchParams } = new URL(request.url)
  const studentId = searchParams.get('studentId')

  if (!studentId) {
    return NextResponse.json(
      { error: 'studentId parametresi gerekli' },
      { status: 400 }
    )
  }

  try {
    // Cache key oluştur
    const cacheKey = createCacheKey('student-analysis', studentId)

    // Cache'li fetch
    const analysis = await cachedFetch(
      studentAnalysisCache,
      cacheKey,
      () => fetchStudentAnalysis(studentId),
      5 * 60 * 1000 // 5 dakika TTL
    )

    if (!analysis) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Öğrenci verisi bulunamadı',
          // Varsayılan değerler döndür (yeni öğrenci için)
          data: {
            studentId,
            studentName: 'Öğrenci',
            grade: 8,
            weakTopics: [],
            strongTopics: [],
            stats: {
              totalQuestions: 0,
              totalCorrect: 0,
              totalWrong: 0,
              successRate: 0,
              currentStreak: 0,
              maxStreak: 0,
              totalPoints: 0
            },
            topicProgress: [],
            recentActivity: {
              questionsLast7Days: 0,
              correctLast7Days: 0,
              avgDailyQuestions: 0
            }
          }
        },
        { status: 200 }
      )
    }

    return NextResponse.json({
      success: true,
      data: analysis,
      cached: studentAnalysisCache.has(cacheKey),
      duration: Date.now() - startTime
    })

  } catch (error) {
    console.error('Student analysis error:', error)
    return NextResponse.json(
      { error: 'Analiz sırasında hata oluştu' },
      { status: 500 }
    )
  }
}

/**
 * POST - Öğrenci için kişiselleştirilmiş karşılama mesajı oluştur
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    const { studentId, studentName } = await request.json()

    if (!studentId) {
      return NextResponse.json(
        { error: 'studentId gerekli' },
        { status: 400 }
      )
    }

    // Cache key
    const cacheKey = createCacheKey('student-analysis', studentId)

    // Analizi çek
    const analysis = await cachedFetch(
      studentAnalysisCache,
      cacheKey,
      () => fetchStudentAnalysis(studentId),
      5 * 60 * 1000
    )

    // Kişiselleştirilmiş karşılama mesajı oluştur
    const name = studentName || analysis?.studentName || 'Öğrenci'
    let greeting = `Merhaba ${name}! 👋 Ben TeknoÖğretmen, senin kişisel ders asistanın.`

    if (analysis) {
      const { stats, weakTopics, strongTopics, recentActivity } = analysis

      // Son aktiviteye göre mesaj
      if (recentActivity.questionsLast7Days > 0) {
        const successRate = recentActivity.correctLast7Days / recentActivity.questionsLast7Days * 100
        
        if (successRate >= 80) {
          greeting += ` Son 7 günde ${recentActivity.questionsLast7Days} soru çözmüşsün ve %${Math.round(successRate)} başarı oranın var, harikasın! 🌟`
        } else if (successRate >= 60) {
          greeting += ` Son 7 günde ${recentActivity.questionsLast7Days} soru çözmüşsün, gayet iyi gidiyorsun! 💪`
        } else {
          greeting += ` Son 7 günde ${recentActivity.questionsLast7Days} soru çözmüşsün. Birlikte çalışıp başarını artıralım!`
        }
      } else {
        greeting += ` Bugün birlikte çalışmaya hazır mısın?`
      }

      // Zayıf konulara değin
      if (weakTopics.length > 0) {
        const topWeakTopic = weakTopics[0]
        greeting += ` Verilerine baktım, ${topWeakTopic} konusunda biraz zorlanmışsın gibi görünüyor ama hiç sorun değil, bugün o konuya odaklanabiliriz.`
      }

      // Streak varsa motivasyon
      if (stats.currentStreak > 0) {
        greeting += ` Bu arada ${stats.currentStreak} günlük serini koruyorsun, böyle devam! 🔥`
      }
    }

    greeting += ` Sana nasıl yardımcı olabilirim?`

    return NextResponse.json({
      success: true,
      greeting,
      analysis: analysis || null,
      duration: Date.now() - startTime
    })

  } catch (error) {
    console.error('Greeting generation error:', error)
    return NextResponse.json(
      { error: 'Karşılama mesajı oluşturulamadı' },
      { status: 500 }
    )
  }
}
