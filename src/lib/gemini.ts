import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai'
import {
  getRandomTone,
  getRandomDifficultyDescription,
  getRandomDistractorRule,
  getRandomExplanationFormat,
  getRandomQuestionStyle,
  getRandomContextExample,
  getRandomSpecialTip,
} from './question-variations'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

// =====================================================
// YARDIMCI FONKSİYONLAR - LaTeX & Retry
// =====================================================

/**
 * Sleep fonksiyonu - retry mekanizması için
 */
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

/**
 * Retry mekanizması - hata durumunda otomatik yeniden deneme
 * Exponential backoff ile 3 deneme yapar
 */
async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  context: string = 'operation'
): Promise<T> {
  let lastError: Error | null = null
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error: any) {
      lastError = error
      console.warn(`⚠️ ${context} - Deneme ${attempt}/${maxRetries} başarısız:`, error.message)
      
      if (attempt < maxRetries) {
        const delay = 500 * Math.pow(2, attempt - 1) // 500ms, 1000ms, 2000ms
        console.log(`🔄 ${delay}ms sonra tekrar deneniyor...`)
        await sleep(delay)
      }
    }
  }
  
  throw lastError || new Error(`${context} - Tüm denemeler başarısız oldu`)
}

/**
 * LaTeX ifadelerini normalize eder
 * Sadece çoklu backslash'leri düzeltir, kelime bazlı değişiklik yapmaz.
 */
function normalizeLatex(text: string): string {
  if (!text || typeof text !== 'string') return text
  
  let normalized = text
  
  // 1. Üç veya daha fazla ardışık backslash'i iki backslash'e indir
  // Bu genellikle JSON parse sonrası oluşan bir durumdur
  normalized = normalized.replace(/\\{3,}/g, '\\\\')
  
  // Eski agresif replace'ler kaldırıldı.
  // AI'ın ürettiği LaTeX koduna güveniyoruz.
  
  return normalized
}

/**
 * JSON string içindeki LaTeX'i normalize eder (parse öncesi)
 * JSON parse hatalarını önlemek için
 */
function normalizeLatexInJson(jsonStr: string): string {
  if (!jsonStr) return jsonStr
  
  let result = jsonStr
  
  // 1. Önce tüm string değerlerini bul ve içlerindeki LaTeX'i normalize et
  // JSON string içindeki çift tırnak arasındaki değerleri yakala
  result = result.replace(/"([^"\\]*(\\.[^"\\]*)*)"/g, (match, content) => {
    // String içeriğini normalize et
    let normalized = content
    
    // Üç+ backslash -> iki backslash (JSON içinde \\\ -> \\)
    normalized = normalized.replace(/\\{4,}/g, '\\\\')
    
    return `"${normalized}"`
  })
  
  // 2. Control karakterlerini temizle
  result = result
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, ' ')  // Control chars (tab ve newline hariç)
    .replace(/\t/g, ' ')  // Tab -> space
    .replace(/\r\n/g, ' ')  // CRLF -> space
    .replace(/\r/g, ' ')   // CR -> space
    .replace(/\n/g, ' ')   // LF -> space
  
  // 3. Unicode sorunlarını düzelt
  result = result
    .replace(/\u00A0/g, ' ')  // Non-breaking space
    .replace(/\u2028/g, ' ')  // Line separator
    .replace(/\u2029/g, ' ')  // Paragraph separator
    .replace(/[\uFFFD\uFFFE\uFFFF]/g, '')  // Replacement chars
  
  // 4. Çoklu boşlukları tek boşluğa indir (JSON değerlerinde)
  result = result.replace(/  +/g, ' ')
  
  return result
}

/**
 * Curriculum soruları için JSON Schema
 * Gemini Structured Output için kullanılır
 */
const curriculumQuestionSchema = {
  type: SchemaType.OBJECT,
  properties: {
    questions: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          question_text: { type: SchemaType.STRING, description: 'Soru metni' },
          options: {
            type: SchemaType.OBJECT,
            properties: {
              A: { type: SchemaType.STRING },
              B: { type: SchemaType.STRING },
              C: { type: SchemaType.STRING },
              D: { type: SchemaType.STRING },
              E: { type: SchemaType.STRING, nullable: true }
            },
            required: ['A', 'B', 'C', 'D']
          },
          correct_answer: { type: SchemaType.STRING, description: 'Doğru cevap harfi (A, B, C, D veya E)' },
          explanation: { type: SchemaType.STRING, description: 'Açıklama' },
          difficulty: { type: SchemaType.STRING, description: 'Zorluk seviyesi' },
          bloom_level: { type: SchemaType.STRING, description: 'Bloom taksonomisi seviyesi' },
          // 🆕 Yeni Nesil Soru alanları
          visual_type: { type: SchemaType.STRING, description: 'Görsel türü: table, chart, flowchart, pie, diagram veya none', nullable: true },
          visual_content: { type: SchemaType.STRING, description: 'LaTeX tablo, Mermaid grafik veya SVG kodu', nullable: true }
        },
        required: ['question_text', 'options', 'correct_answer', 'explanation', 'difficulty', 'bloom_level']
      }
    }
  },
  required: ['questions']
}

// Gemini 3 Flash - Ocak 2025 bilgi tabanı, gelişmiş akıl yürütme
export const geminiModel = genAI.getGenerativeModel({ 
  model: 'gemini-3-flash-preview'
})

// =====================================================
// NANO BANANA PRO - GÖRÜNTÜ ÜRETİMİ
// Gemini 3 Pro Image Preview - Yüksek kaliteli görüntü üretimi
// =====================================================
export const geminiImageModel = genAI.getGenerativeModel({ 
  model: 'gemini-3-pro-image-preview'
})

// Soru tipleri
export type QuestionType = 'multiple_choice' | 'true_false' | 'open_ended' | 'fill_blank'
export type Difficulty = 'easy' | 'medium' | 'hard' | 'legendary'

// Müfredat bazlı soru tipi
// Yeni Nesil Soru görsel türleri
export type VisualType = 'none' | 'table' | 'chart' | 'flowchart' | 'pie' | 'diagram' | 'mixed'

export interface CurriculumQuestion {
  question_text: string
  options: {
    A: string
    B: string
    C: string
    D: string
    E?: string // Lise için 5. şık
  }
  correct_answer: 'A' | 'B' | 'C' | 'D' | 'E'
  explanation: string
  difficulty: Difficulty
  bloom_level: 'bilgi' | 'kavrama' | 'uygulama' | 'analiz' | 'sentez' | 'değerlendirme'
  // 🆕 Yeni Nesil Soru alanları
  visual_type?: VisualType  // Görsel türü
  visual_content?: string   // Mermaid/SVG/LaTeX tablo kodu
}

export interface GeneratedQuestion {
  question_text: string
  question_type: QuestionType
  options?: string[]
  correct_answer: string
  explanation: string
  difficulty: Difficulty
}

/**
 * JSON parse sonrası bozulan LaTeX escape karakterlerini düzeltir
 * Sorun: JSON.parse() sırasında \t, \r, \f, \n gibi escape sequence'lar
 * gerçek karakterlere dönüşüyor.
 * 
 * Bu fonksiyon ARTIK kelime bazlı "tahmin" yapmıyor. Sadece zorunlu temizlik.
 */
function fixLatexEscapes(obj: any): any {
  if (typeof obj === 'string') {
    let fixed = obj
    
    // Kalan bozuk escape karakterlerini temizle
    fixed = fixed.replace(/\t/g, ' ')  // Tab -> boşluk
    fixed = fixed.replace(/\r/g, '')   // CR -> sil
    fixed = fixed.replace(/\f/g, '')   // FF -> sil
    
    // Eski "imes" -> "\times" gibi agresif düzeltmeler KALDIRILDI.
    // Bu düzeltmeler normal metinleri ("sometimes" -> "some\times") bozuyordu.
    
    return fixed
  }
  
  if (Array.isArray(obj)) {
    return obj.map(fixLatexEscapes)
  }
  
  if (obj && typeof obj === 'object') {
    const fixed: any = {}
    for (const key in obj) {
      fixed[key] = fixLatexEscapes(obj[key])
    }
    return fixed
  }
  
  return obj
}

// Soru üretici prompt
export async function generateQuestions(
  subject: string,
  topic: string,
  questionTypes: QuestionType[],
  difficulty: Difficulty | 'auto',
  count: number = 5
): Promise<GeneratedQuestion[]> {
  const typeDescriptions = {
    multiple_choice: 'Çoktan seçmeli (4 seçenek, A/B/C/D)',
    true_false: 'Doğru/Yanlış',
    open_ended: 'Açık uçlu (kısa cevap)',
    fill_blank: 'Boşluk doldurma',
  }

  const selectedTypes = questionTypes.map(t => typeDescriptions[t]).join(', ')
  
  // 🎨 Varyasyon değerlerini seç
  const selectedTone = getRandomTone()
  const selectedDistractorRule = getRandomDistractorRule()
  
  const difficultyPrompt = difficulty === 'auto' 
    ? 'Zorluk seviyesini sen belirle (easy, medium, hard)' 
    : `Zorluk seviyesi: ${difficulty}`

  const prompt = `Sen bir eğitim uzmanısın. Türkçe olarak ${subject} dersi için "${topic}" konusunda ${count} adet soru üret.

Soru tipleri: ${selectedTypes}
${difficultyPrompt}

🎨 ÜSLUP: ${selectedTone}
🎯 ÇELDİRİCİ: ${selectedDistractorRule}

SADECE aşağıdaki JSON formatında yanıt ver. Başka hiçbir metin ekleme:

{"questions":[{"question_text":"Soru metni buraya","question_type":"multiple_choice","options":["A) Seçenek 1","B) Seçenek 2","C) Seçenek 3","D) Seçenek 4"],"correct_answer":"A","explanation":"Açıklama buraya","difficulty":"medium"}]}

Kurallar:
- question_type değerleri: multiple_choice, true_false, open_ended, fill_blank
- difficulty değerleri: easy, medium, hard
- Çoktan seçmeli için options dizisi gerekli, correct_answer sadece harf olmalı (A, B, C veya D)
- Doğru/Yanlış için correct_answer "Doğru" veya "Yanlış" olmalı
- Boşluk doldurma için soru metninde boşluk yerine ______ kullan, correct_answer boşluğa gelecek kelime/kelimeler olmalı (örnek: "Timur İmparatorluğu")
- Açık uçlu sorular için correct_answer kısa ve net cevap olmalı
- Diğer tipler için options null olmalı
- JSON syntax hatası yapma, trailing comma kullanma
- Tüm string değerleri çift tırnak içinde olmalı
- explanation her zaman doğru cevabı içermeli

🎭 ÇEŞİTLİLİK (AI Pattern Önleme):
- Her soruda FARKLI soru kalıpları kullan
- Doğru cevap rastgele dağılsın (A, B, C, D eşit olasılıkla)
- Monoton ifadelerden kaçın`

  try {
    const result = await geminiModel.generateContent(prompt)
    const response = await result.response
    let text = response.text()
    
    // Markdown code block'u kaldır
    text = text.replace(/```json\s*/gi, '')
    text = text.replace(/```\s*/g, '')
    text = text.trim()
    
    // JSON'u bul
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('JSON format bulunamadı')
    }
    
    let jsonStr = jsonMatch[0]
    
    // Trailing commas temizle
    jsonStr = jsonStr.replace(/,(\s*[}\]])/g, '$1')
    
    try {
      const data = JSON.parse(jsonStr)
      // LaTeX escape karakterlerini düzelt
      return fixLatexEscapes(data.questions) as GeneratedQuestion[]
    } catch (parseError) {
      // İkinci deneme - daha agresif temizleme
      console.log('İlk parse başarısız, alternatif yöntem deneniyor...')
      
      // Tüm newline'ları space yap
      jsonStr = jsonStr.replace(/\n/g, ' ').replace(/\r/g, '')
      
      // Çoklu boşlukları tek boşluğa indir
      jsonStr = jsonStr.replace(/\s+/g, ' ')
      
      try {
        const data = JSON.parse(jsonStr)
        // LaTeX escape karakterlerini düzelt
        return fixLatexEscapes(data.questions) as GeneratedQuestion[]
      } catch (secondError) {
        console.error('JSON parse hatası, raw text:', text.substring(0, 500))
        throw new Error('AI yanıtı geçerli JSON formatında değil. Lütfen tekrar deneyin.')
      }
    }
  } catch (error) {
    console.error('Soru üretme hatası:', error)
    throw error
  }
}

