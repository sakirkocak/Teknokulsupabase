import React from 'react'
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion'

interface DNAHelixProps {
  showLabels?: boolean
  highlightBase?: 'A' | 'T' | 'G' | 'C'
  showReplication?: boolean
}

const basePairs = [
  { left: 'A', right: 'T', colorL: '#ef4444', colorR: '#3b82f6' },
  { left: 'T', right: 'A', colorL: '#3b82f6', colorR: '#ef4444' },
  { left: 'G', right: 'C', colorL: '#10b981', colorR: '#f59e0b' },
  { left: 'C', right: 'G', colorL: '#f59e0b', colorR: '#10b981' },
  { left: 'A', right: 'T', colorL: '#ef4444', colorR: '#3b82f6' },
  { left: 'G', right: 'C', colorL: '#10b981', colorR: '#f59e0b' },
  { left: 'T', right: 'A', colorL: '#3b82f6', colorR: '#ef4444' },
  { left: 'C', right: 'G', colorL: '#f59e0b', colorR: '#10b981' }
]

export const DNAHelix: React.FC<DNAHelixProps> = ({
  showLabels = true,
  highlightBase,
  showReplication = false
}) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  const rotation = frame * 0.02
  const helixHeight = 50

  return (
    <AbsoluteFill style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg viewBox="0 0 800 600" style={{ width: '100%', maxWidth: 900, height: 'auto' }}>
        {/* Title */}
        <text x="400" y="50" textAnchor="middle" fill="white" fontSize="28" fontWeight="bold">
          DNA Çift Sarmal Yapısı
        </text>

        {/* DNA Helix */}
        <g transform="translate(400, 320)">
          {basePairs.map((pair, i) => {
            const y = (i - 3.5) * helixHeight
            const angle = rotation + i * 0.6
            const xOffset = Math.sin(angle) * 80
            const depth = Math.cos(angle)
            const opacity = 0.5 + depth * 0.5

            const isHighlighted = highlightBase && (pair.left === highlightBase || pair.right === highlightBase)

            return (
              <g key={i} style={{ opacity }}>
                {/* Left backbone */}
                <circle
                  cx={-100 + xOffset}
                  cy={y}
                  r={isHighlighted ? 18 : 14}
                  fill={pair.colorL}
                  stroke={isHighlighted ? 'white' : 'none'}
                  strokeWidth="3"
                />
                <text x={-100 + xOffset} y={y + 5} textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">
                  {pair.left}
                </text>

                {/* Hydrogen bond (middle connector) */}
                <line
                  x1={-85 + xOffset}
                  y1={y}
                  x2={85 - xOffset}
                  y2={y}
                  stroke={depth > 0 ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.1)'}
                  strokeWidth="2"
                  strokeDasharray="4,4"
                />

                {/* Right backbone */}
                <circle
                  cx={100 - xOffset}
                  cy={y}
                  r={isHighlighted ? 18 : 14}
                  fill={pair.colorR}
                  stroke={isHighlighted ? 'white' : 'none'}
                  strokeWidth="3"
                />
                <text x={100 - xOffset} y={y + 5} textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">
                  {pair.right}
                </text>

                {/* Sugar-phosphate backbone lines */}
                {i < basePairs.length - 1 && (
                  <>
                    <line
                      x1={-100 + xOffset}
                      y1={y + 14}
                      x2={-100 + Math.sin(rotation + (i + 1) * 0.6) * 80}
                      y2={y + helixHeight - 14}
                      stroke="#6366f1"
                      strokeWidth="4"
                      opacity={opacity}
                    />
                    <line
                      x1={100 - xOffset}
                      y1={y + 14}
                      x2={100 - Math.sin(rotation + (i + 1) * 0.6) * 80}
                      y2={y + helixHeight - 14}
                      stroke="#8b5cf6"
                      strokeWidth="4"
                      opacity={opacity}
                    />
                  </>
                )}
              </g>
            )
          })}
        </g>

        {/* Labels */}
        {showLabels && (
          <g>
            {/* Base pair legend */}
            <rect x="580" y="100" width="200" height="180" rx="12" fill="rgba(0,0,0,0.6)" />
            <text x="680" y="130" textAnchor="middle" fill="white" fontSize="16" fontWeight="bold">Baz Çiftleri</text>
            
            <g transform="translate(600, 155)">
              <circle cx="0" cy="0" r="10" fill="#ef4444" />
              <text x="20" y="5" fill="#ef4444" fontSize="14" fontWeight="bold">A</text>
              <text x="40" y="5" fill="white" fontSize="12">Adenin</text>
            </g>
            <g transform="translate(600, 185)">
              <circle cx="0" cy="0" r="10" fill="#3b82f6" />
              <text x="20" y="5" fill="#3b82f6" fontSize="14" fontWeight="bold">T</text>
              <text x="40" y="5" fill="white" fontSize="12">Timin</text>
            </g>
            <g transform="translate(600, 215)">
              <circle cx="0" cy="0" r="10" fill="#10b981" />
              <text x="20" y="5" fill="#10b981" fontSize="14" fontWeight="bold">G</text>
              <text x="40" y="5" fill="white" fontSize="12">Guanin</text>
            </g>
            <g transform="translate(600, 245)">
              <circle cx="0" cy="0" r="10" fill="#f59e0b" />
              <text x="20" y="5" fill="#f59e0b" fontSize="14" fontWeight="bold">C</text>
              <text x="40" y="5" fill="white" fontSize="12">Sitozin</text>
            </g>

            {/* Info */}
            <rect x="20" y="100" width="200" height="100" rx="12" fill="rgba(0,0,0,0.6)" />
            <text x="120" y="130" textAnchor="middle" fill="#94a3b8" fontSize="14">Eşleşme Kuralı:</text>
            <text x="120" y="155" textAnchor="middle" fill="#ef4444" fontSize="16">A ↔ T</text>
            <text x="120" y="180" textAnchor="middle" fill="#10b981" fontSize="16">G ↔ C</text>
          </g>
        )}

        {/* 5' and 3' ends */}
        <text x="280" y="100" fill="#6366f1" fontSize="16" fontWeight="bold">5'</text>
        <text x="280" y="540" fill="#6366f1" fontSize="16" fontWeight="bold">3'</text>
        <text x="520" y="100" fill="#8b5cf6" fontSize="16" fontWeight="bold">3'</text>
        <text x="520" y="540" fill="#8b5cf6" fontSize="16" fontWeight="bold">5'</text>
      </svg>
    </AbsoluteFill>
  )
}

export default DNAHelix
