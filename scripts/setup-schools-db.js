const XLSX = require('xlsx')
require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

// Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase credentials bulunamadı!')
  console.log('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓' : '✗')
  console.log('SUPABASE_SERVICE_ROLE_KEY:', supabaseKey ? '✓' : '✗')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

const filePath = '/Users/sakirkocak/Desktop/okullar/KurumListeTüm.xlsx'

async function main() {
  console.log('🚀 Okul veritabanı kurulumu başlıyor...\n')

  // 1. Excel'i oku
  console.log('📖 Excel dosyası okunuyor...')
  const workbook = XLSX.readFile(filePath)
  const sheet = workbook.Sheets[workbook.SheetNames[0]]
  const rawData = XLSX.utils.sheet_to_json(sheet, { header: 1 })

  const schools = rawData.slice(2).map(row => ({
    il: row[0]?.toString().trim().toUpperCase(),
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

  console.log(`✅ ${schools.length} okul kaydı okundu\n`)

  // 2. İlleri al
  console.log('🏙️ Türkiye illeri alınıyor...')
  const { data: cities, error: citiesError } = await supabase
    .from('turkey_cities')
    .select('id, name')

  if (citiesError) {
    console.error('❌ İller alınamadı:', citiesError.message)
    console.log('\n💡 Önce turkey_cities tablosunun oluşturulduğundan emin olun.')
    process.exit(1)
  }

  // İl eşleştirme haritası
  const cityMap = {}
  const cityNameMap = {
    'ADANA': 'Adana', 'ADIYAMAN': 'Adıyaman', 'AFYONKARAHİSAR': 'Afyonkarahisar',
    'AĞRI': 'Ağrı', 'AKSARAY': 'Aksaray', 'AMASYA': 'Amasya', 'ANKARA': 'Ankara',
    'ANTALYA': 'Antalya', 'ARDAHAN': 'Ardahan', 'ARTVİN': 'Artvin', 'AYDIN': 'Aydın',
    'BALIKESİR': 'Balıkesir', 'BARTIN': 'Bartın', 'BATMAN': 'Batman', 'BAYBURT': 'Bayburt',
    'BİLECİK': 'Bilecik', 'BİNGÖL': 'Bingöl', 'BİTLİS': 'Bitlis', 'BOLU': 'Bolu',
    'BURDUR': 'Burdur', 'BURSA': 'Bursa', 'ÇANAKKALE': 'Çanakkale', 'ÇANKIRI': 'Çankırı',
    'ÇORUM': 'Çorum', 'DENİZLİ': 'Denizli', 'DİYARBAKIR': 'Diyarbakır', 'DÜZCE': 'Düzce',
    'EDİRNE': 'Edirne', 'ELAZIĞ': 'Elazığ', 'ERZİNCAN': 'Erzincan', 'ERZURUM': 'Erzurum',
    'ESKİŞEHİR': 'Eskişehir', 'GAZİANTEP': 'Gaziantep', 'GİRESUN': 'Giresun',
    'GÜMÜŞHANE': 'Gümüşhane', 'HAKKARİ': 'Hakkari', 'HATAY': 'Hatay', 'IĞDIR': 'Iğdır',
    'ISPARTA': 'Isparta', 'İSTANBUL': 'İstanbul', 'İZMİR': 'İzmir',
    'KAHRAMANMARAŞ': 'Kahramanmaraş', 'KARABÜK': 'Karabük', 'KARAMAN': 'Karaman',
    'KARS': 'Kars', 'KASTAMONU': 'Kastamonu', 'KAYSERİ': 'Kayseri',
    'KIRIKKALE': 'Kırıkkale', 'KIRKLARELİ': 'Kırklareli', 'KIRŞEHİR': 'Kırşehir',
    'KİLİS': 'Kilis', 'KOCAELİ': 'Kocaeli', 'KONYA': 'Konya', 'KÜTAHYA': 'Kütahya',
    'MALATYA': 'Malatya', 'MANİSA': 'Manisa', 'MARDİN': 'Mardin', 'MERSİN': 'Mersin',
    'MUĞLA': 'Muğla', 'MUŞ': 'Muş', 'NEVŞEHİR': 'Nevşehir', 'NİĞDE': 'Niğde',
    'ORDU': 'Ordu', 'OSMANİYE': 'Osmaniye', 'RİZE': 'Rize', 'SAKARYA': 'Sakarya',
    'SAMSUN': 'Samsun', 'SİİRT': 'Siirt', 'SİNOP': 'Sinop', 'SİVAS': 'Sivas',
    'ŞANLIURFA': 'Şanlıurfa', 'ŞIRNAK': 'Şırnak', 'TEKİRDAĞ': 'Tekirdağ',
    'TOKAT': 'Tokat', 'TRABZON': 'Trabzon', 'TUNCELİ': 'Tunceli', 'UŞAK': 'Uşak',
    'VAN': 'Van', 'YALOVA': 'Yalova', 'YOZGAT': 'Yozgat', 'ZONGULDAK': 'Zonguldak'
  }

  cities.forEach(city => {
    cityMap[city.name] = city.id
    // Büyük harfli versiyonu da ekle
    const upperName = city.name.toUpperCase()
    cityMap[upperName] = city.id
  })

  // Excel'deki il isimlerini de eşleştir
  Object.entries(cityNameMap).forEach(([upper, normal]) => {
    const cityId = cityMap[normal]
    if (cityId) {
      cityMap[upper] = cityId
    }
  })

  console.log(`✅ ${cities.length} il bulundu\n`)

  // 3. İlçeleri hazırla ve ekle
  console.log('🏘️ İlçeler hazırlanıyor...')
  const districtSet = new Map()

  schools.forEach(school => {
    const cityId = cityMap[school.il]
    if (!cityId) return

    const key = `${cityId}|${school.ilce}`
    if (!districtSet.has(key)) {
      districtSet.set(key, {
        city_id: cityId,
        name: school.ilce
      })
    }
  })

  const districtData = Array.from(districtSet.values())
  console.log(`📤 ${districtData.length} ilçe ekleniyor...`)

  // Önce mevcut ilçeleri kontrol et
  const { data: existingDistricts } = await supabase
    .from('turkey_districts')
    .select('id, city_id, name')

  const existingDistrictMap = {}
  if (existingDistricts) {
    existingDistricts.forEach(d => {
      existingDistrictMap[`${d.city_id}|${d.name}`] = d.id
    })
  }

  // Sadece yeni ilçeleri ekle
  const newDistricts = districtData.filter(d => !existingDistrictMap[`${d.city_id}|${d.name}`])
  
  if (newDistricts.length > 0) {
    const BATCH_SIZE = 100
    for (let i = 0; i < newDistricts.length; i += BATCH_SIZE) {
      const batch = newDistricts.slice(i, i + BATCH_SIZE)
      const { error } = await supabase
        .from('turkey_districts')
        .insert(batch)
      
      if (error && !error.message.includes('duplicate')) {
        console.error(`  Batch hatası:`, error.message)
      }
      process.stdout.write(`\r  İlçe: ${Math.min(i + BATCH_SIZE, newDistricts.length)}/${newDistricts.length}`)
    }
    console.log('')
  }
  console.log(`✅ İlçeler eklendi\n`)

  // 4. İlçe ID'lerini al
  console.log('📥 İlçe ID\'leri alınıyor...')
  const { data: districts, error: distErr } = await supabase
    .from('turkey_districts')
    .select('id, city_id, name')

  if (distErr) {
    console.error('❌ İlçeler alınamadı:', distErr.message)
    process.exit(1)
  }

  const districtMap = {}
  districts.forEach(d => {
    districtMap[`${d.city_id}|${d.name}`] = d.id
  })
  console.log(`✅ ${districts.length} ilçe ID'si alındı\n`)

  // 5. Okulları hazırla
  console.log('🏫 Okullar hazırlanıyor...')
  const schoolData = []
  let skipped = 0

  schools.forEach(school => {
    const cityId = cityMap[school.il]
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

  console.log(`✅ ${schoolData.length} okul hazırlandı (${skipped} atlandı)\n`)

  // 6. Okulları ekle
  console.log('📤 Okullar veritabanına ekleniyor...')
  console.log('   (Bu işlem birkaç dakika sürebilir...)\n')

  const BATCH_SIZE = 200
  let insertedSchools = 0
  let errors = 0

  for (let i = 0; i < schoolData.length; i += BATCH_SIZE) {
    const batch = schoolData.slice(i, i + BATCH_SIZE)
    const { error } = await supabase
      .from('schools')
      .insert(batch)
    
    if (error) {
      errors++
      if (errors <= 3) {
        console.error(`\n  ❌ Batch ${i}-${i+BATCH_SIZE} hatası:`, error.message)
      }
    } else {
      insertedSchools += batch.length
    }
    
    const progress = Math.round((i / schoolData.length) * 100)
    process.stdout.write(`\r  İlerleme: ${progress}% | ${insertedSchools} okul eklendi`)
  }

  console.log(`\n\n${'='.repeat(50)}`)
  console.log('🎉 TAMAMLANDI!')
  console.log('='.repeat(50))
  console.log(`📍 İlçe sayısı: ${districts.length}`)
  console.log(`🏫 Eklenen okul: ${insertedSchools}`)
  if (errors > 0) {
    console.log(`⚠️  Hatalı batch: ${errors}`)
  }
  console.log('='.repeat(50))
}

main().catch(err => {
  console.error('❌ Kritik hata:', err.message)
  process.exit(1)
})


