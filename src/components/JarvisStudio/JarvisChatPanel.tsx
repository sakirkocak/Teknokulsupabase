'use client'

import { useState, useRef, useEffect } from 'react'
import { Bot, Send, Loader2, Volume2 } from 'lucide-react'
import VoiceControls from './VoiceControls'

interface Message {
  id: string
  role: 'user' | 'jarvis'
  content: string
  timestamp: Date
}

interface JarvisChatPanelProps {
  messages: Message[]
  onSendMessage: (message: string) => void
  isLoading?: boolean
  isSpeaking?: boolean
  studentName?: string
  onVoiceInput?: (text: string) => void
  autoSpeak?: boolean
  onAutoSpeakChange?: (value: boolean) => void
}

export default function JarvisChatPanel({
  messages,
  onSendMessage,
  isLoading = false,
  isSpeaking = false,
  studentName = 'Öğrenci',
  onVoiceInput,
  autoSpeak = true,
  onAutoSpeakChange
}: JarvisChatPanelProps) {
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = () => {
    if (!input.trim() || isLoading) return
    onSendMessage(input.trim())
    setInput('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-cyan-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Bot className="w-8 h-8 text-cyan-400" />
            </div>
            <p className="text-gray-400">Merhaba {studentName}! 👋</p>
            <p className="text-gray-500 text-sm mt-1">Sana nasıl yardımcı olabilirim?</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] p-3 rounded-2xl ${
                  msg.role === 'user'
                    ? 'bg-cyan-600 text-white rounded-br-md'
                    : 'bg-slate-800 text-gray-200 rounded-bl-md border border-cyan-500/20'
                }`}
              >
                {msg.role === 'jarvis' && (
                  <div className="flex items-center gap-2 mb-1.5">
                    <Bot className="w-4 h-4 text-cyan-400" />
                    <span className="text-xs text-cyan-400 font-medium">Jarvis</span>
                    {isSpeaking && (
                      <Volume2 className="w-3 h-3 text-cyan-400 animate-pulse" />
                    )}
                  </div>
                )}
                <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
              </div>
            </div>
          ))
        )}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-slate-800 p-3 rounded-2xl rounded-bl-md border border-cyan-500/20">
              <div className="flex items-center gap-2">
                <Bot className="w-4 h-4 text-cyan-400" />
                <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
                <span className="text-xs text-gray-400">Düşünüyor...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-cyan-500/20">
        <div className="flex items-center gap-2">
          <VoiceControls
            onVoiceInput={onVoiceInput}
            autoSpeak={autoSpeak}
            onAutoSpeakChange={onAutoSpeakChange}
            isSpeaking={isSpeaking}
          />
          
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`${studentName}, Jarvis'e sor...`}
            className="flex-1 px-4 py-3 bg-slate-800 border border-cyan-500/20 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 text-sm"
            disabled={isLoading}
          />
          
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="p-3 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-colors"
          >
            <Send className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>
    </div>
  )
}
