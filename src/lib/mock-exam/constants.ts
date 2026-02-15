// =====================================================
// DENEME DUNYASI - Sabitler
// =====================================================

import { ExamType, SubjectCode } from './types'

// =====================================================
// SINAV TURU KONFIGURASYONLARI
// =====================================================

export interface ExamTypeConfig {
  label: string
  shortLabel: string
  grades: number[]
  duration: number // dakika
  totalQuestions: number
  subjects: SubjectConfig[]
  wrongPenalty: number // kac yanlis 1 dogru goturur (0 = goturu yok)
  scoreRange: { min: number; max: number }
  basePoints: number
}

export interface SubjectConfig {
  code: SubjectCode
  name: string
  displayName: string
  questionCount: number
  coefficient: number
  // Kompozit dersler icin alt ders dagilimi (orn: Sosyal = İnkılap 10 + Din 10)
  subSubjects?: { code: string; name: string; questionCount: number }[]
}

export const EXAM_CONFIGS: Record<string, ExamTypeConfig> = {
  // ===========================================
  // BURSLULUK 2-3: Turkce 20, Mat 20, Hayat Bilgisi 20
  // ===========================================
  BURSLULUK_2: {
    label: '2. Sinif Bursluluk Sinavi',
    shortLabel: 'Bursluluk 2',
    grades: [2],
    duration: 60,
    totalQuestions: 60,
    subjects: [
      { code: 'turkce', name: 'Turkce', displayName: 'Türkçe', questionCount: 20, coefficient: 3 },
      { code: 'matematik', name: 'Matematik', displayName: 'Matematik', questionCount: 20, coefficient: 3 },
      { code: 'hayat_bilgisi', name: 'Hayat Bilgisi', displayName: 'Hayat Bilgisi', questionCount: 20, coefficient: 3 },
    ],
    wrongPenalty: 3,
    scoreRange: { min: 100, max: 500 },
    basePoints: 200,
  },
  BURSLULUK_3: {
    label: '3. Sinif Bursluluk Sinavi',
    shortLabel: 'Bursluluk 3',
    grades: [3],
    duration: 60,
    totalQuestions: 60,
    subjects: [
      { code: 'turkce', name: 'Turkce', displayName: 'Türkçe', questionCount: 20, coefficient: 3 },
      { code: 'matematik', name: 'Matematik', displayName: 'Matematik', questionCount: 20, coefficient: 3 },
      { code: 'hayat_bilgisi', name: 'Hayat Bilgisi', displayName: 'Hayat Bilgisi', questionCount: 20, coefficient: 3 },
    ],
    wrongPenalty: 3,
    scoreRange: { min: 100, max: 500 },
    basePoints: 200,
  },
  // ===========================================
  // BURSLULUK 4: Turkce 20, Mat 20, Fen 20, Sosyal 20
  // ===========================================
  BURSLULUK_4: {
    label: '4. Sinif Bursluluk Sinavi',
    shortLabel: 'Bursluluk 4',
    grades: [4],
    duration: 80,
    totalQuestions: 80,
    subjects: [
      { code: 'turkce', name: 'Turkce', displayName: 'Türkçe', questionCount: 20, coefficient: 3 },
      { code: 'matematik', name: 'Matematik', displayName: 'Matematik', questionCount: 20, coefficient: 3 },
      { code: 'fen_bilimleri', name: 'Fen Bilimleri', displayName: 'Fen Bilimleri', questionCount: 20, coefficient: 3 },
      { code: 'sosyal_bilgiler', name: 'Sosyal Bilgiler', displayName: 'Sosyal Bilgiler', questionCount: 20, coefficient: 3 },
    ],
    wrongPenalty: 3,
    scoreRange: { min: 100, max: 500 },
    basePoints: 200,
  },
  // ===========================================
  // BURSLULUK 5-7: Turkce 20, Mat 20, Fen 20, Sosyal 20
  // ===========================================
  BURSLULUK_5: {
    label: '5. Sinif Bursluluk Sinavi',
    shortLabel: 'Bursluluk 5',
    grades: [5],
    duration: 100,
    totalQuestions: 80,
    subjects: [
      { code: 'turkce', name: 'Turkce', displayName: 'Türkçe', questionCount: 20, coefficient: 3 },
      { code: 'matematik', name: 'Matematik', displayName: 'Matematik', questionCount: 20, coefficient: 3 },
      { code: 'fen_bilimleri', name: 'Fen Bilimleri', displayName: 'Fen Bilimleri', questionCount: 20, coefficient: 3 },
      { code: 'sosyal_bilgiler', name: 'Sosyal Bilgiler', displayName: 'Sosyal Bilgiler', questionCount: 20, coefficient: 3 },
    ],
    wrongPenalty: 3,
    scoreRange: { min: 100, max: 500 },
    basePoints: 200,
  },
  BURSLULUK_6: {
    label: '6. Sinif Bursluluk Sinavi',
    shortLabel: 'Bursluluk 6',
    grades: [6],
    duration: 100,
    totalQuestions: 80,
    subjects: [
      { code: 'turkce', name: 'Turkce', displayName: 'Türkçe', questionCount: 20, coefficient: 3 },
      { code: 'matematik', name: 'Matematik', displayName: 'Matematik', questionCount: 20, coefficient: 3 },
      { code: 'fen_bilimleri', name: 'Fen Bilimleri', displayName: 'Fen Bilimleri', questionCount: 20, coefficient: 3 },
      { code: 'sosyal_bilgiler', name: 'Sosyal Bilgiler', displayName: 'Sosyal Bilgiler', questionCount: 20, coefficient: 3 },
    ],
    wrongPenalty: 3,
    scoreRange: { min: 100, max: 500 },
    basePoints: 200,
  },
  BURSLULUK_7: {
    label: '7. Sinif Bursluluk Sinavi',
    shortLabel: 'Bursluluk 7',
    grades: [7],
    duration: 100,
    totalQuestions: 80,
    subjects: [
      { code: 'turkce', name: 'Turkce', displayName: 'Türkçe', questionCount: 20, coefficient: 3 },
      { code: 'matematik', name: 'Matematik', displayName: 'Matematik', questionCount: 20, coefficient: 3 },
      { code: 'fen_bilimleri', name: 'Fen Bilimleri', displayName: 'Fen Bilimleri', questionCount: 20, coefficient: 3 },
      { code: 'sosyal_bilgiler', name: 'Sosyal Bilgiler', displayName: 'Sosyal Bilgiler', questionCount: 20, coefficient: 3 },
    ],
    wrongPenalty: 3,
    scoreRange: { min: 100, max: 500 },
    basePoints: 200,
  },
  // ===========================================
  // BURSLULUK 8: Sosyal = Inkilap(10) + Din(10)
  // ===========================================
  BURSLULUK_8: {
    label: '8. Sinif Bursluluk Sinavi',
    shortLabel: 'Bursluluk 8',
    grades: [8],
    duration: 100,
    totalQuestions: 80,
    subjects: [
      { code: 'turkce', name: 'Turkce', displayName: 'Türkçe', questionCount: 20, coefficient: 3 },
      { code: 'matematik', name: 'Matematik', displayName: 'Matematik', questionCount: 20, coefficient: 3 },
      { code: 'fen_bilimleri', name: 'Fen Bilimleri', displayName: 'Fen Bilimleri', questionCount: 20, coefficient: 3 },
      {
        code: 'sosyal_bilgiler', name: 'Sosyal Bilgiler', displayName: 'Sosyal Bilgiler', questionCount: 20, coefficient: 3,
        subSubjects: [
          { code: 'inkilap_tarihi', name: 'T.C. İnkılap Tarihi ve Atatürkçülük', questionCount: 10 },
          { code: 'din_kulturu', name: 'Din Kültürü ve Ahlak Bilgisi', questionCount: 10 },
        ],
      },
    ],
    wrongPenalty: 3,
    scoreRange: { min: 100, max: 500 },
    basePoints: 200,
  },
  // ===========================================
  // BURSLULUK 9: Lise 9. sinif
  // TDE 20, Mat 20, Fen(Fizik+Kimya+Biyo) 20, Sosyal(Tarih+Cog+Felsefe+Din) 20
  // ===========================================
  BURSLULUK_9: {
    label: '9. Sinif Bursluluk Sinavi',
    shortLabel: 'Bursluluk 9',
    grades: [9],
    duration: 100,
    totalQuestions: 80,
    subjects: [
      { code: 'edebiyat', name: 'Turk Dili ve Edebiyati', displayName: 'Türk Dili ve Edebiyatı', questionCount: 20, coefficient: 3 },
      { code: 'matematik', name: 'Matematik', displayName: 'Matematik', questionCount: 20, coefficient: 3 },
      {
        code: 'fen_bilimleri', name: 'Fen Bilimleri', displayName: 'Fen Bilimleri', questionCount: 20, coefficient: 3,
        subSubjects: [
          { code: 'fizik', name: 'Fizik', questionCount: 7 },
          { code: 'kimya', name: 'Kimya', questionCount: 7 },
          { code: 'biyoloji', name: 'Biyoloji', questionCount: 6 },
        ],
      },
      {
        code: 'sosyal_bilgiler', name: 'Sosyal Bilimler', displayName: 'Sosyal Bilimler', questionCount: 20, coefficient: 3,
        subSubjects: [
          { code: 'tarih', name: 'Tarih', questionCount: 7 },
          { code: 'cografya', name: 'Coğrafya', questionCount: 5 },
          { code: 'felsefe', name: 'Felsefe', questionCount: 4 },
          { code: 'din_kulturu', name: 'Din Kültürü', questionCount: 4 },
        ],
      },
    ],
    wrongPenalty: 3,
    scoreRange: { min: 100, max: 500 },
    basePoints: 200,
  },
  // ===========================================
  // BURSLULUK 10
  // ===========================================
  BURSLULUK_10: {
    label: '10. Sinif Bursluluk Sinavi',
    shortLabel: 'Bursluluk 10',
    grades: [10],
    duration: 100,
    totalQuestions: 80,
    subjects: [
      { code: 'edebiyat', name: 'Turk Dili ve Edebiyati', displayName: 'Türk Dili ve Edebiyatı', questionCount: 20, coefficient: 3 },
      { code: 'matematik', name: 'Matematik', displayName: 'Matematik', questionCount: 20, coefficient: 3 },
      {
        code: 'fen_bilimleri', name: 'Fen Bilimleri', displayName: 'Fen Bilimleri', questionCount: 20, coefficient: 3,
        subSubjects: [
          { code: 'fizik', name: 'Fizik', questionCount: 7 },
          { code: 'kimya', name: 'Kimya', questionCount: 7 },
          { code: 'biyoloji', name: 'Biyoloji', questionCount: 6 },
        ],
      },
      {
        code: 'sosyal_bilgiler', name: 'Sosyal Bilimler', displayName: 'Sosyal Bilimler', questionCount: 20, coefficient: 3,
        subSubjects: [
          { code: 'tarih', name: 'Tarih', questionCount: 7 },
          { code: 'cografya', name: 'Coğrafya', questionCount: 5 },
          { code: 'felsefe', name: 'Felsefe', questionCount: 4 },
          { code: 'din_kulturu', name: 'Din Kültürü', questionCount: 4 },
        ],
      },
    ],
    wrongPenalty: 3,
    scoreRange: { min: 100, max: 500 },
    basePoints: 200,
  },
  // ===========================================
  // BURSLULUK 11
  // ===========================================
  BURSLULUK_11: {
    label: '11. Sinif Bursluluk Sinavi',
    shortLabel: 'Bursluluk 11',
    grades: [11],
    duration: 100,
    totalQuestions: 80,
    subjects: [
      { code: 'edebiyat', name: 'Turk Dili ve Edebiyati', displayName: 'Türk Dili ve Edebiyatı', questionCount: 20, coefficient: 3 },
      { code: 'matematik', name: 'Matematik', displayName: 'Matematik', questionCount: 20, coefficient: 3 },
      {
        code: 'fen_bilimleri', name: 'Fen Bilimleri', displayName: 'Fen Bilimleri', questionCount: 20, coefficient: 3,
        subSubjects: [
          { code: 'fizik', name: 'Fizik', questionCount: 7 },
          { code: 'kimya', name: 'Kimya', questionCount: 7 },
          { code: 'biyoloji', name: 'Biyoloji', questionCount: 6 },
        ],
      },
      {
        code: 'sosyal_bilgiler', name: 'Sosyal Bilimler', displayName: 'Sosyal Bilimler', questionCount: 20, coefficient: 3,
        subSubjects: [
          { code: 'tarih', name: 'Tarih', questionCount: 7 },
          { code: 'cografya', name: 'Coğrafya', questionCount: 5 },
          { code: 'felsefe', name: 'Felsefe', questionCount: 4 },
          { code: 'din_kulturu', name: 'Din Kültürü', questionCount: 4 },
        ],
      },
    ],
    wrongPenalty: 3,
    scoreRange: { min: 100, max: 500 },
    basePoints: 200,
  },
  // ===========================================
  // TYT (Temel Yeterlilik Testi)
  // 125 soru, 165 dakika, 4 yanlis = 1 dogru goturur
  // ===========================================
  TYT: {
    label: 'TYT Deneme Sınavı',
    shortLabel: 'TYT',
    grades: [11, 12],
    duration: 165,
    totalQuestions: 125,
    subjects: [
      { code: 'turkce', name: 'Turkce', displayName: 'Türkçe', questionCount: 40, coefficient: 1.33 },
      {
        code: 'sosyal_bilgiler', name: 'Sosyal Bilimler', displayName: 'Sosyal Bilimler', questionCount: 25, coefficient: 1.36,
        subSubjects: [
          { code: 'tarih', name: 'Tarih', questionCount: 5 },
          { code: 'cografya', name: 'Coğrafya', questionCount: 5 },
          { code: 'felsefe', name: 'Felsefe', questionCount: 5 },
          { code: 'din_kulturu', name: 'Din Kültürü', questionCount: 5 },
          { code: 'inkilap_tarihi', name: 'İnkılap Tarihi', questionCount: 5 },
        ],
      },
      {
        code: 'matematik', name: 'Temel Matematik', displayName: 'Temel Matematik', questionCount: 40, coefficient: 1.33,
        subSubjects: [
          { code: 'matematik', name: 'Matematik', questionCount: 30 },
          { code: 'geometri', name: 'Geometri', questionCount: 10 },
        ],
      },
      {
        code: 'fen_bilimleri', name: 'Fen Bilimleri', displayName: 'Fen Bilimleri', questionCount: 20, coefficient: 1.36,
        subSubjects: [
          { code: 'fizik', name: 'Fizik', questionCount: 7 },
          { code: 'kimya', name: 'Kimya', questionCount: 7 },
          { code: 'biyoloji', name: 'Biyoloji', questionCount: 6 },
        ],
      },
    ],
    wrongPenalty: 4,
    scoreRange: { min: 100, max: 500 },
    basePoints: 100,
  },
  // ===========================================
  // AYT (Alan Yeterlilik Testi)
  // 160 soru, 180 dakika, 4 yanlis = 1 dogru goturur
  // ===========================================
  AYT: {
    label: 'AYT Deneme Sınavı',
    shortLabel: 'AYT',
    grades: [11, 12],
    duration: 180,
    totalQuestions: 160,
    subjects: [
      {
        code: 'edebiyat', name: 'TDE-Sosyal Bilimler 1', displayName: 'TDE - Sosyal Bilimler 1', questionCount: 40, coefficient: 1.0,
        subSubjects: [
          { code: 'edebiyat', name: 'Türk Dili ve Edebiyatı', questionCount: 24 },
          { code: 'tarih', name: 'Tarih-1', questionCount: 10 },
          { code: 'cografya', name: 'Coğrafya-1', questionCount: 6 },
        ],
      },
      {
        code: 'matematik', name: 'Matematik', displayName: 'Matematik', questionCount: 40, coefficient: 1.0,
        subSubjects: [
          { code: 'matematik', name: 'Matematik', questionCount: 29 },
          { code: 'geometri', name: 'Geometri', questionCount: 11 },
        ],
      },
      {
        code: 'fen_bilimleri', name: 'Fen Bilimleri', displayName: 'Fen Bilimleri', questionCount: 40, coefficient: 1.0,
        subSubjects: [
          { code: 'fizik', name: 'Fizik', questionCount: 14 },
          { code: 'kimya', name: 'Kimya', questionCount: 13 },
          { code: 'biyoloji', name: 'Biyoloji', questionCount: 13 },
        ],
      },
      {
        code: 'sosyal_bilgiler', name: 'Sosyal Bilimler 2', displayName: 'Sosyal Bilimler 2', questionCount: 40, coefficient: 1.0,
        subSubjects: [
          { code: 'tarih', name: 'Tarih-2', questionCount: 11 },
          { code: 'cografya', name: 'Coğrafya-2', questionCount: 11 },
          { code: 'felsefe', name: 'Felsefe Grubu', questionCount: 12 },
          { code: 'din_kulturu', name: 'Din Kültürü', questionCount: 6 },
        ],
      },
    ],
    wrongPenalty: 4,
    scoreRange: { min: 100, max: 500 },
    basePoints: 100,
  },
  // ===========================================
  // LGS
  // ===========================================
  LGS: {
    label: 'LGS Deneme Sinavi',
    shortLabel: 'LGS',
    grades: [8],
    duration: 135,
    totalQuestions: 90,
    subjects: [
      { code: 'turkce', name: 'Turkce', displayName: 'Türkçe', questionCount: 20, coefficient: 4.348 },
      { code: 'matematik', name: 'Matematik', displayName: 'Matematik', questionCount: 20, coefficient: 4.2538 },
      { code: 'fen_bilimleri', name: 'Fen Bilimleri', displayName: 'Fen Bilimleri', questionCount: 20, coefficient: 4.348 },
      { code: 'inkilap_tarihi', name: 'Inkilap Tarihi', displayName: 'İnkılap Tarihi', questionCount: 10, coefficient: 2.174 },
      { code: 'din_kulturu', name: 'Din Kulturu', displayName: 'Din Kültürü', questionCount: 10, coefficient: 2.174 },
      { code: 'ingilizce', name: 'Ingilizce', displayName: 'İngilizce', questionCount: 10, coefficient: 2.174 },
    ],
    wrongPenalty: 3,
    scoreRange: { min: 100, max: 500 },
    basePoints: 194.752,
  },
}

