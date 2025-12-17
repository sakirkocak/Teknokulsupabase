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

// Çalışma planı üretici
export async function generateStudyPlan(
  studentName: string,
  gradeLevel: string,
  targetExam: string,
  weakSubjects: string[],
  strongSubjects: string[],
  hoursPerDay: number,
  weeks: number
): Promise<string> {
  const prompt = `Sen bir eğitim koçusun. Bir öğrenci için kişiselleştirilmiş çalışma planı hazırla.

Öğrenci Bilgileri:
- İsim: ${studentName}
- Sınıf: ${gradeLevel}
- Hedef Sınav: ${targetExam}
- Zayıf Konular: ${weakSubjects.join(', ') || 'Belirtilmemiş'}
- Güçlü Konular: ${strongSubjects.join(', ') || 'Belirtilmemiş'}
- Günlük Çalışma Süresi: ${hoursPerDay} saat
- Plan Süresi: ${weeks} hafta

Lütfen şunları içeren detaylı bir plan hazırla:
1. Haftalık çalışma programı
2. Günlük görev listesi
3. Konu önceliklendirmesi
4. Mola ve dinlenme önerileri
5. Motivasyon ipuçları

Planı Türkçe ve markdown formatında hazırla.`

  try {
    const result = await geminiModel.generateContent(prompt)
    const response = await result.response
    return response.text()
  } catch (error) {
    console.error('Plan üretme hatası:', error)
    throw error
  }
}

// Öğrenci raporu üretici
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
  // Soru performansı bölümü
  let questionSection = ''
  if (performanceData && performanceData.totalQuestions > 0) {
    questionSection = `
## Soru Çözme Performansı:
- Toplam Çözülen Soru: ${performanceData.totalQuestions}
- Doğru Cevap: ${performanceData.correctAnswers}
- Başarı Oranı: ${((performanceData.correctAnswers / performanceData.totalQuestions) * 100).toFixed(1)}%
- Trend: ${performanceData.recentTrend === 'improving' ? 'Yükseliyor ↗' : performanceData.recentTrend === 'stable' ? 'Sabit →' : 'Düşüyor ↘'}

Ders Bazlı Performans:
${performanceData.subjectPerformance.map(s => `- ${s.subject}: ${s.correct}/${s.total} (${((s.correct/s.total)*100).toFixed(1)}%)`).join('\n')}`
  }

  // Görev performansı bölümü
  let taskSection = ''
  if (taskData && taskData.totalTasks > 0) {
    const completionRate = ((taskData.completedTasks / taskData.totalTasks) * 100).toFixed(0)
    const statusText = {
      'completed': 'Tamamlandı',
      'submitted': 'Teslim Edildi',
      'in_progress': 'Devam Ediyor',
      'pending': 'Bekliyor'
    }
    taskSection = `
## Görev Performansı:
- Toplam Atanan Görev: ${taskData.totalTasks}
- Tamamlanan: ${taskData.completedTasks} (${completionRate}%)
- Bekleyen: ${taskData.pendingTasks}
- Ortalama Puan: ${taskData.averageScore > 0 ? taskData.averageScore + '/100' : 'Henüz puanlanmamış'}

Son Görevler:
${taskData.recentTasks.map(t => `- "${t.title}" (${t.type}) - ${statusText[t.status as keyof typeof statusText] || t.status}${t.score !== null ? ` - Puan: ${t.score}` : ''}`).join('\n')}`
  }

  const prompt = `Sen bir eğitim koçusun ve danışmanısın. Bir öğrencinin detaylı performans raporunu hazırla.

# Öğrenci Bilgileri:
- İsim: ${studentName}
- Sınıf: ${gradeLevel}
- Hedef Sınav: ${targetExam}

${questionSection}

${taskSection}

Lütfen şunları içeren kapsamlı bir rapor hazırla:
1. **Genel Değerlendirme** - Öğrencinin genel durumu hakkında kısa bir özet
2. **Güçlü Yönler** - Öğrencinin iyi olduğu alanlar (hem soru çözme hem görev tamamlama açısından)
3. **Geliştirilmesi Gereken Alanlar** - Hangi konularda daha fazla çalışması gerekiyor
4. **Görev Disiplini Değerlendirmesi** - Görevleri zamanında tamamlama, kalitesi vb.
5. **Öneriler ve Aksiyon Planı** - Somut adımlar ve öneriler
6. **Veli İçin Özet** - 2-3 cümlelik kısa özet

Raporu Türkçe ve profesyonel bir dilde hazırla. Markdown formatında olsun. Pozitif ve motive edici bir ton kullan ama gerçekçi ol.`

  try {
    const result = await geminiModel.generateContent(prompt)
    const response = await result.response
    return response.text()
  } catch (error) {
    console.error('Rapor üretme hatası:', error)
    throw error
  }
}

