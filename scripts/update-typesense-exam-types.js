/**
 * Typesense Questions Collection - exam_types alani ekleme
 *
 * Calistirma: node scripts/update-typesense-exam-types.js
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

async function updateSchema() {
  console.log('🔄 Typesense questions collection - exam_types ekleniyor...\n')

  try {
    const collection = await client.collections('questions').retrieve()
    console.log(`📊 Mevcut alan sayısı: ${collection.fields.length}`)

    const newFields = [
      { name: 'exam_types', type: 'string[]', facet: true, optional: true }
    ]

    const existingFieldNames = collection.fields.map(f => f.name)

    for (const field of newFields) {
      if (existingFieldNames.includes(field.name)) {
        console.log(`⏭️  ${field.name} zaten mevcut, atlanıyor`)
      } else {
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

    const updatedCollection = await client.collections('questions').retrieve()
    console.log(`\n📊 Güncel alan sayısı: ${updatedCollection.fields.length}`)
    console.log('\n✅ Schema güncelleme tamamlandı!')
  } catch (error) {
    console.error('❌ Hata:', error.message)
    process.exit(1)
  }
}

updateSchema()
