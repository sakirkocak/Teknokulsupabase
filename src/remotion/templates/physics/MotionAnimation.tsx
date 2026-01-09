import React from 'react'
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from 'remotion'

interface MotionAnimationProps {
  type: 'linear' | 'projectile' | 'circular'
  initialVelocity?: number
  acceleration?: number
  angle?: number
  showPath?: boolean
  showVectors?: boolean
}

export const MotionAnimation: React.FC<MotionAnimationProps> = ({
  type = 'linear',
  initialVelocity = 10,
  acceleration = 0,
  angle = 45,
  showPath = true,
  showVectors = true
}) => {
  const frame = useCurrentFrame()
  const { fps, durationInFrames } = useVideoConfig()

  const t = frame / fps
  const scale = 3

  // Position calculation based on motion type
  let x = 0, y = 0
  const startX = 100
  const startY = 400

  if (type === 'linear') {
    x = startX + (initialVelocity * t + 0.5 * acceleration * t * t) * scale * 5
    y = startY
  } else if (type === 'projectile') {
    const vx = initialVelocity * Math.cos(angle * Math.PI / 180)
    const vy = initialVelocity * Math.sin(angle * Math.PI / 180)
    const g = 10 // gravity
    x = startX + vx * t * scale * 3
    y = startY - (vy * t - 0.5 * g * t * t) * scale * 3
  } else if (type === 'circular') {
    const radius = 150
    const omega = 1.5 // angular velocity
    x = 400 + radius * Math.cos(omega * t)
    y = 300 + radius * Math.sin(omega * t)
  }

  // Keep within bounds
  x = Math.max(50, Math.min(x, 750))
  y = Math.max(50, Math.min(y, 550))

  // Path points for projectile
  const pathPoints = type === 'projectile' ? Array.from({ length: 60 }, (_, i) => {
    const pt = i * 0.1
    const vx = initialVelocity * Math.cos(angle * Math.PI / 180)
    const vy = initialVelocity * Math.sin(angle * Math.PI / 180)
    const g = 10
    return {
      x: startX + vx * pt * scale * 3,
      y: startY - (vy * pt - 0.5 * g * pt * pt) * scale * 3
    }
  }).filter(p => p.y <= 450 && p.x <= 750) : []

  return (
    <AbsoluteFill style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)' }}>
      <svg viewBox="0 0 800 600" style={{ width: '100%', height: '100%' }}>
        {/* Ground */}
        <rect x="0" y="450" width="800" height="150" fill="#374151" />
        <line x1="0" y1="450" x2="800" y2="450" stroke="#6b7280" strokeWidth="3" />

        {/* Title */}
        <text x="400" y="50" textAnchor="middle" fill="white" fontSize="28" fontWeight="bold">
          {type === 'linear' && 'Doğrusal Hareket'}
          {type === 'projectile' && 'Eğik Atış'}
          {type === 'circular' && 'Dairesel Hareket'}
        </text>

        {/* Path for projectile */}
        {showPath && type === 'projectile' && pathPoints.length > 1 && (
          <path
            d={`M ${pathPoints.map(p => `${p.x},${p.y}`).join(' L ')}`}
            fill="none"
            stroke="rgba(251, 191, 36, 0.5)"
            strokeWidth="2"
            strokeDasharray="8,4"
          />
        )}

        {/* Circular path */}
        {showPath && type === 'circular' && (
          <circle cx="400" cy="300" r="150" fill="none" stroke="rgba(251, 191, 36, 0.3)" strokeWidth="2" strokeDasharray="8,4" />
        )}

        {/* Object */}
        <circle cx={x} cy={y} r="20" fill="#6366f1" stroke="white" strokeWidth="3" />

        {/* Velocity vector */}
        {showVectors && (
          <g>
            {type === 'linear' && (
              <>
                <line x1={x} y1={y} x2={x + 60} y2={y} stroke="#10b981" strokeWidth="3" />
                <polygon points={`${x + 60},${y} ${x + 50},${y - 8} ${x + 50},${y + 8}`} fill="#10b981" />
                <text x={x + 35} y={y - 15} fill="#10b981" fontSize="16" fontWeight="bold">v</text>
              </>
            )}
            {type === 'projectile' && t < 3 && (
              <>
                {/* Velocity components */}
                <line x1={x} y1={y} x2={x + 40} y2={y} stroke="#10b981" strokeWidth="2" />
                <line x1={x} y1={y} x2={x} y2={y - 30 + t * 10} stroke="#ef4444" strokeWidth="2" />
                <text x={x + 45} y={y + 5} fill="#10b981" fontSize="14">vₓ</text>
                <text x={x + 10} y={y - 35 + t * 10} fill="#ef4444" fontSize="14">vᵧ</text>
              </>
            )}
          </g>
        )}

        {/* Info box */}
        <rect x="560" y="80" width="220" height={type === 'projectile' ? 140 : 100} rx="12" fill="rgba(0,0,0,0.6)" />
        <text x="580" y="110" fill="#94a3b8" fontSize="14">t = {t.toFixed(2)} s</text>
        <text x="580" y="135" fill="#94a3b8" fontSize="14">v₀ = {initialVelocity} m/s</text>
        {type === 'projectile' && (
          <text x="580" y="160" fill="#94a3b8" fontSize="14">θ = {angle}°</text>
        )}
        {acceleration !== 0 && (
          <text x="580" y="185" fill="#94a3b8" fontSize="14">a = {acceleration} m/s²</text>
        )}
      </svg>
    </AbsoluteFill>
  )
}

export default MotionAnimation
