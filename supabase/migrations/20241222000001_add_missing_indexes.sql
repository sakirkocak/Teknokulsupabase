-- ============================================
-- EKSİK INDEX'LERİ EKLE
-- Ölçeklenebilirlik için gerekli index'ler
-- ============================================

-- student_profiles tablosunda city_id için index (il bazlı filtreleme için)
CREATE INDEX IF NOT EXISTS idx_student_city ON student_profiles(city_id);

-- student_points tablosunda student_id için composite index (JOIN performansı için)
-- Not: student_id zaten UNIQUE constraint ile index'li ama açıkça belirtelim
CREATE INDEX IF NOT EXISTS idx_student_points_student ON student_points(student_id);

-- Liderlik sorgularında sık kullanılan kombinasyonlar için composite index'ler
-- Bu index'ler il/ilçe/okul bazlı filtrelemede performansı artırır
CREATE INDEX IF NOT EXISTS idx_student_profiles_location 
ON student_profiles(city_id, district_id, school_id);

-- Aktif öğrenciler için partial index (sadece soru çözmüş öğrenciler)
CREATE INDEX IF NOT EXISTS idx_student_points_active 
ON student_points(total_points DESC) 
WHERE total_questions > 0;

-- Ders bazlı liderlik için partial index'ler
CREATE INDEX IF NOT EXISTS idx_student_points_din_active 
ON student_points(din_points DESC) 
WHERE din_correct > 0;

CREATE INDEX IF NOT EXISTS idx_student_points_fen_active 
ON student_points(fen_points DESC) 
WHERE fen_correct > 0;

CREATE INDEX IF NOT EXISTS idx_student_points_ingilizce_active 
ON student_points(ingilizce_points DESC) 
WHERE ingilizce_correct > 0;

CREATE INDEX IF NOT EXISTS idx_student_points_inkilap_active 
ON student_points(inkilap_points DESC) 
WHERE inkilap_correct > 0;

COMMENT ON INDEX idx_student_city IS 'İl bazlı liderlik filtrelemesi için';
COMMENT ON INDEX idx_student_profiles_location IS 'Konum bazlı composite filtreleme için';
COMMENT ON INDEX idx_student_points_active IS 'Aktif öğrenci liderlik sorguları için';