// Çalışma planı üretici - Türkiye Yüzyılı Maarif Modeli uyumlu
export async function generateStudyPlan(
  studentName: string,
  gradeLevel: string,
  targetExam: string,
  weakSubjects: string[],
  strongSubjects: string[],
  hoursPerDay: number,
  weeks: number
): Promise<string> {
  // 🎨 Varyasyon: Her plan için farklı ton
  const selectedTone = getRandomTone()
  
  // Sınıf seviyesine göre sınav ve müfredat bilgisi
  const gradeNum = parseInt(gradeLevel) || 8
  const examInfo = gradeNum === 8 ? {
    exam: 'LGS',
    subjects: 'Türkçe, Matematik, Fen Bilimleri, Sosyal Bilgiler, Din Kültürü, İngilizce',
    format: '90 dakika, 90 soru (her ders 10-15 soru)',
    tip: 'Paragraf yorumlama ve çıkarım soruları ağırlıklı'
  } : gradeNum >= 11 ? {
    exam: 'YKS (TYT + AYT)',
    subjects: gradeNum === 11 ? 'TYT: Türkçe, Matematik, Fen, Sosyal | AYT hazırlık başlangıcı' : 'TYT + AYT tam kapsamlı hazırlık',
    format: 'TYT: 135 dk, 120 soru | AYT: 180 dk, 160 soru',
    tip: gradeNum === 12 ? 'Türev, integral, modern fizik, organik kimya, Cumhuriyet edebiyatı ODAKLI' : 'Trigonometri, elektrik, kimyasal denge, fizyoloji ODAKLI'
  } : gradeNum >= 9 ? {
    exam: 'TYT Hazırlık',
    subjects: 'Temel Matematik, Türkçe, Fen Bilimleri, Sosyal Bilimler',
    format: 'Lise müfredatı pekiştirme + TYT altyapısı',
    tip: 'Temel kavramları sağlam öğrenme dönemi'
  } : {
    exam: 'Okul Sınavları',
    subjects: `${gradeNum}. sınıf müfredatı`,
    format: 'Yazılı sınavlar ve performans değerlendirme',
    tip: gradeNum <= 4 ? 'Okuma-yazma ve temel matematik becerilerini güçlendirme' : 'Soyut düşünme ve problem çözme becerisi geliştirme'
  }

  const prompt = `SEN TÜRKİYE'NİN EN BAŞARILI EĞİTİM KOÇUSUN. Öğrenci için KİŞİSELLEŞTİRİLMİŞ ve UYGULANABILIR bir çalışma planı hazırla.

═══════════════════════════════════════════════════════
📚 ÖĞRENCİ PROFİLİ
═══════════════════════════════════════════════════════
👤 İsim: ${studentName}
📖 Sınıf: ${gradeLevel}. Sınıf
🎯 Hedef: ${targetExam || examInfo.exam}
📅 Plan Süresi: ${weeks} hafta
⏰ Günlük Çalışma: ${hoursPerDay} saat

📊 SINAVIN YAPISI (${examInfo.exam}):
• Kapsam: ${examInfo.subjects}
• Format: ${examInfo.format}
• İpucu: ${examInfo.tip}

💪 GÜÇLÜ YÖNLER: ${strongSubjects.length > 0 ? strongSubjects.join(', ') : 'Henüz belirlenmemiş - genel değerlendirme yap'}
⚠️ GELİŞTİRİLECEK: ${weakSubjects.length > 0 ? weakSubjects.join(', ') : 'Henüz belirlenmemiş - tüm dersler için plan yap'}

═══════════════════════════════════════════════════════
📋 PLAN FORMATI (Markdown)
═══════════════════════════════════════════════════════

Aşağıdaki başlıklarda DETAYLI plan hazırla:

## 🎯 Genel Strateji
- ${weeks} haftalık ana hedef
- Öncelik sıralaması ve gerekçesi
- Başarı kriterleri

## 📅 Haftalık Program
Her hafta için:
- Odak konuları
- Günlük ders dağılımı
- Hafta sonu değerlendirme

## ⏰ Günlük Rutin
${hoursPerDay} saatlik örnek günlük program:
- Pomodoro tekniği (25 dk çalışma + 5 dk mola)
- Ders geçişleri
- Tekrar zamanları

## 📚 Ders Bazlı Plan
${weakSubjects.length > 0 ? weakSubjects.map(s => `### ${s}\n- Öncelikli konular\n- Kaynak önerileri\n- Haftalık hedef soru sayısı`).join('\n\n') : 'Her ana ders için öncelikli konular ve hedefler'}

## 🧠 Verimli Çalışma İpuçları
- ${gradeNum <= 8 ? 'LGS stratejileri' : 'YKS/TYT stratejileri'}
- Konsantrasyon teknikleri
- Not tutma yöntemleri

## 😊 Motivasyon ve Denge
- Mola ve dinlenme zamanları
- Haftalık ödüller
- Stres yönetimi
- ${gradeNum <= 8 ? 'Aile ile iletişim önerileri' : 'Özerklik ve sorumluluk'}

## ✅ Kontrol Listesi
Her hafta değerlendirilecek maddeler

═══════════════════════════════════════════════════════

Planı Türkçe, ${selectedTone.toLowerCase().replace('.', '')} bir dilde yaz. 
${studentName}'e direkt hitap et.
Gerçekçi ve uygulanabilir hedefler koy.
Motivasyon verici ama abartısız ol.

🎭 FARKLILIK: Her planda farklı açılış cümleleri ve farklı yapı kullan. Kalıplaşmış ifadelerden kaçın.`

  try {
    const result = await geminiModel.generateContent(prompt)
    const response = await result.response
    return response.text()
  } catch (error) {
    console.error('Plan üretme hatası:', error)
    throw error
  }
}

// Öğrenci raporu üretici - Detaylı performans analizi
export async function generateStudentReport(
  studentName: string,
  gradeLevel: string,
  targetExam: string,
  performanceData?: {
    totalQuestions: number
    correctAnswers: number
    subjectPerformance: { subject: string; correct: number; total: number }[]
    recentTrend: 'improving' | 'stable' | 'declining'
  },
  taskData?: {
    totalTasks: number
    completedTasks: number
    pendingTasks: number
    averageScore: number
    recentTasks: {
      title: string
      status: string
      score: number | null
      type: string
      completed_at: string | null
    }[]
  }
): Promise<string> {
  // 🎨 Varyasyon: Her rapor için farklı ton
  const selectedTone = getRandomTone()
  
  // Sınıf bilgisi çıkarımı
  const gradeNum = parseInt(gradeLevel) || 8
  const examContext = gradeNum === 8 ? 'LGS' : gradeNum >= 11 ? 'YKS (TYT/AYT)' : gradeNum >= 9 ? 'TYT Hazırlık' : 'Okul Sınavları'
  
  // Performans değerlendirme eşikleri
  const getPerformanceLevel = (rate: number): string => {
    if (rate >= 90) return '🌟 Mükemmel'
    if (rate >= 75) return '✅ İyi'
    if (rate >= 60) return '📊 Orta'
    if (rate >= 40) return '⚠️ Geliştirilmeli'
    return '🚨 Kritik'
  }
  
  // Soru performansı bölümü
  let questionSection = ''
  let overallRate = 0
  if (performanceData && performanceData.totalQuestions > 0) {
    overallRate = (performanceData.correctAnswers / performanceData.totalQuestions) * 100
    questionSection = `
═══════════════════════════════════════════════════════
📊 SORU ÇÖZME PERFORMANSI
═══════════════════════════════════════════════════════
• Toplam Çözülen: ${performanceData.totalQuestions} soru
• Doğru Cevap: ${performanceData.correctAnswers}
• Başarı Oranı: ${overallRate.toFixed(1)}% ${getPerformanceLevel(overallRate)}
• Trend: ${performanceData.recentTrend === 'improving' ? '📈 Yükseliyor' : performanceData.recentTrend === 'stable' ? '➡️ Sabit' : '📉 Düşüyor'}

📚 DERS BAZLI ANALİZ:
${performanceData.subjectPerformance.map(s => {
  const rate = (s.correct/s.total)*100
  return `│ ${s.subject}: ${s.correct}/${s.total} (${rate.toFixed(0)}%) ${getPerformanceLevel(rate)}`
}).join('\n')}`
  }

  // Görev performansı bölümü
  let taskSection = ''
  if (taskData && taskData.totalTasks > 0) {
    const completionRate = (taskData.completedTasks / taskData.totalTasks) * 100
    const statusText: Record<string, string> = {
      'completed': '✅ Tamamlandı',
      'submitted': '📤 Teslim Edildi',
      'in_progress': '🔄 Devam Ediyor',
      'pending': '⏳ Bekliyor'
    }
    taskSection = `
═══════════════════════════════════════════════════════
📋 GÖREV PERFORMANSI
═══════════════════════════════════════════════════════
• Toplam Görev: ${taskData.totalTasks}
• Tamamlanan: ${taskData.completedTasks} (${completionRate.toFixed(0)}%)
• Bekleyen: ${taskData.pendingTasks}
• Ortalama Puan: ${taskData.averageScore > 0 ? taskData.averageScore + '/100' : 'Henüz puanlanmamış'}

📝 SON GÖREVLER:
${taskData.recentTasks.map(t => `│ "${t.title}" → ${statusText[t.status] || t.status}${t.score !== null ? ` • Puan: ${t.score}` : ''}`).join('\n')}`
  }

  const prompt = `SEN DENEYİMLİ BİR EĞİTİM KOÇU VE DANIŞMANISIN. ${studentName} için profesyonel bir performans raporu hazırla.

═══════════════════════════════════════════════════════
👤 ÖĞRENCİ BİLGİLERİ
═══════════════════════════════════════════════════════
• İsim: ${studentName}
• Sınıf: ${gradeLevel}. Sınıf
• Hedef: ${targetExam || examContext}
${questionSection}
${taskSection}

═══════════════════════════════════════════════════════
📄 RAPOR FORMATI (Markdown)
═══════════════════════════════════════════════════════

Aşağıdaki bölümleri DETAYLI hazırla:

## 🎯 Genel Değerlendirme
${studentName}'in genel durumu hakkında 3-4 cümlelik özet.
${overallRate > 0 ? `${overallRate.toFixed(0)}% başarı oranını ${examContext} bağlamında değerlendir.` : 'Mevcut verileri değerlendir.'}

## 💪 Güçlü Yönler
- Başarılı olduğu dersler/konular
- Pozitif çalışma alışkanlıkları
- Dikkat çeken gelişim alanları

## ⚠️ Geliştirilmesi Gereken Alanlar
- Zayıf dersler ve konular
- Eksik kalan beceriler
- Öncelikli çalışma önerileri

## 📊 Disiplin ve Düzenlilik
- Görev tamamlama analizi
- Zaman yönetimi değerlendirmesi
- Süreklilik ve tutarlılık

## 🚀 Aksiyon Planı
${gradeNum === 8 ? 'LGS\'ye' : gradeNum >= 11 ? 'YKS\'ye' : 'Sınavlara'} yönelik somut adımlar:
1. Bu hafta yapılması gerekenler
2. Bu ay hedefler
3. Kritik konular

## 📱 Veli İçin Özet
2-3 cümlelik, velinin hızlıca okuyabileceği özet.
Pozitif bir dil kullan ama gerçekçi ol.

═══════════════════════════════════════════════════════

Raporu Türkçe, ${selectedTone.toLowerCase().replace('.', '')} bir dilde yaz.
Emoji kullan ama abartma.
${studentName}'e güven ver ama gerçekçi ol.
Somut ve uygulanabilir öneriler sun.

🎭 FARKLILIK: Her raporda farklı açılış ve kapanış cümleleri kullan. Kalıplaşmış ifadelerden kaçın.`

  try {
    const result = await geminiModel.generateContent(prompt)
    const response = await result.response
    return response.text()
  } catch (error) {
    console.error('Rapor üretme hatası:', error)
    throw error
  }
}

// AI önerisi üretici - Kişiselleştirilmiş kısa öneriler
export async function generateAIRecommendation(
  studentName: string,
  weakTopics: string[],
  recentMistakes: string[],
  grade?: number,
  subject?: string
): Promise<string> {
  // 🎨 Varyasyon: Her öneri için farklı ton
  const selectedTone = getRandomTone()
  
  const gradeContext = grade 
    ? grade === 8 ? 'LGS hazırlığında' : grade >= 11 ? 'YKS hazırlığında' : `${grade}. sınıfta`
    : ''
  
  const subjectTip = subject ? {
    'Matematik': 'Formülleri ezberleme, anla. Günde en az 10 soru çöz.',
    'Türkçe': 'Her gün 2-3 paragraf oku ve soru çöz.',
    'Fen Bilimleri': 'Deneyleri görselleştir, grafikleri analiz et.',
    'Fizik': 'Formüllerin nereden geldiğini anla, birim analizini ihmal etme.',
    'Kimya': 'Periyodik tabloyu iyi öğren, mol hesaplarına hakim ol.',
    'Biyoloji': 'Şemaları çiz, sistemleri birbiriyle ilişkilendir.',
    'Tarih': 'Kronolojik sıralamayı kafanda canlandır.',
    'Coğrafya': 'Haritalarla çalış, görsel hafıza kullan.',
    'İngilizce': 'Her gün 10 yeni kelime, 1 paragraf okuma.',
  }[subject] || '' : ''

  const prompt = `${studentName} için KİŞİSELLEŞTİRİLMİŞ, KISA ve ETKİLİ çalışma önerisi yaz.

📊 VERİLER:
• Öğrenci: ${studentName} ${gradeContext}
• Zayıf Konular: ${weakTopics.length > 0 ? weakTopics.join(', ') : 'Genel çalışma önerisi'}
• Son Hatalar: ${recentMistakes.length > 0 ? recentMistakes.join(', ') : 'Belirtilmemiş'}
${subjectTip ? `• Ders İpucu: ${subjectTip}` : ''}

📝 KURALLAR:
• Maksimum 3-4 cümle
• ${studentName}'e direkt hitap et (Senli)
• Somut ve uygulanabilir öneri
• ${selectedTone}
• Emoji kullanabilirsin (1-2 tane)

🎭 ÇEŞİTLİLİK:
• Her öneride farklı açılış cümlesi kullan
• Bazen doğrudan konuya gir, bazen motive edici başla
• Kalıplaşmış ifadelerden kaçın

Örnek format:
"${studentName}, [konu] konusunda zorlanıyorsun. [Somut öneri]. [Motive edici kapanış]."

ŞİMDİ FARKLI VE KİŞİSEL ÖNERİNİ YAZ:`

  try {
    const result = await geminiModel.generateContent(prompt)
    const response = await result.response
    return response.text()
  } catch (error) {
    console.error('Öneri üretme hatası:', error)
    throw error
  }
}

// =====================================================
// PREMIUM MÜFREDAT BAZLI SORU ÜRETİCİ
// MEB Türkiye Yüzyılı Maarif Modeli (1-12. Sınıf)
// TYT/AYT/LGS Sınavlarına Tam Uyumlu
// =====================================================

// 🆕 YENİ NESİL SORU: Görsel türüne göre talimatlar
const getVisualInstructions = (visualType: VisualType, subject: string): string => {
  if (visualType === 'none') {
    return `
🚫 MEDYA KISITLAMASI:
• Tüm sorular SADECE METİN tabanlı olmalı
• Görsel, tablo, grafik, diyagram KULLANMA
• Görsel gerektiren durumları metin açıklaması yap`
  }

  const commonRules = `
🚨 GÖRSEL ÜRETİM KURALLARI (KESİNLİKLE UY):
1. ❌ YASAK FORMATLAR (KESİNLİKLE KULLANMA):
   - Mermaid.js: "graph TD", "flowchart", "pie", "xychart" → YASAK!
   - LaTeX: "\\begin{tabular}", "\\hline", "$$", "\\frac" → YASAK!
   - Markdown: "| --- |" tablo formatı → YASAK!
   
2. ✅ SADECE BU FORMATLARI KULLAN:
   - HTML Tablo: <table style="..."><thead>...</thead><tbody>...</tbody></table>
   - SVG Grafik: <svg viewBox="..." xmlns="..."><rect/><line/><text/></svg>
   
3. Inline SVG veya Styled HTML Kullan: Tüm görselleri saf SVG veya inline style HTML ile oluştur.
4. PDF Uyumluluğu: Renkleri net (High Contrast) seç. Karmaşık gölgelerden kaçın.
5. Kod Temizliği: "visual_content" alanına SADECE kodu yaz. Başına veya sonuna açıklama ekleme.
6. Matematik için Unicode: SVG/HTML içinde LaTeX yerine Unicode (√, ², π, →, x², a/b) kullan.
`

  const tableInstructions = `
📊 TABLOLAR (PROFESYONEL RENKLİ STİL):
- <table style="width:100%; border-collapse:collapse; font-family:sans-serif; margin:10px 0; border-radius:8px; overflow:hidden; border:1px solid #ddd;"> formatı kullan.
- Başlık satırı (<thead>): <tr style="background:linear-gradient(135deg,#667eea,#764ba2); color:white; font-weight:bold;">...</tr>
- Başlık hücreleri (<th>): <th style="border:1px solid #ddd; padding:12px 16px; text-align:left;">...</th>
- Veri hücreleri (<td>): <td style="border:1px solid #ddd; padding:10px 16px;">...</td>
- Satır renkleri: <tbody> içinde <tr style="background:#f8fafc;"> ve <tr style="background:#ffffff;"> (alternating) kullan.
- ÖZELLİKLE "KARIŞIK" (MIXED) MODDA BU RENKLİ VE GRADYANLI STİLDEN ASLA TAVİZ VERME.
`

  const svgInstructions = `
📈 GRAFİK / DİYAGRAM / AKIŞ ŞEMASI:
- <svg viewBox="0 0 400 200" xmlns="http://www.w3.org/2000/svg"> kullanarak vektörel çizim yap.
- Eksenler, kutular ve çizgiler için <rect>, <line>, <circle>, <polyline> kullan.
- Metinleri <text text-anchor="middle" font-family="sans-serif" font-size="12"> ile SVG içine yerleştir.
- Renkli gradyanlar (<linearGradient>) ve profesyonel renkler kullan.
`

  const pieInstructions = `
🥧 PASTA GRAFİĞİ:
- SVG içinde <circle> ve "stroke-dasharray" kullanarak dilimleri oluştur.
- Her dilim için farklı canlı renkler kullan.
- Yanına mutlaka renkli göstergeler (Legend) ekle.
`

  if (visualType === 'table') return tableInstructions + commonRules;
  if (visualType === 'chart' || visualType === 'flowchart' || visualType === 'diagram') return svgInstructions + commonRules;
  if (visualType === 'pie') return pieInstructions + commonRules;

  // Mixed (Karışık) mod - Tüm detayları ver
  return `
🎨 KARIŞIK MOD (YENİ NESİL):
Konuya en uygun görsel türünü seç ve aşağıdakilerden birini üret:

${tableInstructions}
${svgInstructions}
${pieInstructions}

${commonRules}
⚠️ visual_content alanı asla boş bırakılamaz ve seçtiğin türün tüm stil kurallarına (renkli gradyanlar, borderlar, paddingler) harfiyen uymalıdır.
`
}

// Ders bazlı özel yönergeler
const getSubjectGuidelines = (subject: string, grade: number): string => {
  const guidelines: Record<string, string> = {
    'Matematik': `
   • Günlük hayat problemleri kullan (alışveriş, zaman, mesafe)
   • ${grade <= 4 ? 'Görsel ve somut örnekler ekle' : grade <= 8 ? 'Adım adım çözüm gerektiren problemler' : 'Analitik düşünme ve modelleme soruları'}
   • İşlem hataları yapan şıklar ekle
   • ${grade >= 11 ? 'Türev/integral için grafik yorumlama soruları' : grade >= 9 ? 'Fonksiyon ve denklem çözümü' : 'Temel aritmetik ve geometri'}`,
    
    'Türkçe': `
   • Okuma anlama ve metin çözümleme ağırlıklı
   • ${grade <= 4 ? 'Kısa ve basit metinler' : 'Paragraf analizi ve çıkarım soruları'}
   • Dil bilgisi kuralları bağlam içinde sorsun
   • Anlam ilişkileri (eş, zıt, yakın anlam) soruları`,
    
    'Türk Dili ve Edebiyatı': `
   • Edebi dönem ve akım karşılaştırmaları
   • Metin şerhi ve edebi sanat tespiti
   • ${grade >= 11 ? 'Cumhuriyet dönemi edebiyatı ağırlıklı' : 'Divan ve Halk edebiyatı temelleri'}
   • Yazar-eser-dönem eşleştirmeleri`,
    
    'Fen Bilimleri': `
   • Deney ve gözlem sonuçlarını yorumlama
   • ${grade <= 6 ? 'Günlük hayattan örnekler' : 'Grafik ve tablo okuma soruları'}
   • Neden-sonuç ilişkisi kurma
   • Bilimsel süreç becerileri`,
    
    'Fizik': `
   • ${grade >= 11 ? 'Modern fizik ve dalga mekaniği' : 'Kuvvet, hareket ve energy temelleri'}
   • Formül uygulaması ve birim dönüşümleri
   • Grafik yorumlama (konum-zaman, hız-zaman)
   • Deneysel verileri analiz etme`,
    
    'Kimya': `
   • ${grade >= 11 ? 'Termodinamik, denge ve organik kimya' : 'Atom yapısı ve periyodik tablo'}
   • Mol hesaplamaları ve denkleştirme
   • Günlük hayat uygulamaları (pH, korozyon)
   • Lewis yapıları ve VSEPR`,
    
    'Biyoloji': `
   • ${grade >= 11 ? 'İnsan fizyolojisi ve genetik' : 'Hücre yapısı ve canlı sistemleri'}
   • Şema ve diyagram yorumlama
   • Deney sonuçlarını analiz etme
   • Ekoloji ve çevre bilinci`,
    
    'Tarih': `
   • Neden-sonuç ilişkileri ve kronolojik sıralama
   • ${grade >= 11 ? 'Osmanlı modernleşmesi ve Cumhuriyet' : grade === 8 ? 'İnkılap Tarihi' : 'Türk-İslam tarihi'}
   • Harita ve görsel kaynak yorumlama
   • Karşılaştırmalı tarih analizi`,
    
    'Coğrafya': `
   • Harita okuma ve yorumlama
   • ${grade >= 10 ? 'Türkiye ekonomisi ve jeopolitik' : 'Fiziki coğrafya temelleri'}
   • İklim ve bitki örtüsü ilişkisi
   • Nüfus ve yerleşme özellikleri`,
    
    'İngilizce': `
   • Reading comprehension ve vocabulary
   • ${grade >= 9 ? 'B1-B2 seviyesi, akademik dil' : 'A1-A2 seviyesi, günlük iletişim'}
   • Grammar in context (bağlam içinde dilbilgisi)
   • Dialogue completion ve rephrasing`,
    
    'Din Kültürü ve Ahlak Bilgisi': `
   • ${grade >= 11 ? 'Dünya dinleri ve karşılaştırmalı din' : 'İslam inanç esasları'}
   • Ayet ve hadis yorumlama
   • Ahlaki değerler ve güncel meseleler
   • İslam düşünce tarihi`,
    
    'Sosyal Bilgiler': `
   • Vatandaşlık bilinci ve demokratik değerler
   • Harita ve grafik okuma
   • Güncel olaylarla ilişkilendirme
   • Kültürel miras ve tarih bilinci`,
    
    'Hayat Bilgisi': `
   • Günlük yaşam becerileri
   • Görsel ve somut örnekler
   • Basit ve anlaşılır dil
   • Çocuğun yakın çevresinden örnekler`,
    
    'Felsefe': `
   • Felsefi kavramları ayırt etme
   • Felsefe tarihi ve düşünürler
   • Argüman analizi ve mantık
   • Farklı görüşleri karşılaştırma`,
    
    'Mantık': `
   • Önerme ve çıkarım analizi
   • Sembolik mantık işlemleri
   • Doğruluk tablosu oluşturma
   • Mantık ilkeleri uygulaması`
  }
  
  return guidelines[subject] || `
   • Kazanım odaklı, net sorular
   • ${grade}. sınıf seviyesine uygun dil
   • Gerçek hayatla ilişkilendirme`
}

// 🌍 QUESTLY GLOBAL: İngilizce soru prompt'u oluştur
function generateEnglishPrompt(
  grade: number,
  subject: string,
  topic: string,
  learningOutcome: string,
  difficulty: Difficulty,
  count: number,
  optionCount: number,
  isHighSchool: boolean,
  bloomPriority: Record<Difficulty, string[]>
): string {
  // Zorluk açıklaması (İngilizce)
  const difficultyDetailsEN: Record<Difficulty, string> = {
    easy: 'Basic level - recall, simple application',
    medium: 'Intermediate level - comprehension, two-step problems',
    hard: 'Advanced level - analysis, multi-step reasoning',
    legendary: 'Expert level - synthesis, creative thinking'
  }
  
  // Bloom Taksonomisi (İngilizce)
  const bloomEN: Record<string, string> = {
    bilgi: 'knowledge',
    kavrama: 'comprehension',
    uygulama: 'application',
    analiz: 'analysis',
    sentez: 'synthesis',
    değerlendirme: 'evaluation'
  }
  
  // Yaş grubu belirleme
  const ageGroup = grade <= 6 ? '6-12 years old (elementary)' 
    : grade <= 8 ? '12-14 years old (middle school)' 
    : grade <= 10 ? '14-16 years old (high school)' 
    : '16-18 years old (advanced high school)'
    
  // Ders İngilizce karşılığı
  const subjectEN: Record<string, string> = {
    'Matematik': 'Mathematics',
    'Fizik': 'Physics',
    'Kimya': 'Chemistry',
    'Biyoloji': 'Biology',
    'Fen Bilimleri': 'Science',
    'İngilizce': 'English',
    'Coğrafya': 'Geography',
    'Tarih': 'History',
    'Bilişim': 'Computer Science'
  }
  
  const subjectName = subjectEN[subject] || subject

  return `YOU ARE A WORLD-CLASS EDUCATION QUESTION WRITER for Questly - a global learning platform.
Create ORIGINAL, high-quality multiple choice questions in ENGLISH.

════════════════════════════════════════════════════════════
🎯 TASK: Generate ${count} ${subjectName.toUpperCase()} questions
════════════════════════════════════════════════════════════

📚 QUESTION PARAMETERS:
┌─────────────────────────────────────────────────────────┐
│ Grade Level: Grade ${grade} (${ageGroup})
│ Subject: ${subjectName}
│ Topic: ${topic}
│ Learning Outcome: "${learningOutcome}"
│ Difficulty: ${difficulty.toUpperCase()} - ${difficultyDetailsEN[difficulty]}
│ Number of Options: ${optionCount}
│ Questions to Generate: ${count}
└─────────────────────────────────────────────────────────┘

🌍 GLOBAL EDUCATION STANDARDS:
• Questions must be INTERNATIONALLY RELEVANT (no country-specific curriculum)
• Use METRIC SYSTEM for measurements (meters, kilograms, liters)
• Use UNIVERSAL EXAMPLES (global cities, international contexts)
• Avoid cultural biases or region-specific references
• Language should be clear, grammatically correct English

🎓 BLOOM'S TAXONOMY (for ${difficulty}):
   Prioritize: ${bloomPriority[difficulty].map(b => bloomEN[b] || b).join(', ')}
   
   • knowledge: Recognizing, listing, recalling
   • comprehension: Explaining, giving examples, interpreting
   • application: Calculating, problem-solving, using
   • analysis: Comparing, relating, distinguishing
   • synthesis: Designing, planning, creating
   • evaluation: Critiquing, judging, defending

⚡ QUESTION WRITING RULES:

1. QUESTION STEM:
   ✓ Clear, unambiguous, single-meaning
   ✓ Age-appropriate vocabulary for Grade ${grade}
   ✓ Directly tests the learning outcome
   ✓ No unnecessary information
   ${grade <= 6 ? '✓ Short, simple sentences' : grade >= 9 ? '✓ Academic language acceptable' : '✓ Medium-length, clear statements'}

2. OPTIONS (${optionCount} total):
   ✓ All options plausible and logical
   ✓ Wrong answers reflect common student mistakes
   ✓ Similar length across options
   ✓ "None of the above" or "All of the above" FORBIDDEN
   ✓ Correct answer should be RANDOMLY distributed (A,B,C,D${isHighSchool ? ',E' : ''})

3. EXPLANATION:
   ✓ Justify why the answer is correct
   ✓ Explain why other options are wrong
   ✓ Educational and encouraging tone
   ✓ ${grade <= 6 ? 'Simple language' : 'Academic but clear'}

📐 MATH/SCIENCE FORMATTING (LaTeX):
   • Fraction: $$\\\\frac{a}{b}$$
   • Root: $$\\\\sqrt{x}$$, $$\\\\sqrt[3]{x}$$
   • Exponent: $$x^{2}$$, $$e^{x}$$
   • Subscript: $$x_{1}$$, $$a_{n}$$
   • Operations: $$\\\\times$$, $$\\\\div$$, $$\\\\pm$$
   • Special: $$\\\\pi$$, $$\\\\infty$$, $$\\\\sum$$, $$\\\\int$$
   • Inequality: $$\\\\leq$$, $$\\\\geq$$, $$\\\\neq$$

════════════════════════════════════════════════════════════
📤 OUTPUT - JSON ONLY (no other text allowed)
════════════════════════════════════════════════════════════
{"questions":[{"question_text":"Question text here","options":{"A":"Option A","B":"Option B","C":"Option C","D":"Option D"${isHighSchool ? ',"E":"Option E"' : ''}},"correct_answer":"B","explanation":"Explanation here","difficulty":"${difficulty}","bloom_level":"${bloomPriority[difficulty][0]}"}]}

⛔ FORBIDDEN:
• Any text outside JSON
• Trailing commas
• Single backslash (use double \\\\ for LaTeX)
• "None of the above" or "All of the above" options
• Same letter always being correct

🚫 MEDIA RESTRICTION (IMPORTANT):
• DO NOT create questions requiring images, tables, graphs, charts
• DO NOT use "Look at the diagram...", "According to the table...", "The graph shows..."
• ALL questions must be TEXT-ONLY
• For visual concepts, describe them in words

✅ REQUIRED:
• correct_answer: ${isHighSchool ? 'A, B, C, D, or E' : 'A, B, C, or D'}
• bloom_level: knowledge, comprehension, application, analysis, synthesis, evaluation
• ALL text in proper English

NOW GENERATE ${count} EXCELLENT ${subjectName.toUpperCase()} QUESTIONS:`
}

// Sınav formatı ve sınıf özelliklerini belirle
const getExamContext = (grade: number): { examType: string; format: string; tips: string } => {
  if (grade <= 4) {
    return {
      examType: 'İlkokul Değerlendirme',
      format: '4 şıklı (A-D), görsel destekli olabilir',
      tips: `
   • SOMUT düşünme döneminde, soyut kavramlardan kaçın
   • Kısa cümleler ve basit kelimeler kullan
   • Görsel öğeler açıklamalarda kullanılabilir
   • Oyun ve eğlence öğeleri eklenebilir
   • Pozitif ve cesaretlendirici dil`
    }
  } else if (grade <= 7) {
    return {
      examType: 'Ortaokul Kazanım Değerlendirme',
      format: '4 şıklı (A-D), LGS formatına hazırlık',
      tips: `
   • Soyut düşünmeye geçiş dönemi
   • Çıkarım ve yorumlama becerileri
   • Grafik ve tablo okuma başlangıcı
   • Çok adımlı problemlere giriş
   • Disiplinler arası bağlantılar`
    }
  } else if (grade === 8) {
    return {
      examType: 'LGS (Liselere Geçiş Sınavı)',
      format: '4 şıklı (A-D), MEB merkezi sınav formatı',
      tips: `
   • LGS tarzı paragraf ve yorum soruları
   • 90 dakikada 90 soru mantığı (hızlı çözüm)
   • Her soru aynı puan ağırlığında
   • Çeldirici şıklar MEB standartlarında
   • Sözel ve sayısal mantık dengesi`
    }
  } else if (grade <= 10) {
    return {
      examType: 'TYT Hazırlık (Temel Yeterlilik)',
      format: '5 şıklı (A-E), ÖSYM TYT formatı',
      tips: `
   • TYT temel kavram ve uygulama soruları
   • Geniş müfredat, dar derinlik
   • Hız ve doğruluk dengesi
   • Tüm öğrenciler için ortak sorular
   • Temel okur-yazarlık ve matematik`
    }
  } else {
    return {
      examType: 'YKS (TYT + AYT)',
      format: '5 şıklı (A-E), ÖSYM AYT formatı',
      tips: `
   • AYT ileri düzey, alan spesifik sorular
   • Analiz, sentez ve değerlendirme ağırlıklı
   • Uzun ve karmaşık soru kökleri olabilir
   • Grafik, tablo ve veri analizi
   • Üniversite düzeyi akademik dil
   • ${grade === 12 ? 'Türev, integral, modern fizik, organik kimya AĞIRLIKLI' : '11. sınıf konuları pekiştirme'}`
    }
  }
}

// =====================================================
// TYT SINAV FORMATI - ÖSYM Tarzı Prompt Üretici
// =====================================================
function getTYTExamContext(subject: string): { examType: string; format: string; tips: string } {
  const subjectTips: Record<string, string> = {
    'Türkçe': `
   📝 ÖSYM TYT TÜRKÇE FORMATI (40 soru):
   • Paragraf ağırlıklı: yaklaşık 25-30 soru paragraf temelli
   • UZUN METİNLER: 200-400 kelimelik paragraflar oluştur
   • Anlam bilgisi: sözcükte, cümlede, paragrafta anlam
   • Dil bilgisi: ses, yapı, tür, cümle ögeleri
   • Anlatım bozukluğu: son 2-3 soru genelde
   • Soru kökünde "Aşağıdaki parçaya/paragrafa göre..." ile başlayan uzun okuma parçaları
   • Çeldirici şıklar anlam yakınlığı ile oluşturulmalı
   • PARAGRAF soruları için gerçek bir paragraf YAZ, sadece soru sorma`,

    'Temel Matematik': `
   🔢 ÖSYM TYT MATEMATİK FORMATI (30 soru):
   • Günlük hayat senaryoları ile problem kurulumu
   • Görsel öğeler: tablo, grafik, şema soruda yer alabilir
   • İşlem ağırlıklı DEĞİL, YORUM ağırlıklı
   • Sorular kısa, şık ve net olmalı
   • Problemler: yaş, iş-işçi, karışım, hareket, yüzde, oran
   • Temel kavram: küme, fonksiyon, polinom, olasılık
   • ÖSYM tarzı: "Buna göre..." ifadesi sıkça kullanılır`,

    'Geometri': `
   📐 ÖSYM TYT GEOMETRİ FORMATI (10 soru):
   • Şekil/çizim İÇEREN sorular (soru kökünde "Şekilde..." ifadesi)
   • Üçgen, dörtgen, çember ağırlıklı
   • Analitik geometri: 1-2 soru
   • Katı cisimler: 1-2 soru
   • Görsel düşünme gerektiren, yaratıcı problemler
   • Şekil açıklaması metinde verilmeli`,

    'Fizik': `
   ⚡ ÖSYM TYT FİZİK FORMATI (7 soru):
   • Deney düzeneğinden soru (tablo/şema ile)
   • Günlük hayat örnekleri (koltuk itme, yürüyüş, market)
   • Grafik yorumlama (hız-zaman, kuvvet-uzama)
   • Kavramsal ağırlıklı, hesaplama az
   • I, II, III formatında yargı soruları sıkça kullanılır`,

    'Kimya': `
   🧪 ÖSYM TYT KİMYA FORMATI (7 soru):
   • Periyodik tablo ve atom yapısı
   • Deney sonucu yorumlama
   • Tablo okuma ve karşılaştırma
   • Kimyasal formüller ve denklemler
   • Günlük yaşam (asit-baz, çözeltiler)`,

    'Biyoloji': `
   🧬 ÖSYM TYT BİYOLOJİ FORMATI (6 soru):
   • Şema/diyagram yorumlama (hücre, organ sistemleri)
   • Deney sonuçları analizi
   • İnsan fizyolojisi ağırlıklı
   • Bilimsel süreç becerileri
   • I, II, III yargı formatı sıkça kullanılır`,

    'Tarih': `
   📜 ÖSYM TYT TARİH FORMATI (5 soru):
   • Neden-sonuç ilişkisi, kronoloji
   • Kaynak metin analizi
   • Karşılaştırma (Osmanlı-Avrupa)
   • Harita/görsel kaynak kullanımı`,

    'Coğrafya': `
   🌍 ÖSYM TYT COĞRAFYA FORMATI (5 soru):
   • Harita okuma ve yorumlama
   • Tablo/grafik analizi
   • İklim-bitki ilişkisi
   • Türkiye coğrafyası ağırlıklı`,

    'Felsefe': `
   💭 ÖSYM TYT FELSEFE FORMATI (5 soru):
   • Kavram ayrımı
   • Düşünür-görüş eşleştirme
   • Argüman analizi
   • Felsefi metin yorumlama`,

    'Din Kültürü ve Ahlak Bilgisi': `
   🕌 ÖSYM TYT DİN KÜLTÜRÜ FORMATI (5 soru):
   • Ayet/hadis yorumlama
   • Temel kavramlar
   • Ahlaki değerler
   • Karşılaştırma (dinler arası)`,
  }

  // subject_name yerine subject_code da gelebilir, eslestirelim
  const normalizedSubject = subject.includes('Türkçe') || subject === 'turkce' ? 'Türkçe'
    : subject.includes('Matematik') || subject === 'matematik' ? 'Temel Matematik'
    : subject.includes('Geometri') || subject === 'geometri' ? 'Geometri'
    : subject.includes('Fizik') || subject === 'fizik' ? 'Fizik'
    : subject.includes('Kimya') || subject === 'kimya' ? 'Kimya'
    : subject.includes('Biyoloji') || subject === 'biyoloji' ? 'Biyoloji'
    : subject.includes('Tarih') || subject === 'tarih' ? 'Tarih'
    : subject.includes('Coğrafya') || subject.includes('Cografya') || subject === 'cografya' ? 'Coğrafya'
    : subject.includes('Felsefe') || subject === 'felsefe' ? 'Felsefe'
    : subject.includes('Din') || subject === 'din_kulturu' ? 'Din Kültürü ve Ahlak Bilgisi'
    : subject

  return {
    examType: 'TYT (ÖSYM Temel Yeterlilik Testi)',
    format: '5 şıklı (A-E), 4 yanlış 1 doğru götürür, 125 soru 165 dakika',
    tips: subjectTips[normalizedSubject] || `
   📋 ÖSYM TYT GENEL FORMAT:
   • Analiz ve yorum ağırlıklı
   • 5 şık (A-E)
   • Kavramsal sorular
   • Günlük hayat bağlamı`
  }
}

// =====================================================
// AYT (Alan Yeterlilik Testi) - ÖSYM Sınav Bağlamı
// =====================================================
function getAYTExamContext(subject: string): { examType: string; format: string; tips: string } {
  const subjectTips: Record<string, string> = {
    'Edebiyat': `
   📚 ÖSYM AYT EDEBİYAT FORMATI (24 soru):
   • Edebi akımlar ve dönem analizi (Divan, Tanzimat, Servet-i Fünun, Milli Edebiyat, Cumhuriyet)
   • Şair-eser eşleştirme, edebi kişilik tanıma
   • Metin tahlili: Şiir çözümleme, düzyazı analizi
   • Uzun paragraflardan çıkarım yapma
   • Edebi sanatlar, vezin, kafiye soruları
   • Roman/hikaye/tiyatro türü karşılaştırma
   • Anlam bilgisi ve söz sanatları derinlemesine`,

    'Matematik': `
   🔢 ÖSYM AYT MATEMATİK FORMATI (29 soru):
   • Çok adımlı karmaşık problemler
   • Türev uygulamaları: maksimum-minimum, eğim, teğet
   • İntegral: alan, hacim hesabı, belirli-belirsiz integral
   • Limit ve süreklilik: epsilon-delta yaklaşımı
   • Fonksiyonlar: bileşke, ters fonksiyon, grafik analizi
   • Diziler ve seriler: yakınsama, genel terim
   • Logaritma ve üstel fonksiyonlar
   • Olasılık ve kombinatorik: koşullu olasılık, binom dağılımı
   • Matris ve determinant`,

    'Geometri': `
   📐 ÖSYM AYT GEOMETRİ FORMATI (11 soru):
   • Analitik geometri ağırlıklı: doğru denklemleri, çember denklemi
   • Konik kesitler: parabol, elips, hiperbol
   • Uzay geometrisi: prizma, piramit, küre, koni
   • Trigonometri: trigonometrik fonksiyonlar, ters trigonometrik
   • Özel üçgenler ve çember özellikleri
   • Dönüşüm geometrisi
   • Koordinat düzleminde alan ve uzunluk hesabı`,

    'Fizik': `
   ⚡ ÖSYM AYT FİZİK FORMATI (14 soru):
   • Deney düzeneği tasarlama ve yorumlama
   • Grafik analizi: ivme-zaman, kuvvet-uzama, akım-gerilim
   • Elektrik ve manyetizma: devre analizi, manyetik alan
   • Dalga mekaniği: kırınım, girişim, rezonans
   • Modern fizik: fotoelektrik, atom modelleri, radyoaktivite
   • Newton yasaları ileri uygulamalar
   • Enerji korunumu ve momentum
   • Formül türetme ve birim analizi`,

    'Kimya': `
   🧪 ÖSYM AYT KİMYA FORMATI (13 soru):
   • Reaksiyon kinetiği: hız ifadesi, aktivasyon enerjisi
   • Kimyasal denge: Kp, Kc hesabı, Le Chatelier
   • Organik kimya: mekanizmalar, fonksiyonel gruplar, izomeri
   • Elektrokimya: pil, elektroliz, Nernst denklemi
   • Asit-baz dengesi: tampon çözeltiler, pH hesabı
   • Termokimya: Hess yasası, entalpi değişimi
   • Çözünürlük dengesi: Kçç hesabı
   • Atom teorisi ve periyodik özellikler`,

    'Biyoloji': `
   🧬 ÖSYM AYT BİYOLOJİ FORMATI (13 soru):
   • Genetik problem çözme: çaprazlama, soy ağacı, bağlı genler
   • Biyoteknoloji: DNA teknolojisi, klonlama, GDO
   • Ekoloji: besin piramidi, enerji akışı, popülasyon dinamiği
   • Bitki fizyolojisi: fotosentez detayları, su taşınımı
   • Sinir sistemi: sinaps, nörotransmitter, refleks yayı
   • Endokrin sistem: hormon mekanizmaları, geri bildirim
   • Hücre bölünmesi: mitoz/mayoz karşılaştırma
   • Deney yorumu ve bilimsel süreç`,

    'Tarih': `
   📜 ÖSYM AYT TARİH FORMATI (21 soru):
   • Tarih-1 (10 soru): İslamiyet öncesi, İlk Müslüman Türk devletleri, Osmanlı kuruluş-yükselme
   • Tarih-2 (11 soru): Osmanlı gerileme-dağılma, I. Dünya Savaşı, Milli Mücadele, Çağdaş Türkiye
   • Kaynak analizi: belge, ferman, antlaşma metni yorumlama
   • Dönem karşılaştırma: Osmanlı-Avrupa, reform hareketleri
   • Neden-sonuç ilişkisi ve kronolojik sıralama
   • Harita ve görsel kaynak kullanımı`,

    'Coğrafya': `
   🌍 ÖSYM AYT COĞRAFYA FORMATI (17 soru):
   • Coğrafya-1 (6 soru): Fiziki coğrafya, ekosistem, iklim
   • Coğrafya-2 (11 soru): Beşeri coğrafya, Türkiye ekonomisi, nüfus
   • Harita analizi ve yorumlama
   • Doğal afetler ve çevre sorunları
   • Türkiye'nin bölgesel özellikleri
   • Ekonomik coğrafya: tarım, sanayi, ulaşım
   • Tablo ve grafik yorumlama`,

    'Felsefe Grubu': `
   💭 ÖSYM AYT FELSEFE GRUBU FORMATI (12 soru):
   • Felsefe: Bilgi felsefesi, varlık felsefesi, ahlak felsefesi
   • Mantık: Önermeler mantığı, akıl yürütme, kıyas
   • Psikoloji: Gelişim, öğrenme, algı, motivasyon
   • Sosyoloji: Toplumsal yapı, değişme, kurumlar
   • Düşünür-görüş eşleştirme
   • Kavram analizi ve karşılaştırma
   • Metin yorumlama`,

    'Din Kültürü ve Ahlak Bilgisi': `
   🕌 ÖSYM AYT DİN KÜLTÜRÜ FORMATI (6 soru):
   • Ayet ve hadis analizi, tefsir
   • Hz. Muhammed'in hayatı ve öğretileri
   • İslam düşünce tarihi ve tasavvuf kavramları
   • Karşılaştırmalı din: diğer dinlerin temel özellikleri
   • İslam ve bilim ilişkisi
   • Ahlaki değerler ve güncel sorunlar`,
  }

  const normalizedSubject = subject.includes('Edebiyat') || subject === 'edebiyat' ? 'Edebiyat'
    : subject.includes('Matematik') || subject === 'matematik' ? 'Matematik'
    : subject.includes('Geometri') || subject === 'geometri' ? 'Geometri'
    : subject.includes('Fizik') || subject === 'fizik' ? 'Fizik'
    : subject.includes('Kimya') || subject === 'kimya' ? 'Kimya'
    : subject.includes('Biyoloji') || subject === 'biyoloji' ? 'Biyoloji'
    : subject.includes('Tarih') || subject === 'tarih' ? 'Tarih'
    : subject.includes('Coğrafya') || subject.includes('Cografya') || subject === 'cografya' ? 'Coğrafya'
    : subject.includes('Felsefe') || subject === 'felsefe' ? 'Felsefe Grubu'
    : subject.includes('Din') || subject === 'din_kulturu' ? 'Din Kültürü ve Ahlak Bilgisi'
    : subject

  return {
    examType: 'AYT (ÖSYM Alan Yeterlilik Testi)',
    format: '5 şıklı (A-E), 4 yanlış 1 doğru götürür, 160 soru 180 dakika',
    tips: subjectTips[normalizedSubject] || `
   📋 ÖSYM AYT GENEL FORMAT:
   • İleri düzey analiz ve sentez ağırlıklı
   • 5 şık (A-E)
   • Üniversite hazırlık seviyesi
   • Derin kavramsal sorular`
  }
}

// ============================================================
// KPSS Ön Lisans Sınav Bağlamı
// Lisans'a çok yakın ama ön lisans müfredatı seviyesinde
// ============================================================
function getKPSSOnlisansExamContext(subject: string): { examType: string; format: string; tips: string } {
  const subjectTips: Record<string, string> = {
    'Türkçe': `📝 KPSS ÖN LİSANS TÜRKÇE (30 soru):
Paragraf soruları ağırlıklı (14-15 soru): ana düşünce, yardımcı düşünce, boşluk doldurma, paragrafı tamamlama. Metinler lisansa göre biraz daha sade ama yine de analiz gerektiren; sosyal, tarihsel veya bilimsel popüler metinler kullan. Dil bilgisi (7-9 soru): sözcük türleri, ses olayları, yazım kuralları, noktalama. Anlam bilgisi (5-6 soru): sözcükte anlam, cümlede anlam, anlatım bozukluğu. Sözel mantık soruları (4 soru). Sorular lisans kadar akademik değil, günlük dil ve lise mezunlarının anlayabileceği düzeyde olmalı.`,
    'Matematik': `🔢 KPSS ÖN LİSANS MATEMATİK (27 soru):
Temel işlemler (6-8 soru): sayılar, EBOB/EKOK, üslü/köklü, oran-orantı, yüzde. Problemler (8-10 soru): hız-mesafe, iş-zaman, karışım, yaş, kâr-zarar — ortaöğretim seviyesinde çözülebilir günlük hayat problemleri. Sayısal mantık (3-4 soru). Denklemler ve kümeler (3-4 soru). Tablo/grafik (2-3 soru). Lisanstaki kadar derin olmayan, mantık ağırlıklı ama çok adımlı sorular üret.`,
    'Geometri': `📐 KPSS ÖN LİSANS GEOMETRİ (3 soru):
Temel düzlem geometrisi: üçgen özellikleri (iç açı, alan, benzerlik), dörtgen türleri (dikdörtgen, kare, paralelkenar), çember ve daire. Analitik geometriye girme. Görsel şekil gerektiren, açı hesaplama veya alan bulma odaklı pratik sorular üret.`,
    'Tarih': `🏛️ KPSS ÖN LİSANS TARİH (27 soru — Atatürk ağırlıklı):
İslamiyet öncesi Türk tarihi (1 soru). Türk-İslam devletleri (2 soru). Osmanlı Devleti — siyasi, kültürel, ekonomik (9 soru). Kurtuluş Savaşı hazırlık ve cepheler (3 soru). Atatürk dönemi inkılapları — siyasi, hukuki, eğitim, ekonomi, sosyal (5 soru). Atatürk ilkeleri — altı ilke, gerekçeleri ve sonuçları (4 soru). Atatürk dönemi iç-dış politika (1 soru). Çağdaş Türk ve dünya tarihi (2 soru). Atatürk inkılapları ve ilkeleri toplam 9 soru — bu konulara özellikle ağırlık ver. Kronoloji, neden-sonuç, karşılaştırma soruları üret.`,
    'Coğrafya': `🗺️ KPSS ÖN LİSANS COĞRAFYA (18 soru — Türkiye odaklı):
Coğrafi konum ve harita (1 soru). Fiziki özellikler — yer şekilleri, dağlar, akarsular, göller (2 soru). İklim ve bitki örtüsü (2 soru). Nüfus ve yerleşme (2 soru). Tarım, hayvancılık, ormancılık (3 soru). Madencilik, enerji, sanayi (2 soru). Ulaşım, ticaret, turizm (2 soru). Bölgesel coğrafya (4 soru). Türkiye coğrafyasına odaklan, lise müfredatı düzeyinde somut bilgi gerektiren sorular üret.`,
    'Vatandaşlık': `⚖️ KPSS ÖN LİSANS VATANDAŞLIK (9 soru — sade format):
Temel hukuk kavramları (3 soru): hukuk kaynakları, hak türleri, yaptırım çeşitleri, kamu-özel hukuk ayrımı. Devlet organları (4 soru): TBMM yetki ve görevleri, Cumhurbaşkanı yetkileri, yargı organları — Anayasa'nın temel maddeleri. İdare hukuku (2 soru): merkezi-yerel yönetim, kamu görevlileri. Lisansa göre daha sade, anayasa maddelerini doğrudan soran ama liseden daha analitik sorular üret.`,
  }

  const normalized = subject.toLowerCase().replace(/[^a-zğüşıöç]/g, '')
  let key = 'Türkçe'
  if (normalized.includes('mat')) key = 'Matematik'
  else if (normalized.includes('geom')) key = 'Geometri'
  else if (normalized.includes('tar') || normalized.includes('ataturk') || normalized.includes('inkilap')) key = 'Tarih'
  else if (normalized.includes('cog')) key = 'Coğrafya'
  else if (normalized.includes('vat') || normalized.includes('anayasa') || normalized.includes('hukuk')) key = 'Vatandaşlık'

  return {
    examType: 'KPSS Ön Lisans (Kamu Personel Seçme Sınavı)',
    format: '5 şıklı (A-E), 4 yanlış 1 doğru götürür, GY 60 (Türkçe 30 + Mat 27 + Geo 3) + GK 60 = 120 soru, 130 dakika',
    tips: subjectTips[key] || `📚 KPSS Ön Lisans ${subject}: Ön lisans mezunu adaylar için, lise düzeyini aşan ama lisans kadar derin olmayan KPSS formatında sorular üret.`,
  }
}

