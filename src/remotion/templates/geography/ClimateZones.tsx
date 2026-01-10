import React from 'react'
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from 'remotion'

interface ClimateZonesProps {
  zones: Array<{
    name: string
    temperature: string
    precipitation: string
    vegetation: string
    color: string
  }>
  highlightZone?: number
  showChart?: boolean
}

export const ClimateZones: React.FC<ClimateZonesProps> = ({
  zones = [
    { name: 'Ekvatoral', temperature: '25-28°C', precipitation: 'Yüksek (2000mm+)', vegetation: 'Yağmur Ormanları', color: '#10b981' },
    { name: 'Tropikal', temperature: '20-28°C', precipitation: 'Mevsimlik', vegetation: 'Savan', color: '#84cc16' },
    { name: 'Çöl', temperature: '20-40°C', precipitation: 'Çok düşük (<250mm)', vegetation: 'Çöl Bitkileri', color: '#f59e0b' },
    { name: 'Akdeniz', temperature: '10-25°C', precipitation: 'Kışın yağışlı', vegetation: 'Maki', color: '#3b82f6' },
    { name: 'Karasal', temperature: '-10 - 30°C', precipitation: 'Az-Orta', vegetation: 'Step/Bozkır', color: '#8b5cf6' }
  ],
  highlightZone,
  showChart = true
}) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  return (
    <AbsoluteFill style={{ background: 'linear-gradient(135deg, #0f172a 0%, #065f46 100%)', padding: 40 }}>
      {/* Title */}
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <span style={{ fontSize: 32, color: 'white', fontWeight: 'bold' }}>🌍 İklim Kuşakları</span>
      </div>

      {/* Climate zones visualization */}
      <div style={{ display: 'flex', gap: 24, flex: 1 }}>
        {/* Left - Zone bars (representing latitude bands) */}
        <div style={{ width: 120, display: 'flex', flexDirection: 'column', gap: 4 }}>
          {zones.map((zone, i) => {
            const delay = i * fps * 0.2
            const width = interpolate(frame, [delay, delay + fps * 0.5], [0, 100], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
            const isHighlighted = highlightZone === i

            return (
              <div
                key={i}
                style={{
                  flex: 1,
                  background: `linear-gradient(90deg, ${zone.color}, ${zone.color}80)`,
                  width: `${width}%`,
                  borderRadius: '0 8px 8px 0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: isHighlighted ? '2px solid white' : 'none',
                  boxShadow: isHighlighted ? `0 0 20px ${zone.color}` : 'none'
                }}
              >
                <span style={{ 
                  color: 'white', 
                  fontSize: 11, 
                  fontWeight: 'bold',
                  writingMode: 'vertical-rl',
                  transform: 'rotate(180deg)',
                  opacity: width > 50 ? 1 : 0
                }}>
                  {zone.name}
                </span>
              </div>
            )
          })}
        </div>

        {/* Right - Zone cards */}
        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
          {zones.map((zone, i) => {
            const delay = i * fps * 0.3
            const scale = spring({ frame: frame - delay, fps, config: { damping: 100 } })
            const isHighlighted = highlightZone === i

            return (
              <div
                key={i}
                style={{
                  transform: `scale(${Math.max(0, scale)})`,
                  background: isHighlighted ? `${zone.color}40` : 'rgba(0,0,0,0.4)',
                  border: `2px solid ${zone.color}`,
                  borderRadius: 16,
                  padding: 20,
                  boxShadow: isHighlighted ? `0 0 30px ${zone.color}50` : 'none'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                  <div style={{ width: 16, height: 16, borderRadius: 8, background: zone.color }} />
                  <h3 style={{ color: 'white', fontSize: 20, margin: 0, fontWeight: 'bold' }}>{zone.name}</h3>
                </div>

                <div style={{ display: 'grid', gap: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 18 }}>🌡️</span>
                    <span style={{ color: '#94a3b8', fontSize: 13 }}>Sıcaklık:</span>
                    <span style={{ color: 'white', fontSize: 14 }}>{zone.temperature}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 18 }}>🌧️</span>
                    <span style={{ color: '#94a3b8', fontSize: 13 }}>Yağış:</span>
                    <span style={{ color: 'white', fontSize: 14 }}>{zone.precipitation}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 18 }}>🌿</span>
                    <span style={{ color: '#94a3b8', fontSize: 13 }}>Bitki Örtüsü:</span>
                    <span style={{ color: 'white', fontSize: 14 }}>{zone.vegetation}</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </AbsoluteFill>
  )
}

export default ClimateZones
