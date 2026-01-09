import React from 'react'
import { 
  AbsoluteFill, 
  Sequence, 
  useCurrentFrame, 
  useVideoConfig,
  interpolate,
  spring,
  Audio,
  Img
} from 'remotion'

// =================================================================
// TYPES
// =================================================================
interface SolutionStep {
  id: string
  type: string
  title: string
  content: string
  tts_text: string
  duration_seconds: number
  animation_template: string
  animation_data?: Record<string, unknown>
  quiz?: {
    question: string
    options: { id: string; text: string; is_correct: boolean }[]
  }
}

interface SolutionCompositionProps {
  questionText: string
  subjectName: string
  steps: SolutionStep[]
  correctAnswer: string
  audioUrls?: string[]
}

// =================================================================
// ANIMATION COMPONENTS
// =================================================================

// Metin Animasyonu
const TextRevealAnimation: React.FC<{ 
  text: string
  style?: 'info' | 'success' | 'warning' | 'celebration'
  icon?: string
}> = ({ text, style = 'info', icon = '💡' }) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  const opacity = interpolate(frame, [0, fps * 0.5], [0, 1], { extrapolateRight: 'clamp' })
  const scale = spring({ frame, fps, config: { damping: 200 } })

  const bgColors = {
    info: 'from-blue-600 to-indigo-700',
    success: 'from-green-600 to-emerald-700',
    warning: 'from-amber-500 to-orange-600',
    celebration: 'from-purple-600 to-pink-600'
  }

  return (
    <AbsoluteFill className={`bg-gradient-to-br ${bgColors[style]} flex items-center justify-center`}>
      <div style={{ opacity, transform: `scale(${scale})` }} className="text-center p-12">
        <div className="text-8xl mb-8">{icon}</div>
        <div className="text-4xl font-bold text-white max-w-4xl leading-relaxed">
          {text}
        </div>
      </div>
    </AbsoluteFill>
  )
}

