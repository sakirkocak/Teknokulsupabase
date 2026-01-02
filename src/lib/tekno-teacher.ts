/**
 * TeknoÖğretmen - AI Özel Ders Asistanı
 * Helper fonksiyonları
 */

import { createClient } from '@/lib/supabase/server'
import { createClient as createBrowserClient } from '@/lib/supabase/client'

// =====================================================
// TİPLER
// =====================================================

export interface StudySession {
  id: string
  user_id: string
  subject_code: string
  topic: string
  total_questions: number
  correct_answers: number
  wrong_answers: number
  score: number
  duration_seconds: number
  wrong_question_ids: string[]
  created_at: string
}

export interface Weakness {
  subject_code: string
  topic: string
  sub_topic: string | null
  wrong_count: number
  last_wrong_at: string
}

export interface AIFeedback {
  id: string
  user_id: string
  session_id: string | null
  feedback_type: 'text' | 'audio' | 'video'
  text_content: string | null
  audio_url: string | null
  audio_duration_seconds: number | null
  topic_context: {
    subject: string
    topic: string
    questions?: any[]
  }
  is_premium: boolean
  created_at: string
}

export interface CreditStatus {
  allowed: boolean
  remaining: number
  is_premium: boolean
}

// =====================================================
// ÇALIŞMA OTURUMLARI
// =====================================================

/**
 * Yeni çalışma oturumu kaydet
 */
export async function saveStudySession(session: Omit<StudySession, 'id' | 'created_at'>) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('tekno_teacher_sessions')
    .insert(session)
    .select()
    .single()
  
  if (error) {
    console.error('Save session error:', error)
    throw new Error('Oturum kaydedilemedi')
  }
  
  return data
}

/**
 * Kullanıcının son oturumlarını getir
 */
export async function getStudyHistory(userId: string, limit = 10) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('tekno_teacher_sessions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)
  
  if (error) {
    console.error('Get history error:', error)
    return []
  }
  
  return data as StudySession[]
}

/**
 * Belirli bir dersteki oturumları getir
 */
export async function getSubjectHistory(userId: string, subjectCode: string, limit = 10) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('tekno_teacher_sessions')
    .select('*')
    .eq('user_id', userId)
    .eq('subject_code', subjectCode)
    .order('created_at', { ascending: false })
    .limit(limit)
  
  if (error) {
    console.error('Get subject history error:', error)
    return []
  }
  
  return data as StudySession[]
}

// =====================================================
// ZAYIF KONU ANALİZİ
// =====================================================

/**
 * Zayıf konu güncelle (yanlış yapıldığında çağrılır)
 */
export async function updateWeakness(
  userId: string,
  subjectCode: string,
  topic: string,
  subTopic?: string
) {
  const supabase = await createClient()
  
  const { error } = await supabase.rpc('update_weakness', {
    p_user_id: userId,
    p_subject_code: subjectCode,
    p_topic: topic,
    p_sub_topic: subTopic || null
  })
  
  if (error) {
    console.error('Update weakness error:', error)
  }
}

/**
 * Öğrencinin en zayıf konularını getir
 */
export async function getTopWeaknesses(userId: string, limit = 5): Promise<Weakness[]> {
  const supabase = await createClient()
  
  const { data, error } = await supabase.rpc('get_top_weaknesses', {
    p_user_id: userId,
    p_limit: limit
  })
  
  if (error) {
    console.error('Get weaknesses error:', error)
    return []
  }
  
  return data as Weakness[]
}

/**
 * Belirli bir konudaki zayıflık detayını getir
 */
export async function getWeaknessDetail(userId: string, subjectCode: string, topic: string) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('tekno_teacher_weaknesses')
    .select('*')
    .eq('user_id', userId)
    .eq('subject_code', subjectCode)
    .eq('topic', topic)
    .single()
  
  if (error) {
    return null
  }
  
  return data
}

// =====================================================
// AI GERİ BİLDİRİM
// =====================================================

/**
 * AI geri bildirimi kaydet
 */
export async function saveAIFeedback(feedback: {
  user_id: string
  session_id?: string
  feedback_type: 'text' | 'audio' | 'video'
  text_content?: string
  audio_url?: string
  audio_duration_seconds?: number
  topic_context: any
  prompt_used?: string
  is_premium?: boolean
  credits_used?: number
}) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('tekno_teacher_feedback')
    .insert(feedback)
    .select()
    .single()
  
  if (error) {
    console.error('Save feedback error:', error)
    throw new Error('Geri bildirim kaydedilemedi')
  }
  
  return data
}

/**
 * Kullanıcının AI geri bildirimlerini getir
 */
export async function getAIFeedbackHistory(userId: string, limit = 20) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('tekno_teacher_feedback')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)
  
  if (error) {
    console.error('Get feedback history error:', error)
    return []
  }
  
  return data as AIFeedback[]
}

// =====================================================
// KREDİ YÖNETİMİ
// =====================================================

/**
 * Kredi kontrolü yap ve kullan
 */
export async function checkAndUseCredit(userId: string): Promise<CreditStatus> {
  const supabase = await createClient()
  
  const { data, error } = await supabase.rpc('check_and_use_ai_credit', {
    p_user_id: userId
  })
  
  if (error) {
    console.error('Credit check error:', error)
    return { allowed: false, remaining: 0, is_premium: false }
  }
  
  if (data && data.length > 0) {
    return data[0] as CreditStatus
  }
  
  return { allowed: false, remaining: 0, is_premium: false }
}

/**
 * Kullanıcının kredi durumunu getir (kullanmadan)
 */
