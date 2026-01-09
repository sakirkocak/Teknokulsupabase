import React from 'react'
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from 'remotion'

interface CircuitDiagramProps {
  voltage?: number
  resistance?: number
  current?: number
  showLabels?: boolean
  highlightPart?: 'battery' | 'resistor' | 'wire' | 'all'
}

export const CircuitDiagram: React.FC<CircuitDiagramProps> = ({
  voltage = 12,
  resistance = 4,
  current,
  showLabels = true,
  highlightPart = 'all'
}) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  const calculatedCurrent = current ?? voltage / resistance
  const progress = interpolate(frame, [0, fps * 1.5], [0, 1], { extrapolateRight: 'clamp' })

  // Electron animation
  const electronPositions = Array.from({ length: 8 }, (_, i) => {
    const offset = ((frame / fps) * 50 + i * 80) % 640
    return offset
  })

  return (
    <AbsoluteFill style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg viewBox="0 0 800 500" style={{ width: '100%', maxWidth: 900, height: 'auto' }}>
        {/* Title */}
        <text x="400" y="40" textAnchor="middle" fill="white" fontSize="28" fontWeight="bold">
          Basit Elektrik Devresi
        </text>

        {/* Circuit path */}
        <g opacity={progress}>
          {/* Wires */}
          <path
            d="M 200 150 L 600 150 L 600 350 L 200 350 L 200 150"
            fill="none"
            stroke={highlightPart === 'wire' || highlightPart === 'all' ? '#60a5fa' : '#475569'}
            strokeWidth="4"
          />

          {/* Battery */}
          <g transform="translate(200, 200)">
            <rect x="-30" y="-50" width="60" height="100" fill="#1e293b" rx="5" />
            <line x1="-20" y1="-30" x2="20" y2="-30" stroke={highlightPart === 'battery' || highlightPart === 'all' ? '#fbbf24' : '#94a3b8'} strokeWidth="6" />
            <line x1="-10" y1="-10" x2="10" y2="-10" stroke={highlightPart === 'battery' || highlightPart === 'all' ? '#fbbf24' : '#94a3b8'} strokeWidth="3" />
            <text x="0" y="20" textAnchor="middle" fill="#fbbf24" fontSize="14">+</text>
            <text x="0" y="-40" textAnchor="middle" fill="#94a3b8" fontSize="14">-</text>
            {showLabels && (
              <text x="-60" y="5" fill="#fbbf24" fontSize="16" fontWeight="bold">
                V = {voltage}V
              </text>
            )}
          </g>

          {/* Resistor */}
          <g transform="translate(600, 200)">
            <rect x="-20" y="-40" width="40" height="80" fill="#1e293b" rx="5" />
            <path
              d="M 0 -40 L 0 -30 L 10 -25 L -10 -15 L 10 -5 L -10 5 L 10 15 L -10 25 L 0 30 L 0 40"
              fill="none"
              stroke={highlightPart === 'resistor' || highlightPart === 'all' ? '#ef4444' : '#94a3b8'}
              strokeWidth="3"
            />
            {showLabels && (
              <text x="50" y="5" fill="#ef4444" fontSize="16" fontWeight="bold">
                R = {resistance}Ω
              </text>
            )}
          </g>

          {/* Current direction arrow */}
          <g>
            <path d="M 350 140 L 400 140 L 390 130 M 400 140 L 390 150" stroke="#10b981" strokeWidth="3" fill="none" />
            <text x="400" y="125" textAnchor="middle" fill="#10b981" fontSize="14">Akım yönü</text>
          </g>

          {/* Electron flow animation */}
          {electronPositions.map((pos, i) => {
            let x, y
            if (pos < 160) {
              x = 200 + pos * 2.5
              y = 150
            } else if (pos < 320) {
              x = 600
              y = 150 + (pos - 160) * 1.25
            } else if (pos < 480) {
              x = 600 - (pos - 320) * 2.5
              y = 350
            } else {
              x = 200
              y = 350 - (pos - 480) * 1.25
            }
            return (
              <circle key={i} cx={x} cy={y} r="6" fill="#3b82f6" opacity="0.8">
                <animate attributeName="opacity" values="0.4;1;0.4" dur="1s" repeatCount="indefinite" begin={`${i * 0.1}s`} />
              </circle>
            )
          })}
        </g>

        {/* Ohm's Law formula */}
        <g transform="translate(400, 420)" opacity={interpolate(frame, [fps, fps * 2], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })}>
          <rect x="-180" y="-30" width="360" height="60" rx="12" fill="rgba(16, 185, 129, 0.2)" stroke="#10b981" strokeWidth="2" />
          <text x="0" y="8" textAnchor="middle" fill="white" fontSize="24" fontWeight="bold">
            I = V / R = {voltage} / {resistance} = {calculatedCurrent.toFixed(2)} A
          </text>
        </g>
      </svg>
    </AbsoluteFill>
  )
}

export default CircuitDiagram
