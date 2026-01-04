/**
 * Typesense Questions Collection Schema Kontrolü
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

async function checkSchema() {
  console.log('📊 Typesense questions collection şeması:\n')
  
  try {
    const collection = await client.collections('questions').retrieve()
    
    console.log(`Collection: ${collection.name}`)
    console.log(`Döküman sayısı: ${collection.num_documents}`)
    console.log(`\nAlanlar (${collection.fields.length}):\n`)
    
    collection.fields.forEach(field => {
      const attrs = []
      if (field.facet) attrs.push('facet')
      if (field.optional) attrs.push('optional')
      if (field.sort) attrs.push('sort')
      
      console.log(`  - ${field.name}: ${field.type} ${attrs.length ? `[${attrs.join(', ')}]` : ''}`)
    })
    
    // is_new_generation ve visual_type var mı?
    const hasNewGen = collection.fields.some(f => f.name === 'is_new_generation')
    const hasVisualType = collection.fields.some(f => f.name === 'visual_type')
    
    console.log('\n--- Kontrol ---')
    console.log(`is_new_generation: ${hasNewGen ? '✅ VAR' : '❌ YOK'}`)
    console.log(`visual_type: ${hasVisualType ? '✅ VAR' : '❌ YOK'}`)
    
  } catch (error) {
    console.error('❌ Hata:', error.message)
  }
}

checkSchema()