// ============================================================
// KPSS Ortaöğretim (Lise) Sınav Bağlamı
// Lise mezunları için, müfredat seviyesinde sorular
// ============================================================
function getKPSSOrtaogretimExamContext(subject: string): { examType: string; format: string; tips: string } {
  const subjectTips: Record<string, string> = {
    'Türkçe': `📝 KPSS ORTAÖĞRETİM TÜRKÇE (30 soru):
Paragraf soruları ağırlıklı (14-15 soru): ana düşünce, yardımcı düşünce, boşluk doldurma — lise düzeyinde anlaşılır metinler kullan (gazete/dergi tarzı, 150-300 kelime). Dil bilgisi (4-5 soru): sözcük türleri, ses olayları, yazım kuralları, noktalama. Anlam bilgisi (4-5 soru): sözcükte anlam, cümlede anlam, anlatım bozukluğu. Sözel mantık soruları (4 soru) — sıraya koyma, hangisi ilk/son, eksik parça. Sorular lise mezununun rahatça anlayabileceği, günlük dil kullanımı yakın olmalı.`,
    'Matematik': `🔢 KPSS ORTAÖĞRETİM MATEMATİK (27 soru):
Temel işlemler (5-7 soru): sayılar, EBOB/EKOK, üslü/köklü — ortaokul/lise temel matematik. Problemler (8-10 soru): hız-mesafe, iş-zaman, yaş, karışım, kâr-zarar — kısa ve net günlük hayat problemleri. Matematiksel ilişkiler (5-6 soru): basit denklemler, oran-orantı uygulamaları. Sayısal mantık (4 soru): sayı dizisi, tablo yorumlama, örüntü. Rasyonel işlemler (2-3 soru). Sorular çok adımlı olmayan, lise öğrencisinin yapabileceği pratik düzeyde olmalı.`,
    'Geometri': `📐 KPSS ORTAÖĞRETİM GEOMETRİ (3 soru):
Temel geometri: üçgen (iç açı toplamı, alan, özel üçgenler), dörtgen türleri, çember. Şekil üzerinde açı veya alan hesaplama. Lise geometri müfredatı düzeyinde — analitik geometri veya koordinat sorma. Görsel şekil gerektiren basit sorular.`,
    'Tarih': `🏛️ KPSS ORTAÖĞRETİM TARİH (27 soru — Atatürk çok ağırlıklı):
İlk Türk devletleri (1 soru). Türk-İslam devletleri (2 soru). Osmanlı Devleti — kuruluş, yükselme, gerileme, dağılma (9 soru): padişahlar, savaşlar, kurumlar, I. Dünya Savaşı. Kurtuluş Savaşı (3 soru): hazırlık dönemi, cepheler, Mudanya-Lozan. Atatürk ilke ve inkılapları (9 SORU — EN AĞIR BÖLÜM): cumhuriyetin ilanı, halifeliğin kaldırılması, hukuk inkılabı, eğitim inkılabı, ekonomik inkılaplar, sosyal inkılaplar, Atatürk ilkeleri (6 ilke). Çağdaş Türk ve dünya tarihi (3 soru). Lise tarih ders kitabı düzeyinde, ezbere dayalı değil kavramsal anlama odaklı sorular üret.`,
    'Coğrafya': `🗺️ KPSS ORTAÖĞRETİM COĞRAFYA (18 soru — sadece Türkiye):
Coğrafi konum (1 soru). İklim ve bitki örtüsü (2 soru): iklim tipleri, bitki örtüsü dağılışı. Fiziki özellikler (4 soru): dağlar, ovalar, akarsular, göller. Beşeri özellikler (3 soru): nüfus artışı/azalması, göç, kır-kent nüfusu, yerleşme. Ekonomik özellikler (8 soru): tarım ürünleri ve bölgeleri, sanayi tesisleri, madenler, enerji kaynakları, ulaşım ağları, turizm. Sadece Türkiye coğrafyası — lise müfredatı düzeyinde somut bilgi gerektiren sorular üret.`,
    'Vatandaşlık': `⚖️ KPSS ORTAÖĞRETİM VATANDAŞLIK (9 soru — en sade):
Temel hukuk kavramları (3 soru): hukuk nedir, hukuk dalları, yaptırım türleri, temel kavramlar. Yasama-Yürütme-Yargı (4 soru): TBMM'nin yapısı ve görevleri, Cumhurbaşkanının yetkileri, yargı organları — anayasal maddeler. İdare hukuku (2 soru): devlet teşkilatının yapısı, merkezi/yerel yönetim farkları. Lise vatandaşlık ve demokrasi ders kitabı düzeyinde, hukuk terimleri bilgisi gerektiren ama çok derin olmayan sorular üret.`,
  }

  const normalized = subject.toLowerCase().replace(/[^a-zğüşıöç]/g, '')
  let key = 'Türkçe'
  if (normalized.includes('mat')) key = 'Matematik'
  else if (normalized.includes('geom')) key = 'Geometri'
  else if (normalized.includes('tar') || normalized.includes('ataturk') || normalized.includes('inkilap')) key = 'Tarih'
  else if (normalized.includes('cog')) key = 'Coğrafya'
  else if (normalized.includes('vat') || normalized.includes('anayasa') || normalized.includes('hukuk')) key = 'Vatandaşlık'

  return {
    examType: 'KPSS Ortaöğretim/Lise (Kamu Personel Seçme Sınavı)',
    format: '5 şıklı (A-E), 4 yanlış 1 doğru götürür, GY 60 (Türkçe 30 + Mat 27 + Geo 3) + GK 60 = 120 soru, 130 dakika',
    tips: subjectTips[key] || `📚 KPSS Ortaöğretim ${subject}: Lise mezunu adaylar için, lise müfredatı düzeyinde KPSS formatında sorular üret.`,
  }
}

