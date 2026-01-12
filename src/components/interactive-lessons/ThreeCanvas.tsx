'use client'

/**
 * 🎨 ThreeCanvas - Three.js Canvas Wrapper
 * 
 * React Three Fiber için temel canvas komponenti
 * - Orbit kontrolü
 * - Işıklandırma
 * - Responsive boyut
 */

import { Canvas } from '@react-three/fiber'
import { OrbitControls, PerspectiveCamera, Environment } from '@react-three/drei'
import { Suspense, ReactNode } from 'react'

interface ThreeCanvasProps {
  children: ReactNode
  className?: string
  cameraPosition?: [number, number, number]
  enableZoom?: boolean
  enablePan?: boolean
  enableRotate?: boolean
  backgroundColor?: string
  showGrid?: boolean
}

// Loading fallback
function CanvasLoader() {
  return (
    <mesh>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#6366f1" wireframe />
    </mesh>
  )
}

// Grid helper
function GridHelper() {
  return (
    <gridHelper 
      args={[20, 20, '#4a5568', '#2d3748']} 
      position={[0, -0.01, 0]} 
    />
  )
}

export default function ThreeCanvas({
  children,
  className = '',
  cameraPosition = [5, 5, 5],
  enableZoom = true,
  enablePan = false,
  enableRotate = true,
  backgroundColor = '#0f172a',
  showGrid = true
}: ThreeCanvasProps) {
  return (
    <div className={`w-full h-full min-h-[400px] rounded-xl overflow-hidden ${className}`}>
      <Canvas
        style={{ background: backgroundColor }}
        shadows
        dpr={[1, 2]}
      >
        <Suspense fallback={<CanvasLoader />}>
          {/* Kamera */}
          <PerspectiveCamera makeDefault position={cameraPosition} fov={50} />
          
          {/* Kontroller */}
          <OrbitControls
            enableZoom={enableZoom}
            enablePan={enablePan}
            enableRotate={enableRotate}
            autoRotate={false}
            minDistance={3}
            maxDistance={20}
          />
          
          {/* Işıklandırma */}
          <ambientLight intensity={0.4} />
          <directionalLight
            position={[10, 10, 5]}
            intensity={1}
            castShadow
            shadow-mapSize={[1024, 1024]}
          />
          <pointLight position={[-10, -10, -5]} intensity={0.5} color="#818cf8" />
          
          {/* Grid */}
          {showGrid && <GridHelper />}
          
          {/* Environment */}
          <Environment preset="city" />
          
          {/* İçerik */}
          {children}
        </Suspense>
      </Canvas>
    </div>
  )
}
