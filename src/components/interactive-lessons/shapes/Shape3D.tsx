'use client'

import { useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html, Line } from '@react-three/drei'
import * as THREE from 'three'

// Global state referansları (JarvisEducation'dan gelecek)
declare global {
  var globalIsGrabbing: boolean
  var globalIsPinching: boolean
  var globalActiveCorner: number | null
  var globalFilteredScale: number
  var globalHandX: number
  var globalHandY: number
  var globalPositionX: number
  var globalPositionY: number
  var globalHandRotation: number
  var globalPinchStartRotation: number
  var globalRotationOffset: number
}

export type ShapeType = 'triangle' | 'square' | 'rectangle' | 'circle'

interface ShapeProps {
  type: ShapeType
  // Boyutlar
  base?: number
  height?: number
  side?: number      // Kare için
  width?: number     // Dikdörtgen için
  radius?: number    // Daire için
  // Callbacks
  onDimensionChange?: (dimensions: any) => void
}

// ============================================
// 🔺 ÜÇGEN
// ============================================
function Triangle({ base = 4, height = 3, onDimensionChange }: { base: number, height: number, onDimensionChange?: (d: any) => void }) {
  const area = (base * height) / 2
  
  const vertices = [
    new THREE.Vector3(-base/2, 0, 0),
    new THREE.Vector3(base/2, 0, 0),
    new THREE.Vector3(0, height, 0),
  ]

  return (
    <group>
      {/* Yüzey */}
      <mesh>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={3}
            array={new Float32Array([...vertices[0].toArray(), ...vertices[1].toArray(), ...vertices[2].toArray()])}
            itemSize={3}
          />
        </bufferGeometry>
        <meshStandardMaterial color="#06b6d4" transparent opacity={0.4} side={THREE.DoubleSide} emissive="#06b6d4" emissiveIntensity={0.3} />
      </mesh>
      
      {/* Kenarlar */}
      <Line points={[...vertices, vertices[0]]} color="#06b6d4" lineWidth={4} />
      
      {/* Köşeler */}
      {vertices.map((v, i) => (
        <mesh key={i} position={v}>
          <sphereGeometry args={[0.18, 16, 16]} />
          <meshStandardMaterial color={i === 2 ? '#f472b6' : '#06b6d4'} emissive={i === 2 ? '#f472b6' : '#06b6d4'} emissiveIntensity={0.8} />
        </mesh>
      ))}
      
      {/* Etiketler */}
      <Html position={[0, -0.8, 0]} center>
        <div className="px-3 py-1.5 bg-cyan-500/90 rounded-lg text-white text-sm font-bold whitespace-nowrap">
          Taban: {base.toFixed(1)} cm
        </div>
      </Html>
      <Html position={[base/2 + 0.8, height/2, 0]} center>
        <div className="px-3 py-1.5 bg-yellow-500/90 rounded-lg text-white text-sm font-bold whitespace-nowrap">
          h = {height.toFixed(1)} cm
        </div>
      </Html>
      <Html position={[0, height/3, 0.5]} center>
        <div className="px-5 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold whitespace-nowrap shadow-2xl">
          <div className="text-xs opacity-80">Alan</div>
          <div className="text-2xl">{area.toFixed(1)} cm²</div>
          <div className="text-xs opacity-60 mt-1">({base.toFixed(1)} × {height.toFixed(1)}) ÷ 2</div>
        </div>
      </Html>
    </group>
  )
}

// ============================================
// 🟦 KARE
// ============================================
function Square({ side = 4, onDimensionChange }: { side: number, onDimensionChange?: (d: any) => void }) {
  const area = side * side
  const perimeter = side * 4
  
  const vertices = [
    new THREE.Vector3(-side/2, 0, 0),
    new THREE.Vector3(side/2, 0, 0),
    new THREE.Vector3(side/2, side, 0),
    new THREE.Vector3(-side/2, side, 0),
  ]

  return (
    <group>
      {/* Yüzey */}
      <mesh position={[0, side/2, 0]}>
        <planeGeometry args={[side, side]} />
        <meshStandardMaterial color="#22c55e" transparent opacity={0.4} side={THREE.DoubleSide} emissive="#22c55e" emissiveIntensity={0.3} />
      </mesh>
      
      {/* Kenarlar */}
      <Line points={[...vertices, vertices[0]]} color="#22c55e" lineWidth={4} />
      
      {/* Köşeler */}
      {vertices.map((v, i) => (
        <mesh key={i} position={v}>
          <sphereGeometry args={[0.18, 16, 16]} />
          <meshStandardMaterial color="#22c55e" emissive="#22c55e" emissiveIntensity={0.8} />
        </mesh>
      ))}
      
      {/* Etiketler */}
      <Html position={[0, -0.8, 0]} center>
        <div className="px-3 py-1.5 bg-green-500/90 rounded-lg text-white text-sm font-bold whitespace-nowrap">
          Kenar: {side.toFixed(1)} cm
        </div>
      </Html>
      <Html position={[side/2 + 1, side/2, 0]} center>
        <div className="px-3 py-1.5 bg-green-500/90 rounded-lg text-white text-sm font-bold whitespace-nowrap">
          a = {side.toFixed(1)} cm
        </div>
      </Html>
      <Html position={[0, side/2, 0.5]} center>
        <div className="px-5 py-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold whitespace-nowrap shadow-2xl">
          <div className="text-xs opacity-80">Alan</div>
          <div className="text-2xl">{area.toFixed(1)} cm²</div>
          <div className="text-xs opacity-60 mt-1">a² = {side.toFixed(1)}²</div>
          <div className="text-xs opacity-60 mt-1 border-t border-white/20 pt-1">Çevre: {perimeter.toFixed(1)} cm</div>
        </div>
      </Html>
    </group>
  )
}

