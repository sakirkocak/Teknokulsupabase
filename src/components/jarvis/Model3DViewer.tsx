'use client'

/**
 * 🎨 JARVIS 3D Model Viewer
 * GLB/GLTF modellerini yükleyip gösterir
 * El takibi ile etkileşimli kontrol
 */

import { useRef, useState, useEffect, Suspense } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, Environment, Html, useGLTF, Center } from '@react-three/drei'
import * as THREE from 'three'
import { Model3D, getModelById, PLACEHOLDER_MODEL, getModelUrl } from '@/lib/jarvis/model-registry'

// ============================================
// GLTF MODEL COMPONENT
// ============================================

interface ModelProps {
  modelData: Model3D
  highlights?: string[] // Vurgulanacak parçalar
  labels?: Record<string, string> // Parça -> Etiket eşleşmesi
  autoRotate?: boolean
  onPartClick?: (partName: string) => void
}

function GLTFModel({ modelData, highlights = [], labels = {}, autoRotate = true, onPartClick }: ModelProps) {
  const groupRef = useRef<THREE.Group>(null)
  const modelPath = getModelUrl(modelData.path)
  const { scene, animations } = useGLTF(modelPath)
  const [mixer, setMixer] = useState<THREE.AnimationMixer | null>(null)
  
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
  
  // Her frame'de animasyonu güncelle
  useFrame((state, delta) => {
    if (mixer) {
      mixer.update(delta)
    }
    
    // Auto rotate
    if (autoRotate && groupRef.current) {
      groupRef.current.rotation.y += 0.003
    }
  })
  
  // Parçaları vurgula
  useEffect(() => {
    scene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const partName = child.name.toLowerCase()
        const isHighlighted = highlights.some(h => partName.includes(h.toLowerCase()))
        
        if (isHighlighted && child.material) {
          // Vurgulu parçayı parlat
          const material = child.material as THREE.MeshStandardMaterial
          if (material.emissive) {
            material.emissive = new THREE.Color(0x06b6d4)
            material.emissiveIntensity = 0.5
          }
        }
      }
    })
  }, [scene, highlights])
  
  const scale = modelData.defaultScale || 1
  const position = modelData.defaultPosition || [0, 0, 0]
  
  return (
    <group ref={groupRef} position={position as [number, number, number]}>
      <primitive 
        object={scene.clone()} 
        scale={[scale, scale, scale]}
        onClick={(e: any) => {
          e.stopPropagation()
          const partName = e.object?.name
          if (partName && onPartClick) {
            onPartClick(partName)
          }
        }}
      />
      
      {/* Etiketler */}
      {Object.entries(labels).map(([partName, label]) => {
        // Parçanın pozisyonunu bul (basitleştirilmiş)
        let partPosition: [number, number, number] = [0, 2, 0]
        scene.traverse((child) => {
          if (child.name.toLowerCase().includes(partName.toLowerCase())) {
            const worldPos = new THREE.Vector3()
            child.getWorldPosition(worldPos)
            partPosition = [worldPos.x, worldPos.y + 0.5, worldPos.z]
          }
        })
        
        return (
          <Html key={partName} position={partPosition} center>
            <div className="bg-slate-900/90 text-cyan-400 text-xs px-2 py-1 rounded-lg border border-cyan-500/50 whitespace-nowrap">
              {label}
            </div>
          </Html>
        )
      })}
    </group>
  )
}

// ============================================
// PLACEHOLDER (Model yüklenirken)
// ============================================

function PlaceholderModel() {
  const meshRef = useRef<THREE.Mesh>(null)
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.01
      meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime) * 0.1
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
          opacity={0.5}
        />
      </mesh>
      <Html position={[0, 2.5, 0]} center>
        <div className="text-cyan-400 text-sm font-bold bg-slate-900/80 px-3 py-2 rounded-lg animate-pulse">
          🔄 Model Yükleniyor...
        </div>
      </Html>
    </group>
  )
}

// ============================================
// FALLBACK (Model bulunamadı)
// ============================================

