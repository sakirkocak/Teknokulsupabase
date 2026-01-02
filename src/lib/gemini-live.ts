/**
 * Gemini Live API - WebSocket Tabanlı Gerçek Zamanlı Ses Sohbeti
 * Model: gemini-2.5-flash-native-audio-preview
 * 
 * Özellikler:
 * - Streaming audio (düşük gecikme)
 * - VAD (Voice Activity Detection)
 * - Interruption (konuşma kesme)
 * - Native ses üretimi (Aoede, Charon vb.)
 */

// Gemini Live API configuration
// Not: Gerçek bağlantı client-side'da veya WebSocket proxy üzerinden yapılacak

// Live API Model
export const LIVE_MODEL = 'gemini-2.5-flash-native-audio-preview-12-2025'

// Ses karakterleri
export const LIVE_VOICES = {
  AOEDE: 'Aoede',      // Yumuşak kadın sesi
  CHARON: 'Charon',    // Derin erkek sesi
  FENRIR: 'Fenrir',    // Sakin ses
  KORE: 'Kore',        // Enerjik kadın
  PUCK: 'Puck'         // Neşeli ses
}

export interface LiveSessionConfig {
  studentName: string
  grade: number
  personality: 'friendly' | 'strict' | 'motivating'
  voice?: string
  weaknesses?: string[]
}

/**
 * Live session için system instruction oluştur
 */
export function buildLiveSystemInstruction(config: LiveSessionConfig): string {
  const { studentName, grade, personality, weaknesses = [] } = config
  const name = studentName || 'Öğrenci'
  
  const personalityTones: Record<string, string> = {
    friendly: 'samimi, sabırlı ve arkadaş canlısı',
    strict: 'disiplinli ama adil ve kararlı',
    motivating: 'enerjik, coşkulu ve motive edici'
  }
  
  const tone = personalityTones[personality] || personalityTones.friendly
  
  return `Sen TeknoÖğretmen'sin - ${name}'in özel ders öğretmeni.

🎓 ÖĞRENCİ BİLGİLERİ:
- İsim: ${name}
- Sınıf: ${grade}. sınıf
${weaknesses.length > 0 ? `- Zorlandığı konular: ${weaknesses.join(', ')}` : ''}

🎯 KİŞİLİĞİN: ${tone}

📣 KONUŞMA KURALLARIN:
1. HER cümlene "${name}" diye hitap ederek başla
2. Kısa ve öz konuş (max 2-3 cümle)
3. Her yanıtta mutlaka bir soru sor
4. Doğrudan cevap verme, ipucu ver ve düşündür
5. "${name} bilmiyorum" derse hayattan örnek ver
6. Doğal konuş: "Hmm", "Şimdi bak ${name}", "Evet!" gibi ifadeler kullan

⚠️ ÖNEMLİ:
- Türkçe konuş
- Samimi ol, robot gibi değil insan gibi konuş
- Öğrenci seni kestiğinde hemen dur ve dinle
- Ses tonun sıcak ve öğretici olsun

Örnek yanıt: "${name}, harika soru! 🌟 Şimdi şöyle düşün: Bir pizza 8 dilime bölündü, 3 dilim yedin. Sence ne kadar pizza yemiş oldun?"`
}

/**
 * Live session config döndür (client-side'da kullanılacak)
 * Not: Gerçek bağlantı client-side'da WebSocket ile yapılacak
 */
export function getLiveSessionConfig(config: LiveSessionConfig) {
  const systemInstruction = buildLiveSystemInstruction(config)
  const voice = config.voice || LIVE_VOICES.KORE
  
  return {
    model: LIVE_MODEL,
    systemInstruction,
    voice,
    responseModalities: ['AUDIO'],
    speechConfig: {
      voiceConfig: {
        prebuiltVoiceConfig: {
          voiceName: voice
        }
      }
    }
  }
}

/**
 * PCM audio buffer oluştur (mikrofon için)
 * Format: 16-bit PCM, 16kHz, mono
 */
export function createAudioBuffer(samples: Float32Array): ArrayBuffer {
  const buffer = new ArrayBuffer(samples.length * 2)
  const view = new DataView(buffer)
  
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]))
    view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7FFF, true)
  }
  
  return buffer
}

/**
 * Base64'ten AudioBuffer'a dönüştür
 */
export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = atob(base64)
  const bytes = new Uint8Array(binaryString.length)
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i)
  }
  return bytes.buffer
}

/**
 * ArrayBuffer'ı Base64'e dönüştür
 */
export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}
