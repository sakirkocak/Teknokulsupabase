/**
 * 🧠 Soruları Embed Et - Migration Script
 * 
 * Mevcut tüm soruları Gemini ile embed eder ve Typesense'e kaydeder.
 * 
 * Kullanım:
 *   node scripts/embed-questions.js           # Tüm soruları embed et
 *   node scripts/embed-questions.js --limit=100  # Sadece 100 soru
 *   node scripts/embed-questions.js --skip=1000  # 1000'den sonra başla
 */

require('dotenv').config({ path: '.env.local' })

const { GoogleGenerativeAI } = require('@google/generative-ai')
const Typesense = require('typesense')

// Gemini setup
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
const embeddingModel = genAI.getGenerativeModel({ model: 'text-embedding-004' })

// Typesense setup
const typesenseClient = new Typesense.Client({
  nodes: [{
    host: process.env.NEXT_PUBLIC_TYPESENSE_HOST || process.env.TYPESENSE_HOST || 'kc8bx4n1ldm30q6fp-1.a1.typesense.net',
    port: 443,
    protocol: 'https'
  }],
  apiKey: process.env.TYPESENSE_ADMIN_KEY || process.env.TYPESENSE_API_KEY,
  connectionTimeoutSeconds: 10
})

// Args parse
const args = process.argv.slice(2)
const limitArg = args.find(a => a.startsWith('--limit='))
const skipArg = args.find(a => a.startsWith('--skip='))
const LIMIT = limitArg ? parseInt(limitArg.split('=')[1]) : null
const SKIP = skipArg ? parseInt(skipArg.split('=')[1]) : 0

// Constants
const BATCH_SIZE = 10  // Her seferde 10 soru embed et
const DELAY_BETWEEN_BATCHES = 200  // ms

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

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function main() {
  console.log('🧠 Soru Embedding Migration')
  console.log('=' .repeat(50))
  
  if (!process.env.GEMINI_API_KEY) {
    console.error('❌ GEMINI_API_KEY not found in .env.local')
    process.exit(1)
  }
  
  if (!process.env.TYPESENSE_ADMIN_KEY && !process.env.TYPESENSE_API_KEY) {
    console.error('❌ TYPESENSE_API_KEY not found in .env.local')
    process.exit(1)
  }

  // 1. Önce embedding'i olmayan soruları say
  console.log('\n📊 Typesense\'den soruları alınıyor...')
  
  let page = 1
  let totalProcessed = 0
  let totalEmbedded = 0
  let totalSkipped = 0
  let hasMore = true
  
  const startTime = Date.now()
  
  while (hasMore) {
    try {
      // Embedding'i olmayan soruları getir
      const searchResult = await typesenseClient
        .collections('questions')
        .documents()
        .search({
          q: '*',
          query_by: 'question_text',
          filter_by: 'embedding:=null',  // Sadece embedding'i olmayanlar
          per_page: BATCH_SIZE,
          page: page
        })
      
      const questions = searchResult.hits || []
      
      if (questions.length === 0) {
        hasMore = false
        console.log('\n✅ Tüm sorular işlendi!')
        break
      }
      
      // Her soruyu embed et ve güncelle
      for (const hit of questions) {
        const doc = hit.document
        
        // Skip kontrolü
        if (totalProcessed < SKIP) {
          totalProcessed++
          totalSkipped++
          continue
        }
        
        // Limit kontrolü
        if (LIMIT && totalEmbedded >= LIMIT) {
          hasMore = false
          break
        }
        
        // Soru metnini zenginleştir
        let textToEmbed = doc.question_text
        if (doc.main_topic) {
          textToEmbed = `[${doc.main_topic}] ${textToEmbed}`
        }
        if (doc.subject_name) {
          textToEmbed = `[${doc.subject_name}] ${textToEmbed}`
        }
        
        // Embedding al
        const embedding = await getEmbedding(textToEmbed)
        
        if (embedding) {
          // Typesense'e güncelle
          try {
            await typesenseClient
              .collections('questions')
              .documents(doc.id)
              .update({ embedding })
            
            totalEmbedded++
            
            // Progress göster
            if (totalEmbedded % 50 === 0) {
              const elapsed = Math.round((Date.now() - startTime) / 1000)
              const rate = Math.round(totalEmbedded / elapsed * 60)
              console.log(`📈 ${totalEmbedded} soru embed edildi (${rate}/dk)`)
            }
          } catch (updateError) {
            console.error(`❌ Update failed for ${doc.id}:`, updateError.message)
          }
        } else {
          console.log(`⚠️ Empty embedding for ${doc.id}`)
        }
        
        totalProcessed++
      }
      
      // Rate limit için bekle
      await sleep(DELAY_BETWEEN_BATCHES)
      page++
      
    } catch (error) {
      console.error('❌ Search error:', error.message)
      
      // Bellek hatası ise dur
      if (error.message.includes('OUT_OF_MEMORY')) {
        console.log('⚠️ Typesense bellek limiti, bekleyip tekrar deneniyor...')
        await sleep(5000)
        continue
      }
      
      break
    }
  }
  
  // Sonuç özeti
  const totalTime = Math.round((Date.now() - startTime) / 1000)
  console.log('\n' + '=' .repeat(50))
  console.log('📊 Migration Tamamlandı!')
  console.log(`   ✅ Embed edilen: ${totalEmbedded}`)
  console.log(`   ⏭️ Atlanan: ${totalSkipped}`)
  console.log(`   ⏱️ Süre: ${totalTime} saniye`)
  console.log(`   📈 Hız: ${Math.round(totalEmbedded / totalTime * 60)}/dakika`)
}

main().catch(console.error)
