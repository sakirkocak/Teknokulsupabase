/**
 * Typesense Migration Script
 * 
 * Bu script mevcut Supabase verisini Typesense'e aktarır.
 * 
 * Kullanım:
 * node scripts/typesense-migrate.js
 * 
 * Gerekli env variables:
 * - TYPESENSE_HOST, TYPESENSE_API_KEY
 * - NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */

const Typesense = require('typesense')
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

// Typesense client
const typesense = new Typesense.Client({
  nodes: [{
    host: process.env.TYPESENSE_HOST || '',
    port: 443,
    protocol: 'https'
  }],
  apiKey: process.env.TYPESENSE_API_KEY || '',
  connectionTimeoutSeconds: 30
})

// Supabase client (service role ile)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

const BATCH_SIZE = 500

async function migrateLeaderboard() {
  console.log('\n📊 Leaderboard verisi migrate ediliyor...')
  
  // Student points verisini çek
  const { data: studentPoints, error } = await supabase
    .from('student_points')
    .select(`
      *,
      student:student_profiles!student_points_student_id_fkey(
        id,
        user_id,
        grade,
        city_id,
        district_id,
        school_id,
        profile:profiles!student_profiles_user_id_fkey(full_name, avatar_url),
        city:turkey_cities!student_profiles_city_id_fkey(name),
        district:turkey_districts!student_profiles_district_id_fkey(name),
        school:schools!student_profiles_school_id_fkey(name)
      )
    `)
    .gt('total_questions', 0)
  
  if (error) {
    console.error('❌ Supabase sorgu hatası:', error.message)
    throw error
  }
  
  if (!studentPoints || studentPoints.length === 0) {
    console.log('  ℹ️  Migrate edilecek öğrenci puanı bulunamadı')
    return 0
  }
  
  console.log(`  📥 ${studentPoints.length} öğrenci puanı bulundu`)
  
  // Veriyi Typesense formatına dönüştür
  const documents = studentPoints.map(sp => ({
    id: sp.student_id,
    student_id: sp.student_id,
    user_id: sp.student?.user_id || '',
    full_name: sp.student?.profile?.full_name || 'Anonim',
    avatar_url: sp.student?.profile?.avatar_url || '',
    total_points: sp.total_points || 0,
    total_questions: sp.total_questions || 0,
    total_correct: sp.total_correct || 0,
    total_wrong: sp.total_wrong || 0,
    max_streak: sp.max_streak || 0,
    current_streak: sp.current_streak || 0,
    grade: sp.student?.grade || 0,
    city_id: sp.student?.city_id || '',
    city_name: sp.student?.city?.name || '',
    district_id: sp.student?.district_id || '',
    district_name: sp.student?.district?.name || '',
    school_id: sp.student?.school_id || '',
    school_name: sp.student?.school?.name || '',
    matematik_points: sp.matematik_points || 0,
    turkce_points: sp.turkce_points || 0,
    fen_points: sp.fen_points || 0,
    inkilap_points: sp.inkilap_points || 0,
    din_points: sp.din_points || 0,
    ingilizce_points: sp.ingilizce_points || 0,
    last_activity_at: sp.last_activity_at ? new Date(sp.last_activity_at).getTime() : Date.now()
  }))
  
  // Batch import
  let imported = 0
  for (let i = 0; i < documents.length; i += BATCH_SIZE) {
    const batch = documents.slice(i, i + BATCH_SIZE)
    
    try {
      const result = await typesense.collections('leaderboard').documents().import(batch, { action: 'upsert' })
      const successCount = result.filter(r => r.success).length
      imported += successCount
      console.log(`  ✅ ${imported}/${documents.length} öğrenci aktarıldı`)
    } catch (err) {
      console.error(`  ❌ Batch import hatası:`, err.message)
    }
  }
  
  return imported
}