// ============================================================
// KPSS Lisans Sınav Bağlamı
// ============================================================
function getKPSSExamContext(subject: string): { examType: string; format: string; tips: string } {
  const subjectTips: Record<string, string> = {
    'Türkçe': `📝 ÖSYM KPSS TÜRKÇE (30 soru, Genel Yetenek):
Paragraf soruları ağırlıklı (14-15 soru): ana düşünce, yardımcı düşünce, boşluk doldurma, paragrafı tamamlama, yazarın amacı ve tutumu. 200-400 kelimelik akademik, sosyal bilim veya felsefi metinler kullan. Dil bilgisi (8-10 soru): sözcük türleri, sözcükte yapı, cümlenin ögeleri, ses olayları, yazım kuralları, noktalama. Anlam bilgisi (5-6 soru): sözcükte anlam, cümlede anlam, anlatım bozukluğu. Sözel mantık sorularına da yer ver. KPSS Türkçe'de soyut-felsefi metinler, bilimsel popüler metinler, biyografik ve sosyolojik metinler tercih edilir.`,

    'Matematik': `🔢 ÖSYM KPSS MATEMATİK (30 soru, Genel Yetenek):
Temel işlemler (8-10 soru): sayılar ve sayı sistemleri, EBOB/EKOK, üslü/köklü sayılar, mutlak değer, modüler aritmetik. Problem çözme (10-12 soru): oran-orantı, yüzde, karışım, iş-zaman, hız-mesafe, yaş problemleri, kar-zarar. Sayısal mantık (3-6 soru): örüntü bulma, sayı dizileri, tablo/grafik yorumlama. Geometri (4-6 soru): üçgen, dörtgen, çember özellikleri, analitik geometri temelleri. Kombinasyon/Olasılık (2-3 soru). KPSS'de sezgisel çözüm yolları olan, pratik hayatla bağlantılı, birden fazla işlem adımı gerektiren sorular üret.`,

    'Tarih': `🏛️ ÖSYM KPSS TARİH (27 soru, Genel Kültür):
İslamiyet öncesi Türk tarihi (2 soru): İlk Türk devletleri, kültür ve uygarlık. İlk Türk-İslam devletleri (3 soru): Karahanlılar, Gazneliler, Selçuklular, kültür ve uygarlık. Osmanlı siyasi tarihi (3 soru): kuruluş, yükselme, duraklama dönemleri. Osmanlı kültür ve uygarlığı (5 soru): devlet teşkilatı, ekonomi, eğitim, sanat. 20. yüzyıl Osmanlı (4 soru): gerileme, Balkan Savaşları, I. Dünya Savaşı. Kurtuluş Savaşı (2 soru). Atatürk dönemi inkılapları (5 soru): siyasi, hukuki, eğitim, ekonomi, sosyal inkılaplar. Atatürk ilkeleri (2 soru): cumhuriyetçilik, milliyetçilik, halkçılık, devletçilik, laiklik, devrimcilik. Güncel Türk tarihi (2 soru). Neden-sonuç, karşılaştırma, kronoloji ağırlıklı sorular üret.`,

    'Coğrafya': `🗺️ ÖSYM KPSS COĞRAFYA (18 soru, Genel Kültür):
Türkiye fiziki coğrafyası (7-8 soru): yer şekilleri ve dağlar, akarsular ve göller, iklim ve iklim tipleri, doğal bitki örtüsü, toprak türleri. Beşeri ve ekonomik coğrafya (10-11 soru): nüfus artışı ve nüfus hareketleri, kır/kent yerleşmeleri, tarım ve hayvancılık, orman ve maden kaynakları, sanayi bölgeleri, ulaşım ağları, ticaret ve turizm. Türkiye'nin coğrafi bölgeleri ve özellikleri. Harita bilgisi. Dünya coğrafyasından 1-2 soru. Güncel Türkiye coğrafyası gerektiren, yorumlama ve karşılaştırma odaklı sorular üret.`,

    'Vatandaşlık': `⚖️ ÖSYM KPSS VATANDAŞLIK/ANAYASA (9 soru, Genel Kültür):
Temel hukuk kavramları (2 soru): hukukun kaynakları, hukuk dalları, yaptırım çeşitleri, kamu-özel hukuk ayrımı. TC Anayasası genel esaslar (2 soru): devletin temel nitelikleri, egemenlik, Türk milletinin unsurları. Temel hak ve ödevler (1 soru): hak kategorileri, temel hakların sınırlandırılması. Devlet organları (3 soru): TBMM yetki ve görevleri, Cumhurbaşkanı yetki ve görevleri, Anayasa Mahkemesi ve yüksek mahkemeler. İdare hukuku (2 soru): kamu yönetimi yapısı, merkezi/yerel yönetim, kamu görevlileri statüsü, idari yargı. Anayasa maddeleri ve kamu hukuku kurallarına dayalı, yorum gerektiren sorular üret.`,
  }

  const normalized = subject.toLowerCase().replace(/[^a-zğüşıöç]/g, '')
  let key = 'Türkçe'
  if (normalized.includes('mat') || normalized.includes('geom')) key = 'Matematik'
  else if (normalized.includes('tar') || normalized.includes('inkilap') || normalized.includes('ataturk')) key = 'Tarih'
  else if (normalized.includes('cog') || normalized.includes('cografya')) key = 'Coğrafya'
  else if (normalized.includes('vat') || normalized.includes('anayasa') || normalized.includes('hukuk')) key = 'Vatandaşlık'

  return {
    examType: 'KPSS (Kamu Personel Seçme Sınavı) Lisans',
    format: '5 şıklı (A-E), 4 yanlış 1 doğru götürür, GY 60 + GK 60 = 120 soru, 135 dakika',
    tips: subjectTips[key] || `📚 KPSS ${subject}: ÖSYM KPSS lisans formatında, devlet memurluğu sınavına hazırlık düzeyinde analitik sorular üret.`,
  }
}

