'use client'

/**
 * 📐 InteractiveTriangle - 3D İnteraktif Üçgen
 * 
 * Öğrenci üçgenin köşelerini sürükleyerek:
 * - Alanın nasıl değiştiğini görür
 * - Taban ve yüksekliği anlar
 * - Formülü pratik yapar
 */

import { useRef, useState, useEffect, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html, Line } from '@react-three/drei'
import * as THREE from 'three'

interface TriangleVertex {
  x: number
  y: number
  z: number
}

interface InteractiveTriangleProps {
  initialVertices?: [TriangleVertex, TriangleVertex, TriangleVertex]
  color?: string
  showMeasurements?: boolean
  showHeight?: boolean
  showFormula?: boolean
  onAreaChange?: (area: number, base: number, height: number) => void
  highlightVertex?: number | null
  animateHeight?: boolean
}

// Vertex marker (köşe noktası)
function VertexMarker({ 
  position, 
  label, 
  color = '#fbbf24',
  isHighlighted = false 
}: { 
  position: [number, number, number]
  label: string
  color?: string
  isHighlighted?: boolean
}) {
  const meshRef = useRef<THREE.Mesh>(null)
  
  useFrame((state) => {
    if (meshRef.current && isHighlighted) {
      meshRef.current.scale.setScalar(1 + Math.sin(state.clock.elapsedTime * 3) * 0.2)
    }
  })

  return (
    <group position={position}>
      <mesh ref={meshRef}>
        <sphereGeometry args={[0.15, 16, 16]} />
        <meshStandardMaterial 
          color={isHighlighted ? '#f97316' : color} 
          emissive={isHighlighted ? '#f97316' : color}
          emissiveIntensity={isHighlighted ? 0.5 : 0.2}
        />
      </mesh>
      <Html distanceFactor={10} position={[0, 0.4, 0]}>
        <div className={`px-2 py-0.5 rounded text-xs font-bold ${isHighlighted ? 'bg-orange-500 text-white' : 'bg-slate-800 text-white'}`}>
          {label}
        </div>
      </Html>
    </group>
  )
}

// Ölçü göstergesi
function MeasurementLabel({ 
  start, 
  end, 
  label,
  color = '#60a5fa'
}: { 
  start: [number, number, number]
  end: [number, number, number]
  label: string
  color?: string
}) {
  const midpoint: [number, number, number] = [
    (start[0] + end[0]) / 2,
    (start[1] + end[1]) / 2 + 0.3,
    (start[2] + end[2]) / 2
  ]

  return (
    <Html distanceFactor={10} position={midpoint}>
      <div className="px-2 py-1 bg-slate-900/90 border border-blue-500/50 rounded text-xs text-blue-300 font-mono whitespace-nowrap">
        {label}
      </div>
    </Html>
  )
}

