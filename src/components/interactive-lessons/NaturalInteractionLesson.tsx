'use client'

import { useRef, useState, useEffect, useCallback } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Html, Line } from '@react-three/drei'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Volume2, VolumeX, ChevronRight, ChevronLeft, Trash2, RotateCcw, Lightbulb } from 'lucide-react'
import * as THREE from 'three'

// ============================================
// 🌟 NATURAL INTERACTION - Gerçek Hayat Gibi
// ============================================

interface NaturalInteractionLessonProps {
  onClose?: () => void
}

// 🎯 Ekran Butonu - El ile tıklanabilir
function ScreenButton({ 
  x, 
  y, 
  icon, 
  label, 
  color, 
  isHovered,
  isPressed,
  onClick 
}: { 
  x: number
  y: number
  icon: React.ReactNode
  label: string
  color: string
  isHovered: boolean
  isPressed: boolean
  onClick: () => void
}) {
  return (
    <motion.div
      className={`absolute flex flex-col items-center gap-2 cursor-pointer select-none`}
      style={{ left: `${x}%`, top: `${y}%`, transform: 'translate(-50%, -50%)' }}
      animate={{
        scale: isPressed ? 0.85 : isHovered ? 1.15 : 1,
        opacity: isHovered ? 1 : 0.8
      }}
      transition={{ duration: 0.15 }}
      onClick={onClick}
    >
      <div className={`w-20 h-20 rounded-2xl flex items-center justify-center text-white text-3xl shadow-2xl transition-all ${color} ${
        isHovered ? 'ring-4 ring-white/50' : ''
      } ${isPressed ? 'ring-4 ring-green-400' : ''}`}>
        {icon}
      </div>
      <span className={`text-white text-sm font-bold px-3 py-1 rounded-lg ${isHovered ? 'bg-white/20' : 'bg-black/30'}`}>
        {label}
      </span>
    </motion.div>
  )
}

// 🗑️ Çöp Kutusu Alanı
function TrashZone({ isActive, hasItem }: { isActive: boolean, hasItem: boolean }) {
  return (
    <motion.div
      className={`absolute bottom-8 right-8 w-32 h-32 rounded-2xl border-4 border-dashed flex flex-col items-center justify-center gap-2 transition-all ${
        isActive 
          ? 'border-red-500 bg-red-500/30 scale-110' 
          : hasItem 
            ? 'border-orange-500/50 bg-orange-500/10' 
            : 'border-slate-600/50 bg-slate-800/30'
      }`}
      animate={{ scale: isActive ? 1.1 : 1 }}
    >
      <Trash2 className={`w-10 h-10 ${isActive ? 'text-red-400' : 'text-slate-500'}`} />
      <span className={`text-xs font-bold ${isActive ? 'text-red-400' : 'text-slate-500'}`}>
        {isActive ? 'BIRAK!' : 'Çöp'}
      </span>
    </motion.div>
  )
}

// 📦 Yan Panel - Yeni Objeler
function SidePanel({ 
  items, 
  onGrab, 
  fingerPosition,
  isGrabbing 
}: { 
  items: Array<{ id: string, icon: string, label: string, color: string }>
  onGrab: (id: string) => void
  fingerPosition: { x: number, y: number } | null
  isGrabbing: boolean
}) {
  const [hoveredItem, setHoveredItem] = useState<string | null>(null)
  
  // Parmak pozisyonuna göre hover kontrolü
  useEffect(() => {
    if (!fingerPosition || isGrabbing) {
      setHoveredItem(null)
      return
    }
    
    // Panel sağ tarafta, x > 0.85
    if (fingerPosition.x > 0.85) {
      const y = fingerPosition.y
      if (y > 0.2 && y < 0.4) setHoveredItem(items[0]?.id || null)
      else if (y > 0.4 && y < 0.6) setHoveredItem(items[1]?.id || null)
      else if (y > 0.6 && y < 0.8) setHoveredItem(items[2]?.id || null)
      else setHoveredItem(null)
    } else {
      setHoveredItem(null)
    }
  }, [fingerPosition, isGrabbing, items])
  
  return (
    <div className="absolute right-4 top-1/2 transform -translate-y-1/2 flex flex-col gap-4 z-20">
      <div className="text-slate-400 text-xs text-center mb-2">📦 OBJELER</div>
      {items.map((item, i) => (
        <motion.div
          key={item.id}
          className={`w-20 h-20 rounded-xl flex flex-col items-center justify-center cursor-grab transition-all ${item.color} ${
            hoveredItem === item.id ? 'ring-4 ring-white/50 scale-110' : ''
          }`}
          whileHover={{ scale: 1.1 }}
          onClick={() => onGrab(item.id)}
        >
          <span className="text-3xl">{item.icon}</span>
          <span className="text-white text-xs font-medium mt-1">{item.label}</span>
        </motion.div>
      ))}
    </div>
  )
}

