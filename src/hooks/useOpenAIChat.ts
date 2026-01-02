'use client'

/**
 * useOpenAIChat Hook
 * 
 * 🚀 OpenAI GPT-4o-mini + TTS-1-HD
 * REST API tabanlı - %100 çalışır!
 * 
 * Özellikler:
 * - GPT-4o-mini ile akıllı sohbet
 * - TTS-1-HD ile yüksek kaliteli ses
 * - Nova sesi (samimi kadın öğretmen)
 * - Konuşma geçmişi
 * - Browser TTS fallback
 */

import { useState, useRef, useCallback, useEffect } from 'react'

// =====================================================
// TYPES
// =====================================================
export type ChatStatus = 
  | 'idle'
  | 'connecting'
  | 'ready'
  | 'listening'
  | 'processing'
  | 'speaking'
  | 'error'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface UseOpenAIChatOptions {
  studentName?: string
  grade?: number
  voice?: 'nova' | 'onyx' | 'alloy' | 'echo' | 'fable' | 'shimmer'
  speed?: number
  onTranscript?: (text: string, isUser: boolean) => void
  onStatusChange?: (status: ChatStatus) => void
  onError?: (error: Error) => void
}

interface UseOpenAIChatReturn {
  status: ChatStatus
  isReady: boolean
  isListening: boolean
  isSpeaking: boolean
  volume: number
  messages: Message[]
  connect: () => Promise<void>
  disconnect: () => void
  sendMessage: (text: string) => Promise<void>
  interrupt: () => void
  error: Error | null
}

