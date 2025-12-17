/**
 * MEB Müfredat Import Script
 * Parse edilen müfredat verilerini Supabase'e yükler
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase bağlantı bilgileri eksik!')
  console.log('   NEXT_PUBLIC_SUPABASE_URL ve SUPABASE_SERVICE_ROLE_KEY gerekli')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function importCurriculum() {
  console.log('📚 MEB Müfredat Import Başlatılıyor...\n')
  
  // Parse edilmiş veriyi oku
  const dataPath = path.join(__dirname, 'parsed-curriculum.json')
  
  if (!fs.existsSync(dataPath)) {
    console.error('❌ parsed-curriculum.json bulunamadı!')
    console.log('   Önce parse-meb-curriculum.js scriptini çalıştırın')
    process.exit(1)
  }
  
  const curriculum = JSON.parse(fs.readFileSync(dataPath, 'utf-8'))
  
  console.log(`📊 Yüklenecek veri:`)
  console.log(`   Ünite: ${curriculum.units.length}`)
  console.log(`   Konu: ${curriculum.topics.length}`)
  
  // 1. Önce subjects tablosunu kontrol et ve ID'leri al
  console.log('\n1️⃣ Dersler kontrol ediliyor...')
  const { data: subjects, error: subjectsError } = await supabase
    .from('subjects')
    .select('id, code, name')
  
  if (subjectsError) {
    console.error('❌ Dersler alınamadı:', subjectsError)
    process.exit(1)
  }
  
  const subjectMap = {}
  for (const subject of subjects) {
    subjectMap[subject.code] = subject.id
  }
  
  console.log(`   ✅ ${subjects.length} ders bulundu`)
  
  // 2. Üniteleri yükle
  console.log('\n2️⃣ Üniteler yükleniyor...')
  let unitCount = 0
  let unitErrors = 0
  const unitMap = {} // unit_key -> unit_id mapping
  
  for (const unit of curriculum.units) {
    const subjectId = subjectMap[unit.subject_code]
    
    if (!subjectId) {
      console.log(`   ⚠️ Ders bulunamadı: ${unit.subject_code}`)
      unitErrors++
      continue
    }
    
    const unitData = {
      subject_id: subjectId,
      grade: unit.grade,
      unit_number: unit.unit_number,
      name: unit.name,
      description: unit.description || null,
      is_active: true
    }
    
    const { data, error } = await supabase
      .from('units')
      .upsert(unitData, { 
        onConflict: 'subject_id,grade,unit_number',
        ignoreDuplicates: false 
      })
      .select('id')
      .single()
    
    if (error) {
      // Conflict durumunda mevcut kaydı al
      if (error.code === '23505') {
        const { data: existing } = await supabase
          .from('units')
          .select('id')
          .eq('subject_id', subjectId)
          .eq('grade', unit.grade)
          .eq('unit_number', unit.unit_number)
          .single()
        
        if (existing) {
          const unitKey = `${unit.subject_code}-${unit.grade}-${unit.name}`
          unitMap[unitKey] = existing.id
          unitCount++
        }
      } else {
        console.log(`   ⚠️ Ünite hatası: ${unit.name} - ${error.message}`)
        unitErrors++
      }
    } else if (data) {
      const unitKey = `${unit.subject_code}-${unit.grade}-${unit.name}`
      unitMap[unitKey] = data.id
      unitCount++
    }
  }
  
  console.log(`   ✅ ${unitCount} ünite işlendi (${unitErrors} hata)`)
  
  // 3. Konuları yükle
  console.log('\n3️⃣ Konular ve kazanımlar yükleniyor...')
  let topicCount = 0
  let topicErrors = 0
  let topicSkipped = 0
  
  for (const topic of curriculum.topics) {
    const subjectId = subjectMap[topic.subject_code]
    
    if (!subjectId) {
      console.log(`   ⚠️ Ders bulunamadı: ${topic.subject_code}`)
      topicErrors++
      continue
    }
    
    // Önce mevcut topic var mı kontrol et
    const { data: existingTopic } = await supabase
      .from('topics')
      .select('id')
      .eq('subject_id', subjectId)
      .eq('grade', topic.grade)
      .eq('main_topic', topic.main_topic)
      .maybeSingle()
    
    if (existingTopic) {
      topicSkipped++
      continue
    }
    
    // Unit ID'yi bul
    let unitId = null
    if (topic.unit_name) {
      const unitKey = `${topic.subject_code}-${topic.grade}-${topic.unit_name}`
      unitId = unitMap[unitKey]
    }
    
    const topicData = {
      subject_id: subjectId,
      grade: topic.grade,
      unit_id: unitId,
      unit_number: topic.unit_number || null,
      main_topic: topic.main_topic,
      sub_topic: topic.sub_topic || null,
      learning_outcome: topic.learning_outcome || null,
      is_active: true
    }
    
    const { error } = await supabase
      .from('topics')
      .insert(topicData)
    
    if (error) {
      if (error.code !== '23505') { // Duplicate key değilse
        console.log(`   ⚠️ Konu hatası: ${topic.main_topic} - ${error.message}`)
        topicErrors++
      } else {
        topicSkipped++
      }
    } else {
      topicCount++
    }
  }
  
  console.log(`   ✅ ${topicCount} konu eklendi (${topicSkipped} atlandı, ${topicErrors} hata)`)
  
  // 4. Özet
  console.log('\n' + '='.repeat(50))
  console.log('📊 IMPORT TAMAMLANDI')
  console.log('='.repeat(50))
  
  // Veritabanı özeti
  const { count: totalUnits } = await supabase
    .from('units')
    .select('*', { count: 'exact', head: true })
  
  const { count: totalTopics } = await supabase
    .from('topics')
    .select('*', { count: 'exact', head: true })
  
  const { count: totalQuestions } = await supabase
    .from('questions')
    .select('*', { count: 'exact', head: true })
  
  console.log(`\n📈 Veritabanı Durumu:`)
  console.log(`   Toplam Ünite: ${totalUnits || 0}`)
  console.log(`   Toplam Konu: ${totalTopics || 0}`)
  console.log(`   Toplam Soru: ${totalQuestions || 0}`)
  
  // Sınıf bazlı dağılım
  console.log(`\n📚 Sınıf Bazlı Konu Dağılımı:`)
  
  for (let grade = 1; grade <= 12; grade++) {
    const { count } = await supabase
      .from('topics')
      .select('*', { count: 'exact', head: true })
      .eq('grade', grade)
    
    console.log(`   ${grade}. Sınıf: ${count || 0} konu`)
  }
}

// Çalıştır
importCurriculum()
  .then(() => {
    console.log('\n✅ İşlem tamamlandı!')
    process.exit(0)
  })
  .catch(err => {
    console.error('\n❌ Hata:', err)
    process.exit(1)
  })

