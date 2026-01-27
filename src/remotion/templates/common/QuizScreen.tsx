import React, { useMemo } from 'react'
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from 'remotion'
import katex from 'katex'

interface QuizScreenProps {
  question: string
  options: { id: string; text: string; is_correct: boolean }[]
  showAnswer?: boolean
  countdownSeconds?: number
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

export const QuizScreen: React.FC<QuizScreenProps> = ({
  question, options, showAnswer = false, countdownSeconds = 10
}) => {
  const frame = useCurrentFrame()
  const { fps, durationInFrames } = useVideoConfig()

  const remaining = Math.ceil(countdownSeconds - frame / fps)
  const shouldShowAnswer = showAnswer || frame > durationInFrames - fps * 3

  // LaTeX render (memoize)
  const renderedQuestion = useMemo(() => renderMathContent(question), [question])
  const renderedOptions = useMemo(
    () => options.map(opt => ({ ...opt, renderedText: renderMathContent(opt.text) })),
    [options]
  )

  return (
    <AbsoluteFill style={{ background: 'linear-gradient(135deg, #ec4899 0%, #f43f5e 100%)', padding: 64 }}>
      {/* Countdown */}
      {!shouldShowAnswer && remaining > 0 && (
        <div style={{
          position: 'absolute', top: 32, right: 32,
          width: 80, height: 80, borderRadius: 40,
          background: '#fff', display: 'flex',
          alignItems: 'center', justifyContent: 'center'
        }}>
          <span style={{ fontSize: 36, fontWeight: 'bold', color: '#f43f5e' }}>{remaining}</span>
        </div>
      )}

      <div style={{ textAlign: 'center', marginBottom: 48 }}>
        <div style={{ fontSize: 72, marginBottom: 16 }}>❓</div>
        <h2
          style={{ fontSize: 36, color: 'white', margin: 0 }}
          dangerouslySetInnerHTML={{ __html: renderedQuestion }}
        />
        {!shouldShowAnswer && (
          <p style={{ fontSize: 24, color: 'rgba(255,255,255,0.8)', marginTop: 16 }}>
            Videoyu durdur ve düşün!
          </p>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, maxWidth: 900, margin: '0 auto' }}>
        {renderedOptions.map((opt, i) => {
          const delay = i * fps * 0.15
          const opacity = interpolate(frame, [delay, delay + fps * 0.3], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })

          const isCorrect = opt.is_correct
          const bgColor = shouldShowAnswer
            ? (isCorrect ? '#10b981' : 'rgba(255,255,255,0.2)')
            : 'rgba(255,255,255,0.2)'

          return (
            <div
              key={opt.id}
              style={{
                opacity,
                background: bgColor,
                padding: 24, borderRadius: 16,
                border: shouldShowAnswer && isCorrect ? '3px solid #34d399' : '2px solid rgba(255,255,255,0.3)'
              }}
            >
              <span
                style={{ fontSize: 24, color: 'white' }}
                dangerouslySetInnerHTML={{ __html: opt.renderedText }}
              />
              {shouldShowAnswer && isCorrect && (
                <span style={{ marginLeft: 16, fontSize: 32 }}>✓</span>
              )}
            </div>
          )
        })}
      </div>
    </AbsoluteFill>
  )
}
