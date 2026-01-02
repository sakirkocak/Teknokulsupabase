'use client'

/**
 * 🎓 useTeknoTeacher Hook - Basit ve Temiz
 * 
 * Gemini 3 Flash (zeka) + ElevenLabs (ses)
 * Karmaşıklık yok, sadece çalışan sistem!
 */

import { useState, useRef, useCallback, useEffect } from 'react'

export type TeacherStatus = 
  | 'idle'
  | 'connecting'
  | 'ready'
  | 'listening'
  | 'thinking'
  | 'speaking'
  | 'error'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface UseTeknoTeacherOptions {
  studentName?: string
  grade?: number
  onTranscript?: (text: string, isUser: boolean) => void
  onStatusChange?: (status: TeacherStatus) => void
  onError?: (error: Error) => void
}

interface UseTeknoTeacherReturn {
  status: TeacherStatus
  isReady: boolean
  isSpeaking: boolean
  volume: number
  messages: Message[]
  connect: () => Promise<void>
  disconnect: () => void
  sendMessage: (text: string) => Promise<void>
  stop: () => void
  error: Error | null
}

export function useTeknoTeacher(options: UseTeknoTeacherOptions): UseTeknoTeacherReturn {
  const {
    studentName = 'Öğrenci',
    grade = 8,
    onTranscript,
    onStatusChange,
    onError
  } = options
  
  // State
  const [status, setStatus] = useState<TeacherStatus>('idle')
  const [volume, setVolume] = useState(0)
  const [error, setError] = useState<Error | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  
  // Refs
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const isPlayingRef = useRef(false)
  const abortRef = useRef<AbortController | null>(null)
  
  // Status güncelle
  const updateStatus = useCallback((newStatus: TeacherStatus) => {
    setStatus(newStatus)
    onStatusChange?.(newStatus)
  }, [onStatusChange])
  
  // Audio çal
  const playAudio = useCallback(async (base64Audio: string) => {
    try {
      // Base64 → Blob
      const binaryString = atob(base64Audio)
      const bytes = new Uint8Array(binaryString.length)
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i)
      }
      const blob = new Blob([bytes], { type: 'audio/mpeg' })
      const audioUrl = URL.createObjectURL(blob)
      
      // Önceki audio'yu temizle
      if (audioRef.current) {
        audioRef.current.pause()
        URL.revokeObjectURL(audioRef.current.src)
      }
      
      const audio = new Audio(audioUrl)
      audioRef.current = audio
      isPlayingRef.current = true
      updateStatus('speaking')
      
      // Volume animasyonu
      const volumeInterval = setInterval(() => {
        if (isPlayingRef.current) {
          setVolume(0.4 + Math.random() * 0.4)
        } else {
          clearInterval(volumeInterval)
          setVolume(0)
        }
      }, 100)
      
      audio.onended = () => {
        isPlayingRef.current = false
        setVolume(0)
        clearInterval(volumeInterval)
        URL.revokeObjectURL(audioUrl)
        updateStatus('ready')
      }
      
      audio.onerror = () => {
        isPlayingRef.current = false
        clearInterval(volumeInterval)
        updateStatus('ready')
      }
      
      await audio.play()
      
    } catch (err: any) {
      console.error('Audio hata:', err)
      isPlayingRef.current = false
      updateStatus('ready')
    }
  }, [updateStatus])
  
  // Browser TTS fallback
  const speakWithBrowser = useCallback((text: string) => {
    if (!text.trim() || typeof window === 'undefined') return
    
    window.speechSynthesis?.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'tr-TR'
    utterance.rate = 1.0
    
    utterance.onstart = () => {
      isPlayingRef.current = true
      updateStatus('speaking')
    }
    
    utterance.onend = () => {
      isPlayingRef.current = false
      setVolume(0)
      updateStatus('ready')
    }
    
    const interval = setInterval(() => {
      if (isPlayingRef.current) {
        setVolume(0.3 + Math.random() * 0.5)
      } else {
        clearInterval(interval)
      }
    }, 100)
    
    window.speechSynthesis?.speak(utterance)
  }, [updateStatus])
  
  // ElevenLabs TTS
  const getAudio = useCallback(async (text: string): Promise<string | null> => {
    try {
      const response = await fetch('/api/tekno-teacher/elevenlabs-tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, voice: 'turkish' })
      })
      
      if (!response.ok) {
        console.warn('ElevenLabs hatası, fallback kullanılacak')
        return null
      }
      
      const data = await response.json()
      return data.audio || null
      
    } catch (err) {
      console.warn('TTS hata:', err)
      return null
    }
  }, [])
  
  // Mesaj gönder
  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim()) return
    
    // Kullanıcı mesajı ekle
    const userMessage: Message = { role: 'user', content: text.trim() }
    setMessages(prev => [...prev, userMessage])
    onTranscript?.(text.trim(), true)
    
    updateStatus('thinking')
    abortRef.current = new AbortController()
    
    try {
      // Gemini 3 Flash çağrısı
      const response = await fetch('/api/tekno-teacher/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          conversationHistory: messages.slice(-6),
          studentName,
          grade
        }),
        signal: abortRef.current.signal
      })
      
      if (!response.ok) throw new Error('API hatası')
      
      const data = await response.json()
      const responseText = data.text || `${studentName}, bir sorun oluştu!`
      
      // Assistant mesajı ekle
      const assistantMessage: Message = { role: 'assistant', content: responseText }
      setMessages(prev => [...prev, assistantMessage])
      onTranscript?.(responseText, false)
      
      // ElevenLabs TTS
      updateStatus('speaking')
      const audio = await getAudio(responseText)
      
      if (audio) {
        await playAudio(audio)
      } else {
        // Fallback: Browser TTS
        speakWithBrowser(responseText)
      }
      
    } catch (err: any) {
      if (err.name === 'AbortError') return
      
      console.error('Chat hata:', err)
      const errorMsg = `${studentName}, bir teknik sorun var ama endişelenme!`
      onTranscript?.(errorMsg, false)
      speakWithBrowser(errorMsg)
      
      setError(err)
      onError?.(err)
    }
  }, [messages, studentName, grade, updateStatus, getAudio, playAudio, speakWithBrowser, onTranscript, onError])
  
  // Bağlan (selamlama)
  const connect = useCallback(async () => {
    setError(null)
    setMessages([])
    updateStatus('connecting')
    
    try {
      // Selamlama mesajı
      const greeting = `Merhaba ${studentName}! Ben TeknoÖğretmen, senin kişisel ders asistanın. Bugün sana nasıl yardımcı olabilirim?`
      
      setMessages([{ role: 'assistant', content: greeting }])
      onTranscript?.(greeting, false)
      
      updateStatus('ready')
      
      // Sesle selamla
      const audio = await getAudio(greeting)
      if (audio) {
        await playAudio(audio)
      } else {
        speakWithBrowser(greeting)
      }
      
    } catch (err: any) {
      console.error('Bağlantı hatası:', err)
      setError(err)
      onError?.(err)
      updateStatus('error')
      
      const fallback = `Merhaba ${studentName}! Bir sorun var ama konuşabiliriz.`
      setMessages([{ role: 'assistant', content: fallback }])
      speakWithBrowser(fallback)
    }
  }, [studentName, updateStatus, getAudio, playAudio, speakWithBrowser, onTranscript, onError])
  
  // Bağlantıyı kes
  const disconnect = useCallback(() => {
    abortRef.current?.abort()
    
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }
    
    window.speechSynthesis?.cancel()
    
    isPlayingRef.current = false
    setVolume(0)
    setMessages([])
    setError(null)
    setStatus('idle')
  }, [])
  
  // Durdur
  const stop = useCallback(() => {
    abortRef.current?.abort()
    
    if (audioRef.current) {
      audioRef.current.pause()
    }
    
    window.speechSynthesis?.cancel()
    
    isPlayingRef.current = false
    setVolume(0)
    setStatus('ready')
  }, [])
  
  // Cleanup
  useEffect(() => {
    return () => {
      abortRef.current?.abort()
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
      window.speechSynthesis?.cancel()
    }
  }, [])
  
  return {
    status,
    isReady: ['ready', 'listening', 'thinking', 'speaking'].includes(status),
    isSpeaking: status === 'speaking',
    volume,
    messages,
    connect,
    disconnect,
    sendMessage,
    stop,
    error
  }
}

export default useTeknoTeacher
