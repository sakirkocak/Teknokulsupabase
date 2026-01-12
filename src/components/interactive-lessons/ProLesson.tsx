'use client'

import { useRef, useState, useEffect, useCallback } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Html, Line } from '@react-three/drei'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Volume2, VolumeX, ChevronRight, ChevronLeft, Lightbulb, Home, RotateCcw, Settings, BookOpen } from 'lucide-react'
import * as THREE from 'three'

// ============================================
// 🎯 PRO LESSON - Profesyonel El Takibi
// ============================================

// 🔧 ONE EURO FILTER - Titreme Azaltma
class OneEuroFilter {
  private minCutoff: number
  private beta: number
  private dCutoff: number
  private xPrev: number | null = null
  private dxPrev: number = 0
  private tPrev: number | null = null

  constructor(minCutoff = 1.0, beta = 0.007, dCutoff = 1.0) {
    this.minCutoff = minCutoff
    this.beta = beta
    this.dCutoff = dCutoff
  }

  private smoothingFactor(cutoff: number, dt: number): number {
    const tau = 1.0 / (2 * Math.PI * cutoff)
    return 1.0 / (1.0 + tau / dt)
  }

  filter(x: number, t: number): number {
    if (this.xPrev === null || this.tPrev === null) {
      this.xPrev = x
      this.tPrev = t
      return x
    }

    const dt = t - this.tPrev
    if (dt <= 0) return this.xPrev

    // Derivative
    const dx = (x - this.xPrev) / dt
    const edx = this.smoothingFactor(this.dCutoff, dt)
    const dxFiltered = edx * dx + (1 - edx) * this.dxPrev

    // Cutoff
    const cutoff = this.minCutoff + this.beta * Math.abs(dxFiltered)
    const ex = this.smoothingFactor(cutoff, dt)

    // Filtered value
    const xFiltered = ex * x + (1 - ex) * this.xPrev

    this.xPrev = xFiltered
    this.dxPrev = dxFiltered
    this.tPrev = t

    return xFiltered
  }

  reset() {
    this.xPrev = null
    this.tPrev = null
    this.dxPrev = 0
  }
}

// 🎯 STICKY POINT - Mıknatıs Efekti
interface StickyPoint {
  id: string
  x: number
  y: number
  radius: number // Yakalama yarıçapı
  isActive: boolean
}

// 🌀 RADIAL MENU - Dairesel Menü
interface RadialMenuItem {
  id: string
  icon: React.ReactNode
  label: string
  angle: number
  color: string
}

