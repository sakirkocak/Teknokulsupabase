// Son düelloları kontrol et
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function checkDuels() {
  console.log('Son 5 düello kontrol ediliyor...\n')
  
  const { data: duels, error } = await supabase
    .from('duels')
    .select(`
      id,
      challenger_id,
      opponent_id,
      status,
      challenger_ready,
      opponent_ready,
      created_at
    `)
    .order('created_at', { ascending: false })
    .limit(5)
  
  if (error) {
    console.error('Hata:', error)
    return
  }
  
  console.log('Düellolar:')
  duels.forEach((d, i) => {
    console.log(`\n${i + 1}. Düello: ${d.id}`)
    console.log(`   Status: ${d.status}`)
    console.log(`   Challenger: ${d.challenger_id} (ready: ${d.challenger_ready})`)
    console.log(`   Opponent: ${d.opponent_id} (ready: ${d.opponent_ready})`)
    console.log(`   Created: ${d.created_at}`)
  })

  // Matchmaking kuyruğunu da kontrol et
  console.log('\n\nMatchmaking Kuyruğu:')
  const { data: queue } = await supabase
    .from('matchmaking_queue')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5)
  
  if (queue && queue.length > 0) {
    queue.forEach((q, i) => {
      console.log(`\n${i + 1}. Kuyruk: ${q.id}`)
      console.log(`   Student: ${q.student_id}`)
      console.log(`   Status: ${q.status}`)
      console.log(`   Duel ID: ${q.duel_id}`)
    })
  } else {
    console.log('Kuyrukta kimse yok')
  }
}

checkDuels()

