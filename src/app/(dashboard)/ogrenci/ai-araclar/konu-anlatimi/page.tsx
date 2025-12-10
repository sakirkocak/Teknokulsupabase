'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ArrowLeft, 
  Send, 
  Loader2,
  BookOpen,
  User,
  Bot,
  Sparkles,
  History,
  Trash2
} from 'lucide-react'
import ReactMarkdown from 'react-markdown'

type Message = {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

const SUGGESTED_TOPICS = [
  { subject: 'Matematik', topic: 'Türev nasıl alınır?' },
  { subject: 'Fizik', topic: 'Newton kanunları nelerdir?' },
  { subject: 'Kimya', topic: 'Mol kavramını açıkla' },
  { subject: 'Biyoloji', topic: 'Fotosentez nasıl gerçekleşir?' },
  { subject: 'Türkçe', topic: 'Fiil çekimi nasıl yapılır?' },
  { subject: 'Tarih', topic: 'Kurtuluş Savaşı\'nın önemli savaşları' },
]

export default function TopicExplanationPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = async (topic?: string) => {
    const question = topic || input.trim()
    if (!question || loading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: question,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setLoading(true)

    try {
      const response = await fetch('/api/ai/explain-topic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: question }),
      })

      if (!response.ok) {
        throw new Error('Yanıt alınamadı')
      }

      const data = await response.json()

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.explanation,
        timestamp: new Date()
      }

      setMessages(prev => [...prev, assistantMessage])
    } catch (error: any) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Üzgünüm, bir hata oluştu. Lütfen tekrar dene.',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setLoading(false)
    }
  }

  const handleClear = () => {
    setMessages([])
  }

  return (
    <DashboardLayout role="ogrenci">
      <div className="h-[calc(100vh-120px)] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <Link href="/ogrenci/ai-araclar" className="p-2 hover:bg-surface-100 rounded-xl transition-colors">
              <ArrowLeft className="w-5 h-5 text-surface-600" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-surface-900">Konu Anlatımı</h1>
              <p className="text-surface-500">Anlamadığın konuyu sor, AI açıklasın</p>
            </div>
          </div>
          {messages.length > 0 && (
            <button
              onClick={handleClear}
              className="flex items-center gap-2 text-sm text-surface-500 hover:text-red-500 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Temizle
            </button>
          )}
        </div>

        {/* Chat Area */}
        <div className="flex-1 card overflow-hidden flex flex-col">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-12">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl flex items-center justify-center mb-6">
                  <BookOpen className="w-10 h-10 text-blue-500" />
                </div>
                <h3 className="text-xl font-semibold text-surface-900 mb-2">
                  Merhaba! Ben AI Öğretmenin 👋
                </h3>
                <p className="text-surface-500 mb-8 max-w-md">
                  Anlamadığın herhangi bir konuyu sor, sana detaylı ve anlaşılır şekilde açıklayayım.
                </p>

                {/* Suggested Topics */}
                <div>
                  <p className="text-sm text-surface-400 mb-3">Örnek sorular:</p>
                  <div className="flex flex-wrap justify-center gap-2 max-w-lg">
                    {SUGGESTED_TOPICS.map((item, i) => (
                      <button
                        key={i}
                        onClick={() => handleSend(item.topic)}
                        className="px-3 py-1.5 bg-surface-100 hover:bg-primary-50 hover:text-primary-600 rounded-full text-sm transition-colors"
                      >
                        {item.topic}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <>
                <AnimatePresence>
                  {messages.map((message) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      {message.role === 'assistant' && (
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Bot className="w-5 h-5 text-white" />
                        </div>
                      )}
                      <div className={`max-w-[80%] ${
                        message.role === 'user' 
                          ? 'bg-primary-500 text-white rounded-2xl rounded-br-md px-4 py-2' 
                          : 'bg-surface-100 rounded-2xl rounded-bl-md px-4 py-3'
                      }`}>
                        {message.role === 'assistant' ? (
                          <div className="prose prose-sm max-w-none">
                            <ReactMarkdown>{message.content}</ReactMarkdown>
                          </div>
                        ) : (
                          <p>{message.content}</p>
                        )}
                      </div>
                      {message.role === 'user' && (
                        <div className="w-8 h-8 bg-gradient-to-br from-primary-400 to-primary-600 rounded-lg flex items-center justify-center flex-shrink-0">
                          <User className="w-5 h-5 text-white" />
                        </div>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>

                {loading && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex gap-3"
                  >
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                      <Bot className="w-5 h-5 text-white" />
                    </div>
                    <div className="bg-surface-100 rounded-2xl rounded-bl-md px-4 py-3">
                      <div className="flex items-center gap-2 text-surface-500">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Düşünüyorum...
                      </div>
                    </div>
                  </motion.div>
                )}

                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Input Area */}
          <div className="p-4 border-t border-surface-100">
            <form 
              onSubmit={(e) => { e.preventDefault(); handleSend(); }}
              className="flex gap-3"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Bir konu veya soru yaz..."
                className="input flex-1"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={!input.trim() || loading}
                className="btn btn-primary px-6"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