// Sinav turu etiketleri
export const EXAM_TYPE_LABELS: Record<string, string> = {
  BURSLULUK_2: '2. Sinif Bursluluk',
  BURSLULUK_3: '3. Sinif Bursluluk',
  BURSLULUK_4: '4. Sinif Bursluluk',
  BURSLULUK_5: '5. Sinif Bursluluk',
  BURSLULUK_6: '6. Sinif Bursluluk',
  BURSLULUK_7: '7. Sinif Bursluluk',
  BURSLULUK_8: '8. Sinif Bursluluk',
  BURSLULUK_9: '9. Sinif Bursluluk',
  BURSLULUK_10: '10. Sinif Bursluluk',
  BURSLULUK_11: '11. Sinif Bursluluk',
  LGS: 'LGS',
  TYT: 'TYT',
  AYT: 'AYT',
}

// Ders renkleri (UI icin)
export const SUBJECT_COLORS: Record<string, { bg: string; text: string; border: string; light: string }> = {
  turkce: { bg: 'bg-red-500', text: 'text-red-600', border: 'border-red-300', light: 'bg-red-50' },
  matematik: { bg: 'bg-blue-500', text: 'text-blue-600', border: 'border-blue-300', light: 'bg-blue-50' },
  fen_bilimleri: { bg: 'bg-green-500', text: 'text-green-600', border: 'border-green-300', light: 'bg-green-50' },
  sosyal_bilgiler: { bg: 'bg-amber-500', text: 'text-amber-600', border: 'border-amber-300', light: 'bg-amber-50' },
  inkilap_tarihi: { bg: 'bg-orange-500', text: 'text-orange-600', border: 'border-orange-300', light: 'bg-orange-50' },
  din_kulturu: { bg: 'bg-purple-500', text: 'text-purple-600', border: 'border-purple-300', light: 'bg-purple-50' },
  ingilizce: { bg: 'bg-cyan-500', text: 'text-cyan-600', border: 'border-cyan-300', light: 'bg-cyan-50' },
  edebiyat: { bg: 'bg-rose-500', text: 'text-rose-600', border: 'border-rose-300', light: 'bg-rose-50' },
  fizik: { bg: 'bg-indigo-500', text: 'text-indigo-600', border: 'border-indigo-300', light: 'bg-indigo-50' },
  kimya: { bg: 'bg-emerald-500', text: 'text-emerald-600', border: 'border-emerald-300', light: 'bg-emerald-50' },
  biyoloji: { bg: 'bg-lime-500', text: 'text-lime-600', border: 'border-lime-300', light: 'bg-lime-50' },
  tarih: { bg: 'bg-yellow-500', text: 'text-yellow-600', border: 'border-yellow-300', light: 'bg-yellow-50' },
  cografya: { bg: 'bg-teal-500', text: 'text-teal-600', border: 'border-teal-300', light: 'bg-teal-50' },
  felsefe: { bg: 'bg-violet-500', text: 'text-violet-600', border: 'border-violet-300', light: 'bg-violet-50' },
  geometri: { bg: 'bg-sky-500', text: 'text-sky-600', border: 'border-sky-300', light: 'bg-sky-50' },
  hayat_bilgisi: { bg: 'bg-pink-500', text: 'text-pink-600', border: 'border-pink-300', light: 'bg-pink-50' },
}

