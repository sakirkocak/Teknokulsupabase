'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { RealtimeChannel } from '@supabase/supabase-js'

/**
 * Düello Oyuncu Durumu
 */
export interface PlayerState {
  id: string
  name: string
  avatarUrl?: string
  score: number
  currentQuestion: number
  answered: boolean
  isReady: boolean
  streak: number // Kombo sayısı
  lastAnswerCorrect?: boolean
  lastAnswerTime?: number // ms cinsinden
}

/**
 * Düello Oyun Durumu
 */
export interface DuelGameState {
  duelId: string
  status: 'waiting' | 'countdown' | 'playing' | 'question_result' | 'finished'
  currentQuestionIndex: number
  totalQuestions: number
  questionStartedAt?: number // timestamp
  timePerQuestion: number // saniye
  player1: PlayerState
  player2: PlayerState
  winnerId?: string
}

/**
 * Düello Event Tipleri
 */
export type DuelEventType = 
  | 'player_ready'
  | 'game_start'
  | 'question_answer'
  | 'next_question'
  | 'game_end'
  | 'player_disconnect'

export interface DuelEvent {
  type: DuelEventType
  playerId: string
  data?: any
  timestamp: number
}

interface UseDuelRealtimeOptions {
  duelId: string
  playerId: string
  playerName: string
  playerAvatar?: string
  onGameStart?: () => void
  onQuestionAnswer?: (playerId: string, isCorrect: boolean, timeMs: number) => void
  onNextQuestion?: (questionIndex: number) => void
  onGameEnd?: (winnerId: string | null) => void
  onOpponentDisconnect?: () => void
}

/**
 * useDuelRealtime Hook
 * 
 * Supabase Realtime kullanarak canlı düello senkronizasyonu sağlar.
 * İki oyuncu aynı anda aynı soruları görür ve birbirlerinin durumunu anlık takip eder.
 */
