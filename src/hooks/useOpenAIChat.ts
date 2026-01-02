'use client'

/**
 * 🎓 useOpenAIChat Hook - RAG + Persona + Kişiselleştirme
 * 
 * OpenAI GPT-4o-mini + TTS-1-HD + RAG + Öğrenci Analizi
 * 
 * Özellikler:
 * - RAG: Semantic search ile benzer sorular bulur
 * - Öğrenci analizi: Zayıf/güçlü konular (Typesense'ten)
 * - Persona: Destekleyici veya Enerjik mod
 * - Kişiselleştirilmiş karşılama
 * - Cache: Supabase'e yük bindirmez
 */

import { useState, useRef, useCallback, useEffect } from 'react'
import { PersonaType, VoiceType, PERSONAS, selectPersona, VOICE_SETTINGS } from '@/lib/personas'

// =====================================================
// TYPES
// =====================================================
export type ChatStatus = 
  | 'idle'
  | 'connecting'
  | 'analyzing'     // Öğrenci analizi yapılıyor
  | 'ready'
  | 'listening'
  | 'processing'
  | 'speaking'
  | 'error'

interface Message {
  role: 'user' | 'assistant'
  content: string
  persona?: PersonaType
}

interface StudentAnalysis {
  studentId: string
  studentName: string
  grade: number
  weakTopics: string[]
  strongTopics: string[]
  stats: {
    totalQuestions: number
    totalCorrect: number
    successRate: number
    currentStreak: number
  }
  recentActivity: {
    questionsLast7Days: number
    correctLast7Days: number
    avgDailyQuestions: number
  }
}

interface UseOpenAIChatOptions {
  studentName?: string
  studentId?: string
  grade?: number
  voice?: VoiceType
  speed?: number
  enableRAG?: boolean           // RAG aktif mi?
  enableAnalysis?: boolean      // Öğrenci analizi aktif mi?
  onTranscript?: (text: string, isUser: boolean) => void
  onStatusChange?: (status: ChatStatus) => void
  onPersonaChange?: (persona: PersonaType) => void
  onError?: (error: Error) => void
}

interface UseOpenAIChatReturn {
  status: ChatStatus
  isReady: boolean
  isListening: boolean
  isSpeaking: boolean
  volume: number
  messages: Message[]
  currentPersona: PersonaType
  studentAnalysis: StudentAnalysis | null
  connect: () => Promise<void>
  disconnect: () => void
  sendMessage: (text: string) => Promise<void>
  interrupt: () => void
  switchPersona: (persona: PersonaType) => void
  error: Error | null
}

