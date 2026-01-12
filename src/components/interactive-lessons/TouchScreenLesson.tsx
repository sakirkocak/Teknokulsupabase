'use client'

import { useRef, useState, useEffect, useCallback } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Html, Line, Text } from '@react-three/drei'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Volume2, VolumeX, RotateCcw, Sparkles, Hand, ChevronLeft, ChevronRight, Play, Pause } from 'lucide-react'
import * as THREE from 'three'

// ============================================
// 👆 TOUCH SCREEN LESSON - Dokunmatik Ekran Tarzı
// ============================================

interface TouchScreenLessonProps {
  onClose?: () => void
  lesson?: {
    title: string
    steps: Array<{
      title: string
      content: string
      base?: number
      height?: number
    }>
  }
}

// 🎯 Parmak İmleci - Ekranda görünen işaretçi
function FingerCursor({ position, isPressed }: { position: { x: number, y: number } | null, isPressed: boolean }) {
  if (!position) return null
  
  return (
    <div 
      className="absolute pointer-events-none z-50 transition-transform duration-75"
      style={{
        left: `${position.x * 100}%`,
        top: `${position.y * 100}%`,
        transform: 'translate(-50%, -50%)'
      }}
    >
      {/* Dış halka */}
      <div className={`absolute -inset-4 rounded-full border-2 transition-all duration-150 ${
        isPressed 
          ? 'border-green-400 bg-green-400/20 scale-75' 
          : 'border-cyan-400 bg-cyan-400/10'
      }`} />
      
      {/* İç nokta */}
      <div className={`w-4 h-4 rounded-full transition-all duration-150 ${
        isPressed 
          ? 'bg-green-400 scale-150 shadow-lg shadow-green-400/50' 
          : 'bg-cyan-400 shadow-lg shadow-cyan-400/50'
      }`} />
      
      {/* Basıldığında ripple efekti */}
      {isPressed && (
        <div className="absolute -inset-8 rounded-full border-2 border-green-400/50 animate-ping" />
      )}
    </div>
  )
}

// 🔺 3D Üçgen - Dokunmatik kontrol
function TouchableTriangle({ 
  base, 
  height, 
  fingerPosition,
  isFingerPressed,
  isDragging,
  onDrag
}: { 
  base: number
  height: number
  fingerPosition: { x: number, y: number } | null
  isFingerPressed: boolean
  isDragging: boolean
  onDrag: (delta: { x: number, y: number }) => void
}) {
  const meshRef = useRef<THREE.Group>(null)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [rotation, setRotation] = useState(0)
  const lastFingerPos = useRef<{ x: number, y: number } | null>(null)
  
  // Sürükleme işlemi
  useEffect(() => {
    if (isDragging && fingerPosition && lastFingerPos.current) {
      const deltaX = (fingerPosition.x - lastFingerPos.current.x) * 10
      const deltaY = (fingerPosition.y - lastFingerPos.current.y) * 10
      
      setPosition(prev => ({
        x: prev.x - deltaX, // Ayna efekti için ters
        y: prev.y - deltaY
      }))
    }
    lastFingerPos.current = fingerPosition
  }, [fingerPosition, isDragging])
  
  useFrame((state, delta) => {
    if (!meshRef.current) return
    
    // Pozisyonu güncelle
    meshRef.current.position.x += (position.x - meshRef.current.position.x) * 0.2
    meshRef.current.position.y += (position.y - meshRef.current.position.y) * 0.2
    
    // El yokken yavaş dönsün
    if (!fingerPosition) {
      meshRef.current.rotation.y += delta * 0.2
    }
  })
  
  // Üçgen vertices
  const vertices = [
    new THREE.Vector3(-base/2, 0, 0),
    new THREE.Vector3(base/2, 0, 0),
    new THREE.Vector3(0, height, 0),
  ]
  
  const area = (base * height) / 2
  
  return (
    <group ref={meshRef}>
      {/* Ana üçgen */}
      <mesh>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={3}
            array={new Float32Array([
              ...vertices[0].toArray(),
              ...vertices[1].toArray(),
              ...vertices[2].toArray()
            ])}
            itemSize={3}
          />
        </bufferGeometry>
        <meshStandardMaterial 
          color={isDragging ? "#22c55e" : "#06b6d4"} 
          transparent 
          opacity={0.4}
          side={THREE.DoubleSide}
          emissive={isDragging ? "#22c55e" : "#06b6d4"}
          emissiveIntensity={0.3}
        />
      </mesh>
      
      {/* Kenar çizgileri */}
      <Line
        points={[...vertices, vertices[0]]}
        color={isDragging ? "#22c55e" : "#06b6d4"}
        lineWidth={4}
      />
      
      {/* Köşe noktaları - Sürüklenebilir görünüm */}
      {vertices.map((v, i) => (
        <mesh key={i} position={v}>
          <sphereGeometry args={[0.2, 16, 16]} />
          <meshStandardMaterial 
            color={i === 2 ? '#f472b6' : '#06b6d4'} 
            emissive={i === 2 ? '#f472b6' : '#06b6d4'}
            emissiveIntensity={0.8}
          />
        </mesh>
      ))}
      
      {/* Yükseklik çizgisi */}
      <Line
        points={[
          new THREE.Vector3(0, 0, 0),
          new THREE.Vector3(0, height, 0)
        ]}
        color="#facc15"
        lineWidth={2}
        dashed
        dashSize={0.2}
        gapSize={0.1}
      />
      
      {/* Etiketler */}
      <Html position={[0, -0.6, 0]} center>
        <div className="px-3 py-1.5 bg-cyan-500/90 backdrop-blur-sm rounded-lg text-white text-sm font-bold whitespace-nowrap shadow-lg">
          Taban: {base} cm
        </div>
      </Html>
      
      <Html position={[0.9, height/2, 0]} center>
        <div className="px-3 py-1.5 bg-yellow-500/90 backdrop-blur-sm rounded-lg text-white text-sm font-bold whitespace-nowrap shadow-lg">
          h = {height} cm
        </div>
      </Html>
      
      <Html position={[0, height/3, 0.5]} center>
        <div className="px-4 py-2 bg-gradient-to-r from-purple-500/95 to-pink-500/95 backdrop-blur-sm rounded-xl text-white font-bold whitespace-nowrap shadow-xl">
          <div className="text-xs opacity-80">Alan</div>
          <div className="text-2xl">{area.toFixed(1)} cm²</div>
        </div>
      </Html>
    </group>
  )
}