// AI önerisi üretici
export async function generateAIRecommendation(
  studentName: string,
  weakTopics: string[],
  recentMistakes: string[]
): Promise<string> {
  const prompt = `Bir öğrenci için kısa ve öz çalışma önerisi hazırla.

Öğrenci: ${studentName}
Zayıf Konular: ${weakTopics.join(', ')}
Son Hatalar: ${recentMistakes.join(', ')}

Maksimum 3-4 cümle ile pratik öneri ver. Türkçe yaz.`

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
// MEB Müfredatına Uygun, Kazanım Odaklı Sorular
// Türkiye Yüzyılı Maarif Modeli + 2018 Programı
// =====================================================

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
  
  // Sınav tipi belirleme
  const examType = grade === 8 ? 'LGS' : grade >= 11 ? 'YKS (TYT/AYT)' : 'MEB Kazanım Değerlendirme'
  
  // Sınıf seviyesi açıklaması
  const levelDescription = grade <= 4 
    ? 'İlkokul - somut düşünme, görsellik ağırlıklı, basit ve anlaşılır dil' 
    : grade <= 8 
    ? 'Ortaokul - soyut düşünmeye geçiş, çıkarım yapma, analiz becerisi' 
    : 'Lise - ileri düzey analiz, sentez, değerlendirme, akademik dil'
  
  // Zorluk açıklaması
  const difficultyDetails: Record<Difficulty, string> = {
    easy: 'Temel kavram soruları - doğrudan bilgi hatırlama ve basit uygulama',
    medium: 'Orta düzey sorular - kavrama, yorumlama ve iki adımlı işlemler',
    hard: 'İleri düzey sorular - analiz, çoklu adım, yorum gerektiren sorular',
    legendary: 'Olimpiyat/yarışma düzeyi - sentez, değerlendirme, özgün düşünme'
  }

  // Bloom Taksonomisi açıklaması
  const bloomLevels = {
    bilgi: 'Bilgiyi hatırlama (tanıma, listeleme)',
    kavrama: 'Anlama ve yorumlama (açıklama, örnekleme)',
    uygulama: 'Bilgiyi yeni durumlarda kullanma (hesaplama, çözme)',
    analiz: 'Parçalara ayırma, ilişki kurma (karşılaştırma, sınıflandırma)',
    sentez: 'Yeni ürün oluşturma (tasarlama, planlama)',
    değerlendirme: 'Yargıda bulunma (eleştirme, savunma)'
  }

  const prompt = `SEN BİR MEB SORU BANKASI UZMANISIN. Türkiye eğitim sistemine uygun, ${examType} formatında sorular üreteceksin.

═══════════════════════════════════════════════════════
📚 HEDEF KAZANIM BİLGİLERİ
═══════════════════════════════════════════════════════
• Sınıf: ${grade}. Sınıf (${levelDescription})
• Ders: ${subject}
• Konu: ${topic}
• Kazanım: "${learningOutcome}"
• Zorluk: ${difficulty.toUpperCase()} - ${difficultyDetails[difficulty]}
• Soru Sayısı: ${count}
• Şık Sayısı: ${optionCount} (${isHighSchool ? 'YKS Formatı A-E' : 'LGS Formatı A-D'})

═══════════════════════════════════════════════════════
📋 SORU TASARIM KURALLARI
═══════════════════════════════════════════════════════

1️⃣ SORU METNİ:
   • Kazanımla doğrudan ilişkili olmalı
   • ${grade}. sınıf öğrencisinin anlayacağı dilde
   • Net, açık ve tek anlama gelecek şekilde
   • Gereksiz detay içermemeli
   • Problem kurgusu gerçek hayatla ilişkili olabilir

2️⃣ ŞIKLAR:
   • Tüm şıklar mantıklı ve olası görünmeli
   • Yanlış şıklar yaygın öğrenci hatalarını yansıtmalı
   • "Hiçbiri" veya "Hepsi" şıkkı KULLANMA
   • Şıklar birbirine yakın uzunlukta olmalı
   • Doğru cevap rastgele dağıtılmalı (her zaman B olmasın)

3️⃣ BLOOM TAKSONOMİSİ:
   ${Object.entries(bloomLevels).map(([k,v]) => `   • ${k}: ${v}`).join('\n')}
   
   Zorluk ${difficulty} için öncelikli kullan:
   ${difficulty === 'easy' ? '• bilgi, kavrama' : 
     difficulty === 'medium' ? '• kavrama, uygulama, analiz' : 
     difficulty === 'hard' ? '• analiz, sentez' : 
     '• sentez, değerlendirme'}

4️⃣ AÇIKLAMA:
   • Neden doğru cevabın o olduğunu açıkla
   • Yanlış şıkların neden yanlış olduğuna değin
   • Öğretici ve bilgilendirici ol
   • Kısa ama kapsamlı

═══════════════════════════════════════════════════════
📐 MATEMATİK / FEN FORMÜLLEME
═══════════════════════════════════════════════════════
Matematiksel ifadeler için LaTeX kullan, $$...$$ içinde yaz.
JSON için backslash'i ÇİFT yaz (\\\\):

• Kesir: $$\\\\frac{a}{b}$$
• Karekök: $$\\\\sqrt{x}$$
• Üs: $$x^{2}$$, $$a^{n}$$
• Alt indis: $$x_{1}$$
• Çarpı: $$\\\\times$$ veya $$\\\\cdot$$
• Bölme: $$\\\\div$$
• Pi: $$\\\\pi$$
• Eşitsizlik: $$\\\\geq$$, $$\\\\leq$$, $$\\\\neq$$
• Toplam: $$\\\\sum$$
• Limit: $$\\\\lim$$
• İntegral: $$\\\\int$$

═══════════════════════════════════════════════════════
📤 ÇIKTI FORMATI - SADECE JSON
═══════════════════════════════════════════════════════
{"questions":[{"question_text":"...","options":{"A":"...","B":"...","C":"...","D":"..."${isHighSchool ? ',"E":"..."' : ''}},"correct_answer":"A","explanation":"...","difficulty":"${difficulty}","bloom_level":"kavrama"}]}

⚠️ ÖNEMLİ:
• SADECE JSON yaz, başka açıklama YAZMA
• JSON syntax hatası YAPMA
• Türkçe karakterleri düzgün kullan (ş,ğ,ü,ö,ı,ç)
• correct_answer sadece harf: ${isHighSchool ? 'A, B, C, D veya E' : 'A, B, C veya D'}
• bloom_level: bilgi, kavrama, uygulama, analiz, sentez, değerlendirme

ŞİMDİ ${count} ADET "${topic}" KONUSUNDA "${learningOutcome}" KAZANIMINA UYGUN SORU ÜRET:`

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

