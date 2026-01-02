'use client'

/**
 * useGeminiLive Hook
 * Gemini 2.5 Flash Live API ile gerçek zamanlı sesli sohbet
 * Server-side proxy üzerinden bağlanır (CORS sorunu yok)
 * 
 * Özellikler:
 * - Server-side streaming (SSE)
 * - Native audio output
 * - Mikrofon input
 * - VAD (Voice Activity Detection)
 */

import { useState, useRef, useCallback, useEffect } from 'react'

// Types
export type GeminiLiveStatus = 
  | 'idle'
  | 'connecting'
  | 'connected'
  | 'listening'
  | 'speaking'
  | 'processing'
  | 'error'

interface UseGeminiLiveOptions {
  studentName: string
  grade: number
  personality?: 'friendly' | 'strict' | 'motivating'
  voice?: string
  onTranscript?: (text: string, isUser: boolean) => void
  onAudioReceived?: (audioData: string, mimeType: string) => void
  onStatusChange?: (status: GeminiLiveStatus) => void
  onError?: (error: Error) => void
}

interface UseGeminiLiveReturn {
  status: GeminiLiveStatus
  isConnected: boolean
  isListening: boolean
  isSpeaking: boolean
  volume: number
  connect: () => Promise<void>
  disconnect: () => void
  sendText: (text: string) => Promise<void>
  sendAudio: (audioData: string) => Promise<void>
  interrupt: () => void
  error: Error | null
}

