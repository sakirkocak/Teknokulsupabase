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
    { name: 'city_id', type: 'string', facet: true, optional: true },
    { name: 'city_name', type: 'string', facet: true, optional: true },
    { name: 'district_id', type: 'string', facet: true, optional: true },
    { name: 'district_name', type: 'string', facet: true, optional: true },
    { name: 'school_id', type: 'string', facet: true, optional: true },
    { name: 'school_name', type: 'string', facet: true, optional: true },
    
    // Ders bazli puanlar
    { name: 'matematik_points', type: 'int32', optional: true },
    { name: 'turkce_points', type: 'int32', optional: true },
    { name: 'fen_points', type: 'int32', optional: true },
    { name: 'inkilap_points', type: 'int32', optional: true },
    { name: 'din_points', type: 'int32', optional: true },
    { name: 'ingilizce_points', type: 'int32', optional: true },
    
    // Zaman
    { name: 'last_activity_at', type: 'int64' }
  ],
  default_sorting_field: 'total_points'
}

// Questions Collection Schema
export const questionsSchema: CollectionCreateSchema = {
  name: 'questions',
  fields: [
    { name: 'question_id', type: 'string' },
    { name: 'question_text', type: 'string' },
    { name: 'explanation', type: 'string', optional: true },
    
    // Filtreleme alanlari
    { name: 'difficulty', type: 'string', facet: true },
    { name: 'subject_id', type: 'string', facet: true },
    { name: 'subject_code', type: 'string', facet: true },
    { name: 'subject_name', type: 'string', facet: true },
    { name: 'topic_id', type: 'string', facet: true },
    { name: 'main_topic', type: 'string', facet: true },
    { name: 'sub_topic', type: 'string', facet: true, optional: true },
    { name: 'grade', type: 'int32', facet: true },
    { name: 'has_image', type: 'bool', facet: true, optional: true },
    
    // Istatistikler
    { name: 'times_answered', type: 'int32' },
    { name: 'times_correct', type: 'int32' },
    { name: 'success_rate', type: 'float', optional: true },
    
    // Zaman
    { name: 'created_at', type: 'int64' }
  ],
  default_sorting_field: 'created_at'
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
  city_id?: string
  city_name?: string
  district_id?: string
  district_name?: string
  school_id?: string
  school_name?: string
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
  question_text: string
  explanation?: string
  difficulty: string
  subject_id: string
  subject_code: string
  subject_name: string
  topic_id: string
  main_topic: string
  sub_topic?: string
  grade: number
  has_image?: boolean
  times_answered: number
  times_correct: number
  success_rate?: number
  created_at: number
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
