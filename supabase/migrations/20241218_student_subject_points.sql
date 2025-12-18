-- =====================================================
-- DERS BAZLI PUAN TAKİBİ
-- Her ders için ayrı puan takibi yapar
-- =====================================================

-- Ders bazlı puanlar tablosu
CREATE TABLE IF NOT EXISTS student_subject_points (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES student_profiles(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    
    -- Puanlar
    points INTEGER DEFAULT 0,
    correct_count INTEGER DEFAULT 0,
    wrong_count INTEGER DEFAULT 0,
    
    -- Zaman
    last_activity_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Her öğrenci için her ders bir kez
    UNIQUE(student_id, subject_id)
);

-- Index'ler
CREATE INDEX IF NOT EXISTS idx_student_subject_points_student ON student_subject_points(student_id);
CREATE INDEX IF NOT EXISTS idx_student_subject_points_subject ON student_subject_points(subject_id);
CREATE INDEX IF NOT EXISTS idx_student_subject_points_points ON student_subject_points(points DESC);

-- RLS Politikaları
ALTER TABLE student_subject_points ENABLE ROW LEVEL SECURITY;

-- Herkes okuyabilir (liderlik için)
DROP POLICY IF EXISTS "student_subject_points_select" ON student_subject_points;
CREATE POLICY "student_subject_points_select" ON student_subject_points 
    FOR SELECT USING (true);

-- Authenticated kullanıcılar insert/update yapabilir
DROP POLICY IF EXISTS "student_subject_points_insert" ON student_subject_points;
CREATE POLICY "student_subject_points_insert" ON student_subject_points 
    FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "student_subject_points_update" ON student_subject_points;
CREATE POLICY "student_subject_points_update" ON student_subject_points 
    FOR UPDATE TO authenticated USING (true);

-- =====================================================
-- PUAN GÜNCELLEME FONKSİYONU
-- =====================================================

CREATE OR REPLACE FUNCTION update_student_subject_points(
    p_student_id UUID,
    p_subject_id UUID,
    p_is_correct BOOLEAN
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_points INTEGER;
BEGIN
    -- Puan hesapla (doğru: +2, yanlış: -1)
    IF p_is_correct THEN
        v_points := 2;
    ELSE
        v_points := -1;
    END IF;

    -- Upsert - kayıt yoksa oluştur, varsa güncelle
    INSERT INTO student_subject_points (student_id, subject_id, points, correct_count, wrong_count)
    VALUES (
        p_student_id, 
        p_subject_id, 
        GREATEST(0, v_points),
        CASE WHEN p_is_correct THEN 1 ELSE 0 END,
        CASE WHEN p_is_correct THEN 0 ELSE 1 END
    )
    ON CONFLICT (student_id, subject_id) DO UPDATE SET
        points = GREATEST(0, student_subject_points.points + v_points),
        correct_count = student_subject_points.correct_count + CASE WHEN p_is_correct THEN 1 ELSE 0 END,
        wrong_count = student_subject_points.wrong_count + CASE WHEN p_is_correct THEN 0 ELSE 1 END,
        last_activity_at = NOW(),
        updated_at = NOW();
END;
$$;

