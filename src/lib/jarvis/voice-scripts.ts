/**
 * 🎙️ JARVIS Voice Script Generator
 * TeknoÖğretmen için doğal konuşma metinleri
 */

import { JarvisSceneType } from './scenes'

// ============================================
// GENEL KALIPLAR
// ============================================

export const INTRO_TEMPLATES = [
  "Merhaba! Şimdi bu soruyu birlikte çözelim.",
  "Hoş geldin! Bu problemi adım adım inceleyelim.",
  "Hazır mısın? Hadi bu soruyu birlikte keşfedelim!",
  "Merhaba! Sana bu konuyu interaktif olarak göstereceğim.",
]

export const GESTURE_PROMPTS = {
  pinch: [
    "Şimdi parmaklarını birleştirerek şekli büyütebilirsin.",
    "Pinch hareketi yaparak boyutu değiştirelim.",
    "Elini kullanarak büyütüp küçültmeyi dene!",
  ],
  grab: [
    "Elini kapat ve şekli tutarak hareket ettir.",
    "Yumruk yaparak nesneyi sürükleyebilirsin.",
    "Tut ve istediğin yere taşı!",
  ],
  rotate: [
    "Elini çevirerek şekli döndürebilirsin.",
    "Rotasyon için elini saat yönünde çevir.",
    "Farklı açılardan görmek için döndür!",
  ],
  push: [
    "Elini ileri iterek sonraki adıma geçelim.",
    "İtme hareketi yap, devam edelim!",
    "Push yaparak ilerle.",
  ],
}

export const ENCOURAGEMENTS = [
  "Harika gidiyorsun! 🌟",
  "Tam olarak bu! 👏",
  "Çok iyi! Devam et! 💪",
  "Mükemmel! 🎯",
  "Aferin! Doğru yoldasın! ✨",
]

export const HINTS = [
  "Bir ipucu: Formülü hatırlamaya çalış.",
  "Düşün bakalım, bu değer neyi temsil ediyor?",
  "Yardımcı olayım: Birimlerine dikkat et.",
  "İpucu: Verilen değerleri formüle yerleştir.",
]

// ============================================
// SAHNE BAZLI SCRİPTLER
// ============================================

export interface VoiceScript {
  intro: string
  steps: Array<{
    text: string
    gesture?: string
    pause?: number // ms
  }>
  conclusion: string
}

// Sahne tipine göre template seçici
export function getSceneVoiceTemplate(
  sceneType: JarvisSceneType,
  params: Record<string, any>
): VoiceScript {
  switch (sceneType) {
    case 'triangle':
      return getTriangleScript(params)
    case 'square':
      return getSquareScript(params)
    case 'rectangle':
      return getRectangleScript(params)
    case 'circle':
      return getCircleScript(params)
    case 'forceVector':
      return getForceVectorScript(params)
    case 'atom':
      return getAtomScript(params)
    case 'timeline':
      return getTimelineScript(params)
    default:
      return getGenericScript(params)
  }
}

// ============================================
// GEOMETRI SCRİPTLERİ
// ============================================

function getTriangleScript(params: { base?: number; height?: number }): VoiceScript {
  const base = params.base || 4
  const height = params.height || 3
  const area = (base * height) / 2

  return {
    intro: `Şimdi bir üçgenin alanını hesaplayacağız. Ekranda ${base} santimetre tabanlı ve ${height} santimetre yüksekliğinde bir üçgen görüyorsun.`,
    steps: [
      {
        text: `Üçgenin alanını bulmak için şu formülü kullanacağız: Alan eşittir taban çarpı yükseklik bölü iki.`,
        gesture: 'Elini üçgenin üzerine getir',
        pause: 2000
      },
      {
        text: `Şimdi değerleri yerleştirelim. Taban ${base} santimetre, yükseklik ${height} santimetre.`,
        gesture: 'Pinch yaparak boyutları değiştirebilirsin',
        pause: 2000
      },
      {
        text: `${base} çarpı ${height} eşittir ${base * height}. Bunu ikiye bölersek ${area} santimetrekare buluruz.`,
        gesture: 'Şekli döndürerek farklı açılardan görebilirsin',
        pause: 1500
      }
    ],
    conclusion: `Harika! Üçgenin alanı ${area} santimetrekaredir. Şimdi elini kullanarak boyutları değiştir ve alanın nasıl değiştiğini gör!`
  }
}

