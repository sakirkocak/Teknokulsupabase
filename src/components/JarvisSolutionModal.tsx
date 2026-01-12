'use client'

import { useState, useEffect, useRef, Suspense, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Volume2, VolumeX, SkipForward, RotateCcw, Hand, Sparkles, Box, Loader, Camera, Video } from 'lucide-react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Environment, Html, Line, useGLTF, Center } from '@react-three/drei'
import * as THREE from 'three'
import { getModelById, getModelsForSubject, selectModelForQuestion, Model3D, getModelUrl } from '@/lib/jarvis/model-registry'

// 🖐️ El takibi için global değişkenler
declare global {
  var globalHandX: number
  var globalHandY: number
  var globalIsGrabbing: boolean
  var globalIsPinching: boolean
  var globalPinchStrength: number
}

interface JarvisStep {
  order: number
  text: string
  voiceScript: string
  action?: string
  params?: Record<string, any>
}

interface Props {
  isOpen: boolean
  onClose: () => void
  jarvisData: {
    sceneType: string
    sceneParams: Record<string, any>
    steps: JarvisStep[]
    voiceIntro: string
    gestureHints: string[]
    metadata: {
      sceneName: string
      sceneIcon: string
      sceneColor: string
      estimatedDuration: number
    }
    // 🤖 AI Model Seçimi
    recommendedModelId?: string | null
    modelReason?: string
  }
  questionText: string
  subject: string
  options?: Record<string, string>
  correctAnswer?: string
  questionImageUrl?: string | null
}

