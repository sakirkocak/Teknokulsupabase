import React from 'react'
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from 'remotion'

interface EquationBalanceProps {
  leftSide: string
  rightSide: string
  steps?: Array<{ operation: string; value: string; result_left: string; result_right: string }>
}

export const EquationBalance: React.FC<EquationBalanceProps> = ({ leftSide, rightSide, steps = [] }) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  const currentStepIndex = Math.min(Math.floor(frame / (fps * 2.5)), steps.length - 1)
  const swing = steps.length === 0 ? Math.sin(frame / fps * 2) * 3 : 0

  const currentLeft = currentStepIndex >= 0 && steps[currentStepIndex] 
    ? steps[currentStepIndex].result_left : leftSide
  const currentRight = currentStepIndex >= 0 && steps[currentStepIndex]
    ? steps[currentStepIndex].result_right : rightSide

  return (
    <AbsoluteFill style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg viewBox="0 0 600 400" style={{ width: '100%', maxWidth: 800, height: 'auto' }}>
        {/* Base */}
        <rect x="275" y="340" width="50" height="30" rx="5" fill="#92400e" />
        <rect x="290" y="180" width="20" height="160" fill="#b45309" />
        
        {/* Balance beam */}
        <g style={{ transform: `rotate(${swing}deg)`, transformOrigin: '300px 180px' }}>
          <rect x="100" y="170" width="400" height="20" rx="10" fill="#d97706" />
          <line x1="150" y1="190" x2="150" y2="260" stroke="#fbbf24" strokeWidth="4" />
          <line x1="450" y1="190" x2="450" y2="260" stroke="#fbbf24" strokeWidth="4" />
        </g>

        {/* Left pan */}
        <rect x="80" y="260" width="140" height="80" rx="15" fill="url(#leftGrad)" />
        <text x="150" y="310" textAnchor="middle" fill="white" fontSize="28" fontWeight="bold" fontFamily="monospace">
          {currentLeft}
        </text>

        {/* Right pan */}
        <rect x="380" y="260" width="140" height="80" rx="15" fill="url(#rightGrad)" />
        <text x="450" y="310" textAnchor="middle" fill="white" fontSize="28" fontWeight="bold" fontFamily="monospace">
          {currentRight}
        </text>

        {/* Equals */}
        <text x="300" y="320" textAnchor="middle" fill="#fbbf24" fontSize="48" fontWeight="bold">=</text>

        <defs>
          <linearGradient id="leftGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#4f46e5" />
          </linearGradient>
          <linearGradient id="rightGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>
        </defs>
      </svg>

      {/* Current operation */}
      {currentStepIndex >= 0 && steps[currentStepIndex] && (
        <div style={{
          position: 'absolute', bottom: 40,
          padding: '16px 32px', background: 'rgba(251, 191, 36, 0.2)',
          border: '2px solid #fbbf24', borderRadius: 12
        }}>
          <span style={{ color: '#fbbf24', fontSize: 24 }}>
            {steps[currentStepIndex].operation === 'subtract' && `➖ Her iki taraftan ${steps[currentStepIndex].value} çıkar`}
            {steps[currentStepIndex].operation === 'add' && `➕ Her iki tarafa ${steps[currentStepIndex].value} ekle`}
            {steps[currentStepIndex].operation === 'divide' && `➗ Her iki tarafı ${steps[currentStepIndex].value}'e böl`}
            {steps[currentStepIndex].operation === 'multiply' && `✖️ Her iki tarafı ${steps[currentStepIndex].value} ile çarp`}
          </span>
        </div>
      )}
    </AbsoluteFill>
  )
}
