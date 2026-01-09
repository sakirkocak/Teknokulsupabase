import React from 'react'
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion'

interface AtomModelProps {
  element: string
  atomicNumber: number
  electrons: number[]  // Her yörüngedeki elektron sayısı
  protons: number
  neutrons: number
  showLabels?: boolean
}

export const AtomModel: React.FC<AtomModelProps> = ({
  element = 'C',
  atomicNumber = 6,
  electrons = [2, 4],
  protons = 6,
  neutrons = 6,
  showLabels = true
}) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  const orbitRadii = [60, 100, 140, 180]
  const electronSpeed = 0.02

  return (
    <AbsoluteFill style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg viewBox="0 0 800 600" style={{ width: '100%', maxWidth: 900, height: 'auto' }}>
        {/* Title */}
        <text x="400" y="50" textAnchor="middle" fill="white" fontSize="32" fontWeight="bold">
          {element} Atom Modeli
        </text>

        {/* Orbits */}
        {electrons.map((_, i) => (
          <circle
            key={`orbit-${i}`}
            cx="400"
            cy="300"
            r={orbitRadii[i]}
            fill="none"
            stroke="rgba(148, 163, 184, 0.3)"
            strokeWidth="1"
            strokeDasharray="4,4"
          />
        ))}

        {/* Nucleus */}
        <circle cx="400" cy="300" r="40" fill="url(#nucleusGrad)" />
        <text x="400" y="290" textAnchor="middle" fill="white" fontSize="14">
          {protons}p⁺
        </text>
        <text x="400" y="310" textAnchor="middle" fill="white" fontSize="14">
          {neutrons}n⁰
        </text>

        {/* Electrons in orbits */}
        {electrons.map((count, orbitIndex) => {
          const radius = orbitRadii[orbitIndex]
          return Array.from({ length: count }, (_, electronIndex) => {
            const baseAngle = (electronIndex / count) * Math.PI * 2
            const angle = baseAngle + frame * electronSpeed * (orbitIndex + 1)
            const x = 400 + radius * Math.cos(angle)
            const y = 300 + radius * Math.sin(angle)
            
            return (
              <g key={`e-${orbitIndex}-${electronIndex}`}>
                <circle cx={x} cy={y} r="10" fill="#3b82f6" stroke="white" strokeWidth="2" />
                <text x={x} y={y + 4} textAnchor="middle" fill="white" fontSize="10">e⁻</text>
              </g>
            )
          })
        })}

        {/* Labels */}
        {showLabels && (
          <g>
            {/* Element info box */}
            <rect x="580" y="100" width="180" height="140" rx="12" fill="rgba(0,0,0,0.5)" />
            <text x="670" y="130" textAnchor="middle" fill="white" fontSize="20" fontWeight="bold">
              {element}
            </text>
            <text x="600" y="160" fill="#94a3b8" fontSize="14">Atom No: {atomicNumber}</text>
            <text x="600" y="185" fill="#ef4444" fontSize="14">Proton: {protons}</text>
            <text x="600" y="210" fill="#10b981" fontSize="14">Nötron: {neutrons}</text>
            <text x="600" y="235" fill="#3b82f6" fontSize="14">Elektron: {electrons.reduce((a, b) => a + b, 0)}</text>

            {/* Orbit labels */}
            {electrons.map((count, i) => (
              <text
                key={`label-${i}`}
                x={400 + orbitRadii[i] + 15}
                y="300"
                fill="#94a3b8"
                fontSize="12"
              >
                {['K', 'L', 'M', 'N'][i]}: {count}
              </text>
            ))}
          </g>
        )}

        {/* Legend */}
        <g transform="translate(50, 450)">
          <circle cx="10" cy="0" r="8" fill="#ef4444" />
          <text x="25" y="5" fill="#94a3b8" fontSize="14">Proton (+)</text>
          
          <circle cx="110" cy="0" r="8" fill="#10b981" />
          <text x="125" y="5" fill="#94a3b8" fontSize="14">Nötron (0)</text>
          
          <circle cx="220" cy="0" r="8" fill="#3b82f6" />
          <text x="235" y="5" fill="#94a3b8" fontSize="14">Elektron (-)</text>
        </g>

        <defs>
          <radialGradient id="nucleusGrad" cx="30%" cy="30%">
            <stop offset="0%" stopColor="#fbbf24" />
            <stop offset="100%" stopColor="#b45309" />
          </radialGradient>
        </defs>
      </svg>
    </AbsoluteFill>
  )
}

export default AtomModel