// 🔺 Sürüklenebilir 3D Üçgen
function DraggableTriangle({ 
  position,
  rotation,
  scale,
  isGrabbed,
  base = 4,
  height = 3
}: { 
  position: { x: number, y: number }
  rotation: number
  scale: number
  isGrabbed: boolean
  base?: number
  height?: number
}) {
  const meshRef = useRef<THREE.Group>(null)
  
  useFrame((state, delta) => {
    if (!meshRef.current) return
    
    // Pozisyon ve rotasyon güncelle
    meshRef.current.position.x += (position.x - meshRef.current.position.x) * 0.15
    meshRef.current.position.y += (position.y - meshRef.current.position.y) * 0.15
    meshRef.current.rotation.y += (rotation - meshRef.current.rotation.y) * 0.1
    
    const targetScale = scale
    meshRef.current.scale.x += (targetScale - meshRef.current.scale.x) * 0.1
    meshRef.current.scale.y += (targetScale - meshRef.current.scale.y) * 0.1
    meshRef.current.scale.z += (targetScale - meshRef.current.scale.z) * 0.1
    
    // Tutulmadığında yavaş dönsün
    if (!isGrabbed) {
      meshRef.current.rotation.y += delta * 0.3
    }
  })
  
  const vertices = [
    new THREE.Vector3(-base/2, 0, 0),
    new THREE.Vector3(base/2, 0, 0),
    new THREE.Vector3(0, height, 0),
  ]
  
  const area = (base * height) / 2
  
  return (
    <group ref={meshRef}>
      {/* Üçgen */}
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
          color={isGrabbed ? "#22c55e" : "#06b6d4"} 
          transparent 
          opacity={0.5}
          side={THREE.DoubleSide}
          emissive={isGrabbed ? "#22c55e" : "#06b6d4"}
          emissiveIntensity={0.4}
        />
      </mesh>
      
      {/* Kenarlar */}
      <Line
        points={[...vertices, vertices[0]]}
        color={isGrabbed ? "#22c55e" : "#06b6d4"}
        lineWidth={4}
      />
      
      {/* Köşeler */}
      {vertices.map((v, i) => (
        <mesh key={i} position={v}>
          <sphereGeometry args={[0.15, 16, 16]} />
          <meshStandardMaterial 
            color={i === 2 ? '#f472b6' : '#06b6d4'} 
            emissive={i === 2 ? '#f472b6' : '#06b6d4'}
            emissiveIntensity={0.8}
          />
        </mesh>
      ))}
      
      {/* Alan etiketi */}
      <Html position={[0, height/3, 0.5]} center>
        <div className={`px-4 py-2 rounded-xl text-white font-bold whitespace-nowrap shadow-xl transition-colors ${
          isGrabbed ? 'bg-green-500/90' : 'bg-gradient-to-r from-purple-500/90 to-pink-500/90'
        }`}>
          <div className="text-xs opacity-80">Alan</div>
          <div className="text-xl">{area.toFixed(1)} cm²</div>
        </div>
      </Html>
    </group>
  )
}