// Ders ikon emojileri
export const SUBJECT_ICONS: Record<string, string> = {
  turkce: 'TR',
  matematik: 'MT',
  fen_bilimleri: 'FN',
  sosyal_bilgiler: 'SB',
  inkilap_tarihi: 'İT',
  din_kulturu: 'DK',
  ingilizce: 'EN',
  edebiyat: 'ED',
  fizik: 'FZ',
  kimya: 'KM',
  biyoloji: 'BY',
  tarih: 'TH',
  cografya: 'CG',
  felsefe: 'FL',
  geometri: 'GE',
  hayat_bilgisi: 'HB',
}

// Timer uyari esikleri (dakika)
export const TIMER_WARNINGS = {
  YELLOW: 15,
  RED: 5,
  CRITICAL: 1,
} as const

// XP oduller
export const MOCK_EXAM_XP = {
  COMPLETE: 50,
  HIGH_SCORE_BONUS: 25,
  PERFECT_SUBJECT: 20,
} as const

// localStorage key'leri
export const STORAGE_KEYS = {
  EXAM_BACKUP: 'teknokul_exam_backup',
  EXAM_STARTED: 'teknokul_exam_started',
} as const

// Sinav sinif secenekleri
export const GRADE_OPTIONS = [
  { value: 2, label: '2. Sinif' },
  { value: 3, label: '3. Sinif' },
  { value: 4, label: '4. Sinif' },
  { value: 5, label: '5. Sinif' },
  { value: 6, label: '6. Sinif' },
  { value: 7, label: '7. Sinif' },
  { value: 8, label: '8. Sinif' },
  { value: 9, label: '9. Sinif' },
  { value: 10, label: '10. Sinif' },
  { value: 11, label: '11. Sinif' },
]

