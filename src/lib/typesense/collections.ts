import { CollectionCreateSchema } from 'typesense/lib/Typesense/Collections'

// Leaderboard Collection Schema
export const leaderboardSchema: CollectionCreateSchema = {
  name: 'leaderboard',
  fields: [
    { name: 'student_id', type: 'string' },
    { name: 'user_id', type: 'string', optional: true },
    { name: 'full_name', type: 'string' },
    { name: 'avatar_url', type: 'string', optional: true },
    
    // Puan ve istatistikler
    { name: 'total_points', type: 'int32', sort: true },
    { name: 'total_questions', type: 'int32' },
    { name: 'total_correct', type: 'int32' },
    { name: 'total_wrong', type: 'int32' },
    { name: 'max_streak', type: 'int32' },
    { name: 'current_streak', type: 'int32' },
    
    // Günlük istatistikler (bugün çözülen sorular için)
    { name: 'today_questions', type: 'int32', optional: true },
    { name: 'today_correct', type: 'int32', optional: true },
    { name: 'today_date', type: 'string', optional: true },  // "2025-12-27" formatında
    
    // Filtreleme alanlari
    { name: 'grade', type: 'int32', facet: true },
    
    // Türkiye lokasyon (mevcut)
    { name: 'city_id', type: 'string', facet: true, optional: true },
    { name: 'city_name', type: 'string', facet: true, optional: true },
    { name: 'district_id', type: 'string', facet: true, optional: true },
    { name: 'district_name', type: 'string', facet: true, optional: true },
    { name: 'school_id', type: 'string', facet: true, optional: true },
    { name: 'school_name', type: 'string', facet: true, optional: true },
    
    // Global lokasyon (yeni - Questly için)
    { name: 'country_code', type: 'string', facet: true, optional: true },  // 'IN', 'PK', 'NG', 'TR'
    { name: 'country_name', type: 'string', facet: true, optional: true },  // 'India', 'Pakistan'
    { name: 'city_global_id', type: 'string', facet: true, optional: true },
    { name: 'city_global_name', type: 'string', facet: true, optional: true },
    { name: 'region', type: 'string', facet: true, optional: true },  // 'tr' veya 'global'
    
    // Ders bazli puanlar - TÜM DERSLER
    // Ana dersler (LGS/Ortaokul)
    { name: 'matematik_points', type: 'int32', optional: true },
    { name: 'turkce_points', type: 'int32', optional: true },
    { name: 'fen_points', type: 'int32', optional: true },
    { name: 'inkilap_points', type: 'int32', optional: true },
    { name: 'din_points', type: 'int32', optional: true },
    { name: 'ingilizce_points', type: 'int32', optional: true },
    { name: 'sosyal_points', type: 'int32', optional: true },
    { name: 'hayat_points', type: 'int32', optional: true },
    // Lise dersleri
    { name: 'edebiyat_points', type: 'int32', optional: true },
    { name: 'fizik_points', type: 'int32', optional: true },
    { name: 'kimya_points', type: 'int32', optional: true },
    { name: 'biyoloji_points', type: 'int32', optional: true },
    { name: 'tarih_points', type: 'int32', optional: true },
    { name: 'cografya_points', type: 'int32', optional: true },
    { name: 'felsefe_points', type: 'int32', optional: true },
    // Diğer dersler
    { name: 'gorsel_points', type: 'int32', optional: true },
    { name: 'muzik_points', type: 'int32', optional: true },
    { name: 'beden_points', type: 'int32', optional: true },
    { name: 'bilisim_points', type: 'int32', optional: true },
    { name: 'teknoloji_points', type: 'int32', optional: true },
    
    // Zaman
    { name: 'last_activity_at', type: 'int64' }
  ],
  default_sorting_field: 'total_points'
}

// Questions Collection Schema
export const questionsSchema: CollectionCreateSchema = {
  name: 'questions',
  fields: [
    // Temel
    { name: 'question_id', type: 'string' },
    { name: 'topic_id', type: 'string', facet: true, optional: true },  // 🆕 Topic ID (filtre için)
    
    // 🔍 ARAMA için
    { name: 'question_text', type: 'string' },
    
    // 🏷️ FİLTRELEME için
    { name: 'difficulty', type: 'string', facet: true },
    { name: 'subject_code', type: 'string', facet: true },
    { name: 'subject_name', type: 'string', facet: true },
    { name: 'main_topic', type: 'string', facet: true },
    { name: 'sub_topic', type: 'string', facet: true, optional: true },
    { name: 'grade', type: 'int32', facet: true },
    { name: 'has_image', type: 'bool', facet: true, optional: true },
    { name: 'lang', type: 'string', facet: true, optional: true },
    
    // 🆕 YENİ NESİL SORU alanları
    { name: 'is_new_generation', type: 'bool', facet: true, optional: true },  // Yeni nesil mi?
    { name: 'visual_type', type: 'string', facet: true, optional: true },      // table, chart, flowchart, pie, diagram
    
    // 📊 İSTATİSTİKLER - Popüler sorular sayfaları için
    { name: 'times_answered', type: 'int32', facet: true },
    { name: 'times_correct', type: 'int32' },
    { name: 'success_rate', type: 'float', optional: true },
    
    // ⏱️ SIRALAMA için
    { name: 'created_at', type: 'int64' }
  ],
  default_sorting_field: 'created_at'
}

