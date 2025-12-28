'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { createClient } from '@/lib/supabase/client'
import { useProfile, useStudentProfile } from '@/hooks/useProfile'
import { getInitials } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Swords, Users, Clock, Zap, Loader2, 
  CheckCircle, Circle, Wifi, WifiOff
} from 'lucide-react'
import confetti from 'canvas-confetti'

interface DuelWithProfiles {
  id: string
  challenger_id: string
  opponent_id: string
  subject: string | null
  question_count: number
  status: string
  challenger?: {
    id: string
    user_id: string
    profile?: { full_name: string; avatar_url: string | null }
  }
  opponent?: {
    id: string
    user_id: string
    profile?: { full_name: string; avatar_url: string | null }
  }
}

interface PlayerState {
  odaya_katildi: boolean
  hazir: boolean
  son_gorulme: string
}

export default function DuelWaitingRoom() {
  const router = useRouter()
  const params = useParams()
  const duelId = params.id as string
  
  const { profile } = useProfile()
  const { studentProfile } = useStudentProfile(profile?.id || '')
  
  const [duel, setDuel] = useState<DuelWithProfiles | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Oyuncu durumları
  const [myReady, setMyReady] = useState(false)
  const [opponentReady, setOpponentReady] = useState(false)
  const [opponentOnline, setOpponentOnline] = useState(false)
  
  // Geri sayım
  const [countdown, setCountdown] = useState<number | null>(null)
  const [starting, setStarting] = useState(false)
  
  const supabase = createClient()

  // Düello bilgisini yükle
  useEffect(() => {
    if (!duelId) return
    loadDuel()
  }, [duelId])

  const loadDuel = async () => {
    try {
      const response = await fetch(`/api/duel/info?duelId=${duelId}`)
      const result = await response.json()

      if (!response.ok || !result.duel) {
        console.error('Düello yükleme hatası:', result.error)
        setError('Düello bulunamadı')
        setLoading(false)
        return
      }

      const data = result.duel

      // Düello iptal veya tamamlandı mı?
      if (data.status === 'cancelled' || data.status === 'completed') {
        setError('Bu düello artık geçerli değil')
        setLoading(false)
        return
      }

      setDuel(data as any)
    } catch (err) {
      console.error('Düello yükleme hatası:', err)
      setError('Bağlantı hatası')
    }
    setLoading(false)
  }

  // Realtime kanal
  useEffect(() => {
    if (!duel || !studentProfile) return

    const channelName = `duel_waiting_${duelId}`
    
    const channel = supabase.channel(channelName, {
      config: {
        presence: {
          key: studentProfile.id
        }
      }
    })

    // Presence tracking
    channel.on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState()
      const presenceIds = Object.keys(state)
      
      // Rakip online mı?
      const opponentId = duel.challenger_id === studentProfile.id 
        ? duel.opponent_id 
        : duel.challenger_id
      
      setOpponentOnline(presenceIds.includes(opponentId))
    })

    // Hazır durumu broadcast
    channel.on('broadcast', { event: 'ready_state' }, ({ payload }) => {
      if (payload.studentId !== studentProfile.id) {
        setOpponentReady(payload.ready)
      }
    })

    // Geri sayım başlat
    channel.on('broadcast', { event: 'countdown_start' }, () => {
      startCountdown()
    })

    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await channel.track({
          online: true,
          ready: false,
          joined_at: new Date().toISOString()
        })
      }
    })

    return () => {
      channel.unsubscribe()
    }
  }, [duel, studentProfile, supabase])

  // Hazır ol
  const handleReady = async () => {
    if (!studentProfile || !duel) return
    
    setMyReady(true)
    
    // API ile ready durumunu güncelle
    try {
      const response = await fetch('/api/duel/ready', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          duelId,
          studentId: studentProfile.id,
          ready: true
        })
      })
      
      const data = await response.json()
      console.log('Ready response:', data)
      
      // Her iki taraf hazırsa geri sayımı başlat
      if (data.bothReady) {
        startCountdown()
      }
    } catch (err) {
      console.error('Ready API error:', err)
    }
    
    // Broadcast gönder (yedek olarak)
    const channelName = `duel_waiting_${duelId}`
    const channel = supabase.channel(channelName)
    
    await channel.send({
      type: 'broadcast',
      event: 'ready_state',
      payload: {
        studentId: studentProfile.id,
        ready: true
      }
    })
  }

  // Rakip hazır olduğunda kontrol
  useEffect(() => {
    if (myReady && opponentReady && !starting) {
      startCountdown()
    }
  }, [myReady, opponentReady])

  // Polling ile ready durumunu kontrol et
  useEffect(() => {
    if (!duel || !studentProfile || starting) return

    const checkReadyStatus = async () => {
      try {
        const response = await fetch(`/api/duel/ready?duelId=${duelId}`)
        const data = await response.json()

        if (data) {
          const isChallenger = duel.challenger_id === studentProfile.id
          const myReadyStatus = isChallenger ? data.challengerReady : data.opponentReady
          const opponentReadyStatus = isChallenger ? data.opponentReady : data.challengerReady
          
          if (myReadyStatus) setMyReady(true)
          if (opponentReadyStatus) {
            setOpponentReady(true)
            setOpponentOnline(true)
          }
          
          // Her iki taraf hazırsa geri sayımı başlat
          if (data.bothReady && !starting) {
            console.log('İki taraf da hazır, geri sayım başlıyor!')
            startCountdown()
          }
        }
      } catch (err) {
        console.error('Ready check error:', err)
      }
    }

    // İlk kontrol
    checkReadyStatus()
    
    // Her 1.5 saniyede bir kontrol et
    const interval = setInterval(checkReadyStatus, 1500)
    return () => clearInterval(interval)
  }, [duel, studentProfile, duelId, starting])

  // Geri sayım
  const startCountdown = async () => {
    if (starting) return
    setStarting(true)
    
    // Confetti
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    })

    // 3-2-1 geri sayım
    for (let i = 3; i >= 0; i--) {
      setCountdown(i)
      await new Promise(resolve => setTimeout(resolve, 1000))
    }

    // Düelloyu başlat
    try {
      const response = await fetch('/api/duel/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          duelId,
          studentId: studentProfile?.id
        })
      })

      if (response.ok) {
        router.replace(`/ogrenci/duello/${duelId}/canli`)
      } else {
        const data = await response.json()
        setError(data.error || 'Düello başlatılamadı')
        setStarting(false)
        setCountdown(null)
      }
    } catch (err) {
      setError('Bağlantı hatası')
      setStarting(false)
      setCountdown(null)
    }
  }

  // Oyuncu bilgisi al
  const getPlayerInfo = (isChallenger: boolean) => {
    if (!duel) return null
    const player = isChallenger ? duel.challenger : duel.opponent
    return {
      id: isChallenger ? duel.challenger_id : duel.opponent_id,
      name: player?.profile?.full_name || 'Oyuncu',
      avatar: player?.profile?.avatar_url
    }
  }

  const isChallenger = duel?.challenger_id === studentProfile?.id
  const myInfo = getPlayerInfo(isChallenger)
  const opponentInfo = getPlayerInfo(!isChallenger)

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
        </div>
      </DashboardLayout>
    )
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <p className="text-red-500 mb-4">{error}</p>
          <button 
            onClick={() => router.push('/ogrenci/duello')}
            className="btn btn-primary"
          >
            Düello Lobisine Dön
          </button>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Başlık */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-orange-500 to-red-500 rounded-full mb-4"
          >
            <Swords className="w-10 h-10 text-white" />
          </motion.div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-white">
            Bekleme Odası
          </h1>
          <p className="text-surface-500 mt-2">
            {duel?.subject || 'Karışık'} • {duel?.question_count} Soru
          </p>
        </div>

        {/* Geri Sayım */}
        <AnimatePresence>
          {countdown !== null && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
            >
              <motion.div
                key={countdown}
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 1.5, opacity: 0 }}
                className="text-center"
              >
                {countdown > 0 ? (
                  <span className="text-9xl font-black text-white">
                    {countdown}
                  </span>
                ) : (
                  <div className="space-y-4">
                    <span className="text-6xl font-black text-green-400">
                      BAŞLA!
                    </span>
                    <div className="flex items-center justify-center gap-2 text-white">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Yükleniyor...</span>
                    </div>
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Oyuncu Kartları */}
        <div className="grid grid-cols-2 gap-6 mb-8">
          {/* Ben */}
          <motion.div
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className={`card p-6 text-center border-2 transition-colors ${
              myReady ? 'border-green-500 bg-green-50 dark:bg-green-900/20' : 'border-surface-200 dark:border-surface-700'
            }`}
          >
            <div className="relative inline-block mb-4">
              <div className="w-20 h-20 bg-primary-500 rounded-full flex items-center justify-center text-white text-2xl font-bold overflow-hidden mx-auto">
                {myInfo?.avatar ? (
                  <img src={myInfo.avatar} alt="" className="w-full h-full object-cover" />
                ) : (
                  getInitials(myInfo?.name || '')
                )}
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                <Wifi className="w-3 h-3 text-white" />
              </div>
            </div>
            <h3 className="font-bold text-surface-900 dark:text-white mb-1">
              {myInfo?.name}
            </h3>
            <p className="text-sm text-green-500 mb-4">Çevrimiçi (Sen)</p>
            
            {myReady ? (
              <div className="flex items-center justify-center gap-2 text-green-600">
                <CheckCircle className="w-5 h-5" />
                <span className="font-medium">HAZIR</span>
              </div>
            ) : (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleReady}
                className="btn btn-primary w-full"
              >
                <Zap className="w-4 h-4 mr-2" />
                HAZIRIM
              </motion.button>
            )}
          </motion.div>

          {/* Rakip */}
          <motion.div
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className={`card p-6 text-center border-2 transition-colors ${
              opponentReady ? 'border-green-500 bg-green-50 dark:bg-green-900/20' : 'border-surface-200 dark:border-surface-700'
            }`}
          >
            <div className="relative inline-block mb-4">
              <div className="w-20 h-20 bg-red-500 rounded-full flex items-center justify-center text-white text-2xl font-bold overflow-hidden mx-auto">
                {opponentInfo?.avatar ? (
                  <img src={opponentInfo.avatar} alt="" className="w-full h-full object-cover" />
                ) : (
                  getInitials(opponentInfo?.name || '')
                )}
              </div>
              <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center ${
                opponentOnline ? 'bg-green-500' : 'bg-surface-400'
              }`}>
                {opponentOnline ? (
                  <Wifi className="w-3 h-3 text-white" />
                ) : (
                  <WifiOff className="w-3 h-3 text-white" />
                )}
              </div>
            </div>
            <h3 className="font-bold text-surface-900 dark:text-white mb-1">
              {opponentInfo?.name}
            </h3>
            <p className={`text-sm mb-4 ${opponentOnline ? 'text-green-500' : 'text-surface-400'}`}>
              {opponentOnline ? 'Çevrimiçi' : 'Bekleniyor...'}
            </p>
            
            {opponentReady ? (
              <div className="flex items-center justify-center gap-2 text-green-600">
                <CheckCircle className="w-5 h-5" />
                <span className="font-medium">HAZIR</span>
              </div>
            ) : opponentOnline ? (
              <div className="flex items-center justify-center gap-2 text-amber-500">
                <Clock className="w-5 h-5 animate-pulse" />
                <span className="font-medium">Hazırlanıyor...</span>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2 text-surface-400">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="font-medium">Bekleniyor...</span>
              </div>
            )}
          </motion.div>
        </div>

        {/* VS */}
        <div className="flex justify-center mb-8">
          <motion.div
            animate={{ 
              scale: [1, 1.1, 1],
              rotate: [0, 5, -5, 0]
            }}
            transition={{ 
              duration: 2,
              repeat: Infinity,
              repeatType: 'reverse'
            }}
            className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center text-white font-black text-xl shadow-lg"
          >
            VS
          </motion.div>
        </div>

        {/* Bilgi */}
        <div className="card p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
          <h4 className="font-semibold text-amber-800 dark:text-amber-200 mb-2">
            📋 Düello Kuralları
          </h4>
          <ul className="text-sm text-amber-700 dark:text-amber-300 space-y-1">
            <li>• Her iki taraf da "Hazırım" dediğinde yarışma başlar</li>
            <li>• Her soru için 30 saniye süreniz var</li>
            <li>• Doğru cevap: +2 puan, Yanlış cevap: -1 puan</li>
            <li>• Kazanan 10 bonus puan alır!</li>
          </ul>
        </div>

        {/* Geri Dön */}
        <div className="text-center mt-6">
          <button
            onClick={() => router.push('/ogrenci/duello')}
            className="text-surface-500 hover:text-surface-700 text-sm"
          >
            ← Düello Lobisine Dön
          </button>
        </div>
      </div>
    </DashboardLayout>
  )
}

