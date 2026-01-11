'use client'

import { useRef, useState, useEffect } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Html, Line } from '@react-three/drei'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Volume2, VolumeX } from 'lucide-react'
import * as THREE from 'three'
import { OneEuroFilter, OneEuroFilter2D, FilterPresets } from '@/lib/OneEuroFilter'
import { GestureStateMachine, GestureInput, GestureOutput, GestureState } from '@/lib/GestureStateMachine'
import { HandCalibration, CalibrationState, CalibrationData } from '@/lib/HandCalibration'
import { GestureClassifier, GestureLabels, GestureType } from '@/lib/GestureClassifier'
import Shape3D, { ShapeType, ShapeInfo } from './shapes/Shape3D'

// ============================================
// 🤖 JARVIS EDUCATION v9 - MULTI SHAPE
// One Euro + State Machine + AI Gesture + 4 Şekil
// ============================================

// One Euro Filter instances
const handPositionFilter = new OneEuroFilter2D(FilterPresets.HAND_TRACKING)
const pinchFilter = new OneEuroFilter(FilterPresets.PINCH)
const rotationFilter = new OneEuroFilter(FilterPresets.ROTATION)
const scaleFilter = new OneEuroFilter({ minCutoff: 0.8, beta: 0.01, dCutoff: 1.0 })

// Gesture State Machine instance
const gestureStateMachine = new GestureStateMachine({
  pinchThreshold: 0.12,
  pinchReadyThreshold: 0.18,
  cornerProximity: 0.12,
  minPinchDuration: 80,
  minGrabDuration: 60,
  stateChangeCooldown: 40,
  minConfidenceForTransition: 0.5
})

// Kalibrasyon instance
const handCalibration = new HandCalibration()

// Gesture Classifier instance
const gestureClassifier = new GestureClassifier()

// Global state - globalThis'e de sync ediliyor (Shape3D erişimi için)
let globalHandX = 0.5
let globalHandY = 0.5
let globalIsGrabbing = false
let globalGrabStartX = 0.5
let globalGrabStartY = 0.5
let globalPinchDistance = 0
let globalIsPinching = false
let globalActiveCorner: number | null = null
let globalTriangleBase = 4
let globalTriangleHeight = 3
// Pozisyon için
let globalPositionX = 0
let globalPositionY = 1.5
let globalLastHandX = 0.5
let globalLastHandY = 0.5
let globalDragMode: 'move' | 'rotate' = 'move'
// El dönüş açısı
let globalHandRotation = 0
let globalPinchStartRotation = 0
let globalRotationOffset = 0
// Filtered values (smooth)
let globalFilteredScale = 1

// Global state'leri globalThis'e sync et (Shape3D erişimi için)
function syncGlobalState() {
  globalThis.globalHandX = globalHandX
  globalThis.globalHandY = globalHandY
  globalThis.globalIsGrabbing = globalIsGrabbing
  globalThis.globalIsPinching = globalIsPinching
  globalThis.globalActiveCorner = globalActiveCorner
  globalThis.globalPositionX = globalPositionX
  globalThis.globalPositionY = globalPositionY
  globalThis.globalFilteredScale = globalFilteredScale
  globalThis.globalHandRotation = globalHandRotation
  globalThis.globalPinchStartRotation = globalPinchStartRotation
  globalThis.globalRotationOffset = globalRotationOffset
}

