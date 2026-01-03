-- Topic bazlı soru sayılarını döndüren RPC fonksiyonu
-- Typesense topics sync için kullanılır

CREATE OR REPLACE FUNCTION get_topic_question_counts()
RETURNS TABLE (
  topic_id UUID,
  question_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    q.topic_id,
    COUNT(q.id) AS question_count
  FROM questions q
  WHERE q.is_active = true
  GROUP BY q.topic_id;
END;
$$ LANGUAGE plpgsql STABLE;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_topic_question_counts() TO anon, authenticated;
