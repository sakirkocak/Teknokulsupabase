'use client'

import { useEffect, useCallback } from 'react'
import confetti from 'canvas-confetti'
import { LeaderboardDiff } from '@/hooks/useLeaderboardPolling'

interface LeaderboardConfettiProps {
  diffs: LeaderboardDiff[]
  currentUserId?: string // Kendi kullanıcımız için özel efekt
}

export function LeaderboardConfetti({ diffs, currentUserId }: LeaderboardConfettiProps) {
  
  // Küçük konfeti - Top 10 giriş
  const fireSmallConfetti = useCallback(() => {
    confetti({
      particleCount: 30,
      spread: 50,
      origin: { y: 0.6 },
      colors: ['#22c55e', '#10b981', '#34d399'],
      gravity: 1.2,
      ticks: 150
    })
  }, [])

  // Orta konfeti - Top 3 giriş
  const fireMediumConfetti = useCallback(() => {
    const duration = 2000
    const animationEnd = Date.now() + duration

    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now()
      if (timeLeft <= 0) {
        clearInterval(interval)
        return
      }

      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#fbbf24', '#f59e0b', '#d97706']
      })
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#fbbf24', '#f59e0b', '#d97706']
      })
    }, 100)

    return () => clearInterval(interval)
  }, [])

  // Büyük konfeti - 1. sıra
  const fireBigConfetti = useCallback(() => {
    const duration = 3000
    const animationEnd = Date.now() + duration

    // İlk patlama
    confetti({
      particleCount: 100,
      spread: 100,
      origin: { y: 0.5 },
      colors: ['#FFD700', '#FFA500', '#FF6B6B', '#4ECDC4', '#8B5CF6'],
      gravity: 0.8,
      scalar: 1.2
    })

    // Devam eden efekt
    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now()
      if (timeLeft <= 0) {
        clearInterval(interval)
        return
      }

      const particleCount = 50 * (timeLeft / duration)

      // Sol taraftan
      confetti({
        particleCount: particleCount / 2,
        angle: 60,
        spread: 60,
        startVelocity: 45,
        origin: { x: 0, y: 0.7 },
        colors: ['#FFD700', '#FFA500'],
        gravity: 1
      })

      // Sağ taraftan
      confetti({
        particleCount: particleCount / 2,
        angle: 120,
        spread: 60,
        startVelocity: 45,
        origin: { x: 1, y: 0.7 },
        colors: ['#8B5CF6', '#EC4899'],
        gravity: 1
      })
    }, 200)

    return () => clearInterval(interval)
  }, [])

  // Roket efekti - 3+ sıra atlama
  const fireRocketConfetti = useCallback(() => {
    // Yukarı doğru roket
    confetti({
      particleCount: 50,
      angle: 90,
      spread: 30,
      startVelocity: 60,
      origin: { x: 0.5, y: 1 },
      colors: ['#6366f1', '#8b5cf6', '#a855f7'],
      gravity: 1.5,
      ticks: 200
    })

    // Yıldız efekti
    setTimeout(() => {
      confetti({
        particleCount: 30,
        spread: 360,
        startVelocity: 20,
        origin: { x: 0.5, y: 0.3 },
        colors: ['#fbbf24', '#f59e0b'],
        shapes: ['star'],
        gravity: 0.5
      })
    }, 500)
  }, [])

  // Diff'leri izle ve uygun efekti tetikle
  useEffect(() => {
    if (diffs.length === 0) return

    diffs.forEach(diff => {
      // Sadece kendi kullanıcımız veya önemli değişiklikler için
      const isCurrentUser = currentUserId && diff.studentId === currentUserId

      // 1. sıraya çıkma
      if (diff.newRank === 1 && diff.oldRank !== 1) {
        fireBigConfetti()
        return
      }

      // Top 3'e giriş
      if (diff.newRank <= 3 && diff.oldRank > 3) {
        fireMediumConfetti()
        return
      }

      // 3+ sıra atlama (roket)
      if (diff.rankChange === 'up' && diff.rankDelta >= 3) {
        fireRocketConfetti()
        return
      }

      // Top 10'a giriş
      if (diff.newRank <= 10 && (diff.oldRank > 10 || diff.rankChange === 'new')) {
        if (isCurrentUser) {
          fireSmallConfetti()
        }
        return
      }

      // Kendi puanımız artınca küçük efekt
      if (isCurrentUser && diff.pointsGained > 0) {
        fireSmallConfetti()
      }
    })
  }, [diffs, currentUserId, fireBigConfetti, fireMediumConfetti, fireRocketConfetti, fireSmallConfetti])

  return null // Bu komponent görsel render etmez, sadece konfeti tetikler
}

// Manuel tetikleme için hook
export function useLeaderboardConfetti() {
  const celebrate = useCallback((type: 'small' | 'medium' | 'big' | 'rocket') => {
    switch (type) {
      case 'small':
        confetti({
          particleCount: 30,
          spread: 50,
          origin: { y: 0.6 },
          colors: ['#22c55e', '#10b981', '#34d399']
        })
        break
      case 'medium':
        confetti({
          particleCount: 50,
          spread: 70,
          origin: { y: 0.5 },
          colors: ['#fbbf24', '#f59e0b', '#d97706']
        })
        break
      case 'big':
        confetti({
          particleCount: 100,
          spread: 100,
          origin: { y: 0.5 },
          colors: ['#FFD700', '#FFA500', '#FF6B6B', '#4ECDC4', '#8B5CF6']
        })
        break
      case 'rocket':
        confetti({
          particleCount: 50,
          angle: 90,
          spread: 30,
          startVelocity: 60,
          origin: { x: 0.5, y: 1 },
          colors: ['#6366f1', '#8b5cf6', '#a855f7']
        })
        break
    }
  }, [])

  return { celebrate }
}

export default LeaderboardConfetti

