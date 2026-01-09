import React from 'react'
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from 'remotion'

interface NumberLineProps {
  min: number
  max: number
  points?: Array<{ value: number; label: string; color?: string }>
  highlightRange?: { start: number; end: number }
}

export const NumberLine: React.FC<NumberLineProps> = ({ min, max, points = [], highlightRange }) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  const range = max - min
  const getX = (value: number) => 100 + ((value - min) / range) * 600

  return (
    <AbsoluteFill style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #581c87 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg viewBox="0 0 800 300" style={{ width: '100%', maxWidth: 900, height: 'auto' }}>
        {/* Number line */}
        <line x1="80" y1="150" x2="720" y2="150" stroke="#64748b" strokeWidth="4" />
        <polygon points="715,145 730,150 715,155" fill="#64748b" />
        <polygon points="85,145 70,150 85,155" fill="#64748b" />

        {/* Tick marks */}
        {Array.from({ length: Math.min(11, range + 1) }, (_, i) => {
          const value = min + Math.floor(i * range / 10)
          const x = getX(value)
          return (
            <g key={i}>
              <line x1={x} y1="140" x2={x} y2="160" stroke="#94a3b8" strokeWidth="2" />
              <text x={x} y="190" textAnchor="middle" fill="#94a3b8" fontSize="20">{value}</text>
            </g>
          )
        })}

        {/* Highlight range */}
        {highlightRange && (
          <rect
            x={getX(highlightRange.start)}
            y="130"
            width={getX(highlightRange.end) - getX(highlightRange.start)}
            height="40"
            fill="#fbbf24"
            opacity="0.3"
            rx="8"
          />
        )}

        {/* Points */}
        {points.map((point, i) => {
          const delay = i * fps * 0.5
          const scale = spring({ frame: frame - delay, fps, config: { damping: 100 } })
          const x = getX(point.value)

          return (
            <g key={i} style={{ transform: `scale(${Math.max(0, scale)})`, transformOrigin: `${x}px 150px` }}>
              <circle cx={x} cy="150" r="20" fill={point.color || '#6366f1'} />
              <text x={x} y="158" textAnchor="middle" fill="white" fontSize="18" fontWeight="bold">
                {point.label}
              </text>
              <text x={x} y="100" textAnchor="middle" fill={point.color || '#6366f1'} fontSize="22" fontWeight="bold">
                {point.value}
              </text>
            </g>
          )
        })}
      </svg>
    </AbsoluteFill>
  )
}
