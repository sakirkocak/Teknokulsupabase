import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

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
 * gerçek karakterlere dönüşüyor ve LaTeX kodları bozuluyor.
 * 
 * Örnek: "\\times" -> "\times" -> (tab)imes
 */
function fixLatexEscapes(obj: any): any {
  if (typeof obj === 'string') {
    let fixed = obj
    
    // Bozuk escape karakterlerini düzelt
    // \t (tab) -> \t (literal)
    fixed = fixed.replace(/\t/g, '\\t')
    // \r (carriage return) -> \r (literal)  
    fixed = fixed.replace(/\r/g, '\\r')
    // \f (form feed) -> \f (literal)
    fixed = fixed.replace(/\f/g, '\\f')
    // \n (newline) zaten MathRenderer'da <br> yapılıyor, dokunmuyoruz
    
    // Yaygın bozuk pattern'leri düzelt
    // "imes" -> "\times" (çarpma)
    fixed = fixed.replace(/imes/g, '\\times')
    // "rac{" -> "\frac{" (kesir)
    fixed = fixed.replace(/rac\{/g, '\\frac{')
    // "ightarrow" -> "\rightarrow" (ok)
    fixed = fixed.replace(/ightarrow/g, '\\rightarrow')
    // "ext{" -> "\text{" (metin)
    fixed = fixed.replace(/ext\{/g, '\\text{')
    // "sqrt{" -> "\sqrt{" (karekök)
    fixed = fixed.replace(/sqrt\{/g, '\\sqrt{')
    // "cdot" -> "\cdot" (nokta çarpım)
    fixed = fixed.replace(/([^\\])cdot/g, '$1\\cdot')
    // "div" -> "\div" (bölme) - sadece boşlukla çevrili olanlar
    fixed = fixed.replace(/ div /g, ' \\div ')
    // "pm" -> "\pm" (artı/eksi)
    fixed = fixed.replace(/ pm /g, ' \\pm ')
    // "leq" -> "\leq" (küçük eşit)
    fixed = fixed.replace(/([^\\])leq/g, '$1\\leq')
    // "geq" -> "\geq" (büyük eşit)
    fixed = fixed.replace(/([^\\])geq/g, '$1\\geq')
    // "neq" -> "\neq" (eşit değil)
    fixed = fixed.replace(/([^\\])neq/g, '$1\\neq')
    
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
  
  const difficultyPrompt = difficulty === 'auto' 
    ? 'Zorluk seviyesini sen belirle (easy, medium, hard)' 
    : `Zorluk seviyesi: ${difficulty}`

  const prompt = `Sen bir eğitim uzmanısın. Türkçe olarak ${subject} dersi için "${topic}" konusunda ${count} adet soru üret.

Soru tipleri: ${selectedTypes}
${difficultyPrompt}

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
- explanation her zaman doğru cevabı içermeli`

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

Planı Türkçe, samimi ama profesyonel bir dilde yaz. 
${studentName}'e direkt hitap et.
Gerçekçi ve uygulanabilir hedefler koy.
Motivasyon verici ama abartısız ol.`

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

Raporu Türkçe, profesyonel ve motive edici bir dilde yaz.
Emoji kullan ama abartma.
${studentName}'e güven ver ama gerçekçi ol.
Somut ve uygulanabilir öneriler sun.`

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
• Pozitif ve motive edici dil
• Emoji kullanabilirsin (1-2 tane)

Örnek format:
"${studentName}, [konu] konusunda zorlanıyorsun. [Somut öneri]. [Motive edici kapanış]."

ŞİMDİ ÖNERİNİ YAZ:`

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
   • ${grade >= 11 ? 'Modern fizik ve dalga mekaniği' : 'Kuvvet, hareket ve enerji temelleri'}
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

export async function generateCurriculumQuestions(
  grade: number,
  subject: string,
  topic: string,
  learningOutcome: string,
  difficulty: Difficulty,
  count: number = 5,
  lang: 'tr' | 'en' = 'tr'  // 🌍 Questly Global için dil desteği
): Promise<CurriculumQuestion[]> {
  // Sınıf seviyesine göre şık sayısı (LGS 4, YKS 5)
  const isHighSchool = grade >= 9
  const optionCount = isHighSchool ? 5 : 4
  
  // Sınav bağlamı
  const examContext = getExamContext(grade)
  
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

  // 🌍 QUESTLY GLOBAL: Dile göre prompt oluştur
  const prompt = lang === 'en' 
    ? generateEnglishPrompt(grade, subject, topic, learningOutcome, difficulty, count, optionCount, isHighSchool, bloomPriority)
    : `SEN TÜRKİYE'NİN EN İYİ SORU BANKASI YAZARISIN. ${examContext.examType} formatında mükemmel sorular üreteceksin.

════════════════════════════════════════════════════════════
🎯 GÖREV: ${grade}. SINIF ${subject.toUpperCase()} SORUSU ÜRET
════════════════════════════════════════════════════════════

📚 KAZANIM BİLGİLERİ:
┌─────────────────────────────────────────────────────────┐
│ Sınıf: ${grade}. Sınıf                                    
│ Ders: ${subject}                                          
│ Konu: ${topic}                                            
│ Kazanım: "${learningOutcome}"                              
│ Zorluk: ${difficulty.toUpperCase()} - ${difficultyDetails[difficulty]}
│ Format: ${examContext.format}                             
│ Üretilecek: ${count} soru                                 
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
   ✓ ${grade}. sınıf Türkçe seviyesine uygun
   ✓ Kazanımı doğrudan ölçen
   ✓ Gereksiz bilgi içermeyen
   ${grade <= 4 ? '✓ Kısa ve basit cümleler' : grade >= 9 ? '✓ Akademik dil kullanılabilir' : '✓ Orta uzunlukta, net ifadeler'}

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
{"questions":[{"question_text":"Soru metni","options":{"A":"Şık A","B":"Şık B","C":"Şık C","D":"Şık D"${isHighSchool ? ',"E":"Şık E"' : ''}},"correct_answer":"B","explanation":"Açıklama","difficulty":"${difficulty}","bloom_level":"${bloomPriority[difficulty][0]}"}]}

⛔ YASAK:
• JSON dışında metin yazma
• Trailing comma (son elemandan sonra virgül)
• Tek backslash (LaTeX için çift \\\\ kullan)
• "Hiçbiri" veya "Hepsi" şıkkı
• Aynı harfin sürekli doğru cevap olması

🚫 MEDYA KISITLAMASI (ÇOK ÖNEMLİ):
• Resim, görsel, fotoğraf, tablo, grafik içeren sorular ÜRETME
• Ses, dinleme, video içeren sorular ÜRETME
• "Resimde ne görüyorsun?", "Aşağıdaki tabloya göre...", "Grafiğe bak..." gibi ifadeler KULLANMA
• "Dinlediğin metne göre...", "Videoda gördüğün..." gibi ifadeler KULLANMA
• Tüm sorular SADECE METİN tabanlı olmalı
• Görsel materyal gerektiren kazanımlar için metin açıklaması yap (örn: "Ali'nin boyu 150 cm, ayakkabısı 40 numara..." şeklinde)

✅ ZORUNLU:
• correct_answer: ${isHighSchool ? 'A, B, C, D veya E' : 'A, B, C veya D'}
• bloom_level: bilgi, kavrama, uygulama, analiz, sentez, değerlendirme
• Türkçe karakterler: ş, ğ, ü, ö, ı, ç, Ş, Ğ, Ü, Ö, İ, Ç

ŞİMDİ ${count} ADET MÜKEMMEL ${subject.toUpperCase()} SORUSU ÜRET:`

  try {
    console.log(`AI Soru Üretimi başlatılıyor: ${grade}. Sınıf ${subject} - ${topic}`)
    
    const result = await geminiModel.generateContent(prompt)
    const response = await result.response
    let text = response.text()
    
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
    
    // 🛡️ Gelişmiş JSON temizleme
    jsonStr = jsonStr
      .replace(/,(\s*[}\]])/g, '$1') // Trailing commas
      .replace(/[\x00-\x1F\x7F]/g, ' ') // Control characters
      .replace(/\n/g, ' ')
      .replace(/\r/g, '')
      .replace(/\t/g, ' ')
      .replace(/\u00A0/g, ' ') // Non-breaking space
      .replace(/\u2028/g, ' ') // Line separator
      .replace(/\u2029/g, ' ') // Paragraph separator
      .replace(/\s+/g, ' ') // Multiple spaces to single
    
    // LaTeX backslash'lerini düzelt - JSON'da tek \ geçersiz
    // \frac, \sqrt, \cdot, \times, \div gibi LaTeX komutlarını çift \\ yap
    jsonStr = jsonStr.replace(/\\([a-zA-Z]+)/g, (match, cmd) => {
      // Zaten valid JSON escape sequence ise dokunma
      const validEscapes = ['n', 'r', 't', 'b', 'f', 'u']
      if (validEscapes.includes(cmd) || cmd.startsWith('u')) {
        return match
      }
      // LaTeX komutu ise çift backslash yap
      return '\\\\' + cmd
    })
    
    // Tek kalan backslash'leri de düzelt (örn: \$ gibi)
    jsonStr = jsonStr.replace(/\\([^\\nrtbfu"])/g, '\\\\$1')
    
    // 🛡️ Kırık Unicode karakterleri temizle
    jsonStr = jsonStr.replace(/[\uFFFD\uFFFE\uFFFF]/g, '')
    
    // 🛡️ Çoklu parse denemesi
    let data: any = null
    let parseAttempts = [
      () => JSON.parse(jsonStr),
      // Trailing comma farklı pattern
      () => JSON.parse(jsonStr.replace(/,\s*}/g, '}').replace(/,\s*]/g, ']')),
      // Tek tırnak varsa çift tırnağa çevir
      () => JSON.parse(jsonStr.replace(/'/g, '"')),
    ]
    
    let lastParseError: any = null
    for (const attempt of parseAttempts) {
      try {
        data = attempt()
        break
      } catch (e) {
        lastParseError = e
      }
    }
    
    if (!data) {
      console.error('JSON Parse Hatası (tüm denemeler başarısız):', lastParseError?.message)
      console.error('Temizlenmiş JSON (ilk 800 karakter):', jsonStr.substring(0, 800))
      throw new Error(`JSON parse hatası: ${lastParseError?.message}. AI yanıtı geçersiz format içeriyor.`)
    }
    
    const questions = data.questions || []
    
    console.log(`${questions.length} soru başarıyla parse edildi`)
    
    // 🛡️ Soruları doğrula ve düzelt - eksik alanları kontrol et
    return questions.map((q: any, idx: number) => {
      // Zorunlu alanlar kontrolü
      if (!q.question_text && !q.question) {
        console.warn(`Soru ${idx + 1}: question_text boş, atlanıyor`)
        return null
      }
      
      return {
        question_text: String(q.question_text || q.question || '').trim(),
        options: {
          A: String(q.options?.A || q.options?.a || '').trim(),
          B: String(q.options?.B || q.options?.b || '').trim(),
          C: String(q.options?.C || q.options?.c || '').trim(),
          D: String(q.options?.D || q.options?.d || '').trim(),
          ...(isHighSchool && { E: String(q.options?.E || q.options?.e || '').trim() })
        },
        correct_answer: String(q.correct_answer || q.answer || 'A').toUpperCase().charAt(0),
        explanation: String(q.explanation || '').trim(),
        difficulty: q.difficulty || difficulty,
        bloom_level: q.bloom_level || 'kavrama'
      }
    }).filter(Boolean) as CurriculumQuestion[]
  } catch (error: any) {
    console.error('Müfredat sorusu üretme hatası:', error)
    throw error
  }
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

