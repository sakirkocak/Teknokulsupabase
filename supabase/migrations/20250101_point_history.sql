-- Puan Geçmişi Tablosu
-- Her soru çözümünde kazanılan puanı kaydeder
-- Günlük/Haftalık/Aylık liderlik tabloları için kullanılır

CREATE TABLE IF NOT EXISTS point_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES student_profiles(id) ON DELETE CASCADE,
    points INTEGER NOT NULL DEFAULT 0,
    source VARCHAR(50) NOT NULL DEFAULT 'question', -- question, streak_bonus, achievement, daily_task
    subject_code VARCHAR(50), -- matematik, turkce, fen_bilimleri, etc.
    is_correct BOOLEAN DEFAULT true,
    question_id UUID REFERENCES questions(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- İndeksler - hızlı sorgular için
CREATE INDEX IF NOT EXISTS idx_point_history_student ON point_history(student_id);
CREATE INDEX IF NOT EXISTS idx_point_history_created ON point_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_point_history_student_created ON point_history(student_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_point_history_source ON point_history(source);

-- RLS Politikaları
ALTER TABLE point_history ENABLE ROW LEVEL SECURITY;

-- Herkes okuyabilir (liderlik tablosu için)
CREATE POLICY "Puan geçmişi herkes tarafından okunabilir"
ON point_history FOR SELECT
TO authenticated, anon
USING (true);

-- Sadece sistem ekleyebilir (service role)
CREATE POLICY "Puan geçmişi sadece sistem tarafından eklenebilir"
ON point_history FOR INSERT
TO authenticated
WITH CHECK (true);

-- Günlük liderlik fonksiyonu
CREATE OR REPLACE FUNCTION get_daily_leaderboard(p_limit INTEGER DEFAULT 10)
RETURNS TABLE (
    student_id UUID,
    full_name TEXT,
    avatar_url TEXT,
    total_points BIGINT,
    total_questions BIGINT,
    rank BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ph.student_id,
        p.full_name,
        p.avatar_url,
        COALESCE(SUM(ph.points), 0)::BIGINT as total_points,
        COUNT(CASE WHEN ph.source = 'question' THEN 1 END)::BIGINT as total_questions,
        ROW_NUMBER() OVER (ORDER BY COALESCE(SUM(ph.points), 0) DESC)::BIGINT as rank
    FROM point_history ph
    JOIN student_profiles sp ON ph.student_id = sp.id
    JOIN profiles p ON sp.user_id = p.id
    WHERE ph.created_at >= NOW() - INTERVAL '24 hours'
    GROUP BY ph.student_id, p.full_name, p.avatar_url
    HAVING COALESCE(SUM(ph.points), 0) > 0
    ORDER BY total_points DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Haftalık liderlik fonksiyonu
CREATE OR REPLACE FUNCTION get_weekly_leaderboard(p_limit INTEGER DEFAULT 10)
RETURNS TABLE (
    student_id UUID,
    full_name TEXT,
    avatar_url TEXT,
    total_points BIGINT,
    total_questions BIGINT,
    rank BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ph.student_id,
        p.full_name,
        p.avatar_url,
        COALESCE(SUM(ph.points), 0)::BIGINT as total_points,
        COUNT(CASE WHEN ph.source = 'question' THEN 1 END)::BIGINT as total_questions,
        ROW_NUMBER() OVER (ORDER BY COALESCE(SUM(ph.points), 0) DESC)::BIGINT as rank
    FROM point_history ph
    JOIN student_profiles sp ON ph.student_id = sp.id
    JOIN profiles p ON sp.user_id = p.id
    WHERE ph.created_at >= NOW() - INTERVAL '7 days'
    GROUP BY ph.student_id, p.full_name, p.avatar_url
    HAVING COALESCE(SUM(ph.points), 0) > 0
    ORDER BY total_points DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Aylık liderlik fonksiyonu
CREATE OR REPLACE FUNCTION get_monthly_leaderboard(p_limit INTEGER DEFAULT 10)
RETURNS TABLE (
    student_id UUID,
    full_name TEXT,
    avatar_url TEXT,
    total_points BIGINT,
    total_questions BIGINT,
    rank BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ph.student_id,
        p.full_name,
        p.avatar_url,
        COALESCE(SUM(ph.points), 0)::BIGINT as total_points,
        COUNT(CASE WHEN ph.source = 'question' THEN 1 END)::BIGINT as total_questions,
        ROW_NUMBER() OVER (ORDER BY COALESCE(SUM(ph.points), 0) DESC)::BIGINT as rank
    FROM point_history ph
    JOIN student_profiles sp ON ph.student_id = sp.id
    JOIN profiles p ON sp.user_id = p.id
    WHERE ph.created_at >= NOW() - INTERVAL '30 days'
    GROUP BY ph.student_id, p.full_name, p.avatar_url
    HAVING COALESCE(SUM(ph.points), 0) > 0
    ORDER BY total_points DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Tüm zamanlar liderlik fonksiyonu (mevcut student_points'den)
CREATE OR REPLACE FUNCTION get_alltime_leaderboard(p_limit INTEGER DEFAULT 10)
RETURNS TABLE (
    student_id UUID,
    full_name TEXT,
    avatar_url TEXT,
    total_points BIGINT,
    total_questions BIGINT,
    rank BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        sp_points.student_id,
        p.full_name,
        p.avatar_url,
        sp_points.total_points::BIGINT,
        sp_points.total_questions::BIGINT,
        ROW_NUMBER() OVER (ORDER BY sp_points.total_points DESC)::BIGINT as rank
    FROM student_points sp_points
    JOIN student_profiles sp ON sp_points.student_id = sp.id
    JOIN profiles p ON sp.user_id = p.id
    WHERE sp_points.total_questions > 0
    ORDER BY sp_points.total_points DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Puan ekleme fonksiyonu (kolaylık için)
CREATE OR REPLACE FUNCTION add_point_history(
    p_student_id UUID,
    p_points INTEGER,
    p_source VARCHAR DEFAULT 'question',
    p_subject_code VARCHAR DEFAULT NULL,
    p_is_correct BOOLEAN DEFAULT true,
    p_question_id UUID DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    new_id UUID;
BEGIN
    INSERT INTO point_history (student_id, points, source, subject_code, is_correct, question_id)
    VALUES (p_student_id, p_points, p_source, p_subject_code, p_is_correct, p_question_id)
    RETURNING id INTO new_id;
    
    RETURN new_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_daily_leaderboard TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_weekly_leaderboard TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_monthly_leaderboard TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_alltime_leaderboard TO authenticated, anon;
GRANT EXECUTE ON FUNCTION add_point_history TO authenticated;

