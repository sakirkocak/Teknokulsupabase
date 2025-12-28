'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { createClient } from '@/lib/supabase/client'
import { useProfile, useStudentProfile } from '@/hooks/useProfile'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Users, Swords, LogOut, 
  Loader2, WifiOff, Zap
} from 'lucide-react'
import PlayerCard from '@/components/lobby/PlayerCard'
import DuelRequestPopup from '@/components/lobby/DuelRequestPopup'
import type { RealtimeChannel } from '@supabase/supabase-js'

// Sınıf renkleri
const GRADE_COLORS: Record<number, string> = {
  1: '#87CEEB', 2: '#90EE90', 3: '#FFA500', 4: '#BA55D3',
  5: '#FF69B4', 6: '#40E0D0', 7: '#1E90FF', 8: '#FF4500',
  9: '#FFD700', 10: '#C0C0C0', 11: '#CD7F32', 12: '#E5E4E2',
}

interface LobbyPlayer {
  student_id: string
  fullName: string
  avatarUrl?: string | null
  grade: number
  total_points: number
  preferred_subject?: string | null
  status: string
}

interface DuelRequest {
  challengerId: string
  challengerName: string
  challengerAvatar?: string | null
  challengerGrade: number
  challengerPoints: number
  subject?: string | null
  questionCount: number
  expiresAt: number
}

const subjects = [
  { key: 'all', label: 'Karışık', color: 'from-purple-500 to-indigo-500' },
  // Ana Dersler (LGS)
  { key: 'Matematik', label: 'Matematik', color: 'from-blue-500 to-indigo-500' },
  { key: 'Türkçe', label: 'Türkçe', color: 'from-red-500 to-rose-500' },
  { key: 'Fen Bilimleri', label: 'Fen Bilimleri', color: 'from-green-500 to-emerald-500' },
  { key: 'T.C. İnkılap Tarihi ve Atatürkçülük', label: 'İnkılap Tarihi', color: 'from-orange-500 to-amber-500' },
  { key: 'İngilizce', label: 'İngilizce', color: 'from-violet-500 to-purple-500' },
  { key: 'Din Kültürü ve Ahlak Bilgisi', label: 'Din Kültürü', color: 'from-emerald-500 to-teal-500' },
  // Ortaokul Dersleri
  { key: 'Sosyal Bilgiler', label: 'Sosyal Bilgiler', color: 'from-amber-500 to-yellow-500' },
  // Lise Dersleri
  { key: 'Fizik', label: 'Fizik', color: 'from-cyan-500 to-blue-500' },
  { key: 'Kimya', label: 'Kimya', color: 'from-pink-500 to-rose-500' },
  { key: 'Biyoloji', label: 'Biyoloji', color: 'from-lime-500 to-green-500' },
  { key: 'Tarih', label: 'Tarih', color: 'from-yellow-500 to-orange-500' },
  { key: 'Coğrafya', label: 'Coğrafya', color: 'from-teal-500 to-cyan-500' },
  { key: 'Türk Dili ve Edebiyatı', label: 'Edebiyat', color: 'from-indigo-500 to-violet-500' },
  { key: 'Felsefe', label: 'Felsefe', color: 'from-fuchsia-500 to-pink-500' },
  { key: 'Teknoloji ve Tasarım', label: 'Teknoloji Tasarım', color: 'from-slate-500 to-zinc-500' },
]

