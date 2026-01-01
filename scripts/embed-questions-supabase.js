/**
 * 🧠 Soruları Embed Et - Supabase pgvector
 * 
 * Mevcut tüm soruları Gemini ile embed eder ve Supabase'e kaydeder.
 * 
 * Kullanım:
 *   node scripts/embed-questions-supabase.js           # Tüm soruları embed et
 *   node scripts/embed-questions-supabase.js --limit=100  # Sadece 100 soru
 *   node scripts/embed-questions-supabase.js --skip=1000  # 1000'den sonra başla
 *   node scripts/embed-questions-supabase.js --batch=50   # Batch boyutu
 */

require('dotenv').config({ path: '.env.local' })

const { GoogleGenerativeAI } = require('@google/generative-ai')
const { createClient } = require('@supabase/supabase-js')

// Gemini setup
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
const embeddingModel = genAI.getGenerativeModel({ model: 'text-embedding-004' })

// Supabase setup
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// Args parse
const args = process.argv.slice(2)
const limitArg = args.find(a => a.startsWith('--limit='))
const skipArg = args.find(a => a.startsWith('--skip='))
const batchArg = args.find(a => a.startsWith('--batch='))
const LIMIT = limitArg ? parseInt(limitArg.split('=')[1]) : null
const SKIP = skipArg ? parseInt(skipArg.split('=')[1]) : 0
const BATCH_SIZE = batchArg ? parseInt(batchArg.split('=')[1]) : 20

// Constants
const DELAY_BETWEEN_BATCHES = 100  // ms

async function getEmbedding(text) {
  if (!text || text.trim().length === 0) {
    return null
  }

  // Metni temizle
  let cleaned = text.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
  if (cleaned.length > 2000) {
    cleaned = cleaned.substring(0, 2000)
  }

  try {
    const result = await embeddingModel.embedContent(cleaned)
    return result.embedding.values
  } catch (error) {
    console.error('Embedding error:', error.message)
    return null
  }
}

async function getEmbeddingBatch(texts) {
  const results = await Promise.all(texts.map(t => getEmbedding(t)))
  return results
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function main() {
  console.log('🧠 Soru Embedding - Supabase pgvector')
  console.log('=' .repeat(50))
  console.log(`📦 Batch size: ${BATCH_SIZE}`)
  if (LIMIT) console.log(`🔢 Limit: ${LIMIT}`)
  if (SKIP) console.log(`⏭️ Skip: ${SKIP}`)
  
  if (!process.env.GEMINI_API_KEY) {
    console.error('❌ GEMINI_API_KEY not found in .env.local')
    process.exit(1)
  }

  // 1. Önce embedding kolonu var mı kontrol et
  console.log('\n1️⃣ Embedding kolonu kontrol ediliyor...')
  const { data: testData, error: testError } = await supabase
    .from('questions')
    .select('embedding')
    .limit(1)
  
  if (testError && testError.message.includes('embedding')) {
    console.error('❌ embedding kolonu YOK!')
    console.log('\n👉 Önce Supabase SQL Editor\'da şunu çalıştır:')
    console.log('   CREATE EXTENSION IF NOT EXISTS vector;')
    console.log('   ALTER TABLE questions ADD COLUMN embedding vector(768);')
    process.exit(1)
  }
  console.log('   ✅ embedding kolonu mevcut')

  // 2. Embedding'i olmayan soruları say
  console.log('\n2️⃣ Embedding durumu...')
  const { count: totalCount } = await supabase
    .from('questions')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true)

  const { count: embeddedCount } = await supabase
    .from('questions')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true)
    .not('embedding', 'is', null)

  const pendingCount = (totalCount || 0) - (embeddedCount || 0)
  console.log(`   📊 Toplam soru: ${totalCount}`)
  console.log(`   🧠 Embedded: ${embeddedCount}`)
  console.log(`   ⏳ Bekleyen: ${pendingCount}`)

  if (pendingCount === 0) {
    console.log('\n✅ Tüm sorular zaten embed edilmiş!')
    return
  }

  // 3. Embed işlemi
  console.log('\n3️⃣ Embedding başlıyor...')
  
  let offset = SKIP
  let totalEmbedded = 0
  let hasMore = true
  const startTime = Date.now()
  
  while (hasMore) {
    // Embedding'i olmayan soruları getir
    const { data: questions, error } = await supabase
      .from('questions')
      .select(`
        id,
        question_text,
        topic:topics!inner(
          main_topic,
          subject:subjects!inner(name)
        )
      `)
      .eq('is_active', true)
      .is('embedding', null)
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
    
    // Limit kontrolü
    if (LIMIT && totalEmbedded >= LIMIT) {
      hasMore = false
      break
    }
    
    // Batch embedding için metinleri hazırla
    const textsToEmbed = questions.map(q => {
      let text = q.question_text || ''
      const topic = q.topic || {}
      const subject = topic.subject || {}
      
      if (topic.main_topic) {
        text = `[${topic.main_topic}] ${text}`
      }
      if (subject.name) {
        text = `[${subject.name}] ${text}`
      }
      return text
    })
    
    // Batch embedding
    const embeddings = await getEmbeddingBatch(textsToEmbed)
    
    // Supabase'e kaydet
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i]
      const embedding = embeddings[i]
      
      if (embedding) {
        // PostgreSQL vector formatında kaydet
        const vectorString = `[${embedding.join(',')}]`
        
        const { error: updateError } = await supabase
          .from('questions')
          .update({ embedding: vectorString })
          .eq('id', q.id)
        
        if (updateError) {
          console.error(`❌ Update failed for ${q.id}:`, updateError.message)
        } else {
          totalEmbedded++
        }
      }
      
      // Limit kontrolü
      if (LIMIT && totalEmbedded >= LIMIT) {
        hasMore = false
        break
      }
    }
    
    // Progress göster
    const elapsed = Math.round((Date.now() - startTime) / 1000)
    const rate = elapsed > 0 ? Math.round(totalEmbedded / elapsed * 60) : 0
    console.log(`📈 ${totalEmbedded} soru embed edildi (${rate}/dk, ${elapsed}s)`)
    
    // Rate limit için bekle
    await sleep(DELAY_BETWEEN_BATCHES)
    
    // Not: offset artırmıyoruz çünkü is null filtrelemesi zaten güncellenen soruları atlıyor
  }
  
  // Sonuç özeti
  const totalTime = Math.round((Date.now() - startTime) / 1000)
  console.log('\n' + '=' .repeat(50))
  console.log('✅ Embedding Tamamlandı!')
  console.log(`   🧠 Embed edilen: ${totalEmbedded}`)
  console.log(`   ⏱️ Süre: ${totalTime} saniye (${Math.round(totalTime/60)} dk)`)
  console.log(`   📈 Hız: ${Math.round(totalEmbedded / totalTime * 60)}/dakika`)
  
  // Final durum
  const { count: finalEmbedded } = await supabase
    .from('questions')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true)
    .not('embedding', 'is', null)
  
  console.log(`\n📊 Toplam embedded: ${finalEmbedded}/${totalCount}`)
}

main().catch(console.error)
