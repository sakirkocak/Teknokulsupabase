export interface StudentContext {
  name: string
  grade: number
  targetExam: string
  totalQuestions: number
  totalCorrect: number
  accuracy: number
  currentStreak: number
  maxStreak: number
  totalPoints: number
  weeklyActivity: {
    totalQuestions: number
    correctCount: number
    wrongCount: number
  }
  subjects: {
    [key: string]: {
      correct: number
      wrong: number
      accuracy: number
    }
  }
  weakSubjects: string[]
  strongSubjects: string[]
  daysUntilExam?: number
  // Deneme sonuçları (opsiyonel)
  examStats?: {
    totalExams: number
    avgNet: number
    netTrend: 'up' | 'down' | 'stable'
  }
}

export function buildSystemPrompt(context: StudentContext): string {
  const examInfo = context.daysUntilExam 
    ? `Sınava ${context.daysUntilExam} gün kaldı.` 
    : ''
  
  const weakSubjectsText = context.weakSubjects.length > 0
    ? `Zayıf olduğu dersler/konular: ${context.weakSubjects.join(', ')}`
    : 'Tüm derslerde dengeli performans gösteriyor.'
  
  const strongSubjectsText = context.strongSubjects.length > 0
    ? `Güçlü olduğu dersler/konular: ${context.strongSubjects.join(', ')}`
    : ''

  // Deneme istatistikleri
  const examStatsText = context.examStats && context.examStats.totalExams > 0
    ? `
📝 DENEME SONUÇLARI:
- Yüklenen deneme sayısı: ${context.examStats.totalExams}
- Ortalama net: ${context.examStats.avgNet.toFixed(1)}
- Son trend: ${context.examStats.netTrend === 'up' ? '📈 Yükselişte' : context.examStats.netTrend === 'down' ? '📉 Düşüşte' : '➡️ Stabil'}`
    : ''

  return `Sen Teknokul platformunun AI Koçusun. Adın "Tekno" ve öğrencilere yardım etmek için buradasın.

📋 ÖĞRENCİ PROFİLİ:
- İsim: ${context.name}
- Sınıf: ${context.grade}. sınıf
- Hedef Sınav: ${context.targetExam}
${examInfo}

📊 SORU BANKASI İSTATİSTİKLERİ:
- Toplam çözülen soru: ${context.totalQuestions}
- Doğruluk oranı: %${context.accuracy}
- Mevcut seri: ${context.currentStreak} gün
- En uzun seri: ${context.maxStreak} gün
- Toplam XP: ${context.totalPoints}
${examStatsText}

📈 SON 7 GÜN:
- Çözülen soru: ${context.weeklyActivity.totalQuestions}
- Doğru: ${context.weeklyActivity.correctCount}
- Yanlış: ${context.weeklyActivity.wrongCount}

🎯 ANALİZ (Soru Bankası + Denemeler):
${weakSubjectsText}
${strongSubjectsText}

💡 DAVRANIŞ KURALLARI:
1. Her zaman Türkçe yanıt ver
2. Kısa ve öz ol (maksimum 3-4 cümle)
3. Samimi ve arkadaşça konuş ("sen" diye hitap et)
4. Motive edici ve pozitif ol
5. Somut öneriler ver
6. Emoji kullanabilirsin ama abartma
7. Öğrencinin zayıf yönlerini yapıcı şekilde ele al
8. Başarılarını kutla
9. Seri ve XP sisteminden bahsedebilirsin
10. Gerektiğinde görev veya hedef önerebilirsin

⚠️ YAPMAMAN GEREKENLER:
- Çok uzun yanıtlar verme
- Olumsuz veya eleştirel olma
- Gereksiz teknik detaylara girme
- Öğrenciyi bunaltma`
}

export function buildChatPrompt(systemPrompt: string, userMessage: string, conversationHistory: Array<{role: string, content: string}>): string {
  let historyText = ''
  
  // Son 10 mesajı al
  const recentHistory = conversationHistory.slice(-10)
  
  if (recentHistory.length > 0) {
    historyText = '\n\n📝 SON KONUŞMALAR:\n'
    recentHistory.forEach(msg => {
      const role = msg.role === 'user' ? 'Öğrenci' : 'AI Koç'
      historyText += `${role}: ${msg.content}\n`
    })
  }
  
  return `${systemPrompt}${historyText}

Öğrenci şimdi şunu söylüyor: "${userMessage}"

Yanıtın:`
}

export function getMotivationalMessages(context: StudentContext): string[] {
  const messages: string[] = []
  
  // Seri ile ilgili
  if (context.currentStreak > 0 && context.currentStreak < 7) {
    messages.push(`🔥 ${context.currentStreak} günlük serin var! Devam et, 7 güne ulaşınca rozet kazanırsın!`)
  } else if (context.currentStreak >= 7) {
    messages.push(`🏆 Harika! ${context.currentStreak} günlük serin var, bu muhteşem!`)
  } else {
    messages.push(`💪 Bugün yeni bir seri başlatmak için harika bir gün!`)
  }
  
  // Performans ile ilgili
  if (context.accuracy >= 80) {
    messages.push(`⭐ %${context.accuracy} doğruluk oranın mükemmel! Böyle devam et!`)
  } else if (context.accuracy >= 60) {
    messages.push(`📈 %${context.accuracy} doğruluk oranın iyi, biraz daha pratikle %80'i geçersin!`)
  } else if (context.accuracy > 0) {
    messages.push(`🎯 Her yanlış seni doğruya bir adım yaklaştırır. Pratik yapmaya devam!`)
  }
  
  // Zayıf dersler
  if (context.weakSubjects.length > 0) {
    messages.push(`📚 ${context.weakSubjects[0]} dersine biraz daha odaklansan harika olur!`)
  }
  
  // Güçlü dersler
  if (context.strongSubjects.length > 0) {
    messages.push(`💎 ${context.strongSubjects[0]} dersinde çok iyisin, diğer derslere de bu enerjiyi taşı!`)
  }
  
  return messages
}

export const subjectNames: Record<string, string> = {
  'matematik': 'Matematik',
  'turkce': 'Türkçe',
  'fen': 'Fen Bilimleri',
  'sosyal': 'Sosyal Bilgiler',
  'ingilizce': 'İngilizce',
  'din': 'Din Kültürü',
  'inkilap': 'İnkılap Tarihi'
}

export function getSubjectName(code: string): string {
  return subjectNames[code] || code
}

