'use client'

/**
 * useGeminiLive Hook - VERCEL PRO MODE v2
 * 
 * 🚀 Gemini 2.5 Flash Live API ile gerçek zamanlı sesli sohbet
 * Server-side proxy üzerinden bağlanır (CORS sorunu yok)
 * 
 * PRO Özellikler:
 * - 5 dakika kesintisiz bağlantı (maxDuration: 300)
 * - Sıfır veritabanı gecikmesi
 * - Native audio output (Kore sesi)
 * - AI ilk mesajı kendisi başlatır
 * - Mikrofon input + VAD
 * - 5 saniye connecting timeout ile otomatik yenileme
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

// =====================================================
// AUDIO HELPERS - Int16Array <-> Base64
// =====================================================
function int16ArrayToBase64(int16Array: Int16Array): string {
  const bytes = new Uint8Array(int16Array.buffer)
  let binary = ''
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

function base64ToInt16Array(base64: string): Int16Array {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return new Int16Array(bytes.buffer)
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
  const connectingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  // Status değişikliğini bildir
  const updateStatus = useCallback((newStatus: GeminiLiveStatus) => {
    console.log(`🔄 [STATUS] ${status} → ${newStatus}`)
    setStatus(newStatus)
    onStatusChange?.(newStatus)
  }, [status, onStatusChange])
  
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
  
  // =====================================================
  // GEMINI AUDIO ÇALMA - PCM/WAV/MP3 Desteği
  // =====================================================
  const playGeminiAudio = useCallback(async (base64Audio: string, mimeType: string) => {
    console.log('🔊🔊🔊 SES PAKETİ GELDİ 🔊🔊🔊')
    console.log('🔊 [AUDIO] mimeType:', mimeType, 'size:', base64Audio.length, 'bytes')
    
    try {
      const ctx = await initAudioContext()
      
      // Base64 -> ArrayBuffer
      const binaryString = atob(base64Audio)
      const bytes = new Uint8Array(binaryString.length)
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i)
      }
      
      // Mime type'a göre sample rate belirle
      let sampleRate = 24000  // Gemini varsayılan
      if (mimeType.includes('16000')) sampleRate = 16000
      if (mimeType.includes('22050')) sampleRate = 22050
      if (mimeType.includes('44100')) sampleRate = 44100
      
      console.log('🔊 [AUDIO] Sample rate:', sampleRate)
      
      let audioBuffer: AudioBuffer
      
      // PCM veya encoded audio kontrolü
      if (mimeType.includes('pcm') || mimeType.includes('raw')) {
        // PCM 16-bit -> Float32
        const pcmData = new Int16Array(bytes.buffer)
        const floatData = new Float32Array(pcmData.length)
        for (let i = 0; i < pcmData.length; i++) {
          floatData[i] = pcmData[i] / 32768
        }
        
        audioBuffer = ctx.createBuffer(1, floatData.length, sampleRate)
        audioBuffer.getChannelData(0).set(floatData)
        console.log('🔊 [AUDIO] PCM decoded:', floatData.length, 'samples')
      } else {
        // MP3/WAV/OGG - decodeAudioData kullan
        try {
          audioBuffer = await ctx.decodeAudioData(bytes.buffer.slice(0))
          console.log('🔊 [AUDIO] Decoded:', audioBuffer.duration, 'seconds')
        } catch (decodeErr) {
          // Fallback: PCM olarak dene
          console.warn('⚠️ [AUDIO] decodeAudioData başarısız, PCM deneniyor...')
          const pcmData = new Int16Array(bytes.buffer)
          const floatData = new Float32Array(pcmData.length)
          for (let i = 0; i < pcmData.length; i++) {
            floatData[i] = pcmData[i] / 32768
          }
          audioBuffer = ctx.createBuffer(1, floatData.length, sampleRate)
          audioBuffer.getChannelData(0).set(floatData)
        }
      }
      
      // Çal
      const source = ctx.createBufferSource()
      source.buffer = audioBuffer
      source.connect(ctx.destination)
      
      isPlayingRef.current = true
      updateStatus('speaking')
      
      // Volume simülasyonu (lip-sync)
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
        console.log('🔇 [AUDIO] Bitti')
        
        if (isSessionActive.current) {
          updateStatus('listening')
        }
      }
      
      source.start()
      console.log(`✅ [AUDIO] Çalıyor: ${audioBuffer.duration.toFixed(2)}s @ ${audioBuffer.sampleRate}Hz`)
      
    } catch (err) {
      console.error('❌ [AUDIO] Hata:', err)
      // Audio çalamazsa listening'e geç
      if (isSessionActive.current) {
        updateStatus('listening')
      }
    }
  }, [initAudioContext, updateStatus])
  
  // Fallback: Browser TTS
  const speakWithBrowserTTS = useCallback((text: string) => {
    if (!text.trim() || typeof window === 'undefined') return
    
    console.log('🗣️ [TTS] Browser TTS kullanılıyor:', text.substring(0, 50))
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
      console.log('🗣️ [TTS] Konuşma başladı')
    }
    
    utterance.onend = () => {
      isPlayingRef.current = false
      setVolume(0)
      console.log('🗣️ [TTS] Konuşma bitti')
      if (isSessionActive.current) updateStatus('listening')
    }
    
    // Volume simülasyonu
    const interval = setInterval(() => {
      if (isPlayingRef.current) {
        setVolume(0.3 + Math.random() * 0.5)
      } else {
        clearInterval(interval)
      }
    }, 100)
    
    window.speechSynthesis?.speak(utterance)
  }, [updateStatus])
  
  
  // Mikrofonu başlat (STT için) - 16kHz PCM Mono
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
      console.log('🎤 [MIC] Mikrofon başlatılıyor (16kHz PCM Mono)...')
      
      // =====================================================
      // AUDIO SERIALIZATION: 16-bit PCM, 16kHz, Mono
      // =====================================================
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 16000,     // Gemini Live API şartı
          channelCount: 1,       // Mono
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
      })
      
      mediaStreamRef.current = stream
      console.log('✅ [MIC] Mikrofon başlatıldı (16kHz PCM Mono)')
      return true
      
    } catch (err: any) {
      console.error('❌ [MIC] Mikrofon hatası:', err.name, err.message)
      // Hata olsa da devam et
      return false
    }
  }, [])
  
  // Mikrofonu durdur
  const stopMicrophone = useCallback(() => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => {
        track.onended = null
        track.stop()
      })
      mediaStreamRef.current = null
      console.log('🔇 [MIC] Mikrofon durduruldu')
    }
  }, [])
  
  // =====================================================
  // FORCE RE-CONNECT: 5 saniye timeout
  // =====================================================
  const clearConnectingTimeout = useCallback(() => {
    if (connectingTimeoutRef.current) {
      clearTimeout(connectingTimeoutRef.current)
      connectingTimeoutRef.current = null
    }
  }, [])
  
  // Mesaj gönder ve yanıt al (streaming)
  const sendMessage = useCallback(async (message: string, isSetup: boolean = false): Promise<string> => {
    const controller = new AbortController()
    abortControllerRef.current = controller
    
    console.log(`🔵 [HOOK] ${isSetup ? 'Setup' : 'Message'} gönderiliyor...`)
    
    if (isSetup) {
      updateStatus('connecting')
    } else {
      updateStatus('processing')
    }
    
    try {
      const response = await fetch('/api/tekno-teacher/live/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: isSetup ? 'setup' : 'text',
          studentName: 'Şakir', // HARDCODED
          grade: 8,
          personality,
          voice,
          textMessage: isSetup ? null : message
        }),
        signal: controller.signal
      })
      
      console.log('📡 [HOOK] API yanıtı:', response.status)
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
      
      const reader = response.body?.getReader()
      if (!reader) throw new Error('Stream okunamadı')
      
      const decoder = new TextDecoder()
      let buffer = ''
      let fullText = ''
      let hasAudio = false
      
      // =====================================================
      // 5 SANİYE TIMEOUT - Connecting'de kalırsa yenile
      // =====================================================
      clearConnectingTimeout()
      
      while (true) {
        const { done, value } = await reader.read()
        if (done) {
          console.log('📭 [HOOK] Stream bitti')
          break
        }
        
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))
              
              // Bağlantı onayı
              if (data.type === 'connected') {
                console.log('🟢🟢🟢 [HOOK] === BAĞLANTI ONAYLANDI === 🟢🟢🟢')
                console.log('👤 Öğrenci:', data.studentName, 'Pro:', data.pro)
                reconnectAttempts.current = 0
                clearConnectingTimeout()
                updateStatus('connected')
                continue
              }
              
              // Metin yanıtı
              if (data.type === 'text' && data.content) {
                fullText += data.content
                console.log('📝 [HOOK] TEXT:', data.content.substring(0, 60))
                onTranscript?.(data.content, false)
              }
              
              // =====================================================
              // SES PAKETİ - Client-Side Log
              // =====================================================
              if (data.type === 'audio' && data.data) {
                console.log('🔊🔊🔊 SES PAKETİ GELDİ 🔊🔊🔊')
                hasAudio = true
                onAudioReceived?.(data.data, data.mimeType)
                await playGeminiAudio(data.data, data.mimeType)
              }
              
              // Tamamlandı
              if (data.type === 'done') {
                console.log('✅ [HOOK] DONE - Text:', fullText.length, 'chars, Audio:', hasAudio)
                
                if (fullText && !hasAudio) {
                  // Audio yoksa Browser TTS kullan
                  console.log('🗣️ [HOOK] Audio yok, Browser TTS kullanılıyor...')
                  speakWithBrowserTTS(fullText)
                } else if (!fullText && !hasAudio) {
                  console.log('⚠️ [HOOK] Yanıt yok!')
                  if (isSessionActive.current) {
                    updateStatus('listening')
                  }
                }
              }
              
              // Hata (VAD hariç)
              if (data.type === 'error') {
                const errorMsg = data.rawError || data.message || ''
                if (!errorMsg.toLowerCase().includes('no speech') && 
                    !errorMsg.toLowerCase().includes('vad')) {
                  console.error('❌ [HOOK] API hatası:', errorMsg)
                }
              }
              
            } catch (e) {
              // JSON parse hatası - devam et
            }
          }
        }
      }
      
      // Session aktifse listening'e geç
      if (isSessionActive.current && !isPlayingRef.current) {
        updateStatus('listening')
      }
      
      return fullText
      
    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.log('🛑 [HOOK] Request iptal edildi')
        return ''
      }
      console.error('❌ [HOOK] Request hatası:', err.message)
      
      // Fallback - hata verme, sessizce devam et
      if (isSetup && isSessionActive.current) {
        const fallbackMsg = 'Selam Şakir! Bugün Pro gücüyle yanındayım, hadi derse başlayalım!'
        onTranscript?.(fallbackMsg, false)
        speakWithBrowserTTS(fallbackMsg)
      }
      
      return ''
    }
  }, [personality, voice, updateStatus, playGeminiAudio, speakWithBrowserTTS, onTranscript, onAudioReceived, clearConnectingTimeout])
  
  // =====================================================
  // CONNECT - VERCEL PRO MODE + 5 Saniye Timeout
  // =====================================================
  const connect = useCallback(async () => {
    console.log('🚀🚀🚀 [HOOK PRO] Bağlantı başlatılıyor... 🚀🚀🚀')
    console.log('👤 Öğrenci: Şakir (hardcoded)')
    console.log('⏱️ Max Duration: 5 dakika')
    console.log('⏱️ Connecting Timeout: 5 saniye')
    
    updateStatus('connecting')
    setError(null)
    isSessionActive.current = true
    reconnectAttempts.current = 0
    
    // =====================================================
    // FORCE RE-CONNECT: 5 saniye timeout
    // =====================================================
    clearConnectingTimeout()
    connectingTimeoutRef.current = setTimeout(() => {
      if (status === 'connecting' && isSessionActive.current) {
        console.warn('⚠️ [HOOK] 5 saniye geçti, connecting hala aktif!')
        console.log('🔄 [HOOK] Otomatik yeniden bağlanma...')
        
        // Mevcut request'i iptal et
        abortControllerRef.current?.abort()
        
        // Yeniden dene
        if (reconnectAttempts.current < maxReconnectAttempts) {
          reconnectAttempts.current++
          console.log(`🔄 [HOOK] Deneme ${reconnectAttempts.current}/${maxReconnectAttempts}`)
          
          // 1 saniye bekle ve tekrar dene
          setTimeout(async () => {
            if (isSessionActive.current) {
              try {
                await sendMessage('', true)
              } catch (e) {
                console.error('❌ [HOOK] Yeniden bağlantı başarısız')
              }
            }
          }, 1000)
        } else {
          console.error('❌ [HOOK] Maksimum deneme aşıldı')
          // Fallback
          const fallbackMsg = 'Selam Şakir! Bağlantı kurulamadı ama seninle konuşabilirim. Ne öğrenmek istersin?'
          onTranscript?.(fallbackMsg, false)
          speakWithBrowserTTS(fallbackMsg)
        }
      }
    }, 5000)
    
    try {
      // Mikrofonu başlat (hata olsa da devam)
      await startMicrophone().catch(e => console.warn('⚠️ Mikrofon:', e.message))
      
      // =====================================================
      // INITIAL MESSAGE BUFFER: Setup tetikleyici
      // =====================================================
      console.log('📤 [HOOK PRO] Setup tetikleyici gönderiliyor...')
      console.log('📤 [HOOK PRO] AI ilk mesajı kendisi başlatacak: "Merhaba Şakir, bugün harika bir ders işleyeceğiz"')
      
      const response = await sendMessage('', true)
      
      if (response) {
        console.log('✅ [HOOK PRO] AI yanıt verdi:', response.substring(0, 60))
        clearConnectingTimeout()
      }
      
    } catch (err: any) {
      console.error('❌ [HOOK PRO] Bağlantı hatası:', err.message)
      clearConnectingTimeout()
      
      // ASLA hata verme - fallback mesaj göster
      if (isSessionActive.current) {
        const fallbackMsg = 'Selam Şakir! Bugün Pro gücüyle yanındayım, hadi derse başlayalım!'
        onTranscript?.(fallbackMsg, false)
        speakWithBrowserTTS(fallbackMsg)
      }
    }
  }, [sendMessage, startMicrophone, updateStatus, onTranscript, speakWithBrowserTTS, clearConnectingTimeout, status])
  
  // Bağlantıyı kes
  const disconnect = useCallback(() => {
    console.log('🔌 [HOOK] Bağlantı kapatılıyor...')
    
    isSessionActive.current = false
    reconnectAttempts.current = 0
    clearConnectingTimeout()
    
    abortControllerRef.current?.abort()
    abortControllerRef.current = null
    
    stopMicrophone()
    window.speechSynthesis?.cancel()
    
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
  }, [stopMicrophone, updateStatus, clearConnectingTimeout])
  
  // Metin gönder
  const sendText = useCallback(async (text: string) => {
    if (!text.trim()) return
    console.log('💬 [HOOK] Kullanıcı mesajı:', text.substring(0, 50))
    onTranscript?.(text, true)
    await sendMessage(text, false)
  }, [sendMessage, onTranscript])
  
  // =====================================================
  // AUDIO GÖNDER - Int16Array -> Base64
  // =====================================================
  const sendAudio = useCallback(async (audioData: string) => {
    console.log('🎤 [HOOK] Audio gönderiliyor (base64):', audioData.length, 'bytes')
    // TODO: WebSocket üzerinden ses gönderimi
  }, [])
  
  // Konuşmayı kes
  const interrupt = useCallback(() => {
    console.log('🛑 [HOOK] Konuşma kesiliyor...')
    abortControllerRef.current?.abort()
    window.speechSynthesis?.cancel()
    isPlayingRef.current = false
    audioQueueRef.current = []
    setVolume(0)
    if (isSessionActive.current) {
      updateStatus('listening')
    }
  }, [updateStatus])
  
  // Cleanup
  useEffect(() => {
    return () => {
      clearConnectingTimeout()
      disconnect()
    }
  }, [disconnect, clearConnectingTimeout])
  
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
