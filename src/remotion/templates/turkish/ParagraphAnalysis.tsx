import React from 'react'
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from 'remotion'

interface ParagraphAnalysisProps {
  paragraph: string
  mainIdea: string
  supportingIdeas?: string[]
  topic?: string
  tone?: 'nesnel' | 'öznel' | 'eleştirel' | 'betimleyici'
  highlightedSentences?: Array<{ index: number; label: string; color: string }>
}

export const ParagraphAnalysis: React.FC<ParagraphAnalysisProps> = ({
  paragraph,
  mainIdea,
  supportingIdeas = [],
  topic,
  tone,
  highlightedSentences = []
}) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  const sentences = paragraph.split(/(?<=[.!?])\s+/)
  const toneColors: Record<string, string> = {
    'nesnel': '#3b82f6',
    'öznel': '#f59e0b',
    'eleştirel': '#ef4444',
    'betimleyici': '#10b981'
  }

  return (
    <AbsoluteFill style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)', padding: 40 }}>
      {/* Title */}
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <span style={{ fontSize: 28, color: 'white', fontWeight: 'bold' }}>📖 Paragraf Analizi</span>
      </div>

      <div style={{ display: 'flex', gap: 32, height: 'calc(100% - 80px)' }}>
        {/* Left - Paragraph */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{
            flex: 1,
            background: 'rgba(255,255,255,0.05)',
            borderRadius: 16,
            padding: 24,
            overflow: 'auto'
          }}>
            <div style={{ fontSize: 20, color: '#e2e8f0', lineHeight: 1.8 }}>
              {sentences.map((sentence, i) => {
                const highlight = highlightedSentences.find(h => h.index === i)
                const delay = i * fps * 0.3
                const opacity = interpolate(frame, [delay, delay + fps * 0.3], [0.3, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })

                return (
                  <span
                    key={i}
                    style={{
                      opacity,
                      background: highlight ? `${highlight.color}30` : 'transparent',
                      borderBottom: highlight ? `2px solid ${highlight.color}` : 'none',
                      padding: highlight ? '2px 4px' : '0'
                    }}
                  >
                    {sentence}{' '}
                  </span>
                )
              })}
            </div>
          </div>

          {/* Tone indicator */}
          {tone && (
            <div style={{
              marginTop: 16,
              padding: '12px 20px',
              background: `${toneColors[tone]}20`,
              border: `2px solid ${toneColors[tone]}`,
              borderRadius: 12,
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              opacity: interpolate(frame, [fps * 2, fps * 2.5], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
            }}>
              <span style={{ fontSize: 24 }}>🎭</span>
              <span style={{ color: toneColors[tone], fontSize: 16, fontWeight: 'bold' }}>
                Anlatım: {tone.charAt(0).toUpperCase() + tone.slice(1)}
              </span>
            </div>
          )}
        </div>

        {/* Right - Analysis */}
        <div style={{ width: 320, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Topic */}
          {topic && (
            <div style={{
              background: 'rgba(99, 102, 241, 0.2)',
              border: '2px solid #6366f1',
              borderRadius: 12,
              padding: 16,
              opacity: interpolate(frame, [fps * 0.5, fps], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
            }}>
              <h3 style={{ color: '#a5b4fc', fontSize: 14, margin: '0 0 8px 0' }}>📌 KONU</h3>
              <p style={{ color: 'white', fontSize: 16, margin: 0 }}>{topic}</p>
            </div>
          )}

          {/* Main Idea */}
          <div style={{
            background: 'rgba(16, 185, 129, 0.2)',
            border: '2px solid #10b981',
            borderRadius: 12,
            padding: 16,
            opacity: interpolate(frame, [fps, fps * 1.5], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
          }}>
            <h3 style={{ color: '#6ee7b7', fontSize: 14, margin: '0 0 8px 0' }}>💡 ANA DÜŞÜNCE</h3>
            <p style={{ color: 'white', fontSize: 16, margin: 0 }}>{mainIdea}</p>
          </div>

          {/* Supporting Ideas */}
          {supportingIdeas.length > 0 && (
            <div style={{
              background: 'rgba(251, 191, 36, 0.2)',
              border: '2px solid #fbbf24',
              borderRadius: 12,
              padding: 16,
              opacity: interpolate(frame, [fps * 1.5, fps * 2], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
            }}>
              <h3 style={{ color: '#fcd34d', fontSize: 14, margin: '0 0 12px 0' }}>📝 YARDIMCI DÜŞÜNCELER</h3>
              <ul style={{ margin: 0, paddingLeft: 20 }}>
                {supportingIdeas.map((idea, i) => (
                  <li key={i} style={{ color: '#fef3c7', fontSize: 14, marginBottom: 8 }}>{idea}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Highlighted sentences legend */}
          {highlightedSentences.length > 0 && (
            <div style={{
              background: 'rgba(0,0,0,0.3)',
              borderRadius: 12,
              padding: 16,
              opacity: interpolate(frame, [fps * 2, fps * 2.5], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
            }}>
              <h3 style={{ color: '#94a3b8', fontSize: 14, margin: '0 0 12px 0' }}>🔍 İŞARETLENENLER</h3>
              {highlightedSentences.map((h, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <div style={{ width: 12, height: 12, borderRadius: 3, background: h.color }} />
                  <span style={{ color: '#e2e8f0', fontSize: 13 }}>{h.label}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AbsoluteFill>
  )
}

export default ParagraphAnalysis