function RadialMenu({ 
  isOpen, 
  centerX, 
  centerY, 
  items, 
  selectedIndex,
  onSelect 
}: { 
  isOpen: boolean
  centerX: number
  centerY: number
  items: RadialMenuItem[]
  selectedIndex: number | null
  onSelect: (id: string) => void
}) {
  const radius = 120

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0 }}
          className="fixed inset-0 z-50 pointer-events-none"
          style={{ perspective: '1000px' }}
        >
          {/* Merkez */}
          <div 
            className="absolute w-20 h-20 rounded-full bg-slate-900/90 border-4 border-cyan-500 flex items-center justify-center"
            style={{ 
              left: `${centerX}%`, 
              top: `${centerY}%`,
              transform: 'translate(-50%, -50%)'
            }}
          >
            <span className="text-3xl">🎯</span>
          </div>

          {/* Menü öğeleri */}
          {items.map((item, i) => {
            const angle = (item.angle * Math.PI) / 180
            const x = centerX + (radius / window.innerWidth * 100) * Math.cos(angle) * (window.innerWidth / window.innerHeight)
            const y = centerY + (radius / window.innerHeight * 100) * Math.sin(angle)
            const isSelected = selectedIndex === i

            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ 
                  opacity: 1, 
                  scale: isSelected ? 1.3 : 1,
                  transition: { delay: i * 0.05 }
                }}
                className={`absolute w-16 h-16 rounded-xl flex flex-col items-center justify-center transition-all ${item.color} ${
                  isSelected ? 'ring-4 ring-white shadow-2xl' : ''
                }`}
                style={{ 
                  left: `${x}%`, 
                  top: `${y}%`,
                  transform: 'translate(-50%, -50%)'
                }}
              >
                <div className="text-white text-xl">{item.icon}</div>
                <span className="text-white text-[10px] font-bold mt-1">{item.label}</span>
              </motion.div>
            )
          })}

          {/* Bağlantı çizgileri */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none">
            {items.map((item, i) => {
              const angle = (item.angle * Math.PI) / 180
              const x = (centerX / 100) * window.innerWidth + radius * Math.cos(angle)
              const y = (centerY / 100) * window.innerHeight + radius * Math.sin(angle)
              const cx = (centerX / 100) * window.innerWidth
              const cy = (centerY / 100) * window.innerHeight

              return (
                <line
                  key={i}
                  x1={cx}
                  y1={cy}
                  x2={x}
                  y2={y}
                  stroke={selectedIndex === i ? '#22d3ee' : '#475569'}
                  strokeWidth={selectedIndex === i ? 3 : 1}
                  strokeDasharray="5,5"
                />
              )
            })}
          </svg>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// 🔺 3D Üçgen - Sticky Points ile
function SmartTriangle({ 
  position,
  rotation,
  scale,
  activeCorner,
  isPinching,
  base = 4,
  height = 3
}: { 
  position: { x: number, y: number }
  rotation: { x: number, y: number }
  scale: number
  activeCorner: number | null
  isPinching: boolean
  base?: number
  height?: number
}) {
  const meshRef = useRef<THREE.Group>(null)
  const targetRotation = useRef({ x: 0, y: 0 })
  const targetPosition = useRef({ x: 0, y: 0 })
  const targetScale = useRef(1)

  useEffect(() => {
    targetPosition.current = position
    targetRotation.current = rotation
    targetScale.current = scale
  }, [position, rotation, scale])

  useFrame((state, delta) => {
    if (!meshRef.current) return

    // SMOOTH interpolasyon - yağ gibi kayma
    const lerpFactor = 0.12
    
    meshRef.current.position.x += (targetPosition.current.x - meshRef.current.position.x) * lerpFactor
    meshRef.current.position.y += (targetPosition.current.y - meshRef.current.position.y) * lerpFactor
    
    meshRef.current.rotation.x += (targetRotation.current.x - meshRef.current.rotation.x) * lerpFactor
    meshRef.current.rotation.y += (targetRotation.current.y - meshRef.current.rotation.y) * lerpFactor

    const currentScale = meshRef.current.scale.x
    const newScale = currentScale + (targetScale.current - currentScale) * lerpFactor
    meshRef.current.scale.set(newScale, newScale, newScale)

    // İdle animasyonu
    if (!isPinching && activeCorner === null) {
      meshRef.current.rotation.y += delta * 0.2
    }
  })

  const vertices = [
    new THREE.Vector3(-base/2, 0, 0),      // 0: Sol alt
    new THREE.Vector3(base/2, 0, 0),       // 1: Sağ alt
    new THREE.Vector3(0, height, 0),       // 2: Tepe
  ]

  const area = (base * height) / 2

  return (
    <group ref={meshRef}>
      {/* Üçgen yüzeyi */}
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
          color={isPinching ? "#22c55e" : "#06b6d4"} 
          transparent 
          opacity={0.4}
          side={THREE.DoubleSide}
          emissive={isPinching ? "#22c55e" : "#06b6d4"}
          emissiveIntensity={0.3}
        />
      </mesh>

      {/* Kenarlar */}
      <Line
        points={[...vertices, vertices[0]]}
        color={isPinching ? "#22c55e" : "#06b6d4"}
        lineWidth={3}
      />

      {/* Köşe noktaları - STICKY POINTS */}
      {vertices.map((v, i) => (
        <group key={i} position={v}>
          {/* Ana nokta */}
          <mesh>
            <sphereGeometry args={[activeCorner === i ? 0.25 : 0.15, 16, 16]} />
            <meshStandardMaterial 
              color={activeCorner === i ? '#22c55e' : i === 2 ? '#f472b6' : '#06b6d4'} 
              emissive={activeCorner === i ? '#22c55e' : i === 2 ? '#f472b6' : '#06b6d4'}
              emissiveIntensity={activeCorner === i ? 1.5 : 0.8}
            />
          </mesh>
          
          {/* Mıknatıs alanı göstergesi */}
          {activeCorner === i && (
            <mesh>
              <ringGeometry args={[0.3, 0.5, 32]} />
              <meshBasicMaterial color="#22c55e" transparent opacity={0.3} side={THREE.DoubleSide} />
            </mesh>
          )}
        </group>
      ))}

      {/* Alan etiketi */}
      <Html position={[0, height/3, 0.5]} center>
        <motion.div 
          animate={{ scale: isPinching ? 1.1 : 1 }}
          className={`px-4 py-2 rounded-xl text-white font-bold whitespace-nowrap shadow-xl transition-colors ${
            isPinching ? 'bg-green-500/90' : 'bg-gradient-to-r from-purple-500/90 to-pink-500/90'
          }`}
        >
          <div className="text-xs opacity-80">Alan</div>
          <div className="text-xl">{area.toFixed(1)} cm²</div>
        </motion.div>
      </Html>
    </group>
  )
}

// 🔊 Ses Efektleri
const playSound = (type: 'click' | 'grab' | 'release' | 'swipe' | 'menu') => {
  // Web Audio API ile basit ses
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()
    
    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)
    
    const frequencies: Record<string, number> = {
      click: 800,
      grab: 400,
      release: 600,
      swipe: 500,
      menu: 300
    }
    
    oscillator.frequency.value = frequencies[type]
    oscillator.type = 'sine'
    gainNode.gain.value = 0.1
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1)
    
    oscillator.start()
    oscillator.stop(audioContext.currentTime + 0.1)
  } catch (e) {
    // Ses çalmadıysa sessizce devam et
  }
}

