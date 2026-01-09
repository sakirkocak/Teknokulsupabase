import React from 'react'
import { AbsoluteFill, Sequence, useVideoConfig, useCurrentFrame, interpolate } from 'remotion'
import { VideoProps } from '../types'
import { TextReveal, Countdown } from '../templates/common'

// Dikey format için optimize edilmiş Short video
export const SolutionShort: React.FC<VideoProps> = ({
  questionText,
  subjectName,
  steps,
  correctAnswer
}) => {
  const { fps, durationInFrames } = useVideoConfig()
  const frame = useCurrentFrame()

  // Shorts için kısa tutulmuş timing
  const introFrames = fps * 3
  const questionFrames = fps * 5
  const thinkFrames = fps * 8 // "Düşün!" ekranı
  const answerFrames = fps * 4

  return (
    <AbsoluteFill style={{ backgroundColor: '#0f172a' }}>
      {/* Intro - Ders adı */}
      <Sequence from={0} durationInFrames={introFrames}>
        <AbsoluteFill style={{ background: 'linear-gradient(180deg, #6366f1 0%, #8b5cf6 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <span style={{ fontSize: 120, display: 'block', marginBottom: 32 }}>🎓</span>
            <span style={{ fontSize: 48, color: 'white', fontWeight: 'bold' }}>{subjectName}</span>
          </div>
        </AbsoluteFill>
      </Sequence>

      {/* Soru */}
      <Sequence from={introFrames} durationInFrames={questionFrames}>
        <AbsoluteFill style={{ background: 'linear-gradient(180deg, #1e1b4b 0%, #312e81 100%)', padding: 48 }}>
          <div style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <span style={{ fontSize: 32, color: '#a5b4fc', marginBottom: 24 }}>📝 SORU</span>
            <p style={{ fontSize: 36, color: 'white', lineHeight: 1.6 }}>
              {questionText.substring(0, 200)}{questionText.length > 200 ? '...' : ''}
            </p>
          </div>
        </AbsoluteFill>
      </Sequence>

      {/* Düşün! - Geri sayım */}
      <Sequence from={introFrames + questionFrames} durationInFrames={thinkFrames}>
        <AbsoluteFill style={{ background: 'linear-gradient(180deg, #f59e0b 0%, #d97706 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: 96, marginBottom: 32 }}>🤔</span>
          <span style={{ fontSize: 64, color: 'white', fontWeight: 'bold', marginBottom: 48 }}>DÜŞÜN!</span>
          <Countdown seconds={8} />
          <span style={{ fontSize: 28, color: 'rgba(255,255,255,0.8)', marginTop: 48, textAlign: 'center', padding: '0 32px' }}>
            Cevabı bulduysan yorumlara yaz!
          </span>
        </AbsoluteFill>
      </Sequence>

      {/* Cevap */}
      <Sequence from={introFrames + questionFrames + thinkFrames} durationInFrames={answerFrames}>
        <AbsoluteFill style={{ background: 'linear-gradient(180deg, #10b981 0%, #059669 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: 120, marginBottom: 32 }}>🎉</span>
          <span style={{ fontSize: 36, color: 'rgba(255,255,255,0.8)', marginBottom: 16 }}>CEVAP</span>
          <span style={{ fontSize: 56, color: 'white', fontWeight: 'bold', textAlign: 'center', padding: '0 32px' }}>
            {correctAnswer}
          </span>
          <div style={{ marginTop: 64, padding: '16px 32px', background: 'rgba(0,0,0,0.2)', borderRadius: 16 }}>
            <span style={{ fontSize: 24, color: 'white' }}>🌐 teknokul.com.tr</span>
          </div>
        </AbsoluteFill>
      </Sequence>
    </AbsoluteFill>
  )
}

export default SolutionShort
