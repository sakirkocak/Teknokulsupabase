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
    
    // Istatistikler
    { name: 'times_answered', type: 'int32' },
    { name: 'times_correct', type: 'int32' },
    { name: 'success_rate', type: 'float', optional: true },
    
    // Zaman
    { name: 'created_at', type: 'int64' }
  ],
  default_sorting_field: 'created_at'
}

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
  times_answered: number
  times_correct: number
  success_rate?: number
  created_at: number
}

