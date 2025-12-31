/**
 * Mevcut point_history verilerini Typesense question_activity koleksiyonuna migrate et
 * 
 * Kullanım: node scripts/migrate-question-activity.js
 * 
 * Bu script:
 * 1. Supabase point_history tablosundan bugünkü kayıtları alır
 * 2. Typesense question_activity koleksiyonuna ekler
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
  connectionTimeoutSeconds: 10
})

async function migrate() {
  console.log('\n🚀 Question Activity Migration Başlatılıyor...\n')
  
  // Bugünün tarihi (Türkiye saati)
  const now = new Date()
  const todayTR = now.toLocaleDateString('en-CA', { timeZone: 'Europe/Istanbul' })
  
  // Bugünün başlangıcı (UTC)
  const todayStart = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Istanbul' }))
  todayStart.setHours(0, 0, 0, 0)
  const todayStartUTC = new Date(todayStart.getTime() - (3 * 60 * 60 * 1000))
  
  console.log(`📅 Bugün: ${todayTR}`)
  console.log(`📅 UTC başlangıç: ${todayStartUTC.toISOString()}\n`)
  
  try {
    // Supabase'den bugünkü point_history kayıtlarını al
    console.log('📥 Supabase\'den bugünkü kayıtlar alınıyor...')
    
    const { data: records, error } = await supabase
      .from('point_history')
      .select('*')
      .gte('created_at', todayStartUTC.toISOString())
      .eq('source', 'question')
      .order('created_at', { ascending: true })
    
    if (error) {
      console.error('❌ Supabase hatası:', error)
      process.exit(1)
    }
    
    console.log(`✅ ${records.length} kayıt bulundu\n`)
    
    if (records.length === 0) {
      console.log('ℹ️  Bugün henüz soru çözülmemiş, migration yapılacak bir şey yok.')
      process.exit(0)
    }
    
    // Hafta hesapla
    const startOfYear = new Date(now.getFullYear(), 0, 1)
    const days = Math.floor((now.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000))
    const weekNum = Math.ceil((days + startOfYear.getDay() + 1) / 7)
    const weekTR = `${now.getFullYear()}-W${weekNum.toString().padStart(2, '0')}`
    const monthTR = todayTR.substring(0, 7)
    
    // Typesense dökümanları hazırla
    const documents = records.map((record, index) => {
      const createdAt = new Date(record.created_at)
      return {
        id: `${record.student_id}_${createdAt.getTime()}_${index}`,
        activity_id: `${record.student_id}_${createdAt.getTime()}`,
        student_id: record.student_id,
        question_id: record.metadata?.questionId || '',
        is_correct: record.description === 'Doğru cevap',
        points: record.points,
        source: record.source,
        date: todayTR,
        week: weekTR,
        month: monthTR,
        created_at: createdAt.getTime()
      }
    })
    
    // Batch import (250'şer kayıt)
    console.log('📤 Typesense\'e aktarılıyor...')
    
    const batchSize = 250
    let imported = 0
    
    for (let i = 0; i < documents.length; i += batchSize) {
      const batch = documents.slice(i, i + batchSize)
      
      try {
        await typesense
          .collections('question_activity')
          .documents()
          .import(batch, { action: 'upsert' })
        
        imported += batch.length
        console.log(`  ✅ ${imported}/${documents.length} kayıt aktarıldı`)
      } catch (importError) {
        console.error(`  ❌ Batch import hatası:`, importError)
      }
    }
    
    console.log('\n' + '='.repeat(50))
    console.log(`✅ Migration tamamlandı! ${imported} kayıt aktarıldı.`)
    console.log(`\n📊 Kontrol için:`)
    console.log(`   curl "https://${process.env.TYPESENSE_HOST}/collections/question_activity" \\`)
    console.log(`     -H "X-TYPESENSE-API-KEY: ${process.env.TYPESENSE_API_KEY?.substring(0, 8)}..."`)
    
  } catch (error) {
    console.error('\n❌ Migration hatası:', error)
    process.exit(1)
  }
}

migrate()
