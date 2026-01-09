import React from 'react'
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from 'remotion'

interface ForceVectorsProps {
  forces: Array<{
    label: string
    magnitude: number
    angle: number  // derece
    color?: string
  }>
  showResultant?: boolean
}

export const ForceVectors: React.FC<ForceVectorsProps> = ({ forces, showResultant = false }) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  const centerX = 400
  const centerY = 300
  const scale = 2

  // Bileşke hesaplama
  const resultant = forces.reduce(
    (acc, f) => ({
      x: acc.x + f.magnitude * Math.cos(f.angle * Math.PI / 180),
      y: acc.y + f.magnitude * Math.sin(f.angle * Math.PI / 180)
    }),
    { x: 0, y: 0 }
  )
  const resultantMag = Math.sqrt(resultant.x ** 2 + resultant.y ** 2)
  const resultantAngle = Math.atan2(resultant.y, resultant.x) * 180 / Math.PI

  return (
    <AbsoluteFill style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #1e3a5f 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg viewBox="0 0 800 600" style={{ width: '100%', maxWidth: 900, height: 'auto' }}>
        {/* Grid */}
        {Array.from({ length: 17 }, (_, i) => (
          <line key={`v${i}`} x1={i * 50} y1="0" x2={i * 50} y2="600" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
        ))}
        {Array.from({ length: 13 }, (_, i) => (
          <line key={`h${i}`} x1="0" y1={i * 50} x2="800" y2={i * 50} stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
        ))}

        {/* Axes */}
        <line x1="0" y1={centerY} x2="800" y2={centerY} stroke="rgba(255,255,255,0.3)" strokeWidth="2" />
        <line x1={centerX} y1="0" x2={centerX} y2="600" stroke="rgba(255,255,255,0.3)" strokeWidth="2" />

        {/* Object at center */}
        <circle cx={centerX} cy={centerY} r="25" fill="#6366f1" stroke="white" strokeWidth="3" />
        <text x={centerX} y={centerY + 5} textAnchor="middle" fill="white" fontSize="16" fontWeight="bold">m</text>

        {/* Force vectors */}
        {forces.map((force, i) => {
          const delay = i * fps * 0.4
          const progress = spring({ frame: frame - delay, fps, config: { damping: 100 } })
          const length = force.magnitude * scale * Math.max(0, progress)
          const angleRad = force.angle * Math.PI / 180
          
          const endX = centerX + length * Math.cos(angleRad)
          const endY = centerY - length * Math.sin(angleRad) // Y is inverted in SVG
          
          const arrowSize = 12
          const arrowAngle = Math.PI / 6
          const ax1 = endX - arrowSize * Math.cos(angleRad - arrowAngle)
          const ay1 = endY + arrowSize * Math.sin(angleRad - arrowAngle)
          const ax2 = endX - arrowSize * Math.cos(angleRad + arrowAngle)
          const ay2 = endY + arrowSize * Math.sin(angleRad + arrowAngle)

          const color = force.color || ['#ef4444', '#10b981', '#f59e0b', '#6366f1'][i % 4]

          return (
            <g key={i} style={{ opacity: Math.max(0, progress) }}>
              <line x1={centerX} y1={centerY} x2={endX} y2={endY} stroke={color} strokeWidth="4" />
              <polygon points={`${endX},${endY} ${ax1},${ay1} ${ax2},${ay2}`} fill={color} />
              
              {/* Label */}
              <text
                x={endX + 20 * Math.cos(angleRad)}
                y={endY - 20 * Math.sin(angleRad)}
                textAnchor="middle"
                fill={color}
                fontSize="20"
                fontWeight="bold"
              >
                {force.label} = {force.magnitude}N
              </text>
            </g>
          )
        })}

        {/* Resultant */}
        {showResultant && (
          (() => {
            const delay = forces.length * fps * 0.4
            const progress = interpolate(frame, [delay, delay + fps], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
            const length = resultantMag * scale * progress
            const angleRad = resultantAngle * Math.PI / 180
            
            const endX = centerX + length * Math.cos(angleRad)
            const endY = centerY - length * Math.sin(angleRad)
            
            return (
              <g style={{ opacity: progress }}>
                <line x1={centerX} y1={centerY} x2={endX} y2={endY} stroke="#fbbf24" strokeWidth="5" strokeDasharray="10,5" />
                <text x={endX + 15} y={endY - 15} fill="#fbbf24" fontSize="22" fontWeight="bold">
                  R = {resultantMag.toFixed(1)}N
                </text>
              </g>
            )
          })()
        )}
      </svg>

      {/* Legend */}
      <div style={{ position: 'absolute', bottom: 32, left: 32, background: 'rgba(0,0,0,0.5)', padding: 16, borderRadius: 12 }}>
        <span style={{ color: 'white', fontSize: 18 }}>⚡ Kuvvet Vektörleri</span>
      </div>
    </AbsoluteFill>
  )
}

export default ForceVectors