export async function getCreditStatus(userId: string) {
  const supabase = await createClient()
  
  // Önce kaydı oluştur veya getir
  const { data: existing } = await supabase
    .from('tekno_teacher_credits')
    .select('*')
    .eq('user_id', userId)
    .single()
  
  if (!existing) {
    // Yeni kayıt oluştur
    const { data: newRecord } = await supabase
      .from('tekno_teacher_credits')
      .insert({ user_id: userId })
      .select()
      .single()
    
    return {
      daily_credits: 3,
      used_today: 0,
      remaining: 3,
      is_premium: false,
      premium_until: null
    }
  }
  
  // Günlük reset kontrolü
  const lastReset = new Date(existing.last_reset_date)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  let usedToday = existing.used_today
  if (lastReset < today) {
    usedToday = 0
  }
  
  return {
    daily_credits: existing.daily_credits,
    used_today: usedToday,
    remaining: existing.is_premium ? 999 : Math.max(0, existing.daily_credits - usedToday),
    is_premium: existing.is_premium,
    premium_until: existing.premium_until
  }
}

/**
 * Premium üyelik aktive et
 */
export async function activatePremium(userId: string, durationDays = 30) {
  const supabase = await createClient()
  
  const premiumUntil = new Date()
  premiumUntil.setDate(premiumUntil.getDate() + durationDays)
  
  const { error } = await supabase
    .from('tekno_teacher_credits')
    .upsert({
      user_id: userId,
      is_premium: true,
      premium_until: premiumUntil.toISOString(),
      daily_credits: 999,
      updated_at: new Date().toISOString()
    })
  
  if (error) {
    console.error('Activate premium error:', error)
    throw new Error('Premium aktive edilemedi')
  }
  
  return { success: true, premium_until: premiumUntil }
}

// =====================================================
// YARDIMCI FONKSİYONLAR
// =====================================================

/**
 * Öğrencinin özet istatistiklerini getir
 */
export async function getStudentStats(userId: string) {
  const supabase = await createClient()
  
  // Son 30 günlük oturumlar
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  
  const { data: sessions } = await supabase
    .from('tekno_teacher_sessions')
    .select('*')
    .eq('user_id', userId)
    .gte('created_at', thirtyDaysAgo.toISOString())
  
  if (!sessions || sessions.length === 0) {
    return {
      total_sessions: 0,
      total_questions: 0,
      correct_answers: 0,
      wrong_answers: 0,
      average_score: 0,
      total_duration_minutes: 0,
      strongest_subject: null,
      weakest_subject: null
    }
  }
  
  // İstatistikleri hesapla
  const stats = sessions.reduce((acc, session) => {
    acc.total_questions += session.total_questions || 0
    acc.correct_answers += session.correct_answers || 0
    acc.wrong_answers += session.wrong_answers || 0
    acc.total_duration += session.duration_seconds || 0
    
    // Ders bazlı istatistik
    if (!acc.subjects[session.subject_code]) {
      acc.subjects[session.subject_code] = { correct: 0, total: 0 }
    }
    acc.subjects[session.subject_code].correct += session.correct_answers || 0
    acc.subjects[session.subject_code].total += session.total_questions || 0
    
    return acc
  }, {
    total_questions: 0,
    correct_answers: 0,
    wrong_answers: 0,
    total_duration: 0,
    subjects: {} as Record<string, { correct: number, total: number }>
  })
  
  // En güçlü ve en zayıf dersi bul
  let strongest: string | null = null
  let weakest: string | null = null
  let highestRate = 0
  let lowestRate = 100
  
  for (const [subject, data] of Object.entries(stats.subjects) as [string, { correct: number, total: number }][]) {
    if (data.total >= 5) { // En az 5 soru çözülmüş olmalı
      const rate = (data.correct / data.total) * 100
      if (rate > highestRate) {
        highestRate = rate
        strongest = subject
      }
      if (rate < lowestRate) {
        lowestRate = rate
        weakest = subject
      }
    }
  }
  
  return {
    total_sessions: sessions.length,
    total_questions: stats.total_questions,
    correct_answers: stats.correct_answers,
    wrong_answers: stats.wrong_answers,
    average_score: stats.total_questions > 0 
      ? Math.round((stats.correct_answers / stats.total_questions) * 100) 
      : 0,
    total_duration_minutes: Math.round(stats.total_duration / 60),
    strongest_subject: strongest,
    weakest_subject: weakest
  }
}

/**
 * TeknoÖğretmen için bağlam oluştur
 * Gemini'ye gönderilecek öğrenci bilgilerini derler
 */
export async function buildTeacherContext(userId: string) {
  const supabase = await createClient()
  
  // Kullanıcı bilgilerini al
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, grade')
    .eq('id', userId)
    .single()
  
  // Zayıf konuları al
  const weaknesses = await getTopWeaknesses(userId, 5)
  
  // Son oturumları al
  const recentSessions = await getStudyHistory(userId, 5)
  
  // İstatistikleri al
  const stats = await getStudentStats(userId)
  
  return {
    student_name: profile?.full_name || 'Öğrenci',
    grade: profile?.grade || 8,
    weaknesses: weaknesses.map(w => ({
      subject: w.subject_code,
      topic: w.topic,
      sub_topic: w.sub_topic,
      wrong_count: w.wrong_count
    })),
    recent_performance: {
      average_score: stats.average_score,
      total_questions: stats.total_questions,
      strongest_subject: stats.strongest_subject,
      weakest_subject: stats.weakest_subject
    },
    recent_sessions: recentSessions.slice(0, 3).map(s => ({
      subject: s.subject_code,
      topic: s.topic,
      score: s.score,
      wrong_count: s.wrong_answers
    }))
  }
}
