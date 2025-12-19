'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { generateDailyChallenges, type DailyChallenge } from '@/lib/gamification'

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
  
  // Aksiyonlar
  updateProgress: (challengeId: string, amount: number) => Promise<boolean>
  markAsCompleted: (challengeId: string) => Promise<void>
  getTimeRemaining: () => string
}

export function useDailyChallenge(userId: string | null): UseDailyChallengeReturn {
  const [challenges, setChallenges] = useState<DailyChallenge[]>([])
  const [progress, setProgress] = useState<Record<string, ChallengeProgress>>({})
  const [loading, setLoading] = useState(true)
  
  const supabase = createClient()

  // Günlük görevleri ve ilerlemeyi yükle
  const loadChallenges = useCallback(async () => {
    // Günlük görevleri oluştur (hata işleme ile)
    let dailyChallenges: DailyChallenge[] = []
    try {
      dailyChallenges = generateDailyChallenges()
    } catch (e) {
      console.error('Günlük görev oluşturma hatası:', e)
    }
    setChallenges(dailyChallenges)

    if (!userId) {
      setLoading(false)
      return
    }

    try {
      // Kullanıcının ilerleme verilerini al
      const today = new Date().toISOString().split('T')[0]
      
      const { data: progressData } = await supabase
        .from('challenge_progress')
        .select('*')
        .eq('user_id', userId)
        .like('challenge_id', `daily_${today}%`)

      const progressMap: Record<string, ChallengeProgress> = {}
      
      // Tüm görevler için ilerleme verisi oluştur
      for (const challenge of dailyChallenges) {
        const existing = progressData?.find(p => p.challenge_id === challenge.id)
        
        progressMap[challenge.id] = {
          challenge_id: challenge.id,
          current_progress: existing?.current_progress || 0,
          is_completed: existing?.is_completed || false,
          completed_at: existing?.completed_at,
        }
      }
      
      setProgress(progressMap)
    } catch (error) {
      console.error('Günlük görevler yüklenirken hata:', error)
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
      // Upsert progress
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
    } catch (error) {
      console.error('Görev ilerlemesi güncellenirken hata:', error)
      return false
    }
  }, [userId, challenges, progress, supabase])

  // Görevi tamamlandı olarak işaretle
  const markAsCompleted = useCallback(async (challengeId: string) => {
    if (!userId) return

    const challenge = challenges.find(c => c.id === challengeId)
    if (!challenge) return

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

      setProgress(prev => ({
        ...prev,
        [challengeId]: {
          challenge_id: challengeId,
          current_progress: challenge.target_value,
          is_completed: true,
          completed_at: new Date().toISOString(),
        }
      }))
    } catch (error) {
      console.error('Görev tamamlanırken hata:', error)
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
    updateProgress,
    markAsCompleted,
    getTimeRemaining,
  }
}

