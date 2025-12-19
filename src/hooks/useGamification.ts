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
  error: string | null
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

// Güvenli başlangıç değerleri
const DEFAULT_LEVEL: Level = { level: 1, name: 'Çaylak', minXP: 0, maxXP: 99, icon: '🌱', color: 'text-green-500' }
const DEFAULT_XP_PROGRESS: { needed: number; progress: number; nextLevel: Level | null } = { needed: 100, progress: 0, nextLevel: null }

const INITIAL_STATE: GamificationState = {
  totalXP: 0,
  level: DEFAULT_LEVEL,
  xpProgress: DEFAULT_XP_PROGRESS,
  currentStreak: 0,
  maxStreak: 0,
  streakActive: false,
  activityToday: false,
  earnedBadges: [],
  newBadges: [],
  stats: null,
  loading: true,
  initialized: false,
  error: null,
}

export function useGamification(userId: string | null): UseGamificationReturn {
  const [state, setState] = useState<GamificationState>(INITIAL_STATE)
  const supabase = createClient()

  // Verileri yükle
  const loadData = useCallback(async () => {
    // userId yoksa hemen dön
    if (!userId) {
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        initialized: true,
        error: null 
      }))
      return
    }

    try {
      // Student profile'ı al
      const { data: studentProfile, error: profileError } = await supabase
        .from('student_profiles')
        .select('id')
        .eq('user_id', userId)
        .single()

      if (profileError || !studentProfile) {
        // Profil yoksa varsayılan değerlerle devam et
        setState(prev => ({ 
          ...prev, 
          loading: false, 
          initialized: true,
          error: null 
        }))
        return
      }

      // Student points'i al
      const { data: pointsData, error: pointsError } = await supabase
        .from('student_points')
        .select('*')
        .eq('student_id', studentProfile.id)
        .single()

      // Kazanılmış rozetleri al (tablo yoksa hata yakala)
      let earnedBadgeIds: string[] = []
      try {
        const { data: userBadges } = await supabase
          .from('user_badges')
          .select('badge_id')
          .eq('user_id', userId)
        earnedBadgeIds = userBadges?.map(b => b.badge_id) || []
      } catch (e) {
        console.warn('user_badges tablosu bulunamadı, devam ediliyor...')
      }

      // Ders bazlı puanları al
      let subjectPointsMap: Record<string, number> = {}
      try {
        const { data: subjectPoints } = await supabase
          .from('student_subject_points')
          .select(`
            points,
            subject:subjects(name)
          `)
          .eq('student_id', studentProfile.id)
        
        subjectPoints?.forEach((sp: any) => {
          if (sp.subject?.name) {
            subjectPointsMap[sp.subject.name] = sp.points || 0
          }
        })
      } catch (e) {
        console.warn('student_subject_points tablosu bulunamadı, devam ediliyor...')
      }

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

      // Güvenli seviye hesaplama
      let level = DEFAULT_LEVEL
      let xpProgress = DEFAULT_XP_PROGRESS
      try {
        level = calculateLevel(totalXP)
        xpProgress = getXPForNextLevel(totalXP)
      } catch (e) {
        console.warn('Seviye hesaplama hatası:', e)
      }

      setState({
        totalXP,
        level,
        xpProgress,
        currentStreak,
        maxStreak,
        streakActive: isStreakActive(lastActivity),
        activityToday: hasActivityToday(lastActivity),
        earnedBadges: earnedBadgeIds,
        newBadges: [],
        stats,
        loading: false,
        initialized: true,
        error: null,
      })
    } catch (error) {
      console.error('Gamification verisi yüklenirken hata:', error)
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        initialized: true,
        error: 'Veri yüklenemedi' 
      }))
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
      let newLevel = state.level
      try {
        newLevel = calculateLevel(newTotalXP)
      } catch (e) {
        console.warn('Seviye hesaplama hatası:', e)
      }
      
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

      // XP geçmişine ekle (tablo varsa)
      try {
        await supabase.from('xp_history').insert({
          user_id: userId,
          xp_amount: amount,
          source_type: source,
          description: description || source
        })
      } catch (e) {
        console.warn('XP geçmişi kaydedilemedi:', e)
      }

      let newXpProgress = state.xpProgress
      try {
        newXpProgress = getXPForNextLevel(newTotalXP)
      } catch (e) {
        console.warn('XP progress hesaplama hatası:', e)
      }

      setState(prev => ({
        ...prev,
        totalXP: newTotalXP,
        level: newLevel,
        xpProgress: newXpProgress,
      }))

      // Seviye atladıysa özel işlem yapılabilir
      if (leveledUp) {
        console.log(`🎉 Seviye atlandı: ${newLevel.level} - ${newLevel.name}`)
      }
    } catch (error) {
      console.error('XP eklenirken hata:', error)
    }
  }, [userId, state.totalXP, state.level, state.stats, state.xpProgress, supabase])

  // Rozet kontrolü ve ödüllendirme
  const checkAndAwardBadges = useCallback(async (): Promise<Badge[]> => {
    if (!userId || !state.stats) return []

    try {
      const earnableBadges = checkEarnableBadges(state.stats, state.earnedBadges)
      
      if (earnableBadges.length === 0) return []

      // Yeni rozetleri kaydet (tablo varsa)
      for (const badge of earnableBadges) {
        try {
          await supabase.from('user_badges').insert({
            user_id: userId,
            badge_id: badge.id,
          })
        } catch (e) {
          console.warn('Rozet kaydedilemedi:', badge.id, e)
        }
      }

      setState(prev => ({
        ...prev,
        earnedBadges: [...prev.earnedBadges, ...earnableBadges.map(b => b.id)],
        newBadges: earnableBadges,
      }))

      return earnableBadges
    } catch (error) {
      console.error('Rozet kontrolü sırasında hata:', error)
      return []
    }
  }, [userId, state.stats, state.earnedBadges, supabase])

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

      if (!pointsData) return

      const lastActivity = pointsData.last_activity_at
      const wasActiveToday = hasActivityToday(lastActivity)
      const wasActiveYesterday = isStreakActive(lastActivity)

      let newStreak = pointsData.current_streak || 0
      
      if (!wasActiveToday) {
        if (wasActiveYesterday) {
          newStreak += 1
        } else {
          newStreak = 1
        }

        const newMaxStreak = Math.max(newStreak, pointsData.max_streak || 0)

        await supabase
          .from('student_points')
          .update({
            current_streak: newStreak,
            max_streak: newMaxStreak,
            last_activity_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('student_id', studentProfile.id)

        setState(prev => ({
          ...prev,
          currentStreak: newStreak,
          maxStreak: newMaxStreak,
          activityToday: true,
          streakActive: true,
        }))
      }
    } catch (error) {
      console.error('Streak güncellenirken hata:', error)
    }
  }, [userId, supabase])

  // Yeni rozetleri temizle
  const clearNewBadges = useCallback(() => {
    setState(prev => ({ ...prev, newBadges: [] }))
  }, [])

  // Yenile
  const refresh = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true }))
    await loadData()
  }, [loadData])

  // Rozet ilerleme yardımcısı
  const getBadgeProgressHelper = useCallback((badge: Badge) => {
    if (!state.stats) return { current: 0, target: badge.requirement_value, percentage: 0 }
    try {
      return getBadgeProgress(badge, state.stats)
    } catch (e) {
      return { current: 0, target: badge.requirement_value, percentage: 0 }
    }
  }, [state.stats])

  // Rozet kazanılmış mı kontrolü
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
    getBadgeProgress: getBadgeProgressHelper,
    isBadgeEarned,
  }
}
