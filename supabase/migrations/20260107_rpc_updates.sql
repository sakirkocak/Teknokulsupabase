-- =====================================================
-- RPC FONKSİYONLARI GÜNCELLEMELERİ
-- solve_count ve user_answers entegrasyonu
-- =====================================================

-- =====================================================
-- 1. get_question_detail GÜNCELLEMESİ
-- solve_count eklendi
-- =====================================================

DROP FUNCTION IF EXISTS get_question_detail(UUID);

CREATE OR REPLACE FUNCTION get_question_detail(p_question_id UUID)
RETURNS TABLE (
    id UUID,
    question_text TEXT,
    question_image_url TEXT,
    options JSONB,
    correct_answer TEXT,
    explanation TEXT,
    difficulty TEXT,
    topic_id UUID,
    main_topic TEXT,
    sub_topic TEXT,
    subject_code TEXT,
    subject_name TEXT,
    grade INT,
    created_at TIMESTAMPTZ,
    solve_count INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        q.id,
        q.question_text,
        q.question_image_url,
        q.options,
        q.correct_answer,
        q.explanation,
        q.difficulty,
        q.topic_id,
        t.main_topic,
        t.sub_topic,
        s.code AS subject_code,
        s.name AS subject_name,
        t.grade,
        q.created_at,
        COALESCE(q.solve_count, 0)::INTEGER AS solve_count
    FROM questions q
    JOIN topics t ON t.id = q.topic_id
    JOIN subjects s ON s.id = t.subject_id
    WHERE q.id = p_question_id;
END;
$$ LANGUAGE plpgsql STABLE;

-- =====================================================
-- 2. ÖĞRENCİ ZAYIF KONU ANALİZİ
-- user_answers tablosundan son 30 günlük performans
-- =====================================================

CREATE OR REPLACE FUNCTION get_student_weak_topics(
    p_student_id UUID, 
    p_limit INT DEFAULT 5
)
RETURNS TABLE (
    topic_id UUID,
    main_topic TEXT,
    sub_topic TEXT,
    subject_name TEXT,
    subject_code TEXT,
    total_answers BIGINT,
    wrong_count BIGINT,
    accuracy NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.id AS topic_id,
        t.main_topic,
        t.sub_topic,
        s.name AS subject_name,
        s.code AS subject_code,
        COUNT(*) AS total_answers,
        COUNT(*) FILTER (WHERE NOT ua.is_correct) AS wrong_count,
        ROUND(100.0 * COUNT(*) FILTER (WHERE ua.is_correct) / NULLIF(COUNT(*), 0), 1) AS accuracy
    FROM user_answers ua
    JOIN questions q ON q.id = ua.question_id
    JOIN topics t ON t.id = q.topic_id
    JOIN subjects s ON s.id = t.subject_id
    WHERE ua.student_id = p_student_id
    AND ua.answered_at > NOW() - INTERVAL '30 days'
    GROUP BY t.id, t.main_topic, t.sub_topic, s.name, s.code
    HAVING COUNT(*) >= 5  -- En az 5 soru çözülmüş olmalı
    ORDER BY accuracy ASC  -- En düşük başarı oranı önce
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE;

-- =====================================================
-- 3. ÖĞRENCİ GÜÇLÜ KONU ANALİZİ
-- =====================================================

CREATE OR REPLACE FUNCTION get_student_strong_topics(
    p_student_id UUID, 
    p_limit INT DEFAULT 5
)
RETURNS TABLE (
    topic_id UUID,
    main_topic TEXT,
    sub_topic TEXT,
    subject_name TEXT,
    subject_code TEXT,
    total_answers BIGINT,
    correct_count BIGINT,
    accuracy NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.id AS topic_id,
        t.main_topic,
        t.sub_topic,
        s.name AS subject_name,
        s.code AS subject_code,
        COUNT(*) AS total_answers,
        COUNT(*) FILTER (WHERE ua.is_correct) AS correct_count,
        ROUND(100.0 * COUNT(*) FILTER (WHERE ua.is_correct) / NULLIF(COUNT(*), 0), 1) AS accuracy
    FROM user_answers ua
    JOIN questions q ON q.id = ua.question_id
    JOIN topics t ON t.id = q.topic_id
    JOIN subjects s ON s.id = t.subject_id
    WHERE ua.student_id = p_student_id
    AND ua.answered_at > NOW() - INTERVAL '30 days'
    GROUP BY t.id, t.main_topic, t.sub_topic, s.name, s.code
    HAVING COUNT(*) >= 5
    ORDER BY accuracy DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE;

-- =====================================================
-- 4. ÖĞRENCİ DERS BAZLI PERFORMANS
-- =====================================================

CREATE OR REPLACE FUNCTION get_student_subject_performance(
    p_student_id UUID
)
RETURNS TABLE (
    subject_code TEXT,
    subject_name TEXT,
    total_answers BIGINT,
    correct_count BIGINT,
    wrong_count BIGINT,
    accuracy NUMERIC,
    avg_time_seconds NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.code AS subject_code,
        s.name AS subject_name,
        COUNT(*) AS total_answers,
        COUNT(*) FILTER (WHERE ua.is_correct) AS correct_count,
        COUNT(*) FILTER (WHERE NOT ua.is_correct) AS wrong_count,
        ROUND(100.0 * COUNT(*) FILTER (WHERE ua.is_correct) / NULLIF(COUNT(*), 0), 1) AS accuracy,
        ROUND(AVG(ua.time_spent_seconds)::NUMERIC, 1) AS avg_time_seconds
    FROM user_answers ua
    JOIN questions q ON q.id = ua.question_id
    JOIN topics t ON t.id = q.topic_id
    JOIN subjects s ON s.id = t.subject_id
    WHERE ua.student_id = p_student_id
    AND ua.answered_at > NOW() - INTERVAL '30 days'
    GROUP BY s.code, s.name
    ORDER BY total_answers DESC;
END;
$$ LANGUAGE plpgsql STABLE;

-- =====================================================
-- 5. ÖĞRENCİ GÜNLÜK İSTATİSTİKLERİ
-- =====================================================

CREATE OR REPLACE FUNCTION get_student_daily_stats(
    p_student_id UUID,
    p_days INT DEFAULT 7
)
RETURNS TABLE (
    stat_date DATE,
    total_questions BIGINT,
    correct_count BIGINT,
    wrong_count BIGINT,
    accuracy NUMERIC,
    total_time_minutes NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        DATE(ua.answered_at) AS stat_date,
        COUNT(*) AS total_questions,
        COUNT(*) FILTER (WHERE ua.is_correct) AS correct_count,
        COUNT(*) FILTER (WHERE NOT ua.is_correct) AS wrong_count,
        ROUND(100.0 * COUNT(*) FILTER (WHERE ua.is_correct) / NULLIF(COUNT(*), 0), 1) AS accuracy,
        ROUND(SUM(COALESCE(ua.time_spent_seconds, 0))::NUMERIC / 60, 1) AS total_time_minutes
    FROM user_answers ua
    WHERE ua.student_id = p_student_id
    AND ua.answered_at > NOW() - (p_days || ' days')::INTERVAL
    GROUP BY DATE(ua.answered_at)
    ORDER BY stat_date DESC;
END;
$$ LANGUAGE plpgsql STABLE;

-- =====================================================
-- 6. EN ÇOK ÇÖZÜLEN SORULAR
-- =====================================================

CREATE OR REPLACE FUNCTION get_most_solved_questions(
    p_limit INT DEFAULT 20,
    p_subject_code TEXT DEFAULT NULL,
    p_grade INT DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    question_text TEXT,
    difficulty TEXT,
    subject_name TEXT,
    grade INT,
    solve_count INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        q.id,
        q.question_text,
        q.difficulty,
        s.name AS subject_name,
        t.grade,
        COALESCE(q.solve_count, 0) AS solve_count
    FROM questions q
    JOIN topics t ON t.id = q.topic_id
    JOIN subjects s ON s.id = t.subject_id
    WHERE (p_subject_code IS NULL OR s.code = p_subject_code)
    AND (p_grade IS NULL OR t.grade = p_grade)
    ORDER BY q.solve_count DESC NULLS LAST
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE;

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

GRANT EXECUTE ON FUNCTION get_question_detail(UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_student_weak_topics(UUID, INT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_student_strong_topics(UUID, INT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_student_subject_performance(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_student_daily_stats(UUID, INT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_most_solved_questions(INT, TEXT, INT) TO anon, authenticated;

