'use client'

import { useRef, useState, useEffect, useCallback } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, Html, Line, Environment, PerspectiveCamera } from '@react-three/drei'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Volume2, VolumeX, RotateCcw, Sparkles, Hand, Maximize2, ChevronLeft, ChevronRight } from 'lucide-react'
import * as THREE from 'three'

// ============================================
// 🦾 HOLOGRAPHIC LESSON - Iron Man Jarvis Style
// ============================================

interface HolographicLessonProps {
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

// 🔺 3D Üçgen - El ile kontrol edilebilir
function HolographicTriangle({ 
  base, 
  height, 
  handPosition,
  handGesture,
  isHandDetected
}: { 
  base: number
  height: number
  handPosition: { x: number, y: number } | null
  handGesture: string
  isHandDetected: boolean
}) {
  const meshRef = useRef<THREE.Group>(null)
  const [targetRotation, setTargetRotation] = useState({ x: 0, y: 0 })
  const [targetScale, setTargetScale] = useState(1)
  const [targetPosition, setTargetPosition] = useState({ x: 0, y: 0 })
  
  // El pozisyonuna göre objeyi kontrol et
  useEffect(() => {
    if (!handPosition || !isHandDetected) return
    
    // Normalize hand position (-1 to 1)
    const normalizedX = (handPosition.x - 0.5) * 2
    const normalizedY = (handPosition.y - 0.5) * 2
    
    if (handGesture === 'open') {
      // Açık el = Döndür
      setTargetRotation({
        x: normalizedY * Math.PI * 0.5,
        y: normalizedX * Math.PI * 0.5
      })
    } else if (handGesture === 'fist') {
      // Yumruk = Yakınlaştır (el yukarıdaysa büyük, aşağıdaysa küçük)
      setTargetScale(1 + (0.5 - handPosition.y) * 1.5)
    } else if (handGesture === 'point') {
      // İşaret = Hareket ettir
      setTargetPosition({
        x: normalizedX * 2,
        y: -normalizedY * 2
      })
    } else if (handGesture === 'peace') {
      // Barış = Reset
      setTargetRotation({ x: 0, y: 0 })
      setTargetScale(1)
      setTargetPosition({ x: 0, y: 0 })
    }
  }, [handPosition, handGesture, isHandDetected])
  
  useFrame((state, delta) => {
    if (!meshRef.current) return
    
    // Smooth interpolation
    meshRef.current.rotation.x += (targetRotation.x - meshRef.current.rotation.x) * 0.1
    meshRef.current.rotation.y += (targetRotation.y - meshRef.current.rotation.y) * 0.1
    
    const currentScale = meshRef.current.scale.x
    const newScale = currentScale + (targetScale - currentScale) * 0.1
    meshRef.current.scale.set(newScale, newScale, newScale)
    
    meshRef.current.position.x += (targetPosition.x - meshRef.current.position.x) * 0.1
    meshRef.current.position.y += (targetPosition.y - meshRef.current.position.y) * 0.1
    
    // Idle animation when no hand
    if (!isHandDetected) {
      meshRef.current.rotation.y += delta * 0.3
    }
  })
  
  // Üçgen vertices
  const vertices = [
    new THREE.Vector3(-base/2, 0, 0),      // Sol alt
    new THREE.Vector3(base/2, 0, 0),       // Sağ alt
    new THREE.Vector3(0, height, 0),       // Tepe
  ]
  
  const area = (base * height) / 2
  
  return (
    <group ref={meshRef}>
      {/* Ana üçgen - Holografik görünüm */}
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
          color="#00ffff" 
          transparent 
          opacity={0.3}
          side={THREE.DoubleSide}
          emissive="#00ffff"
          emissiveIntensity={0.5}
        />
      </mesh>
      
      {/* Kenar çizgileri - Neon efekti */}
      <Line
        points={[...vertices, vertices[0]]}
        color="#00ffff"
        lineWidth={3}
        transparent
        opacity={0.9}
      />
      
      {/* Köşe noktaları */}
      {vertices.map((v, i) => (
        <mesh key={i} position={v}>
          <sphereGeometry args={[0.15, 16, 16]} />
          <meshStandardMaterial 
            color={i === 2 ? '#ff00ff' : '#00ffff'} 
            emissive={i === 2 ? '#ff00ff' : '#00ffff'}
            emissiveIntensity={1}
          />
        </mesh>
      ))}
      
      {/* Yükseklik çizgisi */}
      <Line
        points={[
          new THREE.Vector3(0, 0, 0),
          new THREE.Vector3(0, height, 0)
        ]}
        color="#ffff00"
        lineWidth={2}
        dashed
        dashSize={0.2}
        gapSize={0.1}
      />
      
      {/* Taban etiketi */}
      <Html position={[0, -0.5, 0]} center>
        <div className="px-3 py-1 bg-cyan-500/80 backdrop-blur-sm rounded-full text-white text-sm font-bold whitespace-nowrap">
          Taban: {base} cm
        </div>
      </Html>
      
      {/* Yükseklik etiketi */}
      <Html position={[0.8, height/2, 0]} center>
        <div className="px-3 py-1 bg-yellow-500/80 backdrop-blur-sm rounded-full text-white text-sm font-bold whitespace-nowrap">
          h = {height} cm
        </div>
      </Html>
      
      {/* Alan etiketi - Merkez */}
      <Html position={[0, height/3, 0.5]} center>
        <div className="px-4 py-2 bg-gradient-to-r from-purple-500/90 to-pink-500/90 backdrop-blur-sm rounded-xl text-white font-bold whitespace-nowrap shadow-xl">
          <div className="text-xs opacity-80">Alan</div>
          <div className="text-xl">{area.toFixed(1)} cm²</div>
        </div>
      </Html>
    </group>
  )
}

// 🎥 Ana Bileşen
export default function HolographicLesson({ onClose, lesson }: HolographicLessonProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  
  const [isRunning, setIsRunning] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [isMuted, setIsMuted] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  
  // Hand tracking state
  const [handPosition, setHandPosition] = useState<{ x: number, y: number } | null>(null)
  const [handGesture, setHandGesture] = useState('none')
  const [isHandDetected, setIsHandDetected] = useState(false)
  const [fingerCount, setFingerCount] = useState(0)
  const [gestureNotification, setGestureNotification] = useState<string | null>(null)
  
  // MediaPipe refs
  const handsRef = useRef<any>(null)
  const cameraRef = useRef<any>(null)
  
  // Varsayılan ders
  const defaultLesson = {
    title: "Üçgenin Alanı",
    steps: [
      { title: "Üçgeni Keşfet", content: "Elini aç ve üçgeni döndür! 🖐️", base: 4, height: 3 },
      { title: "Boyutları Değiştir", content: "Yumruk yap, yukarı-aşağı hareket et - büyüt/küçült! ✊", base: 5, height: 4 },
      { title: "Hareket Ettir", content: "İşaret parmağınla üçgeni hareket ettir! ☝️", base: 6, height: 3 },
      { title: "Sıfırla", content: "Barış işareti yap - her şey sıfırlansın! ✌️", base: 4, height: 3 },
    ]
  }
  
  const activeLesson = lesson || defaultLesson
  const step = activeLesson.steps[currentStep]
  
  // Parmak sayma fonksiyonu
  const countFingers = useCallback((landmarks: any[]) => {
    if (!landmarks || landmarks.length < 21) return 0
    
    let count = 0
    
    // Başparmak
    const thumbTip = landmarks[4]
    const thumbIP = landmarks[3]
    const wrist = landmarks[0]
    const isRightHand = landmarks[17].x < landmarks[5].x
    
    if (isRightHand) {
      if (thumbTip.x < thumbIP.x) count++
    } else {
      if (thumbTip.x > thumbIP.x) count++
    }
    
    // Diğer 4 parmak
    const fingerTips = [8, 12, 16, 20]
    const fingerPIPs = [6, 10, 14, 18]
    
    fingerTips.forEach((tipIdx, i) => {
      if (landmarks[tipIdx].y < landmarks[fingerPIPs[i]].y) {
        count++
      }
    })
    
    return count
  }, [])
  
  // Gesture algılama
  const detectGesture = useCallback((landmarks: any[], fingerCount: number): string => {
    if (!landmarks || landmarks.length < 21) return 'none'
    
    if (fingerCount === 0) return 'fist'
    if (fingerCount === 5) return 'open'
    if (fingerCount === 1) {
      const indexTip = landmarks[8]
      const indexPIP = landmarks[6]
      if (indexTip.y < indexPIP.y) return 'point'
    }
    if (fingerCount === 2) {
      const indexTip = landmarks[8]
      const middleTip = landmarks[12]
      const indexPIP = landmarks[6]
      const middlePIP = landmarks[10]
      if (indexTip.y < indexPIP.y && middleTip.y < middlePIP.y) return 'peace'
    }
    
    return 'none'
  }, [])
  
  // MediaPipe başlat
  const startHandTracking = useCallback(async () => {
    try {
      // Kamera erişimi
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 1280, height: 720 }
      })
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
      
      // MediaPipe Hands
      const { Hands } = await import('@mediapipe/hands')
      const { Camera } = await import('@mediapipe/camera_utils')
      
      const hands = new Hands({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1675469240/${file}`
      })
      
      hands.setOptions({
        maxNumHands: 1,
        modelComplexity: 1,
        minDetectionConfidence: 0.7,
        minTrackingConfidence: 0.7
      })
      
      hands.onResults((results: any) => {
        // Canvas'a el çiz
        if (canvasRef.current && videoRef.current) {
          const ctx = canvasRef.current.getContext('2d')
          if (ctx) {
            canvasRef.current.width = videoRef.current.videoWidth
            canvasRef.current.height = videoRef.current.videoHeight
            
            ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
            
            if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
              const landmarks = results.multiHandLandmarks[0]
              setIsHandDetected(true)
              
              // El merkezi pozisyonu
              const palmBase = landmarks[0]
              setHandPosition({ x: palmBase.x, y: palmBase.y })
              
              // Parmak sayısı ve gesture
              const fingers = countFingers(landmarks)
              setFingerCount(fingers)
              
              const gesture = detectGesture(landmarks, fingers)
              setHandGesture(gesture)
              
              // El çizimi - Neon efekti
              // Bağlantılar
              const connections = [
                [0,1],[1,2],[2,3],[3,4], // Başparmak
                [0,5],[5,6],[6,7],[7,8], // İşaret
                [0,9],[9,10],[10,11],[11,12], // Orta
                [0,13],[13,14],[14,15],[15,16], // Yüzük
                [0,17],[17,18],[18,19],[19,20], // Serçe
                [5,9],[9,13],[13,17] // Avuç içi
              ]
              
              ctx.strokeStyle = '#00ffff'
              ctx.lineWidth = 3
              ctx.shadowColor = '#00ffff'
              ctx.shadowBlur = 10
              
              connections.forEach(([start, end]) => {
                const startPoint = landmarks[start]
                const endPoint = landmarks[end]
                ctx.beginPath()
                ctx.moveTo(startPoint.x * canvasRef.current!.width, startPoint.y * canvasRef.current!.height)
                ctx.lineTo(endPoint.x * canvasRef.current!.width, endPoint.y * canvasRef.current!.height)
                ctx.stroke()
              })
              
              // Landmark noktaları
              landmarks.forEach((landmark: any, i: number) => {
                const x = landmark.x * canvasRef.current!.width
                const y = landmark.y * canvasRef.current!.height
                
                ctx.beginPath()
                ctx.arc(x, y, i === 8 ? 10 : 5, 0, Math.PI * 2)
                ctx.fillStyle = [4, 8, 12, 16, 20].includes(i) ? '#ff00ff' : '#00ffff'
                ctx.shadowColor = ctx.fillStyle
                ctx.shadowBlur = 15
                ctx.fill()
              })
              
            } else {
              setIsHandDetected(false)
              setHandPosition(null)
              setHandGesture('none')
              setFingerCount(0)
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
      console.error('Hand tracking error:', error)
      alert('Kamera erişimi gerekli!')
    }
  }, [countFingers, detectGesture])
  
  // Cleanup
  useEffect(() => {
    return () => {
      if (cameraRef.current) {
        cameraRef.current.stop()
      }
      if (videoRef.current?.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks()
        tracks.forEach(track => track.stop())
      }
    }
  }, [])
  
  // Gesture action
  useEffect(() => {
    if (!isHandDetected) return
    
    let notification = ''
    switch (handGesture) {
      case 'open':
        notification = '🖐️ Döndür'
        break
      case 'fist':
        notification = '✊ Büyüt/Küçült'
        break
      case 'point':
        notification = '☝️ Hareket Ettir'
        break
      case 'peace':
        notification = '✌️ Sıfırla'
        break
    }
    
    if (notification) {
      setGestureNotification(notification)
      setTimeout(() => setGestureNotification(null), 1000)
    }
  }, [handGesture, isHandDetected])
  
  // TTS
  const speak = (text: string) => {
    if (isMuted) return
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'tr-TR'
    utterance.rate = 0.9
    window.speechSynthesis.speak(utterance)
  }
  
  // Adım değiştiğinde konuş
  useEffect(() => {
    if (isRunning) {
      speak(`${step.title}. ${step.content}`)
    }
  }, [currentStep, isRunning])
  
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
  
  const gestureEmoji: Record<string, string> = {
    'none': '🤚',
    'fist': '✊',
    'open': '🖐️',
    'point': '☝️',
    'peace': '✌️'
  }

  return (
    <div className={`fixed inset-0 z-50 bg-black ${isFullscreen ? '' : ''}`}>
      {/* Kamera Video - Arka Plan */}
      <video 
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover transform scale-x-[-1]"
        playsInline
        muted
      />
      
      {/* El Landmark Canvas */}
      <canvas 
        ref={canvasRef}
        className="absolute inset-0 w-full h-full object-cover transform scale-x-[-1] pointer-events-none"
      />
      
      {/* Koyu Overlay - Holografik görünüm için */}
      <div className="absolute inset-0 bg-slate-900/40 pointer-events-none" />
      
      {/* 3D Canvas - Şeffaf arka plan */}
      {isRunning && (
        <div className="absolute inset-0 pointer-events-none">
          <Canvas
            style={{ background: 'transparent' }}
            gl={{ alpha: true }}
            camera={{ position: [0, 2, 8], fov: 50 }}
          >
            <ambientLight intensity={0.5} />
            <pointLight position={[10, 10, 10]} intensity={1} color="#00ffff" />
            <pointLight position={[-10, -10, -10]} intensity={0.5} color="#ff00ff" />
            
            <HolographicTriangle 
              base={step.base || 4}
              height={step.height || 3}
              handPosition={handPosition}
              handGesture={handGesture}
              isHandDetected={isHandDetected}
            />
          </Canvas>
        </div>
      )}
      
      {/* UI Overlay */}
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-6 py-4 bg-gradient-to-b from-black/80 to-transparent">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-white font-black text-2xl tracking-wide">{activeLesson.title}</h1>
            <p className="text-cyan-400 text-sm">🦾 Iron Man Mode - El Kontrolü</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="p-3 rounded-xl bg-slate-800/80 text-white hover:bg-slate-700/80 transition-all"
          >
            {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </button>
          
          {onClose && (
            <button
              onClick={onClose}
              className="p-3 rounded-xl bg-red-500/80 text-white hover:bg-red-600/80 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
      
      {/* Start Screen */}
      {!isRunning && (
        <div className="absolute inset-0 flex items-center justify-center z-30">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center"
          >
            <div className="w-32 h-32 mx-auto mb-8 rounded-full bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center animate-pulse">
              <Hand className="w-16 h-16 text-white" />
            </div>
            <h2 className="text-4xl font-black text-white mb-4">
              🦾 JARVIS MODE
            </h2>
            <p className="text-cyan-400 text-xl mb-8">
              Ellerinle 3D objeleri kontrol et!
            </p>
            <button
              onClick={startHandTracking}
              className="px-10 py-5 rounded-2xl bg-gradient-to-r from-cyan-500 to-purple-500 text-white text-xl font-bold hover:scale-105 transition-transform shadow-2xl shadow-cyan-500/50"
            >
              🖐️ Başla
            </button>
          </motion.div>
        </div>
      )}
      
      {/* Gesture Notification */}
      <AnimatePresence>
        {gestureNotification && isRunning && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5, y: -50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.5, y: -50 }}
            className="absolute top-24 left-1/2 transform -translate-x-1/2 z-30 px-8 py-4 rounded-2xl bg-gradient-to-r from-cyan-500/90 to-purple-500/90 backdrop-blur-sm text-white text-2xl font-bold shadow-2xl"
          >
            {gestureNotification}
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Step Info - Sol üst */}
      {isRunning && (
        <motion.div
          initial={{ x: -100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="absolute top-24 left-6 z-20 w-80"
        >
          <div className="bg-slate-900/80 backdrop-blur-sm rounded-2xl p-6 border border-cyan-500/30">
            {/* Step indicators */}
            <div className="flex gap-2 mb-4">
              {activeLesson.steps.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentStep(i)}
                  className={`w-10 h-10 rounded-full font-bold transition-all ${
                    i === currentStep
                      ? 'bg-gradient-to-r from-cyan-500 to-purple-500 text-white scale-110'
                      : i < currentStep
                      ? 'bg-green-500 text-white'
                      : 'bg-slate-700 text-slate-400'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
            
            <h3 className="text-xl font-bold text-white mb-2">{step.title}</h3>
            <p className="text-cyan-300">{step.content}</p>
          </div>
        </motion.div>
      )}
      
      {/* Hand Status - Sağ alt */}
      {isRunning && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="absolute bottom-6 right-6 z-20"
        >
          <div className="bg-slate-900/80 backdrop-blur-sm rounded-2xl p-4 border border-cyan-500/30 flex items-center gap-4">
            <div className="text-6xl">{gestureEmoji[handGesture]}</div>
            <div>
              <p className="text-cyan-400 font-bold text-lg">
                {isHandDetected ? handGesture.toUpperCase() : 'EL YOK'}
              </p>
              <p className="text-slate-400">{fingerCount} parmak</p>
            </div>
          </div>
        </motion.div>
      )}
      
      {/* Navigation - Alt orta */}
      {isRunning && (
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-20 flex items-center gap-4">
          <button
            onClick={prevStep}
            disabled={currentStep === 0}
            className="p-4 rounded-xl bg-slate-800/80 text-white hover:bg-slate-700/80 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          
          <div className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500/80 to-purple-500/80 backdrop-blur-sm text-white font-bold">
            {currentStep + 1} / {activeLesson.steps.length}
          </div>
          
          <button
            onClick={nextStep}
            disabled={currentStep === activeLesson.steps.length - 1}
            className="p-4 rounded-xl bg-slate-800/80 text-white hover:bg-slate-700/80 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>
      )}
      
      {/* Kontrol Rehberi - Sol alt */}
      {isRunning && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="absolute bottom-6 left-6 z-20"
        >
          <div className="bg-slate-900/80 backdrop-blur-sm rounded-2xl p-4 border border-cyan-500/30">
            <p className="text-cyan-400 text-xs font-bold mb-2">EL KONTROLLER</p>
            <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
              <div className="text-white">🖐️ Açık</div>
              <div className="text-cyan-400">Döndür</div>
              <div className="text-white">✊ Yumruk</div>
              <div className="text-pink-400">Boyut</div>
              <div className="text-white">☝️ İşaret</div>
              <div className="text-yellow-400">Taşı</div>
              <div className="text-white">✌️ Barış</div>
              <div className="text-green-400">Sıfırla</div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}
