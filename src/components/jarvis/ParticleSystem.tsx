'use client'

import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

/**
 * ✨ Particle System
 * 
 * Dönen, patlayan, yüzen parçacıklar
 * Hologram efektini tamamlayan ambient parçacıklar
 */

interface ParticleSystemProps {
  count?: number
  color?: string
  size?: number
  spread?: number
  speed?: number
  type?: 'float' | 'orbit' | 'explode' | 'rain'
}

export default function ParticleSystem({
  count = 100,
  color = '#00ffff',
  size = 0.05,
  spread = 5,
  speed = 1,
  type = 'float'
}: ParticleSystemProps) {
  const pointsRef = useRef<THREE.Points>(null)
  const materialRef = useRef<THREE.PointsMaterial>(null)
  
  // Parçacık pozisyonları
  const { positions, velocities, initialPositions } = useMemo(() => {
    const positions = new Float32Array(count * 3)
    const velocities = new Float32Array(count * 3)
    const initialPositions = new Float32Array(count * 3)
    
    for (let i = 0; i < count; i++) {
      const i3 = i * 3
      
      if (type === 'orbit') {
        // Orbital pozisyonlar
        const angle = (i / count) * Math.PI * 2
        const radius = 2 + Math.random() * spread
        positions[i3] = Math.cos(angle) * radius
        positions[i3 + 1] = (Math.random() - 0.5) * 2
        positions[i3 + 2] = Math.sin(angle) * radius
      } else if (type === 'explode') {
        // Merkez
        positions[i3] = 0
        positions[i3 + 1] = 0
        positions[i3 + 2] = 0
        // Hız vektörleri
        velocities[i3] = (Math.random() - 0.5) * 2
        velocities[i3 + 1] = (Math.random() - 0.5) * 2
        velocities[i3 + 2] = (Math.random() - 0.5) * 2
      } else if (type === 'rain') {
        // Üstten yağmur
        positions[i3] = (Math.random() - 0.5) * spread * 2
        positions[i3 + 1] = Math.random() * spread
        positions[i3 + 2] = (Math.random() - 0.5) * spread * 2
        velocities[i3 + 1] = -Math.random() * 0.5 - 0.5
      } else {
        // Float - rastgele
        positions[i3] = (Math.random() - 0.5) * spread * 2
        positions[i3 + 1] = (Math.random() - 0.5) * spread * 2
        positions[i3 + 2] = (Math.random() - 0.5) * spread * 2
      }
      
      initialPositions[i3] = positions[i3]
      initialPositions[i3 + 1] = positions[i3 + 1]
      initialPositions[i3 + 2] = positions[i3 + 2]
    }
    
    return { positions, velocities, initialPositions }
  }, [count, spread, type])
  
  // Animasyon
  useFrame((state) => {
    if (!pointsRef.current) return
    
    const positions = pointsRef.current.geometry.attributes.position.array as Float32Array
    const time = state.clock.elapsedTime * speed
    
    for (let i = 0; i < count; i++) {
      const i3 = i * 3
      
      if (type === 'orbit') {
        // Orbital hareket
        const angle = (i / count) * Math.PI * 2 + time * 0.5
        const radius = 2 + Math.sin(time + i) * 0.5
        positions[i3] = Math.cos(angle) * radius
        positions[i3 + 1] = initialPositions[i3 + 1] + Math.sin(time * 2 + i) * 0.3
        positions[i3 + 2] = Math.sin(angle) * radius
      } else if (type === 'explode') {
        // Patlama efekti (loop)
        const t = (time % 3) / 3 // 3 saniyede bir reset
        positions[i3] = velocities[i3] * t * spread
        positions[i3 + 1] = velocities[i3 + 1] * t * spread
        positions[i3 + 2] = velocities[i3 + 2] * t * spread
      } else if (type === 'rain') {
        // Yağmur
        positions[i3 + 1] += velocities[i3 + 1] * 0.1
        if (positions[i3 + 1] < -spread / 2) {
          positions[i3 + 1] = spread / 2
        }
      } else {
        // Float - yavaş hareket
        positions[i3] = initialPositions[i3] + Math.sin(time + i) * 0.2
        positions[i3 + 1] = initialPositions[i3 + 1] + Math.cos(time * 0.5 + i) * 0.3
        positions[i3 + 2] = initialPositions[i3 + 2] + Math.sin(time * 0.7 + i) * 0.2
      }
    }
    
    pointsRef.current.geometry.attributes.position.needsUpdate = true
    
    // Fade in/out
    if (materialRef.current) {
      materialRef.current.opacity = 0.6 + Math.sin(time * 2) * 0.2
    }
  })
  
  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        ref={materialRef}
        size={size}
        color={color}
        transparent
        opacity={0.8}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        sizeAttenuation
      />
    </points>
  )
}

