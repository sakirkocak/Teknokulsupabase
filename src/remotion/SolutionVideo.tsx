/**
 * Remotion ile YouTube Video Üretimi
 * 
 * Bu dosya InteractiveSolutionPlayer'ın video versiyonudur.
 * Aynı JSON verisini kullanır ama:
 * - Tıklanabilir butonlar yerine geri sayım gösterir
 * - Quiz adımlarında "Videoyu durdur" der
 * - TTS audio'yu video'ya embed eder
 */

import { AbsoluteFill, Sequence, useCurrentFrame, useVideoConfig, Audio, Img, interpolate } from 'remotion'

// Types (aynı InteractiveSolutionPlayer ile)
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

interface SolutionVideoProps {
  solution: {
    steps: SolutionStep[]
    summary: string
  }
  questionText: string
  audioUrls?: string[]  // Her adım için TTS audio URL'leri
  subjectName?: string
}

// Geri Sayım Komponenti
const Countdown = ({ seconds }: { seconds: number }) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const currentSecond = Math.ceil(seconds - frame / fps)
  
  return (
    <div style={{
      position: 'absolute',
      top: 20,
      right: 20,
      width: 60,
      height: 60,
      borderRadius: '50%',
      background: 'rgba(255, 165, 0, 0.9)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: 24,
      fontWeight: 'bold',
      color: 'white'
    }}>
      {currentSecond > 0 ? currentSecond : '✓'}
    </div>
  )
}

// Intro Sequence
const IntroSequence = ({ questionText, subjectName }: { questionText: string; subjectName?: string }) => {
  const frame = useCurrentFrame()
  const opacity = interpolate(frame, [0, 30], [0, 1], { extrapolateRight: 'clamp' })
  const scale = interpolate(frame, [0, 30], [0.8, 1], { extrapolateRight: 'clamp' })
  
  return (
    <AbsoluteFill style={{
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 60
    }}>
      {subjectName && (
        <div style={{
          opacity,
          transform: `scale(${scale})`,
          background: 'rgba(255,255,255,0.2)',
          padding: '10px 30px',
          borderRadius: 30,
          marginBottom: 30,
          color: 'white',
          fontSize: 24
        }}>
          {subjectName}
        </div>
      )}
      <div style={{
        opacity,
        transform: `scale(${scale})`,
        color: 'white',
        fontSize: 36,
        textAlign: 'center',
        lineHeight: 1.5,
        maxWidth: '80%'
      }}>
        {questionText}
      </div>
    </AbsoluteFill>
  )
}

// Step Sequence
const StepSequence = ({ step, isQuiz }: { step: SolutionStep; isQuiz: boolean }) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  
  const contentOpacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: 'clamp' })
  
  return (
    <AbsoluteFill style={{
      background: isQuiz 
        ? 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
        : 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      padding: 60
    }}>
      {/* Adım Başlığı */}
      <div style={{
        opacity: contentOpacity,
        fontSize: 42,
        fontWeight: 'bold',
        color: 'white',
        marginBottom: 40
      }}>
        {step.title}
      </div>
      
      {/* İçerik */}
      <div style={{
        opacity: contentOpacity,
        fontSize: 28,
        color: 'white',
        lineHeight: 1.6,
        maxWidth: '80%'
      }}>
        {step.content}
      </div>
      
      {/* Quiz için özel UI */}
      {isQuiz && step.quiz && (
        <div style={{
          marginTop: 40,
          opacity: contentOpacity
        }}>
          <div style={{
            background: 'rgba(255,255,255,0.2)',
            borderRadius: 20,
            padding: 30
          }}>
            <div style={{ color: 'white', fontSize: 24, marginBottom: 20 }}>
              ⏸️ Videoyu durdur ve düşün!
            </div>
            {step.quiz.options.map((opt, i) => (
              <div key={opt.id} style={{
                background: 'rgba(255,255,255,0.1)',
                borderRadius: 10,
                padding: '15px 20px',
                marginBottom: 10,
                color: 'white',
                fontSize: 20
              }}>
                {String.fromCharCode(65 + i)}) {opt.text}
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Geri Sayım */}
      <Countdown seconds={step.duration_seconds} />
    </AbsoluteFill>
  )
}

// Outro Sequence
const OutroSequence = ({ summary }: { summary: string }) => {
  const frame = useCurrentFrame()
  const opacity = interpolate(frame, [0, 30], [0, 1], { extrapolateRight: 'clamp' })
  
  return (
    <AbsoluteFill style={{
      background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 60
    }}>
      <div style={{ fontSize: 72, marginBottom: 30, opacity }}>🎉</div>
      <div style={{
        opacity,
        color: 'white',
        fontSize: 48,
        fontWeight: 'bold',
        marginBottom: 30
      }}>
        Tebrikler!
      </div>
      <div style={{
        opacity,
        color: 'white',
        fontSize: 24,
        textAlign: 'center',
        maxWidth: '70%',
        lineHeight: 1.6
      }}>
        {summary}
      </div>
      <div style={{
        opacity,
        marginTop: 50,
        color: 'rgba(255,255,255,0.8)',
        fontSize: 20
      }}>
        🌐 teknokul.com.tr
      </div>
    </AbsoluteFill>
  )
}

// Ana Video Kompozisyonu
export const SolutionVideo = ({ solution, questionText, audioUrls, subjectName }: SolutionVideoProps) => {
  const { fps } = useVideoConfig()
  
  // Intro süresi (3 saniye)
  const introDuration = 3 * fps
  
  // Her adımın frame'lerini hesapla
  let currentFrame = introDuration
  const stepFrames = solution.steps.map(step => {
    const duration = step.duration_seconds * fps
    const startFrame = currentFrame
    currentFrame += duration
    return { startFrame, duration }
  })
  
  // Outro süresi (5 saniye)
  const outroDuration = 5 * fps
  
  return (
    <AbsoluteFill style={{ background: '#1a1a2e' }}>
      {/* Intro */}
      <Sequence from={0} durationInFrames={introDuration}>
        <IntroSequence questionText={questionText} subjectName={subjectName} />
      </Sequence>
      
      {/* Steps */}
      {solution.steps.map((step, index) => (
        <Sequence 
          key={step.id}
          from={stepFrames[index].startFrame}
          durationInFrames={stepFrames[index].duration}
        >
          <StepSequence step={step} isQuiz={step.type === 'quiz'} />
          {/* Audio (varsa) */}
          {audioUrls?.[index] && (
            <Audio src={audioUrls[index]} />
          )}
        </Sequence>
      ))}
      
      {/* Outro */}
      <Sequence from={currentFrame} durationInFrames={outroDuration}>
        <OutroSequence summary={solution.summary} />
      </Sequence>
    </AbsoluteFill>
  )
}

export default SolutionVideo