export async function generateCurriculumQuestions(
  grade: number,
  subject: string,
  topic: string,
  learningOutcome: string,
  difficulty: Difficulty,
  count: number = 5,
  lang: 'tr' | 'en' = 'tr',  // 🌍 Questly Global için dil desteği
  visualType: VisualType = 'none',  // 🆕 Yeni Nesil Soru görsel türü
  examMode?: 'TYT' | 'AYT' | 'KPSS' | 'KPSS_ONLISANS' | 'KPSS_ORTAOGRETIM' | null  // 📋 Sınav bazlı üretim modu
): Promise<CurriculumQuestion[]> {
  // Sınıf seviyesine göre şık sayısı — KPSS/TYT/AYT her zaman 5 şık
  const isHighSchool = grade >= 9 || !!examMode
  const optionCount = isHighSchool ? 5 : 4

  // Sınav bağlamı
  const examContext = examMode === 'TYT' ? getTYTExamContext(subject)
    : examMode === 'AYT' ? getAYTExamContext(subject)
    : examMode === 'KPSS' ? getKPSSExamContext(subject)
    : examMode === 'KPSS_ONLISANS' ? getKPSSOnlisansExamContext(subject)
    : examMode === 'KPSS_ORTAOGRETIM' ? getKPSSOrtaogretimExamContext(subject)
    : getExamContext(grade)
  
  // Ders bazlı yönergeler
  const subjectGuidelines = getSubjectGuidelines(subject, grade)
  
  // Zorluk açıklaması
  const difficultyDetails: Record<Difficulty, string> = {
    easy: `Temel seviye - bilgi hatırlama, basit uygulama (${grade <= 4 ? 'Çocuğun rahatça yapabileceği' : 'Konuyu yeni öğrenen öğrenci için'})`,
    medium: `Orta seviye - kavrama, yorumlama, iki adımlı işlemler (${grade >= 9 ? 'TYT' : 'LGS'} ortalaması)`,
    hard: `İleri seviye - analiz, çoklu adım, derinlemesine yorum (${grade >= 9 ? 'AYT zorluğu' : 'LGS ayırt edici'})`,
    legendary: `Olimpiyat/yarışma - sentez, özgün düşünme (${grade >= 9 ? 'TÜBİTAK/olimpiyat' : 'MEB proje yarışması'} düzeyi)`
  }

  // Bloom Taksonomisi - sınıf seviyesine göre ağırlıklandır
  const bloomPriority = grade <= 4 
    ? { easy: ['bilgi', 'kavrama'], medium: ['kavrama', 'uygulama'], hard: ['uygulama', 'analiz'], legendary: ['analiz'] }
    : grade <= 8 
    ? { easy: ['bilgi', 'kavrama'], medium: ['kavrama', 'uygulama', 'analiz'], hard: ['analiz', 'sentez'], legendary: ['sentez', 'değerlendirme'] }
    : { easy: ['kavrama', 'uygulama'], medium: ['uygulama', 'analiz'], hard: ['analiz', 'sentez'], legendary: ['sentez', 'değerlendirme'] }

  // 🎨 Varyasyon değerlerini her soru seti için yeniden seç
  const selectedTone = getRandomTone()
  const selectedDifficultyDesc = getRandomDifficultyDescription(difficulty)
  const selectedDistractorRule = getRandomDistractorRule()
  const selectedExplanationFormat = getRandomExplanationFormat()
  const selectedQuestionStyle = getRandomQuestionStyle(subject)
  const selectedContextExample = getRandomContextExample(subject)
  const selectedSpecialTip = getRandomSpecialTip(subject)
  
  // 🌍 QUESTLY GLOBAL: Dile göre prompt oluştur
  const prompt = lang === 'en'
    ? generateEnglishPrompt(grade, subject, topic, learningOutcome, difficulty, count, optionCount, isHighSchool, bloomPriority)
    : `${examMode === 'TYT'
      ? `SEN ÖSYM'NİN EN DENEYİMLİ SORU YAZARISIN. Gerçek TYT sınavı formatında, ÖSYM kalitesinde mükemmel sorular üreteceksin. 2025 TYT sınavı referans alınacak.`
      : examMode === 'AYT'
      ? `SEN ÖSYM'NİN EN DENEYİMLİ AYT SORU YAZARISIN. Alan Yeterlilik Testi formatında, üniversiteye hazırlık düzeyinde ileri seviye sorular üreteceksin. 2025 AYT sınavı referans alınacak.`
      : examMode === 'KPSS'
      ? `SEN ÖSYM'NİN EN DENEYİMLİ KPSS SORU YAZARISIN. KPSS Lisans formatında, devlet memurluğu sınavına hazırlık düzeyinde, analitik düşünme gerektiren mükemmel sorular üreteceksin. 2024-2025 KPSS Lisans sınavları referans alınacak.`
      : examMode === 'KPSS_ONLISANS'
      ? `SEN ÖSYM'NİN DENEYİMLİ KPSS SORU YAZARISIN. KPSS Ön Lisans formatında, ön lisans mezunu adaylar için uygun zorluk ve içerikte sorular üreteceksin. 2024 KPSS Ön Lisans sınavı referans alınacak.`
      : examMode === 'KPSS_ORTAOGRETIM'
      ? `SEN ÖSYM'NİN DENEYİMLİ KPSS SORU YAZARISIN. KPSS Ortaöğretim formatında, lise mezunu adaylar için lise müfredatı düzeyinde sorular üreteceksin. 2024 KPSS Ortaöğretim sınavı referans alınacak.`
      : `SEN TÜRKİYE'NİN EN İYİ SORU BANKASI YAZARISIN. ${examContext.examType} formatında mükemmel sorular üreteceksin.`}

