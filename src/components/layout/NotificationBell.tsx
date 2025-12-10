'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Bell,
  X,
  Check,
  Info,
  AlertCircle,
  CheckCircle,
  MessageSquare,
  UserPlus
} from 'lucide-react'

interface Notification {
  id: string
  title: string
  body: string
  type: string
  is_read: boolean
  data?: { link?: string }
  created_at: string
}

export default function NotificationBell({ userId }: { userId: string }) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [hasNewNotification, setHasNewNotification] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  useEffect(() => {
    if (userId) {
      loadNotifications()
      
      // Realtime subscription for new notifications
      const channel = supabase
        .channel('notifications')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${userId}`,
          },
          (payload) => {
            const newNotification = payload.new as Notification
            setNotifications(prev => [newNotification, ...prev])
            setHasNewNotification(true)
            
            // Play notification sound (optional)
            try {
              const audio = new Audio('/notification.mp3')
              audio.volume = 0.3
              audio.play().catch(() => {})
            } catch {}
            
            // Clear animation after 2 seconds
            setTimeout(() => setHasNewNotification(false), 2000)
          }
        )
        .subscribe()

      return () => {
        supabase.removeChannel(channel)
      }
    }
  }, [userId])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  async function loadNotifications() {
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20)

    if (data) {
      setNotifications(data)
    }
    setLoading(false)
  }

  async function markAsRead(notificationId: string) {
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId)

    setNotifications(prev => 
      prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
    )
  }

  async function markAllAsRead() {
    const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id)
    if (unreadIds.length === 0) return

    await supabase
      .from('notifications')
      .update({ is_read: true })
      .in('id', unreadIds)

    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
  }

  const unreadCount = notifications.filter(n => !n.is_read).length

  const typeConfig: Record<string, { icon: any; color: string }> = {
    info: { icon: Info, color: 'text-blue-500 bg-blue-50' },
    success: { icon: CheckCircle, color: 'text-green-500 bg-green-50' },
    warning: { icon: AlertCircle, color: 'text-yellow-500 bg-yellow-50' },
    error: { icon: AlertCircle, color: 'text-red-500 bg-red-50' },
    message: { icon: MessageSquare, color: 'text-primary-500 bg-primary-50' },
    coaching: { icon: UserPlus, color: 'text-accent-500 bg-accent-50' },
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-2 rounded-lg hover:bg-surface-100 transition-colors ${
          hasNewNotification ? 'animate-bounce' : ''
        }`}
      >
        <Bell className={`w-5 h-5 ${hasNewNotification ? 'text-primary-500' : 'text-surface-600'}`} />
        {unreadCount > 0 && (
          <span className={`absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-medium rounded-full flex items-center justify-center ${
            hasNewNotification ? 'animate-pulse' : ''
          }`}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-surface-100 z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 border-b border-surface-100 flex items-center justify-between">
              <h3 className="font-semibold text-surface-900">Bildirimler</h3>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-sm text-primary-500 hover:text-primary-600"
                >
                  Tümünü okundu işaretle
                </button>
              )}
            </div>

            {/* Notifications List */}
            <div className="max-h-96 overflow-y-auto">
              {loading ? (
                <div className="p-8 text-center">
                  <div className="animate-spin w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full mx-auto" />
                </div>
              ) : notifications.length > 0 ? (
                notifications.map((notification) => {
                  const config = typeConfig[notification.type] || typeConfig.info
                  const Icon = config.icon

                  return (
                    <div
                      key={notification.id}
                      className={`p-4 border-b border-surface-50 hover:bg-surface-50 transition-colors ${
                        !notification.is_read ? 'bg-primary-50/50' : ''
                      }`}
                    >
                      <div className="flex gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${config.color}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="font-medium text-surface-900 text-sm">
                              {notification.title}
                            </div>
                            {!notification.is_read && (
                              <button
                                onClick={() => markAsRead(notification.id)}
                                className="p-1 hover:bg-surface-200 rounded"
                              >
                                <Check className="w-3 h-3 text-surface-500" />
                              </button>
                            )}
                          </div>
                          {notification.body && (
                            <p className="text-sm text-surface-500 mt-0.5 line-clamp-2">
                              {notification.body}
                            </p>
                          )}
                          <div className="text-xs text-surface-400 mt-1">
                            {new Date(notification.created_at).toLocaleDateString('tr-TR', {
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                          {notification.data?.link && (
                            <Link
                              href={notification.data.link}
                              onClick={() => {
                                markAsRead(notification.id)
                                setIsOpen(false)
                              }}
                              className="text-sm text-primary-500 hover:text-primary-600 mt-1 inline-block"
                            >
                              Görüntüle →
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })
              ) : (
                <div className="p-8 text-center">
                  <Bell className="w-10 h-10 mx-auto mb-2 text-surface-300" />
                  <p className="text-sm text-surface-500">Bildirim yok</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
