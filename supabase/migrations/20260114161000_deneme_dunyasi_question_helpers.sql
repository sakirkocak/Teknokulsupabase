-- Deneme Dünyası - Soru Havuzu Yardımcı Fonksiyonları

-- Learning outcome için indeks (soru havuzunda hızlı filtre)
CREATE INDEX IF NOT EXISTS idx_topics_learning_outcome ON topics(learning_outcome);

-- Admin paneli için konu + kazanım + soru sayıları
CREATE OR REPLACE VIEW exam_topic_overview AS
SELECT
  t.id AS topic_id,
  t.subject_id,
  s.code AS subject_code,
  s.name AS subject_name,
  t.grade,
  t.main_topic,
  t.sub_topic,
  t.learning_outcome,
  COUNT(q.id) FILTER (WHERE q.is_active = true) AS question_count
FROM topics t
JOIN subjects s ON s.id = t.subject_id
LEFT JOIN questions q ON q.topic_id = t.id
GROUP BY t.id, s.code, s.name;

-- Deneme oluşturmak için filtreli soru havuzu
CREATE OR REPLACE FUNCTION get_exam_question_candidates(
  p_grade INT,
  p_subject_code TEXT,
  p_difficulty TEXT DEFAULT NULL,
  p_topic_id UUID DEFAULT NULL,
  p_limit INT DEFAULT 20,
  p_exclude_ids UUID[] DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  question_text TEXT,
  question_image_url TEXT,
  options JSONB,
  correct_answer TEXT,
  difficulty TEXT,
  topic_id UUID,
  main_topic TEXT,
  sub_topic TEXT,
  learning_outcome TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    q.id,
    q.question_text,
    q.question_image_url,
    q.options,
    q.correct_answer,
    q.difficulty,
    q.topic_id,
    t.main_topic,
    t.sub_topic,
    t.learning_outcome
  FROM questions q
  JOIN topics t ON t.id = q.topic_id
  JOIN subjects s ON s.id = t.subject_id
  WHERE q.is_active = true
    AND t.grade = p_grade
    AND s.code = p_subject_code
    AND (p_difficulty IS NULL OR q.difficulty = p_difficulty)
    AND (p_topic_id IS NULL OR q.topic_id = p_topic_id)
    AND (p_exclude_ids IS NULL OR q.id != ALL(p_exclude_ids))
  ORDER BY RANDOM()
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE;

-- Öğrenim kazanımına göre soru havuzu
CREATE OR REPLACE FUNCTION get_questions_by_learning_outcome(
  p_grade INT,
  p_subject_code TEXT,
  p_learning_outcome TEXT,
  p_limit INT DEFAULT 20
)
RETURNS TABLE (
  id UUID,
  question_text TEXT,
  difficulty TEXT,
  topic_id UUID,
  main_topic TEXT,
  sub_topic TEXT
) AS $$
BEGIN
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
  JOIN subjects s ON s.id = t.subject_id
  WHERE q.is_active = true
    AND t.grade = p_grade
    AND s.code = p_subject_code
    AND t.learning_outcome = p_learning_outcome
  ORDER BY RANDOM()
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE;

GRANT SELECT ON exam_topic_overview TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_exam_question_candidates(INT, TEXT, TEXT, UUID, INT, UUID[]) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_questions_by_learning_outcome(INT, TEXT, TEXT, INT) TO anon, authenticated;
