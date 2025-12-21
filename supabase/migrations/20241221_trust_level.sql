-- =====================================================
-- TRUST LEVEL SİSTEMİ
-- Yeni hesaplar için güven seviyesi yönetimi
-- =====================================================

-- student_profiles tablosuna trust_level kolonu ekle
ALTER TABLE student_profiles 
ADD COLUMN IF NOT EXISTS trust_level TEXT DEFAULT 'new' 
CHECK (trust_level IN ('new', 'verified', 'trusted'));

-- trust_level için index
CREATE INDEX IF NOT EXISTS idx_student_profiles_trust_level 
ON student_profiles(trust_level);

-- Mevcut hesapları 'verified' yap (zaten aktif kullanıcılar)
UPDATE student_profiles 
SET trust_level = 'verified' 
WHERE trust_level = 'new' 
AND created_at < NOW() - INTERVAL '7 days';

-- 'trusted' seviyesi için: 100+ soru çözmüş ve 30+ gün aktif
UPDATE student_profiles sp
SET trust_level = 'trusted'
FROM student_points pts
WHERE sp.id = pts.student_id
AND pts.total_questions >= 100
AND sp.created_at < NOW() - INTERVAL '30 days';

-- =====================================================
-- OTOMATİK TRUST LEVEL GÜNCELLEME FONKSİYONU
-- =====================================================

CREATE OR REPLACE FUNCTION update_trust_level()
RETURNS TRIGGER AS $$
BEGIN
    -- 7 gün geçtiyse ve en az 10 soru çözdüyse -> verified
    IF NEW.total_questions >= 10 THEN
        UPDATE student_profiles 
        SET trust_level = 'verified'
        WHERE id = NEW.student_id 
        AND trust_level = 'new'
        AND created_at < NOW() - INTERVAL '7 days';
    END IF;
    
    -- 100+ soru ve 30+ gün -> trusted
    IF NEW.total_questions >= 100 THEN
        UPDATE student_profiles 
        SET trust_level = 'trusted'
        WHERE id = NEW.student_id 
        AND trust_level != 'trusted'
        AND created_at < NOW() - INTERVAL '30 days';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: student_points güncellendiğinde trust level kontrol et
DROP TRIGGER IF EXISTS trigger_update_trust_level ON student_points;
CREATE TRIGGER trigger_update_trust_level
AFTER UPDATE ON student_points
FOR EACH ROW
EXECUTE FUNCTION update_trust_level();

-- =====================================================
-- YORUM: TRUST LEVEL KISITLAMALARI
-- =====================================================
-- 
-- 'new' seviyesi kısıtlamaları (uygulama tarafında kontrol edilecek):
-- - Günde max 50 soru çözebilir
-- - Düello başlatamaz
-- - Mesaj gönderemez
-- - Profil fotoğrafı yükleyemez
--
-- 'verified' seviyesi:
-- - Tüm temel özellikler açık
-- - Günde 200 soru çözebilir
-- - Düello başlatabilir
-- - Mesaj gönderebilir
--
-- 'trusted' seviyesi:
-- - Tüm özellikler sınırsız
-- - Öncelikli destek
-- =====================================================

COMMENT ON COLUMN student_profiles.trust_level IS 
'Güven seviyesi: new (yeni hesap, kısıtlı), verified (doğrulanmış), trusted (güvenilir)';