════════════════════════════════════════════════════════════
🎯 GÖREV: ${examMode ? `${examMode} ${subject.toUpperCase()} SORUSU ÜRET` : `${grade}. SINIF ${subject.toUpperCase()} SORUSU ÜRET`}
════════════════════════════════════════════════════════════

📚 KAZANIM BİLGİLERİ:
┌─────────────────────────────────────────────────────────┐
${examMode
  ? `│ Sınav: ${examMode === 'TYT' ? 'TYT (Temel Yeterlilik Testi)' : examMode === 'AYT' ? 'AYT (Alan Yeterlilik Testi)' : examMode === 'KPSS' ? 'KPSS Lisans' : examMode === 'KPSS_ONLISANS' ? 'KPSS Ön Lisans' : 'KPSS Ortaöğretim'}
│ Ders: ${subject}
│ Konu: ${topic}
│ Kazanım: "${learningOutcome}"
│ Zorluk: ${difficulty.toUpperCase()} - ${selectedDifficultyDesc}
│ Format: ${examContext.format}
│ Üretilecek: ${count} soru`
  : `│ Sınıf: ${grade}. Sınıf
│ Ders: ${subject}
│ Konu: ${topic}
│ Kazanım: "${learningOutcome}"
│ Zorluk: ${difficulty.toUpperCase()} - ${selectedDifficultyDesc}
│ Format: ${examContext.format}
│ Üretilecek: ${count} soru`}
└─────────────────────────────────────────────────────────┘

🎨 BU SORU SETİ İÇİN ÖZEL DİREKTİFLER:
┌─────────────────────────────────────────────────────────┐
│ Üslup: ${selectedTone}
│ Soru Stili: ${selectedQuestionStyle}
│ Bağlam: ${selectedContextExample}
│ Çeldirici Kuralı: ${selectedDistractorRule}
│ Açıklama Formatı: ${selectedExplanationFormat}
│ Özel İpucu: ${selectedSpecialTip}
└─────────────────────────────────────────────────────────┘

📋 ${examContext.examType.toUpperCase()} FORMATI:
${examContext.tips}

📖 ${subject.toUpperCase()} DERSİ İÇİN ÖZEL KURALLAR:
${subjectGuidelines}

🎓 BLOOM TAKSONOMİSİ (${difficulty} için):
   Öncelikli kullan: ${bloomPriority[difficulty].join(', ')}
   
   • bilgi: Tanıma, listeleme, hatırlama
   • kavrama: Açıklama, örnekleme, yorumlama  
   • uygulama: Hesaplama, problem çözme, kullanma
   • analiz: Karşılaştırma, ilişki kurma, ayırt etme
   • sentez: Tasarlama, planlama, oluşturma
   • değerlendirme: Eleştirme, yargılama, savunma

⚡ SORU YAZIM KURALLARI:

1. SORU KÖKÜ:
   ✓ Net, anlaşılır ve tek anlama gelen
   ✓ ${examMode ? 'Lise düzeyi Türkçe seviyesine uygun' : `${grade}. sınıf Türkçe seviyesine uygun`}
   ✓ Kazanımı doğrudan ölçen
   ✓ Gereksiz bilgi içermeyen
   ${examMode ? '✓ ÖSYM soru kalıplarına uygun, akademik dil' : grade <= 4 ? '✓ Kısa ve basit cümleler' : grade >= 9 ? '✓ Akademik dil kullanılabilir' : '✓ Orta uzunlukta, net ifadeler'}

2. ŞIKLAR (${optionCount} adet):
   ✓ Tüm şıklar mantıklı ve olası
   ✓ Yanlışlar yaygın öğrenci hatalarını yansıtsın
   ✓ Birbirine yakın uzunlukta
   ✓ "Hiçbiri/Hepsi" YASAK
   ✓ Doğru cevap RASTGELE dağılsın (A,B,C,D${isHighSchool ? ',E' : ''})

3. AÇIKLAMA:
   ✓ Doğru cevabı gerekçelendir
   ✓ Neden diğerleri yanlış açıkla
   ✓ Öğretici ve motive edici
   ✓ ${grade <= 6 ? 'Basit dil' : 'Akademik ama anlaşılır'}

📐 MATEMATİK/FEN FORMÜLLEME (LaTeX):
   • Kesir: $$\\\\frac{a}{b}$$
   • Kök: $$\\\\sqrt{x}$$, $$\\\\sqrt[3]{x}$$
   • Üs: $$x^{2}$$, $$e^{x}$$
   • İndis: $$x_{1}$$, $$a_{n}$$
   • İşlemler: $$\\\\times$$, $$\\\\div$$, $$\\\\pm$$
   • Özel: $$\\\\pi$$, $$\\\\infty$$, $$\\\\sum$$, $$\\\\int$$
   • Eşitsizlik: $$\\\\leq$$, $$\\\\geq$$, $$\\\\neq$$

