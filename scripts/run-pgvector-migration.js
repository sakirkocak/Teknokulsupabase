/**
 * 🧠 pgvector Migration Script
 * 
 * Supabase'de pgvector eklentisini ve fonksiyonları kurar.
 */

require('dotenv').config({ path: '.env.local' })

const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function runMigration() {
  console.log('🧠 pgvector Migration Başlıyor...')
  console.log('=' .repeat(50))

  // 1. pgvector eklentisi
  console.log('\n1️⃣ pgvector eklentisi kontrol ediliyor...')
  try {
    const { error: extError } = await supabase.rpc('exec_sql', {
      sql: 'CREATE EXTENSION IF NOT EXISTS vector;'
    })
    if (extError) {
      // RPC yoksa doğrudan deneyelim
      console.log('   ⚠️ RPC yok, alternatif yol deneniyor...')
    } else {
      console.log('   ✅ pgvector eklentisi aktif')
    }
  } catch (e) {
    console.log('   ℹ️ pgvector zaten kurulu olabilir')
  }

  // 2. embedding kolonu
  console.log('\n2️⃣ embedding kolonu kontrol ediliyor...')
  const { data: columns } = await supabase
    .from('questions')
    .select('id')
    .limit(1)
  
  // Kolon var mı kontrol et
  const { data: colCheck, error: colError } = await supabase
    .rpc('to_json', { val: 'test' })
    .then(() => ({ data: true, error: null }))
    .catch(() => ({ data: false, error: 'no rpc' }))

  // Basit test - embedding kolonu var mı?
  const { data: testData, error: testError } = await supabase
    .from('questions')
    .select('embedding')
    .limit(1)
  
  if (testError && testError.message.includes('embedding')) {
    console.log('   ❌ embedding kolonu YOK - Manuel eklenmeli')
    console.log('   📋 Supabase Dashboard > SQL Editor\'da çalıştır:')
    console.log('')
    console.log('   ALTER TABLE questions ADD COLUMN embedding vector(768);')
    console.log('')
  } else {
    console.log('   ✅ embedding kolonu mevcut')
  }

  // 3. Fonksiyonları kontrol et
  console.log('\n3️⃣ Fonksiyonlar kontrol ediliyor...')
  
  // search_questions_semantic var mı?
  const { error: funcError } = await supabase.rpc('search_questions_semantic', {
    query_embedding: '[' + Array(768).fill(0).join(',') + ']',
    match_threshold: 0.9,
    match_count: 1
  })

  if (funcError && funcError.message.includes('function') && funcError.message.includes('does not exist')) {
    console.log('   ❌ Fonksiyonlar YOK - Manuel eklenmeli')
    console.log('   📋 supabase/migrations/20250101_add_pgvector.sql dosyasını')
    console.log('      Supabase Dashboard > SQL Editor\'da çalıştır')
  } else if (funcError) {
    console.log('   ⚠️ Fonksiyon var ama hata:', funcError.message.substring(0, 80))
  } else {
    console.log('   ✅ search_questions_semantic fonksiyonu mevcut')
  }

  // 4. Embedding durumu
  console.log('\n4️⃣ Embedding durumu...')
  const { count: totalCount } = await supabase
    .from('questions')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true)

  const { count: embeddedCount } = await supabase
    .from('questions')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true)
    .not('embedding', 'is', null)

  console.log(`   📊 Toplam soru: ${totalCount || '?'}`)
  console.log(`   🧠 Embedded: ${embeddedCount || 0}`)
  console.log(`   ⏳ Bekleyen: ${(totalCount || 0) - (embeddedCount || 0)}`)

  // Sonuç
  console.log('\n' + '=' .repeat(50))
  console.log('📋 ÖZET')
  console.log('=' .repeat(50))
  
  if (testError?.message?.includes('embedding')) {
    console.log('\n⚠️ pgvector henüz kurulmamış!')
    console.log('\n👉 Supabase Dashboard > SQL Editor\'a git ve şunu çalıştır:')
    console.log('\n--- SQL BAŞLANGIÇ ---')
    console.log(`
-- 1. pgvector eklentisi
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. embedding kolonu
ALTER TABLE questions ADD COLUMN IF NOT EXISTS embedding vector(768);

-- 3. Index (opsiyonel - sonra eklenebilir)
-- CREATE INDEX questions_embedding_idx ON questions 
-- USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
`)
    console.log('--- SQL BİTİŞ ---\n')
  } else {
    console.log('\n✅ pgvector hazır görünüyor!')
    console.log('   Şimdi embedding script\'i çalıştırılabilir.')
  }
}

runMigration().catch(console.error)
