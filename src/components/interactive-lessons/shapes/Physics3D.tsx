'use client'

import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html, Line } from '@react-three/drei'
import * as THREE from 'three'

// ============================================
// 🎯 KUVVET VEKTÖRÜ
// ============================================

interface ForceVectorProps {
  magnitude?: number
  angle?: number // derece
  color?: string
  label?: string
  position?: [number, number, number]
}

export function ForceVector({ 
  magnitude = 3, 
  angle = 0, 
  color = '#ef4444',
  label = 'F',
  position = [0, 0, 0]
}: ForceVectorProps) {
  const groupRef = useRef<THREE.Group>(null)
  const angleRad = (angle * Math.PI) / 180
  
  // Ok ucu koordinatları
  const endX = Math.cos(angleRad) * magnitude
  const endY = Math.sin(angleRad) * magnitude
  
  // Ok başı (üçgen)
  const arrowSize = 0.3
  const arrowAngle = Math.PI / 6 // 30 derece
  
  const arrowPoints = [
    new THREE.Vector3(endX, endY, 0),
    new THREE.Vector3(
      endX - arrowSize * Math.cos(angleRad - arrowAngle),
      endY - arrowSize * Math.sin(angleRad - arrowAngle),
      0
    ),
    new THREE.Vector3(
      endX - arrowSize * Math.cos(angleRad + arrowAngle),
      endY - arrowSize * Math.sin(angleRad + arrowAngle),
      0
    ),
    new THREE.Vector3(endX, endY, 0),
  ]

  return (
    <group ref={groupRef} position={position}>
      {/* Ana çizgi */}
      <Line
        points={[[0, 0, 0], [endX * 0.85, endY * 0.85, 0]]}
        color={color}
        lineWidth={4}
      />
      
      {/* Ok başı */}
      <Line points={arrowPoints} color={color} lineWidth={4} />
      
      {/* Başlangıç noktası */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[0.15, 16, 16]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} />
      </mesh>
      
      {/* Etiket */}
      <Html position={[endX / 2 + 0.3, endY / 2 + 0.3, 0]} center>
        <div className={`px-2 py-1 rounded-lg text-white text-sm font-bold whitespace-nowrap`}
          style={{ backgroundColor: color }}>
          {label} = {magnitude.toFixed(1)} N
        </div>
      </Html>
      
      {/* Açı göstergesi */}
      {angle !== 0 && (
        <Html position={[0.8, 0.3, 0]} center>
          <div className="px-2 py-1 bg-slate-700/90 rounded text-white text-xs">
            θ = {angle}°
          </div>
        </Html>
      )}
    </group>
  )
}

// ============================================
// 🚗 HAREKETLİ CİSİM
// ============================================

interface MotionProps {
  initialPosition?: number
  velocity?: number
  showPath?: boolean
  isAnimating?: boolean
}

export function Motion({
  initialPosition = -3,
  velocity = 1,
  showPath = true,
  isAnimating = true
}: MotionProps) {
  const carRef = useRef<THREE.Group>(null)
  const positionRef = useRef(initialPosition)
  
  useFrame((_, delta) => {
    if (!carRef.current || !isAnimating) return
    
    positionRef.current += velocity * delta
    
    // Sınırları kontrol et
    if (positionRef.current > 5) positionRef.current = -5
    if (positionRef.current < -5) positionRef.current = 5
    
    carRef.current.position.x = positionRef.current
  })

  return (
    <group>
      {/* Yol */}
      {showPath && (
        <>
          <Line
            points={[[-5, 0, 0], [5, 0, 0]]}
            color="#64748b"
            lineWidth={2}
            dashed
          />
          {/* Mesafe işaretleri */}
          {[-4, -2, 0, 2, 4].map((x) => (
            <group key={x} position={[x, 0, 0]}>
              <Line points={[[0, -0.2, 0], [0, 0.2, 0]]} color="#64748b" lineWidth={2} />
              <Html position={[0, -0.5, 0]} center>
                <span className="text-xs text-slate-400">{x}m</span>
              </Html>
            </group>
          ))}
        </>
      )}
      
      {/* Araba */}
      <group ref={carRef} position={[initialPosition, 0.4, 0]}>
        {/* Gövde */}
        <mesh>
          <boxGeometry args={[0.8, 0.3, 0.4]} />
          <meshStandardMaterial color="#f59e0b" />
        </mesh>
        {/* Kabin */}
        <mesh position={[0, 0.25, 0]}>
          <boxGeometry args={[0.4, 0.25, 0.35]} />
          <meshStandardMaterial color="#fbbf24" />
        </mesh>
        {/* Tekerlekler */}
        {[-0.25, 0.25].map((x) => (
          <mesh key={x} position={[x, -0.15, 0.25]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.12, 0.12, 0.1, 16]} />
            <meshStandardMaterial color="#1f2937" />
          </mesh>
        ))}
      </group>
      
      {/* Hız bilgisi */}
      <Html position={[0, 1.5, 0]} center>
        <div className="px-4 py-2 bg-orange-500/90 rounded-xl text-white font-bold">
          <div className="text-xs opacity-80">Hız</div>
          <div className="text-xl">v = {velocity.toFixed(1)} m/s</div>
        </div>
      </Html>
    </group>
  )
}

