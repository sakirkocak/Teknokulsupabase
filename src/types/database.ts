export type UserRole = 'ogrenci' | 'ogretmen' | 'veli' | 'admin'

export interface Profile {
  id: string
  email: string
  full_name: string
  avatar_url: string | null
  role: UserRole
  created_at: string
  updated_at: string
}

export interface TeacherProfile {
  id: string
  user_id: string
  bio: string | null
  subjects: string[]
  experience_years: number
  hourly_rate: number
  rating: number
  total_reviews: number
  is_coach: boolean
  created_at: string
}

export interface StudentProfile {
  id: string
  user_id: string
  grade: number | null
  target_exam: string | null
  school: string | null
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
  data: Record<string, any> | null
  created_at: string
}

export interface Subject {
  id: string
  name: string
  category: string
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

