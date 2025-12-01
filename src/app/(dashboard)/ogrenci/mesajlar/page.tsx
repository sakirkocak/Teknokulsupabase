'use client'

import { useState, useEffect, useRef } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { useProfile, useStudentProfile } from '@/hooks/useProfile'
import { createClient } from '@/lib/supabase/client'
import { getInitials } from '@/lib/utils'
import Link from 'next/link'
import { 
  MessageSquare,
  Send,
  Target
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
    if (coach) {
      loadMessages()
    }
  }, [coach])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function loadCoach() {
    const { data } = await supabase
      .from('coaching_relationships')
      .select(`
        coach:teacher_profiles!coaching_relationships_coach_id_fkey(
          id,
          user_id,
          profile:profiles!teacher_profiles_user_id_fkey(id, full_name, avatar_url)
        )
      `)
      .eq('student_id', studentProfile?.id)
      .eq('status', 'active')
      .single()

    if (data?.coach) {
      setCoach({
        ...data.coach,
        profile_id: data.coach.profile?.id,
      })
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
    if (!newMessage.trim() || !coach?.profile_id) return

    setSending(true)

    const { error } = await supabase
      .from('messages')
      .insert({
        sender_id: profile?.id,
        receiver_id: coach.profile_id,
        content: newMessage.trim(),
      })

    if (!error) {
      setNewMessage('')
      loadMessages()
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
              <div className="font-medium text-surface-900">{coach.profile?.full_name}</div>
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
              />
              <button 
                type="submit" 
                disabled={sending || !newMessage.trim()}
                className="btn btn-primary btn-md"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  )
}

