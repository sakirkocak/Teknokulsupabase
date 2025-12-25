-- Tek soru sayfası için benzer sorular RPC fonksiyonu
-- Aynı konudan ve aynı zorluktan benzer sorular döndürür

CREATE OR REPLACE FUNCTION get_related_questions(
  p_question_id UUID,
  p_limit INT DEFAULT 5
)
RETURNS TABLE (
  id UUID,
  question_text TEXT,
  difficulty TEXT,
  topic_id UUID,
  main_topic TEXT,
  sub_topic TEXT
) AS $$
DECLARE
  v_topic_id UUID;
  v_difficulty TEXT;
  v_subject_id UUID;
  v_grade INT;
BEGIN
  -- Önce mevcut sorunun bilgilerini al
  SELECT q.topic_id, q.difficulty, t.subject_id, t.grade
  INTO v_topic_id, v_difficulty, v_subject_id, v_grade
  FROM questions q
  JOIN topics t ON t.id = q.topic_id
  WHERE q.id = p_question_id;
  
  -- Benzer soruları döndür (aynı soru hariç)
  RETURN QUERY
  SELECT 
    q.id,
    q.question_text,
    q.difficulty,
    q.topic_id,
    t.main_topic,
    t.sub_topic
  FROM questions q
  JOIN topics t ON t.id = q.topic_id
  WHERE q.id != p_question_id
    AND t.subject_id = v_subject_id
    AND t.grade = v_grade
  ORDER BY 
    -- Önce aynı topic'ten olanlar
    CASE WHEN q.topic_id = v_topic_id THEN 0 ELSE 1 END,
    -- Sonra aynı zorluktan olanlar
    CASE WHEN q.difficulty = v_difficulty THEN 0 ELSE 1 END,
    -- Rastgele sıralama
    RANDOM()
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE;

-- Tek soru detaylarını getir (topic bilgileriyle birlikte)
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
  created_at TIMESTAMPTZ
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
    q.created_at
  FROM questions q
  JOIN topics t ON t.id = q.topic_id
  JOIN subjects s ON s.id = t.subject_id
  WHERE q.id = p_question_id;
END;
$$ LANGUAGE plpgsql STABLE;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_related_questions(UUID, INT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_question_detail(UUID) TO anon, authenticated;

