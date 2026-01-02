'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { 
  MessageCircle, 
  Send, 
  Loader2, 
  Sparkles, 
  Volume2, 
  VolumeX,
  Zap,
  Crown,
  X,
  BookOpen,
  TrendingUp,
  AlertCircle,
  Play,
  Pause,
  Mic,
  MicOff,
  Phone,
  PhoneOff
} from 'lucide-react'
import TeknoTeacherAvatar from './TeknoTeacherAvatar'
import { useSpeech } from '@/hooks/useSpeech'
import { useVoiceRecognition } from '@/hooks/useVoiceRecognition'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface CreditStatus {
  remaining: number
  is_premium: boolean
  daily_credits: number
  used_today: number
}

type ConversationMode = 'text' | 'voice' | 'listening'

export default function TeknoTeacherChat() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [credits, setCredits] = useState<CreditStatus | null>(null)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [studentName, setStudentName] = useState('')
  const [avatarVolume, setAvatarVolume] = useState(0)
  const [autoSpeak, setAutoSpeak] = useState(true)
  const [conversationMode, setConversationMode] = useState<ConversationMode>('text')
  const [voiceSessionActive, setVoiceSessionActive] = useState(false)
  const [shouldAutoListen, setShouldAutoListen] = useState(false) // Auto-listen flag
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const pendingVoiceInput = useRef<string>('')
  const voiceSessionRef = useRef(false) // Ref for callbacks
  
  // voiceSessionActive'i ref'e sync et (callback'ler için)
  useEffect(() => {
    voiceSessionRef.current = voiceSessionActive
  }, [voiceSessionActive])
  
  // Speech hook (TTS)
  const { 
    isPlaying: isSpeaking, 
    speak, 
    stop: stopSpeaking,
    volume: speechVolume 
  } = useSpeech({
    onVolumeChange: (vol) => setAvatarVolume(vol),
    onEnd: () => {
      setAvatarVolume(0)
      // 🎙️ Ses bitti - Auto-Listen tetikle
      if (voiceSessionRef.current) {
        console.log('🎙️ TTS bitti, mikrofon açılıyor...')
        setShouldAutoListen(true)
      }
    }
  })
  
  // Voice recognition hook (STT)
  const {
    isListening,
    isSupported: voiceSupported,
    transcript,
    interimTranscript,
    startListening,
    stopListening,
    resetTranscript
  } = useVoiceRecognition({
    language: 'tr-TR',
    continuous: true,
    interimResults: true,
    onResult: (text, isFinal) => {
      if (isFinal && text.trim().length > 2) {
        // Final sonuç geldi - mesaj gönder
        console.log('🗣️ Ses algılandı:', text)
        pendingVoiceInput.current = text.trim()
        handleVoiceInput(text.trim())
      }
    },
    onEnd: () => {
      // Sürekli dinleme için otomatik restart
      if (voiceSessionRef.current && !isSpeaking) {
        console.log('👂 Dinleme bitti, tekrar başlatılıyor...')
        setTimeout(() => {
          if (voiceSessionRef.current) {
            startListening()
          }
        }, 200) // Daha kısa bekleme
      }
    }
  })
  
  // 🎙️ AUTO-LISTEN: TTS bitince mikrofonu otomatik aç
  useEffect(() => {
    if (shouldAutoListen && voiceSessionActive && !isSpeaking && !isLoading) {
      console.log('🎙️ Auto-Listen aktif, mikrofon açılıyor...')
      setShouldAutoListen(false)
      setConversationMode('listening')
      
      // Kısa gecikme ile mikrofonu aç (echo önleme)
      setTimeout(() => {
        resetTranscript()
        startListening()
      }, 300)
    }
  }, [shouldAutoListen, voiceSessionActive, isSpeaking, isLoading, startListening, resetTranscript])
  
  // Sesli giriş işle
  const handleVoiceInput = useCallback(async (voiceText: string) => {
    if (!voiceText.trim() || isLoading) return
    
    stopListening()
    setConversationMode('voice')
    
    // Kullanıcı mesajını ekle
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: voiceText,
      timestamp: new Date()
    }
    
    setMessages(prev => [...prev, userMessage])
    resetTranscript()
    
    // AI yanıtı al
    await sendMessageToAI(voiceText, true)
  }, [isLoading, stopListening, resetTranscript])
  
  // Sesli sohbet oturumunu başlat/durdur
  const toggleVoiceSession = useCallback(() => {
    if (voiceSessionActive) {
      // Oturumu kapat
      setVoiceSessionActive(false)
      setConversationMode('text')
      stopListening()
      stopSpeaking()
    } else {
      // Oturumu başlat
      setVoiceSessionActive(true)
      setConversationMode('listening')
      startListening()
      
      // Karşılama mesajı
      if (messages.length === 0) {
        const welcomeMsg = studentName 
          ? `Merhaba ${studentName}! 🎙️ Sesli sohbet moduna geçtik. Sana nasıl yardımcı olabilirim?`
          : `Merhaba! 🎙️ Sesli sohbet moduna geçtik. Ne öğrenmek istersin?`
        
        const welcomeMessage: Message = {
          id: Date.now().toString(),
          role: 'assistant',
          content: welcomeMsg,
          timestamp: new Date()
        }
        setMessages([welcomeMessage])
        
        if (autoSpeak) {
          setConversationMode('voice')
          speak(welcomeMsg)
        }
      }
    }
  }, [voiceSessionActive, startListening, stopListening, stopSpeaking, messages.length, studentName, autoSpeak, speak])
  
  // Kredileri yükle
  useEffect(() => {
    if (isOpen) {
      loadCredits()
    }
  }, [isOpen])
  
  // Otomatik scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])
  
  const loadCredits = async () => {
    try {
      const res = await fetch('/api/tekno-teacher/credits')
      const data = await res.json()
      if (data.success) {
        setCredits(data.credits)
      }
    } catch (error) {
      console.error('Credits load error:', error)
    }
  }
  
  // AI'a mesaj gönder (metin veya sesli)
  const sendMessageToAI = async (message: string, isVoice: boolean = false) => {
    if (!message.trim() || isLoading) return
    
    setIsLoading(true)
    
    try {
      // Konuşma geçmişini oluştur (son 10 mesaj)
      const conversationHistory = messages.slice(-10).map(m => ({
        role: m.role,
        content: m.content
      }))
      
      const res = await fetch('/api/tekno-teacher/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'chat',
          message: message,
          personality: 'friendly',
          conversationHistory // Sokratik akış için geçmiş
        })
      })
      
      const data = await res.json()
      
      if (data.upgrade_required) {
        setShowUpgradeModal(true)
        setVoiceSessionActive(false)
        setConversationMode('text')
        setIsLoading(false)
        return
      }
      
      if (data.success) {
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.response,
          timestamp: new Date()
        }
        
        setMessages(prev => [...prev, assistantMessage])
        setStudentName(data.student_name)
        
        if (data.credits) {
          setCredits(prev => prev ? { ...prev, ...data.credits } : null)
        }
        
        // Sesli yanıt
        if ((autoSpeak || isVoice) && data.response) {
          setConversationMode('voice')
          setTimeout(() => speak(data.response), 300)
        }
      } else {
        throw new Error(data.error)
      }
    } catch (error: any) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Üzgünüm, bir hata oluştu: ${error.message}`,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
      setVoiceSessionActive(false)
      setConversationMode('text')
    } finally {
      setIsLoading(false)
    }
  }
  
  // Metin mesajı gönder
  const sendMessage = async () => {
    if (!input.trim() || isLoading) return
    
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    }
    
    setMessages(prev => [...prev, userMessage])
    const messageText = input
    setInput('')
    
    await sendMessageToAI(messageText, false)
  }
  
  const getDailySummary = async () => {
    if (isLoading) return
    
    setIsLoading(true)
    
    try {
      const res = await fetch('/api/tekno-teacher/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'daily_summary',
          personality: 'motivating'
        })
      })
      
      const data = await res.json()
      
      if (data.upgrade_required) {
        setShowUpgradeModal(true)
        setIsLoading(false)
        return
      }
      
      if (data.success) {
        const summaryMessage: Message = {
          id: Date.now().toString(),
          role: 'assistant',
          content: data.response,
          timestamp: new Date()
        }
        
        setMessages(prev => [...prev, summaryMessage])
        setStudentName(data.student_name)
        
        if (data.credits) {
          setCredits(prev => prev ? { ...prev, ...data.credits } : null)
        }
        
        // Otomatik sesli okuma
        if (autoSpeak && data.response) {
          setTimeout(() => speak(data.response), 300)
        }
      }
    } catch (error: any) {
      console.error('Summary error:', error)
    } finally {
      setIsLoading(false)
    }
  }
  
  // Mesajı sesli oku
  const speakMessage = (text: string) => {
    if (isSpeaking) {
      stopSpeaking()
    } else {
      speak(text)
    }
  }
  
  // Chat kapalıyken floating button
  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-16 h-16 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-full shadow-lg hover:shadow-xl transition-all flex items-center justify-center group z-50"
      >
        <Sparkles className="w-7 h-7 text-white group-hover:scale-110 transition-transform" />
        <span className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full animate-pulse" />
      </button>
    )
  }
  
  return (
    <>
      {/* Chat Window */}
      <div className="fixed bottom-6 right-6 w-96 h-[600px] bg-white dark:bg-gray-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden z-50 border border-gray-200 dark:border-gray-700">
        {/* Header */}
        <div className={`p-4 text-white ${voiceSessionActive 
          ? 'bg-gradient-to-r from-green-600 to-emerald-600' 
          : 'bg-gradient-to-r from-indigo-600 to-purple-600'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Avatar - Lip Sync ile */}
              <div className="relative">
                <TeknoTeacherAvatar 
                  isActive={true}
                  isSpeaking={isSpeaking || isLoading}
                  size="sm"
                  personality="friendly"
                  externalVolume={avatarVolume}
                />
                {/* Durum göstergesi */}
                <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center ${
                  isListening ? 'bg-red-500 animate-pulse' :
                  isSpeaking ? 'bg-green-500 animate-pulse' :
                  'bg-gray-400'
                }`}>
                  {isListening ? <Mic className="w-2.5 h-2.5 text-white" /> :
                   isSpeaking ? <Volume2 className="w-2.5 h-2.5 text-white" /> :
                   null}
                </div>
              </div>
              <div>
                <h3 className="font-bold">TeknoÖğretmen</h3>
                <p className="text-xs text-white/80">
                  {isListening ? '👂 Seni dinliyorum...' :
                   isSpeaking ? '🎙️ Konuşuyor...' :
                   isLoading ? '🤔 Düşünüyor...' :
                   voiceSessionActive ? '📞 Sesli Ders Aktif' :
                   'AI Özel Ders Asistanı'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {/* Sesli sohbet butonu */}
              {voiceSupported && (
                <button 
                  onClick={toggleVoiceSession}
                  className={`p-1.5 rounded-lg transition-all ${
                    voiceSessionActive 
                      ? 'bg-red-500 hover:bg-red-600' 
                      : 'bg-white/20 hover:bg-white/30'
                  }`}
                  title={voiceSessionActive ? 'Sesli dersi bitir' : 'Sesli ders başlat'}
                >
                  {voiceSessionActive ? <PhoneOff className="w-4 h-4" /> : <Phone className="w-4 h-4" />}
                </button>
              )}
              {/* Ses açma/kapama */}
              <button 
                onClick={() => setAutoSpeak(!autoSpeak)}
                className={`p-1.5 rounded-lg transition-colors ${autoSpeak ? 'bg-white/20' : 'bg-white/10'}`}
                title={autoSpeak ? 'Sesli yanıt açık' : 'Sesli yanıt kapalı'}
              >
                {autoSpeak ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </button>
              {/* Kapat */}
              <button 
                onClick={() => {
                  stopSpeaking()
                  stopListening()
                  setVoiceSessionActive(false)
                  setIsOpen(false)
                }}
                className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          {/* Kredi Durumu */}
          {credits && (
            <div className="mt-3 flex items-center gap-2 text-xs">
              {credits.is_premium ? (
                <span className="flex items-center gap-1 bg-yellow-500/30 px-2 py-1 rounded-full">
                  <Crown className="w-3 h-3" />
                  Premium
                </span>
              ) : (
                <span className="flex items-center gap-1 bg-white/20 px-2 py-1 rounded-full">
                  <Zap className="w-3 h-3" />
                  {credits.remaining} kredi kaldı
                </span>
              )}
            </div>
          )}
        </div>
        
        {/* Quick Actions */}
        <div className="p-3 border-b border-gray-100 dark:border-gray-700 flex gap-2">
          <button
            onClick={getDailySummary}
            disabled={isLoading}
            className="flex-1 py-2 px-3 text-xs bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors flex items-center justify-center gap-1"
          >
            <TrendingUp className="w-3 h-3" />
            Günlük Özet
          </button>
          <button
            disabled={isLoading}
            className="flex-1 py-2 px-3 text-xs bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/50 transition-colors flex items-center justify-center gap-1"
          >
            <BookOpen className="w-3 h-3" />
            Konu Anlat
          </button>
        </div>
        
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="text-center text-gray-500 dark:text-gray-400 mt-10">
              <Sparkles className="w-12 h-12 mx-auto mb-3 text-indigo-300" />
              <p className="font-medium">Merhaba! 👋</p>
              <p className="text-sm mt-1">
                Ben TeknoÖğretmen, senin yapay zeka özel ders asistanınım.
              </p>
              <p className="text-sm mt-2">
                Bana istediğin konuyu sorabilirsin!
              </p>
            </div>
          ) : (
            messages.map(msg => (
              <div
                key={msg.id}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] p-3 rounded-2xl ${
                    msg.role === 'user'
                      ? 'bg-indigo-600 text-white rounded-br-md'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-bl-md'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  
                  {/* Asistan mesajları için ses butonu */}
                  {msg.role === 'assistant' && (
                    <button
                      onClick={() => speakMessage(msg.content)}
                      className="mt-2 flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                    >
                      {isSpeaking ? (
                        <>
                          <Pause className="w-3 h-3" />
                          Durdur
                        </>
                      ) : (
                        <>
                          <Volume2 className="w-3 h-3" />
                          Dinle
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-2xl rounded-bl-md">
                <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
        
        {/* Input */}
        <div className="p-3 border-t border-gray-100 dark:border-gray-700">
          {/* Sesli dinleme göstergesi */}
          {isListening && (
            <div className="mb-2 px-3 py-2 bg-red-50 dark:bg-red-900/20 rounded-lg text-sm">
              <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                <span className="font-medium">Dinleniyor...</span>
              </div>
              {(interimTranscript || transcript) && (
                <p className="mt-1 text-gray-600 dark:text-gray-400 italic">
                  "{interimTranscript || transcript}"
                </p>
              )}
            </div>
          )}
          
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendMessage()}
              placeholder={voiceSessionActive ? "Konuşabilir veya yazabilirsin..." : "Bir soru sor..."}
              className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              disabled={isLoading || isListening}
            />
            
            {/* Mikrofon butonu */}
            {voiceSupported && !voiceSessionActive && (
              <button
                onClick={() => {
                  if (isListening) {
                    stopListening()
                  } else {
                    resetTranscript()
                    startListening()
                  }
                }}
                disabled={isLoading || isSpeaking}
                className={`p-2 rounded-xl transition-colors ${
                  isListening 
                    ? 'bg-red-500 text-white hover:bg-red-600' 
                    : 'bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-500'
                } disabled:opacity-50`}
                title={isListening ? 'Dinlemeyi durdur' : 'Sesle konuş'}
              >
                {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>
            )}
            
            {/* Gönder butonu */}
            <button
              onClick={sendMessage}
              disabled={isLoading || !input.trim() || isListening}
              className="p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
          
          {/* Sesli ders aktifken bilgi */}
          {voiceSessionActive && (
            <p className="mt-2 text-xs text-center text-gray-500 dark:text-gray-400">
              🎙️ Sesli ders aktif - Konuş, seni dinliyorum!
            </p>
          )}
        </div>
      </div>
      
      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-sm mx-4 text-center">
            <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <Crown className="w-8 h-8 text-yellow-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Günlük Kredin Bitti!
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Premium üyelikle sınırsız TeknoÖğretmen kullanabilirsin.
            </p>
            <div className="space-y-3">
              <button className="w-full py-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-semibold rounded-xl hover:shadow-lg transition-all">
                Premium'a Geç - 199 TL/ay
              </button>
              <button 
                onClick={() => setShowUpgradeModal(false)}
                className="w-full py-3 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
              >
                Yarın Tekrar Dene
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