// ============================================
// 📚 TOPICS - Konu Koleksiyonu (Şimşek Hız!)
// ============================================
// /sorular/[subject] ve /sorular/[subject]/[grade] sayfaları için
// Çok hafif: ~1000 topic × ~150 byte = ~150KB RAM

export const topicsSchema: CollectionCreateSchema = {
  name: 'topics',
  fields: [
    // Temel
    { name: 'topic_id', type: 'string' },
    
    // 🏷️ FİLTRELEME için
    { name: 'subject_code', type: 'string', facet: true },
    { name: 'subject_name', type: 'string', facet: true },
    { name: 'grade', type: 'int32', facet: true },
    
    // 📚 KONU BİLGİSİ
    { name: 'main_topic', type: 'string', facet: true },
    { name: 'sub_topic', type: 'string', facet: true, optional: true },
    
    // 📊 İSTATİSTİK
    { name: 'question_count', type: 'int32' }
  ]
}

// Locations Collection Schema (İller ve İlçeler)
export const locationsSchema: CollectionCreateSchema = {
  name: 'locations',
  fields: [
    { name: 'location_id', type: 'string' },
    { name: 'name', type: 'string' },
    { name: 'type', type: 'string', facet: true },    // 'city' veya 'district'
    { name: 'parent_id', type: 'string', facet: true, optional: true }, // İlçeler için city_id
    { name: 'parent_name', type: 'string', optional: true }, // İlçeler için il adı
    { name: 'plate_code', type: 'int32', optional: true }   // Sadece iller için
  ]
}

// Schools Collection Schema
export const schoolsSchema: CollectionCreateSchema = {
  name: 'schools',
  fields: [
    { name: 'school_id', type: 'string' },
    { name: 'name', type: 'string' },
    { name: 'city_id', type: 'string', facet: true },
    { name: 'city_name', type: 'string', facet: true },
    { name: 'district_id', type: 'string', facet: true },
    { name: 'district_name', type: 'string', facet: true },
    { name: 'school_type', type: 'string', facet: true, optional: true },
    { name: 'ownership_type', type: 'string', facet: true, optional: true }
  ]
}

// Student Stats Collection Schema
export const studentStatsSchema: CollectionCreateSchema = {
  name: 'student_stats',
  fields: [
    { name: 'student_id', type: 'string' },
    { name: 'student_name', type: 'string' },
    { name: 'grade', type: 'int32', facet: true },
    
    { name: 'total_questions', type: 'int32' },
    { name: 'total_correct', type: 'int32' },
    { name: 'total_wrong', type: 'int32' },
    { name: 'overall_success_rate', type: 'float' },
    
    { name: 'total_points', type: 'int32', sort: true },
    { name: 'current_streak', type: 'int32' },
    { name: 'max_streak', type: 'int32' },
    
    { name: 'weak_topics', type: 'string[]', facet: true, optional: true },
    { name: 'strong_topics', type: 'string[]', facet: true, optional: true },
    
    { name: 'last_activity_at', type: 'int64' }
  ],
  default_sorting_field: 'total_points'
}

// Student Topic Progress Collection Schema
export const studentTopicProgressSchema: CollectionCreateSchema = {
  name: 'student_topic_progress',
  fields: [
    { name: 'progress_id', type: 'string' },  // student_id_topic_id
    { name: 'student_id', type: 'string', facet: true },
    { name: 'topic_id', type: 'string', facet: true },
    { name: 'subject_code', type: 'string', facet: true },
    { name: 'subject_name', type: 'string' },
    { name: 'main_topic', type: 'string', facet: true },
    { name: 'grade', type: 'int32', facet: true },
    
    { name: 'total_attempted', type: 'int32' },
    { name: 'total_correct', type: 'int32' },
    { name: 'success_rate', type: 'float', sort: true },
    
    { name: 'mastery_level', type: 'string', facet: true },  // 'beginner', 'learning', 'proficient', 'master'
    { name: 'current_difficulty', type: 'string', facet: true },  // adaptive learning için
    { name: 'consecutive_correct', type: 'int32' },
    
    { name: 'last_practiced_at', type: 'int64' },
    { name: 'next_review_at', type: 'int64', optional: true }  // spaced repetition için
  ],
  default_sorting_field: 'last_practiced_at'
}

// ============================================
// 📊 QUESTION ACTIVITY - Soru Çözüm Aktiviteleri
// ============================================
// Her soru çözümü için bir kayıt (append-only, race condition yok!)
// Günlük/haftalık/aylık istatistikler için kullanılır

