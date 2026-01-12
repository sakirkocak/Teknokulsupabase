'use client'

import { useState, useRef, useEffect } from 'react'
import { Mic, MicOff, Volume2, VolumeX, Phone, PhoneOff } from 'lucide-react'

interface VoiceControlsProps {
  onVoiceInput?: (text: string) => void
  autoSpeak?: boolean
  onAutoSpeakChange?: (value: boolean) => void
  isSpeaking?: boolean
  onBargeIn?: () => void
}

export default function VoiceControls({
  onVoiceInput,
  autoSpeak = true,
  onAutoSpeakChange,
  isSpeaking = false,
  onBargeIn
}: VoiceControlsProps) {
  const [isListening, setIsListening] = useState(false)
  const [voiceSession, setVoiceSession] = useState(false)
  const recognitionRef = useRef<any>(null)

  useEffect(() => {
    if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition
      recognitionRef.current = new SpeechRecognition()
      recognitionRef.current.continuous = false
      recognitionRef.current.interimResults = false
      recognitionRef.current.lang = 'tr-TR'

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript
        onVoiceInput?.(transcript)
        setIsListening(false)
      }

      recognitionRef.current.onerror = () => {
        setIsListening(false)
      }

      recognitionRef.current.onend = () => {
        setIsListening(false)
        if (voiceSession) {
          // Auto-restart in voice session mode
          setTimeout(() => {
            if (voiceSession && !isSpeaking) {
              startListening()
            }
          }, 500)
        }
      }
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort()
      }
    }
  }, [voiceSession, isSpeaking, onVoiceInput])

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      try {
        // Barge-in: Stop Jarvis if speaking
        if (isSpeaking) {
          onBargeIn?.()
        }
        recognitionRef.current.start()
        setIsListening(true)
      } catch (e) {
        console.error('Speech recognition error:', e)
      }
    }
  }

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop()
      setIsListening(false)
    }
  }

  const toggleVoiceSession = () => {
    if (voiceSession) {
      setVoiceSession(false)
      stopListening()
    } else {
      setVoiceSession(true)
      startListening()
    }
  }

  const toggleMic = () => {
    if (isListening) {
      stopListening()
    } else {
      startListening()
    }
  }

  return (
    <div className="flex items-center gap-1">
      {/* Auto-speak toggle */}
      <button
        onClick={() => onAutoSpeakChange?.(!autoSpeak)}
        className={`p-3 rounded-xl transition-colors ${
          autoSpeak ? 'bg-cyan-500/20 text-cyan-400' : 'bg-slate-800 text-gray-500'
        }`}
        title={autoSpeak ? 'Sesli yanıt açık' : 'Sesli yanıt kapalı'}
      >
        {autoSpeak ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
      </button>

      {/* Mic button */}
      <button
        onClick={toggleMic}
        className={`p-3 rounded-xl transition-colors ${
          isListening
            ? 'bg-red-500 text-white animate-pulse'
            : 'bg-slate-800 text-gray-400 hover:text-cyan-400'
        }`}
        title={isListening ? 'Dinlemeyi durdur' : 'Sesli komut'}
      >
        {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
      </button>

      {/* Voice session toggle */}
      <button
        onClick={toggleVoiceSession}
        className={`p-3 rounded-xl transition-colors ${
          voiceSession
            ? 'bg-green-500 text-white'
            : 'bg-slate-800 text-gray-400 hover:text-green-400'
        }`}
        title={voiceSession ? 'Sesli sohbeti bitir' : 'Sesli sohbet başlat'}
      >
        {voiceSession ? <PhoneOff className="w-5 h-5" /> : <Phone className="w-5 h-5" />}
      </button>
    </div>
  )
}
