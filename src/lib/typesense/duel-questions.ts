import { getTypesenseBrowserClient, COLLECTIONS } from './browser-client'

/**
 * Düello Sorusu Tipi
 */
export interface DuelQuestion {
  id: string
  question_id: string
  question_text: string
  option_a: string
  option_b: string
  option_c: string
  option_d: string
  correct_answer: string
  explanation?: string
  image_url?: string
  subject_name: string
  subject_code: string
  topic_name?: string
  grade: number
  difficulty: string
}

export interface GetDuelQuestionsOptions {
  grade: number
  subject?: string
  count?: number
  difficulty?: ('easy' | 'medium' | 'hard')[]
  excludeQuestionIds?: string[]
}

/**
 * Düello için rastgele sorular çeker
 * 
 * ⚡ Typesense ile ~130ms'de 10 soru çeker
 * 
 * @param options - Filtreleme seçenekleri
 * @returns Düello soruları
 */
export async function getDuelQuestions(options: GetDuelQuestionsOptions): Promise<DuelQuestion[]> {
  const {
    grade,
    subject,
    count = 10,
    difficulty = ['easy', 'medium', 'hard'],
    excludeQuestionIds = []
  } = options

  const startTime = performance.now()
  const client = getTypesenseBrowserClient()

  try {
    // Filter oluştur
    const filters: string[] = [`grade:=${grade}`]
    
    if (subject && subject !== 'all') {
      filters.push(`subject_name:=${subject}`)
    }
    
    if (difficulty.length > 0) {
      filters.push(`difficulty:[${difficulty.join(',')}]`)
    }
    
    // Hariç tutulacak sorular
    if (excludeQuestionIds.length > 0) {
      filters.push(`id:!=[${excludeQuestionIds.join(',')}]`)
    }

    // Typesense sorgusu - rastgele sıralama için random score kullan
    const result = await client
      .collections(COLLECTIONS.QUESTIONS)
      .documents()
      .search({
        q: '*',
        query_by: 'question_text',
        filter_by: filters.join(' && '),
        per_page: count * 3, // Daha fazla çek, sonra rastgele seç
        include_fields: 'id,question_id,question_text,option_a,option_b,option_c,option_d,correct_answer,explanation,image_url,subject_name,subject_code,topic_name,grade,difficulty',
        // Rastgele sıralama için farklı bir yaklaşım kullanacağız
      })

    const questions = (result.hits || []).map((hit: any) => ({
      id: hit.document.id,
      question_id: hit.document.question_id || hit.document.id,
      question_text: hit.document.question_text,
      option_a: hit.document.option_a,
      option_b: hit.document.option_b,
      option_c: hit.document.option_c,
      option_d: hit.document.option_d,
      correct_answer: hit.document.correct_answer,
      explanation: hit.document.explanation,
      image_url: hit.document.image_url,
      subject_name: hit.document.subject_name,
      subject_code: hit.document.subject_code,
      topic_name: hit.document.topic_name,
      grade: hit.document.grade,
      difficulty: hit.document.difficulty
    })) as DuelQuestion[]

    // Rastgele karıştır ve istenen sayıda al
    const shuffled = shuffleArray(questions)
    const selected = shuffled.slice(0, count)

    // Zorluk dengesini ayarla (3 kolay, 4 orta, 3 zor)
    const balanced = balanceDifficulty(selected, count)

    const duration = Math.round(performance.now() - startTime)
    console.log(`⚡ Duel questions: ${duration}ms, ${balanced.length} questions`)

    return balanced
  } catch (error) {
    console.error('Düello soruları çekilirken hata:', error)
    throw error
  }
}

/**
 * Zorluk seviyelerini dengele
 * Hedef: %30 kolay, %40 orta, %30 zor
 */
function balanceDifficulty(questions: DuelQuestion[], targetCount: number): DuelQuestion[] {
  const easy = questions.filter(q => q.difficulty === 'easy')
  const medium = questions.filter(q => q.difficulty === 'medium')
  const hard = questions.filter(q => q.difficulty === 'hard')

  const targetEasy = Math.floor(targetCount * 0.3)
  const targetMedium = Math.floor(targetCount * 0.4)
  const targetHard = targetCount - targetEasy - targetMedium

  const result: DuelQuestion[] = []

  // Her zorluktan hedef kadar al
  result.push(...easy.slice(0, targetEasy))
  result.push(...medium.slice(0, targetMedium))
  result.push(...hard.slice(0, targetHard))

  // Eksik varsa diğerlerinden tamamla
  if (result.length < targetCount) {
    const remaining = questions.filter(q => !result.includes(q))
    result.push(...remaining.slice(0, targetCount - result.length))
  }

  // Karıştır ve döndür
  return shuffleArray(result)
}

/**
 * Fisher-Yates shuffle algoritması
 */
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

/**
 * Belirli bir ders için düello soruları çek
 */
export async function getDuelQuestionsBySubject(
  grade: number,
  subjectCode: string,
  count: number = 10
): Promise<DuelQuestion[]> {
  return getDuelQuestions({
    grade,
    subject: subjectCode,
    count,
    difficulty: ['easy', 'medium', 'hard']
  })
}

/**
 * Karışık ders düello soruları çek
 */
export async function getMixedDuelQuestions(
  grade: number,
  count: number = 10
): Promise<DuelQuestion[]> {
  return getDuelQuestions({
    grade,
    count,
    difficulty: ['easy', 'medium', 'hard']
  })
}

