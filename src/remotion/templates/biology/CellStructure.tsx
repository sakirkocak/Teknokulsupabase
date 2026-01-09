import React from 'react'
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from 'remotion'

interface CellStructureProps {
  cellType: 'animal' | 'plant' | 'bacteria'
  highlightPart?: string
  showLabels?: boolean
}

const organelles: Record<string, { name: string; color: string; description: string }> = {
  nucleus: { name: 'Çekirdek', color: '#6366f1', description: 'DNA içerir, hücrenin kontrol merkezi' },
  mitochondria: { name: 'Mitokondri', color: '#ef4444', description: 'Enerji üretimi (ATP)' },
  ribosome: { name: 'Ribozom', color: '#8b5cf6', description: 'Protein sentezi' },
  er: { name: 'Endoplazmik Retikulum', color: '#f59e0b', description: 'Madde taşınması' },
  golgi: { name: 'Golgi Cisimciği', color: '#10b981', description: 'Paketleme ve salgılama' },
  chloroplast: { name: 'Kloroplast', color: '#22c55e', description: 'Fotosentez' },
  vacuole: { name: 'Koful', color: '#06b6d4', description: 'Depolama' },
  cellWall: { name: 'Hücre Duvarı', color: '#84cc16', description: 'Koruma ve destek' }
}

