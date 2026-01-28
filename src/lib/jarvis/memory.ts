/**
 * 🧠 JARVIS Hafıza Sistemi
 *
 * Oturumlar arası hafıza: konuşma özetleri, tercihler, dönüm noktaları
 */

import { createClient } from '@/lib/supabase/server'
import { geminiModel } from '@/lib/gemini'

// =====================================================
// TİPLER
// =====================================================

export type MemoryType = 'conversation_summary' | 'preference' | 'milestone'

export interface JarvisMemory {
  id: string
  user_id: string
  memory_type: MemoryType
  content: string
  subject_code: string | null
  importance: number
  created_at: string
  expires_at: string | null
}

// =====================================================
// HAFIZA KAYDETME
// =====================================================

/**
 * Yeni hafıza kaydı oluştur
 */
export async function saveMemory(
  userId: string,
  type: MemoryType,
  content: string,
  importance: number = 3,
  subjectCode?: string
): Promise<JarvisMemory | null> {
  const supabase = await createClient()

  // Süre sonu: conversation_summary → 30 gün, diğerleri → sınırsız
  let expiresAt: string | null = null
  if (type === 'conversation_summary') {
    const d = new Date()
    d.setDate(d.getDate() + 30)
    expiresAt = d.toISOString()
  }

  const { data, error } = await supabase
    .from('jarvis_memory')
    .insert({
      user_id: userId,
      memory_type: type,
      content,
      subject_code: subjectCode || null,
      importance,
      expires_at: expiresAt
    })
    .select()
    .single()

  if (error) {
    console.error('❌ [JARVIS Memory] Kayıt hatası:', error.message)
    return null
  }

  return data as JarvisMemory
}

// =====================================================
// HAFIZA GETİRME
// =====================================================

/**
 * Kullanıcıya ait ilgili hafızaları getir
 * Öncelik: importance DESC, güncellik DESC
 * Süresi dolmuş kayıtlar otomatik filtrelenir
 */
export async function getRelevantMemories(
  userId: string,
  topic?: string,
  limit: number = 5
): Promise<JarvisMemory[]> {
  const supabase = await createClient()

  let query = supabase
    .from('jarvis_memory')
    .select('*')
    .eq('user_id', userId)
    .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
    .order('importance', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(limit)

  // Konu filtresi varsa subject_code ile eşleştir
  if (topic) {
    // Hem konuya özel hem genel hatıraları getir
    query = supabase
      .from('jarvis_memory')
      .select('*')
      .eq('user_id', userId)
      .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
      .or(`subject_code.is.null,subject_code.eq.${topic}`)
      .order('importance', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(limit)
  }

  const { data, error } = await query

  if (error) {
    console.error('❌ [JARVIS Memory] Getirme hatası:', error.message)
    return []
  }

  return (data || []) as JarvisMemory[]
}

// =====================================================
// KONUŞMA ÖZETİ ÇIKARMA
// =====================================================

/**
 * Gemini ile konuşma özetini çıkar ve kaydet
 */
export async function summarizeConversation(
  userId: string,
  messages: { role: 'user' | 'assistant'; content: string }[],
  subjectCode?: string
): Promise<JarvisMemory | null> {
  if (messages.length < 4) return null // Çok kısa konuşmalar için özet çıkarma

  try {
    const conversationText = messages
      .map(m => `${m.role === 'user' ? 'Öğrenci' : 'Jarvis'}: ${m.content}`)
      .join('\n')

    const prompt = `Aşağıdaki öğrenci-Jarvis konuşmasını analiz et ve kısa bir özet çıkar.

KONUŞMA:
${conversationText}

ŞU BİLGİLERİ ÇIKAR (JSON formatında):
{
  "summary": "1-2 cümlelik konuşma özeti",
  "student_mood": "motivasyonlu|normal|zorlanan|sinirli",
  "topics_discussed": ["konu1", "konu2"],
  "learning_style_hints": "varsa öğrenme stili ipuçları",
  "important_preferences": "varsa öğrenci tercihleri",
  "importance": 1-5 arası önem puanı
}

SADECE JSON döndür, başka bir şey yazma.`

    const result = await geminiModel.generateContent(prompt)
    const responseText = result.response.text()

    const jsonMatch = responseText.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return null

    const parsed = JSON.parse(jsonMatch[0])

    // Özeti kaydet
    const memory = await saveMemory(
      userId,
      'conversation_summary',
      parsed.summary || 'Konuşma özeti çıkarılamadı',
      parsed.importance || 3,
      subjectCode
    )

    // Tercih varsa ayrıca kaydet (süresi dolmaz)
    if (parsed.important_preferences && parsed.important_preferences !== 'yok' && parsed.important_preferences.length > 5) {
      await saveMemory(
        userId,
        'preference',
        parsed.important_preferences,
        4,
        subjectCode
      )
    }

    // Öğrenme stili ipucu varsa kaydet
    if (parsed.learning_style_hints && parsed.learning_style_hints !== 'yok' && parsed.learning_style_hints.length > 5) {
      await saveMemory(
        userId,
        'preference',
        `Öğrenme stili: ${parsed.learning_style_hints}`,
        4
      )
    }

    return memory
  } catch (error: any) {
    console.error('❌ [JARVIS Memory] Özet hatası:', error.message)
    return null
  }
}

// =====================================================
// MİLESTONE (DÖNÜM NOKTASI) KAYDETME
// =====================================================

/**
 * Öğrencinin bir başarı/dönüm noktası kaydet
 */
export async function saveMilestone(
  userId: string,
  content: string,
  subjectCode?: string
): Promise<JarvisMemory | null> {
  return saveMemory(userId, 'milestone', content, 5, subjectCode)
}

// =====================================================
// ESKİ HAFIZALARI TEMİZLE
// =====================================================

/**
 * Süresi dolmuş hafızaları sil (cron job için)
 */
export async function cleanExpiredMemories(): Promise<number> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('jarvis_memory')
    .delete()
    .lt('expires_at', new Date().toISOString())
    .not('expires_at', 'is', null)
    .select('id')

  if (error) {
    console.error('❌ [JARVIS Memory] Temizlik hatası:', error.message)
    return 0
  }

  return data?.length || 0
}
