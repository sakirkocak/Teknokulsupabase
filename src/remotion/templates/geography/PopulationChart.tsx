import React from 'react'
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from 'remotion'

interface PopulationChartProps {
  type: 'pyramid' | 'distribution' | 'density'
  data: Array<{
    label: string
    value: number
    color?: string
  }>
  title?: string
  total?: number
  unit?: string
}

export const PopulationChart: React.FC<PopulationChartProps> = ({
  type = 'distribution',
  data,
  title = 'Nüfus Dağılımı',
  total,
  unit = 'milyon'
}) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  const maxValue = Math.max(...data.map(d => d.value))
  const defaultColors = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#06b6d4']

  const renderPyramid = () => {
    // Age groups for pyramid (male left, female right)
    const ageGroups = ['0-14', '15-24', '25-34', '35-44', '45-54', '55-64', '65+']
    
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, flex: 1 }}>
        {/* Male side */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end' }}>
          {ageGroups.map((age, i) => {
            const delay = i * fps * 0.15
            const width = interpolate(frame, [delay, delay + fps * 0.5], [0, 100 - i * 10], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
            return (
              <div key={i} style={{
                height: 32,
                width: width * 2,
                background: 'linear-gradient(90deg, #3b82f6, #60a5fa)',
                borderRadius: '4px 0 0 4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-start',
                paddingLeft: 8
              }}>
                <span style={{ color: 'white', fontSize: 11, fontWeight: 'bold' }}>♂</span>
              </div>
            )
          })}
        </div>

        {/* Age labels */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'center' }}>
          {ageGroups.map((age, i) => (
            <div key={i} style={{ height: 32, display: 'flex', alignItems: 'center' }}>
              <span style={{ color: '#94a3b8', fontSize: 12, fontWeight: 'bold' }}>{age}</span>
            </div>
          ))}
        </div>

        {/* Female side */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-start' }}>
          {ageGroups.map((age, i) => {
            const delay = i * fps * 0.15
            const width = interpolate(frame, [delay, delay + fps * 0.5], [0, 100 - i * 10], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
            return (
              <div key={i} style={{
                height: 32,
                width: width * 2,
                background: 'linear-gradient(90deg, #f472b6, #ec4899)',
                borderRadius: '0 4px 4px 0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                paddingRight: 8
              }}>
                <span style={{ color: 'white', fontSize: 11, fontWeight: 'bold' }}>♀</span>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  const renderDistribution = () => (
    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 16, flex: 1, padding: '0 40px' }}>
      {data.map((item, i) => {
        const delay = i * fps * 0.2
        const height = interpolate(frame, [delay, delay + fps * 0.6], [0, (item.value / maxValue) * 280], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
        const color = item.color || defaultColors[i % defaultColors.length]

        return (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <span style={{ color: 'white', fontSize: 16, fontWeight: 'bold' }}>
              {item.value.toLocaleString()}
            </span>
            <div style={{
              width: 60,
              height,
              background: `linear-gradient(180deg, ${color}, ${color}99)`,
              borderRadius: '8px 8px 0 0',
              boxShadow: `0 0 20px ${color}40`
            }} />
            <span style={{ color: '#94a3b8', fontSize: 13, textAlign: 'center', maxWidth: 80 }}>
              {item.label}
            </span>
          </div>
        )
      })}
    </div>
  )

  const renderDensity = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, flex: 1, padding: '0 40px' }}>
      {data.map((item, i) => {
        const delay = i * fps * 0.15
        const width = interpolate(frame, [delay, delay + fps * 0.5], [0, (item.value / maxValue) * 100], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
        const color = item.color || defaultColors[i % defaultColors.length]

        return (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span style={{ color: '#e2e8f0', fontSize: 14, width: 120, textAlign: 'right' }}>{item.label}</span>
            <div style={{ flex: 1, height: 28, background: 'rgba(255,255,255,0.1)', borderRadius: 6, overflow: 'hidden' }}>
              <div style={{
                width: `${width}%`,
                height: '100%',
                background: `linear-gradient(90deg, ${color}, ${color}cc)`,
                borderRadius: 6,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                paddingRight: 8
              }}>
                {width > 20 && (
                  <span style={{ color: 'white', fontSize: 12, fontWeight: 'bold' }}>
                    {item.value} kişi/km²
                  </span>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )

  return (
    <AbsoluteFill style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)', padding: 40 }}>
      {/* Title */}
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <span style={{ fontSize: 32, color: 'white', fontWeight: 'bold' }}>👥 {title}</span>
        {total && (
          <div style={{ marginTop: 12 }}>
            <span style={{ 
              padding: '8px 20px', 
              background: 'rgba(251, 191, 36, 0.2)', 
              border: '1px solid #fbbf24',
              borderRadius: 20, 
              color: '#fbbf24',
              fontSize: 18 
            }}>
              Toplam: {total.toLocaleString()} {unit}
            </span>
          </div>
        )}
      </div>

      {/* Chart */}
      {type === 'pyramid' && renderPyramid()}
      {type === 'distribution' && renderDistribution()}
      {type === 'density' && renderDensity()}

      {/* Legend for pyramid */}
      {type === 'pyramid' && (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: 32,
          marginTop: 24,
          opacity: interpolate(frame, [fps * 1.5, fps * 2], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 20, height: 20, borderRadius: 4, background: '#3b82f6' }} />
            <span style={{ color: '#e2e8f0', fontSize: 14 }}>Erkek</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 20, height: 20, borderRadius: 4, background: '#ec4899' }} />
            <span style={{ color: '#e2e8f0', fontSize: 14 }}>Kadın</span>
          </div>
        </div>
      )}
    </AbsoluteFill>
  )
}

export default PopulationChart
