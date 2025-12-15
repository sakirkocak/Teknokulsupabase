const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

const turkishCities = [
  { name: 'Adana', plate_code: 1 },
  { name: 'Adıyaman', plate_code: 2 },
  { name: 'Afyonkarahisar', plate_code: 3 },
  { name: 'Ağrı', plate_code: 4 },
  { name: 'Amasya', plate_code: 5 },
  { name: 'Ankara', plate_code: 6 },
  { name: 'Antalya', plate_code: 7 },
  { name: 'Artvin', plate_code: 8 },
  { name: 'Aydın', plate_code: 9 },
  { name: 'Balıkesir', plate_code: 10 },
  { name: 'Bilecik', plate_code: 11 },
  { name: 'Bingöl', plate_code: 12 },
  { name: 'Bitlis', plate_code: 13 },
  { name: 'Bolu', plate_code: 14 },
  { name: 'Burdur', plate_code: 15 },
  { name: 'Bursa', plate_code: 16 },
  { name: 'Çanakkale', plate_code: 17 },
  { name: 'Çankırı', plate_code: 18 },
  { name: 'Çorum', plate_code: 19 },
  { name: 'Denizli', plate_code: 20 },
  { name: 'Diyarbakır', plate_code: 21 },
  { name: 'Edirne', plate_code: 22 },
  { name: 'Elazığ', plate_code: 23 },
  { name: 'Erzincan', plate_code: 24 },
  { name: 'Erzurum', plate_code: 25 },
  { name: 'Eskişehir', plate_code: 26 },
  { name: 'Gaziantep', plate_code: 27 },
  { name: 'Giresun', plate_code: 28 },
  { name: 'Gümüşhane', plate_code: 29 },
  { name: 'Hakkari', plate_code: 30 },
  { name: 'Hatay', plate_code: 31 },
  { name: 'Isparta', plate_code: 32 },
  { name: 'Mersin', plate_code: 33 },
  { name: 'İstanbul', plate_code: 34 },
  { name: 'İzmir', plate_code: 35 },
  { name: 'Kars', plate_code: 36 },
  { name: 'Kastamonu', plate_code: 37 },
  { name: 'Kayseri', plate_code: 38 },
  { name: 'Kırklareli', plate_code: 39 },
  { name: 'Kırşehir', plate_code: 40 },
  { name: 'Kocaeli', plate_code: 41 },
  { name: 'Konya', plate_code: 42 },
  { name: 'Kütahya', plate_code: 43 },
  { name: 'Malatya', plate_code: 44 },
  { name: 'Manisa', plate_code: 45 },
  { name: 'Kahramanmaraş', plate_code: 46 },
  { name: 'Mardin', plate_code: 47 },
  { name: 'Muğla', plate_code: 48 },
  { name: 'Muş', plate_code: 49 },
  { name: 'Nevşehir', plate_code: 50 },
  { name: 'Niğde', plate_code: 51 },
  { name: 'Ordu', plate_code: 52 },
  { name: 'Rize', plate_code: 53 },
  { name: 'Sakarya', plate_code: 54 },
  { name: 'Samsun', plate_code: 55 },
  { name: 'Siirt', plate_code: 56 },
  { name: 'Sinop', plate_code: 57 },
  { name: 'Sivas', plate_code: 58 },
  { name: 'Tekirdağ', plate_code: 59 },
  { name: 'Tokat', plate_code: 60 },
  { name: 'Trabzon', plate_code: 61 },
  { name: 'Tunceli', plate_code: 62 },
  { name: 'Şanlıurfa', plate_code: 63 },
  { name: 'Uşak', plate_code: 64 },
  { name: 'Van', plate_code: 65 },
  { name: 'Yozgat', plate_code: 66 },
  { name: 'Zonguldak', plate_code: 67 },
  { name: 'Aksaray', plate_code: 68 },
  { name: 'Bayburt', plate_code: 69 },
  { name: 'Karaman', plate_code: 70 },
  { name: 'Kırıkkale', plate_code: 71 },
  { name: 'Batman', plate_code: 72 },
  { name: 'Şırnak', plate_code: 73 },
  { name: 'Bartın', plate_code: 74 },
  { name: 'Ardahan', plate_code: 75 },
  { name: 'Iğdır', plate_code: 76 },
  { name: 'Yalova', plate_code: 77 },
  { name: 'Karabük', plate_code: 78 },
  { name: 'Kilis', plate_code: 79 },
  { name: 'Osmaniye', plate_code: 80 },
  { name: 'Düzce', plate_code: 81 }
]

async function main() {
  console.log('🏙️ Türkiye illeri ekleniyor...\n')

  // Önce tabloyu oluştur (eğer yoksa)
  const { error: createError } = await supabase.rpc('exec_sql', {
    sql: `
      CREATE TABLE IF NOT EXISTS turkey_cities (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL UNIQUE,
        plate_code INTEGER UNIQUE,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
      
      ALTER TABLE turkey_cities ENABLE ROW LEVEL SECURITY;
      
      DROP POLICY IF EXISTS "turkey_cities_select" ON turkey_cities;
      CREATE POLICY "turkey_cities_select" ON turkey_cities FOR SELECT USING (true);
    `
  })

  if (createError) {
    console.log('Tablo zaten var veya RPC mevcut değil, doğrudan eklemeye geçiliyor...')
  }

  // İlleri ekle
  let addedCount = 0
  let existingCount = 0

  for (const city of turkishCities) {
    const { data, error } = await supabase
      .from('turkey_cities')
      .upsert(city, { onConflict: 'name' })
      .select()

    if (error) {
      if (error.code === '42P01') {
        // Tablo yok, oluştur
        console.error('❌ turkey_cities tablosu bulunamadı!')
        console.log('\n📋 Lütfen Supabase SQL Editor\'de şu SQL\'i çalıştırın:\n')
        console.log(`
CREATE TABLE IF NOT EXISTS turkey_cities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  plate_code INTEGER UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE turkey_cities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "turkey_cities_select" ON turkey_cities FOR SELECT USING (true);
        `)
        process.exit(1)
      }
      console.error(`❌ ${city.name}: ${error.message}`)
    } else {
      addedCount++
      process.stdout.write(`\r✅ İller ekleniyor: ${addedCount}/81`)
    }
  }

  console.log(`\n\n✅ Toplam ${addedCount} il eklendi/güncellendi!`)
}

main().catch(console.error)

