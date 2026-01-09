import React from 'react'
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion'

interface ResultScreenProps {
  correctAnswer: string
  summary?: string
}

export const ResultScreen: React.FC<ResultScreenProps> = ({ correctAnswer, summary }) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  const scale = spring({ frame, fps, config: { damping: 100 } })
  const opacity = interpolate(frame, [0, fps * 0.5], [0, 1], { extrapolateRight: 'clamp' })

  // Confetti particles
  const particles = Array.from({ length: 30 }, (_, i) => ({
    x: Math.random() * 100,
    delay: i * 0.05,
    color: ['#fbbf24', '#10b981', '#6366f1', '#ef4444', '#ec4899'][i % 5]
  }))

  return (
    <AbsoluteFill style={{ background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)', overflow: 'hidden' }}>
      {/* Confetti */}
      {particles.map((p, i) => {
        const y = interpolate(frame, [p.delay * fps, p.delay * fps + fps * 2], [0, 120], { extrapolateRight: 'clamp' })
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: `${p.x}%`,
              top: `${y}%`,
              width: 12, height: 12,
              borderRadius: 6,
              background: p.color,
              opacity: 1 - y / 120
            }}
          />
        )
      })}

      <div style={{ 
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        height: '100%', opacity, transform: `scale(${scale})`
      }}>
        <div style={{ fontSize: 120, marginBottom: 32 }}>🎉</div>
        <h1 style={{ fontSize: 64, color: 'white', margin: 0, marginBottom: 16 }}>Tebrikler!</h1>
        <p style={{ fontSize: 40, color: 'rgba(255,255,255,0.9)', margin: 0, marginBottom: 32 }}>
          Doğru Cevap: <strong>{correctAnswer}</strong>
        </p>
        {summary && (
          <p style={{ fontSize: 24, color: 'rgba(255,255,255,0.8)', maxWidth: 700, textAlign: 'center' }}>
            {summary}
          </p>
        )}
        <div style={{ 
          marginTop: 48, padding: '16px 32px', 
          background: 'rgba(255,255,255,0.2)', borderRadius: 16 
        }}>
          <span style={{ fontSize: 28, color: 'white' }}>🌐 teknokul.com.tr</span>
        </div>
      </div>
    </AbsoluteFill>
  )
}