// 🎨 Basit 3D Shape (globalThis'e bağımlı değil - Modal için)
function SimpleShape3D({ type, base, height, side, width, radius }: {
  type: string
  base?: number
  height?: number
  side?: number
  width?: number
  radius?: number
}) {
  const meshRef = useRef<THREE.Group>(null)

  useFrame((state) => {
    if (meshRef.current) {
      // Yavaş döndür
      meshRef.current.rotation.y += 0.005
    }
  })

  // Üçgen
  if (type === 'triangle') {
    const b = base || 4
    const h = height || 3
    const points: [number, number, number][] = [
      [-b/2, 0, 0],
      [b/2, 0, 0],
      [0, h, 0],
      [-b/2, 0, 0]
    ]
    return (
      <group ref={meshRef} position={[0, 0, 0]}>
        <Line points={points} color="#06b6d4" lineWidth={4} />
        <mesh position={[0, h/3, -0.1]}>
          <planeGeometry args={[b * 0.9, h * 0.9]} />
          <meshStandardMaterial color="#06b6d4" transparent opacity={0.2} side={THREE.DoubleSide} />
        </mesh>
        <Html position={[0, -0.5, 0]} center>
          <div className="text-cyan-400 text-sm font-bold bg-slate-900/80 px-2 py-1 rounded">Taban: {b} cm</div>
        </Html>
        <Html position={[b/2 + 0.5, h/2, 0]} center>
          <div className="text-cyan-400 text-sm font-bold bg-slate-900/80 px-2 py-1 rounded">Yükseklik: {h} cm</div>
        </Html>
      </group>
    )
  }

  // Kare
  if (type === 'square') {
    const s = side || 4
    const points: [number, number, number][] = [
      [-s/2, 0, 0],
      [s/2, 0, 0],
      [s/2, s, 0],
      [-s/2, s, 0],
      [-s/2, 0, 0]
    ]
    return (
      <group ref={meshRef} position={[0, -s/2, 0]}>
        <Line points={points} color="#10b981" lineWidth={4} />
        <mesh position={[0, s/2, -0.1]}>
          <planeGeometry args={[s * 0.9, s * 0.9]} />
          <meshStandardMaterial color="#10b981" transparent opacity={0.2} side={THREE.DoubleSide} />
        </mesh>
        <Html position={[0, -0.5, 0]} center>
          <div className="text-green-400 text-sm font-bold bg-slate-900/80 px-2 py-1 rounded">Kenar: {s} cm</div>
        </Html>
      </group>
    )
  }

  // Dikdörtgen
  if (type === 'rectangle') {
    const w = width || 5
    const h = height || 3
    const points: [number, number, number][] = [
      [-w/2, 0, 0],
      [w/2, 0, 0],
      [w/2, h, 0],
      [-w/2, h, 0],
      [-w/2, 0, 0]
    ]
    return (
      <group ref={meshRef} position={[0, -h/2, 0]}>
        <Line points={points} color="#f59e0b" lineWidth={4} />
        <mesh position={[0, h/2, -0.1]}>
          <planeGeometry args={[w * 0.9, h * 0.9]} />
          <meshStandardMaterial color="#f59e0b" transparent opacity={0.2} side={THREE.DoubleSide} />
        </mesh>
        <Html position={[0, -0.5, 0]} center>
          <div className="text-amber-400 text-sm font-bold bg-slate-900/80 px-2 py-1 rounded">Genişlik: {w} cm</div>
        </Html>
        <Html position={[w/2 + 0.7, h/2, 0]} center>
          <div className="text-amber-400 text-sm font-bold bg-slate-900/80 px-2 py-1 rounded">Yükseklik: {h} cm</div>
        </Html>
      </group>
    )
  }

  // Daire
  if (type === 'circle') {
    const r = radius || 2
    return (
      <group ref={meshRef} position={[0, 0, 0]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[r - 0.1, r, 64]} />
          <meshStandardMaterial color="#8b5cf6" side={THREE.DoubleSide} />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[r, 64]} />
          <meshStandardMaterial color="#8b5cf6" transparent opacity={0.2} side={THREE.DoubleSide} />
        </mesh>
        <Html position={[0, 0.5, r + 0.5]} center>
          <div className="text-purple-400 text-sm font-bold bg-slate-900/80 px-2 py-1 rounded">Yarıçap: {r} cm</div>
        </Html>
      </group>
    )
  }

  // Pasta Grafiği (Pie Chart)
  if (type === 'pieChart' || type === 'pie') {
    const colors = ['#06b6d4', '#8b5cf6', '#f59e0b', '#10b981', '#ef4444']
    const slices = [0.3, 0.25, 0.2, 0.15, 0.1] // Örnek dilimler
    let startAngle = 0
    
    return (
      <group ref={meshRef} position={[0, 0, 0]} rotation={[-Math.PI / 4, 0, 0]}>
        {slices.map((slice, i) => {
          const angle = slice * Math.PI * 2
          const midAngle = startAngle + angle / 2
          const result = (
            <group key={i}>
              <mesh rotation={[0, startAngle, 0]}>
                <cylinderGeometry args={[2, 2, 0.5, 32, 1, false, 0, angle]} />
                <meshStandardMaterial color={colors[i % colors.length]} />
              </mesh>
              <Html position={[Math.sin(midAngle) * 1.2, 0.5, Math.cos(midAngle) * 1.2]} center>
                <div className="text-white text-xs font-bold bg-slate-900/80 px-1.5 py-0.5 rounded">
                  %{Math.round(slice * 100)}
                </div>
              </Html>
            </group>
          )
          startAngle += angle
          return result
        })}
        <Html position={[0, 2, 0]} center>
          <div className="text-cyan-400 text-sm font-bold bg-slate-900/80 px-2 py-1 rounded">
            📊 Pasta Grafiği
          </div>
        </Html>
      </group>
    )
  }

  // Bar Grafiği (Histogram)
  if (type === 'histogram' || type === 'barChart' || type === 'bar') {
    const bars = [3, 5, 2, 4, 6, 3.5]
    const colors = ['#06b6d4', '#8b5cf6', '#f59e0b', '#10b981', '#ef4444', '#ec4899']
    
    return (
      <group ref={meshRef} position={[-2.5, -2, 0]}>
        {bars.map((h, i) => (
          <group key={i} position={[i * 1, 0, 0]}>
            <mesh position={[0, h / 2, 0]}>
              <boxGeometry args={[0.7, h, 0.7]} />
              <meshStandardMaterial color={colors[i % colors.length]} />
            </mesh>
            <Html position={[0, h + 0.3, 0]} center>
              <div className="text-white text-xs font-bold">{h}</div>
            </Html>
          </group>
        ))}
        <Html position={[2.5, 4, 0]} center>
          <div className="text-cyan-400 text-sm font-bold bg-slate-900/80 px-2 py-1 rounded">
            📈 Çubuk Grafik
          </div>
        </Html>
      </group>
    )
  }

  // Çark (Wheel/Spinner)
  if (type === 'wheel' || type === 'spinner' || type.includes('çark')) {
    const segments = 6
    const colors = ['#ef4444', '#f59e0b', '#10b981', '#06b6d4', '#8b5cf6', '#ec4899']
    
    return (
      <group ref={meshRef} position={[0, 0, 0]}>
        {[...Array(segments)].map((_, i) => {
          const angle = (i / segments) * Math.PI * 2
          return (
            <mesh key={i} rotation={[0, 0, angle]}>
              <cylinderGeometry args={[2.5, 2.5, 0.3, 32, 1, false, 0, Math.PI * 2 / segments]} />
              <meshStandardMaterial color={colors[i % colors.length]} />
            </mesh>
          )
        })}
        {/* Ok işareti */}
        <mesh position={[0, 3, 0.5]} rotation={[0, 0, Math.PI]}>
          <coneGeometry args={[0.3, 0.6, 3]} />
          <meshStandardMaterial color="#ffffff" />
        </mesh>
        <Html position={[0, -3.5, 0]} center>
          <div className="text-cyan-400 text-sm font-bold bg-slate-900/80 px-2 py-1 rounded">
            🎡 Şans Çarkı
          </div>
        </Html>
      </group>
    )
  }

  // Koordinat sistemi
  if (type === 'coordinate' || type === 'graph' || type === 'koordinat') {
    return (
      <group ref={meshRef} position={[0, 0, 0]}>
        {/* X ekseni */}
        <Line points={[[-4, 0, 0], [4, 0, 0]]} color="#ef4444" lineWidth={3} />
        {/* Y ekseni */}
        <Line points={[[0, -3, 0], [0, 4, 0]]} color="#10b981" lineWidth={3} />
        {/* Izgara */}
        {[-3, -2, -1, 1, 2, 3].map(i => (
          <group key={i}>
            <Line points={[[i, -0.1, 0], [i, 0.1, 0]]} color="#666" lineWidth={1} />
            <Line points={[[-0.1, i, 0], [0.1, i, 0]]} color="#666" lineWidth={1} />
          </group>
        ))}
        {/* Örnek nokta */}
        <mesh position={[2, 3, 0]}>
          <sphereGeometry args={[0.2, 16, 16]} />
          <meshStandardMaterial color="#06b6d4" />
        </mesh>
        <Html position={[2.5, 3.3, 0]} center>
          <div className="text-cyan-400 text-xs font-bold bg-slate-900/80 px-1 py-0.5 rounded">(2, 3)</div>
        </Html>
        <Html position={[4.5, 0, 0]} center>
          <div className="text-red-400 text-xs font-bold">X</div>
        </Html>
        <Html position={[0, 4.5, 0]} center>
          <div className="text-green-400 text-xs font-bold">Y</div>
        </Html>
      </group>
    )
  }

  // Fallback: Adım gösterimi (Step by Step için)
  return (
    <group ref={meshRef}>
      {/* Merkez küre */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[1.5, 32, 32]} />
        <meshStandardMaterial color="#06b6d4" transparent opacity={0.3} />
      </mesh>
      {/* Yörüngedeki küçük küreler */}
      {[...Array(6)].map((_, i) => {
        const angle = (i / 6) * Math.PI * 2
        return (
          <mesh key={i} position={[Math.cos(angle) * 3, Math.sin(angle) * 0.5, Math.sin(angle) * 3]}>
            <sphereGeometry args={[0.4, 16, 16]} />
            <meshStandardMaterial color={['#8b5cf6', '#f59e0b', '#10b981', '#ef4444', '#ec4899', '#06b6d4'][i]} />
          </mesh>
        )
      })}
      <Html position={[0, 2.5, 0]} center>
        <div className="text-cyan-400 text-lg font-bold bg-slate-900/80 px-3 py-2 rounded-lg">
          🎯 Çözüm Adımları
        </div>
      </Html>
    </group>
  )
}

