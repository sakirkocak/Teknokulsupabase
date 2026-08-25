import { SITE_URL } from '@/lib/site'

/**
 * YouTube Playlist Yönetimi
 * Türk Müfredatına göre otomatik playlist oluşturma
 * Rate limiting ile güvenli upload
 */

// Türk Müfredatı - Sınıflar ve Dersler
export const TURKISH_CURRICULUM = {
  // İlkokul (1-4. Sınıf)
  1: ['Türkçe', 'Matematik', 'Hayat Bilgisi', 'İngilizce', 'Müzik', 'Görsel Sanatlar', 'Beden Eğitimi'],
  2: ['Türkçe', 'Matematik', 'Hayat Bilgisi', 'İngilizce', 'Müzik', 'Görsel Sanatlar', 'Beden Eğitimi'],
  3: ['Türkçe', 'Matematik', 'Hayat Bilgisi', 'Fen Bilimleri', 'İngilizce', 'Müzik', 'Görsel Sanatlar', 'Beden Eğitimi'],
  4: ['Türkçe', 'Matematik', 'Sosyal Bilgiler', 'Fen Bilimleri', 'İngilizce', 'Din Kültürü', 'Müzik', 'Görsel Sanatlar', 'Beden Eğitimi', 'Trafik Güvenliği'],
  
  // Ortaokul (5-8. Sınıf)
  5: ['Türkçe', 'Matematik', 'Fen Bilimleri', 'Sosyal Bilgiler', 'İngilizce', 'Din Kültürü', 'Bilişim Teknolojileri', 'Müzik', 'Görsel Sanatlar', 'Beden Eğitimi'],
  6: ['Türkçe', 'Matematik', 'Fen Bilimleri', 'Sosyal Bilgiler', 'İngilizce', 'Din Kültürü', 'Bilişim Teknolojileri', 'Müzik', 'Görsel Sanatlar', 'Beden Eğitimi'],
  7: ['Türkçe', 'Matematik', 'Fen Bilimleri', 'Sosyal Bilgiler', 'İngilizce', 'Din Kültürü', 'Bilişim Teknolojileri', 'Müzik', 'Görsel Sanatlar', 'Beden Eğitimi'],
  8: ['Türkçe', 'Matematik', 'Fen Bilimleri', 'T.C. İnkılap Tarihi', 'İngilizce', 'Din Kültürü', 'Bilişim Teknolojileri', 'Müzik', 'Görsel Sanatlar', 'Beden Eğitimi'],
  
  // Lise (9-12. Sınıf)
  9: ['Türk Dili ve Edebiyatı', 'Matematik', 'Fizik', 'Kimya', 'Biyoloji', 'Tarih', 'Coğrafya', 'İngilizce', 'Din Kültürü', 'Felsefe', 'Beden Eğitimi'],
  10: ['Türk Dili ve Edebiyatı', 'Matematik', 'Fizik', 'Kimya', 'Biyoloji', 'Tarih', 'Coğrafya', 'İngilizce', 'Din Kültürü', 'Felsefe', 'Beden Eğitimi'],
  11: ['Türk Dili ve Edebiyatı', 'Matematik', 'Fizik', 'Kimya', 'Biyoloji', 'Tarih', 'Coğrafya', 'İngilizce', 'Din Kültürü', 'Felsefe', 'Sosyoloji', 'Psikoloji'],
  12: ['Türk Dili ve Edebiyatı', 'Matematik', 'Fizik', 'Kimya', 'Biyoloji', 'Tarih', 'Coğrafya', 'İngilizce', 'Din Kültürü', 'Felsefe', 'Mantık'],
} as const

// Ders kodları (URL-friendly)
export const SUBJECT_CODES: Record<string, string> = {
  'Türkçe': 'turkce',
  'Matematik': 'matematik',
  'Fen Bilimleri': 'fen-bilimleri',
  'Sosyal Bilgiler': 'sosyal-bilgiler',
  'Hayat Bilgisi': 'hayat-bilgisi',
  'İngilizce': 'ingilizce',
  'Din Kültürü': 'din-kulturu',
  'Bilişim Teknolojileri': 'bilisim',
  'Müzik': 'muzik',
  'Görsel Sanatlar': 'gorsel-sanatlar',
  'Beden Eğitimi': 'beden-egitimi',
  'Trafik Güvenliği': 'trafik-guvenligi',
  'T.C. İnkılap Tarihi': 'inkilap-tarihi',
  'Türk Dili ve Edebiyatı': 'edebiyat',
  'Fizik': 'fizik',
  'Kimya': 'kimya',
  'Biyoloji': 'biyoloji',
  'Tarih': 'tarih',
  'Coğrafya': 'cografya',
  'Felsefe': 'felsefe',
  'Sosyoloji': 'sosyoloji',
  'Psikoloji': 'psikoloji',
  'Mantık': 'mantik',
}

// Playlist adı oluştur
export function generatePlaylistTitle(grade: number, subject: string): string {
  return `${grade}. Sınıf ${subject} Soru Çözümleri | Teknokul`
}

