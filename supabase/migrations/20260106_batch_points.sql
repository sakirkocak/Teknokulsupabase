-- =====================================================
-- BATCH POINT UPDATES SİSTEMİ
-- Her soruda anlık UPDATE yerine, puanları geçici tabloda topla
-- Her 5 dakikada bir toplu güncelle
-- 80% veritabanı yükü azaltması
-- =====================================================

-- 1. Bekleyen puanlar tablosu
CREATE TABLE IF NOT EXISTS pending_points (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL,
    points INTEGER NOT NULL DEFAULT 0,
    xp INTEGER NOT NULL DEFAULT 0,
    correct INTEGER DEFAULT 0,
    wrong INTEGER DEFAULT 0,
    subject_code TEXT,
    question_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Index'ler
CREATE INDEX IF NOT EXISTS idx_pending_points_created ON pending_points(created_at);
CREATE INDEX IF NOT EXISTS idx_pending_points_student ON pending_points(student_id);

-- 3. RLS
ALTER TABLE pending_points ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pending_points_insert_own" ON pending_points
FOR INSERT WITH CHECK (
    student_id IN (
        SELECT id FROM student_profiles WHERE user_id = auth.uid()
    )
);

CREATE POLICY "pending_points_select_own" ON pending_points
FOR SELECT USING (
    student_id IN (
        SELECT id FROM student_profiles WHERE user_id = auth.uid()
    )
);

-- =====================================================
-- 4. FLUSH FONKSİYONU
-- Her 5 dakikada bir çalıştırılmalı (cron job ile)
-- =====================================================

CREATE OR REPLACE FUNCTION flush_pending_points()
RETURNS INTEGER AS $$
DECLARE
    affected_rows INTEGER := 0;
    flush_cutoff TIMESTAMPTZ;
BEGIN
    -- 1 dakikadan eski kayıtları işle
    flush_cutoff := NOW() - INTERVAL '1 minute';
    
    -- 1. Mevcut öğrencileri güncelle
    WITH aggregated AS (
        SELECT 
            student_id,
            SUM(points) as total_points,
            SUM(xp) as total_xp,
            SUM(correct) as total_correct,
            SUM(wrong) as total_wrong
        FROM pending_points
        WHERE created_at < flush_cutoff
        GROUP BY student_id
    )
    UPDATE student_points sp
    SET 
        total_points = COALESCE(sp.total_points, 0) + COALESCE(a.total_points, 0),
        total_xp = COALESCE(sp.total_xp, 0) + COALESCE(a.total_xp, 0),
        total_correct = COALESCE(sp.total_correct, 0) + COALESCE(a.total_correct, 0),
        total_wrong = COALESCE(sp.total_wrong, 0) + COALESCE(a.total_wrong, 0),
        total_questions = COALESCE(sp.total_questions, 0) + COALESCE(a.total_correct, 0) + COALESCE(a.total_wrong, 0),
        updated_at = NOW()
    FROM aggregated a
    WHERE sp.student_id = a.student_id;
    
    GET DIAGNOSTICS affected_rows = ROW_COUNT;
    
    -- 2. Yeni öğrenciler için kayıt oluştur (henüz student_points'te olmayanlar)
    INSERT INTO student_points (student_id, total_points, total_xp, total_correct, total_wrong, total_questions)
    SELECT 
        pp.student_id,
        SUM(pp.points),
        SUM(pp.xp),
        SUM(pp.correct),
        SUM(pp.wrong),
        SUM(pp.correct) + SUM(pp.wrong)
    FROM pending_points pp
    WHERE pp.created_at < flush_cutoff
    AND NOT EXISTS (SELECT 1 FROM student_points sp WHERE sp.student_id = pp.student_id)
    GROUP BY pp.student_id
    ON CONFLICT (student_id) DO NOTHING;
    
    -- 3. Ders bazlı puanları güncelle
    WITH subject_agg AS (
        SELECT 
            student_id,
            subject_code,
            SUM(points) as points,
            SUM(correct) as correct,
            SUM(wrong) as wrong
        FROM pending_points
        WHERE created_at < flush_cutoff
        AND subject_code IS NOT NULL
        GROUP BY student_id, subject_code
    )
    UPDATE student_points sp
    SET 
        -- Matematik
        matematik_points = CASE WHEN sa.subject_code = 'matematik' 
            THEN COALESCE(sp.matematik_points, 0) + sa.points ELSE sp.matematik_points END,
        matematik_correct = CASE WHEN sa.subject_code = 'matematik' 
            THEN COALESCE(sp.matematik_correct, 0) + sa.correct ELSE sp.matematik_correct END,
        matematik_wrong = CASE WHEN sa.subject_code = 'matematik' 
            THEN COALESCE(sp.matematik_wrong, 0) + sa.wrong ELSE sp.matematik_wrong END,
        -- Türkçe
        turkce_points = CASE WHEN sa.subject_code = 'turkce' 
            THEN COALESCE(sp.turkce_points, 0) + sa.points ELSE sp.turkce_points END,
        turkce_correct = CASE WHEN sa.subject_code = 'turkce' 
            THEN COALESCE(sp.turkce_correct, 0) + sa.correct ELSE sp.turkce_correct END,
        turkce_wrong = CASE WHEN sa.subject_code = 'turkce' 
            THEN COALESCE(sp.turkce_wrong, 0) + sa.wrong ELSE sp.turkce_wrong END,
        -- Fen Bilimleri
        fen_points = CASE WHEN sa.subject_code = 'fen_bilimleri' 
            THEN COALESCE(sp.fen_points, 0) + sa.points ELSE sp.fen_points END,
        fen_correct = CASE WHEN sa.subject_code = 'fen_bilimleri' 
            THEN COALESCE(sp.fen_correct, 0) + sa.correct ELSE sp.fen_correct END,
        fen_wrong = CASE WHEN sa.subject_code = 'fen_bilimleri' 
            THEN COALESCE(sp.fen_wrong, 0) + sa.wrong ELSE sp.fen_wrong END,
        -- Sosyal Bilgiler
        sosyal_points = CASE WHEN sa.subject_code = 'sosyal_bilgiler' 
            THEN COALESCE(sp.sosyal_points, 0) + sa.points ELSE sp.sosyal_points END,
        sosyal_correct = CASE WHEN sa.subject_code = 'sosyal_bilgiler' 
            THEN COALESCE(sp.sosyal_correct, 0) + sa.correct ELSE sp.sosyal_correct END,
        sosyal_wrong = CASE WHEN sa.subject_code = 'sosyal_bilgiler' 
            THEN COALESCE(sp.sosyal_wrong, 0) + sa.wrong ELSE sp.sosyal_wrong END,
        -- İngilizce
        ingilizce_points = CASE WHEN sa.subject_code = 'ingilizce' 
            THEN COALESCE(sp.ingilizce_points, 0) + sa.points ELSE sp.ingilizce_points END,
        ingilizce_correct = CASE WHEN sa.subject_code = 'ingilizce' 
            THEN COALESCE(sp.ingilizce_correct, 0) + sa.correct ELSE sp.ingilizce_correct END,
        ingilizce_wrong = CASE WHEN sa.subject_code = 'ingilizce' 
            THEN COALESCE(sp.ingilizce_wrong, 0) + sa.wrong ELSE sp.ingilizce_wrong END,
        -- İnkılap Tarihi
        inkilap_points = CASE WHEN sa.subject_code = 'inkilap_tarihi' 
            THEN COALESCE(sp.inkilap_points, 0) + sa.points ELSE sp.inkilap_points END,
        inkilap_correct = CASE WHEN sa.subject_code = 'inkilap_tarihi' 
            THEN COALESCE(sp.inkilap_correct, 0) + sa.correct ELSE sp.inkilap_correct END,
        inkilap_wrong = CASE WHEN sa.subject_code = 'inkilap_tarihi' 
            THEN COALESCE(sp.inkilap_wrong, 0) + sa.wrong ELSE sp.inkilap_wrong END,
        -- Din Kültürü
        din_points = CASE WHEN sa.subject_code = 'din_kulturu' 
            THEN COALESCE(sp.din_points, 0) + sa.points ELSE sp.din_points END,
        din_correct = CASE WHEN sa.subject_code = 'din_kulturu' 
            THEN COALESCE(sp.din_correct, 0) + sa.correct ELSE sp.din_correct END,
        din_wrong = CASE WHEN sa.subject_code = 'din_kulturu' 
            THEN COALESCE(sp.din_wrong, 0) + sa.wrong ELSE sp.din_wrong END
    FROM subject_agg sa
    WHERE sp.student_id = sa.student_id;
    
    -- 4. İşlenen kayıtları sil
    DELETE FROM pending_points WHERE created_at < flush_cutoff;
    
    RETURN affected_rows;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 5. MANUEL FLUSH (Test için)
-- =====================================================

CREATE OR REPLACE FUNCTION manual_flush_pending_points()
RETURNS INTEGER AS $$
BEGIN
    RETURN flush_pending_points();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant
GRANT EXECUTE ON FUNCTION flush_pending_points() TO authenticated;
GRANT EXECUTE ON FUNCTION manual_flush_pending_points() TO authenticated;

-- =====================================================
-- 6. PENDING POINTS İSTATİSTİKLERİ
-- =====================================================

CREATE OR REPLACE FUNCTION get_pending_points_stats()
RETURNS TABLE(
    total_pending BIGINT,
    oldest_record TIMESTAMPTZ,
    unique_students BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::BIGINT,
        MIN(created_at),
        COUNT(DISTINCT student_id)::BIGINT
    FROM pending_points;
END;
$$ LANGUAGE plpgsql;

GRANT EXECUTE ON FUNCTION get_pending_points_stats() TO authenticated;

