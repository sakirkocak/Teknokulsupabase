// Remotion Types
export interface SolutionStep {
  id: string
  type: 'explanation' | 'calculation' | 'visualization' | 'quiz' | 'result'
  title: string
  content: string
  tts_text: string
  duration_seconds: number
  animation_template: string
  animation_data?: Record<string, unknown>
  quiz?: {
    question: string
    options: { id: string; text: string; is_correct: boolean }[]
    hint?: string
    explanation_correct?: string
    explanation_wrong?: string
  }
}

export interface SolutionData {
  question_summary: string
  difficulty: 'easy' | 'medium' | 'hard'
  estimated_time_seconds: number
  steps: SolutionStep[]
  summary: string
  key_concepts: string[]
  common_mistakes: string[]
}

export interface VideoProps {
  questionText: string
  subjectName: string
  steps: SolutionStep[]
  correctAnswer: string
  audioUrls?: string[]
}
