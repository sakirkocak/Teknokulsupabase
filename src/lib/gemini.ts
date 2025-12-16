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
// MEB müfredatına uygun, profesyonel kalitede sorular
// =====================================================

export async function generateCurriculumQuestions(
  grade: number,
  subject: string,
  topic: string,
  learningOutcome: string,
  difficulty: Difficulty,
  count: number = 5
): Promise<CurriculumQuestion[]> {
  // Sınıf seviyesine göre şık sayısı
  const isHighSchool = grade >= 9
  const optionCount = isHighSchool ? 5 : 4
  const optionLetters = isHighSchool ? 'A, B, C, D, E' : 'A, B, C, D'
  
  // Sınıf seviyesine göre dil ayarı
  const languageLevel = grade <= 4 
    ? 'çok basit ve anlaşılır, kısa cümleler' 
    : grade <= 8 
      ? 'orta düzey, açık ve net' 
      : 'akademik ve formal'
  
  // Zorluk açıklaması
  const difficultyDescriptions: Record<Difficulty, string> = {
    easy: 'Temel düzey - Doğrudan bilgi hatırlama, basit kavram soruları',
    medium: 'Orta düzey - Kavrama ve uygulama gerektiren sorular',
    hard: 'Zor - Analiz ve sentez gerektiren, çok adımlı problemler',
    legendary: 'Efsane - En üst düzey, yarışma/olimpiyat seviyesi sorular'
  }

  const prompt = `Sen Türkiye'nin en iyi soru yazarısın. MEB müfredatına %100 uygun, profesyonel kalitede ${count} adet çoktan seçmeli soru üreteceksin.

═══════════════════════════════════════════════════════════════
📚 SORU BİLGİLERİ
═══════════════════════════════════════════════════════════════
• Sınıf: ${grade}. Sınıf ${grade <= 4 ? '(İlkokul)' : grade <= 8 ? '(Ortaokul)' : '(Lise)'}
• Ders: ${subject}
• Konu: ${topic}
• Kazanım: ${learningOutcome}
• Zorluk: ${difficulty.toUpperCase()} - ${difficultyDescriptions[difficulty]}
• Şık Sayısı: ${optionCount} (${optionLetters})
• Dil Seviyesi: ${languageLevel}

═══════════════════════════════════════════════════════════════
🎯 BLOOM TAKSONOMİSİ SEVİYELERİ
═══════════════════════════════════════════════════════════════
Her soru şu seviyelerden birini hedeflemeli:
1. BİLGİ: Ezbere dayalı, tanım/kavram hatırlama
2. KAVRAMA: Açıklama, yorumlama, örneklendirme
3. UYGULAMA: Bilgiyi yeni durumlarda kullanma
4. ANALİZ: Parçalara ayırma, ilişki kurma, karşılaştırma
5. SENTEZ: Birleştirme, yeni ürün oluşturma
6. DEĞERLENDİRME: Yargılama, eleştirme, karar verme

═══════════════════════════════════════════════════════════════
📝 SORU YAZIM KURALLARI (KRİTİK!)
═══════════════════════════════════════════════════════════════
✅ YAPILMASI GEREKENLER:
• Soru kökü açık, net ve tek anlama gelmeli
• Soru ${languageLevel} olmalı
• Gerçek hayat bağlamı ve örnekler kullan
• Her şık mantıklı ve tutarlı uzunlukta olmalı
• Doğru cevap kesinlikle tek olmalı
• Açıklama detaylı ve öğretici olmalı

❌ YAPILMAMASI GEREKENLER:
• "Aşağıdakilerden hangisi yanlıştır?" gibi olumsuz soru kökü KULLANMA
• "Hepsi", "Hiçbiri" gibi şıklar KOYMA
• Çok uzun veya karmaşık cümleler KURMA
• Şıklarda ipucu veren kelimeler KULLANMA
• Birbirine çok benzeyen şıklar YAZMA

═══════════════════════════════════════════════════════════════
🔥 ÇELDİRİCİ KALİTESİ (ÇOK ÖNEMLİ!)
═══════════════════════════════════════════════════════════════
Her yanlış şık (çeldirici):
• Mantıklı görünmeli ama yanlış olmalı
• Yaygın öğrenci hatalarını hedeflemeli
• Doğru cevapla aynı kategoriden olmalı
• Rastgele veya saçma olmamalı
• Doğru cevabı bilmeyeni cezbetmeli

═══════════════════════════════════════════════════════════════
📋 JSON FORMAT (SADECE BU FORMATTA YANIT VER!)
═══════════════════════════════════════════════════════════════

{"questions":[
  {
    "question_text": "Soru metni buraya",
    "options": {
      "A": "Birinci şık",
      "B": "İkinci şık",
      "C": "Üçüncü şık",
      "D": "Dördüncü şık"${isHighSchool ? ',\n      "E": "Beşinci şık"' : ''}
    },
    "correct_answer": "${isHighSchool ? 'A/B/C/D/E' : 'A/B/C/D'}",
    "explanation": "Doğru cevap X'dir çünkü... Diğer şıkların neden yanlış olduğu...",
    "difficulty": "${difficulty}",
    "bloom_level": "bilgi/kavrama/uygulama/analiz/sentez/değerlendirme"
  }
]}

═══════════════════════════════════════════════════════════════
⚠️ KRİTİK KURALLAR
═══════════════════════════════════════════════════════════════
• SADECE JSON döndür, başka hiçbir metin ekleme
• correct_answer sadece harf olmalı (${optionLetters})
• bloom_level değerleri: bilgi, kavrama, uygulama, analiz, sentez, değerlendirme
• Tüm ${count} soruyu üret
• Her soru benzersiz ve farklı açıdan sormalı
• Açıklamalar öğretici ve detaylı olmalı

Şimdi ${count} adet mükemmel kalitede soru üret:`

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
      return data.questions as CurriculumQuestion[]
    } catch (parseError) {
      // İkinci deneme - daha agresif temizleme
      console.log('İlk parse başarısız, alternatif yöntem deneniyor...')
      
      jsonStr = jsonStr.replace(/\n/g, ' ').replace(/\r/g, '')
      jsonStr = jsonStr.replace(/\s+/g, ' ')
      
      try {
        const data = JSON.parse(jsonStr)
        return data.questions as CurriculumQuestion[]
      } catch (secondError) {
        console.error('JSON parse hatası, raw text:', text.substring(0, 500))
        throw new Error('AI yanıtı geçerli JSON formatında değil. Lütfen tekrar deneyin.')
      }
    }
  } catch (error) {
    console.error('Müfredat sorusu üretme hatası:', error)
    throw error
  }
}

