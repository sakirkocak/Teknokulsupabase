'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { type DailyChallenge } from '@/lib/gamification'

interface ChallengeProgress {
  challenge_id: string
  current_progress: number
  is_completed: boolean
  completed_at?: string
}

interface UseDailyChallengeReturn {
  challenges: DailyChallenge[]
  progress: Record<string, ChallengeProgress>
  completedCount: number
  totalXPEarned: number
  loading: boolean
  error: string | null
  
  // Aksiyonlar
  updateProgress: (challengeId: string, amount: number) => Promise<boolean>
  markAsCompleted: (challengeId: string) => Promise<void>
  getTimeRemaining: () => string
}

// Statik günlük görevler (veritabanına bağımlı değil)
const STATIC_DAILY_CHALLENGES: DailyChallenge[] = [
  {
    id: 'daily_practice',
    title: 'Günlük Pratik',
    description: '10 soru çöz',
    type: 'solve_questions',
    target_value: 10,
    xp_reward: 20,
    difficulty: 'easy'
  },
  {
    id: 'daily_streak',
    title: 'Serini Koru',
    description: 'Bugün en az 1 soru çöz',
    type: 'streak',
    target_value: 1,
    xp_reward: 15,
    difficulty: 'easy'
  },
  {
    id: 'daily_math',
    title: 'Matematik Zamanı',
    description: '5 matematik sorusu çöz',
    type: 'solve_subject',
    target_value: 5,
    subject_name: 'Matematik',
    xp_reward: 25,
    difficulty: 'medium'
  },
  {
    id: 'daily_accuracy',
    title: 'Keskin Nişancı',
    description: '%80 başarı ile 5 soru çöz',
    type: 'accuracy',
    target_value: 5,
    xp_reward: 30,
    difficulty: 'hard'
  },
  {
    id: 'daily_explorer',
    title: 'Kaşif',
    description: 'Farklı bir dersten 3 soru çöz',
    type: 'explore',
    target_value: 3,
    xp_reward: 20,
    difficulty: 'medium'
  }
]

