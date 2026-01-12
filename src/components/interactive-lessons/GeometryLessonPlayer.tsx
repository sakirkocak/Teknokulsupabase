'use client'

/**
 * 🎓 GeometryLessonPlayer - İnteraktif Geometri Ders Oynatıcısı
 * 
 * Three.js ile interaktif konu anlatımı:
 * - Adım adım ilerleme
 * - TTS sesli anlatım
 * - 3D manipülasyon
 * - Quiz soruları
 * - 🖐️ MediaPipe el takibi kontrolü
 */

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Play, Pause, SkipForward, SkipBack, RotateCcw,
  Volume2, VolumeX, ChevronRight, ChevronLeft,
  Lightbulb, CheckCircle, XCircle, Home,
  Maximize2, Minimize2, Hand, Camera
} from 'lucide-react'
import dynamic from 'next/dynamic'
// GestureType tanımı
type GestureType = 'none' | 'point' | 'peace' | 'three' | 'four' | 'open' | 'fist'

// Three.js komponentlerini dinamik import (SSR devre dışı)
const ThreeCanvas = dynamic(() => import('./ThreeCanvas'), { ssr: false })
const InteractiveTriangle = dynamic(() => import('./InteractiveTriangle'), { ssr: false })
const HandTrackingOverlay = dynamic(() => import('./HandTrackingOverlay'), { ssr: false })
const ParticlePlayground = dynamic(() => import('./ParticlePlayground'), { ssr: false })

// Ders adımı tipi
interface LessonStep {
  id: string
  title: string
  content: string
  ttsText: string
  duration: number
  type: 'intro' | 'explanation' | 'interactive' | 'quiz' | 'summary'
  highlightVertex?: number
  showHeight?: boolean
  showMeasurements?: boolean
  showFormula?: boolean
  triangleConfig?: {
    vertices: [
      { x: number; y: number; z: number },
      { x: number; y: number; z: number },
      { x: number; y: number; z: number }
    ]
  }
  quiz?: {
    question: string
    options: { id: string; text: string; isCorrect: boolean }[]
    hint: string
  }
}

