/**
 * 📦 Supabase'den Typesense'e Soru Import
 * 
 * Tüm soruları Supabase'den çekip Typesense'e yükler.
 * 
 * Kullanım: node scripts/import-questions-to-typesense.js
 */

require('dotenv').config({ path: '.env.local' })

const { createClient } = require('@supabase/supabase-js')
const Typesense = require('typesense')

// Supabase setup
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// Typesense setup
const typesense = new Typesense.Client({
  nodes: [{
    host: process.env.TYPESENSE_HOST || process.env.NEXT_PUBLIC_TYPESENSE_HOST,
    port: 443,
    protocol: 'https'
  }],
  apiKey: process.env.TYPESENSE_API_KEY,
  connectionTimeoutSeconds: 30
})

const BATCH_SIZE = 100

async function main() {
  console.log('📦 Soru Import - Supabase → Typesense')
  console.log('=' .repeat(50))
  
  const startTime = Date.now()
  let offset = 0
  let totalImported = 0
  let hasMore = true
  
  while (hasMore) {
    // Soruları çek (topic bilgileriyle birlikte)
    const { data: questions, error } = await supabase
      .from('questions')
      .select(`
        id,
        topic_id,
        difficulty,
        question_text,
        options,
        correct_answer,
        explanation,
        question_image_url,
        is_active,
        times_answered,
        times_correct,
        created_at,
        lang,
        topic:topics!inner(
          id,
          main_topic,
          sub_topic,
          grade,
          subject:subjects!inner(id, code, name)
        )
      `)
      .eq('is_active', true)
      .order('created_at', { ascending: true })
      .range(offset, offset + BATCH_SIZE - 1)
    
    if (error) {
      console.error('❌ Supabase hatası:', error.message)
      break
    }
    
    if (!questions || questions.length === 0) {
      hasMore = false
      break
    }
    
    // Typesense formatına çevir
    const documents = questions.map(q => {
      const options = q.options || {}
      const topic = q.topic || {}
      const subject = topic.subject || {}
      
      return {
        id: q.id,
        question_id: q.id,
        question_text: q.question_text || '',
        explanation: q.explanation || '',
        option_a: options.A || options.a || '',
        option_b: options.B || options.b || '',
        option_c: options.C || options.c || '',
        option_d: options.D || options.d || '',
        option_e: options.E || options.e || '',
        correct_answer: q.correct_answer || '',
        difficulty: q.difficulty || 'medium',
        subject_id: subject.id || '',
        subject_code: subject.code || '',
        subject_name: subject.name || '',
        topic_id: topic.id || '',
        main_topic: topic.main_topic || '',
        sub_topic: topic.sub_topic || '',
        grade: topic.grade || 0,
        has_image: !!q.question_image_url,
        image_url: q.question_image_url || '',
        times_answered: q.times_answered || 0,
        times_correct: q.times_correct || 0,
        success_rate: q.times_answered > 0 
          ? (q.times_correct / q.times_answered) * 100 
          : 0,
        lang: q.lang || 'tr',
        created_at: q.created_at 
          ? new Date(q.created_at).getTime() 
          : Date.now()
      }
    })
    
    // Typesense'e import
    try {
      const result = await typesense
        .collections('questions')
        .documents()
        .import(documents, { action: 'upsert' })
      
      const successCount = result.filter(r => r.success).length
      totalImported += successCount
      
      // Progress
      const elapsed = Math.round((Date.now() - startTime) / 1000)
      console.log(`📈 ${totalImported} soru import edildi (${elapsed}s)`)
      
    } catch (importError) {
      console.error('❌ Import hatası:', importError.message)
      // Devam et
    }
    
    offset += BATCH_SIZE
    
    // Rate limit için kısa bekle
    await new Promise(r => setTimeout(r, 100))
  }
  
  // Özet
  const totalTime = Math.round((Date.now() - startTime) / 1000)
  console.log('\n' + '=' .repeat(50))
  console.log('✅ Import Tamamlandı!')
  console.log(`   Toplam: ${totalImported} soru`)
  console.log(`   Süre: ${totalTime} saniye`)
  console.log(`   Hız: ${Math.round(totalImported / totalTime)} soru/saniye`)
}

main().catch(console.error)
