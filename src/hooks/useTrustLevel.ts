'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

export type TrustLevel = 'new' | 'verified' | 'trusted'

interface TrustLevelLimits {
  dailyQuestionLimit: number
  canDuel: boolean
  canMessage: boolean
  canUploadAvatar: boolean
  canReportQuestions: boolean
}

const TRUST_LIMITS: Record<TrustLevel, TrustLevelLimits> = {
  new: {
    dailyQuestionLimit: 50,
    canDuel: false,
    canMessage: false,
    canUploadAvatar: false,
    canReportQuestions: false,
  },
  verified: {
    dailyQuestionLimit: 200,
    canDuel: true,
    canMessage: true,
    canUploadAvatar: true,
    canReportQuestions: true,
  },
  trusted: {
    dailyQuestionLimit: Infinity,
    canDuel: true,
    canMessage: true,
    canUploadAvatar: true,
    canReportQuestions: true,
  },
}

interface UseTrustLevelReturn {
  trustLevel: TrustLevel
  limits: TrustLevelLimits
  loading: boolean
  daysUntilVerified: number
  questionsUntilVerified: number
  canPerformAction: (action: 'duel' | 'message' | 'upload_avatar' | 'report') => { allowed: boolean; reason?: string }
  checkDailyLimit: () => Promise<{ allowed: boolean; remaining: number; reason?: string }>
}

export function useTrustLevel(userId: string | null): UseTrustLevelReturn {
  const [trustLevel, setTrustLevel] = useState<TrustLevel>('new')
  const [loading, setLoading] = useState(true)
  const [daysUntilVerified, setDaysUntilVerified] = useState(7)
  const [questionsUntilVerified, setQuestionsUntilVerified] = useState(10)
  const [studentProfileId, setStudentProfileId] = useState<string | null>(null)
  
  const supabase = createClient()

  useEffect(() => {
    if (!userId) {
      setLoading(false)
      return
    }

    async function loadTrustLevel() {
      try {
        // Öğrenci profilini al
        const { data: studentProfile } = await supabase
          .from('student_profiles')
          .select('id, trust_level, created_at')
          .eq('user_id', userId)
          .single()

        if (studentProfile) {
          setStudentProfileId(studentProfile.id)
          setTrustLevel((studentProfile.trust_level as TrustLevel) || 'new')
          
          // Verified'a kaç gün kaldı
          const createdAt = new Date(studentProfile.created_at)
          const daysSinceCreation = Math.floor(
            (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24)
          )
          setDaysUntilVerified(Math.max(0, 7 - daysSinceCreation))
          
          // Verified'a kaç soru kaldı
          const { data: points } = await supabase
            .from('student_points')
            .select('total_questions')
            .eq('student_id', studentProfile.id)
            .single()
          
          const totalQuestions = points?.total_questions || 0
          setQuestionsUntilVerified(Math.max(0, 10 - totalQuestions))
        }
      } catch (error) {
        console.error('Trust level yüklenirken hata:', error)
      } finally {
        setLoading(false)
      }
    }

    loadTrustLevel()
  }, [userId, supabase])

  const limits = TRUST_LIMITS[trustLevel]

  const canPerformAction = useCallback((action: 'duel' | 'message' | 'upload_avatar' | 'report'): { allowed: boolean; reason?: string } => {
    if (trustLevel === 'trusted' || trustLevel === 'verified') {
      return { allowed: true }
    }

    // 'new' seviyesi kısıtlamaları
    const actionMap: Record<string, { allowed: boolean; reason: string }> = {
      duel: { 
        allowed: limits.canDuel, 
        reason: `Düello başlatmak için hesabınızın en az 7 günlük olması ve 10 soru çözmeniz gerekiyor. (${daysUntilVerified} gün, ${questionsUntilVerified} soru kaldı)` 
      },
      message: { 
        allowed: limits.canMessage, 
        reason: `Mesaj göndermek için hesabınızın en az 7 günlük olması gerekiyor. (${daysUntilVerified} gün kaldı)` 
      },
      upload_avatar: { 
        allowed: limits.canUploadAvatar, 
        reason: `Profil fotoğrafı yüklemek için hesabınızın doğrulanması gerekiyor.` 
      },
      report: { 
        allowed: limits.canReportQuestions, 
        reason: `Soru bildirmek için hesabınızın doğrulanması gerekiyor.` 
      },
    }

    return actionMap[action] || { allowed: true }
  }, [trustLevel, limits, daysUntilVerified, questionsUntilVerified])

  const checkDailyLimit = useCallback(async (): Promise<{ allowed: boolean; remaining: number; reason?: string }> => {
    if (!studentProfileId) {
      return { allowed: true, remaining: limits.dailyQuestionLimit }
    }

    if (limits.dailyQuestionLimit === Infinity) {
      return { allowed: true, remaining: Infinity }
    }

    try {
      // Bugün çözülen soru sayısını al
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const { count } = await supabase
        .from('questions')
        .select('*', { count: 'exact', head: true })
        .eq('last_answered_by', studentProfileId)
        .gte('last_answered_at', today.toISOString())

      const answeredToday = count || 0
      const remaining = limits.dailyQuestionLimit - answeredToday

      if (remaining <= 0) {
        return {
          allowed: false,
          remaining: 0,
          reason: `Günlük soru çözme limitinize (${limits.dailyQuestionLimit}) ulaştınız. Yarın tekrar deneyin veya hesabınızı doğrulayın.`
        }
      }

      return { allowed: true, remaining }
    } catch (error) {
      console.error('Günlük limit kontrolü hatası:', error)
      return { allowed: true, remaining: limits.dailyQuestionLimit }
    }
  }, [studentProfileId, limits.dailyQuestionLimit, supabase])

  return {
    trustLevel,
    limits,
    loading,
    daysUntilVerified,
    questionsUntilVerified,
    canPerformAction,
    checkDailyLimit,
  }
}

export default useTrustLevel

