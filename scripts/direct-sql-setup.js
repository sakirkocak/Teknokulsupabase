require('dotenv').config({ path: '.env.local' })
const { Client } = require('pg')

// Supabase URL'den project ref'i al
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const dbPassword = process.env.SUPABASE_DB_PASSWORD || process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_URL bulunamadı')
  process.exit(1)
}

// Project ref'i çıkar
const projectRef = supabaseUrl.replace('https://', '').replace('.supabase.co', '')
console.log('Project Ref:', projectRef)

// Olası bağlantı URL'leri
const possibleUrls = [
  process.env.DATABASE_URL,
  process.env.SUPABASE_DB_URL,
  `postgresql://postgres.${projectRef}:${dbPassword}@aws-0-eu-central-1.pooler.supabase.com:6543/postgres`,
  `postgresql://postgres:${dbPassword}@db.${projectRef}.supabase.co:5432/postgres`
]

const sql = `
-- 1. İlçeler Tablosu
CREATE TABLE IF NOT EXISTS turkey_districts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    city_id UUID REFERENCES turkey_cities(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(city_id, name)
);

-- İlçeler için RLS
ALTER TABLE turkey_districts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "turkey_districts_select" ON turkey_districts;
CREATE POLICY "turkey_districts_select" ON turkey_districts FOR SELECT USING (true);

DROP POLICY IF EXISTS "turkey_districts_insert" ON turkey_districts;
CREATE POLICY "turkey_districts_insert" ON turkey_districts FOR INSERT WITH CHECK (true);

-- İlçeler index
CREATE INDEX IF NOT EXISTS idx_districts_city ON turkey_districts(city_id);
CREATE INDEX IF NOT EXISTS idx_districts_name ON turkey_districts(name);

-- 2. Okullar Tablosu
CREATE TABLE IF NOT EXISTS schools (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    district_id UUID REFERENCES turkey_districts(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    address TEXT,
    phone TEXT,
    fax TEXT,
    website TEXT,
    school_type TEXT,
    school_type_code INTEGER,
    institution_code BIGINT,
    ownership_type TEXT DEFAULT 'Devlet',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Okullar için RLS
ALTER TABLE schools ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "schools_select" ON schools;
CREATE POLICY "schools_select" ON schools FOR SELECT USING (true);

DROP POLICY IF EXISTS "schools_insert" ON schools;
CREATE POLICY "schools_insert" ON schools FOR INSERT WITH CHECK (true);

-- Okullar index
CREATE INDEX IF NOT EXISTS idx_schools_district ON schools(district_id);
CREATE INDEX IF NOT EXISTS idx_schools_name ON schools(name);
CREATE INDEX IF NOT EXISTS idx_schools_type ON schools(school_type);

-- 3. student_profiles tablosuna ilişkili sütunlar ekle
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='student_profiles' AND column_name='district_id') THEN
        ALTER TABLE student_profiles ADD COLUMN district_id UUID REFERENCES turkey_districts(id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='student_profiles' AND column_name='school_id') THEN
        ALTER TABLE student_profiles ADD COLUMN school_id UUID REFERENCES schools(id);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_student_district ON student_profiles(district_id);
CREATE INDEX IF NOT EXISTS idx_student_school ON student_profiles(school_id);
`

async function tryConnect() {
  for (const url of possibleUrls) {
    if (!url) continue
    
    console.log(`\n🔄 Bağlantı deneniyor...`)
    
    const client = new Client({
      connectionString: url,
      ssl: { rejectUnauthorized: false }
    })

    try {
      await client.connect()
      console.log('✅ Veritabanına bağlandı!\n')
      
      console.log('📝 SQL çalıştırılıyor...')
      await client.query(sql)
      console.log('✅ Tablolar başarıyla oluşturuldu!\n')
      
      await client.end()
      return true
    } catch (err) {
      console.log(`❌ Bağlantı hatası: ${err.message}`)
      try { await client.end() } catch {}
    }
  }
  return false
}

async function main() {
  console.log('🚀 Veritabanı tabloları oluşturuluyor...\n')
  
  const connected = await tryConnect()
  
  if (!connected) {
    console.log('\n' + '='.repeat(60))
    console.log('⚠️  Doğrudan bağlantı kurulamadı.')
    console.log('='.repeat(60))
    console.log('\nLütfen Supabase Dashboard > SQL Editor\'a gidin ve')
    console.log('aşağıdaki dosyadaki SQL\'i çalıştırın:\n')
    console.log('📄 supabase/schools-system.sql')
    console.log('\nVeya .env.local dosyasına DATABASE_URL ekleyin:')
    console.log('DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[REF].supabase.co:5432/postgres')
    
    // SQL'i bir dosyaya kaydet
    const fs = require('fs')
    fs.writeFileSync('create-tables-manual.sql', sql)
    console.log('\n📄 SQL dosyası oluşturuldu: create-tables-manual.sql')
  }
}

main()


