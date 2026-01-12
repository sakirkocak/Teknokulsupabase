'use client'

/**
 * 🎆 ParticlePlayground - Cyberpunk Partikül Efekti
 * 
 * xiao hai'nin viral videosundaki gibi:
 * - Binlerce parlayan partikül
 * - El hareketi ile kontrol
 * - Neon cyberpunk görsel
 * - Gesture'a göre davranış
 */

import { useEffect, useRef, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Camera, 
  Loader2,
  X,
  Sparkles,
  Zap,
  Settings
} from 'lucide-react'

// Partikül sınıfı
class Particle {
  x: number
  y: number
  baseX: number
  baseY: number
  vx: number
  vy: number
  size: number
  color: string
  alpha: number
  
  constructor(x: number, y: number, color: string) {
    this.x = x
    this.y = y
    this.baseX = x
    this.baseY = y
    this.vx = 0
    this.vy = 0
    this.size = Math.random() * 3 + 1
    this.color = color
    this.alpha = Math.random() * 0.5 + 0.5
  }
  
  update(mouseX: number, mouseY: number, mode: 'attract' | 'repel' | 'scatter' | 'idle') {
    const dx = mouseX - this.x
    const dy = mouseY - this.y
    const distance = Math.sqrt(dx * dx + dy * dy)
    const maxDistance = 150
    
    if (distance < maxDistance && mode !== 'idle') {
      const force = (maxDistance - distance) / maxDistance
      const angle = Math.atan2(dy, dx)
      
      if (mode === 'attract') {
        // Yumruk - partikülleri ele çek
        this.vx += Math.cos(angle) * force * 2
        this.vy += Math.sin(angle) * force * 2
      } else if (mode === 'repel' || mode === 'scatter') {
        // Açık avuç - partikülleri it
        this.vx -= Math.cos(angle) * force * 3
        this.vy -= Math.sin(angle) * force * 3
      }
    }
    
    // Orijinal pozisyona geri dönme eğilimi
    const returnForce = 0.02
    this.vx += (this.baseX - this.x) * returnForce
    this.vy += (this.baseY - this.y) * returnForce
    
    // Sürtünme
    this.vx *= 0.95
    this.vy *= 0.95
    
    // Pozisyon güncelle
    this.x += this.vx
    this.y += this.vy
  }
  
  draw(ctx: CanvasRenderingContext2D) {
    ctx.beginPath()
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2)
    ctx.fillStyle = this.color
    ctx.globalAlpha = this.alpha
    ctx.fill()
    ctx.globalAlpha = 1
  }
}

// Renk paleti - Cyberpunk
const COLORS = {
  neonPink: '#ff00ff',
  neonBlue: '#00ffff', 
  neonGreen: '#00ff00',
  neonYellow: '#ffff00',
  neonOrange: '#ff8800',
  white: '#ffffff'
}

const COLOR_SCHEMES = {
  cyberpunk: ['#ff00ff', '#00ffff', '#ff00aa', '#00ffaa', '#ffffff'],
  fire: ['#ff0000', '#ff4400', '#ff8800', '#ffcc00', '#ffffff'],
  ocean: ['#0044ff', '#0088ff', '#00ccff', '#00ffff', '#ffffff'],
  matrix: ['#00ff00', '#00cc00', '#00aa00', '#008800', '#ffffff'],
  galaxy: ['#8800ff', '#ff00ff', '#ff0088', '#0088ff', '#ffffff']
}

type GestureType = 'none' | 'point' | 'peace' | 'three' | 'four' | 'open' | 'fist'
type ParticleMode = 'attract' | 'repel' | 'scatter' | 'idle'

interface ParticlePlaygroundProps {
  onClose?: () => void
  // Eğitim modu - derslerle entegrasyon
  educationMode?: boolean
  lessonTitle?: string
  lessonContent?: string
  onGestureAction?: (gesture: GestureType) => void
}