export function useDailyChallenge(userId: string | null): UseDailyChallengeReturn {
  const [challenges, setChallenges] = useState<DailyChallenge[]>(STATIC_DAILY_CHALLENGES)
  const [progress, setProgress] = useState<Record<string, ChallengeProgress>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const supabase = createClient()

  // Günlük görevleri ve ilerlemeyi yükle
  const loadChallenges = useCallback(async () => {
    // Statik görevleri ayarla
    setChallenges(STATIC_DAILY_CHALLENGES)

    if (!userId) {
      // Varsayılan boş ilerleme
      const defaultProgress: Record<string, ChallengeProgress> = {}
      STATIC_DAILY_CHALLENGES.forEach(c => {
        defaultProgress[c.id] = {
          challenge_id: c.id,
          current_progress: 0,
          is_completed: false
        }
      })
      setProgress(defaultProgress)
      setLoading(false)
      return
    }

    try {
      // Önce görevleri senkronize et (bugün çözülen sorularla)
      try {
        await fetch('/api/challenges/sync', { method: 'POST' })
      } catch (syncErr) {
        console.warn('Görev senkronizasyonu başarısız:', syncErr)
      }

      // Kullanıcının ilerleme verilerini al (tablo varsa)
      const today = new Date().toISOString().split('T')[0]
      
      let progressData: any[] = []
      try {
        const { data, error: progressError } = await supabase
          .from('challenge_progress')
          .select('*')
          .eq('user_id', userId)
        
        if (!progressError && data) {
          // Bugünün görevlerini filtrele
          progressData = data.filter(p => p.challenge_id?.startsWith('daily_'))
        }
      } catch (e) {
        console.warn('challenge_progress tablosu bulunamadı, varsayılan değerler kullanılacak')
      }

      const progressMap: Record<string, ChallengeProgress> = {}
      
      // Tüm görevler için ilerleme verisi oluştur
      for (const challenge of STATIC_DAILY_CHALLENGES) {
        const existing = progressData?.find(p => p.challenge_id === challenge.id)
        
        progressMap[challenge.id] = {
          challenge_id: challenge.id,
          current_progress: existing?.current_progress || 0,
          is_completed: existing?.is_completed || false,
          completed_at: existing?.completed_at,
        }
      }
      
      setProgress(progressMap)
      setError(null)
    } catch (err) {
      console.error('Günlük görevler yüklenirken hata:', err)
      setError('Görevler yüklenemedi')
      
      // Hata durumunda varsayılan değerler
      const defaultProgress: Record<string, ChallengeProgress> = {}
      STATIC_DAILY_CHALLENGES.forEach(c => {
        defaultProgress[c.id] = {
          challenge_id: c.id,
          current_progress: 0,
          is_completed: false
        }
      })
      setProgress(defaultProgress)
    }
    
    setLoading(false)
  }, [userId, supabase])

  useEffect(() => {
    loadChallenges()
  }, [loadChallenges])

  // İlerleme güncelle
  const updateProgress = useCallback(async (challengeId: string, amount: number): Promise<boolean> => {
    if (!userId) return false

    const challenge = challenges.find(c => c.id === challengeId)
    if (!challenge) return false

    const currentProgress = progress[challengeId]
    if (currentProgress?.is_completed) return false

    const newProgress = (currentProgress?.current_progress || 0) + amount
    const isCompleted = newProgress >= challenge.target_value

    try {
      // Upsert progress (tablo varsa)
      try {
        await supabase
          .from('challenge_progress')
          .upsert({
            user_id: userId,
            challenge_id: challengeId,
            current_progress: Math.min(newProgress, challenge.target_value),
            is_completed: isCompleted,
            completed_at: isCompleted ? new Date().toISOString() : null,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'user_id,challenge_id'
          })
      } catch (e) {
        console.warn('İlerleme veritabanına kaydedilemedi:', e)
      }

      setProgress(prev => ({
        ...prev,
        [challengeId]: {
          challenge_id: challengeId,
          current_progress: Math.min(newProgress, challenge.target_value),
          is_completed: isCompleted,
          completed_at: isCompleted ? new Date().toISOString() : undefined,
        }
      }))

      return isCompleted
    } catch (err) {
      console.error('Görev ilerlemesi güncellenirken hata:', err)
      return false
    }
  }, [userId, challenges, progress, supabase])

  // Görevi tamamlandı olarak işaretle
  const markAsCompleted = useCallback(async (challengeId: string) => {
    if (!userId) return

    const challenge = challenges.find(c => c.id === challengeId)
    if (!challenge) return

    try {
      try {
        await supabase
          .from('challenge_progress')
          .upsert({
            user_id: userId,
            challenge_id: challengeId,
            current_progress: challenge.target_value,
            is_completed: true,
            completed_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'user_id,challenge_id'
          })
      } catch (e) {
        console.warn('Görev tamamlama veritabanına kaydedilemedi:', e)
      }

      setProgress(prev => ({
        ...prev,
        [challengeId]: {
          challenge_id: challengeId,
          current_progress: challenge.target_value,
          is_completed: true,
          completed_at: new Date().toISOString(),
        }
      }))
    } catch (err) {
      console.error('Görev tamamlanırken hata:', err)
    }
  }, [userId, challenges, supabase])

  // Kalan süre hesapla
  const getTimeRemaining = useCallback((): string => {
    const now = new Date()
    const midnight = new Date(now)
    midnight.setHours(24, 0, 0, 0)
    
    const diff = midnight.getTime() - now.getTime()
    
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    const seconds = Math.floor((diff % (1000 * 60)) / 1000)
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }, [])

  // Tamamlanan görev sayısı
  const completedCount = Object.values(progress).filter(p => p.is_completed).length

  // Toplam kazanılan XP
  const totalXPEarned = challenges.reduce((total, challenge) => {
    const challengeProgress = progress[challenge.id]
    if (challengeProgress?.is_completed) {
      return total + challenge.xp_reward
    }
    return total
  }, 0)

  return {
    challenges,
    progress,
    completedCount,
    totalXPEarned,
    loading,
    error,
    updateProgress,
    markAsCompleted,
    getTimeRemaining,
  }
}