// 🎨 Professional 3D Model Viewer (GLB/GLTF) - El Takibi Destekli
function Pro3DModel({ 
  modelData, 
  autoRotate = true,
  handControlEnabled = false 
}: { 
  modelData: Model3D
  autoRotate?: boolean
  handControlEnabled?: boolean 
}) {
  const groupRef = useRef<THREE.Group>(null)
  const modelPath = getModelUrl(modelData.path)
  const { scene, animations } = useGLTF(modelPath)
  const [mixer, setMixer] = useState<THREE.AnimationMixer | null>(null)
  
  // El takibi state
  const lastHandX = useRef(0)
  const lastHandY = useRef(0)
  const targetRotationY = useRef(0)
  const targetRotationX = useRef(0)
  const targetScale = useRef(modelData.defaultScale || 1)
  
  // Animasyon mixer'ı kur
  useEffect(() => {
    if (animations.length > 0) {
      const newMixer = new THREE.AnimationMixer(scene)
      animations.forEach((clip) => {
        newMixer.clipAction(clip).play()
      })
      setMixer(newMixer)
    }
  }, [scene, animations])
  
  // Her frame'de güncelle
  useFrame((state, delta) => {
    if (mixer) {
      mixer.update(delta)
    }
    
    if (!groupRef.current) return
    
    // 🖐️ El takibi aktifse
    if (handControlEnabled) {
      const g = globalThis as any
      const handX = g.globalHandX ?? 0.5
      const handY = g.globalHandY ?? 0.5
      const isGrabbing = g.globalIsGrabbing ?? false
      const isPinching = g.globalIsPinching ?? false
      
      // Grab = Döndür
      if (isGrabbing) {
        const deltaX = (handX - lastHandX.current) * 5
        const deltaY = (handY - lastHandY.current) * 3
        targetRotationY.current += deltaX
        targetRotationX.current += deltaY
      }
      
      // Pinch = Zoom
      if (isPinching) {
        const pinchStrength = g.globalPinchStrength ?? 0
        const baseScale = modelData.defaultScale || 1
        targetScale.current = baseScale * (1 + pinchStrength * 2)
      }
      
      lastHandX.current = handX
      lastHandY.current = handY
      
      // Smooth transition
      groupRef.current.rotation.y += (targetRotationY.current - groupRef.current.rotation.y) * 0.1
      groupRef.current.rotation.x += (targetRotationX.current - groupRef.current.rotation.x) * 0.1
      
      const currentScale = groupRef.current.scale.x
      const newScale = currentScale + (targetScale.current - currentScale) * 0.1
      groupRef.current.scale.set(newScale, newScale, newScale)
    } else {
      // Auto rotate (el takibi kapalıyken)
      if (autoRotate) {
        groupRef.current.rotation.y += 0.005
      }
    }
  })
  
  const scale = modelData.defaultScale || 1
  const position = modelData.defaultPosition || [0, 0, 0]
  
  return (
    <group ref={groupRef} position={position as [number, number, number]} scale={[scale, scale, scale]}>
      <primitive object={scene.clone()} />
    </group>
  )
}

