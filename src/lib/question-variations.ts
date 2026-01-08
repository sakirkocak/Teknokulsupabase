/**
 * Teknokul Soru Üretici Varyasyon Sistemi
 * 🎯 Google'ın AI pattern tespitini önlemek için doğal varyasyonlar
 * 
 * Bu modül, AI soru üretimindeki kalıpları kırarak:
 * 1. Farklı soru formatları
 * 2. Farklı açıklama stilleri
 * 3. Farklı ton/üslup
 * 4. İnsansı dokunuşlar
 * ekler.
 */

// =============================================================================
// TON VE ÜSLUP VARYASYONLARI
// =============================================================================

export const TONE_VARIATIONS = [
  "Samimi ve arkadaşça bir dil kullan.",
  "Profesyonel ve akademik bir ton tercih et.",
  "Enerjik ve motive edici bir üslup benimse.",
  "Sakin, açıklayıcı ve sabırlı bir dil kullan.",
  "Merak uyandırıcı ve sorgulayıcı bir ton kullan.",
  "Öğretici ama eğlenceli bir dil tercih et.",
]

// =============================================================================
// SORU KÖKÜ FORMATLARI
// =============================================================================

export const QUESTION_STEM_FORMATS = {
  standard: [
    "Aşağıdakilerden hangisi doğrudur?",
    "Hangisi {topic} için geçerlidir?",
    "Aşağıdaki ifadelerden hangisi {topic} ile ilgili doğrudur?",
    "{topic} hakkında hangisi söylenebilir?",
  ],
  analytical: [
    "Buna göre hangisine ulaşılabilir?",
    "Bu durumda hangi sonuca varılır?",
    "Verilen bilgilere göre hangisi söylenebilir?",
    "Bu bilgilerden yola çıkarak hangisi çıkarılabilir?",
  ],
  comparative: [
    "{a} ile {b} karşılaştırıldığında hangisi doğrudur?",
    "Aşağıdakilerden hangisi {a} ve {b} arasındaki farkı gösterir?",
    "{a} ve {b} için hangisi ortak özelliktir?",
  ],
  negative: [
    "Aşağıdakilerden hangisi yanlıştır?",
    "Hangisi {topic} için geçerli değildir?",
    "Aşağıdaki ifadelerden hangisi hatalıdır?",
    "{topic} ile ilgili hangisi söylenemez?",
  ],
  sequential: [
    "{process} sürecinde ilk adım hangisidir?",
    "Bu olayların kronolojik sırası nasıldır?",
    "{process} aşamaları hangi sırayla gerçekleşir?",
  ],
  causal: [
    "Bunun temel nedeni nedir?",
    "Bu duruma yol açan etken hangisidir?",
    "{effect} sonucunu doğuran neden hangisidir?",
    "Aşağıdakilerden hangisi bu olayın sebebidir?",
  ],
  application: [
    "Bu bilgiyi kullanarak hangisini hesaplayabiliriz?",
    "{formula} uygulandığında sonuç ne olur?",
    "Bu durumda hangi yöntem kullanılmalıdır?",
  ],
}

// =============================================================================
// AÇIKLAMA STİLLERİ
// =============================================================================

export const EXPLANATION_STYLES = {
  direct: {
    intro: ["Doğru cevap {answer} seçeneğidir.", "Cevap {answer}'dır.", "{answer} doğrudur."],
    connector: ["çünkü", "nedeni şudur:", "bunun sebebi"],
  },
  educational: {
    intro: [
      "Bu soruyu adım adım çözelim.",
      "Önce temel kavramları hatırlayalım.",
      "Konuyu anlamak için şunu düşünelim:",
    ],
    connector: ["Dolayısıyla", "Bu nedenle", "Sonuç olarak"],
  },
  comparative: {
    intro: [
      "Şıkları tek tek inceleyelim:",
      "Her seçeneği değerlendirelim:",
      "Seçenekleri karşılaştıralım:",
    ],
    connector: ["Görüldüğü gibi", "Buna göre", "Karşılaştırma sonucunda"],
  },
  motivational: {
    intro: [
      "Harika bir soru! Bakalım:",
      "Bu soruyu çözmek kolay:",
      "Dikkatli düşünürsen cevap açık:",
    ],
    connector: ["Gördün mü?", "İşte bu yüzden", "Tam da bu nedenle"],
  },
}

// =============================================================================
// YARDIMCI FONKSİYONLAR
// =============================================================================

