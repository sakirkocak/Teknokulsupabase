-- =====================================================
-- LİDERLİK TABLOSU ZAMAN DÜZELTMESİ
-- Günlük/Haftalık/Aylık liderlikler artık doğru zamanda sıfırlanacak
-- =====================================================

-- Günlük liderlik - Gece yarısından (00:00) itibaren
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
    WHERE ph.created_at >= DATE_TRUNC('day', NOW() AT TIME ZONE 'Europe/Istanbul') AT TIME ZONE 'Europe/Istanbul'
    GROUP BY ph.student_id, p.full_name, p.avatar_url
    HAVING COALESCE(SUM(ph.points), 0) > 0
    ORDER BY total_points DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Haftalık liderlik - Pazartesi 00:00'dan itibaren
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
    WHERE ph.created_at >= DATE_TRUNC('week', NOW() AT TIME ZONE 'Europe/Istanbul') AT TIME ZONE 'Europe/Istanbul'
    GROUP BY ph.student_id, p.full_name, p.avatar_url
    HAVING COALESCE(SUM(ph.points), 0) > 0
    ORDER BY total_points DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Aylık liderlik - Ayın 1'inden 00:00'dan itibaren
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
    WHERE ph.created_at >= DATE_TRUNC('month', NOW() AT TIME ZONE 'Europe/Istanbul') AT TIME ZONE 'Europe/Istanbul'
    GROUP BY ph.student_id, p.full_name, p.avatar_url
    HAVING COALESCE(SUM(ph.points), 0) > 0
    ORDER BY total_points DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Yetkileri ver
GRANT EXECUTE ON FUNCTION get_daily_leaderboard TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_weekly_leaderboard TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_monthly_leaderboard TO authenticated, anon;

