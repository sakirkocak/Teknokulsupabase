-- =====================================================
-- LİDERLİK TABLOSU VE PUAN SİSTEMİ
-- =====================================================

-- 1. Öğrenci Puanları Tablosu
CREATE TABLE IF NOT EXISTS student_points (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES student_profiles(id) ON DELETE CASCADE UNIQUE,
    -- Genel İstatistikler
    total_points INTEGER DEFAULT 0,           -- Toplam puan
    total_questions INTEGER DEFAULT 0,        -- Toplam çözülen soru
    total_correct INTEGER DEFAULT 0,          -- Toplam doğru
    total_wrong INTEGER DEFAULT 0,            -- Toplam yanlış
    -- Ders Bazlı Puanlar
    turkce_points INTEGER DEFAULT 0,
    turkce_correct INTEGER DEFAULT 0,
    turkce_wrong INTEGER DEFAULT 0,
    matematik_points INTEGER DEFAULT 0,
    matematik_correct INTEGER DEFAULT 0,
    matematik_wrong INTEGER DEFAULT 0,
    fen_points INTEGER DEFAULT 0,
    fen_correct INTEGER DEFAULT 0,
    fen_wrong INTEGER DEFAULT 0,
    inkilap_points INTEGER DEFAULT 0,
    inkilap_correct INTEGER DEFAULT 0,
    inkilap_wrong INTEGER DEFAULT 0,
    din_points INTEGER DEFAULT 0,
    din_correct INTEGER DEFAULT 0,
    din_wrong INTEGER DEFAULT 0,
    ingilizce_points INTEGER DEFAULT 0,
    ingilizce_correct INTEGER DEFAULT 0,
    ingilizce_wrong INTEGER DEFAULT 0,
    -- Streak & Başarılar
    current_streak INTEGER DEFAULT 0,         -- Üst üste doğru sayısı
    max_streak INTEGER DEFAULT 0,             -- En yüksek seri
    -- Zaman Bilgisi
    last_activity_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index'ler
CREATE INDEX IF NOT EXISTS idx_student_points_total ON student_points(total_points DESC);
CREATE INDEX IF NOT EXISTS idx_student_points_questions ON student_points(total_questions DESC);
CREATE INDEX IF NOT EXISTS idx_student_points_matematik ON student_points(matematik_points DESC);
CREATE INDEX IF NOT EXISTS idx_student_points_turkce ON student_points(turkce_points DESC);
CREATE INDEX IF NOT EXISTS idx_student_points_fen ON student_points(fen_points DESC);
CREATE INDEX IF NOT EXISTS idx_student_points_activity ON student_points(last_activity_at DESC);

-- RLS Politikaları
ALTER TABLE student_points ENABLE ROW LEVEL SECURITY;

-- Herkes okuyabilir (liderlik tablosu için)
DROP POLICY IF EXISTS "student_points_select" ON student_points;
CREATE POLICY "student_points_select" ON student_points FOR SELECT USING (true);

-- Authenticated kullanıcılar insert/update yapabilir
DROP POLICY IF EXISTS "student_points_insert" ON student_points;
CREATE POLICY "student_points_insert" ON student_points FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "student_points_update" ON student_points;
CREATE POLICY "student_points_update" ON student_points FOR UPDATE TO authenticated USING (true);

-- =====================================================
-- PUAN GÜNCELLEME FONKSİYONU
-- Doğru: +2 puan, Yanlış: -1 puan (minimum 0)
-- =====================================================

CREATE OR REPLACE FUNCTION update_student_points(
    p_student_id UUID,
    p_subject TEXT,
    p_is_correct BOOLEAN
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_points INTEGER;
    v_subject_col_points TEXT;
    v_subject_col_correct TEXT;
    v_subject_col_wrong TEXT;
BEGIN
    -- Puan hesapla
    IF p_is_correct THEN
        v_points := 2;
    ELSE
        v_points := -1;
    END IF;

    -- Ders kolonlarını belirle
    CASE p_subject
        WHEN 'Türkçe' THEN
            v_subject_col_points := 'turkce_points';
            v_subject_col_correct := 'turkce_correct';
            v_subject_col_wrong := 'turkce_wrong';
        WHEN 'Matematik' THEN
            v_subject_col_points := 'matematik_points';
            v_subject_col_correct := 'matematik_correct';
            v_subject_col_wrong := 'matematik_wrong';
        WHEN 'Fen Bilimleri' THEN
            v_subject_col_points := 'fen_points';
            v_subject_col_correct := 'fen_correct';
            v_subject_col_wrong := 'fen_wrong';
        WHEN 'İnkılap Tarihi' THEN
            v_subject_col_points := 'inkilap_points';
            v_subject_col_correct := 'inkilap_correct';
            v_subject_col_wrong := 'inkilap_wrong';
        WHEN 'Din Kültürü' THEN
            v_subject_col_points := 'din_points';
            v_subject_col_correct := 'din_correct';
            v_subject_col_wrong := 'din_wrong';
        WHEN 'İngilizce' THEN
            v_subject_col_points := 'ingilizce_points';
            v_subject_col_correct := 'ingilizce_correct';
            v_subject_col_wrong := 'ingilizce_wrong';
        ELSE
            v_subject_col_points := NULL;
    END CASE;

    -- Kayıt yoksa oluştur
    INSERT INTO student_points (student_id)
    VALUES (p_student_id)
    ON CONFLICT (student_id) DO NOTHING;

    -- Genel istatistikleri güncelle
    UPDATE student_points
    SET 
        total_points = GREATEST(0, total_points + v_points),
        total_questions = total_questions + 1,
        total_correct = total_correct + CASE WHEN p_is_correct THEN 1 ELSE 0 END,
        total_wrong = total_wrong + CASE WHEN p_is_correct THEN 0 ELSE 1 END,
        current_streak = CASE WHEN p_is_correct THEN current_streak + 1 ELSE 0 END,
        max_streak = CASE WHEN p_is_correct AND current_streak + 1 > max_streak THEN current_streak + 1 ELSE max_streak END,
        last_activity_at = NOW(),
        updated_at = NOW()
    WHERE student_id = p_student_id;

    -- Ders bazlı istatistikleri güncelle
    IF v_subject_col_points IS NOT NULL THEN
        EXECUTE format(
            'UPDATE student_points SET %I = GREATEST(0, %I + $1), %I = %I + $2, %I = %I + $3 WHERE student_id = $4',
            v_subject_col_points, v_subject_col_points,
            v_subject_col_correct, v_subject_col_correct,
            v_subject_col_wrong, v_subject_col_wrong
        ) USING v_points, 
                CASE WHEN p_is_correct THEN 1 ELSE 0 END,
                CASE WHEN p_is_correct THEN 0 ELSE 1 END,
                p_student_id;
    END IF;
END;
$$;

-- =====================================================
-- LİDERLİK TABLOSU VIEW'LARI
-- =====================================================

-- Genel Liderlik (Top 100)
CREATE OR REPLACE VIEW leaderboard_general AS
SELECT 
    sp.student_id,
    p.full_name,
    p.avatar_url,
    sp.total_points,
    sp.total_questions,
    sp.total_correct,
    sp.total_wrong,
    sp.max_streak,
    ROUND(CASE WHEN sp.total_questions > 0 THEN (sp.total_correct::DECIMAL / sp.total_questions) * 100 ELSE 0 END, 1) as success_rate,
    ROW_NUMBER() OVER (ORDER BY sp.total_points DESC) as rank
FROM student_points sp
JOIN student_profiles stup ON sp.student_id = stup.id
JOIN profiles p ON stup.user_id = p.id
WHERE sp.total_questions > 0
ORDER BY sp.total_points DESC
LIMIT 100;

-- Matematik Liderliği
CREATE OR REPLACE VIEW leaderboard_matematik AS
SELECT 
    sp.student_id,
    p.full_name,
    p.avatar_url,
    sp.matematik_points as points,
    sp.matematik_correct as correct,
    sp.matematik_wrong as wrong,
    (sp.matematik_correct + sp.matematik_wrong) as total,
    ROUND(CASE WHEN (sp.matematik_correct + sp.matematik_wrong) > 0 
          THEN (sp.matematik_correct::DECIMAL / (sp.matematik_correct + sp.matematik_wrong)) * 100 
          ELSE 0 END, 1) as success_rate,
    ROW_NUMBER() OVER (ORDER BY sp.matematik_points DESC) as rank
FROM student_points sp
JOIN student_profiles stup ON sp.student_id = stup.id
JOIN profiles p ON stup.user_id = p.id
WHERE (sp.matematik_correct + sp.matematik_wrong) > 0
ORDER BY sp.matematik_points DESC
LIMIT 100;

-- Türkçe Liderliği
CREATE OR REPLACE VIEW leaderboard_turkce AS
SELECT 
    sp.student_id,
    p.full_name,
    p.avatar_url,
    sp.turkce_points as points,
    sp.turkce_correct as correct,
    sp.turkce_wrong as wrong,
    (sp.turkce_correct + sp.turkce_wrong) as total,
    ROUND(CASE WHEN (sp.turkce_correct + sp.turkce_wrong) > 0 
          THEN (sp.turkce_correct::DECIMAL / (sp.turkce_correct + sp.turkce_wrong)) * 100 
          ELSE 0 END, 1) as success_rate,
    ROW_NUMBER() OVER (ORDER BY sp.turkce_points DESC) as rank
FROM student_points sp
JOIN student_profiles stup ON sp.student_id = stup.id
JOIN profiles p ON stup.user_id = p.id
WHERE (sp.turkce_correct + sp.turkce_wrong) > 0
ORDER BY sp.turkce_points DESC
LIMIT 100;

-- Fen Bilimleri Liderliği
CREATE OR REPLACE VIEW leaderboard_fen AS
SELECT 
    sp.student_id,
    p.full_name,
    p.avatar_url,
    sp.fen_points as points,
    sp.fen_correct as correct,
    sp.fen_wrong as wrong,
    (sp.fen_correct + sp.fen_wrong) as total,
    ROUND(CASE WHEN (sp.fen_correct + sp.fen_wrong) > 0 
          THEN (sp.fen_correct::DECIMAL / (sp.fen_correct + sp.fen_wrong)) * 100 
          ELSE 0 END, 1) as success_rate,
    ROW_NUMBER() OVER (ORDER BY sp.fen_points DESC) as rank
FROM student_points sp
JOIN student_profiles stup ON sp.student_id = stup.id
JOIN profiles p ON stup.user_id = p.id
WHERE (sp.fen_correct + sp.fen_wrong) > 0
ORDER BY sp.fen_points DESC
LIMIT 100;


