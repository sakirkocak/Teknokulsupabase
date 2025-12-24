'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Bot, User, Loader2, MessageSquare, X, Minimize2, Maximize2 } from 'lucide-react'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  created_at: string
}

interface AICoachChatProps {
  initialMessages?: Message[]
  isExpanded?: boolean
  onToggleExpand?: () => void
}

export default function AICoachChat({ initialMessages = [], isExpanded = true, onToggleExpand }: AICoachChatProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage = input.trim()
    setInput('')
    
    // Kullanıcı mesajını ekle
    const tempUserMessage: Message = {
      id: `temp-user-${Date.now()}`,
      role: 'user',
      content: userMessage,
      created_at: new Date().toISOString()
    }
    setMessages(prev => [...prev, tempUserMessage])
    setIsLoading(true)

    try {
      const response = await fetch('/api/ai-coach/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage })
      })

      const data = await response.json()

      if (data.error) {
        throw new Error(data.error)
      }

      // AI yanıtını ekle
      const aiMessage: Message = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: data.response,
        created_at: new Date().toISOString()
      }
      setMessages(prev => [...prev, aiMessage])

    } catch (error) {
      console.error('Chat error:', error)
      // Hata mesajı ekle
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: 'Üzgünüm, bir hata oluştu. Lütfen tekrar dene.',
        created_at: new Date().toISOString()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
      inputRef.current?.focus()
    }
  }

  const quickMessages = [
    'Bugün ne çalışmalıyım?',
    'Zayıf derslerim hangileri?',
    'Nasıl daha iyi olabilirim?',
    'Motivasyon ver!'
  ]

  const handleQuickMessage = (msg: string) => {
    setInput(msg)
    inputRef.current?.focus()
  }

  if (!isExpanded) {
    return (
      <button
        onClick={onToggleExpand}
        className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-primary-500 to-accent-500 rounded-full shadow-lg flex items-center justify-center text-white hover:scale-105 transition-transform z-50"
      >
        <MessageSquare className="w-6 h-6" />
      </button>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-surface-100 shadow-sm flex flex-col h-[500px]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-surface-100 bg-gradient-to-r from-primary-50 to-accent-50 rounded-t-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-r from-primary-500 to-accent-500 rounded-full flex items-center justify-center">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-surface-900">AI Koç Tekno</h3>
            <p className="text-xs text-surface-500">Her zaman yardıma hazır</p>
          </div>
        </div>
        {onToggleExpand && (
          <button
            onClick={onToggleExpand}
            className="p-2 hover:bg-white/50 rounded-lg transition-colors"
          >
            <Minimize2 className="w-5 h-5 text-surface-500" />
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-primary-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Bot className="w-8 h-8 text-primary-500" />
            </div>
            <h4 className="font-medium text-surface-900 mb-2">Merhaba! Ben AI Koç Tekno 👋</h4>
            <p className="text-surface-600 text-sm mb-4">
              Çalışma planın, zayıf yönlerin veya herhangi bir konuda yardımcı olabilirim.
            </p>
            
            {/* Hızlı mesajlar */}
            <div className="flex flex-wrap gap-2 justify-center">
              {quickMessages.map((msg, idx) => (
                <button
                  key={idx}
                  onClick={() => handleQuickMessage(msg)}
                  className="px-3 py-1.5 bg-surface-100 hover:bg-primary-50 text-surface-700 hover:text-primary-600 rounded-full text-sm transition-colors"
                >
                  {msg}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map(message => (
          <div
            key={message.id}
            className={`flex items-start gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
              message.role === 'user' 
                ? 'bg-primary-100 text-primary-600' 
                : 'bg-gradient-to-r from-primary-500 to-accent-500 text-white'
            }`}>
              {message.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>
            <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
              message.role === 'user'
                ? 'bg-primary-500 text-white rounded-br-md'
                : 'bg-surface-100 text-surface-800 rounded-bl-md'
            }`}>
              <p className="text-sm whitespace-pre-line">{message.content}</p>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-primary-500 to-accent-500 flex items-center justify-center">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="bg-surface-100 rounded-2xl rounded-bl-md px-4 py-3">
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-primary-500" />
                <span className="text-sm text-surface-600">Düşünüyorum...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Hızlı mesajlar (mesaj varken) */}
      {messages.length > 0 && (
        <div className="px-4 pb-2 flex gap-2 overflow-x-auto">
          {quickMessages.slice(0, 2).map((msg, idx) => (
            <button
              key={idx}
              onClick={() => handleQuickMessage(msg)}
              className="px-3 py-1 bg-surface-50 hover:bg-primary-50 text-surface-600 hover:text-primary-600 rounded-full text-xs whitespace-nowrap transition-colors"
            >
              {msg}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-surface-100">
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Mesajını yaz..."
            disabled={isLoading}
            className="flex-1 px-4 py-2.5 bg-surface-50 border border-surface-200 rounded-full text-sm focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="w-10 h-10 bg-gradient-to-r from-primary-500 to-accent-500 rounded-full flex items-center justify-center text-white hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  )
}

