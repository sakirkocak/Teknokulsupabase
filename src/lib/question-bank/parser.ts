/**
 * Doğal Dil Parser - Soru Bankası İsteklerini Parse Eder
 * 
 * Örnek inputlar:
 * - "8. sınıf matematik denklemler 50 soru"
 * - "LGS Türkçe paragraf kolay 100 tane"
 * - "9. sınıf fizik kuvvet ve hareket zor"
 */

import { 
  ParsedRequest, 
  SUBJECT_CODES, 
  DIFFICULTY_MAP, 
  EXAM_TYPES 
} from './types'

// Varsayılan değerler
const DEFAULT_QUESTION_COUNT = 25
const MIN_QUESTIONS = 10
const MAX_QUESTIONS = 200

/**
 * Ana parse fonksiyonu
 */
export function parseQuestionBankRequest(input: string): ParsedRequest {
  const text = input.toLowerCase().trim()
  
  const result: ParsedRequest = {
    question_count: DEFAULT_QUESTION_COUNT,
    raw_input: input
  }
  
  // 1. Sınıf tespiti
  const gradeResult = parseGrade(text)
  if (gradeResult.grade) {
    result.grade = gradeResult.grade
  }
  if (gradeResult.exam_type) {
    result.exam_type = gradeResult.exam_type
  }
  
  // 2. Ders tespiti
  const subjectResult = parseSubject(text)
  if (subjectResult) {
    result.subject_code = subjectResult.code
    result.subject_name = subjectResult.name
  }
  
  // 3. Zorluk tespiti
  const difficulty = parseDifficulty(text)
  if (difficulty) {
    result.difficulty = difficulty
  } else {
    result.difficulty = 'mixed' // Varsayılan
  }
  
  // 4. Soru sayısı tespiti
  result.question_count = parseQuestionCount(text)
  
  // 5. Konu tespiti (kalan kelimeler)
  result.topic = parseTopic(text, result)
  
  return result
}

/**
 * Sınıf ve sınav türü parse
 */
function parseGrade(text: string): { grade?: number; exam_type?: 'LGS' | 'TYT' | 'AYT' | 'YKS' } {
  const result: { grade?: number; exam_type?: 'LGS' | 'TYT' | 'AYT' | 'YKS' } = {}
  
  // Sınav türü kontrolü
  for (const [key, value] of Object.entries(EXAM_TYPES)) {
    if (text.includes(key)) {
      result.exam_type = value
      // LGS = 8. sınıf, TYT/AYT/YKS = 12. sınıf varsayım
      if (value === 'LGS') {
        result.grade = 8
      } else {
        result.grade = 12
      }
      return result
    }
  }
  
  // Normal sınıf pattern'leri
  const patterns = [
    /(\d+)\.\s*sınıf/i,          // "8. sınıf"
    /(\d+)\.sınıf/i,             // "8.sınıf"
    /(\d+)\s*\.?\s*sınıf/i,      // "8 sınıf"
    /sınıf\s*(\d+)/i,            // "sınıf 8"
    /(\d+)\s*sınıfta/i,          // "8. sınıfta"
  ]
  
  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match) {
      const grade = parseInt(match[1])
      if (grade >= 1 && grade <= 12) {
        result.grade = grade
        return result
      }
    }
  }
  
  return result
}

/**
 * Ders parse
 */
function parseSubject(text: string): { code: string; name: string } | null {
  // Önce uzun isimleri kontrol et
  const sortedKeys = Object.keys(SUBJECT_CODES).sort((a, b) => b.length - a.length)
  
  for (const key of sortedKeys) {
    // Kelime sınırı ile kontrol
    const regex = new RegExp(`\\b${key}\\b`, 'i')
    if (regex.test(text)) {
      return SUBJECT_CODES[key]
    }
  }
  
  // Basit içerik kontrolü (kelime sınırı olmadan)
  for (const key of sortedKeys) {
    if (text.includes(key)) {
      return SUBJECT_CODES[key]
    }
  }
  
  return null
}

/**
 * Zorluk parse
 */
function parseDifficulty(text: string): 'easy' | 'medium' | 'hard' | 'mixed' | null {
  for (const [key, value] of Object.entries(DIFFICULTY_MAP)) {
    if (text.includes(key)) {
      return value
    }
  }
  return null
}

/**
 * Soru sayısı parse
 */
function parseQuestionCount(text: string): number {
  const patterns = [
    /(\d+)\s*soru/i,           // "50 soru"
    /(\d+)\s*tane/i,           // "50 tane"
    /(\d+)\s*soruluk/i,        // "50 soruluk"
    /(\d+)\s*adet/i,           // "50 adet"
  ]
  
  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match) {
      const count = parseInt(match[1])
      // Min-max sınırları
      if (count < MIN_QUESTIONS) return MIN_QUESTIONS
      if (count > MAX_QUESTIONS) return MAX_QUESTIONS
      return count
    }
  }
  
  return DEFAULT_QUESTION_COUNT
}