// Subject display name mapping
export const SUBJECT_DISPLAY_NAMES: Record<string, string> = {
  turkce: 'Türkçe',
  matematik: 'Matematik',
  fen_bilimleri: 'Fen Bilimleri',
  sosyal_bilgiler: 'Sosyal Bilgiler',
  inkilap_tarihi: 'İnkılap Tarihi',
  din_kulturu: 'Din Kültürü',
  ingilizce: 'İngilizce',
  edebiyat: 'Türk Dili ve Edebiyatı',
  fizik: 'Fizik',
  kimya: 'Kimya',
  biyoloji: 'Biyoloji',
  tarih: 'Tarih',
  cografya: 'Coğrafya',
  felsefe: 'Felsefe',
  hayat_bilgisi: 'Hayat Bilgisi',
  // Buyuk harfli versiyonlar (DB'den gelen)
  'Türkçe': 'Türkçe',
  'Matematik': 'Matematik',
  'Fen Bilimleri': 'Fen Bilimleri',
  'Sosyal Bilgiler': 'Sosyal Bilgiler',
  'T.C. İnkılap Tarihi ve Atatürkçülük': 'İnkılap Tarihi',
  'Din Kültürü ve Ahlak Bilgisi': 'Din Kültürü',
  'Türk Dili ve Edebiyatı': 'Edebiyat',
  'Fizik': 'Fizik',
  'Kimya': 'Kimya',
  'Biyoloji': 'Biyoloji',
  'Tarih': 'Tarih',
  'Coğrafya': 'Coğrafya',
  'Felsefe': 'Felsefe',
  'Hayat Bilgisi': 'Hayat Bilgisi',
}

