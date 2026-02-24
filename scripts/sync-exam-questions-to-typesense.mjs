/**
 * TYT/AYT sorularını Typesense'e sync et (backfill)
 * exam_topic_id var, topic_id null olan 332 soru
 */
import { createClient } from '@supabase/supabase-js'
import Typesense from 'typesense'

const SUPABASE_URL = 'https://cnawnprwdcfmyswqolsu.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNuYXducHJ3ZGNmbXlzd3FvbHN1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDU3MDAwOCwiZXhwIjoyMDgwMTQ2MDA4fQ.MYGt0HC4AenMP94N3Jt30ojKomtaeFBJuegLyczFNCM'
const TYPESENSE_HOST = 'kc8bx4n1ldm30q6fp-1.a1.typesense.net'
const TYPESENSE_KEY = '4EPTC9CnOqPP5sj8Q9Zq98pQutrrEfVz'

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
const typesense = new Typesense.Client({
  nodes: [{ host: TYPESENSE_HOST, port: 443, protocol: 'https' }],
  apiKey: TYPESENSE_KEY,
  connectionTimeoutSeconds: 10,
})

async function main() {
  console.log('Sync edilmemiş exam sorular çekiliyor...')

  const { data: questions, error } = await supabase
    .from('questions')
    .select(`
      id, question_text, difficulty, exam_types, visual_type,
      times_answered, times_correct, created_at, is_active, lang,
      exam_topic_id,
      exam_topic:exam_topics!questions_exam_topic_id_fkey(
        subject_code, subject_name, main_topic, sub_topic, grades
      )
    `)
    .is('topic_id', null)
    .not('exam_topic_id', 'is', null)
    .eq('is_active', true)

  if (error) { console.error('Supabase hatası:', error); process.exit(1) }
  console.log(`${questions.length} soru bulundu, Typesense'e sync ediliyor...`)

  const docs = questions.map(q => {
    const et = q.exam_topic
    if (!et) return null
    // TYT/AYT soruları sınıf tabanlı değil - grade: 0 = "sınav sorusu"
    const grade = 0
    const ta = q.times_answered || 0
    const tc = q.times_correct || 0
    return {
      id: q.id,
      question_id: q.id,
      topic_id: q.exam_topic_id,
      question_text: q.question_text || '',
      difficulty: q.difficulty || 'medium',
      subject_code: et.subject_code || 'unknown',
      subject_name: et.subject_name || 'Bilinmeyen',
      main_topic: et.main_topic || '',
      sub_topic: et.sub_topic || '',
      grade,
      has_image: false,
      lang: q.lang || 'tr',
      is_new_generation: !!(q.visual_type && q.visual_type !== 'none'),
      visual_type: q.visual_type || '',
      exam_types: Array.isArray(q.exam_types) ? q.exam_types : [],
      times_answered: ta,
      times_correct: tc,
      success_rate: ta > 0 ? Math.round((tc / ta) * 10000) / 100 : 0,
      created_at: q.created_at ? new Date(q.created_at).getTime() : Date.now(),
    }
  }).filter(Boolean)

  // 50'şer batch upsert
  const BATCH = 50
  let synced = 0
  for (let i = 0; i < docs.length; i += BATCH) {
    const batch = docs.slice(i, i + BATCH)
    const results = await typesense.collections('questions').documents().import(batch, { action: 'upsert' })
    const ok = results.filter(r => r.success).length
    const fail = results.filter(r => !r.success).length
    synced += ok
    if (fail > 0) {
      const errs = results.filter(r => !r.success).map(r => r.error).slice(0, 3)
      console.warn(`  Batch ${i}-${i+BATCH}: ${fail} hata - ${JSON.stringify(errs)}`)
    }
    process.stdout.write(`\r  Sync: ${synced}/${docs.length}`)
  }

  console.log(`\nTamamlandı: ${synced}/${docs.length} soru Typesense'e eklendi.`)

  // Doğrula
  const check = await typesense.collections('questions').documents().search({
    q: '*', query_by: 'question_text',
    filter_by: 'exam_types:=tyt && topic_id:!=""',
    per_page: 1
  })
  const total = await typesense.collections('questions').retrieve()
  console.log(`Typesense toplam soru: ${total.num_documents}`)
  console.log(`TYT soruları: ${check.found}`)
}

main().catch(console.error)
