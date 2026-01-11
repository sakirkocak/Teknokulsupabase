/**
 * 🤖 JARVIS SCENE TYPES
 * Tüm dersler için 3D sahne tanımları
 */

// ============================================
// SAHNE TİPLERİ
// ============================================

export type JarvisSceneType = 
  // Matematik / Geometri
  | 'triangle' | 'square' | 'rectangle' | 'circle' | 'coordinate' | 'numberLine' | 'pieChart' | 'vennDiagram'
  // Fizik
  | 'forceVector' | 'motion' | 'circuit' | 'wave' | 'pendulum'
  // Kimya
  | 'atom' | 'molecule' | 'reaction' | 'periodicElement'
  // Biyoloji
  | 'cell' | 'dna' | 'ecosystem' | 'organ'
  // Türkçe
  | 'paragraphMap' | 'sentenceTree' | 'wordCloud'
  // Tarih
  | 'timeline' | 'mapHighlight' | 'historicalEvent'
  // Coğrafya
  | 'climateZone' | 'landform' | 'populationChart'
  // Genel
  | 'stepByStep' | 'quiz' | 'none'

// ============================================
// SAHNE PARAMETRELERİ
// ============================================

export interface TriangleParams {
  base: number
  height: number
  type?: 'equilateral' | 'isosceles' | 'scalene' | 'right'
}

export interface SquareParams {
  side: number
}

export interface RectangleParams {
  width: number
  height: number
}

export interface CircleParams {
  radius: number
}

export interface ForceVectorParams {
  vectors: Array<{ magnitude: number; angle: number; label?: string; color?: string }>
  showResultant?: boolean
}

export interface AtomParams {
  element: string
  protons: number
  neutrons: number
  electrons: number
}

export interface TimelineParams {
  events: Array<{ year: number; title: string; description?: string }>
}

export interface CellParams {
  type: 'animal' | 'plant' | 'bacteria'
  highlightOrganelles?: string[]
}

// ============================================
// DERS -> SAHNE EŞLEŞTİRME
// ============================================

export const SUBJECT_SCENES: Record<string, JarvisSceneType[]> = {
  matematik: ['triangle', 'square', 'rectangle', 'circle', 'coordinate', 'numberLine', 'pieChart', 'vennDiagram'],
  geometri: ['triangle', 'square', 'rectangle', 'circle', 'coordinate'],
  fizik: ['forceVector', 'motion', 'circuit', 'wave', 'pendulum', 'coordinate'],
  kimya: ['atom', 'molecule', 'reaction', 'periodicElement'],
  biyoloji: ['cell', 'dna', 'ecosystem', 'organ'],
  fen_bilimleri: ['atom', 'molecule', 'cell', 'forceVector', 'motion'],
  turkce: ['paragraphMap', 'sentenceTree', 'wordCloud'],
  tarih: ['timeline', 'mapHighlight', 'historicalEvent'],
  inkilap_tarihi: ['timeline', 'mapHighlight', 'historicalEvent'],
  cografya: ['climateZone', 'landform', 'populationChart', 'mapHighlight'],
  sosyal_bilgiler: ['timeline', 'mapHighlight', 'populationChart'],
  ingilizce: ['paragraphMap', 'sentenceTree', 'wordCloud'],
}

// ============================================
// SAHNE META VERİLERİ
// ============================================

export interface SceneMetadata {
  name: string
  icon: string
  color: string
  description: string
  gestures: string[]
}