// Adım Listesi Animasyonu
const StepByStepAnimation: React.FC<{
  steps: Array<{ text: string; highlight?: boolean }>
}> = ({ steps }) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  return (
    <AbsoluteFill className="bg-gradient-to-br from-slate-900 to-violet-900 p-16">
      <div className="space-y-6">
        {steps.map((step, i) => {
          const delay = i * fps * 0.5
          const opacity = interpolate(frame, [delay, delay + fps * 0.3], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
          const translateX = interpolate(frame, [delay, delay + fps * 0.3], [-50, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })

          return (
            <div
              key={i}
              style={{ opacity, transform: `translateX(${translateX}px)` }}
              className={`flex items-start gap-6 p-6 rounded-2xl ${
                step.highlight ? 'bg-amber-500/30 border-2 border-amber-400' : 'bg-white/10'
              }`}
            >
              <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold ${
                step.highlight ? 'bg-amber-500 text-white' : 'bg-white/20 text-white'
              }`}>
                {i + 1}
              </div>
              <p className={`text-2xl leading-relaxed ${step.highlight ? 'text-amber-200 font-semibold' : 'text-white'}`}>
                {step.text}
              </p>
            </div>
          )
        })}
      </div>
    </AbsoluteFill>
  )
}

// Terazi (Denklem) Animasyonu
const EquationBalanceAnimation: React.FC<{
  leftSide: string
  rightSide: string
}> = ({ leftSide, rightSide }) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  const swing = Math.sin(frame / fps * 2) * 3

  return (
    <AbsoluteFill className="bg-gradient-to-br from-slate-900 to-indigo-900 flex items-center justify-center">
      <svg viewBox="0 0 600 400" className="w-full max-w-3xl">
        {/* Taban */}
        <rect x="275" y="340" width="50" height="30" rx="5" fill="#92400e" />
        <rect x="290" y="180" width="20" height="160" fill="#b45309" />
        
        {/* Terazi Kolu */}
        <g style={{ transform: `rotate(${swing}deg)`, transformOrigin: '300px 180px' }}>
          <rect x="100" y="170" width="400" height="20" rx="10" fill="#d97706" />
          
          {/* Sol Kefe */}
          <line x1="150" y1="190" x2="150" y2="260" stroke="#fbbf24" strokeWidth="4" />
          <rect x="80" y="260" width="140" height="80" rx="15" fill="url(#leftGrad)" />
          <text x="150" y="310" textAnchor="middle" fill="white" fontSize="28" fontWeight="bold" fontFamily="monospace">
            {leftSide}
          </text>
          
          {/* Sağ Kefe */}
          <line x1="450" y1="190" x2="450" y2="260" stroke="#fbbf24" strokeWidth="4" />
          <rect x="380" y="260" width="140" height="80" rx="15" fill="url(#rightGrad)" />
          <text x="450" y="310" textAnchor="middle" fill="white" fontSize="28" fontWeight="bold" fontFamily="monospace">
            {rightSide}
          </text>
        </g>

        {/* Eşittir */}
        <text x="300" y="320" textAnchor="middle" fill="#fbbf24" fontSize="48" fontWeight="bold">=</text>

        <defs>
          <linearGradient id="leftGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#4f46e5" />
          </linearGradient>
          <linearGradient id="rightGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>
        </defs>
      </svg>
    </AbsoluteFill>
  )
}

// Geri Sayım Komponenti (YouTube için)
const CountdownOverlay: React.FC<{ seconds: number }> = ({ seconds }) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const remaining = Math.ceil(seconds - frame / fps)

  if (remaining <= 0) return null

  return (
    <div className="absolute top-8 right-8 w-20 h-20 rounded-full bg-orange-500 flex items-center justify-center">
      <span className="text-3xl font-bold text-white">{remaining}</span>
    </div>
  )
}

// Quiz Komponenti
const QuizAnimation: React.FC<{
  question: string
  options: { id: string; text: string; is_correct: boolean }[]
  showAnswer: boolean
}> = ({ question, options, showAnswer }) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  return (
    <AbsoluteFill className="bg-gradient-to-br from-pink-600 to-rose-700 p-16">
      <div className="text-center mb-12">
        <div className="text-6xl mb-4">❓</div>
        <h2 className="text-3xl font-bold text-white">{question}</h2>
        {!showAnswer && (
          <p className="text-xl text-white/80 mt-4">Videoyu durdur ve düşün!</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-6 max-w-4xl mx-auto">
        {options.map((opt, i) => {
          const delay = i * fps * 0.2
          const opacity = interpolate(frame, [delay, delay + fps * 0.3], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
          
          const isCorrect = opt.is_correct
          const bgColor = showAnswer 
            ? (isCorrect ? 'bg-green-500' : 'bg-white/20')
            : 'bg-white/20'

          return (
            <div
              key={opt.id}
              style={{ opacity }}
              className={`${bgColor} p-6 rounded-2xl border-2 ${showAnswer && isCorrect ? 'border-green-300' : 'border-white/30'}`}
            >
              <span className="text-2xl text-white">{opt.text}</span>
              {showAnswer && isCorrect && (
                <span className="ml-4 text-3xl">✓</span>
              )}
            </div>
          )
        })}
      </div>

      <CountdownOverlay seconds={10} />
    </AbsoluteFill>
  )
}

// =================================================================
// STEP RENDERER
// =================================================================
const StepRenderer: React.FC<{
  step: SolutionStep
  isLastStep: boolean
}> = ({ step, isLastStep }) => {
  const frame = useCurrentFrame()
  const { fps, durationInFrames } = useVideoConfig()

  // Quiz için cevabı son 3 saniyede göster
  const showAnswer = step.type === 'quiz' && frame > durationInFrames - fps * 3

  switch (step.animation_template) {
    case 'text_reveal':
      const textData = step.animation_data as { text?: string; style?: string; icon?: string } || {}
      return (
        <TextRevealAnimation 
          text={textData.text || step.content}
          style={(textData.style as any) || (isLastStep ? 'celebration' : 'info')}
          icon={textData.icon || (isLastStep ? '🎉' : '💡')}
        />
      )

    case 'step_by_step':
      const stepData = step.animation_data as { steps?: any[] } || {}
      const steps = (stepData.steps || []).map((s: any) => 
        typeof s === 'string' ? { text: s } : s
      )
      return <StepByStepAnimation steps={steps.length > 0 ? steps : [{ text: step.content }]} />

    case 'equation_balance':
      const eqData = step.animation_data as { left_side?: string; right_side?: string } || {}
      return (
        <EquationBalanceAnimation 
          leftSide={eqData.left_side || '?'} 
          rightSide={eqData.right_side || '?'} 
        />
      )

    default:
      // Quiz veya bilinmeyen template
      if (step.type === 'quiz' && step.quiz) {
        return (
          <QuizAnimation 
            question={step.quiz.question}
            options={step.quiz.options}
            showAnswer={showAnswer}
          />
        )
      }

      // Default: Text reveal
      return (
        <TextRevealAnimation 
          text={step.content}
          style={isLastStep ? 'celebration' : 'info'}
          icon={step.type === 'result' ? '✅' : '📝'}
        />
      )
  }
}

// =================================================================
// INTRO & OUTRO
// =================================================================
const IntroSequence: React.FC<{ questionText: string; subjectName: string }> = ({ 
  questionText, 
  subjectName 
}) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  const titleOpacity = interpolate(frame, [0, fps], [0, 1], { extrapolateRight: 'clamp' })
  const questionOpacity = interpolate(frame, [fps, fps * 2], [0, 1], { extrapolateRight: 'clamp' })

  return (
    <AbsoluteFill className="bg-gradient-to-br from-indigo-600 to-purple-700 flex flex-col items-center justify-center p-16">
      <div style={{ opacity: titleOpacity }} className="mb-8">
        <span className="px-6 py-3 bg-white/20 rounded-full text-white text-2xl font-medium">
          {subjectName}
        </span>
      </div>
      <div style={{ opacity: questionOpacity }} className="text-center max-w-4xl">
        <p className="text-3xl text-white leading-relaxed">
          {questionText.substring(0, 300)}{questionText.length > 300 ? '...' : ''}
        </p>
      </div>
    </AbsoluteFill>
  )
}

const OutroSequence: React.FC<{ correctAnswer: string }> = ({ correctAnswer }) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  const scale = spring({ frame, fps, config: { damping: 100 } })

  return (
    <AbsoluteFill className="bg-gradient-to-br from-emerald-600 to-teal-700 flex flex-col items-center justify-center">
      <div style={{ transform: `scale(${scale})` }} className="text-center">
        <div className="text-9xl mb-8">🎉</div>
        <h1 className="text-5xl font-bold text-white mb-4">Tebrikler!</h1>
        <p className="text-3xl text-white/90 mb-8">Doğru Cevap: {correctAnswer}</p>
        <div className="mt-12 px-8 py-4 bg-white/20 rounded-2xl">
          <p className="text-2xl text-white">
            🌐 teknokul.com.tr
          </p>
        </div>
      </div>
    </AbsoluteFill>
  )
}

// =================================================================
// MAIN COMPOSITION
// =================================================================
export const SolutionComposition: React.FC<SolutionCompositionProps> = ({
  questionText,
  subjectName,
  steps,
  correctAnswer,
  audioUrls = []
}) => {
  const { fps } = useVideoConfig()

  // Intro: 4 saniye
  const introFrames = fps * 4
  
  // Her adım için frame hesapla
  let currentFrame = introFrames
  const stepSequences = steps.map((step, index) => {
    const durationFrames = step.duration_seconds * fps
    const startFrame = currentFrame
    currentFrame += durationFrames
    return { step, startFrame, durationFrames, index }
  })

  // Outro: 5 saniye
  const outroFrames = fps * 5
  const outroStart = currentFrame

  return (
    <AbsoluteFill style={{ backgroundColor: '#1e1b4b' }}>
      {/* Intro */}
      <Sequence from={0} durationInFrames={introFrames}>
        <IntroSequence questionText={questionText} subjectName={subjectName} />
      </Sequence>

      {/* Steps */}
      {stepSequences.map(({ step, startFrame, durationFrames, index }) => (
        <Sequence key={step.id} from={startFrame} durationInFrames={durationFrames}>
          <StepRenderer step={step} isLastStep={index === steps.length - 1} />
          {audioUrls[index] && <Audio src={audioUrls[index]} />}
        </Sequence>
      ))}

      {/* Outro */}
      <Sequence from={outroStart} durationInFrames={outroFrames}>
        <OutroSequence correctAnswer={correctAnswer} />
      </Sequence>
    </AbsoluteFill>
  )
}

export default SolutionComposition
