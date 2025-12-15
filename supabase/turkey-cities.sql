-- =====================================================
-- TÜRKİYE İLLERİ TABLOSU
-- Bu SQL'i Supabase SQL Editor'de çalıştırın
-- =====================================================

-- Tablo oluştur
CREATE TABLE IF NOT EXISTS turkey_cities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    plate_code INTEGER UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS aktif et
ALTER TABLE turkey_cities ENABLE ROW LEVEL SECURITY;

-- Herkes okuyabilsin
DROP POLICY IF EXISTS "turkey_cities_select" ON turkey_cities;
CREATE POLICY "turkey_cities_select" ON turkey_cities FOR SELECT USING (true);

-- 81 İli Ekle
INSERT INTO turkey_cities (name, plate_code) VALUES
('Adana', 1),
('Adıyaman', 2),
('Afyonkarahisar', 3),
('Ağrı', 4),
('Amasya', 5),
('Ankara', 6),
('Antalya', 7),
('Artvin', 8),
('Aydın', 9),
('Balıkesir', 10),
('Bilecik', 11),
('Bingöl', 12),
('Bitlis', 13),
('Bolu', 14),
('Burdur', 15),
('Bursa', 16),
('Çanakkale', 17),
('Çankırı', 18),
('Çorum', 19),
('Denizli', 20),
('Diyarbakır', 21),
('Edirne', 22),
('Elazığ', 23),
('Erzincan', 24),
('Erzurum', 25),
('Eskişehir', 26),
('Gaziantep', 27),
('Giresun', 28),
('Gümüşhane', 29),
('Hakkari', 30),
('Hatay', 31),
('Isparta', 32),
('Mersin', 33),
('İstanbul', 34),
('İzmir', 35),
('Kars', 36),
('Kastamonu', 37),
('Kayseri', 38),
('Kırklareli', 39),
('Kırşehir', 40),
('Kocaeli', 41),
('Konya', 42),
('Kütahya', 43),
('Malatya', 44),
('Manisa', 45),
('Kahramanmaraş', 46),
('Mardin', 47),
('Muğla', 48),
('Muş', 49),
('Nevşehir', 50),
('Niğde', 51),
('Ordu', 52),
('Rize', 53),
('Sakarya', 54),
('Samsun', 55),
('Siirt', 56),
('Sinop', 57),
('Sivas', 58),
('Tekirdağ', 59),
('Tokat', 60),
('Trabzon', 61),
('Tunceli', 62),
('Şanlıurfa', 63),
('Uşak', 64),
('Van', 65),
('Yozgat', 66),
('Zonguldak', 67),
('Aksaray', 68),
('Bayburt', 69),
('Karaman', 70),
('Kırıkkale', 71),
('Batman', 72),
('Şırnak', 73),
('Bartın', 74),
('Ardahan', 75),
('Iğdır', 76),
('Yalova', 77),
('Karabük', 78),
('Kilis', 79),
('Osmaniye', 80),
('Düzce', 81)
ON CONFLICT (name) DO NOTHING;

-- student_profiles tablosuna city_id kolonu ekle (eğer yoksa)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'student_profiles' AND column_name = 'city_id') THEN
        ALTER TABLE student_profiles ADD COLUMN city_id UUID REFERENCES turkey_cities(id);
    END IF;
END $$;

-- Index ekle
CREATE INDEX IF NOT EXISTS idx_student_profiles_city ON student_profiles(city_id);

-- Kontrol
SELECT COUNT(*) as total_cities FROM turkey_cities;