// 📱 Ana Bileşen
export default function TouchScreenLesson({ onClose, lesson }: TouchScreenLessonProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  
  const [isRunning, setIsRunning] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [isMuted, setIsMuted] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  
  // El takibi state
  const [fingerPosition, setFingerPosition] = useState<{ x: number, y: number } | null>(null)
  const [isFingerPressed, setIsFingerPressed] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [isHandDetected, setIsHandDetected] = useState(false)
  const [actionFeedback, setActionFeedback] = useState<string | null>(null)
  
  // Tıklama algılama
  const fingerZRef = useRef(0)
  const pressStartTime = useRef<number | null>(null)
  const lastTapTime = useRef<number>(0)
  
  // MediaPipe refs
  const handsRef = useRef<any>(null)
  const cameraRef = useRef<any>(null)
  
  // Varsayılan ders
  const defaultLesson = {
    title: "Üçgenin Alanı",
    steps: [
      { title: "👆 Dokun ve Sürükle", content: "İşaret parmağınla üçgeni tut ve sürükle!", base: 4, height: 3 },
      { title: "✌️ Çift Tıkla", content: "Hızlıca iki kez dokun - bir sonraki adıma geç!", base: 5, height: 4 },
      { title: "🔄 Boyutları Gör", content: "Üçgenin boyutları değişti! Alan nasıl hesaplanır?", base: 6, height: 3 },
      { title: "🎉 Tebrikler!", content: "Alan = Taban × Yükseklik ÷ 2 formülünü öğrendin!", base: 4, height: 5 },
    ]
  }
  
  const activeLesson = lesson || defaultLesson
  const step = activeLesson.steps[currentStep] || activeLesson.steps[0]
  
  // Step yoksa hata verme
  const currentBase = step?.base || 4
  const currentHeight = step?.height || 3
  
  // İşaret parmağı ucu pozisyonunu al
  const getFingerTipPosition = useCallback((landmarks: any[]) => {
    if (!landmarks || landmarks.length < 21) return null
    
    const indexTip = landmarks[8] // İşaret parmağı ucu
    return { x: indexTip.x, y: indexTip.y, z: indexTip.z }
  }, [])
  
  // Basma algılama (parmak bükülmesi)
  const isFingerBent = useCallback((landmarks: any[]) => {
    if (!landmarks || landmarks.length < 21) return false
    
    const indexTip = landmarks[8]
    const indexDIP = landmarks[7]
    const indexPIP = landmarks[6]
    
    // Parmak bükülmüş mü? (tip, DIP'ten aşağıda)
    return indexTip.y > indexDIP.y
  }, [])
  
  // MediaPipe başlat
  const startTracking = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 1280, height: 720 }
      })
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
      
      const { Hands } = await import('@mediapipe/hands')
      const { Camera } = await import('@mediapipe/camera_utils')
      
      const hands = new Hands({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1675469240/${file}`
      })
      
      hands.setOptions({
        maxNumHands: 1,
        modelComplexity: 1,
        minDetectionConfidence: 0.8,
        minTrackingConfidence: 0.8
      })
      
      hands.onResults((results: any) => {
        // Canvas'a çiz
        if (canvasRef.current && videoRef.current) {
          const ctx = canvasRef.current.getContext('2d')
          if (ctx) {
            canvasRef.current.width = videoRef.current.videoWidth
            canvasRef.current.height = videoRef.current.videoHeight
            ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
            
            if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
              const landmarks = results.multiHandLandmarks[0]
              setIsHandDetected(true)
              
              // Parmak ucu pozisyonu
              const fingerTip = getFingerTipPosition(landmarks)
              if (fingerTip) {
                setFingerPosition({ x: fingerTip.x, y: fingerTip.y })
                
                // Basma algılama
                const bent = isFingerBent(landmarks)
                
                if (bent && !isFingerPressed) {
                  // Basma başladı
                  setIsFingerPressed(true)
                  pressStartTime.current = Date.now()
                  
                  // Çift tıklama kontrolü
                  const now = Date.now()
                  if (now - lastTapTime.current < 400) {
                    // Çift tıklama!
                    setActionFeedback('✌️ Çift Tıklama!')
                    setTimeout(() => setActionFeedback(null), 800)
                    
                    // Sonraki adıma geç
                    if (currentStep < activeLesson.steps.length - 1) {
                      setCurrentStep(prev => prev + 1)
                    }
                  }
                  lastTapTime.current = now
                  
                } else if (bent && isFingerPressed) {
                  // Basılı tutuluyor - sürükleme
                  if (pressStartTime.current && Date.now() - pressStartTime.current > 200) {
                    if (!isDragging) {
                      setIsDragging(true)
                      setActionFeedback('👆 Sürükleniyor...')
                    }
                  }
                  
                } else if (!bent && isFingerPressed) {
                  // Bırakıldı
                  setIsFingerPressed(false)
                  setIsDragging(false)
                  pressStartTime.current = null
                  setActionFeedback(null)
                }
              }
              
              // El çizimi - Minimal ve modern
              // Sadece işaret parmağı vurgulu
              const fingerIndices = [5, 6, 7, 8] // İşaret parmağı
              
              ctx.strokeStyle = '#06b6d4'
              ctx.lineWidth = 3
              ctx.shadowColor = '#06b6d4'
              ctx.shadowBlur = 10
              
              for (let i = 0; i < fingerIndices.length - 1; i++) {
                const start = landmarks[fingerIndices[i]]
                const end = landmarks[fingerIndices[i + 1]]
                ctx.beginPath()
                ctx.moveTo(start.x * canvasRef.current!.width, start.y * canvasRef.current!.height)
                ctx.lineTo(end.x * canvasRef.current!.width, end.y * canvasRef.current!.height)
                ctx.stroke()
              }
              
              // Parmak ucu - Büyük ve belirgin
              const tip = landmarks[8]
              ctx.beginPath()
              ctx.arc(
                tip.x * canvasRef.current!.width, 
                tip.y * canvasRef.current!.height, 
                isFingerPressed ? 20 : 12, 
                0, 
                Math.PI * 2
              )
              ctx.fillStyle = isFingerPressed ? '#22c55e' : '#06b6d4'
              ctx.shadowColor = ctx.fillStyle
              ctx.shadowBlur = 20
              ctx.fill()
              
            } else {
              setIsHandDetected(false)
              setFingerPosition(null)
              setIsFingerPressed(false)
              setIsDragging(false)
            }
          }
        }
      })
      
      handsRef.current = hands
      
      if (videoRef.current) {
        const camera = new Camera(videoRef.current, {
          onFrame: async () => {
            if (handsRef.current && videoRef.current) {
              await handsRef.current.send({ image: videoRef.current })
            }
          },
          width: 1280,
          height: 720
        })
        camera.start()
        cameraRef.current = camera
      }
      
      setIsRunning(true)
      
    } catch (error) {
      console.error('Tracking error:', error)
      alert('Kamera erişimi gerekli!')
    }
  }, [getFingerTipPosition, isFingerBent, isFingerPressed, isDragging, currentStep, activeLesson.steps.length])
  
  // Cleanup
  useEffect(() => {
    return () => {
      if (cameraRef.current) cameraRef.current.stop()
      if (videoRef.current?.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks()
        tracks.forEach(track => track.stop())
      }
    }
  }, [])
  
  // TTS
  const speak = (text: string) => {
    if (isMuted) return
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'tr-TR'
    utterance.rate = 0.9
    window.speechSynthesis.speak(utterance)
  }
  
  useEffect(() => {
    if (isRunning && !isPaused && step) {
      speak(`${step.title}. ${step.content}`)
    }
  }, [currentStep, isRunning, isPaused, step])
  
  const nextStep = () => {
    if (currentStep < activeLesson.steps.length - 1) {
      setCurrentStep(prev => prev + 1)
    }
  }
  
  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-900">
      {/* Kamera Video - Arka Plan */}
      <video 
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover transform scale-x-[-1]"
        playsInline
        muted
      />
      
      {/* El Çizim Canvas */}
      <canvas 
        ref={canvasRef}
        className="absolute inset-0 w-full h-full object-cover transform scale-x-[-1] pointer-events-none"
      />
      
      {/* Koyu overlay */}
      <div className="absolute inset-0 bg-slate-900/50 pointer-events-none" />
      
      {/* Parmak İmleci */}
      {isRunning && (
        <FingerCursor position={fingerPosition} isPressed={isFingerPressed} />
      )}
      
      {/* 3D Canvas */}
      {isRunning && (
        <div className="absolute inset-0 pointer-events-none">
          <Canvas
            style={{ background: 'transparent' }}
            gl={{ alpha: true }}
            camera={{ position: [0, 2, 8], fov: 50 }}
          >
            <ambientLight intensity={0.6} />
            <pointLight position={[10, 10, 10]} intensity={1} color="#06b6d4" />
            <pointLight position={[-10, -10, -10]} intensity={0.5} color="#f472b6" />
            
            <TouchableTriangle 
              base={currentBase}
              height={currentHeight}
              fingerPosition={fingerPosition}
              isFingerPressed={isFingerPressed}
              isDragging={isDragging}
              onDrag={() => {}}
            />
          </Canvas>
        </div>
      )}
      
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-6 py-4 bg-gradient-to-b from-slate-900/90 to-transparent">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center text-2xl">
            👆
          </div>
          <div>
            <h1 className="text-white font-black text-2xl">{activeLesson.title}</h1>
            <p className="text-cyan-400 text-sm">Dokunmatik Kontrol</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="p-3 rounded-xl bg-slate-800/80 text-white hover:bg-slate-700/80"
          >
            {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </button>
          
          {onClose && (
            <button onClick={onClose} className="p-3 rounded-xl bg-red-500/80 text-white hover:bg-red-600/80">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
      
      {/* Başlangıç Ekranı */}
      {!isRunning && (
        <div className="absolute inset-0 flex items-center justify-center z-30">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center max-w-md px-6"
          >
            <div className="w-32 h-32 mx-auto mb-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center text-6xl shadow-2xl shadow-cyan-500/50">
              👆
            </div>
            <h2 className="text-4xl font-black text-white mb-4">
              Dokunmatik Mod
            </h2>
            <p className="text-slate-400 text-lg mb-8">
              Telefon kullanır gibi! İşaret parmağınla dokun, sürükle ve çift tıkla.
            </p>
            
            {/* Kontrol açıklamaları */}
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="bg-slate-800/80 rounded-xl p-4 text-left">
                <div className="text-3xl mb-2">👆</div>
                <div className="text-white font-semibold">Dokun & Sürükle</div>
                <div className="text-slate-400 text-sm">Parmağını bük ve hareket et</div>
              </div>
              <div className="bg-slate-800/80 rounded-xl p-4 text-left">
                <div className="text-3xl mb-2">✌️</div>
                <div className="text-white font-semibold">Çift Tıkla</div>
                <div className="text-slate-400 text-sm">Hızlıca 2 kez dokun</div>
              </div>
            </div>
            
            <button
              onClick={startTracking}
              className="px-10 py-5 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-xl font-bold hover:scale-105 transition-transform shadow-2xl shadow-cyan-500/50"
            >
              👆 Başla
            </button>
          </motion.div>
        </div>
      )}
      
      {/* Action Feedback */}
      <AnimatePresence>
        {actionFeedback && isRunning && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5, y: -50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.5 }}
            className="absolute top-24 left-1/2 transform -translate-x-1/2 z-30 px-8 py-4 rounded-2xl bg-green-500/90 backdrop-blur-sm text-white text-2xl font-bold shadow-2xl"
          >
            {actionFeedback}
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Ders İçeriği - Sol */}
      {isRunning && (
        <motion.div
          initial={{ x: -100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="absolute top-24 left-6 z-20 w-80"
        >
          <div className="bg-slate-900/90 backdrop-blur-sm rounded-2xl p-6 border border-cyan-500/30">
            {/* Adım göstergeleri */}
            <div className="flex gap-2 mb-4">
              {activeLesson.steps.map((_, i) => (
                <div
                  key={i}
                  className={`h-2 flex-1 rounded-full transition-all ${
                    i === currentStep
                      ? 'bg-cyan-500'
                      : i < currentStep
                      ? 'bg-green-500'
                      : 'bg-slate-700'
                  }`}
                />
              ))}
            </div>
            
            <div className="text-cyan-400 text-sm font-medium mb-1">
              Adım {currentStep + 1} / {activeLesson.steps.length}
            </div>
            <h3 className="text-xl font-bold text-white mb-2">{step?.title || 'Ders'}</h3>
            <p className="text-slate-300">{step?.content || 'İçerik yükleniyor...'}</p>
          </div>
        </motion.div>
      )}
      
      {/* El Durumu - Sağ Alt */}
      {isRunning && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="absolute bottom-6 right-6 z-20"
        >
          <div className="bg-slate-900/90 backdrop-blur-sm rounded-2xl px-6 py-4 border border-cyan-500/30 flex items-center gap-4">
            <div className={`w-4 h-4 rounded-full ${isHandDetected ? 'bg-green-500 animate-pulse' : 'bg-slate-600'}`} />
            <span className="text-white font-medium">
              {isHandDetected 
                ? isDragging 
                  ? '👆 Sürükleniyor' 
                  : isFingerPressed 
                    ? '✅ Basılı' 
                    : '🖐️ Hazır'
                : '❌ El Algılanmadı'}
            </span>
          </div>
        </motion.div>
      )}
      
      {/* Navigation - Alt Orta */}
      {isRunning && (
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-20 flex items-center gap-4">
          <button
            onClick={prevStep}
            disabled={currentStep === 0}
            className="p-4 rounded-xl bg-slate-800/80 text-white hover:bg-slate-700/80 disabled:opacity-50"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          
          <div className="px-8 py-3 rounded-xl bg-cyan-500/80 backdrop-blur-sm text-white font-bold text-lg">
            {currentStep + 1} / {activeLesson.steps.length}
          </div>
          
          <button
            onClick={nextStep}
            disabled={currentStep === activeLesson.steps.length - 1}
            className="p-4 rounded-xl bg-slate-800/80 text-white hover:bg-slate-700/80 disabled:opacity-50"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>
      )}
      
      {/* Kontrol İpuçları - Sol Alt */}
      {isRunning && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="absolute bottom-6 left-6 z-20"
        >
          <div className="bg-slate-900/90 backdrop-blur-sm rounded-xl p-3 border border-slate-700/50 text-xs">
            <div className="flex items-center gap-4 text-slate-400">
              <span>👆 <span className="text-slate-300">Sürükle</span></span>
              <span>✌️ <span className="text-slate-300">Çift tıkla = İleri</span></span>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}
