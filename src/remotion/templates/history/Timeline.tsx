import React from 'react'
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from 'remotion'

interface TimelineProps {
  events: Array<{
    year: string
    title: string
    description?: string
    icon?: string
    color?: string
  }>
  era?: string
  highlightIndex?: number
}

const defaultColors = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899']

export const Timeline: React.FC<TimelineProps> = ({
  events,
  era,
  highlightIndex
}) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  const lineProgress = interpolate(frame, [0, fps * 1.5], [0, 100], { extrapolateRight: 'clamp' })

  return (
    <AbsoluteFill style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #7c2d12 100%)', padding: 48 }}>
      {/* Title */}
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <span style={{ fontSize: 32, color: 'white', fontWeight: 'bold' }}>📜 Tarih Şeridi</span>
        {era && (
          <div style={{ marginTop: 8 }}>
            <span style={{ padding: '8px 20px', background: 'rgba(251, 191, 36, 0.2)', border: '1px solid #fbbf24', borderRadius: 20, color: '#fbbf24', fontSize: 16 }}>
              {era}
            </span>
          </div>
        )}
      </div>

      {/* Timeline */}
      <div style={{ position: 'relative', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        {/* Main line */}
        <div style={{
          position: 'absolute',
          left: 100,
          right: 100,
          top: '50%',
          height: 4,
          background: 'rgba(255,255,255,0.2)',
          borderRadius: 2
        }}>
          <div style={{
            width: `${lineProgress}%`,
            height: '100%',
            background: 'linear-gradient(90deg, #fbbf24, #f59e0b)',
            borderRadius: 2
          }} />
        </div>

        {/* Events */}
        <div style={{ display: 'flex', justifyContent: 'space-around', position: 'relative', padding: '0 80px' }}>
          {events.map((event, i) => {
            const delay = i * fps * 0.5 + fps * 0.5
            const scale = spring({ frame: frame - delay, fps, config: { damping: 100 } })
            const isTop = i % 2 === 0
            const color = event.color || defaultColors[i % defaultColors.length]
            const isHighlighted = highlightIndex === i

            return (
              <div
                key={i}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  transform: `scale(${Math.max(0, scale)})`,
                  zIndex: isHighlighted ? 10 : 1
                }}
              >
                {/* Top content */}
                {isTop && (
                  <div style={{
                    background: isHighlighted ? `${color}50` : 'rgba(0,0,0,0.4)',
                    border: `2px solid ${color}`,
                    borderRadius: 12,
                    padding: 16,
                    marginBottom: 16,
                    maxWidth: 160,
                    textAlign: 'center',
                    boxShadow: isHighlighted ? `0 0 20px ${color}50` : 'none'
                  }}>
                    <span style={{ fontSize: 13, color: '#fbbf24', display: 'block', marginBottom: 4 }}>{event.year}</span>
                    <span style={{ fontSize: 15, color: 'white', fontWeight: 'bold', display: 'block' }}>{event.title}</span>
                    {event.description && (
                      <span style={{ fontSize: 12, color: '#cbd5e1', display: 'block', marginTop: 8 }}>{event.description}</span>
                    )}
                  </div>
                )}

                {/* Dot */}
                <div style={{
                  width: isHighlighted ? 28 : 20,
                  height: isHighlighted ? 28 : 20,
                  borderRadius: '50%',
                  background: color,
                  border: '3px solid white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 14
                }}>
                  {event.icon || '⭐'}
                </div>

                {/* Bottom content */}
                {!isTop && (
                  <div style={{
                    background: isHighlighted ? `${color}50` : 'rgba(0,0,0,0.4)',
                    border: `2px solid ${color}`,
                    borderRadius: 12,
                    padding: 16,
                    marginTop: 16,
                    maxWidth: 160,
                    textAlign: 'center',
                    boxShadow: isHighlighted ? `0 0 20px ${color}50` : 'none'
                  }}>
                    <span style={{ fontSize: 13, color: '#fbbf24', display: 'block', marginBottom: 4 }}>{event.year}</span>
                    <span style={{ fontSize: 15, color: 'white', fontWeight: 'bold', display: 'block' }}>{event.title}</span>
                    {event.description && (
                      <span style={{ fontSize: 12, color: '#cbd5e1', display: 'block', marginTop: 8 }}>{event.description}</span>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </AbsoluteFill>
  )
}

export default Timeline