export const SCENE_METADATA: Record<JarvisSceneType, SceneMetadata> = {
  triangle: { name: 'Üçgen', icon: '🔺', color: 'cyan', description: 'Üçgen alanı ve çevresi', gestures: ['Köşeleri sürükle', 'Pinch ile büyüt'] },
  square: { name: 'Kare', icon: '🟩', color: 'green', description: 'Kare alanı ve çevresi', gestures: ['Kenarı sürükle'] },
  rectangle: { name: 'Dikdörtgen', icon: '🟧', color: 'amber', description: 'Dikdörtgen alanı', gestures: ['Köşeleri sürükle'] },
  circle: { name: 'Daire', icon: '🔵', color: 'violet', description: 'Daire alanı ve çevresi', gestures: ['Yarıçapı değiştir'] },
  coordinate: { name: 'Koordinat', icon: '📊', color: 'blue', description: 'Grafik sistemi', gestures: ['Nokta ekle', 'Zoom'] },
  numberLine: { name: 'Sayı Doğrusu', icon: '📏', color: 'indigo', description: 'Tam sayılar', gestures: ['Sayıları sürükle'] },
  pieChart: { name: 'Pasta Grafiği', icon: '🥧', color: 'pink', description: 'Kesirler', gestures: ['Dilim seç'] },
  vennDiagram: { name: 'Venn Diyagramı', icon: '⭕', color: 'purple', description: 'Kümeler', gestures: ['Kümeleri sürükle'] },
  forceVector: { name: 'Kuvvet Vektörü', icon: '➡️', color: 'red', description: 'Kuvvet ve yön', gestures: ['Oku döndür', 'Büyüklük değiştir'] },
  motion: { name: 'Hareket', icon: '🚗', color: 'orange', description: 'Hız-yol-zaman', gestures: ['Hızı ayarla'] },
  circuit: { name: 'Devre', icon: '🔌', color: 'yellow', description: 'Elektrik devresi', gestures: ['Eleman ekle'] },
  wave: { name: 'Dalga', icon: '🌊', color: 'teal', description: 'Dalga hareketi', gestures: ['Frekans değiştir'] },
  pendulum: { name: 'Sarkaç', icon: '🕰️', color: 'slate', description: 'Salınım', gestures: ['İpi uzat'] },
  atom: { name: 'Atom', icon: '⚛️', color: 'blue', description: 'Atom modeli', gestures: ['Yörüngeyi döndür'] },
  molecule: { name: 'Molekül', icon: '🧬', color: 'emerald', description: 'Molekül yapısı', gestures: ['3D döndür'] },
  reaction: { name: 'Tepkime', icon: '🧪', color: 'lime', description: 'Kimyasal tepkime', gestures: ['Tepkimeyi başlat'] },
  periodicElement: { name: 'Element', icon: '🔬', color: 'cyan', description: 'Periyodik tablo', gestures: ['Elementi seç'] },
  cell: { name: 'Hücre', icon: '🦠', color: 'green', description: 'Hücre yapısı', gestures: ['Organeli seç'] },
  dna: { name: 'DNA', icon: '🧬', color: 'violet', description: 'DNA sarmalı', gestures: ['Sarmalı döndür'] },
  ecosystem: { name: 'Ekosistem', icon: '🌿', color: 'emerald', description: 'Besin zinciri', gestures: ['Canlıyı seç'] },
  organ: { name: 'Organ', icon: '🫀', color: 'red', description: 'Organ yapısı', gestures: ['Organı döndür'] },
  paragraphMap: { name: 'Paragraf', icon: '📝', color: 'blue', description: 'Paragraf analizi', gestures: ['Cümleyi seç'] },
  sentenceTree: { name: 'Cümle Ağacı', icon: '🌳', color: 'green', description: 'Cümle ögeleri', gestures: ['Ögeyi seç'] },
  wordCloud: { name: 'Kelime Bulutu', icon: '☁️', color: 'sky', description: 'Anahtar kelimeler', gestures: ['Kelimeyi seç'] },
  timeline: { name: 'Zaman Çizelgesi', icon: '📅', color: 'amber', description: 'Tarihsel olaylar', gestures: ['Olayı seç'] },
  mapHighlight: { name: 'Harita', icon: '🗺️', color: 'emerald', description: 'Coğrafi bölgeler', gestures: ['Bölgeyi seç'] },
  historicalEvent: { name: 'Tarihi Olay', icon: '🏛️', color: 'stone', description: 'Olay detayları', gestures: ['Detayları gör'] },
  climateZone: { name: 'İklim', icon: '🌡️', color: 'orange', description: 'İklim kuşakları', gestures: ['Bölgeyi seç'] },
  landform: { name: 'Yer Şekli', icon: '⛰️', color: 'stone', description: 'Dağ, ova, plato', gestures: ['3D döndür'] },
  populationChart: { name: 'Nüfus', icon: '👥', color: 'blue', description: 'Nüfus grafiği', gestures: ['Yılı seç'] },
  stepByStep: { name: 'Adım Adım', icon: '📋', color: 'gray', description: 'Sıralı çözüm', gestures: ['Sonraki adım'] },
  quiz: { name: 'Quiz', icon: '❓', color: 'purple', description: 'Soru-cevap', gestures: ['Şıkkı seç'] },
  none: { name: 'Metin', icon: '📄', color: 'slate', description: 'Sadece metin', gestures: [] }
}

// ============================================
// GESTURE HİNTLERİ
// ============================================

export const GESTURE_HINTS = [
  "🖐️ Elini aç → Nesneyi kontrol et",
  "👌 Parmakları birleştir → Büyüt/Küçült",
  "👊 Yumruk → İpucu al",
  "👉 İtme hareketi → Sonraki adım",
]

// Helper fonksiyonlar
export function getScenesForSubject(subject: string): JarvisSceneType[] {
  const normalized = subject.toLowerCase().replace(/\s+/g, '_')
  return SUBJECT_SCENES[normalized] || ['stepByStep', 'none']
}

export function getSceneMetadata(sceneType: JarvisSceneType): SceneMetadata {
  return SCENE_METADATA[sceneType] || SCENE_METADATA.none
}
