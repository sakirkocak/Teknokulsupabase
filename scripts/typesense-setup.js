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
    
    // Günlük istatistikler
    { name: 'today_questions', type: 'int32', optional: true },
    { name: 'today_correct', type: 'int32', optional: true },
    { name: 'today_date', type: 'string', optional: true },
    
    { name: 'grade', type: 'int32', facet: true },
    { name: 'city_id', type: 'string', facet: true, optional: true },
    { name: 'city_name', type: 'string', facet: true, optional: true },
    { name: 'district_id', type: 'string', facet: true, optional: true },
    { name: 'district_name', type: 'string', facet: true, optional: true },
    { name: 'school_id', type: 'string', facet: true, optional: true },
    { name: 'school_name', type: 'string', facet: true, optional: true },
    
    // Ana dersler (LGS/Ortaokul)
    { name: 'matematik_points', type: 'int32', optional: true },
    { name: 'turkce_points', type: 'int32', optional: true },
    { name: 'fen_points', type: 'int32', optional: true },
    { name: 'inkilap_points', type: 'int32', optional: true },
    { name: 'din_points', type: 'int32', optional: true },
    { name: 'ingilizce_points', type: 'int32', optional: true },
    { name: 'sosyal_points', type: 'int32', optional: true },
    { name: 'hayat_points', type: 'int32', optional: true },
    // Lise dersleri
    { name: 'edebiyat_points', type: 'int32', optional: true },
    { name: 'fizik_points', type: 'int32', optional: true },
    { name: 'kimya_points', type: 'int32', optional: true },
    { name: 'biyoloji_points', type: 'int32', optional: true },
    { name: 'tarih_points', type: 'int32', optional: true },
    { name: 'cografya_points', type: 'int32', optional: true },
    { name: 'felsefe_points', type: 'int32', optional: true },
    // Diğer dersler
    { name: 'gorsel_points', type: 'int32', optional: true },
    { name: 'muzik_points', type: 'int32', optional: true },
    { name: 'beden_points', type: 'int32', optional: true },
    { name: 'bilisim_points', type: 'int32', optional: true },
    { name: 'teknoloji_points', type: 'int32', optional: true },
    
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
    { name: 'has_image', type: 'bool', facet: true, optional: true },
    
    { name: 'times_answered', type: 'int32' },
    { name: 'times_correct', type: 'int32' },
    { name: 'success_rate', type: 'float', optional: true },
    
    { name: 'created_at', type: 'int64' }
  ],
  default_sorting_field: 'created_at'
}

// Locations Collection Schema (İller ve İlçeler)
const locationsSchema = {
  name: 'locations',
  fields: [
    { name: 'location_id', type: 'string' },
    { name: 'name', type: 'string' },
    { name: 'type', type: 'string', facet: true },    // 'city' veya 'district'
    { name: 'parent_id', type: 'string', facet: true, optional: true }, // İlçeler için city_id
    { name: 'parent_name', type: 'string', optional: true }, // İlçeler için il adı
    { name: 'plate_code', type: 'int32', optional: true }   // Sadece iller için
  ]
}

// Schools Collection Schema (Okullar)
const schoolsSchema = {
  name: 'schools',
  fields: [
    { name: 'school_id', type: 'string' },
    { name: 'name', type: 'string' },
    { name: 'city_id', type: 'string', facet: true },
    { name: 'city_name', type: 'string', facet: true },
    { name: 'district_id', type: 'string', facet: true },
    { name: 'district_name', type: 'string', facet: true },
    { name: 'school_type', type: 'string', facet: true, optional: true },
    { name: 'ownership_type', type: 'string', facet: true, optional: true }
  ]
}

// Student Stats Collection Schema (Öğrenci Genel İstatistikleri)
const studentStatsSchema = {
  name: 'student_stats',
  fields: [
    { name: 'student_id', type: 'string' },
    { name: 'student_name', type: 'string' },
    { name: 'grade', type: 'int32', facet: true },
    
    { name: 'total_questions', type: 'int32' },
    { name: 'total_correct', type: 'int32' },
    { name: 'total_wrong', type: 'int32' },
    { name: 'overall_success_rate', type: 'float' },
    
    { name: 'total_points', type: 'int32', sort: true },
    { name: 'current_streak', type: 'int32' },
    { name: 'max_streak', type: 'int32' },
    
    { name: 'weak_topics', type: 'string[]', facet: true, optional: true },
    { name: 'strong_topics', type: 'string[]', facet: true, optional: true },
    
    { name: 'last_activity_at', type: 'int64' }
  ],
  default_sorting_field: 'total_points'
}

