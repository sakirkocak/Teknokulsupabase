import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { typesenseClient, isTypesenseAvailable, COLLECTIONS } from '@/lib/typesense/client'
import { 
  checkRateLimit, 
  validateAnswerTime, 
  getClientIP, 
  calculateSuspicionScore,
  blockUser,
  RATE_LIMITS 
} from '@/lib/rateLimit'

// Service role client - RLS bypass
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Şüpheli aktivite logları (memory)
const suspiciousLogs = new Map<string, { count: number; lastTime: number; answers: number[] }>()

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { 
      userId, 
      xp, 
      isCorrect, 
      source = 'question',
      questionId,
      questionShownAt  // YENİ: Client'tan gelen timestamp
    } = body

    if (!userId || xp === undefined) {
      return NextResponse.json({ error: 'userId and xp required' }, { status: 400 })
    }

    // ============================================
    // 🛡️ KATMAN 1: Rate Limiting
    // ============================================
    const clientIP = getClientIP(req)
    
    // Kullanıcı bazlı rate limit
    const userRateLimit = checkRateLimit(`user:${userId}`, RATE_LIMITS.ANSWER_SUBMISSION)
    if (!userRateLimit.allowed) {
      console.warn(`⚠️ Rate limit aşıldı: userId=${userId}, IP=${clientIP}`)
      
      // Şüpheli aktivite logla
      logSuspiciousActivity(userId, 'rate_limit_exceeded')
      
      return NextResponse.json({
        error: 'Çok hızlı işlem yapıyorsunuz',
        retryAfter: Math.ceil(userRateLimit.resetIn / 1000),
        blocked: userRateLimit.blocked
      }, { 
        status: 429,
        headers: {
          'Retry-After': String(Math.ceil(userRateLimit.resetIn / 1000))
        }
      })
    }

    // IP bazlı rate limit
    const ipRateLimit = checkRateLimit(`ip:${clientIP}`, RATE_LIMITS.GENERAL_API)
    if (!ipRateLimit.allowed) {
      console.warn(`⚠️ IP rate limit aşıldı: IP=${clientIP}`)
      return NextResponse.json({
        error: 'Bu IP adresinden çok fazla istek geliyor',
        retryAfter: Math.ceil(ipRateLimit.resetIn / 1000)
      }, { status: 429 })
    }

    // ============================================
    // 🛡️ KATMAN 2: Zaman Doğrulaması
    // ============================================
    if (questionShownAt) {
      const timeValidation = validateAnswerTime(questionShownAt, 1500) // Min 1.5 saniye
      
      if (!timeValidation.valid) {
        console.warn(`⚠️ Zaman doğrulaması başarısız: userId=${userId}, elapsed=${timeValidation.elapsedMs}ms`)
        
        // Şüpheli aktivite logla
        logSuspiciousActivity(userId, 'too_fast', timeValidation.elapsedMs)
        
        // Bot şüphesi yüksekse engelle
        const suspicionData = suspiciousLogs.get(userId)
        if (suspicionData && suspicionData.count >= 5) {
          blockUser(`user:${userId}`, 300000) // 5 dakika engelle
          
          // Veritabanında da işaretle
          await supabase
            .from('profiles')
            .update({ 
              is_suspended: true,
              suspension_reason: 'Bot şüphesi - çok hızlı cevaplama',
              suspended_at: new Date().toISOString()
            })
            .eq('id', userId)
          
          return NextResponse.json({
            error: 'Hesabınız şüpheli aktivite nedeniyle askıya alındı',
            blocked: true
          }, { status: 403 })
        }
        
        // İlk birkaç ihlalde sadece uyar, puan verme
        return NextResponse.json({
          warning: timeValidation.message,
          xpGranted: false,
          elapsedMs: timeValidation.elapsedMs
        }, { status: 200 })
      }
    }

    // ============================================
    // 🛡️ KATMAN 3: Anomaly Detection
    // ============================================
    const anomalyCheck = await checkForAnomalies(userId)
    if (anomalyCheck.suspicious) {
      console.warn(`🚨 Anomali tespit edildi: userId=${userId}, score=${anomalyCheck.score}`)
      
      if (anomalyCheck.score >= 80) {
        // Yüksek risk - hesabı askıya al
        blockUser(`user:${userId}`, 600000) // 10 dakika
        
        await supabase
          .from('profiles')
          .update({ 
            is_suspended: true,
            suspension_reason: `Otomatik tespit - Risk skoru: ${anomalyCheck.score}`,
            suspended_at: new Date().toISOString()
          })
          .eq('id', userId)
        
        return NextResponse.json({
          error: 'Hesabınız güvenlik kontrolü nedeniyle askıya alındı',
          blocked: true
        }, { status: 403 })
      }
      
      // Orta risk - sıkı rate limit uygula
      if (anomalyCheck.score >= 50) {
        const strictLimit = checkRateLimit(`strict:${userId}`, RATE_LIMITS.STRICT)
        if (!strictLimit.allowed) {
          return NextResponse.json({
            error: 'Güvenlik kontrolü - lütfen daha yavaş devam edin',
            retryAfter: Math.ceil(strictLimit.resetIn / 1000)
          }, { status: 429 })
        }
      }
    }

    // ============================================
    // ✅ Normal İşlem - XP Ekle
    // ============================================
    
    // 1. student_points tablosunu güncelle
    const { data: currentPoints, error: fetchError } = await supabase
      .from('student_points')
      .select('*')
      .eq('student_id', userId)
      .single()

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Error fetching student_points:', fetchError)
    }

    // Yeni streak hesapla
    let newStreak = currentPoints?.current_streak || 0
    let maxStreak = currentPoints?.max_streak || 0
    
    if (isCorrect) {
      newStreak += 1
      if (newStreak > maxStreak) {
        maxStreak = newStreak
      }
    } else {
      newStreak = 0
    }

    // Upsert student_points
    const updatedPoints = {
      student_id: userId,
      total_points: (currentPoints?.total_points || 0) + xp,
      total_questions: (currentPoints?.total_questions || 0) + 1,
      total_correct: (currentPoints?.total_correct || 0) + (isCorrect ? 1 : 0),
      total_wrong: (currentPoints?.total_wrong || 0) + (isCorrect ? 0 : 1),
      current_streak: newStreak,
      max_streak: maxStreak,
      updated_at: new Date().toISOString()
    }

    const { error: upsertError } = await supabase
      .from('student_points')
      .upsert(updatedPoints, { onConflict: 'student_id' })

    if (upsertError) {
      console.error('Error upserting student_points:', upsertError)
    }

    // 2. point_history tablosuna kaydet (güvenlik logları ile)
    await supabase.from('point_history').insert({
      student_id: userId,
      points: xp,
      source,
      description: isCorrect ? 'Doğru cevap' : 'Katılım puanı',
      metadata: {
        questionId,
        ip: clientIP,
        userAgent: req.headers.get('user-agent')?.substring(0, 200),
        answerTimeMs: questionShownAt ? Date.now() - questionShownAt : null
      }
    })

    // 3. Typesense leaderboard güncelle
    if (isTypesenseAvailable()) {
      try {
        // Önce profil bilgilerini al
        const { data: profileData } = await supabase
          .from('student_profiles')
          .select('id, grade, profiles:user_id(full_name, avatar_url)')
          .eq('id', userId)
          .single()

        if (profileData) {
          const profile = Array.isArray(profileData.profiles) 
            ? profileData.profiles[0] 
            : profileData.profiles

          // Bugünün tarihini al (Türkiye saati)
          const todayTR = new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Istanbul' })

          // Mevcut leaderboard kaydını kontrol et
          let todayQuestions = 1
          try {
            const searchResult = await typesenseClient
              .collections(COLLECTIONS.LEADERBOARD)
              .documents()
              .search({
                q: '*',
                query_by: 'full_name',
                filter_by: `student_id:=${userId}`,
                per_page: 1
              })

            if (searchResult.hits && searchResult.hits.length > 0) {
              const existingDoc = searchResult.hits[0].document as any
              // Aynı gün içindeyse today_questions artır
              if (existingDoc.today_date === todayTR) {
                todayQuestions = (existingDoc.today_questions || 0) + 1
              }
            }
          } catch (e) {
            // Kayıt bulunamadı, yeni oluşturulacak
          }

          // Leaderboard'a upsert
          await typesenseClient
            .collections(COLLECTIONS.LEADERBOARD)
            .documents()
            .upsert({
              id: `leaderboard_${userId}`,
              student_id: userId,
              full_name: profile?.full_name || 'Öğrenci',
              avatar_url: profile?.avatar_url || null,
              grade: profileData.grade || 8,
              total_points: updatedPoints.total_points,
              total_questions: updatedPoints.total_questions,
              total_correct: updatedPoints.total_correct,
              success_rate: updatedPoints.total_questions > 0
                ? Math.round((updatedPoints.total_correct / updatedPoints.total_questions) * 100)
                : 0,
              current_streak: newStreak,
              max_streak: maxStreak,
              today_questions: todayQuestions,
              today_date: todayTR,
              updated_at: Date.now()
            })
        }
      } catch (typesenseError) {
        console.error('Typesense leaderboard update error:', typesenseError)
        // Typesense hatası kritik değil, devam et
      }
    }

    return NextResponse.json({
      success: true,
      totalPoints: updatedPoints.total_points,
      totalQuestions: updatedPoints.total_questions,
      streak: newStreak,
      maxStreak
    })

  } catch (error) {
    console.error('Add XP error:', error)
    return NextResponse.json(
      { error: 'XP eklenirken hata oluştu', details: (error as Error).message },
      { status: 500 }
    )
  }
}