export function useGeminiLive(options: UseGeminiLiveOptions): UseGeminiLiveReturn {
  const {
    studentName,
    grade,
    personality = 'friendly',
    voice = 'Kore',
    onTranscript,
    onAudioReceived,
    onStatusChange,
    onError
  } = options
  
  // State
  const [status, setStatus] = useState<GeminiLiveStatus>('idle')
  const [volume, setVolume] = useState(0)
  const [error, setError] = useState<Error | null>(null)
  
  // Refs
  const abortControllerRef = useRef<AbortController | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const audioQueueRef = useRef<string[]>([])
  const isPlayingRef = useRef(false)
  const mediaStreamRef = useRef<MediaStream | null>(null)
  
  // Status değişikliğini bildir
  const updateStatus = useCallback((newStatus: GeminiLiveStatus) => {
    setStatus(newStatus)
    onStatusChange?.(newStatus)
  }, [onStatusChange])
  
  // Audio context oluştur
  const initAudioContext = useCallback(async () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext({ sampleRate: 24000 })
    }
    
    if (audioContextRef.current.state === 'suspended') {
      await audioContextRef.current.resume()
    }
    
    return audioContextRef.current
  }, [])
  
  // Audio chunk'ı çal
  const playAudioChunk = useCallback(async (base64Audio: string, mimeType: string) => {
    try {
      const ctx = await initAudioContext()
      
      // Base64 -> ArrayBuffer
      const binaryString = atob(base64Audio)
      const bytes = new Uint8Array(binaryString.length)
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i)
      }
      
      // Sample rate'i mime type'dan al
      const sampleRate = mimeType.includes('24000') ? 24000 : 16000
      
      // PCM 16-bit -> Float32
      const pcmData = new Int16Array(bytes.buffer)
      const floatData = new Float32Array(pcmData.length)
      for (let i = 0; i < pcmData.length; i++) {
        floatData[i] = pcmData[i] / 32768
      }
      
      // AudioBuffer oluştur
      const audioBuffer = ctx.createBuffer(1, floatData.length, sampleRate)
      audioBuffer.getChannelData(0).set(floatData)
      
      // Çal
      const source = ctx.createBufferSource()
      source.buffer = audioBuffer
      source.connect(ctx.destination)
      
      source.onended = () => {
        isPlayingRef.current = false
        setVolume(0)
        // Queue'da başka ses varsa çal
        if (audioQueueRef.current.length > 0) {
          const next = audioQueueRef.current.shift()
          if (next) playAudioChunk(next, mimeType)
        } else {
          updateStatus('listening')
        }
      }
      
      isPlayingRef.current = true
      source.start()
      
      // Volume simülasyonu
      const volumeInterval = setInterval(() => {
        if (isPlayingRef.current) {
          setVolume(0.3 + Math.random() * 0.5)
        } else {
          clearInterval(volumeInterval)
        }
      }, 100)
      
    } catch (err) {
      console.error('Audio playback error:', err)
    }
  }, [initAudioContext, updateStatus])
  
  // Server-side streaming ile Gemini'ye bağlan
  const streamRequest = useCallback(async (message: string, isAudio: boolean = false) => {
    abortControllerRef.current?.abort()
    abortControllerRef.current = new AbortController()
    
    updateStatus(isAudio ? 'processing' : 'processing')
    
    try {
      const response = await fetch('/api/tekno-teacher/live/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: isAudio ? 'audio' : 'text',
          studentName,
          grade,
          personality,
          voice,
          [isAudio ? 'audioData' : 'textMessage']: message
        }),
        signal: abortControllerRef.current.signal
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Stream hatası')
      }
      
      // SSE stream'i oku
      const reader = response.body?.getReader()
      if (!reader) throw new Error('Stream okunamadı')
      
      const decoder = new TextDecoder()
      let buffer = ''
      let fullText = ''
      
      updateStatus('speaking')
      
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        
        buffer += decoder.decode(value, { stream: true })
        
        // SSE satırlarını parse et
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))
              
              if (data.type === 'text') {
                fullText += data.content
                onTranscript?.(data.content, false)
              }
              
              if (data.type === 'audio') {
                onAudioReceived?.(data.data, data.mimeType)
                
                // Audio'yu queue'a ekle veya çal
                if (isPlayingRef.current) {
                  audioQueueRef.current.push(data.data)
                } else {
                  playAudioChunk(data.data, data.mimeType)
                }
              }
              
              if (data.type === 'error') {
                throw new Error(data.message)
              }
              
              if (data.type === 'done') {
                console.log('✅ Stream tamamlandı')
                if (!isPlayingRef.current) {
                  updateStatus('listening')
                }
              }
              
            } catch (e) {
              // JSON parse hatası - devam et
            }
          }
        }
      }
      
      return fullText
      
    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.log('Stream iptal edildi')
        return
      }
      console.error('Stream error:', err)
      setError(err)
      onError?.(err)
      updateStatus('error')
      throw err
    }
  }, [studentName, grade, personality, voice, updateStatus, playAudioChunk, onTranscript, onAudioReceived, onError])
  
  // Bağlantıyı başlat
  const connect = useCallback(async () => {
    updateStatus('connecting')
    setError(null)
    
    try {
      // Hoşgeldin mesajı gönder
      await streamRequest(`Merhaba, ben ${studentName}. Benim öğretmenim ol!`, false)
      updateStatus('listening')
      
      // Mikrofonu başlat
      await startMicrophone()
      
    } catch (err: any) {
      console.error('Connect error:', err)
      setError(err)
      onError?.(err)
      updateStatus('error')
    }
  }, [studentName, streamRequest, updateStatus, onError])
  
  // Mikrofonu başlat (STT için)
  const startMicrophone = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      })
      
      mediaStreamRef.current = stream
      console.log('🎤 Mikrofon başlatıldı')
      
    } catch (err: any) {
      console.error('Microphone error:', err)
      const error = new Error('Mikrofon erişimi reddedildi')
      setError(error)
      onError?.(error)
    }
  }, [onError])
  
  // Mikrofonu durdur
  const stopMicrophone = useCallback(() => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop())
      mediaStreamRef.current = null
    }
    console.log('🔇 Mikrofon durduruldu')
  }, [])
  
  // Bağlantıyı kes
  const disconnect = useCallback(() => {
    abortControllerRef.current?.abort()
    stopMicrophone()
    
    if (audioContextRef.current) {
      audioContextRef.current.close()
      audioContextRef.current = null
    }
    
    audioQueueRef.current = []
    isPlayingRef.current = false
    updateStatus('idle')
    setVolume(0)
    console.log('🔌 Bağlantı kapatıldı')
  }, [stopMicrophone, updateStatus])
  
  // Metin gönder
  const sendText = useCallback(async (text: string) => {
    if (!text.trim()) return
    onTranscript?.(text, true)
    await streamRequest(text, false)
  }, [streamRequest, onTranscript])
  
  // Audio gönder (base64)
  const sendAudio = useCallback(async (audioData: string) => {
    await streamRequest(audioData, true)
  }, [streamRequest])
  
  // Konuşmayı kes
  const interrupt = useCallback(() => {
    abortControllerRef.current?.abort()
    isPlayingRef.current = false
    audioQueueRef.current = []
    setVolume(0)
    updateStatus('listening')
  }, [updateStatus])
  
  // Cleanup
  useEffect(() => {
    return () => {
      disconnect()
    }
  }, [disconnect])
  
  return {
    status,
    isConnected: ['connected', 'listening', 'speaking', 'processing'].includes(status),
    isListening: status === 'listening',
    isSpeaking: status === 'speaking',
    volume,
    connect,
    disconnect,
    sendText,
    sendAudio,
    interrupt,
    error
  }
}

export default useGeminiLive