// Örnek ders: Üçgenin Alanı
const TRIANGLE_AREA_LESSON: LessonStep[] = [
  {
    id: 'intro',
    title: '📐 Üçgenin Alanı',
    content: 'Merhaba! Bugün üçgenin alanını nasıl hesaplayacağımızı öğreneceğiz. Üçgeni döndürerek incele!',
    ttsText: 'Merhaba! Bugün üçgenin alanını nasıl hesaplayacağımızı öğreneceğiz. Ekrandaki üçgeni fare ile döndürerek inceleyebilirsin.',
    duration: 5,
    type: 'intro',
    showHeight: false,
    showMeasurements: false,
    showFormula: false
  },
  {
    id: 'explain-base',
    title: '📏 Taban Nedir?',
    content: 'Üçgenin herhangi bir kenarını "taban" olarak seçebiliriz. A ve B noktaları arasındaki kenar bizim tabanımız.',
    ttsText: 'Üçgenin herhangi bir kenarını taban olarak seçebiliriz. A ve B noktaları arasındaki kenar bizim tabanımız. Mavi çizgiyi incele.',
    duration: 6,
    type: 'explanation',
    highlightVertex: 0,
    showHeight: false,
    showMeasurements: true,
    showFormula: false
  },
  {
    id: 'explain-height',
    title: '📐 Yükseklik Nedir?',
    content: 'Yükseklik, karşı köşeden (C) tabana çizilen DİK çizgidir. Kırmızı kesikli çizgiye dikkat et!',
    ttsText: 'Yükseklik, karşı köşeden tabana çizilen dik çizgidir. Kırmızı kesikli çizgi yüksekliğimizi gösteriyor. Bu çizgi tabana doksan derece açı yapmalı.',
    duration: 7,
    type: 'explanation',
    highlightVertex: 2,
    showHeight: true,
    showMeasurements: true,
    showFormula: false
  },
  {
    id: 'formula',
    title: '🧮 Alan Formülü',
    content: 'Alan = (Taban × Yükseklik) ÷ 2\n\nNeden ikiye bölüyoruz? Çünkü üçgen, aynı taban ve yüksekliğe sahip dikdörtgenin yarısıdır!',
    ttsText: 'Alan eşittir taban çarpı yükseklik bölü iki. Peki neden ikiye bölüyoruz? Çünkü üçgen, aynı taban ve yüksekliğe sahip dikdörtgenin tam yarısıdır!',
    duration: 8,
    type: 'explanation',
    showHeight: true,
    showMeasurements: true,
    showFormula: true
  },
  {
    id: 'interactive',
    title: '🖐️ Şimdi Sen Dene!',
    content: 'Üçgeni döndür ve farklı açılardan incele. Taban ve yükseklik değerlerini gözlemle.',
    ttsText: 'Şimdi sıra sende! Üçgeni fareyle döndürerek farklı açılardan incele. Taban ve yükseklik değerleri her zaman aynı kalıyor, değil mi?',
    duration: 10,
    type: 'interactive',
    showHeight: true,
    showMeasurements: true,
    showFormula: true
  },
  {
    id: 'quiz-1',
    title: '❓ Quiz Zamanı!',
    content: 'Öğrendiklerini test edelim:',
    ttsText: 'Şimdi öğrendiklerini test edelim. Aşağıdaki soruyu cevapla.',
    duration: 0,
    type: 'quiz',
    showHeight: true,
    showMeasurements: true,
    showFormula: true,
    quiz: {
      question: 'Tabanı 6 cm, yüksekliği 4 cm olan üçgenin alanı kaç cm²\'dir?',
      options: [
        { id: 'a', text: '24 cm²', isCorrect: false },
        { id: 'b', text: '12 cm²', isCorrect: true },
        { id: 'c', text: '10 cm²', isCorrect: false },
        { id: 'd', text: '20 cm²', isCorrect: false }
      ],
      hint: 'Alan = (Taban × Yükseklik) ÷ 2 formülünü kullan'
    }
  },
  {
    id: 'summary',
    title: '✅ Özet',
    content: '🎉 Tebrikler! Üçgenin alanını öğrendin.\n\n✓ Taban: Üçgenin herhangi bir kenarı\n✓ Yükseklik: Karşı köşeden tabana dik çizgi\n✓ Alan = (Taban × Yükseklik) ÷ 2',
    ttsText: 'Tebrikler! Üçgenin alanını başarıyla öğrendin. Unutma: Alan eşittir taban çarpı yükseklik bölü iki. Artık bu konudaki soruları çözebilirsin!',
    duration: 8,
    type: 'summary',
    showHeight: true,
    showMeasurements: true,
    showFormula: true
  }
]

interface GeometryLessonPlayerProps {
  lesson?: LessonStep[]
  lessonTitle?: string
  onComplete?: () => void
  onClose?: () => void
}

