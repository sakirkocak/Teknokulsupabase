import React from 'react'
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from 'remotion'

interface SentenceAnalysisProps {
  sentence: string
  parts: Array<{
    text: string
    type: 'özne' | 'yüklem' | 'nesne' | 'dolaylı_tümleç' | 'zarf_tümleci' | 'edat_tümleci'
    color?: string
  }>
  showTree?: boolean
}

const typeColors: Record<string, string> = {
  'özne': '#ef4444',
  'yüklem': '#10b981',
  'nesne': '#3b82f6',
  'dolaylı_tümleç': '#f59e0b',
  'zarf_tümleci': '#8b5cf6',
  'edat_tümleci': '#ec4899'
}

const typeLabels: Record<string, string> = {
  'özne': 'Özne',
  'yüklem': 'Yüklem',
  'nesne': 'Nesne (Belirtili/Belirtisiz)',
  'dolaylı_tümleç': 'Dolaylı Tümleç',
  'zarf_tümleci': 'Zarf Tümleci',
  'edat_tümleci': 'Edat Tümleci'
}

export const SentenceAnalysis: React.FC<SentenceAnalysisProps> = ({
  sentence,
  parts,
  showTree = true
}) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  return (
    <AbsoluteFill style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #7c3aed 100%)', padding: 48 }}>
      {/* Title */}
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <span style={{ fontSize: 32, color: 'white', fontWeight: 'bold' }}>📝 Cümle Öğeleri Analizi</span>
      </div>

      {/* Original sentence */}
      <div style={{ 
        background: 'rgba(255,255,255,0.1)', 
        padding: 24, 
        borderRadius: 16, 
        marginBottom: 40,
        textAlign: 'center'
      }}>
        <p style={{ fontSize: 28, color: 'white', fontStyle: 'italic', margin: 0 }}>"{sentence}"</p>
      </div>

      {/* Analyzed parts */}
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 16, marginBottom: 40 }}>
        {parts.map((part, i) => {
          const delay = i * fps * 0.4
          const scale = spring({ frame: frame - delay, fps, config: { damping: 100 } })
          const color = part.color || typeColors[part.type] || '#94a3b8'

          return (
            <div
              key={i}
              style={{
                transform: `scale(${Math.max(0, scale)})`,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 8
              }}
            >
              <div style={{
                padding: '16px 24px',
                background: `${color}30`,
                border: `3px solid ${color}`,
                borderRadius: 12
              }}>
                <span style={{ fontSize: 24, color: 'white', fontWeight: 'bold' }}>{part.text}</span>
              </div>
              <div style={{
                padding: '6px 12px',
                background: color,
                borderRadius: 8
              }}>
                <span style={{ fontSize: 14, color: 'white', fontWeight: 'bold' }}>
                  {typeLabels[part.type] || part.type}
                </span>
              </div>
              {/* Arrow down */}
              {showTree && (
                <div style={{ width: 2, height: 20, background: color, opacity: 0.5 }} />
              )}
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div style={{
        position: 'absolute',
        bottom: 32,
        left: 32,
        right: 32,
        display: 'flex',
        justifyContent: 'center',
        flexWrap: 'wrap',
        gap: 16,
        opacity: interpolate(frame, [fps * 2, fps * 2.5], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
      }}>
        {Object.entries(typeColors).map(([type, color]) => (
          <div key={type} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 16, height: 16, borderRadius: 4, background: color }} />
            <span style={{ color: '#e2e8f0', fontSize: 14 }}>{typeLabels[type]}</span>
          </div>
        ))}
      </div>
    </AbsoluteFill>
  )
}

export default SentenceAnalysis