function getSquareScript(params: { side?: number }): VoiceScript {
  const side = params.side || 4
  const area = side * side
  const perimeter = side * 4

  return {
    intro: `Şimdi bir karenin özelliklerini inceleyelim. Kenar uzunluğu ${side} santimetre olan bir kare görüyorsun.`,
    steps: [
      {
        text: `Karenin alanını hesaplamak çok kolay! Kenar uzunluğunu kendisiyle çarpıyoruz.`,
        pause: 2000
      },
      {
        text: `${side} çarpı ${side} eşittir ${area} santimetrekare.`,
        gesture: 'Pinch yaparak kareyi büyütüp küçültebilirsin',
        pause: 2000
      },
      {
        text: `Çevresini de hesaplayalım. 4 kenar var, her biri ${side} santimetre. Toplam çevre ${perimeter} santimetre.`,
        pause: 1500
      }
    ],
    conclusion: `Mükemmel! Karenin alanı ${area} santimetrekare, çevresi ${perimeter} santimetredir.`
  }
}

function getRectangleScript(params: { width?: number; height?: number }): VoiceScript {
  const width = params.width || 5
  const height = params.height || 3
  const area = width * height
  const perimeter = 2 * (width + height)

  return {
    intro: `Dikdörtgen zamanı! ${width} santimetre genişliğinde ve ${height} santimetre yüksekliğinde bir dikdörtgen görüyorsun.`,
    steps: [
      {
        text: `Dikdörtgenin alanı için uzun kenar çarpı kısa kenar formülünü kullanıyoruz.`,
        pause: 2000
      },
      {
        text: `${width} çarpı ${height} eşittir ${area} santimetrekare.`,
        gesture: 'Köşelerden tutarak boyutları değiştirebilirsin',
        pause: 2000
      },
      {
        text: `Çevre için tüm kenarları topluyoruz: 2 çarpı ${width} artı ${height} eşittir ${perimeter} santimetre.`,
        pause: 1500
      }
    ],
    conclusion: `Süper! Dikdörtgenin alanı ${area} santimetrekare, çevresi ${perimeter} santimetredir.`
  }
}

function getCircleScript(params: { radius?: number }): VoiceScript {
  const radius = params.radius || 3
  const area = Math.PI * radius * radius
  const circumference = 2 * Math.PI * radius

  return {
    intro: `Şimdi daire ile tanışalım! Yarıçapı ${radius} santimetre olan bir daire görüyorsun.`,
    steps: [
      {
        text: `Dairenin alanını pi çarpı yarıçap kare formülüyle buluyoruz.`,
        pause: 2000
      },
      {
        text: `Pi yaklaşık 3.14. ${radius} üzeri 2 eşittir ${radius * radius}. Pi ile çarparsak yaklaşık ${area.toFixed(1)} santimetrekare.`,
        gesture: 'Yarıçapı değiştirmek için merkeze yaklaş',
        pause: 2000
      },
      {
        text: `Çevre için 2 pi r formülünü kullanıyoruz. Sonuç yaklaşık ${circumference.toFixed(1)} santimetre.`,
        pause: 1500
      }
    ],
    conclusion: `Harika! Dairenin alanı ${area.toFixed(1)} santimetrekare, çevresi ${circumference.toFixed(1)} santimetredir.`
  }
}

// ============================================
// FİZİK SCRİPTLERİ
// ============================================