════════════════════════════════════════════════════════════
📤 ÇIKTI - SADECE JSON (başka metin YASAK)
════════════════════════════════════════════════════════════
${visualType !== 'none' ? `
🚨 ÇOK ÖNEMLİ - YENİ NESİL SORU FORMATI:
Bu sorular MUTLAKA görsel içerik (${visualType}) içermelidir!

📋 TABLO İÇİN ÖRNEK:
{"questions":[{"question_text":"Aşağıdaki tabloda öğrencilerin ders notları verilmiştir.","options":{"A":"...","B":"...","C":"...","D":"..."${isHighSchool ? ',"E":"..."' : ''}},"correct_answer":"B","explanation":"...","difficulty":"${difficulty}","bloom_level":"${bloomPriority[difficulty][0]}","visual_type":"table","visual_content":"<table style=\\"width:100%;border-collapse:collapse;font-family:sans-serif;\\"><thead><tr style=\\"background:linear-gradient(135deg,#667eea,#764ba2);color:white;\\"><th style=\\"padding:12px;border:1px solid #ddd;\\">Öğrenci</th><th style=\\"padding:12px;border:1px solid #ddd;\\">Not</th></tr></thead><tbody><tr style=\\"background:#f8fafc;\\"><td style=\\"padding:10px;border:1px solid #ddd;\\">Ali</td><td style=\\"padding:10px;border:1px solid #ddd;\\">85</td></tr><tr style=\\"background:#fff;\\"><td style=\\"padding:10px;border:1px solid #ddd;\\">Ayşe</td><td style=\\"padding:10px;border:1px solid #ddd;\\">90</td></tr></tbody></table>"}]}

📈 GRAFİK/AKIŞ ŞEMASI İÇİN ÖRNEK:
{"questions":[{"question_text":"Grafikteki veriye göre...","visual_type":"chart","visual_content":"<svg viewBox=\\"0 0 400 200\\" xmlns=\\"http://www.w3.org/2000/svg\\"><rect x=\\"50\\" y=\\"20\\" width=\\"40\\" height=\\"100\\" fill=\\"#667eea\\"/><rect x=\\"110\\" y=\\"50\\" width=\\"40\\" height=\\"70\\" fill=\\"#764ba2\\"/><text x=\\"70\\" y=\\"140\\" text-anchor=\\"middle\\" font-size=\\"12\\">A</text><text x=\\"130\\" y=\\"140\\" text-anchor=\\"middle\\" font-size=\\"12\\">B</text></svg>","options":{"A":"...","B":"...","C":"...","D":"..."${isHighSchool ? ',"E":"..."' : ''}},"correct_answer":"A","explanation":"...","difficulty":"${difficulty}","bloom_level":"${bloomPriority[difficulty][0]}"}]}

⚠️ visual_type ve visual_content alanları ZORUNLUDUR!
` : `{"questions":[{"question_text":"Soru metni","options":{"A":"Şık A","B":"Şık B","C":"Şık C","D":"Şık D"${isHighSchool ? ',"E":"Şık E"' : ''}},"correct_answer":"B","explanation":"Açıklama","difficulty":"${difficulty}","bloom_level":"${bloomPriority[difficulty][0]}"}]}`}

⛔ YASAK (KESİNLİKLE KULLANMA):
• JSON dışında metin yazma
• Trailing comma (son elemandan sonra virgül)
• "Hiçbiri" veya "Hepsi" şıkkı
• Aynı harfin sürekli doğru cevap olması
• ❌ Mermaid.js (graph TD, flowchart, pie chart) - YASAK!
• ❌ LaTeX tabloları (\\begin{tabular}, \\hline, $$) - YASAK!
• ❌ Markdown tabloları (| --- |) - YASAK!
• ✅ SADECE inline SVG ve HTML tablo kullan!

${getVisualInstructions(visualType, subject)}

✅ ZORUNLU:
• correct_answer: ${isHighSchool ? 'A, B, C, D veya E' : 'A, B, C veya D'}
• bloom_level: bilgi, kavrama, uygulama, analiz, sentez, değerlendirme
• Türkçe karakterler: ş, ğ, ü, ö, ı, ç, Ş, Ğ, Ü, Ö, İ, Ç

🎭 ÇEŞİTLİLİK DİREKTİFLERİ (AI Pattern Önleme):
• Her soruda FARKLI soru kalıpları kullan ("Hangisi doğrudur?", "Nedir?", "Ne olur?", "Hangisi yanlıştır?" vb.)
• Soru köklerini monoton yapma, çeşitlendir
• Açıklamalarda farklı başlangıç cümleleri kullan
• Bazen "Buna göre...", bazen "Verilen bilgiye göre...", bazen direkt soru sor
• Şıkların uzunlukları benzer olsun ama cümle yapıları farklı olsun
• Doğru cevap her soruda rastgele dağılsın (A, B, C, D${isHighSchool ? ', E' : ''} eşit olasılıkla)

ŞİMDİ ${count} ADET MÜKEMMEL VE ÇEŞİTLİ ${examMode ? `ÖSYM ${examMode} ` : ''}${subject.toUpperCase()} SORUSU ÜRET:`

  // 🚀 Retry mekanizması ile soru üretimi
  return await withRetry(async () => {
    console.log(`AI Soru Üretimi başlatılıyor: ${examMode ? examMode : `${grade}. Sınıf`} ${subject} - ${topic} [${lang.toUpperCase()}]`)
    
    // 📤 Gemini API çağrısı
    let text = ''
    let useStructuredOutput = visualType === 'none' // 🆕 Yeni Nesil sorularda Structured Output KULLANMA (prompt daha etkili)
    
    if (useStructuredOutput) {
      try {
        // Normal sorular için Structured Output (daha güvenilir JSON)
        const result = await geminiModel.generateContent({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: 'application/json',
            // @ts-ignore - responseSchema yeni özellik
            responseSchema: curriculumQuestionSchema as any
          }
        })
        const response = await result.response
        text = response.text()
        console.log('✅ Structured Output kullanıldı')
      } catch (structuredError: any) {
        console.warn('⚠️ Structured Output başarısız, normal mod deneniyor:', structuredError.message)
        useStructuredOutput = false
        const result = await geminiModel.generateContent(prompt)
        const response = await result.response
        text = response.text()
      }
    } else {
      // 🆕 Yeni Nesil sorular için normal mod (visual_content için prompt daha etkili)
      console.log('🆕 Yeni Nesil Soru modu - Structured Output devre dışı, prompt tabanlı')
      const result = await geminiModel.generateContent(prompt)
      const response = await result.response
      text = response.text()
    }
    
    console.log('AI Ham Yanıt (ilk 500 karakter):', text.substring(0, 500))
    
    // Markdown code block'u kaldır
    text = text.replace(/```json\s*/gi, '')
    text = text.replace(/```\s*/gi, '')
    text = text.trim()
    
    // JSON'u bul - en dıştaki { } arasını al
    let jsonStr = ''
    let braceCount = 0
    let started = false
    let startIdx = 0
    
    for (let i = 0; i < text.length; i++) {
      if (text[i] === '{') {
        if (!started) {
          started = true
          startIdx = i
        }
        braceCount++
      } else if (text[i] === '}') {
        braceCount--
        if (started && braceCount === 0) {
          jsonStr = text.substring(startIdx, i + 1)
          break
        }
      }
    }
    
    if (!jsonStr) {
      console.error('JSON bulunamadı, tam yanıt:', text)
      throw new Error('AI yanıtında JSON bulunamadı')
    }
    
    // 🛡️ GELİŞMİŞ JSON + LaTeX TEMİZLEME
    // 1. LaTeX normalize et (yeni fonksiyon)
    jsonStr = normalizeLatexInJson(jsonStr)
    
    // 2. Trailing commas temizle
    jsonStr = jsonStr.replace(/,(\s*[}\]])/g, '$1')
    
    // 3. Çoklu boşlukları tek boşluğa indir
    jsonStr = jsonStr.replace(/\s+/g, ' ')
    
    // 🛡️ Çoklu parse denemesi
    let data: any = null
    const parseAttempts = [
      // Deneme 1: Direkt parse
      () => JSON.parse(jsonStr),
      
      // Deneme 2: Trailing comma farklı pattern
      () => JSON.parse(jsonStr.replace(/,\s*}/g, '}').replace(/,\s*]/g, ']')),
      
      // Deneme 3: Tek tırnak varsa çift tırnağa çevir
      () => JSON.parse(jsonStr.replace(/'/g, '"')),
      
      // Deneme 4: Backslash'leri daha agresif temizle
      () => {
        let cleaned = jsonStr
          // Üçlü backslash -> çift
          .replace(/\\\\\\/g, '\\\\')
          // Dört+ backslash -> çift
          .replace(/\\{4,}/g, '\\\\')
        return JSON.parse(cleaned)
      },
      
      // Deneme 5: Tüm backslash'leri kaldır (son çare - LaTeX bozulur ama parse olur)
      () => {
        console.warn('⚠️ Son çare: Backslash temizleme uygulanıyor')
        let cleaned = jsonStr.replace(/\\+([a-zA-Z]+)/g, '$1')
        return JSON.parse(cleaned)
      }
    ]
    
    let lastParseError: any = null
    let attemptIndex = 0
    
    for (const attempt of parseAttempts) {
      attemptIndex++
      try {
        data = attempt()
        if (attemptIndex > 1) {
          console.log(`✅ JSON parse başarılı (deneme ${attemptIndex})`)
        }
        break
      } catch (e) {
        lastParseError = e
      }
    }
    
    if (!data) {
      console.error('❌ JSON Parse Hatası (tüm denemeler başarısız):', lastParseError?.message)
      console.error('Temizlenmiş JSON (ilk 800 karakter):', jsonStr.substring(0, 800))
      throw new Error(`JSON parse hatası: ${lastParseError?.message}. AI yanıtı geçersiz format içeriyor.`)
    }
    
    const questions = data.questions || []
    
    console.log(`✅ ${questions.length} soru başarıyla parse edildi`)
    
    // 🛡️ Soruları doğrula, düzelt ve LaTeX normalize et
    const validatedQuestions = questions.map((q: any, idx: number) => {
      // Zorunlu alanlar kontrolü
      if (!q.question_text && !q.question) {
        console.warn(`⚠️ Soru ${idx + 1}: question_text boş, atlanıyor`)
        return null
      }
      
      // LaTeX normalize et
      const questionText = normalizeLatex(String(q.question_text || q.question || '').trim())
      const explanation = normalizeLatex(String(q.explanation || '').trim())
      
      // 🆕 Yeni Nesil Soru: Görsel içerik
      const visualContent = q.visual_content ? String(q.visual_content).trim() : undefined
      const detectedVisualType = q.visual_type || (visualContent ? visualType : 'none')
      
      return {
        question_text: questionText,
        options: {
          A: normalizeLatex(String(q.options?.A || q.options?.a || '').trim()),
          B: normalizeLatex(String(q.options?.B || q.options?.b || '').trim()),
          C: normalizeLatex(String(q.options?.C || q.options?.c || '').trim()),
          D: normalizeLatex(String(q.options?.D || q.options?.d || '').trim()),
          ...(isHighSchool && { E: normalizeLatex(String(q.options?.E || q.options?.e || '').trim()) })
        },
        correct_answer: String(q.correct_answer || q.answer || 'A').toUpperCase().charAt(0),
        explanation: explanation,
        difficulty: q.difficulty || difficulty,
        bloom_level: q.bloom_level || 'kavrama',
        // 🆕 Yeni Nesil Soru alanları
        visual_type: detectedVisualType !== 'none' ? detectedVisualType : undefined,
        visual_content: visualContent
      }
    }).filter(Boolean) as CurriculumQuestion[]
    
    if (validatedQuestions.length === 0) {
      throw new Error('Hiç geçerli soru üretilemedi')
    }
    
    // 🛡️ Son adım: Bozuk escape karakterlerini düzelt (\f, \t vb.)
    return fixLatexEscapes(validatedQuestions)
    
  }, 3, `${grade}. Sınıf ${subject} soru üretimi`)
}

// =====================================================
// GÖRÜNTÜLÜ SORU ÜRETİCİ
// Nano Banana ile eğitim görselleri oluşturma
// =====================================================

export interface ImageQuestionType {
  imageType: 'graph' | 'diagram' | 'chart' | 'map' | 'scientific' | 'geometry'
  subject: string
  description: string
}

export interface GeneratedImageQuestion {
  question_text: string
  image_prompt: string
  image_base64?: string
  options: {
    A: string
    B: string
    C: string
    D: string
    E?: string
  }
  correct_answer: 'A' | 'B' | 'C' | 'D' | 'E'
  explanation: string
  difficulty: Difficulty
  bloom_level: string
}

// Görüntü tipi açıklamaları
const imageTypeDescriptions: Record<string, string> = {
  graph: 'Çizgi grafik, sütun grafik veya pasta grafik',
  diagram: 'Bilimsel diyagram (DNA, hücre, atom yapısı vb.)',
  chart: 'Veri tablosu veya karşılaştırma çizelgesi',
  map: 'Harita veya coğrafi şema',
  scientific: 'Deney düzeneği veya fizik/kimya şeması',
  geometry: 'Geometrik şekil veya matematiksel çizim'
}

// Görüntü prompt'u oluştur
function createImagePrompt(
  imageType: string,
  subject: string,
  topic: string,
  description: string,
  grade: number
): string {
  const baseStyle = `Clean, educational diagram style. Simple lines, clear labels in Turkish. 
  White or light gray background. No decorative elements. 
  Suitable for ${grade}. grade students in Turkey.`

  const typePrompts: Record<string, string> = {
    graph: `Create a clear ${description}. 
    X and Y axes clearly labeled in Turkish. 
    Grid lines visible. Data points connected with smooth lines.
    Legend if multiple data series. ${baseStyle}`,
    
    diagram: `Create a scientific diagram of ${description}. 
    Parts clearly labeled in Turkish with arrows.
    Accurate scientific representation.
    Colors: blue, green, orange for different parts. ${baseStyle}`,
    
    chart: `Create a data table or chart showing ${description}.
    Rows and columns clearly defined.
    Headers in bold. Numbers clearly readable.
    Use colors to highlight important data. ${baseStyle}`,
    
    map: `Create an educational map showing ${description}.
    Geographic features clearly marked.
    Cities/regions labeled in Turkish.
    Compass rose and scale if relevant. ${baseStyle}`,
    
    scientific: `Create a scientific illustration of ${description}.
    Equipment/setup clearly labeled in Turkish.
    Arrows showing direction of flow/force if applicable.
    Accurate proportions and relationships. ${baseStyle}`,
    
    geometry: `Create a geometric diagram showing ${description}.
    Clean lines, accurate angles.
    Measurements and labels in Turkish.
    Use standard geometric notation. ${baseStyle}`
  }

  return typePrompts[imageType] || `Create an educational image of ${description}. ${baseStyle}`
}

// Görüntü üret (Nano Banana)
export async function generateEducationalImage(
  prompt: string
): Promise<{ base64: string; mimeType: string } | null> {
  try {
    console.log('Görüntü üretimi başlatılıyor:', prompt.substring(0, 100))
    
    const result = await geminiImageModel.generateContent({
      contents: [{ 
        role: 'user', 
        parts: [{ 
          text: `Generate an educational image: ${prompt}
          
          IMPORTANT: Create a clean, simple, educational diagram or illustration.
          Style: Minimalist, clear labels, suitable for students.
          DO NOT include any text that is not part of the image labels.` 
        }] 
      }],
      generationConfig: {
        // @ts-ignore - responseModalities yeni özellik
        responseModalities: ['image', 'text'],
      }
    })
    
    const response = await result.response
    const candidate = response.candidates?.[0]
    
    if (candidate?.content?.parts) {
      for (const part of candidate.content.parts) {
        // @ts-ignore - inlineData yeni format
        if (part.inlineData) {
          // @ts-ignore
          return {
            base64: part.inlineData.data,
            mimeType: part.inlineData.mimeType || 'image/png'
          }
        }
      }
    }
    
    console.log('Görüntü üretilemedi - yanıtta görsel yok')
    return null
    
  } catch (error: any) {
    console.error('Görüntü üretme hatası:', error)
    throw error
  }
}

// Konuya göre otomatik görsel açıklaması üret
async function generateImageDescription(
  grade: number,
  subject: string,
  topic: string,
  imageType: string
): Promise<string> {
  const imageTypeDesc = imageTypeDescriptions[imageType] || imageType
  
  const prompt = `Sen bir eğitim içerik uzmanısın. ${grade}. sınıf ${subject} dersi "${topic}" konusu için ${imageTypeDesc} türünde bir görsel açıklaması oluştur.

Bu görsel, öğrencilerin konuyu anlamasına yardımcı olacak ve soru sorulabilecek bir görsel olmalı.

SADECE görsel açıklamasını yaz, başka bir şey yazma. Türkçe yaz.

Örnek formatlar:
- Grafik için: "K, L, M şehirlerinin yıl boyunca gündüz süresi değişimini gösteren çizgi grafik"
- Diyagram için: "DNA çift sarmal yapısı ve adenin-timin, guanin-sitozin eşleşmelerini gösteren diyagram"
- Tablo için: "Elementlerin atom numarası, kütle numarası ve elektron sayısını gösteren tablo"
- Harita için: "Dünya'nın 21 Haziran tarihindeki Güneş etrafındaki konumunu gösteren şema"
- Deney için: "Asit-baz tepkimesini gösteren deney düzeneği"
- Geometri için: "ABC üçgeninde açıortay ve kenarortay çizimini gösteren şekil"

ŞİMDİ "${topic}" KONUSU İÇİN UYGUN BİR GÖRSEL AÇIKLAMASI YAZ:`

  try {
    const result = await geminiModel.generateContent(prompt)
    const response = await result.response
    let text = response.text().trim()
    
    // Temizle - sadece açıklamayı al
    text = text.replace(/^["']|["']$/g, '').trim()
    
    return text || `${topic} konusunu gösteren ${imageTypeDesc}`
    
  } catch (error) {
    console.error('Görsel açıklaması üretme hatası:', error)
    return `${topic} konusunu gösteren ${imageTypeDesc}`
  }
}

// Görüntülü soru üret (imageDescription artık optional)
export async function generateImageQuestion(
  grade: number,
  subject: string,
  topic: string,
  imageType: string,
  imageDescription?: string, // Artık optional!
  difficulty: Difficulty = 'medium'
): Promise<GeneratedImageQuestion> {
  const isHighSchool = grade >= 9
  
  // Eğer görsel açıklaması verilmemişse AI üretsin
  const finalImageDescription = imageDescription || await generateImageDescription(grade, subject, topic, imageType)
  
  console.log('Görsel açıklaması:', finalImageDescription)
  
  // Görüntü için prompt oluştur
  const imagePrompt = createImagePrompt(imageType, subject, topic, finalImageDescription, grade)
  
  // Soru metni ve şıkları için AI'dan yardım al
  const questionPrompt = `Sen bir soru bankası yazarısın. ${grade}. sınıf ${subject} dersi için "${topic}" konusunda GÖRÜNTÜLÜ bir soru hazırla.

GÖRÜNTÜ AÇIKLAMASI: ${finalImageDescription}
GÖRÜNTÜ TİPİ: ${imageTypeDescriptions[imageType] || imageType}
ZORLUK: ${difficulty}

Bu görüntüye bakarak cevaplanabilecek bir soru hazırla. Soru, öğrencinin görüntüyü analiz etmesini gerektirsin.

SADECE JSON formatında yanıt ver:
{
  "question_text": "Yukarıdaki ${imageTypeDescriptions[imageType] || 'görüntüye'} göre... [soru metni]",
  "image_description": "${finalImageDescription}",
  "options": {
    "A": "Şık A metni",
    "B": "Şık B metni",
    "C": "Şık C metni",
    "D": "Şık D metni"${isHighSchool ? ',\n    "E": "Şık E metni"' : ''}
  },
  "correct_answer": "B",
  "explanation": "Doğru cevap B çünkü... [açıklama]",
  "bloom_level": "analiz"
}

KURALLAR:
- Soru görüntüyü analiz etmeyi gerektirsin
- Doğru cevap rastgele bir şık olsun (her zaman A veya B değil)
- Açıklama görüntüdeki detayları referans alsın
- bloom_level: bilgi, kavrama, uygulama, analiz, sentez, değerlendirme`

  try {
    console.log('Soru üretme prompt gönderiliyor...')
    
    // Soru metnini üret
    const result = await geminiModel.generateContent(questionPrompt)
    const response = await result.response
    let text = response.text()
    
    console.log('AI yanıtı (ilk 500 karakter):', text.substring(0, 500))
    
    // JSON'u temizle ve parse et
    text = text.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim()
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    
    if (!jsonMatch) {
      console.error('JSON bulunamadı! AI yanıtı:', text)
      throw new Error('JSON format bulunamadı')
    }
    
    let jsonStr = jsonMatch[0]
      .replace(/,(\s*[}\]])/g, '$1')
      .replace(/[\x00-\x1F\x7F]/g, ' ')
    
    console.log('Parse edilecek JSON (ilk 300 karakter):', jsonStr.substring(0, 300))
    
    const questionData = JSON.parse(jsonStr)
    
    console.log('Parse edilen soru:', {
      question_text: questionData.question_text?.substring(0, 50),
      options: questionData.options,
      correct_answer: questionData.correct_answer
    })
    
    return {
      question_text: questionData.question_text || 'Yukarıdaki görüntüye göre hangi ifade doğrudur?',
      image_prompt: imagePrompt,
      options: {
        A: questionData.options?.A || 'Şık A',
        B: questionData.options?.B || 'Şık B',
        C: questionData.options?.C || 'Şık C',
        D: questionData.options?.D || 'Şık D',
        ...(isHighSchool && { E: questionData.options?.E || 'Şık E' })
      },
      correct_answer: (questionData.correct_answer || 'A').toUpperCase() as 'A' | 'B' | 'C' | 'D' | 'E',
      explanation: questionData.explanation || '',
      difficulty,
      bloom_level: questionData.bloom_level || 'analiz'
    }
    
  } catch (error: any) {
    console.error('Görüntülü soru üretme hatası:', error)
    
    // Hata durumunda fallback soru döndür
    return {
      question_text: `Yukarıdaki ${imageTypeDescriptions[imageType] || 'görüntüye'} göre aşağıdaki ifadelerden hangisi doğrudur?`,
      image_prompt: imagePrompt,
      options: {
        A: 'I ve II',
        B: 'I ve III', 
        C: 'II ve III',
        D: 'I, II ve III',
        ...(isHighSchool && { E: 'Hiçbiri' })
      },
      correct_answer: 'C' as const,
      explanation: 'Görüntü analiz edilerek doğru cevap belirlenmelidir.',
      difficulty,
      bloom_level: 'analiz'
    }
  }
}

// 🆕 YENİ YAKLAŞIM: Önce soru üret, sonra soruya ÖZEL görsel üret
// Öğretmen geri dönütü: "Soru ile görsel uyumsuzluğu var. Görsel genel konuyu değil, sadece sorunun kapsamını göstermeli."

// Soruya özel görsel açıklaması üret
async function generateImageDescriptionForQuestion(
  questionText: string,
  options: { A: string; B: string; C: string; D: string; E?: string },
  correctAnswer: string,
  subject: string,
  topic: string,
  imageType: string
): Promise<string> {
  const prompt = `Sen bir eğitim görseli tasarımcısısın. Aşağıdaki soru için TAM UYUMLU bir görsel açıklaması oluştur.

SORU: ${questionText}

ŞIKLAR:
A) ${options.A}
B) ${options.B}
C) ${options.C}
D) ${options.D}
${options.E ? `E) ${options.E}` : ''}