/**
 * Diziden rastgele eleman seç
 */
function randomChoice<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)]
}

/**
 * Rastgele ton varyasyonu döndür
 */
export function getRandomTone(): string {
  return randomChoice(TONE_VARIATIONS)
}

/**
 * Rastgele soru formatı döndür
 */
export function getRandomQuestionFormat(
  type: keyof typeof QUESTION_STEM_FORMATS = 'standard'
): string {
  const formats = QUESTION_STEM_FORMATS[type] || QUESTION_STEM_FORMATS.standard
  return randomChoice(formats)
}

/**
 * Rastgele açıklama stili döndür
 */
export function getRandomExplanationStyle(): {
  intro: string
  connector: string
} {
  const styleKeys = Object.keys(EXPLANATION_STYLES) as (keyof typeof EXPLANATION_STYLES)[]
  const style = EXPLANATION_STYLES[randomChoice(styleKeys)]
  return {
    intro: randomChoice(style.intro),
    connector: randomChoice(style.connector),
  }
}

// =============================================================================
// SORU ÜRETİCİ PROMPT VARYASYONLARI
// =============================================================================

export const PROMPT_VARIATIONS = {
  // Zorluk seviyesi açıklamaları - her seferinde farklı ifadeler
  difficultyDescriptions: {
    easy: [
      "Temel seviye - bilgi hatırlama, basit uygulama",
      "Başlangıç düzeyi - kavramları tanıma ve basit sorular",
      "Kolay seviye - temel bilgileri test eden sorular",
      "Giriş düzeyi - öğrencinin konuya aşinalığını ölçen sorular",
    ],
    medium: [
      "Orta seviye - kavrama, yorumlama, iki adımlı işlemler",
      "Ara düzey - uygulama ve basit analiz gerektiren sorular",
      "Standart seviye - bilgiyi uygulamayı test eden sorular",
      "Normal zorluk - çok adımlı düşünme gerektiren sorular",
    ],
    hard: [
      "İleri seviye - analiz, çoklu adım, derinlemesine yorum",
      "Zor düzey - karmaşık problem çözme ve sentez",
      "Üst düzey - analitik düşünme ve değerlendirme",
      "Zorlu seviye - birden fazla kavramı birleştirme",
    ],
    legendary: [
      "Olimpiyat düzeyi - sentez, özgün düşünme ve yaratıcılık",
      "Yarışma seviyesi - üst düzey problem çözme",
      "Meydan okuma düzeyi - sıra dışı çözüm yaklaşımları",
      "Uzman seviyesi - derin analiz ve özgün sentez",
    ],
  },

  // Çeldirici şık direktifleri
  distractorRules: [
    "Yanlış şıklar yaygın öğrenci hatalarını yansıtsın",
    "Çeldiriciler mantıklı ama yanlış olsun",
    "Her yanlış şık belirli bir kavram yanılgısını temsil etsin",
    "Çeldiriciler kısmen doğru görünebilir ama tam değil",
    "Yanlış şıklar düşündürücü ama net şekilde yanlış olsun",
  ],

  // Açıklama format direktifleri
  explanationFormats: [
    "Açıklamada neden diğer şıkların yanlış olduğunu da belirt",
    "Açıklama öğretici ve anlaşılır olsun",
    "Açıklamada temel kavramı hatırlat",
    "Açıklamada adım adım çözüm göster",
    "Açıklamada benzer sorular için ipucu ver",
  ],

  // Bloom taksonomisi varyasyonları
  bloomDirectives: {
    bilgi: ["Tanıma ve hatırlama odaklı", "Temel bilgi tespiti", "Kavramları tanımlama"],
    kavrama: ["Anlama ve yorumlama odaklı", "Kavramları açıklama", "Örnekleme ve anlamlandırma"],
    uygulama: [
      "Bilgiyi kullanma odaklı",
      "Problem çözme ve hesaplama",
      "Formül ve kural uygulaması",
    ],
    analiz: [
      "Parçalara ayırma ve ilişki kurma",
      "Karşılaştırma ve ayırt etme",
      "Neden-sonuç analizi",
    ],
    sentez: ["Birleştirme ve oluşturma", "Yeni fikirler üretme", "Özgün çözüm tasarlama"],
    değerlendirme: ["Yargılama ve eleştiri", "Değer biçme ve savunma", "Karar verme ve seçim"],
  },
}

/**
 * Rastgele zorluk açıklaması döndür
 */
