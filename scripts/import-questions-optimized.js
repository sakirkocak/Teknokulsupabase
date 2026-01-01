/**
 * 📦 Optimize Soru Import
 * 
 * Sadece arama için gerekli alanları Typesense'e yükler.
 * Detaylar (şıklar, açıklama, görsel) Supabase'de kalır.
 * 
 * Kullanım: node scripts/import-questions-optimized.js
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

const BATCH_SIZE = 250  // Daha büyük batch - daha az veri

async function main() {
  console.log('📦 OPTİMİZE Soru Import')
  console.log('=' .repeat(50))
  console.log('📝 Sadece arama alanları: question_text, grade, subject, topic')
  console.log('❌ Çıkarılanlar: explanation, options, image_url')
  console.log('')
  
  const startTime = Date.now()
  let offset = 0
  let totalImported = 0
  let hasMore = true
  
  while (hasMore) {
    // Soruları çek (sadece gerekli alanlar)
    const { data: questions, error } = await supabase
      .from('questions')
      .select(`
        id,
        question_text,
        difficulty,
        question_image_url,
        created_at,
        lang,
        topic:topics!inner(
          main_topic,
          sub_topic,
          grade,
          subject:subjects!inner(code, name)
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
    
    // OPTİMİZE Typesense formatı (sadece gerekli alanlar)
    const documents = questions.map(q => {
      const topic = q.topic || {}
      const subject = topic.subject || {}
      
      return {
        id: q.id,
        question_id: q.id,
        question_text: q.question_text || '',
        difficulty: q.difficulty || 'medium',
        subject_code: subject.code || '',
        subject_name: subject.name || '',
        main_topic: topic.main_topic || '',
        sub_topic: topic.sub_topic || '',
        grade: topic.grade || 0,
        has_image: !!q.question_image_url,
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
      
      // Progress (her 5000'de bir)
      if (totalImported % 5000 < BATCH_SIZE) {
        const elapsed = Math.round((Date.now() - startTime) / 1000)
        const rate = Math.round(totalImported / elapsed)
        console.log(`📈 ${totalImported} soru (${rate}/s)`)
      }
      
    } catch (importError) {
      if (importError.message.includes('OUT_OF_MEMORY')) {
        console.error('❌ Bellek limiti! Bekleyip tekrar deneniyor...')
        await new Promise(r => setTimeout(r, 5000))
        continue
      }
      console.error('❌ Import hatası:', importError.message)
    }
    
    offset += BATCH_SIZE
    
    // Rate limit için kısa bekle
    await new Promise(r => setTimeout(r, 50))
  }
  
  // Özet
  const totalTime = Math.round((Date.now() - startTime) / 1000)
  console.log('\n' + '=' .repeat(50))
  console.log('✅ Import Tamamlandı!')
  console.log(`   Toplam: ${totalImported} soru`)
  console.log(`   Süre: ${totalTime} saniye`)
  console.log(`   Hız: ${Math.round(totalImported / totalTime)} soru/saniye`)
  
  // Koleksiyon durumu
  const col = await typesense.collections('questions').retrieve()
  console.log(`\n📊 Typesense'de: ${col.num_documents} soru`)
}

main().catch(console.error)
