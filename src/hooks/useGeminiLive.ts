'use client'

/**
 * useGeminiLive Hook
 * Gemini 2.5 Flash Live API ile gerçek zamanlı sesli sohbet
 * 
 * Özellikler:
 * - Native audio streaming (düşük gecikme)
 * - Bidirectional audio (mikrofon + speaker)
 * - VAD (Voice Activity Detection)
 * - Interruption desteği
 */

import { useState, useRef, useCallback, useEffect } from 'react'

// Types
export type GeminiLiveStatus = 
  | 'idle'
  | 'connecting'
  | 'connected'
  | 'listening'
  | 'speaking'
  | 'error'
  | 'disconnected'

interface UseGeminiLiveOptions {
  apiKey: string
  studentName: string
  grade: number
  personality?: 'friendly' | 'strict' | 'motivating'
  voice?: string
  onTranscript?: (text: string, isUser: boolean) => void
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
  sendAudio: (audioData: ArrayBuffer) => void
  interrupt: () => void
  error: Error | null
}

// Gemini Live API WebSocket URL
const GEMINI_LIVE_WS_URL = 'wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent'

/**
 * System instruction builder
 */
function buildSystemInstruction(studentName: string, grade: number, personality: string): string {
  const name = studentName || 'Öğrenci'
  
  const tones: Record<string, string> = {
    friendly: 'samimi, sıcak ve arkadaş canlısı',
    strict: 'disiplinli ama adil',
    motivating: 'enerjik ve motive edici'
  }
  
  return `Sen TeknoÖğretmen'sin - ${name}'in özel ders öğretmeni.

ÖĞRENCİ: ${name}, ${grade}. sınıf
KİŞİLİĞİN: ${tones[personality] || tones.friendly}

KONUŞMA KURALLARIN:
1. HER cümlene "${name}" diye başla
2. Kısa konuş (max 2-3 cümle)
3. Her yanıtta soru sor
4. Doğrudan cevap verme, düşündür
5. Türkçe konuş, samimi ol

Örnek: "${name}, harika soru! Şimdi düşün: Bir pizza 8 dilime bölündü, 3 dilim yedin. Ne kadar pizza yemiş oldun?"`
}