/**
 * Şüpheli aktivite logla
 */
function logSuspiciousActivity(userId: string, type: string, value?: number) {
  const existing = suspiciousLogs.get(userId) || { count: 0, lastTime: 0, answers: [] }
  
  existing.count++
  existing.lastTime = Date.now()
  if (value !== undefined) {
    existing.answers.push(value)
    // Son 20 cevabı tut
    if (existing.answers.length > 20) {
      existing.answers.shift()
    }
  }
  
  suspiciousLogs.set(userId, existing)
  
  console.log(`🔍 Şüpheli aktivite: userId=${userId}, type=${type}, count=${existing.count}`)
}

/**
 * Anomali kontrolü
 */
async function checkForAnomalies(userId: string): Promise<{ suspicious: boolean; score: number }> {
  try {
    // Son 1 dakikadaki cevapları say
    const oneMinuteAgo = new Date(Date.now() - 60000).toISOString()
    
    const { count: recentAnswers } = await supabase
      .from('point_history')
      .select('*', { count: 'exact', head: true })
      .eq('student_id', userId)
      .gte('created_at', oneMinuteAgo)
    
    // Memory'deki şüpheli logları kontrol et
    const suspicionData = suspiciousLogs.get(userId)
    
    // Ortalama cevap süresini hesapla
    let avgAnswerTime = 5000 // Default 5 saniye
    if (suspicionData?.answers && suspicionData.answers.length > 0) {
      avgAnswerTime = suspicionData.answers.reduce((a, b) => a + b, 0) / suspicionData.answers.length
    }
    
    // Son 1 saatteki doğruluk oranını al
    const oneHourAgo = new Date(Date.now() - 3600000).toISOString()
    const { data: recentHistory } = await supabase
      .from('point_history')
      .select('description')
      .eq('student_id', userId)
      .gte('created_at', oneHourAgo)
      .limit(100)
    
    const correctCount = recentHistory?.filter(h => h.description === 'Doğru cevap').length || 0
    const totalCount = recentHistory?.length || 1
    const accuracyPercent = (correctCount / totalCount) * 100
    
    // Risk skorunu hesapla
    const score = calculateSuspicionScore(
      recentAnswers || 0,
      avgAnswerTime,
      accuracyPercent
    )
    
    return {
      suspicious: score >= 30,
      score
    }
  } catch (error) {
    console.error('Anomaly check error:', error)
    return { suspicious: false, score: 0 }
  }
}
