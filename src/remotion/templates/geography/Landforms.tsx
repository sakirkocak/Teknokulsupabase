import React from 'react'
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from 'remotion'

interface LandformsProps {
  type: 'mountain' | 'plateau' | 'plain' | 'valley' | 'delta' | 'coast'
  name?: string
  features?: string[]
  examples?: string[]
  altitude?: string
}

const landformData: Record<string, { icon: string; color: string; description: string }> = {
  'mountain': { icon: '🏔️', color: '#6366f1', description: 'Çevresine göre yüksek, eğimli yamaçları olan yer şekli' },
  'plateau': { icon: '🏜️', color: '#f59e0b', description: 'Yüksek ve düz ya da hafif dalgalı arazi' },
  'plain': { icon: '🌾', color: '#10b981', description: 'Alçak ve düz arazi, tarıma elverişli' },
  'valley': { icon: '🏞️', color: '#3b82f6', description: 'İki yüksek arazi arasında kalan çukur alan' },
  'delta': { icon: '🌊', color: '#06b6d4', description: 'Nehirlerin denize döküldüğü yerde oluşan üçgen şekilli alan' },
  'coast': { icon: '🏖️', color: '#ec4899', description: 'Kara ile denizin birleştiği hat' }
}

export const Landforms: React.FC<LandformsProps> = ({
  type,
  name,
  features = [],
  examples = [],
  altitude
}) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  const info = landformData[type] || landformData['mountain']
  const progress = interpolate(frame, [0, fps * 1.5], [0, 1], { extrapolateRight: 'clamp' })

  // SVG paths for different landforms
  const renderLandform = () => {
    switch (type) {
      case 'mountain':
        return (
          <g>
            <path d="M 100 350 L 250 100 L 400 350 Z" fill="url(#mountainGrad)" stroke="#6366f1" strokeWidth="3" />
            <path d="M 300 350 L 450 150 L 600 350 Z" fill="url(#mountainGrad2)" stroke="#818cf8" strokeWidth="3" />
            <path d="M 500 350 L 650 180 L 750 350 Z" fill="url(#mountainGrad)" stroke="#6366f1" strokeWidth="3" />
            {/* Snow caps */}
            <path d="M 230 130 L 250 100 L 270 130 Z" fill="white" />
            <path d="M 430 175 L 450 150 L 470 175 Z" fill="white" />
          </g>
        )
      case 'plateau':
        return (
          <g>
            <path d="M 50 350 L 100 200 L 700 200 L 750 350 Z" fill="url(#plateauGrad)" stroke="#f59e0b" strokeWidth="3" />
            <line x1="100" y1="200" x2="700" y2="200" stroke="#fbbf24" strokeWidth="4" />
          </g>
        )
      case 'plain':
        return (
          <g>
            <path d="M 50 300 Q 200 280 400 300 Q 600 320 750 300 L 750 350 L 50 350 Z" fill="url(#plainGrad)" stroke="#10b981" strokeWidth="3" />
            {/* Crops */}
            {[100, 200, 300, 400, 500, 600].map((x, i) => (
              <path key={i} d={`M ${x} 320 L ${x} 300 M ${x-5} 305 L ${x} 295 L ${x+5} 305`} stroke="#22c55e" strokeWidth="2" fill="none" />
            ))}
          </g>
        )
      case 'valley':
        return (
          <g>
            <path d="M 50 150 L 150 350 L 400 250 L 650 350 L 750 150 L 750 100 L 50 100 Z" fill="url(#valleyGrad)" stroke="#3b82f6" strokeWidth="3" />
            {/* River */}
            <path d="M 150 350 Q 275 300 400 250 Q 525 200 650 350" fill="none" stroke="#60a5fa" strokeWidth="8" />
          </g>
        )
      case 'delta':
        return (
          <g>
            {/* Water */}
            <rect x="50" y="250" width="700" height="100" fill="#0ea5e9" opacity="0.3" />
            {/* Delta shape */}
            <path d="M 380 100 L 200 350 L 600 350 Z" fill="url(#deltaGrad)" stroke="#06b6d4" strokeWidth="3" />
            {/* River branches */}
            <path d="M 400 100 L 400 200 L 300 350" fill="none" stroke="#0ea5e9" strokeWidth="6" />
            <path d="M 400 200 L 400 350" fill="none" stroke="#0ea5e9" strokeWidth="6" />
            <path d="M 400 200 L 500 350" fill="none" stroke="#0ea5e9" strokeWidth="6" />
          </g>
        )
      case 'coast':
        return (
          <g>
            {/* Sea */}
            <rect x="50" y="200" width="700" height="150" fill="url(#seaGrad)" />
            {/* Land */}
            <path d="M 50 200 Q 200 180 300 220 Q 400 240 500 200 Q 600 160 750 200 L 750 100 L 50 100 Z" fill="url(#coastGrad)" stroke="#ec4899" strokeWidth="3" />
            {/* Waves */}
            <path d="M 50 250 Q 150 230 250 250 Q 350 270 450 250 Q 550 230 650 250 Q 750 270 800 250" fill="none" stroke="white" strokeWidth="2" opacity="0.5" />
          </g>
        )
      default:
        return null
    }
  }

  return (
    <AbsoluteFill style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)', padding: 40 }}>
      {/* Title */}
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <span style={{ fontSize: 64 }}>{info.icon}</span>
        <h1 style={{ fontSize: 36, color: 'white', margin: '8px 0' }}>
          {name || type.charAt(0).toUpperCase() + type.slice(1)}
        </h1>
        {altitude && (
          <span style={{ padding: '6px 16px', background: 'rgba(255,255,255,0.1)', borderRadius: 12, color: '#94a3b8' }}>
            📐 Yükseklik: {altitude}
          </span>
        )}
      </div>

      <div style={{ display: 'flex', gap: 32, flex: 1 }}>
        {/* Left - Visualization */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg viewBox="0 0 800 400" style={{ width: '100%', maxWidth: 600, opacity: progress }}>
            {/* Sky gradient */}
            <rect x="0" y="0" width="800" height="400" fill="url(#skyGrad)" />
            
            {/* Ground line */}
            <line x1="0" y1="350" x2="800" y2="350" stroke="#475569" strokeWidth="2" />
            
            {renderLandform()}
            
            <defs>
              <linearGradient id="skyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#1e3a5f" />
                <stop offset="100%" stopColor="#0f172a" />
              </linearGradient>
              <linearGradient id="mountainGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#818cf8" />
                <stop offset="100%" stopColor="#4f46e5" />
              </linearGradient>
              <linearGradient id="mountainGrad2" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#a5b4fc" />
                <stop offset="100%" stopColor="#6366f1" />
              </linearGradient>
              <linearGradient id="plateauGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#fbbf24" />
                <stop offset="100%" stopColor="#b45309" />
              </linearGradient>
              <linearGradient id="plainGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#22c55e" />
                <stop offset="100%" stopColor="#15803d" />
              </linearGradient>
              <linearGradient id="valleyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#60a5fa" />
                <stop offset="100%" stopColor="#1d4ed8" />
              </linearGradient>
              <linearGradient id="deltaGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#22d3ee" />
                <stop offset="100%" stopColor="#0891b2" />
              </linearGradient>
              <linearGradient id="seaGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#0ea5e9" />
                <stop offset="100%" stopColor="#0369a1" />
              </linearGradient>
              <linearGradient id="coastGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#f472b6" />
                <stop offset="100%" stopColor="#be185d" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* Right - Info */}
        <div style={{ width: 300, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Description */}
          <div style={{
            background: `${info.color}20`,
            border: `2px solid ${info.color}`,
            borderRadius: 16,
            padding: 20,
            opacity: interpolate(frame, [fps * 0.5, fps], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
          }}>
            <h3 style={{ color: info.color, fontSize: 16, margin: '0 0 12px 0' }}>📖 Tanım</h3>
            <p style={{ color: '#e2e8f0', fontSize: 14, lineHeight: 1.6, margin: 0 }}>{info.description}</p>
          </div>

          {/* Features */}
          {features.length > 0 && (
            <div style={{
              background: 'rgba(0,0,0,0.4)',
              borderRadius: 16,
              padding: 20,
              opacity: interpolate(frame, [fps, fps * 1.5], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
            }}>
              <h3 style={{ color: '#a5b4fc', fontSize: 16, margin: '0 0 12px 0' }}>✨ Özellikleri</h3>
              <ul style={{ margin: 0, paddingLeft: 20 }}>
                {features.map((f, i) => (
                  <li key={i} style={{ color: '#e2e8f0', fontSize: 13, marginBottom: 6 }}>{f}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Examples */}
          {examples.length > 0 && (
            <div style={{
              background: 'rgba(0,0,0,0.4)',
              borderRadius: 16,
              padding: 20,
              opacity: interpolate(frame, [fps * 1.5, fps * 2], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
            }}>
              <h3 style={{ color: '#fbbf24', fontSize: 16, margin: '0 0 12px 0' }}>🌍 Türkiye'den Örnekler</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {examples.map((ex, i) => (
                  <span key={i} style={{
                    padding: '6px 12px',
                    background: 'rgba(251, 191, 36, 0.2)',
                    borderRadius: 8,
                    color: '#fef3c7',
                    fontSize: 13
                  }}>
                    {ex}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </AbsoluteFill>
  )
}

export default Landforms
