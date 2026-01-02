'use client'

/**
 * useLiveChat Hook
 * Gemini Live API ile gerçek zamanlı sesli sohbet
 * 
 * Özellikler:
 * - WebSocket streaming
 * - Mikrofon input
 * - Audio output (düşük gecikme)
 * - VAD (Voice Activity Detection)
 * - Interruption (konuşurken kesme)
 */

import { useState, useRef, useCallback, useEffect } from 'react'

interface UseLiveChatOptions {
  studentName: string
  grade: number
  personality?: 'friendly' | 'strict' | 'motivating'
  voice?: string
  onTranscript?: (text: string, isUser: boolean) => void
  onStatusChange?: (status: LiveStatus) => void
  onError?: (error: Error) => void
}

export type LiveStatus = 
  | 'idle'           // Beklemede
  | 'connecting'     // Bağlanıyor
  | 'listening'      // Dinliyor (mikrofon açık)
  | 'processing'     // İşleniyor
  | 'speaking'       // Konuşuyor (AI)
  | 'interrupted'    // Kesildi
  | 'error'          // Hata

interface UseLiveChatReturn {
  // State
  status: LiveStatus
  isConnected: boolean
  isListening: boolean
  isSpeaking: boolean
  volume: number
  
  // Actions
  connect: () => Promise<void>
  disconnect: () => void
  startListening: () => void
  stopListening: () => void
  interrupt: () => void // Konuşmayı kes
  
  // Info
  error: Error | null
}

