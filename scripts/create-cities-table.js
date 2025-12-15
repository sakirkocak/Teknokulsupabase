const { Client } = require('pg')
require('dotenv').config({ path: '.env.local' })

// Supabase direct connection
// Format: postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
const connectionString = process.env.DATABASE_URL || 
  `postgresql://postgres.cnawnprwdcfmyswqolsu:${process.env.SUPABASE_DB_PASSWORD}@aws-0-eu-central-1.pooler.supabase.com:6543/postgres`

const turkishCities = [
  "('Adana', 1)", "('Adıyaman', 2)", "('Afyonkarahisar', 3)", "('Ağrı', 4)", "('Amasya', 5)",
  "('Ankara', 6)", "('Antalya', 7)", "('Artvin', 8)", "('Aydın', 9)", "('Balıkesir', 10)",
  "('Bilecik', 11)", "('Bingöl', 12)", "('Bitlis', 13)", "('Bolu', 14)", "('Burdur', 15)",
  "('Bursa', 16)", "('Çanakkale', 17)", "('Çankırı', 18)", "('Çorum', 19)", "('Denizli', 20)",
  "('Diyarbakır', 21)", "('Edirne', 22)", "('Elazığ', 23)", "('Erzincan', 24)", "('Erzurum', 25)",
  "('Eskişehir', 26)", "('Gaziantep', 27)", "('Giresun', 28)", "('Gümüşhane', 29)", "('Hakkari', 30)",
  "('Hatay', 31)", "('Isparta', 32)", "('Mersin', 33)", "('İstanbul', 34)", "('İzmir', 35)",
  "('Kars', 36)", "('Kastamonu', 37)", "('Kayseri', 38)", "('Kırklareli', 39)", "('Kırşehir', 40)",
  "('Kocaeli', 41)", "('Konya', 42)", "('Kütahya', 43)", "('Malatya', 44)", "('Manisa', 45)",
  "('Kahramanmaraş', 46)", "('Mardin', 47)", "('Muğla', 48)", "('Muş', 49)", "('Nevşehir', 50)",
  "('Niğde', 51)", "('Ordu', 52)", "('Rize', 53)", "('Sakarya', 54)", "('Samsun', 55)",
  "('Siirt', 56)", "('Sinop', 57)", "('Sivas', 58)", "('Tekirdağ', 59)", "('Tokat', 60)",
  "('Trabzon', 61)", "('Tunceli', 62)", "('Şanlıurfa', 63)", "('Uşak', 64)", "('Van', 65)",
  "('Yozgat', 66)", "('Zonguldak', 67)", "('Aksaray', 68)", "('Bayburt', 69)", "('Karaman', 70)",
  "('Kırıkkale', 71)", "('Batman', 72)", "('Şırnak', 73)", "('Bartın', 74)", "('Ardahan', 75)",
  "('Iğdır', 76)", "('Yalova', 77)", "('Karabük', 78)", "('Kilis', 79)", "('Osmaniye', 80)",
  "('Düzce', 81)"
]

const sql = `
-- Tablo oluştur
CREATE TABLE IF NOT EXISTS turkey_cities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    plate_code INTEGER UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS aktif et
ALTER TABLE turkey_cities ENABLE ROW LEVEL SECURITY;

-- Policy oluştur (varsa güncelle)
DROP POLICY IF EXISTS "turkey_cities_select" ON turkey_cities;
CREATE POLICY "turkey_cities_select" ON turkey_cities FOR SELECT USING (true);

-- İlleri ekle
INSERT INTO turkey_cities (name, plate_code) VALUES
${turkishCities.join(',\n')}
ON CONFLICT (name) DO NOTHING;

-- Kontrol
SELECT COUNT(*) as total FROM turkey_cities;
`

async function main() {
  if (!process.env.DATABASE_URL && !process.env.SUPABASE_DB_PASSWORD) {
    console.log('❌ DATABASE_URL veya SUPABASE_DB_PASSWORD bulunamadı!')
    console.log('\n.env.local dosyasına şunu ekleyin:')
    console.log('DATABASE_URL=postgresql://postgres:[SIFRE]@db.cnawnprwdcfmyswqolsu.supabase.co:5432/postgres')
    console.log('\nŞifreyi Supabase Dashboard > Project Settings > Database > Connection string den alabilirsiniz.')
    return
  }

  console.log('🏙️ Türkiye illeri tablosu oluşturuluyor...\n')

  const client = new Client({ connectionString })
  
  try {
    await client.connect()
    console.log('✅ Veritabanına bağlandı')
    
    const result = await client.query(sql)
    console.log('✅ Tablo oluşturuldu ve iller eklendi!')
    console.log(`📊 Toplam ${result[result.length - 1]?.rows[0]?.total || 81} il mevcut`)
    
  } catch (error) {
    console.error('❌ Hata:', error.message)
  } finally {
    await client.end()
  }
}

main()

