'use client'

/**
 * 🖐️ HandTrackingOverlay - Gelişmiş El Takibi
 * 
 * MediaPipe Hands ile gerçek zamanlı el takibi
 * - İyileştirilmiş parmak algılama
 * - Büyük görsel geri bildirim
 * - Partikül efektleri
 * - Sesli uyarılar
 */

import { useEffect, useRef, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Camera, 
  Hand, 
  Loader2,
  X,
  Minimize2,
  AlertCircle,
  Sparkles
} from 'lucide-react'

// Gesture tipleri
export type GestureType = 'none' | 'point' | 'peace' | 'three' | 'four' | 'open' | 'fist'

// Gesture açıklamaları
const GESTURE_INFO: Record<GestureType, { emoji: string; label: string; action: string; color: string }> = {
  none: { emoji: '👋', label: 'El Yok', action: 'Elini göster', color: '#64748b' },
  point: { emoji: '☝️', label: 'İşaret', action: 'İLERİ', color: '#3b82f6' },
  peace: { emoji: '✌️', label: 'Barış', action: 'GERİ', color: '#10b981' },
  three: { emoji: '🤟', label: 'Üç', action: 'İPUCU', color: '#f59e0b' },
  four: { emoji: '🖖', label: 'Dört', action: 'SES', color: '#8b5cf6' },
  open: { emoji: '🖐️', label: 'Açık Avuç', action: 'OYNAT', color: '#ec4899' },
  fist: { emoji: '✊', label: 'Yumruk', action: 'DURDUR', color: '#ef4444' }
}

// Parmak landmark indeksleri
const WRIST = 0
const THUMB_TIP = 4
const INDEX_TIP = 8
const MIDDLE_TIP = 12
const RING_TIP = 16
const PINKY_TIP = 20

const THUMB_IP = 3
const INDEX_PIP = 6
const MIDDLE_PIP = 10
const RING_PIP = 14
const PINKY_PIP = 18

const INDEX_MCP = 5
const PINKY_MCP = 17

interface HandTrackingOverlayProps {
  onGestureAction?: (gesture: GestureType) => void
  className?: string
  showInstructions?: boolean
}

