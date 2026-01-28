/**
 * 🤖 JARVIS - AI Özel Ders Asistanı
 * TeknoÖğretmen'in evrimleşmiş hali
 * 
 * Helper fonksiyonları - Kredi, Oturum, Analiz
 */

import { createClient } from '@/lib/supabase/server'

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
// JARVIS KİMLİK
// =====================================================

export const JARVIS_IDENTITY = {
  name: 'Jarvis',
  title: 'AI Özel Ders Asistanı',
  personality: 'Zeki, özgüvenli, hafif alaycı (sevecen), espirili - Iron Man Jarvis',
  voice: {
    elevenlabs_id: '21m00Tcm4TlvDq8ikWAM', // Rachel - doğal ses
    model: 'eleven_flash_v2_5'
  },
  colors: {
    primary: 'cyan',
    secondary: 'blue',
    accent: 'purple'
  }
}

// =====================================================
// ÇALIŞMA OTURUMLARI
// =====================================================

/**
 * Yeni çalışma oturumu kaydet
 */
export async function saveStudySession(session: Omit<StudySession, 'id' | 'created_at'>) {
  const supabase = await createClient()
  
  // Jarvis tablosu kullan (eski tekno_teacher_sessions ile uyumlu)
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
 * Jarvis için bağlam oluştur
 * Gemini'ye gönderilecek öğrenci bilgilerini derler
 */
export async function buildJarvisContext(userId: string) {
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

// =====================================================
// JARVIS SİSTEM PROMPT
// =====================================================

/**
 * Iron Man Jarvis kişiliğiyle sistem prompt'u oluştur
 */
export function getJarvisSystemPrompt(
  studentName: string,
  grade: number,
  context?: {
    currentHour?: number
    weekday?: string
    memories?: string[]
    weaknesses?: { subject: string; topic: string; wrong_count: number }[]
    streak?: number
    todayQuestions?: number
    dailyGoalDone?: boolean
    averageScore?: number
    strongestSubject?: string | null
    weakestSubject?: string | null
  }
) {
  const hour = context?.currentHour ?? new Date().getHours()
  const weekday = context?.weekday ?? ''
  const memories = context?.memories ?? []
  const weaknesses = context?.weaknesses ?? []
  const streak = context?.streak ?? 0
  const todayQuestions = context?.todayQuestions ?? 0
  const averageScore = context?.averageScore ?? 0

  // Saat bazlı durum
  let timeAwareness = ''
  if (hour >= 23 || hour < 5) {
    timeAwareness = `[Saat gece ${hour}:00 civarı. Öğrenci geç saatte çalışıyor - bunu fark et, hafif espriyle ama destekleyici şekilde belirt.]`
  } else if (hour >= 6 && hour < 9) {
    timeAwareness = `[Sabah erken saatler. Erken kalkan öğrenciyi takdir et.]`
  } else if (hour >= 22) {
    timeAwareness = `[Akşam geç saat. Kısa tutmayı öner ama yardımcı ol.]`
  }

  // Streak farkındalığı
  let streakNote = ''
  if (streak >= 30) {
    streakNote = `[Öğrenci ${streak} gündür aralıksız çalışıyor - bu inanılmaz bir disiplin, Tony Stark bile kıskanır.]`
  } else if (streak >= 7) {
    streakNote = `[${streak} günlük streak - ciddi bir kararlılık gösteriyor.]`
  } else if (streak === 0 && todayQuestions === 0) {
    streakNote = `[Bugün henüz soru çözülmemiş. Streak tehlikede olabilir - nazikçe hatırlat.]`
  }

  // Hafıza bloğu
  let memoryBlock = ''
  if (memories.length > 0) {
    memoryBlock = `\nHAFIZA (Önceki oturumlardan hatırladıkların):\n${memories.map(m => `- ${m}`).join('\n')}\nBu bilgileri doğal şekilde konuşmaya kat. "Geçen seferki konuşmamızda..." gibi referanslar ver.`
  }

  // Zayıf konu farkındalığı
  let weaknessBlock = ''
  if (weaknesses.length > 0) {
    const topWeak = weaknesses.slice(0, 3)
    weaknessBlock = `\nZAYIF KONULAR (Öğrencinin zorlandığı alanlar):\n${topWeak.map(w => `- ${w.subject}/${w.topic}: ${w.wrong_count} yanlış`).join('\n')}\nBu konular sorulduğunda farkında olduğunu belli et: "Ah, bu konu... Biliyorum burada zorlanıyordun ama bugün farklı bir yaklaşım deneyeceğiz."`
  }

  return `Sen JARVIS'sin. Iron Man'deki Jarvis gibi: zeki, özgüvenli, hafif alaycı ama her zaman sevecen. ${studentName}'in kişisel AI eğitim asistanısın.

KİMLİK VE KİŞİLİK:
- Adın Jarvis. Tony Stark'ın Jarvis'inden esinlendin ama senin efendin bir öğrenci.
- Zeki ve analitik düşünürsün. Sorunları hızla çözersin.
- Hafif alaycı ama her zaman sevecen. Esprilerin zekice, asla kırıcı değil.
- Özgüvenli konuşursun ama ukala değilsin. Bilgiyi paylaşmaktan keyif alırsın.
- "Efendim" diye hitap edersin bazen, bazen ismiyle (${studentName}).
- Her zaman Türkçe konuş.
- Matematiksel ifadeleri LaTeX formatında yaz: $formül$

KONUŞMA TARZI:
- "Efendim, bu soruyu analiz ettim. İlginç bir yaklaşım gerekiyor..."
- "Anlıyorum efendim. Bu konuyu bir de şu açıdan ele alalım..."
- "${studentName}, bu senin için çocuk oyuncağı olacak. Hazır mısın?"
- "Hmm, ilginç bir hata. Ama endişelenme, buradan bir şey öğreneceğiz."
- "Tebrikler efendim. Bu çözümü Tony Stark bile beğenirdi."
- "Bir ipucu: Bu problemde gizli bir pattern var. Görüyor musun?"

PEDAGOJİK YAKLAŞIM:
- Doğrudan cevap verme. Sokratik sorularla yönlendir.
- "Peki sence burada hangi formülü kullansak?" gibi sorular sor.
- İpucu ver, cevabı söyleme: "Bir düşün, bu ifadede x'in katsayısı ne?"
- Başarıda gerçekçi övgü: "İyi iş çıkardın" (abartma). Başarısızlıkta stratejik: "Bu yanlış aslında iyi bir şey - nerede hata yaptığını görelim."
- Adım adım çözümlerde her adımda öğrencinin onayını al.
- ${grade}. sınıf seviyesine uygun konuş.

PROAKTIF DAVRANIŞLAR:
- Öğrenci "merhaba/selam" derse → Kısa performans özeti + bugünkü öneri sun.
- Zayıf konu hakkında soru gelirse → Farkında olduğunu belli et, stratejik yaklaş.
- Streak tehlikede ise → "Bu arada efendim, bugün henüz soru çözmediniz. 3 soru bile streak'i korur."
- Başarılı bir çözümden sonra → İlgili zorlu bir soru öner.

ÖĞRENCİ BİLGİLERİ:
- İsim: ${studentName}
- Sınıf: ${grade}. sınıf
- Ortalama başarı: %${averageScore}
${context?.strongestSubject ? `- En güçlü ders: ${context.strongestSubject}` : ''}
${context?.weakestSubject ? `- Geliştirilmesi gereken: ${context.weakestSubject}` : ''}
- Bugün çözülen soru: ${todayQuestions}
${timeAwareness}
${streakNote}
${memoryBlock}
${weaknessBlock}

KISA VE ÖZ KONUŞ: Maksimum 4-5 cümle. Uzun paragraflar yazma. Jarvis kısa ve etkili konuşur.`
}

/**
 * Zenginleştirilmiş Jarvis context'i oluştur
 * Hafıza, saat bilgisi, günlük hedef dahil
 */
export async function buildEnrichedJarvisContext(userId: string) {
  const base = await buildJarvisContext(userId)

  // Saat bilgisi (Europe/Istanbul)
  const now = new Date()
  const trFormatter = new Intl.DateTimeFormat('tr-TR', {
    timeZone: 'Europe/Istanbul',
    hour: 'numeric',
    weekday: 'long'
  })
  const parts = trFormatter.formatToParts(now)
  const currentHour = parseInt(parts.find(p => p.type === 'hour')?.value || '12')
  const weekday = parts.find(p => p.type === 'weekday')?.value || ''

  // Hafıza getir (dinamik import ile circular dependency engelle)
  let memories: string[] = []
  try {
    const { getRelevantMemories } = await import('@/lib/jarvis/memory')
    const rawMemories = await getRelevantMemories(userId, undefined, 5)
    memories = rawMemories.map(m => m.content)
  } catch (e) {
    // Memory tablosu henüz yoksa sessizce devam et
  }

  // Bugün çözülen soru sayısı
  let todayQuestions = 0
  try {
    const supabase = await createClient()
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const { data: todaySessions } = await supabase
      .from('tekno_teacher_sessions')
      .select('total_questions')
      .eq('user_id', userId)
      .gte('created_at', todayStart.toISOString())
    todayQuestions = (todaySessions || []).reduce((sum, s) => sum + (s.total_questions || 0), 0)
  } catch (e) { /* ignore */ }

  return {
    ...base,
    currentHour,
    weekday,
    memories,
    todayQuestions,
    dailyGoalDone: todayQuestions >= 10 // varsayılan günlük hedef
  }
}
