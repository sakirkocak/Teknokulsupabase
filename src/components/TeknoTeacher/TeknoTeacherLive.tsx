'use client'

/**
 * TeknoÖğretmen Live Mode
 * OpenAI GPT-4o-mini + TTS-1-HD
 * 
 * Özellikler:
 * - GPT-4o-mini ile akıllı sohbet
 * - TTS-1-HD ile yüksek kaliteli ses (Nova)
 * - Browser Speech Recognition ile dinleme
 * - %100 çalışan REST API
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { 
  Mic, 
  MicOff, 
  Phone, 
  PhoneOff,
  Volume2,
  VolumeX,
  Loader2,
  X,
  Sparkles,
  Zap,
  Crown,
  Radio,
  Wifi,
  Send
} from 'lucide-react'
import TeknoTeacherAvatar from './TeknoTeacherAvatar'
import { useOpenAIChat, ChatStatus } from '@/hooks/useOpenAIChat'
import { useVoiceRecognition } from '@/hooks/useVoiceRecognition'

// OpenAI ses karakterleri
const VOICE_OPTIONS = [
  { id: 'nova' as const, name: '👩‍🏫 Nova', description: 'Samimi kadın sesi - Önerilen' },
  { id: 'onyx' as const, name: '👨‍🏫 Onyx', description: 'Derin erkek sesi' },
  { id: 'alloy' as const, name: '🎭 Alloy', description: 'Nötr ses' },
  { id: 'echo' as const, name: '🎵 Echo', description: 'Yumuşak erkek sesi' },
  { id: 'fable' as const, name: '📖 Fable', description: 'Anlatıcı ses' },
  { id: 'shimmer' as const, name: '✨ Shimmer', description: 'Parlak kadın sesi' }
]

interface TeknoTeacherLiveProps {
  studentName: string
  grade: number
  onClose?: () => void
  onCreditsUpdate?: (credits: { remaining: number, is_premium: boolean }) => void
}

export default function TeknoTeacherLive({
  studentName,
  grade,
  onClose,
  onCreditsUpdate
}: TeknoTeacherLiveProps) {
  const [displayMessages, setDisplayMessages] = useState<{ text: string, isUser: boolean }[]>([])
  const [selectedVoice, setSelectedVoice] = useState(VOICE_OPTIONS[0])
  const [localError, setLocalError] = useState<string | null>(null)
  const [sessionActive, setSessionActive] = useState(false)
  const [textInput, setTextInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  // OpenAI Chat Hook
  const {
    status,
    isReady,
    isListening,
    isSpeaking,
    volume,
    messages,
    connect: openaiConnect,
    disconnect: openaiDisconnect,
    sendMessage,
    interrupt,
    error: openaiError
  } = useOpenAIChat({
    studentName,
    grade,
    voice: selectedVoice.id,
    onTranscript: (text, isUser) => {
      if (text.trim()) {
        setDisplayMessages(prev => [...prev, { text: text.trim(), isUser }])
      }
    },
    onStatusChange: (newStatus) => {
      console.log('🔴 OpenAI status:', newStatus)
      // Konuşma bittiyse otomatik dinlemeye başla
      if (newStatus === 'listening' && sessionActive) {
        console.log('🎤 [UI] Otomatik dinleme başlatılıyor...')
        setTimeout(() => startListening(), 300)
      }
    },
    onError: (err) => {
      console.error('❌ OpenAI error:', err)
      setLocalError(err.message)
    }
  })
  
  // STT Hook (mikrofon dinleme)
  const {
    isListening: micListening,
    transcript,
    interimTranscript,
    startListening,
    stopListening,
    resetTranscript
  } = useVoiceRecognition({
    language: 'tr-TR',
    continuous: true,
    onResult: async (text, isFinal) => {
      if (isFinal && text.trim().length > 2 && sessionActive && status === 'listening') {
        console.log('🗣️ [UI] Kullanıcı konuştu:', text.trim())
        stopListening()
        resetTranscript()
        await sendMessage(text.trim())
      }
    }
  })
  
  // Oturumu başlat
  const connect = async () => {
    console.log('🚀 [UI] OpenAI oturumu başlatılıyor...')
    setLocalError(null)
    setDisplayMessages([])
    setSessionActive(true)
    
    try {
      await openaiConnect()
    } catch (err: any) {
      console.error('❌ [UI] Bağlantı hatası:', err.message)
      setLocalError(err.message)
      setSessionActive(false)
    }
  }
  
  // Oturumu bitir
  const disconnect = () => {
    console.log('🛑 [UI] Oturum sonlandırılıyor...')
    setSessionActive(false)
    stopListening()
    openaiDisconnect()
    setDisplayMessages([])
    setLocalError(null)
  }
  
  // Metin gönder (input'tan)
  const handleSendText = async () => {
    if (!textInput.trim() || !sessionActive) return
    
    const msg = textInput.trim()
    setTextInput('')
    stopListening()
    await sendMessage(msg)
  }
  
  // Enter tuşu
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendText()
    }
  }
  
  // Yeniden bağlan
  const reconnect = async () => {
    setLocalError(null)
    await connect()
  }
  
  // Hata durumu
  const error = localError || openaiError?.message
  
  // Otomatik scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [displayMessages])
  
  // Status renkleri
  const statusColors: Record<ChatStatus, string> = {
    idle: 'bg-gray-500',
    connecting: 'bg-yellow-500 animate-pulse',
    analyzing: 'bg-indigo-500 animate-pulse',
    ready: 'bg-green-500',
    listening: 'bg-green-500 animate-pulse',
    processing: 'bg-blue-500 animate-pulse',
    speaking: 'bg-purple-500',
    error: 'bg-red-500'
  }
  
  // Status metinleri
  const statusTexts: Record<ChatStatus, string> = {
    idle: 'Beklemede',
    connecting: 'Bağlanıyor...',
    analyzing: '📊 Veriler analiz ediliyor...',
    ready: '✓ Hazır',
    listening: '🎤 Seni dinliyorum...',
    processing: '🤔 Düşünüyor...',
    speaking: '🔊 Konuşuyorum...',
    error: '❌ Hata'
  }
  
  return (
    <div className="fixed bottom-6 right-6 w-[420px] h-[650px] bg-gradient-to-b from-gray-900 to-gray-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden z-50 border border-green-500/30">
      {/* Header */}
      <div className="p-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white relative overflow-hidden">
        {/* Animasyonlu arka plan */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1),transparent_50%)] animate-pulse" />
        </div>
        
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Avatar */}
            <div className="relative">
              <TeknoTeacherAvatar 
                isActive={isReady}
                isSpeaking={isSpeaking}
                size="md"
                personality="friendly"
                externalVolume={volume}
              />
              {/* Live göstergesi */}
              <div className={`absolute -top-1 -right-1 w-4 h-4 rounded-full ${statusColors[status]} flex items-center justify-center`}>
                {status === 'listening' && <Mic className="w-2 h-2 text-white" />}
                {status === 'speaking' && <Volume2 className="w-2 h-2 text-white" />}
              </div>
            </div>
            
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold">TeknoÖğretmen</h3>
                <span className="px-2 py-0.5 bg-emerald-500 text-[10px] font-bold rounded-full flex items-center gap-1">
                  <Sparkles className="w-2 h-2" />
                  OpenAI
                </span>
              </div>
              <p className="text-xs text-white/80">{statusTexts[status]}</p>
            </div>
          </div>
          
          <button 
            onClick={() => {
              disconnect()
              onClose?.()
            }}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Volume bar */}
        {isSpeaking && (
          <div className="mt-3 h-1 bg-white/20 rounded-full overflow-hidden">
            <div 
              className="h-full bg-white transition-all duration-75"
              style={{ width: `${volume * 100}%` }}
            />
          </div>
        )}
      </div>
      
      {/* Bağlantı durumu - başlangıç ekranı */}
      {(status === 'idle' || status === 'connecting' || status === 'error') && !sessionActive && (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <div className="w-32 h-32 mb-6 relative">
            <TeknoTeacherAvatar 
              isActive={false}
              isSpeaking={false}
              size="lg"
              personality="friendly"
            />
            {status === 'connecting' && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="w-16 h-16 text-green-500 animate-spin" />
              </div>
            )}
          </div>
          
          <h2 className="text-2xl font-bold text-white mb-2">
            Sesli Ders Başlat
          </h2>
          <p className="text-gray-400 mb-6">
            OpenAI GPT-4o + TTS-HD ile konuş
          </p>
          
          {error && (
            <div className="mb-4 p-4 bg-red-500/20 border border-red-500/50 rounded-lg">
              <p className="text-red-300 text-sm mb-3">{error}</p>
              <button
                onClick={reconnect}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg transition-all flex items-center gap-2 mx-auto"
              >
                <Wifi className="w-4 h-4" />
                Yeniden Dene
              </button>
            </div>
          )}
          
          {/* Ses karakteri seçimi */}
          <div className="mb-6 w-full">
            <p className="text-sm text-gray-400 mb-2">Öğretmen Sesi:</p>
            <div className="grid grid-cols-3 gap-2">
              {VOICE_OPTIONS.slice(0, 6).map((v) => (
                <button
                  key={v.id}
                  onClick={() => setSelectedVoice(v)}
                  className={`p-2 rounded-lg text-xs transition-all ${
                    selectedVoice.id === v.id 
                      ? 'bg-green-600 text-white' 
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {v.name.split(' ')[0]}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-1">{selectedVoice.description}</p>
          </div>
          
          <button
            onClick={connect}
            disabled={status === 'connecting'}
            className="px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold rounded-2xl hover:shadow-lg hover:shadow-green-500/50 transition-all disabled:opacity-50 flex items-center gap-3"
          >
            {status === 'connecting' ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Bağlanıyor...
              </>
            ) : (
              <>
                <Phone className="w-5 h-5" />
                Dersi Başlat
              </>
            )}
          </button>
          
          {/* Bilgi */}
          <div className="mt-6 p-3 bg-gray-800/50 rounded-lg text-xs text-gray-400 text-left">
            <p className="flex items-center gap-2 mb-1">
              <Sparkles className="w-3 h-3 text-green-500" />
              <span>OpenAI Powered</span>
            </p>
            <p>• GPT-4o-mini zeka</p>
            <p>• TTS-1-HD ses kalitesi</p>
            <p>• {selectedVoice.name}</p>
          </div>
        </div>
      )}
      
      {/* Aktif sohbet */}
      {sessionActive && (
        <>
          {/* Mesajlar */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {displayMessages.length === 0 ? (
              <div className="text-center text-gray-400 mt-10">
                <Sparkles className="w-10 h-10 mx-auto mb-3 text-green-400 animate-pulse" />
                <p>Bağlanıyor...</p>
              </div>
            ) : (
              displayMessages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.isUser ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] p-3 rounded-2xl ${
                      msg.isUser
                        ? 'bg-green-600 text-white rounded-br-md'
                        : 'bg-gray-700 text-white rounded-bl-md'
                    }`}
                  >
                    <p className="text-sm">{msg.text}</p>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
          
          {/* Input ve kontroller */}
          <div className="p-4 bg-gray-800/50 border-t border-gray-700">
            {/* Dalga animasyonu */}
            {micListening && (
              <div className="flex items-center justify-center gap-1 mb-3">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className="w-1 bg-green-500 rounded-full animate-pulse"
                    style={{
                      height: `${20 + Math.random() * 20}px`,
                      animationDelay: `${i * 0.1}s`
                    }}
                  />
                ))}
              </div>
            )}
            
            {/* Metin input */}
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Mesajını yaz..."
                disabled={status === 'processing' || status === 'speaking'}
                className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-xl placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
              />
              <button
                onClick={handleSendText}
                disabled={!textInput.trim() || status === 'processing' || status === 'speaking'}
                className="p-2 bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex items-center justify-center gap-4">
              {/* Kesme butonu */}
              {isSpeaking && (
                <button
                  onClick={interrupt}
                  className="p-3 bg-orange-500 text-white rounded-full hover:bg-orange-600 transition-colors"
                  title="Konuşmayı kes"
                >
                  <VolumeX className="w-6 h-6" />
                </button>
              )}
              
              {/* Mikrofon butonu */}
              <button
                onClick={() => micListening ? stopListening() : startListening()}
                disabled={status === 'processing' || status === 'speaking'}
                className={`p-3 rounded-full transition-colors ${
                  micListening 
                    ? 'bg-green-500 text-white animate-pulse' 
                    : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                } disabled:opacity-50`}
                title={micListening ? 'Mikrofonu kapat' : 'Mikrofonu aç'}
              >
                {micListening ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
              </button>
              
              {/* Bitir butonu */}
              <button
                onClick={disconnect}
                className="p-4 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-lg shadow-red-500/30"
                title="Dersi bitir"
              >
                <PhoneOff className="w-8 h-8" />
              </button>
            </div>
            
            <p className="text-center text-xs text-gray-500 mt-3">
              {micListening ? '🎤 Konuş, seni duyuyorum!' : 
               isSpeaking ? '🔊 Öğretmenini dinle...' :
               status === 'processing' ? '🤔 Düşünüyorum...' :
               '💬 Yaz veya konuş'}
            </p>
          </div>
        </>
      )}
    </div>
  )
}