export function useOpenAIChat(options: UseOpenAIChatOptions): UseOpenAIChatReturn {
  const {
    studentName = 'Şakir',
    grade = 8,
    voice = 'nova',
    speed = 1.0,
    onTranscript,
    onStatusChange,
    onError
  } = options
  
  // State
  const [status, setStatus] = useState<ChatStatus>('idle')
  const [volume, setVolume] = useState(0)
  const [error, setError] = useState<Error | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  
  // Refs
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const isPlayingRef = useRef(false)
  const abortControllerRef = useRef<AbortController | null>(null)
  
  // =====================================================
  // STATUS UPDATE
  // =====================================================
  const updateStatus = useCallback((newStatus: ChatStatus) => {
    console.log(`🔄 [STATUS] ${status} → ${newStatus}`)
    setStatus(newStatus)
    onStatusChange?.(newStatus)
  }, [status, onStatusChange])
  
  // =====================================================
  // PLAY AUDIO (OpenAI TTS)
  // =====================================================
  const playAudio = useCallback(async (base64Audio: string) => {
    console.log('🔊🔊🔊 SES ÇALINIYOR 🔊🔊🔊')
    
    try {
      // Base64 → Blob
      const binaryString = atob(base64Audio)
      const bytes = new Uint8Array(binaryString.length)
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i)
      }
      const blob = new Blob([bytes], { type: 'audio/mpeg' })
      const audioUrl = URL.createObjectURL(blob)
      
      // Audio element ile çal
      if (audioRef.current) {
        audioRef.current.pause()
        URL.revokeObjectURL(audioRef.current.src)
      }
      
      const audio = new Audio(audioUrl)
      audioRef.current = audio
      
      isPlayingRef.current = true
      updateStatus('speaking')
      
      // Volume animation
      const volumeInterval = setInterval(() => {
        if (isPlayingRef.current) {
          setVolume(0.4 + Math.random() * 0.4)
        } else {
          clearInterval(volumeInterval)
          setVolume(0)
        }
      }, 100)
      
      audio.onended = () => {
        console.log('🔇 [AUDIO] Bitti')
        isPlayingRef.current = false
        setVolume(0)
        clearInterval(volumeInterval)
        URL.revokeObjectURL(audioUrl)
        updateStatus('listening')
      }
      
      audio.onerror = (e) => {
        console.error('❌ [AUDIO] Hata:', e)
        isPlayingRef.current = false
        clearInterval(volumeInterval)
        updateStatus('ready')
      }
      
      await audio.play()
      console.log('✅ [AUDIO] Çalıyor')
      
    } catch (err: any) {
      console.error('❌ [AUDIO] Hata:', err.message)
      isPlayingRef.current = false
      updateStatus('ready')
    }
  }, [updateStatus])
  
  // =====================================================
  // BROWSER TTS FALLBACK
  // =====================================================
  const speakWithBrowserTTS = useCallback((text: string) => {
    if (!text.trim() || typeof window === 'undefined') return
    
    console.log('🗣️ [Browser TTS]:', text.substring(0, 50))
    window.speechSynthesis?.cancel()
    
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'tr-TR'
    utterance.rate = speed
    
    const voices = window.speechSynthesis?.getVoices() || []
    const turkishVoice = voices.find(v => v.lang.startsWith('tr'))
    if (turkishVoice) utterance.voice = turkishVoice
    
    utterance.onstart = () => {
      isPlayingRef.current = true
      updateStatus('speaking')
    }
    
    utterance.onend = () => {
      isPlayingRef.current = false
      setVolume(0)
      updateStatus('listening')
    }
    
    const interval = setInterval(() => {
      if (isPlayingRef.current) {
        setVolume(0.3 + Math.random() * 0.5)
      } else {
        clearInterval(interval)
      }
    }, 100)
    
    window.speechSynthesis?.speak(utterance)
  }, [speed, updateStatus])
  
  // =====================================================
  // GET TTS AUDIO
  // =====================================================
  const getAudio = useCallback(async (text: string): Promise<string | null> => {
    try {
      const response = await fetch('/api/tekno-teacher/openai/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, voice, speed })
      })
      
      if (!response.ok) {
        console.warn('⚠️ [TTS] API hatası, fallback kullanılacak')
        return null
      }
      
      const data = await response.json()
      return data.audio || null
      
    } catch (err) {
      console.warn('⚠️ [TTS] Hata:', err)
      return null
    }
  }, [voice, speed])
  
  // =====================================================
  // SEND MESSAGE
  // =====================================================
  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim()) return
    
    console.log('💬 [CHAT] Mesaj:', text.substring(0, 50))
    
    // Kullanıcı mesajını ekle
    const userMessage: Message = { role: 'user', content: text.trim() }
    setMessages(prev => [...prev, userMessage])
    onTranscript?.(text.trim(), true)
    
    updateStatus('processing')
    
    // AbortController
    abortControllerRef.current = new AbortController()
    
    try {
      // GPT-4o-mini çağrısı
      const response = await fetch('/api/tekno-teacher/openai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          conversationHistory: messages,
          studentName,
          grade
        }),
        signal: abortControllerRef.current.signal
      })
      
      if (!response.ok) {
        throw new Error('API hatası')
      }
      
      const data = await response.json()
      const responseText = data.text || `${studentName}, bir sorun oluştu!`
      
      console.log('✅ [CHAT] Yanıt:', responseText.substring(0, 60))
      
      // Assistant mesajını ekle
      const assistantMessage: Message = { role: 'assistant', content: responseText }
      setMessages(prev => [...prev, assistantMessage])
      onTranscript?.(responseText, false)
      
      // TTS ile seslendir
      updateStatus('speaking')
      const audio = await getAudio(responseText)
      
      if (audio) {
        await playAudio(audio)
      } else {
        // Fallback: Browser TTS
        speakWithBrowserTTS(responseText)
      }
      
    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.log('⏹️ [CHAT] İptal edildi')
        return
      }
      
      console.error('❌ [CHAT] Hata:', err.message)
      const errorMsg = `${studentName}, bir teknik sorun var ama endişelenme!`
      onTranscript?.(errorMsg, false)
      speakWithBrowserTTS(errorMsg)
      
      setError(err)
      onError?.(err)
    }
  }, [messages, studentName, grade, updateStatus, getAudio, playAudio, speakWithBrowserTTS, onTranscript, onError])
  
  // =====================================================
  // CONNECT (Başlangıç selamı)
  // =====================================================
  const connect = useCallback(async () => {
    console.log('🚀🚀🚀 [OPENAI] Oturum başlatılıyor 🚀🚀🚀')
    
    setError(null)
    setMessages([])
    updateStatus('connecting')
    
    try {
      // İlk mesaj - selamlama
      const response = await fetch('/api/tekno-teacher/openai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `[SİSTEM: Yeni oturum başladı. ${studentName} adlı ${grade}. sınıf öğrencisine "Merhaba ${studentName}, bugün harika bir ders işleyeceğiz! Ne çalışmak istersin?" şeklinde kısa ve samimi bir selam ver.]`,
          conversationHistory: [],
          studentName,
          grade
        })
      })
      
      if (!response.ok) throw new Error('Bağlantı hatası')
      
      const data = await response.json()
      const greeting = data.text || `Merhaba ${studentName}! Bugün harika bir ders işleyeceğiz!`
      
      // Selamlamayı ekle
      setMessages([{ role: 'assistant', content: greeting }])
      onTranscript?.(greeting, false)
      
      updateStatus('ready')
      
      // Sesle selamla
      const audio = await getAudio(greeting)
      if (audio) {
        await playAudio(audio)
      } else {
        speakWithBrowserTTS(greeting)
      }
      
      console.log('✅ [OPENAI] Bağlantı kuruldu!')
      
    } catch (err: any) {
      console.error('❌ [OPENAI] Bağlantı hatası:', err.message)
      setError(err)
      onError?.(err)
      updateStatus('error')
      
      // Fallback selamlama
      const fallbackGreeting = `Merhaba ${studentName}! Bağlantıda küçük bir sorun var ama konuşabiliriz.`
      onTranscript?.(fallbackGreeting, false)
      speakWithBrowserTTS(fallbackGreeting)
    }
  }, [studentName, grade, updateStatus, getAudio, playAudio, speakWithBrowserTTS, onTranscript, onError])
  
  // =====================================================
  // DISCONNECT
  // =====================================================
  const disconnect = useCallback(() => {
    console.log('🔌 [OPENAI] Oturum kapatılıyor')
    
    abortControllerRef.current?.abort()
    
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }
    
    window.speechSynthesis?.cancel()
    
    isPlayingRef.current = false
    setVolume(0)
    setMessages([])
    setError(null)
    setStatus('idle')  // Direct set, no callback dependency
  }, [])  // Empty deps - stable reference
  
  // =====================================================
  // INTERRUPT
  // =====================================================
  const interrupt = useCallback(() => {
    console.log('🛑 [OPENAI] Kesiliyor')
    
    abortControllerRef.current?.abort()
    
    if (audioRef.current) {
      audioRef.current.pause()
    }
    
    window.speechSynthesis?.cancel()
    
    isPlayingRef.current = false
    setVolume(0)
    setStatus('ready')  // Direct set
  }, [])  // Empty deps - stable reference
  
  // Cleanup on unmount only
  useEffect(() => {
    return () => {
      console.log('🧹 [OPENAI] Component unmount - cleanup')
      abortControllerRef.current?.abort()
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
      window.speechSynthesis?.cancel()
      isPlayingRef.current = false
    }
  }, [])  // Empty deps - only on unmount
  
  return {
    status,
    isReady: ['ready', 'listening', 'processing', 'speaking'].includes(status),
    isListening: status === 'listening',
    isSpeaking: status === 'speaking',
    volume,
    messages,
    connect,
    disconnect,
    sendMessage,
    interrupt,
    error
  }
}

export default useOpenAIChat