export function useDuelRealtime(options: UseDuelRealtimeOptions) {
  const {
    duelId,
    playerId,
    playerName,
    playerAvatar,
    onGameStart,
    onQuestionAnswer,
    onNextQuestion,
    onGameEnd,
    onOpponentDisconnect
  } = options

  const supabase = createClient()
  const channelRef = useRef<RealtimeChannel | null>(null)
  
  const [gameState, setGameState] = useState<DuelGameState | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [latency, setLatency] = useState<number>(0)

  // Oyun durumunu başlat
  const initializeGameState = useCallback((isPlayer1: boolean): DuelGameState => {
    const myState: PlayerState = {
      id: playerId,
      name: playerName,
      avatarUrl: playerAvatar,
      score: 0,
      currentQuestion: 0,
      answered: false,
      isReady: false,
      streak: 0
    }

    const emptyOpponent: PlayerState = {
      id: '',
      name: 'Rakip bekleniyor...',
      score: 0,
      currentQuestion: 0,
      answered: false,
      isReady: false,
      streak: 0
    }

    return {
      duelId,
      status: 'waiting',
      currentQuestionIndex: 0,
      totalQuestions: 10,
      timePerQuestion: 30,
      player1: isPlayer1 ? myState : emptyOpponent,
      player2: isPlayer1 ? emptyOpponent : myState
    }
  }, [duelId, playerId, playerName, playerAvatar])

  // Channel'a bağlan
  useEffect(() => {
    const channel = supabase.channel(`duel:${duelId}`, {
      config: {
        presence: {
          key: playerId,
        },
      },
    })

    // Presence - Online durumu
    channel
      .on('presence', { event: 'sync' }, () => {
        const presenceState = channel.presenceState()
        const players = Object.keys(presenceState)
        console.log('🎮 Presence sync:', players)
        
        // İki oyuncu da bağlandıysa
        if (players.length === 2) {
          setGameState(prev => {
            if (!prev) return prev
            return { ...prev, status: 'waiting' }
          })
        }
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('🎮 Player joined:', key, newPresences)
        
        // Rakip bağlandı
        if (key !== playerId && newPresences.length > 0) {
          const opponentData = newPresences[0] as any
          setGameState(prev => {
            if (!prev) return prev
            
            const isPlayer1 = prev.player1.id === playerId
            const opponentState: PlayerState = {
              id: key,
              name: opponentData.name || 'Rakip',
              avatarUrl: opponentData.avatarUrl,
              score: 0,
              currentQuestion: 0,
              answered: false,
              isReady: false,
              streak: 0
            }
            
            return {
              ...prev,
              player2: isPlayer1 ? opponentState : prev.player2,
              player1: isPlayer1 ? prev.player1 : opponentState
            }
          })
        }
      })
      .on('presence', { event: 'leave' }, ({ key }) => {
        console.log('🎮 Player left:', key)
        if (key !== playerId) {
          onOpponentDisconnect?.()
        }
      })

    // Broadcast - Oyun eventleri
    channel
      .on('broadcast', { event: 'duel_event' }, ({ payload }) => {
        const event = payload as DuelEvent
        console.log('🎮 Duel event:', event)
        
        handleDuelEvent(event)
      })

    // Bağlan
    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        setIsConnected(true)
        setError(null)
        
        // Presence'a katıl
        await channel.track({
          id: playerId,
          name: playerName,
          avatarUrl: playerAvatar,
          online_at: new Date().toISOString()
        })
        
        // İlk durumu ayarla
        setGameState(initializeGameState(true))
        
        console.log('🎮 Connected to duel channel:', duelId)
      } else if (status === 'CHANNEL_ERROR') {
        setError('Bağlantı hatası')
        setIsConnected(false)
      }
    })

    channelRef.current = channel

    return () => {
      channel.unsubscribe()
      channelRef.current = null
    }
  }, [duelId, playerId, playerName, playerAvatar, supabase, initializeGameState, onOpponentDisconnect])

  // Düello eventlerini işle
  const handleDuelEvent = useCallback((event: DuelEvent) => {
    const { type, playerId: eventPlayerId, data, timestamp } = event
    
    // Latency hesapla
    const now = Date.now()
    setLatency(now - timestamp)

    switch (type) {
      case 'player_ready':
        setGameState(prev => {
          if (!prev) return prev
          const isPlayer1 = prev.player1.id === eventPlayerId
          return {
            ...prev,
            player1: isPlayer1 ? { ...prev.player1, isReady: true } : prev.player1,
            player2: !isPlayer1 ? { ...prev.player2, isReady: true } : prev.player2
          }
        })
        break

      case 'game_start':
        setGameState(prev => {
          if (!prev) return prev
          return {
            ...prev,
            status: 'countdown',
            questionStartedAt: data.startTime
          }
        })
        onGameStart?.()
        break

      case 'question_answer':
        const { isCorrect, timeMs, questionIndex } = data
        
        setGameState(prev => {
          if (!prev) return prev
          const isPlayer1 = prev.player1.id === eventPlayerId
          const player = isPlayer1 ? prev.player1 : prev.player2
          
          // Skor hesapla (doğru: +10, yanlış: 0)
          const pointsEarned = isCorrect ? 10 : 0
          const newStreak = isCorrect ? player.streak + 1 : 0
          
          // Kombo bonusu
          let comboBonus = 0
          if (newStreak >= 3) comboBonus = 5
          if (newStreak >= 5) comboBonus = 10
          
          const updatedPlayer: PlayerState = {
            ...player,
            score: player.score + pointsEarned + comboBonus,
            answered: true,
            streak: newStreak,
            lastAnswerCorrect: isCorrect,
            lastAnswerTime: timeMs
          }
          
          return {
            ...prev,
            player1: isPlayer1 ? updatedPlayer : prev.player1,
            player2: !isPlayer1 ? updatedPlayer : prev.player2
          }
        })
        
        onQuestionAnswer?.(eventPlayerId, isCorrect, timeMs)
        break

      case 'next_question':
        setGameState(prev => {
          if (!prev) return prev
          return {
            ...prev,
            status: 'playing',
            currentQuestionIndex: data.questionIndex,
            questionStartedAt: data.startTime,
            player1: { ...prev.player1, answered: false },
            player2: { ...prev.player2, answered: false }
          }
        })
        onNextQuestion?.(data.questionIndex)
        break

      case 'game_end':
        setGameState(prev => {
          if (!prev) return prev
          return {
            ...prev,
            status: 'finished',
            winnerId: data.winnerId
          }
        })
        onGameEnd?.(data.winnerId)
        break

      case 'player_disconnect':
        onOpponentDisconnect?.()
        break
    }
  }, [onGameStart, onQuestionAnswer, onNextQuestion, onGameEnd, onOpponentDisconnect])

  // Event gönder
  const sendEvent = useCallback(async (type: DuelEventType, data?: any) => {
    if (!channelRef.current) return

    const event: DuelEvent = {
      type,
      playerId,
      data,
      timestamp: Date.now()
    }

    await channelRef.current.send({
      type: 'broadcast',
      event: 'duel_event',
      payload: event
    })
  }, [playerId])

  // Hazır olduğunu bildir
  const setReady = useCallback(() => {
    sendEvent('player_ready')
    setGameState(prev => {
      if (!prev) return prev
      const isPlayer1 = prev.player1.id === playerId
      return {
        ...prev,
        player1: isPlayer1 ? { ...prev.player1, isReady: true } : prev.player1,
        player2: !isPlayer1 ? { ...prev.player2, isReady: true } : prev.player2
      }
    })
  }, [sendEvent, playerId])

  // Cevap gönder
  const submitAnswer = useCallback((answer: string, isCorrect: boolean, questionIndex: number, timeMs: number) => {
    sendEvent('question_answer', {
      answer,
      isCorrect,
      questionIndex,
      timeMs
    })
  }, [sendEvent])

  // Sonraki soruya geç (sadece host)
  const nextQuestion = useCallback((questionIndex: number) => {
    sendEvent('next_question', {
      questionIndex,
      startTime: Date.now()
    })
  }, [sendEvent])

  // Oyunu başlat (sadece host)
  const startGame = useCallback(() => {
    sendEvent('game_start', {
      startTime: Date.now() + 3000 // 3 saniye countdown
    })
  }, [sendEvent])

  // Oyunu bitir
  const endGame = useCallback((winnerId: string | null) => {
    sendEvent('game_end', { winnerId })
  }, [sendEvent])

  return {
    gameState,
    isConnected,
    error,
    latency,
    setReady,
    submitAnswer,
    nextQuestion,
    startGame,
    endGame
  }
}

