/**
 * Typesense'de question_banks collection oluştur
 * Sadece isim araması için
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
  connectionTimeoutSeconds: 5
})

async function setup() {
  console.log('🔧 question_banks collection oluşturuluyor...')
  
  // Önce varsa sil
  try {
    await client.collections('question_banks').delete()
    console.log('✅ Eski collection silindi')
  } catch (e) {
    console.log('ℹ️  Collection zaten yok')
  }
  
  // Yeni collection oluştur
  const schema = {
    name: 'question_banks',
    fields: [
      { name: 'id', type: 'string' },
      { name: 'title', type: 'string' },
      { name: 'slug', type: 'string' },
      { name: 'subject_name', type: 'string', optional: true, facet: true },
      { name: 'grade', type: 'int32', optional: true, facet: true },
      { name: 'question_count', type: 'int32' },
      { name: 'download_count', type: 'int32' },
      { name: 'created_at', type: 'int64' } // timestamp for sorting
    ],
    default_sorting_field: 'created_at',
    token_separators: ['-', '_']
  }
  
  await client.collections().create(schema)
  console.log('✅ question_banks collection oluşturuldu!')
  
  // Mevcut soru bankalarını indexle
  const { createClient } = require('@supabase/supabase-js')
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )
  
  const { data: banks, error } = await supabase
    .from('question_banks')
    .select('id, title, slug, subject_name, grade, question_count, download_count, created_at')
    .eq('is_public', true)
  
  if (error) {
    console.error('❌ Supabase hatası:', error)
    return
  }
  
  if (!banks || banks.length === 0) {
    console.log('ℹ️  Henüz soru bankası yok')
    return
  }
  
  console.log(`📦 ${banks.length} soru bankası indexleniyor...`)
  
  // Typesense formatına çevir
  const documents = banks.map(bank => ({
    id: bank.id,
    title: bank.title,
    slug: bank.slug,
    subject_name: bank.subject_name || '',
    grade: bank.grade || 0,
    question_count: bank.question_count,
    download_count: bank.download_count || 0,
    created_at: new Date(bank.created_at).getTime()
  }))
  
  // Batch import
  const result = await client.collections('question_banks').documents().import(documents, { action: 'upsert' })
  const successCount = result.filter(r => r.success).length
  console.log(`✅ ${successCount}/${banks.length} soru bankası indexlendi!`)
}

setup().catch(console.error)