// Playlist açıklaması oluştur
export function generatePlaylistDescription(grade: number, subject: string): string {
  return `📚 ${grade}. Sınıf ${subject} dersi için AI destekli video soru çözümleri.

✅ MEB müfredatına uygun
✅ Adım adım açıklamalı çözümler
✅ Yapay zeka ile üretilmiş profesyonel videolar

🌐 Daha fazlası için: ${SITE_URL}
📱 Tüm sorular: ${SITE_URL}/sorular

#${subject.replace(/\s+/g, '')} #${grade}Sınıf #SoruÇözümü #Teknokul #Eğitim #LGS #YKS`
}

// Rate limiting ayarları
export const RATE_LIMITS = {
  MAX_UPLOADS_PER_DAY: 50,           // Günlük maksimum video
  MIN_DELAY_BETWEEN_UPLOADS_MS: 180000, // Upload arası minimum 3 dakika
  MAX_DELAY_BETWEEN_UPLOADS_MS: 300000, // Upload arası maksimum 5 dakika
  UPLOAD_WINDOW_START_HOUR: 3,       // Gece 03:00'da başla
  UPLOAD_WINDOW_END_HOUR: 6,         // Sabah 06:00'da bitir (düşük trafik)
  QUOTA_PER_UPLOAD: 100,             // Her upload 100 unit
  DAILY_QUOTA: 10000,                // Günlük toplam quota
}

// Playlist ID cache (database'de tutulacak)
export interface PlaylistInfo {
  grade: number
  subject: string
  subjectCode: string
  playlistId: string | null
  playlistUrl: string | null
  videoCount: number
  createdAt: Date
  updatedAt: Date
}

// Tüm playlist kombinasyonlarını oluştur
export function getAllPlaylistCombinations(): Array<{ grade: number; subject: string; subjectCode: string }> {
  const combinations: Array<{ grade: number; subject: string; subjectCode: string }> = []
  
  for (const [gradeStr, subjects] of Object.entries(TURKISH_CURRICULUM)) {
    const grade = parseInt(gradeStr)
    for (const subject of subjects) {
      combinations.push({
        grade,
        subject,
        subjectCode: SUBJECT_CODES[subject] || subject.toLowerCase().replace(/\s+/g, '-')
      })
    }
  }
  
  return combinations
}

// Rastgele gecikme hesapla (rate limiting için)
export function getRandomDelay(): number {
  const { MIN_DELAY_BETWEEN_UPLOADS_MS, MAX_DELAY_BETWEEN_UPLOADS_MS } = RATE_LIMITS
  return Math.floor(
    Math.random() * (MAX_DELAY_BETWEEN_UPLOADS_MS - MIN_DELAY_BETWEEN_UPLOADS_MS) + 
    MIN_DELAY_BETWEEN_UPLOADS_MS
  )
}

// Upload için uygun saat mi kontrol et
export function isWithinUploadWindow(): boolean {
  const now = new Date()
  const hour = now.getHours()
  const { UPLOAD_WINDOW_START_HOUR, UPLOAD_WINDOW_END_HOUR } = RATE_LIMITS
  
  // Gece 03:00 - 06:00 arası
  return hour >= UPLOAD_WINDOW_START_HOUR && hour < UPLOAD_WINDOW_END_HOUR
}

// Bugün kaç video yüklenebilir hesapla
export function getRemainingUploadsToday(uploadedToday: number): number {
  return Math.max(0, RATE_LIMITS.MAX_UPLOADS_PER_DAY - uploadedToday)
}

// Quota kullanımı hesapla
export function getQuotaUsage(uploadedToday: number): { used: number; remaining: number; percentage: number } {
  const used = uploadedToday * RATE_LIMITS.QUOTA_PER_UPLOAD
  const remaining = RATE_LIMITS.DAILY_QUOTA - used
  const percentage = Math.round((used / RATE_LIMITS.DAILY_QUOTA) * 100)
  
  return { used, remaining, percentage }
}

// =====================================================
// VİDEO AÇIKLAMA VE HASHTAG ÜRETİCİ
// =====================================================

// Video başlığı oluştur
export function generateVideoTitle(
  grade: number, 
  subject: string, 
  topic: string,
  questionPreview: string
): string {
  // Max 100 karakter
  const preview = questionPreview.slice(0, 50).replace(/\n/g, ' ')
  return `${grade}. Sınıf ${subject} | ${topic} - ${preview}...`
}

