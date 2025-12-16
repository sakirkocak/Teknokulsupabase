export type UserRole = 'ogrenci' | 'ogretmen' | 'veli' | 'admin'

export interface Profile {
  id: string
  email: string
  full_name: string
  avatar_url: string | null
  phone: string | null
  role: UserRole
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface TeacherProfile {
  id: string
  user_id: string
  headline: string | null
  bio: string | null
  subjects: string[]
  experience_years: number
  education: string | null
  languages: string[]
  hourly_rate: number
  available_days: string[]
  lesson_types: string[]
  average_rating: number
  review_count: number
  is_verified: boolean
  is_coach: boolean
  is_listed: boolean
  video_url: string | null
  certificates: { name: string; issuer: string; url: string }[]
  specializations: string[]
  teaching_style: string | null
  target_students: string | null
  achievements: string | null
  created_at: string
}

export interface StudentProfile {
  id: string
  user_id: string
  grade_level: string | null
  grade: number | null
  target_exam: string | null
  school_name: string | null
  city_id: string | null
  district_id: string | null
  school_id: string | null
  created_at: string
}

export interface ParentProfile {
  id: string
  user_id: string
  phone: string | null
  created_at: string
}

export interface CoachingRelationship {
  id: string
  coach_id: string
  student_id: string
  status: 'pending' | 'active' | 'ended'
  started_at: string | null
  ended_at: string | null
  created_at: string
}

export interface Task {
  id: string
  coach_id: string
  student_id: string
  title: string
  description: string | null
  type: 'quiz' | 'homework' | 'project' | 'daily'
  due_date: string | null
  status: 'pending' | 'in_progress' | 'submitted' | 'completed'
  student_response: string | null
  coach_feedback: string | null
  score: number | null
  created_at: string
  updated_at: string
}

export interface ExamResult {
  id: string
  student_id: string
  exam_name: string
  exam_date: string
  image_url: string | null
  status: 'pending' | 'approved' | 'rejected'
  approved_by: string | null
  total_correct: number | null
  total_wrong: number | null
  total_empty: number | null
  net_score: number | null
  details: Record<string, any> | null
  created_at: string
}

export interface ActivityLog {
  id: string
  student_id: string
  activity_type: string
  subject: string | null
  correct_count: number
  wrong_count: number
  details: Record<string, any> | null
  created_at: string
}

export interface Message {
  id: string
  sender_id: string
  receiver_id: string
  content: string
  is_read: boolean
  created_at: string
}

export interface Notification {
  id: string
  user_id: string
  title: string
  message: string
  type: string
  is_read: boolean
  link: string | null
  created_at: string
}

export interface Material {
  id: string
  teacher_id: string
  title: string
  description: string | null
  category: string | null
  type: string
  price: number
  file_url: string | null
  preview_url: string | null
  downloads: number
  is_active: boolean
  created_at: string
}

export interface MaterialPurchase {
  id: string
  material_id: string
  buyer_id: string
  seller_id: string
  amount: number
  status: string
  created_at: string
}

export interface ParentReport {
  id: string
  coach_id: string
  parent_id: string
  student_id: string
  report_type: string
  title: string | null
  content: Record<string, any> | null
  is_read: boolean
  created_at: string
}

export interface Subject {
  id: string
  name: string
  slug: string
  code: string
  icon: string | null
  color: string | null
  category: string | null
  created_at: string
}

export interface Grade {
  id: number
  name: string
  level: 'ilkokul' | 'ortaokul' | 'lise'
  exam_type: string | null
  created_at: string
}

export interface GradeSubject {
  id: string
  grade_id: number
  subject_id: string
  is_exam_subject: boolean
  weekly_hours: number
  created_at: string
  grade?: Grade
  subject?: Subject
}

export interface Topic {
  id: string
  subject_id: string
  grade: number
  unit_number: number | null
  main_topic: string
  sub_topic: string | null
  learning_outcome: string | null
  is_active: boolean
  created_at: string
  subject?: Subject
}

export interface Question {
  id: string
  topic_id: string
  difficulty: 'easy' | 'medium' | 'hard' | 'legendary'
  question_text: string
  question_image_url: string | null
  options: { A: string; B: string; C: string; D: string; E?: string }
  correct_answer: 'A' | 'B' | 'C' | 'D' | 'E'
  explanation: string | null
  source: string | null
  year: number | null
  times_answered: number
  times_correct: number
  is_active: boolean
  created_by: string | null
  created_at: string
  updated_at: string
  topic?: Topic
}

export interface AIRecommendation {
  id: string
  student_id: string
  recommendation_type: string
  subject: string | null
  message: string
  priority: 'low' | 'medium' | 'high'
  is_dismissed: boolean
  created_at: string
}

export interface Review {
  id: string
  teacher_id: string
  student_id: string
  overall_rating: number
  communication_rating: number
  knowledge_rating: number
  punctuality_rating: number
  comment: string | null
  is_anonymous: boolean
  is_approved: boolean
  created_at: string
}

// =====================================================
// OYUNLAŞTIRMA TİPLERİ
// =====================================================

export interface TurkeyCity {
  id: string
  name: string
  plate_code: number
  created_at: string
}

export interface TurkeyDistrict {
  id: string
  city_id: string
  name: string
  created_at: string
}

export interface School {
  id: string
  name: string
  district_id: string
  address: string | null
  phone: string | null
  fax: string | null
  website: string | null
  school_type: string | null
  school_type_code: number | null
  institution_code: number | null
  ownership_type: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Badge {
  id: string
  name: string
  description: string | null
  icon: string
  category: 'streak' | 'points' | 'subject' | 'special' | 'rank'
  requirement_type: string
  requirement_value: number
  requirement_subject: string | null
  tier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond' | null
  points_reward: number
  is_active: boolean
  created_at: string
}

export interface StudentBadge {
  id: string
  student_id: string
  badge_id: string
  earned_at: string
  badge?: Badge
}

export interface AvatarItem {
  id: string
  name: string
  description: string | null
  category: 'head' | 'face' | 'body' | 'accessory' | 'background' | 'frame'
  image_url: string | null
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | null
  unlock_type: 'default' | 'points' | 'badge' | 'streak' | 'rank' | 'event' | 'purchase'
  unlock_value: number
  unlock_badge_id: string | null
  is_active: boolean
  created_at: string
}

export interface StudentAvatar {
  id: string
  student_id: string
  equipped_head: string | null
  equipped_face: string | null
  equipped_body: string | null
  equipped_accessory: string | null
  equipped_background: string | null
  equipped_frame: string | null
  unlocked_items: string[]
  updated_at: string
}

export interface Duel {
  id: string
  challenger_id: string
  opponent_id: string
  subject: string | null
  question_count: number
  status: 'pending' | 'active' | 'completed' | 'cancelled' | 'expired'
  challenger_score: number
  opponent_score: number
  challenger_answers: any[]
  opponent_answers: any[]
  winner_id: string | null
  question_ids: string[]
  current_question: number
  expires_at: string | null
  started_at: string | null
  completed_at: string | null
  created_at: string
}

export interface DuelStats {
  id: string
  student_id: string
  total_duels: number
  wins: number
  losses: number
  draws: number
  win_streak: number
  max_win_streak: number
  total_points_earned: number
  updated_at: string
}

export interface League {
  id: string
  name: string
  min_points: number
  max_points: number | null
  icon: string
  color: string
  tier: number
  created_at: string
}

export interface Season {
  id: string
  name: string
  start_date: string
  end_date: string
  is_active: boolean
  rewards: Record<string, any>
  created_at: string
}

export interface SeasonRanking {
  id: string
  season_id: string
  student_id: string
  total_points: number
  total_questions: number
  total_correct: number
  final_rank: number | null
  rewards_claimed: boolean
  created_at: string
}

export interface DailyQuest {
  id: string
  name: string
  description: string | null
  quest_type: string
  target_value: number
  target_subject: string | null
  points_reward: number
  is_active: boolean
  created_at: string
}

export interface StudentDailyQuest {
  id: string
  student_id: string
  quest_id: string
  quest_date: string
  current_progress: number
  is_completed: boolean
  completed_at: string | null
  reward_claimed: boolean
  created_at: string
  quest?: DailyQuest
}

export interface StudentPoints {
  id: string
  student_id: string
  total_points: number
  total_questions: number
  total_correct: number
  total_wrong: number
  turkce_points: number
  turkce_correct: number
  turkce_wrong: number
  matematik_points: number
  matematik_correct: number
  matematik_wrong: number
  fen_points: number
  fen_correct: number
  fen_wrong: number
  inkilap_points: number
  inkilap_correct: number
  inkilap_wrong: number
  din_points: number
  din_correct: number
  din_wrong: number
  ingilizce_points: number
  ingilizce_correct: number
  ingilizce_wrong: number
  current_streak: number
  max_streak: number
  last_activity_at: string
  created_at: string
  updated_at: string
}

export interface LeaderboardEntry {
  student_id: string
  full_name: string
  avatar_url: string | null
  grade: number | null
  city_name: string | null
  district_name: string | null
  school_name: string | null
  total_points: number
  total_questions: number
  total_correct: number
  total_wrong?: number
  max_streak: number
  success_rate: number
  rank: number
  class_rank?: number
  school_rank?: number
  district_rank?: number
  city_rank?: number
  turkey_rank?: number
}
