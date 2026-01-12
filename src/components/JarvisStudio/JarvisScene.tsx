'use client'

import { useRef, Suspense, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Text, Float, MeshDistortMaterial, Sparkles } from '@react-three/drei'
import * as THREE from 'three'

// ===== ATOM MODEL =====
function AtomModel() {
  const groupRef = useRef<THREE.Group>(null)
  const electron1Ref = useRef<THREE.Mesh>(null)
  const electron2Ref = useRef<THREE.Mesh>(null)
  const electron3Ref = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.2
    }
    // Elektronlar dönsün
    const t = state.clock.elapsedTime
    if (electron1Ref.current) {
      electron1Ref.current.position.x = Math.cos(t * 2) * 1.5
      electron1Ref.current.position.z = Math.sin(t * 2) * 1.5
    }
    if (electron2Ref.current) {
      electron2Ref.current.position.x = Math.cos(t * 2.5 + 2) * 1.8
      electron2Ref.current.position.y = Math.sin(t * 2.5 + 2) * 1.8
    }
    if (electron3Ref.current) {
      electron3Ref.current.position.z = Math.cos(t * 3 + 4) * 1.6
      electron3Ref.current.position.y = Math.sin(t * 3 + 4) * 1.6
    }
  })

  return (
    <group ref={groupRef}>
      {/* Çekirdek */}
      <mesh>
        <sphereGeometry args={[0.5, 32, 32]} />
        <meshStandardMaterial color="#00ffff" emissive="#00ffff" emissiveIntensity={0.5} />
      </mesh>
      {/* Protonlar */}
      <mesh position={[0.15, 0.1, 0]}>
        <sphereGeometry args={[0.15, 16, 16]} />
        <meshStandardMaterial color="#ff0066" emissive="#ff0066" emissiveIntensity={0.5} />
      </mesh>
      <mesh position={[-0.15, -0.1, 0.1]}>
        <sphereGeometry args={[0.15, 16, 16]} />
        <meshStandardMaterial color="#ff0066" emissive="#ff0066" emissiveIntensity={0.5} />
      </mesh>
      {/* Yörüngeler */}
      <mesh rotation={[0, 0, 0]}>
        <torusGeometry args={[1.5, 0.01, 16, 100]} />
        <meshBasicMaterial color="#00ffff" transparent opacity={0.3} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.8, 0.01, 16, 100]} />
        <meshBasicMaterial color="#00ffff" transparent opacity={0.3} />
      </mesh>
      <mesh rotation={[0, Math.PI / 2, Math.PI / 4]}>
        <torusGeometry args={[1.6, 0.01, 16, 100]} />
        <meshBasicMaterial color="#00ffff" transparent opacity={0.3} />
      </mesh>
      {/* Elektronlar */}
      <mesh ref={electron1Ref}>
        <sphereGeometry args={[0.1, 16, 16]} />
        <meshStandardMaterial color="#ffff00" emissive="#ffff00" emissiveIntensity={1} />
      </mesh>
      <mesh ref={electron2Ref}>
        <sphereGeometry args={[0.1, 16, 16]} />
        <meshStandardMaterial color="#ffff00" emissive="#ffff00" emissiveIntensity={1} />
      </mesh>
      <mesh ref={electron3Ref}>
        <sphereGeometry args={[0.1, 16, 16]} />
        <meshStandardMaterial color="#ffff00" emissive="#ffff00" emissiveIntensity={1} />
      </mesh>
    </group>
  )
}

// ===== MATH FORMULA =====
function MathFormula() {
  const groupRef = useRef<THREE.Group>(null)

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.3
      groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.1
    }
  })

  return (
    <group ref={groupRef}>
      <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
        <Text
          fontSize={0.4}
          color="#00ffff"
          anchorX="center"
          anchorY="middle"
          font="/fonts/inter-bold.woff"
        >
          E = mc²
        </Text>
      </Float>
      {/* Dekoratif çemberler */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <torusGeometry args={[1.2, 0.02, 16, 100]} />
        <meshBasicMaterial color="#00ffff" transparent opacity={0.5} />
      </mesh>
    </group>
  )
}

// ===== TRIANGLE (Geometry) =====
function TriangleModel() {
  const meshRef = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.3
      meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.2) * 0.1
    }
  })

  const shape = useMemo(() => {
    const s = new THREE.Shape()
    s.moveTo(0, 1)
    s.lineTo(-1, -0.5)
    s.lineTo(1, -0.5)
    s.lineTo(0, 1)
    return s
  }, [])

  return (
    <group>
      <mesh ref={meshRef}>
        <shapeGeometry args={[shape]} />
        <meshStandardMaterial color="#00ffff" side={THREE.DoubleSide} wireframe />
      </mesh>
      {/* Köşe noktaları */}
      <mesh position={[0, 1, 0]}><sphereGeometry args={[0.08]} /><meshStandardMaterial color="#ff0066" emissive="#ff0066" /></mesh>
      <mesh position={[-1, -0.5, 0]}><sphereGeometry args={[0.08]} /><meshStandardMaterial color="#ff0066" emissive="#ff0066" /></mesh>
      <mesh position={[1, -0.5, 0]}><sphereGeometry args={[0.08]} /><meshStandardMaterial color="#ff0066" emissive="#ff0066" /></mesh>
    </group>
  )
}