export function useGeminiLive(options: UseGeminiLiveOptions): UseGeminiLiveReturn {
  const {
    apiKey,
    studentName,
    grade,
    personality = 'friendly',
    voice = 'Kore',
    onTranscript,
    onStatusChange,
    onError
  } = options
  
  // State
  const [status, setStatus] = useState<GeminiLiveStatus>('idle')
  const [volume, setVolume] = useState(0)
  const [error, setError] = useState<Error | null>(null)
  
  // Refs
  const wsRef = useRef<WebSocket | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const mediaStreamRef = useRef<MediaStream | null>(null)
  const workletNodeRef = useRef<AudioWorkletNode | null>(null)
  const audioQueueRef = useRef<ArrayBuffer[]>([])
  const isPlayingRef = useRef(false)
  
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
    
    // Resume if suspended
    if (audioContextRef.current.state === 'suspended') {
      await audioContextRef.current.resume()
    }
    
    return audioContextRef.current
  }, [])
  
  // Gelen audio'yu çal (streaming)
  const playAudioChunk = useCallback(async (base64Audio: string) => {
    try {
      const ctx = await initAudioContext()
      
      // Base64 -> ArrayBuffer
      const binaryString = atob(base64Audio)
      const bytes = new Uint8Array(binaryString.length)
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i)
      }
      
      // PCM 16-bit -> Float32
      const pcmData = new Int16Array(bytes.buffer)
      const floatData = new Float32Array(pcmData.length)
      for (let i = 0; i < pcmData.length; i++) {
        floatData[i] = pcmData[i] / 32768
      }
      
      // AudioBuffer oluştur
      const audioBuffer = ctx.createBuffer(1, floatData.length, 24000)
      audioBuffer.getChannelData(0).set(floatData)
      
      // Çal
      const source = ctx.createBufferSource()
      source.buffer = audioBuffer
      source.connect(ctx.destination)
      
      // Volume analizi
      const analyser = ctx.createAnalyser()
      source.connect(analyser)
      analyser.fftSize = 256
      
      source.onended = () => {
        setVolume(0)
      }
      
      source.start()
      
      // Volume güncelle
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
  
  // WebSocket'e bağlan
  const connect = useCallback(async () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      console.log('Already connected')
      return
    }
    
    updateStatus('connecting')
    setError(null)
    
    try {
      // WebSocket URL with API key
      const wsUrl = `${GEMINI_LIVE_WS_URL}?key=${apiKey}`
      const ws = new WebSocket(wsUrl)
      
      ws.onopen = () => {
        console.log('🔗 Gemini Live WebSocket connected')
        
        // Setup message gönder
        const setupMessage = {
          setup: {
            model: 'models/gemini-2.5-flash-native-audio-preview-12-2025',
            generationConfig: {
              responseModalities: ['AUDIO'],
              speechConfig: {
                voiceConfig: {
                  prebuiltVoiceConfig: {
                    voiceName: voice
                  }
                }
              }
            },
            systemInstruction: {
              parts: [{
                text: buildSystemInstruction(studentName, grade, personality)
              }]
            }
          }
        }
        
        ws.send(JSON.stringify(setupMessage))
        updateStatus('connected')
        
        // Mikrofonu başlat
        startMicrophone()
      }
      
      ws.onmessage = async (event) => {
        try {
          const data = JSON.parse(event.data)
          
          // Setup response
          if (data.setupComplete) {
            console.log('✅ Gemini Live setup complete')
            updateStatus('listening')
            return
          }
          
          // Server content (AI yanıtı)
          if (data.serverContent?.modelTurn?.parts) {
            updateStatus('speaking')
            
            for (const part of data.serverContent.modelTurn.parts) {
              // Audio data
              if (part.inlineData?.mimeType?.startsWith('audio/')) {
                await playAudioChunk(part.inlineData.data)
              }
              
              // Text transcript
              if (part.text) {
                onTranscript?.(part.text, false)
              }
            }
            
            // Turn complete
            if (data.serverContent.turnComplete) {
              updateStatus('listening')
            }
          }
          
          // User transcript
          if (data.serverContent?.inputTranscript) {
            onTranscript?.(data.serverContent.inputTranscript, true)
          }
          
        } catch (err) {
          console.error('Message parse error:', err)
        }
      }
      
      ws.onerror = (event) => {
        console.error('WebSocket error:', event)
        const err = new Error('WebSocket bağlantı hatası')
        setError(err)
        onError?.(err)
        updateStatus('error')
      }
      
      ws.onclose = (event) => {
        console.log('WebSocket closed:', event.code, event.reason)
        updateStatus('disconnected')
        stopMicrophone()
      }
      
      wsRef.current = ws
      
    } catch (err: any) {
      console.error('Connect error:', err)
      setError(err)
      onError?.(err)
      updateStatus('error')
    }
  }, [apiKey, studentName, grade, personality, voice, updateStatus, playAudioChunk, onTranscript, onError])
  
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
      const ctx = await initAudioContext()
      
      // MediaStreamSource
      const source = ctx.createMediaStreamSource(stream)
      
      // ScriptProcessor (AudioWorklet'e geçilecek)
      const processor = ctx.createScriptProcessor(4096, 1, 1)
      
      processor.onaudioprocess = (e) => {
        if (status !== 'listening' || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
          return
        }
        
        const inputData = e.inputBuffer.getChannelData(0)
        
        // Resample 24kHz -> 16kHz
        const resampledLength = Math.floor(inputData.length * 16000 / ctx.sampleRate)
        const resampledData = new Float32Array(resampledLength)
        
        for (let i = 0; i < resampledLength; i++) {
          const srcIndex = Math.floor(i * ctx.sampleRate / 16000)
          resampledData[i] = inputData[srcIndex] || 0
        }
        
        // Float32 -> PCM 16-bit
        const pcmData = new Int16Array(resampledData.length)
        for (let i = 0; i < resampledData.length; i++) {
          const s = Math.max(-1, Math.min(1, resampledData[i]))
          pcmData[i] = s < 0 ? s * 0x8000 : s * 0x7FFF
        }
        
        // Base64'e çevir
        const bytes = new Uint8Array(pcmData.buffer)
        let binary = ''
        for (let i = 0; i < bytes.byteLength; i++) {
          binary += String.fromCharCode(bytes[i])
        }
        const base64Audio = btoa(binary)
        
        // Gemini'ye gönder
        const message = {
          realtimeInput: {
            mediaChunks: [{
              mimeType: 'audio/pcm;rate=16000',
              data: base64Audio
            }]
          }
        }
        
        wsRef.current.send(JSON.stringify(message))
      }
      
      source.connect(processor)
      processor.connect(ctx.destination)
      
      console.log('🎤 Mikrofon başlatıldı')
      
    } catch (err: any) {
      console.error('Microphone error:', err)
      const error = new Error('Mikrofon erişimi reddedildi')
      setError(error)
      onError?.(error)
    }
  }, [initAudioContext, status, onError])
  
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
    stopMicrophone()
    
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }
    
    if (audioContextRef.current) {
      audioContextRef.current.close()
      audioContextRef.current = null
    }
    
    updateStatus('idle')
    setVolume(0)
    console.log('🔌 Bağlantı kapatıldı')
  }, [stopMicrophone, updateStatus])
  
  // Manuel audio gönder
  const sendAudio = useCallback((audioData: ArrayBuffer) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      console.warn('WebSocket not connected')
      return
    }
    
    const bytes = new Uint8Array(audioData)
    let binary = ''
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i])
    }
    const base64Audio = btoa(binary)
    
    wsRef.current.send(JSON.stringify({
      realtimeInput: {
        mediaChunks: [{
          mimeType: 'audio/pcm;rate=16000',
          data: base64Audio
        }]
      }
    }))
  }, [])
  
  // Konuşmayı kes (Interruption)
  const interrupt = useCallback(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      // Boş audio göndererek kesme
      wsRef.current.send(JSON.stringify({
        realtimeInput: {
          mediaChunks: [{
            mimeType: 'audio/pcm;rate=16000',
            data: ''
          }]
        }
      }))
      updateStatus('listening')
      setVolume(0)
    }
  }, [updateStatus])
  
  // Cleanup
  useEffect(() => {
    return () => {
      disconnect()
    }
  }, [disconnect])
  
  return {
    status,
    isConnected: status === 'connected' || status === 'listening' || status === 'speaking',
    isListening: status === 'listening',
    isSpeaking: status === 'speaking',
    volume,
    connect,
    disconnect,
    sendAudio,
    interrupt,
    error
  }
}

export default useGeminiLive
