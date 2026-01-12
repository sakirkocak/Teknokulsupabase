/**
 * 🎙️ useJarvisLive - LiveKit Real-time Ses Hook
 * 
 * VAD (Voice Activity Detection) + Barge-in desteği
 * Real-time sesli sohbet için
 */

'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import {
  Room,
  RoomEvent,
  Track,
  LocalTrack,
  createLocalAudioTrack,
  ConnectionState,
  Participant
} from 'livekit-client'

interface UseJarvisLiveOptions {
  onSpeechStart?: () => void
  onSpeechEnd?: (audio: Blob) => void
  onJarvisSpeaking?: (isSpeaking: boolean) => void
  onConnectionChange?: (state: ConnectionState) => void
  onError?: (error: string) => void
  autoConnect?: boolean
}

interface JarvisLiveState {
  isConnected: boolean
  isConnecting: boolean
  isRecording: boolean
  isSpeaking: boolean
  connectionState: ConnectionState
  roomName: string | null
}

export function useJarvisLive(options: UseJarvisLiveOptions = {}) {
  const {
    onSpeechStart,
    onSpeechEnd,
    onJarvisSpeaking,
    onConnectionChange,
    onError,
    autoConnect = false
  } = options

  const [state, setState] = useState<JarvisLiveState>({
    isConnected: false,
    isConnecting: false,
    isRecording: false,
    isSpeaking: false,
    connectionState: ConnectionState.Disconnected,
    roomName: null
  })

  const roomRef = useRef<Room | null>(null)
  const localTrackRef = useRef<LocalTrack | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])

  // VAD için ses analizi
  const analyserRef = useRef<AnalyserNode | null>(null)
  const vadIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isSpeakingRef = useRef(false)

  // LiveKit'e bağlan
  const connect = useCallback(async () => {
    if (state.isConnecting || state.isConnected) return

    setState(prev => ({ ...prev, isConnecting: true }))

    try {
      // Token al
      const tokenRes = await fetch('/api/jarvis/live/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      })

      const tokenData = await tokenRes.json()

      if (!tokenRes.ok || !tokenData.success) {
        throw new Error(tokenData.error || 'Token alınamadı')
      }

      // Yeni oda oluştur
      const room = new Room({
        adaptiveStream: true,
        dynacast: true,
        audioCaptureDefaults: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      })

      roomRef.current = room

      // Event listeners
      room.on(RoomEvent.Connected, () => {
        console.log('✅ [JARVIS] LiveKit bağlandı')
        setState(prev => ({
          ...prev,
          isConnected: true,
          isConnecting: false,
          connectionState: ConnectionState.Connected,
          roomName: tokenData.roomName
        }))
        onConnectionChange?.(ConnectionState.Connected)
      })

      room.on(RoomEvent.Disconnected, () => {
        console.log('🔌 [JARVIS] LiveKit bağlantı kesildi')
        setState(prev => ({
          ...prev,
          isConnected: false,
          isConnecting: false,
          connectionState: ConnectionState.Disconnected,
          roomName: null
        }))
        onConnectionChange?.(ConnectionState.Disconnected)
      })

      room.on(RoomEvent.TrackSubscribed, (track, publication, participant) => {
        if (track.kind === Track.Kind.Audio) {
          console.log('🔊 [JARVIS] Audio track alındı:', participant.identity)
          // Jarvis konuşuyor
          if (participant.identity === 'jarvis') {
            onJarvisSpeaking?.(true)
            setState(prev => ({ ...prev, isSpeaking: true }))
          }
        }
      })

      room.on(RoomEvent.TrackUnsubscribed, (track, publication, participant) => {
        if (track.kind === Track.Kind.Audio && participant.identity === 'jarvis') {
          onJarvisSpeaking?.(false)
          setState(prev => ({ ...prev, isSpeaking: false }))
        }
      })

      // Bağlan
      await room.connect(tokenData.wsUrl, tokenData.token)

    } catch (error: any) {
      console.error('❌ [JARVIS] LiveKit bağlantı hatası:', error.message)
      setState(prev => ({
        ...prev,
        isConnecting: false,
        connectionState: ConnectionState.Disconnected
      }))
      onError?.(error.message)
    }
  }, [state.isConnecting, state.isConnected, onConnectionChange, onJarvisSpeaking, onError])

  // Bağlantıyı kes
  const disconnect = useCallback(async () => {
    if (localTrackRef.current) {
      localTrackRef.current.stop()
      localTrackRef.current = null
    }

    if (roomRef.current) {
      await roomRef.current.disconnect()
      roomRef.current = null
    }

    if (vadIntervalRef.current) {
      clearInterval(vadIntervalRef.current)
      vadIntervalRef.current = null
    }

    setState({
      isConnected: false,
      isConnecting: false,
      isRecording: false,
      isSpeaking: false,
      connectionState: ConnectionState.Disconnected,
      roomName: null
    })
  }, [])

  // Mikrofonu aç ve yayınla
  const startRecording = useCallback(async () => {
    if (!roomRef.current || state.isRecording) return

    try {
      // Local audio track oluştur
      const track = await createLocalAudioTrack({
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
      })

      localTrackRef.current = track

      // Track'i yayınla
      await roomRef.current.localParticipant.publishTrack(track)

      // VAD için Web Audio API
      const audioContext = new AudioContext()
      const source = audioContext.createMediaStreamSource(
        new MediaStream([track.mediaStreamTrack])
      )
      const analyser = audioContext.createAnalyser()
      analyser.fftSize = 256

      source.connect(analyser)
      analyserRef.current = analyser

      // MediaRecorder (ses kaydı için)
      const mediaRecorder = new MediaRecorder(
        new MediaStream([track.mediaStreamTrack]),
        { mimeType: 'audio/webm;codecs=opus' }
      )

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data)
        }
      }

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        audioChunksRef.current = []
        onSpeechEnd?.(audioBlob)
      }

      mediaRecorderRef.current = mediaRecorder
      mediaRecorder.start(100) // 100ms chunks

      // VAD - Voice Activity Detection
      const dataArray = new Uint8Array(analyser.frequencyBinCount)

      vadIntervalRef.current = setInterval(() => {
        if (!analyserRef.current) return

        analyserRef.current.getByteFrequencyData(dataArray)
        const average = dataArray.reduce((a, b) => a + b) / dataArray.length
        const threshold = 30 // Ses eşiği

        if (average > threshold) {
          // Ses var
          if (!isSpeakingRef.current) {
            isSpeakingRef.current = true
            onSpeechStart?.()
            console.log('🎤 [VAD] Konuşma başladı')
          }

          // Sessizlik timeout'unu sıfırla
          if (silenceTimeoutRef.current) {
            clearTimeout(silenceTimeoutRef.current)
          }

          silenceTimeoutRef.current = setTimeout(() => {
            if (isSpeakingRef.current) {
              isSpeakingRef.current = false
              console.log('🔇 [VAD] Konuşma bitti')
              // Kaydı durdur ve gönder
              if (mediaRecorderRef.current?.state === 'recording') {
                mediaRecorderRef.current.stop()
              }
            }
          }, 1500) // 1.5 saniye sessizlik
        }
      }, 50) // 50ms aralıkla kontrol

      setState(prev => ({ ...prev, isRecording: true }))
      console.log('🎙️ [JARVIS] Kayıt başladı')

    } catch (error: any) {
      console.error('❌ [JARVIS] Mikrofon hatası:', error.message)
      onError?.(error.message)
    }
  }, [state.isRecording, onSpeechStart, onSpeechEnd, onError])

  // Kaydı durdur
  const stopRecording = useCallback(() => {
    if (vadIntervalRef.current) {
      clearInterval(vadIntervalRef.current)
      vadIntervalRef.current = null
    }

    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current)
      silenceTimeoutRef.current = null
    }

    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop()
    }

    if (localTrackRef.current) {
      localTrackRef.current.stop()
      if (roomRef.current) {
        roomRef.current.localParticipant.unpublishTrack(localTrackRef.current)
      }
      localTrackRef.current = null
    }

    analyserRef.current = null
    isSpeakingRef.current = false

    setState(prev => ({ ...prev, isRecording: false }))
    console.log('🛑 [JARVIS] Kayıt durduruldu')
  }, [])

  // Auto connect
  useEffect(() => {
    if (autoConnect) {
      connect()
    }

    return () => {
      disconnect()
    }
  }, [autoConnect])

  return {
    ...state,
    connect,
    disconnect,
    startRecording,
    stopRecording,
    room: roomRef.current
  }
}

export default useJarvisLive
