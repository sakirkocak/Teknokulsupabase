import React from 'react'
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from 'remotion'

interface StepByStepProps {
  steps: Array<{ text: string; highlight?: boolean }>
}

export const StepByStep: React.FC<StepByStepProps> = ({ steps }) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  return (
    <AbsoluteFill style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #4c1d95 100%)', padding: 64 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {steps.map((step, i) => {
          const delay = i * fps * 0.4
          const opacity = interpolate(frame, [delay, delay + fps * 0.3], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
          const translateX = interpolate(frame, [delay, delay + fps * 0.3], [-50, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })

          return (
            <div
              key={i}
              style={{
                opacity,
                transform: `translateX(${translateX}px)`,
                display: 'flex',
                alignItems: 'flex-start',
                gap: 24,
                padding: 24,
                borderRadius: 16,
                background: step.highlight ? 'rgba(251, 191, 36, 0.3)' : 'rgba(255,255,255,0.1)',
                border: step.highlight ? '2px solid #fbbf24' : '2px solid transparent'
              }}
            >
              <div style={{
                width: 48, height: 48, borderRadius: 24,
                background: step.highlight ? '#fbbf24' : 'rgba(255,255,255,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 24, fontWeight: 'bold', color: step.highlight ? '#1e1b4b' : 'white'
              }}>
                {i + 1}
              </div>
              <p style={{ fontSize: 28, color: step.highlight ? '#fef3c7' : 'white', lineHeight: 1.5, margin: 0 }}>
                {step.text}
              </p>
            </div>
          )
        })}
      </div>
    </AbsoluteFill>
  )
}
