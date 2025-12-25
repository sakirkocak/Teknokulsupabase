'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useRef } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { useProfile, useStudentProfile } from '@/hooks/useProfile'
import { createClient } from '@/lib/supabase/client'
import { getInitials } from '@/lib/utils'
import Link from 'next/link'
import { 
  MessageSquare,
  Send,
  Target,
  Loader2
} from 'lucide-react'

export default function StudentMessagesPage() {
  const { profile, loading: profileLoading } = useProfile()
  const { studentProfile, loading: studentLoading } = useStudentProfile(profile?.id || '')
  const [coach, setCoach] = useState<any>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  useEffect(() => {
    if (studentProfile?.id) {
      loadCoach()
    }
  }, [studentProfile?.id])

  useEffect(() => {
    if (coach?.profile_id && profile?.id) {
      loadMessages()
      
      // Realtime subscription for messages
      const channel = supabase
        .channel('student-messages')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
          },
          (payload) => {
            const newMsg = payload.new as any
            // Bu konuşmaya ait mesaj mı kontrol et
            if (
              (newMsg.sender_id === profile.id && newMsg.receiver_id === coach.profile_id) ||
              (newMsg.sender_id === coach.profile_id && newMsg.receiver_id === profile.id)
            ) {
              setMessages(prev => [...prev, newMsg])
            }
          }
        )
        .subscribe()

      return () => {
        supabase.removeChannel(channel)
      }
    }
  }, [coach?.profile_id, profile?.id])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function loadCoach() {
    try {
      // 1. Coaching relationship'i çek
      const { data: relData, error: relError } = await supabase
        .from('coaching_relationships')
        .select('coach_id')
        .eq('student_id', studentProfile?.id)
        .eq('status', 'active')
        .single()

      if (relError || !relData) {
        console.log('Aktif koçluk ilişkisi yok')
        return
      }

      // 2. Teacher profile çek
      const { data: teacherData, error: teacherError } = await supabase
        .from('teacher_profiles')
        .select('id, user_id')
        .eq('id', relData.coach_id)
        .single()

      if (teacherError || !teacherData) {
        console.error('Koç profili bulunamadı:', teacherError)
        return
      }

      // 3. Profile bilgisini çek
      const { data: profileData } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .eq('id', teacherData.user_id)
        .single()

      if (profileData) {
        setCoach({
          id: teacherData.id,
          user_id: teacherData.user_id,
          profile: profileData,
          profile_id: profileData.id,
        })
      }
    } catch (err) {
      console.error('Koç yükleme hatası:', err)
    }
  }

  async function loadMessages() {
    if (!coach?.profile_id || !profile?.id) return

    const { data } = await supabase
      .from('messages')
      .select('*')
      .or(`and(sender_id.eq.${profile.id},receiver_id.eq.${coach.profile_id}),and(sender_id.eq.${coach.profile_id},receiver_id.eq.${profile.id})`)
      .order('created_at', { ascending: true })

    if (data) {
      setMessages(data)
    }
  }

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault()
    if (!newMessage.trim() || !coach?.profile_id || sending) return

    setSending(true)
    const messageContent = newMessage.trim()
    setNewMessage('')

    const { error } = await supabase
      .from('messages')
      .insert({
        sender_id: profile?.id,
        receiver_id: coach.profile_id,
        content: messageContent,
      })

    if (error) {
      setNewMessage(messageContent)
      alert('Mesaj gönderilemedi: ' + error.message)
    }

    setSending(false)
  }

  const loading = profileLoading || studentLoading

  if (loading) {
    return (
      <DashboardLayout role="ogrenci">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" />
        </div>
      </DashboardLayout>
    )
  }

  if (!coach) {
    return (
      <DashboardLayout role="ogrenci">
        <div className="h-[calc(100vh-180px)] flex items-center justify-center">
          <div className="card p-12 text-center max-w-md">
            <Target className="w-16 h-16 mx-auto mb-4 text-surface-300" />
            <h2 className="text-xl font-bold text-surface-900 mb-2">Koçun yok</h2>
            <p className="text-surface-500 mb-6">
              Mesajlaşmak için önce bir koç bulman gerekiyor.
            </p>
            <Link href="/koclar" className="btn btn-primary btn-md">
              Koç Bul
            </Link>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout role="ogrenci">
      <div className="h-[calc(100vh-180px)]">
        <div className="card h-full flex flex-col overflow-hidden">
          {/* Header */}
          <div className="p-4 border-b border-surface-100 flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center text-white font-medium overflow-hidden">
              {coach.profile?.avatar_url ? (
                <img src={coach.profile.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                getInitials(coach.profile?.full_name)
              )}
            </div>
            <div>
              <div className="font-medium text-surface-900">{coach.profile?.full_name || 'Koç'}</div>
              <div className="text-sm text-surface-500">Koçun</div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length > 0 ? messages.map((msg) => {
              const isMine = msg.sender_id === profile?.id
              return (
                <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[70%] p-3 rounded-2xl ${
                    isMine 
                      ? 'bg-primary-500 text-white rounded-br-md' 
                      : 'bg-surface-100 text-surface-900 rounded-bl-md'
                  }`}>
                    <p>{msg.content}</p>
                    <p className={`text-xs mt-1 ${isMine ? 'text-primary-200' : 'text-surface-400'}`}>
                      {new Date(msg.created_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              )
            }) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <MessageSquare className="w-12 h-12 mx-auto mb-3 text-surface-300" />
                  <p className="text-surface-500">Henüz mesaj yok</p>
                  <p className="text-sm text-surface-400">Koçunla konuşmaya başla!</p>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={sendMessage} className="p-4 border-t border-surface-100">
            <div className="flex gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Mesajınızı yazın..."
                className="input flex-1"
                disabled={sending}
              />
              <button 
                type="submit" 
                disabled={sending || !newMessage.trim()}
                className="btn btn-primary btn-md"
              >
                {sending ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  )
}
