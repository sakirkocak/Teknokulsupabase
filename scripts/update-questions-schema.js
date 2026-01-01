/**
 * 📊 Typesense Questions Schema Güncelle
 * 
 * questions koleksiyonuna embedding field'ı ekler
 * 
 * Kullanım: node scripts/update-questions-schema.js
 */

require('dotenv').config({ path: '.env.local' })

const Typesense = require('typesense')

const typesenseClient = new Typesense.Client({
  nodes: [{
    host: process.env.NEXT_PUBLIC_TYPESENSE_HOST || 'kc8bx4n1ldm30q6fp-1.a1.typesense.net',
    port: 443,
    protocol: 'https'
  }],
  apiKey: process.env.TYPESENSE_ADMIN_KEY,
  connectionTimeoutSeconds: 10
})

async function main() {
  console.log('📊 Typesense Schema Güncelleme')
  console.log('=' .repeat(50))
  
  if (!process.env.TYPESENSE_ADMIN_KEY) {
    console.error('❌ TYPESENSE_ADMIN_KEY not found')
    process.exit(1)
  }

  try {
    // Mevcut schema'yı kontrol et
    console.log('\n1️⃣ Mevcut schema kontrol ediliyor...')
    const collection = await typesenseClient.collections('questions').retrieve()
    
    const hasEmbedding = collection.fields.some(f => f.name === 'embedding')
    
    if (hasEmbedding) {
      console.log('✅ embedding field zaten mevcut!')
      return
    }
    
    // Yeni field ekle
    console.log('\n2️⃣ embedding field ekleniyor...')
    
    await typesenseClient
      .collections('questions')
      .update({
        fields: [
          { 
            name: 'embedding', 
            type: 'float[]', 
            num_dim: 768,  // Gemini text-embedding-004 boyutu
            optional: true 
          }
        ]
      })
    
    console.log('✅ embedding field başarıyla eklendi!')
    
    // Güncel schema'yı göster
    console.log('\n3️⃣ Güncel schema:')
    const updatedCollection = await typesenseClient.collections('questions').retrieve()
    console.log(`   Fields: ${updatedCollection.fields.length}`)
    console.log(`   Docs: ${updatedCollection.num_documents}`)
    
    const embeddingField = updatedCollection.fields.find(f => f.name === 'embedding')
    if (embeddingField) {
      console.log(`   embedding: type=${embeddingField.type}, num_dim=${embeddingField.num_dim}`)
    }
    
  } catch (error) {
    console.error('❌ Hata:', error.message)
    
    if (error.message.includes('already exists')) {
      console.log('ℹ️ Field zaten mevcut')
    }
  }
}

main().catch(console.error)
