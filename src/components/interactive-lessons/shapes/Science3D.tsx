'use client'

import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html, Line } from '@react-three/drei'
import * as THREE from 'three'

// ============================================
// ⚛️ ATOM MODELİ (Bohr)
// ============================================

interface AtomProps {
  element?: string
  protons?: number
  neutrons?: number
  electrons?: number
  showLabels?: boolean
}

export function Atom({
  element = 'C',
  protons = 6,
  neutrons = 6,
  electrons = 6,
  showLabels = true
}: AtomProps) {
  const electronRefs = useRef<THREE.Mesh[]>([])
  const orbitAngles = useRef<number[]>(Array(electrons).fill(0).map((_, i) => (i * Math.PI * 2) / Math.max(electrons, 1)))
  
  // Elektron yörüngeleri (Bohr modeli basitleştirilmiş)
  const orbits = [2, 8, 8, 18, 18, 32] // Her yörüngedeki max elektron
  const orbitRadii = [1, 1.8, 2.6, 3.4, 4.2, 5]
  
  // Elektronları yörüngelere dağıt
  const electronDistribution: Array<{ orbit: number; index: number }> = []
  let remaining = electrons
  for (let o = 0; o < orbits.length && remaining > 0; o++) {
    const count = Math.min(remaining, orbits[o])
    for (let i = 0; i < count; i++) {
      electronDistribution.push({ orbit: o, index: i })
    }
    remaining -= count
  }

  useFrame((_, delta) => {
    electronDistribution.forEach((e, idx) => {
      orbitAngles.current[idx] += delta * (2 - e.orbit * 0.3) // Dış yörüngeler daha yavaş
      
      const ref = electronRefs.current[idx]
      if (ref) {
        const radius = orbitRadii[e.orbit]
        const electronsInOrbit = electronDistribution.filter(x => x.orbit === e.orbit).length
        const angleOffset = (e.index * Math.PI * 2) / electronsInOrbit
        
        ref.position.x = Math.cos(orbitAngles.current[idx] + angleOffset) * radius
        ref.position.y = Math.sin(orbitAngles.current[idx] + angleOffset) * radius
      }
    })
  })

  // Yörünge sayısı
  const usedOrbits = new Set(electronDistribution.map(e => e.orbit))

  return (
    <group>
      {/* Çekirdek */}
      <mesh>
        <sphereGeometry args={[0.5, 32, 32]} />
        <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={0.5} />
      </mesh>
      
      {/* Çekirdek içi (proton + nötron) gösterimi */}
      {showLabels && (
        <Html position={[0, 0, 0.6]} center>
          <div className="px-2 py-1 bg-red-500 rounded-full text-white text-xs font-bold">
            {protons}p+ {neutrons}n
          </div>
        </Html>
      )}
      
      {/* Yörüngeler */}
      {Array.from(usedOrbits).map((orbitIdx) => {
        const radius = orbitRadii[orbitIdx]
        const points: THREE.Vector3[] = []
        for (let i = 0; i <= 64; i++) {
          const angle = (i / 64) * Math.PI * 2
          points.push(new THREE.Vector3(Math.cos(angle) * radius, Math.sin(angle) * radius, 0))
        }
        return (
          <Line
            key={orbitIdx}
            points={points}
            color="#64748b"
            lineWidth={1}
            transparent
            opacity={0.5}
          />
        )
      })}
      
      {/* Elektronlar */}
      {electronDistribution.map((e, idx) => (
        <mesh
          key={idx}
          ref={(el) => { if (el) electronRefs.current[idx] = el }}
          position={[orbitRadii[e.orbit], 0, 0]}
        >
          <sphereGeometry args={[0.12, 16, 16]} />
          <meshStandardMaterial color="#3b82f6" emissive="#3b82f6" emissiveIntensity={0.8} />
        </mesh>
      ))}
      
      {/* Element etiketi */}
      {showLabels && (
        <Html position={[0, -orbitRadii[Math.max(...Array.from(usedOrbits))] - 0.8, 0]} center>
          <div className="px-4 py-2 bg-slate-800/90 rounded-xl text-white font-bold text-center">
            <div className="text-2xl">{element}</div>
            <div className="text-xs opacity-70">{protons} proton • {electrons} elektron</div>
          </div>
        </Html>
      )}
    </group>
  )
}

