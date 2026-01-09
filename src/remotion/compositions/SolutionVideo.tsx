import React from 'react'
import { AbsoluteFill, Sequence, useVideoConfig, Audio } from 'remotion'
import { VideoProps, SolutionStep } from '../types'
import { TextReveal, StepByStep, QuizScreen, ResultScreen, Countdown } from '../templates/common'
import { EquationBalance, NumberLine, PieChart } from '../templates/math'

// Intro ekranı
const IntroScreen: React.FC<{ questionText: string; subjectName: string }> = ({ questionText, subjectName }) => (
  <AbsoluteFill style={{ background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 64 }}>
    <span style={{ padding: '12px 32px', background: 'rgba(255,255,255,0.2)', borderRadius: 32, color: 'white', fontSize: 28, marginBottom: 32 }}>
      {subjectName}
    </span>
    <p style={{ fontSize: 36, color: 'white', textAlign: 'center', maxWidth: 900, lineHeight: 1.5 }}>
      {questionText.substring(0, 300)}{questionText.length > 300 ? '...' : ''}
    </p>
  </AbsoluteFill>
)

// Step renderer
const StepRenderer: React.FC<{ step: SolutionStep; isLast: boolean }> = ({ step, isLast }) => {
  const template = step.animation_template || 'text_reveal'
  const data = step.animation_data || {}

  switch (template) {
    case 'text_reveal':
      return <TextReveal text={(data as any).text || step.content} style={(data as any).style} icon={(data as any).icon} />
    
    case 'step_by_step':
      const steps = (data as any).steps || [{ text: step.content }]
      return <StepByStep steps={steps.map((s: any) => typeof s === 'string' ? { text: s } : s)} />
    
    case 'equation_balance':
      return <EquationBalance leftSide={(data as any).left_side || '?'} rightSide={(data as any).right_side || '?'} steps={(data as any).steps} />
    
    case 'number_line':
      return <NumberLine min={(data as any).min || -10} max={(data as any).max || 10} points={(data as any).points} highlightRange={(data as any).highlight_range} />
    
    case 'pie_chart':
      return <PieChart segments={(data as any).segments || []} total={(data as any).total} highlightSegment={(data as any).highlight_segment} />
    
    case 'quiz_screen':
      if (step.quiz) {
        return <QuizScreen question={step.quiz.question} options={step.quiz.options} countdownSeconds={10} />
      }
      return <TextReveal text={step.content} style="warning" icon="❓" />
    
    case 'result_screen':
      return <ResultScreen correctAnswer={(data as any).text || step.content} />
    
    default:
      return <TextReveal text={step.content} style={isLast ? 'celebration' : 'info'} icon={isLast ? '🎉' : '💡'} />
  }
}

export const SolutionVideo: React.FC<VideoProps> = ({
  questionText,
  subjectName,
  steps,
  correctAnswer,
  audioUrls = []
}) => {
  const { fps } = useVideoConfig()

  // Timing
  const introFrames = fps * 4
  let currentFrame = introFrames

  const stepSequences = steps.map((step, i) => {
    const durationFrames = (step.duration_seconds || 6) * fps
    const startFrame = currentFrame
    currentFrame += durationFrames
    return { step, startFrame, durationFrames, index: i }
  })

  const outroStart = currentFrame
  const outroFrames = fps * 5

  return (
    <AbsoluteFill style={{ backgroundColor: '#0f172a' }}>
      {/* Intro */}
      <Sequence from={0} durationInFrames={introFrames}>
        <IntroScreen questionText={questionText} subjectName={subjectName} />
      </Sequence>

      {/* Steps */}
      {stepSequences.map(({ step, startFrame, durationFrames, index }) => (
        <Sequence key={step.id} from={startFrame} durationInFrames={durationFrames}>
          <StepRenderer step={step} isLast={index === steps.length - 1} />
          {step.type === 'quiz' && <Countdown seconds={10} />}
          {audioUrls[index] && <Audio src={audioUrls[index]} />}
        </Sequence>
      ))}

      {/* Outro */}
      <Sequence from={outroStart} durationInFrames={outroFrames}>
        <ResultScreen correctAnswer={correctAnswer} summary="Daha fazlası için teknokul.com.tr" />
      </Sequence>
    </AbsoluteFill>
  )
}

export default SolutionVideo
