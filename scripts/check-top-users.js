// En aktif kullanıcıları kontrol et
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function main() {
  console.log('📊 En aktif kullanıcıları kontrol ediyorum...\n')
  
  // En çok soru çözen 20 kullanıcı
  const { data: topUsers, error } = await supabase
    .from('student_points')
    .select(`
      student_id,
      total_questions,
      total_correct,
      total_wrong,
      total_points,
      current_streak,
      max_streak
    `)
    .order('total_questions', { ascending: false })
    .limit(20)
  
  // Profil bilgilerini ayrı çek - student_profiles üzerinden
  const userIds = topUsers?.map(u => u.student_id) || []
  
  // Önce student_profiles'dan user_id'leri al
  const { data: studentProfiles } = await supabase
    .from('student_profiles')
    .select('id, user_id')
    .in('id', userIds)
  
  const studentProfileMap = new Map(studentProfiles?.map(sp => [sp.id, sp.user_id]) || [])
  
  // Sonra profiles'dan bilgileri al
  const profileUserIds = [...new Set(studentProfiles?.map(sp => sp.user_id) || [])]
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name, email, created_at')
    .in('id', profileUserIds)
  
  const profileMap = new Map(profiles?.map(p => [p.id, p]) || [])
  
  if (error) {
    console.error('Hata:', error)
    return
  }
  
  console.log('='.repeat(100))
  console.log('EN AKTİF 20 KULLANICI')
  console.log('='.repeat(100))
  
  topUsers.forEach((u, i) => {
    const userId = studentProfileMap.get(u.student_id)
    const profile = userId ? profileMap.get(userId) : null
    const accuracy = u.total_questions > 0 
      ? ((u.total_correct / u.total_questions) * 100).toFixed(1)
      : 0
    
    const daysActive = profile?.created_at 
      ? Math.ceil((Date.now() - new Date(profile.created_at).getTime()) / (1000 * 60 * 60 * 24))
      : 0
    
    const dailyAvg = daysActive > 0 ? (u.total_questions / daysActive).toFixed(1) : 0
    
    console.log(`\n${i + 1}. ${profile?.full_name || 'İsimsiz'}`)
    console.log(`   Email: ${profile?.email || '-'}`)
    console.log(`   Toplam Soru: ${u.total_questions} | Doğru: ${u.total_correct} | Doğruluk: %${accuracy}`)
    console.log(`   Günlük Ortalama: ${dailyAvg} | Kayıt: ${daysActive} gün önce`)
    console.log(`   Puan: ${u.total_points} | Max Streak: ${u.max_streak}`)
    
    // Şüpheli mi?
    const flags = []
    if (u.total_questions > 1000) flags.push('🔴 1000+ soru')
    if (accuracy > 95 && u.total_questions > 500) flags.push('🟠 Yüksek doğruluk')
    if (dailyAvg > 100) flags.push('🔴 Günlük 100+ soru')
    if (dailyAvg > 50) flags.push('🟡 Günlük 50+ soru')
    
    if (flags.length > 0) {
      console.log(`   ⚠️ FLAGS: ${flags.join(', ')}`)
    }
  })
  
  // Özet istatistikler
  console.log('\n' + '='.repeat(100))
  console.log('ÖZET İSTATİSTİKLER')
  console.log('='.repeat(100))
  
  const { count: totalStudents } = await supabase
    .from('student_points')
    .select('*', { count: 'exact', head: true })
  
  const { count: over100 } = await supabase
    .from('student_points')
    .select('*', { count: 'exact', head: true })
    .gt('total_questions', 100)
  
  const { count: over500 } = await supabase
    .from('student_points')
    .select('*', { count: 'exact', head: true })
    .gt('total_questions', 500)
  
  const { count: over1000 } = await supabase
    .from('student_points')
    .select('*', { count: 'exact', head: true })
    .gt('total_questions', 1000)
  
  console.log(`\nToplam öğrenci: ${totalStudents}`)
  console.log(`100+ soru çözen: ${over100}`)
  console.log(`500+ soru çözen: ${over500}`)
  console.log(`1000+ soru çözen: ${over1000}`)
}

main().catch(console.error)