/**
 * Konu parse (kalan kelimeler)
 */
function parseTopic(text: string, parsed: ParsedRequest): string | undefined {
  let remaining = text
  
  // Önce "soru bankası" kelimesini çıkar ama DİĞER kelimeleri koru
  remaining = remaining.replace(/soru\s*bankası/gi, ' ')
  
  // Sayıları ve bilinen kelimeleri çıkar
  const removePatterns = [
    /\d+\.\s*sınıf/gi,
    /\d+\.sınıf/gi,
    /\d+\s*sınıf/gi,
    /sınıf\s*\d+/gi,
    /\d+\s*soru/gi,
    /\d+\s*tane/gi,
    /\d+\s*soruluk/gi,
    /\d+\s*adet/gi,
    /lgs|tyt|ayt|yks/gi,
    /kolay|orta|zor|karışık|karisik/gi,
    /istiyorum|oluştur|hazırla|üret/gi,
    /dersinde|konusundan|konusu|dersi/gi,
    /tüm\s*konular/gi,
    /bana|ver|yap|çıkar/gi,
  ]
  
  for (const pattern of removePatterns) {
    remaining = remaining.replace(pattern, ' ')
  }
  
  // Ders adını çıkar
  if (parsed.subject_name) {
    const subjectLower = parsed.subject_name.toLowerCase()
    remaining = remaining.replace(new RegExp(`\\b${subjectLower}\\b`, 'gi'), ' ')
  }
  
  // Ders kodlarını çıkar (sadece tam kelime eşleşmesi)
  for (const key of Object.keys(SUBJECT_CODES)) {
    remaining = remaining.replace(new RegExp(`\\b${key}\\b`, 'gi'), ' ')
  }
  
  // Temizle
  remaining = remaining
    .replace(/\s+/g, ' ')
    .trim()
  
  // Çok kısa ise undefined döndür
  if (remaining.length < 2) {
    return undefined
  }
  
  return remaining || undefined
}

/**
 * Otomatik başlık oluştur
 * Format: "Teknokul [Sınıf/Sınav] [Ders] [Konu] [Zorluk] Soru Bankası - [Sayı] Soru"
 */
export function generateTitle(parsed: ParsedRequest): string {
  const parts = ['Teknokul']
  
  // Sınav türü veya sınıf
  if (parsed.exam_type) {
    parts.push(parsed.exam_type)
  } else if (parsed.grade) {
    parts.push(`${parsed.grade}. Sınıf`)
  }
  
  // Ders
  if (parsed.subject_name) {
    parts.push(parsed.subject_name)
  }
  
  // Konu (varsa ve kısa ise)
  if (parsed.topic && parsed.topic.length <= 25) {
    // İlk harfleri büyüt
    const capitalizedTopic = capitalizeWords(parsed.topic)
    parts.push(capitalizedTopic)
  }
  
  // Zorluk (mixed değilse)
  if (parsed.difficulty && parsed.difficulty !== 'mixed') {
    const difficultyNames: Record<string, string> = {
      easy: 'Kolay',
      medium: 'Orta',
      hard: 'Zor'
    }
    parts.push(difficultyNames[parsed.difficulty])
  }
  
  parts.push('Soru Bankası')
  
  // Soru sayısı
  parts.push(`- ${parsed.question_count} Soru`)
  
  return parts.join(' ')
}

/**
 * Kelimelerin ilk harflerini büyüt
 */
function capitalizeWords(text: string): string {
  return text
    .split(' ')
    .map(word => {
      if (word.length === 0) return word
      // Türkçe karakterleri de düzgün büyüt
      const firstChar = word.charAt(0)
      const upperFirst = firstChar === 'i' ? 'İ' : firstChar.toUpperCase()
      return upperFirst + word.slice(1).toLowerCase()
    })
    .join(' ')
}

/**
 * SEO-friendly slug oluştur
 */
export function generateSlug(title: string, questionCount: number): string {
  const base = title
    .toLowerCase()
    .replace(/ı/g, 'i')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
  
  // Benzersizlik için timestamp ekle
  const timestamp = Date.now().toString(36)
  
  return `${base}-${questionCount}-soru-${timestamp}`
}

/**
 * Meta description oluştur
 */
export function generateMetaDescription(parsed: ParsedRequest): string {
  const parts: string[] = []
  
  if (parsed.grade) {
    parts.push(`${parsed.grade}. sınıf`)
  }
  
  if (parsed.subject_name) {
    parts.push(parsed.subject_name.toLowerCase())
  }
  
  if (parsed.topic) {
    parts.push(parsed.topic)
  }
  
  const base = parts.length > 0 
    ? `${parts.join(' ')} konusundan` 
    : ''
  
  return `${base} ${parsed.question_count} soruluk ücretsiz soru bankası. PDF olarak indir, çalışmaya hemen başla! Teknokul ile sınava hazırlan.`.slice(0, 160)
}