export default function DuelLobbyPage() {
  const router = useRouter()
  const supabase = createClient()
  
  const { profile } = useProfile()
  const { studentProfile } = useStudentProfile(profile?.id || '')
  
  const [players, setPlayers] = useState<LobbyPlayer[]>([])
  const [loading, setLoading] = useState(true)
  const [joining, setJoining] = useState(true)
  const [sendingRequest, setSendingRequest] = useState<string | null>(null)
  const [incomingRequest, setIncomingRequest] = useState<DuelRequest | null>(null)
  const [myStatus, setMyStatus] = useState<'available' | 'busy'>('available')
  const [myTotalPoints, setMyTotalPoints] = useState(0)
  
  // Ders seçimi
  const [selectedSubject, setSelectedSubject] = useState<string>('all')
  
  const channelRef = useRef<RealtimeChannel | null>(null)
  const heartbeatRef = useRef<NodeJS.Timeout | null>(null)

  // Öğrenci puanını çek
  useEffect(() => {
    if (!studentProfile?.id) return
    
    const fetchPoints = async () => {
      const { data } = await supabase
        .from('student_points')
        .select('total_points')
        .eq('student_id', studentProfile.id)
        .single()
      
      if (data) {
        setMyTotalPoints(data.total_points || 0)
      }
    }
    
    fetchPoints()
  }, [studentProfile?.id, supabase])

  // Lobiye katıl
  useEffect(() => {
    if (!studentProfile?.id) return
    
    const joinLobby = async () => {
      setJoining(true)
      
      try {
        // API ile lobiye katıl
        const res = await fetch('/api/lobby/join', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            studentId: studentProfile.id,
            grade: studentProfile.grade || 8,
            totalPoints: myTotalPoints,
            preferredSubject: selectedSubject === 'all' ? null : selectedSubject
          })
        })
        
        if (!res.ok) {
          console.error('Lobby join failed')
        }
      } catch (err) {
        console.error('Lobby join error:', err)
      }
      
      setJoining(false)
    }
    
    joinLobby()
    
    // Cleanup: sayfa kapanınca lobiden çık
    return () => {
      if (studentProfile?.id) {
        fetch('/api/lobby/leave', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ studentId: studentProfile.id })
        }).catch(() => {})
      }
    }
  }, [studentProfile?.id, studentProfile?.grade, myTotalPoints])

  // Realtime kanal - SINIF BAZLI SHARDING (10K+ kullanıcı desteği)
  useEffect(() => {
    if (!studentProfile?.id || !profile?.full_name) return

    const myGrade = studentProfile.grade || 8
    // Sınıf bazlı kanal - her sınıf kendi lobisinde (max ~2K kişi/kanal)
    const channelName = `duel_lobby_grade_${myGrade}`
    
    const channel = supabase.channel(channelName, {
      config: {
        presence: {
          key: studentProfile.id
        }
      }
    })

    // Presence sync - online oyuncuları güncelle
    channel.on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState()
      const presencePlayers: LobbyPlayer[] = []
      
      Object.entries(state).forEach(([id, presences]) => {
        const presence = presences[0] as any
        if (id !== studentProfile.id && presence) {
          presencePlayers.push({
            student_id: id,
            fullName: presence.name || 'Oyuncu',
            avatarUrl: presence.avatar,
            grade: presence.grade || 8,
            total_points: presence.points || 0,
            preferred_subject: presence.subject,
            status: presence.status || 'available'
          })
        }
      })
      
      setPlayers(presencePlayers)
      setLoading(false)
    })

    // Presence join
    channel.on('presence', { event: 'join' }, ({ newPresences }) => {
      console.log('Player joined:', newPresences)
    })

    // Presence leave
    channel.on('presence', { event: 'leave' }, ({ leftPresences }) => {
      console.log('Player left:', leftPresences)
    })

    // Düello isteği al
    channel.on('broadcast', { event: 'duel_request' }, ({ payload }) => {
      if (payload.toId === studentProfile.id && myStatus === 'available') {
        console.log('Düello isteği geldi:', payload)
        setIncomingRequest({
          challengerId: payload.fromId,
          challengerName: payload.fromName,
          challengerAvatar: payload.fromAvatar,
          challengerGrade: payload.fromGrade,
          challengerPoints: payload.fromPoints,
          subject: payload.subject,
          questionCount: payload.questionCount || 5,
          expiresAt: payload.expiresAt
        })
        setMyStatus('busy')
      }
    })

    // Düello cevabı al
    channel.on('broadcast', { event: 'duel_response' }, ({ payload }) => {
      if (payload.toId === studentProfile.id) {
        setSendingRequest(null)
        setMyStatus('available')
        
        if (payload.accepted && payload.duelId) {
          // Bekleme odasına git
          router.push(`/ogrenci/duello/${payload.duelId}/bekle`)
        } else {
          // Reddedildi bildirimi
          alert(payload.message || 'İsteğiniz reddedildi')
        }
      }
    })

    // Subscribe ve track
    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await channel.track({
          name: profile.full_name,
          avatar: profile.avatar_url,
          grade: studentProfile.grade || 8,
          points: myTotalPoints,
          subject: selectedSubject === 'all' ? null : selectedSubject,
          status: 'available'
        })
      }
    })

    channelRef.current = channel

    // Heartbeat - her 30 saniyede last_seen güncelle
    heartbeatRef.current = setInterval(async () => {
      await fetch('/api/lobby/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: studentProfile.id,
          grade: studentProfile.grade || 8,
          totalPoints: myTotalPoints,
          preferredSubject: selectedSubject === 'all' ? null : selectedSubject
        })
      }).catch(() => {})
    }, 30000)

    return () => {
      channel.unsubscribe()
      if (heartbeatRef.current) {
        clearInterval(heartbeatRef.current)
      }
    }
  }, [studentProfile?.id, profile?.full_name, profile?.avatar_url, selectedSubject, myStatus])

  // Düello isteği gönder
  const sendDuelRequest = async (targetId: string) => {
    if (!studentProfile?.id || !profile?.full_name || !channelRef.current) return
    
    setSendingRequest(targetId)
    setMyStatus('busy')
    
    const targetPlayer = players.find(p => p.student_id === targetId)
    if (!targetPlayer) return

    // API'ye bildir
    await fetch('/api/lobby/request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        challengerId: studentProfile.id,
        opponentId: targetId,
        subject: selectedSubject === 'all' ? null : selectedSubject
      })
    })

    // Broadcast gönder
    await channelRef.current.send({
      type: 'broadcast',
      event: 'duel_request',
      payload: {
        fromId: studentProfile.id,
        fromName: profile.full_name,
        fromAvatar: profile.avatar_url,
        fromGrade: studentProfile.grade,
        fromPoints: myTotalPoints,
        toId: targetId,
        subject: selectedSubject === 'all' ? null : selectedSubject,
        questionCount: 5,
        expiresAt: Date.now() + 30000
      }
    })

    // 30 saniye sonra timeout
    setTimeout(() => {
      if (sendingRequest === targetId) {
        setSendingRequest(null)
        setMyStatus('available')
        
        // API'ye iptal bildir
        fetch(`/api/lobby/request?challengerId=${studentProfile.id}&opponentId=${targetId}`, {
          method: 'DELETE'
        }).catch(() => {})
      }
    }, 30000)
  }

  // İsteği kabul et
  const acceptRequest = async () => {
    if (!incomingRequest || !studentProfile?.id) return
    
    try {
      const res = await fetch('/api/lobby/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          challengerId: incomingRequest.challengerId,
          opponentId: studentProfile.id,
          accepted: true,
          subject: incomingRequest.subject
        })
      })
      
      const data = await res.json()
      
      if (data.duelId) {
        // Rakibe bildir
        channelRef.current?.send({
          type: 'broadcast',
          event: 'duel_response',
          payload: {
            fromId: studentProfile.id,
            toId: incomingRequest.challengerId,
            accepted: true,
            duelId: data.duelId
          }
        })
        
        // Bekleme odasına git
        router.push(`/ogrenci/duello/${data.duelId}/bekle`)
      }
    } catch (err) {
      console.error('Accept error:', err)
    }
    
    setIncomingRequest(null)
  }

  // İsteği reddet
  const rejectRequest = async () => {
    if (!incomingRequest || !studentProfile?.id) return
    
    try {
      await fetch('/api/lobby/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          challengerId: incomingRequest.challengerId,
          opponentId: studentProfile.id,
          accepted: false
        })
      })
      
      // Rakibe bildir
      channelRef.current?.send({
        type: 'broadcast',
        event: 'duel_response',
        payload: {
          fromId: studentProfile.id,
          toId: incomingRequest.challengerId,
          accepted: false,
          message: 'İsteğiniz reddedildi'
        }
      })
    } catch (err) {
      console.error('Reject error:', err)
    }
    
    setIncomingRequest(null)
    setMyStatus('available')
  }

  // Timeout
  const handleTimeout = async () => {
    if (!incomingRequest || !studentProfile?.id) return
    
    await fetch('/api/lobby/respond', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        challengerId: incomingRequest.challengerId,
        opponentId: studentProfile.id,
        accepted: false
      })
    })
    
    channelRef.current?.send({
      type: 'broadcast',
      event: 'duel_response',
      payload: {
        fromId: studentProfile.id,
        toId: incomingRequest.challengerId,
        accepted: false,
        message: 'Süre doldu'
      }
    })
    
    setIncomingRequest(null)
    setMyStatus('available')
  }

  // Lobiden çık
  const leaveLobby = async () => {
    if (studentProfile?.id) {
      await fetch('/api/lobby/leave', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId: studentProfile.id })
      })
    }
    router.push('/ogrenci/duello')
  }

  // Oyuncular (sınıf zaten kanal bazlı filtreleniyor)
  const filteredPlayers = players

  const gradeColor = GRADE_COLORS[studentProfile?.grade || 8] || '#1E90FF'

  if (joining) {
    return (
      <DashboardLayout role="ogrenci">
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          >
            <Swords className="w-12 h-12 text-primary-500" />
          </motion.div>
          <p className="text-surface-500">Lobiye katılınıyor...</p>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout role="ogrenci">
      {/* Gelen istek popup */}
      {incomingRequest && (
        <DuelRequestPopup
          request={incomingRequest}
          onAccept={acceptRequest}
          onReject={rejectRequest}
          onTimeout={handleTimeout}
        />
      )}

      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-surface-900 dark:text-white flex items-center gap-3">
              <div 
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: `${gradeColor}20` }}
              >
                <Users className="w-5 h-5" style={{ color: gradeColor }} />
              </div>
              Düello Lobisi
            </h1>
            <p className="text-surface-500 mt-1">
              {studentProfile?.grade}. Sınıf Lobisi • {players.length} oyuncu çevrimiçi
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={leaveLobby}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-300 hover:bg-surface-200 dark:hover:bg-surface-700 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Çık
            </motion.button>
          </div>
        </div>

        {/* Ders Seçimi */}
        <div className="card p-4">
          <h3 className="font-medium text-surface-900 dark:text-white mb-3 flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-500" />
            Düello Dersi
          </h3>
          <div className="flex flex-wrap gap-2">
            {subjects.map((subject) => (
              <button
                key={subject.key}
                onClick={() => setSelectedSubject(subject.key)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  selectedSubject === subject.key
                    ? `bg-gradient-to-r ${subject.color} text-white shadow-md`
                    : 'bg-surface-100 dark:bg-surface-700 text-surface-600 dark:text-surface-300 hover:bg-surface-200'
                }`}
              >
                {subject.label}
              </button>
            ))}
          </div>
        </div>

        {/* İstek gönderildi bildirimi */}
        <AnimatePresence>
          {sendingRequest && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="card p-4 bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-500"
            >
              <div className="flex items-center gap-3">
                <Loader2 className="w-5 h-5 animate-spin text-amber-500" />
                <span className="text-amber-800 dark:text-amber-200">
                  Düello isteği gönderildi, cevap bekleniyor...
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Oyuncu Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
          </div>
        ) : filteredPlayers.length === 0 ? (
          <div className="card p-12 text-center">
            <WifiOff className="w-16 h-16 text-surface-300 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-surface-900 dark:text-white mb-2">
              Şu an lobide kimse yok
            </h2>
            <p className="text-surface-500 mb-4">
              Biraz bekleyin veya arkadaşlarınızı davet edin!
            </p>
            <button
              onClick={() => router.push('/ogrenci/duello')}
              className="btn btn-primary"
            >
              Arkadaşa Davet Gönder
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            <AnimatePresence>
              {filteredPlayers.map((player) => (
                <PlayerCard
                  key={player.student_id}
                  player={player}
                  onChallenge={sendDuelRequest}
                  isLoading={sendingRequest === player.student_id}
                  disabled={myStatus === 'busy' || sendingRequest !== null}
                />
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Bilgi */}
        <div className="card p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
          <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
            💡 Nasıl Çalışır?
          </h4>
          <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
            <li>• <strong>{studentProfile?.grade}. sınıf</strong> arkadaşlarını görüyorsun, istediğine düello isteği gönder</li>
            <li>• Rakip 30 saniye içinde kabul veya reddedebilir</li>
            <li>• Kabul edilirse bekleme odasına yönlendirilirsin</li>
            <li>• Her iki taraf "Hazırım" dediğinde düello başlar!</li>
          </ul>
        </div>
      </div>
    </DashboardLayout>
  )
}
