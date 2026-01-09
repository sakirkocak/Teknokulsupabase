/**
 * İnteraktif Çözüm Kartları - Type Definitions
 * Video yerine JSON tabanlı interaktif soru çözümleri
 */

// Adım tipleri
export type StepType = 'narration' | 'quiz' | 'animation' | 'formula' | 'tip' | 'result';

// Animasyon şablonları
export type AnimationTemplate = 
  | 'terazi'           // Denklem çözümü
  | 'sayi_dogrusu'     // Tam sayılar
  | 'pasta_dilimi'     // Kesirler
  | 'koordinat'        // Grafik
  | 'havuz'            // Su akışı problemleri
  | 'hareketli_araba'  // Hız/yol/zaman
  | 'ucgen'            // Geometri
  | 'venn'             // Kümeler
  | 'olasilik_topu'    // Olasılık
  | 'devre'            // Elektrik
  | 'atom'             // Kimya
  | 'hucre'            // Biyoloji
  | 'none';            // Animasyon yok

// Quiz seçeneği
export interface QuizOption {
  text: string;
  isCorrect: boolean;
  feedback?: string;  // Seçildiğinde gösterilecek açıklama
}

// Quiz yapısı
export interface StepQuiz {
  question: string;
  options: QuizOption[];
  hint?: string;
  explanation?: string;  // Doğru cevap sonrası açıklama
}

// Tek bir çözüm adımı
export interface SolutionStep {
  order: number;
  type: StepType;
  
  // İçerik
  text: string;                    // Ekranda gösterilecek metin
  narration?: string;              // TTS için metin (opsiyonel)
  math?: string;                   // LaTeX formül
  
  // Görsel
  animation?: AnimationTemplate;
  animationParams?: Record<string, any>;  // Animasyon parametreleri
  imageUrl?: string;
  
  // Etkileşim
  quiz?: StepQuiz;
  isPausePoint?: boolean;          // Video durma noktası mı?
  
  // Zamanlama
  duration: number;                // Saniye
  
  // Stil
  highlightColor?: string;
  emoji?: string;
}

// Ana çözüm kartı yapısı
export interface InteractiveSolutionCard {
  id: string;
  questionId: string;
  
  // Adımlar
  steps: SolutionStep[];
  
  // Metadata
  totalDurationSeconds: number;
  difficulty: 'easy' | 'medium' | 'hard';
  
  // Şablonlar
  templates: AnimationTemplate[];
  
  // Etkileşim noktaları (saniye)
  interactionPoints: number[];
  
  // İstatistikler
  viewCount: number;
  completionRate: number;
  avgScore: number;
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
}

// Öğrenci etkileşimi
export interface SolutionInteraction {
  id: string;
  solutionId: string;
  studentId?: string;
  
  stepIndex: number;
  interactionType: 'quiz_answer' | 'skip' | 'replay' | 'pause' | 'complete';
  selectedOption?: number;
  isCorrect?: boolean;
  timeSpentSeconds: number;
  
  createdAt: string;
}

// API Request/Response
export interface GenerateSolutionRequest {
  questionId: string;
  questionText: string;
  options: Record<string, string>;
  correctAnswer: string;
  explanation?: string;
  subjectName?: string;
  topicName?: string;
  grade?: number;
}

export interface GenerateSolutionResponse {
  success: boolean;
  solution?: InteractiveSolutionCard;
  error?: string;
}

// Player State
export interface PlayerState {
  currentStepIndex: number;
  isPlaying: boolean;
  isPaused: boolean;
  score: number;
  correctAnswers: number;
  wrongAnswers: number;
  interactions: SolutionInteraction[];
  startTime: number;
  completedAt?: number;
}

// Player Props
export interface InteractivePlayerProps {
  solution: InteractiveSolutionCard;
  questionData: {
    text: string;
    options: Record<string, string>;
    correctAnswer: string;
    imageUrl?: string;
  };
  onComplete?: (state: PlayerState) => void;
  onInteraction?: (interaction: Omit<SolutionInteraction, 'id' | 'createdAt'>) => void;
  autoPlay?: boolean;
  showControls?: boolean;
}

// Şablon konfigürasyonu
export const TEMPLATE_CONFIG: Record<AnimationTemplate, {
  name: string;
  subjects: string[];
  description: string;
}> = {
  terazi: {
    name: 'Terazi Dengesi',
    subjects: ['Matematik'],
    description: 'Denklem çözümü için terazi animasyonu'
  },
  sayi_dogrusu: {
    name: 'Sayı Doğrusu',
    subjects: ['Matematik'],
    description: 'Tam sayılar ve sıralama'
  },
  pasta_dilimi: {
    name: 'Pasta Dilimi',
    subjects: ['Matematik'],
    description: 'Kesirler için pasta görselleştirmesi'
  },
  koordinat: {
    name: 'Koordinat Sistemi',
    subjects: ['Matematik', 'Fizik'],
    description: 'Grafik ve fonksiyon çizimi'
  },
  havuz: {
    name: 'Havuz Problemi',
    subjects: ['Matematik'],
    description: 'Su akışı ve dolum problemleri'
  },
  hareketli_araba: {
    name: 'Hareketli Araba',
    subjects: ['Matematik', 'Fizik'],
    description: 'Hız, yol, zaman problemleri'
  },
  ucgen: {
    name: 'Üçgen Builder',
    subjects: ['Matematik'],
    description: 'Geometri şekilleri'
  },
  venn: {
    name: 'Venn Diyagramı',
    subjects: ['Matematik'],
    description: 'Küme işlemleri'
  },
  olasilik_topu: {
    name: 'Olasılık Topu',
    subjects: ['Matematik'],
    description: 'Olasılık deneyleri'
  },
  devre: {
    name: 'Elektrik Devresi',
    subjects: ['Fizik'],
    description: 'Devre simülasyonu'
  },
  atom: {
    name: 'Atom Modeli',
    subjects: ['Kimya', 'Fizik'],
    description: 'Atom ve molekül yapısı'
  },
  hucre: {
    name: 'Hücre Yapısı',
    subjects: ['Biyoloji'],
    description: 'Hücre organelleri'
  },
  none: {
    name: 'Animasyon Yok',
    subjects: [],
    description: 'Sadece metin'
  }
};
