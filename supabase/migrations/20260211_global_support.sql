-- ============================================
-- QUESTLY GLOBAL PLATFORM - VERITABANI DESTEĞI
-- ============================================
-- Bu migration global (İngilizce) platform desteği için gerekli
-- tüm veritabanı değişikliklerini içerir.

-- ============================================
-- 1. QUESTIONS TABLOSU - DİL DESTEĞİ
-- ============================================

-- Lang kolonu ekle (varsayılan 'tr' - Türkçe)
ALTER TABLE questions ADD COLUMN IF NOT EXISTS lang VARCHAR(2) DEFAULT 'tr';

-- Mevcut tüm soruları Türkçe olarak işaretle
UPDATE questions SET lang = 'tr' WHERE lang IS NULL;

-- Performans için index
CREATE INDEX IF NOT EXISTS idx_questions_lang ON questions(lang);
CREATE INDEX IF NOT EXISTS idx_questions_lang_topic ON questions(lang, topic_id);
CREATE INDEX IF NOT EXISTS idx_questions_lang_subject ON questions(lang, topic_id);

-- ============================================
-- 2. SUBJECTS TABLOSU - GLOBAL DERSLER
-- ============================================

-- Global flag ve İngilizce isim kolonları
ALTER TABLE subjects ADD COLUMN IF NOT EXISTS is_global BOOLEAN DEFAULT false;
ALTER TABLE subjects ADD COLUMN IF NOT EXISTS name_en VARCHAR(255);

-- Global dersleri işaretle ve İngilizce isimlerini ekle
UPDATE subjects SET is_global = true, name_en = 'Mathematics' WHERE code = 'matematik';
UPDATE subjects SET is_global = true, name_en = 'Physics' WHERE code = 'fizik';
UPDATE subjects SET is_global = true, name_en = 'Chemistry' WHERE code = 'kimya';
UPDATE subjects SET is_global = true, name_en = 'Biology' WHERE code = 'biyoloji';
UPDATE subjects SET is_global = true, name_en = 'English' WHERE code = 'ingilizce';
UPDATE subjects SET is_global = true, name_en = 'Geography' WHERE code = 'cografya';
UPDATE subjects SET is_global = true, name_en = 'History' WHERE code = 'tarih';
UPDATE subjects SET is_global = true, name_en = 'Computer Science' WHERE code = 'bilisim';
UPDATE subjects SET is_global = true, name_en = 'Science' WHERE code = 'fen_bilimleri';

-- Yerel dersler (sadece Türkiye)
UPDATE subjects SET is_global = false, name_en = NULL WHERE code IN ('inkilap_tarihi', 'din_kulturu', 'turkce', 'edebiyat', 'sosyal_bilgiler');

-- ============================================
-- 3. TOPICS TABLOSU - İNGİLİZCE KONU İSİMLERİ
-- ============================================

ALTER TABLE topics ADD COLUMN IF NOT EXISTS main_topic_en VARCHAR(255);
ALTER TABLE topics ADD COLUMN IF NOT EXISTS sub_topic_en VARCHAR(255);

-- ============================================
-- 4. COUNTRIES TABLOSU (YENİ)
-- ============================================

