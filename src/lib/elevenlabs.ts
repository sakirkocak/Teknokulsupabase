import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js'
import { createClient } from '@supabase/supabase-js'

const elevenlabs = new ElevenLabsClient({ apiKey: process.env.ELEVENLABS_API_KEY })
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export const VOICE_PROFILES = {
  erdem: { id: 'ErXwobaYiN019PkySvjV', name: 'Erdem Hoca', subjects: ['matematik', 'fizik', 'kimya'], description: 'Sıcak erkek ses' },
  mehmet: { id: 'VR6AewLTigWG4xSOukaG', name: 'Mehmet Hoca', subjects: ['tarih', 'coğrafya', 'felsefe'], description: 'Derin erkek ses' },
  gamze: { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Gamze Hoca', subjects: ['türkçe', 'edebiyat', 'ingilizce'], description: 'Sıcak kadın ses' },
  aylin: { id: 'jBpfuIE2acCO8z3wKNLl', name: 'Aylin Hoca', subjects: ['biyoloji', 'sağlık'], description: 'Enerjik kadın ses' }
} as const

export type VoiceProfile = keyof typeof VOICE_PROFILES

export function getVoiceForSubject(subjectName: string): VoiceProfile {
  const subject = subjectName.toLowerCase()
  for (const [voice, profile] of Object.entries(VOICE_PROFILES)) {
    if (profile.subjects.some(s => subject.includes(s))) return voice as VoiceProfile
  }
  return 'erdem'
}

async function streamToBuffer(stream: ReadableStream<Uint8Array>): Promise<Buffer> {
  const reader = stream.getReader()
  const chunks: Uint8Array[] = []
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    if (value) chunks.push(value)
  }
  return Buffer.concat(chunks)
}

export async function generateTTS(text: string, voice: VoiceProfile = 'erdem'): Promise<Buffer> {
  const voiceId = VOICE_PROFILES[voice].id
  const audio = await elevenlabs.textToSpeech.convert(voiceId, {
    text,
    modelId: 'eleven_multilingual_v2',
    voiceSettings: { stability: 0.5, similarityBoost: 0.75, style: 0.5 }
  })
  return streamToBuffer(audio as unknown as ReadableStream<Uint8Array>)
}

export async function generateAndStoreTTS(questionId: string, stepIndex: number, text: string, voice: VoiceProfile = 'erdem'): Promise<string> {
  const fileName = `tts/${questionId}/step_${stepIndex}.mp3`
  const { data: existing } = await supabase.storage.from('solution-audio').list(`tts/${questionId}`, { search: `step_${stepIndex}` })
  if (existing && existing.length > 0) {
    const { data: urlData } = supabase.storage.from('solution-audio').getPublicUrl(fileName)
    return urlData.publicUrl
  }
  const audioBuffer = await generateTTS(text, voice)
  await supabase.storage.from('solution-audio').upload(fileName, audioBuffer, { contentType: 'audio/mpeg', upsert: true })
  const { data: urlData } = supabase.storage.from('solution-audio').getPublicUrl(fileName)
  return urlData.publicUrl
}

export async function generateAllStepsTTS(questionId: string, steps: Array<{ tts_text: string }>, subjectName: string): Promise<string[]> {
  const voice = getVoiceForSubject(subjectName)
  const audioUrls: string[] = []
  for (let i = 0; i < steps.length; i++) {
    const url = await generateAndStoreTTS(questionId, i, steps[i].tts_text, voice)
    audioUrls.push(url)
  }
  return audioUrls
}

export function estimateAudioDuration(text: string): number {
  return Math.ceil(text.split(/\s+/).length / 2.5)
}
