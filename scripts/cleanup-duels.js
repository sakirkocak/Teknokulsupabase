// Bozuk düelloları ve kuyruğu temizle
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function cleanup() {
  console.log('Temizlik yapılıyor...\n')
  
  // 1. Matchmaking kuyruğunu temizle
  const { error: queueError } = await supabase
    .from('matchmaking_queue')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000')
  
  console.log('✅ Matchmaking kuyruğu temizlendi')
  
  // 2. Pending ve active düelloları temizle (son 1 saat)
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
  
  const { error: duelError } = await supabase
    .from('duels')
    .delete()
    .in('status', ['pending', 'active'])
    .gte('created_at', oneHourAgo)
  
  if (duelError) {
    console.error('Düello silme hatası:', duelError)
  } else {
    console.log('✅ Son 1 saatteki pending/active düellolar temizlendi')
  }
  
  console.log('\n🎉 Temizlik tamamlandı!')
}

cleanup()