export default function InteractiveTriangle({
  initialVertices = [
    { x: -2, y: 0, z: 0 },
    { x: 2, y: 0, z: 0 },
    { x: 0, y: 0, z: 3 }
  ],
  color = '#6366f1',
  showMeasurements = true,
  showHeight = true,
  showFormula = true,
  onAreaChange,
  highlightVertex = null,
  animateHeight = false
}: InteractiveTriangleProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const [vertices, setVertices] = useState(initialVertices)
  const [heightAnimProgress, setHeightAnimProgress] = useState(0)

  // Üçgen hesaplamaları
  const calculations = useMemo(() => {
    const [A, B, C] = vertices
    
    // Taban uzunluğu (A-B arası)
    const base = Math.sqrt(
      Math.pow(B.x - A.x, 2) + 
      Math.pow(B.y - A.y, 2) + 
      Math.pow(B.z - A.z, 2)
    )
    
    // C noktasından tabana olan yükseklik
    // Basitleştirilmiş: Z ekseni boyunca mesafe
    const height = Math.abs(C.z)
    
    // Alan = (taban × yükseklik) / 2
    const area = (base * height) / 2

    return { base, height, area }
  }, [vertices])

  // Alan değişikliğini bildir
  useEffect(() => {
    onAreaChange?.(calculations.area, calculations.base, calculations.height)
  }, [calculations, onAreaChange])

  // Yükseklik animasyonu
  useFrame((state) => {
    if (animateHeight) {
      setHeightAnimProgress((Math.sin(state.clock.elapsedTime * 2) + 1) / 2)
    }
  })

  // Üçgen geometry
  const geometry = useMemo(() => {
    const geom = new THREE.BufferGeometry()
    const [A, B, C] = vertices
    
    // Vertices
    const positions = new Float32Array([
      A.x, A.y, A.z,
      B.x, B.y, B.z,
      C.x, C.y, C.z
    ])
    
    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geom.computeVertexNormals()
    
    return geom
  }, [vertices])

  // Kenar çizgileri
  const edgePoints: [THREE.Vector3, THREE.Vector3, THREE.Vector3, THREE.Vector3] = useMemo(() => {
    const [A, B, C] = vertices
    return [
      new THREE.Vector3(A.x, A.y, A.z),
      new THREE.Vector3(B.x, B.y, B.z),
      new THREE.Vector3(C.x, C.y, C.z),
      new THREE.Vector3(A.x, A.y, A.z) // Kapalı çizgi için
    ]
  }, [vertices])

  // Yükseklik çizgisi
  const heightLine = useMemo(() => {
    const [A, B, C] = vertices
    const midBase = { x: (A.x + B.x) / 2, y: (A.y + B.y) / 2, z: (A.z + B.z) / 2 }
    
    // C'den tabana dik çizgi (basitleştirilmiş)
    const heightStart = new THREE.Vector3(C.x, C.y, C.z)
    const heightEnd = new THREE.Vector3(C.x, C.y, 0)
    
    return { start: heightStart, end: heightEnd, midBase }
  }, [vertices])

  return (
    <group>
      {/* Üçgen yüzeyi */}
      <mesh ref={meshRef} geometry={geometry}>
        <meshStandardMaterial 
          color={color} 
          side={THREE.DoubleSide}
          transparent
          opacity={0.8}
          metalness={0.1}
          roughness={0.5}
        />
      </mesh>

      {/* Kenar çizgileri */}
      <Line
        points={edgePoints}
        color="#fbbf24"
        lineWidth={3}
      />

      {/* Köşe noktaları */}
      <VertexMarker 
        position={[vertices[0].x, vertices[0].y, vertices[0].z]} 
        label="A"
        isHighlighted={highlightVertex === 0}
      />
      <VertexMarker 
        position={[vertices[1].x, vertices[1].y, vertices[1].z]} 
        label="B"
        isHighlighted={highlightVertex === 1}
      />
      <VertexMarker 
        position={[vertices[2].x, vertices[2].y, vertices[2].z]} 
        label="C"
        color="#10b981"
        isHighlighted={highlightVertex === 2}
      />

      {/* Yükseklik çizgisi */}
      {showHeight && (
        <>
          <Line
            points={[heightLine.start, heightLine.end]}
            color="#ef4444"
            lineWidth={2}
            dashed
            dashSize={0.2}
            gapSize={0.1}
          />
          {/* Yükseklik etiketi */}
          <Html 
            distanceFactor={10} 
            position={[
              heightLine.start.x + 0.5, 
              heightLine.start.y, 
              heightLine.start.z / 2
            ]}
          >
            <div className="px-2 py-1 bg-red-500/90 rounded text-xs text-white font-bold">
              h = {calculations.height.toFixed(1)} cm
            </div>
          </Html>
        </>
      )}

      {/* Ölçümler */}
      {showMeasurements && (
        <>
          {/* Taban ölçüsü */}
          <MeasurementLabel
            start={[vertices[0].x, vertices[0].y, vertices[0].z]}
            end={[vertices[1].x, vertices[1].y, vertices[1].z]}
            label={`Taban = ${calculations.base.toFixed(1)} cm`}
            color="#60a5fa"
          />
        </>
      )}

      {/* Alan formülü */}
      {showFormula && (
        <Html distanceFactor={15} position={[0, 2, 0]}>
          <div className="px-4 py-3 bg-gradient-to-br from-indigo-900/95 to-purple-900/95 border border-indigo-500/50 rounded-xl text-center shadow-xl">
            <div className="text-xs text-indigo-300 mb-1">Alan Formülü</div>
            <div className="text-lg text-white font-mono">
              A = <span className="text-blue-400">{calculations.base.toFixed(1)}</span> × <span className="text-red-400">{calculations.height.toFixed(1)}</span> ÷ 2
            </div>
            <div className="text-2xl font-bold text-emerald-400 mt-1">
              = {calculations.area.toFixed(1)} cm²
            </div>
          </div>
        </Html>
      )}
    </group>
  )
}
