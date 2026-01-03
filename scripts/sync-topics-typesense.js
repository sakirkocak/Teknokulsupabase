/**
 * 📚 Typesense Topics Sync
 * 
 * Typesense questions collection'ından konu bilgilerini çeker ve topics collection'a yükler.
 * Supabase'e GİTMEZ - tüm veri Typesense'den gelir! ⚡
 * 
 * /sorular/[subject] ve /sorular/[subject]/[grade] sayfaları için şimşek hızı sağlar.
 * 
 * Kullanım:
 * node scripts/sync-topics-typesense.js
 * 
 * Opsiyonlar:
 * --force     Collection'ı silip yeniden oluştur
 * --dry-run   Sadece kontrol et, yükleme yapma
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
  connectionTimeoutSeconds: 30
})

// Topics Collection Schema
const topicsSchema = {
  name: 'topics',
  fields: [
    { name: 'topic_id', type: 'string' },
    { name: 'subject_code', type: 'string', facet: true },
    { name: 'subject_name', type: 'string', facet: true },
    { name: 'grade', type: 'int32', facet: true },
    { name: 'main_topic', type: 'string', facet: true },
    { name: 'sub_topic', type: 'string', facet: true, optional: true },
    { name: 'question_count', type: 'int32' }
  ]
}

async function ensureCollection(forceRecreate = false) {
  try {
    const existing = await typesense.collections('topics').retrieve()
    
    if (forceRecreate) {
      console.log('⚠️  --force: Mevcut topics collection siliniyor...')
      await typesense.collections('topics').delete()
    } else {
      console.log(`✅ Topics collection mevcut (${existing.num_documents} döküman)`)
      return
    }
  } catch (e) {
    if (e.httpStatus !== 404) throw e
    console.log('📦 Topics collection bulunamadı, oluşturuluyor...')
  }
  
  await typesense.collections().create(topicsSchema)
  console.log('✅ Topics collection oluşturuldu!')
}

async function fetchTopicsFromTypesense() {
  console.log('\n📥 Typesense questions collection\'dan konular çekiliyor...')
  console.log('   ⚡ Supabase\'e GİTMİYORUZ - tüm veri Typesense\'den!\n')
  
  // Facet sorgusu ile tüm kombinasyonları çek
  // subject_code + subject_name + grade + main_topic + sub_topic
  const result = await typesense
    .collections('questions')
    .documents()
    .search({
      q: '*',
      query_by: 'question_text',
      per_page: 0,
      facet_by: 'subject_code,subject_name,grade,main_topic,sub_topic',
      max_facet_values: 1000
    })
  
  const facets = result.facet_counts || []
  const totalQuestions = result.found || 0
  
  console.log(`✅ Toplam ${totalQuestions.toLocaleString()} soru bulundu`)
  
  // Facet'lerden topic bilgilerini çıkar
  const subjectCodeFacet = facets.find(f => f.field_name === 'subject_code')
  const subjectNameFacet = facets.find(f => f.field_name === 'subject_name')
  const gradeFacet = facets.find(f => f.field_name === 'grade')
  const mainTopicFacet = facets.find(f => f.field_name === 'main_topic')
  const subTopicFacet = facets.find(f => f.field_name === 'sub_topic')
  
  // Subject code -> name mapping oluştur
  const subjectCodeCounts = subjectCodeFacet?.counts || []
  const subjectNameCounts = subjectNameFacet?.counts || []
  
  const subjectMap = {}
  subjectCodeCounts.forEach((code, index) => {
    // En yakın eşleşmeyi bul
    const matchingName = subjectNameCounts.find(n => n.count === code.count)
    subjectMap[code.value] = matchingName?.value || code.value
  })
  
  console.log(`📚 ${Object.keys(subjectMap).length} ders bulundu:`)
  Object.entries(subjectMap).forEach(([code, name]) => {
    const count = subjectCodeCounts.find(c => c.value === code)?.count || 0
    console.log(`   - ${name} (${code}): ${count.toLocaleString()} soru`)
  })
  
  // Her kombinasyon için detaylı sorgu yap
  console.log('\n📊 Konu bazlı soru sayıları hesaplanıyor...')
  
  const documents = []
  let topicId = 0
  
  // Her subject + grade kombinasyonu için main_topic facet al
  for (const subjectCode of subjectCodeCounts) {
    for (const grade of (gradeFacet?.counts || [])) {
      // Bu kombinasyon için main_topic'leri çek
      const topicResult = await typesense
        .collections('questions')
        .documents()
        .search({
          q: '*',
          query_by: 'question_text',
          filter_by: `subject_code:=${subjectCode.value} && grade:=${grade.value}`,
          per_page: 0,
          facet_by: 'main_topic,sub_topic',
          max_facet_values: 500
        })
      
      const topicFacets = topicResult.facet_counts || []
      const mainTopics = topicFacets.find(f => f.field_name === 'main_topic')?.counts || []
      const subTopics = topicFacets.find(f => f.field_name === 'sub_topic')?.counts || []
      
      // Her main_topic için döküman oluştur
      for (const mainTopic of mainTopics) {
        topicId++
        
        // Bu main_topic'e ait sub_topic'leri bul (ayrı sorgu gerekebilir)
        // Şimdilik sadece main_topic bazlı ekleyelim
        documents.push({
          id: `topic_${topicId}`,
          topic_id: `${subjectCode.value}_${grade.value}_${mainTopic.value}`.replace(/\s+/g, '_').toLowerCase(),
          subject_code: subjectCode.value,
          subject_name: subjectMap[subjectCode.value] || subjectCode.value,
          grade: parseInt(grade.value),
          main_topic: mainTopic.value,
          sub_topic: null, // İleride detaylı sorguyla eklenebilir
          question_count: mainTopic.count
        })
      }
    }
    
    process.stdout.write(`\r   İşlenen: ${subjectCode.value} (${documents.length} topic)`)
  }
  
  console.log(`\n\n✅ ${documents.length} topic hazırlandı`)
  
  return documents
}

async function syncTopics() {
  console.log('\n📚 Typesense Topics Sync\n')
  console.log('='.repeat(50))
  
  const forceRecreate = process.argv.includes('--force')
  const dryRun = process.argv.includes('--dry-run')
  
  console.log(`📡 Typesense Host: ${process.env.TYPESENSE_HOST}`)
  if (forceRecreate) console.log('⚠️  --force modu aktif')
  if (dryRun) console.log('🔍 --dry-run modu aktif (yükleme yapılmayacak)')
  
  // Bağlantı testi
  try {
    const health = await typesense.health.retrieve()
    console.log(`✅ Typesense bağlantısı: ${health.ok ? 'OK' : 'HATA'}`)
  } catch (error) {
    console.error('❌ Typesense bağlantı hatası:', error.message)
    process.exit(1)
  }
  
  // Collection'ı hazırla
  await ensureCollection(forceRecreate)
  
  // Topic'leri Typesense questions'dan çek (Supabase'e gitmiyoruz!)
  const documents = await fetchTopicsFromTypesense()
  
  if (dryRun) {
    console.log('\n🔍 DRY RUN - Yükleme yapılmadı')
    console.log('\n📊 Özet:')
    
    // Subject bazlı dağılım
    const bySubject = {}
    const byGrade = {}
    
    documents.forEach(d => {
      bySubject[d.subject_name] = (bySubject[d.subject_name] || 0) + 1
      byGrade[d.grade] = (byGrade[d.grade] || 0) + 1
    })
    
    console.log('\nDers bazlı topic sayısı:')
    Object.entries(bySubject).sort((a, b) => b[1] - a[1]).forEach(([name, count]) => {
      console.log(`  ${name}: ${count}`)
    })
    
    console.log('\nSınıf bazlı topic sayısı:')
    Object.entries(byGrade).sort((a, b) => a[0] - b[0]).forEach(([grade, count]) => {
      console.log(`  ${grade}. Sınıf: ${count}`)
    })
    
    return
  }
  
  // Typesense'e yükle
  console.log('\n📤 Typesense\'e yükleniyor...')
  
  const BATCH_SIZE = 100
  let imported = 0
  let failed = 0
  
  for (let i = 0; i < documents.length; i += BATCH_SIZE) {
    const batch = documents.slice(i, i + BATCH_SIZE)
    
    try {
      const result = await typesense
        .collections('topics')
        .documents()
        .import(batch, { action: 'upsert' })
      
      // Başarılı/başarısız sayısını hesapla
      result.forEach(r => {
        if (r.success) imported++
        else {
          failed++
          console.error(`  ❌ Hata: ${r.error}`)
        }
      })
      
      const progress = Math.round(((i + batch.length) / documents.length) * 100)
      process.stdout.write(`\r⏳ İlerleme: ${progress}% (${imported} yüklendi)`)
    } catch (error) {
      console.error(`\n❌ Batch hatası:`, error.message)
      failed += batch.length
    }
  }
  
  console.log('\n')
  console.log('='.repeat(50))
  console.log('✅ Sync tamamlandı!')
  console.log(`   📚 Yüklenen: ${imported}`)
  console.log(`   ❌ Hata: ${failed}`)
  
  // Son durum
  const collection = await typesense.collections('topics').retrieve()
  console.log(`\n📊 Topics collection: ${collection.num_documents} döküman`)
  console.log('\n💡 Artık /sorular/[subject] ve /sorular/[subject]/[grade] sayfaları şimşek hızında!')
}

syncTopics().catch(console.error)