export default function ParticlePlayground({ 
  onClose,
  educationMode = false,
  lessonTitle,
  lessonContent,
  onGestureAction
}: ParticlePlaygroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const particlesRef = useRef<Particle[]>([])
  const animationRef = useRef<number>()
  const handsRef = useRef<any>(null)
  
  const [isLoading, setIsLoading] = useState(false)
  const [isRunning, setIsRunning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fps, setFps] = useState(0)
  const [particleCount, setParticleCount] = useState(0)
  const [currentGesture, setCurrentGesture] = useState<GestureType>('none')
  const [fingerCount, setFingerCount] = useState(0)
  const [handPosition, setHandPosition] = useState({ x: 0, y: 0 })
  const [colorScheme, setColorScheme] = useState<keyof typeof COLOR_SCHEMES>('cyberpunk')
  const [showSettings, setShowSettings] = useState(false)
  const [particleDensity, setParticleDensity] = useState(8000)
  const [showVideo, setShowVideo] = useState(true)
  const [videoPosition, setVideoPosition] = useState<'corner' | 'background' | 'hidden'>('corner')
  
  const lastTimeRef = useRef(performance.now())
  const frameCountRef = useRef(0)

  // Partikülleri oluştur
  const initParticles = useCallback((width: number, height: number) => {
    const particles: Particle[] = []
    const colors = COLOR_SCHEMES[colorScheme]
    const spacing = Math.sqrt((width * height) / particleDensity)
    
    for (let x = 0; x < width; x += spacing) {
      for (let y = 0; y < height; y += spacing) {
        const color = colors[Math.floor(Math.random() * colors.length)]
        particles.push(new Particle(x + Math.random() * spacing, y + Math.random() * spacing, color))
      }
    }
    
    particlesRef.current = particles
    setParticleCount(particles.length)
  }, [colorScheme, particleDensity])

  // Parmak sayma
  const countFingers = useCallback((landmarks: any[]): { count: number; fingers: boolean[] } => {
    if (!landmarks || landmarks.length < 21) return { count: 0, fingers: [false, false, false, false, false] }

    const fingers: boolean[] = []
    const isRightHand = landmarks[5].x < landmarks[17].x

    // Başparmak
    if (isRightHand) {
      fingers.push(landmarks[4].x < landmarks[3].x)
    } else {
      fingers.push(landmarks[4].x > landmarks[3].x)
    }

    // Diğer parmaklar
    fingers.push(landmarks[8].y < landmarks[6].y - 0.02)
    fingers.push(landmarks[12].y < landmarks[10].y - 0.02)
    fingers.push(landmarks[16].y < landmarks[14].y - 0.02)
    fingers.push(landmarks[20].y < landmarks[18].y - 0.02)

    return { count: fingers.filter(Boolean).length, fingers }
  }, [])

  // Gesture'dan mod belirleme
  const getParticleMode = useCallback((gesture: GestureType): ParticleMode => {
    switch (gesture) {
      case 'fist': return 'attract'    // Yumruk = topla
      case 'open': return 'scatter'    // Açık avuç = dağıt
      case 'point': return 'repel'     // İşaret = it
      case 'peace': return 'repel'     // Barış = it
      default: return 'idle'
    }
  }, [])

  // Ana başlatma
  const start = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Kamera
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720, facingMode: 'user' }
      })

      if (!videoRef.current || !canvasRef.current) throw new Error('Elements not found')

      videoRef.current.srcObject = stream
      await videoRef.current.play()

      const canvas = canvasRef.current
      const ctx = canvas.getContext('2d')!
      
      canvas.width = 1280
      canvas.height = 720

      // Partiküller
      initParticles(canvas.width, canvas.height)

      // MediaPipe
      const { Hands } = await import('@mediapipe/hands')
      
      const hands = new Hands({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1675469240/${file}`
      })

      hands.setOptions({
        maxNumHands: 2,
        modelComplexity: 0,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
      })

      let currentMode: ParticleMode = 'idle'
      let mouseX = canvas.width / 2
      let mouseY = canvas.height / 2

      hands.onResults((results: any) => {
        if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
          const landmarks = results.multiHandLandmarks[0]
          
          // El merkezi (avuç içi)
          const palmX = (landmarks[0].x + landmarks[5].x + landmarks[17].x) / 3
          const palmY = (landmarks[0].y + landmarks[5].y + landmarks[17].y) / 3
          
          mouseX = (1 - palmX) * canvas.width // Mirror
          mouseY = palmY * canvas.height
          
          setHandPosition({ x: mouseX, y: mouseY })
          
          // Gesture
          const { count, fingers } = countFingers(landmarks)
          setFingerCount(count)
          
          let gesture: GestureType = 'none'
          if (count === 0) gesture = 'fist'
          else if (count === 5) gesture = 'open'
          else if (count === 1 && fingers[1]) gesture = 'point'
          else if (count === 2 && fingers[1] && fingers[2]) gesture = 'peace'
          else if (count === 3) gesture = 'three'
          else if (count === 4) gesture = 'four'
          
          setCurrentGesture(gesture)
          currentMode = getParticleMode(gesture)
          
          // Eğitim modunda gesture callback
          if (educationMode && onGestureAction && gesture !== 'none') {
            onGestureAction(gesture)
          }
        } else {
          setCurrentGesture('none')
          currentMode = 'idle'
        }
      })

      handsRef.current = hands

      // Render loop
      const render = () => {
        // FPS hesapla
        frameCountRef.current++
        const now = performance.now()
        if (now - lastTimeRef.current >= 1000) {
          setFps(frameCountRef.current)
          frameCountRef.current = 0
          lastTimeRef.current = now
        }

        // Arka plan
        ctx.fillStyle = 'rgba(0, 0, 0, 0.1)'
        ctx.fillRect(0, 0, canvas.width, canvas.height)

        // Partikülleri güncelle ve çiz
        for (const particle of particlesRef.current) {
          particle.update(mouseX, mouseY, currentMode)
          particle.draw(ctx)
        }

        // El pozisyonu göstergesi
        if (currentMode !== 'idle') {
          ctx.beginPath()
          ctx.arc(mouseX, mouseY, 30, 0, Math.PI * 2)
          ctx.strokeStyle = currentMode === 'attract' ? '#ff0000' : '#00ffff'
          ctx.lineWidth = 3
          ctx.stroke()
          
          // Glow efekti
          ctx.shadowBlur = 20
          ctx.shadowColor = currentMode === 'attract' ? '#ff0000' : '#00ffff'
          ctx.beginPath()
          ctx.arc(mouseX, mouseY, 15, 0, Math.PI * 2)
          ctx.fillStyle = currentMode === 'attract' ? '#ff000088' : '#00ffff88'
          ctx.fill()
          ctx.shadowBlur = 0
        }

        animationRef.current = requestAnimationFrame(render)
      }

      // Video frame işleme
      const processVideo = async () => {
        if (videoRef.current && handsRef.current && videoRef.current.readyState >= 2) {
          await handsRef.current.send({ image: videoRef.current })
        }
        if (handsRef.current) {
          requestAnimationFrame(processVideo)
        }
      }

      setIsRunning(true)
      setIsLoading(false)
      
      render()
      setTimeout(processVideo, 500)

    } catch (err: any) {
      setError(err.message)
      setIsLoading(false)
    }
  }, [initParticles, countFingers, getParticleMode])

  // Durdur
  const stop = useCallback(() => {
    if (animationRef.current) cancelAnimationFrame(animationRef.current)
    if (videoRef.current?.srcObject) {
      (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop())
    }
    handsRef.current = null
    setIsRunning(false)
  }, [])

  useEffect(() => {
    return () => stop()
  }, [stop])

  // Renk şeması değişince partikülleri yenile
  useEffect(() => {
    if (isRunning && canvasRef.current) {
      initParticles(canvasRef.current.width, canvasRef.current.height)
    }
  }, [colorScheme, particleDensity, isRunning, initParticles])

  const gestureEmojis: Record<GestureType, string> = {
    none: '👋', point: '☝️', peace: '✌️', three: '🤟', four: '🖖', open: '🖐️', fist: '✊'
  }

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-6 py-4 bg-gradient-to-b from-black/80 to-transparent">
        <div className="flex items-center gap-4">
          <Sparkles className="w-8 h-8 text-pink-500" />
          <div>
            <h1 className="text-white font-black text-2xl tracking-wider">
              {educationMode && lessonTitle ? lessonTitle : 'PARTICLE PLAYGROUND'}
            </h1>
            <p className="text-pink-400 text-sm">
              {educationMode ? 'İnteraktif Konu Anlatımı' : 'Three.js + MediaPipe'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Settings */}
          <button 
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 bg-white/10 hover:bg-white/20 rounded-lg"
          >
            <Settings className="w-5 h-5 text-white" />
          </button>
          
          {/* Close */}
          {onClose && (
            <button onClick={() => { stop(); onClose() }} className="p-2 bg-red-500/80 hover:bg-red-500 rounded-lg">
              <X className="w-5 h-5 text-white" />
            </button>
          )}
        </div>
      </div>

      {/* Settings Panel */}
      <AnimatePresence>
        {showSettings && (
          <motion.div 
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 300 }}
            className="absolute top-20 right-6 z-20 w-72 bg-slate-900/95 backdrop-blur-sm rounded-2xl border border-pink-500/30 p-4"
          >
            <h3 className="text-white font-bold mb-4">⚙️ Ayarlar</h3>
            
            <div className="space-y-4">
              {/* Renk Şeması */}
              <div>
                <p className="text-slate-400 text-sm mb-2">Renk Teması</p>
                <div className="grid grid-cols-5 gap-2">
                  {(Object.keys(COLOR_SCHEMES) as Array<keyof typeof COLOR_SCHEMES>).map(scheme => (
                    <button
                      key={scheme}
                      onClick={() => setColorScheme(scheme)}
                      className={`p-2 rounded-lg transition-all ${colorScheme === scheme ? 'ring-2 ring-white scale-110' : ''}`}
                      style={{ background: `linear-gradient(135deg, ${COLOR_SCHEMES[scheme][0]}, ${COLOR_SCHEMES[scheme][1]})` }}
                      title={scheme}
                    />
                  ))}
                </div>
              </div>
              
              {/* Partikül Yoğunluğu */}
              <div>
                <p className="text-slate-400 text-sm mb-2">Partikül: {particleDensity.toLocaleString()}</p>
                <input
                  type="range"
                  min="2000"
                  max="15000"
                  step="1000"
                  value={particleDensity}
                  onChange={(e) => setParticleDensity(parseInt(e.target.value))}
                  className="w-full accent-pink-500"
                />
              </div>
              
              {/* Video Pozisyonu */}
              <div>
                <p className="text-slate-400 text-sm mb-2">Kamera Görüntüsü</p>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setVideoPosition('corner')}
                    className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${videoPosition === 'corner' ? 'bg-pink-500 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
                  >
                    📹 Köşe
                  </button>
                  <button
                    onClick={() => setVideoPosition('background')}
                    className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${videoPosition === 'background' ? 'bg-pink-500 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
                  >
                    🖼️ Arka
                  </button>
                  <button
                    onClick={() => setVideoPosition('hidden')}
                    className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${videoPosition === 'hidden' ? 'bg-pink-500 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
                  >
                    🚫 Gizle
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* HUD - Sol Üst */}
      {isRunning && (
        <div className="absolute top-20 left-6 z-10 font-mono text-sm space-y-1">
          <div className="text-green-400">FPS: {fps}</div>
          <div className="text-cyan-400">Particles: {particleCount.toLocaleString()}</div>
          <div className="text-pink-400">Mode: {getParticleMode(currentGesture).toUpperCase()}</div>
        </div>
      )}

      {/* Gesture Display - Sağ Alt */}
      {isRunning && (
        <div className="absolute bottom-6 right-6 z-10">
          <motion.div 
            key={currentGesture}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex items-center gap-4 px-6 py-4 bg-slate-900/80 backdrop-blur-sm rounded-2xl border border-pink-500/50"
          >
            <span className="text-6xl">{gestureEmojis[currentGesture]}</span>
            <div>
              <p className="text-white font-bold text-xl">{currentGesture.toUpperCase()}</p>
              <p className="text-pink-400">{fingerCount} parmak</p>
            </div>
          </motion.div>
        </div>
      )}

      {/* Instructions - Sol Alt (video yoksa veya arka plandaysa) */}
      {isRunning && videoPosition !== 'corner' && (
        <div className="absolute bottom-6 left-6 z-10 bg-slate-900/80 backdrop-blur-sm rounded-xl p-4 border border-cyan-500/30">
          <p className="text-cyan-400 text-xs font-bold mb-2">KONTROLLER</p>
          <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs">
            <div className="text-white">✊ Yumruk</div>
            <div className="text-red-400">→ Topla</div>
            <div className="text-white">🖐️ Açık</div>
            <div className="text-cyan-400">→ Dağıt</div>
            <div className="text-white">☝️ İşaret</div>
            <div className="text-cyan-400">→ İt</div>
          </div>
        </div>
      )}

      {/* Eğitim Modu - Ders İçeriği */}
      {educationMode && lessonContent && isRunning && (
        <motion.div 
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-24 right-6 z-10 w-96 bg-slate-900/90 backdrop-blur-sm rounded-2xl border border-indigo-500/50 p-6"
        >
          <div className="prose prose-invert prose-sm">
            <p className="text-white text-lg leading-relaxed">{lessonContent}</p>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-700">
            <p className="text-indigo-400 text-xs">💡 El hareketlerinle partikülleri kontrol ederken öğren!</p>
          </div>
        </motion.div>
      )}

      {/* Canvas */}
      <canvas ref={canvasRef} className="w-full h-full object-cover" />
      
      {/* Video - Arka plan veya köşe */}
      <video 
        ref={videoRef} 
        className={`
          ${videoPosition === 'hidden' ? 'hidden' : ''}
          ${videoPosition === 'corner' ? 'absolute bottom-24 left-6 w-64 h-48 object-cover rounded-2xl border-4 border-pink-500/50 shadow-2xl shadow-pink-500/30 z-10' : ''}
          ${videoPosition === 'background' ? 'absolute inset-0 w-full h-full object-cover opacity-30 z-0' : ''}
          transform scale-x-[-1]
        `}
        playsInline 
        muted 
      />
      
      {/* Video köşe overlay - glow efekti */}
      {videoPosition === 'corner' && isRunning && (
        <div className="absolute bottom-24 left-6 w-64 h-48 rounded-2xl border-4 border-pink-500 shadow-2xl shadow-pink-500/50 z-9 pointer-events-none animate-pulse" style={{ animationDuration: '2s' }} />
      )}

      {/* Start Screen */}
      {!isRunning && !isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/90">
          <div className="text-center">
            <motion.div
              animate={{ 
                scale: [1, 1.1, 1],
                rotate: [0, 5, -5, 0]
              }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-8xl mb-6"
            >
              ✨
            </motion.div>
            <h2 className="text-white font-black text-4xl mb-4">PARTICLE PLAYGROUND</h2>
            <p className="text-slate-400 mb-8">El hareketlerinle binlerce partiküle hükmet</p>
            
            <button
              onClick={start}
              className="px-8 py-4 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 rounded-2xl text-white font-bold text-xl transition-all transform hover:scale-105 flex items-center gap-3 mx-auto"
            >
              <Camera className="w-6 h-6" />
              BAŞLAT
            </button>

            {error && (
              <p className="text-red-400 mt-4">{error}</p>
            )}
          </div>
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/90">
          <div className="text-center">
            <Loader2 className="w-16 h-16 text-pink-500 animate-spin mx-auto mb-4" />
            <p className="text-white font-bold text-xl">Yükleniyor...</p>
          </div>
        </div>
      )}
    </div>
  )
}
