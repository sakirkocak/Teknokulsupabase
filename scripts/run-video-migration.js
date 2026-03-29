/**
 * Video Solutions Migration Runner
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY gerekli!')
  console.log('Lütfen Supabase Dashboard > Settings > API > service_role key\'i .env.local dosyasına ekleyin')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false }
})

async function runMigration() {
  console.log('🚀 Video Solutions Migration başlıyor...')
  
  const sqlPath = path.join(__dirname, '../supabase/migrations/20260106_video_solutions.sql')
  const sql = fs.readFileSync(sqlPath, 'utf8')
  
  // SQL'i parçalara böl (her statement ayrı)
  const statements = sql
    .split(/;\s*$/m)
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'))
  
  console.log(`📝 ${statements.length} SQL statement bulundu`)
  
  let success = 0
  let failed = 0
  
  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i]
    if (stmt.length < 10) continue // Çok kısa statement'ları atla
    
    try {
      const { error } = await supabase.rpc('exec_sql', { sql_query: stmt + ';' })
      
      if (error) {
        // Bazı hatalar görmezden gelinebilir
        if (error.message.includes('already exists')) {
          console.log(`⏭️  Statement ${i + 1}: Zaten var, atlandı`)
          success++
        } else {
          console.error(`❌ Statement ${i + 1} hatası:`, error.message.slice(0, 100))
          failed++
        }
      } else {
        success++
        process.stdout.write('.')
      }
    } catch (err) {
      console.error(`❌ Statement ${i + 1} exception:`, err.message?.slice(0, 100))
      failed++
    }
  }
  
  console.log('\n')
  console.log(`✅ Başarılı: ${success}`)
  console.log(`❌ Başarısız: ${failed}`)
  
  if (failed === 0) {
    console.log('\n🎉 Migration başarıyla tamamlandı!')
  } else {
    console.log('\n⚠️  Bazı statement\'lar başarısız oldu. Supabase Dashboard\'dan manuel kontrol edin.')
  }
}

runMigration().catch(console.error)