// ============================================
// 🧬 MOLEKÜL
// ============================================

interface MoleculeProps {
  formula?: string
  atoms?: Array<{ element: string; x: number; y: number; z: number; color: string }>
  bonds?: Array<{ from: number; to: number; type: 'single' | 'double' | 'triple' }>
}

const ELEMENT_COLORS: Record<string, string> = {
  H: '#ffffff',
  C: '#333333',
  N: '#3b82f6',
  O: '#ef4444',
  S: '#eab308',
  P: '#f97316',
  Cl: '#22c55e',
}

// Hazır moleküller
const MOLECULES: Record<string, { atoms: MoleculeProps['atoms']; bonds: MoleculeProps['bonds'] }> = {
  H2O: {
    atoms: [
      { element: 'O', x: 0, y: 0, z: 0, color: '#ef4444' },
      { element: 'H', x: -0.8, y: 0.6, z: 0, color: '#ffffff' },
      { element: 'H', x: 0.8, y: 0.6, z: 0, color: '#ffffff' },
    ],
    bonds: [
      { from: 0, to: 1, type: 'single' },
      { from: 0, to: 2, type: 'single' },
    ]
  },
  CO2: {
    atoms: [
      { element: 'C', x: 0, y: 0, z: 0, color: '#333333' },
      { element: 'O', x: -1.2, y: 0, z: 0, color: '#ef4444' },
      { element: 'O', x: 1.2, y: 0, z: 0, color: '#ef4444' },
    ],
    bonds: [
      { from: 0, to: 1, type: 'double' },
      { from: 0, to: 2, type: 'double' },
    ]
  },
  CH4: {
    atoms: [
      { element: 'C', x: 0, y: 0, z: 0, color: '#333333' },
      { element: 'H', x: 0.9, y: 0.9, z: 0, color: '#ffffff' },
      { element: 'H', x: -0.9, y: 0.9, z: 0, color: '#ffffff' },
      { element: 'H', x: 0.9, y: -0.9, z: 0, color: '#ffffff' },
      { element: 'H', x: -0.9, y: -0.9, z: 0, color: '#ffffff' },
    ],
    bonds: [
      { from: 0, to: 1, type: 'single' },
      { from: 0, to: 2, type: 'single' },
      { from: 0, to: 3, type: 'single' },
      { from: 0, to: 4, type: 'single' },
    ]
  }
}

export function Molecule({
  formula = 'H2O',
  atoms: customAtoms,
  bonds: customBonds
}: MoleculeProps) {
  const groupRef = useRef<THREE.Group>(null)
  
  const molecule = MOLECULES[formula] || MOLECULES.H2O
  const atoms = customAtoms || molecule.atoms
  const bonds = customBonds || molecule.bonds

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.5
    }
  })

  return (
    <group ref={groupRef}>
      {/* Bağlar */}
      {bonds?.map((bond, idx) => {
        const from = atoms![bond.from]
        const to = atoms![bond.to]
        const offset = bond.type === 'double' ? 0.08 : bond.type === 'triple' ? 0.12 : 0
        
        const lines = bond.type === 'single' ? [0] : 
                      bond.type === 'double' ? [-offset, offset] : 
                      [-offset, 0, offset]
        
        return lines.map((o, i) => (
          <Line
            key={`${idx}-${i}`}
            points={[
              [from.x, from.y + o, from.z],
              [to.x, to.y + o, to.z]
            ]}
            color="#94a3b8"
            lineWidth={3}
          />
        ))
      })}
      
      {/* Atomlar */}
      {atoms?.map((atom, idx) => (
        <group key={idx} position={[atom.x, atom.y, atom.z]}>
          <mesh>
            <sphereGeometry args={[atom.element === 'H' ? 0.25 : 0.35, 32, 32]} />
            <meshStandardMaterial 
              color={atom.color || ELEMENT_COLORS[atom.element] || '#888'} 
              emissive={atom.color || ELEMENT_COLORS[atom.element] || '#888'}
              emissiveIntensity={0.3}
            />
          </mesh>
          <Html position={[0, 0.5, 0]} center>
            <span className="text-xs font-bold text-white bg-slate-800/80 px-1 rounded">
              {atom.element}
            </span>
          </Html>
        </group>
      ))}
      
      {/* Formül */}
      <Html position={[0, -2, 0]} center>
        <div className="px-4 py-2 bg-emerald-500/90 rounded-xl text-white font-bold text-xl">
          {formula}
        </div>
      </Html>
    </group>
  )
}

