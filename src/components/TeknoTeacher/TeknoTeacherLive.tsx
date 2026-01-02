'use client'

/**
 * TeknoÖğretmen Live Mode
 * Gemini 2.5 Flash Live API ile gerçek zamanlı sesli sohbet
 * 
 * Özellikler:
 * - Native audio streaming (düşük gecikme)
 * - VAD (konuşma algılama)
 * - Interruption (kesme)
 * - Bidirectional audio
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
  WifiOff
} from 'lucide-react'
import TeknoTeacherAvatar from './TeknoTeacherAvatar'
import { useGeminiLive, GeminiLiveStatus } from '@/hooks/useGeminiLive'

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
  const [messages, setMessages] = useState<{ text: string, isUser: boolean }[]>([])
  const [personality, setPersonality] = useState<'friendly' | 'strict' | 'motivating'>('friendly')
  const [voice, setVoice] = useState('Kore')
  const [apiKey, setApiKey] = useState<string | null>(null)
  const [tokenLoading, setTokenLoading] = useState(false)
  const [tokenError, setTokenError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  // API key al
  const fetchApiKey = async () => {
    setTokenLoading(true)
    setTokenError(null)
    
    try {
      const res = await fetch('/api/tekno-teacher/live/token')
      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.error || 'Token alınamadı')
      }
      
      setApiKey(data.apiKey)
      onCreditsUpdate?.(data.credits)
      return data.apiKey
    } catch (err: any) {
      setTokenError(err.message)
      return null
    } finally {
      setTokenLoading(false)
    }
  }
  
  // Gemini Live hook
  const {
    status,
    isConnected,
    isListening,
    isSpeaking,
    volume,
    connect: geminiConnect,
    disconnect,
    interrupt,
    error
  } = useGeminiLive({
    apiKey: apiKey || '',
    studentName,
    grade,
    personality,
    voice,
    onTranscript: (text, isUser) => {
      setMessages(prev => [...prev, { text, isUser }])
    },
    onStatusChange: (newStatus) => {
      console.log('🔴 Gemini Live status:', newStatus)
    },
    onError: (err) => {
      console.error('❌ Gemini Live error:', err)
    }
  })
  
  // Bağlan (önce token al)
  const connect = async () => {
    let key = apiKey
    if (!key) {
      key = await fetchApiKey()
    }
    if (key) {
      geminiConnect()
    }
  }
  
  // Otomatik scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])
  
  // Status renkleri
  const statusColors: Record<GeminiLiveStatus, string> = {
    idle: 'bg-gray-500',
    connecting: 'bg-yellow-500 animate-pulse',
    connected: 'bg-blue-500',
    listening: 'bg-green-500 animate-pulse',
    speaking: 'bg-purple-500',
    error: 'bg-red-500',
    disconnected: 'bg-gray-500'
  }
  
  // Status metinleri
  const statusTexts: Record<GeminiLiveStatus, string> = {
    idle: 'Beklemede',
    connecting: 'Bağlanıyor...',
    connected: '✓ Bağlandı',
    listening: '🎤 Seni dinliyorum...',
    speaking: '🔊 Konuşuyorum...',
    error: '❌ Hata',
    disconnected: 'Bağlantı kesildi'
  }
  
  return (
    <div className="fixed bottom-6 right-6 w-[420px] h-[650px] bg-gradient-to-b from-gray-900 to-gray-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden z-50 border border-purple-500/30">
      {/* Header */}
      <div className="p-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white relative overflow-hidden">
        {/* Animasyonlu arka plan */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1),transparent_50%)] animate-pulse" />
        </div>
        
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Avatar */}
            <div className="relative">
              <TeknoTeacherAvatar 
                isActive={isConnected}
                isSpeaking={isSpeaking}
                size="md"
                personality={personality}
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
                <span className="px-2 py-0.5 bg-red-500 text-[10px] font-bold rounded-full flex items-center gap-1">
                  <Radio className="w-2 h-2" />
                  LIVE
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
      
      {/* Bağlantı durumu */}
      {!isConnected && (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <div className="w-32 h-32 mb-6 relative">
            <TeknoTeacherAvatar 
              isActive={false}
              isSpeaking={false}
              size="lg"
              personality={personality}
            />
            {status === 'connecting' && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="w-16 h-16 text-purple-500 animate-spin" />
              </div>
            )}
          </div>
          
          <h2 className="text-2xl font-bold text-white mb-2">
            Sesli Ders Başlat
          </h2>
          <p className="text-gray-400 mb-6">
            Gerçek zamanlı, düşük gecikmeli AI öğretmeninle konuş
          </p>
          
          {(error || tokenError) && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-300 text-sm">
              {error?.message || tokenError}
            </div>
          )}
          
          {/* Kişilik seçimi */}
          <div className="flex gap-2 mb-6">
            {(['friendly', 'strict', 'motivating'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPersonality(p)}
                className={`px-3 py-2 rounded-lg text-sm transition-all ${
                  personality === p 
                    ? 'bg-purple-600 text-white' 
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {p === 'friendly' ? '😊 Samimi' : p === 'strict' ? '📚 Disiplinli' : '🚀 Motive Edici'}
              </button>
            ))}
          </div>
          
          <button
            onClick={connect}
            disabled={status === 'connecting' || tokenLoading}
            className="px-8 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold rounded-2xl hover:shadow-lg hover:shadow-purple-500/50 transition-all disabled:opacity-50 flex items-center gap-3"
          >
            {(status === 'connecting' || tokenLoading) ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                {tokenLoading ? 'Token alınıyor...' : 'Bağlanıyor...'}
              </>
            ) : (
              <>
                <Phone className="w-5 h-5" />
                Dersi Başlat
              </>
            )}
          </button>
          
          {/* Bağlantı bilgisi */}
          <div className="mt-6 p-3 bg-gray-800/50 rounded-lg text-xs text-gray-400 text-left">
            <p className="flex items-center gap-2 mb-1">
              <Wifi className="w-3 h-3" />
              <span>Gemini 2.5 Flash Live API</span>
            </p>
            <p>• Native audio streaming</p>
            <p>• Düşük gecikme (&lt;500ms)</p>
            <p>• Ses karakteri: {voice}</p>
          </div>
          
          <p className="mt-4 text-xs text-gray-500">
            🎤 Mikrofon erişimi gerektirir
          </p>
        </div>
      )}
      
      {/* Aktif sohbet */}
      {isConnected && (
        <>
          {/* Mesajlar */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 ? (
              <div className="text-center text-gray-400 mt-10">
                <Sparkles className="w-10 h-10 mx-auto mb-3 text-purple-400 animate-pulse" />
                <p>Konuşmaya başla!</p>
                <p className="text-sm mt-1">"{studentName}, merhaba!" diyerek başlayacağım.</p>
              </div>
            ) : (
              messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.isUser ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] p-3 rounded-2xl ${
                      msg.isUser
                        ? 'bg-purple-600 text-white rounded-br-md'
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
          
          {/* Kontroller */}
          <div className="p-4 bg-gray-800/50 border-t border-gray-700">
            {/* Dalga animasyonu */}
            {isListening && (
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
              
              {/* Ana buton */}
              <button
                onClick={disconnect}
                className="p-4 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-lg shadow-red-500/30"
                title="Dersi bitir"
              >
                <PhoneOff className="w-8 h-8" />
              </button>
              
              {/* Mikrofon durumu */}
              <div className={`p-3 rounded-full ${isListening ? 'bg-green-500' : 'bg-gray-600'}`}>
                {isListening ? (
                  <Mic className="w-6 h-6 text-white" />
                ) : (
                  <MicOff className="w-6 h-6 text-gray-400" />
                )}
              </div>
            </div>
            
            <p className="text-center text-xs text-gray-500 mt-3">
              {isListening ? '🎤 Konuş, seni duyuyorum!' : 
               isSpeaking ? '🔊 Öğretmenini dinle...' :
               '⏳ Bekle...'}
            </p>
          </div>
        </>
      )}
    </div>
  )
}
