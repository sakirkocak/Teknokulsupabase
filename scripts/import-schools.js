const XLSX = require('xlsx')
const fs = require('fs')
const path = require('path')
require('dotenv').config()
const { createClient } = require('@supabase/supabase-js')

// Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_URL veya SUPABASE_SERVICE_ROLE_KEY tanımlı değil!')
  console.log('Lütfen .env dosyasını kontrol edin.')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

// Excel dosyasını oku
const filePath = '/Users/sakirkocak/Desktop/okullar/KurumListeTüm.xlsx'

async function main() {
  console.log('📖 Excel dosyası okunuyor...')
  const workbook = XLSX.readFile(filePath)
  const sheet = workbook.Sheets[workbook.SheetNames[0]]
  const rawData = XLSX.utils.sheet_to_json(sheet, { header: 1 })

  // İlk 2 satır header, 3. satırdan itibaren veri
  const schools = rawData.slice(2).map(row => ({
    il: row[0]?.toString().trim(),
    ilce: row[1]?.toString().trim(),
    kurum_adi: row[2]?.toString().trim(),
    adres: row[3]?.toString().trim(),
    telefon: row[4]?.toString().trim(),
    fax: row[5]?.toString().trim(),
    mernis_kodu: row[6],
    web_adres: row[7]?.toString().trim(),
    kurum_tur_adi: row[8]?.toString().trim(),
    kurum_tur_kodu: row[9]
  })).filter(row => row.il && row.ilce && row.kurum_adi)

  console.log(`✅ ${schools.length} okul kaydı okundu`)

  // 1. Önce mevcut illeri al
  console.log('\n🏙️ Mevcut iller alınıyor...')
  const { data: cities, error: citiesError } = await supabase
    .from('turkey_cities')
    .select('id, name')

  if (citiesError) {
    console.error('❌ İller alınamadı:', citiesError.message)
    process.exit(1)
  }

  // İl isimlerini normalize et (büyük harf, Türkçe karakter düzelt)
  const cityMap = {}
  cities.forEach(city => {
    const normalizedName = normalizeCity(city.name)
    cityMap[normalizedName] = city.id
  })

  console.log(`✅ ${cities.length} il bulundu`)

  // 2. İlçeleri hazırla
  console.log('\n🏘️ İlçeler hazırlanıyor...')
  const districtSet = new Set()
  const districtData = []

  schools.forEach(school => {
    const normalizedCity = normalizeCity(school.il)
    const cityId = cityMap[normalizedCity]
    
    if (!cityId) {
      // İl bulunamadı, log
      return
    }

    const key = `${cityId}|${school.ilce}`
    if (!districtSet.has(key)) {
      districtSet.add(key)
      districtData.push({
        city_id: cityId,
        name: school.ilce
      })
    }
  })

  console.log(`✅ ${districtData.length} benzersiz ilçe bulundu`)

  // 3. İlçeleri veritabanına ekle
  console.log('\n📤 İlçeler veritabanına ekleniyor...')
  
  // Batch olarak ekle (100'lük gruplar)
  const BATCH_SIZE = 100
  let insertedDistricts = 0
  
  for (let i = 0; i < districtData.length; i += BATCH_SIZE) {
    const batch = districtData.slice(i, i + BATCH_SIZE)
    const { error } = await supabase
      .from('turkey_districts')
      .upsert(batch, { onConflict: 'city_id,name', ignoreDuplicates: true })
    
    if (error) {
      console.error(`❌ İlçe batch ${i}-${i+BATCH_SIZE} hatası:`, error.message)
    } else {
      insertedDistricts += batch.length
      process.stdout.write(`\r  İlçe: ${insertedDistricts}/${districtData.length}`)
    }
  }
  console.log(`\n✅ ${insertedDistricts} ilçe eklendi`)

  // 4. İlçeleri tekrar al (ID'leri almak için)
  console.log('\n📥 İlçe ID\'leri alınıyor...')
  const { data: districts, error: distErr } = await supabase
    .from('turkey_districts')
    .select('id, city_id, name')

  if (distErr) {
    console.error('❌ İlçeler alınamadı:', distErr.message)
    process.exit(1)
  }

  // İlçe haritası oluştur
  const districtMap = {}
  districts.forEach(d => {
    const key = `${d.city_id}|${d.name}`
    districtMap[key] = d.id
  })

  console.log(`✅ ${districts.length} ilçe ID'si alındı`)

  // 5. Okulları hazırla
  console.log('\n🏫 Okullar hazırlanıyor...')
  const schoolData = []
  let skipped = 0

  schools.forEach(school => {
    const normalizedCity = normalizeCity(school.il)
    const cityId = cityMap[normalizedCity]
    
    if (!cityId) {
      skipped++
      return
    }

    const districtKey = `${cityId}|${school.ilce}`
    const districtId = districtMap[districtKey]

    if (!districtId) {
      skipped++
      return
    }

    schoolData.push({
      district_id: districtId,
      name: school.kurum_adi,
      address: school.adres || null,
      phone: school.telefon || null,
      fax: school.fax || null,
      website: school.web_adres || null,
      school_type: school.kurum_tur_adi || null,
      school_type_code: school.kurum_tur_kodu || null,
      institution_code: school.mernis_kodu || null
    })
  })

  console.log(`✅ ${schoolData.length} okul hazırlandı (${skipped} atlandı)`)

  // 6. Okulları veritabanına ekle
  console.log('\n📤 Okullar veritabanına ekleniyor...')
  let insertedSchools = 0
  let schoolErrors = 0

  for (let i = 0; i < schoolData.length; i += BATCH_SIZE) {
    const batch = schoolData.slice(i, i + BATCH_SIZE)
    const { error } = await supabase
      .from('schools')
      .insert(batch)
    
    if (error) {
      schoolErrors++
      if (schoolErrors < 5) {
        console.error(`\n❌ Okul batch ${i}-${i+BATCH_SIZE} hatası:`, error.message)
      }
    } else {
      insertedSchools += batch.length
    }
    process.stdout.write(`\r  Okul: ${insertedSchools}/${schoolData.length} (${schoolErrors} hata)`)
  }

  console.log(`\n\n✅ TAMAMLANDI!`)
  console.log(`   📍 ${insertedDistricts} ilçe eklendi`)
  console.log(`   🏫 ${insertedSchools} okul eklendi`)
  if (schoolErrors > 0) {
    console.log(`   ⚠️ ${schoolErrors} batch hatası`)
  }
}

// İl isimlerini normalize et
function normalizeCity(name) {
  if (!name) return ''
  
  return name
    .toUpperCase()
    .replace('İ', 'I')
    .replace('Ş', 'S')
    .replace('Ğ', 'G')
    .replace('Ü', 'U')
    .replace('Ö', 'O')
    .replace('Ç', 'C')
    .trim()
}

main().catch(console.error)


