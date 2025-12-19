'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { 
  calculateLevel, 
  getXPForNextLevel, 
  checkEarnableBadges,
  getBadgeProgress,
  calculateStreakBonus,
  isStreakActive,
  hasActivityToday,
  XP_REWARDS,
  ALL_BADGES,
  type Badge,
  type Level,
  type UserStats,
  type XPSource
} from '@/lib/gamification'

interface GamificationState {
  // XP ve Seviye
  totalXP: number
  level: Level
  xpProgress: { needed: number; progress: number; nextLevel: Level | null }
  
  // Streak
  currentStreak: number
  maxStreak: number
  streakActive: boolean
  activityToday: boolean
  
  // Rozetler
  earnedBadges: string[]
  newBadges: Badge[]
  
  // Stats
  stats: UserStats | null
  
  // Yükleme
  loading: boolean
  initialized: boolean
}

interface UseGamificationReturn extends GamificationState {
  // Aksiyonlar
  addXP: (amount: number, source: XPSource, description?: string) => Promise<void>
  checkAndAwardBadges: () => Promise<Badge[]>
  updateStreak: () => Promise<void>
  clearNewBadges: () => void
  refresh: () => Promise<void>
  
  // Yardımcılar
  getBadgeProgress: (badge: Badge) => { current: number; target: number; percentage: number }
  isBadgeEarned: (badgeId: string) => boolean
}

