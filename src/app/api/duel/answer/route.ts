import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Supabase service role client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * POST /api/duel/answer
 * 
 * Düello cevabını kaydeder ve skoru günceller
 */
export async function POST(req: NextRequest) {
  const startTime = Date.now()
  
  try {
    const { 
      duelId, 
      studentId, 
      questionIndex, 
      answer, 
      timeTakenMs 
    } = await req.json()

    if (!duelId || !studentId || questionIndex === undefined) {
      return NextResponse.json(
        { error: 'duelId, studentId ve questionIndex gerekli' },
        { status: 400 }
      )
    }

    // Düelloyu al
    const { data: duel, error: duelError } = await supabase
      .from('duels')
      .select('*')
      .eq('id', duelId)
      .single()

    if (duelError || !duel) {
      return NextResponse.json(
        { error: 'Düello bulunamadı' },
        { status: 404 }
      )
    }

    // Oyuncu yetkisi kontrol
    if (duel.challenger_id !== studentId && duel.opponent_id !== studentId) {
      return NextResponse.json(
        { error: 'Bu düelloya erişim yetkiniz yok' },
        { status: 403 }
      )
    }

    // Düello aktif mi?
    if (duel.status !== 'active') {
      return NextResponse.json(
        { error: 'Düello aktif değil' },
        { status: 400 }
      )
    }

    // Soru index'i geçerli mi?
    const questions = duel.questions || []
    if (questionIndex >= questions.length) {
      return NextResponse.json(
        { error: 'Geçersiz soru index\'i' },
        { status: 400 }
      )
    }

    // Doğru cevabı kontrol et
    const question = questions[questionIndex]
    const correctAnswer = question.correct_answer
    const isCorrect = answer === correctAnswer

    // Önceki streak'i al
    const { data: previousAnswers } = await supabase
      .from('duel_answers')
      .select('is_correct')
      .eq('duel_id', duelId)
      .eq('student_id', studentId)
      .order('question_index', { ascending: false })
      .limit(5)

    // Streak hesapla
    let currentStreak = 0
    if (previousAnswers) {
      for (const ans of previousAnswers) {
        if (ans.is_correct) currentStreak++
        else break
      }
    }

    // Puan hesapla
    let pointsEarned = 0
    let streakBonus = 0

    if (isCorrect) {
      pointsEarned = 10 // Temel puan
      
      // Kombo bonusu
      const newStreak = currentStreak + 1
      if (newStreak >= 5) streakBonus = 10
      else if (newStreak >= 3) streakBonus = 5
      else if (newStreak >= 2) streakBonus = 2
    }

    const totalPoints = pointsEarned + streakBonus

    // Cevabı kaydet
    const { error: answerError } = await supabase
      .from('duel_answers')
      .upsert({
        duel_id: duelId,
        student_id: studentId,
        question_index: questionIndex,
        question_id: question.id,
        answer: answer,
        is_correct: isCorrect,
        time_taken_ms: timeTakenMs,
        points_earned: pointsEarned,
        streak_bonus: streakBonus,
        answered_at: new Date().toISOString()
      }, {
        onConflict: 'duel_id,student_id,question_index'
      })

    if (answerError) {
      console.error('Cevap kaydetme hatası:', answerError)
      return NextResponse.json(
        { error: 'Cevap kaydedilemedi' },
        { status: 500 }
      )
    }

    // Skoru güncelle
    const isChallenger = duel.challenger_id === studentId
    const scoreField = isChallenger ? 'challenger_score' : 'opponent_score'
    const currentScore = isChallenger ? duel.challenger_score : duel.opponent_score

    await supabase
      .from('duels')
      .update({
        [scoreField]: (currentScore || 0) + totalPoints
      })
      .eq('id', duelId)

    // Son soru mu? Düelloyu bitir
    const isLastQuestion = questionIndex === questions.length - 1
    
    if (isLastQuestion) {
      // Her iki oyuncunun da son soruyu cevapladığını kontrol et
      const { count: answeredCount } = await supabase
        .from('duel_answers')
        .select('*', { count: 'exact', head: true })
        .eq('duel_id', duelId)
        .eq('question_index', questionIndex)

      if (answeredCount && answeredCount >= 2) {
        // Düelloyu bitir
        await finishDuel(duelId)
      }
    }

    const duration = Date.now() - startTime
    console.log(`⚡ Answer saved: duel=${duelId}, q=${questionIndex}, correct=${isCorrect} in ${duration}ms`)

    return NextResponse.json({
      success: true,
      isCorrect,
      correctAnswer,
      pointsEarned: totalPoints,
      streakBonus,
      newStreak: isCorrect ? currentStreak + 1 : 0,
      explanation: question.explanation,
      duration
    })

  } catch (error) {
    console.error('Duel answer error:', error)
    return NextResponse.json(
      { error: 'Sunucu hatası', details: (error as Error).message },
      { status: 500 }
    )
  }
}

/**
 * Düelloyu bitir ve kazananı belirle
 */
async function finishDuel(duelId: string) {
  // Güncel skorları al
  const { data: duel } = await supabase
    .from('duels')
    .select('challenger_id, opponent_id, challenger_score, opponent_score')
    .eq('id', duelId)
    .single()

  if (!duel) return

  const challengerScore = duel.challenger_score || 0
  const opponentScore = duel.opponent_score || 0

  let winnerId: string | null = null
  if (challengerScore > opponentScore) {
    winnerId = duel.challenger_id
  } else if (opponentScore > challengerScore) {
    winnerId = duel.opponent_id
  }
  // Eşitlik durumunda winnerId null kalır

  // Düelloyu tamamla
  await supabase
    .from('duels')
    .update({
      status: 'completed',
      winner_id: winnerId,
      completed_at: new Date().toISOString()
    })
    .eq('id', duelId)

  // İstatistikleri güncelle
  await updateDuelStats(duel.challenger_id, winnerId === duel.challenger_id, winnerId === null)
  await updateDuelStats(duel.opponent_id, winnerId === duel.opponent_id, winnerId === null)

  console.log(`🏆 Duel finished: ${duelId}, winner: ${winnerId || 'draw'}`)
}

/**
 * Oyuncu düello istatistiklerini güncelle
 */
async function updateDuelStats(studentId: string, isWinner: boolean, isDraw: boolean) {
  const { data: stats } = await supabase
    .from('duel_stats')
    .select('*')
    .eq('student_id', studentId)
    .single()

  if (stats) {
    // Güncelle
    await supabase
      .from('duel_stats')
      .update({
        total_duels: stats.total_duels + 1,
        wins: isWinner ? stats.wins + 1 : stats.wins,
        losses: !isWinner && !isDraw ? stats.losses + 1 : stats.losses,
        draws: isDraw ? stats.draws + 1 : stats.draws,
        win_streak: isWinner ? stats.win_streak + 1 : 0,
        max_win_streak: isWinner 
          ? Math.max(stats.max_win_streak, stats.win_streak + 1) 
          : stats.max_win_streak,
        total_points_earned: stats.total_points_earned + (isWinner ? 10 : 0) // Bonus puan
      })
      .eq('student_id', studentId)
  } else {
    // Yeni kayıt
    await supabase
      .from('duel_stats')
      .insert({
        student_id: studentId,
        total_duels: 1,
        wins: isWinner ? 1 : 0,
        losses: !isWinner && !isDraw ? 1 : 0,
        draws: isDraw ? 1 : 0,
        win_streak: isWinner ? 1 : 0,
        max_win_streak: isWinner ? 1 : 0,
        total_points_earned: isWinner ? 10 : 0
      })
  }
}

