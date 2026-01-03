/**
 * 📊 Typesense Questions Schema Update - times_answered, times_correct, success_rate ekleme
 * 
 * Bu script mevcut questions collection'ına istatistik alanlarını ekler.
 * 
 * Kullanım:
 * node scripts/update-questions-stats-schema.js
 * 
 * Sonra verileri güncellemek için:
 * node scripts/sync-questions-stats.js
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

async function updateQuestionsSchema() {
  console.log('\n📊 Typesense Questions Schema Güncelleme\n')
  console.log(`📡 Host: ${process.env.TYPESENSE_HOST}`)
  
  // Bağlantı testi
  try {
    const health = await typesense.health.retrieve()
    console.log(`✅ Bağlantı başarılı: ${health.ok ? 'Healthy' : 'Unhealthy'}\n`)
  } catch (error) {
    console.error('❌ Bağlantı hatası:', error.message)
    process.exit(1)
  }
  
  // Mevcut şemayı kontrol et
  try {
    const collection = await typesense.collections('questions').retrieve()
    console.log(`📦 Mevcut questions collection: ${collection.num_documents} döküman`)
    
    // Mevcut alanları listele
    const existingFields = collection.fields.map(f => f.name)
    console.log(`📋 Mevcut alanlar: ${existingFields.join(', ')}\n`)
    
    // Eklenecek alanlar
    const newFields = []
    
    if (!existingFields.includes('times_answered')) {
      newFields.push({ name: 'times_answered', type: 'int32', facet: true, optional: true })
    }
    if (!existingFields.includes('times_correct')) {
      newFields.push({ name: 'times_correct', type: 'int32', optional: true })
    }
    if (!existingFields.includes('success_rate')) {
      newFields.push({ name: 'success_rate', type: 'float', optional: true })
    }
    
    if (newFields.length === 0) {
      console.log('✅ Tüm alanlar zaten mevcut!')
      return
    }
    
    console.log(`🔧 Eklenecek alanlar: ${newFields.map(f => f.name).join(', ')}\n`)
    
    // Her alanı tek tek ekle
    for (const field of newFields) {
      try {
        await typesense.collections('questions').update({
          fields: [field]
        })
        console.log(`  ✅ '${field.name}' alanı eklendi`)
      } catch (error) {
        if (error.message?.includes('already exists')) {
          console.log(`  ⏭️  '${field.name}' zaten mevcut`)
        } else {
          console.error(`  ❌ '${field.name}' eklenirken hata:`, error.message)
        }
      }
    }
    
    console.log('\n✅ Schema güncelleme tamamlandı!')
    console.log('\n📋 Sonraki adım - verileri senkronize edin:')
    console.log('   node scripts/sync-questions-stats.js\n')
    
  } catch (error) {
    if (error.httpStatus === 404) {
      console.error('❌ questions collection bulunamadı!')
      console.log('   Önce collection oluşturun: node scripts/typesense-setup.js')
    } else {
      console.error('❌ Hata:', error.message)
    }
    process.exit(1)
  }
}

updateQuestionsSchema()
