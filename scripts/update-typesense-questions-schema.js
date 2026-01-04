/**
 * Typesense Questions Collection Schema Güncelleme
 * 
 * Bu script, mevcut questions collection'ına yeni alanları (is_new_generation, visual_type) ekler.
 * 
 * Çalıştırma:
 * node scripts/update-typesense-questions-schema.js
 */

require('dotenv').config({ path: '.env.local' })
const Typesense = require('typesense')

const client = new Typesense.Client({
  nodes: [{
    host: process.env.TYPESENSE_HOST,
    port: 443,
    protocol: 'https'
  }],
  apiKey: process.env.TYPESENSE_API_KEY,
  connectionTimeoutSeconds: 10
})

async function updateQuestionsSchema() {
  console.log('🔄 Typesense questions collection güncelleniyor...\n')
  
  try {
    // Mevcut collection bilgisini al
    const collection = await client.collections('questions').retrieve()
    console.log(`📊 Mevcut alan sayısı: ${collection.fields.length}`)
    
    // Yeni alanlar
    const newFields = [
      { name: 'is_new_generation', type: 'bool', facet: true, optional: true },
      { name: 'visual_type', type: 'string', facet: true, optional: true }
    ]
    
    // Mevcut alanları kontrol et
    const existingFieldNames = collection.fields.map(f => f.name)
    
    for (const field of newFields) {
      if (existingFieldNames.includes(field.name)) {
        console.log(`⏭️  ${field.name} zaten mevcut, atlanıyor`)
      } else {
        // Yeni alan ekle
        try {
          await client.collections('questions').update({
            fields: [field]
          })
          console.log(`✅ ${field.name} eklendi`)
        } catch (updateError) {
          console.error(`❌ ${field.name} eklenemedi:`, updateError.message)
        }
      }
    }
    
    // Güncellenmiş collection bilgisini al
    const updatedCollection = await client.collections('questions').retrieve()
    console.log(`\n📊 Güncel alan sayısı: ${updatedCollection.fields.length}`)
    console.log('\n✅ Schema güncelleme tamamlandı!')
    
  } catch (error) {
    console.error('❌ Hata:', error.message)
    process.exit(1)
  }
}

updateQuestionsSchema()