async function migrateQuestions() {
  console.log('\n📚 Sorular migrate ediliyor...')
  
  // Toplam soru sayısını al
  const { count: totalCount } = await supabase
    .from('questions')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true)
  
  console.log(`  📥 ${totalCount} aktif soru bulundu`)
  
  if (!totalCount || totalCount === 0) {
    console.log('  ℹ️  Migrate edilecek soru bulunamadı')
    return 0
  }
  
  let imported = 0
  let offset = 0
  
  while (offset < totalCount) {
    // Soruları batch halinde çek
    const { data: questions, error } = await supabase
      .from('questions')
      .select(`
        *,
        topic:topics!inner(
          id,
          main_topic,
          sub_topic,
          grade,
          subject:subjects!inner(id, code, name)
        )
      `)
      .eq('is_active', true)
      .range(offset, offset + BATCH_SIZE - 1)
    
    if (error) {
      console.error('❌ Supabase sorgu hatası:', error.message)
      throw error
    }
    
    if (!questions || questions.length === 0) break
    
    // Veriyi Typesense formatına dönüştür
    const documents = questions.map(q => ({
      id: q.id,
      question_id: q.id,
      question_text: q.question_text || '',
      explanation: q.explanation || '',
      difficulty: q.difficulty || 'medium',
      subject_id: q.topic?.subject?.id || '',
      subject_code: q.topic?.subject?.code || '',
      subject_name: q.topic?.subject?.name || '',
      topic_id: q.topic?.id || '',
      main_topic: q.topic?.main_topic || '',
      sub_topic: q.topic?.sub_topic || '',
      grade: q.topic?.grade || 0,
      times_answered: q.times_answered || 0,
      times_correct: q.times_correct || 0,
      success_rate: q.times_answered > 0 ? (q.times_correct / q.times_answered) * 100 : 0,
      created_at: q.created_at ? new Date(q.created_at).getTime() : Date.now()
    }))
    
    try {
      const result = await typesense.collections('questions').documents().import(documents, { action: 'upsert' })
      const successCount = result.filter(r => r.success).length
      imported += successCount
      console.log(`  ✅ ${imported}/${totalCount} soru aktarıldı`)
    } catch (err) {
      console.error(`  ❌ Batch import hatası:`, err.message)
    }
    
    offset += BATCH_SIZE
  }
  
  return imported
}

async function main() {
  console.log('\n🚀 Typesense Migration Başlatılıyor...')
  console.log('=' .repeat(50))
  
  // Env kontrolü
  if (!process.env.TYPESENSE_HOST || !process.env.TYPESENSE_API_KEY) {
    console.error('❌ TYPESENSE_HOST ve TYPESENSE_API_KEY gerekli!')
    process.exit(1)
  }
  
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ SUPABASE_URL ve SUPABASE_SERVICE_ROLE_KEY gerekli!')
    process.exit(1)
  }
  
  console.log(`📡 Typesense: ${process.env.TYPESENSE_HOST}`)
  console.log(`📡 Supabase: ${process.env.NEXT_PUBLIC_SUPABASE_URL}`)
  
  // Bağlantı testi
  try {
    const health = await typesense.health.retrieve()
    console.log(`✅ Typesense bağlantısı: ${health.ok ? 'Healthy' : 'Unhealthy'}`)
  } catch (error) {
    console.error('❌ Typesense bağlantısı başarısız:', error.message)
    process.exit(1)
  }
  
  const startTime = Date.now()
  
  try {
    // Leaderboard migrate et
    const leaderboardCount = await migrateLeaderboard()
    
    // Questions migrate et
    const questionsCount = await migrateQuestions()
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(2)
    
    console.log('\n' + '=' .repeat(50))
    console.log('✅ Migration tamamlandı!')
    console.log(`   📊 Leaderboard: ${leaderboardCount} kayıt`)
    console.log(`   📚 Questions: ${questionsCount} kayıt`)
    console.log(`   ⏱️  Süre: ${duration} saniye`)
    console.log('\n📋 Sonraki adımlar:')
    console.log('   1. Vercel\'e env variables ekleyin')
    console.log('   2. NEXT_PUBLIC_USE_TYPESENSE=true yapın')
    console.log('   3. Webhook\'u aktifleştirin\n')
    
  } catch (error) {
    console.error('\n❌ Migration başarısız:', error.message)
    process.exit(1)
  }
}

main()

