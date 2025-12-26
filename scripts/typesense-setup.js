/**
 * Typesense Collection Setup Script
 * 
 * Bu script Typesense Cloud üzerinde gerekli collection'ları oluşturur.
 * 
 * Kullanım:
 * node scripts/typesense-setup.js
 * 
 * Gerekli env variables:
 * - TYPESENSE_HOST
 * - TYPESENSE_API_KEY
 */

const Typesense = require('typesense')
require('dotenv').config({ path: '.env.local' })

const typesense = new Typesense.Client({
  nodes: [{
    host: process.env.TYPESENSE_HOST || '',
    port: 443,
    protocol: 'https'
  }],
  apiKey: process.env.TYPESENSE_API_KEY || '',
  connectionTimeoutSeconds: 10
})

// Leaderboard Collection Schema
const leaderboardSchema = {
  name: 'leaderboard',
  fields: [
    { name: 'student_id', type: 'string' },
    { name: 'user_id', type: 'string', optional: true },
    { name: 'full_name', type: 'string' },
    { name: 'avatar_url', type: 'string', optional: true },
    
    { name: 'total_points', type: 'int32', sort: true },
    { name: 'total_questions', type: 'int32' },
    { name: 'total_correct', type: 'int32' },
    { name: 'total_wrong', type: 'int32' },
    { name: 'max_streak', type: 'int32' },
    { name: 'current_streak', type: 'int32' },
    
    { name: 'grade', type: 'int32', facet: true },
    { name: 'city_id', type: 'string', facet: true, optional: true },
    { name: 'city_name', type: 'string', facet: true, optional: true },
    { name: 'district_id', type: 'string', facet: true, optional: true },
    { name: 'district_name', type: 'string', facet: true, optional: true },
    { name: 'school_id', type: 'string', facet: true, optional: true },
    { name: 'school_name', type: 'string', facet: true, optional: true },
    
    { name: 'matematik_points', type: 'int32', optional: true },
    { name: 'turkce_points', type: 'int32', optional: true },
    { name: 'fen_points', type: 'int32', optional: true },
    { name: 'inkilap_points', type: 'int32', optional: true },
    { name: 'din_points', type: 'int32', optional: true },
    { name: 'ingilizce_points', type: 'int32', optional: true },
    
    { name: 'last_activity_at', type: 'int64' }
  ],
  default_sorting_field: 'total_points'
}

// Questions Collection Schema
const questionsSchema = {
  name: 'questions',
  fields: [
    { name: 'question_id', type: 'string' },
    { name: 'question_text', type: 'string' },
    { name: 'explanation', type: 'string', optional: true },
    
    { name: 'difficulty', type: 'string', facet: true },
    { name: 'subject_id', type: 'string', facet: true },
    { name: 'subject_code', type: 'string', facet: true },
    { name: 'subject_name', type: 'string', facet: true },
    { name: 'topic_id', type: 'string', facet: true },
    { name: 'main_topic', type: 'string', facet: true },
    { name: 'sub_topic', type: 'string', facet: true, optional: true },
    { name: 'grade', type: 'int32', facet: true },
    
    { name: 'times_answered', type: 'int32' },
    { name: 'times_correct', type: 'int32' },
    { name: 'success_rate', type: 'float', optional: true },
    
    { name: 'created_at', type: 'int64' }
  ],
  default_sorting_field: 'created_at'
}

async function createCollection(schema) {
  try {
    // Önce mevcut collection'ı silmeyi dene
    try {
      await typesense.collections(schema.name).delete()
      console.log(`  ⚠️  Mevcut '${schema.name}' collection silindi`)
    } catch (e) {
      if (e.httpStatus !== 404) {
        throw e
      }
    }
    
    // Yeni collection oluştur
    await typesense.collections().create(schema)
    console.log(`  ✅ '${schema.name}' collection oluşturuldu`)
  } catch (error) {
    console.error(`  ❌ '${schema.name}' oluşturulurken hata:`, error.message)
    throw error
  }
}

async function main() {
  console.log('\n🚀 Typesense Collection Setup Başlatılıyor...\n')
  
  // Env kontrolü
  if (!process.env.TYPESENSE_HOST || !process.env.TYPESENSE_API_KEY) {
    console.error('❌ TYPESENSE_HOST ve TYPESENSE_API_KEY env değişkenleri gerekli!')
    console.log('\n.env.local dosyasına şunları ekleyin:')
    console.log('  TYPESENSE_HOST=kc8bx4n1ldm30q6fp-1.a1.typesense.net')
    console.log('  TYPESENSE_API_KEY=your-admin-api-key')
    process.exit(1)
  }
  
  console.log(`📡 Typesense Host: ${process.env.TYPESENSE_HOST}`)
  
  // Bağlantı testi
  try {
    const health = await typesense.health.retrieve()
    console.log(`✅ Typesense bağlantısı başarılı: ${health.ok ? 'Healthy' : 'Unhealthy'}\n`)
  } catch (error) {
    console.error('❌ Typesense bağlantısı başarısız:', error.message)
    process.exit(1)
  }
  
  // Collection'ları oluştur
  console.log('📦 Collection\'lar oluşturuluyor...\n')
  
  try {
    await createCollection(leaderboardSchema)
    await createCollection(questionsSchema)
    
    console.log('\n✅ Tüm collection\'lar başarıyla oluşturuldu!')
    console.log('\n📋 Sonraki adım: Migration script\'i çalıştırın:')
    console.log('   node scripts/typesense-migrate.js\n')
  } catch (error) {
    console.error('\n❌ Setup başarısız!')
    process.exit(1)
  }
}

main()

