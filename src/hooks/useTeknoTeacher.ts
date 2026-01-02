'use client'

/**
 * 🎓 useTeknoTeacher Hook - Akıllı Tahta Destekli
 * 
 * Gemini 3 Flash (zeka) + ElevenLabs (ses) + Görsel İçerik
 */

import { useState, useRef, useCallback, useEffect } from 'react'
import { VisualContent } from '@/components/TeknoTeacher/SmartBoard'

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
  onVisualContent?: (visuals: VisualContent[]) => void  // Yeni görsel callback
  onTopicChange?: (topic: string) => void  // Konu değişikliği callback
  onError?: (error: Error) => void
}

interface UseTeknoTeacherReturn {
  status: TeacherStatus
  isReady: boolean
  isSpeaking: boolean
  volume: number
  messages: Message[]
  visuals: VisualContent[]  // Tüm görseller
  currentTopic: string | null
  connect: () => Promise<void>
  disconnect: () => void
  sendMessage: (text: string) => Promise<void>
  stop: () => void
  clearVisuals: () => void
  error: Error | null
}

export function useTeknoTeacher(options: UseTeknoTeacherOptions): UseTeknoTeacherReturn {
  const {
    studentName = 'Öğrenci',
    grade = 8,
    onTranscript,
    onStatusChange,
    onVisualContent,
    onTopicChange,
    onError
  } = options
  
  // State
  const [status, setStatus] = useState<TeacherStatus>('idle')
  const [volume, setVolume] = useState(0)
  const [error, setError] = useState<Error | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [visuals, setVisuals] = useState<VisualContent[]>([])
  const [currentTopic, setCurrentTopic] = useState<string | null>(null)
  
  // Refs
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const isPlayingRef = useRef(false)
  const abortRef = useRef<AbortController | null>(null)
  
  // Status güncelle
  const updateStatus = useCallback((newStatus: TeacherStatus) => {
    setStatus(newStatus)
    onStatusChange?.(newStatus)
  }, [onStatusChange])
  
  // Görsel ekle
  const addVisuals = useCallback((newVisuals: VisualContent[]) => {
    if (newVisuals.length === 0) return
    
    const visualsWithId = newVisuals.map((v, i) => ({
      ...v,
      id: `${Date.now()}-${i}`,
      timestamp: new Date()
    }))
    
    setVisuals(prev => [...prev, ...visualsWithId])
    onVisualContent?.(visualsWithId)
  }, [onVisualContent])
  
  // Görselleri temizle
  const clearVisuals = useCallback(() => {
    setVisuals([])
  }, [])
  
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
  
  // ElevenLabs TTS - LaTeX temizle
  const getAudio = useCallback(async (text: string): Promise<string | null> => {
    try {
      // LaTeX ve emojileri temizle
      const cleanText = text
        .replace(/\$[^$]+\$/g, '')  // Inline math
        .replace(/\\\[[\s\S]*?\\\]/g, '')  // Block math
        .replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, '')  // Emojiler
        .replace(/[✨🚀💪📚🎯✅❌🔥⭐💡🎉👋🤔💬📝🎙🔊📊📈👂]/g, '')
        .replace(/\s+/g, ' ')
        .trim()
      
      if (!cleanText) return null
      
      const response = await fetch('/api/tekno-teacher/elevenlabs-tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: cleanText, voice: 'turkish' })
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
      // Gemini 3 Flash çağrısı - görsel içerik ile
      const response = await fetch('/api/tekno-teacher/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          conversationHistory: messages.slice(-6),
          studentName,
          grade,
          withVisuals: true  // Görsel içerik iste
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
      
      // Görsel içerik varsa ekle
      if (data.visuals && data.visuals.length > 0) {
        addVisuals(data.visuals)
      }
      
      // Konu değişti mi?
      if (data.topic && data.topic !== currentTopic) {
        setCurrentTopic(data.topic)
        onTopicChange?.(data.topic)
      }
      
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
  }, [messages, studentName, grade, currentTopic, updateStatus, getAudio, playAudio, speakWithBrowser, addVisuals, onTranscript, onTopicChange, onError])
  
  // Bağlan (selamlama)
  const connect = useCallback(async () => {
    setError(null)
    setMessages([])
    setVisuals([])
    setCurrentTopic(null)
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
    setVisuals([])
    setCurrentTopic(null)
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
    visuals,
    currentTopic,
    connect,
    disconnect,
    sendMessage,
    stop,
    clearVisuals,
    error
  }
}

export default useTeknoTeacher
