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
    let skipXpGrant = false // XP verilmeyecek ama aktivite kaydedilecek
    let securityWarning: string | null = null
    
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
        
        // İlk birkaç ihlalde XP verme ama aktiviteyi kaydet
        skipXpGrant = true
        securityWarning = timeValidation.message || 'Çok hızlı cevapladınız'
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
      
      // Orta risk - XP verme ama aktiviteyi kaydet
      if (anomalyCheck.score >= 50) {
        skipXpGrant = true
        securityWarning = 'Güvenlik kontrolü - aktivite kaydedildi ama XP verilmedi'
      }
    }

    // ============================================
    // ✅ Normal İşlem - XP Ekle (güvenlik kontrolü geçerse)
    // ============================================
    
    // 1. student_points tablosunu güncelle (sadece XP verilecekse)
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
    
    // XP verilecekse streak güncelle
    if (!skipXpGrant) {
      if (isCorrect) {
        newStreak += 1
        if (newStreak > maxStreak) {
          maxStreak = newStreak
        }
      } else {
        newStreak = 0
      }
    }

    // Upsert student_points (sadece XP verilecekse)
    const updatedPoints = {
      student_id: userId,
      total_points: (currentPoints?.total_points || 0) + (skipXpGrant ? 0 : xp),
      total_questions: (currentPoints?.total_questions || 0) + (skipXpGrant ? 0 : 1),
      total_correct: (currentPoints?.total_correct || 0) + (skipXpGrant ? 0 : (isCorrect ? 1 : 0)),
      total_wrong: (currentPoints?.total_wrong || 0) + (skipXpGrant ? 0 : (isCorrect ? 0 : 1)),
      current_streak: newStreak,
      max_streak: maxStreak,
      updated_at: new Date().toISOString()
    }

    // Sadece XP verilecekse DB'yi güncelle
    if (!skipXpGrant) {
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

      // 3. ✅ Typesense question_activity'ye kaydet (append-only, race condition yok!)
      if (isTypesenseAvailable()) {
        try {
          const now = new Date()
          const todayTR = now.toLocaleDateString('en-CA', { timeZone: 'Europe/Istanbul' })
          
          // Hafta hesapla (ISO week)
          const startOfYear = new Date(now.getFullYear(), 0, 1)
          const days = Math.floor((now.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000))
          const weekNum = Math.ceil((days + startOfYear.getDay() + 1) / 7)
          const weekTR = `${now.getFullYear()}-W${weekNum.toString().padStart(2, '0')}`
          
          // Ay hesapla
          const monthTR = todayTR.substring(0, 7) // "2025-12"

          await typesenseClient
            .collections(COLLECTIONS.QUESTION_ACTIVITY)
            .documents()
            .create({
              id: `${userId}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
              activity_id: `${userId}_${Date.now()}`,
              student_id: userId,
              question_id: questionId || '',
              is_correct: isCorrect,
              points: xp,
              source: source,
              date: todayTR,
              week: weekTR,
              month: monthTR,
              created_at: Date.now()
            })
          
          console.log(`📊 Typesense question_activity kaydedildi: ${userId}, date=${todayTR}`)
        } catch (activityError) {
          // Hata olursa logla ama devam et (kritik değil)
          console.error('Typesense question_activity error:', activityError)
        }
      }
    }

    // 4. Typesense leaderboard güncelle - HER ZAMAN (aktivite sayısı için)
    if (isTypesenseAvailable()) {
      try {
        // Önce profil ve öğrenci bilgilerini al (tüm zorunlu alanlar için)
        const { data: profileData } = await supabase
          .from('student_profiles')
          .select(`
            id, grade, 
            user_id,
            school_id,
            city_id,
            district_id,
            profiles:user_id(full_name, avatar_url),
            schools:school_id(name),
            cities:city_id(name),
            districts:district_id(name)
          `)
          .eq('id', userId)
          .single()

        if (profileData) {
          const profile = Array.isArray(profileData.profiles) 
            ? profileData.profiles[0] 
            : profileData.profiles
          
          const school = Array.isArray(profileData.schools)
            ? profileData.schools[0]
            : profileData.schools
            
          const city = Array.isArray(profileData.cities)
            ? profileData.cities[0]
            : profileData.cities
            
          const district = Array.isArray(profileData.districts)
            ? profileData.districts[0]
            : profileData.districts

          // Bugünün tarihini al (Türkiye saati)
          const todayTR = new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Istanbul' })

          // Mevcut leaderboard kaydını kontrol et
          let todayQuestions = 1
          let todayCorrect = isCorrect ? 1 : 0
          let existingTotalPoints = currentPoints?.total_points || 0
          let existingTotalQuestions = currentPoints?.total_questions || 0
          let existingTotalCorrect = currentPoints?.total_correct || 0
          let existingTotalWrong = currentPoints?.total_wrong || 0
          let existingDoc: any = null
          
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
              existingDoc = searchResult.hits[0].document as any
              // Aynı gün içindeyse today_questions artır
              if (existingDoc.today_date === todayTR) {
                todayQuestions = (existingDoc.today_questions || 0) + 1
                todayCorrect = (existingDoc.today_correct || 0) + (isCorrect ? 1 : 0)
              }
              // Mevcut değerleri al
              existingTotalPoints = existingDoc.total_points || 0
              existingTotalQuestions = existingDoc.total_questions || 0
              existingTotalCorrect = existingDoc.total_correct || 0
              existingTotalWrong = existingDoc.total_wrong || 0
            }
          } catch (e) {
            // Kayıt bulunamadı, yeni oluşturulacak
          }

          // Yeni değerleri hesapla
          const newTotalPoints = skipXpGrant ? existingTotalPoints : (existingTotalPoints + xp)
          const newTotalQuestions = skipXpGrant ? existingTotalQuestions : (existingTotalQuestions + 1)
          const newTotalCorrect = skipXpGrant ? existingTotalCorrect : (existingTotalCorrect + (isCorrect ? 1 : 0))
          const newTotalWrong = skipXpGrant ? existingTotalWrong : (existingTotalWrong + (isCorrect ? 0 : 1))

          // Leaderboard'a upsert - TÜM ZORUNLU ALANLAR dahil
          await typesenseClient
            .collections(COLLECTIONS.LEADERBOARD)
            .documents()
            .upsert({
              id: userId,
              student_id: userId,
              user_id: profileData.user_id || userId,
              full_name: profile?.full_name || 'Öğrenci',
              avatar_url: profile?.avatar_url || '',
              grade: profileData.grade || 8,
              // Lokasyon bilgileri (mevcut veya varsayılan)
              city_id: profileData.city_id || existingDoc?.city_id || '',
              city_name: (city as any)?.name || existingDoc?.city_name || '',
              district_id: profileData.district_id || existingDoc?.district_id || '',
              district_name: (district as any)?.name || existingDoc?.district_name || '',
              school_id: profileData.school_id || existingDoc?.school_id || '',
              school_name: (school as any)?.name || existingDoc?.school_name || '',
              // Puan bilgileri
              total_points: newTotalPoints,
              total_questions: newTotalQuestions,
              total_correct: newTotalCorrect,
              total_wrong: newTotalWrong,
              success_rate: newTotalQuestions > 0
                ? Math.round((newTotalCorrect / newTotalQuestions) * 100)
                : 0,
              current_streak: newStreak,
              max_streak: maxStreak,
              // Bugünün istatistikleri - HER ZAMAN güncellenir
              today_questions: todayQuestions,
              today_correct: todayCorrect,
              today_date: todayTR,
              // Ders puanları (mevcut değerleri koru)
              matematik_points: existingDoc?.matematik_points || 0,
              turkce_points: existingDoc?.turkce_points || 0,
              fen_points: existingDoc?.fen_points || 0,
              inkilap_points: existingDoc?.inkilap_points || 0,
              din_points: existingDoc?.din_points || 0,
              ingilizce_points: existingDoc?.ingilizce_points || 0,
              sosyal_points: existingDoc?.sosyal_points || 0,
              hayat_points: existingDoc?.hayat_points || 0,
              edebiyat_points: existingDoc?.edebiyat_points || 0,
              fizik_points: existingDoc?.fizik_points || 0,
              kimya_points: existingDoc?.kimya_points || 0,
              biyoloji_points: existingDoc?.biyoloji_points || 0,
              tarih_points: existingDoc?.tarih_points || 0,
              cografya_points: existingDoc?.cografya_points || 0,
              felsefe_points: existingDoc?.felsefe_points || 0,
              gorsel_points: existingDoc?.gorsel_points || 0,
              muzik_points: existingDoc?.muzik_points || 0,
              beden_points: existingDoc?.beden_points || 0,
              bilisim_points: existingDoc?.bilisim_points || 0,
              teknoloji_points: existingDoc?.teknoloji_points || 0,
              // Timestamp
              last_activity_at: Date.now(),
              updated_at: Date.now()
            })
            
          console.log(`✅ Typesense leaderboard güncellendi: userId=${userId}, today_questions=${todayQuestions}, xpGranted=${!skipXpGrant}`)
        }
      } catch (typesenseError) {
        console.error('Typesense leaderboard update error:', typesenseError)
        // Typesense hatası kritik değil, devam et
      }
    }

    // Sonuç döndür
    if (skipXpGrant) {
      return NextResponse.json({
        success: true,
        xpGranted: false,
        warning: securityWarning,
        message: 'Aktivite kaydedildi ama XP verilmedi'
      })
    }

    return NextResponse.json({
      success: true,
      xpGranted: true,
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
