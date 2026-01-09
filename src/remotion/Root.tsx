import { Composition } from 'remotion'
import { SolutionComposition } from './compositions/SolutionComposition'

// Demo veri
const DEMO_SOLUTION = {
  questionText: '2x + 5 = 15 denklemini çözünüz.',
  subjectName: 'Matematik',
  correctAnswer: 'A (x = 5)',
  steps: [
    {
      id: 'step_1',
      type: 'explanation',
      title: 'Soruyu İnceleyelim',
      content: 'Önce denklemi inceleyelim: 2x + 5 = 15',
      tts_text: 'Önce denklemi inceleyelim.',
      duration_seconds: 4,
      animation_template: 'equation_balance',
      animation_data: { left_side: '2x + 5', right_side: '15' }
    },
    {
      id: 'step_2',
      type: 'calculation',
      title: 'Her iki taraftan 5 çıkar',
      content: 'Her iki taraftan 5 çıkarırsak: 2x = 10',
      tts_text: 'Her iki taraftan 5 çıkaralım.',
      duration_seconds: 5,
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
      duration_seconds: 10,
      animation_template: 'quiz',
      animation_data: {},
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
      content: 'x = 5 bulundu!',
      tts_text: 'Ve cevabımız x eşittir 5!',
      duration_seconds: 4,
      animation_template: 'text_reveal',
      animation_data: { text: 'x = 5 ✓', style: 'celebration', icon: '🎉' }
    }
  ]
}

// Toplam süre hesapla
const calculateDuration = (steps: any[]) => {
  const introSeconds = 4
  const outroSeconds = 5
  const stepsSeconds = steps.reduce((sum, step) => sum + step.duration_seconds, 0)
  return (introSeconds + stepsSeconds + outroSeconds) * 30 // 30 fps
}

export const RemotionRoot = () => {
  const totalFrames = calculateDuration(DEMO_SOLUTION.steps)

  return (
    <>
      {/* YouTube Video (16:9) */}
      <Composition
        id="SolutionVideo"
        component={SolutionComposition}
        durationInFrames={totalFrames}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          questionText: DEMO_SOLUTION.questionText,
          subjectName: DEMO_SOLUTION.subjectName,
          steps: DEMO_SOLUTION.steps,
          correctAnswer: DEMO_SOLUTION.correctAnswer,
          audioUrls: []
        }}
      />
      
      {/* YouTube Shorts (9:16) */}
      <Composition
        id="SolutionShort"
        component={SolutionComposition}
        durationInFrames={15 * 30} // 15 saniye max
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{
          questionText: DEMO_SOLUTION.questionText,
          subjectName: DEMO_SOLUTION.subjectName,
          steps: DEMO_SOLUTION.steps.slice(0, 2), // Sadece ilk 2 adım
          correctAnswer: DEMO_SOLUTION.correctAnswer,
          audioUrls: []
        }}
      />
    </>
  )
}

export default RemotionRoot
