'use client'

/**
 * useGeminiLive Hook - CLIENT-SIDE WEBSOCKET
 * 
 * 🚀 Gemini Multimodal Live API (WebSocket)
 * Dokümantasyon: https://ai.google.dev/api/live?hl=tr
 * 
 * ÖNEMLİ KURALLAR:
 * 1. Endpoint: wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent
 * 2. İlk mesaj: setup (model, generationConfig, systemInstruction)
 * 3. setupComplete bekle, sonra mesaj gönder
 * 4. Ses: realtimeInput.audio ile gönder
 * 5. Hata takibi: interrupted, turnComplete dinle
 */

import { useState, useRef, useCallback, useEffect } from 'react'

// =====================================================
// TYPES
// =====================================================
export type GeminiLiveStatus = 
  | 'idle'
  | 'connecting'
  | 'setup_sent'
  | 'connected'
  | 'listening'
  | 'speaking'
  | 'processing'
  | 'error'

interface UseGeminiLiveOptions {
  apiKey: string
  studentName?: string
  grade?: number
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
  sendText: (text: string) => void
  sendAudio: (audioData: ArrayBuffer) => void
  interrupt: () => void
  error: Error | null
}

// =====================================================
// CONSTANTS - Dokümantasyona göre
// =====================================================
const GEMINI_WS_ENDPOINT = 'wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent'
const GEMINI_MODEL = 'models/gemini-2.0-flash-exp'  // Format: models/{model}

