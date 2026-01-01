/**
 * Soru Bankası PDF Sistemi - Type Definitions
 */

export interface QuestionBank {
  id: string
  title: string
  slug: string
  description?: string
  
  // Oluşturan
  user_id?: string
  user_name: string
  ip_hash?: string
  
  // İçerik kriterleri
  grade?: number
  exam_type?: 'LGS' | 'TYT' | 'AYT' | 'YKS'
  subject_code?: string
  subject_name?: string
  topics?: string[]
  difficulty?: 'easy' | 'medium' | 'hard' | 'mixed'
  
  // Soru bilgileri
  question_count: number
  question_ids?: string[]
  
  // PDF
  pdf_url?: string
  pdf_size_kb?: number
  
  // Yayın
  is_public: boolean
  published_at?: string
  
  // İstatistikler
  view_count: number
  download_count: number
  
  // SEO
  meta_title?: string
  meta_description?: string
  
  // Zaman
  created_at: string
  updated_at?: string
}

export interface ParsedRequest {
  grade?: number
  exam_type?: 'LGS' | 'TYT' | 'AYT' | 'YKS'
  subject_code?: string
  subject_name?: string
  topic?: string
  difficulty?: 'easy' | 'medium' | 'hard' | 'mixed'
  question_count: number
  raw_input: string
}

export interface QuestionForPDF {
  id: string
  question_text: string
  question_image_url?: string
  option_a: string
  option_b: string
  option_c: string
  option_d: string
  option_e?: string
  correct_answer: string
  difficulty: string
  subject_name: string
  main_topic: string
}

export interface CreateBankRequest {
  parsed: ParsedRequest
  title: string
  user_id?: string
  user_name?: string
}

export interface CreateBankResponse {
  success: boolean
  bank?: QuestionBank
  pdf_url?: string
  error?: string
}

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  limit_count: number
}

// Ders kodları mapping - Typesense'deki gerçek kodlarla eşleşmeli!
export const SUBJECT_CODES: Record<string, { code: string; name: string }> = {
  // Matematik
  'matematik': { code: 'matematik', name: 'Matematik' },
  'mat': { code: 'matematik', name: 'Matematik' },
  'geometri': { code: 'matematik', name: 'Matematik' },
  
  // Türkçe
  'türkçe': { code: 'turkce', name: 'Türkçe' },
  'turkce': { code: 'turkce', name: 'Türkçe' },
  'paragraf': { code: 'turkce', name: 'Türkçe' },
  
  // Fen Bilimleri
  'fen': { code: 'fen_bilimleri', name: 'Fen Bilimleri' },
  'fen bilimleri': { code: 'fen_bilimleri', name: 'Fen Bilimleri' },
  
  // Fizik
  'fizik': { code: 'fizik', name: 'Fizik' },
  
  // Kimya
  'kimya': { code: 'kimya', name: 'Kimya' },
  
  // Biyoloji
  'biyoloji': { code: 'biyoloji', name: 'Biyoloji' },
  
  // İngilizce
  'ingilizce': { code: 'ingilizce', name: 'İngilizce' },
  'ing': { code: 'ingilizce', name: 'İngilizce' },
  'english': { code: 'ingilizce', name: 'İngilizce' },
  
  // Tarih
  'tarih': { code: 'tarih', name: 'Tarih' },
  
  // Coğrafya
  'coğrafya': { code: 'cografya', name: 'Coğrafya' },
  'cografya': { code: 'cografya', name: 'Coğrafya' },
  
  // İnkılap Tarihi
  'inkılap': { code: 'inkilap_tarihi', name: 'T.C. İnkılap Tarihi' },
  'inkilap': { code: 'inkilap_tarihi', name: 'T.C. İnkılap Tarihi' },
  'inkılap tarihi': { code: 'inkilap_tarihi', name: 'T.C. İnkılap Tarihi' },
  
  // Din Kültürü
  'din': { code: 'din_kulturu', name: 'Din Kültürü' },
  'din kültürü': { code: 'din_kulturu', name: 'Din Kültürü' },
  'din kulturu': { code: 'din_kulturu', name: 'Din Kültürü' },
  
  // Sosyal Bilgiler
  'sosyal': { code: 'sosyal_bilgiler', name: 'Sosyal Bilgiler' },
  'sosyal bilgiler': { code: 'sosyal_bilgiler', name: 'Sosyal Bilgiler' },
  
  // Edebiyat
  'edebiyat': { code: 'edebiyat', name: 'Türk Dili ve Edebiyatı' },
  
  // Felsefe
  'felsefe': { code: 'felsefe', name: 'Felsefe' },
  
  // Bilişim
  'bilişim': { code: 'bilisim', name: 'Bilişim Teknolojileri' },
  'bilisim': { code: 'bilisim', name: 'Bilişim Teknolojileri' },
  'bilgisayar': { code: 'bilisim', name: 'Bilişim Teknolojileri' },
  
  // Görsel Sanatlar
  'görsel sanatlar': { code: 'gorsel_sanatlar', name: 'Görsel Sanatlar' },
  'gorsel sanatlar': { code: 'gorsel_sanatlar', name: 'Görsel Sanatlar' },
  
  // Müzik
  'müzik': { code: 'muzik', name: 'Müzik' },
  'muzik': { code: 'muzik', name: 'Müzik' },
  
  // Teknoloji ve Tasarım
  'teknoloji': { code: 'teknoloji_tasarim', name: 'Teknoloji ve Tasarım' },
  'teknoloji tasarım': { code: 'teknoloji_tasarim', name: 'Teknoloji ve Tasarım' },
  'teknoloji ve tasarım': { code: 'teknoloji_tasarim', name: 'Teknoloji ve Tasarım' },
  'tasarım': { code: 'teknoloji_tasarim', name: 'Teknoloji ve Tasarım' },
  
  // Beden Eğitimi
  'beden eğitimi': { code: 'beden_egitimi', name: 'Beden Eğitimi' },
  'beden egitimi': { code: 'beden_egitimi', name: 'Beden Eğitimi' },
  
  // Hayat Bilgisi
  'hayat bilgisi': { code: 'hayat_bilgisi', name: 'Hayat Bilgisi' },
  
  // Yabancı Diller
  'almanca': { code: 'almanca', name: 'Almanca' },
  'fransızca': { code: 'fransizca', name: 'Fransızca' },
  'fransizca': { code: 'fransizca', name: 'Fransızca' },
}

// Zorluk mapping
export const DIFFICULTY_MAP: Record<string, 'easy' | 'medium' | 'hard' | 'mixed'> = {
  'kolay': 'easy',
  'easy': 'easy',
  'orta': 'medium',
  'medium': 'medium',
  'zor': 'hard',
  'hard': 'hard',
  'karışık': 'mixed',
  'karisik': 'mixed',
  'mixed': 'mixed',
}

// Sınav türleri
export const EXAM_TYPES: Record<string, 'LGS' | 'TYT' | 'AYT' | 'YKS'> = {
  'lgs': 'LGS',
  'tyt': 'TYT',
  'ayt': 'AYT',
  'yks': 'YKS',
}