// ============================================
// 🔌 ELEKTRİK DEVRESİ
// ============================================

interface CircuitProps {
  voltage?: number
  resistance?: number
  showCurrent?: boolean
}

export function Circuit({
  voltage = 12,
  resistance = 4,
  showCurrent = true
}: CircuitProps) {
  const current = voltage / resistance
  
  return (
    <group>
      {/* Devre çerçevesi */}
      <Line
        points={[
          [-2, 1, 0], [2, 1, 0], [2, -1, 0], [-2, -1, 0], [-2, 1, 0]
        ]}
        color="#64748b"
        lineWidth={3}
      />
      
      {/* Pil (üst) */}
      <group position={[0, 1, 0]}>
        <Line points={[[-0.3, 0, 0], [-0.3, 0.3, 0]]} color="#22c55e" lineWidth={4} />
        <Line points={[[0.3, 0, 0], [0.3, 0.15, 0]]} color="#22c55e" lineWidth={4} />
        <Html position={[0, 0.6, 0]} center>
          <div className="px-2 py-1 bg-green-500/90 rounded text-white text-xs font-bold">
            {voltage}V
          </div>
        </Html>
      </group>
      
      {/* Direnç (alt) */}
      <group position={[0, -1, 0]}>
        <mesh>
          <boxGeometry args={[0.8, 0.2, 0.2]} />
          <meshStandardMaterial color="#f59e0b" />
        </mesh>
        <Html position={[0, -0.5, 0]} center>
          <div className="px-2 py-1 bg-amber-500/90 rounded text-white text-xs font-bold">
            R = {resistance}Ω
          </div>
        </Html>
      </group>
      
      {/* Akım göstergesi */}
      {showCurrent && (
        <>
          {/* Akım okları */}
          <Html position={[2.5, 0, 0]} center>
            <div className="text-2xl">→</div>
          </Html>
          <Html position={[-2.5, 0, 0]} center>
            <div className="text-2xl">←</div>
          </Html>
          
          {/* Akım değeri */}
          <Html position={[0, 0, 0.5]} center>
            <div className="px-4 py-3 bg-blue-500/90 rounded-xl text-white font-bold text-center">
              <div className="text-xs opacity-80">Akım (I = V/R)</div>
              <div className="text-xl">{current.toFixed(1)} A</div>
            </div>
          </Html>
        </>
      )}
    </group>
  )
}

// ============================================
// 🌊 DALGA
// ============================================

interface WaveProps {
  amplitude?: number
  frequency?: number
  wavelength?: number
  color?: string
}

