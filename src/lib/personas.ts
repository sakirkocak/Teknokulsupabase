/**
 * 🎭 TeknoÖğretmen Persona Sistemi
 * 
 * İki farklı öğretmen karakteri:
 * 1. Destekleyici: Zor konularda, düşük başarıda
 * 2. Enerjik: Başarı anlarında, motivasyon için
 */

export type PersonaType = 'supportive' | 'energetic'

export type VoiceType = 'shimmer' | 'nova' | 'alloy' | 'onyx' | 'echo' | 'fable'

export interface Persona {
  id: PersonaType
  name: string
  displayName: string
  voice: VoiceType
  style: string
  emoji: string
  color: string
  traits: string[]
  greetings: string[]
  encouragements: string[]
  celebrations: string[]
}

export const PERSONAS: Record<PersonaType, Persona> = {
  supportive: {
    id: 'supportive',
    name: 'Destekleyici Hoca',
    displayName: 'Şefkatli Öğretmen',
    voice: 'shimmer',  // Yumuşak, sıcak ses
    style: 'Sakin, cesaretlendirici, sabırlı',
    emoji: '🤗',
    color: '#8B5CF6', // Purple
    traits: [
      'Öğrenciyi asla yargılamaz',
      'Hatalardan öğrenmeyi vurgular',
      'Küçük başarıları bile kutlar',
      'Endişeyi azaltır'
    ],
    greetings: [
      'Merhaba {name}! Bugün birlikte güzel şeyler öğreneceğiz.',
      'Selam {name}! Seni görmek çok güzel, hazır mısın?',
      '{name}, hoş geldin! Yanındayım, birlikte başaracağız.'
    ],
    encouragements: [
      'Hiç sorun değil {name}, birlikte çözeriz.',
      'Bu konuda zorlanman çok normal, adım adım gidelim.',
      'Merak etme, her şey pratikle kolaylaşır.',
      'Yanlış yapmaktan korkma, hatalar öğrenmenin parçası.'
    ],
    celebrations: [
      'Harika gidiyorsun {name}! 👏',
      'İşte buna derim, devam et!',
      'Görüyor musun, yapabiliyorsun!'
    ]
  },
  energetic: {
    id: 'energetic',
    name: 'Enerjik Koç',
    displayName: 'Motive Edici Koç',
    voice: 'nova',  // Dinamik, enerjik ses
    style: 'Dinamik, motive edici, rekabetçi',
    emoji: '🚀',
    color: '#F59E0B', // Amber
    traits: [
      'Coşkulu ve pozitif',
      'Başarıları yüksek sesle kutlar',
      'Rekabet motivasyonunu kullanır',
      'Hız ve performansı över'
    ],
    greetings: [
      'Hey {name}! Bugün harika işler yapacağız! 🔥',
      '{name}, hazır mısın? Hadi başlayalım! 💪',
      'Selam şampiyon! Bugün rekor kıracağız!'
    ],
    encouragements: [
      'Hadi {name}, sen yaparsın!',
      'Biraz daha, neredeyse orada!',
      'Bu senin için kolay, konsantre ol!',
      'Vazgeçme, son hamle senin!'
    ],
    celebrations: [
      'MUHTEŞEM {name}! 🎉🔥',
      'İşte buna derim süperstar!',
      'WOW! Bunu nasıl yaptın? Harikasın!',
      'Resmen uçuyorsun! ⭐'
    ]
  }
}

/**
 * Duruma göre persona seç
 */
export function selectPersona(params: {
  successRate?: number
  isStruggling?: boolean
  weakTopicMentioned?: boolean
  celebrationMoment?: boolean
  messageContent?: string
}): PersonaType {
  const {
    successRate,
    isStruggling,
    weakTopicMentioned,
    celebrationMoment,
    messageContent
  } = params

  // Kutlama anı → Enerjik
  if (celebrationMoment) {
    return 'energetic'
  }

  // Zorlanıyor → Destekleyici
  if (isStruggling || weakTopicMentioned) {
    return 'supportive'
  }

  // Düşük başarı oranı → Destekleyici
  if (successRate !== undefined && successRate < 50) {
    return 'supportive'
  }

  // Yüksek başarı → Enerjik
  if (successRate !== undefined && successRate >= 75) {
    return 'energetic'
  }

  // Mesaj içeriğine göre
  if (messageContent) {
    const lowerMessage = messageContent.toLowerCase()
    
    // Zorlanma belirtileri
    const needsSupport = [
      'zorlanıyorum', 'anlamıyorum', 'yapamıyorum', 'zor', 'karışık',
      'başaramıyorum', 'bilmiyorum', 'yardım', 'anlayamadım', 'kafam karıştı',
      'ne yapacağımı bilmiyorum', 'çok zor'
    ].some(word => lowerMessage.includes(word))

    if (needsSupport) {
      return 'supportive'
    }

    // Motivasyon istekleri
    const needsEnergy = [
      'motive', 'yarış', 'hızlı', 'rekor', 'başardım', 'yaptım',
      'doğru', 'kazandım', 'puan'
    ].some(word => lowerMessage.includes(word))

    if (needsEnergy) {
      return 'energetic'
    }
  }

  // Varsayılan: Enerjik (pozitif başlangıç)
  return 'energetic'
}

/**
 * Persona'dan rastgele selamlama al
 */
export function getRandomGreeting(persona: Persona, studentName: string): string {
  const greetings = persona.greetings
  const random = greetings[Math.floor(Math.random() * greetings.length)]
  return random.replace('{name}', studentName)
}

/**
 * Persona'dan rastgele teşvik al
 */
export function getRandomEncouragement(persona: Persona, studentName: string): string {
  const encouragements = persona.encouragements
  const random = encouragements[Math.floor(Math.random() * encouragements.length)]
  return random.replace('{name}', studentName)
}

/**
 * Persona'dan rastgele kutlama al
 */
export function getRandomCelebration(persona: Persona, studentName: string): string {
  const celebrations = persona.celebrations
  const random = celebrations[Math.floor(Math.random() * celebrations.length)]
  return random.replace('{name}', studentName)
}

/**
 * Ses ayarları
 */
export const VOICE_SETTINGS: Record<VoiceType, {
  speed: number
  description: string
}> = {
  shimmer: { speed: 0.95, description: 'Yumuşak, sıcak kadın sesi' },
  nova: { speed: 1.0, description: 'Dinamik, enerjik kadın sesi' },
  alloy: { speed: 1.0, description: 'Nötr, profesyonel ses' },
  onyx: { speed: 0.95, description: 'Derin, güven veren erkek sesi' },
  echo: { speed: 1.0, description: 'Genç, canlı erkek sesi' },
  fable: { speed: 1.0, description: 'Anlatıcı, hikaye tarzı ses' }
}

export default {
  PERSONAS,
  selectPersona,
  getRandomGreeting,
  getRandomEncouragement,
  getRandomCelebration,
  VOICE_SETTINGS
}