/**
 * Sparkle Effect - Parlayan yıldızlar
 */
export function SparkleParticles({
  count = 50,
  color = '#ffffff',
  spread = 3
}: {
  count?: number
  color?: string
  spread?: number
}) {
  const pointsRef = useRef<THREE.Points>(null)
  
  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * spread * 2
      pos[i * 3 + 1] = (Math.random() - 0.5) * spread * 2
      pos[i * 3 + 2] = (Math.random() - 0.5) * spread * 2
    }
    return pos
  }, [count, spread])
  
  const sizes = useMemo(() => {
    const s = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      s[i] = Math.random() * 0.1 + 0.02
    }
    return s
  }, [count])
  
  useFrame((state) => {
    if (!pointsRef.current) return
    
    const time = state.clock.elapsedTime
    const posArray = pointsRef.current.geometry.attributes.position.array as Float32Array
    
    for (let i = 0; i < count; i++) {
      const i3 = i * 3
      // Twinkle efekti
      posArray[i3 + 1] += Math.sin(time * 3 + i) * 0.002
    }
    
    pointsRef.current.geometry.attributes.position.needsUpdate = true
  })
  
  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.05}
        color={color}
        transparent
        opacity={0.9}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  )
}

/**
 * Energy Ring - Enerji halkası
 */
export function EnergyRing({
  radius = 2,
  tubeRadius = 0.02,
  color = '#00ffff',
  rotationSpeed = 1
}: {
  radius?: number
  tubeRadius?: number
  color?: string
  rotationSpeed?: number
}) {
  const ringRef = useRef<THREE.Mesh>(null)
  
  useFrame((state) => {
    if (ringRef.current) {
      ringRef.current.rotation.z = state.clock.elapsedTime * rotationSpeed
      ringRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.5) * 0.2
    }
  })
  
  return (
    <mesh ref={ringRef}>
      <torusGeometry args={[radius, tubeRadius, 16, 100]} />
      <meshBasicMaterial
        color={color}
        transparent
        opacity={0.6}
      />
    </mesh>
  )
}

/**
 * DNA Helix Particles - DNA sarmalı
 */
export function DNAHelix({
  height = 4,
  radius = 1,
  color1 = '#00ffff',
  color2 = '#ff00ff'
}: {
  height?: number
  radius?: number
  color1?: string
  color2?: string
}) {
  const groupRef = useRef<THREE.Group>(null)
  const particleCount = 100
  
  const { positions1, positions2 } = useMemo(() => {
    const pos1 = new Float32Array(particleCount * 3)
    const pos2 = new Float32Array(particleCount * 3)
    
    for (let i = 0; i < particleCount; i++) {
      const t = i / particleCount
      const y = (t - 0.5) * height
      const angle = t * Math.PI * 4
      
      // Helix 1
      pos1[i * 3] = Math.cos(angle) * radius
      pos1[i * 3 + 1] = y
      pos1[i * 3 + 2] = Math.sin(angle) * radius
      
      // Helix 2 (180 derece offset)
      pos2[i * 3] = Math.cos(angle + Math.PI) * radius
      pos2[i * 3 + 1] = y
      pos2[i * 3 + 2] = Math.sin(angle + Math.PI) * radius
    }
    
    return { positions1: pos1, positions2: pos2 }
  }, [height, radius])
  
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.5
    }
  })
  
  return (
    <group ref={groupRef}>
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" count={particleCount} array={positions1} itemSize={3} />
        </bufferGeometry>
        <pointsMaterial size={0.08} color={color1} transparent opacity={0.8} blending={THREE.AdditiveBlending} />
      </points>
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" count={particleCount} array={positions2} itemSize={3} />
        </bufferGeometry>
        <pointsMaterial size={0.08} color={color2} transparent opacity={0.8} blending={THREE.AdditiveBlending} />
      </points>
    </group>
  )
}
