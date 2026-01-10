import React from 'react'
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from 'remotion'

interface HistoricalEventProps {
  title: string
  date: string
  description: string
  causes?: string[]
  effects?: string[]
  keyFigures?: Array<{ name: string; role: string }>
  location?: string
  icon?: string
}

export const HistoricalEvent: React.FC<HistoricalEventProps> = ({
  title,
  date,
  description,
  causes = [],
  effects = [],
  keyFigures = [],
  location,
  icon = '📜'
}) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  const headerScale = spring({ frame, fps, config: { damping: 100 } })
  const contentOpacity = interpolate(frame, [fps * 0.5, fps], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })

  return (
    <AbsoluteFill style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #44403c 100%)', padding: 48 }}>
      {/* Header */}
      <div style={{
        transform: `scale(${headerScale})`,
        textAlign: 'center',
        marginBottom: 32,
        background: 'rgba(251, 191, 36, 0.1)',
        border: '2px solid #fbbf24',
        borderRadius: 20,
        padding: 24
      }}>
        <span style={{ fontSize: 64, display: 'block', marginBottom: 8 }}>{icon}</span>
        <h1 style={{ fontSize: 36, color: 'white', margin: '0 0 8px 0' }}>{title}</h1>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 16 }}>
          <span style={{ padding: '6px 16px', background: '#fbbf24', borderRadius: 12, color: '#1e1b4b', fontWeight: 'bold' }}>
            📅 {date}
          </span>
          {location && (
            <span style={{ padding: '6px 16px', background: 'rgba(255,255,255,0.2)', borderRadius: 12, color: 'white' }}>
              📍 {location}
            </span>
          )}
        </div>
      </div>

      {/* Content Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24, opacity: contentOpacity }}>
        {/* Causes */}
        {causes.length > 0 && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.2)',
            border: '2px solid #ef4444',
            borderRadius: 16,
            padding: 20
          }}>
            <h3 style={{ color: '#fca5a5', fontSize: 18, margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>⬅️</span> Nedenleri
            </h3>
            <ul style={{ margin: 0, paddingLeft: 20 }}>
              {causes.map((cause, i) => (
                <li key={i} style={{ color: '#fef2f2', fontSize: 14, marginBottom: 8 }}>{cause}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Description / Key Figures */}
        <div style={{
          background: 'rgba(99, 102, 241, 0.2)',
          border: '2px solid #6366f1',
          borderRadius: 16,
          padding: 20
        }}>
          <h3 style={{ color: '#a5b4fc', fontSize: 18, margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>📖</span> Açıklama
          </h3>
          <p style={{ color: '#e0e7ff', fontSize: 14, lineHeight: 1.6, margin: 0 }}>{description}</p>

          {keyFigures.length > 0 && (
            <>
              <h4 style={{ color: '#a5b4fc', fontSize: 14, margin: '20px 0 12px 0' }}>👤 Önemli Kişiler:</h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {keyFigures.map((person, i) => (
                  <span key={i} style={{
                    padding: '4px 12px',
                    background: 'rgba(99, 102, 241, 0.3)',
                    borderRadius: 8,
                    color: 'white',
                    fontSize: 12
                  }}>
                    {person.name} <span style={{ color: '#a5b4fc' }}>({person.role})</span>
                  </span>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Effects */}
        {effects.length > 0 && (
          <div style={{
            background: 'rgba(16, 185, 129, 0.2)',
            border: '2px solid #10b981',
            borderRadius: 16,
            padding: 20
          }}>
            <h3 style={{ color: '#6ee7b7', fontSize: 18, margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>➡️</span> Sonuçları
            </h3>
            <ul style={{ margin: 0, paddingLeft: 20 }}>
              {effects.map((effect, i) => (
                <li key={i} style={{ color: '#ecfdf5', fontSize: 14, marginBottom: 8 }}>{effect}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{
        position: 'absolute',
        bottom: 24,
        left: 0,
        right: 0,
        textAlign: 'center',
        opacity: interpolate(frame, [fps * 1.5, fps * 2], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
      }}>
        <span style={{ color: '#94a3b8', fontSize: 14 }}>🌐 teknokul.com.tr</span>
      </div>
    </AbsoluteFill>
  )
}

export default HistoricalEvent