// ===== CUBE (Prizma) =====
function CubeModel() {
  const meshRef = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = state.clock.elapsedTime * 0.3
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.4
    }
  })

  return (
    <mesh ref={meshRef}>
      <boxGeometry args={[1.5, 1.5, 1.5]} />
      <meshStandardMaterial color="#00ffff" wireframe transparent opacity={0.8} />
    </mesh>
  )
}

// ===== SPHERE (Küre/Dünya) =====
function SphereModel() {
  const meshRef = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.2
    }
  })

  return (
    <group>
      <mesh ref={meshRef}>
        <sphereGeometry args={[1, 32, 32]} />
        <MeshDistortMaterial color="#00ffff" wireframe distort={0.2} speed={2} />
      </mesh>
      {/* Ekvator */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.05, 0.02, 16, 100]} />
        <meshBasicMaterial color="#ff0066" />
      </mesh>
    </group>
  )
}

// ===== CELL (Hücre) =====
function CellModel() {
  const groupRef = useRef<THREE.Group>(null)

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.15
    }
  })

  return (
    <group ref={groupRef}>
      {/* Hücre zarı */}
      <mesh>
        <sphereGeometry args={[1, 32, 32]} />
        <meshStandardMaterial color="#00ffff" transparent opacity={0.3} side={THREE.DoubleSide} />
      </mesh>
      {/* Çekirdek */}
      <mesh position={[0.2, 0, 0]}>
        <sphereGeometry args={[0.4, 32, 32]} />
        <meshStandardMaterial color="#ff0066" emissive="#ff0066" emissiveIntensity={0.3} />
      </mesh>
      {/* Mitokondri */}
      <mesh position={[-0.5, 0.3, 0.2]} rotation={[0, 0, 0.5]}>
        <capsuleGeometry args={[0.1, 0.3, 8, 16]} />
        <meshStandardMaterial color="#00ff88" emissive="#00ff88" emissiveIntensity={0.3} />
      </mesh>
      <mesh position={[0.4, -0.4, -0.3]} rotation={[0.3, 0.5, 0]}>
        <capsuleGeometry args={[0.08, 0.25, 8, 16]} />
        <meshStandardMaterial color="#00ff88" emissive="#00ff88" emissiveIntensity={0.3} />
      </mesh>
      {/* ER */}
      <mesh position={[-0.3, -0.3, 0.4]}>
        <torusGeometry args={[0.15, 0.03, 8, 32]} />
        <meshStandardMaterial color="#ffaa00" />
      </mesh>
    </group>
  )
}

// ===== ROBOT =====
function RobotModel() {
  const groupRef = useRef<THREE.Group>(null)
  const armRef = useRef<THREE.Group>(null)

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.2
    }
    if (armRef.current) {
      armRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 2) * 0.3
    }
  })

  return (
    <group ref={groupRef}>
      {/* Gövde */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[0.8, 1, 0.5]} />
        <meshStandardMaterial color="#00ffff" wireframe />
      </mesh>
      {/* Kafa */}
      <mesh position={[0, 0.8, 0]}>
        <boxGeometry args={[0.5, 0.4, 0.4]} />
        <meshStandardMaterial color="#00ffff" wireframe />
      </mesh>
      {/* Gözler */}
      <mesh position={[-0.12, 0.85, 0.21]}>
        <sphereGeometry args={[0.08]} />
        <meshStandardMaterial color="#ff0066" emissive="#ff0066" emissiveIntensity={1} />
      </mesh>
      <mesh position={[0.12, 0.85, 0.21]}>
        <sphereGeometry args={[0.08]} />
        <meshStandardMaterial color="#ff0066" emissive="#ff0066" emissiveIntensity={1} />
      </mesh>
      {/* Kol */}
      <group ref={armRef} position={[0.6, 0.2, 0]}>
        <mesh position={[0.25, 0, 0]}>
          <boxGeometry args={[0.5, 0.15, 0.15]} />
          <meshStandardMaterial color="#00ffff" wireframe />
        </mesh>
        <mesh position={[0.6, 0, 0]}>
          <boxGeometry args={[0.3, 0.12, 0.12]} />
          <meshStandardMaterial color="#00ffff" wireframe />
        </mesh>
      </group>
      {/* Sol kol */}
      <group position={[-0.6, 0.2, 0]}>
        <mesh position={[-0.25, 0, 0]}>
          <boxGeometry args={[0.5, 0.15, 0.15]} />
          <meshStandardMaterial color="#00ffff" wireframe />
        </mesh>
      </group>
    </group>
  )
}

