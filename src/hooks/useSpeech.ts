'use client'

import { useState, useEffect, useCallback } from 'react'

interface UseSpeechOptions {
  lang?: string
  rate?: number
  pitch?: number
  volume?: number
}

interface UseSpeechReturn {
  speak: (text: string) => void
  stop: () => void
  speaking: boolean
  supported: boolean
  voices: SpeechSynthesisVoice[]
}

export function useSpeech(options: UseSpeechOptions = {}): UseSpeechReturn {
  const {
    lang = 'tr-TR',
    rate = 0.9,
    pitch = 1,
    volume = 1
  } = options

  const [speaking, setSpeaking] = useState(false)
  const [supported, setSupported] = useState(false)
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      setSupported(true)
      
      // Sesleri yükle
      const loadVoices = () => {
        const availableVoices = speechSynthesis.getVoices()
        setVoices(availableVoices)
      }

      loadVoices()
      speechSynthesis.onvoiceschanged = loadVoices
    }
  }, [])

  const speak = useCallback((text: string) => {
    if (!supported || !text) return

    // Önceki konuşmayı durdur
    speechSynthesis.cancel()

    // LaTeX ve özel karakterleri temizle
    let cleanText = text
      .replace(/\$\$(.*?)\$\$/g, '') // LaTeX blokları
      .replace(/\$(.*?)\$/g, '') // Inline LaTeX
      .replace(/\\frac\{([^}]*)\}\{([^}]*)\}/g, '$1 bölü $2') // Kesirler
      .replace(/\\sqrt\{([^}]*)\}/g, '$1 karekök') // Karekök
      .replace(/\\times/g, ' çarpı ')
      .replace(/\\div/g, ' bölü ')
      .replace(/\\pm/g, ' artı eksi ')
      .replace(/\\leq/g, ' küçük eşit ')
      .replace(/\\geq/g, ' büyük eşit ')
      .replace(/\\neq/g, ' eşit değil ')
      .replace(/\\pi/g, ' pi ')
      .replace(/\^2/g, ' kare ')
      .replace(/\^3/g, ' küp ')
      .replace(/\^/g, ' üzeri ')
      .replace(/_/g, ' ')
      .replace(/[{}\\]/g, '')
      .replace(/\s+/g, ' ')
      .trim()

    const utterance = new SpeechSynthesisUtterance(cleanText)
    utterance.lang = lang
    utterance.rate = rate
    utterance.pitch = pitch
    utterance.volume = volume

    // Türkçe sesi bul
    const turkishVoice = voices.find(v => v.lang.startsWith('tr'))
    if (turkishVoice) {
      utterance.voice = turkishVoice
    }

    utterance.onstart = () => setSpeaking(true)
    utterance.onend = () => setSpeaking(false)
    utterance.onerror = () => setSpeaking(false)

    speechSynthesis.speak(utterance)
  }, [supported, lang, rate, pitch, volume, voices])

  const stop = useCallback(() => {
    if (supported) {
      speechSynthesis.cancel()
      setSpeaking(false)
    }
  }, [supported])

  return { speak, stop, speaking, supported, voices }
}

// Harf ve hece seslendirme için özel hook
export function useLetterSpeech() {
  const { speak, stop, speaking, supported } = useSpeech({ rate: 0.6 })

  const speakLetter = useCallback((letter: string) => {
    // Harfin sesini çıkar (fonetik)
    const phonetics: Record<string, string> = {
      'a': 'a',
      'b': 'be',
      'c': 'ce',
      'ç': 'çe',
      'd': 'de',
      'e': 'e',
      'f': 'fe',
      'g': 'ge',
      'ğ': 'yumuşak ge',
      'h': 'he',
      'ı': 'ı',
      'i': 'i',
      'j': 'je',
      'k': 'ke',
      'l': 'le',
      'm': 'me',
      'n': 'ne',
      'o': 'o',
      'ö': 'ö',
      'p': 'pe',
      'r': 're',
      's': 'se',
      'ş': 'şe',
      't': 'te',
      'u': 'u',
      'ü': 'ü',
      'v': 've',
      'y': 'ye',
      'z': 'ze',
    }
    
    const lowerLetter = letter.toLowerCase()
    const sound = phonetics[lowerLetter] || letter
    speak(sound)
  }, [speak])

  const speakSyllable = useCallback((syllable: string) => {
    speak(syllable)
  }, [speak])

  const speakWord = useCallback((word: string) => {
    speak(word)
  }, [speak])

  const speakSentence = useCallback((sentence: string) => {
    speak(sentence)
  }, [speak])

  return {
    speakLetter,
    speakSyllable,
    speakWord,
    speakSentence,
    stop,
    speaking,
    supported
  }
}

export default useSpeech

