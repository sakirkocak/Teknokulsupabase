/**
 * 3D Modelleri Supabase Storage'a Yükle
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Supabase config
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_URL ve SUPABASE_SERVICE_ROLE_KEY gerekli!')
  console.log('Örnek: node scripts/upload-models-to-supabase.js')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

const MODELS_DIR = path.join(__dirname, '../public/models')
const BUCKET_NAME = 'models'

async function uploadModels() {
  console.log('🚀 3D Model yükleme başlıyor...\n')
  
  // 1. Bucket oluştur (yoksa)
  const { data: buckets } = await supabase.storage.listBuckets()
  const bucketExists = buckets?.some(b => b.name === BUCKET_NAME)
  
  if (!bucketExists) {
    console.log(`📦 "${BUCKET_NAME}" bucket oluşturuluyor...`)
    const { error } = await supabase.storage.createBucket(BUCKET_NAME, {
      public: true,
      fileSizeLimit: 52428800 // 50MB
    })
    if (error) {
      console.error('❌ Bucket oluşturulamadı:', error.message)
      return
    }
    console.log('✅ Bucket oluşturuldu!\n')
  } else {
    console.log(`✅ "${BUCKET_NAME}" bucket mevcut\n`)
  }
  
  // 2. Tüm .glb dosyalarını bul
  const categories = ['anatomy', 'biology', 'chemistry', 'math', 'physics']
  let totalFiles = 0
  let uploadedFiles = 0
  let failedFiles = []
  
  for (const category of categories) {
    const categoryPath = path.join(MODELS_DIR, category)
    
    if (!fs.existsSync(categoryPath)) {
      console.log(`⚠️ ${category} klasörü yok, atlanıyor...`)
      continue
    }
    
    const files = fs.readdirSync(categoryPath).filter(f => f.endsWith('.glb'))
    console.log(`📁 ${category}: ${files.length} model`)
    
    for (const file of files) {
      totalFiles++
      const filePath = path.join(categoryPath, file)
      const storagePath = `${category}/${file}`
      
      try {
        const fileBuffer = fs.readFileSync(filePath)
        const fileSize = (fileBuffer.length / 1024 / 1024).toFixed(2)
        
        process.stdout.write(`   ⬆️ ${file} (${fileSize}MB)... `)
        
        const { error } = await supabase.storage
          .from(BUCKET_NAME)
          .upload(storagePath, fileBuffer, {
            contentType: 'model/gltf-binary',
            upsert: true
          })
        
        if (error) {
          console.log('❌')
          failedFiles.push({ file: storagePath, error: error.message })
        } else {
          console.log('✅')
          uploadedFiles++
        }
      } catch (err) {
        console.log('❌')
        failedFiles.push({ file: storagePath, error: err.message })
      }
    }
    console.log('')
  }
  
  // 3. Sonuç
  console.log('═'.repeat(50))
  console.log(`📊 Sonuç: ${uploadedFiles}/${totalFiles} dosya yüklendi`)
  
  if (failedFiles.length > 0) {
    console.log('\n❌ Başarısız dosyalar:')
    failedFiles.forEach(f => console.log(`   - ${f.file}: ${f.error}`))
  }
  
  // 4. URL örneği
  const baseUrl = `${supabaseUrl}/storage/v1/object/public/${BUCKET_NAME}`
  console.log(`\n🔗 Model URL formatı:`)
  console.log(`   ${baseUrl}/physics/robot.glb`)
}

uploadModels().catch(console.error)
