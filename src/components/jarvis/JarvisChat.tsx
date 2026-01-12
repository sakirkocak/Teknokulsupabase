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
  PhoneOff,
  LogIn,
  Bot
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import JarvisAvatar from './JarvisAvatar'
import dynamic from 'next/dynamic'
import { useSpeech } from '@/hooks/useSpeech'

// MathRenderer'ı dinamik import - hata durumunda fallback
const MathRenderer = dynamic(() => import('@/components/MathRenderer'), {
  ssr: false,
  loading: () => <span>...</span>
})
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

export default function JarvisChat() {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [credits, setCredits] = useState<CreditStatus | null>(null)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [studentName, setStudentName] = useState('')
  const [avatarVolume, setAvatarVolume] = useState(0)
  const [autoSpeak, setAutoSpeak] = useState(true)
  const [conversationMode, setConversationMode] = useState<ConversationMode>('text')
  const [voiceSessionActive, setVoiceSessionActive] = useState(false)
  const [shouldAutoListen, setShouldAutoListen] = useState(false)
  const [showTopicModal, setShowTopicModal] = useState(false)
  const [topicInput, setTopicInput] = useState('')
  const [isExplaining, setIsExplaining] = useState(false)
  const [explanationAudio, setExplanationAudio] = useState<HTMLAudioElement | null>(null)
  const [isSummaryLoading, setIsSummaryLoading] = useState(false)
  const [summaryStatus, setSummaryStatus] = useState('')
  
  // Mutex: Sadece özel modlar aktifken engellenir
  const isSpecialModeActive = isExplaining || isSummaryLoading
  
  // Emoji temizleme (TTS için)
  const cleanTextForTTS = (text: string): string => {
    return text
      .replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, '')
      .replace(/[\u2600-\u27BF]/g, '')
      .replace(/[\uFE00-\uFE0F]/g, '')
      .replace(/[\u200D]/g, '')
      .replace(/[✨🚀💪📚🎯✅❌🔥⭐💡🎉👋🤔💬📝🎙🔊📊📈👂🤖]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
  }
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const pendingVoiceInput = useRef<string>('')
  const voiceSessionRef = useRef(false)
  
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
        console.log('🗣️ Ses algılandı (final):', text)
        pendingVoiceInput.current = text.trim()
        handleVoiceInput(text.trim())
      } else if (!isFinal && text.trim().length > 3) {
        console.log('⏳ Interim kayıt:', text)
        pendingVoiceInput.current = text.trim()
      }
    },
    onError: (error) => {
      if (error === 'no-speech' && pendingVoiceInput.current.length > 3) {
        console.log('🔇 no-speech ama interim var, gönderiliyor:', pendingVoiceInput.current)
        const textToSend = pendingVoiceInput.current
        pendingVoiceInput.current = ''
        handleVoiceInput(textToSend)
      }
    }
  })
  
  // AUTO-LISTEN: TTS bitince mikrofonu otomatik aç
  useEffect(() => {
    if (shouldAutoListen && voiceSessionActive && !isSpeaking && !isLoading) {
      console.log('🎙️ Auto-Listen aktif, mikrofon açılıyor...')
      setShouldAutoListen(false)
      setConversationMode('listening')
      
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
    
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: voiceText,
      timestamp: new Date()
    }
    
    setMessages(prev => [...prev, userMessage])
    resetTranscript()
    
    await sendMessageToAI(voiceText, true)
  }, [isLoading, stopListening, resetTranscript])
  
  // Sesli sohbet oturumunu başlat/durdur
  const toggleVoiceSession = useCallback(() => {
    if (voiceSessionActive) {
      setVoiceSessionActive(false)
      setConversationMode('text')
      stopListening()
      stopSpeaking()
    } else {
      setVoiceSessionActive(true)
      setConversationMode('listening')
      startListening()
      
      if (messages.length === 0) {
        const welcomeMsg = studentName 
          ? `Merhaba ${studentName}! 🤖 Sesli sohbet moduna geçtik. Sana nasıl yardımcı olabilirim?`
          : `Merhaba! 🤖 Sesli sohbet moduna geçtik. Ne öğrenmek istersin?`
        
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
      const res = await fetch('/api/jarvis/credits')
      const data = await res.json()
      
      if (res.status === 401) {
        setIsAuthenticated(false)
        setCredits(null)
        return
      }
      
      if (data.success) {
        setIsAuthenticated(true)
        setCredits(data.credits)
      }
    } catch (error) {
      console.error('Credits load error:', error)
      setIsAuthenticated(false)
    }
  }
  
  // =====================================================
  // ElevenLabs TTS ile seslendir (Jarvis API)
  // =====================================================
  const speakWithElevenLabs = async (text: string) => {
    if (!text.trim()) return false
    
    const cleanText = cleanTextForTTS(text)
      .replace(/\$[^$]+\$/g, '')
      .replace(/\\\[[\s\S]*?\\\]/g, '')
    if (!cleanText) return false
    
    try {
      const ttsResponse = await fetch('/api/jarvis/speak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: cleanText, voice: 'rachel' })
      })
      
      if (ttsResponse.ok) {
        const ttsData = await ttsResponse.json()
        if (ttsData.audio) {
          const binaryString = atob(ttsData.audio)
          const bytes = new Uint8Array(binaryString.length)
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i)
          }
          const blob = new Blob([bytes], { type: 'audio/mpeg' })
          const audioUrl = URL.createObjectURL(blob)
          
          const audio = new Audio(audioUrl)
          setExplanationAudio(audio)
          
          if (isListening) {
            console.log('🔇 Ses başlıyor, mikrofon kapatılıyor...')
            stopListening()
          }
          
          audio.onended = () => {
            console.log('🔊 Ses bitti')
            setAvatarVolume(0)
            setExplanationAudio(null)
            setSummaryStatus('')
            URL.revokeObjectURL(audioUrl)
            
            if (voiceSessionRef.current) {
              console.log('🎤 Ses bitti, mikrofon açılıyor...')
              setTimeout(() => {
                if (voiceSessionRef.current) {
                  resetTranscript()
                  startListening()
                  setConversationMode('listening')
                }
              }, 500)
            }
          }
          
          const volumeInterval = setInterval(() => {
            if (!audio.paused) {
              setAvatarVolume(0.4 + Math.random() * 0.4)
            } else {
              clearInterval(volumeInterval)
              setAvatarVolume(0)
            }
          }, 100)
          
          setSummaryStatus('🔊 Okunuyor...')
          await audio.play()
          return true
        }
      }
    } catch (err) {
      console.warn('ElevenLabs TTS hatası:', err)
    }
    
    // Fallback: Browser TTS
    speak(text)
    return false
  }

  // AI'a mesaj gönder
  const sendMessageToAI = async (message: string, isVoice: boolean = false) => {
    if (!message.trim() || isLoading) return
    
    setIsLoading(true)
    
    try {
      const conversationHistory = messages.slice(-10).map(m => ({
        role: m.role,
        content: m.content
      }))
      
      const res = await fetch('/api/jarvis/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: message,
          conversationHistory
        })
      })
      
      const data = await res.json()
      const aiResponse = String(data.response || data.text || '')

      if (res.status === 401 || data.requireAuth) {
        router.push('/kayit')
        return
      }

      if (data.upgrade_required) {
        setShowUpgradeModal(true)
        setVoiceSessionActive(false)
        setConversationMode('text')
        setIsLoading(false)
        return
      }
      
      if (data.success && aiResponse) {
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: aiResponse,
          timestamp: new Date()
        }
        
        setMessages(prev => [...prev, assistantMessage])
        setStudentName(data.student_name)
        
        if (data.credits) {
          setCredits(prev => prev ? { ...prev, ...data.credits } : null)
        }
        
        if ((autoSpeak || isVoice) && aiResponse) {
          setConversationMode('voice')
          await speakWithElevenLabs(aiResponse)
        }
      } else {
        throw new Error(data.error || 'AI yanıtı alınamadı')
      }
    } catch (error: any) {
      if (error.message?.includes('Giriş') || error.message?.includes('401')) {
        router.push('/kayit')
        return
      }
      
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
  
  // =====================================================
  // KONU ANLAT - Gemini + ElevenLabs TTS
  // =====================================================
  const [explanationStatus, setExplanationStatus] = useState<string>('')
  
  const explainTopic = async () => {
    if (!topicInput.trim() || isExplaining) return
    
    setIsExplaining(true)
    setShowTopicModal(false)
    setExplanationStatus('🤔 Konu hazırlanıyor...')
    
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: `📚 Konu: ${topicInput}`,
      timestamp: new Date()
    }
    setMessages(prev => [...prev, userMessage])
    
    try {
      setExplanationStatus('📝 AI içerik oluşturuyor...')
      
      const response = await fetch('/api/jarvis/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `[KONU ANLATIMI MODU] "${topicInput}" konusunu detaylı, anlaşılır ve örneklerle anlat. Samimi ve öğretici bir dille, adım adım açıkla. Matematiksel formülleri LaTeX formatında yaz. 4-5 paragraf olsun.`,
          studentName: studentName || 'Öğrenci',
          grade: 8
        })
      })

      const data = await response.json()
      
      if (response.status === 401 || data.requireAuth) {
        router.push('/kayit')
        return
      }

      if (!response.ok) throw new Error('API hatası')

      const explanation = data.text || 'Üzgünüm, şu an bu konuyu anlatamıyorum.'
      
      setExplanationStatus('✅ İçerik hazır!')
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: explanation,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, assistantMessage])
      
      setExplanationStatus('🎙️ Ses oluşturuluyor...')
      
      try {
        const cleanExplanation = cleanTextForTTS(explanation)
          .replace(/\$[^$]+\$/g, '')
          .replace(/\\\[[\s\S]*?\\\]/g, '')
        
        const ttsResponse = await fetch('/api/jarvis/speak', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: cleanExplanation, voice: 'rachel' })
        })
        
        if (ttsResponse.ok) {
          const ttsData = await ttsResponse.json()
          if (ttsData.audio) {
            const binaryString = atob(ttsData.audio)
            const bytes = new Uint8Array(binaryString.length)
            for (let i = 0; i < binaryString.length; i++) {
              bytes[i] = binaryString.charCodeAt(i)
            }
            const blob = new Blob([bytes], { type: 'audio/mpeg' })
            const audioUrl = URL.createObjectURL(blob)
            
            const audio = new Audio(audioUrl)
            setExplanationAudio(audio)
            
            audio.onended = () => {
              setAvatarVolume(0)
              setExplanationAudio(null)
              setExplanationStatus('')
              URL.revokeObjectURL(audioUrl)
            }
            
            const volumeInterval = setInterval(() => {
              if (!audio.paused) {
                setAvatarVolume(0.4 + Math.random() * 0.4)
              } else {
                clearInterval(volumeInterval)
                setAvatarVolume(0)
              }
            }, 100)
            
            setExplanationStatus('🔊 Anlatılıyor...')
            await audio.play()
          }
        } else {
          setExplanationStatus('🔊 Anlatılıyor...')
          speak(explanation)
        }
      } catch (ttsErr) {
        console.warn('TTS hatası, browser TTS kullanılıyor:', ttsErr)
        setExplanationStatus('🔊 Anlatılıyor...')
        speak(explanation)
      }
      
    } catch (err: any) {
      console.error('Konu anlatım hatası:', err)
      setExplanationStatus('')
      
      if (err.message?.includes('Giriş') || err.message?.includes('401')) {
        router.push('/kayit')
        return
      }
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `${studentName || 'Öğrenci'}, üzgünüm şu an bir teknik sorun var. Birazdan tekrar dene!`,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsExplaining(false)
      setTopicInput('')
    }
  }
  
  // Konu anlatımını durdur
  const stopExplanation = () => {
    if (explanationAudio) {
      explanationAudio.pause()
      setExplanationAudio(null)
    }
    stopSpeaking()
    setAvatarVolume(0)
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
  
  // =====================================================
  // GÜNLÜK ÖZET
  // =====================================================
  const getDailySummary = async () => {
    if (isLoading || isSpecialModeActive) return

    setIsSummaryLoading(true)
    setSummaryStatus('🤔 Özet hazırlanıyor...')

    try {
      setSummaryStatus('📊 Veriler analiz ediliyor...')
      
      const res = await fetch('/api/jarvis/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `[GÜNLÜK ÖZET MODU] Bana bugün için motivasyon veren, kısa bir günlük özet ve çalışma tavsiyesi ver. Enerjik ve motive edici ol. Maksimum 3-4 cümle.`,
          studentName: studentName || 'Öğrenci',
          grade: 8
        })
      })

      const data = await res.json()

      if (res.status === 401 || data.requireAuth) {
        router.push('/kayit')
        return
      }

      if (data.success && data.text) {
        setSummaryStatus('✅ Özet hazır!')
        
        const summaryMessage: Message = {
          id: Date.now().toString(),
          role: 'assistant',
          content: data.text,
          timestamp: new Date()
        }

        setMessages(prev => [...prev, summaryMessage])

        if (autoSpeak && data.text) {
          setSummaryStatus('🎙️ Ses oluşturuluyor...')
          await speakWithElevenLabs(data.text)
        }
      } else {
        throw new Error(data.error || 'Özet alınamadı')
      }
    } catch (error: any) {
      console.error('Summary error:', error)
      setSummaryStatus('')
      
      if (error.message?.includes('Giriş') || error.message?.includes('401')) {
        router.push('/kayit')
        return
      }
      
      const errorMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: 'Günlük özet hazırlanırken bir sorun oluştu. Tekrar dene!',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsSummaryLoading(false)
      setTimeout(() => setSummaryStatus(''), 1000)
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
        aria-label="Jarvis sohbetini aç"
        className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-cyan-600 to-blue-600 rounded-full shadow-lg hover:shadow-xl hover:shadow-cyan-500/30 transition-all flex items-center justify-center group z-40"
      >
        <Bot className="w-6 h-6 sm:w-7 sm:h-7 text-white group-hover:scale-110 transition-transform" aria-hidden="true" />
        <span className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 bg-green-500 rounded-full animate-pulse" aria-hidden="true" />
      </button>
    )
  }
  
  return (
    <>
      {/* Chat Window - Mobilde tam genişlik */}
      <div className="fixed bottom-0 right-0 sm:bottom-6 sm:right-6 w-full sm:w-96 h-[85vh] sm:h-[600px] bg-white dark:bg-gray-800 sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden z-50 border-t sm:border border-gray-200 dark:border-gray-700">
        {/* Header - Jarvis Theme */}
        <div className={`p-4 text-white ${voiceSessionActive 
          ? 'bg-gradient-to-r from-green-600 to-emerald-600' 
          : 'bg-gradient-to-r from-cyan-600 to-blue-600'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Avatar - Lip Sync ile */}
              <div className="relative">
                <JarvisAvatar 
                  isActive={true}
                  isSpeaking={isSpeaking || isLoading}
                  size="sm"
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
                <h3 className="font-bold">Jarvis</h3>
                <p className="text-xs text-white/80">
                  {isExplaining ? '📚 Konu anlatılıyor...' :
                   explanationAudio ? '🔊 Sesli anlatım...' :
                   isListening ? '👂 Seni dinliyorum...' :
                   isSpeaking ? '🎙️ Konuşuyor...' :
                   isLoading ? '🤔 Düşünüyor...' :
                   voiceSessionActive ? '📞 Sesli Ders Aktif' :
                   'AI Özel Ders Asistanı'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {/* Konu anlatımı durdur */}
              {explanationAudio && (
                <button 
                  onClick={stopExplanation}
                  className="p-1.5 bg-red-500 hover:bg-red-600 rounded-lg transition-all animate-pulse"
                  title="Anlatımı durdur"
                >
                  <Pause className="w-4 h-4" />
                </button>
              )}
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
            disabled={isLoading || isSpecialModeActive}
            className="flex-1 py-2 px-3 text-xs bg-cyan-50 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400 rounded-lg hover:bg-cyan-100 dark:hover:bg-cyan-900/50 transition-colors flex items-center justify-center gap-1 disabled:opacity-50"
          >
            <TrendingUp className="w-3 h-3" />
            {isSummaryLoading ? 'Yükleniyor...' : 'Günlük Özet'}
          </button>
          <button
            onClick={() => setShowTopicModal(true)}
            disabled={isLoading || isSpecialModeActive}
            className="flex-1 py-2 px-3 text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors flex items-center justify-center gap-1 disabled:opacity-50"
          >
            <BookOpen className="w-3 h-3" />
            {isExplaining ? 'Anlatıyor...' : 'Konu Anlat'}
          </button>
        </div>
        
        {/* Jarvis Studio Link */}
        <Link
          href="/jarvis/studio"
          className="mx-3 mb-2 py-2.5 px-4 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-cyan-500/30 transition-all group"
        >
          <Sparkles className="w-4 h-4 group-hover:rotate-12 transition-transform" />
          <span>Jarvis Studio - Tam Deneyim</span>
          <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded-full">3D • Sesli • İnteraktif</span>
        </Link>
        
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="text-center text-gray-500 dark:text-gray-400 mt-10">
              <Bot className="w-12 h-12 mx-auto mb-3 text-cyan-400" />
              <p className="font-medium">Merhaba! 👋</p>
              <p className="text-sm mt-1">
                Ben Jarvis, senin yapay zeka özel ders asistanınım.
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
                      ? 'bg-cyan-600 text-white rounded-br-md'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-bl-md'
                  }`}
                >
                  {msg.content ? (
                    <MathRenderer content={msg.content} className="text-sm whitespace-pre-wrap" />
                  ) : (
                    <span className="text-sm">...</span>
                  )}
                  
                  {msg.role === 'assistant' && (
                    <button
                      onClick={() => speakMessage(msg.content)}
                      className="mt-2 flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors"
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
                <Loader2 className="w-5 h-5 animate-spin text-cyan-600" />
              </div>
            </div>
          )}
          
          {/* Konu Anlatım Status */}
          {explanationStatus && (
            <div className="flex justify-start">
              <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-2xl rounded-bl-md flex items-center gap-2">
                {explanationStatus.includes('Anlatılıyor') ? (
                  <Volume2 className="w-4 h-4 text-blue-600 animate-pulse" />
                ) : (
                  <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                )}
                <span className="text-sm text-blue-700 dark:text-blue-300">{explanationStatus}</span>
              </div>
            </div>
          )}
          
          {/* Günlük Özet Status */}
          {summaryStatus && (
            <div className="flex justify-start">
              <div className="bg-cyan-100 dark:bg-cyan-900/30 p-3 rounded-2xl rounded-bl-md flex items-center gap-2">
                {summaryStatus.includes('Okunuyor') ? (
                  <Volume2 className="w-4 h-4 text-cyan-600 animate-pulse" />
                ) : (
                  <Loader2 className="w-4 h-4 animate-spin text-cyan-600" />
                )}
                <span className="text-sm text-cyan-700 dark:text-cyan-300">{summaryStatus}</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
        
        {/* Input */}
        <div className="p-3 border-t border-gray-100 dark:border-gray-700">
          {/* Sesli dinleme göstergesi */}
          {isListening && (
            <div className="mb-2 px-3 py-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-sm">
              <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="font-medium">🎤 Seni dinliyorum...</span>
              </div>
              {(interimTranscript || transcript) ? (
                <p className="mt-1 text-green-700 dark:text-green-300 font-medium">
                  "{interimTranscript || transcript}"
                </p>
              ) : (
                <p className="mt-1 text-green-600/70 dark:text-green-400/70 italic">
                  (konuşmaya başla!)
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
              className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
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
                disabled={isLoading || isSpeaking || explanationAudio !== null}
                className={`p-2 rounded-xl transition-all ${
                  isListening 
                    ? 'bg-green-500 text-white hover:bg-green-600 animate-pulse shadow-lg shadow-green-500/50' 
                    : 'bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-500'
                } disabled:opacity-50`}
                title={isListening ? 'Dinlemeyi durdur' : 'Sesle konuş'}
              >
                {isListening ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
              </button>
            )}
            
            {/* Gönder butonu */}
            <button
              onClick={sendMessage}
              disabled={isLoading || !input.trim() || isListening}
              className="p-2 bg-cyan-600 text-white rounded-xl hover:bg-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
          
          {voiceSessionActive && (
            <p className="mt-2 text-xs text-center text-gray-500 dark:text-gray-400">
              🤖 Sesli ders aktif - Konuş, seni dinliyorum!
            </p>
          )}
        </div>
      </div>
      
      {/* Konu Anlat Modal */}
      {showTopicModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-sm mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-blue-600" />
                Konu Anlat
              </h3>
              <button 
                onClick={() => setShowTopicModal(false)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Hangi konuyu öğrenmek istiyorsun? Jarvis sesli olarak anlatacak.
            </p>
            
            <input
              type="text"
              value={topicInput}
              onChange={(e) => setTopicInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && explainTopic()}
              placeholder="Örn: Pisagor teoremi, Fotosentez..."
              className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
              autoFocus
            />
            
            <div className="grid grid-cols-2 gap-2 mb-4">
              <button
                onClick={() => setTopicInput('Denklem çözümü')}
                className="px-3 py-2 text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100"
              >
                📐 Denklem
              </button>
              <button
                onClick={() => setTopicInput('Fotosentez')}
                className="px-3 py-2 text-xs bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-lg hover:bg-green-100"
              >
                🌱 Fotosentez
              </button>
              <button
                onClick={() => setTopicInput('Osmanlı kuruluşu')}
                className="px-3 py-2 text-xs bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-lg hover:bg-amber-100"
              >
                🏰 Osmanlı
              </button>
              <button
                onClick={() => setTopicInput('Paragraf analizi')}
                className="px-3 py-2 text-xs bg-cyan-50 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400 rounded-lg hover:bg-cyan-100"
              >
                📖 Paragraf
              </button>
            </div>
            
            <button
              onClick={explainTopic}
              disabled={!topicInput.trim() || isExplaining}
              className="w-full py-3 bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-cyan-500/30 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isExplaining ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Hazırlanıyor...
                </>
              ) : (
                <>
                  <Volume2 className="w-4 h-4" />
                  Sesli Anlat
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Login Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-sm mx-4 text-center">
            <div className="w-16 h-16 bg-cyan-100 dark:bg-cyan-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <LogIn className="w-8 h-8 text-cyan-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Giriş Yapman Gerekiyor
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Jarvis'i kullanmak için önce giriş yap veya ücretsiz kayıt ol.
            </p>
            <div className="space-y-3">
              <Link 
                href="/giris"
                className="block w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-semibold rounded-xl hover:shadow-lg transition-all text-center"
              >
                Giriş Yap
              </Link>
              <Link 
                href="/kayit"
                className="block w-full py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-all text-center"
              >
                Ücretsiz Kayıt Ol
              </Link>
              <button 
                onClick={() => setShowLoginModal(false)}
                className="w-full py-3 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}

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
              Premium üyelikle sınırsız Jarvis kullanabilirsin.
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