// 🎮 Ana Bileşen
export default function ProLesson({ onClose }: { onClose?: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  
  const [isRunning, setIsRunning] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [isMuted, setIsMuted] = useState(false)
  
  // El takibi state
  const [handPosition, setHandPosition] = useState({ x: 0.5, y: 0.5 })
  const [handDepth, setHandDepth] = useState(0) // Z ekseni
  const [isHandDetected, setIsHandDetected] = useState(false)
  const [isPinching, setIsPinching] = useState(false) // Başparmak + işaret birleşik
  const [isPalmOpen, setIsPalmOpen] = useState(false) // Avuç tam açık
  
  // Obje state
  const [objectPosition, setObjectPosition] = useState({ x: 0, y: 0 })
  const [objectRotation, setObjectRotation] = useState({ x: 0, y: 0 })
  const [objectScale, setObjectScale] = useState(1)
  const [activeCorner, setActiveCorner] = useState<number | null>(null)
  
  // Radial Menu
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [menuCenter, setMenuCenter] = useState({ x: 50, y: 50 })
  const [selectedMenuItem, setSelectedMenuItem] = useState<number | null>(null)
  
  // Swipe detection
  const [swipeState, setSwipeState] = useState<'idle' | 'ready' | 'swiping'>('idle')
  const swipeStartX = useRef(0)
  const swipeStartDepth = useRef(0)
  
  // Feedback
  const [feedback, setFeedback] = useState<string | null>(null)
  
  // One Euro Filters
  const filterX = useRef(new OneEuroFilter(1.0, 0.007))
  const filterY = useRef(new OneEuroFilter(1.0, 0.007))
  const filterDepth = useRef(new OneEuroFilter(0.5, 0.01))
  
  // Refs
  const handsRef = useRef<any>(null)
  const cameraRef = useRef<any>(null)
  const lastFrameTime = useRef(performance.now())
  const animationFrameRef = useRef<number>()
  
  // Ders adımları
  const steps = [
    { title: "👋 Merhaba!", content: "Elini göster. Köşelere yaklaş - otomatik tutulur!" },
    { title: "🤏 Pinch ile Döndür", content: "Başparmak + işaret parmağını birleştir, hareket ettir" },
    { title: "👐 Menü Aç", content: "Avucunu tam aç ve kameraya göster" },
    { title: "👉 Swipe ile Geç", content: "Elini kameraya yaklaştır, sağa/sola çek" },
  ]
  
  const step = steps[currentStep] || steps[0]
  
  // Radial Menu öğeleri
  const menuItems: RadialMenuItem[] = [
    { id: 'next', icon: <ChevronRight className="w-6 h-6" />, label: 'İleri', angle: 0, color: 'bg-cyan-600' },
    { id: 'hint', icon: <Lightbulb className="w-6 h-6" />, label: 'İpucu', angle: 60, color: 'bg-amber-600' },
    { id: 'reset', icon: <RotateCcw className="w-6 h-6" />, label: 'Sıfırla', angle: 120, color: 'bg-purple-600' },
    { id: 'prev', icon: <ChevronLeft className="w-6 h-6" />, label: 'Geri', angle: 180, color: 'bg-slate-600' },
    { id: 'home', icon: <Home className="w-6 h-6" />, label: 'Ana', angle: 240, color: 'bg-pink-600' },
    { id: 'settings', icon: <Settings className="w-6 h-6" />, label: 'Ayar', angle: 300, color: 'bg-indigo-600' },
  ]
  
  // Sticky Points - Üçgenin köşeleri (ekran koordinatları)
  const getStickyPoints = useCallback((): StickyPoint[] => {
    const centerX = 0.5 + objectPosition.x * 0.05
    const centerY = 0.4 - objectPosition.y * 0.05
    
    return [
      { id: 'left', x: centerX - 0.08, y: centerY + 0.05, radius: 0.08, isActive: false },
      { id: 'right', x: centerX + 0.08, y: centerY + 0.05, radius: 0.08, isActive: false },
      { id: 'top', x: centerX, y: centerY - 0.1, radius: 0.08, isActive: false },
    ]
  }, [objectPosition])
  
  // Pinch algılama (başparmak + işaret parmağı mesafesi)
  const detectPinch = useCallback((landmarks: any[]): boolean => {
    if (!landmarks || landmarks.length < 21) return false
    
    const thumbTip = landmarks[4]
    const indexTip = landmarks[8]
    
    const distance = Math.sqrt(
      Math.pow(thumbTip.x - indexTip.x, 2) +
      Math.pow(thumbTip.y - indexTip.y, 2)
    )
    
    return distance < 0.06 // Eşik değeri
  }, [])
  
  // Avuç açık mı? (5 parmak da açık)
  const detectPalmOpen = useCallback((landmarks: any[]): boolean => {
    if (!landmarks || landmarks.length < 21) return false
    
    let openFingers = 0
    const fingerTips = [4, 8, 12, 16, 20]
    const fingerBases = [2, 5, 9, 13, 17]
    
    fingerTips.forEach((tipIdx, i) => {
      const tip = landmarks[tipIdx]
      const base = landmarks[fingerBases[i]]
      
      // Parmak ucu, tabanından yukarıda mı?
      if (tip.y < base.y - 0.05) {
        openFingers++
      }
    })
    
    return openFingers >= 4
  }, [])
  
  // El derinliği (Z ekseni) - el büyüklüğünden tahmin
  const getHandDepth = useCallback((landmarks: any[]): number => {
    if (!landmarks || landmarks.length < 21) return 0
    
    // Avuç içi boyutu = derinlik tahmini
    const wrist = landmarks[0]
    const middleMCP = landmarks[9]
    
    const palmSize = Math.sqrt(
      Math.pow(wrist.x - middleMCP.x, 2) +
      Math.pow(wrist.y - middleMCP.y, 2)
    )
    
    // Normalize (0-1 arası, büyük = yakın)
    return Math.min(1, Math.max(0, (palmSize - 0.1) * 5))
  }, [])
  
  // Menü seçimi kontrolü
  const checkMenuSelection = useCallback((handX: number, handY: number, centerX: number, centerY: number): number | null => {
    const dx = handX - centerX / 100
    const dy = handY - centerY / 100
    const distance = Math.sqrt(dx * dx + dy * dy)
    
    if (distance < 0.05) return null // Merkezde
    if (distance > 0.25) return null // Çok uzakta
    
    let angle = Math.atan2(dy, dx) * (180 / Math.PI)
    if (angle < 0) angle += 360
    
    // En yakın menü öğesini bul
    let closest = 0
    let minDiff = 360
    
    menuItems.forEach((item, i) => {
      const diff = Math.abs(angle - item.angle)
      const wrappedDiff = Math.min(diff, 360 - diff)
      if (wrappedDiff < minDiff) {
        minDiff = wrappedDiff
        closest = i
      }
    })
    
    return minDiff < 45 ? closest : null
  }, [menuItems])
  
  // Menü aksiyonu
  const handleMenuAction = useCallback((itemId: string) => {
    playSound('click')
    
    switch (itemId) {
      case 'next':
        if (currentStep < steps.length - 1) {
          setCurrentStep(prev => prev + 1)
          setFeedback('➡️ İleri')
        }
        break
      case 'prev':
        if (currentStep > 0) {
          setCurrentStep(prev => prev - 1)
          setFeedback('⬅️ Geri')
        }
        break
      case 'hint':
        setFeedback('💡 ' + step.content)
        break
      case 'reset':
        setObjectPosition({ x: 0, y: 0 })
        setObjectRotation({ x: 0, y: 0 })
        setObjectScale(1)
        setFeedback('🔄 Sıfırlandı')
        break
      case 'home':
        onClose?.()
        break
      case 'settings':
        setFeedback('⚙️ Ayarlar yakında!')
        break
    }
    
    setTimeout(() => setFeedback(null), 1500)
  }, [currentStep, steps.length, step, onClose])
  
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
        const now = performance.now()
        
        if (canvasRef.current && videoRef.current) {
          const ctx = canvasRef.current.getContext('2d')
          if (ctx) {
            canvasRef.current.width = videoRef.current.videoWidth
            canvasRef.current.height = videoRef.current.videoHeight
            ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
            
            if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
              const landmarks = results.multiHandLandmarks[0]
              setIsHandDetected(true)
              
              // Parmak pozisyonları - ONE EURO FILTER ile
              const rawX = landmarks[8].x // İşaret parmağı
              const rawY = landmarks[8].y
              const rawDepth = getHandDepth(landmarks)
              
              const filteredX = filterX.current.filter(rawX, now)
              const filteredY = filterY.current.filter(rawY, now)
              const filteredDepth = filterDepth.current.filter(rawDepth, now)
              
              setHandPosition({ x: filteredX, y: filteredY })
              setHandDepth(filteredDepth)
              
              // Gesture algılama
              const pinching = detectPinch(landmarks)
              const palmOpen = detectPalmOpen(landmarks)
              
              setIsPinching(pinching)
              setIsPalmOpen(palmOpen)
              
              // ===== RADIAL MENU =====
              if (palmOpen && !isMenuOpen) {
                setIsMenuOpen(true)
                setMenuCenter({ x: filteredX * 100, y: filteredY * 100 })
                playSound('menu')
              } else if (!palmOpen && isMenuOpen) {
                // Menü kapatılırken seçim yap
                if (selectedMenuItem !== null) {
                  handleMenuAction(menuItems[selectedMenuItem].id)
                }
                setIsMenuOpen(false)
                setSelectedMenuItem(null)
              }
              
              if (isMenuOpen) {
                const selection = checkMenuSelection(filteredX, filteredY, menuCenter.x, menuCenter.y)
                setSelectedMenuItem(selection)
              }
              
              // ===== STICKY POINTS =====
              if (!isMenuOpen && !palmOpen) {
                const stickyPoints = getStickyPoints()
                let nearestCorner: number | null = null
                let minDist = Infinity
                
                stickyPoints.forEach((point, i) => {
                  const dist = Math.sqrt(
                    Math.pow(filteredX - point.x, 2) +
                    Math.pow(filteredY - point.y, 2)
                  )
                  
                  if (dist < point.radius && dist < minDist) {
                    minDist = dist
                    nearestCorner = i
                  }
                })
                
                if (nearestCorner !== null && activeCorner !== nearestCorner) {
                  playSound('grab')
                }
                setActiveCorner(nearestCorner)
                
                // Pinch ile döndürme/ölçekleme
                if (pinching && activeCorner !== null) {
                  // Döndürme
                  setObjectRotation({
                    x: (filteredY - 0.5) * Math.PI,
                    y: (filteredX - 0.5) * -Math.PI
                  })
                  
                  // Ölçekleme (derinlikle)
                  setObjectScale(0.8 + filteredDepth * 0.8)
                }
              }
              
              // ===== Z-AXIS SWIPE =====
              if (!isMenuOpen && !pinching) {
                // Derinlik eşiği aşıldı mı?
                if (filteredDepth > 0.6 && swipeState === 'idle') {
                  setSwipeState('ready')
                  swipeStartX.current = filteredX
                  swipeStartDepth.current = filteredDepth
                } else if (swipeState === 'ready') {
                  const deltaX = filteredX - swipeStartX.current
                  
                  if (Math.abs(deltaX) > 0.15) {
                    // Swipe algılandı!
                    playSound('swipe')
                    
                    if (deltaX > 0) {
                      // Sağa swipe (ayna nedeniyle sola görünür) = Geri
                      if (currentStep > 0) {
                        setCurrentStep(prev => prev - 1)
                        setFeedback('⬅️ Geri')
                      }
                    } else {
                      // Sola swipe = İleri
                      if (currentStep < steps.length - 1) {
                        setCurrentStep(prev => prev + 1)
                        setFeedback('➡️ İleri')
                      }
                    }
                    
                    setSwipeState('swiping')
                    setTimeout(() => {
                      setSwipeState('idle')
                      setFeedback(null)
                    }, 800)
                  }
                }
                
                if (filteredDepth < 0.4 && swipeState !== 'idle') {
                  setSwipeState('idle')
                }
              }
              
              // ===== EL ÇİZİMİ =====
              // İşaret parmağı
              const fingerX = filteredX * canvasRef.current.width
              const fingerY = filteredY * canvasRef.current.height
              
              // Mıknatıs göstergesi
              if (activeCorner !== null) {
                ctx.beginPath()
                ctx.arc(fingerX, fingerY, 40, 0, Math.PI * 2)
                ctx.strokeStyle = '#22c55e'
                ctx.lineWidth = 3
                ctx.setLineDash([5, 5])
                ctx.stroke()
                ctx.setLineDash([])
              }
              
              // Parmak noktası
              ctx.beginPath()
              ctx.arc(fingerX, fingerY, pinching ? 20 : 12, 0, Math.PI * 2)
              ctx.fillStyle = pinching ? '#22c55e' : activeCorner !== null ? '#f472b6' : '#06b6d4'
              ctx.shadowColor = ctx.fillStyle
              ctx.shadowBlur = 20
              ctx.fill()
              
              // Derinlik göstergesi
              if (swipeState === 'ready') {
                ctx.fillStyle = '#facc15'
                ctx.font = 'bold 24px sans-serif'
                ctx.fillText('👉 SWIPE!', fingerX + 30, fingerY)
              }
              
            } else {
              setIsHandDetected(false)
              setIsPinching(false)
              setIsPalmOpen(false)
              setActiveCorner(null)
              setIsMenuOpen(false)
              setSwipeState('idle')
              
              // Filtreleri sıfırla
              filterX.current.reset()
              filterY.current.reset()
              filterDepth.current.reset()
            }
          }
        }
        
        lastFrameTime.current = now
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
  }, [detectPinch, detectPalmOpen, getHandDepth, getStickyPoints, isMenuOpen, menuCenter, selectedMenuItem, handleMenuAction, menuItems, checkMenuSelection, activeCorner, swipeState, currentStep, steps.length])
  
  // Cleanup
  useEffect(() => {
    return () => {
      if (cameraRef.current) cameraRef.current.stop()
      if (videoRef.current?.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks()
        tracks.forEach(track => track.stop())
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [])
  
  // TTS
  useEffect(() => {
    if (isRunning && step && !isMuted) {
      window.speechSynthesis.cancel()
      const utterance = new SpeechSynthesisUtterance(`${step.title}. ${step.content}`)
      utterance.lang = 'tr-TR'
      utterance.rate = 0.9
      window.speechSynthesis.speak(utterance)
    }
  }, [currentStep, isRunning, isMuted])

  return (
    <div className="fixed inset-0 z-50 bg-slate-900">
      {/* Kamera */}
      <video 
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover transform scale-x-[-1]"
        playsInline
        muted
      />
      
      {/* El Canvas */}
      <canvas 
        ref={canvasRef}
        className="absolute inset-0 w-full h-full object-cover transform scale-x-[-1] pointer-events-none"
      />
      
      {/* Overlay */}
      <div className="absolute inset-0 bg-slate-900/30 pointer-events-none" />
      
      {/* 3D Canvas */}
      {isRunning && (
        <div className="absolute inset-0 pointer-events-none">
          <Canvas
            style={{ background: 'transparent' }}
            gl={{ alpha: true }}
            camera={{ position: [0, 2, 10], fov: 45 }}
          >
            <ambientLight intensity={0.6} />
            <pointLight position={[10, 10, 10]} intensity={1} color="#06b6d4" />
            
            <SmartTriangle 
              position={objectPosition}
              rotation={objectRotation}
              scale={objectScale}
              activeCorner={activeCorner}
              isPinching={isPinching}
            />
          </Canvas>
        </div>
      )}
      
      {/* Radial Menu */}
      <RadialMenu
        isOpen={isMenuOpen}
        centerX={menuCenter.x}
        centerY={menuCenter.y}
        items={menuItems}
        selectedIndex={selectedMenuItem}
        onSelect={handleMenuAction}
      />
      
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-6 py-4 bg-gradient-to-b from-slate-900/90 to-transparent">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center text-2xl">
            🎯
          </div>
          <div>
            <h1 className="text-white font-black text-2xl">Pro Lesson</h1>
            <p className="text-cyan-400 text-sm">Akıcı El Takibi</p>
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
            <div className="w-32 h-32 mx-auto mb-8 rounded-full bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center text-6xl shadow-2xl">
              🎯
            </div>
            <h2 className="text-4xl font-black text-white mb-4">
              Pro Lesson
            </h2>
            <p className="text-slate-400 text-lg mb-6">
              Profesyonel el takibi deneyimi
            </p>
            
            <div className="grid grid-cols-2 gap-4 mb-8 text-left text-sm">
              <div className="bg-slate-800/80 rounded-xl p-4">
                <div className="text-2xl mb-2">🎯</div>
                <div className="text-white font-semibold">Sticky Point</div>
                <div className="text-slate-400 text-xs">Köşelere yaklaş, otomatik tutulur</div>
              </div>
              <div className="bg-slate-800/80 rounded-xl p-4">
                <div className="text-2xl mb-2">🤏</div>
                <div className="text-white font-semibold">Pinch</div>
                <div className="text-slate-400 text-xs">Başparmak + işaret = döndür</div>
              </div>
              <div className="bg-slate-800/80 rounded-xl p-4">
                <div className="text-2xl mb-2">👐</div>
                <div className="text-white font-semibold">Palm Menu</div>
                <div className="text-slate-400 text-xs">Avuç aç = dairesel menü</div>
              </div>
              <div className="bg-slate-800/80 rounded-xl p-4">
                <div className="text-2xl mb-2">👉</div>
                <div className="text-white font-semibold">Z-Swipe</div>
                <div className="text-slate-400 text-xs">Yaklaş + sağa/sola = geç</div>
              </div>
            </div>
            
            <button
              onClick={startTracking}
              className="px-10 py-5 rounded-2xl bg-gradient-to-r from-cyan-500 to-purple-500 text-white text-xl font-bold hover:scale-105 transition-transform shadow-2xl"
            >
              🎯 Başla
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
      
      {/* Durum Göstergesi */}
      {isRunning && (
        <div className="absolute bottom-6 left-6 z-20 bg-slate-900/90 backdrop-blur-sm rounded-xl px-4 py-3 border border-slate-700/50">
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${isHandDetected ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-slate-400">El</span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${isPinching ? 'bg-green-500' : 'bg-slate-600'}`} />
              <span className="text-slate-400">Pinch</span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${activeCorner !== null ? 'bg-pink-500' : 'bg-slate-600'}`} />
              <span className="text-slate-400">Tutma</span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${swipeState === 'ready' ? 'bg-yellow-500' : 'bg-slate-600'}`} />
              <span className="text-slate-400">Swipe</span>
            </div>
          </div>
        </div>
      )}
      
      {/* Feedback */}
      <AnimatePresence>
        {feedback && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5, y: -50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.5 }}
            className="absolute top-1/3 left-1/2 transform -translate-x-1/2 z-40 px-8 py-4 rounded-2xl bg-gradient-to-r from-cyan-500/90 to-purple-500/90 backdrop-blur-sm text-white text-2xl font-bold shadow-2xl"
          >
            {feedback}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
