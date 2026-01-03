'use client'

/**
 * TeknoÖğretmen Live Mode - Akıllı Tahta Entegreli
 * Gemini 3 Flash + ElevenLabs TTS + Smart Board
 * 
 * Split View:
 * - Sol: Akıllı Tahta (formüller, grafikler, çözümler)
 * - Sağ: Chat ve Avatar
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { 
  Mic, 
  MicOff, 
  Phone, 
  PhoneOff,
  Volume2,
  Loader2,
  X,
  Sparkles,
  Send,
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-react'
import TeknoTeacherAvatar from './TeknoTeacherAvatar'
import SmartBoard, { VisualContent, ProgressData } from './SmartBoard'
import MathRenderer from '@/components/MathRenderer'
import { useTeknoTeacher, TeacherStatus } from '@/hooks/useTeknoTeacher'
import { useVoiceRecognition } from '@/hooks/useVoiceRecognition'

interface TeknoTeacherLiveProps {
  studentName: string
  grade: number
  onClose?: () => void
}

export default function TeknoTeacherLive({
  studentName,
  grade,
  onClose
}: TeknoTeacherLiveProps) {
  const [displayMessages, setDisplayMessages] = useState<{ text: string, isUser: boolean }[]>([])
  const [localError, setLocalError] = useState<string | null>(null)
  const [sessionActive, setSessionActive] = useState(false)
  const [textInput, setTextInput] = useState('')
  const [showBoard, setShowBoard] = useState(true)
  const [progress, setProgress] = useState<ProgressData>({
    correct: 0,
    total: 0,
    streak: 0,
    level: 'beginner'
  })
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  // TeknoTeacher Hook (Gemini + ElevenLabs + Görsel)
  const {
    status,
    isReady,
    isSpeaking,
    volume,
    messages,
    visuals,
    currentTopic,
    connect,
    disconnect,
    sendMessage,
    stop,
    clearVisuals,
    error: teacherError
  } = useTeknoTeacher({
    studentName,
    grade,
    onTranscript: (text, isUser) => {
      if (text.trim()) {
        setDisplayMessages(prev => [...prev, { text: text.trim(), isUser }])
      }
    },
    onStatusChange: (newStatus) => {
      console.log('🔴 Status:', newStatus)
      if (newStatus === 'ready' && sessionActive) {
        setTimeout(() => startListening(), 300)
      }
    },
    onVisualContent: (newVisuals) => {
      console.log('📊 Yeni görsel içerik:', newVisuals.length)
    },
    onTopicChange: (topic) => {
      console.log('📚 Konu değişti:', topic)
    },
    onError: (err) => {
      console.error('❌ Error:', err)
      setLocalError(err.message)
    }
  })
  
  // Voice Recognition
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
    continuous: true,  // 🎤 Sürekli dinleme modu
    interimResults: true,
    onResult: (text, isFinal) => {
      if (isFinal && text.trim().length > 2) {
        console.log('🗣️ Ses algılandı:', text)
        handleVoiceInput(text.trim())
      }
    },
    onEnd: () => {
      // 🔄 Oturum aktifse ve öğretmen konuşmuyorsa mikrofonu yeniden başlat
      if (sessionActive && !isSpeaking && status === 'ready') {
        console.log('🎤 Mikrofon otomatik restart')
        setTimeout(() => startListening(), 500)
      }
    }
  })

  // Mesajları scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [displayMessages])

  // 🎤 Öğretmen konuşması bitince mikrofonu otomatik aç
  useEffect(() => {
    if (sessionActive && !isSpeaking && status === 'ready' && !isListening) {
      console.log('🎤 Öğretmen konuşması bitti, mikrofon açılıyor...')
      const timer = setTimeout(() => {
        startListening()
      }, 800) // 800ms bekle, ses sistemleri stabilize olsun
      return () => clearTimeout(timer)
    }
  }, [isSpeaking, sessionActive, status, isListening, startListening])

  // 🔇 Öğretmen konuşurken mikrofonu kapat
  useEffect(() => {
    if (isSpeaking && isListening) {
      console.log('🔇 Öğretmen konuşuyor, mikrofon kapatılıyor...')
      stopListening()
    }
  }, [isSpeaking, isListening, stopListening])

  // Ses ile mesaj gönder
  const handleVoiceInput = useCallback(async (text: string) => {
    if (!text.trim() || !sessionActive) return
    
    stopListening()
    resetTranscript()
    await sendMessage(text)
  }, [sessionActive, stopListening, resetTranscript, sendMessage])

  // Metin ile mesaj gönder
  const handleTextSubmit = useCallback(async () => {
    if (!textInput.trim() || !sessionActive) return
    
    const text = textInput.trim()
    setTextInput('')
    stopListening()
    await sendMessage(text)
  }, [textInput, sessionActive, stopListening, sendMessage])

  // Oturumu başlat
  const handleStart = useCallback(async () => {
    console.log('🚀 Oturum başlatılıyor...')
    setLocalError(null)
    setDisplayMessages([])
    setSessionActive(true)
    
    try {
      await connect()
    } catch (err: any) {
      setLocalError(err.message)
      setSessionActive(false)
    }
  }, [connect])

  // Oturumu bitir
  const handleEnd = useCallback(() => {
    console.log('🛑 Oturum sonlandırılıyor...')
    stopListening()
    disconnect()
    setSessionActive(false)
    setDisplayMessages([])
    onClose?.()
  }, [stopListening, disconnect, onClose])

  // Mikrofon toggle
  const toggleMic = useCallback(() => {
    if (isListening) {
      stopListening()
    } else if (sessionActive && !isSpeaking) {
      resetTranscript()
      startListening()
    }
  }, [isListening, sessionActive, isSpeaking, stopListening, resetTranscript, startListening])

  // Status renkleri
  const statusColors: Record<TeacherStatus, string> = {
    idle: 'bg-gray-500',
    connecting: 'bg-yellow-500 animate-pulse',
    ready: 'bg-green-500',
    listening: 'bg-green-500 animate-pulse',
    thinking: 'bg-blue-500 animate-pulse',
    speaking: 'bg-purple-500',
    error: 'bg-red-500'
  }

  // Status metinleri
  const statusTexts: Record<TeacherStatus, string> = {
    idle: 'Beklemede',
    connecting: 'Bağlanıyor...',
    ready: '✓ Hazır',
    listening: '🎤 Seni dinliyorum...',
    thinking: '🤔 Düşünüyor...',
    speaking: '🔊 Konuşuyorum...',
    error: '❌ Hata'
  }

  return (
    <div className="fixed inset-4 flex gap-4 z-50">
      {/* Sol Panel - Akıllı Tahta */}
      {showBoard && sessionActive && (
        <div className="w-[400px] flex-shrink-0 transition-all duration-300">
          <SmartBoard
            visuals={visuals}
            progress={progress}
            currentTopic={currentTopic || undefined}
            isActive={sessionActive}
            onClear={clearVisuals}
          />
        </div>
      )}

      {/* Sağ Panel - Chat */}
      <div className="flex-1 max-w-[500px] ml-auto bg-gradient-to-b from-gray-900 to-gray-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-purple-500/30">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-purple-600 to-indigo-600">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${statusColors[status]}`} />
            <span className="text-white font-medium">TeknoÖğretmen</span>
            <span className="text-purple-200 text-sm">{statusTexts[status]}</span>
          </div>
          <div className="flex items-center gap-2">
            {sessionActive && (
              <button
                onClick={() => setShowBoard(!showBoard)}
                className="p-2 hover:bg-white/10 rounded-full transition-colors text-white"
                title={showBoard ? 'Tahtayı gizle' : 'Tahtayı göster'}
              >
                {showBoard ? <PanelLeftClose className="w-5 h-5" /> : <PanelLeftOpen className="w-5 h-5" />}
              </button>
            )}
            <button
              onClick={handleEnd}
              className="p-2 hover:bg-white/10 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        {/* Avatar */}
        <div className="flex-shrink-0 py-4 flex justify-center bg-gradient-to-b from-purple-900/50 to-transparent">
          <div className="relative">
            <TeknoTeacherAvatar 
              isSpeaking={isSpeaking} 
              externalVolume={volume}
              size="lg"
            />
            {isSpeaking && (
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2">
                <Volume2 className="w-5 h-5 text-purple-400 animate-pulse" />
              </div>
            )}
          </div>
        </div>

        {/* Başlangıç ekranı */}
        {!sessionActive && (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
            <h2 className="text-2xl font-bold text-white mb-2">Sesli Ders Başlat</h2>
            <p className="text-gray-400 mb-6">Gemini 3 Flash + ElevenLabs + Akıllı Tahta</p>
            
            <button
              onClick={handleStart}
              disabled={status === 'connecting'}
              className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-2xl font-semibold hover:from-purple-600 hover:to-indigo-600 transition-all disabled:opacity-50 shadow-lg shadow-purple-500/30"
            >
              {status === 'connecting' ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <Phone className="w-6 h-6" />
              )}
              Dersi Başlat
            </button>

            <div className="mt-8 text-left text-sm text-gray-500">
              <p className="flex items-center gap-2 mb-1">
                <Sparkles className="w-4 h-4 text-purple-400" />
                Yeni Özellikler
              </p>
              <p className="ml-6">• Akıllı Tahta - Formüller otomatik görünür</p>
              <p className="ml-6">• Çözüm adımları yan panelde</p>
              <p className="ml-6">• ElevenLabs yüksek kalite ses</p>
            </div>
          </div>
        )}

        {/* Aktif oturum */}
        {sessionActive && (
          <>
            {/* Mesajlar */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {displayMessages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.isUser ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] px-4 py-2 rounded-2xl ${
                      msg.isUser
                        ? 'bg-purple-600 text-white rounded-br-md'
                        : 'bg-gray-700 text-gray-100 rounded-bl-md'
                    }`}
                  >
                    <MathRenderer text={msg.text} className="text-sm" />
                  </div>
                </div>
              ))}
              
              {/* Ara transcript */}
              {interimTranscript && (
                <div className="flex justify-end">
                  <div className="max-w-[85%] px-4 py-2 rounded-2xl bg-purple-600/50 text-white/70 rounded-br-md italic">
                    {interimTranscript}...
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Hata mesajı */}
            {(localError || teacherError) && (
              <div className="mx-4 mb-2 px-3 py-2 bg-red-500/20 border border-red-500/30 rounded-lg text-red-300 text-sm">
                {localError || teacherError?.message}
              </div>
            )}

            {/* 🎤 Dinleme durumu göstergesi */}
            {isListening && (
              <div className="mx-4 mb-2 px-3 py-2 bg-green-500/20 border border-green-500/30 rounded-lg text-green-300 text-sm flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                {interimTranscript ? (
                  <span>🎤 "{interimTranscript}"</span>
                ) : (
                  <span>🎤 Seni dinliyorum... (konuş!)</span>
                )}
              </div>
            )}

            {/* Input alanı */}
            <div className="p-4 border-t border-gray-700">
              <div className="flex items-center gap-2">
                {/* Mikrofon butonu */}
                <button
                  onClick={toggleMic}
                  disabled={isSpeaking || status === 'thinking'}
                  className={`p-3 rounded-full transition-all ${
                    isListening
                      ? 'bg-green-500 text-white animate-pulse shadow-lg shadow-green-500/50'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  } disabled:opacity-50`}
                  title={isListening ? 'Mikrofonu kapat' : 'Mikrofonu aç'}
                >
                  {isListening ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
                </button>

                {/* Metin input */}
                <input
                  type="text"
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleTextSubmit()}
                  placeholder="Mesajını yaz..."
                  disabled={isSpeaking || status === 'thinking'}
                  className="flex-1 bg-gray-700 text-white px-4 py-3 rounded-xl border border-gray-600 focus:border-purple-500 focus:outline-none disabled:opacity-50"
                />

                {/* Gönder butonu */}
                <button
                  onClick={handleTextSubmit}
                  disabled={!textInput.trim() || isSpeaking || status === 'thinking'}
                  className="p-3 bg-purple-600 text-white rounded-full hover:bg-purple-500 transition-colors disabled:opacity-50"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>

              {/* Durdur butonu */}
              {isSpeaking && (
                <button
                  onClick={stop}
                  className="w-full mt-2 py-2 bg-red-500/20 text-red-300 rounded-lg hover:bg-red-500/30 transition-colors"
                >
                  Konuşmayı Durdur
                </button>
              )}
            </div>

            {/* Kapat butonu */}
            <div className="p-4 pt-0">
              <button
                onClick={handleEnd}
                className="w-full flex items-center justify-center gap-2 py-3 bg-red-600 text-white rounded-xl hover:bg-red-500 transition-colors"
              >
                <PhoneOff className="w-5 h-5" />
                Dersi Bitir
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