// 🎮 Ana Bileşen
export default function NaturalInteractionLesson({ onClose }: NaturalInteractionLessonProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  
  const [isRunning, setIsRunning] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [isMuted, setIsMuted] = useState(false)
  
  // El takibi
  const [fingerPosition, setFingerPosition] = useState<{ x: number, y: number } | null>(null)
  const [isHandDetected, setIsHandDetected] = useState(false)
  const [isGrabbing, setIsGrabbing] = useState(false) // Avuç kapalı mı
  
  // 3D Obje durumu
  const [objectPosition, setObjectPosition] = useState({ x: 0, y: 0 })
  const [objectRotation, setObjectRotation] = useState(0)
  const [objectScale, setObjectScale] = useState(1)
  const [isObjectGrabbed, setIsObjectGrabbed] = useState(false)
  const [isObjectVisible, setIsObjectVisible] = useState(true)
  
  // UI Butonları hover durumu
  const [hoveredButton, setHoveredButton] = useState<string | null>(null)
  const [pressedButton, setPressedButton] = useState<string | null>(null)
  
  // Çöp kutusu
  const [isOverTrash, setIsOverTrash] = useState(false)
  
  // Feedback
  const [feedback, setFeedback] = useState<string | null>(null)
  
  // Refs
  const handsRef = useRef<any>(null)
  const cameraRef = useRef<any>(null)
  const grabStartPos = useRef<{ x: number, y: number } | null>(null)
  const lastGrabState = useRef(false)
  
  // Ders adımları
  const steps = [
    { title: "👋 Merhaba!", content: "Elini göster ve ekrandaki butonlara dokun!" },
    { title: "✊ Tut ve Çevir", content: "Üçgeni avuçla (yumruk yap) ve hareket ettir!" },
    { title: "🗑️ Çöpe At", content: "Objeyi tutup sağ alttaki çöpe sürükle!" },
    { title: "📦 Yeni Al", content: "Sağ panelden yeni bir obje al!" },
  ]
  
  const step = steps[currentStep]
  
  // Butonlar - ekranda sabit pozisyonlarda
  const buttons = [
    { id: 'prev', x: 15, y: 85, icon: <ChevronLeft className="w-8 h-8" />, label: 'Geri', color: 'bg-slate-700' },
    { id: 'next', x: 30, y: 85, icon: <ChevronRight className="w-8 h-8" />, label: 'İleri', color: 'bg-cyan-600' },
    { id: 'hint', x: 50, y: 85, icon: <Lightbulb className="w-8 h-8" />, label: 'İpucu', color: 'bg-amber-600' },
    { id: 'reset', x: 70, y: 85, icon: <RotateCcw className="w-8 h-8" />, label: 'Sıfırla', color: 'bg-purple-600' },
  ]
  
  // Yan panel objeleri
  const sideItems = [
    { id: 'triangle', icon: '🔺', label: 'Üçgen', color: 'bg-cyan-600' },
    { id: 'square', icon: '🟦', label: 'Kare', color: 'bg-blue-600' },
    { id: 'circle', icon: '🔵', label: 'Daire', color: 'bg-indigo-600' },
  ]
  
  // Avuç kapalı mı kontrolü
  const isHandClosed = useCallback((landmarks: any[]) => {
    if (!landmarks || landmarks.length < 21) return false
    
    let closedFingers = 0
    const fingerTips = [8, 12, 16, 20]
    const fingerPIPs = [6, 10, 14, 18]
    
    fingerTips.forEach((tipIdx, i) => {
      if (landmarks[tipIdx].y > landmarks[fingerPIPs[i]].y) {
        closedFingers++
      }
    })
    
    // 3+ parmak kapalıysa avuç kapalı
    return closedFingers >= 3
  }, [])
  
  // Buton hover kontrolü
  const checkButtonHover = useCallback((fingerX: number, fingerY: number) => {
    for (const btn of buttons) {
      const dx = Math.abs(fingerX * 100 - btn.x)
      const dy = Math.abs(fingerY * 100 - btn.y)
      if (dx < 8 && dy < 8) {
        return btn.id
      }
    }
    return null
  }, [buttons])
  
  // Çöp kutusu kontrolü
  const checkTrashZone = useCallback((fingerX: number, fingerY: number) => {
    // Sağ alt köşe
    return fingerX > 0.8 && fingerY > 0.75
  }, [])
  
  // Buton aksiyonları
  const handleButtonAction = useCallback((buttonId: string) => {
    switch (buttonId) {
      case 'next':
        if (currentStep < steps.length - 1) {
          setCurrentStep(prev => prev + 1)
          setFeedback('➡️ İleri!')
        }
        break
      case 'prev':
        if (currentStep > 0) {
          setCurrentStep(prev => prev - 1)
          setFeedback('⬅️ Geri!')
        }
        break
      case 'hint':
        setFeedback('💡 ' + step.content)
        break
      case 'reset':
        setObjectPosition({ x: 0, y: 0 })
        setObjectRotation(0)
        setObjectScale(1)
        setIsObjectVisible(true)
        setFeedback('🔄 Sıfırlandı!')
        break
    }
    setTimeout(() => setFeedback(null), 1500)
  }, [currentStep, steps.length, step])
  
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
        minDetectionConfidence: 0.7,
        minTrackingConfidence: 0.7
      })
      
      hands.onResults((results: any) => {
        if (canvasRef.current && videoRef.current) {
          const ctx = canvasRef.current.getContext('2d')
          if (ctx) {
            canvasRef.current.width = videoRef.current.videoWidth
            canvasRef.current.height = videoRef.current.videoHeight
            ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
            
            if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
              const landmarks = results.multiHandLandmarks[0]
              setIsHandDetected(true)
              
              // El merkezi (avuç içi)
              const palmCenter = {
                x: (landmarks[0].x + landmarks[9].x) / 2,
                y: (landmarks[0].y + landmarks[9].y) / 2
              }
              
              // İşaret parmağı ucu
              const fingerTip = { x: landmarks[8].x, y: landmarks[8].y }
              setFingerPosition(fingerTip)
              
              // Avuç kapalı mı
              const closed = isHandClosed(landmarks)
              setIsGrabbing(closed)
              
              // Buton hover kontrolü (sadece avuç açıkken)
              if (!closed) {
                const hoveredBtn = checkButtonHover(fingerTip.x, fingerTip.y)
                setHoveredButton(hoveredBtn)
                
                // Obje tutma bırakıldı
                if (lastGrabState.current && isObjectGrabbed) {
                  setIsObjectGrabbed(false)
                  
                  // Çöp kutusunda mı?
                  if (isOverTrash) {
                    setIsObjectVisible(false)
                    setFeedback('🗑️ Çöpe atıldı!')
                    setTimeout(() => setFeedback(null), 1500)
                  }
                }
              } else {
                // Avuç kapalı - tutma modu
                setHoveredButton(null)
                
                // Butona tıklama (avuç kapatma anı)
                if (!lastGrabState.current && hoveredButton) {
                  setPressedButton(hoveredButton)
                  handleButtonAction(hoveredButton)
                  setTimeout(() => setPressedButton(null), 300)
                }
                
                // Objeyi tutma başlangıcı
                if (!lastGrabState.current && !hoveredButton) {
                  // Obje merkeze yakın mı?
                  const objScreenX = 0.5 + objectPosition.x * 0.05
                  const objScreenY = 0.4 - objectPosition.y * 0.05
                  const distToObj = Math.sqrt(
                    Math.pow(fingerTip.x - objScreenX, 2) + 
                    Math.pow(fingerTip.y - objScreenY, 2)
                  )
                  
                  if (distToObj < 0.2 && isObjectVisible) {
                    setIsObjectGrabbed(true)
                    grabStartPos.current = { ...fingerTip }
                    setFeedback('✊ Tutuldu!')
                    setTimeout(() => setFeedback(null), 800)
                  }
                }
                
                // Obje tutuluyken hareket ettir
                if (isObjectGrabbed && grabStartPos.current) {
                  const deltaX = (grabStartPos.current.x - fingerTip.x) * 15
                  const deltaY = (fingerTip.y - grabStartPos.current.y) * 15
                  
                  setObjectPosition({
                    x: Math.max(-4, Math.min(4, deltaX)),
                    y: Math.max(-3, Math.min(3, -deltaY))
                  })
                  
                  // Rotasyon - yatay hareketle
                  setObjectRotation(deltaX * 0.5)
                  
                  // Çöp kutusu kontrolü
                  setIsOverTrash(checkTrashZone(fingerTip.x, fingerTip.y))
                }
              }
              
              lastGrabState.current = closed
              
              // El çizimi
              // Avuç merkezi
              ctx.beginPath()
              ctx.arc(
                palmCenter.x * canvasRef.current!.width,
                palmCenter.y * canvasRef.current!.height,
                closed ? 40 : 30,
                0,
                Math.PI * 2
              )
              ctx.fillStyle = closed ? 'rgba(34, 197, 94, 0.3)' : 'rgba(6, 182, 212, 0.2)'
              ctx.fill()
              ctx.strokeStyle = closed ? '#22c55e' : '#06b6d4'
              ctx.lineWidth = 3
              ctx.stroke()
              
              // İşaret parmağı
              ctx.beginPath()
              ctx.arc(
                fingerTip.x * canvasRef.current!.width,
                fingerTip.y * canvasRef.current!.height,
                15,
                0,
                Math.PI * 2
              )
              ctx.fillStyle = hoveredButton ? '#f472b6' : '#06b6d4'
              ctx.shadowColor = ctx.fillStyle
              ctx.shadowBlur = 20
              ctx.fill()
              
            } else {
              setIsHandDetected(false)
              setFingerPosition(null)
              setIsGrabbing(false)
              setHoveredButton(null)
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
  }, [isHandClosed, checkButtonHover, checkTrashZone, hoveredButton, handleButtonAction, isObjectGrabbed, objectPosition, isOverTrash, isObjectVisible])
  
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
    if (isRunning && step) {
      speak(`${step.title}. ${step.content}`)
    }
  }, [currentStep, isRunning])
  
  // Yan panelden obje alma
  const handleGrabFromPanel = (itemId: string) => {
    setIsObjectVisible(true)
    setObjectPosition({ x: 0, y: 0 })
    setObjectRotation(0)
    setObjectScale(1)
    setFeedback(`📦 ${itemId === 'triangle' ? 'Üçgen' : itemId === 'square' ? 'Kare' : 'Daire'} eklendi!`)
    setTimeout(() => setFeedback(null), 1500)
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-900">
      {/* Kamera */}
      <video 
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover transform scale-x-[-1]"
        playsInline
        muted
      />
      
      {/* El Çizimi */}
      <canvas 
        ref={canvasRef}
        className="absolute inset-0 w-full h-full object-cover transform scale-x-[-1] pointer-events-none"
      />
      
      {/* Overlay */}
      <div className="absolute inset-0 bg-slate-900/40 pointer-events-none" />
      
      {/* 3D Canvas */}
      {isRunning && isObjectVisible && (
        <div className="absolute inset-0 pointer-events-none">
          <Canvas
            style={{ background: 'transparent' }}
            gl={{ alpha: true }}
            camera={{ position: [0, 2, 10], fov: 45 }}
          >
            <ambientLight intensity={0.6} />
            <pointLight position={[10, 10, 10]} intensity={1} color="#06b6d4" />
            
            <DraggableTriangle 
              position={objectPosition}
              rotation={objectRotation}
              scale={objectScale}
              isGrabbed={isObjectGrabbed}
            />
          </Canvas>
        </div>
      )}
      
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-6 py-4 bg-gradient-to-b from-slate-900/90 to-transparent">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-green-500 flex items-center justify-center text-2xl">
            🌟
          </div>
          <div>
            <h1 className="text-white font-black text-2xl">Doğal Etkileşim</h1>
            <p className="text-cyan-400 text-sm">Tut, Çevir, At, Al!</p>
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
            className="text-center max-w-lg px-6"
          >
            <div className="w-32 h-32 mx-auto mb-8 rounded-full bg-gradient-to-br from-cyan-500 to-green-500 flex items-center justify-center text-6xl shadow-2xl">
              🌟
            </div>
            <h2 className="text-4xl font-black text-white mb-4">
              Doğal Etkileşim
            </h2>
            <p className="text-slate-400 text-lg mb-8">
              Gerçek hayattaki gibi! Tut, çevir, at ve al.
            </p>
            
            <div className="grid grid-cols-2 gap-4 mb-8 text-left">
              <div className="bg-slate-800/80 rounded-xl p-4">
                <div className="text-3xl mb-2">👆</div>
                <div className="text-white font-semibold">Butonlara Dokun</div>
                <div className="text-slate-400 text-sm">Parmakla göster, yumruk yap</div>
              </div>
              <div className="bg-slate-800/80 rounded-xl p-4">
                <div className="text-3xl mb-2">✊</div>
                <div className="text-white font-semibold">Tut & Taşı</div>
                <div className="text-slate-400 text-sm">Avuçla ve hareket ettir</div>
              </div>
              <div className="bg-slate-800/80 rounded-xl p-4">
                <div className="text-3xl mb-2">🗑️</div>
                <div className="text-white font-semibold">Çöpe At</div>
                <div className="text-slate-400 text-sm">Sürükle ve bırak</div>
              </div>
              <div className="bg-slate-800/80 rounded-xl p-4">
                <div className="text-3xl mb-2">📦</div>
                <div className="text-white font-semibold">Yeni Al</div>
                <div className="text-slate-400 text-sm">Yan panelden seç</div>
              </div>
            </div>
            
            <button
              onClick={startTracking}
              className="px-10 py-5 rounded-2xl bg-gradient-to-r from-cyan-500 to-green-500 text-white text-xl font-bold hover:scale-105 transition-transform shadow-2xl"
            >
              🌟 Başla
            </button>
          </motion.div>
        </div>
      )}
      
      {/* Ders İçeriği */}
      {isRunning && (
        <motion.div
          initial={{ x: -100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="absolute top-24 left-6 z-20 w-80"
        >
          <div className="bg-slate-900/90 backdrop-blur-sm rounded-2xl p-5 border border-cyan-500/30">
            <div className="flex gap-2 mb-3">
              {steps.map((_, i) => (
                <div
                  key={i}
                  className={`h-2 flex-1 rounded-full transition-all ${
                    i === currentStep ? 'bg-cyan-500' : i < currentStep ? 'bg-green-500' : 'bg-slate-700'
                  }`}
                />
              ))}
            </div>
            <h3 className="text-xl font-bold text-white mb-2">{step?.title}</h3>
            <p className="text-slate-300">{step?.content}</p>
          </div>
        </motion.div>
      )}
      
      {/* Ekran Butonları */}
      {isRunning && (
        <div className="absolute inset-0 pointer-events-none z-10">
          {buttons.map(btn => (
            <ScreenButton
              key={btn.id}
              x={btn.x}
              y={btn.y}
              icon={btn.icon}
              label={btn.label}
              color={btn.color}
              isHovered={hoveredButton === btn.id}
              isPressed={pressedButton === btn.id}
              onClick={() => handleButtonAction(btn.id)}
            />
          ))}
        </div>
      )}
      
      {/* Çöp Kutusu */}
      {isRunning && (
        <TrashZone isActive={isOverTrash && isObjectGrabbed} hasItem={!isObjectVisible} />
      )}
      
      {/* Yan Panel */}
      {isRunning && (
        <SidePanel 
          items={sideItems}
          onGrab={handleGrabFromPanel}
          fingerPosition={fingerPosition}
          isGrabbing={isGrabbing}
        />
      )}
      
      {/* Feedback */}
      <AnimatePresence>
        {feedback && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5, y: -50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.5 }}
            className="absolute top-1/3 left-1/2 transform -translate-x-1/2 z-30 px-8 py-4 rounded-2xl bg-gradient-to-r from-cyan-500/90 to-green-500/90 backdrop-blur-sm text-white text-2xl font-bold shadow-2xl"
          >
            {feedback}
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* El Durumu */}
      {isRunning && (
        <div className="absolute bottom-4 left-4 z-20 bg-slate-900/80 rounded-xl px-4 py-2 flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${isHandDetected ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className="text-white text-sm">
            {!isHandDetected ? 'El yok' : isGrabbing ? '✊ Tutma' : '🖐️ Açık'}
          </span>
          {isObjectGrabbed && <span className="text-green-400 text-sm font-bold">| Obje tutuldu!</span>}
        </div>
      )}
    </div>
  )
}