// 🔺 3D Üçgen - Gelişmiş + Taşıma
function Triangle3D() {
  const meshRef = useRef<THREE.Group>(null)
  const [scale, setScale] = useState(1)
  const [base, setBase] = useState(4)
  const [height, setHeight] = useState(3)
  const baseRef = useRef(4)
  const heightRef = useRef(3)
  const posXRef = useRef(0)
  const posYRef = useRef(1.5)
  const rotXRef = useRef(0)
  const rotYRef = useRef(0)
  
  useFrame(() => {
    if (!meshRef.current) return
    
    // Global değerleri al
    const currentBase = globalTriangleBase
    const currentHeight = globalTriangleHeight
    
    // Smooth güncelleme
    baseRef.current += (currentBase - baseRef.current) * 0.1
    heightRef.current += (currentHeight - heightRef.current) * 0.1
    
    setBase(baseRef.current)
    setHeight(heightRef.current)
    
    if (globalIsGrabbing && globalActiveCorner === null) {
      if (globalDragMode === 'move') {
        // TAŞIMA MODU - El hareketine göre pozisyon değiştir
        // handX artık mirror edilmiş, normal yönde çalışır
        const deltaX = (globalHandX - globalLastHandX) * 25
        const deltaY = (globalLastHandY - globalHandY) * 15
        
        globalPositionX += deltaX
        globalPositionY += deltaY
        
        // Sınırlar
        globalPositionX = Math.max(-8, Math.min(8, globalPositionX))
        globalPositionY = Math.max(-4, Math.min(6, globalPositionY))
      } else {
        // DÖNDÜRME MODU - Başparmak ile döndür
        const deltaX = (globalGrabStartX - globalHandX) * 10
        const deltaY = (globalHandY - globalGrabStartY) * 10
        rotXRef.current = deltaY
        rotYRef.current = deltaX
      }
      
      globalLastHandX = globalHandX
      globalLastHandY = globalHandY
    }
    // Serbest modda dönme YOK - sabit dursun
    
    // Smooth pozisyon uygula
    posXRef.current += (globalPositionX - posXRef.current) * 0.15
    posYRef.current += (globalPositionY - posYRef.current) * 0.15
    
    meshRef.current.position.x = posXRef.current
    meshRef.current.position.y = posYRef.current
    meshRef.current.rotation.x = rotXRef.current
    meshRef.current.rotation.y = rotYRef.current
    
    // Pinch zoom - One Euro Filter ile smooth scale
    if (globalIsPinching) {
      const targetScale = 0.3 + globalPinchDistance * 8
      const clampedScale = Math.max(0.2, Math.min(4, targetScale))
      // Filter uygula - smooth scale transition
      globalFilteredScale = scaleFilter.filter(clampedScale, Date.now())
      setScale(globalFilteredScale)
      
      // Pinch sırasında el dönüşü ile üçgeni döndür (delta açı)
      const deltaRotation = (globalHandRotation - globalPinchStartRotation) * 2
      rotYRef.current = globalRotationOffset + deltaRotation
    } else {
      // Pinch yokken kayıtlı rotasyonu koru
      rotYRef.current += (globalRotationOffset - rotYRef.current) * 0.1
    }
  })
  
  const vertices = [
    new THREE.Vector3(-base/2, 0, 0),      // 0: Sol alt
    new THREE.Vector3(base/2, 0, 0),       // 1: Sağ alt  
    new THREE.Vector3(0, height, 0),       // 2: Tepe
  ]
  
  const area = (base * height) / 2
  
  // Köşe renkleri
  const cornerColors = ['#06b6d4', '#06b6d4', '#f472b6']
  const activeCornerColor = '#22c55e'

  return (
    <group ref={meshRef} scale={[scale, scale, scale]}>
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
          color={globalIsGrabbing ? "#22c55e" : "#06b6d4"} 
          transparent 
          opacity={0.4}
          side={THREE.DoubleSide}
          emissive={globalIsGrabbing ? "#22c55e" : "#06b6d4"}
          emissiveIntensity={0.3}
        />
      </mesh>

      {/* Kenarlar */}
      <Line
        points={[...vertices, vertices[0]]}
        color={globalIsGrabbing ? "#22c55e" : "#06b6d4"}
        lineWidth={4}
      />

      {/* Köşe noktaları - Sürüklenebilir */}
      {vertices.map((v, i) => (
        <group key={i} position={v}>
          <mesh>
            <sphereGeometry args={[globalActiveCorner === i ? 0.3 : 0.18, 16, 16]} />
            <meshStandardMaterial 
              color={globalActiveCorner === i ? activeCornerColor : cornerColors[i]} 
              emissive={globalActiveCorner === i ? activeCornerColor : cornerColors[i]}
              emissiveIntensity={globalActiveCorner === i ? 1.5 : 0.8}
            />
          </mesh>
          {/* Köşe etiketi */}
          <Html position={[0, -0.5, 0]} center>
            <div className={`px-2 py-1 rounded text-xs font-bold ${
              globalActiveCorner === i ? 'bg-green-500 text-white' : 'bg-slate-800/80 text-slate-300'
            }`}>
              {i === 0 ? 'A' : i === 1 ? 'B' : 'C'}
            </div>
          </Html>
        </group>
      ))}

      {/* Taban etiketi */}
      <Html position={[0, -0.8, 0]} center>
        <div className="px-3 py-1.5 bg-cyan-500/90 rounded-lg text-white text-sm font-bold whitespace-nowrap shadow-lg">
          Taban: {base.toFixed(1)} cm
        </div>
      </Html>

      {/* Yükseklik etiketi */}
      <Html position={[base/2 + 0.8, height/2, 0]} center>
        <div className="px-3 py-1.5 bg-yellow-500/90 rounded-lg text-white text-sm font-bold whitespace-nowrap shadow-lg">
          h = {height.toFixed(1)} cm
        </div>
      </Html>

      {/* Alan etiketi - Merkez */}
      <Html position={[0, height/3, 0.5]} center>
        <motion.div 
          animate={{ scale: globalIsGrabbing ? 1.1 : 1 }}
          className={`px-5 py-3 rounded-xl text-white font-bold whitespace-nowrap shadow-2xl transition-all ${
            globalIsGrabbing ? 'bg-green-500' : 'bg-gradient-to-r from-purple-500 to-pink-500'
          }`}
        >
          <div className="text-xs opacity-80">Alan</div>
          <div className="text-2xl">{area.toFixed(1)} cm²</div>
          <div className="text-xs opacity-60 mt-1">({base.toFixed(1)} × {height.toFixed(1)}) ÷ 2</div>
        </motion.div>
      </Html>
    </group>
  )
}

