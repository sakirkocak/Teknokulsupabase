-- =====================================================
-- GEREKSİZ DERSLERİ KALDIR
-- Bu dersler MEB müfredatında sınav dersi değil
-- =====================================================

-- Önce bu derslere bağlı topics ve questions varsa kontrol et
-- Eğer varsa silme, sadece pasif yap

-- Dersleri pasif yap (silmek yerine is_active = false)
UPDATE subjects 
SET is_active = false 
WHERE code IN ('trafik', 'saglik', 'mantik', 'psikoloji', 'sosyoloji');

-- Eğer is_active sütunu yoksa, dersleri tamamen sil
-- DELETE FROM subjects WHERE code IN ('trafik', 'saglik', 'mantik', 'psikoloji', 'sosyoloji');

-- Alternatif: Dersleri slug ile sil
DELETE FROM subjects 
WHERE slug IN ('trafik', 'saglik', 'mantik', 'psikoloji', 'sosyoloji')
AND NOT EXISTS (
    SELECT 1 FROM topics t WHERE t.subject_id = subjects.id
);

-- Kalan aktif dersleri listele
SELECT name, code, icon, color, category 
FROM subjects 
WHERE is_active = true OR is_active IS NULL
ORDER BY 
    CASE category 
        WHEN 'temel' THEN 1 
        WHEN 'fen' THEN 2 
        WHEN 'sosyal' THEN 3 
        WHEN 'sanat' THEN 4 
        ELSE 5 
    END,
    name;
