-- /sorular sayfaları için performans optimizasyonu RPC fonksiyonları

-- 1. Bir ders için tüm sınıf istatistiklerini tek sorguda döndürür
-- Kullanım: SELECT * FROM get_subject_grade_stats('fen_bilimleri')
CREATE OR REPLACE FUNCTION get_subject_grade_stats(p_subject_code TEXT)
RETURNS TABLE (
  grade INT,
  topic_count BIGINT,
  question_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.grade,
    COUNT(DISTINCT t.id) AS topic_count,
    COUNT(q.id) AS question_count
  FROM subjects s
  JOIN topics t ON t.subject_id = s.id
  LEFT JOIN questions q ON q.topic_id = t.id
  WHERE s.code = p_subject_code
  GROUP BY t.grade
  HAVING COUNT(q.id) > 0
  ORDER BY t.grade;
END;
$$ LANGUAGE plpgsql STABLE;

-- 2. Bir ders için toplam soru ve konu sayısını döndürür
-- Kullanım: SELECT * FROM get_subject_total_stats('matematik')
CREATE OR REPLACE FUNCTION get_subject_total_stats(p_subject_code TEXT)
RETURNS TABLE (
  total_questions BIGINT,
  total_topics BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(q.id) AS total_questions,
    COUNT(DISTINCT t.id) AS total_topics
  FROM subjects s
  JOIN topics t ON t.subject_id = s.id
  LEFT JOIN questions q ON q.topic_id = t.id
  WHERE s.code = p_subject_code;
END;
$$ LANGUAGE plpgsql STABLE;

-- 3. Bir sınıf için zorluk dağılımı ve soru istatistiklerini döndürür
-- Kullanım: SELECT * FROM get_grade_difficulty_stats('fen_bilimleri', 8)
CREATE OR REPLACE FUNCTION get_grade_difficulty_stats(p_subject_code TEXT, p_grade INT)
RETURNS TABLE (
  total_questions BIGINT,
  easy_count BIGINT,
  medium_count BIGINT,
  hard_count BIGINT,
  legendary_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(q.id) AS total_questions,
    COUNT(CASE WHEN q.difficulty = 'easy' THEN 1 END) AS easy_count,
    COUNT(CASE WHEN q.difficulty = 'medium' THEN 1 END) AS medium_count,
    COUNT(CASE WHEN q.difficulty = 'hard' THEN 1 END) AS hard_count,
    COUNT(CASE WHEN q.difficulty = 'legendary' THEN 1 END) AS legendary_count
  FROM subjects s
  JOIN topics t ON t.subject_id = s.id AND t.grade = p_grade
  JOIN questions q ON q.topic_id = t.id
  WHERE s.code = p_subject_code;
END;
$$ LANGUAGE plpgsql STABLE;

-- 4. Bir sınıf için ana konu gruplarını ve soru sayılarını döndürür
-- Kullanım: SELECT * FROM get_grade_topic_groups('matematik', 5)
CREATE OR REPLACE FUNCTION get_grade_topic_groups(p_subject_code TEXT, p_grade INT)
RETURNS TABLE (
  main_topic TEXT,
  sub_topics TEXT[],
  question_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.main_topic,
    ARRAY_AGG(DISTINCT t.sub_topic) FILTER (WHERE t.sub_topic IS NOT NULL) AS sub_topics,
    COUNT(q.id) AS question_count
  FROM subjects s
  JOIN topics t ON t.subject_id = s.id AND t.grade = p_grade
  LEFT JOIN questions q ON q.topic_id = t.id
  WHERE s.code = p_subject_code
  GROUP BY t.main_topic
  HAVING COUNT(q.id) > 0
  ORDER BY t.main_topic;
END;
$$ LANGUAGE plpgsql STABLE;

-- 5. Tüm dersler için genel istatistikleri döndürür (ana sayfa için)
-- Kullanım: SELECT * FROM get_all_subjects_stats()
CREATE OR REPLACE FUNCTION get_all_subjects_stats()
RETURNS TABLE (
  subject_code TEXT,
  subject_name TEXT,
  total_questions BIGINT,
  total_topics BIGINT,
  grade_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.code AS subject_code,
    s.name AS subject_name,
    COUNT(q.id) AS total_questions,
    COUNT(DISTINCT t.id) AS total_topics,
    COUNT(DISTINCT t.grade) AS grade_count
  FROM subjects s
  LEFT JOIN topics t ON t.subject_id = s.id
  LEFT JOIN questions q ON q.topic_id = t.id
  GROUP BY s.id, s.code, s.name
  HAVING COUNT(q.id) > 0
  ORDER BY s.name;
END;
$$ LANGUAGE plpgsql STABLE;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_subject_grade_stats(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_subject_total_stats(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_grade_difficulty_stats(TEXT, INT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_grade_topic_groups(TEXT, INT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_all_subjects_stats() TO anon, authenticated;

