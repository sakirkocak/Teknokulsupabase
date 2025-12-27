/**
 * Typesense Migration Script
 * 
 * Bu script mevcut Supabase verisini Typesense'e aktarır.
 * 
 * Kullanım:
 * node scripts/typesense-migrate.js           # Sadece leaderboard ve questions
 * node scripts/typesense-migrate.js --all     # Tüm collection'lar
 * node scripts/typesense-migrate.js --only-new # Sadece yeni collection'lar
 * node scripts/typesense-migrate.js locations  # Tek collection
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

// =========================================
// LEADERBOARD MIGRATION
// =========================================
async function migrateLeaderboard() {
  console.log('\n📊 Leaderboard verisi migrate ediliyor...')
  
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
  
  // Bugünün tarihi (Türkiye saati)
  const todayTR = new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Istanbul' })
  
  // Her öğrenci için bugünkü soru sayısını al
  console.log(`  📅 Bugünün tarihi: ${todayTR}`)
  
  const documents = []
  for (const sp of studentPoints) {
    // Bugün bu öğrencinin çözdüğü soru sayısını al
    const { count: todayQuestionsCount } = await supabase
      .from('point_history')
      .select('*', { count: 'exact', head: true })
      .eq('student_id', sp.student_id)
      .eq('source', 'question')
      .gte('created_at', `${todayTR}T00:00:00+03:00`)
    
    const { count: todayCorrectCount } = await supabase
      .from('point_history')
      .select('*', { count: 'exact', head: true })
      .eq('student_id', sp.student_id)
      .eq('source', 'question')
      .eq('is_correct', true)
      .gte('created_at', `${todayTR}T00:00:00+03:00`)
    
    documents.push({
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
      // Günlük istatistikler
      today_questions: todayQuestionsCount || 0,
      today_correct: todayCorrectCount || 0,
      today_date: todayTR,
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
    })
  }
  
  console.log(`  📊 Bugün toplam ${documents.reduce((sum, d) => sum + d.today_questions, 0)} soru çözülmüş`)
  
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

// =========================================
// QUESTIONS MIGRATION
// =========================================
async function migrateQuestions() {
  console.log('\n📚 Sorular migrate ediliyor...')
  
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
      has_image: q.image_url ? true : false,
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

// =========================================
// LOCATIONS MIGRATION (İller ve İlçeler)
// =========================================
async function migrateLocations() {
  console.log('\n📍 Lokasyonlar (İl/İlçe) migrate ediliyor...')
  
  // İlleri çek
  const { data: cities, error: citiesError } = await supabase
    .from('turkey_cities')
    .select('id, name, plate_code')
    .order('plate_code')
  
  if (citiesError) {
    console.error('❌ İller sorgu hatası:', citiesError.message)
    throw citiesError
  }
  
  console.log(`  📥 ${cities?.length || 0} il bulundu`)
  
  // İlçeleri çek
  const { data: districts, error: districtsError } = await supabase
    .from('turkey_districts')
    .select('id, city_id, name')
  
  if (districtsError) {
    console.error('❌ İlçeler sorgu hatası:', districtsError.message)
    throw districtsError
  }
  
  console.log(`  📥 ${districts?.length || 0} ilçe bulundu`)
  
  // City ID -> Name map
  const cityMap = new Map(cities?.map(c => [c.id, c]) || [])
  
  // Dökümanları hazırla
  const documents = []
  
  // İller
  for (const city of (cities || [])) {
    documents.push({
      id: `city_${city.id}`,
      location_id: city.id,
      name: city.name,
      type: 'city',
      plate_code: city.plate_code || 0
    })
  }
  
  // İlçeler
  for (const district of (districts || [])) {
    const parentCity = cityMap.get(district.city_id)
    documents.push({
      id: `district_${district.id}`,
      location_id: district.id,
      name: district.name,
      type: 'district',
      parent_id: district.city_id || '',
      parent_name: parentCity?.name || ''
    })
  }
  
  console.log(`  📦 Toplam ${documents.length} lokasyon hazırlandı`)
  
  // Import
  let imported = 0
  for (let i = 0; i < documents.length; i += BATCH_SIZE) {
    const batch = documents.slice(i, i + BATCH_SIZE)
    
    try {
      const result = await typesense.collections('locations').documents().import(batch, { action: 'upsert' })
      const successCount = result.filter(r => r.success).length
      imported += successCount
      console.log(`  ✅ ${imported}/${documents.length} lokasyon aktarıldı`)
    } catch (err) {
      console.error(`  ❌ Batch import hatası:`, err.message)
    }
  }
  
  return imported
}

// =========================================
// SCHOOLS MIGRATION
// =========================================
async function migrateSchools() {
  console.log('\n🏫 Okullar migrate ediliyor...')
  
  // Toplam okul sayısı
  const { count: totalCount } = await supabase
    .from('schools')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true)
  
  console.log(`  📥 ${totalCount} aktif okul bulundu`)
  
  if (!totalCount || totalCount === 0) {
    console.log('  ℹ️  Migrate edilecek okul bulunamadı')
    return 0
  }
  
  // İl ve ilçe bilgilerini al
  const { data: cities } = await supabase
    .from('turkey_cities')
    .select('id, name')
  
  const { data: districts } = await supabase
    .from('turkey_districts')
    .select('id, city_id, name')
  
  const cityMap = new Map(cities?.map(c => [c.id, c.name]) || [])
  const districtMap = new Map(districts?.map(d => [d.id, { name: d.name, city_id: d.city_id }]) || [])
  
  let imported = 0
  let offset = 0
  
  while (offset < totalCount) {
    const { data: schools, error } = await supabase
      .from('schools')
      .select('id, name, district_id, school_type, ownership_type')
      .eq('is_active', true)
      .range(offset, offset + BATCH_SIZE - 1)
    
    if (error) {
      console.error('❌ Supabase sorgu hatası:', error.message)
      throw error
    }
    
    if (!schools || schools.length === 0) break
    
    const documents = schools.map(s => {
      const district = districtMap.get(s.district_id)
      const cityId = district?.city_id || ''
      const cityName = cityId ? (cityMap.get(cityId) || '') : ''
      
      return {
        id: s.id,
        school_id: s.id,
        name: s.name || '',
        city_id: cityId,
        city_name: cityName,
        district_id: s.district_id || '',
        district_name: district?.name || '',
        school_type: s.school_type || '',
        ownership_type: s.ownership_type || ''
      }
    })
    
    try {
      const result = await typesense.collections('schools').documents().import(documents, { action: 'upsert' })
      const successCount = result.filter(r => r.success).length
      imported += successCount
      console.log(`  ✅ ${imported}/${totalCount} okul aktarıldı`)
    } catch (err) {
      console.error(`  ❌ Batch import hatası:`, err.message)
    }
    
    offset += BATCH_SIZE
  }
  
  return imported
}

// =========================================
// STUDENT STATS MIGRATION
// =========================================
async function migrateStudentStats() {
  console.log('\n📈 Öğrenci istatistikleri migrate ediliyor...')
  
  // student_points'tan al ve hesapla
  const { data: studentPoints, error } = await supabase
    .from('student_points')
    .select(`
      *,
      student:student_profiles!student_points_student_id_fkey(
        id,
        grade,
        profile:profiles!student_profiles_user_id_fkey(full_name)
      )
    `)
    .gt('total_questions', 0)
  
  if (error) {
    console.error('❌ Supabase sorgu hatası:', error.message)
    throw error
  }
  
  if (!studentPoints || studentPoints.length === 0) {
    console.log('  ℹ️  Migrate edilecek öğrenci istatistiği bulunamadı')
    return 0
  }
  
  console.log(`  📥 ${studentPoints.length} öğrenci istatistiği bulundu`)
  
  const documents = studentPoints.map(sp => {
    const totalQuestions = sp.total_questions || 0
    const totalCorrect = sp.total_correct || 0
    const totalWrong = sp.total_wrong || 0
    
    return {
      id: sp.student_id,
      student_id: sp.student_id,
      student_name: sp.student?.profile?.full_name || 'Anonim',
      grade: sp.student?.grade || 0,
      total_questions: totalQuestions,
      total_correct: totalCorrect,
      total_wrong: totalWrong,
      overall_success_rate: totalQuestions > 0 ? (totalCorrect / totalQuestions) * 100 : 0,
      total_points: sp.total_points || 0,
      current_streak: sp.current_streak || 0,
      max_streak: sp.max_streak || 0,
      weak_topics: [], // Şimdilik boş, sonra user_answers'dan hesaplanacak
      strong_topics: [], // Şimdilik boş
      last_activity_at: sp.last_activity_at ? new Date(sp.last_activity_at).getTime() : Date.now()
    }
  })
  
  let imported = 0
  for (let i = 0; i < documents.length; i += BATCH_SIZE) {
    const batch = documents.slice(i, i + BATCH_SIZE)
    
    try {
      const result = await typesense.collections('student_stats').documents().import(batch, { action: 'upsert' })
      const successCount = result.filter(r => r.success).length
      imported += successCount
      console.log(`  ✅ ${imported}/${documents.length} öğrenci istatistiği aktarıldı`)
    } catch (err) {
      console.error(`  ❌ Batch import hatası:`, err.message)
    }
  }
  
  return imported
}

// =========================================
// STUDENT TOPIC PROGRESS MIGRATION
// =========================================
async function migrateStudentTopicProgress() {
  console.log('\n📊 Öğrenci konu ilerlemeleri migrate ediliyor...')
  
  // Önce direkt tablodan dene, yoksa RPC'yi dene
  const { data: tableData, error: tableError } = await supabase
    .from('student_topic_stats')
    .select(`
      student_id,
      topic_id,
      total_attempted,
      total_correct,
      total_wrong,
      consecutive_correct,
      mastery_level,
      current_difficulty,
      last_attempted_at,
      topic:topics(
        main_topic,
        grade,
        subject:subjects(code, name)
      )
    `)
    .gt('total_attempted', 0)
  
  let progressData = null
  
  if (!tableError && tableData && tableData.length > 0) {
    console.log(`  📥 ${tableData.length} konu ilerlemesi bulundu (tablodan)`)
    progressData = tableData.map(row => ({
      student_id: row.student_id,
      topic_id: row.topic_id,
      subject_code: row.topic?.subject?.code || '',
      subject_name: row.topic?.subject?.name || '',
      main_topic: row.topic?.main_topic || '',
      grade: row.topic?.grade || 0,
      total_attempted: row.total_attempted || 0,
      total_correct: row.total_correct || 0,
      consecutive_correct: row.consecutive_correct || 0,
      mastery_level: row.mastery_level || 'beginner',
      current_difficulty: row.current_difficulty || 'medium',
      last_practiced_at: row.last_attempted_at
    }))
  } else {
    // Tablo yoksa RPC dene
    const { data: rpcData, error: rpcError } = await supabase.rpc('get_student_topic_progress')
    
    if (rpcError) {
      console.log('  ⚠️  RPC bulunamadı, manuel hesaplama yapılıyor...')
      return await calculateStudentTopicProgressManually()
    }
    progressData = rpcData
  }
  
  const error = null
  
  if (!progressData || progressData.length === 0) {
    console.log('  ℹ️  Migrate edilecek konu ilerlemesi bulunamadı')
    return 0
  }
  
  console.log(`  📥 ${progressData.length} konu ilerlemesi bulundu`)
  
  const documents = progressData.map(p => ({
    id: `${p.student_id}_${p.topic_id}`,
    progress_id: `${p.student_id}_${p.topic_id}`,
    student_id: p.student_id,
    topic_id: p.topic_id,
    subject_code: p.subject_code || '',
    subject_name: p.subject_name || '',
    main_topic: p.main_topic || '',
    grade: p.grade || 0,
    total_attempted: p.total_attempted || 0,
    total_correct: p.total_correct || 0,
    success_rate: p.total_attempted > 0 ? (p.total_correct / p.total_attempted) * 100 : 0,
    mastery_level: calculateMasteryLevel(p.total_attempted, p.total_correct),
    current_difficulty: calculateCurrentDifficulty(p.consecutive_correct || 0, p.success_rate || 0),
    consecutive_correct: p.consecutive_correct || 0,
    last_practiced_at: p.last_practiced_at ? new Date(p.last_practiced_at).getTime() : Date.now()
  }))
  
  let imported = 0
  for (let i = 0; i < documents.length; i += BATCH_SIZE) {
    const batch = documents.slice(i, i + BATCH_SIZE)
    
    try {
      const result = await typesense.collections('student_topic_progress').documents().import(batch, { action: 'upsert' })
      const successCount = result.filter(r => r.success).length
      imported += successCount
      console.log(`  ✅ ${imported}/${documents.length} konu ilerlemesi aktarıldı`)
    } catch (err) {
      console.error(`  ❌ Batch import hatası:`, err.message)
    }
  }
  
  return imported
}

// Manuel konu ilerlemesi hesaplama (RPC yoksa)
async function calculateStudentTopicProgressManually() {
  // user_answers'dan aggregate
  const { data: answers, error } = await supabase
    .from('user_answers')
    .select(`
      student_id,
      is_correct,
      question:questions(
        topic_id,
        topic:topics(
          main_topic,
          grade,
          subject:subjects(code, name)
        )
      )
    `)
    .limit(50000) // Limit for safety
  
  if (error || !answers) {
    console.log('  ℹ️  user_answers verisi bulunamadı veya hata:', error?.message)
    return 0
  }
  
  // Student-Topic bazında grupla
  const progressMap = new Map()
  
  for (const answer of answers) {
    if (!answer.student_id || !answer.question?.topic_id) continue
    
    const key = `${answer.student_id}_${answer.question.topic_id}`
    
    if (!progressMap.has(key)) {
      progressMap.set(key, {
        student_id: answer.student_id,
        topic_id: answer.question.topic_id,
        subject_code: answer.question.topic?.subject?.code || '',
        subject_name: answer.question.topic?.subject?.name || '',
        main_topic: answer.question.topic?.main_topic || '',
        grade: answer.question.topic?.grade || 0,
        total_attempted: 0,
        total_correct: 0,
        consecutive_correct: 0,
        last_practiced_at: Date.now()
      })
    }
    
    const progress = progressMap.get(key)
    progress.total_attempted++
    if (answer.is_correct) {
      progress.total_correct++
    }
  }
  
  const documents = Array.from(progressMap.values()).map(p => ({
    id: `${p.student_id}_${p.topic_id}`,
    progress_id: `${p.student_id}_${p.topic_id}`,
    student_id: p.student_id,
    topic_id: p.topic_id,
    subject_code: p.subject_code,
    subject_name: p.subject_name,
    main_topic: p.main_topic,
    grade: p.grade,
    total_attempted: p.total_attempted,
    total_correct: p.total_correct,
    success_rate: p.total_attempted > 0 ? (p.total_correct / p.total_attempted) * 100 : 0,
    mastery_level: calculateMasteryLevel(p.total_attempted, p.total_correct),
    current_difficulty: 'medium',
    consecutive_correct: 0,
    last_practiced_at: p.last_practiced_at
  }))
  
  console.log(`  📦 ${documents.length} konu ilerlemesi hesaplandı`)
  
  let imported = 0
  for (let i = 0; i < documents.length; i += BATCH_SIZE) {
    const batch = documents.slice(i, i + BATCH_SIZE)
    
    try {
      const result = await typesense.collections('student_topic_progress').documents().import(batch, { action: 'upsert' })
      const successCount = result.filter(r => r.success).length
      imported += successCount
      console.log(`  ✅ ${imported}/${documents.length} konu ilerlemesi aktarıldı`)
    } catch (err) {
      console.error(`  ❌ Batch import hatası:`, err.message)
    }
  }
  
  return imported
}

// Mastery level hesapla
function calculateMasteryLevel(totalAttempted, totalCorrect) {
  if (totalAttempted < 5) return 'beginner'
  
  const successRate = (totalCorrect / totalAttempted) * 100
  
  if (totalAttempted >= 20 && successRate >= 85) return 'master'
  if (totalAttempted >= 10 && successRate >= 70) return 'proficient'
  if (successRate >= 50) return 'learning'
  return 'beginner'
}

// Current difficulty hesapla (adaptive learning için)
function calculateCurrentDifficulty(consecutiveCorrect, successRate) {
  if (consecutiveCorrect >= 5 && successRate >= 80) return 'hard'
  if (consecutiveCorrect >= 3 && successRate >= 60) return 'medium'
  return 'easy'
}

// =========================================
// MAIN
// =========================================
async function main() {
  console.log('\n🚀 Typesense Migration Başlatılıyor...')
  console.log('=' .repeat(50))
  
  // Komut satırı argümanları
  const args = process.argv.slice(2)
  const migrateAll = args.includes('--all')
  const onlyNew = args.includes('--only-new')
  const specificCollection = args.find(a => !a.startsWith('--'))
  
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
  const results = {}
  
  try {
    // Migration planı
    const migrations = {
      leaderboard: migrateLeaderboard,
      questions: migrateQuestions,
      locations: migrateLocations,
      schools: migrateSchools,
      student_stats: migrateStudentStats,
      student_topic_progress: migrateStudentTopicProgress
    }
    
    const newCollections = ['locations', 'schools', 'student_stats', 'student_topic_progress']
    const defaultCollections = ['leaderboard', 'questions']
    
    let collectionsToMigrate = []
    
    if (specificCollection) {
      // Tek collection
      if (migrations[specificCollection]) {
        collectionsToMigrate = [specificCollection]
      } else {
        console.error(`❌ Bilinmeyen collection: ${specificCollection}`)
        console.log('Mevcut collection\'lar:', Object.keys(migrations).join(', '))
        process.exit(1)
      }
    } else if (migrateAll) {
      // Tümü
      collectionsToMigrate = Object.keys(migrations)
    } else if (onlyNew) {
      // Sadece yeniler
      collectionsToMigrate = newCollections
    } else {
      // Default: leaderboard ve questions
      collectionsToMigrate = defaultCollections
    }
    
    console.log(`\n📦 Migrate edilecek: ${collectionsToMigrate.join(', ')}`)
    
    // Migration'ları çalıştır
    for (const name of collectionsToMigrate) {
      try {
        results[name] = await migrations[name]()
      } catch (err) {
        console.error(`  ❌ ${name} migration hatası:`, err.message)
        results[name] = 0
      }
    }
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(2)
    
    console.log('\n' + '=' .repeat(50))
    console.log('✅ Migration tamamlandı!')
    console.log('\n📊 Sonuçlar:')
    for (const [name, count] of Object.entries(results)) {
      console.log(`   ${name}: ${count} kayıt`)
    }
    console.log(`\n⏱️  Süre: ${duration} saniye`)
    
  } catch (error) {
    console.error('\n❌ Migration başarısız:', error.message)
    process.exit(1)
  }
}

main()