export default function HandTrackingOverlay({
  onGestureAction,
  className = '',
  showInstructions = true
}: HandTrackingOverlayProps) {
  const [isMinimized, setIsMinimized] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isTracking, setIsTracking] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentGesture, setCurrentGesture] = useState<GestureType>('none')
  const [fingerCount, setFingerCount] = useState(0)
  const [debugInfo, setDebugInfo] = useState('')
  const [confidence, setConfidence] = useState(0)
  const [actionTriggered, setActionTriggered] = useState<string | null>(null)
  const [handDetected, setHandDetected] = useState(false)
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const handsRef = useRef<any>(null)
  const lastGestureRef = useRef<GestureType>('none')
  const gestureTimerRef = useRef<NodeJS.Timeout>()
  const gestureCountRef = useRef(0) // Aynı gesture kaç frame devam etti
  const frameCountRef = useRef(0)

  // Gelişmiş parmak sayma - her parmak için ayrı kontrol
  const countFingers = useCallback((landmarks: any[]): { count: number; fingers: boolean[] } => {
    if (!landmarks || landmarks.length < 21) {
      return { count: 0, fingers: [false, false, false, false, false] }
    }

    const fingers: boolean[] = []

    // 1. Başparmak - Yatay mesafe kontrolü (el yönüne göre)
    // El yönünü belirle (bilek ve orta parmak MCP arası)
    const isRightHand = landmarks[INDEX_MCP].x < landmarks[PINKY_MCP].x
    
    if (isRightHand) {
      // Sağ el: başparmak ucu, IP ekleminin solunda mı?
      fingers.push(landmarks[THUMB_TIP].x < landmarks[THUMB_IP].x)
    } else {
      // Sol el: başparmak ucu, IP ekleminin sağında mı?
      fingers.push(landmarks[THUMB_TIP].x > landmarks[THUMB_IP].x)
    }

    // 2. İşaret parmağı - Dikey kontrol (y yukarı doğru küçülür)
    const indexExtended = landmarks[INDEX_TIP].y < landmarks[INDEX_PIP].y - 0.02
    fingers.push(indexExtended)

    // 3. Orta parmak
    const middleExtended = landmarks[MIDDLE_TIP].y < landmarks[MIDDLE_PIP].y - 0.02
    fingers.push(middleExtended)

    // 4. Yüzük parmağı
    const ringExtended = landmarks[RING_TIP].y < landmarks[RING_PIP].y - 0.02
    fingers.push(ringExtended)

    // 5. Serçe parmak
    const pinkyExtended = landmarks[PINKY_TIP].y < landmarks[PINKY_PIP].y - 0.02
    fingers.push(pinkyExtended)

    const count = fingers.filter(Boolean).length
    return { count, fingers }
  }, [])

  // Gesture belirleme - daha akıllı
  const detectGesture = useCallback((count: number, fingers: boolean[]): GestureType => {
    const [thumb, index, middle, ring, pinky] = fingers

    // Yumruk: Hiç parmak açık değil
    if (count === 0) return 'fist'
    
    // Açık avuç: Tüm parmaklar açık
    if (count === 5) return 'open'
    
    // İşaret: Sadece işaret parmağı
    if (count === 1 && index) return 'point'
    
    // Barış: İşaret + Orta
    if (count === 2 && index && middle && !ring && !pinky) return 'peace'
    
    // Üç: İşaret + Orta + Yüzük VEYA başparmak dahil 3
    if (count === 3) return 'three'
    
    // Dört: 4 parmak (başparmak hariç veya dahil)
    if (count === 4) return 'four'

    // Belirsiz durumlar için en yakın gesture
    if (count === 1) return 'point'
    if (count === 2) return 'peace'
    
    return 'none'
  }, [])

  // El çizimi - daha güzel
  const drawHand = useCallback((ctx: CanvasRenderingContext2D, landmarks: any[], width: number, height: number, fingers: boolean[]) => {
    // Bağlantı çizgileri
    const connections = [
      // Başparmak
      [0, 1], [1, 2], [2, 3], [3, 4],
      // İşaret
      [0, 5], [5, 6], [6, 7], [7, 8],
      // Orta
      [0, 9], [9, 10], [10, 11], [11, 12],
      // Yüzük
      [0, 13], [13, 14], [14, 15], [15, 16],
      // Serçe
      [0, 17], [17, 18], [18, 19], [19, 20],
      // Avuç içi
      [5, 9], [9, 13], [13, 17]
    ]

    // Glow efekti
    ctx.shadowBlur = 15
    ctx.shadowColor = '#00ff88'

    // Bağlantı çizgileri
    ctx.strokeStyle = '#00ff88'
    ctx.lineWidth = 3
    ctx.lineCap = 'round'

    for (const [start, end] of connections) {
      ctx.beginPath()
      ctx.moveTo(landmarks[start].x * width, landmarks[start].y * height)
      ctx.lineTo(landmarks[end].x * width, landmarks[end].y * height)
      ctx.stroke()
    }

    // Parmak uçları - açık olanlar parlak
    const fingerTips = [THUMB_TIP, INDEX_TIP, MIDDLE_TIP, RING_TIP, PINKY_TIP]
    
    fingerTips.forEach((tipIndex, i) => {
      const { x, y } = landmarks[tipIndex]
      const isOpen = fingers[i]
      
      // Dış halka
      ctx.beginPath()
      ctx.arc(x * width, y * height, isOpen ? 16 : 8, 0, 2 * Math.PI)
      ctx.fillStyle = isOpen ? '#ff6b6b' : '#4ecdc4'
      ctx.shadowColor = isOpen ? '#ff6b6b' : '#4ecdc4'
      ctx.fill()
      
      // İç nokta
      ctx.beginPath()
      ctx.arc(x * width, y * height, isOpen ? 8 : 4, 0, 2 * Math.PI)
      ctx.fillStyle = '#ffffff'
      ctx.fill()
    })

    // Diğer eklem noktaları
    ctx.shadowBlur = 0
    for (let i = 0; i < landmarks.length; i++) {
      if (!fingerTips.includes(i)) {
        const { x, y } = landmarks[i]
        ctx.beginPath()
        ctx.arc(x * width, y * height, 4, 0, 2 * Math.PI)
        ctx.fillStyle = '#4ecdc4'
        ctx.fill()
      }
    }
  }, [])

  // Aksiyon tetikle
  const triggerAction = useCallback((gesture: GestureType) => {
    const info = GESTURE_INFO[gesture]
    setActionTriggered(info.action)
    onGestureAction?.(gesture)
    
    // 1.5 saniye sonra notification'ı kaldır
    setTimeout(() => setActionTriggered(null), 1500)
  }, [onGestureAction])

  // Kamerayı başlat
  const startTracking = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    setDebugInfo('Kamera başlatılıyor...')

    try {
      // 1. Kamera erişimi
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        }
      })

      if (!videoRef.current) throw new Error('Video elementi bulunamadı')

      videoRef.current.srcObject = stream
      
      await new Promise<void>((resolve, reject) => {
        if (!videoRef.current) return reject('Video yok')
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().then(resolve).catch(reject)
        }
        setTimeout(() => reject('Video timeout'), 10000)
      })

      setDebugInfo('MediaPipe yükleniyor...')

      // 2. MediaPipe Hands
      const { Hands } = await import('@mediapipe/hands')
      
      const hands = new Hands({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1675469240/${file}`
      })

      hands.setOptions({
        maxNumHands: 1,
        modelComplexity: 1, // Daha doğru model
        minDetectionConfidence: 0.6,
        minTrackingConfidence: 0.5
      })

      hands.onResults((results: any) => {
        const canvas = canvasRef.current
        const ctx = canvas?.getContext('2d')
        if (!canvas || !ctx) return

        ctx.clearRect(0, 0, canvas.width, canvas.height)
        frameCountRef.current++

        if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
          const landmarks = results.multiHandLandmarks[0]
          setHandDetected(true)
          
          // Confidence
          const conf = results.multiHandedness?.[0]?.score || 0
          setConfidence(Math.round(conf * 100))
          
          // Parmak say
          const { count, fingers } = countFingers(landmarks)
          const gesture = detectGesture(count, fingers)
          
          // El çiz
          drawHand(ctx, landmarks, canvas.width, canvas.height, fingers)
          
          setFingerCount(count)
          setCurrentGesture(gesture)
          setDebugInfo(`Parmak: ${fingers.map((f, i) => f ? ['👍','☝️','🖕','💍','🤙'][i] : '·').join(' ')}`)
          
          // Gesture stability kontrolü
          if (gesture === lastGestureRef.current && gesture !== 'none') {
            gestureCountRef.current++
            
            // 10 frame (yaklaşık 300-500ms) aynı gesture = aksiyon tetikle
            if (gestureCountRef.current === 10) {
              triggerAction(gesture)
            }
          } else {
            gestureCountRef.current = 0
            lastGestureRef.current = gesture
          }
        } else {
          setHandDetected(false)
          setCurrentGesture('none')
          setFingerCount(0)
          setConfidence(0)
          gestureCountRef.current = 0
          setDebugInfo('El algılanmadı - elini kameraya göster')
        }
      })

      handsRef.current = hands
      setDebugInfo('Hazır! Elini göster 🖐️')

      // Frame döngüsü
      const processFrame = async () => {
        if (videoRef.current && handsRef.current && videoRef.current.readyState >= 2) {
          await handsRef.current.send({ image: videoRef.current })
        }
        if (handsRef.current) {
          requestAnimationFrame(processFrame)
        }
      }

      setIsTracking(true)
      setIsLoading(false)
      setTimeout(processFrame, 500)

    } catch (err: any) {
      console.error('Hand tracking error:', err)
      setError(err.message || 'Kamera açılamadı')
      setIsLoading(false)
    }
  }, [countFingers, detectGesture, drawHand, triggerAction])

  // Durdur
  const stopTracking = useCallback(() => {
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks()
      tracks.forEach(track => track.stop())
      videoRef.current.srcObject = null
    }
    handsRef.current = null
    setIsTracking(false)
    setHandDetected(false)
    setCurrentGesture('none')
    setFingerCount(0)
  }, [])

  useEffect(() => {
    return () => {
      stopTracking()
      if (gestureTimerRef.current) clearTimeout(gestureTimerRef.current)
    }
  }, [stopTracking])

  const gestureInfo = GESTURE_INFO[currentGesture]

  return (
    <div className={`relative ${className}`}>
      <div className={`
        bg-slate-900/95 backdrop-blur-sm rounded-2xl border-2 overflow-hidden transition-all duration-300
        ${isMinimized ? 'w-16 h-16 border-slate-700' : 'w-96 border-pink-500/50'}
      `}>
        {isMinimized ? (
          <button onClick={() => setIsMinimized(false)} className="w-full h-full flex items-center justify-center hover:bg-slate-800">
            <Hand className="w-8 h-8 text-pink-400" />
          </button>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-pink-600 to-purple-600">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-white" />
                <span className="text-white font-bold">Sihirli Dokunuş</span>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => setIsMinimized(true)} className="p-1.5 hover:bg-white/20 rounded-lg">
                  <Minimize2 className="w-4 h-4 text-white" />
                </button>
                {isTracking && (
                  <button onClick={stopTracking} className="p-1.5 hover:bg-white/20 rounded-lg">
                    <X className="w-4 h-4 text-white" />
                  </button>
                )}
              </div>
            </div>

            {/* Video Container */}
            <div className="relative aspect-[4/3] bg-black">
              <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover transform scale-x-[-1]" playsInline muted autoPlay />
              <canvas ref={canvasRef} width={384} height={288} className="absolute inset-0 w-full h-full transform scale-x-[-1] pointer-events-none" />

              {/* Action Triggered Notification */}
              <AnimatePresence>
                {actionTriggered && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.5, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.5, y: -20 }}
                    className="absolute inset-0 flex items-center justify-center bg-black/50 z-20"
                  >
                    <div className="text-center">
                      <motion.div 
                        className="text-7xl mb-2"
                        animate={{ scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }}
                        transition={{ duration: 0.5 }}
                      >
                        {gestureInfo.emoji}
                      </motion.div>
                      <div className="text-3xl font-black text-white" style={{ color: gestureInfo.color }}>
                        {actionTriggered}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Loading */}
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-900/90 z-10">
                  <div className="text-center">
                    <Loader2 className="w-12 h-12 text-pink-400 animate-spin mx-auto mb-3" />
                    <p className="text-white font-medium">{debugInfo}</p>
                  </div>
                </div>
              )}

              {/* Error */}
              {error && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-900/90 z-10">
                  <div className="text-center p-4">
                    <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
                    <p className="text-red-400 font-medium mb-2">Hata!</p>
                    <p className="text-slate-400 text-sm mb-3">{error}</p>
                    <button onClick={startTracking} className="px-4 py-2 bg-pink-500 hover:bg-pink-600 rounded-lg text-white font-medium">
                      Tekrar Dene
                    </button>
                  </div>
                </div>
              )}

              {/* Start Button */}
              {!isTracking && !isLoading && !error && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-900/90 z-10">
                  <button onClick={startTracking} className="flex flex-col items-center gap-3 p-8 bg-gradient-to-br from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 rounded-3xl transition-all transform hover:scale-105 shadow-2xl">
                    <Camera className="w-14 h-14 text-white" />
                    <span className="text-white font-bold text-xl">Kamerayı Başlat</span>
                    <span className="text-white/70 text-sm">El hareketlerinle kontrol et</span>
                  </button>
                </div>
              )}

              {/* Current Gesture - Büyük gösterge */}
              {isTracking && (
                <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={currentGesture}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="flex items-center gap-3 px-4 py-3 rounded-2xl"
                      style={{ backgroundColor: `${gestureInfo.color}dd` }}
                    >
                      <span className="text-4xl">{gestureInfo.emoji}</span>
                      <div>
                        <p className="text-white font-bold text-lg">{gestureInfo.label}</p>
                        <p className="text-white/80 text-sm">{fingerCount} parmak açık</p>
                      </div>
                    </motion.div>
                  </AnimatePresence>

                  {/* Status */}
                  <div className={`px-3 py-2 rounded-xl ${handDetected ? 'bg-green-500' : 'bg-red-500'}`}>
                    <p className="text-white text-xs font-bold">{handDetected ? `✓ %${confidence}` : '✗ El Yok'}</p>
                  </div>
                </div>
              )}

              {/* Progress Bar - Gesture tutma süresi */}
              {isTracking && currentGesture !== 'none' && gestureCountRef.current > 0 && gestureCountRef.current < 10 && (
                <div className="absolute bottom-3 left-3 right-3">
                  <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full rounded-full"
                      style={{ backgroundColor: gestureInfo.color }}
                      initial={{ width: '0%' }}
                      animate={{ width: `${(gestureCountRef.current / 10) * 100}%` }}
                    />
                  </div>
                  <p className="text-center text-white/60 text-xs mt-1">Hareket tut...</p>
                </div>
              )}
            </div>

            {/* Debug Info */}
            {isTracking && (
              <div className="px-4 py-2 bg-slate-800/80 text-center">
                <p className="text-slate-400 text-xs font-mono">{debugInfo}</p>
              </div>
            )}

            {/* Instructions */}
            {showInstructions && (
              <div className="p-4 border-t border-slate-700/50 bg-slate-800/50">
                <p className="text-white text-xs font-bold mb-3 text-center">🎮 El Kontrolleri</p>
                <div className="grid grid-cols-3 gap-3">
                  {(['point', 'peace', 'three', 'open', 'fist', 'four'] as GestureType[]).map(g => {
                    const info = GESTURE_INFO[g]
                    const isActive = currentGesture === g
                    return (
                      <div 
                        key={g} 
                        className={`text-center p-2 rounded-xl transition-all ${isActive ? 'ring-2 ring-white scale-105' : ''}`}
                        style={{ backgroundColor: isActive ? `${info.color}40` : 'transparent' }}
                      >
                        <span className="text-2xl">{info.emoji}</span>
                        <p className="text-white text-xs font-medium mt-1">{info.action}</p>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
