'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useRef } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { useProfile, useTeacherProfile } from '@/hooks/useProfile'
import { createClient } from '@/lib/supabase/client'
import { getInitials } from '@/lib/utils'
import { 
  MessageSquare,
  Send,
  Search,
  Loader2,
  Users
} from 'lucide-react'

export default function CoachMessagesPage() {
  const { profile, loading: profileLoading } = useProfile()
  const { teacherProfile, loading: teacherLoading } = useTeacherProfile(profile?.id || '')
  const [conversations, setConversations] = useState<any[]>([])
  const [selectedStudent, setSelectedStudent] = useState<any>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  useEffect(() => {
    if (teacherProfile?.id) {
      loadConversations()
    }
  }, [teacherProfile?.id])

  useEffect(() => {
    if (selectedStudent?.profile_id && profile?.id) {
      loadMessages()
      
      // Realtime subscription for messages
      const channel = supabase
        .channel('coach-messages')
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
              (newMsg.sender_id === profile.id && newMsg.receiver_id === selectedStudent.profile_id) ||
              (newMsg.sender_id === selectedStudent.profile_id && newMsg.receiver_id === profile.id)
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
  }, [selectedStudent?.profile_id, profile?.id])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function loadConversations() {
    try {
      // 1. Aktif coaching relationships çek
      const { data: relationships, error: relError } = await supabase
        .from('coaching_relationships')
        .select('student_id')
        .eq('coach_id', teacherProfile?.id)
        .eq('status', 'active')

      if (relError || !relationships || relationships.length === 0) {
        console.log('Aktif öğrenci yok')
        setConversations([])
        return
      }

      // 2. Student profiles çek
      const studentIds = relationships.map(r => r.student_id)
      const { data: studentProfiles, error: spError } = await supabase
        .from('student_profiles')
        .select('id, user_id')
        .in('id', studentIds)

      if (spError || !studentProfiles) {
        console.error('Öğrenci profilleri bulunamadı:', spError)
        return
      }

      // 3. Profiles çek
      const userIds = studentProfiles.map(sp => sp.user_id).filter(Boolean)
      const { data: profiles, error: pError } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .in('id', userIds)

      if (pError) {
        console.error('Profiller bulunamadı:', pError)
      }

      // 4. Verileri birleştir
      const students = studentProfiles.map(sp => {
        const profile = profiles?.find(p => p.id === sp.user_id)
        return {
          id: sp.id,
          user_id: sp.user_id,
          profile: profile,
          profile_id: profile?.id,
        }
      }).filter(s => s.profile_id)
      
      setConversations(students)
      if (students.length > 0 && !selectedStudent) {
        setSelectedStudent(students[0])
      }
    } catch (err) {
      console.error('Konuşmalar yüklenemedi:', err)
    }
  }

  async function loadMessages() {
    if (!selectedStudent?.profile_id || !profile?.id) return

    const { data } = await supabase
      .from('messages')
      .select('*')
      .or(`and(sender_id.eq.${profile.id},receiver_id.eq.${selectedStudent.profile_id}),and(sender_id.eq.${selectedStudent.profile_id},receiver_id.eq.${profile.id})`)
      .order('created_at', { ascending: true })

    if (data) {
      setMessages(data)
    }
  }

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault()
    if (!newMessage.trim() || !selectedStudent?.profile_id || sending) return

    setSending(true)
    const messageContent = newMessage.trim()
    setNewMessage('')

    const { error } = await supabase
      .from('messages')
      .insert({
        sender_id: profile?.id,
        receiver_id: selectedStudent.profile_id,
        content: messageContent,
      })

    if (error) {
      setNewMessage(messageContent)
      alert('Mesaj gönderilemedi: ' + error.message)
    }

    setSending(false)
  }

  const loading = profileLoading || teacherLoading

  if (loading) {
    return (
      <DashboardLayout role="koc">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout role="koc">
      <div className="h-[calc(100vh-180px)]">
        <div className="card h-full flex overflow-hidden">
          {/* Conversations List */}
          <div className="w-80 border-r border-surface-100 flex flex-col">
            <div className="p-4 border-b border-surface-100">
              <h2 className="text-lg font-semibold text-surface-900">Mesajlar</h2>
            </div>
            <div className="flex-1 overflow-y-auto">
              {conversations.length > 0 ? conversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => setSelectedStudent(conv)}
                  className={`w-full p-4 flex items-center gap-3 hover:bg-surface-50 transition-colors ${
                    selectedStudent?.id === conv.id ? 'bg-primary-50' : ''
                  }`}
                >
                  <div className="w-10 h-10 bg-gradient-to-br from-accent-400 to-accent-600 rounded-full flex items-center justify-center text-white font-medium overflow-hidden">
                    {conv.profile?.avatar_url ? (
                      <img src={conv.profile.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      getInitials(conv.profile?.full_name)
                    )}
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-medium text-surface-900">{conv.profile?.full_name || 'Öğrenci'}</div>
                    <div className="text-sm text-surface-500">Öğrenci</div>
                  </div>
                </button>
              )) : (
                <div className="p-8 text-center">
                  <Users className="w-12 h-12 mx-auto mb-3 text-surface-300" />
                  <p className="text-surface-500 text-sm">Henüz öğrencin yok</p>
                  <p className="text-surface-400 text-xs mt-1">Öğrenci başvurularını kabul et</p>
                </div>
              )}
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 flex flex-col">
            {selectedStudent ? (
              <>
                {/* Header */}
                <div className="p-4 border-b border-surface-100 flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-accent-400 to-accent-600 rounded-full flex items-center justify-center text-white font-medium overflow-hidden">
                    {selectedStudent.profile?.avatar_url ? (
                      <img src={selectedStudent.profile.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      getInitials(selectedStudent.profile?.full_name)
                    )}
                  </div>
                  <div>
                    <div className="font-medium text-surface-900">{selectedStudent.profile?.full_name || 'Öğrenci'}</div>
                    <div className="text-sm text-surface-500">Öğrenci</div>
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
                        <p className="text-sm text-surface-400">Öğrencinle konuşmaya başla!</p>
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
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <MessageSquare className="w-16 h-16 mx-auto mb-4 text-surface-300" />
                  <p className="text-surface-500">Konuşma başlatmak için bir öğrenci seçin</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