// ============================================
// 🦠 HÜCRE
// ============================================

interface CellProps {
  type?: 'animal' | 'plant' | 'bacteria'
  highlightOrganelle?: string
  showLabels?: boolean
}

export function Cell({
  type = 'animal',
  highlightOrganelle,
  showLabels = true
}: CellProps) {
  const groupRef = useRef<THREE.Group>(null)

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.2
    }
  })

  const isHighlighted = (name: string) => highlightOrganelle === name

  return (
    <group ref={groupRef}>
      {/* Hücre zarı */}
      <mesh>
        <sphereGeometry args={[2.5, 32, 32]} />
        <meshStandardMaterial 
          color={type === 'plant' ? '#22c55e' : '#f472b6'} 
          transparent 
          opacity={0.3}
          side={THREE.DoubleSide}
        />
      </mesh>
      
      {/* Çekirdek */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[0.8, 32, 32]} />
        <meshStandardMaterial 
          color={isHighlighted('nucleus') ? '#f59e0b' : '#8b5cf6'} 
          emissive={isHighlighted('nucleus') ? '#f59e0b' : '#8b5cf6'}
          emissiveIntensity={isHighlighted('nucleus') ? 0.8 : 0.3}
        />
      </mesh>
      
      {/* Mitokondri */}
      {[
        [1.2, 0.5, 0.5],
        [-1, -0.8, 0.3],
        [0.5, 1, -0.8]
      ].map((pos, idx) => (
        <mesh key={idx} position={pos as [number, number, number]} rotation={[0, idx, idx * 0.5]}>
          <capsuleGeometry args={[0.15, 0.4, 8, 16]} />
          <meshStandardMaterial 
            color={isHighlighted('mitochondria') ? '#f59e0b' : '#ef4444'}
            emissive={isHighlighted('mitochondria') ? '#f59e0b' : '#ef4444'}
            emissiveIntensity={isHighlighted('mitochondria') ? 0.8 : 0.3}
          />
        </mesh>
      ))}
      
      {/* Ribozomlar */}
      {Array.from({ length: 15 }).map((_, idx) => {
        const theta = Math.random() * Math.PI * 2
        const phi = Math.random() * Math.PI
        const r = 1.5 + Math.random() * 0.5
        return (
          <mesh 
            key={idx} 
            position={[
              r * Math.sin(phi) * Math.cos(theta),
              r * Math.sin(phi) * Math.sin(theta),
              r * Math.cos(phi)
            ]}
          >
            <sphereGeometry args={[0.08, 8, 8]} />
            <meshStandardMaterial color="#64748b" />
          </mesh>
        )
      })}
      
      {/* Bitki hücresi - Kloroplast */}
      {type === 'plant' && (
        <>
          {[
            [1.5, -0.5, 0],
            [-1.2, 0.8, 0.5],
          ].map((pos, idx) => (
            <mesh key={idx} position={pos as [number, number, number]}>
              <sphereGeometry args={[0.3, 16, 16]} />
              <meshStandardMaterial 
                color={isHighlighted('chloroplast') ? '#f59e0b' : '#22c55e'}
                emissive={isHighlighted('chloroplast') ? '#f59e0b' : '#22c55e'}
                emissiveIntensity={0.5}
              />
            </mesh>
          ))}
        </>
      )}
      
      {/* Etiketler */}
      {showLabels && (
        <>
          <Html position={[0, 0, 1]} center>
            <div className="px-2 py-1 bg-violet-500/90 rounded text-white text-xs font-bold">
              Çekirdek
            </div>
          </Html>
          <Html position={[1.5, 0.5, 0.5]} center>
            <div className="px-2 py-1 bg-red-500/90 rounded text-white text-xs font-bold">
              Mitokondri
            </div>
          </Html>
        </>
      )}
      
      {/* Hücre tipi */}
      <Html position={[0, -3.5, 0]} center>
        <div className="px-4 py-2 bg-slate-800/90 rounded-xl text-white font-bold">
          {type === 'animal' ? '🦠 Hayvan Hücresi' : 
           type === 'plant' ? '🌿 Bitki Hücresi' : '🦠 Bakteri'}
        </div>
      </Html>
    </group>
  )
}

