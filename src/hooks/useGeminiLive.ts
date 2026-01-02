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
  const reconnectAttempts = useRef(0)
  const maxReconnectAttempts = 3
  const isSessionActive = useRef(false)
  
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
    
    console.log('🔵 [HOOK] Stream request başlıyor:', { message: message.substring(0, 50), isAudio })
    updateStatus('processing')
    
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
      
      console.log('📡 [HOOK] API yanıtı:', response.status, response.statusText)
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Bilinmeyen hata' }))
        console.error('❌ [HOOK] API hatası:', errorData)
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }
      
      // SSE stream'i oku
      const reader = response.body?.getReader()
      if (!reader) throw new Error('Stream okunamadı')
      
      const decoder = new TextDecoder()
      let buffer = ''
      let fullText = ''
      let lastHeartbeat = Date.now()
      
      updateStatus('speaking')
      
      while (true) {
        const { done, value } = await reader.read()
        
        if (done) {
          console.log('✅ [HOOK] Stream tamamlandı, toplam metin:', fullText.length, 'karakter')
          break
        }
        
        buffer += decoder.decode(value, { stream: true })
        
        // SSE satırlarını parse et
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))
              
              // Heartbeat - bağlantı canlı
              if (data.type === 'heartbeat') {
                lastHeartbeat = Date.now()
                console.log('💓 [HOOK] Heartbeat alındı')
                continue
              }
              
              // Bağlantı onayı
              if (data.type === 'connected') {
                console.log('🟢 [HOOK] Bağlantı onaylandı:', data.studentName)
                reconnectAttempts.current = 0 // Reset reconnect counter
                continue
              }
              
              // Metin chunk'ı
              if (data.type === 'text') {
                fullText += data.content
                console.log('📝 [HOOK] Text chunk:', data.chunk, '-', data.content.substring(0, 30))
                onTranscript?.(data.content, false)
              }
              
              // Audio chunk'ı
              if (data.type === 'audio') {
                console.log('🔊 [HOOK] Audio chunk alındı')
                onAudioReceived?.(data.data, data.mimeType)
                
                // Audio'yu queue'a ekle veya çal
                if (isPlayingRef.current) {
                  audioQueueRef.current.push(data.data)
                } else {
                  playAudioChunk(data.data, data.mimeType)
                }
              }
              
              // Hata
              if (data.type === 'error') {
                console.error('❌ [HOOK] Server error:', data.code, data.message)
                throw new Error(`[${data.code || 'ERR'}] ${data.message}`)
              }
              
              // Tamamlandı
              if (data.type === 'done') {
                console.log('✅ [HOOK] Done sinyali, chunks:', data.totalChunks)
                if (!isPlayingRef.current && isSessionActive.current) {
                  updateStatus('listening')
                }
              }
              
            } catch (e: any) {
              if (e.message?.includes('[')) {
                throw e // Re-throw server errors
              }
              console.warn('⚠️ [HOOK] JSON parse hatası')
            }
          }
        }
        
        // Heartbeat timeout kontrolü (30 saniye)
        if (Date.now() - lastHeartbeat > 30000) {
          console.warn('⚠️ [HOOK] Heartbeat timeout!')
          break
        }
      }
      
      return fullText
      
    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.log('🛑 [HOOK] Stream iptal edildi')
        return
      }
      
      console.error('❌ [HOOK] Stream error:', err.message)
      setError(err)
      onError?.(err)
      
      // Yeniden bağlanma denemesi
      if (isSessionActive.current && reconnectAttempts.current < maxReconnectAttempts) {
        reconnectAttempts.current++
        console.log(`🔄 [HOOK] Yeniden bağlanma denemesi ${reconnectAttempts.current}/${maxReconnectAttempts}`)
        updateStatus('connecting')
        
        // 2 saniye bekle ve tekrar dene
        await new Promise(resolve => setTimeout(resolve, 2000))
        
        if (isSessionActive.current) {
          return streamRequest(message, isAudio)
        }
      } else {
        updateStatus('error')
      }
      
      throw err
    }
  }, [studentName, grade, personality, voice, updateStatus, playAudioChunk, onTranscript, onAudioReceived, onError])
  
  // Mikrofonu başlat (STT için)
  const startMicrophone = useCallback(async () => {
    // Zaten aktifse tekrar başlatma
    if (mediaStreamRef.current) {
      const tracks = mediaStreamRef.current.getTracks()
      const activeTracks = tracks.filter(t => t.readyState === 'live')
      if (activeTracks.length > 0) {
        console.log('🎤 [MIC] Mikrofon zaten aktif')
        return true
      }
    }
    
    try {
      console.log('🎤 [MIC] Mikrofon başlatılıyor...')
      
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      })
      
      // Track ended event'i dinle
      stream.getTracks().forEach(track => {
        track.onended = () => {
          console.warn('⚠️ [MIC] Track sonlandı:', track.label)
          
          // Oturum aktifse yeniden başlat
          if (isSessionActive.current) {
            console.log('🔄 [MIC] Otomatik yeniden başlatma...')
            setTimeout(() => {
              if (isSessionActive.current) {
                startMicrophone()
              }
            }, 1000)
          }
        }
        
        track.onmute = () => {
          console.warn('🔇 [MIC] Track susturuldu')
        }
        
        track.onunmute = () => {
          console.log('🔊 [MIC] Track tekrar aktif')
        }
      })
      
      mediaStreamRef.current = stream
      console.log('✅ [MIC] Mikrofon başlatıldı')
      return true
      
    } catch (err: any) {
      console.error('❌ [MIC] Mikrofon hatası:', err.name, err.message)
      
      // Hata türüne göre mesaj
      let errorMessage = 'Mikrofon erişimi reddedildi'
      if (err.name === 'NotAllowedError') {
        errorMessage = 'Mikrofon izni verilmedi. Lütfen tarayıcı ayarlarından izin verin.'
      } else if (err.name === 'NotFoundError') {
        errorMessage = 'Mikrofon bulunamadı. Lütfen bir mikrofon bağlayın.'
      } else if (err.name === 'NotReadableError') {
        errorMessage = 'Mikrofon kullanılamıyor. Başka bir uygulama kullanıyor olabilir.'
      }
      
      const error = new Error(errorMessage)
      setError(error)
      onError?.(error)
      return false
    }
  }, [onError])
  
  // Mikrofonu durdur
  const stopMicrophone = useCallback(() => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => {
        track.onended = null
        track.onmute = null
        track.onunmute = null
        track.stop()
      })
      mediaStreamRef.current = null
      console.log('🔇 [MIC] Mikrofon durduruldu')
    }
  }, [])
  
  // Bağlantıyı başlat
  const connect = useCallback(async () => {
    console.log('🚀 [HOOK] Bağlantı başlatılıyor...')
    
    updateStatus('connecting')
    setError(null)
    isSessionActive.current = true
    reconnectAttempts.current = 0
    
    try {
      // Önce mikrofonu başlat
      const micStarted = await startMicrophone()
      if (!micStarted) {
        console.warn('⚠️ [HOOK] Mikrofon başlatılamadı, sadece metin ile devam ediliyor')
      }
      
      // Hoşgeldin mesajı gönder
      console.log('📤 [HOOK] Hoşgeldin mesajı gönderiliyor...')
      await streamRequest(`Merhaba, ben ${studentName}. Benim ${grade}. sınıf öğretmenim ol!`, false)
      
      console.log('✅ [HOOK] Bağlantı başarılı')
      updateStatus('listening')
      
    } catch (err: any) {
      console.error('❌ [HOOK] Bağlantı hatası:', err.message)
      isSessionActive.current = false
      setError(err)
      onError?.(err)
      updateStatus('error')
    }
  }, [studentName, grade, streamRequest, startMicrophone, updateStatus, onError])
  
  // Bağlantıyı kes
  const disconnect = useCallback(() => {
    console.log('🔌 [HOOK] Bağlantı kapatılıyor...')
    
    isSessionActive.current = false
    reconnectAttempts.current = 0
    
    abortControllerRef.current?.abort()
    abortControllerRef.current = null
    
    stopMicrophone()
    
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {})
      audioContextRef.current = null
    }
    
    audioQueueRef.current = []
    isPlayingRef.current = false
    
    updateStatus('idle')
    setVolume(0)
    setError(null)
    
    console.log('✅ [HOOK] Bağlantı kapatıldı')
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