export function getRandomDifficultyDescription(
  difficulty: 'easy' | 'medium' | 'hard' | 'legendary'
): string {
  return randomChoice(PROMPT_VARIATIONS.difficultyDescriptions[difficulty])
}

/**
 * Rastgele çeldirici kuralı döndür
 */
export function getRandomDistractorRule(): string {
  return randomChoice(PROMPT_VARIATIONS.distractorRules)
}

/**
 * Rastgele açıklama format direktifi döndür
 */
export function getRandomExplanationFormat(): string {
  return randomChoice(PROMPT_VARIATIONS.explanationFormats)
}

/**
 * Rastgele Bloom direktifi döndür
 */
export function getRandomBloomDirective(
  level: 'bilgi' | 'kavrama' | 'uygulama' | 'analiz' | 'sentez' | 'değerlendirme'
): string {
  return randomChoice(PROMPT_VARIATIONS.bloomDirectives[level])
}

// =============================================================================
// PROMPT MODİFİKASYON
// =============================================================================

/**
 * Ana prompt'a varyasyon ekle
 */
export function addVariationsToPrompt(basePrompt: string): string {
  const tone = getRandomTone()
  const distractorRule = getRandomDistractorRule()
  const explanationFormat = getRandomExplanationFormat()

  const variationBlock = `
═══════════════════════════════════════════════════════
🎨 ÜSLUP VE FORMAT VARYASYONU
═══════════════════════════════════════════════════════
• ${tone}
• ${distractorRule}
• ${explanationFormat}
• Her soruda farklı soru kalıpları kullan (hangisi doğrudur, nedir, neden, nasıl vb.)
• Soru köklerini monoton yapma, çeşitlendir
• Açıklamalarda farklı başlangıç cümleleri kullan
`

  // Prompt'un sonuna varyasyon bloğunu ekle
  return basePrompt.replace(
    /ŞİMDİ .+ ÜRET:/,
    `${variationBlock}\n\nŞİMDİ MÜKEMMEL SORULAR ÜRET:`
  )
}

// =============================================================================
// DERS BAZLI ÖZEL VARYASYONLAR
// =============================================================================

export const SUBJECT_VARIATIONS: Record<
  string,
  {
    questionStyles: string[]
    contextExamples: string[]
    specialTips: string[]
  }
