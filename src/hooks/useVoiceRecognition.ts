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
 * useVoiceRecognition Hook v2
 * Web Speech Recognition API ile sesli girdi
 * TeknoÖğretmen için "Dinleme Modu"
 * 
 * Düzeltmeler:
 * - Callback'ler useRef ile saklanıyor (re-render sorunu çözüldü)
 * - Debug logları eklendi
 * - Recognition state daha iyi yönetiliyor
 */
export function useVoiceRecognition(
  options: UseVoiceRecognitionOptions = {}
): UseVoiceRecognitionReturn {
  const {
    language = 'tr-TR',
    continuous = true,
    interimResults = true,
  } = options

  const [isListening, setIsListening] = useState(false)
  const [isSupported, setIsSupported] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [interimTranscript, setInterimTranscript] = useState('')
  
  // 🔧 Callback'leri ref ile sakla - re-render'da kaybolmasın
  const callbacksRef = useRef(options)
  callbacksRef.current = options
  
  const recognitionRef = useRef<any>(null)
  const isInitializedRef = useRef(false)
  const shouldRestartRef = useRef(false)

  // Browser desteğini kontrol et ve recognition'ı bir kere oluştur
  useEffect(() => {
    if (isInitializedRef.current) return
    
    const SpeechRecognition = 
      (window as any).SpeechRecognition || 
      (window as any).webkitSpeechRecognition

    if (!SpeechRecognition) {
      console.warn('🎤 Speech Recognition desteklenmiyor')
      setIsSupported(false)
      return
    }

    console.log('🎤 Speech Recognition başlatılıyor...')
    setIsSupported(true)
    isInitializedRef.current = true
    
    const recognition = new SpeechRecognition()
    recognition.lang = language
    recognition.continuous = continuous
    recognition.interimResults = interimResults
    recognition.maxAlternatives = 1
    
    // 🎯 Sonuç geldiğinde
    recognition.onresult = (event: any) => {
      console.log('🎤 onresult tetiklendi, results:', event.results.length)
      
      let finalTranscript = ''
      let interimText = ''
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        const text = result[0].transcript
        const confidence = result[0].confidence
        
        console.log(`🎤 Result[${i}]: "${text}" (final: ${result.isFinal}, confidence: ${confidence?.toFixed(2) || 'N/A'})`)
        
        if (result.isFinal) {
          finalTranscript += text
        } else {
          interimText += text
        }
      }
      
      if (finalTranscript) {
        console.log('✅ Final transcript:', finalTranscript)
        setTranscript(prev => prev + finalTranscript)
        callbacksRef.current.onResult?.(finalTranscript, true)
      }
      
      if (interimText) {
        console.log('⏳ Interim transcript:', interimText)
        setInterimTranscript(interimText)
        callbacksRef.current.onResult?.(interimText, false)
      }
    }
    
    // 🟢 Başladığında
    recognition.onstart = () => {
      console.log('🟢 Recognition başladı')
      setIsListening(true)
      callbacksRef.current.onStart?.()
    }
    
    // 🔴 Bittiğinde
    recognition.onend = () => {
      console.log('🔴 Recognition bitti, shouldRestart:', shouldRestartRef.current)
      setIsListening(false)
      callbacksRef.current.onEnd?.()
      
      // Continuous mode'da otomatik restart
      if (shouldRestartRef.current) {
        console.log('🔄 Otomatik restart (500ms sonra)...')
        setTimeout(() => {
          if (shouldRestartRef.current) {
            try {
              recognition.start()
              console.log('🟢 Restart başarılı')
            } catch (e: any) {
              console.warn('⚠️ Restart hatası:', e.message)
            }
          }
        }, 500)
      }
    }
    
    // ⚠️ Ses algılanamadığında (no-speech)
    recognition.onspeechend = () => {
      console.log('🔇 Konuşma sonu algılandı')
    }
    
    recognition.onsoundstart = () => {
      console.log('🔊 Ses algılandı')
    }
    
    recognition.onsoundend = () => {
      console.log('🔇 Ses bitti')
    }
    
    // ❌ Hata durumunda
    recognition.onerror = (event: any) => {
      console.error('❌ Speech recognition error:', event.error)
      
      // no-speech: Ses algılanmadı - restart yap
      if (event.error === 'no-speech') {
        console.log('🔇 Ses algılanmadı, tekrar dinleniyor...')
        // onend otomatik tetiklenecek, orada restart yapılıyor
        return
      }
      
      // aborted: Kullanıcı durdurdu
      if (event.error === 'aborted') {
        console.log('⏹️ Kullanıcı tarafından durduruldu')
        return
      }
      
      // not-allowed: Mikrofon izni yok
      if (event.error === 'not-allowed') {
        console.error('🚫 Mikrofon izni verilmedi!')
        callbacksRef.current.onError?.('Mikrofon izni gerekli. Lütfen tarayıcı ayarlarından mikrofon iznini verin.')
        shouldRestartRef.current = false
        setIsListening(false)
        return
      }
      
      // network: Ağ hatası
      if (event.error === 'network') {
        console.error('🌐 Ağ hatası')
        callbacksRef.current.onError?.('İnternet bağlantısı gerekli')
        return
      }
      
      callbacksRef.current.onError?.(event.error)
      setIsListening(false)
    }
    
    recognitionRef.current = recognition
    console.log('✅ Speech Recognition hazır')
    
    return () => {
      console.log('🧹 Speech Recognition temizleniyor...')
      shouldRestartRef.current = false
      try {
        recognition.stop()
      } catch (e) {}
    }
  }, [language, continuous, interimResults])

  // Dinlemeyi başlat
  const startListening = useCallback(() => {
    if (!recognitionRef.current || !isSupported) {
      console.warn('🎤 Recognition desteklenmiyor veya hazır değil')
      callbacksRef.current.onError?.('Ses tanıma desteklenmiyor')
      return
    }
    
    console.log('🎤 startListening çağrıldı')
    shouldRestartRef.current = true
    setTranscript('')
    setInterimTranscript('')
    
    try {
      recognitionRef.current.start()
      console.log('✅ Recognition.start() çağrıldı')
    } catch (error: any) {
      if (error.message?.includes('already started')) {
        console.log('ℹ️ Recognition zaten çalışıyor')
        setIsListening(true)
      } else {
        console.error('❌ Start hatası:', error)
        callbacksRef.current.onError?.(error.message)
      }
    }
  }, [isSupported])

  // Dinlemeyi durdur
  const stopListening = useCallback(() => {
    console.log('🛑 stopListening çağrıldı')
    shouldRestartRef.current = false
    
    if (recognitionRef.current) {
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