// ===== DNA =====
function DNAModel() {
  const groupRef = useRef<THREE.Group>(null)

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.3
    }
  })

  const helixPoints = useMemo(() => {
    const points = []
    for (let i = 0; i < 50; i++) {
      const t = i * 0.2
      points.push({
        x1: Math.cos(t) * 0.5,
        x2: Math.cos(t + Math.PI) * 0.5,
        y: t * 0.15 - 1.5,
        z1: Math.sin(t) * 0.5,
        z2: Math.sin(t + Math.PI) * 0.5
      })
    }
    return points
  }, [])

  return (
    <group ref={groupRef}>
      {helixPoints.map((p, i) => (
        <group key={i}>
          <mesh position={[p.x1, p.y, p.z1]}>
            <sphereGeometry args={[0.06]} />
            <meshStandardMaterial color="#00ffff" emissive="#00ffff" emissiveIntensity={0.5} />
          </mesh>
          <mesh position={[p.x2, p.y, p.z2]}>
            <sphereGeometry args={[0.06]} />
            <meshStandardMaterial color="#ff0066" emissive="#ff0066" emissiveIntensity={0.5} />
          </mesh>
          {i % 5 === 0 && (
            <mesh position={[(p.x1 + p.x2) / 2, p.y, (p.z1 + p.z2) / 2]}>
              <cylinderGeometry args={[0.02, 0.02, 1, 8]} />
              <meshBasicMaterial color="#ffff00" transparent opacity={0.5} />
            </mesh>
          )}
        </group>
      ))}
    </group>
  )
}

// ===== DEFAULT (Icosahedron) =====
function DefaultModel() {
  const meshRef = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.3
      meshRef.current.rotation.x = state.clock.elapsedTime * 0.2
      meshRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.1
    }
  })

  return (
    <mesh ref={meshRef}>
      <icosahedronGeometry args={[1, 1]} />
      <meshStandardMaterial color="#00ffff" wireframe transparent opacity={0.8} emissive="#00ffff" emissiveIntensity={0.2} />
    </mesh>
  )
}

// ===== PARTICLES =====
function Particles({ count = 100 }: { count?: number }) {
  const pointsRef = useRef<THREE.Points>(null)
  
  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 10
      pos[i * 3 + 1] = (Math.random() - 0.5) * 10
      pos[i * 3 + 2] = (Math.random() - 0.5) * 10
    }
    return pos
  }, [count])

  useFrame((state) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y = state.clock.elapsedTime * 0.02
    }
  })

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.03} color="#00ffff" transparent opacity={0.6} sizeAttenuation />
    </points>
  )
}

// ===== GRID =====
function Grid() {
  return <gridHelper args={[20, 40, '#00ffff', '#0066ff']} position={[0, -2, 0]} />
}

// ===== MODEL SELECTOR =====
function HologramModel({ type }: { type: string }) {
  switch (type) {
    case 'atom':
    case 'molekül':
      return <AtomModel />
    case 'cell':
    case 'hücre':
      return <CellModel />
    case 'dna':
      return <DNAModel />
    case 'triangle':
    case 'üçgen':
      return <TriangleModel />
    case 'cube':
    case 'küp':
    case 'prizma':
      return <CubeModel />
    case 'sphere':
    case 'küre':
    case 'dünya':
      return <SphereModel />
    case 'robot':
    case 'robotik':
      return <RobotModel />
    case 'math':
    case 'formül':
    case 'denklem':
      return <MathFormula />
    default:
      return <DefaultModel />
  }
}

// ===== SCENE CONTENT =====
function SceneContent({ modelType }: { modelType: string }) {
  return (
    <>
      <ambientLight intensity={0.3} />
      <pointLight position={[10, 10, 10]} intensity={0.5} color="#00ffff" />
      <pointLight position={[-10, -10, -10]} intensity={0.3} color="#ff00ff" />
      <spotLight position={[0, 5, 0]} intensity={0.5} color="#ffffff" angle={0.5} />
      
      <Grid />
      <Particles count={150} />
      <Sparkles count={50} scale={5} size={2} speed={0.4} color="#00ffff" />
      
      <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.3}>
        <HologramModel type={modelType} />
      </Float>
      
      <OrbitControls
        enablePan={false}
        enableZoom={true}
        minDistance={3}
        maxDistance={10}
        autoRotate={false}
      />
    </>
  )
}

// ===== MAIN COMPONENT =====
interface JarvisSceneProps {
  modelType?: string
  className?: string
}

export default function JarvisScene({ modelType = 'default', className = '' }: JarvisSceneProps) {
  return (
    <div className={`relative ${className}`}>
      <Canvas
        camera={{ position: [0, 2, 5], fov: 50 }}
        gl={{ antialias: true, alpha: true }}
      >
        <color attach="background" args={['#0a0a1a']} />
        <fog attach="fog" args={['#0a0a1a', 5, 20]} />
        <Suspense fallback={null}>
          <SceneContent modelType={modelType} />
        </Suspense>
      </Canvas>
      
      {/* Scan line effect */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/5 via-transparent to-cyan-500/5 animate-pulse" />
        <div 
          className="absolute w-full h-px bg-cyan-400/30"
          style={{ 
            animation: 'scanline 3s linear infinite',
            top: '0%'
          }} 
        />
      </div>
      
      {/* Overlay gradient */}
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-slate-950 via-transparent to-transparent" />
      
      <style jsx>{`
        @keyframes scanline {
          0% { top: 0%; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
      `}</style>
    </div>
  )
}
