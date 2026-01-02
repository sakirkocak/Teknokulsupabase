'use client'

/**
 * TeknoÖğretmen Live Mode
 * Gemini 3 Flash + ElevenLabs TTS
 * 
 * Özellikler:
 * - Gemini 3 Flash ile akıllı sohbet
 * - ElevenLabs ile yüksek kaliteli Türkçe ses
 * - Browser Speech Recognition ile dinleme
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
  Send
} from 'lucide-react'
import TeknoTeacherAvatar from './TeknoTeacherAvatar'
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
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  // TeknoTeacher Hook (Gemini + ElevenLabs)
  const {
    status,
    isReady,
    isSpeaking,
    volume,
    messages,
    connect,
    disconnect,
    sendMessage,
    stop,
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
    continuous: false,
    interimResults: true,
    onResult: (text, isFinal) => {
      if (isFinal && text.trim().length > 2) {
        console.log('🗣️ Ses algılandı:', text)
        handleVoiceInput(text.trim())
      }
    }
  })

  // Mesajları scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [displayMessages])

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
    <div className="fixed bottom-6 right-6 w-[420px] h-[650px] bg-gradient-to-b from-gray-900 to-gray-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden z-50 border border-purple-500/30">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-purple-600 to-indigo-600">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${statusColors[status]}`} />
          <span className="text-white font-medium">TeknoÖğretmen</span>
          <span className="text-purple-200 text-sm">{statusTexts[status]}</span>
        </div>
        <button
          onClick={handleEnd}
          className="p-2 hover:bg-white/10 rounded-full transition-colors"
        >
          <X className="w-5 h-5 text-white" />
        </button>
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
          <p className="text-gray-400 mb-6">Gemini 3 Flash + ElevenLabs ile konuş</p>
          
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
              Gemini 3 Flash
            </p>
            <p className="ml-6">• Akıllı Türkçe sohbet</p>
            <p className="ml-6">• ElevenLabs ses kalitesi</p>
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
                  {msg.text}
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

          {/* Input alanı */}
          <div className="p-4 border-t border-gray-700">
            <div className="flex items-center gap-2">
              {/* Mikrofon butonu */}
              <button
                onClick={toggleMic}
                disabled={isSpeaking || status === 'thinking'}
                className={`p-3 rounded-full transition-all ${
                  isListening
                    ? 'bg-green-500 text-white animate-pulse'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                } disabled:opacity-50`}
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
  )
}