export function useOpenAIChat(options: UseOpenAIChatOptions): UseOpenAIChatReturn {
  const {
    studentName = 'Öğrenci',
    studentId,
    grade = 8,
    voice: initialVoice = 'nova',
    speed = 1.0,
    enableRAG = true,
    enableAnalysis = true,
    onTranscript,
    onStatusChange,
    onPersonaChange,
    onError
  } = options
  
  // State
  const [status, setStatus] = useState<ChatStatus>('idle')
  const [volume, setVolume] = useState(0)
  const [error, setError] = useState<Error | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [currentPersona, setCurrentPersona] = useState<PersonaType>('energetic')
  const [studentAnalysis, setStudentAnalysis] = useState<StudentAnalysis | null>(null)
  const [currentVoice, setCurrentVoice] = useState<VoiceType>(initialVoice)
  
  // Refs
  const audioRef = useRef<HTMLAudioElement | null>(null)
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
  // PERSONA SWITCH
  // =====================================================
  const switchPersona = useCallback((persona: PersonaType) => {
    console.log(`🎭 [PERSONA] ${currentPersona} → ${persona}`)
    setCurrentPersona(persona)
    setCurrentVoice(PERSONAS[persona].voice)
    onPersonaChange?.(persona)
  }, [currentPersona, onPersonaChange])
  
  // =====================================================
  // FETCH STUDENT ANALYSIS (Typesense'ten)
  // =====================================================
  const fetchStudentAnalysis = useCallback(async (): Promise<StudentAnalysis | null> => {
    if (!studentId || !enableAnalysis) return null
    
    try {
      const response = await fetch(`/api/tekno-teacher/student-analysis?studentId=${studentId}`)
      
      if (!response.ok) {
        console.warn('⚠️ [ANALYSIS] API hatası')
        return null
      }
      
      const data = await response.json()
      return data.data || null
      
    } catch (err) {
      console.warn('⚠️ [ANALYSIS] Hata:', err)
      return null
    }
  }, [studentId, enableAnalysis])
  
  // =====================================================
  // PLAY AUDIO (OpenAI TTS)
  // =====================================================
  const playAudio = useCallback(async (base64Audio: string) => {
    console.log('🔊 [AUDIO] Çalınıyor...')
    
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
  // GET TTS AUDIO (Persona'ya göre ses)
  // =====================================================
  const getAudio = useCallback(async (text: string): Promise<string | null> => {
    try {
      const voiceSpeed = VOICE_SETTINGS[currentVoice]?.speed || speed
      
      const response = await fetch('/api/tekno-teacher/openai/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          text, 
          voice: currentVoice, 
          speed: voiceSpeed 
        })
      })
      
      if (!response.ok) {
        console.warn('⚠️ [TTS] API hatası')
        return null
      }
      
      const data = await response.json()
      return data.audio || null
      
    } catch (err) {
      console.warn('⚠️ [TTS] Hata:', err)
      return null
    }
  }, [currentVoice, speed])
  
  // =====================================================
  // SEND MESSAGE (RAG + Persona)
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
      // Persona seç (mesaj içeriğine göre)
      const selectedPersona = selectPersona({
        successRate: studentAnalysis?.stats.successRate,
        weakTopicMentioned: studentAnalysis?.weakTopics.some(
          topic => text.toLowerCase().includes(topic.toLowerCase())
        ),
        messageContent: text
      })
      
      // Persona değiştiyse güncelle
      if (selectedPersona !== currentPersona) {
        switchPersona(selectedPersona)
      }
      
      // GPT-4o-mini çağrısı (RAG + Analiz ile)
      const response = await fetch('/api/tekno-teacher/openai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          conversationHistory: messages.slice(-6),  // Son 6 mesaj
          studentName,
          studentId,
          grade,
          persona: selectedPersona,
          includeRAG: enableRAG,
          studentAnalysis: studentAnalysis ? {
            weakTopics: studentAnalysis.weakTopics,
            strongTopics: studentAnalysis.strongTopics,
            recentActivity: {
              questionsLast7Days: studentAnalysis.recentActivity.questionsLast7Days,
              successRate: studentAnalysis.stats.successRate
            }
          } : undefined
        }),
        signal: abortControllerRef.current.signal
      })
      
      if (!response.ok) throw new Error('API hatası')
      
      const data = await response.json()
      const responseText = data.text || `${studentName}, bir sorun oluştu!`
      
      // Persona'yı API'den gelen değerle güncelle
      if (data.persona && data.persona !== currentPersona) {
        switchPersona(data.persona)
      }
      
      // Sesi güncelle (API'den gelen voice)
      if (data.voice && data.voice !== currentVoice) {
        setCurrentVoice(data.voice)
      }
      
      console.log(`✅ [CHAT] Yanıt (${data.persona || currentPersona}):`, responseText.substring(0, 60))
      
      // Assistant mesajını ekle
      const assistantMessage: Message = { 
        role: 'assistant', 
        content: responseText,
        persona: data.persona || currentPersona
      }
      setMessages(prev => [...prev, assistantMessage])
      onTranscript?.(responseText, false)
      
      // TTS ile seslendir
      updateStatus('speaking')
      const audio = await getAudio(responseText)
      
      if (audio) {
        await playAudio(audio)
      } else {
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
  }, [
    messages, studentName, studentId, grade, currentPersona, currentVoice,
    studentAnalysis, enableRAG, updateStatus, switchPersona, getAudio, 
    playAudio, speakWithBrowserTTS, onTranscript, onError
  ])
  
  // =====================================================
  // CONNECT (Öğrenci analizi + Kişiselleştirilmiş karşılama)
  // =====================================================
  const connect = useCallback(async () => {
    console.log('🚀 [OPENAI] Oturum başlatılıyor...')
    
    setError(null)
    setMessages([])
    updateStatus('connecting')
    
    try {
      // 1. Öğrenci analizini çek (Typesense'ten)
      updateStatus('analyzing')
      const analysis = await fetchStudentAnalysis()
      
      if (analysis) {
        setStudentAnalysis(analysis)
        console.log('📊 [ANALYSIS] Öğrenci verisi alındı:', {
          weakTopics: analysis.weakTopics.slice(0, 3),
          successRate: analysis.stats.successRate
        })
        
        // Başlangıç persona'sını belirle
        const initialPersona = selectPersona({
          successRate: analysis.stats.successRate,
          isStruggling: analysis.weakTopics.length > 3
        })
        switchPersona(initialPersona)
      }
      
      // 2. Kişiselleştirilmiş karşılama mesajı al
      updateStatus('connecting')
      
      const greetingResponse = await fetch('/api/tekno-teacher/student-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId,
          studentName
        })
      })
      
      let greeting: string
      
      if (greetingResponse.ok) {
        const greetingData = await greetingResponse.json()
        greeting = greetingData.greeting || `Merhaba ${studentName}! Bugün harika bir ders işleyeceğiz!`
      } else {
        // Fallback selamlama
        greeting = `Merhaba ${studentName}! Ben TeknoÖğretmen, senin kişisel ders asistanın. Bugün sana nasıl yardımcı olabilirim?`
      }
      
      // Selamlamayı ekle
      setMessages([{ role: 'assistant', content: greeting, persona: currentPersona }])
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
      setMessages([{ role: 'assistant', content: fallbackGreeting }])
      onTranscript?.(fallbackGreeting, false)
      speakWithBrowserTTS(fallbackGreeting)
    }
  }, [
    studentName, studentId, currentPersona, updateStatus, fetchStudentAnalysis, 
    switchPersona, getAudio, playAudio, speakWithBrowserTTS, onTranscript, onError
  ])
  
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
    setStudentAnalysis(null)
    setStatus('idle')
  }, [])
  
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
    setStatus('ready')
  }, [])
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort()
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
      window.speechSynthesis?.cancel()
      isPlayingRef.current = false
    }
  }, [])
  
  return {
    status,
    isReady: ['ready', 'listening', 'processing', 'speaking'].includes(status),
    isListening: status === 'listening',
    isSpeaking: status === 'speaking',
    volume,
    messages,
    currentPersona,
    studentAnalysis,
    connect,
    disconnect,
    sendMessage,
    interrupt,
    switchPersona,
    error
  }
}

export default useOpenAIChat
