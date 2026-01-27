import React, { useMemo } from 'react'
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from 'remotion'
import katex from 'katex'

interface TextRevealProps {
  text: string
  style?: 'info' | 'success' | 'warning' | 'celebration'
  icon?: string
}

const bgColors: Record<string, string> = {
  info: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)',
  success: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
  warning: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
  celebration: 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)'
}

// LaTeX formüllerini KaTeX ile render et
function renderMathContent(text: string): string {
  try {
    // $$ ... $$ (display math) için
    let processed = text.replace(/\$\$(.*?)\$\$/g, (_, tex) => {
      try {
        return katex.renderToString(tex.trim(), { displayMode: true, throwOnError: false })
      } catch {
        return `$$${tex}$$`
      }
    })

    // $ ... $ (inline math) için
    processed = processed.replace(/\$([^\$]+?)\$/g, (_, tex) => {
      try {
        return katex.renderToString(tex.trim(), { displayMode: false, throwOnError: false })
      } catch {
        return `$${tex}$`
      }
    })

    return processed
  } catch (error) {
    return text
  }
}

export const TextReveal: React.FC<TextRevealProps> = ({ text, style = 'info', icon = '💡' }) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  const opacity = interpolate(frame, [0, fps * 0.5], [0, 1], { extrapolateRight: 'clamp' })
  const scale = spring({ frame, fps, config: { damping: 200 } })

  // LaTeX render (memoize for performance)
  const renderedHTML = useMemo(() => renderMathContent(text), [text])

  return (
    <AbsoluteFill style={{ background: bgColors[style], display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ opacity, transform: `scale(${scale})`, textAlign: 'center', padding: 48 }}>
        <div style={{ fontSize: 96, marginBottom: 32 }}>{icon}</div>
        <div
          style={{ fontSize: 48, fontWeight: 'bold', color: 'white', maxWidth: 900, lineHeight: 1.4 }}
          dangerouslySetInnerHTML={{ __html: renderedHTML }}
        />
      </div>
    </AbsoluteFill>
  )
}