// Student Topic Progress Collection Schema (Konu Bazlı İlerleme)
const studentTopicProgressSchema = {
  name: 'student_topic_progress',
  fields: [
    { name: 'progress_id', type: 'string' },  // student_id_topic_id
    { name: 'student_id', type: 'string', facet: true },
    { name: 'topic_id', type: 'string', facet: true },
    { name: 'subject_code', type: 'string', facet: true },
    { name: 'subject_name', type: 'string' },
    { name: 'main_topic', type: 'string', facet: true },
    { name: 'grade', type: 'int32', facet: true },
    
    { name: 'total_attempted', type: 'int32' },
    { name: 'total_correct', type: 'int32' },
    { name: 'success_rate', type: 'float', sort: true },
    
    { name: 'mastery_level', type: 'string', facet: true },  // 'beginner', 'learning', 'proficient', 'master'
    { name: 'current_difficulty', type: 'string', facet: true },  // adaptive learning için
    { name: 'consecutive_correct', type: 'int32' },
    
    { name: 'last_practiced_at', type: 'int64' },
    { name: 'next_review_at', type: 'int64', optional: true }  // spaced repetition için
  ],
  default_sorting_field: 'last_practiced_at'
}

// Tüm şemalar
const ALL_SCHEMAS = [
  leaderboardSchema,
  questionsSchema,
  locationsSchema,
  schoolsSchema,
  studentStatsSchema,
  studentTopicProgressSchema
]

async function createCollection(schema, forceRecreate = false) {
  try {
    // Mevcut collection'ı kontrol et
    try {
      const existing = await typesense.collections(schema.name).retrieve()
      if (!forceRecreate) {
        console.log(`  ⏭️  '${schema.name}' zaten mevcut (${existing.num_documents} döküman)`)
        return false
      }
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
    return true
  } catch (error) {
    console.error(`  ❌ '${schema.name}' oluşturulurken hata:`, error.message)
    throw error
  }
}

async function main() {
  console.log('\n🚀 Typesense Collection Setup Başlatılıyor...\n')
  
  // Komut satırı argümanları
  const forceRecreate = process.argv.includes('--force')
  const onlyNew = process.argv.includes('--only-new')
  
  if (forceRecreate) {
    console.log('⚠️  --force modu: Mevcut collection\'lar silinip yeniden oluşturulacak!\n')
  }
  if (onlyNew) {
    console.log('ℹ️  --only-new modu: Sadece yeni collection\'lar oluşturulacak\n')
  }
  
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
  
  // Yeni collection isimleri
  const newCollections = ['locations', 'schools', 'student_stats', 'student_topic_progress']
  
  let created = 0
  let skipped = 0
  
  try {
    for (const schema of ALL_SCHEMAS) {
      // --only-new modunda sadece yeni collection'ları oluştur
      if (onlyNew && !newCollections.includes(schema.name)) {
        console.log(`  ⏭️  '${schema.name}' atlandı (--only-new modu)`)
        skipped++
        continue
      }
      
      const wasCreated = await createCollection(schema, forceRecreate)
      if (wasCreated) created++
      else skipped++
    }
    
    console.log('\n' + '='.repeat(50))
    console.log(`✅ Setup tamamlandı! (${created} oluşturuldu, ${skipped} atlandı)`)
    console.log('\n📋 Sonraki adım: Migration script\'i çalıştırın:')
    console.log('   node scripts/typesense-migrate.js --all')
    console.log('\n   Veya sadece yeni collection\'lar için:')
    console.log('   node scripts/typesense-migrate.js --only-new\n')
  } catch (error) {
    console.error('\n❌ Setup başarısız!')
    process.exit(1)
  }
}

main()
