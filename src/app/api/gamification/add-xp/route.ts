import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { typesenseClient, isTypesenseAvailable, COLLECTIONS } from '@/lib/typesense/client'

// Service role client - RLS bypass
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const { userId, xp, isCorrect, source = 'question' } = await req.json()

    if (!userId || xp === undefined) {
      return NextResponse.json({ error: 'userId and xp required' }, { status: 400 })
    }

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

    // 2. point_history tablosuna kaydet
    await supabase.from('point_history').insert({
      student_id: userId,
      points: xp,
      source,
      description: isCorrect ? 'Doğru cevap' : 'Katılım puanı'
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