// Video açıklaması oluştur
export function generateVideoDescription(options: {
  grade: number
  subject: string
  topic: string
  subTopic?: string
  questionText: string
  difficulty: string
  questionId: string
}): string {
  const { grade, subject, topic, subTopic, questionText, difficulty, questionId } = options
  
  const difficultyEmoji: Record<string, string> = {
    'easy': '🟢 Kolay',
    'medium': '🟡 Orta', 
    'hard': '🟠 Zor',
    'legendary': '🔴 Efsanevi'
  }
  
  const levelName = grade <= 4 ? 'İlkokul' : grade <= 8 ? 'Ortaokul' : 'Lise'
  const examType = grade === 8 ? '📚 LGS Hazırlık' : grade >= 9 ? '📚 YKS/TYT/AYT Hazırlık' : ''
  
  // Soru metnini kısalt
  const shortQuestion = questionText.length > 300 
    ? questionText.slice(0, 300) + '...' 
    : questionText

  return `📖 ${grade}. Sınıf ${subject} - ${topic}${subTopic ? ` / ${subTopic}` : ''}

🎯 Zorluk: ${difficultyEmoji[difficulty] || difficulty}
📊 Seviye: ${levelName}
${examType}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📝 SORU:
${shortQuestion}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✨ Bu video Teknokul yapay zeka sistemi tarafından otomatik olarak oluşturulmuştur.

🔗 Bu soruyu çöz: ${SITE_URL}/sorular/${SUBJECT_CODES[subject] || subject.toLowerCase()}/${grade}/${questionId}

📚 Daha fazla ${subject} sorusu: ${SITE_URL}/sorular/${SUBJECT_CODES[subject] || subject.toLowerCase()}/${grade}

🌐 Tüm sorular: ${SITE_URL}/sorular

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎓 Teknokul - Öğrenmenin Dijital Üssü
🤖 Yapay Zeka Destekli Eğitim Platformu
📱 ${SITE_URL}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${generateHashtags({ grade, subject, topic, difficulty })}`
}

// Hashtag'ler oluştur
export function generateHashtags(options: {
  grade: number
  subject: string
  topic: string
  difficulty?: string
}): string {
  const { grade, subject, topic, difficulty } = options
  
  const subjectTag = subject.replace(/\s+/g, '').replace(/[İıĞğÜüŞşÖöÇç]/g, (c) => {
    const map: Record<string, string> = { 'İ': 'I', 'ı': 'i', 'Ğ': 'G', 'ğ': 'g', 'Ü': 'U', 'ü': 'u', 'Ş': 'S', 'ş': 's', 'Ö': 'O', 'ö': 'o', 'Ç': 'C', 'ç': 'c' }
    return map[c] || c
  })
  
  const topicTag = topic.replace(/\s+/g, '').replace(/[İıĞğÜüŞşÖöÇç]/g, (c) => {
    const map: Record<string, string> = { 'İ': 'I', 'ı': 'i', 'Ğ': 'G', 'ğ': 'g', 'Ü': 'U', 'ü': 'u', 'Ş': 'S', 'ş': 's', 'Ö': 'O', 'ö': 'o', 'Ç': 'C', 'ç': 'c' }
    return map[c] || c
  }).slice(0, 20)
  
  const tags = [
    '#Teknokul',
    '#SoruCozumu',
    `#${grade}Sinif`,
    `#${subjectTag}`,
    `#${topicTag}`,
    '#Egitim',
    '#OnlineEgitim',
    '#YapayZeka',
    '#AIEgitim'
  ]
  
  // Sınıfa göre ek tag'ler
  if (grade === 8) {
    tags.push('#LGS', '#LGS2026', '#LGSHazirlik', '#LGSSorulari')
  } else if (grade >= 9) {
    tags.push('#YKS', '#TYT', '#AYT', '#YKS2026', '#UniversiteHazirlik')
  }
  
  // Derse göre ek tag'ler
  if (subject.includes('Matematik')) {
    tags.push('#Matematik', '#MatematikSorulari', '#MatematikCozum')
  } else if (subject.includes('Fizik')) {
    tags.push('#Fizik', '#FizikSorulari')
  } else if (subject.includes('Kimya')) {
    tags.push('#Kimya', '#KimyaSorulari')
  } else if (subject.includes('Türkçe') || subject.includes('Edebiyat')) {
    tags.push('#Turkce', '#TurkceSorulari', '#Edebiyat')
  } else if (subject.includes('Fen')) {
    tags.push('#FenBilimleri', '#Fen')
  }
  
  // Zorluk tag'i
  if (difficulty === 'legendary') {
    tags.push('#ZorSorular', '#Efsane')
  } else if (difficulty === 'hard') {
    tags.push('#ZorSorular')
  }
  
  return tags.join(' ')
}

// Video tag'leri (YouTube API için array)
export function generateVideoTags(options: {
  grade: number
  subject: string
  topic: string
}): string[] {
  const { grade, subject, topic } = options
  
  const tags = [
    'Teknokul',
    'soru çözümü',
    `${grade}. sınıf`,
    subject,
    topic,
    'eğitim',
    'online eğitim',
    'yapay zeka',
    'video çözüm',
    'MEB müfredat'
  ]
  
  if (grade === 8) {
    tags.push('LGS', 'LGS 2026', 'LGS hazırlık', 'LGS soruları')
  } else if (grade >= 9) {
    tags.push('YKS', 'TYT', 'AYT', 'üniversite hazırlık')
  }
  
  return tags
}
