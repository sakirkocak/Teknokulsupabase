import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

export const geminiModel = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

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
      return data.questions as GeneratedQuestion[]
    } catch (parseError) {
      // İkinci deneme - daha agresif temizleme
      console.log('İlk parse başarısız, alternatif yöntem deneniyor...')
      
      // Tüm newline'ları space yap
      jsonStr = jsonStr.replace(/\n/g, ' ').replace(/\r/g, '')
      
      // Çoklu boşlukları tek boşluğa indir
      jsonStr = jsonStr.replace(/\s+/g, ' ')
      
      try {
        const data = JSON.parse(jsonStr)
        return data.questions as GeneratedQuestion[]
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
  count: number = 5
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

  const prompt = `SEN TÜRKİYE'NİN EN İYİ SORU BANKASI YAZARISIN. ${examContext.examType} formatında mükemmel sorular üreteceksin.

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
    
    // JSON temizleme
    jsonStr = jsonStr
      .replace(/,(\s*[}\]])/g, '$1') // Trailing commas
      .replace(/[\x00-\x1F\x7F]/g, ' ') // Control characters
      .replace(/\n/g, ' ')
      .replace(/\r/g, '')
      .replace(/\t/g, ' ')
    
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
    
    try {
      const data = JSON.parse(jsonStr)
      const questions = data.questions || []
      
      console.log(`${questions.length} soru başarıyla parse edildi`)
      
      // Soruları doğrula ve düzelt
      return questions.map((q: any) => ({
        question_text: q.question_text || q.question || '',
        options: {
          A: q.options?.A || q.options?.a || '',
          B: q.options?.B || q.options?.b || '',
          C: q.options?.C || q.options?.c || '',
          D: q.options?.D || q.options?.d || '',
          ...(isHighSchool && { E: q.options?.E || q.options?.e || '' })
        },
        correct_answer: (q.correct_answer || q.answer || 'A').toUpperCase(),
        explanation: q.explanation || '',
        difficulty: q.difficulty || difficulty,
        bloom_level: q.bloom_level || 'kavrama'
      })) as CurriculumQuestion[]
      
    } catch (parseError: any) {
      console.error('JSON Parse Hatası:', parseError.message)
      console.error('Temizlenmiş JSON:', jsonStr.substring(0, 500))
      
      // Son çare: Regex ile soruları çıkarmayı dene
      try {
        const questionMatches = jsonStr.match(/"question_text"\s*:\s*"([^"]+)"/g)
        if (questionMatches && questionMatches.length > 0) {
          console.log('Regex ile soru bulundu, manuel parse deneniyor...')
          // Manuel parse çok karmaşık, hata fırlat
        }
      } catch (e) {
        // Ignore
      }
      
      throw new Error(`JSON parse hatası: ${parseError.message}. Lütfen tekrar deneyin.`)
    }
  } catch (error: any) {
    console.error('Müfredat sorusu üretme hatası:', error)
    throw error
  }
}