function getForceVectorScript(params: { magnitude?: number; angle?: number }): VoiceScript {
  const magnitude = params.magnitude || 10
  const angle = params.angle || 30

  return {
    intro: `Kuvvet vektörlerini öğrenelim! ${magnitude} Newton büyüklüğünde, ${angle} derece açıyla uygulanan bir kuvvet görüyorsun.`,
    steps: [
      {
        text: `Kuvvet bir vektördür, yani hem büyüklüğü hem yönü vardır. Ok, kuvvetin yönünü gösterir.`,
        pause: 2000
      },
      {
        text: `Bu kuvvetin yatay bileşeni için kosinüs, dikey bileşeni için sinüs kullanırız.`,
        gesture: 'Oku döndürerek açıyı değiştirebilirsin',
        pause: 2000
      },
      {
        text: `Yatay bileşen: ${magnitude} çarpı kosinüs ${angle} derece. Dikey bileşen: ${magnitude} çarpı sinüs ${angle} derece.`,
        pause: 1500
      }
    ],
    conclusion: `Mükemmel! Kuvvet vektörlerini anladın. Şimdi oku hareket ettirerek farklı değerleri keşfet!`
  }
}

// ============================================
// KİMYA SCRİPTLERİ
// ============================================

function getAtomScript(params: { element?: string; protons?: number; electrons?: number }): VoiceScript {
  const element = params.element || 'C'
  const protons = params.protons || 6
  const electrons = params.electrons || 6

  return {
    intro: `Atom modeline hoş geldin! Şu an ${element} elementinin Bohr atom modelini görüyorsun.`,
    steps: [
      {
        text: `Çekirdekte ${protons} proton var. Protonlar pozitif yüklüdür ve atomun kimliğini belirler.`,
        pause: 2000
      },
      {
        text: `Çekirdeğin etrafında ${electrons} elektron dönüyor. Elektronlar negatif yüklüdür.`,
        gesture: 'Atomu döndürerek yörüngeleri gözlemle',
        pause: 2000
      },
      {
        text: `Elektronlar belirli enerji seviyelerinde, yani yörüngelerde bulunur. Her yörüngenin kapasitesi farklıdır.`,
        pause: 1500
      }
    ],
    conclusion: `Harika! ${element} atomunun yapısını öğrendin. Farklı elementleri keşfetmeye devam et!`
  }
}

// ============================================
// TARİH SCRİPTLERİ
// ============================================

function getTimelineScript(params: { events?: Array<{ year: number; title: string }> }): VoiceScript {
  const events = params.events || [
    { year: 1919, title: 'Kurtuluş Savaşı' },
    { year: 1923, title: 'Cumhuriyet' }
  ]

  return {
    intro: `Zaman yolculuğuna çıkalım! ${events.length} önemli tarihi olay görüyorsun.`,
    steps: events.map((event, idx) => ({
      text: `${event.year} yılında ${event.title} gerçekleşti.`,
      gesture: idx === 0 ? 'Olayların üzerine gel detayları gör' : undefined,
      pause: 2000
    })),
    conclusion: `Harika! Bu tarihi dönemin önemli olaylarını öğrendin. Zaman çizelgesini keşfetmeye devam et!`
  }
}

// ============================================
// GENEL SCRİPT
// ============================================

function getGenericScript(params: Record<string, any>): VoiceScript {
  return {
    intro: INTRO_TEMPLATES[Math.floor(Math.random() * INTRO_TEMPLATES.length)],
    steps: [
      {
        text: 'Bu soruyu adım adım birlikte çözelim.',
        pause: 2000
      },
      {
        text: 'Verilen bilgileri dikkatlice inceleyelim.',
        pause: 2000
      },
      {
        text: 'Şimdi çözüme ulaşalım.',
        pause: 1500
      }
    ],
    conclusion: 'Tebrikler! Soruyu başarıyla çözdün.'
  }
}

// ============================================
// YARDIMCI FONKSİYONLAR
// ============================================

export function getRandomIntro(): string {
  return INTRO_TEMPLATES[Math.floor(Math.random() * INTRO_TEMPLATES.length)]
}

export function getRandomEncouragement(): string {
  return ENCOURAGEMENTS[Math.floor(Math.random() * ENCOURAGEMENTS.length)]
}

export function getRandomHint(): string {
  return HINTS[Math.floor(Math.random() * HINTS.length)]
}

export function getGesturePrompt(gesture: 'pinch' | 'grab' | 'rotate' | 'push'): string {
  const prompts = GESTURE_PROMPTS[gesture]
  return prompts[Math.floor(Math.random() * prompts.length)]
}