DOĞRU CEVAP: ${correctAnswer}
DERS: ${subject}
KONU: ${topic}
GÖRSEL TİPİ: ${imageTypeDescriptions[imageType] || imageType}

ÖNEMLİ KURALLAR:
1. Görsel SADECE bu soruyu cevaplamak için gerekli bilgileri içermeli
2. Görsel tüm konuyu DEĞİL, sadece sorulan kısmı göstermeli
3. Doğru cevabı bulmak için gereken TÜM veriler görselde olmalı
4. Yanlış şıkları eleyebilmek için yeterli detay olmalı
5. Örneğin mitoz/mayoz sorusuysa, tüm aşamaları değil sadece sorulan aşama(ları) göster

SADECE görsel açıklamasını yaz, başka bir şey yazma. Türkçe yaz. Çok spesifik ol.`

  try {
    const result = await geminiModel.generateContent(prompt)
    const response = await result.response
    let text = response.text().trim()
    text = text.replace(/^["']|["']$/g, '').trim()
    
    console.log('Soruya özel görsel açıklaması:', text)
    return text
    
  } catch (error) {
    console.error('Soruya özel görsel açıklaması üretilemedi:', error)
    return `${topic} konusunda ${questionText.substring(0, 50)} sorusu için ${imageTypeDescriptions[imageType] || imageType}`
  }
}

// Görüntülü soru + görsel birlikte üret (YENİ AKIŞ)
export async function generateCompleteImageQuestion(
  grade: number,
  subject: string,
  topic: string,
  imageType: string,
  difficulty: Difficulty = 'medium',
  imageDescription?: string // Optional - artık dikkate alınmıyor, soru bazlı üretiliyor
): Promise<GeneratedImageQuestion> {
  const isHighSchool = grade >= 9
  
  console.log('🆕 YENİ AKIŞ: Önce soru, sonra soruya özel görsel üretiliyor...')
  
  // ADIM 1: Önce SADECE soru metnini ve şıklarını üret (görsel olmadan)
  const questionPrompt = `Sen bir soru bankası yazarısın. ${grade}. sınıf ${subject} dersi için "${topic}" konusunda bir soru hazırla.

ZORLUK: ${difficulty}
GÖRSEL TİPİ: ${imageTypeDescriptions[imageType] || imageType} (görsel sonra eklenecek)

Bu soru bir ${imageTypeDescriptions[imageType] || 'görsel'} eşliğinde sorulacak. Soruyu öyle yaz ki:
1. Görsel verisi analiz edilmesi gereksin
2. Soru çok genel değil, SPESİFİK bir durum/veri sorsun
3. Tüm konuyu değil, konunun BELİRLİ BİR PARÇASINI test etsin

SADECE JSON formatında yanıt ver:
{
  "question_text": "Yukarıdaki ${imageTypeDescriptions[imageType] || 'görüntüye'} göre... [SPESİFİK soru metni]",
  "specific_data_needed": "Bu soruyu cevaplamak için görselde GÖSTERİLMESİ GEREKEN spesifik veri/bilgi",
  "options": {
    "A": "Şık A metni",
    "B": "Şık B metni",
    "C": "Şık C metni",
    "D": "Şık D metni"${isHighSchool ? ',\n    "E": "Şık E metni"' : ''}
  },
  "correct_answer": "B",
  "explanation": "Doğru cevap B çünkü... [açıklama]",
  "bloom_level": "analiz"
}

KURALLAR:
- Soru SPESİFİK olsun, genel konuyu değil belirli bir durumu test etsin
- Doğru cevap rastgele bir şık olsun
- specific_data_needed alanı ÇOK ÖNEMLİ - görsel tam buna göre üretilecek`

  try {
    console.log('ADIM 1: Soru metni üretiliyor...')
    
    const result = await geminiModel.generateContent(questionPrompt)
    const response = await result.response
    let text = response.text()
    
    // JSON'u temizle ve parse et
    text = text.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim()
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    
    if (!jsonMatch) {
      throw new Error('JSON format bulunamadı')
    }
    
    let jsonStr = jsonMatch[0]
      .replace(/,(\s*[}\]])/g, '$1')
      .replace(/[\x00-\x1F\x7F]/g, ' ')
    
    const questionData = JSON.parse(jsonStr)
    
    console.log('Üretilen soru:', questionData.question_text?.substring(0, 80))
    console.log('Gerekli veri:', questionData.specific_data_needed)
    
    // ADIM 2: Soruya ÖZEL görsel açıklaması üret
    console.log('ADIM 2: Soruya özel görsel açıklaması üretiliyor...')
    
    const customImageDescription = await generateImageDescriptionForQuestion(
      questionData.question_text,
      questionData.options,
      questionData.correct_answer,
      subject,
      topic,
      imageType
    )
    
    // Görüntü için prompt oluştur
    const imagePrompt = createImagePrompt(imageType, subject, topic, customImageDescription, grade)
    
    // ADIM 3: Görsel üret
    console.log('ADIM 3: Soruya özel görsel üretiliyor...')
    
    let image_base64: string | undefined
    
    try {
      const imageResult = await generateEducationalImage(imagePrompt)
      
      if (imageResult) {
        image_base64 = `data:${imageResult.mimeType};base64,${imageResult.base64}`
        console.log('✅ Görsel başarıyla üretildi')
      }
    } catch (imageError) {
      console.error('Görsel üretimi başarısız:', imageError)
    }
    
    return {
      question_text: questionData.question_text || 'Yukarıdaki görüntüye göre hangi ifade doğrudur?',
      image_prompt: imagePrompt,
      image_base64,
      options: {
        A: questionData.options?.A || 'Şık A',
        B: questionData.options?.B || 'Şık B',
        C: questionData.options?.C || 'Şık C',
        D: questionData.options?.D || 'Şık D',
        ...(isHighSchool && { E: questionData.options?.E || 'Şık E' })
      },
      correct_answer: (questionData.correct_answer || 'A').toUpperCase() as 'A' | 'B' | 'C' | 'D' | 'E',
      explanation: questionData.explanation || '',
      difficulty,
      bloom_level: questionData.bloom_level || 'analiz'
    }
    
  } catch (error: any) {
    console.error('Görüntülü soru üretme hatası:', error)
    
    // Hata durumunda fallback
    const fallbackImageDesc = `${topic} konusunda basit bir ${imageTypeDescriptions[imageType] || 'görsel'}`
    const fallbackPrompt = createImagePrompt(imageType, subject, topic, fallbackImageDesc, grade)
    
    return {
      question_text: `Yukarıdaki ${imageTypeDescriptions[imageType] || 'görüntüye'} göre aşağıdaki ifadelerden hangisi doğrudur?`,
      image_prompt: fallbackPrompt,
      options: {
        A: 'I ve II',
        B: 'I ve III', 
        C: 'II ve III',
        D: 'I, II ve III',
        ...(isHighSchool && { E: 'Hiçbiri' })
      },
      correct_answer: 'C' as const,
      explanation: 'Görüntü analiz edilerek doğru cevap belirlenmelidir.',
      difficulty,
      bloom_level: 'analiz'
    }
  }
}