// 🎮 ANA BİLEŞEN
export default function JarvisEducation({ onClose }: { onClose?: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  
  const [isRunning, setIsRunning] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  
  // UI state
  const [handDetected, setHandDetected] = useState(false)
  const [grabbing, setGrabbing] = useState(false)
  const [pinching, setPinching] = useState(false)
  const [activeCorner, setActiveCorner] = useState<number | null>(null)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [triangleBase, setTriangleBase] = useState(4)
  const [triangleHeight, setTriangleHeight] = useState(3)
  
  // Kalibrasyon state
  const [isCalibrating, setIsCalibrating] = useState(false)
  const [calibrationState, setCalibrationState] = useState<CalibrationState | null>(null)
  const [isCalibrated, setIsCalibrated] = useState(handCalibration.isCalibrated())
  
  // Gesture state
  const [currentGesture, setCurrentGesture] = useState<GestureType>('UNKNOWN')
  const [gestureConfidence, setGestureConfidence] = useState(0)
  
  // Şekil state
  const [selectedShape, setSelectedShape] = useState<ShapeType>('triangle')
  const [shapeSide, setShapeSide] = useState(4)      // Kare için
  const [shapeWidth, setShapeWidth] = useState(5)    // Dikdörtgen için
  const [shapeRadius, setShapeRadius] = useState(2)  // Daire için
  
  const handsRef = useRef<any>(null)
  const cameraRef = useRef<any>(null)
  const lastGrabState = useRef(false)
  const lastPinchState = useRef(false)
  const cornerGrabStart = useRef<{x: number, y: number, base: number, height: number} | null>(null)
  const isCalibratingRef = useRef(false) // Closure için ref
  
  const steps = [
    { title: "👋 Merhaba!", hint: "Elini göster" },
    { title: "✋ Yumruk = Taşı", hint: "Yumruk yap ve sürükle" },
    { title: "🤏 Pinch = Zoom", hint: "Başparmak + işaret yaklaştır" },
    { title: "📐 Köşe = Boyut", hint: "Köşeye yaklaş ve çek" },
  ]
  
  const step = steps[currentStep] || steps[0]
  
  // Yumruk algılama
  const isHandClosed = (landmarks: any[]): boolean => {
    try {
      if (!landmarks || landmarks.length < 21) return false
      let closed = 0
      const tips = [8, 12, 16, 20]
      const pips = [6, 10, 14, 18]
      tips.forEach((tip, i) => {
        if (landmarks[tip]?.y > landmarks[pips[i]]?.y) closed++
      })
      return closed >= 3
    } catch { return false }
  }
  
  // Pinch algılama (başparmak + işaret mesafesi)
  const getPinchDistance = (landmarks: any[]): number => {
    try {
      if (!landmarks || landmarks.length < 21) return 0
      const thumb = landmarks[4]
      const index = landmarks[8]
      if (!thumb || !index) return 0
      return Math.sqrt(
        Math.pow(thumb.x - index.x, 2) + 
        Math.pow(thumb.y - index.y, 2)
      )
    } catch { return 0 }
  }
  
  // El dönüş açısını hesapla (wrist -> middle finger base)
  const getHandRotation = (landmarks: any[]): number => {
    try {
      if (!landmarks || landmarks.length < 21) return 0
      const wrist = landmarks[0]      // Bilek
      const middleBase = landmarks[9] // Orta parmak tabanı
      if (!wrist || !middleBase) return 0
      
      // Açıyı hesapla (radyan cinsinden)
      const angle = Math.atan2(middleBase.y - wrist.y, middleBase.x - wrist.x)
      return angle
    } catch { return 0 }
  }
  
  // Köşeye yakınlık kontrolü
  const getNearestCorner = (handX: number, handY: number): number | null => {
    // Ekran koordinatlarında köşe pozisyonları
    // handX zaten mirror edilmiş, normal koordinatlar kullan
    const corners = [
      { x: 0.35, y: 0.55 },  // A (Sol alt) - Ekranda SOLDA
      { x: 0.65, y: 0.55 },  // B (Sağ alt) - Ekranda SAĞDA
      { x: 0.50, y: 0.25 },  // C (Tepe) - Ortada
    ]
    
    let nearest = null
    let minDist = 0.12 // Eşik mesafesi
    
    corners.forEach((corner, i) => {
      const dist = Math.sqrt(
        Math.pow(handX - corner.x, 2) + 
        Math.pow(handY - corner.y, 2)
      )
      if (dist < minDist) {
        minDist = dist
        nearest = i
      }
    })
    
    return nearest
  }
  
  // Başlat
  const startJarvis = async () => {
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
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
      })
      
      hands.onResults((results: any) => {
        try {
          if (!canvasRef.current || !videoRef.current) return
          
          const ctx = canvasRef.current.getContext('2d')
          if (!ctx) return
          
          const W = canvasRef.current.width = videoRef.current.videoWidth
          const H = canvasRef.current.height = videoRef.current.videoHeight
          ctx.clearRect(0, 0, W, H)
          
          const landmarks = results?.multiHandLandmarks?.[0]
          
          if (landmarks && landmarks.length >= 21) {
            setHandDetected(true)
            const now = Date.now()
            
            // === RAW DEĞERLER ===
            // Video mirror olduğu için X koordinatını tersine çevir!
            const rawHandX = 1 - (landmarks[9]?.x ?? 0.5)
            const rawHandY = landmarks[9]?.y ?? 0.5
            const rawPinchDist = getPinchDistance(landmarks)
            const rawHandRotation = getHandRotation(landmarks)
            
            // === ONE EURO FILTER UYGULA ===
            // El pozisyonu - smooth
            const filtered = handPositionFilter.filter(rawHandX, rawHandY, now)
            const handX = filtered.x
            const handY = filtered.y
            
            // Pinch mesafesi - smooth
            const pinchDist = pinchFilter.filter(rawPinchDist, now)
            
            // El dönüş açısı - smooth
            const handRotation = rotationFilter.filter(rawHandRotation, now)
            
            // Global değerlere ata
            globalHandX = handX
            globalHandY = handY
            globalPinchDistance = pinchDist
            globalHandRotation = handRotation
            
            // === GESTURE CLASSIFIER ===
            const gestureResult = gestureClassifier.classify(landmarks)
            setCurrentGesture(gestureResult.gesture)
            setGestureConfidence(gestureResult.confidence)
            
            // Yumruk kontrolü - Classifier'dan al
            const isClosed = gestureResult.gesture === 'CLOSED_FIST' || 
                            gestureResult.gesture === 'PINCH'
            
            // === KALİBRASYON MODU ===
            if (isCalibratingRef.current) {
              handCalibration.update(pinchDist, isClosed, true)
              
              // Mirror fonksiyonu
              const mirrorX = (x: number) => (1 - x) * W
              
              // Kalibrasyon sırasında sadece el çiz (mirror edilmiş)
              ctx.strokeStyle = '#f59e0b'
              ctx.lineWidth = 3
              const tips = [4, 8, 12, 16, 20]
              tips.forEach(i => {
                const point = landmarks[i]
                if (point?.x !== undefined) {
                  ctx.beginPath()
                  ctx.arc(mirrorX(point.x), point.y * H, 12, 0, Math.PI * 2)
                  ctx.fillStyle = i === 4 || i === 8 ? '#22c55e' : '#f59e0b'
                  ctx.fill()
                }
              })
              
              // Pinch çizgisi (mirror edilmiş)
              if (landmarks[4] && landmarks[8]) {
                ctx.beginPath()
                ctx.moveTo(mirrorX(landmarks[4].x), landmarks[4].y * H)
                ctx.lineTo(mirrorX(landmarks[8].x), landmarks[8].y * H)
                ctx.strokeStyle = '#22c55e'
                ctx.lineWidth = 4
                ctx.stroke()
                
                // Mesafe göster (düzgün yazı)
                const midX = mirrorX((landmarks[4].x + landmarks[8].x) / 2)
                const midY = (landmarks[4].y + landmarks[8].y) / 2 * H
                ctx.font = 'bold 24px sans-serif'
                ctx.fillStyle = '#fff'
                ctx.fillText(`${(pinchDist * 100).toFixed(0)}`, midX + 30, midY)
              }
              
              return // Kalibrasyon modunda normal işlemleri yapma
            }
            
            // Köşe yakınlık kontrolü
            const nearCorner = getNearestCorner(handX, handY)
            
            // === STATE MACHINE GÜNCELLE ===
            const gestureInput: GestureInput = {
              handDetected: true,
              pinchDistance: pinchDist,
              isHandClosed: isClosed,
              nearestCorner: nearCorner,
              handX: handX,
              handY: handY,
              handRotation: handRotation,
              timestamp: now
            }
            
            const gestureOutput = gestureStateMachine.update(gestureInput)
            const currentState = gestureOutput.state
            
            // State'e göre aksiyonlar
            if (gestureOutput.event) {
              switch (gestureOutput.event) {
                case 'PINCH_START':
                  globalIsPinching = true
                  globalPinchStartRotation = handRotation
                  setPinching(true)
                  setFeedback('🤏 ZOOM + DÖNDÜR')
                  if (currentStep < 3) setCurrentStep(2)
                  break
                  
                case 'PINCH_END':
                  globalRotationOffset += (globalHandRotation - globalPinchStartRotation) * 2
                  globalIsPinching = false
                  setPinching(false)
                  break
                  
                case 'GRAB_START':
                  globalIsGrabbing = true
                  globalGrabStartX = handX
                  globalGrabStartY = handY
                  globalLastHandX = handX
                  globalLastHandY = handY
                  setGrabbing(true)
                  setFeedback(globalDragMode === 'move' ? '✋ TAŞI!' : '🔄 DÖNDÜR!')
                  if (currentStep < 2) setCurrentStep(1)
                  break
                  
                case 'GRAB_END':
                  globalIsGrabbing = false
                  setGrabbing(false)
                  setFeedback('🖐️ BIRAKILDI')
                  break
                  
                case 'CORNER_GRAB':
                  globalActiveCorner = gestureOutput.corner
                  setActiveCorner(gestureOutput.corner)
                  cornerGrabStart.current = {
                    x: handX,
                    y: handY,
                    base: globalTriangleBase,
                    height: globalTriangleHeight
                  }
                  setFeedback(`📐 Köşe ${['A', 'B', 'C'][gestureOutput.corner!]} tutuldu!`)
                  if (currentStep < 4) setCurrentStep(3)
                  break
                  
                case 'CORNER_RELEASE':
                  globalActiveCorner = null
                  setActiveCorner(null)
                  cornerGrabStart.current = null
                  setFeedback('🖐️ BIRAKILDI')
                  break
              }
            }
            
            // Köşe sürükleme - sadece CORNER_GRAB state'inde
            if (currentState === 'CORNER_GRAB' && cornerGrabStart.current && gestureOutput.corner !== null) {
              // Delta hesapla
              const deltaX = (handX - cornerGrabStart.current.x) * 10
              const deltaY = (cornerGrabStart.current.y - handY) * 10
              
              if (gestureOutput.corner === 0 || gestureOutput.corner === 1) {
                // A köşesi (0): Sol alt - sola çekilince taban büyür
                // B köşesi (1): Sağ alt - sağa çekilince taban büyür
                const directionX = gestureOutput.corner === 0 ? -1 : 1
                const newBase = Math.max(2, Math.min(8, cornerGrabStart.current.base + deltaX * directionX))
                globalTriangleBase = newBase
                setTriangleBase(newBase)
                
                // ÇAPRAZ: Aşağı çekilince yükseklik azalır, yukarı çekilince artar
                const newHeight = Math.max(2, Math.min(6, cornerGrabStart.current.height + deltaY * 0.5))
                globalTriangleHeight = newHeight
                setTriangleHeight(newHeight)
              } else if (gestureOutput.corner === 2) {
                // C köşesi (Tepe): Yukarı çekilince yükseklik artar
                const newHeight = Math.max(2, Math.min(6, cornerGrabStart.current.height + deltaY))
                globalTriangleHeight = newHeight
                setTriangleHeight(newHeight)
                
                // ÇAPRAZ: Sağa/sola çekilince taban da değişir
                const newBase = Math.max(2, Math.min(8, cornerGrabStart.current.base + Math.abs(deltaX) * 0.3))
                globalTriangleBase = newBase
                setTriangleBase(newBase)
              }
            }
            
            // State'e göre renkler
            const isPinch = currentState === 'PINCHING' || currentState === 'PINCH_READY'
            const isGrab = currentState === 'GRABBING' || currentState === 'CORNER_GRAB'
            
            // === EL ÇİZİMİ (Mirror edilmiş - video ile uyumlu) ===
            // Mirror fonksiyonu - landmarks X'ini çevir
            const mirrorX = (x: number) => (1 - x) * W
            
            ctx.strokeStyle = isGrab ? '#22c55e' : isPinch ? '#f59e0b' : '#06b6d4'
            ctx.lineWidth = 3
            ctx.shadowColor = ctx.strokeStyle
            ctx.shadowBlur = 15
            
            // Parmak uçları (mirror edilmiş)
            const tips = [4, 8, 12, 16, 20]
            tips.forEach(i => {
              const point = landmarks[i]
              if (point?.x !== undefined) {
                ctx.beginPath()
                ctx.arc(mirrorX(point.x), point.y * H, 10, 0, Math.PI * 2)
                ctx.fillStyle = i === 4 || i === 8 ? '#f59e0b' : ctx.strokeStyle
                ctx.fill()
              }
            })
            
            // Pinch çizgisi (mirror edilmiş)
            if (landmarks[4] && landmarks[8]) {
              ctx.beginPath()
              ctx.moveTo(mirrorX(landmarks[4].x), landmarks[4].y * H)
              ctx.lineTo(mirrorX(landmarks[8].x), landmarks[8].y * H)
              ctx.strokeStyle = isPinch ? '#22c55e' : '#f59e0b'
              ctx.lineWidth = isPinch ? 6 : 2
              ctx.stroke()
              
              // Pinch mesafe göstergesi (mirror edilmiş)
              const midX = mirrorX((landmarks[4].x + landmarks[8].x) / 2)
              const midY = (landmarks[4].y + landmarks[8].y) / 2 * H
              ctx.font = 'bold 16px sans-serif'
              ctx.fillStyle = '#fff'
              ctx.fillText(`${(pinchDist * 100).toFixed(0)}%`, midX + 20, midY)
              
              // El açısı göstergesi (pinch modunda)
              if (isPinch) {
                const deltaAngle = ((handRotation - globalPinchStartRotation) * 180 / Math.PI).toFixed(0)
                ctx.fillStyle = '#22c55e'
                ctx.fillText(`🔄 ${deltaAngle}°`, midX + 20, midY + 25)
              }
            }
            
            // Merkez gösterge (handX zaten mirror edilmiş)
            ctx.beginPath()
            ctx.arc(handX * W, handY * H, isGrab ? 50 : isPinch ? 40 : 30, 0, Math.PI * 2)
            ctx.strokeStyle = isGrab ? '#22c55e' : isPinch ? '#f59e0b' : '#06b6d4'
            ctx.lineWidth = 4
            ctx.stroke()
            
            // Durum yazısı - Gesture Classifier'dan
            ctx.font = 'bold 20px sans-serif'
            ctx.fillStyle = '#fff'
            
            // State'e göre veya Gesture'a göre label
            let statusLabel = ''
            if (currentState === 'CORNER_HOVER') {
              statusLabel = `📐 Köşe ${['A','B','C'][nearCorner ?? 0]}`
            } else if (currentState === 'CORNER_GRAB') {
              statusLabel = `📐 Köşe ${['A','B','C'][gestureOutput.corner ?? 0]}`
            } else {
              // Gesture Classifier'dan al
              const gl = GestureLabels[gestureResult.gesture]
              statusLabel = `${gl.emoji} ${gl.name}`
            }
            ctx.fillText(statusLabel, handX * W + 60, handY * H)
            
            // Gesture Confidence göstergesi
            ctx.font = 'bold 12px sans-serif'
            ctx.fillStyle = gestureResult.confidence > 0.7 ? '#22c55e' : '#f59e0b'
            ctx.fillText(`${(gestureResult.confidence * 100).toFixed(0)}%`, handX * W + 60, handY * H + 20)
            
            // Parmak durumları (küçük gösterge)
            ctx.font = '10px sans-serif'
            ctx.fillStyle = '#888'
            const fingers = gestureResult.fingerStates
            const fingerStatus = `${fingers.thumb ? '👍' : '·'}${fingers.index ? '👆' : '·'}${fingers.middle ? '|' : '·'}${fingers.ring ? '|' : '·'}${fingers.pinky ? '|' : '·'}`
            ctx.fillText(fingerStatus, handX * W + 60, handY * H + 35)
            
            // Köşe yakınlık göstergesi
            if (currentState === 'CORNER_HOVER') {
              ctx.font = 'bold 14px sans-serif'
              ctx.fillStyle = '#22c55e'
              ctx.fillText(`→ Tut!`, handX * W + 60, handY * H + 38)
            }
            
            // Shape3D için global state sync
            syncGlobalState()
            
          } else {
            setHandDetected(false)
            globalIsGrabbing = false
            globalIsPinching = false
            globalActiveCorner = null
            setGrabbing(false)
            setPinching(false)
            setActiveCorner(null)
            syncGlobalState()
          }
        } catch (err) {
          console.log('Frame error:', err)
        }
      })
      
      handsRef.current = hands
      
      const camera = new Camera(videoRef.current!, {
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
      
      setIsRunning(true)
      
      // Önceden kalibre edilmemişse kalibrasyon başlat
      if (!handCalibration.isCalibrated()) {
        startCalibration()
      }
      
    } catch (err) {
      console.error('Jarvis Error:', err)
      alert('Kamera erişimi gerekli!')
    }
  }
  
  // Kalibrasyon başlat
  const startCalibration = () => {
    setIsCalibrating(true)
    isCalibratingRef.current = true
    handCalibration.start(
      (state) => {
        setCalibrationState(state)
      },
      (data) => {
        // Kalibrasyon tamamlandı - threshold'ları uygula
        gestureStateMachine.setConfig({
          pinchThreshold: data.pinchThreshold,
          pinchReadyThreshold: data.pinchReadyThreshold
        })
        setIsCalibrating(false)
        isCalibratingRef.current = false
        setIsCalibrated(true)
        setFeedback('🎉 Kalibrasyon tamamlandı!')
      }
    )
  }
  
  // Kalibrasyon atla
  const skipCalibration = () => {
    handCalibration.skip()
    setIsCalibrating(false)
    isCalibratingRef.current = false
  }
  
  // Kalibrasyon sıfırla
  const resetCalibration = () => {
    handCalibration.reset()
    setIsCalibrated(false)
    startCalibration()
  }
  
  // Cleanup
  useEffect(() => {
    // Başlangıçta reset et
    handPositionFilter.reset()
    pinchFilter.reset()
    rotationFilter.reset()
    scaleFilter.reset()
    gestureStateMachine.reset()
    gestureClassifier.reset()
    
    return () => {
      cameraRef.current?.stop()
      if (videoRef.current?.srcObject) {
        (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop())
      }
      // Reset global state
      globalTriangleBase = 4
      globalTriangleHeight = 3
      globalActiveCorner = null
      globalPositionX = 0
      globalPositionY = 1.5
      globalDragMode = 'move'
      globalFilteredScale = 1
      // Reset filters & state machine & classifier
      handPositionFilter.reset()
      pinchFilter.reset()
      rotationFilter.reset()
      scaleFilter.reset()
      gestureStateMachine.reset()
      gestureClassifier.reset()
    }
  }, [])
  
  // Mod değiştir
  const toggleDragMode = () => {
    globalDragMode = globalDragMode === 'move' ? 'rotate' : 'move'
    setFeedback(globalDragMode === 'move' ? '✋ TAŞIMA MODU' : '🔄 DÖNDÜRME MODU')
  }
  
  // Pozisyonu sıfırla
  const resetPosition = () => {
    globalPositionX = 0
    globalPositionY = 1.5
    globalTriangleBase = 4
    globalTriangleHeight = 3
    globalRotationOffset = 0  // Rotasyonu da sıfırla
    setTriangleBase(4)
    setTriangleHeight(3)
    setFeedback('🔄 SIFIRLANDI!')
  }
  
  // Feedback temizle
  useEffect(() => {
    if (feedback) {
      const timer = setTimeout(() => setFeedback(null), 1500)
      return () => clearTimeout(timer)
    }
  }, [feedback])

  const area = (triangleBase * triangleHeight) / 2

  return (
    <div className="fixed inset-0 z-50 bg-slate-950">
      {/* Video */}
      <video 
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover transform scale-x-[-1]"
        playsInline
        autoPlay
        muted
      />
      
      {/* Hand Canvas */}
      <canvas 
        ref={canvasRef}
        className="absolute inset-0 w-full h-full object-cover pointer-events-none z-10"
      />
      
      {/* Overlay */}
      <div className="absolute inset-0 bg-slate-900/30 pointer-events-none" />
      
      {/* 3D Canvas - Kalibrasyon sırasında gizle */}
      {isRunning && !isCalibrating && (
        <div className="absolute inset-0 z-20 pointer-events-none">
          <Canvas
            style={{ background: 'transparent' }}
            gl={{ alpha: true }}
            camera={{ position: [0, 2, 10], fov: 45 }}
          >
            <ambientLight intensity={0.6} />
            <pointLight position={[10, 10, 10]} intensity={1} color="#06b6d4" />
            {selectedShape === 'triangle' && <Triangle3D />}
            {selectedShape !== 'triangle' && (
              <Shape3D 
                type={selectedShape}
                base={triangleBase}
                height={triangleHeight}
                side={shapeSide}
                width={shapeWidth}
                radius={shapeRadius}
              />
            )}
          </Canvas>
        </div>
      )}
      
      {/* Kalibrasyon UI */}
      {isCalibrating && calibrationState && (
        <div className="absolute inset-0 z-40 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-slate-900/95 backdrop-blur-xl rounded-3xl p-8 max-w-md mx-4 border border-cyan-500/30 shadow-2xl"
          >
            {/* Progress bar */}
            <div className="mb-6">
              <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-cyan-500 to-green-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${calibrationState.progress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
              <p className="text-slate-400 text-xs mt-1 text-right">{calibrationState.progress.toFixed(0)}%</p>
            </div>
            
            {/* İkon */}
            <div className="text-center mb-6">
              <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border-2 border-cyan-500/50 flex items-center justify-center">
                <span className="text-5xl">
                  {calibrationState.step === 'WAITING_OPEN_HAND' || calibrationState.step === 'RECORDING_OPEN' ? '🖐️' : 
                   calibrationState.step === 'WAITING_CLOSED_HAND' || calibrationState.step === 'RECORDING_CLOSED' ? '✊' :
                   calibrationState.step === 'COMPLETED' ? '🎉' : '🎯'}
                </span>
              </div>
            </div>
            
            {/* Mesaj */}
            <h2 className="text-2xl font-bold text-white text-center mb-2">
              {calibrationState.message}
            </h2>
            <p className="text-cyan-400 text-center mb-6">
              {calibrationState.instruction}
            </p>
            
            {/* Butonlar */}
            <div className="flex gap-3">
              <button
                onClick={skipCalibration}
                className="flex-1 px-4 py-3 rounded-xl bg-slate-700/50 text-slate-300 font-medium hover:bg-slate-700"
              >
                Atla
              </button>
              {calibrationState.step === 'COMPLETED' && (
                <button
                  onClick={() => setIsCalibrating(false)}
                  className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-green-500 text-white font-bold"
                >
                  Devam Et
                </button>
              )}
            </div>
          </motion.div>
        </div>
      )}
      
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-cyan-500/20 border border-cyan-500/50 flex items-center justify-center">
            <span className="text-xl">🤖</span>
          </div>
          <div>
            <h1 className="text-white font-bold text-lg">JARVIS v9</h1>
            <p className="text-cyan-400/70 text-xs">
              {isCalibrated ? '✅ Kalibre' : '⚙️ Varsayılan'} • {ShapeInfo[selectedShape].name}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {isRunning && !isCalibrating && (
            <>
              <button
                onClick={toggleDragMode}
                className={`px-3 py-2 rounded-lg font-bold text-sm transition-all ${
                  globalDragMode === 'move' 
                    ? 'bg-green-500/90 text-white' 
                    : 'bg-purple-500/90 text-white'
                }`}
              >
                {globalDragMode === 'move' ? '✋ Taşı' : '🔄 Döndür'}
              </button>
              <button
                onClick={resetPosition}
                className="px-3 py-2 rounded-lg bg-amber-500/90 text-white font-bold text-sm"
              >
                🔄 Sıfırla
              </button>
              <button
                onClick={resetCalibration}
                className="px-3 py-2 rounded-lg bg-cyan-500/90 text-white font-bold text-sm"
              >
                🎯 Kalibre
              </button>
            </>
          )}
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="p-2 rounded-lg bg-slate-800/50 text-white/70 hover:text-white"
          >
            {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </button>
          {onClose && (
            <button onClick={onClose} className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
      
      {/* Başlangıç */}
      {!isRunning && (
        <div className="absolute inset-0 flex items-center justify-center z-40">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="w-28 h-28 mx-auto mb-6 rounded-full bg-slate-900 border-2 border-cyan-500/50 flex items-center justify-center">
              <span className="text-5xl">🤖</span>
            </div>
            
            <h1 className="text-4xl font-black text-white mb-2">JARVIS v9</h1>
            <p className="text-cyan-400 mb-2">Multi-Shape Geometry Lab</p>
            <p className="text-slate-500 text-xs mb-6">🔺 Üçgen • 🟩 Kare • 🟧 Dikdörtgen • 🔵 Daire</p>
            
            <div className="bg-slate-800/50 rounded-xl p-4 mb-8 max-w-md mx-auto text-left">
              <p className="text-white font-bold mb-3">📋 Kontroller:</p>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-green-700/50 rounded-lg p-2 border border-green-500/30">
                  <span className="text-2xl">✋</span>
                  <div className="text-white font-medium">Yumruk + Sürükle</div>
                  <div className="text-green-300 text-xs">Ekranda TAŞI</div>
                </div>
                <div className="bg-slate-700/50 rounded-lg p-2">
                  <span className="text-2xl">🤏</span>
                  <div className="text-white font-medium">Pinch</div>
                  <div className="text-slate-400 text-xs">Büyüt / Küçült</div>
                </div>
                <div className="bg-slate-700/50 rounded-lg p-2">
                  <span className="text-2xl">📐</span>
                  <div className="text-white font-medium">Köşe A/B</div>
                  <div className="text-slate-400 text-xs">Tabanı değiştir</div>
                </div>
                <div className="bg-slate-700/50 rounded-lg p-2">
                  <span className="text-2xl">📏</span>
                  <div className="text-white font-medium">Köşe C</div>
                  <div className="text-slate-400 text-xs">Yüksekliği değiştir</div>
                </div>
              </div>
              <p className="text-slate-400 text-xs mt-3 text-center">
                💡 Sağ üstteki butonlarla Taşı/Döndür modunu değiştirebilirsin
              </p>
            </div>
            
            <button
              onClick={startJarvis}
              className="px-8 py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-500 text-white font-bold text-lg shadow-2xl shadow-cyan-500/30 hover:scale-105 transition-transform"
            >
              🚀 Başlat
            </button>
          </motion.div>
        </div>
      )}
      
      {/* Şekil Seçici + Boyut Bilgisi - Sağ üst */}
      {isRunning && !isCalibrating && (
        <div className="absolute top-20 right-6 z-30 space-y-3">
          {/* Şekil Seçici */}
          <div className="bg-slate-900/90 backdrop-blur-sm rounded-xl p-3 border border-cyan-500/30">
            <h4 className="text-cyan-400 text-xs font-bold mb-2">🎨 ŞEKİL SEÇ</h4>
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(ShapeInfo) as ShapeType[]).map((shape) => (
                <button
                  key={shape}
                  onClick={() => setSelectedShape(shape)}
                  className={`px-3 py-2 rounded-lg text-sm font-bold transition-all ${
                    selectedShape === shape
                      ? `bg-${ShapeInfo[shape].color}-500 text-white shadow-lg`
                      : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {ShapeInfo[shape].icon} {ShapeInfo[shape].name}
                </button>
              ))}
            </div>
          </div>
          
          {/* Boyut Bilgisi - Şekle göre dinamik */}
          <div className="bg-slate-900/90 backdrop-blur-sm rounded-xl p-4 border border-cyan-500/30 min-w-[180px]">
            <h4 className="text-cyan-400 text-xs font-bold mb-2">📐 {ShapeInfo[selectedShape].name.toUpperCase()}</h4>
            <div className="space-y-2 text-sm">
              {selectedShape === 'triangle' && (
                <>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Taban:</span>
                    <span className="text-white font-bold">{triangleBase.toFixed(1)} cm</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Yükseklik:</span>
                    <span className="text-white font-bold">{triangleHeight.toFixed(1)} cm</span>
                  </div>
                  <div className="border-t border-slate-700 pt-2 flex justify-between">
                    <span className="text-purple-400 font-medium">Alan:</span>
                    <span className="text-purple-400 font-bold">{((triangleBase * triangleHeight) / 2).toFixed(1)} cm²</span>
                  </div>
                </>
              )}
              {selectedShape === 'square' && (
                <>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Kenar:</span>
                    <span className="text-white font-bold">{shapeSide.toFixed(1)} cm</span>
                  </div>
                  <div className="border-t border-slate-700 pt-2">
                    <div className="flex justify-between">
                      <span className="text-green-400 font-medium">Alan:</span>
                      <span className="text-green-400 font-bold">{(shapeSide * shapeSide).toFixed(1)} cm²</span>
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className="text-slate-400">Çevre:</span>
                      <span className="text-white font-bold">{(shapeSide * 4).toFixed(1)} cm</span>
                    </div>
                  </div>
                </>
              )}
              {selectedShape === 'rectangle' && (
                <>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Uzun:</span>
                    <span className="text-white font-bold">{shapeWidth.toFixed(1)} cm</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Kısa:</span>
                    <span className="text-white font-bold">{triangleHeight.toFixed(1)} cm</span>
                  </div>
                  <div className="border-t border-slate-700 pt-2">
                    <div className="flex justify-between">
                      <span className="text-amber-400 font-medium">Alan:</span>
                      <span className="text-amber-400 font-bold">{(shapeWidth * triangleHeight).toFixed(1)} cm²</span>
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className="text-slate-400">Çevre:</span>
                      <span className="text-white font-bold">{(2 * (shapeWidth + triangleHeight)).toFixed(1)} cm</span>
                    </div>
                  </div>
                </>
              )}
              {selectedShape === 'circle' && (
                <>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Yarıçap:</span>
                    <span className="text-white font-bold">{shapeRadius.toFixed(1)} cm</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Çap:</span>
                    <span className="text-white font-bold">{(shapeRadius * 2).toFixed(1)} cm</span>
                  </div>
                  <div className="border-t border-slate-700 pt-2">
                    <div className="flex justify-between">
                      <span className="text-violet-400 font-medium">Alan:</span>
                      <span className="text-violet-400 font-bold">{(Math.PI * shapeRadius * shapeRadius).toFixed(1)} cm²</span>
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className="text-slate-400">Çevre:</span>
                      <span className="text-white font-bold">{(2 * Math.PI * shapeRadius).toFixed(1)} cm</span>
                    </div>
                  </div>
                </>
              )}
              <div className="text-xs text-slate-500 mt-2 pt-2 border-t border-slate-700">
                {ShapeInfo[selectedShape].formula}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Adım bilgisi */}
      {isRunning && (
        <div className="absolute bottom-6 left-6 z-30">
          <div className="bg-slate-900/90 backdrop-blur-sm rounded-xl p-4 border border-cyan-500/30">
            <div className="flex gap-1 mb-2">
              {steps.map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 w-8 rounded-full ${
                    i <= currentStep ? 'bg-cyan-500' : 'bg-slate-700'
                  }`}
                />
              ))}
            </div>
            <h3 className="text-white font-bold">{step.title}</h3>
            <p className="text-slate-400 text-sm">{step.hint}</p>
          </div>
        </div>
      )}
      
      {/* Durum göstergesi */}
      {isRunning && (
        <div className="absolute bottom-6 right-6 z-30 flex items-center gap-2">
          {activeCorner !== null && (
            <div className="px-3 py-2 rounded-lg bg-green-500/90 text-white font-bold text-sm">
              📐 Köşe {['A','B','C'][activeCorner]}
            </div>
          )}
          {pinching && (
            <div className="px-3 py-2 rounded-lg bg-amber-500/90 text-white font-bold text-sm">
              🤏 ZOOM
            </div>
          )}
          <div className={`px-4 py-2 rounded-lg font-bold ${
            grabbing 
              ? 'bg-green-500/90 text-white' 
              : handDetected 
                ? 'bg-cyan-500/20 text-cyan-400' 
                : 'bg-slate-800/50 text-slate-500'
          }`}>
            {grabbing ? '✊ TUTMA' : handDetected ? '🖐️ HAZIR' : '❌ EL YOK'}
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
            className="absolute top-1/3 left-1/2 transform -translate-x-1/2 z-50 px-8 py-4 rounded-2xl bg-gradient-to-r from-cyan-500 to-purple-500 text-white text-2xl font-bold shadow-2xl"
          >
            {feedback}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