// 🔄 Model Loading Placeholder
function ModelLoadingPlaceholder() {
  const meshRef = useRef<THREE.Mesh>(null)
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.02
      meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime) * 0.2
    }
  })
  
  return (
    <group>
      <mesh ref={meshRef}>
        <icosahedronGeometry args={[1.5, 1]} />
        <meshStandardMaterial 
          color="#06b6d4" 
          wireframe 
          transparent 
          opacity={0.6}
        />
      </mesh>
      <Html position={[0, 2.5, 0]} center>
        <div className="flex items-center gap-2 text-cyan-400 text-sm font-bold bg-slate-900/80 px-3 py-2 rounded-lg animate-pulse">
          <Loader className="w-4 h-4 animate-spin" />
          Model Yükleniyor...
        </div>
      </Html>
    </group>
  )
}


export default function JarvisSolutionModal({
  isOpen,
  onClose,
  jarvisData,
  questionText,
  subject,
  options,
  correctAnswer,
  questionImageUrl
}: Props) {
  const [currentStep, setCurrentStep] = useState(0)
  const [isMuted, setIsMuted] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [showHandTracking, setShowHandTracking] = useState(false)
  const [handTrackingReady, setHandTrackingReady] = useState(false)
  const [use3DModel, setUse3DModel] = useState(true)
  const [modelExists, setModelExists] = useState<boolean | null>(null)
  const [selectedModel, setSelectedModel] = useState<Model3D | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  
  // 🖐️ El takibi ref'leri
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const handsRef = useRef<any>(null)
  const cameraRef = useRef<any>(null)

  const { sceneType, sceneParams, steps, voiceIntro, gestureHints, metadata, recommendedModelId, modelReason } = jarvisData
  
  // 🤖 AI Model Seçimi (33 model havuzundan)
  useEffect(() => {
    let model: Model3D | null = null
    
    // 1️⃣ Öncelik: AI'ın önerdiği model
    if (recommendedModelId) {
      model = getModelById(recommendedModelId) || null
      if (model) {
        console.log(`🤖 AI model seçti: ${model.name} - ${modelReason || ''}`)
      }
    }
    
    // 2️⃣ Fallback: Keyword matching
    if (!model) {
      model = selectModelForQuestion(subject, questionText)
      console.log(`🎯 Fallback model: ${model?.name || 'yok'}`)
    }
    
    if (model) {
      setSelectedModel(model)
      
      // Model dosyasının varlığını kontrol et (Supabase Storage)
      fetch(getModelUrl(model.path), { method: 'HEAD' })
        .then(res => setModelExists(res.ok))
        .catch(() => setModelExists(false))
    } else {
      setModelExists(false)
    }
  }, [subject, questionText, recommendedModelId, modelReason])

  // 🖐️ El takibi başlat/durdur
  const startHandTracking = useCallback(async () => {
    if (typeof window === 'undefined') return
    
    try {
      // MediaPipe yükle
      const { Hands } = await import('@mediapipe/hands')
      const { Camera } = await import('@mediapipe/camera_utils')
      
      // Global değişkenleri başlat
      globalThis.globalHandX = 0.5
      globalThis.globalHandY = 0.5
      globalThis.globalIsGrabbing = false
      globalThis.globalIsPinching = false
      globalThis.globalPinchStrength = 0
      
      const hands = new Hands({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
      })
      
      hands.setOptions({
        maxNumHands: 1,
        modelComplexity: 1,
        minDetectionConfidence: 0.7,
        minTrackingConfidence: 0.5
      })
      
      hands.onResults((results: any) => {
        if (!canvasRef.current) return
        
        const ctx = canvasRef.current.getContext('2d')
        if (!ctx) return
        
        // Canvas temizle ve video çiz
        ctx.save()
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
        ctx.drawImage(results.image, 0, 0, canvasRef.current.width, canvasRef.current.height)
        
        if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
          const landmarks = results.multiHandLandmarks[0]
          
          // El merkezi (bilek)
          const wrist = landmarks[0]
          globalThis.globalHandX = 1 - wrist.x // Ayna efekti
          globalThis.globalHandY = wrist.y
          
          // İşaret ve başparmak uçları
          const indexTip = landmarks[8]
          const thumbTip = landmarks[4]
          const middleTip = landmarks[12]
          
          // Pinch mesafesi
          const pinchDist = Math.sqrt(
            Math.pow(indexTip.x - thumbTip.x, 2) + 
            Math.pow(indexTip.y - thumbTip.y, 2)
          )
          globalThis.globalIsPinching = pinchDist < 0.08
          globalThis.globalPinchStrength = Math.max(0, 1 - pinchDist * 10)
          
          // Grab (yumruk)
          const fingersClosed = [8, 12, 16, 20].every(i => {
            const tip = landmarks[i]
            const mcp = landmarks[i - 3]
            return tip.y > mcp.y
          })
          globalThis.globalIsGrabbing = fingersClosed
          
          // El noktalarını çiz
          ctx.fillStyle = globalThis.globalIsGrabbing ? '#ef4444' : 
                          globalThis.globalIsPinching ? '#f59e0b' : '#06b6d4'
          landmarks.forEach((lm: any) => {
            ctx.beginPath()
            ctx.arc(lm.x * canvasRef.current!.width, lm.y * canvasRef.current!.height, 5, 0, 2 * Math.PI)
            ctx.fill()
          })
          
          // Bağlantıları çiz
          ctx.strokeStyle = '#06b6d4'
          ctx.lineWidth = 2
          const connections = [[0,1],[1,2],[2,3],[3,4],[0,5],[5,6],[6,7],[7,8],[5,9],[9,10],[10,11],[11,12],[9,13],[13,14],[14,15],[15,16],[13,17],[17,18],[18,19],[19,20],[0,17]]
          connections.forEach(([i, j]) => {
            ctx.beginPath()
            ctx.moveTo(landmarks[i].x * canvasRef.current!.width, landmarks[i].y * canvasRef.current!.height)
            ctx.lineTo(landmarks[j].x * canvasRef.current!.width, landmarks[j].y * canvasRef.current!.height)
            ctx.stroke()
          })
        }
        
        ctx.restore()
      })
      
      handsRef.current = hands
      
      // Kamerayı başlat
      if (videoRef.current) {
        const camera = new Camera(videoRef.current, {
          onFrame: async () => {
            if (handsRef.current && videoRef.current) {
              await handsRef.current.send({ image: videoRef.current })
            }
          },
          width: 640,
          height: 480
        })
        cameraRef.current = camera
        await camera.start()
        setHandTrackingReady(true)
      }
    } catch (error) {
      console.error('El takibi başlatılamadı:', error)
    }
  }, [])
  
  const stopHandTracking = useCallback(() => {
    if (cameraRef.current) {
      cameraRef.current.stop()
      cameraRef.current = null
    }
    handsRef.current = null
    setHandTrackingReady(false)
    
    // Global değişkenleri sıfırla
    globalThis.globalIsGrabbing = false
    globalThis.globalIsPinching = false
  }, [])
  
  // El takibi toggle
  useEffect(() => {
    if (showHandTracking) {
      startHandTracking()
    } else {
      stopHandTracking()
    }
    
    return () => stopHandTracking()
  }, [showHandTracking, startHandTracking, stopHandTracking])

  // Ses çal - ElevenLabs base64 response
  const playVoice = async (text: string) => {
    if (isMuted || !text) return

    try {
      const response = await fetch('/api/tekno-teacher/elevenlabs-tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, voice: 'turkish' })
      })

      const data = await response.json()
      
      if (data.success && data.audio) {
        // Base64'ü audio'ya çevir
        const audioBlob = new Blob(
          [Uint8Array.from(atob(data.audio), c => c.charCodeAt(0))],
          { type: 'audio/mpeg' }
        )
        const url = URL.createObjectURL(audioBlob)
        
        if (audioRef.current) {
          audioRef.current.pause()
        }
        
        audioRef.current = new Audio(url)
        audioRef.current.play().catch(e => console.log('Auto-play engellendi:', e))
      } else {
        console.warn('TTS response:', data)
      }
    } catch (err) {
      console.error('TTS hatası:', err)
    }
  }

  // Başlangıçta intro çal
  useEffect(() => {
    if (isOpen && voiceIntro && !isMuted) {
      playVoice(voiceIntro)
      setIsPlaying(true)
    }
    
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
      }
    }
  }, [isOpen])

  // Sonraki adım
  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1)
      const step = steps[currentStep + 1]
      if (step?.voiceScript) {
        playVoice(step.voiceScript)
      }
    }
  }

  // Önceki adım
  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1)
    }
  }

  // Sıfırla
  const reset = () => {
    setCurrentStep(0)
    if (voiceIntro) {
      playVoice(voiceIntro)
    }
  }

  if (!isOpen) return null

  const currentStepData = steps[currentStep]

  return (
    <div className="fixed inset-0 z-[9999] bg-black/95">
      {/* Video arka plan efekti */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" />
      
      {/* Grid pattern */}
      <div 
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `
            linear-gradient(rgba(6, 182, 212, 0.3) 1px, transparent 1px),
            linear-gradient(90deg, rgba(6, 182, 212, 0.3) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px'
        }}
      />

      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-cyan-500/20 border border-cyan-500/50 flex items-center justify-center">
            <span className="text-xl">{metadata.sceneIcon}</span>
          </div>
          <div>
            <h1 className="text-white font-bold text-lg">JARVIS</h1>
            <p className="text-cyan-400/70 text-xs">{metadata.sceneName} • {subject}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* El takibi toggle */}
          <button
            onClick={() => setShowHandTracking(!showHandTracking)}
            className={`p-2 rounded-lg transition-all flex items-center gap-1 ${
              showHandTracking 
                ? 'bg-cyan-500 text-white' 
                : 'bg-slate-800/50 text-white/70 hover:text-white hover:bg-cyan-500/20'
            }`}
            title={showHandTracking ? "El takibini kapat" : "El takibi ile kontrol"}
          >
            <Hand className="w-5 h-5" />
            <span className="text-xs hidden sm:inline">{showHandTracking ? 'Kapat' : 'El Takibi'}</span>
          </button>
          
          {/* Ses toggle */}
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="p-2 rounded-lg bg-slate-800/50 text-white/70 hover:text-white"
          >
            {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </button>
          
          {/* Kapat */}
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Gizli video elementi - el takibi için */}
      <video 
        ref={videoRef} 
        className="hidden" 
        playsInline 
        muted
      />
      
      {/* Ana içerik */}
      <div className="absolute inset-0 pt-20 pb-40">
        {/* Her zaman aynı layout - Sol: Soru, Sağ: 3D sahne */}
        <div className="h-full flex">
            {/* Sol panel - Soru metni ve şıklar */}
            <div className="w-2/5 h-full p-4 flex flex-col">
              {/* 🖐️ El Takibi Kamera Görüntüsü */}
              {showHandTracking && (
                <div className="mb-3 relative">
                  <canvas 
                    ref={canvasRef}
                    width={320}
                    height={240}
                    className="w-full rounded-xl border-2 border-cyan-500 shadow-lg shadow-cyan-500/30"
                  />
                  <div className="absolute top-2 left-2 bg-red-500 px-2 py-0.5 rounded text-xs text-white font-bold animate-pulse flex items-center gap-1">
                    <Video className="w-3 h-3" />
                    CANLI
                  </div>
                  {/* Gesture durumu */}
                  <div className="absolute bottom-2 left-2 right-2 flex gap-2">
                    <div className={`px-2 py-1 rounded text-xs font-medium ${
                      handTrackingReady ? 'bg-green-500/80 text-white' : 'bg-yellow-500/80 text-black'
                    }`}>
                      {handTrackingReady ? '✓ El Algılandı' : '⏳ Kamera Açılıyor...'}
                    </div>
                  </div>
                  {/* Kontrol ipuçları */}
                  <div className="absolute top-2 right-2 bg-slate-900/90 rounded-lg p-2 text-[10px] text-white/80 space-y-1">
                    <div>✊ <span className="text-cyan-400">Yumruk</span> = Döndür</div>
                    <div>🤏 <span className="text-yellow-400">Pinch</span> = Zoom</div>
                  </div>
                </div>
              )}
              
              <div className="bg-slate-900/80 backdrop-blur-sm rounded-2xl p-4 flex-1 overflow-auto border border-cyan-500/30">
                <h3 className="text-cyan-400 text-sm font-semibold mb-3 flex items-center gap-2">
                  📝 Soru
                </h3>
                
                {/* Soru metni */}
                <p className="text-white/90 text-sm leading-relaxed mb-4">
                  {questionText}
                </p>
                
                {/* Şıklar */}
                {options && Object.keys(options).length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-cyan-400/70 text-xs font-semibold">ŞIKLAR</h4>
                    {Object.entries(options).map(([key, value]) => (
                      <div 
                        key={key}
                        className={`p-2.5 rounded-lg text-sm transition-all ${
                          correctAnswer === key 
                            ? 'bg-green-500/20 border-2 border-green-500/50 text-green-300'
                            : 'bg-slate-800/50 border border-slate-700 text-white/80 hover:bg-slate-700/50'
                        }`}
                      >
                        <span className="font-bold mr-2 text-cyan-400">{key})</span>
                        {value}
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Doğru cevap */}
                {correctAnswer && (
                  <div className="mt-4 pt-4 border-t border-slate-700">
                    <span className="text-xs text-green-400 flex items-center gap-1">
                      ✓ Doğru Cevap: <span className="font-bold">{correctAnswer}</span>
                    </span>
                  </div>
                )}
              </div>
            </div>
            
            {/* Sağ panel - Üst: Soru görseli, Alt: 3D sahne */}
            <div className="w-3/5 h-full flex flex-col">
              {/* Üst kısım - Soru görseli (HER ZAMAN göster - varsa resim, yoksa placeholder) */}
              <div className="h-2/5 p-2">
                <div className="h-full bg-slate-900/80 rounded-xl border border-cyan-500/30 p-2 flex items-center justify-center overflow-hidden relative">
                  {questionImageUrl ? (
                    <img 
                      src={questionImageUrl} 
                      alt="Soru görseli"
                      className="max-h-full max-w-full object-contain rounded-lg"
                    />
                  ) : (
                    <div className="text-center text-white/50">
                      <div className="text-4xl mb-2">📝</div>
                      <p className="text-sm">Bu soruda görsel yok</p>
                      <p className="text-xs text-cyan-400/70 mt-1">Metin tabanlı soru</p>
                    </div>
                  )}
                  <div className="absolute top-2 left-2 bg-slate-800/80 px-2 py-1 rounded text-xs text-cyan-400">
                    📷 Soru Görseli
                  </div>
                </div>
              </div>
              
              {/* Alt kısım - 3D Model */}
              <div className="h-3/5 relative">
                {/* 🤖 AI Model Badge */}
                {selectedModel && modelExists && recommendedModelId && (
                  <div className="absolute top-2 left-2 z-10 bg-gradient-to-r from-purple-600 to-pink-600 px-3 py-1.5 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-3.5 h-3.5 text-white" />
                      <span className="text-xs font-medium text-white">AI Seçti: {selectedModel.name}</span>
                    </div>
                    {modelReason && (
                      <p className="text-[10px] text-white/70 mt-0.5">{modelReason}</p>
                    )}
                  </div>
                )}
                
                {/* Model/Shape toggle */}
                {selectedModel && modelExists && (
                  <div className="absolute top-2 right-2 z-10 flex gap-2">
                    <button
                      onClick={() => setUse3DModel(true)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1 ${
                        use3DModel 
                          ? 'bg-cyan-500 text-white' 
                          : 'bg-slate-800/80 text-white/70 hover:bg-slate-700'
                      }`}
                    >
                      <Box className="w-3.5 h-3.5" />
                      3D Model
                    </button>
                    <button
                      onClick={() => setUse3DModel(false)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1 ${
                        !use3DModel 
                          ? 'bg-cyan-500 text-white' 
                          : 'bg-slate-800/80 text-white/70 hover:bg-slate-700'
                      }`}
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      Şekil
                    </button>
                  </div>
                )}
                
                {/* 3D Canvas */}
                <Canvas camera={{ position: [0, 2, 8], fov: 50 }}>
                  <ambientLight intensity={0.5} />
                  <pointLight position={[10, 10, 10]} intensity={1} />
                  <pointLight position={[-10, -10, -10]} intensity={0.5} color="#06b6d4" />
                  <spotLight position={[0, 10, 0]} angle={0.3} penumbra={1} intensity={0.5} />
                  
                  {/* 3D Model veya SimpleShape3D */}
                  <Suspense fallback={<ModelLoadingPlaceholder />}>
                    {use3DModel && selectedModel && modelExists ? (
                      <Center>
                        <Pro3DModel 
                          modelData={selectedModel} 
                          autoRotate={!showHandTracking} 
                          handControlEnabled={showHandTracking && handTrackingReady}
                        />
                      </Center>
                    ) : (
                      <SimpleShape3D
                        type={sceneType}
                        base={sceneParams.base || 4}
                        height={sceneParams.height || 3}
                        side={sceneParams.side || 4}
                        width={sceneParams.width || 5}
                        radius={sceneParams.radius || 2}
                      />
                    )}
                  </Suspense>
                  
                  <OrbitControls 
                    enableZoom={true}
                    enablePan={true}
                    enableRotate={true}
                    minDistance={2}
                    maxDistance={15}
                  />
                  <Environment preset="night" />
                </Canvas>
                
                {/* Model bilgisi */}
                {selectedModel && use3DModel && modelExists && (
                  <div className="absolute bottom-2 left-2 z-10 bg-slate-900/80 backdrop-blur-sm rounded-lg px-3 py-2 border border-cyan-500/30">
                    <p className="text-cyan-400 text-xs font-semibold">{selectedModel.name}</p>
                    <p className="text-white/60 text-[10px]">{selectedModel.description}</p>
                  </div>
                )}
                
                {/* Mouse ile kontrol ipucu */}
                <div className="absolute bottom-2 right-2 z-10 bg-slate-900/80 backdrop-blur-sm rounded-lg px-3 py-2 border border-slate-700">
                  <p className="text-white/60 text-[10px]">🖱️ Döndür: Sol tık + sürükle</p>
                  <p className="text-white/60 text-[10px]">🔍 Zoom: Scroll</p>
                </div>
              </div>
            </div>
          </div>
      </div>

      {/* Adım bilgisi - Alt */}
      <div className="absolute bottom-0 left-0 right-0 z-10 p-6">
        {/* Progress bar */}
        <div className="flex gap-1 mb-4 justify-center">
          {steps.map((_, idx) => (
            <div
              key={idx}
              className={`h-1 rounded-full transition-all ${
                idx === currentStep 
                  ? 'w-8 bg-cyan-400' 
                  : idx < currentStep 
                    ? 'w-4 bg-cyan-400/50' 
                    : 'w-4 bg-slate-600'
              }`}
            />
          ))}
        </div>

        {/* Adım içeriği */}
        <div className="bg-slate-900/90 backdrop-blur-sm rounded-2xl p-6 border border-cyan-500/30 max-w-3xl mx-auto">
          <div className="flex items-start gap-4">
            {/* Adım numarası */}
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold shrink-0 shadow-lg shadow-cyan-500/30">
              {currentStep + 1}
            </div>
            
            {/* İçerik */}
            <div className="flex-1">
              <p className="text-white text-lg leading-relaxed">
                {currentStepData?.text || voiceIntro}
              </p>
              
              {/* 🎯 Interaktif Aksiyon Butonları */}
              <div className="flex flex-wrap gap-2 mt-3">
                {currentStepData?.action === 'highlight' && (
                  <button className="px-3 py-1.5 bg-yellow-500/20 border border-yellow-500/50 rounded-lg text-xs text-yellow-300 hover:bg-yellow-500/30 transition flex items-center gap-1">
                    <span>✨</span> Vurgula
                  </button>
                )}
                {currentStepData?.action === 'animate' && (
                  <button className="px-3 py-1.5 bg-purple-500/20 border border-purple-500/50 rounded-lg text-xs text-purple-300 hover:bg-purple-500/30 transition flex items-center gap-1">
                    <span>🎬</span> Animasyonu Oynat
                  </button>
                )}
                {currentStepData?.action === 'quiz' && (
                  <button className="px-3 py-1.5 bg-green-500/20 border border-green-500/50 rounded-lg text-xs text-green-300 hover:bg-green-500/30 transition flex items-center gap-1">
                    <span>❓</span> Cevapla
                  </button>
                )}
                
                {/* Yardımcı aksiyonlar */}
                <button 
                  onClick={() => currentStepData?.voiceScript && playVoice(currentStepData.voiceScript)}
                  className="px-3 py-1.5 bg-cyan-500/20 border border-cyan-500/50 rounded-lg text-xs text-cyan-300 hover:bg-cyan-500/30 transition flex items-center gap-1"
                >
                  <span>🔊</span> Dinle
                </button>
                
                {showHandTracking ? (
                  <span className="px-3 py-1.5 bg-green-500/20 border border-green-500/50 rounded-lg text-xs text-green-300 flex items-center gap-1">
                    <span>🖐️</span> El ile kontrol aktif
                  </span>
                ) : (
                  <button 
                    onClick={() => setShowHandTracking(true)}
                    className="px-3 py-1.5 bg-slate-700/50 border border-slate-600 rounded-lg text-xs text-white/70 hover:bg-slate-600/50 transition flex items-center gap-1"
                  >
                    <span>🖐️</span> El takibi aç
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Kontroller */}
          <div className="flex items-center justify-center gap-3 mt-6">
            <button
              onClick={reset}
              className="p-3 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-colors"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
            
            <button
              onClick={prevStep}
              disabled={currentStep === 0}
              className="px-6 py-3 rounded-xl bg-slate-800 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Önceki
            </button>
            
            <button
              onClick={nextStep}
              disabled={currentStep === steps.length - 1}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-bold flex items-center gap-2 disabled:opacity-50"
            >
              Sonraki
              <SkipForward className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

    </div>
  )
}
