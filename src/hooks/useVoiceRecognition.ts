'use client'

import { useState, useCallback, useRef, useEffect } from 'react'

interface UseVoiceRecognitionOptions {
  language?: string
  continuous?: boolean
  interimResults?: boolean
  onResult?: (transcript: string, isFinal: boolean) => void
  onStart?: () => void
  onEnd?: () => void
  onError?: (error: string) => void
}

interface UseVoiceRecognitionReturn {
  isListening: boolean
  isSupported: boolean
  transcript: string
  interimTranscript: string
  startListening: () => void
  stopListening: () => void
  resetTranscript: () => void
}

/**
 * useVoiceRecognition Hook
 * Web Speech Recognition API ile sesli girdi
 * TeknoÖğretmen için "Dinleme Modu"
 */
export function useVoiceRecognition(
  options: UseVoiceRecognitionOptions = {}
): UseVoiceRecognitionReturn {
  const {
    language = 'tr-TR',
    continuous = true,
    interimResults = true,
    onResult,
    onStart,
    onEnd,
    onError
  } = options

  const [isListening, setIsListening] = useState(false)
  const [isSupported, setIsSupported] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [interimTranscript, setInterimTranscript] = useState('')
  
  const recognitionRef = useRef<any>(null)
  const restartTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Browser desteğini kontrol et
  useEffect(() => {
    const SpeechRecognition = 
      (window as any).SpeechRecognition || 
      (window as any).webkitSpeechRecognition

    if (SpeechRecognition) {
      setIsSupported(true)
      recognitionRef.current = new SpeechRecognition()
      
      const recognition = recognitionRef.current
      recognition.lang = language
      recognition.continuous = continuous
      recognition.interimResults = interimResults
      
      // Sonuç geldiğinde
      recognition.onresult = (event: any) => {
        let finalTranscript = ''
        let interimText = ''
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i]
          if (result.isFinal) {
            finalTranscript += result[0].transcript
          } else {
            interimText += result[0].transcript
          }
        }
        
        if (finalTranscript) {
          setTranscript(prev => prev + finalTranscript)
          onResult?.(finalTranscript, true)
        }
        
        setInterimTranscript(interimText)
        if (interimText) {
          onResult?.(interimText, false)
        }
      }
      
      // Başladığında
      recognition.onstart = () => {
        setIsListening(true)
        onStart?.()
      }
      
      // Bittiğinde
      recognition.onend = () => {
        setIsListening(false)
        onEnd?.()
        
        // Continuous mode'da otomatik restart
        if (continuous && recognitionRef.current?._shouldRestart) {
          restartTimeoutRef.current = setTimeout(() => {
            try {
              recognition.start()
            } catch (e) {
              // Zaten başlamış olabilir
            }
          }, 100)
        }
      }
      
      // Hata durumunda
      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error)
        
        if (event.error === 'no-speech') {
          // Ses algılanmadı - normal durum
          return
        }
        
        if (event.error === 'aborted') {
          // Kullanıcı durdurdu
          return
        }
        
        onError?.(event.error)
        setIsListening(false)
      }
    }
    
    return () => {
      if (restartTimeoutRef.current) {
        clearTimeout(restartTimeoutRef.current)
      }
      if (recognitionRef.current) {
        recognitionRef.current._shouldRestart = false
        try {
          recognitionRef.current.stop()
        } catch (e) {}
      }
    }
  }, [language, continuous, interimResults, onResult, onStart, onEnd, onError])

  // Dinlemeyi başlat
  const startListening = useCallback(() => {
    if (!recognitionRef.current || !isSupported) {
      onError?.('Ses tanıma desteklenmiyor')
      return
    }
    
    try {
      recognitionRef.current._shouldRestart = true
      recognitionRef.current.start()
      setTranscript('')
      setInterimTranscript('')
    } catch (error: any) {
      if (error.message?.includes('already started')) {
        // Zaten başlamış, sorun yok
      } else {
        console.error('Start listening error:', error)
        onError?.(error.message)
      }
    }
  }, [isSupported, onError])

  // Dinlemeyi durdur
  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current._shouldRestart = false
      try {
        recognitionRef.current.stop()
      } catch (e) {}
    }
    setIsListening(false)
    setInterimTranscript('')
  }, [])

  // Transcript'i sıfırla
  const resetTranscript = useCallback(() => {
    setTranscript('')
    setInterimTranscript('')
  }, [])

  return {
    isListening,
    isSupported,
    transcript,
    interimTranscript,
    startListening,
    stopListening,
    resetTranscript
  }
}

export default useVoiceRecognition
