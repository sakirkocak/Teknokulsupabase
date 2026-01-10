import React from 'react'
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from 'remotion'

interface MapHighlightProps {
  title: string
  regions: Array<{
    name: string
    description?: string
    color?: string
    x: number  // % position
    y: number  // % position
  }>
  era?: string
  showLegend?: boolean
}

export const MapHighlight: React.FC<MapHighlightProps> = ({
  title,
  regions,
  era,
  showLegend = true
}) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  const defaultColors = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6']

  return (
    <AbsoluteFill style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)', padding: 40 }}>
      {/* Title */}
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 32, color: 'white', margin: 0 }}>🗺️ {title}</h1>
        {era && (
          <span style={{ 
            display: 'inline-block',
            marginTop: 12,
            padding: '6px 20px', 
            background: 'rgba(251, 191, 36, 0.2)', 
            border: '1px solid #fbbf24',
            borderRadius: 16, 
            color: '#fbbf24',
            fontSize: 16 
          }}>
            {era}
          </span>
        )}
      </div>

      {/* Map container */}
      <div style={{ 
        position: 'relative', 
        flex: 1, 
        background: 'rgba(255,255,255,0.05)',
        borderRadius: 20,
        border: '2px solid rgba(255,255,255,0.1)',
        overflow: 'hidden'
      }}>
        {/* Stylized map background - Turkey/Anatolia inspired */}
        <svg viewBox="0 0 800 400" style={{ width: '100%', height: '100%', position: 'absolute' }}>
          {/* Grid lines */}
          {Array.from({ length: 9 }, (_, i) => (
            <line key={`v${i}`} x1={i * 100} y1="0" x2={i * 100} y2="400" stroke="rgba(255,255,255,0.05)" />
          ))}
          {Array.from({ length: 5 }, (_, i) => (
            <line key={`h${i}`} x1="0" y1={i * 100} x2="800" y2={i * 100} stroke="rgba(255,255,255,0.05)" />
          ))}

          {/* Simplified landmass shapes */}
          <path
            d="M 100 200 Q 200 150 350 180 Q 500 160 600 200 Q 700 240 750 200 L 750 300 Q 600 320 400 300 Q 200 280 100 300 Z"
            fill="rgba(139, 92, 246, 0.2)"
            stroke="rgba(139, 92, 246, 0.4)"
            strokeWidth="2"
          />

          {/* Sea indication */}
          <text x="150" y="350" fill="rgba(59, 130, 246, 0.5)" fontSize="14">Akdeniz</text>
          <text x="650" y="120" fill="rgba(59, 130, 246, 0.5)" fontSize="14">Karadeniz</text>
        </svg>

        {/* Region markers */}
        {regions.map((region, i) => {
          const delay = i * fps * 0.4
          const opacity = interpolate(frame, [delay, delay + fps * 0.5], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
          const scale = interpolate(frame, [delay, delay + fps * 0.5], [0.5, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
          const color = region.color || defaultColors[i % defaultColors.length]

          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: `${region.x}%`,
                top: `${region.y}%`,
                transform: `translate(-50%, -50%) scale(${scale})`,
                opacity,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                zIndex: 10
              }}
            >
              {/* Pulse effect */}
              <div style={{
                position: 'absolute',
                width: 60,
                height: 60,
                borderRadius: '50%',
                background: `radial-gradient(circle, ${color}40 0%, transparent 70%)`,
                animation: 'pulse 2s infinite'
              }} />

              {/* Marker */}
              <div style={{
                width: 24,
                height: 24,
                borderRadius: '50%',
                background: color,
                border: '3px solid white',
                boxShadow: `0 0 15px ${color}80`,
                marginBottom: 8
              }} />

              {/* Label */}
              <div style={{
                background: 'rgba(0,0,0,0.8)',
                padding: '8px 16px',
                borderRadius: 8,
                border: `2px solid ${color}`,
                textAlign: 'center',
                maxWidth: 150
              }}>
                <span style={{ color: 'white', fontSize: 14, fontWeight: 'bold', display: 'block' }}>
                  {region.name}
                </span>
                {region.description && (
                  <span style={{ color: '#94a3b8', fontSize: 11, display: 'block', marginTop: 4 }}>
                    {region.description}
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Legend */}
      {showLegend && regions.length > 0 && (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: 24,
          marginTop: 20,
          opacity: interpolate(frame, [fps * 2, fps * 2.5], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
        }}>
          {regions.map((region, i) => {
            const color = region.color || defaultColors[i % defaultColors.length]
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 12, height: 12, borderRadius: 6, background: color }} />
                <span style={{ color: '#e2e8f0', fontSize: 14 }}>{region.name}</span>
              </div>
            )
          })}
        </div>
      )}
    </AbsoluteFill>
  )
}

export default MapHighlight
