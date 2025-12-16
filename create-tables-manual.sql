
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