export const questionActivitySchema: CollectionCreateSchema = {
  name: 'question_activity',
  fields: [
    // Aktivite bilgileri
    { name: 'activity_id', type: 'string' },
    { name: 'student_id', type: 'string', facet: true },
    { name: 'question_id', type: 'string', facet: true, optional: true },
    
    // Sonuç
    { name: 'is_correct', type: 'bool', facet: true },
    { name: 'points', type: 'int32' },
    { name: 'source', type: 'string', facet: true },  // 'question', 'duel', 'challenge'
    
    // Tarih filtreleme (facet: true - hızlı filtreleme için)
    { name: 'date', type: 'string', facet: true },  // "2025-12-31" formatında
    { name: 'week', type: 'string', facet: true, optional: true },  // "2025-W01" formatında
    { name: 'month', type: 'string', facet: true, optional: true },  // "2025-12" formatında
    
    // Ders bilgisi (opsiyonel, analiz için)
    { name: 'subject_code', type: 'string', facet: true, optional: true },
    { name: 'grade', type: 'int32', facet: true, optional: true },
    
    // Zaman damgası
    { name: 'created_at', type: 'int64', sort: true }
  ],
  default_sorting_field: 'created_at'
}

// ============================================
// DOCUMENT TYPE DEFINITIONS
// ============================================

// Leaderboard document tipi
export interface LeaderboardDocument {
  id: string
  student_id: string
  user_id?: string
  full_name: string
  avatar_url?: string
  total_points: number
  total_questions: number
  total_correct: number
  total_wrong: number
  max_streak: number
  current_streak: number
  // Günlük istatistikler
  today_questions?: number
  today_correct?: number
  today_date?: string  // "2025-12-27" formatında
  grade: number
  // Türkiye lokasyon
  city_id?: string
  city_name?: string
  district_id?: string
  district_name?: string
  school_id?: string
  school_name?: string
  // Global lokasyon (Questly için)
  country_code?: string  // 'IN', 'PK', 'NG', 'TR'
  country_name?: string  // 'India', 'Pakistan'
  city_global_id?: string
  city_global_name?: string
  region?: string  // 'tr' veya 'global'
  // Ders puanları
  matematik_points?: number
  turkce_points?: number
  fen_points?: number
  inkilap_points?: number
  din_points?: number
  ingilizce_points?: number
  last_activity_at: number
}

// Questions document tipi
export interface QuestionDocument {
  id: string
  question_id: string
  topic_id?: string  // 🆕 Topic ID (filtre için)
  question_text: string
  // Filtreleme
  difficulty: string
  subject_code: string
  subject_name: string
  main_topic: string
  sub_topic?: string
  grade: number
  has_image?: boolean
  lang?: string
  // 🆕 Yeni Nesil Soru alanları
  is_new_generation?: boolean
  visual_type?: string  // 'table' | 'chart' | 'flowchart' | 'pie' | 'diagram'
  // İstatistikler
  times_answered: number
  times_correct: number
  success_rate?: number
  // Sıralama
  created_at: number
}

// Topic document tipi (konu sayfaları için)
export interface TopicDocument {
  id: string
  topic_id: string
  subject_code: string
  subject_name: string
  grade: number
  main_topic: string
  sub_topic?: string
  question_count: number
}

// Location document tipi
export interface LocationDocument {
  id: string
  location_id: string
  name: string
  type: 'city' | 'district'
  parent_id?: string
  parent_name?: string
  plate_code?: number
}

// School document tipi
export interface SchoolDocument {
  id: string
  school_id: string
  name: string
  city_id: string
  city_name: string
  district_id: string
  district_name: string
  school_type?: string
  ownership_type?: string
}

// Student Stats document tipi
export interface StudentStatsDocument {
  id: string
  student_id: string
  student_name: string
  grade: number
  total_questions: number
  total_correct: number
  total_wrong: number
  overall_success_rate: number
  total_points: number
  current_streak: number
  max_streak: number
  weak_topics?: string[]
  strong_topics?: string[]
  last_activity_at: number
}

// Student Topic Progress document tipi
export interface StudentTopicProgressDocument {
  id: string
  progress_id: string
  student_id: string
  topic_id: string
  subject_code: string
  subject_name: string
  main_topic: string
  grade: number
  total_attempted: number
  total_correct: number
  success_rate: number
  mastery_level: 'beginner' | 'learning' | 'proficient' | 'master'
  current_difficulty: 'easy' | 'medium' | 'hard'
  consecutive_correct: number
  last_practiced_at: number
  next_review_at?: number
}

// Question Activity document tipi (soru çözüm aktiviteleri)
export interface QuestionActivityDocument {
  id: string
  activity_id: string
  student_id: string
  question_id?: string
  is_correct: boolean
  points: number
  source: 'question' | 'duel' | 'challenge'
  date: string      // "2025-12-31"
  week?: string     // "2025-W01"
  month?: string    // "2025-12"
  subject_code?: string
  grade?: number
  created_at: number
}