export default function GeometryLessonPlayer({
  lesson = TRIANGLE_AREA_LESSON,
  lessonTitle = 'Üçgenin Alanı',
  onComplete,
  onClose
}: GeometryLessonPlayerProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [quizAnswered, setQuizAnswered] = useState<Record<string, string>>({})
  const [quizCorrect, setQuizCorrect] = useState<Record<string, boolean>>({})
  const [showHint, setShowHint] = useState(false)
  const [triangleArea, setTriangleArea] = useState({ area: 0, base: 0, height: 0 })
  const [showHandTracking, setShowHandTracking] = useState(false)
  const [gestureNotification, setGestureNotification] = useState<string | null>(null)
  const [showParticleMode, setShowParticleMode] = useState(false)

  const currentStep = lesson[currentStepIndex]
  const isLastStep = currentStepIndex === lesson.length - 1
  const progress = ((currentStepIndex + 1) / lesson.length) * 100

  // 🖐️ El hareketi ile kontrol
  const handleGestureAction = useCallback((gesture: GestureType) => {
    let message = ''
    
    switch (gesture) {
      case 'point': // ☝️ İleri
        if (!isLastStep && (currentStep.type !== 'quiz' || quizAnswered[currentStep.id])) {
          setCurrentStepIndex(prev => prev + 1)
          message = '☝️ İleri!'
        }
        break
      case 'peace': // ✌️ Geri
        if (currentStepIndex > 0) {
          setCurrentStepIndex(prev => prev - 1)
          message = '✌️ Geri!'
        }
        break
      case 'three': // 🤟 İpucu
        if (currentStep.type === 'quiz' && !quizAnswered[currentStep.id]) {
          setShowHint(true)
          message = '🤟 İpucu gösteriliyor!'
        }
        break
      case 'four': // 🖖 Ses aç/kapat
        setIsMuted(prev => !prev)
        message = isMuted ? '🔊 Ses açıldı!' : '🔇 Ses kapatıldı!'
        break
      case 'open': // 🖐️ Oynat
        setIsPlaying(true)
        message = '▶️ Oynatılıyor!'
        break
      case 'fist': // ✊ Durdur
        setIsPlaying(false)
        message = '⏸️ Duraklatıldı!'
        break
    }

    if (message) {
      setGestureNotification(message)
      setTimeout(() => setGestureNotification(null), 1500)
    }
  }, [currentStepIndex, currentStep, isLastStep, quizAnswered, isMuted])

  // TTS ile sesli anlatım (basit web speech)
  const speak = useCallback((text: string) => {
    if (isMuted || typeof window === 'undefined') return
    
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'tr-TR'
    utterance.rate = 0.9
    utterance.pitch = 1
    window.speechSynthesis.speak(utterance)
  }, [isMuted])

  // Adım değiştiğinde TTS
  useEffect(() => {
    if (isPlaying && currentStep.ttsText) {
      speak(currentStep.ttsText)
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.speechSynthesis.cancel()
      }
    }
  }, [currentStepIndex, isPlaying, speak])

  // Otomatik ilerleme (quiz hariç)
  useEffect(() => {
    if (!isPlaying || currentStep.type === 'quiz' || currentStep.duration === 0) return

    const timer = setTimeout(() => {
      if (!isLastStep) {
        setCurrentStepIndex(prev => prev + 1)
      } else {
        setIsPlaying(false)
        onComplete?.()
      }
    }, currentStep.duration * 1000)

    return () => clearTimeout(timer)
  }, [currentStepIndex, isPlaying, currentStep, isLastStep, onComplete])

  // Quiz cevaplama
  const handleQuizAnswer = (stepId: string, optionId: string, isCorrect: boolean) => {
    setQuizAnswered(prev => ({ ...prev, [stepId]: optionId }))
    setQuizCorrect(prev => ({ ...prev, [stepId]: isCorrect }))
    
    if (isCorrect) {
      speak('Harika! Doğru cevap!')
    } else {
      speak('Maalesef yanlış. Tekrar dene!')
    }
  }

  // Navigasyon
  const goToStep = (index: number) => {
    if (index >= 0 && index < lesson.length) {
      setCurrentStepIndex(index)
      setShowHint(false)
    }
  }

  const nextStep = () => {
    if (!isLastStep) {
      goToStep(currentStepIndex + 1)
    } else {
      onComplete?.()
    }
  }

  const prevStep = () => {
    if (currentStepIndex > 0) {
      goToStep(currentStepIndex - 1)
    }
  }

  const restart = () => {
    setCurrentStepIndex(0)
    setIsPlaying(false)
    setQuizAnswered({})
    setQuizCorrect({})
    setShowHint(false)
  }

  // Particle Mode açıksa tam ekran particle playground göster
  if (showParticleMode) {
    return (
      <ParticlePlayground 
        onClose={() => setShowParticleMode(false)}
        educationMode={true}
        lessonTitle={currentStep.title}
        lessonContent={currentStep.content}
        onGestureAction={(gesture) => {
          // Particle mode'da da gesture aksiyonları çalışsın
          handleGestureAction(gesture)
        }}
      />
    )
  }

  return (
    <div className={`flex flex-col bg-slate-900 rounded-2xl overflow-hidden ${isFullscreen ? 'fixed inset-0 z-50 rounded-none' : 'h-[700px]'}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🎓</span>
          <div>
            <h2 className="text-white font-bold">{lessonTitle}</h2>
            <p className="text-white/70 text-xs">İnteraktif Konu Anlatımı</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* ✨ Particle Mode Butonu */}
          <button
            onClick={() => setShowParticleMode(true)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl font-medium text-sm transition-all bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
            title="Particle Mode"
          >
            <span>✨</span>
            <span className="hidden sm:inline">Particle</span>
          </button>
          
          {/* 🖐️ El Takibi Butonu - Belirgin */}
          <button
            onClick={() => setShowHandTracking(!showHandTracking)}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl font-medium text-sm transition-all ${
              showHandTracking 
                ? 'bg-green-500 hover:bg-green-600 text-white' 
                : 'bg-pink-500 hover:bg-pink-600 text-white animate-pulse'
            }`}
            title="Sihirli Dokunuş"
          >
            <Hand className="w-5 h-5" />
            <span className="hidden sm:inline">🖐️ El</span>
          </button>
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            {isFullscreen ? <Minimize2 className="w-5 h-5 text-white" /> : <Maximize2 className="w-5 h-5 text-white" />}
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <Home className="w-5 h-5 text-white" />
            </button>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="px-4 py-2 bg-slate-800">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
          <span>Adım {currentStepIndex + 1} / {lesson.length}</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      {/* Step Pills */}
      <div className="px-4 py-2 bg-slate-800/50 flex gap-2 overflow-x-auto">
        {lesson.map((step, i) => (
          <button
            key={step.id}
            onClick={() => goToStep(i)}
            className={`flex-shrink-0 w-8 h-8 rounded-full text-xs font-bold flex items-center justify-center transition-all ${
              i === currentStepIndex
                ? 'bg-indigo-500 text-white shadow-lg scale-110'
                : i < currentStepIndex || quizCorrect[step.id]
                ? 'bg-emerald-500/80 text-white'
                : 'bg-slate-600 text-slate-300 hover:bg-slate-500'
            }`}
          >
            {step.type === 'quiz' ? '?' : i + 1}
          </button>
        ))}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* 3D Canvas */}
        <div className="flex-1 relative min-h-[300px]">
          <ThreeCanvas
            cameraPosition={[6, 4, 6]}
            enableRotate={true}
            enableZoom={true}
            showGrid={true}
          >
            <InteractiveTriangle
              showHeight={currentStep.showHeight}
              showMeasurements={currentStep.showMeasurements}
              showFormula={currentStep.showFormula}
              highlightVertex={currentStep.highlightVertex}
              onAreaChange={(area, base, height) => setTriangleArea({ area, base, height })}
            />
          </ThreeCanvas>

          {/* Etkileşim ipucu */}
          {currentStep.type === 'interactive' && !showHandTracking && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute bottom-4 left-4 px-4 py-2 bg-amber-500/90 rounded-xl flex items-center gap-2 text-sm text-white"
            >
              <Hand className="w-5 h-5" />
              <span>Fare ile döndür, scroll ile yakınlaş</span>
            </motion.div>
          )}

          {/* 🖐️ El Takibi Overlay */}
          {showHandTracking && (
            <div className="absolute top-4 right-4 z-20">
              <HandTrackingOverlay 
                onGestureAction={handleGestureAction}
                showInstructions={true}
                particleMode={true}
              />
            </div>
          )}

          {/* Gesture Notification */}
          <AnimatePresence>
            {gestureNotification && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8, y: -20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, y: -20 }}
                className="absolute top-4 left-1/2 transform -translate-x-1/2 px-6 py-3 bg-indigo-600/90 backdrop-blur-sm rounded-xl text-white font-bold text-lg shadow-xl z-30"
              >
                {gestureNotification}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Sağ Panel - İçerik */}
        <div className="w-full lg:w-96 bg-slate-800 flex flex-col">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex-1 p-4 overflow-y-auto"
            >
              {/* Adım Başlığı */}
              <h3 className="text-xl font-bold text-white mb-3">{currentStep.title}</h3>

              {/* İçerik */}
              {currentStep.type === 'quiz' && currentStep.quiz ? (
                <div className="space-y-4">
                  <p className="text-slate-300">{currentStep.quiz.question}</p>

                  {/* Quiz seçenekleri */}
                  <div className="space-y-2">
                    {currentStep.quiz.options.map(option => {
                      const isSelected = quizAnswered[currentStep.id] === option.id
                      const answered = quizAnswered[currentStep.id]
                      let bgColor = 'bg-slate-700 hover:bg-slate-600'
                      
                      if (answered) {
                        if (option.isCorrect) bgColor = 'bg-emerald-600'
                        else if (isSelected) bgColor = 'bg-red-600'
                      }

                      return (
                        <button
                          key={option.id}
                          onClick={() => !answered && handleQuizAnswer(currentStep.id, option.id, option.isCorrect)}
                          disabled={!!answered}
                          className={`w-full p-3 rounded-xl text-left transition-all ${bgColor} ${answered ? '' : 'cursor-pointer'}`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-white">{option.text}</span>
                            {answered && isSelected && (
                              option.isCorrect
                                ? <CheckCircle className="w-5 h-5 text-white" />
                                : <XCircle className="w-5 h-5 text-white" />
                            )}
                            {answered && option.isCorrect && !isSelected && (
                              <CheckCircle className="w-5 h-5 text-emerald-300" />
                            )}
                          </div>
                        </button>
                      )
                    })}
                  </div>

                  {/* İpucu */}
                  {!quizAnswered[currentStep.id] && (
                    <button
                      onClick={() => setShowHint(true)}
                      className="flex items-center gap-2 text-amber-400 text-sm hover:text-amber-300"
                    >
                      <Lightbulb className="w-4 h-4" />
                      İpucu göster
                    </button>
                  )}

                  {showHint && !quizAnswered[currentStep.id] && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-3 bg-amber-500/20 border border-amber-500/50 rounded-xl"
                    >
                      <p className="text-amber-200 text-sm">{currentStep.quiz.hint}</p>
                    </motion.div>
                  )}

                  {/* Sonuç mesajı */}
                  {quizAnswered[currentStep.id] && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className={`p-4 rounded-xl ${quizCorrect[currentStep.id] ? 'bg-emerald-600/30 border border-emerald-500' : 'bg-red-600/30 border border-red-500'}`}
                    >
                      <p className="text-white font-medium">
                        {quizCorrect[currentStep.id] ? '🎉 Harika! Doğru cevap!' : '❌ Yanlış. Doğru cevabı kontrol et.'}
                      </p>
                    </motion.div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-slate-300 whitespace-pre-line leading-relaxed">
                    {currentStep.content}
                  </p>

                  {/* Canlı alan hesabı */}
                  {currentStep.showFormula && (
                    <div className="p-4 bg-slate-700/50 rounded-xl">
                      <p className="text-slate-400 text-sm mb-2">Canlı Hesaplama:</p>
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="bg-blue-500/20 p-2 rounded-lg">
                          <p className="text-blue-300 text-xs">Taban</p>
                          <p className="text-white font-bold">{triangleArea.base.toFixed(1)} cm</p>
                        </div>
                        <div className="bg-red-500/20 p-2 rounded-lg">
                          <p className="text-red-300 text-xs">Yükseklik</p>
                          <p className="text-white font-bold">{triangleArea.height.toFixed(1)} cm</p>
                        </div>
                        <div className="bg-emerald-500/20 p-2 rounded-lg">
                          <p className="text-emerald-300 text-xs">Alan</p>
                          <p className="text-white font-bold">{triangleArea.area.toFixed(1)} cm²</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Kontroller */}
          <div className="p-4 bg-slate-900 border-t border-slate-700">
            <div className="flex items-center justify-between">
              {/* Sol: Oynatma kontrolleri */}
              <div className="flex items-center gap-2">
                <button
                  onClick={prevStep}
                  disabled={currentStepIndex === 0}
                  className="p-2 rounded-lg bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-5 h-5 text-white" />
                </button>

                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="p-3 rounded-xl bg-indigo-500 hover:bg-indigo-600 transition-colors"
                >
                  {isPlaying ? <Pause className="w-5 h-5 text-white" /> : <Play className="w-5 h-5 text-white" />}
                </button>

                <button
                  onClick={() => setIsMuted(!isMuted)}
                  className={`p-2 rounded-lg ${isMuted ? 'bg-red-500/30 text-red-400' : 'bg-slate-700 text-white'} hover:opacity-80`}
                >
                  {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                </button>

                <button
                  onClick={restart}
                  className="p-2 rounded-lg bg-slate-700 hover:bg-slate-600"
                >
                  <RotateCcw className="w-5 h-5 text-white" />
                </button>
              </div>

              {/* Sağ: İleri */}
              <button
                onClick={nextStep}
                disabled={currentStep.type === 'quiz' && !quizAnswered[currentStep.id]}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 rounded-xl text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {isLastStep ? 'Bitir' : 'Devam'}
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
