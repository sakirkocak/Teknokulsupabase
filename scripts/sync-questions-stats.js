/**
 * 📊 Typesense Questions Stats Sync
 * 
 * Supabase'deki times_answered, times_correct verilerini Typesense'e senkronize eder.
 * 
 * Kullanım:
 * node scripts/sync-questions-stats.js
 * 
 * Opsiyonlar:
 * --all       Tüm soruları güncelle (varsayılan: sadece times_answered > 0)
 * --batch=N   Batch boyutu (varsayılan: 100)
 */

const Typesense = require('typesense')
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const typesense = new Typesense.Client({
  nodes: [{
    host: process.env.TYPESENSE_HOST || '',
    port: 443,
    protocol: 'https'
  }],
  apiKey: process.env.TYPESENSE_API_KEY || '',
  connectionTimeoutSeconds: 30
})

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function syncQuestionsStats() {
  console.log('\n📊 Typesense Questions Stats Sync\n')
  
  const syncAll = process.argv.includes('--all')
  const batchArg = process.argv.find(arg => arg.startsWith('--batch='))
  const batchSize = batchArg ? parseInt(batchArg.split('=')[1]) : 100
  
  console.log(`📡 Typesense Host: ${process.env.TYPESENSE_HOST}`)
  console.log(`🔧 Mod: ${syncAll ? 'Tüm sorular' : 'Sadece çözülmüş sorular (times_answered > 0)'}`)
  console.log(`📦 Batch boyutu: ${batchSize}\n`)
  
  // Bağlantı testleri
  try {
    const health = await typesense.health.retrieve()
    console.log(`✅ Typesense bağlantısı: ${health.ok ? 'OK' : 'HATA'}`)
  } catch (error) {
    console.error('❌ Typesense bağlantı hatası:', error.message)
    process.exit(1)
  }
  
  // Supabase'den soruları çek
  let query = supabase
    .from('questions')
    .select('id, times_answered, times_correct', { count: 'exact' })
    .eq('is_active', true)
  
  if (!syncAll) {
    query = query.gt('times_answered', 0)
  }
  
  const { count, error: countError } = await query
  
  if (countError) {
    console.error('❌ Supabase count hatası:', countError.message)
    process.exit(1)
  }
  
  console.log(`📋 Güncellenecek soru sayısı: ${count}\n`)
  
  if (count === 0) {
    console.log('✅ Güncellenecek soru yok!')
    return
  }
  
  let updated = 0
  let failed = 0
  let offset = 0
  
  while (offset < count) {
    // Batch halinde çek
    let batchQuery = supabase
      .from('questions')
      .select('id, times_answered, times_correct')
      .eq('is_active', true)
      .range(offset, offset + batchSize - 1)
    
    if (!syncAll) {
      batchQuery = batchQuery.gt('times_answered', 0)
    }
    
    const { data: questions, error } = await batchQuery
    
    if (error) {
      console.error(`❌ Batch ${offset} hatası:`, error.message)
      offset += batchSize
      continue
    }
    
    // Typesense'e batch update - sadece times_answered (RAM tasarrufu)
    const documents = questions.map(q => {
      return {
        id: q.id,
        times_answered: q.times_answered || 0
      }
    })
    
    try {
      // Partial update kullan
      for (const doc of documents) {
        try {
          await typesense.collections('questions').documents(doc.id).update(doc)
          updated++
        } catch (docError) {
          if (docError.httpStatus === 404) {
            // Document Typesense'de yok, skip
          } else {
            failed++
          }
        }
      }
      
      const progress = Math.round(((offset + questions.length) / count) * 100)
      process.stdout.write(`\r⏳ İlerleme: ${progress}% (${updated} güncellendi, ${failed} hata)`)
    } catch (batchError) {
      console.error(`\n❌ Batch update hatası:`, batchError.message)
      failed += documents.length
    }
    
    offset += batchSize
  }
  
  console.log(`\n\n✅ Sync tamamlandı!`)
  console.log(`   📊 Güncellenen: ${updated}`)
  console.log(`   ❌ Hata: ${failed}\n`)
}

syncQuestionsStats()