export function useGeminiLive(options: UseGeminiLiveOptions): UseGeminiLiveReturn {
  const {
    apiKey,
    studentName = 'Şakir',
    grade = 8,
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
  const wsRef = useRef<WebSocket | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const isPlayingRef = useRef(false)
  const setupCompleteRef = useRef(false)
  const messageQueueRef = useRef<object[]>([])
  
  // =====================================================
  // STATUS UPDATE
  // =====================================================
  const updateStatus = useCallback((newStatus: GeminiLiveStatus) => {
    console.log(`🔄 [LIVE STATUS] ${status} → ${newStatus}`)
    setStatus(newStatus)
    onStatusChange?.(newStatus)
  }, [status, onStatusChange])
  
  // =====================================================
  // AUDIO PLAYBACK
  // =====================================================
  const playAudio = useCallback(async (base64Audio: string, mimeType: string) => {
    console.log('🔊🔊🔊 SES PAKETİ GELDİ 🔊🔊🔊')
    console.log('🔊 [AUDIO] mimeType:', mimeType, 'size:', base64Audio.length)
    
    onAudioReceived?.(base64Audio, mimeType)
    
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext({ sampleRate: 24000 })
      }
      
      const ctx = audioContextRef.current
      if (ctx.state === 'suspended') await ctx.resume()
      
      // Base64 -> ArrayBuffer
      const binaryString = atob(base64Audio)
      const bytes = new Uint8Array(binaryString.length)
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i)
      }
      
      // Sample rate from mime type
      let sampleRate = 24000
      const rateMatch = mimeType.match(/rate=(\d+)/)
      if (rateMatch) sampleRate = parseInt(rateMatch[1])
      
      // PCM 16-bit -> Float32
      const pcmData = new Int16Array(bytes.buffer)
      const floatData = new Float32Array(pcmData.length)
      for (let i = 0; i < pcmData.length; i++) {
        floatData[i] = pcmData[i] / 32768
      }
      
      // Create and play buffer
      const audioBuffer = ctx.createBuffer(1, floatData.length, sampleRate)
      audioBuffer.getChannelData(0).set(floatData)
      
      const source = ctx.createBufferSource()
      source.buffer = audioBuffer
      source.connect(ctx.destination)
      
      isPlayingRef.current = true
      updateStatus('speaking')
      
      // Volume simulation
      const volumeInterval = setInterval(() => {
        if (isPlayingRef.current) {
          setVolume(0.3 + Math.random() * 0.5)
        } else {
          clearInterval(volumeInterval)
          setVolume(0)
        }
      }, 100)
      
      source.onended = () => {
        isPlayingRef.current = false
        setVolume(0)
        clearInterval(volumeInterval)
        console.log('🔇 [AUDIO] Oynatma bitti')
        if (setupCompleteRef.current) {
          updateStatus('listening')
        }
      }
      
      source.start()
      console.log(`✅ [AUDIO] Çalıyor: ${floatData.length} samples @ ${sampleRate}Hz`)
      
    } catch (err) {
      console.error('❌ [AUDIO] Hata:', err)
      updateStatus('listening')
    }
  }, [onAudioReceived, updateStatus])
  
  // =====================================================
  // BROWSER TTS FALLBACK
  // =====================================================
  const speakWithTTS = useCallback((text: string) => {
    if (!text.trim() || typeof window === 'undefined') return
    
    console.log('🗣️ [TTS] Browser TTS:', text.substring(0, 50))
    window.speechSynthesis?.cancel()
    
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'tr-TR'
    utterance.rate = 1.0
    
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
      if (setupCompleteRef.current) updateStatus('listening')
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
  
  // =====================================================
  // SEND MESSAGE (Queue if not ready)
  // =====================================================
  const sendMessage = useCallback((message: object) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      console.warn('⚠️ [WS] Bağlantı açık değil, kuyruğa ekleniyor')
      messageQueueRef.current.push(message)
      return
    }
    
    // setupComplete gelmediyse bekle (setup hariç)
    if (!setupCompleteRef.current && !('setup' in message)) {
      console.warn('⚠️ [WS] setupComplete bekleniyor, kuyruğa ekleniyor')
      messageQueueRef.current.push(message)
      return
    }
    
    const msgStr = JSON.stringify(message)
    console.log('📤 [WS] Gönderiliyor:', Object.keys(message)[0])
    wsRef.current.send(msgStr)
  }, [])
  
  // =====================================================
  // PROCESS MESSAGE QUEUE
  // =====================================================
  const processQueue = useCallback(() => {
    while (messageQueueRef.current.length > 0 && setupCompleteRef.current) {
      const msg = messageQueueRef.current.shift()
      if (msg) sendMessage(msg)
    }
  }, [sendMessage])
  
  // =====================================================
  // CONNECT - Dokümantasyona göre
  // =====================================================
  const connect = useCallback(async () => {
    if (!apiKey) {
      const err = new Error('API Key gerekli')
      setError(err)
      onError?.(err)
      return
    }
    
    console.log('🚀🚀🚀 [LIVE] WebSocket bağlantısı başlatılıyor... 🚀🚀🚀')
    console.log(`📍 [LIVE] Endpoint: ${GEMINI_WS_ENDPOINT}`)
    console.log(`📦 [LIVE] Model: ${GEMINI_MODEL}`)
    
    updateStatus('connecting')
    setError(null)
    setupCompleteRef.current = false
    messageQueueRef.current = []
    
    try {
      // WebSocket URL with API Key
      const wsUrl = `${GEMINI_WS_ENDPOINT}?key=${apiKey}`
      const ws = new WebSocket(wsUrl)
      wsRef.current = ws
      
      ws.onopen = () => {
        console.log('✅ [WS] Bağlantı açıldı')
        updateStatus('setup_sent')
        
        // =====================================================
        // SETUP MESSAGE - Dokümantasyona göre
        // =====================================================
        const setupMessage = {
          setup: {
            model: GEMINI_MODEL,
            generationConfig: {
              temperature: 0.9,
              maxOutputTokens: 200,
              responseModalities: ["AUDIO", "TEXT"],
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
                text: `Sen TeknoÖğretmen'sin - ${studentName}'in özel ders öğretmeni.

KİMLİK:
- Adı: TeknoÖğretmen  
- Ses: ${voice}
- Dil: Türkçe
- Kişilik: ${personality === 'friendly' ? 'Samimi ve arkadaşça' : personality === 'strict' ? 'Disiplinli ve ciddi' : 'Motive edici ve enerjik'}

KURALLAR:
1. Her yanıta "${studentName}" diye hitap ederek başla
2. Kısa ve öz konuş (maksimum 2 cümle)
3. Her zaman Türkçe konuş
4. Samimi ve motive edici ol
5. Yanıtın sonunda bazen soru sor

ÖĞRENCİ: ${studentName}, ${grade}. sınıf

[BAŞLANGIÇ TALİMATI: Bağlantı kurulduğunda hemen "Merhaba ${studentName}, bugün harika bir ders işleyeceğiz! Ne çalışmak istersin?" diye selam ver.]`
              }]
            }
          }
        }
        
        console.log('📤 [WS] Setup gönderiliyor...')
        ws.send(JSON.stringify(setupMessage))
      }
      
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          const msgType = Object.keys(data).filter(k => k !== 'usageMetadata')[0]
          console.log('📥 [WS] Mesaj alındı:', msgType)
          
          // =====================================================
          // SETUP COMPLETE - Dokümantasyona göre
          // =====================================================
          if (data.setupComplete) {
            console.log('✅✅✅ [WS] SETUP COMPLETE! ✅✅✅')
            setupCompleteRef.current = true
            updateStatus('connected')
            
            // Kuyruktaki mesajları gönder
            processQueue()
            
            // İlk mesajı tetikle
            const firstMessage = {
              clientContent: {
                turns: [{
                  role: 'user',
                  parts: [{ 
                    text: `[BAŞLA] Merhaba de ve ${studentName}'e selam ver.` 
                  }]
                }],
                turnComplete: true
              }
            }
            sendMessage(firstMessage)
          }
          
          // =====================================================
          // SERVER CONTENT - Model yanıtı
          // =====================================================
          if (data.serverContent) {
            const content = data.serverContent
            
            // Model Turn
            if (content.modelTurn?.parts) {
              for (const part of content.modelTurn.parts) {
                // Text
                if (part.text) {
                  console.log('📝 [WS] Text:', part.text.substring(0, 80))
                  onTranscript?.(part.text, false)
                  
                  // Audio yoksa TTS kullan
                  if (!content.modelTurn.parts.some((p: any) => p.inlineData)) {
                    speakWithTTS(part.text)
                  }
                }
                
                // Audio
                if (part.inlineData) {
                  console.log('🔊 [WS] Audio alındı:', part.inlineData.mimeType)
                  playAudio(part.inlineData.data, part.inlineData.mimeType)
                }
              }
            }
            
            // =====================================================
            // HATA TAKİBİ - interrupted, turnComplete
            // =====================================================
            if (content.interrupted) {
              console.warn('⚠️ [WS] INTERRUPTED - Model kesintiye uğradı')
            }
            
            if (content.turnComplete) {
              console.log('✅ [WS] TURN COMPLETE - Model sırasını tamamladı')
              if (!isPlayingRef.current) {
                updateStatus('listening')
              }
            }
            
            if (content.generationComplete) {
              console.log('✅ [WS] GENERATION COMPLETE')
            }
          }
          
          // Input/Output Transcription
          if (data.inputTranscription) {
            console.log('📝 [WS] Input transcript:', data.inputTranscription.text)
            onTranscript?.(data.inputTranscription.text, true)
          }
          
          if (data.outputTranscription) {
            console.log('📝 [WS] Output transcript:', data.outputTranscription.text)
          }
          
          // Tool calls
          if (data.toolCall) {
            console.log('🔧 [WS] Tool call:', data.toolCall)
          }
          
          // GoAway - Sunucu bağlantıyı kapatacak
          if (data.goAway) {
            console.warn('⚠️ [WS] GO AWAY - Sunucu bağlantıyı kapatacak:', data.goAway.timeLeft)
          }
          
          // Usage
          if (data.usageMetadata) {
            console.log('📊 [WS] Usage:', data.usageMetadata.totalTokenCount, 'tokens')
          }
          
        } catch (parseErr) {
          console.error('❌ [WS] Parse hatası:', parseErr)
        }
      }
      
      ws.onerror = (event) => {
        console.error('❌ [WS] WebSocket hatası:', event)
        const err = new Error('WebSocket bağlantı hatası')
        setError(err)
        onError?.(err)
        updateStatus('error')
        
        // Fallback
        speakWithTTS(`Merhaba ${studentName}! Bağlantıda sorun var ama konuşabiliriz.`)
      }
      
      ws.onclose = (event) => {
        console.log(`🔌 [WS] Bağlantı kapandı: ${event.code} - ${event.reason}`)
        setupCompleteRef.current = false
        
        if (event.code !== 1000) {  // Normal kapatma değilse
          console.warn(`⚠️ [WS] Anormal kapanış kodu: ${event.code}`)
        }
        
        updateStatus('idle')
      }
      
    } catch (err: any) {
      console.error('❌ [LIVE] Bağlantı hatası:', err.message)
      const error = new Error(err.message)
      setError(error)
      onError?.(error)
      updateStatus('error')
      
      // Fallback
      speakWithTTS(`Merhaba ${studentName}! Bugün harika bir ders işleyeceğiz!`)
    }
  }, [apiKey, studentName, grade, personality, voice, updateStatus, onError, onTranscript, playAudio, speakWithTTS, processQueue, sendMessage])
  
  // =====================================================
  // DISCONNECT
  // =====================================================
  const disconnect = useCallback(() => {
    console.log('🔌 [LIVE] Bağlantı kapatılıyor...')
    
    setupCompleteRef.current = false
    messageQueueRef.current = []
    
    if (wsRef.current) {
      wsRef.current.close(1000, 'User disconnect')
      wsRef.current = null
    }
    
    window.speechSynthesis?.cancel()
    
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {})
      audioContextRef.current = null
    }
    
    isPlayingRef.current = false
    setVolume(0)
    setError(null)
    updateStatus('idle')
    
    console.log('✅ [LIVE] Bağlantı kapatıldı')
  }, [updateStatus])
  
  // =====================================================
  // SEND TEXT - clientContent ile
  // =====================================================
  const sendText = useCallback((text: string) => {
    if (!text.trim()) return
    
    console.log('💬 [LIVE] Kullanıcı mesajı:', text.substring(0, 50))
    onTranscript?.(text, true)
    
    const message = {
      clientContent: {
        turns: [{
          role: 'user',
          parts: [{ text }]
        }],
        turnComplete: true
      }
    }
    
    sendMessage(message)
    updateStatus('processing')
  }, [sendMessage, onTranscript, updateStatus])
  
  // =====================================================
  // SEND AUDIO - realtimeInput.audio ile
  // =====================================================
  const sendAudio = useCallback((audioData: ArrayBuffer) => {
    // ArrayBuffer -> Base64
    const bytes = new Uint8Array(audioData)
    let binary = ''
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i])
    }
    const base64 = btoa(binary)
    
    console.log('🎤 [LIVE] Audio gönderiliyor:', base64.length, 'bytes')
    
    // =====================================================
    // REALTIME INPUT - Dokümantasyona göre
    // =====================================================
    const message = {
      realtimeInput: {
        audio: {
          mimeType: 'audio/pcm;rate=16000',
          data: base64
        }
      }
    }
    
    sendMessage(message)
  }, [sendMessage])
  
  // =====================================================
  // INTERRUPT
  // =====================================================
  const interrupt = useCallback(() => {
    console.log('🛑 [LIVE] Konuşma kesiliyor...')
    window.speechSynthesis?.cancel()
    isPlayingRef.current = false
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
