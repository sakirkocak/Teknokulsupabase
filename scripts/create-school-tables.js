require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Credentials bulunamadı')
  process.exit(1)
}

// Supabase project ref'i URL'den al
const projectRef = supabaseUrl.replace('https://', '').replace('.supabase.co', '')

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

-- Admin ilçe ekleyebilir
DROP POLICY IF EXISTS "turkey_districts_admin" ON turkey_districts;
CREATE POLICY "turkey_districts_admin" ON turkey_districts FOR ALL USING (true);

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

-- Admin okulları yönetebilir
DROP POLICY IF EXISTS "schools_admin" ON schools;
CREATE POLICY "schools_admin" ON schools FOR ALL USING (true);

-- Okullar index
CREATE INDEX IF NOT EXISTS idx_schools_district ON schools(district_id);
CREATE INDEX IF NOT EXISTS idx_schools_name ON schools(name);
CREATE INDEX IF NOT EXISTS idx_schools_type ON schools(school_type);

-- 3. student_profiles tablosuna ilişkili sütunlar ekle
ALTER TABLE student_profiles ADD COLUMN IF NOT EXISTS district_id UUID REFERENCES turkey_districts(id);
ALTER TABLE student_profiles ADD COLUMN IF NOT EXISTS school_id UUID REFERENCES schools(id);

CREATE INDEX IF NOT EXISTS idx_student_district ON student_profiles(district_id);
CREATE INDEX IF NOT EXISTS idx_student_school ON student_profiles(school_id);
`

async function createTables() {
  console.log('🔧 Tablolar oluşturuluyor...\n')
  console.log('Project:', projectRef)
  
  // Supabase SQL endpoint kullanarak tablo oluştur
  // Bu Management API gerektirir, doğrudan REST ile yapılamaz
  // Bunun yerine, pg client kullanalım
  
  const { createClient } = require('@supabase/supabase-js')
  const supabase = createClient(supabaseUrl, supabaseKey, {
    db: { schema: 'public' },
    auth: { autoRefreshToken: false, persistSession: false }
  })

  // SQL'i parçalara böl ve her birini ayrı çalıştır
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'))

  console.log(`📝 ${statements.length} SQL statement çalıştırılacak\n`)

  // RPC ile SQL çalıştırmayı dene (eğer varsa)
  try {
    // İlk olarak basit bir test yapalım
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: 'SELECT 1' })
    if (!error) {
      console.log('✅ exec_sql fonksiyonu mevcut, SQL çalıştırılıyor...')
      const { error: execError } = await supabase.rpc('exec_sql', { sql_query: sql })
      if (execError) {
        console.error('❌ SQL hatası:', execError.message)
      } else {
        console.log('✅ Tablolar oluşturuldu!')
      }
      return
    }
  } catch (e) {
    // exec_sql yok, alternatif yöntem dene
  }

  // Alternatif: Postgres bağlantısı ile
  console.log('⚠️  Supabase SQL Editor\'da manuel çalıştırma gerekiyor.\n')
  console.log('Aşağıdaki SQL\'i Supabase Dashboard > SQL Editor\'a yapıştırın:\n')
  console.log('─'.repeat(60))
  console.log(sql)
  console.log('─'.repeat(60))
  
  // Dosyaya da kaydet
  const fs = require('fs')
  fs.writeFileSync('create-tables.sql', sql)
  console.log('\n📄 SQL dosyası da oluşturuldu: create-tables.sql')
}

createTables()