function FallbackModel({ message }: { message: string }) {
  const meshRef = useRef<THREE.Group>(null)
  
  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.005
    }
  })
  
  return (
    <group ref={meshRef}>
      {/* Yörüngedeki küreler */}
      {[...Array(6)].map((_, i) => {
        const angle = (i / 6) * Math.PI * 2
        return (
          <mesh key={i} position={[Math.cos(angle) * 2.5, Math.sin(angle) * 0.5, Math.sin(angle) * 2.5]}>
            <sphereGeometry args={[0.3, 16, 16]} />
            <meshStandardMaterial color={['#8b5cf6', '#f59e0b', '#10b981', '#ef4444', '#ec4899', '#06b6d4'][i]} />
          </mesh>
        )
      })}
      <mesh>
        <sphereGeometry args={[1, 32, 32]} />
        <meshStandardMaterial color="#06b6d4" transparent opacity={0.3} />
      </mesh>
      <Html position={[0, 3, 0]} center>
        <div className="text-cyan-400 text-lg font-bold bg-slate-900/80 px-3 py-2 rounded-lg">
          🎯 {message}
        </div>
      </Html>
    </group>
  )
}

// ============================================
// ANA COMPONENT
// ============================================

interface Model3DViewerProps {
  modelId?: string
  modelPath?: string
  highlights?: string[]
  labels?: Record<string, string>
  autoRotate?: boolean
  fallbackMessage?: string
  onPartClick?: (partName: string) => void
  className?: string
}

export default function Model3DViewer({
  modelId,
  modelPath,
  highlights = [],
  labels = {},
  autoRotate = true,
  fallbackMessage = 'Çözüm Adımları',
  onPartClick,
  className = ''
}: Model3DViewerProps) {
  const [modelData, setModelData] = useState<Model3D | null>(null)
  const [modelExists, setModelExists] = useState<boolean | null>(null)
  const [error, setError] = useState<string | null>(null)
  
  // Model verisini yükle
  useEffect(() => {
    if (modelId) {
      const data = getModelById(modelId)
      if (data) {
        setModelData(data)
        // Model dosyasının varlığını kontrol et (Supabase Storage)
        fetch(getModelUrl(data.path), { method: 'HEAD' })
          .then(res => setModelExists(res.ok))
          .catch(() => setModelExists(false))
      } else {
        setError(`Model bulunamadı: ${modelId}`)
        setModelExists(false)
      }
    } else if (modelPath) {
      // Direkt path verilmişse
      setModelData({
        ...PLACEHOLDER_MODEL,
        path: modelPath
      })
      fetch(modelPath, { method: 'HEAD' })
        .then(res => setModelExists(res.ok))
        .catch(() => setModelExists(false))
    } else {
      setModelExists(false)
    }
  }, [modelId, modelPath])
  
  return (
    <div className={`w-full h-full ${className}`}>
      <Canvas camera={{ position: [0, 2, 6], fov: 50 }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <pointLight position={[-10, -10, -10]} intensity={0.5} color="#06b6d4" />
        <spotLight position={[0, 10, 0]} angle={0.3} penumbra={1} intensity={0.5} />
        
        <Suspense fallback={<PlaceholderModel />}>
          {modelExists === null ? (
            <PlaceholderModel />
          ) : modelExists && modelData ? (
            <Center>
              <GLTFModel
                modelData={modelData}
                highlights={highlights}
                labels={labels}
                autoRotate={autoRotate}
                onPartClick={onPartClick}
              />
            </Center>
          ) : (
            <FallbackModel message={fallbackMessage} />
          )}
        </Suspense>
        
        <OrbitControls 
          enableZoom={true}
          enablePan={false}
          minDistance={2}
          maxDistance={15}
          autoRotate={false}
        />
        <Environment preset="night" />
      </Canvas>
    </div>
  )
}

// ============================================
// PRELOAD UTILITY
// ============================================

/**
 * Modeli önceden yükle (performans için)
 */
export function preloadModel(modelPath: string) {
  useGLTF.preload(modelPath)
}
