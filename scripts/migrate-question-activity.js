/**
 * TÜM point_history verilerini Typesense question_activity koleksiyonuna migrate et
 * 
 * Kullanım: 
 *   node scripts/migrate-question-activity.js          # Tüm verileri migrate et
 *   node scripts/migrate-question-activity.js --today  # Sadece bugünü migrate et
 * 
 * Bu script:
 * 1. Supabase point_history tablosundan TÜM kayıtları alır
 * 2. Her kayıt için doğru tarih/hafta/ay hesaplar
 * 3. Typesense question_activity koleksiyonuna batch import yapar
 */

const { createClient } = require('@supabase/supabase-js')
const Typesense = require('typesense')
require('dotenv').config({ path: '.env.local' })

// Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// Typesense client
const typesense = new Typesense.Client({
  nodes: [{
    host: process.env.TYPESENSE_HOST,
    port: 443,
    protocol: 'https'
  }],
  apiKey: process.env.TYPESENSE_API_KEY,
  connectionTimeoutSeconds: 30
})

// Tarih bilgilerini hesapla
function getDateInfo(dateObj) {
  // Türkiye saatine çevir
  const trDate = new Date(dateObj.toLocaleString('en-US', { timeZone: 'Europe/Istanbul' }))
  
  // Tarih string (YYYY-MM-DD)
  const date = trDate.toISOString().split('T')[0]
  
  // Ay (YYYY-MM)
  const month = date.substring(0, 7)
  
  // Hafta hesapla (ISO week)
  const startOfYear = new Date(trDate.getFullYear(), 0, 1)
  const days = Math.floor((trDate.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000))
  const weekNum = Math.ceil((days + startOfYear.getDay() + 1) / 7)
  const week = `${trDate.getFullYear()}-W${weekNum.toString().padStart(2, '0')}`
  
  return { date, week, month }
}

async function migrate() {
  const onlyToday = process.argv.includes('--today')
  
  console.log('\n🚀 Question Activity Migration Başlatılıyor...')
  console.log(`📋 Mod: ${onlyToday ? 'Sadece bugün' : 'TÜM VERİLER'}\n`)
  
  try {
    // Önce toplam kayıt sayısını al
    console.log('📊 Toplam kayıt sayısı kontrol ediliyor...')
    
    let query = supabase
      .from('point_history')
      .select('*', { count: 'exact', head: true })
      .eq('source', 'question')
    
    if (onlyToday) {
      const now = new Date()
      const todayStart = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Istanbul' }))
      todayStart.setHours(0, 0, 0, 0)
      const todayStartUTC = new Date(todayStart.getTime() - (3 * 60 * 60 * 1000))
      query = query.gte('created_at', todayStartUTC.toISOString())
    }
    
    const { count: totalCount, error: countError } = await query
    
    if (countError) {
      console.error('❌ Count hatası:', countError)
      process.exit(1)
    }
    
    console.log(`✅ Toplam ${totalCount} kayıt bulundu\n`)
    
    if (totalCount === 0) {
      console.log('ℹ️  Migrate edilecek kayıt yok.')
      process.exit(0)
    }
    
    // Pagination ile tüm kayıtları al ve migrate et
    const pageSize = 1000
    let offset = 0
    let totalImported = 0
    let totalFailed = 0
    
    while (offset < totalCount) {
      console.log(`📥 Kayıtlar alınıyor... (${offset + 1}-${Math.min(offset + pageSize, totalCount)}/${totalCount})`)
      
      let dataQuery = supabase
        .from('point_history')
        .select('*')
        .eq('source', 'question')
        .order('created_at', { ascending: true })
        .range(offset, offset + pageSize - 1)
      
      if (onlyToday) {
        const now = new Date()
        const todayStart = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Istanbul' }))
        todayStart.setHours(0, 0, 0, 0)
        const todayStartUTC = new Date(todayStart.getTime() - (3 * 60 * 60 * 1000))
        dataQuery = dataQuery.gte('created_at', todayStartUTC.toISOString())
      }
      
      const { data: records, error: fetchError } = await dataQuery
      
      if (fetchError) {
        console.error('❌ Fetch hatası:', fetchError)
        offset += pageSize
        continue
      }
      
      if (!records || records.length === 0) {
        break
      }
      
      // Typesense dökümanlarını hazırla
      const documents = records.map((record, index) => {
        const createdAt = new Date(record.created_at)
        const dateInfo = getDateInfo(createdAt)
        
        return {
          id: `${record.student_id}_${createdAt.getTime()}_${index + offset}`,
          activity_id: `${record.student_id}_${createdAt.getTime()}`,
          student_id: record.student_id,
          question_id: record.metadata?.questionId || '',
          is_correct: record.description === 'Doğru cevap',
          points: record.points || 0,
          source: record.source || 'question',
          date: dateInfo.date,
          week: dateInfo.week,
          month: dateInfo.month,
          subject_code: record.metadata?.subjectCode || '',
          grade: record.metadata?.grade || 0,
          created_at: createdAt.getTime()
        }
      })
      
      // Batch import (250'şer kayıt)
      const batchSize = 250
      let batchImported = 0
      
      for (let i = 0; i < documents.length; i += batchSize) {
        const batch = documents.slice(i, i + batchSize)
        
        try {
          const result = await typesense
            .collections('question_activity')
            .documents()
            .import(batch, { action: 'upsert' })
          
          // Hata kontrolü
          const failed = result.filter(r => !r.success).length
          batchImported += batch.length - failed
          totalFailed += failed
          
          if (failed > 0) {
            console.log(`  ⚠️  ${failed} kayıt başarısız`)
          }
        } catch (importError) {
          console.error(`  ❌ Batch import hatası:`, importError.message)
          totalFailed += batch.length
        }
      }
      
      totalImported += batchImported
      console.log(`  ✅ ${batchImported} kayıt aktarıldı (Toplam: ${totalImported})`)
      
      offset += pageSize
    }
    
    console.log('\n' + '='.repeat(60))
    console.log(`✅ Migration tamamlandı!`)
    console.log(`   📊 Başarılı: ${totalImported}`)
    console.log(`   ❌ Başarısız: ${totalFailed}`)
    console.log(`   📁 Toplam: ${totalCount}`)
    
    // Collection bilgisini göster
    try {
      const collectionInfo = await typesense.collections('question_activity').retrieve()
      console.log(`\n📊 Collection durumu:`)
      console.log(`   Döküman sayısı: ${collectionInfo.num_documents}`)
    } catch (e) {
      // Ignore
    }
    
  } catch (error) {
    console.error('\n❌ Migration hatası:', error)
    process.exit(1)
  }
}

migrate()
