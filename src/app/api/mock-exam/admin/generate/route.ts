import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { EXAM_CONFIGS } from '@/lib/mock-exam/constants'
import { typesenseClient, isTypesenseAvailable, COLLECTIONS } from '@/lib/typesense/client'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    // Admin yetki kontrolu
    const serverClient = await createServerClient()
    const { data: { user } } = await serverClient.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Giris yapmaniz gerekiyor' }, { status: 401 })
    }

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Yetkiniz yok' }, { status: 403 })
    }

    const body = await req.json()
    const { grade, exam_type } = body

    if (!grade || !exam_type) {
      return NextResponse.json({ error: 'grade ve exam_type gerekli' }, { status: 400 })
    }

    const config = EXAM_CONFIGS[exam_type]
    if (!config) {
      return NextResponse.json({ error: 'Gecersiz sinav turu' }, { status: 400 })
    }

    const selectedQuestions: Array<{
      questionId: string
      subject: string
      subjectCode: string
      topicName: string | null
      isVisual: boolean
    }> = []

    // Her subject config icin soru sec
    for (const subjectConfig of config.subjects) {
      if (subjectConfig.subSubjects && subjectConfig.subSubjects.length > 0) {
        // Kompozit ders: alt derslerden soru sec (orn: Sosyal = Inkilap + Din)
        for (const sub of subjectConfig.subSubjects) {
          const questions = await fetchQuestionsFromTypesense(
            grade, sub.code, sub.questionCount, subjectConfig.displayName
          )
          selectedQuestions.push(...questions)
        }
      } else {
        // Tekil ders
        const questions = await fetchQuestionsFromTypesense(
          grade, subjectConfig.code, subjectConfig.questionCount, subjectConfig.displayName
        )
        selectedQuestions.push(...questions)
      }
    }

    // Ders bazli gruplama (UI icin ust ders adi ile)
    const subjectGroups: Record<string, typeof selectedQuestions> = {}
    for (const q of selectedQuestions) {
      if (!subjectGroups[q.subject]) {
        subjectGroups[q.subject] = []
      }
      subjectGroups[q.subject].push(q)
    }

    const subjects = Object.entries(subjectGroups).map(([subject, questions]) => ({
      subject,
      subjectCode: questions[0]?.subjectCode || subject,
      questionIds: questions.map(q => q.questionId),
    }))

    const visualCount = selectedQuestions.filter(q => q.isVisual).length

    return NextResponse.json({
      subjects,
      totalQuestions: selectedQuestions.length,
      visualQuestions: visualCount,
      distribution: Object.entries(subjectGroups).map(([subject, qs]) => ({
        subject,
        count: qs.length,
      })),
    })
  } catch (error: any) {
    console.error('Admin generate exam error:', error)
    return NextResponse.json({ error: 'Soru olusturulamadi' }, { status: 500 })
  }
}

/**
 * Typesense'den soru sec - Supabase'e sorgu ATMAZ
 * Yeni nesil (visual) sorulara oncelik verir (%35 hedef)
 * Learning outcome (main_topic) dagitimini goz onunde bulundurur
 */
async function fetchQuestionsFromTypesense(
  grade: number,
  subjectCode: string,
  count: number,
  displaySubject: string
): Promise<Array<{
  questionId: string
  subject: string
  subjectCode: string
  topicName: string | null
  isVisual: boolean
}>> {
  const result: Array<{
    questionId: string
    subject: string
    subjectCode: string
    topicName: string | null
    isVisual: boolean
  }> = []

  if (!isTypesenseAvailable()) return result

  // Typesense'den soruları çek
  const searchResult = await typesenseClient
    .collections(COLLECTIONS.QUESTIONS)
    .documents()
    .search({
      q: '*',
      filter_by: `subject_code:=${subjectCode} && grade:=${grade}`,
      per_page: 250,
      include_fields: 'question_id,main_topic,visual_type,is_new_generation',
    })

  const hits = searchResult.hits || []
  if (hits.length === 0) return result

  const allDocs = hits.map((h: any) => h.document)

  // Konulara gore grupla
  const topicGroups = new Map<string, Array<{ question_id: string; visual_type?: string; main_topic: string }>>()
  for (const doc of allDocs) {
    const mainTopic = doc.main_topic || 'Genel'
    if (!topicGroups.has(mainTopic)) {
      topicGroups.set(mainTopic, [])
    }
    topicGroups.get(mainTopic)!.push(doc)
  }

  const topicEntries = Array.from(topicGroups.entries())
  const totalTopics = topicEntries.length
  if (totalTopics === 0) return result

  // Her konudan orantili soru sec
  const topicQuotas = topicEntries.map(([topic, questions]) => ({
    topic,
    quota: Math.max(1, Math.round(count / totalTopics)),
    questions,
  }))

  // Toplam quota'yi count'a esitle
  const totalQuota = topicQuotas.reduce((s, t) => s + t.quota, 0)
  if (totalQuota > count) {
    let excess = totalQuota - count
    const indices = topicQuotas.map((_, i) => i).sort(() => Math.random() - 0.5)
    for (const idx of indices) {
      if (excess <= 0) break
      const reduce = Math.min(topicQuotas[idx].quota - (totalTopics <= count ? 1 : 0), excess)
      if (reduce > 0) { topicQuotas[idx].quota -= reduce; excess -= reduce }
    }
  }

  // Her konudan soru sec (yeni nesil oncelikli)
  const usedIds = new Set<string>()

  for (const { topic, quota, questions } of topicQuotas) {
    const visualQs = questions.filter(q => q.visual_type && !usedIds.has(q.question_id)).sort(() => Math.random() - 0.5)
    const normalQs = questions.filter(q => !q.visual_type && !usedIds.has(q.question_id)).sort(() => Math.random() - 0.5)

    const visualTarget = Math.ceil(quota * 0.35)
    const selected: typeof questions = []

    for (const q of visualQs) {
      if (selected.length >= visualTarget) break
      selected.push(q); usedIds.add(q.question_id)
    }
    for (const q of normalQs) {
      if (selected.length >= quota) break
      selected.push(q); usedIds.add(q.question_id)
    }
    if (selected.length < quota) {
      for (const q of [...visualQs, ...normalQs]) {
        if (selected.length >= quota) break
        if (!usedIds.has(q.question_id)) { selected.push(q); usedIds.add(q.question_id) }
      }
    }

    for (const q of selected) {
      result.push({
        questionId: q.question_id,
        subject: displaySubject,
        subjectCode,
        topicName: q.main_topic || null,
        isVisual: !!q.visual_type,
      })
    }
  }

  // Eksik kalirsa rastgele tamamla
  if (result.length < count) {
    const remaining = allDocs.filter((q: any) => !usedIds.has(q.question_id)).sort(() => Math.random() - 0.5)
    for (const q of remaining) {
      if (result.length >= count) break
      result.push({
        questionId: q.question_id,
        subject: displaySubject,
        subjectCode,
        topicName: q.main_topic || null,
        isVisual: !!q.visual_type,
      })
    }
  }

  return result.slice(0, count)
}
