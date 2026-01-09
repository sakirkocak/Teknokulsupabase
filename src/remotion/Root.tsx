import React from 'react'
import { Composition } from 'remotion'
import { SolutionVideo } from './compositions/SolutionVideo'
import { SolutionShort } from './compositions/SolutionShort'
import { VideoProps } from './types'

// Demo data
const DEMO_PROPS: VideoProps = {
  questionText: '2x + 5 = 15 denklemini çözünüz.',
  subjectName: 'Matematik',
  correctAnswer: 'x = 5',
  steps: [
    {
      id: 'step_1',
      type: 'explanation',
      title: 'Soruyu İnceleyelim',
      content: 'Denklemi inceleyelim: 2x + 5 = 15',
      tts_text: 'Önce denklemi inceleyelim.',
      duration_seconds: 5,
      animation_template: 'equation_balance',
      animation_data: { left_side: '2x + 5', right_side: '15' }
    },
    {
      id: 'step_2',
      type: 'calculation',
      title: 'İşlem Yapalım',
      content: 'Her iki taraftan 5 çıkarırsak: 2x = 10',
      tts_text: 'Her iki taraftan 5 çıkaralım.',
      duration_seconds: 6,
      animation_template: 'step_by_step',
      animation_data: {
        steps: [
          { text: '2x + 5 = 15', highlight: false },
          { text: '2x + 5 - 5 = 15 - 5', highlight: true },
          { text: '2x = 10', highlight: true }
        ]
      }
    },
    {
      id: 'step_3',
      type: 'quiz',
      title: 'Sıra Sende!',
      content: 'Şimdi sen tahmin et!',
      tts_text: 'Videoyu durdur ve düşün!',
      duration_seconds: 12,
      animation_template: 'quiz_screen',
      quiz: {
        question: 'x değerini bulmak için ne yapmalıyız?',
        options: [
          { id: 'a', text: 'A) 2 ile çarp', is_correct: false },
          { id: 'b', text: 'B) 2\'ye böl', is_correct: true },
          { id: 'c', text: 'C) 2 ekle', is_correct: false }
        ]
      }
    },
    {
      id: 'step_4',
      type: 'result',
      title: 'Sonuç',
      content: 'x = 5',
      tts_text: 'Cevabımız x eşittir 5!',
      duration_seconds: 5,
      animation_template: 'text_reveal',
      animation_data: { text: 'x = 5 ✓', style: 'celebration', icon: '🎉' }
    }
  ],
  audioUrls: []
}

// Total frames calculation
const calculateFrames = (steps: VideoProps['steps'], fps: number) => {
  const intro = 4 * fps
  const outro = 5 * fps
  const stepsTotal = steps.reduce((sum, s) => sum + (s.duration_seconds || 6) * fps, 0)
  return intro + stepsTotal + outro
}

// Wrapper components to fix type issues
const VideoWrapper: React.FC<Record<string, unknown>> = () => <SolutionVideo {...DEMO_PROPS} />
const ShortWrapper: React.FC<Record<string, unknown>> = () => <SolutionShort {...DEMO_PROPS} />

export const RemotionRoot: React.FC = () => {
  const fps = 30

  return (
    <>
      {/* YouTube Video (16:9) */}
      <Composition
        id="SolutionVideo"
        component={VideoWrapper}
        durationInFrames={calculateFrames(DEMO_PROPS.steps, fps)}
        fps={fps}
        width={1920}
        height={1080}
      />
      
      {/* YouTube Shorts (9:16) */}
      <Composition
        id="SolutionShort"
        component={ShortWrapper}
        durationInFrames={20 * fps}
        fps={fps}
        width={1080}
        height={1920}
      />
    </>
  )
}

export default RemotionRoot