export function Wave({
  amplitude = 1,
  frequency = 1,
  wavelength = 2,
  color = '#06b6d4'
}: WaveProps) {
  const lineRef = useRef<any>(null)
  const timeRef = useRef(0)
  
  useFrame((_, delta) => {
    timeRef.current += delta * frequency * 2
    
    if (lineRef.current) {
      const points: THREE.Vector3[] = []
      for (let x = -5; x <= 5; x += 0.1) {
        const y = amplitude * Math.sin((2 * Math.PI * x) / wavelength + timeRef.current)
        points.push(new THREE.Vector3(x, y, 0))
      }
      lineRef.current.geometry.setFromPoints(points)
    }
  })

  // Initial points
  const initialPoints: THREE.Vector3[] = []
  for (let x = -5; x <= 5; x += 0.1) {
    const y = amplitude * Math.sin((2 * Math.PI * x) / wavelength)
    initialPoints.push(new THREE.Vector3(x, y, 0))
  }

  return (
    <group>
      {/* Dalga */}
      <line ref={lineRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={initialPoints.length}
            array={new Float32Array(initialPoints.flatMap(p => [p.x, p.y, p.z]))}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial color={color} linewidth={3} />
      </line>
      
      {/* Eksen */}
      <Line points={[[-5, 0, 0], [5, 0, 0]]} color="#64748b" lineWidth={1} dashed />
      
      {/* Genlik göstergesi */}
      <Line points={[[0, 0, 0], [0, amplitude, 0]]} color="#f472b6" lineWidth={2} />
      <Html position={[0.5, amplitude / 2, 0]} center>
        <div className="px-2 py-1 bg-pink-500/90 rounded text-white text-xs font-bold">
          A = {amplitude}m
        </div>
      </Html>
      
      {/* Dalga boyu göstergesi */}
      <Line points={[[0, -amplitude - 0.3, 0], [wavelength, -amplitude - 0.3, 0]]} color="#a855f7" lineWidth={2} />
      <Html position={[wavelength / 2, -amplitude - 0.6, 0]} center>
        <div className="px-2 py-1 bg-purple-500/90 rounded text-white text-xs font-bold">
          λ = {wavelength}m
        </div>
      </Html>
      
      {/* Bilgi kutusu */}
      <Html position={[0, 2.5, 0]} center>
        <div className="px-4 py-2 bg-cyan-500/90 rounded-xl text-white font-bold">
          <div className="text-xs opacity-80">Frekans</div>
          <div className="text-lg">f = {frequency} Hz</div>
        </div>
      </Html>
    </group>
  )
}

// ============================================
// 🕰️ SARKAÇ
// ============================================

interface PendulumProps {
  length?: number
  initialAngle?: number // derece
  isSwinging?: boolean
}

export function Pendulum({
  length = 2,
  initialAngle = 30,
  isSwinging = true
}: PendulumProps) {
  const bobRef = useRef<THREE.Group>(null)
  const angleRef = useRef((initialAngle * Math.PI) / 180)
  const velocityRef = useRef(0)
  const g = 9.81
  
  useFrame((_, delta) => {
    if (!bobRef.current || !isSwinging) return
    
    // Basit harmonik hareket
    const acceleration = -(g / length) * Math.sin(angleRef.current)
    velocityRef.current += acceleration * delta
    velocityRef.current *= 0.999 // Sönümleme
    angleRef.current += velocityRef.current * delta
    
    const x = Math.sin(angleRef.current) * length
    const y = -Math.cos(angleRef.current) * length
    
    bobRef.current.position.set(x, y, 0)
  })

  const initialX = Math.sin((initialAngle * Math.PI) / 180) * length
  const initialY = -Math.cos((initialAngle * Math.PI) / 180) * length
  
  // Periyot hesabı
  const period = 2 * Math.PI * Math.sqrt(length / g)

  return (
    <group position={[0, 3, 0]}>
      {/* Sabitleme noktası */}
      <mesh>
        <sphereGeometry args={[0.1, 16, 16]} />
        <meshStandardMaterial color="#64748b" />
      </mesh>
      
      {/* İp ve top */}
      <group ref={bobRef} position={[initialX, initialY, 0]}>
        {/* İp (dinamik çizilecek) */}
        <Line
          points={[[0, 0, 0], [-initialX, -initialY + length, 0]]}
          color="#94a3b8"
          lineWidth={2}
        />
        
        {/* Top */}
        <mesh>
          <sphereGeometry args={[0.25, 32, 32]} />
          <meshStandardMaterial color="#8b5cf6" emissive="#8b5cf6" emissiveIntensity={0.3} />
        </mesh>
      </group>
      
      {/* Uzunluk göstergesi */}
      <Html position={[-1.5, -length / 2, 0]} center>
        <div className="px-2 py-1 bg-violet-500/90 rounded text-white text-xs font-bold">
          L = {length}m
        </div>
      </Html>
      
      {/* Periyot bilgisi */}
      <Html position={[0, 1, 0]} center>
        <div className="px-4 py-2 bg-slate-800/90 rounded-xl text-white font-bold">
          <div className="text-xs opacity-80">Periyot</div>
          <div className="text-lg">T = {period.toFixed(2)}s</div>
          <div className="text-xs opacity-60 mt-1">T = 2π√(L/g)</div>
        </div>
      </Html>
    </group>
  )
}

// Default export
export default { ForceVector, Motion, Circuit, Wave, Pendulum }
