-- ============================================
-- OKUL SİSTEMİ VERİTABANI
-- Türkiye'deki tüm okulları içerir
-- ============================================

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
    school_type TEXT, -- İlkokul, Ortaokul, Lise vb.
    school_type_code INTEGER,
    institution_code BIGINT, -- MERNIS kodu
    ownership_type TEXT DEFAULT 'Devlet', -- Devlet, Özel
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Okullar için RLS
ALTER TABLE schools ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "schools_select" ON schools;
CREATE POLICY "schools_select" ON schools FOR SELECT USING (true);

-- Admin okulları yönetebilir
DROP POLICY IF EXISTS "schools_admin_all" ON schools;
CREATE POLICY "schools_admin_all" ON schools FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Okullar index
CREATE INDEX IF NOT EXISTS idx_schools_district ON schools(district_id);
CREATE INDEX IF NOT EXISTS idx_schools_name ON schools(name);
CREATE INDEX IF NOT EXISTS idx_schools_type ON schools(school_type);

-- 3. student_profiles tablosuna ilişkili sütunlar ekle
ALTER TABLE student_profiles ADD COLUMN IF NOT EXISTS district_id UUID REFERENCES turkey_districts(id);
ALTER TABLE student_profiles ADD COLUMN IF NOT EXISTS school_id UUID REFERENCES schools(id);

CREATE INDEX IF NOT EXISTS idx_student_district ON student_profiles(district_id);
CREATE INDEX IF NOT EXISTS idx_student_school ON student_profiles(school_id);

-- 4. Okul türlerini gruplayan yardımcı fonksiyon
CREATE OR REPLACE FUNCTION get_school_level(school_type TEXT)
RETURNS TEXT AS $$
BEGIN
    IF school_type ILIKE '%ilkokul%' THEN
        RETURN 'ilkokul';
    ELSIF school_type ILIKE '%ortaokul%' OR school_type ILIKE '%imam hatip orta%' THEN
        RETURN 'ortaokul';
    ELSIF school_type ILIKE '%lise%' OR school_type ILIKE '%meslek%' OR school_type ILIKE '%teknik%' THEN
        RETURN 'lise';
    ELSIF school_type ILIKE '%anaokul%' OR school_type ILIKE '%ana sınıf%' THEN
        RETURN 'anaokulu';
    ELSE
        RETURN 'diger';
    END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 5. İl-İlçe-Okul hiyerarşisi için view
CREATE OR REPLACE VIEW school_hierarchy AS
SELECT 
    s.id AS school_id,
    s.name AS school_name,
    s.school_type,
    get_school_level(s.school_type) AS school_level,
    s.phone,
    s.website,
    d.id AS district_id,
    d.name AS district_name,
    c.id AS city_id,
    c.name AS city_name,
    c.plate_code
FROM schools s
JOIN turkey_districts d ON s.district_id = d.id
JOIN turkey_cities c ON d.city_id = c.id
WHERE s.is_active = true;

-- View için RLS (views otomatik olarak base table'ların RLS'ini kullanır)

-- 6. Öğrenci konum bilgisi view'i
CREATE OR REPLACE VIEW student_location_info AS
SELECT 
    sp.id AS student_id,
    sp.user_id,
    p.full_name,
    sp.grade,
    c.name AS city_name,
    d.name AS district_name,
    s.name AS school_name,
    s.school_type,
    cl.name AS classroom_name
FROM student_profiles sp
LEFT JOIN profiles p ON sp.user_id = p.id
LEFT JOIN turkey_cities c ON sp.city_id = c.id
LEFT JOIN turkey_districts d ON sp.district_id = d.id
LEFT JOIN schools s ON sp.school_id = s.id
LEFT JOIN classrooms cl ON sp.classroom_id = cl.id;

COMMENT ON TABLE turkey_districts IS 'Türkiye ilçeleri - 1071 ilçe';
COMMENT ON TABLE schools IS 'Türkiye okulları - 62725+ okul';
COMMENT ON VIEW school_hierarchy IS 'İl > İlçe > Okul hiyerarşisi';