export function useGamification(userId: string | null): UseGamificationReturn {
  const [state, setState] = useState<GamificationState>({
    totalXP: 0,
    level: calculateLevel(0),
    xpProgress: getXPForNextLevel(0),
    currentStreak: 0,
    maxStreak: 0,
    streakActive: false,
    activityToday: false,
    earnedBadges: [],
    newBadges: [],
    stats: null,
    loading: true,
    initialized: false,
  })

  const supabase = createClient()

  // Verileri yükle
  const loadData = useCallback(async () => {
    if (!userId) {
      setState(prev => ({ ...prev, loading: false }))
      return
    }

    try {
      // Student profile'ı al
      const { data: studentProfile } = await supabase
        .from('student_profiles')
        .select('id')
        .eq('user_id', userId)
        .single()

      if (!studentProfile) {
        setState(prev => ({ ...prev, loading: false }))
        return
      }

      // Student points'i al
      const { data: pointsData } = await supabase
        .from('student_points')
        .select('*')
        .eq('student_id', studentProfile.id)
        .single()

      // Kazanılmış rozetleri al
      const { data: userBadges } = await supabase
        .from('user_badges')
        .select('badge_id')
        .eq('user_id', userId)

      // Ders bazlı puanları al
      const { data: subjectPoints } = await supabase
        .from('student_subject_points')
        .select(`
          points,
          subject:subjects(name)
        `)
        .eq('student_id', studentProfile.id)

      const subjectPointsMap: Record<string, number> = {}
      subjectPoints?.forEach((sp: any) => {
        if (sp.subject?.name) {
          subjectPointsMap[sp.subject.name] = sp.points || 0
        }
      })

      const totalXP = pointsData?.total_xp || pointsData?.total_points || 0
      const currentStreak = pointsData?.current_streak || 0
      const maxStreak = pointsData?.max_streak || 0
      const lastActivity = pointsData?.last_activity_at

      const stats: UserStats = {
        total_questions: pointsData?.total_questions || 0,
        total_correct: pointsData?.total_correct || 0,
        current_streak: currentStreak,
        max_streak: maxStreak,
        subject_points: subjectPointsMap,
      }

      const earnedBadgeIds = userBadges?.map(b => b.badge_id) || []

      setState({
        totalXP,
        level: calculateLevel(totalXP),
        xpProgress: getXPForNextLevel(totalXP),
        currentStreak,
        maxStreak,
        streakActive: isStreakActive(lastActivity),
        activityToday: hasActivityToday(lastActivity),
        earnedBadges: earnedBadgeIds,
        newBadges: [],
        stats,
        loading: false,
        initialized: true,
      })
    } catch (error) {
      console.error('Gamification verisi yüklenirken hata:', error)
      setState(prev => ({ ...prev, loading: false }))
    }
  }, [userId, supabase])

  useEffect(() => {
    loadData()
  }, [loadData])

  // XP ekle
  const addXP = useCallback(async (amount: number, source: XPSource, description?: string) => {
    if (!userId || !state.stats) return

    try {
      const { data: studentProfile } = await supabase
        .from('student_profiles')
        .select('id')
        .eq('user_id', userId)
        .single()

      if (!studentProfile) return

      const newTotalXP = state.totalXP + amount
      const newLevel = calculateLevel(newTotalXP)
      const leveledUp = newLevel.level > state.level.level

      // Student points güncelle
      await supabase
        .from('student_points')
        .update({
          total_xp: newTotalXP,
          level: newLevel.level,
          updated_at: new Date().toISOString()
        })
        .eq('student_id', studentProfile.id)

      // XP geçmişine ekle
      await supabase.from('xp_history').insert({
        user_id: userId,
        xp_amount: amount,
        source_type: source,
        description: description || source
      })

      setState(prev => ({
        ...prev,
        totalXP: newTotalXP,
        level: newLevel,
        xpProgress: getXPForNextLevel(newTotalXP),
      }))

      // Seviye atladıysa özel işlem yapılabilir
      if (leveledUp) {
        console.log(`🎉 Seviye atlandı: ${newLevel.level} - ${newLevel.name}`)
      }
    } catch (error) {
      console.error('XP eklenirken hata:', error)
    }
  }, [userId, state.totalXP, state.level, state.stats, supabase])

  // Rozet kontrolü ve ödüllendirme
  const checkAndAwardBadges = useCallback(async (): Promise<Badge[]> => {
    if (!userId || !state.stats) return []

    const newlyEarned = checkEarnableBadges(state.stats, state.earnedBadges)
    
    if (newlyEarned.length === 0) return []

    try {
      // Rozetleri veritabanına kaydet
      const badgeInserts = newlyEarned.map(badge => ({
        user_id: userId,
        badge_id: badge.id,
      }))

      await supabase.from('user_badges').insert(badgeInserts)

      // XP ödüllerini ver
      let totalBadgeXP = 0
      for (const badge of newlyEarned) {
        totalBadgeXP += badge.xp_reward
        await supabase.from('xp_history').insert({
          user_id: userId,
          xp_amount: badge.xp_reward,
          source_type: 'badge_earned',
          description: `Rozet kazanıldı: ${badge.name}`
        })
      }

      // State güncelle
      const newTotalXP = state.totalXP + totalBadgeXP
      
      setState(prev => ({
        ...prev,
        totalXP: newTotalXP,
        level: calculateLevel(newTotalXP),
        xpProgress: getXPForNextLevel(newTotalXP),
        earnedBadges: [...prev.earnedBadges, ...newlyEarned.map(b => b.id)],
        newBadges: newlyEarned,
      }))

      return newlyEarned
    } catch (error) {
      console.error('Rozet verilirken hata:', error)
      return []
    }
  }, [userId, state.stats, state.earnedBadges, state.totalXP, supabase])

  // Streak güncelle
  const updateStreak = useCallback(async () => {
    if (!userId) return

    try {
      const { data: studentProfile } = await supabase
        .from('student_profiles')
        .select('id')
        .eq('user_id', userId)
        .single()

      if (!studentProfile) return

      const { data: pointsData } = await supabase
        .from('student_points')
        .select('current_streak, max_streak, last_activity_at')
        .eq('student_id', studentProfile.id)
        .single()

      const now = new Date()
      const lastActivity = pointsData?.last_activity_at ? new Date(pointsData.last_activity_at) : null
      
      let newStreak = 1
      
      if (lastActivity) {
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        const lastDay = new Date(lastActivity.getFullYear(), lastActivity.getMonth(), lastActivity.getDate())
        const diffDays = Math.floor((today.getTime() - lastDay.getTime()) / (1000 * 60 * 60 * 24))
        
        if (diffDays === 0) {
          // Bugün zaten aktivite var
          newStreak = pointsData?.current_streak || 1
        } else if (diffDays === 1) {
          // Dün aktivite vardı, streak devam
          newStreak = (pointsData?.current_streak || 0) + 1
        } else {
          // Streak kırıldı
          newStreak = 1
        }
      }

      const newMaxStreak = Math.max(newStreak, pointsData?.max_streak || 0)

      await supabase
        .from('student_points')
        .update({
          current_streak: newStreak,
          max_streak: newMaxStreak,
          last_activity_at: now.toISOString(),
          updated_at: now.toISOString()
        })
        .eq('student_id', studentProfile.id)

      // Streak bonusu ver
      const streakBonus = calculateStreakBonus(newStreak)
      if (newStreak > 1) {
        await addXP(streakBonus, 'streak_bonus', `${newStreak} günlük seri bonusu`)
      }

      setState(prev => ({
        ...prev,
        currentStreak: newStreak,
        maxStreak: newMaxStreak,
        streakActive: true,
        activityToday: true,
        stats: prev.stats ? {
          ...prev.stats,
          current_streak: newStreak,
          max_streak: newMaxStreak,
        } : null,
      }))
    } catch (error) {
      console.error('Streak güncellenirken hata:', error)
    }
  }, [userId, supabase, addXP])

  // Yeni rozetleri temizle
  const clearNewBadges = useCallback(() => {
    setState(prev => ({ ...prev, newBadges: [] }))
  }, [])

  // Verileri yenile
  const refresh = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true }))
    await loadData()
  }, [loadData])

  // Rozet ilerlemesi
  const getBadgeProgressFn = useCallback((badge: Badge) => {
    if (!state.stats) return { current: 0, target: badge.requirement_value, percentage: 0 }
    return getBadgeProgress(badge, state.stats)
  }, [state.stats])

  // Rozet kazanılmış mı?
  const isBadgeEarned = useCallback((badgeId: string) => {
    return state.earnedBadges.includes(badgeId)
  }, [state.earnedBadges])

  return {
    ...state,
    addXP,
    checkAndAwardBadges,
    updateStreak,
    clearNewBadges,
    refresh,
    getBadgeProgress: getBadgeProgressFn,
    isBadgeEarned,
  }
}