// ============================================
// 🟩 DİKDÖRTGEN
// ============================================
function Rectangle({ width = 5, height = 3, onDimensionChange }: { width: number, height: number, onDimensionChange?: (d: any) => void }) {
  const area = width * height
  const perimeter = 2 * (width + height)
  
  const vertices = [
    new THREE.Vector3(-width/2, 0, 0),
    new THREE.Vector3(width/2, 0, 0),
    new THREE.Vector3(width/2, height, 0),
    new THREE.Vector3(-width/2, height, 0),
  ]

  return (
    <group>
      {/* Yüzey */}
      <mesh position={[0, height/2, 0]}>
        <planeGeometry args={[width, height]} />
        <meshStandardMaterial color="#f59e0b" transparent opacity={0.4} side={THREE.DoubleSide} emissive="#f59e0b" emissiveIntensity={0.3} />
      </mesh>
      
      {/* Kenarlar */}
      <Line points={[...vertices, vertices[0]]} color="#f59e0b" lineWidth={4} />
      
      {/* Köşeler */}
      {vertices.map((v, i) => (
        <mesh key={i} position={v}>
          <sphereGeometry args={[0.18, 16, 16]} />
          <meshStandardMaterial color="#f59e0b" emissive="#f59e0b" emissiveIntensity={0.8} />
        </mesh>
      ))}
      
      {/* Etiketler */}
      <Html position={[0, -0.8, 0]} center>
        <div className="px-3 py-1.5 bg-amber-500/90 rounded-lg text-white text-sm font-bold whitespace-nowrap">
          Uzun kenar: {width.toFixed(1)} cm
        </div>
      </Html>
      <Html position={[width/2 + 1, height/2, 0]} center>
        <div className="px-3 py-1.5 bg-amber-500/90 rounded-lg text-white text-sm font-bold whitespace-nowrap">
          Kısa: {height.toFixed(1)} cm
        </div>
      </Html>
      <Html position={[0, height/2, 0.5]} center>
        <div className="px-5 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold whitespace-nowrap shadow-2xl">
          <div className="text-xs opacity-80">Alan</div>
          <div className="text-2xl">{area.toFixed(1)} cm²</div>
          <div className="text-xs opacity-60 mt-1">a × b = {width.toFixed(1)} × {height.toFixed(1)}</div>
          <div className="text-xs opacity-60 mt-1 border-t border-white/20 pt-1">Çevre: {perimeter.toFixed(1)} cm</div>
        </div>
      </Html>
    </group>
  )
}

