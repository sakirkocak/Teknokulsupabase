'use client'

import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

/**
 * 🌀 Hologram Effect
 * 
 * Scan lines, glitch, glow efektleri ile futuristik hologram görünümü
 * Three.js shader material kullanır
 */

interface HologramEffectProps {
  children: React.ReactNode
  color?: string
  intensity?: number
  scanLineSpeed?: number
  glitchIntensity?: number
  flickerSpeed?: number
}

// Hologram Shader
const hologramVertexShader = `
  varying vec2 vUv;
  varying vec3 vPosition;
  varying vec3 vNormal;
  
  void main() {
    vUv = uv;
    vPosition = position;
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const hologramFragmentShader = `
  uniform float uTime;
  uniform vec3 uColor;
  uniform float uIntensity;
  uniform float uScanLineSpeed;
  uniform float uGlitchIntensity;
  
  varying vec2 vUv;
  varying vec3 vPosition;
  varying vec3 vNormal;
  
  // Random function
  float random(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
  }
  
  void main() {
    // Base color with fresnel effect
    float fresnel = pow(1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0))), 2.0);
    vec3 color = uColor * (0.5 + fresnel * 0.5);
    
    // Scan lines
    float scanLine = sin(vPosition.y * 50.0 + uTime * uScanLineSpeed) * 0.5 + 0.5;
    scanLine = pow(scanLine, 8.0) * 0.3;
    
    // Horizontal scan line (moving)
    float movingScan = smoothstep(0.0, 0.1, fract(vUv.y - uTime * 0.1)) * 
                       smoothstep(0.2, 0.1, fract(vUv.y - uTime * 0.1));
    
    // Glitch effect
    float glitch = 0.0;
    if (uGlitchIntensity > 0.0) {
      float glitchTime = floor(uTime * 10.0);
      float glitchRandom = random(vec2(glitchTime, vUv.y * 10.0));
      if (glitchRandom > 0.95) {
        glitch = random(vec2(uTime, vUv.y)) * uGlitchIntensity;
      }
    }
    
    // Flicker
    float flicker = 0.95 + 0.05 * sin(uTime * 30.0);
    
    // Combine effects
    float alpha = (0.3 + scanLine + movingScan * 0.5 + fresnel * 0.4) * uIntensity * flicker;
    alpha = clamp(alpha + glitch, 0.0, 1.0);
    
    // Edge glow
    float edge = fresnel * 0.8;
    color += uColor * edge;
    
    gl_FragColor = vec4(color, alpha);
  }
`

export function HologramMaterial({
  color = '#00ffff',
  intensity = 1.0,
  scanLineSpeed = 3.0,
  glitchIntensity = 0.1
}: Omit<HologramEffectProps, 'children'>) {
  const materialRef = useRef<THREE.ShaderMaterial>(null)
  
  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uColor: { value: new THREE.Color(color) },
    uIntensity: { value: intensity },
    uScanLineSpeed: { value: scanLineSpeed },
    uGlitchIntensity: { value: glitchIntensity }
  }), [color, intensity, scanLineSpeed, glitchIntensity])
  
  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.elapsedTime
    }
  })
  
  return (
    <shaderMaterial
      ref={materialRef}
      vertexShader={hologramVertexShader}
      fragmentShader={hologramFragmentShader}
      uniforms={uniforms}
      transparent
      side={THREE.DoubleSide}
      depthWrite={false}
      blending={THREE.AdditiveBlending}
    />
  )
}

/**
 * Hologram Wrapper - Çocuk mesh'e hologram efekti uygular
 */
export default function HologramEffect({
  children,
  color = '#00ffff',
  intensity = 1.0,
  scanLineSpeed = 3.0,
  glitchIntensity = 0.1
}: HologramEffectProps) {
  const groupRef = useRef<THREE.Group>(null)
  
  // Hover animasyonu
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.1
    }
  })
  
  return (
    <group ref={groupRef}>
      {children}
      
      {/* Hologram glow ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.5, 0]}>
        <ringGeometry args={[1.5, 2, 64]} />
        <meshBasicMaterial 
          color={color} 
          transparent 
          opacity={0.3}
          side={THREE.DoubleSide}
        />
      </mesh>
      
      {/* Base platform glow */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.5, 0]}>
        <circleGeometry args={[1.5, 64]} />
        <meshBasicMaterial 
          color={color} 
          transparent 
          opacity={0.1}
        />
      </mesh>
    </group>
  )
}

/**
 * Hologram Box - Test için basit hologram kutu
 */
export function HologramBox({ size = 1, color = '#00ffff' }: { size?: number, color?: string }) {
  const meshRef = useRef<THREE.Mesh>(null)
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.5
    }
  })
  
  return (
    <mesh ref={meshRef}>
      <boxGeometry args={[size, size, size]} />
      <HologramMaterial color={color} intensity={0.8} glitchIntensity={0.05} />
    </mesh>
  )
}

/**
 * Hologram Sphere - Atom/molekül temsili için
 */
export function HologramSphere({ radius = 1, color = '#00ffff' }: { radius?: number, color?: string }) {
  const meshRef = useRef<THREE.Mesh>(null)
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.3
      meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.2) * 0.1
    }
  })
  
  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[radius, 32, 32]} />
      <HologramMaterial color={color} intensity={0.7} scanLineSpeed={5} />
    </mesh>
  )
}

/**
 * Wireframe Grid - Hologram zemin efekti
 */
export function HologramGrid({ size = 10, divisions = 20, color = '#00ffff' }: {
  size?: number
  divisions?: number
  color?: string
}) {
  const gridRef = useRef<THREE.GridHelper>(null)
  
  useFrame((state) => {
    if (gridRef.current) {
      // Grid scroll efekti
      gridRef.current.position.z = (state.clock.elapsedTime * 0.5) % (size / divisions)
    }
  })
  
  return (
    <gridHelper 
      ref={gridRef}
      args={[size, divisions, color, color]} 
      position={[0, -2, 0]}
    />
  )
}
