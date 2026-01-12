'use client'

/**
 * 🖐️ useHandTracking - MediaPipe El Takibi Hook'u
 * 
 * Kamera üzerinden el hareketlerini takip eder ve
 * parmak sayısına göre aksiyonlar tetikler.
 * 
 * Parmak Sayıları:
 * - 1 parmak: "point" (işaret)
 * - 2 parmak: "peace" (barış/ileri)
 * - 3 parmak: "three" (3)
 * - 4 parmak: "four" (4)
 * - 5 parmak (açık avuç): "open" (scatter/dağıt)
 * - Yumruk: "fist" (catch/yakala)
 */

import { useState, useEffect, useRef, useCallback } from 'react'

// El landmark indeksleri
const FINGER_TIPS = [4, 8, 12, 16, 20] // Başparmak, İşaret, Orta, Yüzük, Serçe
const FINGER_PIPS = [3, 6, 10, 14, 18] // Parmak orta eklemleri

export type GestureType = 'none' | 'point' | 'peace' | 'three' | 'four' | 'open' | 'fist'

export interface HandLandmark {
  x: number
  y: number
  z: number
}

export interface HandData {
  landmarks: HandLandmark[]
  gesture: GestureType
  fingerCount: number
  palmCenter: { x: number; y: number }
  indexTip: { x: number; y: number } | null
  isLeftHand: boolean
}

export interface UseHandTrackingOptions {
  onGestureChange?: (gesture: GestureType, fingerCount: number) => void
  onHandMove?: (x: number, y: number) => void
  enabled?: boolean
}

export interface UseHandTrackingReturn {
  isLoading: boolean
  isTracking: boolean
  error: string | null
  hands: HandData[]
  videoRef: React.RefObject<HTMLVideoElement>
  canvasRef: React.RefObject<HTMLCanvasElement>
  startTracking: () => Promise<void>
  stopTracking: () => void
  currentGesture: GestureType
  fingerCount: number
}

// Parmak sayısını hesapla
function countExtendedFingers(landmarks: HandLandmark[]): number {
  if (!landmarks || landmarks.length < 21) return 0

  let count = 0

  // Başparmak - yatay kontrol (x ekseni)
  if (landmarks[FINGER_TIPS[0]].x < landmarks[FINGER_PIPS[0]].x) {
    count++
  }

  // Diğer 4 parmak - dikey kontrol (y ekseni, ekranda y aşağı doğru artar)
  for (let i = 1; i < 5; i++) {
    if (landmarks[FINGER_TIPS[i]].y < landmarks[FINGER_PIPS[i]].y) {
      count++
    }
  }

  return count
}

// Gesture belirleme
function detectGesture(fingerCount: number): GestureType {
  switch (fingerCount) {
    case 0: return 'fist'
    case 1: return 'point'
    case 2: return 'peace'
    case 3: return 'three'
    case 4: return 'four'
    case 5: return 'open'
    default: return 'none'
  }
}

// Avuç içi merkezi
function getPalmCenter(landmarks: HandLandmark[]): { x: number; y: number } {
  if (!landmarks || landmarks.length < 21) return { x: 0.5, y: 0.5 }
  
  // Avuç içi noktaları ortalaması (0, 5, 9, 13, 17)
  const palmPoints = [0, 5, 9, 13, 17]
  const sum = palmPoints.reduce(
    (acc, idx) => ({
      x: acc.x + landmarks[idx].x,
      y: acc.y + landmarks[idx].y
    }),
    { x: 0, y: 0 }
  )
  
  return {
    x: sum.x / palmPoints.length,
    y: sum.y / palmPoints.length
  }
}

