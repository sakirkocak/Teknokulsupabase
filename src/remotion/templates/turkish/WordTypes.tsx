import React from 'react'
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from 'remotion'

interface WordTypesProps {
  word: string
  type: 'isim' | 'sıfat' | 'zarf' | 'fiil' | 'zamir' | 'edat' | 'bağlaç' | 'ünlem'
  examples?: string[]
  definition?: string
  features?: string[]
}

const typeInfo: Record<string, { color: string; icon: string; description: string }> = {
  'isim': { color: '#3b82f6', icon: '📦', description: 'Varlıkları, kavramları karşılayan sözcükler' },
  'sıfat': { color: '#10b981', icon: '🎨', description: 'İsimleri niteleyen veya belirten sözcükler' },
  'zarf': { color: '#f59e0b', icon: '⚡', description: 'Fiilleri, sıfatları, zarfları etkileyen sözcükler' },
  'fiil': { color: '#ef4444', icon: '🏃', description: 'Kılış, durum, oluş bildiren sözcükler' },
  'zamir': { color: '#8b5cf6', icon: '👆', description: 'İsimlerin yerine kullanılan sözcükler' },
  'edat': { color: '#ec4899', icon: '🔗', description: 'Sözcükler arası ilişki kuran sözcükler' },
  'bağlaç': { color: '#06b6d4', icon: '⛓️', description: 'Cümleleri veya öğeleri bağlayan sözcükler' },
  'ünlem': { color: '#f97316', icon: '❗', description: 'Duygu ve heyecan bildiren sözcükler' }
}

export const WordTypes: React.FC<WordTypesProps> = ({
  word,
  type,
  examples = [],
  definition,
  features = []
}) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  const info = typeInfo[type] || { color: '#94a3b8', icon: '📝', description: '' }
  const mainScale = spring({ frame, fps, config: { damping: 100 } })

  return (
    <AbsoluteFill style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #4c1d95 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ maxWidth: 900, width: '100%', padding: 48 }}>
        {/* Title */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <span style={{ fontSize: 28, color: '#a5b4fc' }}>Sözcük Türleri</span>
        </div>

        {/* Main word card */}
        <div style={{
          transform: `scale(${mainScale})`,
          background: `linear-gradient(135deg, ${info.color}40, ${info.color}20)`,
          border: `3px solid ${info.color}`,
          borderRadius: 24,
          padding: 32,
          marginBottom: 32
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, marginBottom: 24 }}>
            <span style={{ fontSize: 64 }}>{info.icon}</span>
            <div>
              <h1 style={{ fontSize: 48, color: 'white', margin: 0 }}>{word}</h1>
              <span style={{ 
                display: 'inline-block',
                padding: '8px 20px', 
                background: info.color, 
                borderRadius: 20,
                color: 'white',
                fontSize: 18,
                fontWeight: 'bold',
                marginTop: 8
              }}>
                {type.toUpperCase()}
              </span>
            </div>
          </div>

          {/* Definition */}
          {(definition || info.description) && (
            <p style={{ 
              fontSize: 20, 
              color: '#e2e8f0', 
              textAlign: 'center',
              margin: 0,
              opacity: interpolate(frame, [fps * 0.5, fps], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
            }}>
              {definition || info.description}
            </p>
          )}
        </div>

        {/* Features */}
        {features.length > 0 && (
          <div style={{ 
            display: 'flex', 
            flexWrap: 'wrap', 
            gap: 12, 
            justifyContent: 'center',
            marginBottom: 32,
            opacity: interpolate(frame, [fps, fps * 1.5], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
          }}>
            {features.map((feature, i) => (
              <span key={i} style={{
                padding: '10px 20px',
                background: 'rgba(255,255,255,0.1)',
                borderRadius: 12,
                color: '#e2e8f0',
                fontSize: 16
              }}>
                ✓ {feature}
              </span>
            ))}
          </div>
        )}

        {/* Examples */}
        {examples.length > 0 && (
          <div style={{ 
            background: 'rgba(0,0,0,0.3)', 
            borderRadius: 16, 
            padding: 24,
            opacity: interpolate(frame, [fps * 1.5, fps * 2], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
          }}>
            <h3 style={{ color: '#a5b4fc', fontSize: 18, margin: '0 0 16px 0' }}>📚 Örnekler:</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
              {examples.map((ex, i) => (
                <span key={i} style={{
                  padding: '8px 16px',
                  background: `${info.color}30`,
                  border: `1px solid ${info.color}`,
                  borderRadius: 8,
                  color: 'white',
                  fontSize: 18
                }}>
                  {ex}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </AbsoluteFill>
  )
}

export default WordTypes
