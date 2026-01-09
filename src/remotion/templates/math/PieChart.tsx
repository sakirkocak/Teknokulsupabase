import React from 'react'
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from 'remotion'

interface PieChartProps {
  segments: Array<{ label: string; value: number; color?: string }>
  total?: number
  highlightSegment?: number
}

const defaultColors = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

export const PieChart: React.FC<PieChartProps> = ({ segments, total, highlightSegment }) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  const progress = interpolate(frame, [0, fps * 1.5], [0, 100], { extrapolateRight: 'clamp' })
  const actualTotal = total || segments.reduce((sum, s) => sum + s.value, 0)

  const getPath = (startAngle: number, endAngle: number, radius: number = 120) => {
    const start = {
      x: 200 + radius * Math.cos((startAngle - 90) * Math.PI / 180),
      y: 200 + radius * Math.sin((startAngle - 90) * Math.PI / 180)
    }
    const end = {
      x: 200 + radius * Math.cos((endAngle - 90) * Math.PI / 180),
      y: 200 + radius * Math.sin((endAngle - 90) * Math.PI / 180)
    }
    const largeArc = endAngle - startAngle > 180 ? 1 : 0
    return `M 200 200 L ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArc} 1 ${end.x} ${end.y} Z`
  }

  let currentAngle = 0

  return (
    <AbsoluteFill style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #065f46 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 64 }}>
        <svg viewBox="0 0 400 400" style={{ width: 400, height: 400 }}>
          {segments.map((segment, i) => {
            const segmentAngle = (segment.value / actualTotal) * 360
            const displayAngle = Math.min(segmentAngle, (segmentAngle * progress) / 100)
            const startAngle = currentAngle
            const endAngle = currentAngle + displayAngle
            currentAngle += segmentAngle

            const isHighlighted = highlightSegment === i
            const radius = isHighlighted ? 130 : 120

            return (
              <path
                key={i}
                d={getPath(startAngle, endAngle, radius)}
                fill={segment.color || defaultColors[i % defaultColors.length]}
                style={{ filter: isHighlighted ? 'drop-shadow(0 0 15px rgba(255,255,255,0.4))' : 'none' }}
              />
            )
          })}
          {/* Center hole */}
          <circle cx="200" cy="200" r="60" fill="#1e293b" />
          <text x="200" y="210" textAnchor="middle" fill="white" fontSize="24" fontWeight="bold">
            {actualTotal}
          </text>
        </svg>

        {/* Legend */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {segments.map((segment, i) => {
            const opacity = interpolate(frame, [i * fps * 0.3, i * fps * 0.3 + fps * 0.3], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, opacity }}>
                <div style={{ width: 24, height: 24, borderRadius: 4, background: segment.color || defaultColors[i % defaultColors.length] }} />
                <span style={{ color: 'white', fontSize: 22 }}>
                  {segment.label}: <strong>{segment.value}</strong>
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </AbsoluteFill>
  )
}