export function useHandTracking(options: UseHandTrackingOptions = {}): UseHandTrackingReturn {
  const { onGestureChange, onHandMove, enabled = true } = options

  const [isLoading, setIsLoading] = useState(false)
  const [isTracking, setIsTracking] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hands, setHands] = useState<HandData[]>([])
  const [currentGesture, setCurrentGesture] = useState<GestureType>('none')
  const [fingerCount, setFingerCount] = useState(0)

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const handsRef = useRef<any>(null)
  const cameraRef = useRef<any>(null)
  const animationFrameRef = useRef<number>()
  const lastGestureRef = useRef<GestureType>('none')

  // MediaPipe'ı başlat
  const startTracking = useCallback(async () => {
    if (!enabled) return
    
    setIsLoading(true)
    setError(null)

    try {
      // Kamera erişimi
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          width: 640, 
          height: 480,
          facingMode: 'user'
        }
      })

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }

      // MediaPipe Hands dinamik import
      const { Hands } = await import('@mediapipe/hands')
      const { Camera } = await import('@mediapipe/camera_utils')

      const hands = new Hands({
        locateFile: (file) => {
          return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
        }
      })

      hands.setOptions({
        maxNumHands: 2,
        modelComplexity: 1,
        minDetectionConfidence: 0.7,
        minTrackingConfidence: 0.5
      })

      hands.onResults((results: any) => {
        if (!results.multiHandLandmarks || results.multiHandLandmarks.length === 0) {
          setHands([])
          setCurrentGesture('none')
          setFingerCount(0)
          return
        }

        const handDataList: HandData[] = results.multiHandLandmarks.map((landmarks: any, index: number) => {
          const fingers = countExtendedFingers(landmarks)
          const gesture = detectGesture(fingers)
          const palm = getPalmCenter(landmarks)
          const indexTip = landmarks[8] ? { x: landmarks[8].x, y: landmarks[8].y } : null
          const isLeft = results.multiHandedness?.[index]?.label === 'Left'

          return {
            landmarks,
            gesture,
            fingerCount: fingers,
            palmCenter: palm,
            indexTip,
            isLeftHand: isLeft
          }
        })

        setHands(handDataList)

        // İlk elin gesture'ını ana gesture olarak kullan
        const primaryHand = handDataList[0]
        if (primaryHand) {
          setCurrentGesture(primaryHand.gesture)
          setFingerCount(primaryHand.fingerCount)

          // Gesture değişikliği callback
          if (primaryHand.gesture !== lastGestureRef.current) {
            lastGestureRef.current = primaryHand.gesture
            onGestureChange?.(primaryHand.gesture, primaryHand.fingerCount)
          }

          // El hareketi callback
          if (primaryHand.indexTip) {
            onHandMove?.(primaryHand.indexTip.x, primaryHand.indexTip.y)
          }
        }

        // Canvas'a çiz
        drawHands(results)
      })

      handsRef.current = hands

      // Kamera başlat
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
      }

      setIsTracking(true)
      setIsLoading(false)

    } catch (err: any) {
      console.error('Hand tracking error:', err)
      setError(err.message || 'Kamera erişimi sağlanamadı')
      setIsLoading(false)
    }
  }, [enabled, onGestureChange, onHandMove])

  // Canvas'a elleri çiz
  const drawHands = useCallback((results: any) => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    if (results.multiHandLandmarks) {
      for (const landmarks of results.multiHandLandmarks) {
        // Bağlantı çizgileri
        drawConnections(ctx, landmarks, canvas.width, canvas.height)
        
        // Landmark noktaları
        drawLandmarks(ctx, landmarks, canvas.width, canvas.height)
      }
    }
  }, [])

  // Bağlantı çizgileri
  const drawConnections = (ctx: CanvasRenderingContext2D, landmarks: HandLandmark[], width: number, height: number) => {
    const connections = [
      [0, 1], [1, 2], [2, 3], [3, 4], // Başparmak
      [0, 5], [5, 6], [6, 7], [7, 8], // İşaret
      [0, 9], [9, 10], [10, 11], [11, 12], // Orta
      [0, 13], [13, 14], [14, 15], [15, 16], // Yüzük
      [0, 17], [17, 18], [18, 19], [19, 20], // Serçe
      [5, 9], [9, 13], [13, 17] // Avuç içi
    ]

    ctx.strokeStyle = '#00ff88'
    ctx.lineWidth = 2

    for (const [start, end] of connections) {
      ctx.beginPath()
      ctx.moveTo(landmarks[start].x * width, landmarks[start].y * height)
      ctx.lineTo(landmarks[end].x * width, landmarks[end].y * height)
      ctx.stroke()
    }
  }

  // Landmark noktaları
  const drawLandmarks = (ctx: CanvasRenderingContext2D, landmarks: HandLandmark[], width: number, height: number) => {
    for (let i = 0; i < landmarks.length; i++) {
      const { x, y } = landmarks[i]
      
      // Parmak uçları farklı renk
      const isTip = FINGER_TIPS.includes(i)
      
      ctx.beginPath()
      ctx.arc(x * width, y * height, isTip ? 8 : 4, 0, 2 * Math.PI)
      ctx.fillStyle = isTip ? '#ff6b6b' : '#4ecdc4'
      ctx.fill()
      
      // Parmak uçlarına glow efekti
      if (isTip) {
        ctx.beginPath()
        ctx.arc(x * width, y * height, 12, 0, 2 * Math.PI)
        ctx.strokeStyle = 'rgba(255, 107, 107, 0.5)'
        ctx.lineWidth = 2
        ctx.stroke()
      }
    }
  }

  // Durdur
  const stopTracking = useCallback(() => {
    if (cameraRef.current) {
      cameraRef.current.stop()
      cameraRef.current = null
    }

    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks()
      tracks.forEach(track => track.stop())
      videoRef.current.srcObject = null
    }

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
    }

    setIsTracking(false)
    setHands([])
    setCurrentGesture('none')
    setFingerCount(0)
  }, [])

  // Cleanup
  useEffect(() => {
    return () => {
      stopTracking()
    }
  }, [stopTracking])

  return {
    isLoading,
    isTracking,
    error,
    hands,
    videoRef,
    canvasRef,
    startTracking,
    stopTracking,
    currentGesture,
    fingerCount
  }
}

export default useHandTracking
