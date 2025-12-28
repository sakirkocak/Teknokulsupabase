// Matchmaking kuyruğunu temizle
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function clearQueue() {
  console.log('Matchmaking kuyruğu temizleniyor...')
  
  const { error } = await supabase
    .from('matchmaking_queue')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000') // Tüm kayıtları sil
  
  if (error) {
    console.error('Hata:', error)
  } else {
    console.log('✅ Kuyruk temizlendi!')
  }
}

clearQueue()