export const CellStructure: React.FC<CellStructureProps> = ({
  cellType = 'animal',
  highlightPart,
  showLabels = true
}) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  const isPlant = cellType === 'plant'
  const progress = interpolate(frame, [0, fps * 2], [0, 1], { extrapolateRight: 'clamp' })

  return (
    <AbsoluteFill style={{ background: 'linear-gradient(135deg, #0f172a 0%, #134e4a 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg viewBox="0 0 800 600" style={{ width: '100%', maxWidth: 900, height: 'auto' }}>
        {/* Title */}
        <text x="400" y="40" textAnchor="middle" fill="white" fontSize="28" fontWeight="bold">
          {isPlant ? 'Bitki Hücresi' : cellType === 'bacteria' ? 'Bakteri Hücresi' : 'Hayvan Hücresi'}
        </text>

        {/* Cell membrane / wall */}
        <g opacity={progress}>
          {/* Cell wall (plant only) */}
          {isPlant && (
            <rect
              x="140" y="80" width="520" height="400" rx="20"
              fill="none"
              stroke={highlightPart === 'cellWall' ? '#84cc16' : 'rgba(132, 204, 22, 0.5)'}
              strokeWidth={highlightPart === 'cellWall' ? 8 : 4}
            />
          )}

          {/* Cell membrane */}
          <ellipse
            cx="400" cy="280" rx={isPlant ? 240 : 260} ry={isPlant ? 180 : 200}
            fill="rgba(14, 165, 233, 0.1)"
            stroke={highlightPart === 'membrane' ? '#0ea5e9' : 'rgba(14, 165, 233, 0.5)'}
            strokeWidth="3"
          />

          {/* Cytoplasm texture */}
          {Array.from({ length: 30 }, (_, i) => (
            <circle
              key={`cyto-${i}`}
              cx={250 + Math.random() * 300}
              cy={150 + Math.random() * 260}
              r={2 + Math.random() * 3}
              fill="rgba(148, 163, 184, 0.2)"
            />
          ))}

          {/* Nucleus */}
          <g opacity={interpolate(frame, [fps * 0.5, fps * 1], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })}>
            <ellipse
              cx="400" cy="280" rx="80" ry="60"
              fill={highlightPart === 'nucleus' ? organelles.nucleus.color : 'rgba(99, 102, 241, 0.5)'}
              stroke={organelles.nucleus.color}
              strokeWidth="3"
            />
            {/* Nucleolus */}
            <circle cx="400" cy="280" r="20" fill="#818cf8" />
            {/* Chromatin */}
            <path d="M 370 260 Q 400 300 430 260" fill="none" stroke="#a5b4fc" strokeWidth="2" />
          </g>

          {/* Mitochondria */}
          {[
            { x: 280, y: 180, r: -20 },
            { x: 520, y: 320, r: 30 },
            { x: 300, y: 380, r: 10 }
          ].map((m, i) => (
            <g key={`mito-${i}`} transform={`translate(${m.x}, ${m.y}) rotate(${m.r})`}
               opacity={interpolate(frame, [fps * 0.8 + i * 0.2, fps * 1.3 + i * 0.2], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })}>
              <ellipse cx="0" cy="0" rx="30" ry="15"
                fill={highlightPart === 'mitochondria' ? organelles.mitochondria.color : 'rgba(239, 68, 68, 0.5)'}
                stroke={organelles.mitochondria.color} strokeWidth="2"
              />
              {/* Inner membrane folds */}
              <path d="M -20 0 Q -15 -8 -10 0 Q -5 8 0 0 Q 5 -8 10 0 Q 15 8 20 0" fill="none" stroke="#fca5a5" strokeWidth="1.5" />
            </g>
          ))}

          {/* Chloroplast (plant only) */}
          {isPlant && (
            <g opacity={interpolate(frame, [fps * 1.2, fps * 1.7], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })}>
              {[{ x: 250, y: 230 }, { x: 530, y: 260 }].map((c, i) => (
                <g key={`chloro-${i}`} transform={`translate(${c.x}, ${c.y})`}>
                  <ellipse cx="0" cy="0" rx="40" ry="20"
                    fill={highlightPart === 'chloroplast' ? organelles.chloroplast.color : 'rgba(34, 197, 94, 0.5)'}
                    stroke={organelles.chloroplast.color} strokeWidth="2"
                  />
                  {/* Grana stacks */}
                  {[-15, 0, 15].map((gx, gi) => (
                    <rect key={gi} x={gx - 5} y="-8" width="10" height="16" rx="2" fill="#86efac" />
                  ))}
                </g>
              ))}
            </g>
          )}

          {/* Vacuole */}
          <ellipse
            cx={isPlant ? 400 : 480}
            cy={isPlant ? 280 : 200}
            rx={isPlant ? 120 : 40}
            ry={isPlant ? 100 : 30}
            fill={highlightPart === 'vacuole' ? 'rgba(6, 182, 212, 0.5)' : 'rgba(6, 182, 212, 0.2)'}
            stroke={organelles.vacuole.color}
            strokeWidth="2"
            opacity={interpolate(frame, [fps * 1.4, fps * 1.9], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })}
          />

          {/* Ribosomes */}
          {Array.from({ length: 15 }, (_, i) => (
            <circle
              key={`ribo-${i}`}
              cx={200 + Math.random() * 400}
              cy={130 + Math.random() * 300}
              r="4"
              fill={organelles.ribosome.color}
              opacity={interpolate(frame, [fps * 1.5, fps * 2], [0, 0.7], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })}
            />
          ))}

          {/* ER */}
          <path
            d="M 320 150 Q 280 180 300 220 Q 320 260 280 300"
            fill="none"
            stroke={highlightPart === 'er' ? organelles.er.color : 'rgba(245, 158, 11, 0.5)'}
            strokeWidth="6"
            opacity={interpolate(frame, [fps * 1.6, fps * 2.1], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })}
          />
        </g>

        {/* Labels */}
        {showLabels && (
          <g opacity={interpolate(frame, [fps * 2, fps * 2.5], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })}>
            {/* Legend box */}
            <rect x="600" y="100" width="180" height="280" rx="12" fill="rgba(0,0,0,0.6)" />
            <text x="690" y="130" textAnchor="middle" fill="white" fontSize="16" fontWeight="bold">Organeller</text>
            
            {Object.entries(organelles).slice(0, isPlant ? 7 : 5).map(([key, org], i) => (
              <g key={key} transform={`translate(620, ${155 + i * 30})`}>
                <circle cx="0" cy="0" r="8" fill={org.color} />
                <text x="15" y="5" fill="#e2e8f0" fontSize="12">{org.name}</text>
              </g>
            ))}
          </g>
        )}
      </svg>
    </AbsoluteFill>
  )
}

export default CellStructure
