import { Composition } from 'remotion'
import { SolutionVideo } from './SolutionVideo'

// Demo veri
const DEMO_SOLUTION = {
  steps: [
    {
      id: 'step_1',
      type: 'explanation',
      title: 'Problemi Anlayalım',
      content: 'Bu soruda bir denklemi çözeceğiz.',
      tts_text: 'Merhaba, bu soruda bir denklemi çözeceğiz.',
      duration_seconds: 5,
      animation_template: 'text_reveal',
      animation_data: {}
    },
    {
      id: 'step_2',
      type: 'quiz',
      title: 'Sıra Sende!',
      content: 'İlk adımda ne yapmalıyız?',
      tts_text: 'Şimdi videoyu durdur ve düşün.',
      duration_seconds: 10,
      animation_template: 'step_by_step',
      animation_data: {},
      quiz: {
        question: 'İlk adımda ne yapmalıyız?',
        options: [
          { id: 'a', text: 'Toplama', is_correct: false },
          { id: 'b', text: 'Çıkarma', is_correct: true },
          { id: 'c', text: 'Çarpma', is_correct: false }
        ]
      }
    },
    {
      id: 'step_3',
      type: 'result',
      title: 'Sonuç',
      content: 'x = 5 bulundu.',
      tts_text: 'Cevabımız x eşittir 5.',
      duration_seconds: 5,
      animation_template: 'text_reveal',
      animation_data: {}
    }
  ],
  summary: 'Bu soruda denklem çözme adımlarını öğrendik.'
}

export const RemotionRoot = () => {
  return (
    <>
      {/* Ana video kompozisyonu */}
      <Composition
        id="SolutionVideo"
        component={SolutionVideo}
        durationInFrames={30 * 30}  // 30 saniye @ 30fps
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          solution: DEMO_SOLUTION,
          questionText: '2x + 5 = 15 denklemini çözünüz.',
          subjectName: 'Matematik'
        }}
      />
      
      {/* YouTube Shorts versiyonu (dikey) */}
      <Composition
        id="SolutionShort"
        component={SolutionVideo}
        durationInFrames={15 * 30}  // 15 saniye @ 30fps
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{
          solution: DEMO_SOLUTION,
          questionText: '2x + 5 = 15',
          subjectName: 'Matematik'
        }}
      />
    </>
  )
}