// ============================================
// 🧬 DNA SARMALI
// ============================================

interface DNAProps {
  basePairs?: number
  isAnimating?: boolean
}

export function DNA({
  basePairs = 10,
  isAnimating = true
}: DNAProps) {
  const groupRef = useRef<THREE.Group>(null)
  
  useFrame((_, delta) => {
    if (groupRef.current && isAnimating) {
      groupRef.current.rotation.y += delta * 0.5
    }
  })

  const bases = ['A-T', 'T-A', 'G-C', 'C-G']
  const baseColors: Record<string, [string, string]> = {
    'A-T': ['#ef4444', '#3b82f6'],
    'T-A': ['#3b82f6', '#ef4444'],
    'G-C': ['#22c55e', '#f59e0b'],
    'C-G': ['#f59e0b', '#22c55e'],
  }

  return (
    <group ref={groupRef}>
      {Array.from({ length: basePairs }).map((_, idx) => {
        const y = (idx - basePairs / 2) * 0.5
        const angle = idx * 0.5
        const base = bases[idx % bases.length]
        const [color1, color2] = baseColors[base]
        
        return (
          <group key={idx} position={[0, y, 0]} rotation={[0, angle, 0]}>
            {/* Sol omurga */}
            <mesh position={[-1, 0, 0]}>
              <sphereGeometry args={[0.15, 16, 16]} />
              <meshStandardMaterial color="#8b5cf6" emissive="#8b5cf6" emissiveIntensity={0.5} />
            </mesh>
            
            {/* Sağ omurga */}
            <mesh position={[1, 0, 0]}>
              <sphereGeometry args={[0.15, 16, 16]} />
              <meshStandardMaterial color="#8b5cf6" emissive="#8b5cf6" emissiveIntensity={0.5} />
            </mesh>
            
            {/* Baz çifti */}
            <mesh position={[-0.4, 0, 0]}>
              <boxGeometry args={[0.4, 0.15, 0.15]} />
              <meshStandardMaterial color={color1} />
            </mesh>
            <mesh position={[0.4, 0, 0]}>
              <boxGeometry args={[0.4, 0.15, 0.15]} />
              <meshStandardMaterial color={color2} />
            </mesh>
          </group>
        )
      })}
      
      {/* Baz çifti açıklaması */}
      <Html position={[2, 0, 0]} center>
        <div className="px-3 py-2 bg-slate-800/90 rounded-lg text-white text-xs">
          <div className="font-bold mb-1">Baz Çiftleri:</div>
          <div className="flex gap-2">
            <span className="text-red-400">A</span>-<span className="text-blue-400">T</span>
            <span className="text-green-400">G</span>-<span className="text-yellow-400">C</span>
          </div>
        </div>
      </Html>
      
      {/* Başlık */}
      <Html position={[0, -basePairs / 2 - 1, 0]} center>
        <div className="px-4 py-2 bg-violet-500/90 rounded-xl text-white font-bold">
          🧬 DNA Çift Sarmalı
        </div>
      </Html>
    </group>
  )
}

export default { Atom, Molecule, Cell, DNA }
