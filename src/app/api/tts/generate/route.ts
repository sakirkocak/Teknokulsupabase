import { NextRequest, NextResponse } from 'next/server'
import { 
  generateTTS, 
  generateAndStoreTTS, 
  generateAllStepsTTS,
  getVoiceForSubject,
  VOICE_PROFILES,
  VoiceProfile,
  estimateAudioDuration
} from '@/lib/elevenlabs'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { text, voice, question_id, step_index, subject_name, steps, store = true } = body

    if (!process.env.ELEVENLABS_API_KEY) {
      return NextResponse.json({ success: false, error: 'ElevenLabs API key yapılandırılmamış' }, { status: 500 })
    }

    if (steps && question_id && subject_name) {
      const audioUrls = await generateAllStepsTTS(question_id, steps, subject_name)
      return NextResponse.json({
        success: true,
        audio_urls: audioUrls,
        voice: getVoiceForSubject(subject_name),
        voice_name: VOICE_PROFILES[getVoiceForSubject(subject_name)].name
      })
    }

    if (!text) {
      return NextResponse.json({ success: false, error: 'text parametresi gerekli' }, { status: 400 })
    }

    const selectedVoice: VoiceProfile = voice || (subject_name ? getVoiceForSubject(subject_name) : 'erdem')

    if (store && question_id !== undefined && step_index !== undefined) {
      const audioUrl = await generateAndStoreTTS(question_id, step_index, text, selectedVoice)
      return NextResponse.json({
        success: true,
        audio_url: audioUrl,
        voice: selectedVoice,
        voice_name: VOICE_PROFILES[selectedVoice].name,
        estimated_duration: estimateAudioDuration(text)
      })
    } else {
      const audioBuffer = await generateTTS(text, selectedVoice)
      return new NextResponse(audioBuffer, {
        headers: {
          'Content-Type': 'audio/mpeg',
          'Content-Disposition': 'inline; filename="tts.mp3"'
        }
      })
    }
  } catch (error) {
    console.error('TTS error:', error)
    return NextResponse.json({ success: false, error: 'TTS oluşturulamadı' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const questionId = searchParams.get('question_id')

  if (!questionId) {
    return NextResponse.json({
      success: true,
      voices: Object.entries(VOICE_PROFILES).map(([key, profile]) => ({
        id: key, name: profile.name, subjects: profile.subjects, description: profile.description
      }))
    })
  }

  const { createClient } = await import('@supabase/supabase-js')
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const { data } = await supabase.storage.from('solution-audio').list(`tts/${questionId}`)

  const audioFiles = (data || []).map(file => {
    const { data: urlData } = supabase.storage.from('solution-audio').getPublicUrl(`tts/${questionId}/${file.name}`)
    return { name: file.name, url: urlData.publicUrl }
  })

  return NextResponse.json({ success: true, question_id: questionId, audio_files: audioFiles })
}
