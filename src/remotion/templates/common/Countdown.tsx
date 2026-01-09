import React from 'react'
import { useCurrentFrame, useVideoConfig, interpolate } from 'remotion'

interface CountdownProps {
  seconds: number
}

export const Countdown: React.FC<CountdownProps> = ({ seconds }) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  const remaining = Math.ceil(seconds - frame / fps)
  const progress = (frame / fps) / seconds
  const circumference = 2 * Math.PI * 36

  if (remaining <= 0) return null

  return (
    <div style={{ position: 'absolute', top: 24, right: 24 }}>
      <svg width="80" height="80" viewBox="0 0 80 80">
        {/* Background circle */}
        <circle cx="40" cy="40" r="36" fill="rgba(0,0,0,0.5)" stroke="rgba(255,255,255,0.3)" strokeWidth="4" />
        {/* Progress circle */}
        <circle
          cx="40" cy="40" r="36"
          fill="none" stroke="#fbbf24" strokeWidth="4"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * progress}
          transform="rotate(-90 40 40)"
        />
        {/* Number */}
        <text x="40" y="48" textAnchor="middle" fill="white" fontSize="28" fontWeight="bold">
          {remaining}
        </text>
      </svg>
    </div>
  )
}
