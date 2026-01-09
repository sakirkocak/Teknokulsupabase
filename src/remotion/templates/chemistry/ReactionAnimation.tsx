import React from 'react'
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from 'remotion'

interface ReactionAnimationProps {
  reactants: Array<{ formula: string; coefficient?: number; color?: string }>
  products: Array<{ formula: string; coefficient?: number; color?: string }>
  reactionType?: 'synthesis' | 'decomposition' | 'combustion' | 'neutralization'
  showBalancing?: boolean
}

const defaultColors = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6']

export const ReactionAnimation: React.FC<ReactionAnimationProps> = ({
  reactants = [{ formula: 'H₂', coefficient: 2 }, { formula: 'O₂', coefficient: 1 }],
  products = [{ formula: 'H₂O', coefficient: 2 }],
  reactionType = 'synthesis',
  showBalancing = true
}) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  // Animation phases
  const phase1 = interpolate(frame, [0, fps * 2], [0, 1], { extrapolateRight: 'clamp' }) // Reactants appear
  const phase2 = interpolate(frame, [fps * 2.5, fps * 4], [0, 1], { extrapolateRight: 'clamp' }) // Collision
  const phase3 = interpolate(frame, [fps * 4.5, fps * 6], [0, 1], { extrapolateRight: 'clamp' }) // Products appear

  const reactionLabels: Record<string, string> = {
    synthesis: 'Sentez (Birleşme)',
    decomposition: 'Ayrışma',
    combustion: 'Yanma',
    neutralization: 'Nötrleştirme'
  }

  return (
    <AbsoluteFill style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #4c1d95 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg viewBox="0 0 800 500" style={{ width: '100%', maxWidth: 900, height: 'auto' }}>
        {/* Title */}
        <text x="400" y="50" textAnchor="middle" fill="white" fontSize="28" fontWeight="bold">
          {reactionLabels[reactionType] || 'Kimyasal Reaksiyon'}
        </text>

        {/* Reactants side */}
        <g opacity={phase1} transform={`translate(${150 + phase2 * 100}, 200)`}>
          {reactants.map((r, i) => {
            const yOffset = i * 80 - ((reactants.length - 1) * 40)
            return (
              <g key={i} transform={`translate(0, ${yOffset})`}>
                {/* Molecule representation */}
                <circle cx="0" cy="0" r="35" fill={r.color || defaultColors[i % defaultColors.length]} opacity="0.8" />
                <text x="0" y="8" textAnchor="middle" fill="white" fontSize="20" fontWeight="bold">
                  {r.coefficient && r.coefficient > 1 ? r.coefficient : ''}{r.formula}
                </text>
                
                {/* Plus sign between reactants */}
                {i < reactants.length - 1 && (
                  <text x="0" y={50} textAnchor="middle" fill="#fbbf24" fontSize="36" fontWeight="bold">+</text>
                )}
              </g>
            )
          })}
        </g>

        {/* Reaction arrow */}
        <g opacity={phase2}>
          <line x1="320" y1="200" x2="480" y2="200" stroke="#fbbf24" strokeWidth="4" />
          <polygon points="480,200 465,190 465,210" fill="#fbbf24" />
          
          {/* Energy spark during collision */}
          {phase2 > 0.3 && phase2 < 0.8 && (
            <g transform="translate(400, 200)">
              {Array.from({ length: 8 }, (_, i) => {
                const angle = (i / 8) * Math.PI * 2
                const length = 20 + Math.random() * 15
                return (
                  <line
                    key={i}
                    x1="0" y1="0"
                    x2={Math.cos(angle) * length}
                    y2={Math.sin(angle) * length}
                    stroke="#fbbf24"
                    strokeWidth="2"
                    opacity={(phase2 - 0.3) * 2}
                  />
                )
              })}
            </g>
          )}
        </g>

        {/* Products side */}
        <g opacity={phase3} transform={`translate(${650 - (1 - phase3) * 50}, 200)`}>
          {products.map((p, i) => {
            const yOffset = i * 80 - ((products.length - 1) * 40)
            return (
              <g key={i} transform={`translate(0, ${yOffset})`}>
                <circle cx="0" cy="0" r="40" fill={p.color || '#10b981'} opacity="0.9">
                  <animate attributeName="r" values="35;42;35" dur="2s" repeatCount="indefinite" />
                </circle>
                <text x="0" y="8" textAnchor="middle" fill="white" fontSize="22" fontWeight="bold">
                  {p.coefficient && p.coefficient > 1 ? p.coefficient : ''}{p.formula}
                </text>
                
                {/* Plus sign between products */}
                {i < products.length - 1 && (
                  <text x="0" y={55} textAnchor="middle" fill="#fbbf24" fontSize="36" fontWeight="bold">+</text>
                )}
              </g>
            )
          })}
        </g>

        {/* Equation at bottom */}
        {showBalancing && (
          <g transform="translate(400, 420)" opacity={phase3}>
            <rect x="-350" y="-35" width="700" height="70" rx="12" fill="rgba(0,0,0,0.5)" />
            <text x="0" y="10" textAnchor="middle" fill="white" fontSize="24" fontFamily="monospace">
              {reactants.map((r, i) => 
                `${r.coefficient && r.coefficient > 1 ? r.coefficient : ''}${r.formula}${i < reactants.length - 1 ? ' + ' : ''}`
              ).join('')}
              {' → '}
              {products.map((p, i) => 
                `${p.coefficient && p.coefficient > 1 ? p.coefficient : ''}${p.formula}${i < products.length - 1 ? ' + ' : ''}`
              ).join('')}
            </text>
          </g>
        )}

        {/* Legend */}
        <g transform="translate(50, 350)">
          <text fill="#94a3b8" fontSize="14">Reaktanlar (Girenler)</text>
          <text y="80" fill="#94a3b8" fontSize="14">Ürünler (Çıkanlar)</text>
        </g>
      </svg>
    </AbsoluteFill>
  )
}

export default ReactionAnimation
