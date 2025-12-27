'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { 
  getLeaderboardFast, 
  getSubjectLeaderboardFast,
  LeaderboardEntry, 
  LeaderboardFilters,
  SubjectLeaderEntry
} from '@/lib/typesense/browser-client'

export interface LeaderboardDiff {
  studentId: string
  studentName: string
  oldRank: number
  newRank: number
  oldPoints: number
  newPoints: number
  rankChange: 'up' | 'down' | 'same' | 'new'
  rankDelta: number // Kaç sıra değişti
  pointsGained: number
  timestamp: number
}

export interface LeaderboardStats {
  totalStudents: number
  totalQuestions: number
  highestPoints: number
  longestStreak: number
}

interface UseLeaderboardPollingOptions {
  filters?: LeaderboardFilters
  subject?: string | null // Ders kodu (matematik, turkce, vb.) - null veya 'genel' ise genel sıralama
  pollingInterval?: number // ms cinsinden, default 5000
  enabled?: boolean
}

interface UseLeaderboardPollingResult {
  leaderboard: LeaderboardEntry[]
  stats: LeaderboardStats
  diffs: LeaderboardDiff[]
  activities: LeaderboardDiff[] // Son 10 aktivite
  loading: boolean
  error: Error | null
  lastUpdated: Date | null
  refetch: () => Promise<void>
}

export function useLeaderboardPolling({
  filters = {},
  subject = null,
  pollingInterval = 5000,
  enabled = true
}: UseLeaderboardPollingOptions = {}): UseLeaderboardPollingResult {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [stats, setStats] = useState<LeaderboardStats>({
    totalStudents: 0,
    totalQuestions: 0,
    highestPoints: 0,
    longestStreak: 0
  })
  const [diffs, setDiffs] = useState<LeaderboardDiff[]>([])
  const [activities, setActivities] = useState<LeaderboardDiff[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  
  // Önceki state'i ref'te tut (diff hesaplamak için)
  const previousLeaderboardRef = useRef<Map<string, LeaderboardEntry>>(new Map())
  const isFirstLoadRef = useRef(true)
  
  // Ders değiştiğinde state'leri sıfırla
  const prevSubjectRef = useRef<string | null>(subject)

  // Diff hesaplama fonksiyonu
  const calculateDiffs = useCallback((
    newData: LeaderboardEntry[],
    previousMap: Map<string, LeaderboardEntry>
  ): LeaderboardDiff[] => {
    const newDiffs: LeaderboardDiff[] = []
    
    newData.forEach((entry) => {
      const previous = previousMap.get(entry.student_id)
      
      if (!previous) {
        // Yeni giren
        newDiffs.push({
          studentId: entry.student_id,
          studentName: entry.full_name,
          oldRank: 0,
          newRank: entry.rank,
          oldPoints: 0,
          newPoints: entry.total_points,
          rankChange: 'new',
          rankDelta: 0,
          pointsGained: entry.total_points,
          timestamp: Date.now()
        })
      } else if (entry.rank !== previous.rank || entry.total_points !== previous.total_points) {
        // Sıra veya puan değişti
        const rankDelta = previous.rank - entry.rank // Pozitif = yükseldi
        newDiffs.push({
          studentId: entry.student_id,
          studentName: entry.full_name,
          oldRank: previous.rank,
          newRank: entry.rank,
          oldPoints: previous.total_points,
          newPoints: entry.total_points,
          rankChange: rankDelta > 0 ? 'up' : rankDelta < 0 ? 'down' : 'same',
          rankDelta: Math.abs(rankDelta),
          pointsGained: entry.total_points - previous.total_points,
          timestamp: Date.now()
        })
      }
    })
    
    return newDiffs
  }, [])

  // Ders değiştiğinde state'leri sıfırla
  useEffect(() => {
    if (subject !== prevSubjectRef.current) {
      prevSubjectRef.current = subject
      isFirstLoadRef.current = true
      previousLeaderboardRef.current = new Map()
      setDiffs([])
      setActivities([])
      setLoading(true)
    }
  }, [subject])

  // Veri çekme fonksiyonu
  const fetchLeaderboard = useCallback(async () => {
    try {
      let result: { data: LeaderboardEntry[]; total: number }
      
      // Ders bazlı mı genel mi?
      const isSubjectBased = subject && subject !== 'genel' && subject !== 'general'
      
      if (isSubjectBased) {
        // Ders bazlı liderlik
        const subjectResult = await getSubjectLeaderboardFast(subject, filters)
        result = { data: subjectResult.data, total: subjectResult.total }
      } else {
        // Genel liderlik
        result = await getLeaderboardFast(filters)
      }
      
      if (result.data && result.data.length > 0) {
        // Diff hesapla (ilk yüklemede değil)
        if (!isFirstLoadRef.current) {
          const newDiffs = calculateDiffs(result.data, previousLeaderboardRef.current)
          
          if (newDiffs.length > 0) {
            setDiffs(newDiffs)
            
            // Aktivitelere ekle (max 10)
            setActivities(prev => {
              const updated = [...newDiffs, ...prev].slice(0, 10)
              return updated
            })
          }
        }
        
        // Önceki state'i güncelle
        const newMap = new Map<string, LeaderboardEntry>()
        result.data.forEach(entry => {
          newMap.set(entry.student_id, entry)
        })
        previousLeaderboardRef.current = newMap
        
        // State güncelle
        setLeaderboard(result.data)
        
        // Stats hesapla
        const newStats: LeaderboardStats = {
          totalStudents: result.total,
          totalQuestions: result.data.reduce((sum, e) => sum + e.total_questions, 0),
          highestPoints: Math.max(...result.data.map(e => e.total_points), 0),
          longestStreak: Math.max(...result.data.map(e => e.max_streak || 0), 0)
        }
        setStats(newStats)
        
        isFirstLoadRef.current = false
      } else {
        // Veri yoksa boş array
        setLeaderboard([])
        setStats({
          totalStudents: 0,
          totalQuestions: 0,
          highestPoints: 0,
          longestStreak: 0
        })
      }
      
      setLastUpdated(new Date())
      setError(null)
    } catch (err) {
      console.error('Leaderboard polling error:', err)
      setError(err as Error)
    } finally {
      setLoading(false)
    }
  }, [filters, subject, calculateDiffs])

  // İlk yükleme
  useEffect(() => {
    if (enabled) {
      fetchLeaderboard()
    }
  }, [enabled, fetchLeaderboard])

  // Polling interval
  useEffect(() => {
    if (!enabled) return
    
    const intervalId = setInterval(() => {
      // Sayfa görünür durumdaysa polling yap
      if (document.visibilityState === 'visible') {
        fetchLeaderboard()
      }
    }, pollingInterval)
    
    // Sayfa visibility değiştiğinde
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchLeaderboard() // Sayfa tekrar görünür olunca hemen güncelle
      }
    }
    
    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    return () => {
      clearInterval(intervalId)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [enabled, pollingInterval, fetchLeaderboard])

  // Diffs'i 3 saniye sonra temizle (animasyon bittikten sonra)
  useEffect(() => {
    if (diffs.length > 0) {
      const timeoutId = setTimeout(() => {
        setDiffs([])
      }, 3000)
      
      return () => clearTimeout(timeoutId)
    }
  }, [diffs])

  return {
    leaderboard,
    stats,
    diffs,
    activities,
    loading,
    error,
    lastUpdated,
    refetch: fetchLeaderboard
  }
}

export default useLeaderboardPolling