// ============================================
// 🔵 DAİRE
// ============================================
function Circle({ radius = 2, onDimensionChange }: { radius: number, onDimensionChange?: (d: any) => void }) {
  const area = Math.PI * radius * radius
  const circumference = 2 * Math.PI * radius
  const diameter = radius * 2
  
  // Daire noktaları
  const segments = 64
  const points: THREE.Vector3[] = []
  for (let i = 0; i <= segments; i++) {
    const angle = (i / segments) * Math.PI * 2
    points.push(new THREE.Vector3(Math.cos(angle) * radius, Math.sin(angle) * radius + radius, 0))
  }

  return (
    <group>
      {/* Yüzey */}
      <mesh position={[0, radius, 0]}>
        <circleGeometry args={[radius, 64]} />
        <meshStandardMaterial color="#8b5cf6" transparent opacity={0.4} side={THREE.DoubleSide} emissive="#8b5cf6" emissiveIntensity={0.3} />
      </mesh>
      
      {/* Çevre */}
      <Line points={points} color="#8b5cf6" lineWidth={4} />
      
      {/* Merkez noktası */}
      <mesh position={[0, radius, 0]}>
        <sphereGeometry args={[0.15, 16, 16]} />
        <meshStandardMaterial color="#fff" emissive="#fff" emissiveIntensity={1} />
      </mesh>
      
      {/* Yarıçap çizgisi */}
      <Line 
        points={[new THREE.Vector3(0, radius, 0), new THREE.Vector3(radius, radius, 0)]} 
        color="#ec4899" 
        lineWidth={3}
        dashed
      />
      
      {/* Çap çizgisi */}
      <Line 
        points={[new THREE.Vector3(-radius, radius, 0), new THREE.Vector3(radius, radius, 0)]} 
        color="#06b6d4" 
        lineWidth={2}
        dashed
      />
      
      {/* Etiketler */}
      <Html position={[radius/2, radius - 0.5, 0]} center>
        <div className="px-2 py-1 bg-pink-500/90 rounded-lg text-white text-xs font-bold whitespace-nowrap">
          r = {radius.toFixed(1)} cm
        </div>
      </Html>
      <Html position={[0, radius + radius + 0.8, 0]} center>
        <div className="px-3 py-1.5 bg-cyan-500/90 rounded-lg text-white text-sm font-bold whitespace-nowrap">
          Çap: {diameter.toFixed(1)} cm
        </div>
      </Html>
      <Html position={[0, radius, 0.5]} center>
        <div className="px-5 py-3 rounded-xl bg-gradient-to-r from-violet-500 to-purple-500 text-white font-bold whitespace-nowrap shadow-2xl">
          <div className="text-xs opacity-80">Alan</div>
          <div className="text-2xl">{area.toFixed(1)} cm²</div>
          <div className="text-xs opacity-60 mt-1">πr² = π × {radius.toFixed(1)}²</div>
          <div className="text-xs opacity-60 mt-1 border-t border-white/20 pt-1">Çevre: {circumference.toFixed(1)} cm</div>
        </div>
      </Html>
    </group>
  )
}

// ============================================
// 🎯 ANA SHAPE COMPONENT
// ============================================
export default function Shape3D({ 
  type, 
  base = 4, 
  height = 3, 
  side = 4, 
  width = 5, 
  radius = 2,
  onDimensionChange 
}: ShapeProps) {
  const meshRef = useRef<THREE.Group>(null)
  const [scale, setScale] = useState(1)
  const posXRef = useRef(0)
  const posYRef = useRef(1.5)
  const rotYRef = useRef(0)

  useFrame(() => {
    if (!meshRef.current) return

    // Global state'lerden pozisyon al
    const isGrabbing = globalThis.globalIsGrabbing || false
    const isPinching = globalThis.globalIsPinching || false
    const posX = globalThis.globalPositionX || 0
    const posY = globalThis.globalPositionY || 1.5
    const filteredScale = globalThis.globalFilteredScale || 1
    const rotationOffset = globalThis.globalRotationOffset || 0
    const handRotation = globalThis.globalHandRotation || 0
    const pinchStartRotation = globalThis.globalPinchStartRotation || 0

    // Smooth pozisyon
    posXRef.current += (posX - posXRef.current) * 0.15
    posYRef.current += (posY - posYRef.current) * 0.15

    meshRef.current.position.x = posXRef.current
    meshRef.current.position.y = posYRef.current

    // Pinch zoom
    if (isPinching) {
      setScale(filteredScale)
      const deltaRotation = (handRotation - pinchStartRotation) * 2
      rotYRef.current = rotationOffset + deltaRotation
    } else {
      rotYRef.current += (rotationOffset - rotYRef.current) * 0.1
    }

    meshRef.current.rotation.y = rotYRef.current
    meshRef.current.scale.setScalar(scale)
  })

  return (
    <group ref={meshRef}>
      {type === 'triangle' && <Triangle base={base} height={height} onDimensionChange={onDimensionChange} />}
      {type === 'square' && <Square side={side} onDimensionChange={onDimensionChange} />}
      {type === 'rectangle' && <Rectangle width={width} height={height} onDimensionChange={onDimensionChange} />}
      {type === 'circle' && <Circle radius={radius} onDimensionChange={onDimensionChange} />}
    </group>
  )
}

// Shape bilgileri
export const ShapeInfo: Record<ShapeType, { name: string; icon: string; color: string; formula: string }> = {
  triangle: { name: 'Üçgen', icon: '🔺', color: 'cyan', formula: 'A = (t × h) / 2' },
  square: { name: 'Kare', icon: '🟩', color: 'green', formula: 'A = a²' },
  rectangle: { name: 'Dikdörtgen', icon: '🟧', color: 'amber', formula: 'A = a × b' },
  circle: { name: 'Daire', icon: '🔵', color: 'violet', formula: 'A = πr²' },
}