> = {
  Matematik: {
    questionStyles: [
      "Hesaplama ve işlem soruları",
      "Problem çözme ve modelleme",
      "Grafik ve tablo yorumlama",
      "Geometrik akıl yürütme",
    ],
    contextExamples: [
      "Günlük hayat problemleri (alışveriş, zaman, mesafe)",
      "Bilim ve teknoloji uygulamaları",
      "Spor ve oyun senaryoları",
      "Ekonomi ve finans örnekleri",
    ],
    specialTips: [
      "İşlem sırası ve önceliğe dikkat",
      "Birim dönüşümlerini kontrol et",
      "Sonucu yaklaşık değerle doğrula",
      "Şekil çizerek düşün",
    ],
  },
  Fizik: {
    questionStyles: [
      "Formül uygulaması ve birim analizi",
      "Grafik yorumlama soruları",
      "Deney tasarımı ve sonuç analizi",
      "Kavramsal anlama soruları",
    ],
    contextExamples: [
      "Günlük hayattan fizik örnekleri",
      "Spor ve hareket senaryoları",
      "Teknoloji ve mühendislik uygulamaları",
      "Doğa olayları ve gözlemler",
    ],
    specialTips: [
      "Birimleri mutlaka kontrol et",
      "Vektörlerde yöne dikkat",
      "Serbest cisim diyagramı çiz",
      "Enerji korunumunu düşün",
    ],
  },
  Kimya: {
    questionStyles: [
      "Denklem denkleştirme ve mol hesapları",
      "Periyodik tablo okuma",
      "Bağ yapısı ve geometri",
      "Reaksiyon mekanizması analizi",
    ],
    contextExamples: [
      "Günlük yaşamdaki kimyasal olaylar",
      "Çevre ve enerji konuları",
      "Gıda ve sağlık uygulamaları",
      "Endüstriyel süreçler",
    ],
    specialTips: [
      "Elektron sayısına dikkat",
      "Oksidasyon basamağını kontrol et",
      "Mol oranlarını doğru kur",
      "Periyodik eğilimleri hatırla",
    ],
  },
  Biyoloji: {
    questionStyles: [
      "Yapı-fonksiyon ilişkisi soruları",
      "Süreç ve döngü analizi",
      "Karşılaştırma ve sınıflandırma",
      "Deney sonucu yorumlama",
    ],
    contextExamples: [
      "İnsan vücudu ve sağlık",
      "Ekosistem ve çevre",
      "Genetik ve kalıtım",
      "Evrim ve adaptasyon",
    ],
    specialTips: [
      "Yapı-görev ilişkisini düşün",
      "Şemaları dikkatlice incele",
      "Kontrol grubu kavramını hatırla",
      "Canlı sistemleri birbirine bağla",
    ],
  },
  Türkçe: {
    questionStyles: [
      "Paragraf analizi ve ana fikir",
      "Dil bilgisi kuralları uygulama",
      "Anlam ilişkileri ve sözcük bilgisi",
      "Yazım ve noktalama",
    ],
    contextExamples: [
      "Edebi metinlerden alıntılar",
      "Güncel gazete haberleri",
      "Bilimsel popüler yazılar",
      "Deneme ve makale örnekleri",
    ],
    specialTips: [
      "Cümleyi bütün olarak değerlendir",
      "Bağlama göre anlam değişir",
      "Örtük anlama dikkat",
      "Yazarın amacını sorula",
    ],
  },
  Tarih: {
    questionStyles: [
      "Kronolojik sıralama soruları",
      "Neden-sonuç analizi",
      "Karşılaştırmalı tarih",
      "Kaynak ve belge yorumlama",
    ],
    contextExamples: [
      "Siyasi ve askeri olaylar",
      "Sosyal ve kültürel değişimler",
      "Ekonomik gelişmeler",
      "Bilim ve teknoloji tarihi",
    ],
    specialTips: [
      "Kronolojik sırayı kafanda canlandır",
      "Harita ve görselleri kullan",
      "Dönemin şartlarını düşün",
      "Sebep-sonuç zincirini kur",
    ],
  },
  Coğrafya: {
    questionStyles: [
      "Harita okuma ve yorumlama",
      "İklim ve bitki örtüsü ilişkisi",
      "Ekonomik coğrafya analizi",
      "Beşeri coğrafya soruları",
    ],
    contextExamples: [
      "Türkiye coğrafyası örnekleri",
      "Dünya ülkeleri karşılaştırması",
      "Güncel çevre sorunları",
      "Ekonomik veriler ve istatistikler",
    ],
    specialTips: [
      "Haritada konum ve yönü belirle",
      "Enlem-boylam etkisini düşün",
      "İklim elemanlarını ilişkilendir",
      "Nüfus ve yerleşme kalıplarını hatırla",
    ],
  },
}

/**
 * Ders bazlı özel varyasyon döndür
 */
export function getSubjectVariation(subject: string): {
  questionStyles: string[]
  contextExamples: string[]
  specialTips: string[]
} | null {
  return SUBJECT_VARIATIONS[subject] || null
}

/**
 * Rastgele soru stili döndür
 */
export function getRandomQuestionStyle(subject: string): string {
  const variation = SUBJECT_VARIATIONS[subject]
  if (variation) {
    return randomChoice(variation.questionStyles)
  }
  return "Kazanım odaklı, net ve anlaşılır sorular"
}

/**
 * Rastgele bağlam örneği döndür
 */
export function getRandomContextExample(subject: string): string {
  const variation = SUBJECT_VARIATIONS[subject]
  if (variation) {
    return randomChoice(variation.contextExamples)
  }
  return "Günlük hayattan örnekler"
}

/**
 * Rastgele özel ipucu döndür
 */
export function getRandomSpecialTip(subject: string): string {
  const variation = SUBJECT_VARIATIONS[subject]
  if (variation) {
    return randomChoice(variation.specialTips)
  }
  return "Dikkatli oku ve analiz et"
}

// =============================================================================
// EXPORT
// =============================================================================

export default {
  getRandomTone,
  getRandomQuestionFormat,
  getRandomExplanationStyle,
  getRandomDifficultyDescription,
  getRandomDistractorRule,
  getRandomExplanationFormat,
  getRandomBloomDirective,
  addVariationsToPrompt,
  getSubjectVariation,
  getRandomQuestionStyle,
  getRandomContextExample,
  getRandomSpecialTip,
  TONE_VARIATIONS,
  QUESTION_STEM_FORMATS,
  EXPLANATION_STYLES,
  PROMPT_VARIATIONS,
  SUBJECT_VARIATIONS,
}