export function useLiveChat(options: UseLiveChatOptions): UseLiveChatReturn {
  const {
    studentName,
    grade,
    personality = 'friendly',
    voice = 'Kore',
    onTranscript,
    onStatusChange,
    onError
  } = options
  
  // State
  const [status, setStatus] = useState<LiveStatus>('idle')
  const [isConnected, setIsConnected] = useState(false)
  const [volume, setVolume] = useState(0)
  const [error, setError] = useState<Error | null>(null)
  
  // Refs
  const sessionRef = useRef<any>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const mediaStreamRef = useRef<MediaStream | null>(null)
  const processorRef = useRef<ScriptProcessorNode | null>(null)
  const audioQueueRef = useRef<ArrayBuffer[]>([])
  const isPlayingRef = useRef(false)
  
  // Status değişikliğini bildir
  useEffect(() => {
    onStatusChange?.(status)
  }, [status, onStatusChange])
  
  // Cleanup
  useEffect(() => {
    return () => {
      disconnect()
    }
  }, [])
  
  // Audio context oluştur
  const initAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: 24000 // Gemini output sample rate
      })
    }
    return audioContextRef.current
  }, [])
  
  // Gelen sesi çal (streaming)
  const playAudioChunk = useCallback(async (audioData: ArrayBuffer) => {
    const ctx = initAudioContext()
    
    try {
      // PCM to AudioBuffer
      const audioBuffer = ctx.createBuffer(1, audioData.byteLength / 2, 24000)
      const channelData = audioBuffer.getChannelData(0)
      const view = new DataView(audioData)
      
      for (let i = 0; i < channelData.length; i++) {
        channelData[i] = view.getInt16(i * 2, true) / 32768
      }
      
      // Çal
      const source = ctx.createBufferSource()
      source.buffer = audioBuffer
      source.connect(ctx.destination)
      source.start()
      
      // Volume için analiz
      const analyser = ctx.createAnalyser()
      source.connect(analyser)
      analyser.fftSize = 256
      const dataArray = new Uint8Array(analyser.frequencyBinCount)
      
      const updateVolume = () => {
        if (status === 'speaking') {
          analyser.getByteFrequencyData(dataArray)
          const avg = dataArray.reduce((a, b) => a + b) / dataArray.length
          setVolume(avg / 255)
          requestAnimationFrame(updateVolume)
        }
      }
      updateVolume()
      
    } catch (err) {
      console.error('Audio playback error:', err)
    }
  }, [initAudioContext, status])
  
  // Gemini Live'a bağlan
  const connect = useCallback(async () => {
    if (isConnected) return
    
    setStatus('connecting')
    setError(null)
    
    try {
      // Server'dan session token al
      const res = await fetch('/api/tekno-teacher/live/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentName,
          grade,
          personality,
          voice
        })
      })
      
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Bağlantı hatası')
      }
      
      const { sessionId, wsUrl, token } = await res.json()
      
      // WebSocket bağlantısı
      const ws = new WebSocket(wsUrl)
      
      ws.onopen = () => {
        console.log('🔗 Gemini Live bağlantısı kuruldu')
        setIsConnected(true)
        setStatus('listening')
        
        // Auth token gönder
        ws.send(JSON.stringify({ type: 'auth', token }))
      }
      
      ws.onmessage = async (event) => {
        const data = JSON.parse(event.data)
        
        switch (data.type) {
          case 'audio':
            // Streaming audio chunk
            setStatus('speaking')
            const audioBuffer = base64ToArrayBuffer(data.audio)
            await playAudioChunk(audioBuffer)
            break
            
          case 'transcript':
            // Metin transkripti
            onTranscript?.(data.text, data.isUser)
            break
            
          case 'end':
            // Yanıt bitti
            setStatus('listening')
            setVolume(0)
            break
            
          case 'error':
            throw new Error(data.message)
        }
      }
      
      ws.onerror = (event) => {
        console.error('WebSocket error:', event)
        setError(new Error('WebSocket bağlantı hatası'))
        setStatus('error')
      }
      
      ws.onclose = () => {
        console.log('🔌 Gemini Live bağlantısı kapandı')
        setIsConnected(false)
        setStatus('idle')
      }
      
      sessionRef.current = { ws, sessionId }
      
      // Mikrofonu başlat
      await startMicrophone()
      
    } catch (err: any) {
      console.error('Connect error:', err)
      setError(err)
      setStatus('error')
      onError?.(err)
    }
  }, [isConnected, studentName, grade, personality, voice, playAudioChunk, onTranscript, onError])
  
  // Mikrofonu başlat
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
      const ctx = initAudioContext()
      
      // 16kHz'e resample
      const source = ctx.createMediaStreamSource(stream)
      const processor = ctx.createScriptProcessor(4096, 1, 1)
      
      processor.onaudioprocess = (e) => {
        if (status !== 'listening') return
        
        const inputData = e.inputBuffer.getChannelData(0)
        
        // VAD - Ses var mı kontrol et
        let sum = 0
        for (let i = 0; i < inputData.length; i++) {
          sum += inputData[i] * inputData[i]
        }
        const rms = Math.sqrt(sum / inputData.length)
        const hasVoice = rms > 0.01 // Eşik değer
        
        if (hasVoice && sessionRef.current?.ws) {
          // PCM'e dönüştür ve gönder
          const buffer = new ArrayBuffer(inputData.length * 2)
          const view = new DataView(buffer)
          for (let i = 0; i < inputData.length; i++) {
            const s = Math.max(-1, Math.min(1, inputData[i]))
            view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7FFF, true)
          }
          
          sessionRef.current.ws.send(JSON.stringify({
            type: 'audio',
            audio: arrayBufferToBase64(buffer)
          }))
        }
      }
      
      source.connect(processor)
      processor.connect(ctx.destination)
      processorRef.current = processor
      
      console.log('🎤 Mikrofon başlatıldı')
      
    } catch (err: any) {
      console.error('Microphone error:', err)
      throw new Error('Mikrofon erişimi reddedildi')
    }
  }, [initAudioContext, status])
  
  // Bağlantıyı kes
  const disconnect = useCallback(() => {
    if (sessionRef.current?.ws) {
      sessionRef.current.ws.close()
      sessionRef.current = null
    }
    
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop())
      mediaStreamRef.current = null
    }
    
    if (processorRef.current) {
      processorRef.current.disconnect()
      processorRef.current = null
    }
    
    if (audioContextRef.current) {
      audioContextRef.current.close()
      audioContextRef.current = null
    }
    
    setIsConnected(false)
    setStatus('idle')
    setVolume(0)
    console.log('🔌 Bağlantı kapatıldı')
  }, [])
  
  // Dinlemeyi başlat
  const startListening = useCallback(() => {
    if (isConnected && status !== 'listening') {
      setStatus('listening')
    }
  }, [isConnected, status])
  
  // Dinlemeyi durdur
  const stopListening = useCallback(() => {
    if (status === 'listening') {
      setStatus('idle')
    }
  }, [status])
  
  // Konuşmayı kes (Interruption)
  const interrupt = useCallback(() => {
    if (status === 'speaking' && sessionRef.current?.ws) {
      sessionRef.current.ws.send(JSON.stringify({ type: 'interrupt' }))
      setStatus('interrupted')
      setVolume(0)
      
      // Kısa süre sonra dinlemeye geç
      setTimeout(() => setStatus('listening'), 100)
    }
  }, [status])
  
  return {
    status,
    isConnected,
    isListening: status === 'listening',
    isSpeaking: status === 'speaking',
    volume,
    connect,
    disconnect,
    startListening,
    stopListening,
    interrupt,
    error
  }
}

// Yardımcı fonksiyonlar
function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = atob(base64)
  const bytes = new Uint8Array(binaryString.length)
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i)
  }
  return bytes.buffer
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

export default useLiveChat