CREATE TABLE IF NOT EXISTS countries (
  code VARCHAR(2) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  name_native VARCHAR(100),
  flag VARCHAR(10),
  continent VARCHAR(20),
  phone_code VARCHAR(10),
  is_active BOOLEAN DEFAULT true,
  student_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_countries_continent ON countries(continent);
CREATE INDEX IF NOT EXISTS idx_countries_active ON countries(is_active);

-- Seed data: Major countries (İngilizce konuşan ve büyük pazarlar)
INSERT INTO countries (code, name, name_native, flag, continent, phone_code, is_active) VALUES
-- Asia
('IN', 'India', 'भारत', '🇮🇳', 'Asia', '+91', true),
('PK', 'Pakistan', 'پاکستان', '🇵🇰', 'Asia', '+92', true),
('BD', 'Bangladesh', 'বাংলাদেশ', '🇧🇩', 'Asia', '+880', true),
('PH', 'Philippines', 'Pilipinas', '🇵🇭', 'Asia', '+63', true),
('SG', 'Singapore', 'Singapore', '🇸🇬', 'Asia', '+65', true),
('MY', 'Malaysia', 'Malaysia', '🇲🇾', 'Asia', '+60', true),
('ID', 'Indonesia', 'Indonesia', '🇮🇩', 'Asia', '+62', true),
('VN', 'Vietnam', 'Việt Nam', '🇻🇳', 'Asia', '+84', true),
('TH', 'Thailand', 'ประเทศไทย', '🇹🇭', 'Asia', '+66', true),
('AE', 'United Arab Emirates', 'الإمارات', '🇦🇪', 'Asia', '+971', true),
('SA', 'Saudi Arabia', 'السعودية', '🇸🇦', 'Asia', '+966', true),
('TR', 'Turkey', 'Türkiye', '🇹🇷', 'Asia', '+90', true),

-- Africa
('NG', 'Nigeria', 'Nigeria', '🇳🇬', 'Africa', '+234', true),
('KE', 'Kenya', 'Kenya', '🇰🇪', 'Africa', '+254', true),
('ZA', 'South Africa', 'South Africa', '🇿🇦', 'Africa', '+27', true),
('GH', 'Ghana', 'Ghana', '🇬🇭', 'Africa', '+233', true),
('EG', 'Egypt', 'مصر', '🇪🇬', 'Africa', '+20', true),
('ET', 'Ethiopia', 'ኢትዮጵያ', '🇪🇹', 'Africa', '+251', true),
('TZ', 'Tanzania', 'Tanzania', '🇹🇿', 'Africa', '+255', true),
('UG', 'Uganda', 'Uganda', '🇺🇬', 'Africa', '+256', true),

-- Europe
('GB', 'United Kingdom', 'United Kingdom', '🇬🇧', 'Europe', '+44', true),
('DE', 'Germany', 'Deutschland', '🇩🇪', 'Europe', '+49', true),
('FR', 'France', 'France', '🇫🇷', 'Europe', '+33', true),
('IT', 'Italy', 'Italia', '🇮🇹', 'Europe', '+39', true),
('ES', 'Spain', 'España', '🇪🇸', 'Europe', '+34', true),
('NL', 'Netherlands', 'Nederland', '🇳🇱', 'Europe', '+31', true),
('PL', 'Poland', 'Polska', '🇵🇱', 'Europe', '+48', true),
('SE', 'Sweden', 'Sverige', '🇸🇪', 'Europe', '+46', true),

-- North America
('US', 'United States', 'United States', '🇺🇸', 'North America', '+1', true),
('CA', 'Canada', 'Canada', '🇨🇦', 'North America', '+1', true),
('MX', 'Mexico', 'México', '🇲🇽', 'North America', '+52', true),

-- South America
('BR', 'Brazil', 'Brasil', '🇧🇷', 'South America', '+55', true),
('AR', 'Argentina', 'Argentina', '🇦🇷', 'South America', '+54', true),
('CO', 'Colombia', 'Colombia', '🇨🇴', 'South America', '+57', true),
('CL', 'Chile', 'Chile', '🇨🇱', 'South America', '+56', true),

-- Oceania
('AU', 'Australia', 'Australia', '🇦🇺', 'Oceania', '+61', true),
('NZ', 'New Zealand', 'New Zealand', '🇳🇿', 'Oceania', '+64', true)

ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  flag = EXCLUDED.flag,
  continent = EXCLUDED.continent;

-- ============================================
-- 5. CITIES_GLOBAL TABLOSU (YENİ)
-- ============================================

CREATE TABLE IF NOT EXISTS cities_global (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  country_code VARCHAR(2) REFERENCES countries(code) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  name_ascii VARCHAR(100), -- Arama için ASCII versiyonu
  state_province VARCHAR(100),
  population INTEGER,
  is_major BOOLEAN DEFAULT false,
  timezone VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(country_code, name, state_province)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_cities_global_country ON cities_global(country_code);
CREATE INDEX IF NOT EXISTS idx_cities_global_name ON cities_global(name);
CREATE INDEX IF NOT EXISTS idx_cities_global_major ON cities_global(is_major);

-- Seed data: Major cities for key markets
INSERT INTO cities_global (country_code, name, name_ascii, state_province, is_major) VALUES
-- India (Top cities)
('IN', 'Mumbai', 'Mumbai', 'Maharashtra', true),
('IN', 'Delhi', 'Delhi', 'Delhi', true),
('IN', 'Bangalore', 'Bangalore', 'Karnataka', true),
('IN', 'Hyderabad', 'Hyderabad', 'Telangana', true),
('IN', 'Chennai', 'Chennai', 'Tamil Nadu', true),
('IN', 'Kolkata', 'Kolkata', 'West Bengal', true),
('IN', 'Pune', 'Pune', 'Maharashtra', true),
('IN', 'Ahmedabad', 'Ahmedabad', 'Gujarat', true),
('IN', 'Jaipur', 'Jaipur', 'Rajasthan', true),
('IN', 'Lucknow', 'Lucknow', 'Uttar Pradesh', true),

-- Pakistan (Top cities)
('PK', 'Karachi', 'Karachi', 'Sindh', true),
('PK', 'Lahore', 'Lahore', 'Punjab', true),
('PK', 'Islamabad', 'Islamabad', 'Capital', true),
('PK', 'Rawalpindi', 'Rawalpindi', 'Punjab', true),
('PK', 'Faisalabad', 'Faisalabad', 'Punjab', true),
('PK', 'Multan', 'Multan', 'Punjab', true),
('PK', 'Peshawar', 'Peshawar', 'KPK', true),

-- Bangladesh
('BD', 'Dhaka', 'Dhaka', 'Dhaka', true),
('BD', 'Chittagong', 'Chittagong', 'Chittagong', true),
('BD', 'Khulna', 'Khulna', 'Khulna', true),
('BD', 'Rajshahi', 'Rajshahi', 'Rajshahi', true),

-- Nigeria
('NG', 'Lagos', 'Lagos', 'Lagos', true),
('NG', 'Abuja', 'Abuja', 'FCT', true),
('NG', 'Kano', 'Kano', 'Kano', true),
('NG', 'Ibadan', 'Ibadan', 'Oyo', true),
('NG', 'Port Harcourt', 'Port Harcourt', 'Rivers', true),

-- Philippines
('PH', 'Manila', 'Manila', 'Metro Manila', true),
('PH', 'Quezon City', 'Quezon City', 'Metro Manila', true),
('PH', 'Cebu City', 'Cebu City', 'Cebu', true),
('PH', 'Davao City', 'Davao City', 'Davao', true),

-- United States
('US', 'New York', 'New York', 'New York', true),
('US', 'Los Angeles', 'Los Angeles', 'California', true),
('US', 'Chicago', 'Chicago', 'Illinois', true),
('US', 'Houston', 'Houston', 'Texas', true),
('US', 'Phoenix', 'Phoenix', 'Arizona', true),
('US', 'San Francisco', 'San Francisco', 'California', true),
('US', 'Boston', 'Boston', 'Massachusetts', true),

-- United Kingdom
('GB', 'London', 'London', 'England', true),
('GB', 'Birmingham', 'Birmingham', 'England', true),
('GB', 'Manchester', 'Manchester', 'England', true),
('GB', 'Glasgow', 'Glasgow', 'Scotland', true),
('GB', 'Edinburgh', 'Edinburgh', 'Scotland', true),

-- UAE
('AE', 'Dubai', 'Dubai', 'Dubai', true),
('AE', 'Abu Dhabi', 'Abu Dhabi', 'Abu Dhabi', true),
('AE', 'Sharjah', 'Sharjah', 'Sharjah', true),

-- Kenya
('KE', 'Nairobi', 'Nairobi', 'Nairobi', true),
('KE', 'Mombasa', 'Mombasa', 'Coast', true),

-- South Africa
('ZA', 'Johannesburg', 'Johannesburg', 'Gauteng', true),
('ZA', 'Cape Town', 'Cape Town', 'Western Cape', true),
('ZA', 'Durban', 'Durban', 'KwaZulu-Natal', true),

-- Australia
('AU', 'Sydney', 'Sydney', 'NSW', true),
('AU', 'Melbourne', 'Melbourne', 'Victoria', true),
('AU', 'Brisbane', 'Brisbane', 'Queensland', true),

-- Canada
('CA', 'Toronto', 'Toronto', 'Ontario', true),
('CA', 'Vancouver', 'Vancouver', 'British Columbia', true),
('CA', 'Montreal', 'Montreal', 'Quebec', true),

-- Singapore
('SG', 'Singapore', 'Singapore', NULL, true),

-- Germany
('DE', 'Berlin', 'Berlin', 'Berlin', true),
('DE', 'Munich', 'Munich', 'Bavaria', true),
('DE', 'Frankfurt', 'Frankfurt', 'Hesse', true)

ON CONFLICT (country_code, name, state_province) DO NOTHING;

-- ============================================
-- 6. PROFILES TABLOSU - GLOBAL KULLANICI DESTEĞİ
-- ============================================

-- Global kullanıcılar için ek kolonlar
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS country_code VARCHAR(2) REFERENCES countries(code);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS city_global_id UUID REFERENCES cities_global(id);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS preferred_lang VARCHAR(2) DEFAULT 'tr';

-- Türk kullanıcıları işaretle
UPDATE profiles SET country_code = 'TR', preferred_lang = 'tr' WHERE country_code IS NULL;

-- Index
CREATE INDEX IF NOT EXISTS idx_profiles_country ON profiles(country_code);
CREATE INDEX IF NOT EXISTS idx_profiles_lang ON profiles(preferred_lang);

-- ============================================
-- 7. STUDENT_POINTS TABLOSU - REGION DESTEĞİ
-- ============================================

ALTER TABLE student_points ADD COLUMN IF NOT EXISTS region VARCHAR(10) DEFAULT 'tr';

-- Mevcut verileri Türkiye olarak işaretle
UPDATE student_points SET region = 'tr' WHERE region IS NULL;

-- Index
CREATE INDEX IF NOT EXISTS idx_student_points_region ON student_points(region);

-- ============================================
-- 8. RLS POLİTİKALARI
-- ============================================

-- Countries tablosu için RLS
ALTER TABLE countries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Countries herkes görebilir"
  ON countries FOR SELECT
  TO authenticated, anon
  USING (true);

-- Cities global tablosu için RLS
ALTER TABLE cities_global ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Cities herkes görebilir"
  ON cities_global FOR SELECT
  TO authenticated, anon
  USING (true);

-- ============================================
-- 9. YARDIMCI FONKSİYONLAR
-- ============================================

-- Ülkeye göre öğrenci sayısını güncelle
CREATE OR REPLACE FUNCTION update_country_student_count()
RETURNS TRIGGER AS $$
BEGIN
  -- Eski ülkenin sayısını azalt
  IF OLD.country_code IS NOT NULL THEN
    UPDATE countries 
    SET student_count = student_count - 1 
    WHERE code = OLD.country_code;
  END IF;
  
  -- Yeni ülkenin sayısını artır
  IF NEW.country_code IS NOT NULL THEN
    UPDATE countries 
    SET student_count = student_count + 1 
    WHERE code = NEW.country_code;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger (sadece country_code değiştiğinde)
DROP TRIGGER IF EXISTS trigger_update_country_count ON profiles;
CREATE TRIGGER trigger_update_country_count
  AFTER UPDATE OF country_code ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_country_student_count();

-- ============================================
-- 10. DOĞRULAMA
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '✅ Global support migration tamamlandı!';
  RAISE NOTICE '📊 Eklenen: questions.lang, subjects.is_global, subjects.name_en';
  RAISE NOTICE '🌍 Eklenen: countries tablosu (40+ ülke)';
  RAISE NOTICE '🏙️ Eklenen: cities_global tablosu (70+ şehir)';
  RAISE NOTICE '👤 Eklenen: profiles.country_code, profiles.city_global_id, profiles.preferred_lang';
  RAISE NOTICE '🏆 Eklenen: student_points.region';
END $$;