// Subject code mapping (DB'deki -> lowercase)
export const SUBJECT_CODE_MAP: Record<string, string> = {
  'TURKCE': 'turkce',
  'MATEMATiK': 'matematik',
  'MATEMATIK': 'matematik',
  'FEN BILIMLERi': 'fen_bilimleri',
  'FEN BILIMLERI': 'fen_bilimleri',
  'SOSYAL BILGILER': 'sosyal_bilgiler',
  'INKILAP TARIHI': 'inkilap_tarihi',
  'DIN KULTURU': 'din_kulturu',
  'INGILIZCE': 'ingilizce',
  'Turkce': 'turkce',
  'Türkçe': 'turkce',
  'Matematik': 'matematik',
  'Fen Bilimleri': 'fen_bilimleri',
  'Sosyal Bilgiler': 'sosyal_bilgiler',
  'T.C. İnkılap Tarihi ve Atatürkçülük': 'inkilap_tarihi',
  'Din Kültürü ve Ahlak Bilgisi': 'din_kulturu',
  'İngilizce': 'ingilizce',
  'Türk Dili ve Edebiyatı': 'edebiyat',
  'Fizik': 'fizik',
  'Kimya': 'kimya',
  'Biyoloji': 'biyoloji',
  'Tarih': 'tarih',
  'Coğrafya': 'cografya',
  'Felsefe': 'felsefe',
  'Hayat Bilgisi': 'hayat_bilgisi',
  'HAYAT BILGISI': 'hayat_bilgisi',
  'Hayat bilgisi': 'hayat_bilgisi',
}
